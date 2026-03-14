"use client";
import { useState, useEffect, useCallback } from "react";
import { DollarSign, Calendar, MessageSquareWarning, Wrench, X, CheckCircle2, XCircle, Clock, Loader2, FileText, Eye, Info } from "lucide-react";

import axiosInstance from "../../lib/axios";
import Link from "next/link";

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

const FILE_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1")
  .replace("/api/v1", "")
  .replace("/api", "");


const TYPE_CONFIG = {
  "Budget Deviation": { icon: DollarSign, color: "bg-amber-50 text-amber-600" },
  "Timeline Extension": { icon: Calendar, color: "bg-blue-50 text-blue-600" },
  "High-Value Complaint": { icon: MessageSquareWarning, color: "bg-red-50 text-red-500" },
  "Corrective Action": { icon: Wrench, color: "bg-purple-50 text-purple-600" },
  "Document Review": { icon: FileText, color: "bg-blue-50 text-blue-600" },
  "Expense Approval": { icon: DollarSign, color: "bg-green-50 text-green-600" },
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

const ALL_TYPES = ["All", "Budget Deviation", "Timeline Extension", "High-Value Complaint", "Corrective Action", "Document Review", "Expense Approval"];

// ── Renders detail text with URLs as clickable blue links ─────────────────────
function DetailWithLinks({ text }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return (
    <p className="text-sm text-gray-600 leading-relaxed break-words">
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <Link key={i} href={part} target="_blank" rel="noopener noreferrer"
            className="text-blue-500 underline hover:text-blue-700 transition-colors break-all">
            Click Here
          </Link>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

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
          Rejecting <strong className="text-extra-darkblue">{item?.project}</strong>
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

// ── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({ item, onClose }) {
  if (!item) return null;
  const t = TYPE_CONFIG[item.type] || TYPE_CONFIG["Document Review"];
  const s = STATUS_CONFIG[item.status] || STATUS_CONFIG.Pending;
  const TypeIcon = t.icon;
  const StatusIcon = s.icon;

  const renderDetailContent = () => {
    if (item.detail.startsWith("Details: {")) {
      try {
        const obj = JSON.parse(item.detail.replace("Details: ", ""));
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(obj).map(([k, v]) => (
              <div key={k} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                  {k.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-sm font-semibold text-extra-darkblue break-words">
                  {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                </p>
              </div>
            ))}
          </div>
        );
      } catch (e) {
        return <DetailWithLinks text={item.detail} />;
      }
    }
    return <DetailWithLinks text={item.detail} />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col z-10 anim-scale-in">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${t.color}`}>
              <TypeIcon size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-extra-darkblue leading-none">{item.type}</h3>
              <p className="text-xs text-gray-400 mt-1">{item.project} {item.projectId && `· ${item.projectId}`}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.cls}`}>
                <StatusIcon size={12} /> {item.status}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority</p>
              <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.default}`}>
                {item.priority}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Requested By</p>
              <p className="text-sm font-bold text-extra-darkblue">{item.requestedBy}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</p>
              <p className="text-sm font-bold text-extra-darkblue">{item.date}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1">Request Information</p>
            {renderDetailContent()}
            {item.amount && (
              <div className="mt-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
                <span className="text-sm font-bold text-blue-900">Requested Amount</span>
                <span className="text-xl font-bold text-blue-600">{item.amount}</span>
              </div>
            )}
            {item.reviewNotes || item.rejectReason ? (
              <div className="mt-4 p-4 bg-red-50/50 rounded-2xl border border-red-100 space-y-1">
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Review Notes</p>
                <p className="text-sm text-red-600 font-medium">{item.reviewNotes || item.rejectReason}</p>
              </div>
            ) : null}

            {item.url && (
              <div className="mt-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-0.5">Attachment</p>
                  <p className="text-sm font-bold text-emerald-900">Receipt / Document File</p>
                </div>
                <Link
                  href={item.url}
                  target="_blank"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  <Eye size={14} /> View File
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-extra-darkblue hover:opacity-90 transition-all shadow-lg shadow-blue-900/10">
            Got it
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
            {/* ── id removed from here ── */}
            <div className="flex items-center justify-between gap-2 w-full">
              <p className="text-sm font-bold text-extra-darkblue">{item.type}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.default}`}>
                  {item.priority}
                </span>
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${s.cls}`}>
                  <StatusIcon size={10} /> {item.status}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{item.project}</p>
            <p className="text-xs text-gray-400">{item.requestedBy} · {item.date}</p>
          </div>
        </div>

        {/* ── URL rendered as clickable link ── */}
        <DetailWithLinks text={item.detail} />

        <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            {item.amount ? (
              <span className="text-sm font-bold text-extra-darkblue">{item.amount}</span>
            ) : (
              <div />
            )}
            <button
              onClick={() => onApprove(item, true)} // Second param true means request detail
              className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider"
            >
              <Eye size={13} /> View Details
            </button>
          </div>

          {isPending && (
            <div className="flex gap-2 w-full pt-1">
              <button
                onClick={() => onReject(item)}
                disabled={isActionLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50">
                <XCircle size={13} /> Reject
              </button>
              <button
                onClick={() => onApprove(item)}
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
  const [selectedItem, setSelectedItem] = useState(null); // For DetailModal

  const showToast = (msg, isError = false) => { setToast({ msg, isError }); setTimeout(() => setToast(null), 2500); };

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const [docRes, appRes, expRes] = await Promise.all([
        apiFetch("/documents").catch(() => []),
        apiFetch("/approvals/all").catch(() => ({ approvals: [] })),
        apiFetch("/expenses/all").catch(() => ({ expenses: [] }))
      ]);

      const docs = Array.isArray(docRes) ? docRes : docRes.documents || [];
      const approvals = Array.isArray(appRes) ? appRes : appRes.approvals || [];
      const expenses = Array.isArray(expRes) ? expRes : expRes.expenses || [];

      const mappedDocs = docs.map(d => ({
        id: d._id,
        source: "documents",
        type: "Document Review",
        project: d.project?.name || "Global",
        detail: `Title: ${d.title}. Type: ${d.documentType}. \nURL: ${d.url}`,
        amount: "",
        requestedBy: d.uploadedBy?.name || "Unknown User",
        date: new Date(d.createdAt).toLocaleDateString(),
        priority: "Medium",
        status: d.status ? d.status.charAt(0).toUpperCase() + d.status.slice(1) : "Pending",
        projectId: d.project?.projectId || "",
        reviewNotes: d.reviewNotes || d.rejectReason || "",
        url: d.url ? (d.url.startsWith("http") ? d.url : `${FILE_BASE}${d.url}`) : "",
      }));

      const mappedApps = approvals.map(a => {
        let detailString = "";
        try { detailString = `Details: ${JSON.stringify(a.details)}`; } catch(e) {}

        return {
          id: a._id,
          source: "approvals",
          type: a.type || "Other",
          project: a.project?.name || "Global",
          detail: detailString,
          amount: a.details?.requestedBudget ? `₹${a.details.requestedBudget}` : "",
          requestedBy: a.requestedBy?.name || "Unknown",
          date: new Date(a.createdAt).toLocaleDateString(),
          priority: "High",
          status: a.status ? a.status.charAt(0).toUpperCase() + a.status.slice(1) : "Pending",
          projectId: a.project?.projectId || "",
          reviewNotes: a.reviewNotes || "",
        };
      });

      const mappedExps = expenses.map(e => ({
        id: e._id,
        source: "expenses",
        type: "Expense Approval",
        project: e.project?.name || "Global",
        detail: `Category: ${e.category}. Description: ${e.description || "N/A"}`,
        amount: `₹${e.amount}`,
        requestedBy: e.submittedBy?.name || "Unknown",
        date: new Date(e.createdAt).toLocaleDateString(),
        priority: "Medium",
        status: e.status ? e.status.charAt(0).toUpperCase() + e.status.slice(1) : "Pending",
        projectId: e.project?.projectId || "",
        reviewNotes: e.reviewNotes || "",
        url: e.receiptUrl ? (e.receiptUrl.startsWith("http") ? e.receiptUrl : `${FILE_BASE}${e.receiptUrl}`) : "",
      }));

      setItems([...mappedDocs, ...mappedApps, ...mappedExps].sort((a,b) => new Date(b.date) - new Date(a.date)));
    } catch (err) {
      console.error(err);
      showToast("Error loading approvals", true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const approve = async (item, justView = false) => {
    if (justView) {
      setSelectedItem(item);
      return;
    }
    try {
      setLoadingActionId(item.id);

      let method = "PATCH";
      let endpoint = "";
      let payload = {};

      if (item.source === "approvals") {
        endpoint = `/approvals/${item.id}/status`;
        payload = { status: "Approved" };
      } else if (item.source === "expenses") {
        endpoint = `/expenses/${item.id}/status`;
        payload = { status: "Approved" };
      } else {
        endpoint = `/documents/${item.id}`;
        method = "PUT";
        payload = { status: "approved" };
      }

      await apiFetch(endpoint, { method, body: JSON.stringify(payload) });
      setItems(p => p.map(i => i.id === item.id ? { ...i, status: "Approved" } : i));
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

      let method = "PATCH";
      let endpoint = "";
      let payload = {};

      if (rejecting.source === "approvals") {
        endpoint = `/approvals/${rejecting.id}/status`;
        payload = { status: "Rejected", reviewNotes: reason };
      } else if (rejecting.source === "expenses") {
        endpoint = `/expenses/${rejecting.id}/status`;
        payload = { status: "Rejected", reviewNotes: reason };
      } else {
        endpoint = `/documents/${rejecting.id}`;
        method = "PUT";
        payload = { status: "rejected", rejectReason: reason };
      }

      await apiFetch(endpoint, { method, body: JSON.stringify(payload) });
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

      {selectedItem && (
        <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
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

      {/* Type filter */}
      <div className="w-full">
        {/* Mobile dropdown filter */}
        <div className="block sm:hidden">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full text-sm border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-extra-darkblue transition-all text-extra-darkblue font-bold bg-white shadow-sm"
          >
            {ALL_TYPES.map(f => (
              <option key={f} value={f}>{f === "All" ? "Filter by Category" : f}</option>
            ))}
          </select>
        </div>

        {/* Desktop scrollable filter */}
        <div className="hidden sm:flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
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
