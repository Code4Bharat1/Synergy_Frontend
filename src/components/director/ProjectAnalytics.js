"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Loader2, Trench, CheckCircle2, TrendingUp, AlertTriangle, FileText,
  Clock, IndianRupee, Activity, Target, ShieldCheck, ShieldAlert
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from "recharts";
import axiosInstance from "../../lib/axios";

// ── API & Helpers ─────────────────────────────────────────────────────────────
const apiFetch = async (path) => {
  const t = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const r = await axiosInstance.get(path, { headers: t ? { Authorization: `Bearer ${t}` } : {} });
  return r.data;
};

const safeArr = (r, k) => r.status === "fulfilled" ? (Array.isArray(r.value) ? r.value : r.value?.[k] || r.value?.data || []) : [];
const fmtCr = (n) => {
  if (!n) return "₹0";
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)} L`;
  return `₹${n?.toLocaleString("en-IN")}`;
};

const C = {
  blue: "#1C4D8D", navy: "#0F2854", sky: "#4988C4",
  green: "#10b981", amber: "#f59e0b", red: "#ef4444",
  purple: "#8b5cf6", teal: "#14b8a6", gray: "#94a3b8"
};

// ── Tooltip ───────────────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs min-w-[120px]">
      {label && <p className="font-bold text-gray-700 mb-1.5">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between gap-3">
          <span className="flex items-center gap-1.5" style={{ color: p.color || p.fill || p.stroke }}>
            <span className="w-2 h-2 rounded-full" style={{ background: "currentColor" }} />
            {p.name}
          </span>
          <span className="font-bold text-gray-800">
            {currency ? fmtCr(p.value) : p.value?.toLocaleString?.() ?? p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ProjectAnalytics({ projectId, project }) {
  const [reports, setReports] = useState([]);
  const [complaints, setCmp] = useState([]);
  const [issues, setIssues] = useState([]);
  const [trials, setTrials] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!projectId) return;
    const [rR, cR, iR, tR] = await Promise.allSettled([
      apiFetch("/reports/view-all"), apiFetch("/complaints"),
      apiFetch("/issues"), apiFetch("/trialqc")
    ]);

    // Filter all endpoints to only include items belonging to this project
    const pId = projectId.toString();
    const isThisProj = (item) => {
      if (!item) return false;
      const ref = item.project?._id || item.project || item.projectId;
      return ref?.toString() === pId;
    };

    setReports(safeArr(rR, "reports").filter(isThisProj));
    setCmp(safeArr(cR, "complaints").filter(isThisProj));
    setIssues(safeArr(iR, "issues").filter(isThisProj));
    setTrials(safeArr(tR, "trials").filter(isThisProj));
  }, [projectId]);

  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
      <Loader2 size={18} className="animate-spin text-blue-500" />
      <span className="text-sm font-semibold">Loading project metrics…</span>
    </div>
  );

  // ── Derived Data ────────────────────────────────────────────────────────────
  const actCost = project?.actualCost || 0;
  const budget  = project?.budget || 0;
  const isOver  = actCost > budget && budget > 0;

  // Daily reports trend line
  const dailyReports = reports.filter(r => r.reportType === "Daily")
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const progressTrend = (() => {
    let lastProgress = 0;
    return dailyReports.map(r => {
      // Find progress entry if any, otherwise just plot by date to show submission frequency
      const date = new Date(r.date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short' });
      // If there's a numeric progress value we'd use it, otherwise this just tracks submissions
      return { date, count: 1 };
    }).reduce((acc, curr) => {
      const existing = acc.find(a => a.date === curr.date);
      if (existing) existing.count += curr.count;
      else acc.push(curr);
      return acc;
    }, []).slice(-15); // Last 15 days of reports
  })();

  // Report Submission Frequency Line Chart
  const submissionTrend = (() => {
    const byDate = {};
    reports.forEach(r => {
      const d = new Date(r.createdAt || r.date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short' });
      if (!byDate[d]) byDate[d] = { date: d, count: 0 };
      byDate[d].count++;
    });
    return Object.values(byDate).slice(-15);
  })();

  // Complaints / Issues by Status
  const probStats = [
    { name: "Open", value: complaints.filter(c => c.status === "open").length + issues.filter(i => i.status === "open").length, color: C.red },
    { name: "In Progress", value: complaints.filter(c => c.status === "in-progress").length + issues.filter(i => i.status === "in-progress").length, color: C.amber },
    { name: "Resolved", value: complaints.filter(c => c.status === "resolved" || c.status === "closed").length + issues.filter(i => i.status === "resolved").length, color: C.green },
  ];

  // Reports Breakdown
  const rptTypes = [
    { name: "Daily", value: reports.filter(r => r.reportType === "Daily").length, color: C.blue },
    { name: "QC", value: reports.filter(r => r.reportType === "QC").length, color: C.purple },
    { name: "Safety", value: reports.filter(r => r.reportType === "Safety").length, color: C.amber },
    { name: "Site Insp.", value: reports.filter(r => r.reportType === "SiteInspection").length, color: C.teal },
  ].filter(r => r.value > 0);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="mt-8 space-y-5 border-t border-gray-100 pt-8">
      <div className="flex items-center gap-2 mb-2">
        <Activity size={18} className="text-[#1C4D8D]" />
        <h2 className="text-lg font-bold text-[#0F2854]">Project Live Analytics</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* 1. Budget Tracker */}
        {budget > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
              <IndianRupee size={14} className={isOver ? "text-red-500" : "text-blue-500"} />
              Budget vs Actual Spend
            </h3>
            <div className="flex items-end justify-between mb-2">
              <div>
                <p className={`text-2xl font-bold ${isOver ? "text-red-600" : "text-emerald-600"}`}>
                  {fmtCr(actCost)} <span className="text-sm text-gray-400 font-medium line-through decoration-gray-300 ml-1">spent</span>
                </p>
                <p className="text-xs text-[#0F2854] font-semibold mt-1">out of {fmtCr(budget)} budget</p>
              </div>
              <div className="text-right">
                <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${isOver ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                  {Math.round((actCost/budget)*100)}% Used
                </span>
                {isOver && <p className="text-[10px] text-red-500 font-bold mt-1.5">{fmtCr(actCost - budget)} over</p>}
              </div>
            </div>
            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden mt-4">
              <div
                className="h-full transition-all duration-1000"
                style={{ width: `${Math.min(100, (actCost/budget)*100)}%`, background: isOver ? C.red : C.green }}
              />
            </div>
          </div>
        )}

        {/* 2. Submission Frequency (Line Chart) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-indigo-500" />
            Report Submissions (Last 15 active days)
          </h3>
          {submissionTrend.length < 2 ? (
            <div className="py-6 text-center text-xs text-gray-400">Not enough data to graph</div>
          ) : (
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={submissionTrend} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.blue} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={C.blue} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} hide />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="count" name="Reports" stroke={C.blue} fill="url(#subGrad)" strokeWidth={2} dot={{r: 3, fill: C.blue}} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 3. Problems / Roadblocks (Bar Chart) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500" />
            Issues & Complaints Status
          </h3>
          {(complaints.length + issues.length) === 0 ? (
            <div className="py-6 text-center flex flex-col items-center">
              <ShieldCheck size={24} className="text-emerald-400 mb-2" />
              <p className="text-xs text-gray-500">No issues reported</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={probStats} layout="vertical" barCategoryGap="25%" margin={{left: -20}}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" name="Count" radius={[0,4,4,0]}>
                  {probStats.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 4. Report Composition (Bar Chart) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
            <FileText size={14} className="text-purple-500" />
            Report Types Comparison
          </h3>
          {rptTypes.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400">No reports logged</div>
          ) : (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={rptTypes} barCategoryGap="30%" margin={{left: -25}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" name="Reports" radius={[4,4,0,0]}>
                  {rptTypes.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  );
}
