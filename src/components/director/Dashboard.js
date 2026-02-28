"use client";
import { FolderKanban, AlertTriangle, DollarSign, Clock, MessageSquareWarning, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────
const STATS = [
  { label: "Total Active Projects", value: "8",  trend: "+2 this month", up: true,  icon: FolderKanban,          color: "bg-lightblue text-extra-blue"    },
  { label: "Projects At Risk",      value: "3",  trend: "Delay > 7 days", up: false, icon: AlertTriangle,         color: "bg-red-50 text-red-500"          },
  { label: "Budget Overrun Alerts", value: "2",  trend: "Needs approval", up: false, icon: DollarSign,            color: "bg-amber-50 text-amber-600"      },
  { label: "Pending Approvals",     value: "11", trend: "5 urgent",       up: false, icon: Clock,                 color: "bg-orange-50 text-orange-500"    },
  { label: "Open Complaints",       value: "14", trend: "3 escalated",    up: false, icon: MessageSquareWarning,  color: "bg-purple-50 text-purple-600"    },
];

const AT_RISK_PROJECTS = [
  { name: "Westgate Mall",       delay: 12, budgetOver: 8,  complaints: 5, status: "At Risk"     },
  { name: "Sunrise Residency",   delay: 7,  budgetOver: 0,  complaints: 2, status: "At Risk"     },
  { name: "Harbor View Phase 2", delay: 4,  budgetOver: 14, complaints: 3, status: "Budget Alert"},
];

const PENDING_APPROVALS = [
  { id: "APR-001", type: "Budget Deviation",  project: "Westgate Mall",        amount: "PKR 4.2M",  priority: "High",   age: "2d" },
  { id: "APR-002", type: "Timeline Extension",project: "Harbor View Tower",    amount: "+21 days",  priority: "High",   age: "1d" },
  { id: "APR-003", type: "Complaint Approval",project: "Greenfield Complex",   amount: "PKR 780K",  priority: "Medium", age: "3d" },
  { id: "APR-004", type: "Budget Deviation",  project: "Sunrise Residency",    amount: "PKR 1.1M",  priority: "Low",    age: "4d" },
];

const PRIORITY_STYLE = {
  High:   "bg-red-50 text-red-500",
  Medium: "bg-amber-50 text-amber-600",
  Low:    "bg-gray-100 text-gray-500",
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
  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-lg font-bold text-extra-darkblue">Director Dashboard</h2>
        <p className="text-sm text-gray-400 mt-0.5">Executive overview — 26 Feb 2026</p>
      </div>

      {/* Stats — 2 cols mobile, 5 desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* At Risk Projects */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-500" />
              <h3 className="text-sm font-bold text-extra-darkblue">Projects At Risk</h3>
            </div>
            <button className="text-xs font-semibold text-extra-blue hover:underline flex items-center gap-1">
              View all <ArrowRight size={11} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {AT_RISK_PROJECTS.map(p => (
              <div key={p.name} className="px-5 py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-extra-darkblue">{p.name}</p>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.status === "At Risk" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"}`}>
                    {p.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                  <div>
                    <p className="text-gray-400 mb-1">Delay</p>
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
                <p className="text-xs text-gray-400">{p.complaints} open complaints</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-orange-500" />
              <h3 className="text-sm font-bold text-extra-darkblue">Pending Approvals</h3>
            </div>
            <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">{PENDING_APPROVALS.length}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {PENDING_APPROVALS.map(a => (
              <div key={a.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-extra-blue">{a.id}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[a.priority]}`}>{a.priority}</span>
                  </div>
                  <p className="text-sm font-semibold text-extra-darkblue mt-0.5">{a.type}</p>
                  <p className="text-xs text-gray-400">{a.project} · {a.amount}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-gray-300">{a.age} ago</span>
                  <button className="text-xs font-bold px-3 py-1.5 rounded-lg bg-extra-darkblue text-white hover:bg-extra-blue transition-colors">Review</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}