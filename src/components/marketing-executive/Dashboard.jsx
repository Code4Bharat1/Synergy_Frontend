"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Clipboard, Wrench, Users, RefreshCw, ChevronRight, ArrowUpRight } from "lucide-react";

// ── Config ────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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

// ── Badge helpers ─────────────────────────────
const levelBadge = (level) => ({
  High:   { bg: "bg-[#0F2854] text-white" },
  Medium: { bg: "bg-[#1C4D8D] text-white" },
  Low:    { bg: "bg-[#BDE8F5] text-[#0F2854]" },
}[level] || { bg: "bg-[#BDE8F5] text-[#0F2854]" });

const statusBadge = (s) => ({
  "Pending Review":   "bg-[#BDE8F5] text-[#0F2854]",
  "Docs Missing":     "bg-[#0F2854] text-white",
  "Under Assessment": "bg-[#1C4D8D] text-white",
  "Full Install":     "bg-[#BDE8F5] text-[#0F2854]",
  "Partial Setup":    "bg-[#d6ebf7] text-[#1C4D8D]",
  "Inspection":       "bg-[#e8f3fb] text-[#4988C4]",
  "initiated":        "bg-amber-50 text-amber-600",
  "in-progress":      "bg-[#d6ebf7] text-[#1C4D8D]",
  "installation":     "bg-[#BDE8F5] text-[#0F2854]",
  "testing":          "bg-[#e8f3fb] text-[#4988C4]",
  "completed":        "bg-green-50 text-green-600",
  "on-hold":          "bg-[#0F2854] text-white",
}[s] || "bg-[#BDE8F5] text-[#0F2854]");

// ── Reusable atoms ────────────────────────────
function Badge({ label, className }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap capitalize ${className}`}>
      {label}
    </span>
  );
}

function SkeletonRow({ cols = 5 }) {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-3">
          <div className="h-3 rounded animate-pulse bg-[#BDE8F5]" style={{ width: `${60 + (i * 13) % 30}%` }} />
        </td>
      ))}
    </tr>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div className="mx-5 my-3 px-3 py-2 rounded-lg flex items-center justify-between text-xs font-medium bg-red-50 text-red-600 border border-red-200">
      <span>⚠ {message}</span>
      {onRetry && <button onClick={onRetry} className="ml-3 underline hover:no-underline">Retry</button>}
    </div>
  );
}

function StatCard({ label, value, sub, icon: Ic, iconClass, loading, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative bg-white rounded-xl p-5 flex items-start gap-4 text-left w-full transition-all duration-200 shadow-sm overflow-hidden
        ${isActive ? "border-2 border-[#1C4D8D] shadow-md" : "border border-gray-100 hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5"}
      `}
    >
      {isActive && <div className="absolute inset-x-0 top-0 h-[3px] bg-[#1C4D8D]" />}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}>
        <Ic size={18} />
      </div>
      <div>
        {loading
          ? <div className="h-7 w-12 rounded animate-pulse bg-[#BDE8F5] mb-1" />
          : <p className="text-2xl font-bold text-extra-darkblue">{value}</p>
        }
        <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
        {isActive && <p className="text-[10px] font-bold mt-1 text-[#1C4D8D]">● Active filter</p>}
      </div>
    </button>
  );
}

