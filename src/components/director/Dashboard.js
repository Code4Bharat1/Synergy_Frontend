"use client";
import { useState, useEffect, useCallback } from "react";
import { FolderKanban, AlertTriangle, DollarSign, Clock, MessageSquareWarning, TrendingUp, TrendingDown, ArrowRight, Loader } from "lucide-react";

// Config
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const getToken = () => typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// API calls
const api = {
  async fetchDashboardData() {
    const fetchApi = async (url) => {
      try {
        const res = await fetch(`${API_BASE}${url}`, { headers: authHeaders() });
        if (!res.ok) {
          console.error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
          return [];
        }
        const data = await res.json();
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.projects)) return data.projects;
        if (data && Array.isArray(data.documents)) return data.documents;
        if (data && Array.isArray(data.complaints)) return data.complaints;
        if (data && data.data && Array.isArray(data.data)) return data.data;
        return [];
      } catch (err) {
        console.error(`Error fetching ${url}:`, err);
        return [];
      }
    };

    const [projects, documents, complaints] = await Promise.all([
      fetchApi("/projects"),
      fetchApi("/documents"),
      fetchApi("/complaints")
    ]);

    return { projects, documents, complaints };
  }
};

const PRIORITY_STYLE = {
  high: "bg-red-50 text-red-500",
  medium: "bg-amber-50 text-amber-600",
  low: "bg-gray-100 text-gray-500",
  critical: "bg-red-100 text-red-600",
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, trend, up, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-extra-darkblue">{value}</p>
        <p className="text-sm font-medium text-gray-700 mt-0.5 leading-tight">{label}</p>
        <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${up ? "text-green-500" : "text-red-400"}`}>
          {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {trend}
        </div>
      </div>
    </div>
  );
}

// ── Mini progress bar ─────────────────────────────────────────────────────────
function MiniBar({ value, max, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold w-8 text-right" style={{ color }}>{value}d</span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DirectorDashboard() {
  const [data, setData] = useState({ projects: [], documents: [], complaints: [] });
  const [fetching, setFetching] = useState(true);

  const loadData = useCallback(async () => {
    setFetching(true);
    const dashboardData = await api.fetchDashboardData();
    setData(dashboardData);
    setFetching(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);


  // Derived Stats
  const activeProjects = data.projects.filter(p => p.status !== "completed");
  const totalActiveProjects = activeProjects.length;
  const projectsAtRisk = activeProjects.filter(p => p.status === "on-hold" || (p.complaints?.length > 3)); // Dummy condition for risk if not explicit
  const openComplaintsCount = data.complaints.filter(c => c.status === "open").length;
  const pendingApprovalsCount = data.documents.filter(d => (d.status || "pending") === "pending").length;

  const STATS = [
    { label: "Total Active Projects", value: totalActiveProjects, trend: "+2 this month", up: true, icon: FolderKanban, color: "bg-lightblue text-extra-blue" },
    { label: "Projects At Risk", value: projectsAtRisk.length, trend: "Requires attention", up: false, icon: AlertTriangle, color: "bg-red-50 text-red-500" },
    { label: "Pending Approvals", value: pendingApprovalsCount, trend: "Docs awaiting review", up: false, icon: Clock, color: "bg-orange-50 text-orange-500" },
    { label: "Open Complaints", value: openComplaintsCount, trend: "Requires action", up: false, icon: MessageSquareWarning, color: "bg-purple-50 text-purple-600" },
  ];

  const AT_RISK_PROJECTS_MAPPED = activeProjects
    .slice(0, 3) // Example dummy mapping using real projects
    .map(p => ({
      name: p.name,
      delay: Math.floor(Math.random() * 15),
      budgetOver: Math.floor(Math.random() * 20),
      complaints: 0,
      status: p.status === "on-hold" ? "At Risk" : "Budget Alert",
      id: p._id
    }));

  const PENDING_APPROVALS_MAPPED = data.documents
    .filter(d => (d.status || "pending") === "pending")
    .slice(0, 4)
    .map((doc, idx) => ({
      id: doc._id || `APR-00${idx}`,
      type: doc.documentType || "Document",
      project: doc.project?.name || doc.project || "Company Project",
      priority: idx % 2 === 0 ? "high" : "medium",
      amount: "N/A",
      age: "2d",
    }));

  if (fetching) return <div className="py-10 text-gray-500 text-sm flex gap-2 items-center"><Loader size={16} className="animate-spin" /> Loading director dashboard...</div>;

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-lg font-bold text-extra-darkblue">Director Dashboard</h2>
        <p className="text-sm text-gray-400 mt-0.5">Executive overview</p>
      </div>

      {/* Stats — 2 cols mobile, 4 desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* At Risk Projects */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-500" />
              <h3 className="text-sm font-bold text-extra-darkblue">Projects At Risk (Overview)</h3>
            </div>
            <a href="/director/project" className="text-xs font-semibold text-extra-blue hover:underline flex items-center gap-1">
              View all <ArrowRight size={11} />
            </a>
          </div>
          <div className="divide-y divide-gray-50">
            {AT_RISK_PROJECTS_MAPPED.map(p => (
              <div key={p.id} className="px-5 py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-extra-darkblue">{p.name}</p>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.status === "At Risk" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"}`}>
                    {p.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                  <div>
                    <p className="text-gray-400 mb-1">Estimated Delay</p>
                    <MiniBar value={p.delay} max={21} color="#ef4444" />
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Budget Over %</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(100, p.budgetOver * 5)}%` }} />
                      </div>
                      <span className="text-xs font-bold text-amber-600 w-8 text-right">{p.budgetOver}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {AT_RISK_PROJECTS_MAPPED.length === 0 && (
              <p className="px-5 py-6 text-sm text-center text-gray-400">No projects currently at risk.</p>
            )}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-orange-500" />
              <h3 className="text-sm font-bold text-extra-darkblue">Pending Approvals</h3>
            </div>
            <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">{PENDING_APPROVALS_MAPPED.length}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {PENDING_APPROVALS_MAPPED.map(a => (
              <div key={a.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-extra-blue truncate w-16">{a.id}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[a.priority] || PRIORITY_STYLE.medium}`}>{a.priority}</span>
                  </div>
                  <p className="text-sm font-semibold text-extra-darkblue mt-0.5">{a.type}</p>
                  <p className="text-xs text-gray-400">{a.project}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-gray-300">{a.age} ago</span>
                  <a href="/director/approvals" className="text-xs font-bold px-3 py-1.5 rounded-lg bg-extra-darkblue text-white hover:bg-extra-blue transition-colors">Review</a>
                </div>
              </div>
            ))}
            {PENDING_APPROVALS_MAPPED.length === 0 && (
              <p className="px-5 py-6 text-sm text-center text-gray-400">No pending approvals.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}