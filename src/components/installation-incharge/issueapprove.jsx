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
    ...(body ? { data: body } : {}),
  };
  const res = await axiosInstance(config);
  return res.data;
};

// ── Status mapping ─────────────────────────────────────────────────────────────
// Backend:  open | in-progress | resolved
// Display:  Open | In Progress | Resolved
// Approve action → "resolved"
// Reject  action → "in-progress"

const STATUS_META = {
  "open":        { label: "Open",        badge: "bg-amber-100 text-amber-800", dot: "bg-amber-500"  },
  "in-progress": { label: "In Progress", badge: "bg-blue-100 text-blue-800",   dot: "bg-blue-500"   },
  "resolved":    { label: "Resolved",    badge: "bg-green-100 text-green-800", dot: "bg-green-500"  },
};

// Severity is not stored in DB — we derive it from keywords for display
const deriveSeverity = (text = "") => {
  const t = text.toLowerCase();
  if (t.includes("critical") || t.includes("crack") || t.includes("fail") || t.includes("fracture")) return "Critical";
  if (t.includes("high") || t.includes("fatigue") || t.includes("weld") || t.includes("bracket"))    return "High";
  if (t.includes("medium") || t.includes("paint") || t.includes("delamination"))                     return "Medium";
  return "Low";
};

