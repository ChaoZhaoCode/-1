"use client";

import { ArrowLeft, CheckCircle2, Eye, EyeOff, RotateCcw, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  TRAINING_PROGRESS_KEY,
  getCardPrompts,
  groupLabels,
  mergeProgress,
  statusLabels,
  trainingPatterns,
  type TrainingPattern,
  type TrainingProgress
} from "@/lib/training-system";

type Evaluation = {
  source: "deepseek" | "mock";
  passed: boolean;
  targetUsed: boolean;
  equivalentAccepted: boolean;
  naturalness: number;
  accuracy: number;
  mainIssue: string;
  rewrite: string;
  explanation: string;
  nextPrompt: string;
  retryPrompt: string;
  fillInHint: string;
};

const chooseCard = (index: number) => {
  const normalizedIndex = ((index % trainingPatterns.length) + trainingPatterns.length) % trainingPatterns.length;
  return trainingPatterns[normalizedIndex];
};

export default function CardsPage() {
  const [progress, setProgress] = useState<TrainingProgress>(() => mergeProgress(null));
  const [cardIndex, setCardIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(TRAINING_PROGRESS_KEY);
    if (!stored) return;
    try {
      setProgress(mergeProgress(JSON.parse(stored)));
    } catch {
      window.localStorage.removeItem(TRAINING_PROGRESS_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(TRAINING_PROGRESS_KEY, JSON.stringify(progress));
  }, [progress]);

  const activeCard = useMemo(() => chooseCard(cardIndex), [cardIndex]);
  const activeQuestions = useMemo(() => getCardPrompts(activeCard), [activeCard]);
  const activeQuestion = activeQuestions[questionIndex] ?? activeQuestions[0];
  const activeEvalPattern = useMemo(
    () => ({
      ...activeCard,
      cardPrompt: activeQuestion.prompt,
      modelAnswer: activeQuestion.modelAnswer
    }),
    [activeCard, activeQuestion]
  );
  const activeProgress = progress[activeCard.id];
  const counts = useMemo(() => {
    const values = Object.values(progress);
    return {
      new: values.filter((item) => item.status === "new").length,
      review: values.filter((item) => item.status === "failed_in_scene").length,
      scene: values.filter((item) => item.status === "used_in_scene").length,
      mastered: values.filter((item) => item.status === "mastered").length
    };
  }, [progress]);

  const submit = async () => {
    if (!answer.trim() || isLoading) return;
    setIsLoading(true);
    setEvaluation(null);

    try {
      const response = await fetch("/api/evaluate-output", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "card",
          userAnswer: answer.trim(),
          targetPattern: activeEvalPattern,
          prompt: activeQuestion.prompt,
          attempt: activeProgress.failures + 1
        })
      });
      const result = (await response.json()) as Evaluation;
      setEvaluation(result);
      if (!result.passed) {
        setProgress((current) => ({
          ...current,
          [activeCard.id]: {
            ...current[activeCard.id],
            failures: current[activeCard.id].failures + 1
          }
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const nextCard = () => {
    if (questionIndex < activeQuestions.length - 1) {
      setAnswer("");
      setEvaluation(null);
      setShowHint(false);
      setQuestionIndex((value) => value + 1);
      return;
    }

    setProgress((current) => {
      const item = current[activeCard.id];
      const nextPasses = item.cardPasses + 1;
      return {
        ...current,
        [activeCard.id]: {
          ...item,
          cardPasses: nextPasses,
          status: item.status === "new" || item.status === "failed_in_scene" ? "seen" : item.status
        }
      };
    });
    setAnswer("");
    setEvaluation(null);
    setShowHint(false);
    setQuestionIndex(0);
    setCardIndex((value) => value + 1);
  };

  const resetCurrent = () => {
    setAnswer("");
    setEvaluation(null);
    setShowHint(false);
  };

  return (
    <main className="drill-shell">
      <header className="drill-topbar">
        <div>
          <Link className="back-link" href="/">
            <ArrowLeft size={16} />
            首页
          </Link>
          <p className="eyebrow">第一阶段：翻译式输出</p>
          <h1>句式记忆卡片</h1>
        </div>
        <div className="stat-strip">
          <span>未练 {counts.new}</span>
          <span>回炉 {counts.review}</span>
          <span>场景用过 {counts.scene}</span>
          <span>掌握 {counts.mastered}</span>
        </div>
      </header>

      <section className="card-drill-layout">
        <aside className="drill-panel compact-panel">
          <h2>当前卡片</h2>
          <PatternSummary pattern={activeCard} status={activeProgress.status} />
          <div className="mini-progress-list">
            {trainingPatterns.slice(0, 20).map((pattern) => (
              <button
                key={pattern.id}
                className={pattern.id === activeCard.id ? "mini-pattern active" : "mini-pattern"}
                onClick={() => {
                  setCardIndex(trainingPatterns.findIndex((item) => item.id === pattern.id));
                  setQuestionIndex(0);
                  setAnswer("");
                  setEvaluation(null);
                  setShowHint(false);
                }}
              >
                <span>{pattern.pattern}</span>
                <small>{statusLabels[progress[pattern.id].status]}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="drill-panel main-drill-panel">
          <div className="prompt-card">
            <span className="small-label">
              中文意图 · 题目 {questionIndex + 1}/{activeQuestions.length}
            </span>
            <p>{activeQuestion.prompt}</p>
          </div>

          <button className="ghost-action" onClick={() => setShowHint((value) => !value)}>
            {showHint ? <EyeOff size={16} /> : <Eye size={16} />}
            {showHint ? "收起结构" : "显示句式结构"}
          </button>

          {showHint ? (
            <div className="hint-box">
              <b>{activeCard.pattern}</b>
              <p>{activeCard.structureHint}</p>
            </div>
          ) : null}

          <label className="answer-box">
            <span>你的日语</span>
            <textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="先不要看答案，直接把中文意图说成日语。"
            />
          </label>

          <div className="action-row">
            <button className="primary-action" disabled={!answer.trim() || isLoading} onClick={submit}>
              <Send size={18} />
              {isLoading ? "评估中" : "提交纠正"}
            </button>
            <button className="secondary-action" onClick={resetCurrent}>
              <RotateCcw size={18} />
              重写
            </button>
          </div>

          {evaluation ? (
            <FeedbackPanel
              evaluation={evaluation}
              activeCard={activeEvalPattern}
              nextLabel={questionIndex < activeQuestions.length - 1 ? "进入下一题" : "进入下一个句式"}
              onNext={nextCard}
            />
          ) : (
            <div className="quiet-note">先输出，再看结构。卡片通过后会进入场景池。</div>
          )}
        </section>
      </section>
    </main>
  );
}

function PatternSummary({ pattern, status }: { pattern: TrainingPattern; status: keyof typeof statusLabels }) {
  return (
    <div className="pattern-summary">
      <span className="status-pill">{statusLabels[status]}</span>
      <h3>{pattern.pattern}</h3>
      <p>{pattern.meaning}</p>
      <small>{groupLabels[pattern.group]}</small>
    </div>
  );
}

function FeedbackPanel({
  evaluation,
  activeCard,
  nextLabel,
  onNext
}: {
  evaluation: Evaluation;
  activeCard: TrainingPattern;
  nextLabel: string;
  onNext: () => void;
}) {
  return (
    <div className={evaluation.passed ? "feedback-box pass" : "feedback-box fail"}>
      <div className="feedback-head">
        <div>
          <span>{evaluation.passed ? "通过" : "重说"}</span>
          <b>{evaluation.mainIssue}</b>
        </div>
        <div className="score-pair">
          <span>自然 {evaluation.naturalness}/10</span>
          <span>准确 {evaluation.accuracy}/10</span>
        </div>
      </div>

      <div className="rewrite-box">
        <span>示范</span>
        <p>{evaluation.rewrite || activeCard.modelAnswer}</p>
      </div>
      <p className="feedback-copy">{evaluation.explanation}</p>
      <div className="hint-box slim">
        <b>可填结构</b>
        <p>{evaluation.fillInHint || activeCard.structureHint}</p>
      </div>

      {evaluation.passed ? (
        <button className="primary-action" onClick={onNext}>
          <CheckCircle2 size={18} />
          {nextLabel}
        </button>
      ) : (
        <p className="retry-copy">{evaluation.retryPrompt}</p>
      )}
    </div>
  );
}
