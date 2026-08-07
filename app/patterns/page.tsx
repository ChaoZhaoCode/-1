"use client";

import { ArrowLeft, BrainCircuit, Check, Library, RefreshCcw, Send, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { refinedPatterns, sentencePatterns } from "@/lib/course-data";

type Feedback = {
  source: "deepseek" | "mock";
  naturalness: number;
  politeness: number;
  mainIssue: unknown;
  rewrite: unknown;
  explanation: unknown;
  nextPrompt: unknown;
  patternCheck: unknown;
};

const memoryKey = "japanese-speaking-mvp-pattern-memory";

const displayText = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => displayText(item)).filter(Boolean).join(" / ");
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${key}: ${displayText(item)}`)
      .filter((item) => !item.endsWith(": "))
      .join("；");
  }
  return fallback;
};

export default function PatternModule() {
  const [activeId, setActiveId] = useState(144);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [remembered, setRemembered] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [category, setCategory] = useState("全部");

  const categories = useMemo(
    () => ["全部", ...Array.from(new Set(sentencePatterns.map((pattern) => pattern.category)))],
    []
  );
  const activePattern = sentencePatterns.find((pattern) => pattern.id === activeId) ?? sentencePatterns[0];
  const refined = refinedPatterns.find((pattern) => pattern.id === activePattern.id);
  const filteredPatterns = category === "全部"
    ? sentencePatterns
    : sentencePatterns.filter((pattern) => pattern.category === category);

  useEffect(() => {
    const stored = window.localStorage.getItem(memoryKey);
    if (!stored) return;
    try {
      setRemembered(JSON.parse(stored) as number[]);
    } catch {
      window.localStorage.removeItem(memoryKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(memoryKey, JSON.stringify(remembered));
  }, [remembered]);

  const selectPattern = (id: number) => {
    setActiveId(id);
    setAnswer("");
    setFeedback(null);
  };

  const toggleRemembered = () => {
    setRemembered((current) =>
      current.includes(activePattern.id)
        ? current.filter((id) => id !== activePattern.id)
        : [...current, activePattern.id]
    );
  };

  const submitAnswer = async () => {
    if (!answer.trim() || isLoading) return;
    setIsLoading(true);
    const prompt = `请用句式「${activePattern.pattern}」造一个自然的日语句子。先保证结构正确，再考虑场景自然度。`;
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answer,
        levelTitle: "句式单练",
        sceneTitle: "150 句式结构库",
        prompt,
        targetPatterns: [activePattern.pattern]
      })
    });
    setFeedback((await response.json()) as Feedback);
    setIsLoading(false);
  };

  return (
    <main className="shell pattern-shell">
      <header className="pattern-topbar">
        <Link className="back-link" href="/">
          <ArrowLeft size={18} />
          返回训练台
        </Link>
        <div>
          <p className="eyebrow">150 句式结构库</p>
          <h1>单句造句与记忆训练</h1>
        </div>
        <div className="topbar__stats">
          <span>{remembered.length} 已记忆</span>
          <span>{sentencePatterns.length} 总句式</span>
        </div>
      </header>

      <section className="pattern-workbench">
        <aside className="pattern-sidebar">
          <div className="section-heading">
            <Library size={18} />
            <h2>句式目录</h2>
          </div>
          <div className="category-strip">
            {categories.map((item) => (
              <button className={category === item ? "is-active" : ""} key={item} onClick={() => setCategory(item)} type="button">
                {item}
              </button>
            ))}
          </div>
          <div className="pattern-index">
            {filteredPatterns.map((pattern) => (
              <button
                className={pattern.id === activeId ? "is-current" : ""}
                key={pattern.id}
                onClick={() => selectPattern(pattern.id)}
                type="button"
              >
                <span>Day {pattern.id}</span>
                <b>{pattern.pattern}</b>
                {remembered.includes(pattern.id) && <Check size={15} />}
              </button>
            ))}
          </div>
        </aside>

        <section className="pattern-trainer">
          <div className="pattern-focus">
            <span>Day {activePattern.id}</span>
            <h2>{activePattern.pattern}</h2>
            <p>{activePattern.category}</p>
            <button className={remembered.includes(activePattern.id) ? "memory-action is-done" : "memory-action"} onClick={toggleRemembered} type="button">
              <Star size={17} />
              {remembered.includes(activePattern.id) ? "已加入记忆" : "标记为要记"}
            </button>
          </div>

          <div className="pattern-lesson">
            <article>
              <span>用途</span>
              <p>{refined?.usage ?? "该句式已进入总库，后续会继续补充精修释义。现在可以先用 AI 针对它做造句纠错。"}</p>
            </article>
            <article>
              <span>例句</span>
              <p>{refined?.example ?? `请先试着用「${activePattern.pattern}」写一句和自己生活有关的日语。`}</p>
            </article>
            <article>
              <span>常见卡点</span>
              <p>{refined?.commonMistake ?? "不要只替换单词；要确认前后接续、礼貌度和使用场景是否自然。"}</p>
            </article>
          </div>

          <div className="training-block pattern-practice">
            <div className="prompt-strip">
              <span>造句任务</span>
              <p>请用「{activePattern.pattern}」造一个自然日语句子。写完后提交，AI 会检查结构、自然度和可替代表达。</p>
            </div>
            <label className="answer-box">
              <span>你的造句</span>
              <textarea
                onChange={(event) => setAnswer(event.target.value)}
                placeholder={`例：${refined?.example ?? "ここに自分の文を書いてください。"}`}
                value={answer}
              />
            </label>
            <div className="actions">
              <button className="primary-action" disabled={!answer.trim() || isLoading} onClick={submitAnswer} type="button">
                {isLoading ? <RefreshCcw className="spin" size={18} /> : <Send size={18} />}
                <span>{isLoading ? "反馈中" : "提交句式训练"}</span>
              </button>
            </div>
          </div>
        </section>

        <aside className="pattern-feedback">
          <div className="section-heading">
            <BrainCircuit size={18} />
            <h2>句式反馈</h2>
          </div>
          {feedback ? (
            <div className="feedback">
              <div className="score-row">
                <span>自然度 {feedback.naturalness}/10</span>
                <span>礼貌度 {feedback.politeness}/10</span>
              </div>
              <h3>{displayText(feedback.mainIssue)}</h3>
              <p className="rewrite">{displayText(feedback.rewrite)}</p>
              <p>{displayText(feedback.explanation)}</p>
              <p className="pattern-check">{displayText(feedback.patternCheck)}</p>
              <small>{feedback.source === "deepseek" ? "DeepSeek 实时反馈" : "本地模拟反馈"}</small>
            </div>
          ) : (
            <div className="empty-feedback">
              <BrainCircuit size={20} />
              <p>这里专门看单个句式。先选一句，自己造句，再让 AI 判断结构是否真的用对。</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
