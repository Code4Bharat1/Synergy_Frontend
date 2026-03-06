"use client";
import { useState, useEffect, useCallback } from "react";
import { DollarSign, Calendar, MessageSquareWarning, Wrench, X, CheckCircle2, XCircle, Clock, Loader2, FileText } from "lucide-react";

import axiosInstance from "../../lib/axios";

const apiFetch = async (path, { method = "GET", body } = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const config = {
    method,
    url: path,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { data: JSON.parse(body) } : {}),
  };
  const res = await axiosInstance(config);
  return res.data;
};

const TYPE_CONFIG = {
  "Budget Deviation": { icon: DollarSign, color: "bg-amber-50 text-amber-600" },
  "Timeline Extension": { icon: Calendar, color: "bg-blue-50 text-blue-600" },
  "High-Value Complaint": { icon: MessageSquareWarning, color: "bg-red-50 text-red-500" },
  "Corrective Action": { icon: Wrench, color: "bg-purple-50 text-purple-600" },
  "Document Review": { icon: FileText, color: "bg-blue-50 text-blue-600" },
};

const PRIORITY_STYLE = {
  High: "bg-red-50 text-red-500",
  Medium: "bg-amber-50 text-amber-600",
  Low: "bg-gray-100 text-gray-500",
  default: "bg-gray-50 text-gray-500"
};

const STATUS_CONFIG = {
  Pending: { cls: "bg-amber-50 text-amber-600", icon: Clock },
  Approved: { cls: "bg-green-50 text-green-600", icon: CheckCircle2 },
  Rejected: { cls: "bg-red-50 text-red-500", icon: XCircle },
};

