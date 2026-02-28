"use client";
import { useState } from "react";
import { X, AlertTriangle, CheckCircle2, Clock, TrendingUp, DollarSign, MessageSquareWarning, AlertCircle, ChevronRight } from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────
const PROJECTS = [
  {
    id: 1, name: "Greenfield Complex",  location: "Karachi",   status: "In Progress",
    completion: 65, budgetUsed: 58, delayDays: 0,  issues: 3,  complaints: 2,
    budget: "PKR 48M", spent: "PKR 27.8M",
    milestones: [
      { name: "Foundation",    planned: 100, actual: 100, done: true  },
      { name: "Framing",       planned: 100, actual: 95,  done: true  },
      { name: "MEP Rough-in",  planned: 80,  actual: 65,  done: false },
      { name: "Finishes",      planned: 40,  actual: 20,  done: false },
      { name: "Handover",      planned: 0,   actual: 0,   done: false },
    ],
    expenses: [
      { category: "Labour",    amount: "PKR 12.4M", pct: 45 },
      { category: "Materials", amount: "PKR 9.8M",  pct: 35 },
      { category: "Equipment", amount: "PKR 3.6M",  pct: 13 },
      { category: "Other",     amount: "PKR 2.0M",  pct: 7  },
    ],
    issueBreakdown: [
      { type: "Structural",  count: 1, status: "Open"     },
      { type: "MEP",         count: 1, status: "In Review" },
      { type: "Safety",      count: 1, status: "Closed"   },
    ],
    complaints: [
      { id: "CMP-011", desc: "Water seepage in basement",    raised: "20 Feb",  status: "Open"     },
      { id: "CMP-012", desc: "Electrical panel not labelled",raised: "22 Feb",  status: "Resolved" },
    ],
    timeline: { planned: "01 Jan 2026", estimated: "30 Jun 2026", actualEnd: null },
    batches: [
      { material: "Cement OPC 43", batch: "B-2024-112", status: "Approved"  },
      { material: "Rebar TMT 500", batch: "B-2024-209", status: "Approved"  },
      { material: "PVC Conduit",   batch: "B-2025-014", status: "Quarantine"},
    ],
  },
  {
    id: 2, name: "Harbor View Tower",   location: "Lahore",    status: "At Risk",
    completion: 40, budgetUsed: 72, delayDays: 12, issues: 6,  complaints: 5,
    budget: "PKR 92M", spent: "PKR 66.2M",
    milestones: [
      { name: "Foundation",    planned: 100, actual: 100, done: true  },
      { name: "Framing",       planned: 100, actual: 80,  done: false },
      { name: "MEP Rough-in",  planned: 60,  actual: 30,  done: false },
      { name: "Finishes",      planned: 10,  actual: 0,   done: false },
      { name: "Handover",      planned: 0,   actual: 0,   done: false },
    ],
    expenses: [
      { category: "Labour",    amount: "PKR 28M",  pct: 42 },
      { category: "Materials", amount: "PKR 24M",  pct: 36 },
      { category: "Equipment", amount: "PKR 9M",   pct: 14 },
      { category: "Other",     amount: "PKR 5.2M", pct: 8  },
    ],
    issueBreakdown: [
      { type: "Structural",  count: 2, status: "Open"     },
      { type: "MEP",         count: 3, status: "Open"     },
      { type: "Safety",      count: 1, status: "In Review"},
    ],
    complaints: [
      { id: "CMP-021", desc: "Crane operator unlicensed",  raised: "18 Feb", status: "Escalated" },
      { id: "CMP-022", desc: "Poor concrete mix quality",  raised: "21 Feb", status: "Open"      },
    ],
    timeline: { planned: "15 Jan 2026", estimated: "15 Sep 2026", actualEnd: null },
    batches: [
      { material: "Concrete M30",  batch: "B-2025-031", status: "Failed"   },
      { material: "Glass Panels",  batch: "B-2025-044", status: "Approved" },
    ],
  },
  {
    id: 3, name: "Westgate Mall",        location: "Islamabad", status: "At Risk",
    completion: 20, budgetUsed: 34, delayDays: 12, issues: 7,  complaints: 5,
    budget: "PKR 120M", spent: "PKR 40.8M",
    milestones: [
      { name: "Foundation",    planned: 100, actual: 90,  done: false },
      { name: "Framing",       planned: 40,  actual: 20,  done: false },
      { name: "MEP Rough-in",  planned: 10,  actual: 0,   done: false },
      { name: "Finishes",      planned: 0,   actual: 0,   done: false },
      { name: "Handover",      planned: 0,   actual: 0,   done: false },
    ],
    expenses: [
      { category: "Labour",    amount: "PKR 18M",  pct: 44 },
      { category: "Materials", amount: "PKR 15M",  pct: 37 },
      { category: "Equipment", amount: "PKR 5M",   pct: 12 },
      { category: "Other",     amount: "PKR 2.8M", pct: 7  },
    ],
    issueBreakdown: [
      { type: "Structural",  count: 3, status: "Open"     },
      { type: "MEP",         count: 2, status: "Open"     },
      { type: "Safety",      count: 2, status: "Escalated"},
    ],
    complaints: [
      { id: "CMP-031", desc: "Safety harness not provided", raised: "15 Feb", status: "Escalated" },
    ],
    timeline: { planned: "05 Feb 2026", estimated: "05 Dec 2026", actualEnd: null },
    batches: [
      { material: "Steel I-Beam", batch: "B-2025-055", status: "Approved"  },
      { material: "Insulation",   batch: "B-2025-061", status: "Quarantine"},
    ],
  },
  {
    id: 4, name: "Sunrise Residency",   location: "Karachi",   status: "Completed",
    completion: 100, budgetUsed: 103, delayDays: 3, issues: 0, complaints: 1,
    budget: "PKR 35M", spent: "PKR 36.1M",
    milestones: [
      { name: "Foundation",    planned: 100, actual: 100, done: true },
      { name: "Framing",       planned: 100, actual: 100, done: true },
      { name: "MEP Rough-in",  planned: 100, actual: 100, done: true },
      { name: "Finishes",      planned: 100, actual: 100, done: true },
      { name: "Handover",      planned: 100, actual: 100, done: true },
    ],
    expenses: [
      { category: "Labour",    amount: "PKR 14.4M", pct: 40 },
      { category: "Materials", amount: "PKR 13M",   pct: 36 },
      { category: "Equipment", amount: "PKR 5.4M",  pct: 15 },
      { category: "Other",     amount: "PKR 3.3M",  pct: 9  },
    ],
    issueBreakdown: [],
    complaints: [
      { id: "CMP-041", desc: "Minor paint finish touch-up", raised: "10 Feb", status: "Resolved" },
    ],
    timeline: { planned: "10 Dec 2025", estimated: "28 Feb 2026", actualEnd: "01 Mar 2026" },
    batches: [
      { material: "Paint Emulsion", batch: "B-2024-198", status: "Approved" },
    ],
  },
];

