"use client";
import { useState } from "react";
import { MessageSquareWarning, TrendingDown, AlertTriangle, Star } from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────
const COMPLAINTS_PER_PROJECT = [
  { project: "Greenfield Complex",  total: 8,  resolved: 6, open: 1, escalated: 1, failurePct: 12 },
  { project: "Harbor View Tower",   total: 14, resolved: 7, open: 4, escalated: 3, failurePct: 28 },
  { project: "Westgate Mall",       total: 11, resolved: 4, open: 5, escalated: 2, failurePct: 45 },
  { project: "Sunrise Residency",   total: 3,  resolved: 3, open: 0, escalated: 0, failurePct: 6  },
];

const REPEATED_FAILURES = [
  { item: "Waterproofing",         occurrences: 6, projects: ["Greenfield", "Harbor View"],       severity: "High"   },
  { item: "Concrete Mix Quality",  occurrences: 4, projects: ["Harbor View", "Westgate"],         severity: "High"   },
  { item: "Electrical Labelling",  occurrences: 3, projects: ["Greenfield", "Westgate"],          severity: "Medium" },
  { item: "Safety Equipment",      occurrences: 5, projects: ["Harbor View", "Westgate"],         severity: "High"   },
  { item: "Paint Finish",          occurrences: 2, projects: ["Sunrise", "Greenfield"],           severity: "Low"    },
];

const CONTRACTORS = [
  { name: "BuildPro Contractors",  projects: 3, complaints: 8,  onTime: 72, rating: 3.2, trend: "down" },
  { name: "Apex Installations",    projects: 2, complaints: 3,  onTime: 91, rating: 4.5, trend: "up"   },
  { name: "FastTrack Civil",       projects: 2, complaints: 11, onTime: 58, rating: 2.8, trend: "down" },
  { name: "Elite MEP Solutions",   projects: 1, complaints: 2,  onTime: 96, rating: 4.8, trend: "up"   },
];

const SEV_STYLE = {
  High:   "bg-red-50 text-red-500",
  Medium: "bg-amber-50 text-amber-600",
  Low:    "bg-gray-100 text-gray-500",
};

// ── Bar Chart row ─────────────────────────────────────────────────────────────
function HBar({ label, value, max, color, suffix = "" }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-36 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold text-extra-darkblue w-12 text-right">{value}{suffix}</span>
    </div>
  );
}

