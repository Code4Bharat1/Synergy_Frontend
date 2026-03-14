"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// ── Config ────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Colors ────────────────────────────────────
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
  Clipboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  Wrench: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  Mail: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  ArrowRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
      <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  ),
};

// ── Data helpers ──────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const installTypeLabel = (status) => ({
  "installation": "Full Install",
  "testing":      "Inspection",
  "in-progress":  "Partial Setup",
}[status] || "Full Install");

const countAssignedEngineers = (projects) => {
  const ids = new Set();
  projects.forEach(p =>
    (p.assignedEngineers || []).forEach(e =>
      ids.add(typeof e === "object" ? e._id : e)
    )
  );
  return ids.size;
};

// ── Helpers ───────────────────────────────────
const levelBadge = (level) => ({
  High:   { bg: C.darkBlue,  color: C.white    },
  Medium: { bg: C.blue,      color: C.white    },
  Low:    { bg: C.lightBlue, color: C.darkBlue },
}[level] || { bg: C.lightBlue, color: C.darkBlue });

const statusBadge = (s) => ({
  "Pending Review":   { bg: C.lightBlue, color: C.darkBlue },
  "Docs Missing":     { bg: C.darkBlue,  color: C.white    },
  "Under Assessment": { bg: C.blue,      color: C.white    },
  "Full Install":     { bg: C.lightBlue, color: C.darkBlue },
  "Partial Setup":    { bg: "#d6ebf7",   color: C.blue     },
  "Inspection":       { bg: "#e8f3fb",   color: C.medBlue  },
  "initiated":        { bg: C.lightBlue, color: C.darkBlue },
  "in-progress":      { bg: "#d6ebf7",   color: C.blue     },
  "installation":     { bg: C.lightBlue, color: C.darkBlue },
  "testing":          { bg: "#e8f3fb",   color: C.medBlue  },
  "completed":        { bg: "#d4edda",   color: "#155724"  },
  "on-hold":          { bg: C.darkBlue,  color: C.white    },
}[s] || { bg: C.lightBlue, color: C.darkBlue });

// ── Reusable atoms ────────────────────────────
function Badge({ label, bg, color }) {
  return (
    <span
      style={{ backgroundColor: bg, color }}
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap capitalize"
    >
      {label}
    </span>
  );
}

function SkeletonRow({ cols = 5 }) {
  return (
    <tr style={{ borderBottom: `1px solid ${C.divider}` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 rounded animate-pulse" style={{ backgroundColor: C.lightBlue, width: `${60 + (i * 13) % 30}%` }} />
        </td>
      ))}
    </tr>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div className="mx-4 my-3 px-3 py-2 rounded-lg flex items-center justify-between text-xs font-medium"
      style={{ backgroundColor: "#fff0f0", color: "#b91c1c", border: "1px solid #fecaca" }}>
      <span>⚠ {message}</span>
      {onRetry && (
        <button onClick={onRetry} className="ml-3 underline hover:no-underline">Retry</button>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, icon: Ic, barColor, iconBg, iconColor, subColor, loading, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative bg-white rounded-xl p-4 flex flex-col gap-2 overflow-hidden shadow-sm text-left w-full transition-all"
      style={{
        border: isActive ? `2px solid ${barColor}` : `1px solid ${C.lightBlue}`,
        boxShadow: isActive ? `0 4px 16px ${barColor}30` : "0 1px 3px rgba(0,0,0,0.06)",
        cursor: "pointer",
        outline: "none",
      }}
    >
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: barColor }} />
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.dimText }}>{label}</span>
        <span className="p-1.5 rounded-lg" style={{ backgroundColor: iconBg, color: iconColor }}><Ic /></span>
      </div>
      {loading ? (
        <div className="h-7 w-16 rounded animate-pulse" style={{ backgroundColor: C.lightBlue }} />
      ) : (
        <div className="text-2xl font-bold tracking-tight" style={{ color: C.darkBlue }}>{value}</div>
      )}
      <div className="text-xs font-semibold" style={{ color: subColor }}>{sub}</div>
      {isActive && (
        <div className="text-[10px] font-bold mt-0.5" style={{ color: barColor }}>● Active filter</div>
      )}
    </button>
  );
}

