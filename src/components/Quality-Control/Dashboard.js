"use client";
import { ClipboardList, Clock, CheckCircle2, XCircle, ArrowRight, FileText } from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────
const PENDING_INSPECTIONS = [
  { id: "INS-001", project: "Block A – Level 3 Electrical", site: "Greenfield Complex", due: "26 Feb 2026", priority: "High"   },
  { id: "INS-002", project: "Block B – Plumbing Rough-in",  site: "Greenfield Complex", due: "27 Feb 2026", priority: "Medium" },
  { id: "INS-003", project: "Roof Waterproofing Phase 2",   site: "Harbor View Tower",  due: "28 Feb 2026", priority: "High"   },
];

const TRIALS = [
  { id: "TRL-001", project: "HVAC Trial – Zone 4",    site: "Harbor View Tower",  submittedBy: "Ahmad Raza", submitted: "24 Feb 2026" },
  { id: "TRL-002", project: "Sprinkler System Trial",  site: "Greenfield Complex", submittedBy: "James K.",   submitted: "23 Feb 2026" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const PRIORITY_STYLES = {
  High:   "bg-red-50 text-red-600",
  Medium: "bg-amber-50 text-amber-600",
  Low:    "bg-green-50 text-green-600",
};

function PriorityBadge({ priority }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_STYLES[priority]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        priority === "High" ? "bg-red-500" : priority === "Medium" ? "bg-amber-500" : "bg-green-500"
      }`} />
      {priority}
    </span>
  );
}

function StatCard({ label, value, sub, icon: Icon, colorClass }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4 shadow-sm`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
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
export default function QCDashboard() {
  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div>
        <h2 className="text-lg font-bold text-extra-darkblue">QC Dashboard</h2>
        <p className="text-sm text-gray-400 mt-0.5">Wednesday, 25 February 2026</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pending Inspections" value="4"  sub="Due this week"    icon={ClipboardList} colorClass="bg-lightblue text-extra-blue"    />
        <StatCard label="Awaiting Approval"   value="2"  sub="Trial submissions" icon={Clock}         colorClass="bg-blue-50 text-medium-blue"      />
        <StatCard label="Completed Today"     value="3"  sub="Signed off"        icon={CheckCircle2}  colorClass="bg-green-50 text-green-600"        />
        <StatCard label="Rejected / Flagged"  value="1"  sub="Needs rework"      icon={XCircle}       colorClass="bg-red-50 text-red-500"            />
      </div>

      {/* ── Pending Inspections ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-extra-darkblue">Pending Inspections</h3>
          <a href="/quality-control/inspection" className="flex items-center gap-1 text-xs font-semibold text-extra-blue hover:underline">
            View all <ArrowRight size={12} />
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["ID", "Project", "Site", "Due Date", "Priority"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {PENDING_INSPECTIONS.map(row => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-extra-blue">{row.id}</td>
                  <td className="px-5 py-3.5 font-medium text-extra-darkblue">{row.project}</td>
                  <td className="px-5 py-3.5 text-gray-500">{row.site}</td>
                  <td className="px-5 py-3.5 text-gray-600">{row.due}</td>
                  <td className="px-5 py-3.5"><PriorityBadge priority={row.priority} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Trials Awaiting Approval ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-extra-darkblue">Trials Awaiting Approval</h3>
          <a href="/quality-control/punch-in" className="flex items-center gap-1 text-xs font-semibold text-extra-blue hover:underline">
            View all <ArrowRight size={12} />
          </a>
        </div>

        <div className="divide-y divide-gray-50">
          {TRIALS.map(t => (
            <div key={t.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-lightblue text-extra-blue flex items-center justify-center shrink-0">
                <FileText size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-extra-darkblue truncate">{t.project}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.site} · {t.submittedBy} · {t.submitted}</p>
              </div>
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full shrink-0">
                Pending Review
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}