// ── Star Rating ───────────────────────────────────────────────────────────────
function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={12} className={i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />
      ))}
      <span className="text-xs font-bold text-extra-darkblue ml-1">{rating}</span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ComplaintAnalytics() {
  const [activeProject, setActiveProject] = useState(null);
  const total = COMPLAINTS_PER_PROJECT.reduce((s, p) => s + p.total, 0);
  const maxComplaints = Math.max(...COMPLAINTS_PER_PROJECT.map(p => p.total));
  const maxFailure    = Math.max(...COMPLAINTS_PER_PROJECT.map(p => p.failurePct));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-extra-darkblue">Complaint Analytics</h2>
        <p className="text-sm text-gray-400 mt-0.5">{total} total complaints across all projects</p>
      </div>

      {/* Summary stat row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Complaints", value: total,                                                                             color: "bg-lightblue text-extra-blue"  },
          { label: "Open",             value: COMPLAINTS_PER_PROJECT.reduce((s,p) => s + p.open, 0),                            color: "bg-amber-50 text-amber-600"    },
          { label: "Escalated",        value: COMPLAINTS_PER_PROJECT.reduce((s,p) => s + p.escalated, 0),                       color: "bg-red-50 text-red-500"        },
          { label: "Resolved",         value: COMPLAINTS_PER_PROJECT.reduce((s,p) => s + p.resolved, 0),                        color: "bg-green-50 text-green-600"    },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border border-gray-100 shadow-sm p-4 text-center ${s.color.includes("lightblue") ? "bg-white" : "bg-white"}`}>
            <p className={`text-2xl font-bold ${s.color.split(" ")[1]}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Complaints per project */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquareWarning size={15} className="text-extra-blue" />
            <h3 className="text-sm font-bold text-extra-darkblue">Complaints per Project</h3>
          </div>
          <div className="space-y-3">
            {COMPLAINTS_PER_PROJECT.map(p => (
              <div key={p.project} className="space-y-1.5 cursor-pointer group" onClick={() => setActiveProject(activeProject === p.project ? null : p.project)}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-extra-darkblue group-hover:text-extra-blue transition-colors">{p.project}</span>
                  <span className="text-gray-400">{p.total} total</span>
                </div>
                <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                  <div className="bg-green-400 transition-all" style={{ width: `${(p.resolved / p.total) * 100}%` }} title="Resolved" />
                  <div className="bg-amber-400 transition-all" style={{ width: `${(p.open / p.total) * 100}%` }} title="Open" />
                  <div className="bg-red-500 transition-all"   style={{ width: `${(p.escalated / p.total) * 100}%` }} title="Escalated" />
                </div>
                {activeProject === p.project && (
                  <div className="flex gap-3 text-xs pt-1">
                    <span className="flex items-center gap-1 text-green-600"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> {p.resolved} resolved</span>
                    <span className="flex items-center gap-1 text-amber-600"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> {p.open} open</span>
                    <span className="flex items-center gap-1 text-red-500"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> {p.escalated} escalated</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex gap-4 text-xs text-gray-400 pt-1 border-t border-gray-50">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Resolved</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Open</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Escalated</span>
          </div>
        </div>

        {/* Project-wise failure % */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingDown size={15} className="text-red-500" />
            <h3 className="text-sm font-bold text-extra-darkblue">Project-wise Failure %</h3>
          </div>
          <div className="space-y-3">
            {COMPLAINTS_PER_PROJECT.sort((a, b) => b.failurePct - a.failurePct).map(p => (
              <HBar key={p.project} label={p.project} value={p.failurePct} max={100}
                color={p.failurePct > 30 ? "#ef4444" : p.failurePct > 15 ? "#d97706" : "#16a34a"}
                suffix="%" />
            ))}
          </div>
          <p className="text-xs text-gray-400">Failure % = escalated + unresolved complaints / total × 100</p>
        </div>

        {/* Repeated Item Failures */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-500" />
            <h3 className="text-sm font-bold text-extra-darkblue">Repeated Item Failures</h3>
          </div>
          <div className="space-y-2">
            {REPEATED_FAILURES.sort((a, b) => b.occurrences - a.occurrences).map(f => (
              <div key={f.item} className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-extra-darkblue">{f.item}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SEV_STYLE[f.severity]}`}>{f.severity}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{f.projects.join(", ")}</p>
                </div>
                <div className="text-center shrink-0">
                  <p className="text-xl font-bold text-red-500">{f.occurrences}×</p>
                  <p className="text-xs text-gray-400">occurrences</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contractor Performance */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Star size={15} className="text-amber-500" />
            <h3 className="text-sm font-bold text-extra-darkblue">Contractor Performance Rating</h3>
          </div>
          <div className="space-y-3">
            {CONTRACTORS.sort((a, b) => b.rating - a.rating).map(c => (
              <div key={c.name} className="px-4 py-3.5 rounded-xl border border-gray-100 bg-gray-50">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-bold text-extra-darkblue">{c.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.projects} projects · {c.complaints} complaints</p>
                  </div>
                  <Stars rating={c.rating} />
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">On-time delivery</span>
                    <span className={`font-bold ${c.onTime >= 85 ? "text-green-600" : c.onTime >= 70 ? "text-amber-500" : "text-red-500"}`}>{c.onTime}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${c.onTime}%`, background: c.onTime >= 85 ? "#16a34a" : c.onTime >= 70 ? "#d97706" : "#ef4444" }} />
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