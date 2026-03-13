"use client";

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";


const C = {
  darkBlue:  "#0F2854",
  blue:      "#1C4D8D",
  medBlue:   "#4988C4",
  lightBlue: "#BDE8F5",
  bg:        "#f0f6fb",
  mutedText: "#6b89a5",
  dimText:   "#8fa3b8",
  white:     "#ffffff",
  divider:   "#e3eff8",
};

// ── Icons ─────────────────────────────────────
const Icon = {
  Bell: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  CheckCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
    </svg>
  ),
  AlertCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Wrench: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  Flask: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M9 3h6v7l3.5 6a2 2 0 01-1.74 3H7.24a2 2 0 01-1.74-3L9 10V3z" />
      <line x1="6" y1="14" x2="18" y2="14" />
    </svg>
  ),
  MapPin: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  User: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Filter: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  ),
};

// ── Helpers ───────────────────────────────────
const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const phaseFromStatus = (status) => ({
  initiated:    "Site Preparation",
  "in-progress":"Wiring & Plumbing",
  installation: "Installation",
  testing:      "Final Testing",
  completed:    "Completed",
  "on-hold":    "Site Preparation",
}[status] || "Site Preparation");

// ── Trial badge ───────────────────────────────
const trialBadgeMap = (status) => ({
  "Completed":   { bg: C.darkBlue,  color: C.white,    icon: Icon.CheckCircle },
  "In Trial":    { bg: C.blue,      color: C.white,    icon: Icon.Flask       },
  "Scheduled":   { bg: C.lightBlue, color: C.darkBlue, icon: Icon.Calendar    },
  "Pending":     { bg: "#d6ebf7",   color: C.blue,     icon: Icon.Clock       },
  "Not Started": { bg: C.bg,        color: C.dimText,  icon: Icon.AlertCircle },
}[status] || { bg: C.bg, color: C.dimText, icon: Icon.Clock });

// ── Sub-components ────────────────────────────
function ProgressBar({ value }) {
  const color =
    value === 100 ? C.darkBlue :
    value >= 75   ? C.blue     :
    value >= 40   ? C.medBlue  : C.lightBlue;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.divider }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-bold w-10 text-right" style={{ color: C.darkBlue }}>{value}%</span>
    </div>
  );
}

function TrialBadge({ status }) {
  const s = trialBadgeMap(status);
  const Ic = s.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.color }}>
      <Ic />{status}
    </span>
  );
}

function DaysPill({ days, date }) {
  const urgent = days <= 7 && days > 0;
  const done   = days === 0;
  return (
    <div>
      <p className="text-sm font-semibold" style={{ color: C.darkBlue }}>{date}</p>
      <p className="text-xs mt-0.5" style={{ color: done ? C.medBlue : urgent ? C.blue : C.dimText }}>
        {done ? "✓ Delivered" : `${days} days left`}
      </p>
    </div>
  );
}

// ── Stat Card (clickable filter) ──────────────
function StatCard({ label, value, sub, barColor, iconBg, iconColor, icon: Ic, loading, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative bg-white rounded-xl p-5 flex flex-col gap-2 shadow-sm overflow-hidden text-left w-full transition-all"
      style={{
        border: isActive ? `2px solid ${barColor}` : `1px solid ${C.lightBlue}`,
        boxShadow: isActive ? `0 4px 16px ${barColor}30` : "0 1px 3px rgba(0,0,0,0.06)",
        cursor: "pointer",
        outline: "none",
      }}
    >
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: barColor }} />
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.dimText }}>{label}</span>
        <span className="p-2 rounded-lg" style={{ backgroundColor: iconBg, color: iconColor }}><Ic /></span>
      </div>
      {loading
        ? <div className="h-8 w-16 rounded animate-pulse" style={{ backgroundColor: C.lightBlue }} />
        : <div className="text-3xl font-bold tracking-tight" style={{ color: C.darkBlue }}>{value}</div>
      }
      <div className="text-xs font-semibold" style={{ color: C.medBlue }}>{sub}</div>
      {isActive && (
        <div className="text-[10px] font-bold mt-0.5" style={{ color: barColor }}>● Active filter</div>
      )}
    </button>
  );
}

