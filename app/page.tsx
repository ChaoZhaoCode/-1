"use client";

import { ArrowRight, CalendarDays, Clock3, Flame, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { courseChapters, getCourseDay } from "@/lib/course-v2";
import { createLearningState, loadLearningState, localDateKey, saveLearningState, selectDueReviews, type LearningState } from "@/lib/learning-state";

export default function Home() {
  const [state, setState] = useState<LearningState>(() => createLearningState());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setState(loadLearningState());
    setLoaded(true);
  }, []);

  const unfinished = useMemo(
    () => Object.values(state.sessions)
      .filter((session) => session.phase !== "complete")
      .sort((a, b) => (b.updatedAt ?? b.date).localeCompare(a.updatedAt ?? a.date))[0],
    [state.sessions]
  );
  const activeDayNumber = unfinished?.day ?? state.currentDay;
  const firstChapterComplete = activeDayNumber > 4;
  const day = getCourseDay(Math.min(activeDayNumber, 4));
  const dueCount = selectDueReviews(state, []).length;
  const unfinishedFromEarlierDay = Boolean(unfinished && unfinished.date < localDateKey());
  const latestIssue = useMemo(() => {
    const sessions = Object.values(state.sessions).sort((a, b) => b.date.localeCompare(a.date));
    return sessions.flatMap((session) => session.coachNotes).at(-1) ?? "把回答从一句扩展到理由和具体例子。";
  }, [state.sessions]);

  const clearCurrentSession = () => {
    if (!unfinished || !window.confirm("只清除当前未完成课程，并保留句式学习记录吗？")) return;
    const next = { ...state, sessions: { ...state.sessions } };
    const key = Object.entries(next.sessions).find(([, session]) => session === unfinished)?.[0];
    if (key) delete next.sessions[key];
    setState(next);
    saveLearningState(next);
  };

  return (
    <AppShell>
      <main className="v2-home">
        <section className="today-hero">
          <div className="today-copy">
            <p className="v2-kicker">{firstChapterComplete ? "第一章已完成" : `DAY ${day.day} · 餐厅里的连续交流`}</p>
            <h1>{firstChapterComplete ? "你已经完成餐厅章节。" : day.title}</h1>
            <p>{firstChapterComplete ? "可以回到课程中复练任意一天。后续章节将按同一课程标准加入。" : day.goal}</p>
          </div>
          <div className="today-action">
            <div className="duration"><Clock3 size={17} /> 约 30 分钟</div>
            <Link className="v2-primary" href={firstChapterComplete ? "/course" : `/practice?day=${day.day}`}>
              {unfinished ? "继续课程" : firstChapterComplete ? "查看课程" : "开始今天"}
              <ArrowRight size={19} />
            </Link>
            {unfinishedFromEarlierDay ? <Link className="v2-secondary" href={`/practice?day=${day.day}&fresh=1`}>重新开始本课</Link> : null}
          </div>
        </section>

        <section className="today-context" aria-label="今日学习信息">
          <div><span>今日复习</span><b>{dueCount} 个句式</b></div>
          <div><span>连续学习</span><b><Flame size={17} /> {state.streak} 天</b></div>
          <div className="context-wide"><span>最近需要改善</span><b>{latestIssue}</b></div>
        </section>

        {!firstChapterComplete ? (
          <section className="lesson-roadmap">
            <div className="section-title">
              <div><p className="v2-kicker">TODAY&apos;S FLOW</p><h2>今天只完成这四步</h2></div>
              {unfinished ? <button className="v2-icon-text" onClick={clearCurrentSession} type="button"><RotateCcw size={16} /> 重开本课</button> : null}
            </div>
            <ol>
              <li><span>01</span><div><b>复习</b><small>最多 5 个高优先句式</small></div></li>
              <li><span>02</span><div><b>新句式</b><small>3 次中文到日语输出</small></div></li>
              <li><span>03</span><div><b>场景对话</b><small>AI 主动推进话题</small></div></li>
              <li><span>04</span><div><b>表达总结</b><small>留下今天最值得复用的表达</small></div></li>
            </ol>
          </section>
        ) : null}

        <section className="chapter-peek">
          <div><CalendarDays size={20} /><span>60 天课程</span></div>
          <p>{courseChapters.length} 个场景章节，每章从办成事情逐步走向经历、感受和观点。</p>
          <Link href="/course">查看课程安排 <ArrowRight size={16} /></Link>
        </section>
        {!loaded ? <span className="sr-only">正在读取本地进度</span> : null}
      </main>
    </AppShell>
  );
}
