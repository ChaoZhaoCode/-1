"use client";

import { ArrowLeft, BookOpen, Check, ChevronRight, Eye, EyeOff, Lightbulb, Loader2, Send, Sparkles, Undo2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AutoSpeak, SpeakButton, VoiceInputButton } from "@/components/speech-tools";
import { getCourseDay, getPatternLabel, getStoryBeat, restaurantDays } from "@/lib/course-v2";
import {
  createLearningState,
  createLessonSession,
  getSessionKey,
  loadLearningState,
  localDateKey,
  recordPatternAttempt,
  saveLearningState,
  type CourseMessage,
  type LearnerMemory,
  type LearningState,
  type LessonSession
} from "@/lib/learning-state";

type CourseTurnResult = {
  source: "deepseek" | "fallback";
  communicationSucceeded: boolean;
  targetPatternUsed: boolean;
  needsImmediateRetry: boolean;
  mainIssue: string;
  rewrite: string;
  explanation: string;
  nextLine: string;
  usedPatternIds: number[];
  expressionDimensions: string[];
  newMemories: Array<{ category: LearnerMemory["category"]; text: string }>;
};

const phaseLabels = {
  review: "复习",
  patterns: "新句式",
  scene: "场景对话",
  summary: "表达总结",
  complete: "已完成"
};

const makeMessage = (role: CourseMessage["role"], text: string, extra: Partial<CourseMessage> = {}): CourseMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  role,
  text,
  ...extra
});

const findExercise = (patternId: number) => {
  for (const day of restaurantDays) {
    const exercise = day.translationPrompts[patternId];
    if (exercise) return exercise;
  }
  return {
    prompt: `请用「${getPatternLabel(patternId)}」说一句与你生活有关的日语。`,
    answer: `「${getPatternLabel(patternId)}」を使って、自分のことを話してください。`,
    hint: getPatternLabel(patternId)
  };
};

const getPreviousDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return localDateKey(date);
};

