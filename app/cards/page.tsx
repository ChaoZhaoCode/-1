"use client";

import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, RotateCcw, Send } from "lucide-react";
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
import { SpeakButton, VoiceInputButton } from "@/components/speech-tools";

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

type CardSessionQuestion = {
  prompt: string;
  modelAnswer: string;
  source: "generated" | "imported";
};

type CardSession = {
  questionIndex: number;
  answer: string;
  showHint: boolean;
  evaluation: Evaluation | null;
  extraQuestions: CardSessionQuestion[];
  updatedAt: number;
};

type CardSessions = Record<string, CardSession>;

const CARD_SESSION_KEY = "forced-output-card-sessions-v1";

const chooseCard = (index: number) => {
  const normalizedIndex = ((index % trainingPatterns.length) + trainingPatterns.length) % trainingPatterns.length;
  return trainingPatterns[normalizedIndex];
};

const createEmptySession = (): CardSession => ({
  questionIndex: 0,
  answer: "",
  showHint: false,
  evaluation: null,
  extraQuestions: [],
  updatedAt: Date.now()
});

const isEvaluation = (value: unknown): value is Evaluation => {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<Evaluation>;
  return typeof record.mainIssue === "string" && typeof record.rewrite === "string";
};

const mergeCardSessions = (stored: unknown): CardSessions => {
  if (!stored || typeof stored !== "object") return {};

  const incoming = stored as Record<string, Partial<CardSession>>;
  return Object.fromEntries(
    Object.entries(incoming).map(([id, item]) => [
      id,
      {
        questionIndex: Number.isInteger(item.questionIndex) ? Math.max(0, Number(item.questionIndex)) : 0,
        answer: typeof item.answer === "string" ? item.answer : "",
        showHint: Boolean(item.showHint),
        evaluation: isEvaluation(item.evaluation) ? item.evaluation : null,
        extraQuestions: Array.isArray(item.extraQuestions)
          ? item.extraQuestions.filter(
              (question): question is CardSessionQuestion =>
                typeof question?.prompt === "string" && typeof question?.modelAnswer === "string"
            )
          : [],
        updatedAt: Number.isFinite(item.updatedAt) ? Number(item.updatedAt) : Date.now()
      }
    ])
  );
};