function Card({ children, footer }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col"
      style={{ border: `1px solid ${C.lightBlue}` }}>
      <div className="flex-1 min-w-0">{children}</div>
      {footer && (
        <div className="px-4 py-3 flex justify-end" style={{ borderTop: `1px solid ${C.divider}` }}>
          {footer}
        </div>
      )}
    </div>
  );
}

function Thead({ cols }) {
  return (
    <tr style={{ backgroundColor: C.bg, borderBottom: `1px solid ${C.divider}` }}>
      {cols.map(h => (
        <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5 whitespace-nowrap"
          style={{ color: C.medBlue }}>{h}</th>
      ))}
    </tr>
  );
}

function HoverTr({ children }) {
  const [hov, setHov] = useState(false);
  return (
    <tr
      style={{ backgroundColor: hov ? C.bg : "transparent", borderBottom: `1px solid ${C.divider}` }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="transition-colors group"
    >
      {children}
    </tr>
  );
}

function SectionTitle({ title, count, countBg, loading, onRefresh }) {
  return (
    <div className="px-4 pt-4 pb-0 flex items-center gap-2">
      <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: C.darkBlue }}>{title}</h2>
      {loading ? (
        <div className="w-6 h-5 rounded-full animate-pulse" style={{ backgroundColor: C.lightBlue }} />
      ) : (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: countBg, color: C.white }}>
          {count}
        </span>
      )}
      {onRefresh && (
        <button onClick={onRefresh} className="ml-auto p-1 rounded hover:opacity-60 transition-opacity" style={{ color: C.medBlue }}>
          <Icon.Refresh />
        </button>
      )}
    </div>
  );
}

function ViewAll() {
  return (
    <button className="text-xs font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity"
      style={{ color: C.medBlue }}>
      View all <Icon.ArrowRight />
    </button>
  );
}

// ── Mobile cards ──────────────────────────────
function MobileProjectCard({ p }) {
  const sb = statusBadge(p.status);
  const rb = levelBadge("Medium");
  return (
    <div className="px-4 py-3 flex flex-col gap-2" style={{ borderBottom: `1px solid ${C.divider}` }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold mt-0.5" style={{ color: C.darkBlue }}>
            {p.projectId && <span style={{ color: C.medBlue, marginRight: "6px" }}>{p.projectId}</span>}
            {p.name}
          </p>
          <p className="text-xs" style={{ color: C.mutedText }}>{p.clientName}</p>
        </div>
        <Badge label="Medium" bg={rb.bg} color={rb.color} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: C.dimText }}>{formatDate(p.createdAt)}</span>
        <Badge label={p.status} bg={sb.bg} color={sb.color} />
      </div>
    </div>
  );
}

function MobileInstallCard({ p }) {
  const type = installTypeLabel(p.status);
  const sb = statusBadge(type);
  const pb = levelBadge("Medium");
  const engineerName = p.assignedInstallationIncharge?.name || p.assignedEngineers?.[0]?.name || "Unassigned";
  return (
    <div className="px-4 py-3 flex flex-col gap-2" style={{ borderBottom: `1px solid ${C.divider}` }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold mt-0.5" style={{ color: C.darkBlue }}>
            {p.projectId && <span style={{ color: C.medBlue, marginRight: "6px" }}>{p.projectId}</span>}
            {p.name}
          </p>
          <p className="text-xs" style={{ color: engineerName === "Unassigned" ? C.darkBlue : C.mutedText }}>
            {engineerName === "Unassigned" ? "— Unassigned" : engineerName}
          </p>
        </div>
        <Badge label="Medium" bg={pb.bg} color={pb.color} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: C.dimText }}>{formatDate(p.startDate)}</span>
        <Badge label={type} bg={sb.bg} color={sb.color} />
      </div>
    </div>
  );
}

