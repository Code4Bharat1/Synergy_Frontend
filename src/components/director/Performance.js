"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw, Loader2, Users, BarChart3, Calendar, AlertTriangle,
  FileText, CheckCircle2, Clock, Activity, IndianRupee, FlaskConical,
  Search, ChevronRight, ArrowUpRight, ArrowDownRight, Circle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend, LineChart, Line,
  PieChart, Pie, AreaChart, Area, ReferenceLine, ComposedChart,
} from "recharts";
import axiosInstance from "../../lib/axios";

// ── API ───────────────────────────────────────────────────────────────────────
const apiFetch = async (path) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const res = await axiosInstance({ method: "GET", url: path, headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return res.data;
};
const safeArr = (r, k) => r.status === "fulfilled" ? (Array.isArray(r.value) ? r.value : r.value?.[k] || r.value?.data || []) : [];

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  blue: "#1C4D8D", navy: "#0F2854", sky: "#4988C4",
  green: "#10b981", amber: "#f59e0b", red: "#ef4444",
  purple: "#8b5cf6", teal: "#14b8a6", pink: "#ec4899", gray: "#94a3b8",
};

const STATUS_COLOR = {
  initiated: C.gray, "in-progress": C.blue, installation: C.purple,
  testing: C.amber, completed: C.green, "on-hold": C.red,
};
const STATUS_BG = {
  initiated: "bg-gray-100 text-gray-500", "in-progress": "bg-blue-50 text-blue-600",
  installation: "bg-purple-50 text-purple-600", testing: "bg-amber-50 text-amber-600",
  completed: "bg-emerald-50 text-emerald-600", "on-hold": "bg-red-50 text-red-500",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtCr = (n) => {
  if (!n) return "₹0";
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)} L`;
  return `₹${n?.toLocaleString("en-IN")}`;
};
const daysDiff = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const today = new Date();

const timing = (p) => {
  if (!p.endDate) return "no-deadline";
  if (p.status === "completed") return "completed";
  const d = daysDiff(today, new Date(p.endDate));
  if (d < 0) return "delayed";
  if (d <= 14) return "at-risk";
  return "on-track";
};
const timingColor = (t) => ({ delayed: C.red, "at-risk": C.amber, completed: C.green, "on-track": C.blue, "no-deadline": C.gray })[t] || C.gray;

// ── Custom tooltip ─────────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-xl px-3.5 py-2.5 text-xs min-w-[140px]">
      {label && <p className="font-bold text-gray-700 mb-1.5 truncate max-w-[200px]">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5" style={{ color: p.color || p.fill || p.stroke }}>
            <Circle size={7} fill="currentColor" strokeWidth={0} /> {p.name}
          </span>
          <span className="font-bold text-gray-800">{currency ? fmtCr(p.value) : p.value?.toLocaleString?.() ?? p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 min-w-0">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xl font-bold text-[#0F2854] leading-tight">{value}</p>
        <p className="text-xs font-medium text-gray-500 leading-tight truncate">{label}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────
function Card({ title, sub, icon: Icon, iconCls, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconCls}`}><Icon size={14} /></div>
        <div>
          <h3 className="text-sm font-bold text-[#0F2854]">{title}</h3>
          {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PerformanceAnalytics() {
  const router = useRouter();
  const [projects, setProjects]   = useState([]);
  const [users, setUsers]         = useState([]);
  const [reports, setReports]     = useState([]);
  const [attendance, setAtt]      = useState([]);
  const [complaints, setCmp]      = useState([]);
  const [issues, setIssues]       = useState([]);
  const [trials, setTrials]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const load = useCallback(async () => {
    const [pR, uR, rR, aR, cR, iR, tR] = await Promise.allSettled([
      apiFetch("/projects"), apiFetch("/admin/users"), apiFetch("/reports/view-all"),
      apiFetch("/attendance/all"), apiFetch("/complaints"), apiFetch("/issues"), apiFetch("/trialqc"),
    ]);
    setProjects(safeArr(pR, "projects")); setUsers(safeArr(uR, "users"));
    setReports(safeArr(rR, "reports")); setAtt(safeArr(aR, "attendance"));
    setCmp(safeArr(cR, "complaints")); setIssues(safeArr(iR, "issues")); setTrials(safeArr(tR, "trials"));
  }, []);

  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load]);
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const completed   = projects.filter(p => p.status === "completed").length;
  const avgProgress = projects.length ? Math.round(projects.reduce((s, p) => s + (p.progress || 0), 0) / projects.length) : 0;
  const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);
  const totalActual = projects.reduce((s, p) => s + (p.actualCost || 0), 0);
  const overdue     = projects.filter(p => timing(p) === "delayed").length;
  const atRisk      = projects.filter(p => timing(p) === "at-risk").length;
  const openCmp     = complaints.filter(c => ["open", "in-progress"].includes(c.status)).length;

  // ── Timeline horizontal bars ───────────────────────────────────────────────
  const timelineData = projects
    .filter(p => p.startDate && p.endDate)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 12)
    .map(p => {
      const s = new Date(p.startDate), e = new Date(p.endDate);
      const total = Math.max(1, daysDiff(s, e));
      const elapsed = Math.min(daysDiff(s, today), total);
      const t = timing(p);
      return {
        name: p.name?.length > 16 ? p.name.slice(0, 14) + "…" : p.name,
        fullName: p.name, progress: p.progress || 0,
        elapsed, remaining: Math.max(0, total - elapsed),
        overdue: t === "delayed" ? Math.abs(daysDiff(today, e)) : 0,
        t, tColor: timingColor(t), status: p.status,
        startDate: s.toLocaleDateString("en-GB"), endDate: e.toLocaleDateString("en-GB"),
        daysLeft: daysDiff(today, e), id: p._id,
      };
    });

  // ── Progress over time: area chart ────────────────────────────────────────
  // Group projects by their start month, show avg progress per month
  const progressOverTime = (() => {
    const byMonth = {};
    projects.forEach(p => {
      if (!p.startDate) return;
      const key = new Date(p.startDate).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
      if (!byMonth[key]) byMonth[key] = { month: key, avg: 0, count: 0, total: 0 };
      byMonth[key].total += p.progress || 0;
      byMonth[key].count += 1;
    });
    return Object.values(byMonth).map(d => ({ ...d, avg: Math.round(d.total / d.count) })).slice(-8);
  })();

  // ── Budget vs Actual ───────────────────────────────────────────────────────
  const budgetData = projects
    .filter(p => p.budget > 0)
    .sort((a, b) => (b.budget || 0) - (a.budget || 0))
    .slice(0, 8)
    .map(p => ({
      name: p.name?.length > 12 ? p.name.slice(0, 10) + "…" : p.name,
      Budget: p.budget || 0, Actual: p.actualCost || 0,
      over: (p.actualCost || 0) > (p.budget || 0),
    }));

  // ── Report trend: line chart by month ─────────────────────────────────────
  const reportTrend = (() => {
    const byMonth = {};
    reports.forEach(r => {
      const key = new Date(r.createdAt || r.date || Date.now()).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
      if (!byMonth[key]) byMonth[key] = { month: key, Daily: 0, QC: 0, Safety: 0, SiteInspection: 0 };
      if (byMonth[key][r.reportType] !== undefined) byMonth[key][r.reportType]++;
    });
    return Object.values(byMonth).slice(-8);
  })();

  // ── Complaint trend ────────────────────────────────────────────────────────
  const complaintTrend = (() => {
    const byMonth = {};
    complaints.forEach(c => {
      const key = new Date(c.createdAt || Date.now()).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
      if (!byMonth[key]) byMonth[key] = { month: key, open: 0, resolved: 0 };
      if (c.status === "open" || c.status === "in-progress") byMonth[key].open++;
      if (c.status === "resolved" || c.status === "closed") byMonth[key].resolved++;
    });
    return Object.values(byMonth).slice(-8);
  })();

  // ── Attendance trend ───────────────────────────────────────────────────────
  const attTrend = (() => {
    const byMonth = {};
    attendance.forEach(a => {
      const key = new Date(a.date || a.createdAt || Date.now()).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
      if (!byMonth[key]) byMonth[key] = { month: key, present: 0, absent: 0, late: 0 };
      if (a.status === "present") byMonth[key].present++;
      else if (a.status === "absent") byMonth[key].absent++;
      else if (a.status === "late") byMonth[key].late++;
    });
    return Object.values(byMonth).slice(-8);
  })();

  // ── Status/Phase pie ───────────────────────────────────────────────────────
  const statusDist = ["initiated","in-progress","installation","testing","completed","on-hold"]
    .map(s => ({ name: s.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase()), raw: s, value: projects.filter(p => p.status === s).length, color: STATUS_COLOR[s] }))
    .filter(s => s.value > 0);

  const phaseColors = [C.sky, C.blue, C.amber, C.purple, C.teal, C.green];
  const phaseDist = ["Site Preparation","Wiring & Plumbing","Equipment Setup","Installation","Final Testing","Completed"]
    .map((ph, i) => ({ name: ph, value: projects.filter(p => p.phase === ph).length, color: phaseColors[i] }))
    .filter(p => p.value > 0);

  // ── Complaint summary ──────────────────────────────────────────────────────
  const cmpByPriority = ["low","medium","high","critical"].map((pr, i) => ({
    name: pr.charAt(0).toUpperCase() + pr.slice(1),
    value: complaints.filter(c => c.priority === pr).length,
    color: [C.gray, C.sky, C.amber, C.red][i],
  }));

  // ── Team ──────────────────────────────────────────────────────────────────
  const ROLES = [
    { key: "engineer", label: "Engineers", color: C.blue },
    { key: "installationIncharge", label: "Inst. Incharges", color: C.purple },
    { key: "marketingExecutive", label: "Mktg Executive", color: C.pink },
    { key: "marketingCoordinator", label: "Mktg Coordinator", color: C.amber },
    { key: "qualityControl", label: "QC", color: C.teal },
    { key: "support", label: "Support", color: C.sky },
  ];
  const teamData = ROLES.map(r => ({ ...r, count: users.filter(u => u.role === r.key).length }));

  // ── Filtered project list ─────────────────────────────────────────────────
  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    const mQ = !q || (p.name||"").toLowerCase().includes(q) || (p.clientName||"").toLowerCase().includes(q) || (p.location||"").toLowerCase().includes(q);
    const mS = statusFilter === "All" || p.status === statusFilter;
    return mQ && mS;
  });

  if (loading) return (
    <div className="flex items-center justify-center py-28 gap-3 text-gray-400">
      <Loader2 size={22} className="animate-spin text-[#1C4D8D]" />
      <span className="text-sm font-semibold">Loading Analytics…</span>
    </div>
  );

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#0F2854]">Performance Analytics</h2>
          <p className="text-sm text-gray-400 mt-0.5">Live data — zero mock values</p>
        </div>
        <button onClick={refresh} disabled={refreshing}
          className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50">
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Total Projects"  value={projects.length} icon={BarChart3}    color="bg-blue-50 text-blue-600" />
        <KpiCard label="Avg Progress"    value={`${avgProgress}%`} icon={Activity}   color="bg-indigo-50 text-indigo-600" />
        <KpiCard label="Completed"       value={completed}       icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" />
        <KpiCard label="Overdue"         value={overdue}         icon={AlertTriangle} color="bg-red-50 text-red-500" sub={`+${atRisk} at risk`} />
        <KpiCard label="Total Budget"    value={fmtCr(totalBudget)} icon={IndianRupee} color="bg-amber-50 text-amber-600" />
        <KpiCard label="Open Complaints" value={openCmp}         icon={AlertTriangle} color="bg-pink-50 text-pink-600" />
      </div>

      {/* ── Project Timeline ── */}
      <Card title="Project Timeline — On-Track vs Delayed" sub="Colour = status. Red fill = overdue days. Click a project to view details." icon={Calendar} iconCls="bg-blue-50 text-blue-600">
        {timelineData.length === 0 ? (
          <div className="py-10 text-center text-gray-300 text-sm">No projects with start & end dates</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-4 text-xs font-semibold mb-4">
              {[{ color: C.green, label: "Completed" }, { color: C.blue, label: "On-Track" }, { color: C.amber, label: "At Risk (≤14d)" }, { color: C.red, label: "Delayed" }].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
                  <span className="text-gray-500">{l.label}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {timelineData.map((p, idx) => {
                const tot = (p.elapsed + p.remaining + p.overdue) || 1;
                return (
                  <div key={idx} className="cursor-pointer group" onClick={() => router.push(`/director/project/${p.id}`)}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${STATUS_BG[p.status] || "bg-gray-100 text-gray-500"}`}>{p.progress}%</span>
                        <span className="font-semibold text-[#0F2854] truncate group-hover:text-[#1C4D8D]" title={p.fullName}>{p.name}</span>
                      </div>
                      <div className="shrink-0 flex items-center gap-1 ml-2 text-gray-400">
                        <span>{p.startDate}</span><span className="text-gray-300">→</span>
                        <span className={p.t === "delayed" ? "text-red-500 font-bold" : ""}>{p.endDate}</span>
                        {p.t === "delayed" && <span className="text-red-500 font-bold text-[10px] ml-1">{p.overdue}d late</span>}
                        {p.t === "at-risk" && <span className="text-amber-500 font-bold text-[10px] ml-1">{p.daysLeft}d left</span>}
                      </div>
                    </div>
                    <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
                      <div style={{ width: `${(p.elapsed / tot) * 100}%`, background: p.tColor }} className="h-full transition-all duration-700" />
                      {p.remaining > 0 && <div style={{ width: `${(p.remaining / tot) * 100}%` }} className="h-full bg-gray-200" />}
                      {p.overdue > 0  && <div style={{ width: `${(p.overdue / tot) * 100}%`, background: "#fca5a5" }} className="h-full" />}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 pt-2 border-t border-gray-100 text-xs text-gray-400">
              <span>Overdue: <strong className="text-red-500">{overdue}</strong></span>
              <span>At-risk: <strong className="text-amber-500">{atRisk}</strong></span>
              <span>On-track: <strong className="text-blue-600">{projects.filter(p => timing(p) === "on-track").length}</strong></span>
            </div>
          </>
        )}
      </Card>

      {/* ── Average Progress Trend (Area Chart) ── */}
      <Card title="Average Project Progress Trend" sub="Avg progress % of projects starting each month — GET /projects" icon={TrendingUp} iconCls="bg-indigo-50 text-indigo-600">
        {progressOverTime.length < 2 ? (
          <div className="py-10 text-center text-gray-300 text-sm">Need at least 2 months of project data</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={progressOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="progGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.blue} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<ChartTip />} />
              <ReferenceLine y={avgProgress} stroke={C.sky} strokeDasharray="4 2" label={{ value: `Avg ${avgProgress}%`, position: "insideTopRight", fontSize: 10, fill: C.sky }} />
              <Area type="monotone" dataKey="avg" name="Avg Progress %" stroke={C.blue} strokeWidth={2.5} fill="url(#progGrad)" dot={{ r: 4, fill: C.blue }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* ── Budget vs Actual (Composed bar + line) ── */}
      <Card title="Project Budget vs Actual Cost" sub="Top 8 by budget. Green = within budget, Red = over budget — GET /projects" icon={IndianRupee} iconCls="bg-amber-50 text-amber-600">
        {budgetData.length === 0 ? (
          <div className="py-10 text-center text-gray-300 text-sm">No budget data</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={budgetData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => fmtCr(v)} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={58} />
                <Tooltip content={<ChartTip currency />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Budget" name="Budget" fill={C.sky} radius={[5, 5, 0, 0]} />
                <Bar dataKey="Actual" name="Actual Cost" radius={[5, 5, 0, 0]}>
                  {budgetData.map((d, i) => <Cell key={i} fill={d.over ? C.red : C.green} />)}
                </Bar>
                <Line type="monotone" dataKey="Budget" name="Budget Line" stroke={C.navy} strokeWidth={2} dot={false} strokeDasharray="5 3" />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="mt-3 flex flex-wrap gap-4 pt-2 border-t border-gray-100 text-xs text-gray-500">
              <span>Total Budget: <strong className="text-[#0F2854]">{fmtCr(totalBudget)}</strong></span>
              <span>Total Spent: <strong className={totalActual > totalBudget ? "text-red-500" : "text-emerald-600"}>{fmtCr(totalActual)}</strong></span>
              <span>Utilisation: <strong className="text-[#0F2854]">{totalBudget ? Math.round((totalActual / totalBudget) * 100) : 0}%</strong></span>
              <span>Over-Budget: <strong className="text-red-500">{budgetData.filter(d => d.over).length}</strong></span>
            </div>
          </>
        )}
      </Card>

      {/* ── Status + Phase ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Project Status Distribution" sub="GET /projects → project.status" icon={BarChart3} iconCls="bg-blue-50 text-blue-600">
          {statusDist.length === 0
            ? <div className="py-8 text-center text-gray-300 text-sm">No projects yet</div>
            : <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusDist} layout="vertical" barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="value" name="Projects" radius={[0, 5, 5, 0]}>
                    {statusDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          }
        </Card>

        <Card title="Project Phase Distribution" sub="GET /projects → project.phase" icon={Activity} iconCls="bg-purple-50 text-purple-600">
          {phaseDist.length === 0
            ? <div className="py-8 text-center text-gray-300 text-sm">No phase data</div>
            : <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={phaseDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={32} paddingAngle={3}>
                      {phaseDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  {phaseDist.map(d => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: d.color }} />
                      <span className="truncate">{d.name}</span>
                      <span className="ml-auto font-bold text-[#0F2854]">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
          }
        </Card>
      </div>

      {/* ── Report Trend Line ── */}
      <Card title="Monthly Report Submissions" sub="Line chart per report type — GET /reports/view-all" icon={FileText} iconCls="bg-purple-50 text-purple-600">
        {reportTrend.length === 0
          ? <div className="py-8 text-center text-gray-300 text-sm">No report data</div>
          : <ResponsiveContainer width="100%" height={220}>
              <LineChart data={reportTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={25} />
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Daily"         name="Daily"        stroke={C.blue}   strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="QC"            name="QC"           stroke={C.purple}  strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="Safety"        name="Safety"       stroke={C.amber}   strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="SiteInspection" name="Site Insp."  stroke={C.teal}    strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
        }
      </Card>

      {/* ── Complaint Trend ── */}
      <Card title="Monthly Complaints — Open vs Resolved" sub="Area chart — GET /complaints" icon={AlertTriangle} iconCls="bg-red-50 text-red-500">
        {complaintTrend.length === 0
          ? <div className="py-8 text-center text-gray-300 text-sm">No complaint data</div>
          : <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={complaintTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cmpOpen"  x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.red}   stopOpacity={0.2} />
                    <stop offset="95%" stopColor={C.red}  stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cmpResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.green} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={25} />
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="open"     name="Open"     stroke={C.red}   strokeWidth={2.5} fill="url(#cmpOpen)"     dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke={C.green} strokeWidth={2.5} fill="url(#cmpResolved)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
        }
      </Card>

      {/* ── Complaint Priority ── */}
      <Card title="Complaints by Priority" sub="GET /complaints → complaint.priority" icon={AlertTriangle} iconCls="bg-amber-50 text-amber-600">
        {complaints.length === 0
          ? <div className="py-8 text-center text-gray-300 text-sm">No complaints</div>
          : <ResponsiveContainer width="100%" height={180}>
              <BarChart data={cmpByPriority} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={25} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="value" name="Complaints" radius={[6, 6, 0, 0]}>
                  {cmpByPriority.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
        }
      </Card>

      {/* ── Attendance Trend ── */}
      <Card title="Monthly Attendance Trend" sub="Present / Absent / Late — GET /attendance/all" icon={Calendar} iconCls="bg-emerald-50 text-emerald-600">
        {attTrend.length === 0
          ? <div className="py-8 text-center text-gray-300 text-sm">No attendance records</div>
          : <ResponsiveContainer width="100%" height={210}>
              <LineChart data={attTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={25} />
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="present" name="Present" stroke={C.green}  strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="absent"  name="Absent"  stroke={C.red}    strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="late"    name="Late"    stroke={C.amber}  strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
        }
      </Card>

      {/* ── Issues + TrialQC ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Installation Issues" sub={`${issues.length} issues — GET /issues`} icon={AlertTriangle} iconCls="bg-amber-50 text-amber-600">
          {issues.length === 0 ? <div className="py-8 text-center text-gray-300 text-sm">No issues logged</div>
            : <ResponsiveContainer width="100%" height={170}>
                <BarChart data={[
                  { name: "Open",        value: issues.filter(i => i.status === "open").length,        color: C.red   },
                  { name: "In Progress", value: issues.filter(i => i.status === "in-progress").length, color: C.amber },
                  { name: "Resolved",    value: issues.filter(i => i.status === "resolved").length,    color: C.green },
                ]} barCategoryGap="40%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={25} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="value" name="Issues" radius={[6, 6, 0, 0]}>
                    {["open","in-progress","resolved"].map((_, i) => <Cell key={i} fill={[C.red, C.amber, C.green][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          }
        </Card>

        <Card title="Trial & QC Status" sub={`${trials.length} records — GET /trialqc`} icon={FlaskConical} iconCls="bg-purple-50 text-purple-600">
          {trials.length === 0 ? <div className="py-8 text-center text-gray-300 text-sm">No trial/QC records</div>
            : <ResponsiveContainer width="100%" height={170}>
                <BarChart data={[
                  { name: "Approved", value: trials.filter(t => t.status === "Approved").length, color: C.green  },
                  { name: "Pending",  value: trials.filter(t => t.status === "Pending").length,  color: C.amber  },
                  { name: "Rejected", value: trials.filter(t => t.status === "Rejected").length, color: C.red    },
                ]} barCategoryGap="40%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={25} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="value" name="Trials" radius={[6, 6, 0, 0]}>
                    {["Approved","Pending","Rejected"].map((_, i) => <Cell key={i} fill={[C.green, C.amber, C.red][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          }
        </Card>
      </div>

      {/* ── Team Strength ── */}
      <Card title="Team Strength by Role" sub="GET /admin/users" icon={Users} iconCls="bg-sky-50 text-sky-600">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {teamData.map(r => (
            <div key={r.key} className="text-center bg-gray-50 rounded-xl py-4 px-3 border border-gray-100">
              <p className="text-3xl font-bold" style={{ color: r.color }}>{r.count}</p>
              <p className="text-[11px] text-gray-500 mt-1 font-medium leading-tight">{r.label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">Total: <strong className="text-[#0F2854]">{users.length}</strong></p>
      </Card>

      {/* ── Project List ── */}
      <div>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600"><BarChart3 size={14} /></div>
            <h3 className="text-sm font-bold text-[#0F2854]">All Projects — Click to view analytics</h3>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#1C4D8D] text-gray-700" />
          </div>
          <div className="flex flex-wrap gap-1">
            {["All","initiated","in-progress","installation","testing","completed","on-hold"].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${statusFilter === f ? "bg-[#0F2854] text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-[#1C4D8D]"}`}>
                {f === "All" ? "All" : f.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0
          ? <div className="py-12 text-center text-gray-300 text-sm bg-white rounded-2xl border border-gray-100">No projects match your filter</div>
          : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(p => {
                const t = timing(p); const tc = timingColor(t);
                const budgetUsed = p.budget ? Math.round(((p.actualCost || 0) / p.budget) * 100) : 0;
                return (
                  <div key={p._id} onClick={() => router.push(`/director/project/${p._id}`)}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:border-[#1C4D8D] hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-[#1C4D8D] truncate">{p.name}</p>
                        <p className="text-xs text-gray-400 truncate">{p.clientName}{p.location ? ` · ${p.location}` : ""}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_BG[p.status] || "bg-gray-100 text-gray-500"}`}>
                          {(p.status||"").replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase())}
                        </span>
                        {t !== "no-deadline" && <span className="text-[10px] font-bold" style={{ color: tc }}>
                          {t === "delayed" ? `${Math.abs(daysDiff(today, new Date(p.endDate)))}d late` : t === "at-risk" ? `${daysDiff(today, new Date(p.endDate))}d left` : t === "completed" ? "Done" : "On Track"}
                        </span>}
                      </div>
                    </div>
                    {/* Progress bar mini */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Progress</span>
                        <span className="font-bold" style={{ color: tc }}>{p.progress || 0}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p.progress || 0}%`, background: tc }} />
                      </div>
                    </div>
                    {p.budget > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">Budget</span>
                          <span className={`font-bold ${budgetUsed > 100 ? "text-red-500" : "text-emerald-600"}`}>{budgetUsed}% · {fmtCr(p.actualCost || 0)} / {fmtCr(p.budget)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(120, budgetUsed)}%`, background: budgetUsed > 100 ? C.red : C.green }} />
                        </div>
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                      <div className="flex gap-3">
                        {p.phase && <span className="font-medium text-gray-500">{p.phase}</span>}
                        {p.endDate && <span className="flex items-center gap-1"><Clock size={10} />{new Date(p.endDate).toLocaleDateString("en-GB")}</span>}
                      </div>
                      <span className="font-semibold text-[#4988C4] flex items-center gap-1 group-hover:gap-2 transition-all">View analytics <ChevronRight size={12} /></span>
                    </div>
                  </div>
                );
              })}
            </div>
        }
      </div>
    </div>
  );
}

// Missing import for TrendingUp ─ add it
function TrendingUp({ size, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
