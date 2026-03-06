"use client";
import { useState, useEffect } from "react";
import axios from "axios";

// ─── Config ────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

// ─── Static logs (no backend collection yet) ───────────────────────────────
const LOGS = [
  { date: "25 Feb 2026", project: "PRJ-2401", engineer: "Sara Hassan",  task: "Waterslide section 4 weld inspection completed", hours: 8 },
  { date: "25 Feb 2026", project: "PRJ-2389", engineer: "Karim Nour",   task: "Wave Pool Panel B re-weld — 60% done", hours: 7 },
  { date: "25 Feb 2026", project: "PRJ-2435", engineer: "Omar Siddiq",  task: "Final commissioning checks passed", hours: 6 },
  { date: "24 Feb 2026", project: "PRJ-2401", engineer: "Sara Hassan",  task: "Load test rig preparation", hours: 8 },
  { date: "24 Feb 2026", project: "PRJ-2376", engineer: "Lena Weber",   task: "Foundation survey completed", hours: 5 },
  { date: "24 Feb 2026", project: "PRJ-2422", engineer: "Nadia Farouq", task: "Pump system installation started", hours: 7 },
  { date: "23 Feb 2026", project: "PRJ-2435", engineer: "Omar Siddiq",  task: "Slide bowl alignment signed off", hours: 8 },
  { date: "23 Feb 2026", project: "PRJ-2389", engineer: "Karim Nour",   task: "Structural crack assessment completed", hours: 4 },
];

// ─── Helpers ───────────────────────────────────────────────────────────────
const STATUS_PRIORITY_MAP = {
  initiated:     "Medium",
  "in-progress": "High",
  critical:      "Critical",
  completed:     "Low",
};

// Derive a display phase from project status
const STATUS_PHASE_MAP = {
  initiated:     "Assign Engineer",
  "in-progress": "Progress Monitoring",
  completed:     "Trial & QC",
  "on-hold":     "Issue Approval",
};

