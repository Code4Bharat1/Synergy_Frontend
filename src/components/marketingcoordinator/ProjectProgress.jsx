"use client";

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";

// ── Constants ─────────────────────────────────
const C = {
  darkBlue: "#0F2854",
  blue: "#1C4D8D",
  medBlue: "#4988C4",
  lightBlue: "#BDE8F5",
  white: "#ffffff",
};

const STATUS_STYLE = {
  initiated:     { bg: "bg-slate-100",   text: "text-slate-600",   dot: "bg-slate-400",   bar: "#94a3b8" },
  "in-progress": { bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500", bar: "#10b981" },
  installation:  { bg: "bg-blue-50",     text: "text-blue-700",    dot: "bg-blue-500",    bar: "#3b82f6" },
  testing:       { bg: "bg-violet-50",   text: "text-violet-700",  dot: "bg-violet-500",  bar: "#8b5cf6" },
  completed:     { bg: "bg-green-50",    text: "text-green-700",   dot: "bg-green-500",   bar: "#16a34a" },
  "on-hold":     { bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-500",   bar: "#d97706" },
};

const TRIAL_STYLE = {
  Completed:     "bg-[#0F2854] text-white",
  "In Trial":    "bg-[#1C4D8D] text-white",
  Scheduled:     "bg-[#BDE8F5] text-[#0F2854]",
  Pending:       "bg-[#d6ebf7] text-[#1C4D8D]",
  "Not Started": "bg-gray-100 text-gray-400",
};

const PHASES = [
  "Site Preparation",
  "Wiring & Plumbing",
  "Equipment Setup",
  "Installation",
  "Final Testing",
  "Completed",
];

// ── Helpers ───────────────────────────────────
const fmt = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const daysUntil = (ds) => {
  if (!ds) return null;
  return Math.max(0, Math.ceil((new Date(ds) - new Date()) / 86400000));
};

const phaseFromStatus = (s) =>
  ({ initiated: "Site Preparation", "in-progress": "Wiring & Plumbing", installation: "Installation",
     testing: "Final Testing", completed: "Completed", "on-hold": "Site Preparation" })[s] || "Site Preparation";

const resolveName = (f) => {
  if (!f) return null;
  if (typeof f === "object") return f.name || f.email || null;
  return null;
};

const fmtStatus = (s) =>
  s ? s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—";

// ── File helpers ──────────────────────────────
const getExt = (name) => { if (!name) return ""; const p = name.split("."); return p.length > 1 ? p.pop().toLowerCase() : ""; };

const getFileColor = (name) => {
  const ext = getExt(name);
  if (["jpg","jpeg","png","gif","webp","svg","bmp"].includes(ext)) return { color: "#7c3aed", bg: "#ede9fe" };
  if (ext === "pdf")                                                return { color: "#dc2626", bg: "#fee2e2" };
  if (["doc","docx"].includes(ext))                                 return { color: "#2563eb", bg: "#dbeafe" };
  if (["xls","xlsx","csv"].includes(ext))                           return { color: "#16a34a", bg: "#dcfce7" };
  if (["zip","rar","7z","tar","gz"].includes(ext))                  return { color: "#d97706", bg: "#fef3c7" };
  return { color: C.medBlue, bg: "#e0eefa" };
};

const fmtSize = (b) => {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(1)} MB`;
};

const buildTree = (files) => {
  const root = { __files: [] };
  files.forEach((file) => {
    const rawName = file.originalname || file.filename || file.name || file.fileName || "";
    const parts = rawName.split("/").filter(Boolean);
    if (parts.length <= 1) { root.__files.push(file); }
    else {
      let node = root;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!node[parts[i]]) node[parts[i]] = { __files: [] };
        node = node[parts[i]];
      }
      node.__files.push({ ...file, _displayName: parts[parts.length - 1] });
    }
  });
  return root;
};

// ── Icons ─────────────────────────────────────
const Ico = {
  Search:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  Filter:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Refresh:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>,
  Back:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/></svg>,
  Wrench:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
  Check:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Flask:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M9 3h6v7l3.5 6a2 2 0 01-1.74 3H7.24a2 2 0 01-1.74-3L9 10V3z"/><line x1="6" y1="14" x2="18" y2="14"/></svg>,
  Alert:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Calendar:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  MapPin:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  User:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Users:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  Briefcase:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>,
  Phone:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.1 11.5a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  Paperclip:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>,
  Download:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Eye:         () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  FileText:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  FileGeneric: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  ImageIco:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  FolderOpen:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
  ChevDown:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><polyline points="6 9 12 15 18 9"/></svg>,
  ChevRight:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><polyline points="9 18 15 12 9 6"/></svg>,
  Shield:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3 h-3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  ChevronRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-300 group-hover:text-[#4988C4] transition-colors"><polyline points="9 18 15 12 9 6"/></svg>,
};

// ── Shared Components ─────────────────────────
function ProgressBar({ value }) {
  const color = value === 100 ? C.darkBlue : value >= 75 ? C.blue : value >= 40 ? C.medBlue : C.lightBlue;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-100">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold w-8 text-right" style={{ color: C.darkBlue }}>{value}%</span>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Ic, color, loading, isActive, onClick }) {
  return (
    <button onClick={onClick}
      className={`relative bg-white rounded-xl p-4 flex items-start gap-3 text-left w-full transition-all duration-200 shadow-sm overflow-hidden
        ${isActive ? "border-2 shadow-md" : "border border-gray-100 hover:shadow-md hover:border-blue-100 hover:-translate-y-0.5"}`}
      style={isActive ? { borderColor: color.bar, boxShadow: `0 4px 16px ${color.bar}22` } : {}}>
      {isActive && <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: color.bar }} />}
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color.iconBg, color: color.iconColor }}>
        <Ic />
      </div>
      <div>
        {loading
          ? <div className="h-6 w-10 rounded animate-pulse bg-[#BDE8F5] mb-1" />
          : <p className="text-xl font-bold" style={{ color: C.darkBlue }}>{value}</p>}
        <p className="text-xs font-medium text-gray-600 mt-0.5">{label}</p>
        <p className="text-[10px] text-gray-400">{sub}</p>
        {isActive && <p className="text-[10px] font-bold mt-0.5" style={{ color: color.bar }}>● Filtered</p>}
      </div>
    </button>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      {[55, 35, 28, 22].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-3 rounded animate-pulse bg-[#BDE8F5] mb-1.5" style={{ width: `${w}%` }} />
          <div className="h-2.5 rounded animate-pulse bg-[#BDE8F5]" style={{ width: `${w * 0.6}%` }} />
        </td>
      ))}
    </tr>
  );
}

function InfoTile({ icon: Ic, label, value }) {
  return (
    <div className="flex items-start gap-2.5 p-3 bg-gray-50/70 rounded-xl">
      <div className="mt-0.5 shrink-0 text-[#4988C4]"><Ic /></div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-700 truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api-synergy.nexcorealliance.com/api/v1";

const getFileUrl = (url) => {
  if (!url) return null;
  let clean = url.replace(/\/undefined\//g, "/").replace(/^undefined\//, "").replace(/^\/+/, "");
  if (clean.startsWith("http")) return clean;
  return `${API_BASE.replace("/api/v1", "")}/${clean}`;
};

// ── File Components ───────────────────────────
function FileRow({ file }) {
  const rawName = file._displayName || file.originalname || file.filename || file.name || file.fileName || "Unnamed file";
  const displayName = rawName.split("/").pop() || "Unnamed file";
  const { color, bg } = getFileColor(displayName);
  const ext = getExt(displayName).toUpperCase();
  const size = fmtSize(file.size || file.fileSize);
  const uploadedAt = (file.createdAt || file.uploadedAt) ? fmt(file.createdAt || file.uploadedAt) : null;
  const fileUrl = getFileUrl(file.url || file.fileUrl || file.path); 
console.log("file object:", file);

  const FileIc = () => {
    const e = getExt(displayName);
    if (["jpg","jpeg","png","gif","webp","svg","bmp"].includes(e)) return <Ico.ImageIco />;
    if (e === "pdf") return <Ico.FileText />;
    return <Ico.FileGeneric />;
  };

  return (
    <div className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 group transition-colors">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: bg, color }}>
        <FileIc />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: C.darkBlue }} title={displayName}>{displayName}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{[ext, size, uploadedAt].filter(Boolean).join(" · ")}</p>
      </div>
      {fileUrl && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
          <a href={fileUrl} target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-md hover:bg-[#e0eefa] text-[#4988C4]" title="View"
            onClick={(e) => e.stopPropagation()}><Ico.Eye /></a>
          {/* <a href={fileUrl} target="_blank" rel="noopener noreferrer" download={displayName}
            className="p-1.5 rounded-md hover:bg-[#e0eefa] text-[#4988C4]" title="Download"
            onClick={(e) => e.stopPropagation()}><Ico.Download /></a> */}
        </div>
      )}
    </div>
  );
}

function FolderNode({ name, node, depth = 0 }) {
  const [open, setOpen] = useState(true);
  const subFolders = Object.keys(node).filter((k) => k !== "__files");
  const files = node.__files || [];
  return (
    <div className={depth > 0 ? "ml-3 border-l border-gray-100 pl-2" : ""}>
      {name && (
        <button onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 py-1.5 text-xs font-semibold text-[#1C4D8D] hover:text-[#0F2854] w-full text-left group">
          <span className="text-gray-400 group-hover:text-[#4988C4] transition-colors">
            {open ? <Ico.ChevDown /> : <Ico.ChevRight />}
          </span>
          <span className="text-[#4988C4]"><Ico.FolderOpen /></span>
          <span className="truncate">{name}</span>
          <span className="ml-auto text-[10px] font-normal text-gray-400 shrink-0">{files.length} file{files.length !== 1 ? "s" : ""}</span>
        </button>
      )}
      {(open || !name) && (
        <>
          {files.map((f) => <FileRow key={f._id || f.url} file={f} />)}
          {subFolders.map((folder) => <FolderNode key={folder} name={folder} node={node[folder]} depth={depth + 1} />)}
        </>
      )}
    </div>
  );
}

function FilesSection({ projectId }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setFiles([]); setError(null); setLoading(false);
    if (!projectId || typeof projectId !== "string" || projectId.length < 10) return;
    let cancelled = false;
    setLoading(true);
    axiosInstance
      .get(`/project-files/${projectId}/files`)
      .then((res) => { if (!cancelled) setFiles(Array.isArray(res.data) ? res.data : (res.data.files ?? [])); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.message || "Failed to load files"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId]);

  const tree = buildTree(files);
  const rootFiles = tree.__files || [];
  const subFolders = Object.keys(tree).filter((k) => k !== "__files");

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[#4988C4]"><Ico.Paperclip /></span>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Project Files</p>
        </div>
        {!loading && !error && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0F2854] text-white">{files.length}</span>
        )}
      </div>
      {loading && (
        <div className="space-y-2">
          {[80, 60, 70].map((w, i) => (
            <div key={i} className="flex items-center gap-3 py-2 px-2">
              <div className="w-8 h-8 rounded-lg bg-[#e0eefa] animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 rounded animate-pulse bg-[#BDE8F5]" style={{ width: `${w}%` }} />
                <div className="h-2 rounded animate-pulse bg-[#BDE8F5]" style={{ width: `${w * 0.5}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && error && (
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 border border-red-100">⚠ {error}</p>
      )}
      {!loading && !error && files.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 gap-1.5 text-gray-300 rounded-xl bg-gray-50 border border-dashed border-gray-200">
          <Ico.Paperclip />
          <p className="text-xs font-medium text-gray-400">No files uploaded yet</p>
        </div>
      )}
      {!loading && !error && files.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-gray-50/50 px-2 py-1">
          {rootFiles.map((f) => <FileRow key={f._id || f.url} file={f} />)}
          {subFolders.map((folder) => <FolderNode key={folder} name={folder} node={tree[folder]} depth={1} />)}
        </div>
      )}
    </div>
  );
}

