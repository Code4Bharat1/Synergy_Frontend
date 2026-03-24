"use client";
import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import axiosInstance from "../../lib/axios";

// ── API Helper ────────────────────────────────────────────────────────────────
const apiFetch = async (path, { method = "GET", body } = {}) => {
  const token = localStorage.getItem("accessToken");
  const config = {
    method,
    url: path,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { data: JSON.parse(body) } : {}),
  };
  const res = await axiosInstance(config);
  return res.data;
};

// ── Status mapping: backend → frontend display ────────────────────────────────
// Backend:  open | in-progress | resolved | closed
// Frontend display: Open | In Progress | Resolved | Closed
// Approve action → resolved
// Reject  action → closed

const STATUS_DISPLAY = {
  open: {
    label: "Open",
    badge: "bg-amber-100 text-amber-700 border border-amber-200",
    dot: "bg-amber-500",
  },
  "in-progress": {
    label: "In Progress",
    badge: "bg-blue-100 text-blue-700 border border-blue-200",
    dot: "bg-blue-500",
  },
  resolved: {
    label: "Resolved",
    badge: "bg-green-100 text-green-700 border border-green-200",
    dot: "bg-green-500",
  },
  closed: {
    label: "Closed",
    badge: "bg-red-100 text-red-700 border border-red-200",
    dot: "bg-red-500",
  },
};

const PRIORITY_CLS = {
  critical: {
    badge: "bg-red-100 text-red-700 border border-red-200",
    dot: "bg-red-500",
  },
  high: {
    badge: "bg-amber-100 text-amber-700 border border-amber-200",
    dot: "bg-amber-500",
  },
  medium: {
    badge: "bg-blue-100 text-blue-700 border border-blue-200",
    dot: "bg-blue-500",
  },
  low: {
    badge: "bg-green-100 text-green-700 border border-green-200",
    dot: "bg-green-500",
  },
};

