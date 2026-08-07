"use client";

import { ArrowLeft, BookOpen, FileText, Layers, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import importedMaterials from "@/lib/imported-materials.json";

type MaterialSection = {
  id: string;
  index: number;
  title: string;
  text: string;
};

type Material = {
  fileName: string;
  sourcePath: string;
  fileType: string;
  kind: "lesson" | "practice" | "reference";
  sectionCount: number;
  charCount: number;
  sections: MaterialSection[];
};

type MaterialModule = {
  id: string;
  title: string;
  description: string;
  materials: Material[];
};

const data = importedMaterials as {
  importedAt: string;
  moduleCount: number;
  materialCount: number;
  sectionCount: number;
  charCount: number;
  modules: MaterialModule[];
};

const kindLabel: Record<Material["kind"], string> = {
  lesson: "课件",
  practice: "练习",
  reference: "参考"
};

export default function MaterialsPage() {
  const [activeModuleId, setActiveModuleId] = useState(data.modules[0]?.id ?? "");
  const [activeFileName, setActiveFileName] = useState("all");
  const [query, setQuery] = useState("");

  const activeModule = data.modules.find((module) => module.id === activeModuleId) ?? data.modules[0];

  const sections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return activeModule.materials.flatMap((material) =>
      material.sections
        .filter((section) => activeFileName === "all" || material.fileName === activeFileName)
        .filter((section) => {
          if (!normalizedQuery) return true;
          return `${material.fileName}\n${section.title}\n${section.text}`.toLowerCase().includes(normalizedQuery);
        })
        .map((section) => ({ ...section, material }))
    );
  }, [activeFileName, activeModule, query]);

  return (
    <main className="materials-shell">
      <header className="materials-topbar">
        <Link className="back-link" href="/">
          <ArrowLeft size={17} />
          返回训练
        </Link>
        <div>
          <p className="eyebrow">导入资料库</p>
          <h1>课程资料整理</h1>
        </div>
        <div className="materials-stats" aria-label="导入统计">
          <span>{data.moduleCount} 板块</span>
          <span>{data.materialCount} 文件</span>
          <span>{data.sectionCount} 页/题</span>
        </div>
      </header>

      <section className="materials-layout">
        <aside className="materials-sidebar">
          <div className="materials-card">
            <div className="side-title">
              <Layers size={18} />
              <h2>板块</h2>
            </div>
            <div className="module-filter">
              {data.modules.map((module) => (
                <button
                  className={module.id === activeModule.id ? "is-current" : ""}
                  key={module.id}
                  onClick={() => {
                    setActiveModuleId(module.id);
                    setActiveFileName("all");
                  }}
                  type="button"
                >
                  <b>{module.title}</b>
                  <span>{module.materials.length} 份资料</span>
                </button>
              ))}
            </div>
          </div>

          <div className="materials-card">
            <div className="side-title">
              <FileText size={18} />
              <h2>资料</h2>
            </div>
            <div className="file-filter">
              <button className={activeFileName === "all" ? "is-current" : ""} onClick={() => setActiveFileName("all")} type="button">
                全部资料
              </button>
              {activeModule.materials.map((material) => (
                <button
                  className={activeFileName === material.fileName ? "is-current" : ""}
                  key={material.fileName}
                  onClick={() => setActiveFileName(material.fileName)}
                  type="button"
                >
                  <span>{kindLabel[material.kind]} · {material.fileType.toUpperCase()}</span>
                  <b>{material.fileName}</b>
                  <small>{material.sectionCount} 页/题</small>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="materials-main">
          <div className="materials-heading">
            <div>
              <h2>{activeModule.title}</h2>
              <p>{activeModule.description}</p>
            </div>
            <label className="material-search">
              <Search size={16} />
              <input onChange={(event) => setQuery(event.target.value)} placeholder="搜索日语、中文、句式或题目" value={query} />
            </label>
          </div>

          <div className="material-result-count">
            <BookOpen size={16} />
            <span>当前显示 {sections.length} 条</span>
          </div>

          <div className="section-list">
            {sections.map((section) => (
              <article className="material-section" key={`${section.material.fileName}-${section.id}`}>
                <div className="section-meta">
                  <span>{section.material.fileName}</span>
                  <b>{section.material.fileType.toUpperCase()} · {section.material.kind === "practice" ? "练习" : "课件"} · {section.index}</b>
                </div>
                <details>
                  <summary>{section.title}</summary>
                  <pre>{section.text}</pre>
                </details>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