const STATUS_STYLE = {
  "In Progress": "bg-blue-50 text-blue-600",
  "At Risk":     "bg-red-50 text-red-500",
  "Completed":   "bg-green-50 text-green-600",
};

const BATCH_STYLE = {
  Approved:   "bg-green-50 text-green-600",
  Failed:     "bg-red-50 text-red-500",
  Quarantine: "bg-amber-50 text-amber-600",
};

// ── Progress Bar ──────────────────────────────────────────────────────────────
function Bar({ pct, color, bg = "bg-gray-100" }) {
  return (
    <div className={`h-2 ${bg} rounded-full overflow-hidden`}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({ project: p, onClose }) {
  const [tab, setTab] = useState("timeline");
  const tabs = [
    { key: "timeline",  label: "Timeline"  },
    { key: "expenses",  label: "Expenses"  },
    { key: "issues",    label: "Issues"    },
    { key: "batches",   label: "Materials" },
    { key: "complaints",label: "Complaints"},
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col z-10">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0"
          style={{ background: "linear-gradient(135deg, #0F2854, #1C4D8D)" }}>
          <div>
            <h3 className="text-white font-bold text-base">{p.name}</h3>
            <p className="text-blue-300 text-xs mt-0.5">{p.location} · {p.budget} budget</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-gray-100 px-2 overflow-x-auto shrink-0">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all
                ${tab === t.key ? "border-extra-blue text-extra-blue" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Timeline Tab */}
          {tab === "timeline" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Planned Start", value: p.timeline.planned     },
                  { label: "Est. Completion",value: p.timeline.estimated  },
                  { label: "Actual End",     value: p.timeline.actualEnd || "—" },
                ].map(i => (
                  <div key={i.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">{i.label}</p>
                    <p className="text-sm font-bold text-extra-darkblue">{i.value}</p>
                  </div>
                ))}
              </div>
              {p.delayDays > 0 && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
                  <AlertTriangle size={15} className="text-red-500 shrink-0" />
                  <p className="text-sm font-semibold text-red-600">Project delayed by <strong>{p.delayDays} days</strong></p>
                </div>
              )}
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Milestone Progress</h4>
              <div className="space-y-3">
                {p.milestones.map(m => (
                  <div key={m.name}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-extra-darkblue">{m.name}</span>
                      <span className="text-gray-400">Planned {m.planned}% · Actual {m.actual}%</span>
                    </div>
                    <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div className="absolute h-full bg-blue-200 rounded-full" style={{ width: `${m.planned}%` }} />
                      <div className={`absolute h-full rounded-full ${m.actual >= m.planned ? "bg-green-500" : "bg-extra-blue"}`} style={{ width: `${m.actual}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expenses Tab */}
          {tab === "expenses" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400">Total Budget</p>
                  <p className="text-xl font-bold text-extra-darkblue mt-1">{p.budget}</p>
                </div>
                <div className={`rounded-xl p-4 ${p.budgetUsed > 100 ? "bg-red-50" : "bg-green-50"}`}>
                  <p className="text-xs text-gray-400">Spent</p>
                  <p className={`text-xl font-bold mt-1 ${p.budgetUsed > 100 ? "text-red-600" : "text-green-600"}`}>{p.spent}</p>
                  <p className={`text-xs font-bold ${p.budgetUsed > 100 ? "text-red-400" : "text-green-400"}`}>{p.budgetUsed}% utilized</p>
                </div>
              </div>
              <Bar pct={p.budgetUsed} color={p.budgetUsed > 100 ? "#ef4444" : p.budgetUsed > 80 ? "#d97706" : "#1C4D8D"} />
              <div className="space-y-2">
                {p.expenses.map(e => (
                  <div key={e.category} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-500 w-24 shrink-0">{e.category}</span>
                    <div className="flex-1"><Bar pct={e.pct} color="#4988C4" /></div>
                    <span className="text-xs font-bold text-extra-darkblue w-20 text-right">{e.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issues Tab */}
          {tab === "issues" && (
            <div className="space-y-3">
              {p.issueBreakdown.length === 0
                ? <p className="text-sm text-gray-400 text-center py-8">No issues recorded</p>
                : p.issueBreakdown.map((iss, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 bg-gray-50">
                    <div>
                      <p className="text-sm font-bold text-extra-darkblue">{iss.type}</p>
                      <p className="text-xs text-gray-400">{iss.count} issue{iss.count > 1 ? "s" : ""}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${iss.status === "Closed" ? "bg-green-50 text-green-600" : iss.status === "Escalated" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"}`}>
                      {iss.status}
                    </span>
                  </div>
                ))
              }
            </div>
          )}

          {/* Batches Tab */}
          {tab === "batches" && (
            <div className="space-y-3">
              {p.batches.map((b, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 bg-gray-50">
                  <div>
                    <p className="text-sm font-bold text-extra-darkblue">{b.material}</p>
                    <p className="text-xs font-mono text-gray-400">{b.batch}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${BATCH_STYLE[b.status]}`}>{b.status}</span>
                </div>
              ))}
            </div>
          )}

          {/* Complaints Tab */}
          {tab === "complaints" && (
            <div className="space-y-3">
              {p.complaints.map(c => (
                <div key={c.id} className="px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-mono font-bold text-extra-blue">{c.id}</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.status === "Resolved" ? "bg-green-50 text-green-600" : c.status === "Escalated" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"}`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-sm text-extra-darkblue font-medium">{c.desc}</p>
                  <p className="text-xs text-gray-400">Raised: {c.raised}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProjectOverview() {
  const [selected, setSelected] = useState(null);
  const [filter,   setFilter]   = useState("All");
  const filters = ["All", "In Progress", "At Risk", "Completed"];

  const filtered = filter === "All" ? PROJECTS : PROJECTS.filter(p => p.status === filter);

  return (
    <div className="space-y-5">
      {selected && <DetailModal project={selected} onClose={() => setSelected(null)} />}

      <div>
        <h2 className="text-lg font-bold text-extra-darkblue">Project Overview</h2>
        <p className="text-sm text-gray-400 mt-0.5">{PROJECTS.length} projects total</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit overflow-x-auto">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
              ${filter === f ? "bg-white text-extra-darkblue shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Project Cards — responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(p => (
          <div key={p.id} onClick={() => setSelected(p)}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:border-extra-blue hover:shadow-md transition-all group">

            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-extra-darkblue group-hover:text-extra-blue transition-colors">{p.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{p.location}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                {p.delayDays > 0 && (
                  <span className="text-xs font-semibold text-red-500 flex items-center gap-1">
                    <AlertTriangle size={10} /> {p.delayDays}d delay
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {/* Completion */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Completion</span>
                  <span className="font-bold text-extra-blue">{p.completion}%</span>
                </div>
                <Bar pct={p.completion} color="#1C4D8D" />
              </div>
              {/* Budget */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Budget Used</span>
                  <span className={`font-bold ${p.budgetUsed > 100 ? "text-red-500" : p.budgetUsed > 80 ? "text-amber-500" : "text-green-600"}`}>{p.budgetUsed}%</span>
                </div>
                <Bar pct={p.budgetUsed} color={p.budgetUsed > 100 ? "#ef4444" : p.budgetUsed > 80 ? "#d97706" : "#16a34a"} />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><AlertCircle size={11} className="text-amber-500" /> {p.issues} issues</span>
                <span className="flex items-center gap-1"><MessageSquareWarning size={11} className="text-red-400" /> {p.complaints.length} complaints</span>
              </div>
              <span className="text-xs font-semibold text-extra-blue flex items-center gap-1 group-hover:gap-2 transition-all">
                View Detail <ChevronRight size={12} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}