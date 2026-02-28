"use client";
import { useState } from "react";
import { TrendingUp, TrendingDown, Users, HardHat, Clock, RefreshCw, AlertTriangle } from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────
const WEEKS = ["Week 4 (17–23 Feb)", "Week 3 (10–16 Feb)", "Week 2 (3–9 Feb)", "Week 1 (27 Jan–2 Feb)"];

const ENGINEER_DATA = {
  "Week 4 (17–23 Feb)": [
    { name: "Omar Sheikh",  tasks: 12, completed: 11, inspections: 8,  issues: 1, score: 92, dept: "Engineering" },
    { name: "Sara Malik",   tasks: 10, completed: 8,  inspections: 6,  issues: 2, score: 78, dept: "Engineering" },
    { name: "Bilal Khan",   tasks: 9,  completed: 9,  inspections: 7,  issues: 0, score: 96, dept: "Engineering" },
    { name: "Ahmad Raza",   tasks: 11, completed: 10, inspections: 9,  issues: 1, score: 88, dept: "QC"          },
    { name: "Priya Nair",   tasks: 8,  completed: 6,  inspections: 5,  issues: 3, score: 70, dept: "QC"          },
  ],
  "Week 3 (10–16 Feb)": [
    { name: "Omar Sheikh",  tasks: 10, completed: 10, inspections: 7,  issues: 0, score: 98, dept: "Engineering" },
    { name: "Sara Malik",   tasks: 11, completed: 9,  inspections: 7,  issues: 1, score: 82, dept: "Engineering" },
    { name: "Bilal Khan",   tasks: 8,  completed: 7,  inspections: 6,  issues: 1, score: 85, dept: "Engineering" },
    { name: "Ahmad Raza",   tasks: 9,  completed: 9,  inspections: 8,  issues: 0, score: 94, dept: "QC"          },
    { name: "Priya Nair",   tasks: 10, completed: 7,  inspections: 6,  issues: 2, score: 72, dept: "QC"          },
  ],
};

const INCHARGE_DATA = {
  "Week 4 (17–23 Feb)": [
    { name: "Ahmad Raza",   project: "Greenfield Complex",  planned: 8, actual: 7, variance: -1, onSite: 5, issues: 1, efficiency: 88 },
    { name: "Sara Malik",   project: "Harbor View Tower",   planned: 8, actual: 6, variance: -2, onSite: 4, issues: 3, efficiency: 72 },
    { name: "James K.",     project: "Westgate Mall",       planned: 7, actual: 4, variance: -3, onSite: 3, issues: 4, efficiency: 58 },
    { name: "Omar Sheikh",  project: "Sunrise Residency",   planned: 6, actual: 6, variance: 0,  onSite: 6, issues: 0, efficiency: 100},
  ],
  "Week 3 (10–16 Feb)": [
    { name: "Ahmad Raza",   project: "Greenfield Complex",  planned: 8, actual: 8, variance: 0,  onSite: 6, issues: 0, efficiency: 98 },
    { name: "Sara Malik",   project: "Harbor View Tower",   planned: 8, actual: 7, variance: -1, onSite: 5, issues: 2, efficiency: 80 },
    { name: "James K.",     project: "Westgate Mall",       planned: 7, actual: 5, variance: -2, onSite: 4, issues: 3, efficiency: 66 },
    { name: "Omar Sheikh",  project: "Sunrise Residency",   planned: 6, actual: 6, variance: 0,  onSite: 6, issues: 0, efficiency: 100},
  ],
};

const COMPLETION_VARIANCE = [
  { project: "Greenfield Complex", planned: 68, actual: 65, variance: -3, status: "Minor Delay"    },
  { project: "Harbor View Tower",  planned: 55, actual: 40, variance: -15,status: "At Risk"        },
  { project: "Westgate Mall",      planned: 32, actual: 20, variance: -12,status: "At Risk"        },
  { project: "Sunrise Residency",  planned: 100,actual: 100,variance: 0,  status: "Completed"     },
];

