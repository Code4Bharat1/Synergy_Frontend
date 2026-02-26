"use client";
import { useState } from "react";
import { DollarSign, Calendar, MessageSquareWarning, Wrench, X, CheckCircle2, XCircle, Clock, Filter } from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────
const APPROVALS = [
  { id: "APR-001", type: "Budget Deviation",          project: "Westgate Mall",       detail: "Additional structural reinforcement required due to soil report revision.",        amount: "PKR 4.2M",   requestedBy: "Sara Malik",  date: "24 Feb 2026", priority: "High",   status: "Pending" },
  { id: "APR-002", type: "Timeline Extension",         project: "Harbor View Tower",   detail: "Rain delays and material shortage caused 3-week setback on framing phase.",        amount: "+21 days",   requestedBy: "Omar Sheikh", date: "23 Feb 2026", priority: "High",   status: "Pending" },
  { id: "APR-003", type: "High-Value Complaint",       project: "Greenfield Complex",  detail: "Waterproofing failure in basement B1. Remediation cost estimated at PKR 780K.",   amount: "PKR 780K",   requestedBy: "Ahmad Raza",  date: "22 Feb 2026", priority: "Medium", status: "Pending" },
  { id: "APR-004", type: "Budget Deviation",          project: "Sunrise Residency",   detail: "Premium paint finish requested by client, upgraded from standard spec.",           amount: "PKR 1.1M",   requestedBy: "Priya Nair",  date: "21 Feb 2026", priority: "Low",    status: "Pending" },
  { id: "APR-005", type: "Corrective Action",          project: "Harbor View Tower",   detail: "Replace failed concrete batch B-2025-031 across floors 3–6. Full retest needed.", amount: "PKR 2.8M",   requestedBy: "Bilal Khan",  date: "20 Feb 2026", priority: "High",   status: "Pending" },
  { id: "APR-006", type: "Timeline Extension",         project: "Greenfield Complex",  detail: "MEP sub-contractor delayed. Requesting 10-day buffer for MEP rough-in.",           amount: "+10 days",   requestedBy: "Sara Malik",  date: "19 Feb 2026", priority: "Medium", status: "Approved"},
  { id: "APR-007", type: "High-Value Complaint",       project: "Westgate Mall",       detail: "Safety harness not provided to 12 workers. HSQE investigation required.",         amount: "PKR 0",      requestedBy: "James K.",    date: "18 Feb 2026", priority: "High",   status: "Rejected"},
];

const TYPE_CONFIG = {
  "Budget Deviation":    { icon: DollarSign,             color: "bg-amber-50 text-amber-600",  border: "border-amber-200" },
  "Timeline Extension":  { icon: Calendar,               color: "bg-blue-50 text-blue-600",    border: "border-blue-200"  },
  "High-Value Complaint":{ icon: MessageSquareWarning,   color: "bg-red-50 text-red-500",      border: "border-red-200"   },
  "Corrective Action":   { icon: Wrench,                 color: "bg-purple-50 text-purple-600",border: "border-purple-200"},
};

const PRIORITY_STYLE = {
  High:   "bg-red-50 text-red-500",
  Medium: "bg-amber-50 text-amber-600",
  Low:    "bg-gray-100 text-gray-500",
};

const STATUS_CONFIG = {
  Pending:  { cls: "bg-amber-50 text-amber-600",  icon: Clock         },
  Approved: { cls: "bg-green-50 text-green-600",  icon: CheckCircle2  },
  Rejected: { cls: "bg-red-50 text-red-500",      icon: XCircle       },
};

const ALL_TYPES = ["All", "Budget Deviation", "Timeline Extension", "High-Value Complaint", "Corrective Action"];

// ── Reject Modal ──────────────────────────────────────────────────────────────
function RejectModal({ item, onConfirm, onCancel }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-extra-darkblue">Reject Request</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-500">Rejecting <strong className="text-extra-darkblue">{item?.id}</strong> — {item?.project}</p>
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Reason for rejection…"
          className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none outline-none focus:border-medium-blue transition-colors placeholder-gray-300 text-extra-darkblue" />
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
          <button onClick={() => reason.trim() && onConfirm(reason)} disabled={!reason.trim()}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors ${reason.trim() ? "bg-red-500 hover:bg-red-600" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}>
            Confirm Reject
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Approval Card ─────────────────────────────────────────────────────────────
function ApprovalCard({ item, onApprove, onReject }) {
  const t = TYPE_CONFIG[item.type];
  const s = STATUS_CONFIG[item.status];
  const StatusIcon = s.icon;
  const TypeIcon   = t.icon;
  const isPending  = item.status === "Pending";

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${isPending ? "border-gray-100" : item.status === "Approved" ? "border-green-200" : "border-red-200"}`}>
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${t.color}`}>
            <TypeIcon size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <span className="text-xs font-mono font-bold text-extra-blue">{item.id}</span>
                <p className="text-sm font-bold text-extra-darkblue mt-0.5">{item.type}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${s.cls}`}>
                  <StatusIcon size={10} /> {item.status}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[item.priority]}`}>{item.priority}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">{item.project} · Requested by {item.requestedBy} · {item.date}</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-3 leading-relaxed">{item.detail}</p>

        <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm font-bold text-extra-darkblue">{item.amount}</span>
          {isPending && (
            <div className="flex gap-2">
              <button onClick={() => onReject(item)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                <XCircle size={13} /> Reject
              </button>
              <button onClick={() => onApprove(item.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 transition-colors">
                <CheckCircle2 size={13} /> Approve
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Approvals() {
  const [items,     setItems]     = useState(APPROVALS);
  const [filter,    setFilter]    = useState("All");
  const [rejecting, setRejecting] = useState(null);
  const [toast,     setToast]     = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const approve = (id) => { setItems(p => p.map(i => i.id === id ? { ...i, status: "Approved" } : i)); showToast("Request approved"); };
  const reject  = (reason) => { setItems(p => p.map(i => i.id === rejecting.id ? { ...i, status: "Rejected" } : i)); setRejecting(null); showToast("Request rejected"); };

  const filtered = filter === "All" ? items : items.filter(i => i.type === filter);
  const pending  = items.filter(i => i.status === "Pending").length;

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-extra-darkblue text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg">
          <CheckCircle2 size={15} className="text-green-400" /> {toast}
        </div>
      )}
      {rejecting && <RejectModal item={rejecting} onConfirm={reject} onCancel={() => setRejecting(null)} />}

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-extra-darkblue">Approvals</h2>
          <p className="text-sm text-gray-400 mt-0.5">{pending} pending review</p>
        </div>
        {pending > 0 && (
          <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <Clock size={13} /> {pending} awaiting your decision
          </span>
        )}
      </div>

      {/* Type filter — scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {ALL_TYPES.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0
              ${filter === f ? "bg-extra-darkblue text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-extra-blue hover:text-extra-blue"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(item => (
          <ApprovalCard key={item.id} item={item} onApprove={approve} onReject={(i) => setRejecting(i)} />
        ))}
        {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-10">No approvals in this category</p>}
      </div>
    </div>
  );
}