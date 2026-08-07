"use client";

import { ArrowRight, BookOpen, FileText, Library, MessageSquareText, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { TRAINING_PROGRESS_KEY, mergeProgress, trainingPatterns, type TrainingProgress } from "@/lib/training-system";

export default function Home() {
  const [progress, setProgress] = useState<TrainingProgress>(() => mergeProgress(null));

  useEffect(() => {
    const stored = window.localStorage.getItem(TRAINING_PROGRESS_KEY);
    if (!stored) return;
    try {
      setProgress(mergeProgress(JSON.parse(stored)));
    } catch {
      window.localStorage.removeItem(TRAINING_PROGRESS_KEY);
    }
  }, []);

  const stats = useMemo(() => {
    const values = Object.values(progress);
    return {
      total: trainingPatterns.length,
      newCount: values.filter((item) => item.status === "new").length,
      cardReady: values.filter((item) => item.status === "seen").length,
      review: values.filter((item) => item.status === "failed_in_scene").length,
      mastered: values.filter((item) => item.status === "mastered").length
    };
  }, [progress]);

  const nextAction = stats.review > 0 ? "先回炉失败句式" : stats.cardReady > 0 ? "进入场景强制输出" : "先做句式卡片";

  const resetProgress = () => {
    const next = mergeProgress(null);
    setProgress(next);
    window.localStorage.setItem(TRAINING_PROGRESS_KEY, JSON.stringify(next));
  };

  return (
    <main className="training-hub">
      <nav className="panda-nav" aria-label="主导航">
        <Link className="brand-mark" href="/">
          <span>日</span>
          Output Lab
        </Link>
        <div className="nav-links">
          <Link href="/cards">卡片</Link>
          <Link href="/practice">练习</Link>
          <Link href="/materials">资料</Link>
          <button onClick={resetProgress}>
            <RotateCcw size={16} />
            重置
          </button>
        </div>
      </nav>

      <header className="hub-hero">
        <p className="eyebrow">N2 输出训练 MVP</p>
        <h1>把懂的日语，练成能开口说的日语。</h1>
        <p className="hero-copy">先用卡片激活句式，再进入场景强制输出。每一轮只练一个结构，成功才推进。</p>
        <div className="hero-actions">
          <Link className="primary-action" href="/cards">
            开始句式卡片
            <ArrowRight size={18} />
          </Link>
          <Link className="secondary-action" href="/practice">
            进入场景练习
          </Link>
        </div>
      </header>

      <section className="hub-status" aria-label="学习进度">
        <div className="next-card">
          <Sparkles size={18} />
          <span>今天建议</span>
          <b>{nextAction}</b>
        </div>
        <div className="hub-stat-grid">
          <span>
            <b>{stats.total}</b>
            总句式
          </span>
          <span>
            <b>{stats.newCount}</b>
            未练
          </span>
          <span>
            <b>{stats.cardReady}</b>
            可进场景
          </span>
          <span>
            <b>{stats.review}</b>
            回炉
          </span>
          <span>
            <b>{stats.mastered}</b>
            掌握
          </span>
        </div>
      </section>

      <section className="training-grid" aria-label="训练模块">
        <ModuleCard
          href="/cards"
          icon={<BookOpen size={24} />}
          index="01"
          title="句式记忆卡片"
          copy="看中文意图，先自己翻成日语；需要时再展开结构提示。"
          featured
        />
        <ModuleCard
          href="/practice"
          icon={<MessageSquareText size={24} />}
          index="02"
          title="场景强制输出"
          copy="AI 一句一句接话；本轮句式没用上，就停在当前轮重说。"
          featured
        />
        <ModuleCard
          href="/materials"
          icon={<FileText size={24} />}
          index="资料"
          title="导入材料库"
          copy="查看已导入内容，用来继续扩展课程、题库和场景素材。"
        />
        <ModuleCard
          href="/patterns"
          icon={<Library size={24} />}
          index="总库"
          title="150 句式库"
          copy="保留完整句式总库，后续逐步纳入卡片与场景训练。"
        />
      </section>
    </main>
  );
}

function ModuleCard({
  href,
  icon,
  index,
  title,
  copy,
  featured = false
}: {
  href: string;
  icon: ReactNode;
  index: string;
  title: string;
  copy: string;
  featured?: boolean;
}) {
  return (
    <Link className={featured ? "training-card primary" : "training-card"} href={href}>
      <div className="card-topline">
        {icon}
        <span>{index}</span>
      </div>
      <h2>{title}</h2>
      <p>{copy}</p>
      <small>
        打开
        <ArrowRight size={15} />
      </small>
    </Link>
  );
}
