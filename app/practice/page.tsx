"use client";

import { ArrowLeft, BookOpen, CheckCircle2, Send, Shuffle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  TRAINING_PROGRESS_KEY,
  groupLabels,
  mergeProgress,
  trainingPatterns,
  trainingScenes,
  type SceneId,
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

type CoachMode = "practice" | "retry" | "conversation";

type DialogueMessage =
  | { id: string; role: "ai"; text: string }
  | { id: string; role: "user"; text: string }
  | { id: string; role: "coach"; evaluation: Evaluation; pattern: string; mode: CoachMode };

const PRACTICE_SESSION_KEY = "forced-output-practice-session-v1";

type PracticeSession = {
  sceneId: SceneId;
  stage: Stage;
  patternOffset: number;
  messages: DialogueMessage[];
  attempt: number;
  conversationTurn: number;
};

const stageLabels = {
  translate: "翻译式",
  intent: "意图式",
  free: "自由式"
} as const;

type Stage = keyof typeof stageLabels;

const isStage = (value: unknown): value is Stage =>
  typeof value === "string" && Object.prototype.hasOwnProperty.call(stageLabels, value);

const isSceneId = (value: unknown): value is SceneId =>
  typeof value === "string" && trainingScenes.some((scene) => scene.id === value);

const isCoachMode = (value: unknown): value is CoachMode =>
  value === "practice" || value === "retry" || value === "conversation";

const defaultMessagesForScene = (sceneId: SceneId): DialogueMessage[] => {
  const scene = trainingScenes.find((item) => item.id === sceneId) ?? trainingScenes[0];
  return [{ id: `ai-${scene.id}-0`, role: "ai", text: scene.opening }];
};

const normalizeStoredMessages = (value: unknown, sceneId: SceneId): DialogueMessage[] => {
  if (!Array.isArray(value)) return defaultMessagesForScene(sceneId);

  const messages = value.flatMap((message): DialogueMessage[] => {
    if (!message || typeof message !== "object") return [];
    const item = message as Partial<DialogueMessage>;
    if (typeof item.id !== "string") return [];

    if ((item.role === "ai" || item.role === "user") && typeof item.text === "string") {
      return [{ id: item.id, role: item.role, text: item.text }];
    }

    if (
      item.role === "coach" &&
      item.evaluation &&
      typeof item.evaluation === "object" &&
      typeof item.pattern === "string"
    ) {
      return [
        {
          id: item.id,
          role: "coach",
          evaluation: item.evaluation as Evaluation,
          pattern: item.pattern,
          mode: isCoachMode(item.mode) ? item.mode : "practice"
        }
      ];
    }

    return [];
  });

  return messages.length > 0 ? messages : defaultMessagesForScene(sceneId);
};

const normalizePracticeSession = (value: unknown): PracticeSession | null => {
  if (!value || typeof value !== "object") return null;
  const session = value as Partial<PracticeSession>;
  const sceneId = isSceneId(session.sceneId) ? session.sceneId : "commerce";
  return {
    sceneId,
    stage: isStage(session.stage) ? session.stage : "translate",
    patternOffset: Number.isInteger(session.patternOffset) ? Math.max(0, session.patternOffset ?? 0) : 0,
    messages: normalizeStoredMessages(session.messages, sceneId),
    attempt: Number.isInteger(session.attempt) ? Math.max(1, session.attempt ?? 1) : 1,
    conversationTurn: Number.isInteger(session.conversationTurn) ? Math.max(0, session.conversationTurn ?? 0) : 0
  };
};

const pickTargetPattern = (progress: TrainingProgress, sceneId: SceneId, offset: number) => {
  const scene = trainingScenes.find((item) => item.id === sceneId);
  const preferredIds = scene?.suggestedPatternIds ?? [];
  const preferred = trainingPatterns.filter((pattern) => preferredIds.includes(pattern.id));
  const candidates = preferred.length > 0 ? preferred : trainingPatterns.filter((pattern) => pattern.sceneFit.includes(sceneId));
  const priority = { failed_in_scene: 0, seen: 1, new: 2, used_in_scene: 3, mastered: 4 };
  const sorted = [...candidates].sort((a, b) => {
    const statusDiff = priority[progress[a.id].status] - priority[progress[b.id].status];
    if (statusDiff !== 0) return statusDiff;
    const orderDiff = preferredIds.indexOf(a.id) - preferredIds.indexOf(b.id);
    if (orderDiff !== 0) return orderDiff;
    return progress[a.id].scenePasses - progress[b.id].scenePasses;
  });
  return sorted[offset % sorted.length] ?? trainingPatterns[0];
};

const getStagePrompt = (stage: Stage, scene: (typeof trainingScenes)[number]) => {
  if (stage === "translate") return scene.stageOnePrompt;
  if (stage === "intent") return scene.stageTwoIntent;
  return scene.stageThreePrompt;
};

export default function PracticePage() {
  const [progress, setProgress] = useState<TrainingProgress>(() => mergeProgress(null));
  const [sceneId, setSceneId] = useState<SceneId>("commerce");
  const [stage, setStage] = useState<Stage>("translate");
  const [patternOffset, setPatternOffset] = useState(0);
  const [messages, setMessages] = useState<DialogueMessage[]>([
    { id: "ai-commerce-0", role: "ai", text: trainingScenes[0].opening }
  ]);
  const [answer, setAnswer] = useState("");
  const [attempt, setAttempt] = useState(1);
  const [conversationTurn, setConversationTurn] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedSession, setHasLoadedSession] = useState(false);

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
    const stored = window.localStorage.getItem(PRACTICE_SESSION_KEY);
    if (!stored) {
      setHasLoadedSession(true);
      return;
    }

    try {
      const session = normalizePracticeSession(JSON.parse(stored));
      if (session) {
        setSceneId(session.sceneId);
        setStage(session.stage);
        setPatternOffset(session.patternOffset);
        setMessages(session.messages);
        setAttempt(session.attempt);
        setConversationTurn(session.conversationTurn);
      }
    } catch {
      window.localStorage.removeItem(PRACTICE_SESSION_KEY);
    } finally {
      setHasLoadedSession(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedSession) return;
    const session: PracticeSession = {
      sceneId,
      stage,
      patternOffset,
      messages,
      attempt,
      conversationTurn
    };
    window.localStorage.setItem(PRACTICE_SESSION_KEY, JSON.stringify(session));
  }, [attempt, conversationTurn, hasLoadedSession, messages, patternOffset, sceneId, stage]);

  const scene = useMemo(() => trainingScenes.find((item) => item.id === sceneId) ?? trainingScenes[0], [sceneId]);
  const targetPattern = useMemo(() => pickTargetPattern(progress, sceneId, patternOffset), [progress, sceneId, patternOffset]);
  const lastAiLine = [...messages].reverse().find((message) => message.role === "ai")?.text ?? scene.opening;
  const currentPrompt =
    conversationTurn === 0
      ? getStagePrompt(stage, scene)
      : `直接回复 AI 最新一句，让对话继续。可以自然追加一个请求、理由、条件或反问。当前 AI：${lastAiLine}`;

  const switchScene = (nextSceneId: SceneId) => {
    const nextScene = trainingScenes.find((item) => item.id === nextSceneId) ?? trainingScenes[0];
    setSceneId(nextSceneId);
    setPatternOffset(0);
    setAttempt(1);
    setConversationTurn(0);
    setAnswer("");
    setMessages([{ id: `ai-${nextScene.id}-${Date.now()}`, role: "ai", text: nextScene.opening }]);
  };

  const submit = async () => {
    if (!answer.trim() || isLoading) return;
    const userAnswer = answer.trim();
    const nextMessagesForEvaluation: DialogueMessage[] = [
      ...messages,
      { id: `user-${Date.now()}`, role: "user", text: userAnswer }
    ];
    const evaluationMode: CoachMode = conversationTurn > 0 ? "conversation" : attempt > 1 ? "retry" : "practice";
    setIsLoading(true);
    setAnswer("");
    setMessages(nextMessagesForEvaluation);

    try {
      const response = await fetch("/api/evaluate-output", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: evaluationMode,
          userAnswer,
          targetPattern,
          prompt: currentPrompt,
          scene: {
            title: scene.title,
            description: scene.description,
            aiLine: lastAiLine
          },
          conversationHistory: nextMessagesForEvaluation.slice(-10).map((message) => {
            if (message.role === "coach") {
              return { role: "coach", text: message.evaluation.rewrite };
            }
            return { role: message.role, text: message.text };
          }),
          attempt
        })
      });
      const result = (await response.json()) as Evaluation;

      setMessages((current) => [
        ...current,
        {
          id: `coach-${Date.now()}`,
          role: "coach",
          evaluation: result,
          pattern: targetPattern.pattern,
          mode: evaluationMode
        }
      ]);

      if (result.passed) {
        if (evaluationMode !== "conversation" || result.targetUsed) {
          setProgress((current) => {
            const item = current[targetPattern.id];
            const nextScenePasses = item.scenePasses + 1;
            return {
              ...current,
              [targetPattern.id]: {
                ...item,
                scenePasses: nextScenePasses,
                status: nextScenePasses >= 3 ? "mastered" : "used_in_scene"
              }
            };
          });
        }
        setMessages((current) => [
          ...current,
          {
            id: `ai-${Date.now()}`,
            role: "ai",
            text: result.nextPrompt || scene.opening
          }
        ]);
        setAttempt(1);
        setConversationTurn((value) => value + 1);
        setPatternOffset((value) => value + 1);
      } else {
        if (evaluationMode !== "conversation") {
          setProgress((current) => ({
            ...current,
            [targetPattern.id]: {
              ...current[targetPattern.id],
              status: "failed_in_scene",
              failures: current[targetPattern.id].failures + 1
            }
          }));
        }
        setAttempt((value) => value + 1);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    window.localStorage.removeItem(PRACTICE_SESSION_KEY);
    setMessages([{ id: `ai-${scene.id}-${Date.now()}`, role: "ai", text: scene.opening }]);
    setAnswer("");
    setAttempt(1);
    setConversationTurn(0);
    setPatternOffset(0);
  };

  return (
    <main className="drill-shell">
      <header className="drill-topbar">
        <div>
          <Link className="back-link" href="/">
            <ArrowLeft size={16} />
            首页
          </Link>
          <p className="eyebrow">第二步：场景强制输出</p>
          <h1>一轮只逼一个句式</h1>
        </div>
        <div className="stat-strip">
          <Link href="/cards">卡片回炉</Link>
          <Link href="/materials">资料库</Link>
        </div>
      </header>

      <section className="practice-layout">
        <aside className="drill-panel compact-panel">
          <h2>场景</h2>
          <div className="scene-list">
            {trainingScenes.map((item) => (
              <button
                key={item.id}
                className={item.id === scene.id ? "scene-option active" : "scene-option"}
                onClick={() => switchScene(item.id)}
              >
                <b>{item.title}</b>
                <span>{item.description}</span>
              </button>
            ))}
          </div>

          <div className="stage-switcher">
            {(Object.keys(stageLabels) as Stage[]).map((key) => (
              <button key={key} className={stage === key ? "active" : ""} onClick={() => setStage(key)}>
                {stageLabels[key]}
              </button>
            ))}
          </div>

          <button className="secondary-action full" onClick={() => setPatternOffset((value) => value + 1)}>
            <Shuffle size={17} />
            换一个目标句式
          </button>
        </aside>

        <section className="conversation-workspace">
          <div className="scene-header">
            <div>
              <span className="small-label">{conversationTurn === 0 ? "当前任务" : "连续对话"}</span>
              <p>{currentPrompt}</p>
            </div>
            {conversationTurn === 0 ? (
              <TargetPatternCard pattern={targetPattern} isRequired />
            ) : (
              <ConversationModeCard turn={conversationTurn} />
            )}
          </div>

          <div className="message-thread">
            {messages.map((message) => {
              if (message.role === "coach") {
                return (
                  <CoachMessage
                    key={message.id}
                    evaluation={message.evaluation}
                    pattern={message.pattern}
                    mode={message.mode}
                  />
                );
              }
              return (
                <div key={message.id} className={message.role === "ai" ? "dialogue-row ai" : "dialogue-row user"}>
                  <div className="avatar">{message.role === "ai" ? "AI" : "你"}</div>
                  <p>{message.text}</p>
                </div>
              );
            })}
          </div>

          <div className="practice-composer">
            <label>
              <span>你的回复</span>
              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="直接用日语回复当前这句。先完成意思，再强制放入本轮句式。"
              />
            </label>
            <div className="action-row">
              <button className="primary-action" disabled={!answer.trim() || isLoading} onClick={submit}>
                <Send size={18} />
                {isLoading ? "评估中" : "发送回复"}
              </button>
              <button className="secondary-action" onClick={clearConversation}>
                <Trash2 size={18} />
                清空记录
              </button>
              <Link className="secondary-action link-action" href="/cards">
                <BookOpen size={18} />
                回卡片练
              </Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function TargetPatternCard({ pattern, isRequired }: { pattern: TrainingPattern; isRequired: boolean }) {
  return (
    <div className="target-card">
      <span>{isRequired ? "本轮必须尝试" : "可尝试升级"}</span>
      <b>{pattern.pattern}</b>
      <p>{pattern.meaning}</p>
      <small>{groupLabels[pattern.group]}</small>
    </div>
  );
}

function ConversationModeCard({ turn }: { turn: number }) {
  return (
    <div className="target-card conversation-card">
      <span>连续对话</span>
      <b>第 {turn + 1} 轮</b>
      <p>直接接住 AI 的上一句。先让对话自然往前走，再把表达说完整。</p>
      <small>不强制卡片句式</small>
    </div>
  );
}

function CoachMessage({
  evaluation,
  pattern,
  mode
}: {
  evaluation: Evaluation;
  pattern: string;
  mode: CoachMode;
}) {
  const isConversation = mode === "conversation";
  return (
    <div className={evaluation.passed ? "coach-block pass" : "coach-block fail"}>
      <div className="coach-status">
        <span>{evaluation.passed ? "通过" : "不推进，重说"}</span>
        <small>
          自然 {evaluation.naturalness}/10 · 准确 {evaluation.accuracy}/10 · {isConversation ? "连续对话" : pattern}
        </small>
      </div>
      <b>{evaluation.mainIssue}</b>
      <div className="rewrite-box">
        <span>示范</span>
        <p>{evaluation.rewrite}</p>
      </div>
      <p>{evaluation.explanation}</p>
      {!evaluation.passed && isConversation ? (
        <div className="hint-box slim">
          <b>{evaluation.retryPrompt}</b>
          <p>先回应 AI 最新一句，把你的意思说完整；这一轮不需要强行套用卡片句式。</p>
        </div>
      ) : !evaluation.passed ? (
        <div className="hint-box slim">
          <b>{evaluation.retryPrompt}</b>
          <p>{evaluation.fillInHint}</p>
        </div>
      ) : (
        <div className="next-marker">
          <CheckCircle2 size={16} />
          已进入下一轮，AI 会主动延伸话题。
        </div>
      )}
    </div>
  );
}
