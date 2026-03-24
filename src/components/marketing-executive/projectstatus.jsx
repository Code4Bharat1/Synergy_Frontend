"use client";

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";

const C = {
  darkBlue: "#0F2854",
  blue: "#1C4D8D",
  medBlue: "#4988C4",
  lightBlue: "#BDE8F5",
  bg: "#f0f6fb",
  mutedText: "#6b89a5",
  dimText: "#8fa3b8",
  white: "#ffffff",
  divider: "#e3eff8",
};

// ── Icons ─────────────────────────────────────
const Icon = {
  Bell: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="w-5 h-5"
    >
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  Search: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="w-4 h-4"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  Calendar: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="w-4 h-4"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  CheckCircle: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-4 h-4"
    >
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Clock: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="w-4 h-4"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  ),
  AlertCircle: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="w-4 h-4"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Wrench: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="w-4 h-4"
    >
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  Flask: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="w-4 h-4"
    >
      <path d="M9 3h6v7l3.5 6a2 2 0 01-1.74 3H7.24a2 2 0 01-1.74-3L9 10V3z" />
      <line x1="6" y1="14" x2="18" y2="14" />
    </svg>
  ),
  MapPin: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="w-4 h-4"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  User: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="w-4 h-4"
    >
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Filter: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="w-4 h-4"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  Refresh: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="w-4 h-4"
    >
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  ),
};

// ── Helpers ───────────────────────────────────
const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const phaseFromStatus = (status) =>
  ({
    initiated: "Site Preparation",
    "in-progress": "Wiring & Plumbing",
    installation: "Installation",
    testing: "Final Testing",
    completed: "Completed",
    "on-hold": "Site Preparation",
  })[status] || "Site Preparation";

// ── Trial badge ───────────────────────────────
const trialBadgeMap = (status) =>
  ({
    Completed: { bg: "bg-[#0F2854] text-white" },
    "In Trial": { bg: "bg-[#1C4D8D] text-white" },
    Scheduled: { bg: "bg-[#BDE8F5] text-[#0F2854]" },
    Pending: { bg: "bg-[#d6ebf7] text-[#1C4D8D]" },
    "Not Started": { bg: "bg-gray-100 text-gray-400" },
  })[status] || { bg: "bg-gray-100 text-gray-400" };

// ── Sub-components ────────────────────────────
function ProgressBar({ value }) {
  const color =
    value === 100
      ? C.darkBlue
      : value >= 75
        ? C.blue
        : value >= 40
          ? C.medBlue
          : C.lightBlue;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full overflow-hidden bg-gray-100">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-bold w-10 text-right text-extra-darkblue">
        {value}%
      </span>
    </div>
  );
}