// ── Detail View ───────────────────────────────
function DetailView({ project, onBack }) {
  const currentPhase = project.phase || phaseFromStatus(project.status);
  const currentPhaseIdx = PHASES.indexOf(currentPhase);
  const progress = project.progress ?? 0;
  const trialStatus = project.trialStatus || "Not Started";
  const days = daysUntil(project.endDate);
  const ss = STATUS_STYLE[project.status] || STATUS_STYLE["initiated"];

  return (
    <div className="space-y-5 pb-10">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-all hover:shadow-sm bg-white">
          <Ico.Back />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: C.darkBlue }}>
            {project.projectId && <span className="text-[#4988C4] mr-2 border-r border-gray-200 pr-2">{project.projectId}</span>}
            {project.name}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Project Details & Files</p>
        </div>
      </div>

      {/* Project info card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Gradient progress strip */}
        <div className="h-1.5" style={{
          background: `linear-gradient(90deg, ${progress === 100 ? "#16a34a" : C.blue} ${progress}%, #f1f5f9 ${progress}%)`
        }} />
        <div className="p-5">
          {/* Status + phase row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${ss.bg} ${ss.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} />
                {fmtStatus(project.status)}
              </span>
              <span className="text-xs text-gray-400 font-medium">{progress}% Complete</span>
            </div>
            {project.phase && (
              <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full flex items-center gap-1">
                <Ico.Shield />{project.phase}
              </span>
            )}
          </div>

          {/* Info tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <InfoTile icon={Ico.Briefcase} label="Client" value={project.clientName} />
            {project.clientContact && <InfoTile icon={Ico.Phone} label="Contact" value={project.clientContact} />}
            {project.location && <InfoTile icon={Ico.MapPin} label="Location" value={project.location} />}
            <InfoTile icon={Ico.Calendar} label="Start Date" value={fmt(project.startDate)} />
            {project.endDate && (
              <InfoTile icon={Ico.Calendar} label="End Date"
                value={`${fmt(project.endDate)}${days !== null ? `  ·  ${days === 0 ? "✓ Delivered" : `${days} days left`}` : ""}`} />
            )}
            {resolveName(project.assignedMarketingExecutive) && (
              <InfoTile icon={Ico.User} label="Marketing Exec" value={resolveName(project.assignedMarketingExecutive)} />
            )}
            {resolveName(project.assignedInstallationIncharge) && (
              <InfoTile icon={Ico.User} label="Installation Incharge" value={resolveName(project.assignedInstallationIncharge)} />
            )}
            {project.assignedEngineers?.length > 0 && (
              <InfoTile icon={Ico.Users} label="Engineers"
                value={project.assignedEngineers.map(resolveName).filter(Boolean).join(", ") || "—"} />
            )}
            {resolveName(project.createdBy) && (
              <InfoTile icon={Ico.User} label="Created By" value={resolveName(project.createdBy)} />
            )}
            <InfoTile icon={Ico.Flask} label="Trial Status"
              value={`${trialStatus}${project.trialDate ? `  ·  ${fmt(project.trialDate)}` : ""}`} />
          </div>

          {project.description && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Description</p>
              <p className="text-sm text-gray-600 leading-relaxed">{project.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Phase timeline */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Phase Timeline</p>
        <div className="space-y-3">
          {PHASES.map((phase, i) => {
            const done = i < currentPhaseIdx;
            const current = i === currentPhaseIdx;
            return (
              <div key={phase} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: done ? C.darkBlue : current ? C.blue : "#f3f4f6", color: done || current ? C.white : "#9ca3af" }}>
                  {done ? "✓" : i + 1}
                </div>
                <p className={`text-sm font-medium ${current ? "text-[#0F2854]" : done ? "text-[#4988C4]" : "text-gray-400"}`}>
                  {phase}
                  {current && (
                    <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#e0eefa] text-[#1C4D8D]">In Progress</span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Files */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <FilesSection projectId={project._id} />
      </div>
    </div>
  );
}

// ── Hook ──────────────────────────────────────
function useAllProjects() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await axiosInstance.get("/projects");
      setData(Array.isArray(res.data) ? res.data : (res.data.data ?? []));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, refetch: load };
}

// ── Main ──────────────────────────────────────
export default function ProjectStatus() {
  const { data: projects, loading, error, refetch } = useAllProjects();
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [activeCard, setActiveCard] = useState(null);

  const selectedProject = projects.find((p) => p._id === selectedId) ?? null;

  // ── Detail view ──
  if (selectedId && selectedProject) {
    return <DetailView project={selectedProject} onBack={() => setSelectedId(null)} />;
  }

  const filters = ["All", "In Trial", "Scheduled", "Pending", "Completed", "Not Started"];
  const completed = projects.filter((p) => p.status === "completed").length;
  const avgProgress = projects.length
    ? Math.round(projects.reduce((a, p) => a + (p.progress ?? 0), 0) / projects.length) : 0;
  const inTrial = projects.filter((p) => p.trialStatus === "In Trial" || p.trialStatus === "Scheduled").length;
  const dueSoon = projects.filter((p) => { const d = daysUntil(p.endDate); return d !== null && d <= 7 && d > 0; }).length;

  const handleCardClick = (key) => {
    setActiveCard((prev) => {
      if (prev === key) { setFilter("All"); return null; }
      setFilter({ completed: "Completed", trial: "In Trial", dueSoon: "All" }[key] || "All");
      return key;
    });
  };

  const filtered = projects.filter((p) => {
    const ts = p.trialStatus || "Not Started";
    if (activeCard === "completed") return p.status === "completed";
    if (activeCard === "trial") return ts === "In Trial" || ts === "Scheduled";
    if (activeCard === "dueSoon") { const d = daysUntil(p.endDate); return d !== null && d <= 7 && d > 0; }
    const matchFilter = filter === "All" || ts === filter;
    const matchSearch = !search
      || p.name?.toLowerCase().includes(search.toLowerCase())
      || p.clientName?.toLowerCase().includes(search.toLowerCase())
      || p._id?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-5">
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-0.5">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {" · All Sites Active"}
          </p>
          <h1 className="text-xl font-bold" style={{ color: C.darkBlue }}>Project Tracking Status</h1>
        </div>
        <button onClick={refetch}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors bg-white border border-gray-200 text-gray-400">
          <Ico.Refresh />
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between bg-red-50 text-red-600 border border-red-200">
          <span>⚠ {error}</span>
          <button onClick={refetch} className="underline ml-3">Retry</button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Avg. Progress" value={`${avgProgress}%`} sub="Across all projects"
          icon={Ico.Wrench} color={{ bar: C.darkBlue, iconBg: "#e0eefa", iconColor: C.blue }}
          loading={loading} isActive={false} onClick={() => { setActiveCard(null); setFilter("All"); }} />
        <StatCard label="Completed" value={completed} sub="Fully delivered"
          icon={Ico.Check} color={{ bar: C.blue, iconBg: "#dcfce7", iconColor: "#16a34a" }}
          loading={loading} isActive={activeCard === "completed"} onClick={() => handleCardClick("completed")} />
        <StatCard label="Trial Active" value={inTrial} sub="In trial or scheduled"
          icon={Ico.Flask} color={{ bar: C.medBlue, iconBg: "#e0eefa", iconColor: C.medBlue }}
          loading={loading} isActive={activeCard === "trial"} onClick={() => handleCardClick("trial")} />
        <StatCard label="Due Soon" value={dueSoon} sub="Within 7 days"
          icon={Ico.Alert} color={{ bar: "#d97706", iconBg: "#fef3c7", iconColor: "#d97706" }}
          loading={loading} isActive={activeCard === "dueSoon"} onClick={() => handleCardClick("dueSoon")} />
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        {/* Toolbar */}
        <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 border-b border-gray-100">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[#4988C4]"><Ico.Filter /></span>
            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: C.darkBlue }}>All Projects</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#0F2854] text-white">{filtered.length}</span>
            {activeCard && (
              <button onClick={() => { setActiveCard(null); setFilter("All"); }}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#e0eefa] text-[#1C4D8D]">
                Clear ✕
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 w-full sm:w-52 bg-gray-50 border border-gray-200">
            <span className="text-gray-400"><Ico.Search /></span>
            <input placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none w-full placeholder-gray-300" style={{ color: C.darkBlue }} />
          </div>
        </div>

        {/* Filter pills */}
        <div className="px-5 py-3 flex gap-2 overflow-x-auto border-b border-gray-100">
          {filters.map((f) => (
            <button key={f} onClick={() => { setFilter(f); setActiveCard(null); }}
              className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border"
              style={{
                backgroundColor: filter === f && !activeCard ? C.darkBlue : "transparent",
                color: filter === f && !activeCard ? C.white : "#6b7280",
                borderColor: filter === f && !activeCard ? C.darkBlue : "#e5e7eb",
              }}>
              {f}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Project / Client", "Status", "Progress", "Due Date", "Trial", ""].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold uppercase tracking-wider px-5 py-3 whitespace-nowrap text-[#4988C4]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-sm text-gray-400">No projects match your search.</td>
                    </tr>
                  )
                  : filtered.map((p) => {
                    const days = daysUntil(p.endDate);
                    const phase = p.phase || phaseFromStatus(p.status);
                    const ts = p.trialStatus || "Not Started";
                    const ss = STATUS_STYLE[p.status] || STATUS_STYLE["initiated"];
                    return (
                      <tr key={p._id} onClick={() => setSelectedId(p._id)}
                        className="border-b border-gray-100 cursor-pointer hover:bg-[#f5f9ff] transition-colors group">
                        {/* Project name */}
                        <td className="px-5 py-4">
                          <p className="font-semibold text-sm group-hover:text-[#1C4D8D] transition-colors" style={{ color: C.darkBlue }}>
                            {p.projectId && <span className="text-[#4988C4] mr-1.5">{p.projectId}</span>}
                            {p.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{p.clientName}</p>
                        </td>
                        {/* Status */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${ss.bg} ${ss.text}`}>
                            <span className={`w-1 h-1 rounded-full ${ss.dot}`} />
                            {fmtStatus(p.status)}
                          </span>
                        </td>
                        {/* Progress */}
                        <td className="px-5 py-4 min-w-[150px]">
                          <ProgressBar value={p.progress ?? 0} />
                          <p className="text-[11px] mt-1 text-gray-400">{phase}</p>
                        </td>
                        {/* Due date */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {p.endDate ? (
                            <>
                              <p className="text-sm font-semibold" style={{ color: C.darkBlue }}>{fmt(p.endDate)}</p>
                              <p className={`text-xs mt-0.5 ${days === 0 ? "text-[#4988C4]" : days !== null && days <= 7 ? "text-amber-600 font-semibold" : "text-gray-400"}`}>
                                {days === 0 ? "✓ Delivered" : days !== null ? `${days} days left` : ""}
                              </p>
                            </>
                          ) : <span className="text-xs text-gray-400">No date set</span>}
                        </td>
                        {/* Trial */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${TRIAL_STYLE[ts] || "bg-gray-100 text-gray-400"}`}>
                            {ts}
                          </span>
                        </td>
                        {/* Arrow */}
                        <td className="px-4 py-4">
                          <Ico.ChevronRight />
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {/* Footer hint */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/60">
            <p className="text-xs text-gray-400">Click any row to view full project details & files</p>
          </div>
        )}
      </div>
    </div>
  );
}