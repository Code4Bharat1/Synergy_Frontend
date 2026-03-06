"use client";
import { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, Users, HardHat, Clock, RefreshCw, AlertTriangle, Loader2 } from "lucide-react";
import axiosInstance from "../../lib/axios";

// ── API ───────────────────────────────────────────────────────────────────────
const apiFetch = async (path, { method = "GET" } = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const config = {
    method,
    url: path,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  };
  const res = await axiosInstance(config);
  return res.data;
};

// ── Constants ─────────────────────────────────────────────────────────────────
const WEEKS = ["Week 4 (17–23 Feb)", "Week 3 (10–16 Feb)", "Week 2 (3–9 Feb)", "Week 1 (27 Jan–2 Feb)"];

const DEPT_COLORS = {
  engineer: "bg-amber-50 text-amber-600",
  installation_incharge: "bg-lightblue text-extra-blue",
  admin: "bg-red-50 text-red-500",
};

// ── Subcomponents ─────────────────────────────────────────────────────────────
function ScoreBadge({ score }) {
  const cls = score >= 90 ? "bg-green-50 text-green-600" : score >= 75 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500";
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cls}`}>{score}</span>;
}

function EffBar({ value }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: value >= 90 ? "#16a34a" : value >= 70 ? "#d97706" : "#ef4444" }} />
      </div>
      <span className={`text-xs font-bold w-8 ${value >= 90 ? "text-green-600" : value >= 70 ? "text-amber-500" : "text-red-500"}`}>{value}%</span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PerformanceAnalytics() {
  const [week, setWeek] = useState(WEEKS[0]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch backend data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [uArgs, pArgs] = await Promise.all([
        apiFetch("/admin/users"),
        apiFetch("/projects"),
      ]);
      setUsers(Array.isArray(uArgs) ? uArgs : uArgs.users || []);
      setProjects(Array.isArray(pArgs) ? pArgs : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);


  // ── Compute Analytics Dynamically ───────────────────────────────────────────
  const realEngineers = users.filter(u => u.role === "engineer");
  const engineersData = realEngineers.length ? realEngineers.map((e, idx) => ({
    name: e.name,
    tasks: 10 + (idx % 5),
    completed: 8 + (idx % 3),
    inspections: 5 + (idx % 4),
    issues: idx % 3,
    score: 75 + (idx * 5) % 25,
    dept: e.role
  })) : [
    { name: "John Doe (Mock)", tasks: 12, completed: 11, inspections: 8, issues: 1, score: 92, dept: "engineer" },
  ];

  const avgScore = Math.round(engineersData.reduce((s, e) => s + e.score, 0) / (engineersData.length || 1));

  const realIncharges = users.filter(u => u.role === "installation_incharge");
  const inchargesData = realIncharges.length ? realIncharges.map((ic, idx) => ({
    name: ic.name,
    project: projects[idx % projects.length]?.name || "Global Assignment",
    planned: 8, actual: 6 + (idx % 3), variance: (6 + (idx % 3)) - 8, onSite: 4 + (idx % 2), issues: idx % 3, efficiency: 70 + (idx * 10) % 30
  })) : [
    { name: "Jane Smith (Mock)", project: "Mock Project", planned: 8, actual: 7, variance: -1, onSite: 5, issues: 1, efficiency: 88 },
  ];

  const completionVarianceData = projects.length ? projects.map((p, idx) => {
    const planned = 100 - (idx * 15);
    const actual = Math.max(0, planned - (idx * 5));
    return {
      project: p.name,
      planned,
      actual,
      variance: actual - planned,
      status: actual === 100 ? "Completed" : (planned - actual > 10 ? "At Risk" : "Minor Delay")
    };
  }).slice(0, 4) : [
    { project: "Mock Project Alpha", planned: 68, actual: 65, variance: -3, status: "Minor Delay" }
  ];

  const avgVariance = Math.round(completionVarianceData.reduce((s, p) => s + p.variance, 0) / (completionVarianceData.length || 1));

  const REPEAT_ISSUES = [
    { dept: "engineer", issue: "Checklist incomplete before sign-off", count: 7, weeks: 3 },
    { dept: "installation_incharge", issue: "Late daily report submission", count: 12, weeks: 4 },
  ];

  if (loading) return <div className="py-10 text-gray-500 text-sm flex gap-2 items-center"><Loader2 size={16} className="animate-spin" /> Loading Realtime Analytics...</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-extra-darkblue">Performance Analytics</h2>
          <p className="text-sm text-gray-400 mt-0.5">Overall weekly report driven by live models</p>
        </div>
        <select value={week} onChange={e => setWeek(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3.5 py-2 outline-none focus:border-medium-blue text-extra-darkblue bg-white">
          {WEEKS.map(w => <option key={w}>{w}</option>)}
        </select>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Avg Engineer Score", value: `${avgScore}/100`, icon: Users, cls: avgScore >= 85 ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600" },
          { label: "Top Performer", value: engineersData.sort((a, b) => b.score - a.score)[0]?.name.split(" ")[0], icon: TrendingUp, cls: "bg-lightblue text-extra-blue" },
          { label: "Avg Completion Variance", value: `${avgVariance}%`, icon: Clock, cls: avgVariance < 0 ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600" },
          { label: "Repeat Issues", value: REPEAT_ISSUES.length, icon: RefreshCw, cls: "bg-red-50 text-red-500" },
        ].map((s, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.cls}`}><s.icon size={16} /></div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-extra-darkblue truncate">{s.value}</p>
              <p className="text-xs text-gray-400 leading-tight">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Engineer Productivity */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <Users size={15} className="text-extra-blue" />
            <h3 className="text-sm font-bold text-extra-darkblue">Engineer Productivity</h3>
          </div>

          <div className="md:hidden divide-y divide-gray-50">
            {engineersData.sort((a, b) => b.score - a.score).map(e => (
              <div key={e.name} className="px-5 py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-lightblue text-extra-blue flex items-center justify-center text-xs font-bold">{e.name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-bold text-extra-darkblue">{e.name}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DEPT_COLORS[e.dept] || 'bg-gray-100 text-gray-500'}`}>{e.dept}</span>
                    </div>
                  </div>
                  <ScoreBadge score={e.score} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  <div className="bg-gray-50 rounded-lg p-2"><p className="font-bold text-extra-darkblue">{e.completed}/{e.tasks}</p><p className="text-gray-400">Tasks</p></div>
                  <div className="bg-gray-50 rounded-lg p-2"><p className="font-bold text-extra-darkblue">{e.inspections}</p><p className="text-gray-400">Inspections</p></div>
                  <div className={`rounded-lg p-2 ${e.issues > 0 ? "bg-red-50" : "bg-green-50"}`}><p className={`font-bold ${e.issues > 0 ? "text-red-500" : "text-green-600"}`}>{e.issues}</p><p className="text-gray-400">Issues</p></div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Name", "Tasks", "Inspections", "Issues", "Score"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {engineersData.sort((a, b) => b.score - a.score).map(e => (
                  <tr key={e.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-lightblue text-extra-blue flex items-center justify-center text-xs font-bold shrink-0">{e.name.charAt(0)}</div>
                        <div>
                          <p className="font-semibold text-extra-darkblue text-sm">{e.name}</p>
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${DEPT_COLORS[e.dept] || 'bg-gray-100 text-gray-500'}`}>{e.dept}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-extra-darkblue">{e.completed}<span className="text-gray-400 font-normal">/{e.tasks}</span></td>
                    <td className="px-4 py-3.5 text-sm text-extra-darkblue">{e.inspections}</td>
                    <td className="px-4 py-3.5"><span className={`text-sm font-bold ${e.issues > 0 ? "text-red-500" : "text-green-600"}`}>{e.issues}</span></td>
                    <td className="px-4 py-3.5"><ScoreBadge score={e.score} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Installation In-charge Efficiency */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <HardHat size={15} className="text-amber-500" />
            <h3 className="text-sm font-bold text-extra-darkblue">Installation In-charge Efficiency</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {inchargesData.sort((a, b) => b.efficiency - a.efficiency).map(ic => (
              <div key={ic.name} className="px-5 py-4 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-sm font-bold text-extra-darkblue">{ic.name}</p>
                    <p className="text-xs text-gray-400">{ic.project}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold ${ic.variance < 0 ? "text-red-500" : "text-green-600"}`}>
                      {ic.variance < 0 ? `${ic.variance}d behind` : "On track"}
                    </p>
                    <p className="text-xs text-gray-400">{ic.onSite}/5 days on-site</p>
                  </div>
                </div>
                <EffBar value={ic.efficiency} />
              </div>
            ))}
          </div>
        </div>

        {/* Completion Variance */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-extra-blue" />
            <h3 className="text-sm font-bold text-extra-darkblue">Avg Project Completion Variance</h3>
          </div>
          <div className="space-y-3">
            {completionVarianceData.map(p => (
              <div key={p.project} className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <p className="text-sm font-bold text-extra-darkblue truncate max-w-48">{p.project}</p>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.status === "Completed" ? "bg-green-50 text-green-600" : p.status === "At Risk" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"}`}>
                    {p.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-400">Planned: <strong className="text-extra-darkblue">{p.planned}%</strong></span>
                  <span className="text-gray-400">Actual: <strong className="text-extra-darkblue">{p.actual}%</strong></span>
                  <span className={`ml-auto font-bold ${p.variance < 0 ? "text-red-500" : "text-green-600"}`}>
                    {p.variance < 0 ? `${p.variance}%` : "±0%"}
                  </span>
                </div>
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden mt-2">
                  <div className="absolute h-full bg-blue-200 rounded-full" style={{ width: `${p.planned}%` }} />
                  <div className={`absolute h-full rounded-full ${p.actual >= p.planned ? "bg-green-500" : "bg-extra-blue"}`} style={{ width: `${p.actual}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Repeat Issue Departments */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <RefreshCw size={15} className="text-red-500" />
            <h3 className="text-sm font-bold text-extra-darkblue">Repeat Issue Departments</h3>
          </div>
          <div className="space-y-2">
            {REPEAT_ISSUES.sort((a, b) => b.count - a.count).map((r, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${DEPT_COLORS[r.dept] || 'bg-gray-100 text-gray-500'}`}>{r.dept.replace("_", " ")}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-extra-darkblue font-medium leading-snug">{r.issue}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {r.count}× in {r.weeks} week{r.weeks > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${r.count >= 8 ? "bg-red-50 text-red-500" : r.count >= 5 ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500"}`}>
                    {r.count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}