function TrialBadge({ status }) {
  const s = trialBadgeMap(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap capitalize ${s.bg}`}
    >
      {status}
    </span>
  );
}

function DaysPill({ days, date }) {
  const urgent = days <= 7 && days > 0;
  const done = days === 0;
  return (
    <div>
      <p className="text-sm font-semibold text-extra-darkblue">{date}</p>
      <p
        className={`text-xs mt-0.5 ${done ? "text-[#4988C4]" : urgent ? "text-[#1C4D8D] font-semibold" : "text-gray-400"}`}
      >
        {done ? "✓ Delivered" : `${days} days left`}
      </p>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon: Ic,
  color,
  loading,
  isActive,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`relative bg-white rounded-xl p-5 flex items-start gap-4 text-left w-full transition-all duration-200 shadow-sm overflow-hidden
        ${isActive ? "border-2 shadow-md" : "border border-gray-100 hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5"}
      `}
      style={
        isActive
          ? { borderColor: color.bar, boxShadow: `0 4px 16px ${color.bar}25` }
          : {}
      }
    >
      {isActive && (
        <div
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ backgroundColor: color.bar }}
        />
      )}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: color.iconBg, color: color.iconColor }}
      >
        <Ic />
      </div>
      <div>
        {loading ? (
          <div className="h-7 w-12 rounded animate-pulse bg-[#BDE8F5] mb-1" />
        ) : (
          <p className="text-2xl font-bold text-extra-darkblue">{value}</p>
        )}
        <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
        {isActive && (
          <p
            className="text-[10px] font-bold mt-1"
            style={{ color: color.bar }}
          >
            ● Active filter
          </p>
        )}
      </div>
    </button>
  );
}

function HoverTr({ children, onClick, selected }) {
  const [hov, setHov] = useState(false);
  return (
    <tr
      className={`border-b border-gray-100 transition-colors cursor-pointer ${
        selected ? "bg-[#e0eefa]" : hov ? "bg-gray-50" : ""
      }`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      {[60, 40, 30, 25]?.map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div
            className="h-3 rounded animate-pulse bg-[#BDE8F5] mb-1.5"
            style={{ width: `${w}%` }}
          />
          <div
            className="h-3 rounded animate-pulse bg-[#BDE8F5]"
            style={{ width: `${w * 0.6}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div className="mx-5 my-3 px-3 py-2 rounded-lg flex items-center justify-between text-xs font-medium bg-red-50 text-red-600 border border-red-200">
      <span>⚠ {message}</span>
      {onRetry && (
        <button onClick={onRetry} className="ml-3 underline hover:no-underline">
          Retry
        </button>
      )}
    </div>
  );
}

