"use client";

import { Check, ChevronRight, Library, Search, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { SpeakButton, VoiceInputButton } from "@/components/speech-tools";
import { refinedPatterns, sentencePatterns } from "@/lib/course-data";
import { createLearningState, loadLearningState, recordPatternAttempt, saveLearningState, type LearningState, type PatternLearningStatus } from "@/lib/learning-state";

type PatternFeedback = {
  communicationSucceeded: boolean;
  targetPatternUsed: boolean;
  mainIssue: string;
  rewrite: string;
  explanation: string;
};

const statusLabels: Record<PatternLearningStatus, string> = {
  new: "未学习",
  learning: "学习中",
  review: "复习中",
  mastered: "已掌握"
};

export default function PatternsPage() {
  const [state, setState] = useState<LearningState>(() => createLearningState());
  const [activeId, setActiveId] = useState(144);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("全部");
  const [answer, setAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<PatternFeedback | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => setState(loadLearningState()), []);
  const categories = useMemo(() => ["全部", ...Array.from(new Set(sentencePatterns.map((item) => item.category)))], []);
  const filtered = useMemo(() => sentencePatterns.filter((item) => {
    const matchesCategory = category === "全部" || item.category === category;
    const matchesQuery = !query.trim() || `${item.id} ${item.pattern} ${item.category}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesCategory && matchesQuery;
  }), [category, query]);
  const active = sentencePatterns.find((item) => item.id === activeId) ?? sentencePatterns[0];
  const refined = refinedPatterns.find((item) => item.id === active.id);
  const record = state.patternRecords[active.id];
  const learnedCount = Object.values(state.patternRecords).filter((item) => item.status !== "new").length;
  const masteredCount = Object.values(state.patternRecords).filter((item) => item.status === "mastered").length;

  const choosePattern = (id: number) => {
    setActiveId(id);
    setAnswer("");
    setFeedback(null);
    setShowHint(false);
    if (window.innerWidth <= 820) document.querySelector(".library-practice")?.scrollIntoView({ behavior: "smooth" });
  };

  const submit = async () => {
    if (!answer.trim() || loading) return;
    setLoading(true);
    try {
      const response = await fetch("/api/course-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "translation",
          answer: answer.trim(),
          targetPattern: {
            id: active.id,
            pattern: active.pattern,
            modelAnswer: refined?.example ?? answer.trim(),
            hint: refined?.usage ?? active.pattern
          },
          lesson: { day: 1, title: "句式单练", role: "日语教练", goal: `自然使用${active.pattern}`, event: "检查结构和自然度" },
          turn: 0,
          storyBeat: "transaction",
          recentMessages: [],
          availablePatterns: [{ id: active.id, pattern: active.pattern }],
          memories: state.memories.slice(-8)
        })
      });
      if (!response.ok) throw new Error("pattern feedback unavailable");
      const result = await response.json() as PatternFeedback;
      setFeedback(result);
      const next = recordPatternAttempt(state, active.id, {
        success: result.communicationSucceeded && result.targetPatternUsed,
        inScene: false,
        hintLevel: showHint ? 1 : 0
      });
      setState(next);
      saveLearningState(next);
    } catch {
      setFeedback({
        communicationSucceeded: false,
        targetPatternUsed: false,
        mainIssue: "暂时无法取得反馈，请稍后再试。",
        rewrite: "",
        explanation: ""
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <main className="v2-page pattern-library-v2">
        <header className="library-head">
          <div><p className="v2-kicker">150 PATTERNS</p><h1>句式库</h1><p>查找、理解，再用自己的生活造句。</p></div>
          <div><span><b>{learnedCount}</b> 已学习</span><span><b>{masteredCount}</b> 已掌握</span></div>
        </header>

        <div className="library-layout">
          <aside className="library-index">
            <label className="library-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索句式" /></label>
            <div className="library-categories">
              {categories.map((item) => <button className={category === item ? "is-active" : ""} key={item} onClick={() => setCategory(item)} type="button">{item}</button>)}
            </div>
            <div className="library-list">
              {filtered.map((item) => (
                <button className={item.id === active.id ? "is-active" : ""} key={item.id} onClick={() => choosePattern(item.id)} type="button">
                  <span>{String(item.id).padStart(3, "0")}</span><b>{item.pattern}</b><small>{statusLabels[state.patternRecords[item.id].status]}</small><ChevronRight size={15} />
                </button>
              ))}
            </div>
          </aside>

          <section className="library-practice">
            <div className="pattern-detail-head">
              <div><span>{active.category} · {statusLabels[record.status]}</span><h2>{active.pattern}</h2></div>
              <SpeakButton text={`${active.pattern}。${refined?.example ?? ""}`} label="播放" />
            </div>
            <div className="pattern-detail-copy">
              <article><span>怎么用</span><p>{refined?.usage ?? "先判断前后接续和说话场合，再用与你自己有关的内容完成一句表达。"}</p></article>
              {refined?.example ? <article><span>自然例句</span><p>{refined.example}</p></article> : null}
              {refined?.commonMistake ? <article><span>容易卡住</span><p>{refined.commonMistake}</p></article> : null}
            </div>
            <div className="self-sentence-task">
              <div><Library size={18} /><p>不用照抄例句。请用这个结构，说一句与你真实生活有关的日语。</p></div>
              {showHint ? <div className="library-hint"><span>结构提示</span><p>{refined?.usage ?? active.pattern}</p></div> : null}
              <label><span>你的日语</span><textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="先自己组织，再让 AI 检查。" /></label>
              <div className="library-actions">
                <button className="v2-secondary" onClick={() => setShowHint((value) => !value)} type="button">{showHint ? "收起提示" : "显示提示"}</button>
                <VoiceInputButton onTranscript={(text) => setAnswer((current) => `${current}${current ? " " : ""}${text}`)} />
                <button className="v2-send" disabled={!answer.trim() || loading} onClick={submit} type="button"><Send size={17} />{loading ? "检查中" : "提交"}</button>
              </div>
            </div>
            {feedback ? (
              <div className={feedback.communicationSucceeded ? "library-feedback is-pass" : "library-feedback"}>
                <div><Check size={18} /><b>{feedback.targetPatternUsed ? "目标结构已用上" : "意思成立，结构还需再试"}</b></div>
                <p>{feedback.mainIssue}</p>
                {feedback.rewrite ? <details><summary>查看建议表达</summary><div><p>{feedback.rewrite}</p><SpeakButton text={feedback.rewrite} label="播放" /></div></details> : null}
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </AppShell>
  );
}