const ALL_TYPES = ["All", "Budget Deviation", "Timeline Extension", "High-Value Complaint", "Corrective Action", "Document Review"];

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
        <p className="text-sm text-gray-500">
          Rejecting <strong className="text-extra-darkblue">{item?.id}</strong> — {item?.project}
        </p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="Reason for rejection…"
          className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none outline-none focus:border-medium-blue transition-colors placeholder-gray-300 text-extra-darkblue"
        />
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason)}
            disabled={!reason.trim()}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors
              ${reason.trim() ? "bg-red-500 hover:bg-red-600" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}>
            Confirm Reject
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Approval Card ─────────────────────────────────────────────────────────────
function ApprovalCard({ item, onApprove, onReject, loadingActionId }) {
  const t = TYPE_CONFIG[item.type] || TYPE_CONFIG["Document Review"];
  const s = STATUS_CONFIG[item.status] || STATUS_CONFIG.Pending;
  const StatusIcon = s.icon;
  const TypeIcon = t.icon;
  const isPending = item.status === "Pending";
  const isActionLoading = loadingActionId === item.id;

  const borderCls = isPending
    ? "border-gray-100"
    : item.status === "Approved"
      ? "border-green-200"
      : "border-red-200";

  return (
    <div className={`w-full bg-white rounded-xl border shadow-sm overflow-hidden ${borderCls}`}>
      <div className="p-4 space-y-3">

        <div className="flex items-start gap-3 w-full">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${t.color}`}>
            <TypeIcon size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 w-full">
              <span className="text-xs font-mono font-bold text-extra-blue shrink-0 truncate max-w-24">{item.id}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.default}`}>
                  {item.priority}
                </span>
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${s.cls}`}>
                  <StatusIcon size={10} /> {item.status}
                </span>
              </div>
            </div>
            <p className="text-sm font-bold text-extra-darkblue mt-1">{item.type}</p>
            <p className="text-xs text-gray-400 mt-0.5">{item.project}</p>
            <p className="text-xs text-gray-400">{item.requestedBy} · {item.date}</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed break-words">{item.detail}</p>

        <div className="pt-2 border-t border-gray-100 space-y-2">
          {item.amount && <span className="text-sm font-bold text-extra-darkblue block">{item.amount}</span>}
          {isPending && (
            <div className="flex gap-2 w-full">
              <button
                onClick={() => onReject(item)}
                disabled={isActionLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50">
                <XCircle size={13} /> Reject
              </button>
              <button
                onClick={() => onApprove(item.id)}
                disabled={isActionLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50">
                {isActionLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                Approve
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
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("All");
  const [rejecting, setRejecting] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingActionId, setLoadingActionId] = useState(null);

  const showToast = (msg, isError = false) => { setToast({ msg, isError }); setTimeout(() => setToast(null), 2500); };

  const fetchDocumentsAsApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/documents");
      const docs = Array.isArray(data) ? data : data.documents || [];

      const mappedDocs = docs.map(d => ({
        id: d._id,
        type: "Document Review", // Treat all documents as Document Review for director
        project: d.project?.name || "Global",
        detail: `Title: ${d.title}. Type: ${d.documentType}. \nURL: ${d.url}`,
        amount: "",
        requestedBy: d.uploadedBy?.name || "Unknown User",
        date: new Date(d.createdAt).toLocaleDateString(),
        priority: "Medium",
        status: d.status ? d.status.charAt(0).toUpperCase() + d.status.slice(1) : "Pending", // Pending, Approved, Rejected
      }));
      setItems(mappedDocs);
    } catch (err) {
      console.error(err);
      showToast("Error loading approvals", true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocumentsAsApprovals();
  }, [fetchDocumentsAsApprovals]);

  const approve = async (id) => {
    try {
      setLoadingActionId(id);
      await apiFetch(`/documents/${id}`, { method: "PUT", body: JSON.stringify({ status: "approved" }) });
      setItems(p => p.map(i => i.id === id ? { ...i, status: "Approved" } : i));
      showToast("Request approved successfully");
    } catch (err) {
      console.error("Error approving:", err);
      showToast("Failed to approve", true);
    } finally {
      setLoadingActionId(null);
    }
  };

  const reject = async (reason) => {
    try {
      setLoadingActionId(rejecting.id);
      await apiFetch(`/documents/${rejecting.id}`, { method: "PUT", body: JSON.stringify({ status: "rejected" }) });
      setItems(p => p.map(i => i.id === rejecting.id ? { ...i, status: "Rejected" } : i));
      setRejecting(null);
      showToast("Request rejected successfully");
    } catch (err) {
      console.error("Error rejecting:", err);
      showToast("Failed to reject", true);
    } finally {
      setLoadingActionId(null);
    }
  };

  const filtered = filter === "All" ? items : items.filter(i => i.type === filter);
  const pending = items.filter(i => i.status === "Pending").length;

  return (
    <div className="w-full max-w-full overflow-hidden space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg ${toast.isError ? "bg-red-500" : "bg-extra-darkblue"}`}>
          <CheckCircle2 size={15} className={`${toast.isError ? "text-red-200" : "text-green-400"}`} /> {toast.msg}
        </div>
      )}

      {rejecting && (
        <RejectModal item={rejecting} onConfirm={reject} onCancel={() => setRejecting(null)} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-extra-darkblue">Approvals</h2>
          <p className="text-sm text-gray-400 mt-0.5">{pending} pending review</p>
        </div>
        {pending > 0 && (
          <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shrink-0">
            <Clock size={13} /> {pending} awaiting decision
          </span>
        )}
      </div>

      {/* Type filter — horizontally scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {ALL_TYPES.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0
              ${filter === f
                ? "bg-extra-darkblue text-white"
                : "bg-white border border-gray-200 text-gray-500 hover:border-extra-blue hover:text-extra-blue"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
          <Loader2 size={18} className="animate-spin" /> Fetching pending approvals…
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <ApprovalCard
              key={item.id}
              item={item}
              onApprove={approve}
              onReject={(i) => setRejecting(i)}
              loadingActionId={loadingActionId}
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-10">No approvals in this category</p>
          )}
        </div>
      )}
    </div>
  );
}