// ── Custom hook ───────────────────────────────
function useProjects(status) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = status ? { status } : {};
      const res = await api.get("/projects", { params });
      const projects = Array.isArray(res.data) ? res.data : res.data.data ?? [];
      setData(projects);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

function useEngineers() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/engineers")
      .then(res => setData(Array.isArray(res.data) ? res.data : res.data.data ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

// ── Main ──────────────────────────────────────
export default function Dashboard() {
  const initiated    = useProjects("initiated");
  const installation = useProjects("installation");
  const engineers    = useEngineers();

  // "initiated" | "installation" | "engineers" | null (show all)
  const [activeFilter, setActiveFilter] = useState(null);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const unassignedInstalls = installation.data.filter(
    p => !p.assignedInstallationIncharge && (!p.assignedEngineers || p.assignedEngineers.length === 0)
  ).length;

  const assignedEngineersCount = countAssignedEngineers([...initiated.data, ...installation.data]);

  // Toggle filter: click active card → reset to null (show all)
  const handleStatClick = (key) => {
    setActiveFilter(prev => prev === key ? null : key);
  };

  // Visibility helpers
  const showInitiated    = activeFilter === null || activeFilter === "initiated";
  const showInstallation = activeFilter === null || activeFilter === "installation";

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      <main className="p-3 sm:p-0 md:p-5 space-y-4">

        {/* Page heading */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.medBlue }}>
            {today} · All Sites Active
          </p>
          <h1 className="text-xl font-bold mt-0.5" style={{ color: C.darkBlue }}>Service Team Dashboard</h1>
        </div>

        {/* ── Stat Cards (clickable filters) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard
            label="Projects Initiated"
            value={initiated.data.length}
            sub={`+${initiated.data.filter(p => {
              const d = new Date(p.createdAt);
              const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
              return d >= weekAgo;
            }).length} this week`}
            icon={Icon.Clipboard}
            barColor={C.darkBlue} iconBg={C.darkBlue} iconColor={C.white} subColor={C.blue}
            loading={initiated.loading}
            isActive={activeFilter === "initiated"}
            onClick={() => handleStatClick("initiated")}
          />
          <StatCard
            label="Pending Installations"
            value={installation.data.length}
            sub={`${unassignedInstalls} unassigned`}
            icon={Icon.Wrench}
            barColor={C.blue} iconBg={C.blue} iconColor={C.white} subColor={C.blue}
            loading={installation.loading}
            isActive={activeFilter === "installation"}
            onClick={() => handleStatClick("installation")}
          />
          <StatCard
            label="Engineers Assigned"
            value={engineers.loading ? "…" : engineers.data.length}
            sub={`${assignedEngineersCount} on active projects`}
            icon={Icon.Users}
            barColor={C.lightBlue} iconBg={C.lightBlue} iconColor={C.darkBlue} subColor={C.medBlue}
            loading={engineers.loading}
            isActive={activeFilter === "engineers"}
            onClick={() => handleStatClick("engineers")}
          />
        </div>

        {/* ── Projects Initiated table (hidden when filtered to installation/engineers) ── */}
        {showInitiated && (
          <Card footer={<ViewAll />}>
            <SectionTitle
              title="Projects Initiated"
              count={initiated.data.length}
              countBg={C.darkBlue}
              loading={initiated.loading}
              onRefresh={initiated.refetch}
            />

            {initiated.error && <ErrorBanner message={initiated.error} onRetry={initiated.refetch} />}

            {/* Desktop table — Project ID column removed */}
            <div className="hidden md:block mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><Thead cols={["Project Name", "Client", "Submitted", "Status", "Risk", ""]} /></thead>
                <tbody>
                  {initiated.loading
                    ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
                    : initiated.data.length === 0 && !initiated.error
                      ? (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: C.dimText }}>No initiated projects found</td></tr>
                      )
                      : initiated.data.map(p => {
                        const sb = statusBadge(p.status);
                        const rb = levelBadge("Medium");
                        return (
                          <HoverTr key={p._id}>
                            <td className="px-4 py-3 font-medium whitespace-nowrap text-sm" style={{ color: C.darkBlue }}>
                              {p.projectId && <span style={{ color: C.medBlue, marginRight: "6px" }}>{p.projectId}</span>}
                              {p.name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: C.mutedText }}>{p.clientName}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: C.dimText }}>{formatDate(p.createdAt)}</td>
                            <td className="px-4 py-3 whitespace-nowrap"><Badge label={p.status} bg={sb.bg} color={sb.color} /></td>
                            <td className="px-4 py-3 whitespace-nowrap"><Badge label="Medium" bg={rb.bg} color={rb.color} /></td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <button className="text-xs font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: C.blue }}>
                                Review <Icon.ChevronRight />
                              </button>
                            </td>
                          </HoverTr>
                        );
                      })
                  }
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden mt-2">
              {initiated.loading
                ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-4 py-3" style={{ borderBottom: `1px solid ${C.divider}` }}>
                    <div className="h-3 rounded animate-pulse mb-2" style={{ backgroundColor: C.lightBlue, width: "40%" }} />
                    <div className="h-4 rounded animate-pulse mb-1" style={{ backgroundColor: C.lightBlue, width: "70%" }} />
                    <div className="h-3 rounded animate-pulse" style={{ backgroundColor: C.lightBlue, width: "50%" }} />
                  </div>
                ))
                : initiated.data.map(p => <MobileProjectCard key={p._id} p={p} />)
              }
            </div>
          </Card>
        )}

        {/* ── Pending Installations table (hidden when filtered to initiated/engineers) ── */}
        {showInstallation && (
          <Card footer={<ViewAll />}>
            <SectionTitle
              title="Pending Installations"
              count={installation.data.length}
              countBg={C.blue}
              loading={installation.loading}
              onRefresh={installation.refetch}
            />

            {installation.error && <ErrorBanner message={installation.error} onRetry={installation.refetch} />}

            {/* Desktop table — Project ID column removed */}
            <div className="hidden md:block mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><Thead cols={["Site", "Incharge", "Start Date", "Type", "Priority"]} /></thead>
                <tbody>
                  {installation.loading
                    ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                    : installation.data.length === 0 && !installation.error
                      ? (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: C.dimText }}>No pending installations</td></tr>
                      )
                      : installation.data.map(p => {
                        const type = installTypeLabel(p.status);
                        const sb = statusBadge(type);
                        const pb = levelBadge("Medium");
                        const incharge = p.assignedInstallationIncharge?.name
                          || p.assignedEngineers?.[0]?.name
                          || "Unassigned";
                        return (
                          <HoverTr key={p._id}>
                            <td className="px-4 py-3 font-medium whitespace-nowrap text-sm" style={{ color: C.darkBlue }}>
                              {p.projectId && <span style={{ color: C.medBlue, marginRight: "6px" }}>{p.projectId}</span>}
                              {p.name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {incharge === "Unassigned"
                                ? <span className="text-xs font-bold" style={{ color: C.darkBlue }}>— Unassigned</span>
                                : <span style={{ color: C.mutedText }}>{incharge}</span>}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: C.dimText }}>{formatDate(p.startDate)}</td>
                            <td className="px-4 py-3 whitespace-nowrap"><Badge label={type} bg={sb.bg} color={sb.color} /></td>
                            <td className="px-4 py-3 whitespace-nowrap"><Badge label="Medium" bg={pb.bg} color={pb.color} /></td>
                          </HoverTr>
                        );
                      })
                  }
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden mt-2">
              {installation.loading
                ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-4 py-3" style={{ borderBottom: `1px solid ${C.divider}` }}>
                    <div className="h-3 rounded animate-pulse mb-2" style={{ backgroundColor: C.lightBlue, width: "40%" }} />
                    <div className="h-4 rounded animate-pulse mb-1" style={{ backgroundColor: C.lightBlue, width: "70%" }} />
                    <div className="h-3 rounded animate-pulse" style={{ backgroundColor: C.lightBlue, width: "50%" }} />
                  </div>
                ))
                : installation.data.map(p => <MobileInstallCard key={p._id} p={p} />)
            }
            </div>
          </Card>
        )}

      </main>
    </div>
  );
}