export default function CardsPage() {
  const [progress, setProgress] = useState<TrainingProgress>(() => mergeProgress(null));
  const [cardIndex, setCardIndex] = useState(0);
  const [cardSessions, setCardSessions] = useState<CardSessions>({});
  const [hasLoadedSessions, setHasLoadedSessions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);

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

  useEffect(() => {
    const stored = window.localStorage.getItem(CARD_SESSION_KEY);
    if (!stored) {
      setHasLoadedSessions(true);
      return;
    }
    try {
      setCardSessions(mergeCardSessions(JSON.parse(stored)));
    } catch {
      window.localStorage.removeItem(CARD_SESSION_KEY);
    } finally {
      setHasLoadedSessions(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedSessions) return;
    window.localStorage.setItem(CARD_SESSION_KEY, JSON.stringify(cardSessions));
  }, [cardSessions, hasLoadedSessions]);

  const activeCard = useMemo(() => chooseCard(cardIndex), [cardIndex]);
  const activeSession = cardSessions[activeCard.id] ?? createEmptySession();
  const baseQuestions = useMemo(() => getCardPrompts(activeCard), [activeCard]);
  const activeQuestions = useMemo(
    () => [...baseQuestions, ...activeSession.extraQuestions],
    [activeSession.extraQuestions, baseQuestions]
  );
  const questionIndex = Math.min(activeSession.questionIndex, Math.max(0, activeQuestions.length - 1));
  const answer = activeSession.answer;
  const showHint = activeSession.showHint;
  const evaluation = activeSession.evaluation;
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
  const questionLabel =
    questionIndex < baseQuestions.length
      ? `题目 ${questionIndex + 1}/${baseQuestions.length}`
      : `巩固题 ${questionIndex - baseQuestions.length + 1}`;
  const nextQuestionLabel =
    questionIndex < baseQuestions.length - 1
      ? "进入下一题"
      : questionIndex < baseQuestions.length
        ? "继续巩固一题"
        : "再来一题";
  const canMoveToNextCard = questionIndex + 1 >= baseQuestions.length;

  const updateActiveSession = (patch: Partial<CardSession>) => {
    setCardSessions((current) => ({
      ...current,
      [activeCard.id]: {
        ...createEmptySession(),
        ...current[activeCard.id],
        ...patch,
        updatedAt: Date.now()
      }
    }));
  };

  const markCardSeen = () => {
    setProgress((current) => {
      const item = current[activeCard.id];
      return {
        ...current,
        [activeCard.id]: {
          ...item,
          cardPasses: item.cardPasses === 0 ? 1 : item.cardPasses,
          status: item.status === "new" || item.status === "failed_in_scene" ? "seen" : item.status
        }
      };
    });
  };

  const submit = async () => {
    if (!answer.trim() || isLoading) return;
    setIsLoading(true);
    updateActiveSession({ evaluation: null });

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
      updateActiveSession({ evaluation: result });
      if (result.passed && questionIndex + 1 >= baseQuestions.length) {
        markCardSeen();
      }
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

  const generateReinforcementQuestion = async () => {
    setIsGeneratingQuestion(true);
    try {
      const response = await fetch("/api/card-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetPattern: activeCard,
          previousPrompts: activeQuestions.map((question) => question.prompt),
          round: questionIndex + 2
        })
      });
      if (!response.ok) return null;
      return (await response.json()) as CardSessionQuestion;
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const continueCurrentCard = async () => {
    if (questionIndex < activeQuestions.length - 1) {
      updateActiveSession({
        answer: "",
        evaluation: null,
        showHint: false,
        questionIndex: questionIndex + 1
      });
      return;
    }

    const question = await generateReinforcementQuestion();
    if (!question) return;

    setCardSessions((current) => {
      const session = {
        ...createEmptySession(),
        ...current[activeCard.id]
      };
      return {
        ...current,
        [activeCard.id]: {
          ...session,
          extraQuestions: [...session.extraQuestions, question],
          questionIndex: questionIndex + 1,
          answer: "",
          evaluation: null,
          showHint: false,
          updatedAt: Date.now()
        }
      };
    });
  };

  const nextCard = () => {
    setCardIndex((value) => value + 1);
  };

  const resetCurrent = () => {
    updateActiveSession({
      answer: "",
      evaluation: null,
      showHint: false
    });
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
              中文意图 · {questionLabel}
            </span>
            <div className="prompt-toolbar trailing">
              <SpeakButton text={`${activeCard.pattern}。${activeCard.structureHint}`} label="播放句式" />
            </div>
            <p>{activeQuestion.prompt}</p>
          </div>

          <button className="ghost-action" onClick={() => updateActiveSession({ showHint: !showHint })}>
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
              onChange={(event) => updateActiveSession({ answer: event.target.value })}
              placeholder="先不要看答案，直接把中文意图说成日语。"
            />
          </label>

          <div className="action-row">
            <button className="primary-action" disabled={!answer.trim() || isLoading} onClick={submit}>
              <Send size={18} />
              {isLoading ? "评估中" : "提交纠正"}
            </button>
            <VoiceInputButton onTranscript={(text) => updateActiveSession({ answer: `${answer}${answer ? " " : ""}${text}` })} />
            <button className="secondary-action" onClick={resetCurrent}>
              <RotateCcw size={18} />
              重写
            </button>
          </div>

          {evaluation ? (
            <FeedbackPanel
              evaluation={evaluation}
              activeCard={activeEvalPattern}
              nextLabel={nextQuestionLabel}
              onNext={continueCurrentCard}
              secondaryLabel={canMoveToNextCard ? "进入下一个句式" : undefined}
              onSecondary={canMoveToNextCard ? nextCard : undefined}
              isGeneratingQuestion={isGeneratingQuestion}
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
      <SpeakButton text={`${pattern.pattern}。${pattern.structureHint}`} label="播放" />
      <small>{groupLabels[pattern.group]}</small>
    </div>
  );
}

function FeedbackPanel({
  evaluation,
  activeCard,
  nextLabel,
  onNext,
  secondaryLabel,
  onSecondary,
  isGeneratingQuestion
}: {
  evaluation: Evaluation;
  activeCard: TrainingPattern;
  nextLabel: string;
  onNext: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  isGeneratingQuestion: boolean;
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
        <div className="rewrite-head">
          <SpeakButton text={evaluation.rewrite || activeCard.modelAnswer || ""} label="播放示范" />
        </div>
        <p>{evaluation.rewrite || activeCard.modelAnswer}</p>
      </div>
      <p className="feedback-copy">{evaluation.explanation}</p>
      <div className="hint-box slim">
        <b>可填结构</b>
        <p>{evaluation.fillInHint || activeCard.structureHint}</p>
      </div>

      {evaluation.passed ? (
        <div className="feedback-actions">
          <button className="primary-action" disabled={isGeneratingQuestion} onClick={onNext}>
            {isGeneratingQuestion ? <Loader2 size={18} /> : <CheckCircle2 size={18} />}
            {isGeneratingQuestion ? "出题中" : nextLabel}
          </button>
          {secondaryLabel && onSecondary ? (
            <button className="secondary-action" disabled={isGeneratingQuestion} onClick={onSecondary}>
              {secondaryLabel}
            </button>
          ) : null}
        </div>
      ) : (
        <p className="retry-copy">{evaluation.retryPrompt}</p>
      )}
    </div>
  );
}