// ── Detail Panel ──────────────────────────────
function DetailPanel({ project, onClose }) {
  if (!project) return null;

  const phases = [
    "Site Preparation",
    "Wiring & Plumbing",
    "Equipment Setup",
    "Installation",
    "Final Testing",
    "Completed",
  ];
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
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="px-6 py-4 flex items-start justify-between gap-3 border-b border-gray-100 bg-gray-50">
        <div>
          <h3 className="text-base font-bold text-extra-darkblue">
            {project.name}
          </h3>
          <p className="text-sm mt-0.5 text-gray-400">{project.clientName}</p>
        </div>
        <button
          onClick={onClose}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-100 bg-white border border-gray-200 text-gray-600"
        >
          Close
        </button>
      </div>

      <div className="px-6 py-5 space-y-6">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Installation Progress
            </p>
            <span className="text-2xl font-bold text-extra-darkblue">
              {progress}%
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full overflow-hidden bg-gray-100">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                backgroundColor:
                  progress === 100
                    ? C.darkBlue
                    : progress >= 75
                      ? C.blue
                      : progress >= 40
                        ? C.medBlue
                        : C.lightBlue,
              }}
            />
          </div>
          <p className="text-xs mt-1.5 text-gray-400">
            Current phase:{" "}
            <span className="font-bold text-[#1C4D8D]">{currentPhase}</span>
          </p>
        </div>

        {/* Phase stepper */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-3 text-gray-400">
            Phase Timeline
          </p>
          <div className="space-y-2">
            {phases?.map((phase, i) => {
              const done = i < currentPhaseIdx;
              const current = i === currentPhaseIdx;
              return (
                <div key={phase} className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{
                      backgroundColor: done
                        ? C.darkBlue
                        : current
                          ? C.blue
                          : "#f3f4f6",
                      color: done || current ? C.white : "#9ca3af",
                    }}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  <p
                    className={`text-sm font-medium ${current ? "text-extra-darkblue" : done ? "text-[#4988C4]" : "text-gray-400"}`}
                  >
                    {phase}
                    {current && (
                      <span className="ml-2 text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#e0eefa] text-[#1C4D8D]">
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
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Expected Completion",
              value: formatDate(project.endDate),
              sub:
                days === null
                  ? "No date set"
                  : days === 0
                    ? "Delivered"
                    : `${days} days remaining`,
              icon: Icon.Calendar,
            },
            {
              label: "Trial Status",
              value: trialStatus,
              sub: project.trialDate
                ? `Trial: ${formatDate(project.trialDate)}`
                : "Date not set",
              icon: Icon.Flask,
            },
            {
              label: "Location",
              value: project.location || "Not specified",
              sub: "Site address",
              icon: Icon?.mapPin,
            },
            {
              label: "Engineer",
              value: incharge,
              sub: "Assigned lead",
              icon: Icon.User,
            },
          ]?.map(({ label, value, sub, icon: MetaIc }) => (
            <div
              key={label}
              className="rounded-xl p-3.5 bg-gray-50 border border-gray-100"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[#4988C4]">
                  <MetaIc />
                </span>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  {label}
                </p>
              </div>
              <p className="text-sm font-bold text-extra-darkblue">{value}</p>
              <p className="text-[11px] mt-0.5 text-gray-400">{sub}</p>
            </div>
          ))}
        </div>
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

  useEffect(() => {
    load();
  }, [load]);
  return { data, loading, error, refetch: load };
}

// ── Main ──────────────────────────────────────
export default function ProjectStatusTracking() {
  const { data: projects, loading, error, refetch } = useAllProjects();
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [activeCard, setActiveCard] = useState(null);

  useEffect(() => {
    if (projects.length > 0 && !selected) setSelected(projects[0]);
  }, [projects]);

  const filters = [
    "All",
    "In Trial",
    "Scheduled",
    "Pending",
    "Completed",
    "Not Started",
  ];

  const completed = projects.filter((p) => p.status === "completed").length;
  const avgProgress = projects.length
    ? Math.round(
        projects.reduce((a, p) => a + (p.progress ?? 0), 0) / projects.length,
      )
    : 0;
  const inTrial = projects.filter(
    (p) => p.trialStatus === "In Trial" || p.trialStatus === "Scheduled",
  ).length;
  const dueSoon = projects.filter((p) => {
    const d = daysUntil(p.endDate);
    return d !== null && d <= 7 && d > 0;
  }).length;

  const handleCardClick = (key) => {
    setActiveCard((prev) => {
      if (prev === key) {
        setFilter("All");
        return null;
      }
      const cardToFilter = {
        completed: "Completed",
        trial: "In Trial",
        dueSoon: "All",
      };
      setFilter(cardToFilter[key] || "All");
      return key;
    });
  };

  const filtered = projects
    .filter((p) => {
      const ts = p.trialStatus || "Not Started";
      if (activeCard === "completed") return p.status === "completed";
      if (activeCard === "trial")
        return ts === "In Trial" || ts === "Scheduled";
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
    })
    .filter((p) => {
      if (!activeCard) return true;
      return (
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.clientName?.toLowerCase().includes(search.toLowerCase()) ||
        p._id?.toLowerCase().includes(search.toLowerCase())
      );
    });

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-0.5">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            · All Sites Active
          </p>
          <h1 className="text-xl font-bold text-extra-darkblue">
            Project Tracking Status
          </h1>
        </div>
        <button
          onClick={refetch}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors bg-white border border-gray-200 text-gray-400"
        >
          <Icon.Refresh />
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between bg-red-50 text-red-600 border border-red-200">
          <span>⚠ {error}</span>
          <button onClick={refetch} className="underline ml-3">
            Retry
          </button>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Avg. Progress"
          value={`${avgProgress}%`}
          sub="Across all projects"
          icon={Icon.Wrench}
          color={{ bar: C.darkBlue, iconBg: "#e0eefa", iconColor: C.blue }}
          loading={loading}
          isActive={false}
          onClick={() => {
            setActiveCard(null);
            setFilter("All");
          }}
        />
        <StatCard
          label="Completed"
          value={completed}
          sub="Fully delivered"
          icon={Icon.CheckCircle}
          color={{ bar: C.blue, iconBg: "#e0f0e8", iconColor: "#16a34a" }}
          loading={loading}
          isActive={activeCard === "completed"}
          onClick={() => handleCardClick("completed")}
        />
        <StatCard
          label="Trial Active"
          value={inTrial}
          sub="In trial or scheduled"
          icon={Icon.Flask}
          color={{ bar: C.medBlue, iconBg: "#e0eefa", iconColor: C.medBlue }}
          loading={loading}
          isActive={activeCard === "trial"}
          onClick={() => handleCardClick("trial")}
        />
        <StatCard
          label="Due Soon"
          value={dueSoon}
          sub="Within 7 days"
          icon={Icon.AlertCircle}
          color={{ bar: "#d97706", iconBg: "#fef3cd", iconColor: "#d97706" }}
          loading={loading}
          isActive={activeCard === "dueSoon"}
          onClick={() => handleCardClick("dueSoon")}
        />
      </div>

      {/* Table + Detail split */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Table */}
        <div className="xl:col-span-3 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col border border-gray-100">
          <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 border-b border-gray-100">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-[#4988C4]">
                <Icon.Filter />
              </span>
              <h2 className="text-sm font-bold uppercase tracking-wide text-extra-darkblue">
                All Projects
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#0F2854] text-white">
                {filtered.length}
              </span>
              {activeCard && (
                <button
                  onClick={() => {
                    setActiveCard(null);
                    setFilter("All");
                  }}
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#e0eefa] text-[#1C4D8D]"
                >
                  Clear filter ✕
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 w-full sm:w-44 bg-gray-50 border border-gray-200">
              <span className="text-gray-400">
                <Icon.Search />
              </span>
              <input
                placeholder="Search projects…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm outline-none w-full placeholder-gray-300 text-extra-darkblue"
              />
            </div>
          </div>

          {/* Filter pills */}
          <div className="px-5 py-3 flex gap-2 overflow-x-auto border-b border-gray-100">
            {filters?.map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setActiveCard(null);
                }}
                className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border"
                style={{
                  backgroundColor:
                    filter === f && !activeCard ? C.darkBlue : "transparent",
                  color: filter === f && !activeCard ? C.white : "#6b7280",
                  borderColor:
                    filter === f && !activeCard ? C.darkBlue : "#e5e7eb",
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Project", "Progress", "Due Date", "Trial"]?.map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold uppercase tracking-wider px-5 py-3 whitespace-nowrap text-[#4988C4]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 })?.map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-12 text-sm text-gray-400"
                    >
                      No projects match your search.
                    </td>
                  </tr>
                ) : (
                  filtered?.map((p) => {
                    const days = daysUntil(p.endDate);
                    const phase = p.phase || phaseFromStatus(p.status);
                    const trialStatus = p.trialStatus || "Not Started";
                    return (
                      <HoverTr
                        key={p._id}
                        onClick={() => setSelected(p)}
                        selected={selected?._id === p._id}
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-extra-darkblue">
                            {p.name}
                          </p>
                          <p className="text-xs mt-0.5 text-gray-400">
                            {p.clientName}
                          </p>
                        </td>
                        <td className="px-5 py-4 min-w-[140px]">
                          <ProgressBar value={p.progress ?? 0} />
                          <p className="text-[11px] mt-1 text-gray-400">
                            {phase}
                          </p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {p.endDate ? (
                            <DaysPill
                              days={days}
                              date={formatDate(p.endDate)}
                            />
                          ) : (
                            <span className="text-xs text-gray-400">
                              No date set
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <TrialBadge status={trialStatus} />
                        </td>
                      </HoverTr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        <div className="xl:col-span-2">
          {selected ? (
            <DetailPanel project={selected} onClose={() => setSelected(null)} />
          ) : (
            <div className="bg-white rounded-xl h-48 flex flex-col items-center justify-center gap-2 shadow-sm border border-gray-100">
              <span className="text-gray-300">
                <Icon.Wrench />
              </span>
              <p className="text-sm font-medium text-gray-400">
                Select a project to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