export default function PracticePage() {
  const [state, setState] = useState<LearningState>(() => createLearningState());
  const [dayNumber, setDayNumber] = useState(1);
  const [sessionKey, setSessionKey] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [memoryNotice, setMemoryNotice] = useState<LearnerMemory | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadedState = loadLearningState();
    const requested = Number(new URLSearchParams(window.location.search).get("day"));
    const selectedDay = Number.isInteger(requested) && requested >= 1 && requested <= 4
      ? requested
      : Math.min(loadedState.currentDay, 4);
    const forceFresh = new URLSearchParams(window.location.search).get("fresh") === "1";
    const existing = forceFresh ? undefined : Object.entries(loadedState.sessions)
      .filter(([, item]) => item.day === selectedDay)
      .sort((a, b) => (b[1].updatedAt ?? b[1].date).localeCompare(a[1].updatedAt ?? a[1].date))
      .find(([, item]) => item.phase !== "complete")
      ?? Object.entries(loadedState.sessions).find(([, item]) => item.day === selectedDay && item.phase === "complete");
    const key = existing?.[0] ?? `${getSessionKey(selectedDay)}${forceFresh ? `:fresh-${Date.now()}` : ""}`;
    if (!existing) loadedState.sessions[key] = createLessonSession(loadedState, selectedDay, getCourseDay(selectedDay).patternIds);
    setState(loadedState);
    setDayNumber(selectedDay);
    setSessionKey(key);
    saveLearningState(loadedState);
    setLoaded(true);
  }, []);

  const lesson = getCourseDay(dayNumber);
  const session = state.sessions[sessionKey] ?? createLessonSession(state, dayNumber);
  const activePatternId = session.phase === "review"
    ? session.reviewPatternIds[session.reviewIndex]
    : lesson.patternIds[session.patternIndex];
  const exercise = activePatternId ? findExercise(activePatternId) : null;
  const latestAiText = useMemo(
    () => [...session.messages].reverse().find((message) => message.role === "ai")?.text ?? "",
    [session.messages]
  );

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isLoading, session.messages.length]);

  const persist = (next: LearningState) => {
    setState(next);
    saveLearningState(next);
  };

  const withSession = (base: LearningState, nextSession: LessonSession) => ({
    ...base,
    sessions: { ...base.sessions, [sessionKey]: { ...nextSession, updatedAt: new Date().toISOString() } }
  });

  const revealNextHint = () => {
    const nextSession = { ...session, hintLevel: Math.min(3, session.hintLevel + 1) };
    persist(withSession(state, nextSession));
  };

  const hideHint = () => persist(withSession(state, { ...session, hintLevel: 0 }));

  const enterScene = (base: LearningState, current: LessonSession) => {
    const nextSession: LessonSession = {
      ...current,
      phase: "scene",
      attempt: 1,
      hintLevel: 0,
      messages: [
        ...current.messages,
        makeMessage("system", `场景开始 · ${lesson.role}`),
        makeMessage("ai", lesson.opening)
      ]
    };
    return withSession(base, nextSession);
  };

  const submitExercise = async () => {
    if (!answer.trim() || !exercise || !activePatternId || isLoading) return;
    const userAnswer = answer.trim();
    const userMessage = makeMessage("user", userAnswer);
    const waitingSession = { ...session, messages: [...session.messages, userMessage] };
    const waitingState = withSession(state, waitingSession);
    persist(waitingState);
    setAnswer("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/course-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "translation",
          answer: userAnswer,
          targetPattern: { id: activePatternId, pattern: getPatternLabel(activePatternId), modelAnswer: exercise.answer, hint: exercise.hint },
          lesson: { day: lesson.day, title: lesson.title, role: lesson.role, goal: lesson.goal, event: lesson.events.transaction },
          turn: 0,
          storyBeat: "transaction",
          recentMessages: [],
          availablePatterns: lesson.patternIds.map((id) => ({ id, pattern: getPatternLabel(id) })),
          memories: state.memories
        })
      });
      if (!response.ok) throw new Error("course feedback unavailable");
      const result = await response.json() as CourseTurnResult;
      const success = result.communicationSucceeded && result.targetPatternUsed;
      let nextState = recordPatternAttempt(waitingState, activePatternId, {
        success,
        inScene: false,
        hintLevel: session.hintLevel
      });
      const coach = makeMessage("coach", success ? "表达成立，目标句式也用上了。" : result.mainIssue, {
        detail: result.explanation,
        rewrite: result.rewrite || exercise.answer
      });
      let nextSession: LessonSession = { ...waitingSession, messages: [...waitingSession.messages, coach] };

      if (success) {
        if (session.phase === "review") {
          const nextIndex = session.reviewIndex + 1;
          nextSession = {
            ...nextSession,
            phase: nextIndex >= session.reviewPatternIds.length ? "patterns" : "review",
            reviewIndex: nextIndex,
            attempt: 1,
            hintLevel: 0
          };
        } else {
          const nextIndex = session.patternIndex + 1;
          nextSession = { ...nextSession, patternIndex: nextIndex, attempt: 1, hintLevel: 0 };
          if (nextIndex >= lesson.patternIds.length) {
            nextState = enterScene(nextState, nextSession);
            persist(nextState);
            return;
          }
        }
      } else {
        nextSession = {
          ...nextSession,
          attempt: session.attempt + 1,
          hintLevel: Math.min(3, Math.max(session.hintLevel, session.attempt))
        };
      }
      persist(withSession(nextState, nextSession));
    } catch {
      const failedSession = {
        ...waitingSession,
        messages: [...waitingSession.messages, makeMessage("coach", "暂时无法取得反馈，你的回答已经保留，请再提交一次。")]
      };
      persist(withSession(waitingState, failedSession));
      setAnswer(userAnswer);
    } finally {
      setIsLoading(false);
    }
  };

  const addMemories = (base: LearningState, incoming: CourseTurnResult["newMemories"]) => {
    let latest: LearnerMemory | null = null;
    const memories = [...base.memories];
    for (const item of incoming) {
      if (memories.some((memory) => memory.text.trim().toLowerCase() === item.text.trim().toLowerCase())) continue;
      latest = { id: `memory-${Date.now()}-${memories.length}`, category: item.category, text: item.text, createdAt: new Date().toISOString() };
      memories.push(latest);
    }
    if (latest) setMemoryNotice(latest);
    return { ...base, memories };
  };

  const submitConversation = async () => {
    if (!answer.trim() || isLoading) return;
    const userAnswer = answer.trim();
    const userMessage = makeMessage("user", userAnswer);
    const waitingSession = { ...session, messages: [...session.messages, userMessage] };
    const waitingState = withSession(state, waitingSession);
    persist(waitingState);
    setAnswer("");
    setIsLoading(true);

    const beat = getStoryBeat(session.turn);
    try {
      const response = await fetch("/api/course-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "conversation",
          answer: userAnswer,
          lesson: { day: lesson.day, title: lesson.title, role: lesson.role, goal: lesson.goal, event: lesson.events[beat] },
          turn: session.turn,
          storyBeat: beat,
          recentMessages: waitingSession.messages.slice(-12).filter((message) => message.role === "ai" || message.role === "user").map(({ role, text }) => ({ role, text })),
          availablePatterns: lesson.patternIds.map((id) => ({ id, pattern: getPatternLabel(id) })),
          memories: state.memories.slice(-12).map(({ category, text }) => ({ category, text }))
        })
      });
      if (!response.ok) throw new Error("course conversation unavailable");
      const result = await response.json() as CourseTurnResult;
      let nextState = addMemories(waitingState, result.newMemories);
      for (const patternId of result.usedPatternIds) {
        nextState = recordPatternAttempt(nextState, patternId, { success: true, inScene: true, hintLevel: 0 });
      }

      const dimensions = Array.from(new Set([...session.expressionDimensions, ...result.expressionDimensions]));
      const usedPatternIds = Array.from(new Set([...session.usedPatternIds, ...result.usedPatternIds]));
      const coachNotes = result.mainIssue && !/意思清楚|可以继续|自然/.test(result.mainIssue)
        ? [...session.coachNotes, result.mainIssue]
        : session.coachNotes;

      let nextMessages = [...waitingSession.messages];
      if (result.needsImmediateRetry) {
        nextMessages.push(makeMessage("coach", result.mainIssue, { detail: result.explanation, rewrite: result.rewrite }));
      } else {
        nextMessages.push(makeMessage("ai", result.nextLine));
      }

      const nextTurn = result.needsImmediateRetry ? session.turn : session.turn + 1;
      const readyForSummary = !result.needsImmediateRetry && ((nextTurn >= 8 && dimensions.length >= 3) || nextTurn >= 12);
      const nextSession: LessonSession = {
        ...waitingSession,
        phase: readyForSummary ? "summary" : "scene",
        messages: readyForSummary ? [...nextMessages, makeMessage("system", "本轮对话完成")] : nextMessages,
        turn: nextTurn,
        usedPatternIds,
        expressionDimensions: dimensions,
        coachNotes,
        attempt: result.needsImmediateRetry ? session.attempt + 1 : 1
      };
      persist(withSession(nextState, nextSession));
    } catch {
      persist(withSession(waitingState, {
        ...waitingSession,
        messages: [...waitingSession.messages, makeMessage("coach", "网络暂时没有回应。你的内容已经保存，可以再次发送。")]
      }));
      setAnswer(userAnswer);
    } finally {
      setIsLoading(false);
    }
  };

  const finishLesson = () => {
    const today = localDateKey();
    const continued = state.lastActiveDate === today || state.lastActiveDate === getPreviousDate();
    const nextSession: LessonSession = { ...session, phase: "complete", completedAt: new Date().toISOString() };
    persist(withSession({
      ...state,
      currentDay: Math.max(state.currentDay, dayNumber + 1),
      lastActiveDate: today,
      streak: state.lastActiveDate === today ? state.streak : continued ? state.streak + 1 : 1
    }, nextSession));
  };

  const restartLesson = () => {
    const key = `${getSessionKey(dayNumber)}:replay-${Date.now()}`;
    const nextSession = createLessonSession(state, dayNumber, lesson.patternIds);
    const next = { ...state, sessions: { ...state.sessions, [key]: nextSession } };
    setSessionKey(key);
    setAnswer("");
    persist(next);
  };

  const undoMemory = () => {
    if (!memoryNotice) return;
    persist({ ...state, memories: state.memories.filter((memory) => memory.id !== memoryNotice.id) });
    setMemoryNotice(null);
  };

  if (!loaded || !sessionKey) return <AppShell compact><main className="course-loading"><Loader2 className="spin" /> 正在恢复课程</main></AppShell>;

  const phaseOrder = ["review", "patterns", "scene", "summary"] as const;
  const currentPhaseIndex = session.phase === "complete" ? 4 : phaseOrder.indexOf(session.phase);
  const conversationProgress = Math.min(100, (session.turn / 8) * 100);

  return (
    <AppShell compact>
      <main className="course-session">
        <header className="course-session-head">
          <Link href="/" aria-label="返回今日课程"><ArrowLeft size={20} /></Link>
          <div><span>DAY {lesson.day} · {lesson.role}</span><h1>{lesson.title}</h1></div>
          <div className="session-phase">{phaseLabels[session.phase]}</div>
        </header>

        <div className="session-progress" aria-label="课程进度">
          {phaseOrder.map((phase, index) => <span className={index <= currentPhaseIndex ? "is-done" : ""} key={phase} />)}
        </div>

        <details className="course-drawer">
          <summary><BookOpen size={17} /> 本课目标与句式 <ChevronRight size={17} /></summary>
          <div><p>{lesson.goal}</p>{lesson.patternIds.map((id) => <span key={id}>{getPatternLabel(id)}</span>)}</div>
        </details>

        {session.phase === "summary" || session.phase === "complete" ? (
          <LessonSummary lessonTitle={lesson.title} session={session} complete={session.phase === "complete"} onFinish={finishLesson} onRestart={restartLesson} />
        ) : (
          <section className="course-thread">
            {(session.phase === "review" || session.phase === "patterns") && exercise ? (
              <div className="exercise-intro">
                <div className="phase-note"><span>{session.phase === "review" ? `复习 ${session.reviewIndex + 1}/${session.reviewPatternIds.length}` : `新句式 ${session.patternIndex + 1}/3`}</span><p>先把中文意思直接说成日语。</p></div>
                <div className="dialogue-row-v2 ai"><div className="v2-avatar">中</div><div className="v2-bubble"><p>{exercise.prompt}</p></div></div>
                <div className="pattern-hint-actions">
                  {session.hintLevel === 0 ? <button onClick={revealNextHint} type="button"><Lightbulb size={16} /> 显示提示</button> : <button onClick={hideHint} type="button"><EyeOff size={16} /> 收起提示</button>}
                  {session.hintLevel > 0 ? <button onClick={revealNextHint} disabled={session.hintLevel >= 3} type="button"><Eye size={16} /> 再多一点</button> : null}
                </div>
                {session.hintLevel > 0 ? (
                  <div className="graduated-hint">
                    <span>{session.hintLevel === 1 ? "目标结构" : session.hintLevel === 2 ? "填空提示" : "示范答案"}</span>
                    <p>{session.hintLevel === 1 ? getPatternLabel(activePatternId) : session.hintLevel === 2 ? exercise.hint : exercise.answer}</p>
                    {session.hintLevel === 3 ? <SpeakButton text={exercise.answer} label="播放示范" playbackRate={state.settings.playbackRate} /> : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="message-list">
              {session.messages.map((message) => <CourseMessageView key={message.id} message={message} playbackRate={state.settings.playbackRate} />)}
              {isLoading ? <div className="typing-indicator"><i /><i /><i /></div> : null}
              <div ref={threadEndRef} />
            </div>

            {session.phase === "scene" ? (
              <div className="conversation-meter"><span style={{ width: `${conversationProgress}%` }} /><small>{getStoryBeat(session.turn) === "personal" ? "正在把话题聊深" : "AI 正在推进场景"}</small></div>
            ) : null}

            <div className="course-composer">
              <label><span>你的回复</span><textarea autoFocus value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder={session.phase === "scene" ? "直接用日语回应。先说清意思，再尽量多说一点。" : "先不要看答案，直接输出日语。"} /></label>
              <div>
                <VoiceInputButton onTranscript={(text) => setAnswer((current) => `${current}${current ? " " : ""}${text}`)} />
                <button className="v2-send" disabled={!answer.trim() || isLoading} onClick={session.phase === "scene" ? submitConversation : submitExercise} type="button">{isLoading ? <Loader2 className="spin" size={19} /> : <Send size={19} />}<span>{isLoading ? "处理中" : "发送"}</span></button>
              </div>
            </div>
          </section>
        )}

        {memoryNotice ? <div className="memory-toast"><Sparkles size={17} /><span>已记住：{memoryNotice.text}</span><button onClick={undoMemory} type="button"><Undo2 size={15} /> 撤销</button><button aria-label="关闭" onClick={() => setMemoryNotice(null)} type="button"><X size={15} /></button></div> : null}
        <AutoSpeak text={latestAiText} enabled={state.settings.autoplay} playbackRate={state.settings.playbackRate} />
      </main>
    </AppShell>
  );
}

function CourseMessageView({ message, playbackRate }: { message: CourseMessage; playbackRate: 0.8 | 1 }) {
  if (message.role === "system") return <div className="thread-divider"><span>{message.text}</span></div>;
  if (message.role === "coach") return (
    <div className="coach-note-v2">
      <div><Check size={16} /><b>{message.text}</b></div>
      {message.detail ? <p>{message.detail}</p> : null}
      {message.rewrite ? <details><summary>查看自然说法</summary><div><p>{message.rewrite}</p><SpeakButton text={message.rewrite} label="播放" playbackRate={playbackRate} /></div></details> : null}
    </div>
  );
  return (
    <div className={`dialogue-row-v2 ${message.role}`}>
      <div className="v2-avatar">{message.role === "ai" ? "佐" : "你"}</div>
      <div className="v2-bubble"><p>{message.text}</p>{message.role === "ai" ? <SpeakButton text={message.text} label="播放" playbackRate={playbackRate} /> : null}</div>
    </div>
  );
}

function LessonSummary({ lessonTitle, session, complete, onFinish, onRestart }: { lessonTitle: string; session: LessonSession; complete: boolean; onFinish: () => void; onRestart: () => void }) {
  const reusable = session.messages.filter((message) => message.role === "user").slice(-3);
  const issue = session.coachNotes.at(-1) ?? "下一次试着主动补充一个具体例子。";
  return (
    <section className="lesson-summary">
      <div className="summary-mark"><Check size={24} /></div>
      <p className="v2-kicker">LESSON WRAP-UP</p>
      <h2>{lessonTitle}</h2>
      <p className="summary-lead">你完成了今天的场景交流，并把话题扩展到了 {session.expressionDimensions.join("、") || "事实和选择"}。</p>
      <div className="summary-grid">
        <article><span>今天调用的句式</span><div className="summary-patterns">{session.usedPatternIds.length ? session.usedPatternIds.map((id) => <b key={id}>{getPatternLabel(id)}</b>) : <b>将在明天继续安排调用</b>}</div></article>
        <article><span>最值得改善的一点</span><p>{issue}</p></article>
      </div>
      <div className="reusable-lines"><span>今天真正说出的表达</span>{reusable.length ? reusable.map((message) => <div key={message.id}><p>{message.text}</p><SpeakButton text={message.text} label="播放" /></div>) : <p>完成对话后会保留你的表达。</p>}</div>
      <div className="summary-actions">
        {complete ? <Link className="v2-primary" href="/">返回今日</Link> : <button className="v2-primary" onClick={onFinish} type="button">完成今天 <ChevronRight size={18} /></button>}
        {complete ? <button className="v2-secondary" onClick={onRestart} type="button">重新练习</button> : null}
      </div>
    </section>
  );
}
