"use client";
import { useState } from "react";
import { FileText, CheckCircle2, XCircle, Clock, ChevronDown, X, MessageSquare } from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────
const INITIAL_TRIALS = [
  {
    id: "TRL-001",
    project: "HVAC Trial – Zone 4",
    site: "Harbor View Tower",
    submittedBy: "Ahmad Raza",
    submitted: "24 Feb 2026",
    type: "Mechanical",
    description: "Full system trial run of HVAC units in Zone 4. All units operational. Temperature control verified across all floors.",
    attachments: ["hvac_zone4_report.pdf", "temp_readings.xlsx"],
  },
  {
    id: "TRL-002",
    project: "Sprinkler System Trial",
    site: "Greenfield Complex",
    submittedBy: "James K.",
    submitted: "23 Feb 2026",
    type: "Fire Safety",
    description: "Sprinkler pressure test completed at 12 bar. All heads functional. No leakage detected across 3 floors.",
    attachments: ["sprinkler_test_report.pdf"],
  },
  {
    id: "TRL-003",
    project: "Lift Motor Trial Run",
    site: "Westgate Mall",
    submittedBy: "Priya Nair",
    submitted: "22 Feb 2026",
    type: "Electrical",
    description: "Lift motor trial completed. Load test at 110% capacity passed. Emergency braking system verified.",
    attachments: ["lift_trial_certificate.pdf", "load_test_photos.zip"],
  },
  {
    id: "TRL-004",
    project: "Generator Load Test",
    site: "Harbor View Tower",
    submittedBy: "Sara Malik",
    submitted: "21 Feb 2026",
    type: "Electrical",
    description: "Diesel generator load test at full capacity for 2 hours. Auto-transfer switch verified. Fuel consumption logged.",
    attachments: ["gen_load_test.pdf"],
  },
];

const TYPE_STYLES = {
  Mechanical:    { badge: "bg-blue-50 text-blue-600",   dot: "bg-blue-500"   },
  "Fire Safety": { badge: "bg-red-50 text-red-600",     dot: "bg-red-500"    },
  Electrical:    { badge: "bg-amber-50 text-amber-600", dot: "bg-amber-500"  },
};

