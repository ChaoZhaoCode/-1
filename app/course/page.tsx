"use client";

import { ArrowRight, Check, Clock3, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { courseChapters, restaurantDays } from "@/lib/course-v2";
import { createLearningState, loadLearningState, type LearningState } from "@/lib/learning-state";

export default function CoursePage() {
  const [state, setState] = useState<LearningState>(() => createLearningState());
  useEffect(() => setState(loadLearningState()), []);
  const completedDays = new Set(Object.values(state.sessions).filter((session) => session.phase === "complete").map((session) => session.day));

  return (
    <AppShell>
      <main className="v2-page course-page">
        <header className="v2-page-head">
          <p className="v2-kicker">60 DAY COURSE</p>
          <h1>从办成事情，到说出自己。</h1>
          <p>每个场景连续练四天。前三天积累表达，第四天完成完整交流。</p>
        </header>

        <section className="active-chapter">
          <div className="chapter-number">01</div>
          <div className="chapter-summary"><span>当前章节</span><h2>{courseChapters[0].title}</h2><p>{courseChapters[0].description}</p></div>
          <div className="chapter-days">
            {restaurantDays.map((day) => (
              <Link href={`/practice?day=${day.day}`} key={day.day}>
                <span>{completedDays.has(day.day) ? <Check size={16} /> : `DAY ${day.day}`}</span>
                <b>{day.title}</b>
                <small><Clock3 size={14} /> 约 30 分钟</small>
                <ArrowRight className="day-arrow" size={18} />
              </Link>
            ))}
          </div>
        </section>

        <section className="planned-chapters">
          <div className="section-title"><h2>后续章节</h2><span>完成首章验证后开放</span></div>
          <div className="chapter-grid">
            {courseChapters.slice(1).map((chapter) => (
              <article key={chapter.id}>
                <span>{String(chapter.id).padStart(2, "0")}</span><LockKeyhole size={16} />
                <h3>{chapter.title}</h3><p>{chapter.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

