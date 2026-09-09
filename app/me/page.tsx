"use client";

import { Check, Database, Pause, Pencil, Play, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { createLearningState, LEARNING_STATE_KEY, loadLearningState, saveLearningState, type LearningState } from "@/lib/learning-state";

const memoryLabels = { preference: "偏好", habit: "习惯", experience: "经历", opinion: "观点", goal: "目标" };

export default function MePage() {
  const [state, setState] = useState<LearningState>(() => createLearningState());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [memoryDraft, setMemoryDraft] = useState("");
  useEffect(() => setState(loadLearningState()), []);
  const update = (next: LearningState) => { setState(next); saveLearningState(next); };
  const clearSessions = () => {
    if (window.confirm("清空课程对话记录，但保留句式进度和长期记忆吗？")) update({ ...state, sessions: {} });
  };
  const resetAll = () => {
    if (!window.confirm("这会删除本设备上的全部学习记录，且无法恢复。确定继续吗？")) return;
    window.localStorage.removeItem(LEARNING_STATE_KEY);
    setState(createLearningState());
  };
  const saveMemoryEdit = (id: string) => {
    const text = memoryDraft.trim();
    if (!text) return;
    update({ ...state, memories: state.memories.map((memory) => memory.id === id ? { ...memory, text } : memory) });
    setEditingId(null);
    setMemoryDraft("");
  };

  return (
    <AppShell>
      <main className="v2-page me-page">
        <header className="v2-page-head"><p className="v2-kicker">YOUR LEARNING</p><h1>你的表达资料</h1><p>AI 只保存从对话中明确提炼的信息，用来在之后自然地继续话题。</p></header>
        <section className="settings-band">
          <div>{state.settings.autoplay ? <Play size={20} /> : <Pause size={20} />}<div><b>AI 新消息自动播放</b><span>示范答案仍由你手动播放</span></div></div>
          <button aria-pressed={state.settings.autoplay} className={state.settings.autoplay ? "v2-toggle is-on" : "v2-toggle"} onClick={() => update({ ...state, settings: { ...state.settings, autoplay: !state.settings.autoplay } })} type="button"><span /></button>
          <div className="speed-control" aria-label="播放速度">
            {[0.8, 1].map((rate) => <button className={state.settings.playbackRate === rate ? "is-active" : ""} key={rate} onClick={() => update({ ...state, settings: { ...state.settings, playbackRate: rate as 0.8 | 1 } })} type="button">{rate.toFixed(1)}×</button>)}
          </div>
        </section>
        <section className="memory-section">
          <div className="section-title"><div><h2>长期记忆</h2><span>{state.memories.length} 条</span></div><p>你可以随时删除不准确或不希望保留的内容。</p></div>
          {state.memories.length ? (
            <div className="memory-list">
              {state.memories.map((memory) => (
                <article key={memory.id}>
                  <span>{memoryLabels[memory.category]}</span>
                  {editingId === memory.id ? <input autoFocus value={memoryDraft} onChange={(event) => setMemoryDraft(event.target.value)} /> : <p>{memory.text}</p>}
                  <div>
                    {editingId === memory.id
                      ? <button aria-label="保存修改" onClick={() => saveMemoryEdit(memory.id)} title="保存" type="button"><Check size={17} /></button>
                      : <button aria-label="编辑这条记忆" onClick={() => { setEditingId(memory.id); setMemoryDraft(memory.text); }} title="编辑" type="button"><Pencil size={16} /></button>}
                    <button aria-label="删除这条记忆" onClick={() => update({ ...state, memories: state.memories.filter((item) => item.id !== memory.id) })} title="删除" type="button"><X size={17} /></button>
                  </div>
                </article>
              ))}
            </div>
          ) : <div className="v2-empty">完成几轮场景对话后，这里会出现你的习惯、经历和观点。</div>}
        </section>
        <section className="data-section">
          <div><Database size={20} /><div><b>本地数据</b><span>记录只保存在当前浏览器，不会跨设备同步。</span></div></div>
          <button className="v2-secondary" onClick={clearSessions} type="button">清空对话</button>
          <button className="v2-danger" onClick={resetAll} type="button"><Trash2 size={16} /> 重置全部</button>
        </section>
      </main>
    </AppShell>
  );
}