const REPEAT_ISSUES = [
  { dept: "QC",          issue: "Checklist incomplete before sign-off", count: 7, weeks: 3 },
  { dept: "Engineering", issue: "Late daily report submission",          count: 12,weeks: 4 },
  { dept: "Complaints",  issue: "Follow-up SLA breach > 48hrs",         count: 5, weeks: 2 },
  { dept: "Engineering", issue: "Material inspection skipped",           count: 4, weeks: 2 },
  { dept: "QC",          issue: "Punch list items not cleared before handover", count: 3, weeks: 2 },
];

const DEPT_COLORS = {
  Engineering: "bg-amber-50 text-amber-600",
  QC:          "bg-lightblue text-extra-blue",
  Complaints:  "bg-red-50 text-red-500",
};

// ── Score Badge ───────────────────────────────────────────────────────────────
function ScoreBadge({ score }) {
  const cls = score >= 90 ? "bg-green-50 text-green-600" : score >= 75 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500";
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cls}`}>{score}</span>;
}

// ── Efficiency Bar ────────────────────────────────────────────────────────────
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

  const engineers = ENGINEER_DATA[week] || ENGINEER_DATA[WEEKS[0]];
  const incharges  = INCHARGE_DATA[week] || INCHARGE_DATA[WEEKS[0]];
  const avgScore   = Math.round(engineers.reduce((s, e) => s + e.score, 0) / engineers.length);
  const avgVariance = Math.round(COMPLETION_VARIANCE.reduce((s, p) => s + p.variance, 0) / COMPLETION_VARIANCE.length);

  return (
    <div className="space-y-5">

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-extra-darkblue">Performance Analytics</h2>
          <p className="text-sm text-gray-400 mt-0.5">Overall weekly report</p>
        </div>
        <select value={week} onChange={e => setWeek(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3.5 py-2 outline-none focus:border-medium-blue text-extra-darkblue bg-white">
          {WEEKS.map(w => <option key={w}>{w}</option>)}
        </select>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Avg Engineer Score",    value: `${avgScore}/100`, icon: Users,    cls: avgScore >= 85 ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600" },
          { label: "Top Performer",          value: engineers.sort((a,b) => b.score - a.score)[0]?.name.split(" ")[0], icon: TrendingUp, cls: "bg-lightblue text-extra-blue" },
          { label: "Avg Completion Variance",value: `${avgVariance}%`, icon: Clock,   cls: avgVariance < 0 ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600" },
          { label: "Repeat Issues",          value: REPEAT_ISSUES.length, icon: RefreshCw, cls: "bg-red-50 text-red-500" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
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

          {/* Mobile: cards */}
          <div className="md:hidden divide-y divide-gray-50">
            {engineers.sort((a, b) => b.score - a.score).map(e => (
              <div key={e.name} className="px-5 py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-lightblue text-extra-blue flex items-center justify-center text-xs font-bold">{e.name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-bold text-extra-darkblue">{e.name}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DEPT_COLORS[e.dept]}`}>{e.dept}</span>
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

          {/* Desktop: table */}
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
                {engineers.sort((a, b) => b.score - a.score).map(e => (
                  <tr key={e.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-lightblue text-extra-blue flex items-center justify-center text-xs font-bold shrink-0">{e.name.charAt(0)}</div>
                        <div>
                          <p className="font-semibold text-extra-darkblue text-sm">{e.name}</p>
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${DEPT_COLORS[e.dept]}`}>{e.dept}</span>
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
            {incharges.sort((a, b) => b.efficiency - a.efficiency).map(ic => (
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
            {COMPLETION_VARIANCE.map(p => (
              <div key={p.project} className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <p className="text-sm font-bold text-extra-darkblue">{p.project}</p>
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
          <div className="flex gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-blue-200 inline-block" /> Planned</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-extra-blue inline-block" /> Actual</span>
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
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${DEPT_COLORS[r.dept]}`}>{r.dept}</span>
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