function HoverTr({ children }) {
  const [hov, setHov] = useState(false);
  return (
    <tr
      className={`border-b border-gray-100 transition-colors group ${hov ? "bg-gray-50" : ""}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </tr>
  );
}

// ── Mobile cards ──────────────────────────────
function MobileProjectCard({ p }) {
  return (
    <div className="px-5 py-3 flex flex-col gap-2 border-b border-gray-100">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold mt-0.5 text-extra-darkblue">
            {p.projectId && <span className="text-[#4988C4] mr-1.5">{p.projectId}</span>}
            {p.name}
          </p>
          <p className="text-xs text-gray-400">{p.clientName}</p>
        </div>
        <Badge label="Medium" className={levelBadge("Medium").bg} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{formatDate(p.createdAt)}</span>
        <Badge label={p.status} className={statusBadge(p.status)} />
      </div>
    </div>
  );
}

function MobileInstallCard({ p }) {
  const type = installTypeLabel(p.status);
  const engineerName = p.assignedInstallationIncharge?.name || p.assignedEngineers?.[0]?.name || "Unassigned";
  return (
    <div className="px-5 py-3 flex flex-col gap-2 border-b border-gray-100">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold mt-0.5 text-extra-darkblue">
            {p.projectId && <span className="text-[#4988C4] mr-1.5">{p.projectId}</span>}
            {p.name}
          </p>
          <p className={`text-xs ${engineerName === "Unassigned" ? "font-bold text-extra-darkblue" : "text-gray-400"}`}>
            {engineerName === "Unassigned" ? "— Unassigned" : engineerName}
          </p>
        </div>
        <Badge label="Medium" className={levelBadge("Medium").bg} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{formatDate(p.startDate)}</span>
        <Badge label={type} className={statusBadge(type)} />
      </div>
    </div>
  );
}

// ── Custom hooks ──────────────────────────────
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

  const [activeFilter, setActiveFilter] = useState(null);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const unassignedInstalls = installation.data.filter(
    p => !p.assignedInstallationIncharge && (!p.assignedEngineers || p.assignedEngineers.length === 0)
  ).length;

  const assignedEngineersCount = countAssignedEngineers([...initiated.data, ...installation.data]);

  const handleStatClick = (key) => {
    setActiveFilter(prev => prev === key ? null : key);
  };

  const showInitiated    = activeFilter === null || activeFilter === "initiated";
  const showInstallation = activeFilter === null || activeFilter === "installation";

  return (
    <div className="space-y-6">

      {/* Page heading */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#4988C4]">
          {today} · All Sites Active
        </p>
        <h1 className="text-lg font-bold mt-0.5 text-extra-darkblue">Service Team Dashboard</h1>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Projects Initiated"
          value={initiated.data.length}
          sub={`+${initiated.data.filter(p => {
            const d = new Date(p.createdAt);
            const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
            return d >= weekAgo;
          }).length} this week`}
          icon={Clipboard}
          iconClass="bg-[#e0eefa] text-[#1C4D8D]"
          loading={initiated.loading}
          isActive={activeFilter === "initiated"}
          onClick={() => handleStatClick("initiated")}
        />
        <StatCard
          label="Pending Installations"
          value={installation.data.length}
          sub={`${unassignedInstalls} unassigned`}
          icon={Wrench}
          iconClass="bg-[#e0eefa] text-[#1C4D8D]"
          loading={installation.loading}
          isActive={activeFilter === "installation"}
          onClick={() => handleStatClick("installation")}
        />
        <StatCard
          label="Engineers Assigned"
          value={engineers.loading ? "…" : engineers.data.length}
          sub={`${assignedEngineersCount} on active projects`}
          icon={Users}
          iconClass="bg-[#BDE8F5] text-[#0F2854]"
          loading={engineers.loading}
          isActive={activeFilter === "engineers"}
          onClick={() => handleStatClick("engineers")}
        />
      </div>

      {/* ── Projects Initiated ── */}
      {showInitiated && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-extra-darkblue">Projects Initiated</h2>
              {initiated.loading
                ? <div className="w-6 h-5 rounded-full animate-pulse bg-[#BDE8F5]" />
                : <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#0F2854] text-white">{initiated.data.length}</span>
              }
            </div>
            <button onClick={initiated.refetch} className="p-1 rounded hover:opacity-60 transition-opacity text-[#4988C4]">
              <RefreshCw size={14} />
            </button>
          </div>

          {initiated.error && <ErrorBanner message={initiated.error} onRetry={initiated.refetch} />}

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Project Name", "Client", "Submitted", "Status", "Risk", ""].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-2.5 whitespace-nowrap text-[#4988C4]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {initiated.loading
                  ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
                  : initiated.data.length === 0 && !initiated.error
                    ? <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">No initiated projects found</td></tr>
                    : initiated.data.map(p => (
                        <HoverTr key={p._id}>
                          <td className="px-5 py-3 font-medium whitespace-nowrap text-sm text-extra-darkblue">
                            {p.projectId && <span className="text-[#4988C4] mr-1.5">{p.projectId}</span>}
                            {p.name}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-500">{p.clientName}</td>
                          <td className="px-5 py-3 whitespace-nowrap text-xs text-gray-400">{formatDate(p.createdAt)}</td>
                          <td className="px-5 py-3 whitespace-nowrap"><Badge label={p.status} className={statusBadge(p.status)} /></td>
                          <td className="px-5 py-3 whitespace-nowrap"><Badge label="Medium" className={levelBadge("Medium").bg} /></td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <button className="text-xs font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-[#1C4D8D]">
                              Review <ChevronRight size={13} />
                            </button>
                          </td>
                        </HoverTr>
                      ))
                }
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden">
            {initiated.loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-5 py-3 border-b border-gray-100">
                    <div className="h-3 rounded animate-pulse bg-[#BDE8F5] mb-2 w-2/5" />
                    <div className="h-4 rounded animate-pulse bg-[#BDE8F5] mb-1 w-3/5" />
                    <div className="h-3 rounded animate-pulse bg-[#BDE8F5] w-1/2" />
                  </div>
                ))
              : initiated.data.map(p => <MobileProjectCard key={p._id} p={p} />)
            }
          </div>

          <div className="px-5 py-3 flex justify-end border-t border-gray-100">
            <button className="text-xs font-semibold flex items-center gap-1 text-[#4988C4] hover:opacity-70 transition-opacity">
              View all <ArrowUpRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* ── Pending Installations ── */}
      {showInstallation && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-extra-darkblue">Pending Installations</h2>
              {installation.loading
                ? <div className="w-6 h-5 rounded-full animate-pulse bg-[#BDE8F5]" />
                : <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#1C4D8D] text-white">{installation.data.length}</span>
              }
            </div>
            <button onClick={installation.refetch} className="p-1 rounded hover:opacity-60 transition-opacity text-[#4988C4]">
              <RefreshCw size={14} />
            </button>
          </div>

          {installation.error && <ErrorBanner message={installation.error} onRetry={installation.refetch} />}

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Site", "Incharge", "Start Date", "Type", "Priority"].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-2.5 whitespace-nowrap text-[#4988C4]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {installation.loading
                  ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                  : installation.data.length === 0 && !installation.error
                    ? <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">No pending installations</td></tr>
                    : installation.data.map(p => {
                        const type = installTypeLabel(p.status);
                        const incharge = p.assignedInstallationIncharge?.name || p.assignedEngineers?.[0]?.name || "Unassigned";
                        return (
                          <HoverTr key={p._id}>
                            <td className="px-5 py-3 font-medium whitespace-nowrap text-sm text-extra-darkblue">
                              {p.projectId && <span className="text-[#4988C4] mr-1.5">{p.projectId}</span>}
                              {p.name}
                            </td>
                            <td className="px-5 py-3 whitespace-nowrap text-sm">
                              {incharge === "Unassigned"
                                ? <span className="text-xs font-bold text-extra-darkblue">— Unassigned</span>
                                : <span className="text-gray-500">{incharge}</span>}
                            </td>
                            <td className="px-5 py-3 whitespace-nowrap text-xs text-gray-400">{formatDate(p.startDate)}</td>
                            <td className="px-5 py-3 whitespace-nowrap"><Badge label={type} className={statusBadge(type)} /></td>
                            <td className="px-5 py-3 whitespace-nowrap"><Badge label="Medium" className={levelBadge("Medium").bg} /></td>
                          </HoverTr>
                        );
                      })
                }
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden">
            {installation.loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-5 py-3 border-b border-gray-100">
                    <div className="h-3 rounded animate-pulse bg-[#BDE8F5] mb-2 w-2/5" />
                    <div className="h-4 rounded animate-pulse bg-[#BDE8F5] mb-1 w-3/5" />
                    <div className="h-3 rounded animate-pulse bg-[#BDE8F5] w-1/2" />
                  </div>
                ))
              : installation.data.map(p => <MobileInstallCard key={p._id} p={p} />)
            }
          </div>

          <div className="px-5 py-3 flex justify-end border-t border-gray-100">
            <button className="text-xs font-semibold flex items-center gap-1 text-[#4988C4] hover:opacity-70 transition-opacity">
              View all <ArrowUpRight size={12} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}