const STATUS_CLS = {
  "On Track": { badge: "bg-green-100 text-green-700", dot: "bg-green-500" },
  "At Risk":  { badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  "Delayed":  { badge: "bg-red-100 text-red-700",     dot: "bg-red-500"   },
};

function getProjectStatus(project) {
  if (project.status === "completed") return "On Track";
  if (!project.assignedEngineers || project.assignedEngineers.length === 0) return "Delayed";
  const end = project.endDate ? new Date(project.endDate) : null;
  if (!end) return "On Track";
  const daysLeft = Math.ceil((end - new Date()) / 86400000);
  if (daysLeft < 0) return "Delayed";
  if (daysLeft < 7) return "At Risk";
  return "On Track";
}

function getCompletion(project) {
  // Use a real field if your project has one, otherwise derive from status
  if (typeof project.completionPercentage === "number") return project.completionPercentage;
  const map = { initiated: 10, "in-progress": 50, completed: 100, "on-hold": 30 };
  return map[project.status] || 0;
}

function getEngineerNames(project) {
  const engs = project.assignedEngineers || [];
  if (engs.length === 0) return "Unassigned";
  return engs.map((e) => (typeof e === "object" ? e.name : e)).filter(Boolean).join(", ");
}

function ini(n) {
  if (!n || n === "Unassigned") return "—";
  return n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

// Aggregate raw attendance records → per-user summary
function aggregateAttendance(records) {
  const map = {};
  records.forEach((r) => {
    const user = r.user;
    if (!user) return;
    const id = user._id || user;
    const name = user.name || "Unknown";
    const role = user.role || "";
    if (!map[id]) map[id] = { name, role, present: 0, absent: 0, late: 0, total: 0 };
    map[id].total += 1;
    if (r.status === "present" || r.status === "half-day") map[id].present += 1;
    else if (r.status === "absent" || r.status === "on-leave") map[id].absent += 1;
    if (r.status === "late") { map[id].present += 1; map[id].late += 1; }
  });
  return Object.values(map);
}

// ─── Sub-components ────────────────────────────────────────────────────────
function ProgressBar({ value }) {
  const color = value >= 75 ? "bg-blue-800" : value >= 50 ? "bg-blue-400" : value >= 25 ? "bg-blue-200" : "bg-gray-200";
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-full">
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${value}%` }} />
    </div>
  );
}

function Chip({ label, badgeCls, dotCls }) {
  return (
    <span className={`${badgeCls} inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap`}>
      <span className={`${dotCls} w-1.5 h-1.5 rounded-full shrink-0`} />
      {label}
    </span>
  );
}

function Avatar({ name, size = "md" }) {
  const sz = size === "sm" ? "w-6 h-6 text-[8px]" : "w-8 h-8 text-[10px]";
  return (
    <div className={`${sz} bg-blue-50 border border-blue-200 text-blue-800 rounded-full flex items-center justify-center font-extrabold shrink-0`}>
      {ini(name)}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 rounded-xl" />
      ))}
    </div>
  );
}

// Mobile project card
function ProjectCard({ p }) {
  const sm = STATUS_CLS[p.displayStatus] || STATUS_CLS["On Track"];
  const d = p.endDate ? Math.ceil((new Date(p.endDate) - new Date()) / 86400000) : null;
  const dlCls = d === null ? "text-gray-400" : d < 0 ? "text-red-500" : d < 7 ? "text-amber-500" : "text-gray-400";
  const engineerName = getEngineerNames(p);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-[11px] font-bold text-blue-500 mb-0.5">{p._id?.slice(-6).toUpperCase()}</p>
          <p className="text-sm font-bold text-blue-950">{p.name}</p>
          <p className="text-xs text-gray-400">{p.clientName}</p>
        </div>
        <Chip label={p.displayStatus} badgeCls={sm.badge} dotCls={sm.dot} />
      </div>
      <div className="flex items-center gap-2 mb-3 mt-1">
        <Avatar name={engineerName} size="sm" />
        <span className={`text-xs font-medium ${engineerName === "Unassigned" ? "text-red-500 font-bold" : "text-gray-600"}`}>{engineerName}</span>
        <span className="text-gray-200">·</span>
        <span className="text-xs text-gray-400 capitalize">{p.status}</span>
      </div>
      <ProgressBar value={p.completion} />
      <div className="flex justify-between mt-2">
        <span className="text-xs font-bold text-blue-950">{p.completion}%</span>
        {p.endDate ? (
          <span className={`text-xs font-semibold ${dlCls}`}>
            {d < 0 ? "Overdue" : `${d}d left`} · {new Date(p.endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        ) : (
          <span className="text-xs text-gray-300">No date set</span>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function ProgressMonitoring() {
  const [tab,        setTab]        = useState("logs");
  const [projects,   setProjects]   = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = authHeaders();
        const [projRes, attRes] = await Promise.all([
          axios.get(`${API_BASE}/projects`,    { headers }),
          axios.get(`${API_BASE}/attendance/all`,  { headers }),
        ]);

        // Enrich projects with derived display fields
        const enriched = projRes.data.map((p) => ({
          ...p,
          displayStatus: getProjectStatus(p),
          completion:    getCompletion(p),
        }));

        setProjects(enriched);
        setAttendance(aggregateAttendance(attRes.data));
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Derived stats ──────────────────────────────────────────────────────
  const avgCompletion = projects.length
    ? Math.round(projects.reduce((s, p) => s + p.completion, 0) / projects.length)
    : 0;
  const onTrack = projects.filter((p) => p.displayStatus === "On Track").length;
  const atRisk  = projects.filter((p) => p.displayStatus !== "On Track").length;

  // ── Error state ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center max-w-sm">
          <p className="text-sm font-bold text-red-600 mb-1">Error loading data</p>
          <p className="text-xs text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-blue-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-0.5">
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-blue-950">Progress Monitoring</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: `${avgCompletion}% Avg Completion`, cls: "bg-blue-50 text-blue-700",   dot: "bg-blue-500" },
              { label: `${onTrack} On Track`,              cls: "bg-green-50 text-green-700", dot: "bg-green-500" },
              { label: `${atRisk} Need Attention`,         cls: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
            ].map((p) => (
              <span key={p.label} className={`${p.cls} inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold`}>
                <span className={`${p.dot} w-1.5 h-1.5 rounded-full`} />
                {p.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Project Completion — Desktop Table ── */}
        <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-3.5 border-b border-gray-50 flex justify-between items-center">
            <p className="text-sm font-bold text-blue-950">Project Completion</p>
            <p className="text-xs text-gray-400">{projects.length} projects</p>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-5"><Skeleton /></div>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    {["Project", "Client", "Engineer", "Phase", "Target Date", "Completion", "Status"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p, i) => {
                    const sm = STATUS_CLS[p.displayStatus] || STATUS_CLS["On Track"];
                    const d = p.endDate ? Math.ceil((new Date(p.endDate) - new Date()) / 86400000) : null;
                    const engineerName = getEngineerNames(p);
                    return (
                      <tr key={p._id} className={`border-t border-gray-50 hover:bg-blue-50/30 transition-colors cursor-pointer ${i % 2 === 1 ? "bg-slate-50/40" : ""}`}>
                        <td className="px-4 py-3">
                          <p className="text-[11px] font-bold text-blue-500 mb-0.5">{p._id?.slice(-6).toUpperCase()}</p>
                          <p className="text-sm font-bold text-blue-950">{p.name}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{p.clientName}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={engineerName} size="sm" />
                            <span className={`text-xs font-semibold whitespace-nowrap ${engineerName === "Unassigned" ? "text-red-500 font-bold" : "text-gray-700"}`}>
                              {engineerName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap capitalize">{STATUS_PHASE_MAP[p.status] || p.status}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {p.endDate ? (
                            <>
                              <p className="text-xs font-semibold text-gray-700">
                                {new Date(p.endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                              </p>
                              <p className={`text-[10px] font-bold mt-0.5 ${d < 0 ? "text-red-500" : d < 7 ? "text-amber-500" : "text-gray-400"}`}>
                                {d < 0 ? "Overdue" : `${d}d left`}
                              </p>
                            </>
                          ) : (
                            <span className="text-xs text-gray-300">Not set</span>
                          )}
                        </td>
                        <td className="px-4 py-3 min-w-[160px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1"><ProgressBar value={p.completion} /></div>
                            <span className="text-xs font-bold text-blue-950 w-8 text-right">{p.completion}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Chip label={p.displayStatus} badgeCls={sm.badge} dotCls={sm.dot} />
                        </td>
                      </tr>
                    );
                  })}
                  {projects.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">No projects found.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Project Completion — Mobile Cards ── */}
        <div className="lg:hidden mb-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-bold text-blue-950">Project Completion</p>
            <p className="text-xs text-gray-400">{projects.length} projects</p>
          </div>
          {loading ? (
            <Skeleton />
          ) : (
            <div className="flex flex-col gap-3">
              {projects.map((p) => <ProjectCard key={p._id} p={p} />)}
            </div>
          )}
        </div>

        {/* ── Logs + Attendance tabs ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Tab bar */}
          <div className="px-4 sm:px-5 border-b border-gray-100 flex gap-0">
            {[
              { key: "logs",       label: "Daily Progress Logs" },
              { key: "attendance", label: "Attendance Summary" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-1 py-3.5 mr-5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  tab === t.key ? "border-blue-800 text-blue-950" : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* DAILY LOGS — Desktop */}
          {tab === "logs" && (
            <>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      {["Date", "Project", "Engineer", "Task", "Hours"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {LOGS.map((log, i) => (
                      <tr key={i} className="border-t border-gray-50 hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 text-xs font-semibold text-gray-400 whitespace-nowrap">{log.date}</td>
                        <td className="px-4 py-3 text-xs font-bold text-blue-500">{log.project}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={log.engineer} size="sm" />
                            <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">{log.engineer}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{log.task}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">{log.hours}h</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* DAILY LOGS — Mobile */}
              <div className="sm:hidden flex flex-col divide-y divide-gray-50">
                {LOGS.map((log, i) => (
                  <div key={i} className="px-4 py-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-blue-500">{log.project}</span>
                      <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{log.hours}h</span>
                    </div>
                    <p className="text-xs text-gray-700 leading-snug mb-1.5">{log.task}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Avatar name={log.engineer} size="sm" />
                      <span>{log.engineer}</span>
                      <span className="text-gray-200">·</span>
                      <span>{log.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ATTENDANCE — Desktop */}
          {tab === "attendance" && (
            <>
              {loading ? (
                <div className="p-5"><Skeleton /></div>
              ) : (
                <>
                  <div className="hidden sm:block">
                    <div className="grid grid-cols-4 gap-0 px-5 py-3 bg-slate-50 border-b border-gray-50">
                      {["Engineer", "Attendance Rate", "Days", "Breakdown"].map((h) => (
                        <p key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider m-0">{h}</p>
                      ))}
                    </div>
                    {attendance.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-10">No attendance records found.</p>
                    )}
                    {attendance.map((a, i) => {
                      const rate = a.total > 0 ? Math.round((a.present / a.total) * 100) : 0;
                      const barCls  = rate >= 90 ? "bg-blue-800" : rate >= 80 ? "bg-blue-400" : "bg-orange-500";
                      const textCls = rate >= 90 ? "text-blue-800" : rate >= 80 ? "text-blue-500" : "text-orange-500";
                      return (
                        <div key={a.name + i} className={`grid grid-cols-4 gap-0 px-5 py-4 items-center hover:bg-slate-50/60 transition-colors ${i < attendance.length - 1 ? "border-b border-gray-50" : ""}`}>
                          <div className="flex items-center gap-3">
                            <Avatar name={a.name} />
                            <div>
                              <p className="text-sm font-bold text-blue-950">{a.name}</p>
                              <p className="text-xs text-gray-400 capitalize">{a.role}</p>
                            </div>
                          </div>
                          <div className="pr-6">
                            <div className="flex justify-between mb-1.5">
                              <span className="text-[10px] text-gray-400 font-semibold">Rate</span>
                              <span className={`text-xs font-extrabold ${textCls}`}>{rate}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full ${barCls} rounded-full transition-all duration-500`} style={{ width: `${rate}%` }} />
                            </div>
                          </div>
                          <p className="text-xs font-semibold text-gray-700">{a.present} / {a.total} days</p>
                          <div className="flex gap-1.5 flex-wrap">
                            <span className="bg-green-50 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">{a.present} Present</span>
                            {a.absent > 0 && <span className="bg-red-50 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">{a.absent} Absent</span>}
                            {a.late > 0 && <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">{a.late} Late</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ATTENDANCE — Mobile */}
                  <div className="sm:hidden flex flex-col divide-y divide-gray-50">
                    {attendance.map((a, i) => {
                      const rate = a.total > 0 ? Math.round((a.present / a.total) * 100) : 0;
                      const barCls  = rate >= 90 ? "bg-blue-800" : rate >= 80 ? "bg-blue-400" : "bg-orange-500";
                      const textCls = rate >= 90 ? "text-blue-800" : rate >= 80 ? "text-blue-500" : "text-orange-500";
                      return (
                        <div key={a.name + i} className="px-4 py-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar name={a.name} />
                            <div className="flex-1">
                              <p className="text-sm font-bold text-blue-950">{a.name}</p>
                              <p className="text-xs text-gray-400 capitalize">{a.role}</p>
                            </div>
                            <span className={`text-sm font-extrabold ${textCls}`}>{rate}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                            <div className={`h-full ${barCls} rounded-full transition-all duration-500`} style={{ width: `${rate}%` }} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{a.present} / {a.total} days</span>
                            <div className="flex gap-1.5">
                              <span className="bg-green-50 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">{a.present} Present</span>
                              {a.absent > 0 && <span className="bg-red-50 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">{a.absent} Absent</span>}
                              {a.late > 0 && <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">{a.late} Late</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {attendance.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-10">No attendance records found.</p>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <p className="mt-5 text-xs text-gray-400 text-right">
          Data refreshed · {new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}