// ── Reject Modal ──────────────────────────────────────────────────────────────
function RejectModal({ trial, onConfirm, onCancel }) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-extra-darkblue">Reject Trial</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-500">
          You are rejecting <span className="font-semibold text-extra-darkblue">{trial.project}</span>. Please provide a reason.
        </p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={4}
          placeholder="Reason for rejection…"
          className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none outline-none focus:border-medium-blue transition-colors bg-gray-50 text-extra-darkblue placeholder-gray-300"
        />
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason)}
            disabled={!reason.trim()}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors
              ${reason.trim() ? "bg-red-500 text-white hover:bg-red-600" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}
          >
            Confirm Reject
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Trial Card ────────────────────────────────────────────────────────────────
function TrialCard({ trial, decision, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false);
  const typeStyle = TYPE_STYLES[trial.type] || { badge: "bg-gray-100 text-gray-500", dot: "bg-gray-400" };
  const isDecided = !!decision;

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all duration-200
      ${decision?.status === "approved" ? "border-green-200" : decision?.status === "rejected" ? "border-red-200" : "border-gray-100"}`}
    >
      {/* ── Card Header ── */}
      <div className="flex items-start gap-4 p-5">
        <div className="w-10 h-10 rounded-lg bg-lightblue text-extra-blue flex items-center justify-center shrink-0 mt-0.5">
          <FileText size={18} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-extra-blue">{trial.id}</span>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${typeStyle.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${typeStyle.dot}`} />
              {trial.type}
            </span>
          </div>
          <h4 className="text-sm font-bold text-extra-darkblue mt-1">{trial.project}</h4>
          <p className="text-xs text-gray-400 mt-0.5">
            {trial.site}&nbsp;·&nbsp;
            Submitted by <span className="font-medium text-gray-500">{trial.submittedBy}</span>
            &nbsp;·&nbsp;{trial.submitted}
          </p>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2 shrink-0">
          {isDecided ? (
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
              decision.status === "approved" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
            }`}>
              {decision.status === "approved" ? "✓ Approved" : "✗ Rejected"}
            </span>
          ) : (
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
              Pending
            </span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-extra-blue transition-colors"
          >
            <ChevronDown size={16} className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Expanded Detail ── */}
      {expanded && (
        <div className="px-5 pb-4 space-y-3 border-t border-gray-50 pt-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</p>
            <p className="text-sm text-gray-600 leading-relaxed">{trial.description}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Attachments</p>
            <div className="flex flex-wrap gap-2">
              {trial.attachments.map(a => (
                <span key={a} className="flex items-center gap-1.5 text-xs font-medium text-extra-blue bg-lightblue/50 px-3 py-1.5 rounded-lg">
                  <FileText size={11} /> {a}
                </span>
              ))}
            </div>
          </div>

          {/* Rejection reason display */}
          {decision?.status === "rejected" && decision?.reason && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
              <MessageSquare size={13} className="text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-red-500 mb-0.5">Rejection Reason</p>
                <p className="text-xs text-red-600">{decision.reason}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Action Buttons ── */}
      {!isDecided && (
        <div className="flex gap-3 px-5 py-3.5 bg-gray-50 border-t border-gray-100 justify-end">
          <button
            onClick={() => onReject(trial)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <XCircle size={14} /> Reject
          </button>
          <button
            onClick={() => onApprove(trial.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-green-600 bg-green-50 hover:bg-green-100 transition-colors"
          >
            <CheckCircle2 size={14} /> Approve
          </button>
        </div>
      )}
    </div>
  );
}

// ── Filter Tabs ───────────────────────────────────────────────────────────────
function FilterTabs({ active, onChange, counts }) {
  const tabs = [
    { key: "all",      label: "All"      },
    { key: "pending",  label: "Pending"  },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];
  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5
            ${active === t.key ? "bg-white text-extra-darkblue shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          {t.label}
          {counts[t.key] > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
              ${active === t.key ? "bg-lightblue text-extra-blue" : "bg-gray-200 text-gray-500"}`}>
              {counts[t.key]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TrialApproval() {
  const [decisions,      setDecisions]      = useState({});
  const [filter,         setFilter]         = useState("all");
  const [rejectingTrial, setRejectingTrial] = useState(null);

  const approve = (id) => setDecisions(p => ({ ...p, [id]: { status: "approved" } }));
  const reject  = (trial) => setRejectingTrial(trial);
  const confirmReject = (reason) => {
    setDecisions(p => ({ ...p, [rejectingTrial.id]: { status: "rejected", reason } }));
    setRejectingTrial(null);
  };

  const getStatus = (t) => decisions[t.id]?.status ?? "pending";

  const filtered = INITIAL_TRIALS.filter(t => {
    if (filter === "all")      return true;
    if (filter === "pending")  return !decisions[t.id];
    return decisions[t.id]?.status === filter;
  });

  const counts = {
    all:      INITIAL_TRIALS.length,
    pending:  INITIAL_TRIALS.filter(t => !decisions[t.id]).length,
    approved: Object.values(decisions).filter(d => d.status === "approved").length,
    rejected: Object.values(decisions).filter(d => d.status === "rejected").length,
  };

  return (
    <div className="space-y-5">

      {/* Reject Modal */}
      {rejectingTrial && (
        <RejectModal
          trial={rejectingTrial}
          onConfirm={confirmReject}
          onCancel={() => setRejectingTrial(null)}
        />
      )}

      {/* ── Header ── */}
      <div>
        <h2 className="text-lg font-bold text-extra-darkblue">Trial Approval</h2>
        <p className="text-sm text-gray-400 mt-0.5">Review and approve or reject submitted trials</p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Trials",  value: INITIAL_TRIALS.length, icon: FileText,    cls: "bg-lightblue text-extra-blue"   },
          { label: "Pending",       value: counts.pending,         icon: Clock,       cls: "bg-amber-50 text-amber-600"     },
          { label: "Approved",      value: counts.approved,        icon: CheckCircle2,cls: "bg-green-50 text-green-600"     },
          { label: "Rejected",      value: counts.rejected,        icon: XCircle,     cls: "bg-red-50 text-red-500"         },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.cls}`}>
              <s.icon size={17} />
            </div>
            <div>
              <p className="text-xl font-bold text-extra-darkblue">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Tabs ── */}
      <FilterTabs active={filter} onChange={setFilter} counts={counts} />

      {/* ── Trial Cards ── */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 py-12 text-center">
            <p className="text-sm text-gray-400">No trials in this category</p>
          </div>
        ) : (
          filtered.map(t => (
            <TrialCard
              key={t.id}
              trial={t}
              decision={decisions[t.id]}
              onApprove={approve}
              onReject={reject}
            />
          ))
        )}
      </div>

    </div>
  );
}