const SEV_META = {
  Critical: { badge: "bg-red-100 text-red-800",      dot: "bg-red-500"    },
  High:     { badge: "bg-orange-100 text-orange-800", dot: "bg-orange-500" },
  Medium:   { badge: "bg-blue-100 text-blue-800",     dot: "bg-blue-500"   },
  Low:      { badge: "bg-green-100 text-green-800",   dot: "bg-green-500"  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const daysAgo = (d) => {
  if (!d) return "—";
  const diff = Math.ceil((new Date() - new Date(d)) / 86400000);
  return diff === 0 ? "Today" : diff === 1 ? "Yesterday" : `${diff}d ago`;
};

const isPending = (issue) => issue.status === "open";

function Chip({ label, badgeCls, dotCls }) {
  return (
    <span className={`${badgeCls} inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap`}>
      <span className={`${dotCls} w-1.5 h-1.5 rounded-full shrink-0`} />
      {label}
    </span>
  );
}

// ── Filter tabs ───────────────────────────────────────────────────────────────
const FILTERS = [
  { key: "all",         label: "All"         },
  { key: "open",        label: "Open"        },
  { key: "in-progress", label: "In Progress" },
  { key: "resolved",    label: "Resolved"    },
];

// ── Main Component ────────────────────────────────────────────────────────────
export default function IssueApproval() {
  const [issues, setIssues]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError]             = useState(null);

  const [filter, setFilter]           = useState("all");
  const [selected, setSelected]       = useState(null);
  const [showDetail, setShowDetail]   = useState(false);

  const [modal, setModal]             = useState(null); // { type: "approve"|"reject", id }
  const [comment, setComment]         = useState("");

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch("/issues");
      const list = Array.isArray(data) ? data : [];
      setIssues(list);
      if (!selected && list.length > 0) {
        const first = list.find(i => isPending(i)) || list[0];
        setSelected(first._id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  // ── Approve / Reject ──────────────────────────────────────────────────────
  const resolve = async () => {
    if (!modal) return;
    try {
      setActionLoading(true);
      // Approve → resolved | Reject → in-progress
      const newStatus = (modal.type === "approve" || modal.type === "resolve") ? "resolved" : "in-progress";
      await apiFetch(`/issues/${modal.id}`, {
        method: "PUT",
        body: {
          status: newStatus,
          ...(newStatus === "resolved" ? { resolvedAt: new Date().toISOString() } : {}),
        },
      });
      setModal(null);
      setComment("");
      // Move to next open issue
      const remaining = issues.filter(i => i._id !== modal.id && isPending(i));
      if (remaining.length) setSelected(remaining[0]._id);
      await fetchIssues();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const counts = {
    all:          issues.length,
    "open":       issues.filter(i => i.status === "open").length,
    "in-progress":issues.filter(i => i.status === "in-progress").length,
    "resolved":   issues.filter(i => i.status === "resolved").length,
  };

  const filtered = filter === "all" ? issues : issues.filter(i => i.status === filter);
  const active   = issues.find(i => i._id === selected) || filtered[0] || null;

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center py-24 gap-2 text-gray-400">
      <Loader2 size={20} className="animate-spin" />
      <span className="text-sm">Loading issues…</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-blue-950 flex flex-col">

      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-0.5">Issue Management</p>
          <h1 className="text-xl sm:text-2xl font-bold text-blue-950">Issue Approval</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: `${counts["open"]} Open`,              cls: "bg-amber-50 text-amber-700", dot: "bg-amber-500"  },
            { label: `${counts["in-progress"]} In Progress`,cls: "bg-blue-50 text-blue-700",   dot: "bg-blue-500"   },
            { label: `${counts["resolved"]} Resolved`,      cls: "bg-green-50 text-green-700", dot: "bg-green-500"  },
          ].map(s => (
            <div key={s.label} className={`${s.cls} flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold`}>
              <span className={`${s.dot} w-1.5 h-1.5 rounded-full`} />
              {s.label}
            </div>
          ))}
          <button onClick={fetchIssues}
            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-gray-600 transition-all">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 sm:mx-6 mb-3 flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
          <AlertCircle size={14} /><span>{error}</span>
          <button onClick={fetchIssues} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}

      {/* Mobile back */}
      {showDetail && (
        <div className="lg:hidden px-4 pb-2">
          <button onClick={() => setShowDetail(false)} className="flex items-center gap-2 text-sm font-semibold text-blue-700">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back to issues
          </button>
        </div>
      )}

      {/* Split layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT — list */}
        <div className={`${showDetail ? "hidden" : "flex"} lg:flex flex-col w-full lg:w-80 lg:shrink-0 bg-white border-r border-gray-100`}>
          {/* Filter tabs */}
          <div className="px-4 pt-3 pb-0 border-b border-gray-100">
            <div className="flex gap-0.5 overflow-x-auto">
              {FILTERS.map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={`px-3 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-all
                    ${filter === f.key ? "border-blue-800 text-blue-950" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                  {f.label} <span className="opacity-60 ml-0.5">{counts[f.key]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Issue rows */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="py-10 text-center text-sm text-gray-300">No issues</div>
            )}
            {filtered.map(issue => {
              const sm  = STATUS_META[issue.status] || STATUS_META["open"];
              const sev = deriveSeverity(issue.problemDescription);
              const sv  = SEV_META[sev];
              const isActive = selected === issue._id;
              return (
                <div key={issue._id}
                  onClick={() => { setSelected(issue._id); setShowDetail(true); }}
                  className={`px-4 py-3.5 border-b border-gray-50 cursor-pointer border-l-[3px] transition-all
                    ${isActive ? "bg-blue-50 border-l-blue-800" : "bg-white border-l-transparent hover:bg-slate-50"}`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-[11px] font-bold tracking-wide ${isActive ? "text-blue-700" : "text-gray-400"}`}>
                      {issue._id.slice(-6).toUpperCase()}
                    </span>
                    <Chip label={sm.label} badgeCls={sm.badge} dotCls={sm.dot} />
                  </div>
                  <p className="text-xs font-bold text-blue-950 leading-snug line-clamp-2 mb-1.5">
                    {issue.problemDescription}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">{issue.responsibleDepartment}</span>
                    <Chip label={sev} badgeCls={sv.badge} dotCls={sv.dot} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — detail */}
        <div className={`${!showDetail ? "hidden" : "flex"} lg:flex flex-1 flex-col overflow-y-auto px-4 sm:px-6 lg:px-8 py-5`}>
          {!active ? (
            <div className="flex items-center justify-center h-full text-sm text-gray-300">
              Select an issue to review
            </div>
          ) : (() => {
            const sm  = STATUS_META[active.status] || STATUS_META["open"];
            const sev = deriveSeverity(active.problemDescription);
            const sv  = SEV_META[sev];
            return (
              <div className="max-w-3xl w-full">

                {/* Title row */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-xs font-bold text-blue-500 tracking-wider">{active._id.slice(-8).toUpperCase()}</span>
                    <span className="text-gray-300 text-xs">·</span>
                    <span className="text-xs text-gray-400">{active.responsibleDepartment}</span>
                    <Chip label={sev}      badgeCls={sv.badge} dotCls={sv.dot} />
                    <Chip label={sm.label} badgeCls={sm.badge} dotCls={sm.dot} />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-blue-950 leading-snug mb-1">
                    {active.problemDescription}
                  </h2>
                  <p className="text-xs text-gray-400">
                    Logged by {active.createdBy?.name || "—"} · {active.createdBy?.email || ""}
                  </p>
                </div>

                {/* Meta strip */}
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-4 grid grid-cols-2 sm:grid-cols-4">
                  {[
                    { label: "Department",  value: active.responsibleDepartment || "—"     },
                    { label: "Logged",      value: fmtDate(active.createdAt)                },
                    { label: "Time Open",   value: daysAgo(active.createdAt)                },
                    { label: "Photo",       value: active.photo ? "Attached" : "No photo"   },
                  ].map((m, i) => (
                    <div key={m.label}
                      className={`p-3.5 sm:p-4 ${i < 3 ? "border-b sm:border-b-0 sm:border-r border-gray-50" : ""}`}>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{m.label}</p>
                      <p className="text-sm font-bold text-blue-950">{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Description + Proposed Solution */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="bg-white border border-gray-100 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <svg width="12" height="12" fill="none" stroke="#4988C4" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-blue-950">Problem Description</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{active.problemDescription}</p>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                        <svg width="12" height="12" fill="none" stroke="#22C55E" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-blue-950">Proposed Solution</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {active.proposedSolution || <span className="text-gray-300 italic">No solution proposed yet</span>}
                    </p>
                  </div>
                </div>

                {/* Photo attachment */}
                {active.photo && (
                  <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
                    <p className="text-xs font-bold text-blue-950 mb-2">Attached Photo</p>
                    <img src={active.photo} alt="Issue photo"
                      className="rounded-xl max-h-48 object-cover border border-gray-100" />
                  </div>
                )}

                {/* Resolution block */}
                {(active.status === "resolved" || active.status === "in-progress") && active.resolvedAt && (
                  <div className={`mb-4 rounded-2xl p-4 flex items-start gap-3 border
                    ${active.status === "resolved" ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}`}>
                    <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center
                      ${active.status === "resolved" ? "bg-green-100" : "bg-blue-100"}`}>
                      {active.status === "resolved"
                        ? <svg width="13" height="13" fill="none" stroke="#16A34A" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                        : <svg width="13" height="13" fill="none" stroke="#3B82F6" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
                      }
                    </div>
                    <div>
                      <p className={`text-xs font-bold mb-1 ${active.status === "resolved" ? "text-green-700" : "text-blue-700"}`}>
                        {active.status === "resolved" ? "Resolved" : "In Progress"} · {fmtDate(active.resolvedAt || active.updatedAt)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action buttons — only for open issues */}
                {active.status === "open" && (
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => setModal({ id: active._id, type: "approve" })}
                      className="flex items-center gap-2 bg-blue-950 hover:bg-blue-800 text-white rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg">
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                      Approve Issue
                    </button>
                    <button
                      onClick={() => setModal({ id: active._id, type: "reject" })}
                      className="flex items-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl px-5 py-2.5 text-sm font-bold transition-all">
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      Mark In Progress
                    </button>
                  </div>
                )}
                {active.status === "in-progress" && (
  <div className="flex gap-3 flex-wrap">
    <button
      onClick={() => setModal({ id: active._id, type: "resolve" })}
      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
      Mark as Resolved
    </button>
  </div>
)}
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Confirmation Modal ── */}
      {modal && (() => {
        const issue     = issues.find(i => i._id === modal.id);
        const isApprove = modal.type === "approve" || modal.type === "resolve";
        if (!issue) return null;
        return (
          <div className="fixed inset-0 bg-blue-950/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isApprove ? "bg-green-50" : "bg-blue-50"}`}>
                    {isApprove
                      ? <svg width="15" height="15" fill="none" stroke="#16A34A" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                      : <svg width="15" height="15" fill="none" stroke="#3B82F6" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
                    }
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-950">
                      {isApprove ? "Approve Issue" : "Mark as In Progress"}
                    </p>
                    <p className="text-xs text-gray-400 truncate max-w-[220px]">{issue.problemDescription}</p>
                  </div>
                </div>
                <button onClick={() => setModal(null)} className="text-gray-300 hover:text-gray-500 p-1">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="px-5 py-4">
                {/* Issue summary */}
                <div className="bg-slate-50 border border-gray-100 rounded-xl p-3.5 mb-4">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1.5">Proposed Solution</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {issue.proposedSolution || <span className="italic text-gray-300">No solution provided</span>}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: "Department", value: issue.responsibleDepartment },
                    { label: "Logged",     value: fmtDate(issue.createdAt)    },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50 border border-gray-100 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
                      <p className="text-sm font-bold text-blue-950">{s.value}</p>
                    </div>
                  ))}
                </div>

                <label className="block text-xs font-bold text-blue-950 mb-2">
                  Comment <span className="font-normal text-gray-400">— optional</span>
                </label>
                <textarea value={comment} onChange={e => setComment(e.target.value)}
                  placeholder={isApprove ? "Add any approval notes..." : "Reason for marking in progress..."}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs text-blue-950 resize-none font-sans bg-white outline-none focus:border-blue-400 transition-colors" />
              </div>

              <div className="px-5 pb-5 flex gap-3">
                <button onClick={() => setModal(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-500 rounded-xl text-sm font-semibold transition-colors">
                  Cancel
                </button>
                <button onClick={resolve} disabled={actionLoading}
                  className={`flex-[2] py-2.5 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60
                    ${isApprove ? "bg-blue-950 hover:bg-blue-800" : "bg-blue-600 hover:bg-blue-700"}`}>
                  {actionLoading && <Loader2 size={13} className="animate-spin" />}
                  {isApprove ? "Confirm Approval" : "Confirm In Progress"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}