function HoverTr({ children, onClick, selected }) {
  const [hov, setHov] = useState(false);
  return (
    <tr
      style={{
        backgroundColor: selected ? `${C.lightBlue}60` : hov ? C.bg : "transparent",
        borderBottom: `1px solid ${C.divider}`,
        cursor: "pointer",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      className="transition-colors"
    >
      {children}
    </tr>
  );
}

function SkeletonRow() {
  return (
    <tr style={{ borderBottom: `1px solid ${C.divider}` }}>
      {[60, 40, 30, 25].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-3 rounded animate-pulse" style={{ backgroundColor: C.lightBlue, width: `${w}%` }} />
          <div className="h-3 rounded animate-pulse mt-1.5" style={{ backgroundColor: C.lightBlue, width: `${w * 0.6}%` }} />
        </td>
      ))}
    </tr>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div className="mx-5 my-3 px-3 py-2 rounded-lg flex items-center justify-between text-xs font-medium"
      style={{ backgroundColor: "#fff0f0", color: "#b91c1c", border: "1px solid #fecaca" }}>
      <span>⚠ {message}</span>
      {onRetry && <button onClick={onRetry} className="ml-3 underline hover:no-underline">Retry</button>}
    </div>
  );
}

// ── Detail Panel ──────────────────────────────
function DetailPanel({ project, onClose }) {
  if (!project) return null;

  const phases = ["Site Preparation", "Wiring & Plumbing", "Equipment Setup", "Installation", "Final Testing", "Completed"];
  const currentPhase = project.phase || phaseFromStatus(project.status);
  const currentPhaseIdx = phases.indexOf(currentPhase);
  const progress = project.progress ?? 0;
  const trialStatus = project.trialStatus || "Not Started";
  const days = project.endDate ? daysUntil(project.endDate) : null;

  const incharge =
    project.assignedInstallationIncharge?.name ||
    project.assignedEngineers?.[0]?.name ||
    "Unassigned";

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: `1px solid ${C.lightBlue}` }}>
      {/* Header */}
      <div className="px-6 py-4 flex items-start justify-between gap-3"
        style={{ borderBottom: `1px solid ${C.divider}`, backgroundColor: C.bg }}>
        <div>
          <h3 className="text-lg font-bold" style={{ color: C.darkBlue }}>{project.name}</h3>
          <p className="text-sm mt-0.5" style={{ color: C.mutedText }}>{project.clientName}</p>
        </div>
        <button onClick={onClose}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
          style={{ backgroundColor: C.lightBlue, color: C.darkBlue }}>
          Close
        </button>
      </div>

      <div className="px-6 py-5 space-y-6">

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold uppercase tracking-wide" style={{ color: C.darkBlue }}>Installation Progress</p>
            <span className="text-2xl font-bold" style={{ color: C.darkBlue }}>{progress}%</span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: C.divider }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                backgroundColor:
                  progress === 100 ? C.darkBlue :
                  progress >= 75   ? C.blue     :
                  progress >= 40   ? C.medBlue  : C.lightBlue,
              }} />
          </div>
          <p className="text-xs mt-1.5 font-medium" style={{ color: C.mutedText }}>
            Current phase: <span className="font-bold" style={{ color: C.blue }}>{currentPhase}</span>
          </p>
        </div>

        {/* Phase stepper */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: C.dimText }}>Phase Timeline</p>
          <div className="space-y-2">
            {phases.map((phase, i) => {
              const done    = i < currentPhaseIdx;
              const current = i === currentPhaseIdx;
              return (
                <div key={phase} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{
                      backgroundColor: done ? C.darkBlue : current ? C.blue : C.divider,
                      color: done || current ? C.white : C.dimText,
                    }}>
                    {done ? "✓" : i + 1}
                  </div>
                  <p className="text-sm font-medium" style={{ color: current ? C.darkBlue : done ? C.medBlue : C.dimText }}>
                    {phase}
                    {current && (
                      <span className="ml-2 text-[11px] font-bold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: C.lightBlue, color: C.blue }}>
                        In Progress
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              label: "Expected Completion",
              value: formatDate(project.endDate),
              sub: days === null ? "No date set" : days === 0 ? "Delivered" : `${days} days remaining`,
              icon: Icon.Calendar,
            },
            {
              label: "Trial Status",
              value: trialStatus,
              sub: project.trialDate ? `Trial: ${formatDate(project.trialDate)}` : "Date not set",
              icon: Icon.Flask,
            },
            {
              label: "Location",
              value: project.location || "Not specified",
              sub: "Site address",
              icon: Icon.MapPin,
            },
            {
              label: "Engineer",
              value: incharge,
              sub: "Assigned lead",
              icon: Icon.User,
            },
          ].map(({ label, value, sub, icon: MetaIc }) => (
            <div key={label} className="rounded-xl p-4" style={{ backgroundColor: C.bg, border: `1px solid ${C.divider}` }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span style={{ color: C.medBlue }}><MetaIc /></span>
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.dimText }}>{label}</p>
              </div>
              <p className="text-sm font-bold" style={{ color: C.darkBlue }}>{value}</p>
              <p className="text-[11px] mt-0.5" style={{ color: C.mutedText }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Hook ──────────────────────────────────────
function useAllProjects() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
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
export default function ProjectStatusTracking() {
  const { data: projects, loading, error, refetch } = useAllProjects();
  const [selected, setSelected]   = useState(null);
  const [filter, setFilter]       = useState("All");
  const [search, setSearch]       = useState("");
  const [activeCard, setActiveCard] = useState(null); // "completed" | "trial" | "dueSoon" | null

  // Auto-select first project once loaded
  useEffect(() => {
    if (projects.length > 0 && !selected) setSelected(projects[0]);
  }, [projects]);

  const filters = ["All", "In Trial", "Scheduled", "Pending", "Completed", "Not Started"];

  // Stats
  const completed  = projects.filter(p => p.status === "completed").length;
  const avgProgress = projects.length
    ? Math.round(projects.reduce((a, p) => a + (p.progress ?? 0), 0) / projects.length)
    : 0;
  const inTrial = projects.filter(p => p.trialStatus === "In Trial" || p.trialStatus === "Scheduled").length;
  const dueSoon = projects.filter(p => {
    const d = daysUntil(p.endDate);
    return d !== null && d <= 7 && d > 0;
  }).length;

  // Toggle stat card filter
  const handleCardClick = (key) => {
    setActiveCard(prev => {
      if (prev === key) { setFilter("All"); return null; }
      // Map card key → filter pill value
      const cardToFilter = {
        completed: "Completed",
        trial:     "In Trial",
        dueSoon:   "All", // no exact pill match — just reset pill, table filtered below
      };
      setFilter(cardToFilter[key] || "All");
      return key;
    });
  };

  const filtered = projects.filter(p => {
    const ts = p.trialStatus || "Not Started";

    // Stat card overrides
    if (activeCard === "completed") return p.status === "completed";
    if (activeCard === "trial")     return ts === "In Trial" || ts === "Scheduled";
    if (activeCard === "dueSoon") {
      const d = daysUntil(p.endDate);
      return d !== null && d <= 7 && d > 0;
    }

    const matchFilter = filter === "All" || ts === filter;
    const matchSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      p._id?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  }).filter(p => {
    // Search always applies even when card filter is active
    if (!activeCard) return true;
    return (
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      p._id?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      <main className="p-4 md:p-6 space-y-6">

        <div className="mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-0.5">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · All Sites Active
          </p>
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-blue-950">Project Tracking Status</h1>
            <button onClick={refetch} className="p-2 rounded-lg hover:opacity-60 transition-opacity" style={{ color: C.medBlue, backgroundColor: C.white, border: `1px solid ${C.lightBlue}` }}>
              <Icon.Refresh />
            </button>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between"
            style={{ backgroundColor: "#fff0f0", color: "#b91c1c", border: "1px solid #fecaca" }}>
            <span>⚠ {error}</span>
            <button onClick={refetch} className="underline ml-3">Retry</button>
          </div>
        )}

        {/* ── Stat Cards (clickable filters) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Avg. Progress" value={`${avgProgress}%`} sub="Across all projects"
            barColor={C.darkBlue} iconBg={C.darkBlue} iconColor={C.white} icon={Icon.Wrench}
            loading={loading}
            isActive={false}
            onClick={() => { setActiveCard(null); setFilter("All"); }}
          />
          <StatCard
            label="Completed" value={completed} sub="Fully delivered"
            barColor={C.blue} iconBg={C.blue} iconColor={C.white} icon={Icon.CheckCircle}
            loading={loading}
            isActive={activeCard === "completed"}
            onClick={() => handleCardClick("completed")}
          />
          <StatCard
            label="Trial Active" value={inTrial} sub="In trial or scheduled"
            barColor={C.medBlue} iconBg={C.medBlue} iconColor={C.white} icon={Icon.Flask}
            loading={loading}
            isActive={activeCard === "trial"}
            onClick={() => handleCardClick("trial")}
          />
          <StatCard
            label="Due Soon" value={dueSoon} sub="Within 7 days"
            barColor={C.lightBlue} iconBg={C.lightBlue} iconColor={C.darkBlue} icon={Icon.AlertCircle}
            loading={loading}
            isActive={activeCard === "dueSoon"}
            onClick={() => handleCardClick("dueSoon")}
          />
        </div>

        {/* Table + Detail split */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

          {/* Table */}
          <div className="xl:col-span-3 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col"
            style={{ border: `1px solid ${C.lightBlue}` }}>

            <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
              style={{ borderBottom: `1px solid ${C.divider}` }}>
              <div className="flex items-center gap-2 flex-1">
                <span style={{ color: C.medBlue }}><Icon.Filter /></span>
                <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: C.darkBlue }}>All Projects</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: C.darkBlue, color: C.white }}>
                  {filtered.length}
                </span>
                {activeCard && (
                  <button
                    onClick={() => { setActiveCard(null); setFilter("All"); }}
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: C.lightBlue, color: C.blue }}
                  >
                    Clear filter ✕
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 w-full sm:w-44"
                style={{ backgroundColor: C.bg, border: `1px solid ${C.lightBlue}` }}>
                <span style={{ color: C.medBlue }}><Icon.Search /></span>
                <input
                  placeholder="Search projects…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bg-transparent text-sm outline-none w-full placeholder-[#8fa3b8]"
                  style={{ color: C.darkBlue }}
                />
              </div>
            </div>

            {/* Filter pills */}
            <div className="px-5 py-3 flex gap-2 overflow-x-auto" style={{ borderBottom: `1px solid ${C.divider}` }}>
              {filters.map(f => (
                <button key={f} onClick={() => { setFilter(f); setActiveCard(null); }}
                  className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
                  style={{
                    backgroundColor: filter === f && !activeCard ? C.darkBlue : C.bg,
                    color:           filter === f && !activeCard ? C.white     : C.mutedText,
                    border: `1px solid ${filter === f && !activeCard ? C.darkBlue : C.divider}`,
                  }}>
                  {f}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: C.bg, borderBottom: `1px solid ${C.divider}` }}>
                    {["Project", "Progress", "Due Date", "Trial"].map(h => (
                      <th key={h} className="text-left text-xs font-semibold uppercase tracking-wider px-5 py-3 whitespace-nowrap"
                        style={{ color: C.medBlue }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                    : filtered.length === 0
                      ? (
                        <tr><td colSpan={4} className="text-center py-12 text-sm" style={{ color: C.dimText }}>
                          No projects match your search.
                        </td></tr>
                      )
                      : filtered.map(p => {
                          const days = daysUntil(p.endDate);
                          const phase = p.phase || phaseFromStatus(p.status);
                          const trialStatus = p.trialStatus || "Not Started";
                          return (
                            <HoverTr key={p._id} onClick={() => setSelected(p)} selected={selected?._id === p._id}>
                              {/* ── Project cell: ID removed, name is now the top line ── */}
                              <td className="px-5 py-4">
                                <p className="text-sm font-semibold" style={{ color: C.darkBlue }}>{p.name}</p>
                                <p className="text-xs mt-0.5" style={{ color: C.dimText }}>{p.clientName}</p>
                              </td>
                              <td className="px-5 py-4 min-w-[140px]">
                                <ProgressBar value={p.progress ?? 0} />
                                <p className="text-[11px] mt-1" style={{ color: C.dimText }}>{phase}</p>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                {p.endDate
                                  ? <DaysPill days={days} date={formatDate(p.endDate)} />
                                  : <span className="text-xs" style={{ color: C.dimText }}>No date set</span>
                                }
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <TrialBadge status={trialStatus} />
                              </td>
                            </HoverTr>
                          );
                        })
                  }
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail panel */}
          <div className="xl:col-span-2">
            {selected
              ? <DetailPanel project={selected} onClose={() => setSelected(null)} />
              : (
                <div className="bg-white rounded-2xl h-48 flex flex-col items-center justify-center gap-2 shadow-sm"
                  style={{ border: `1px solid ${C.lightBlue}` }}>
                  <span style={{ color: C.lightBlue }}><Icon.Wrench /></span>
                  <p className="text-sm font-medium" style={{ color: C.dimText }}>Select a project to view details</p>
                </div>
              )
            }
          </div>
        </div>
      </main>
    </div>
  );
}