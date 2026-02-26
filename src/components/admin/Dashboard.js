"use client";
import { Users, ShieldCheck, Activity, AlertTriangle, Clock, Settings } from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────
const STATS = [
  { label: "Total Users",              value: "24",  sub: "3 added this week",        icon: Users,        color: "bg-lightblue text-extra-blue"    },
  { label: "Active Roles",             value: "6",   sub: "Admin, QC, Engineer…",     icon: ShieldCheck,  color: "bg-green-50 text-green-600"       },
  { label: "System Health",            value: "99%", sub: "All services operational",  icon: Activity,     color: "bg-emerald-50 text-emerald-600"   },
  { label: "Pending Role Assignments", value: "5",   sub: "Awaiting admin action",     icon: Clock,        color: "bg-amber-50 text-amber-600"       },
];

const AUDIT_LOGS = [
  { id: 1, user: "Zaid",       action: "Created user Sara Malik",            time: "10 min ago",  type: "create"  },
  { id: 2, user: "System",     action: "Role 'QC Inspector' assigned to Ahmad", time: "1 hr ago", type: "assign"  },
  { id: 3, user: "Zaid",       action: "Deactivated user John Doe",          time: "2 hrs ago",   type: "warning" },
  { id: 4, user: "System",     action: "Approval workflow updated",           time: "Yesterday",   type: "update"  },
  { id: 5, user: "Priya Nair", action: "Password reset requested",            time: "Yesterday",   type: "warning" },
];

const PENDING_ROLES = [
  { id: 1, user: "Bilal Khan",   requestedRole: "QC Inspector",      project: "Greenfield Complex", since: "2 days ago" },
  { id: 2, user: "Riya Sharma",  requestedRole: "Site Engineer",     project: "Harbor View Tower",  since: "1 day ago"  },
  { id: 3, user: "Omar Sheikh",  requestedRole: "Complaint Handler",  project: "Westgate Mall",     since: "5 hrs ago"  },
];

const WORKFLOW_CONFIGS = [
  { name: "Inspection Approval",   steps: 3, status: "Active"   },
  { name: "Trial Sign-off",        steps: 2, status: "Active"   },
  { name: "Complaint Escalation",  steps: 4, status: "Draft"    },
  { name: "Document Handover",     steps: 2, status: "Active"   },
];

const LOG_TYPE_STYLE = {
  create:  "bg-blue-50 text-blue-600",
  assign:  "bg-green-50 text-green-600",
  warning: "bg-amber-50 text-amber-600",
  update:  "bg-gray-100 text-gray-500",
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-bold text-extra-darkblue">{value}</p>
        <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-extra-darkblue">Admin Dashboard</h2>
        <p className="text-sm text-gray-400 mt-0.5">System overview for managers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Audit Log Alerts */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-500" />
              <h3 className="text-sm font-bold text-extra-darkblue">Audit Log</h3>
            </div>
            <span className="text-xs text-gray-400">{AUDIT_LOGS.length} recent</span>
          </div>
          <div className="divide-y divide-gray-50">
            {AUDIT_LOGS.map(log => (
              <div key={log.id} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                <span className={`mt-0.5 text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${LOG_TYPE_STYLE[log.type]}`}>
                  {log.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-extra-darkblue font-medium truncate">{log.action}</p>
                  <p className="text-xs text-gray-400 mt-0.5">by {log.user} · {log.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">

          {/* Pending Role Assignments */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-extra-blue" />
                <h3 className="text-sm font-bold text-extra-darkblue">Pending Role Assignments</h3>
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{PENDING_ROLES.length}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {PENDING_ROLES.map(r => (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-full bg-lightblue text-extra-blue flex items-center justify-center text-xs font-bold shrink-0">
                    {r.user.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-extra-darkblue truncate">{r.user}</p>
                    <p className="text-xs text-gray-400">{r.requestedRole} · {r.project}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors">Approve</button>
                    <button className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Approval Workflow Configs */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <Settings size={15} className="text-extra-blue" />
              <h3 className="text-sm font-bold text-extra-darkblue">Approval Workflow Configs</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {WORKFLOW_CONFIGS.map(w => (
                <div key={w.name} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-semibold text-extra-darkblue">{w.name}</p>
                    <p className="text-xs text-gray-400">{w.steps} steps</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${w.status === "Active" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                    {w.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}