const CAT_ICONS = {
  Structural: (
    <svg
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  ),
  Hydraulics: (
    <svg
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  ),
  "Surface Finish": (
    <svg
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  Electrical: (
    <svg
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function Chip({ label, badgeCls, dotCls }) {
  return (
    <span
      className={`${badgeCls} inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap`}
    >
      {dotCls && (
        <span className={`${dotCls} w-1.5 h-1.5 rounded-full shrink-0`} />
      )}
      {label}
    </span>
  );
}

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
const daysAgo = (d) => {
  if (!d) return "—";
  const n = Math.ceil((new Date() - new Date(d)) / 86400000);
  return n === 0 ? "Today" : n === 1 ? "Yesterday" : `${n}d ago`;
};

const isPending = (c) => c.status === "open" || c.status === "in-progress";

// ── Main Component ────────────────────────────────────────────────────────────
export default function ComplaintApproval() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null); // { type: "approve" | "reject" }
  const [comment, setComment] = useState("");
  const [showDetail, setShowDetail] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch("/complaints");
      const list = Array.isArray(data) ? data : [];
      setComplaints(list);
      // Auto-select first open complaint
      if (!selected && list.length > 0) {
        const first = list.find((c) => isPending(c)) || list[0];
        setSelected(first._id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // ── Approve / Reject ───────────────────────────────────────────────────────
  const resolve = async () => {
    if (!active) return;
    try {
      setActionLoading(true);
      const newStatus = modal.type === "approve" ? "resolved" : "closed";
      await apiFetch(`/complaints/${active._id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: newStatus,
          resolutionNotes: comment.trim() || undefined,
          ...(newStatus === "resolved"
            ? { resolvedAt: new Date().toISOString() }
            : {}),
        }),
      });
      setModal(null);
      setComment("");
      // Move selection to next pending
      const remaining = complaints.filter(
        (c) => c._id !== active._id && isPending(c),
      );
      if (remaining.length) setSelected(remaining[0]._id);
      await fetchComplaints();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const filterMap = {
    all: null,
    pending: ["open", "in-progress"],
    resolved: ["resolved"],
    closed: ["closed"],
  };

  const filtered =
    filter === "all"
      ? complaints
      : complaints.filter((c) => filterMap[filter]?.includes(c.status));

  const active =
    complaints.find((c) => c._id === selected) || filtered[0] || null;

  const counts = {
    all: complaints.length,
    pending: complaints.filter((c) => isPending(c)).length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
    closed: complaints.filter((c) => c.status === "closed").length,
  };

  const sm = active
    ? STATUS_DISPLAY[active.status] || STATUS_DISPLAY["open"]
    : null;
  const pm = active
    ? PRIORITY_CLS[active.priority] || PRIORITY_CLS["medium"]
    : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="flex items-center justify-center py-24 gap-2 text-gray-400">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">Loading complaints…</span>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-blue-950 flex flex-col">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4 flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-0.5">
            Client Relations
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-blue-950">
            Complaint Approval
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Live stat chips */}
          {[
            {
              label: `${counts.pending} Pending`,
              cls: "bg-amber-50 text-amber-700",
              dot: "bg-amber-500",
            },
            {
              label: `${counts.resolved} Resolved`,
              cls: "bg-green-50 text-green-700",
              dot: "bg-green-500",
            },
            {
              label: `${counts.closed} Closed`,
              cls: "bg-red-50 text-red-700",
              dot: "bg-red-500",
            },
          ]?.map((s) => (
            <div
              key={s.label}
              className={`${s.cls} flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold`}
            >
              <span className={`${s.dot} w-1.5 h-1.5 rounded-full`} />
              {s.label}
            </div>
          ))}
          <button
            onClick={fetchComplaints}
            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 sm:mx-6 lg:mx-8 mb-3 flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
          <AlertCircle size={14} />
          <span>{error}</span>
          <button
            onClick={fetchComplaints}
            className="ml-auto text-xs underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Mobile back */}
      {showDetail && (
        <div className="lg:hidden px-4 pb-3">
          <button
            onClick={() => setShowDetail(false)}
            className="flex items-center gap-2 text-sm font-semibold text-blue-700"
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to complaints
          </button>
        </div>
      )}

      {/* Split layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — list */}
        <div
          className={`${showDetail ? "hidden" : "flex"} lg:flex flex-col w-full lg:w-72 lg:shrink-0 bg-white border-r border-gray-100`}
        >
          {/* Filter tabs */}
          <div className="px-4 border-b border-gray-100 flex gap-0 overflow-x-auto">
            {[
              { key: "all", label: "All" },
              { key: "pending", label: "Pending" },
              { key: "resolved", label: "Resolved" },
              { key: "closed", label: "Closed" },
            ]?.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-1 py-3 mr-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all
                  ${filter === f.key ? "border-blue-800 text-blue-950" : "border-transparent text-gray-400 hover:text-gray-600"}`}
              >
                {f.label}{" "}
                <span className="opacity-60 ml-0.5">{counts[f.key]}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="py-10 text-center text-sm text-gray-300">
                No complaints
              </p>
            )}
            {filtered?.map((c) => {
              const cpm = PRIORITY_CLS[c.priority] || PRIORITY_CLS["medium"];
              const csm = STATUS_DISPLAY[c.status] || STATUS_DISPLAY["open"];
              const isActive = selected === c._id;
              return (
                <div
                  key={c._id}
                  onClick={() => {
                    setSelected(c._id);
                    setShowDetail(true);
                  }}
                  className={`px-4 py-3.5 border-b border-gray-50 cursor-pointer border-l-[3px] transition-all
                    ${isActive ? "bg-blue-50 border-l-blue-800" : "bg-white border-l-transparent hover:bg-slate-50"}`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span
                      className={`text-[10px] font-bold tracking-wide ${isActive ? "text-blue-700" : "text-gray-400"}`}
                    >
                      {c._id.slice(-6).toUpperCase()}
                    </span>
                    <Chip
                      label={csm.label}
                      badgeCls={csm.badge}
                      dotCls={csm.dot}
                    />
                  </div>
                  <p className="text-xs font-bold text-blue-950 leading-snug line-clamp-2 mb-1.5">
                    {c.title}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 truncate max-w-[60%]">
                      {c.project?.name || "No project"}
                    </span>
                    <Chip
                      label={c.priority}
                      badgeCls={cpm.badge}
                      dotCls={null}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — detail */}
        {active ? (
          <div
            className={`${!showDetail ? "hidden" : "flex"} lg:flex flex-1 flex-col overflow-y-auto px-4 sm:px-6 py-5`}
          >
            <div className="max-w-3xl w-full">
              {/* Title row */}
              <div className="mb-5">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="text-xs font-bold text-blue-500 tracking-wider">
                    {active._id.slice(-8).toUpperCase()}
                  </span>
                  <span className="text-gray-200 text-xs">·</span>
                  <span className="text-xs text-gray-400">
                    {active.project?.name || "No project"}
                  </span>
                  <Chip
                    label={active.priority}
                    badgeCls={pm.badge}
                    dotCls={null}
                  />
                  <Chip label={sm.label} badgeCls={sm.badge} dotCls={sm.dot} />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-blue-950 leading-snug mb-1">
                  {active.title}
                </h2>
                <p className="text-xs text-gray-400">
                  {active.project?.name || "—"} · Client:{" "}
                  {active.project?.clientName || "—"}
                </p>
              </div>

              {/* Meta strip */}
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-4 grid grid-cols-2 sm:grid-cols-4">
                {[
                  { label: "Logged By", value: active.loggedBy?.name || "—" },
                  { label: "Date", value: fmtDate(active.createdAt) },
                  { label: "Time Open", value: daysAgo(active.createdAt) },
                  {
                    label: "Assigned To",
                    value: active.assignedTo?.name || "Unassigned",
                  },
                ]?.map((m, i) => (
                  <div
                    key={m.label}
                    className={`p-3.5 sm:p-4 ${i < 3 ? "border-b sm:border-b-0 sm:border-r border-gray-50" : ""}`}
                  >
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      {m.label}
                    </p>
                    <p className="text-sm font-bold text-blue-950">{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <svg
                      width="12"
                      height="12"
                      fill="none"
                      stroke="#4988C4"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-blue-950">
                    Complaint Description
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {active.description}
                </p>
              </div>

              {/* Resolution block — resolved */}
              {active.status === "resolved" && (
                <div className="mb-4 rounded-2xl p-4 flex items-start gap-3 border bg-green-50 border-green-200">
                  <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-green-100">
                    <svg
                      width="13"
                      height="13"
                      fill="none"
                      stroke="#16A34A"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold mb-1 text-green-700">
                      Resolved by{" "}
                      {active.assignedTo?.name || active.loggedBy?.name || "—"}{" "}
                      · {fmtDate(active.resolvedAt || active.updatedAt)}
                    </p>
                    {active.resolutionNotes && (
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {active.resolutionNotes}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Resolution block — closed/rejected */}
              {active.status === "closed" && (
                <div className="mb-4 rounded-2xl p-4 flex items-start gap-3 border bg-red-50 border-red-200">
                  <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-red-100">
                    <svg
                      width="13"
                      height="13"
                      fill="none"
                      stroke="#DC2626"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold mb-1 text-red-700">
                      Closed · {fmtDate(active.updatedAt)}
                    </p>
                    {active.resolutionNotes && (
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {active.resolutionNotes}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons — only for open/in-progress */}
              {isPending(active) && (
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => setModal({ type: "approve" })}
                    className="flex items-center gap-2 bg-blue-950 hover:bg-blue-800 text-white rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <svg
                      width="13"
                      height="13"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => setModal({ type: "reject" })}
                    className="flex items-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl px-5 py-2.5 text-sm font-bold transition-all"
                  >
                    <svg
                      width="13"
                      height="13"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                    Close Complaint
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center text-gray-300 text-sm">
            Select a complaint to view details
          </div>
        )}
      </div>

      {/* ── Confirm Modal ── */}
      {modal && active && (
        <div className="fixed inset-0 bg-blue-950/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${modal.type === "approve" ? "bg-green-50" : "bg-red-50"}`}
                >
                  {modal.type === "approve" ? (
                    <svg
                      width="15"
                      height="15"
                      fill="none"
                      stroke="#16A34A"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg
                      width="15"
                      height="15"
                      fill="none"
                      stroke="#DC2626"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-950">
                    {modal.type === "approve"
                      ? "Mark as Resolved"
                      : "Close Complaint"}
                  </p>
                  <p className="text-xs text-gray-400 truncate max-w-[220px]">
                    {active.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModal(null)}
                className="text-gray-300 hover:text-gray-500 transition-colors"
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-4">
              {/* Complaint summary */}
              <div className="bg-slate-50 border border-gray-100 rounded-xl px-4 py-3 mb-4 space-y-1">
                <p className="text-xs font-bold text-blue-950">
                  {active.title}
                </p>
                <p className="text-xs text-gray-400">
                  {active.project?.name || "No project"} · {active.priority}{" "}
                  priority
                </p>
              </div>

              <label className="block text-xs font-bold text-blue-950 mb-2">
                {modal.type === "approve"
                  ? "Resolution Notes"
                  : "Reason for Closing"}
                <span className="font-normal text-gray-400 ml-1">
                  — optional
                </span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  modal.type === "approve"
                    ? "Describe how the complaint was resolved…"
                    : "Reason for closing this complaint…"
                }
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs text-blue-950 resize-none font-sans bg-white outline-none focus:border-blue-400 transition-colors"
              />
            </div>

            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-500 rounded-xl text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={resolve}
                disabled={actionLoading}
                className={`flex-[2] py-2.5 text-white rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-60
                  ${modal.type === "approve" ? "bg-blue-950 hover:bg-blue-800" : "bg-red-600 hover:bg-red-700"}`}
              >
                {actionLoading && (
                  <Loader2 size={13} className="animate-spin" />
                )}
                {modal.type === "approve"
                  ? "Confirm Resolved"
                  : "Confirm Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
