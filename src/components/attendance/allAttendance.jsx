"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Calendar, RefreshCw, Download,
  ChevronLeft, ChevronRight, Clock, Users,
  CheckCircle2, XCircle, AlertCircle, X, Activity,
  CheckCheck, Shield, ThumbsUp, ThumbsDown, Pencil, Save,
  CalendarDays, Phone, Briefcase, Building2,
  ChevronDown, ChevronUp, SlidersHorizontal, ArrowUpDown, Lock,
} from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});
const PAGE_SIZE = 25;

// ── Helpers ───────────────────────────────────────────────────────────────────
function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function fmtTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso),
    h = d.getHours(),
    m = d.getMinutes();
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function fmtDuration(inIso, outIso) {
  if (!inIso || !outIso) return "—";
  const mins = Math.round((new Date(outIso) - new Date(inIso)) / 60000);
  if (mins <= 0) return "—";
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}
function toLocalHHMM(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
const LATE_AFTER = { h:9, m:30 };
function calcStatus(inHHMM, outHHMM) {
  if (!inHHMM) return "absent";
  const [inH, inM] = inHHMM.split(":")?.map(Number);
  const isLate =
    inH > LATE_AFTER.h || (inH === LATE_AFTER.h && inM > LATE_AFTER.m);
  if (!outHHMM) return isLate ? "late" : "present";
  const [outH, outM] = outHHMM.split(":")?.map(Number);
  const mins = outH * 60 + outM - (inH * 60 + inM);
  if (mins < 240) return "half-day";
  return isLate ? "late" : "present";
}
function getEngineerName(rec) {
  return (
    rec.assignment?.engineer?.name ||
    rec.markedBy?.name ||
    rec.markedBy?.email ||
    "Unknown Engineer"
  );
}
function getProjectName(rec) {
  if (rec.assignment?.project?.name) return rec.assignment.project.name;
  if (rec.assignment?.project?.title) return rec.assignment.project.title;
  return null;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  present:    { label:"Present",  cls:"bg-emerald-50 text-emerald-700 border-emerald-200", dot:"bg-emerald-500", leftBorder:"border-l-emerald-400" },
  absent:     { label:"Absent",   cls:"bg-red-50 text-red-600 border-red-200",             dot:"bg-red-400",     leftBorder:"border-l-red-300"     },
  late:       { label:"Late",     cls:"bg-amber-50 text-amber-700 border-amber-200",       dot:"bg-amber-500",   leftBorder:"border-l-amber-400"   },
  "half-day": { label:"Half Day", cls:"bg-purple-50 text-purple-700 border-purple-200",    dot:"bg-purple-500",  leftBorder:"border-l-purple-400"  },
  "on-leave": { label:"On Leave", cls:"bg-sky-50 text-sky-700 border-sky-200",             dot:"bg-sky-500",     leftBorder:"border-l-sky-400"     },
};
const APPROVAL_CONFIG = {
  pending:  { label:"Pending",  cls:"bg-amber-50 text-amber-600 border-amber-200"},
  approved: { label:"Approved", cls:"bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label:"Rejected", cls:"bg-red-50 text-red-600 border-red-200" },
};
const TRADE_COLORS = {
  mason: "bg-orange-50 text-orange-600 border-orange-100",
  electrician: "bg-yellow-50 text-yellow-700 border-yellow-100",
  plumber: "bg-blue-50 text-blue-600 border-blue-100",
  carpenter: "bg-amber-50 text-amber-700 border-amber-100",
  welder: "bg-red-50 text-red-600 border-red-100",
  painter: "bg-pink-50 text-pink-600 border-pink-100",
  supervisor: "bg-indigo-50 text-indigo-600 border-indigo-100",
  general: "bg-gray-100 text-gray-500 border-gray-200",
  other: "bg-gray-100 text-gray-500 border-gray-200",
};
const AVATAR_BG = [
  "bg-orange-100 text-orange-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
  "bg-indigo-100 text-indigo-700",
];
function avatarBg(name="") {
  let n=0; for(let i=0;i<name.length;i++) n+=name.charCodeAt(i);
  return AVATAR_BG[n%AVATAR_BG.length];
}

// ── Filter Chip ───────────────────────────────────────────────────────────────
function Chip({ label, onRemove, color="bg-[#0f1f3d]/10 text-[#0f1f3d]", capitalize=false }) {
  return (
    <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${color} ${capitalize?"capitalize":""}`}>
      {label}
      <button onClick={onRemove} className="hover:opacity-70"><X size={10}/></button>
    </span>
  );
}

// ── API ───────────────────────────────────────────────────────────────────────
const api = {
  async getAllRecords(dateFrom, dateTo) {
    const params = new URLSearchParams({ all: "true" });
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    const res = await fetch(`${API_BASE}/site-attendance/all?${params}`, {
      headers: authHeaders(),
    });
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json"))
      throw new Error("Server error — check API_BASE");
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load");
    return data.records || [];
  },
  async patchRecord(id, payload) {
    const res = await fetch(`${API_BASE}/site-attendance/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update");
    return data.record;
  },
  async approveBulk(date, projectId, recordIds) {
    const body = recordIds?.length
      ? { recordIds }
      : { date, ...(projectId ? { projectId } : {}) };
    const res = await fetch(`${API_BASE}/site-attendance/approve-bulk`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Approval failed");
    return data;
  },
  async rejectBulk(date, projectId, recordIds, reason) {
    const body = recordIds?.length
      ? { recordIds, reason }
      : { date, reason, ...(projectId ? { projectId } : {}) };
    const res = await fetch(`${API_BASE}/site-attendance/reject-bulk`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Rejection failed");
    return data;
  },
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-xl max-w-[calc(100vw-2rem)] ${
        toast.type === "success"
          ? "bg-emerald-500"
          : toast.type === "info"
            ? "bg-blue-500"
            : "bg-red-500"
      }`}
    >
      {toast.type === "success" ? (
        <CheckCheck size={15} />
      ) : (
        <AlertCircle size={15} />
      )}
      <span className="truncate">{toast.msg}</span>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, total, pageSize, onChange }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_,i) => i+1);
  let start = Math.max(1, page-2), end = Math.min(totalPages, start+4);
  if (end-start < 4) start = Math.max(1, end-4);
  const visible = pages.slice(start-1, end);
  const from = (page-1)*pageSize+1;
  const to   = Math.min(page*pageSize, total);
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <p className="text-xs text-gray-400">
        Showing <span className="font-semibold text-gray-600">{from}–{to}</span> of{" "}
        <span className="font-semibold text-gray-600">{total}</span> records
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page-1)} disabled={page===1}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft size={14}/>
        </button>
        {start > 1 && <><button onClick={() => onChange(1)} className="w-8 h-8 rounded-lg text-xs font-bold border border-gray-200 text-gray-500 hover:bg-gray-50">1</button>{start > 2 && <span className="text-gray-300 text-xs px-0.5">…</span>}</>}
        {visible.map(p => (
          <button key={p} onClick={() => onChange(p)}
            className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all ${p===page ? "bg-[#0f1f3d] text-white border-[#0f1f3d]" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>{p}</button>
        ))}
        {end < totalPages && <>{end < totalPages-1 && <span className="text-gray-300 text-xs px-0.5">…</span>}<button onClick={() => onChange(totalPages)} className="w-8 h-8 rounded-lg text-xs font-bold border border-gray-200 text-gray-500 hover:bg-gray-50">{totalPages}</button></>}
        <button onClick={() => onChange(page+1)} disabled={page===totalPages}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronRight size={14}/>
        </button>
      </div>
    </div>
  );
}

// ── Inline Edit Modal ─────────────────────────────────────────────────────────
function InlineEditModal({ rec, onClose, onSaved, showToast }) {
  const isApproved = rec.approvalStatus === "approved";
  const [status, setStatus] = useState(rec.status || "absent");
  const [zone,   setZone]   = useState(rec.zone || "");
  const [notes,  setNotes]  = useState(rec.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (isApproved) return;
    setSaving(true);
    try {
      const updated = await api.patchRecord(rec._id, { status, zone, notes });
      onSaved(updated);
      showToast("Record updated successfully", "success");
      onClose();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const worker = rec.worker || {};
  const trade = worker.trade || "general";
  const tradeCls = TRADE_COLORS[trade] || TRADE_COLORS.general;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarBg(worker.name)}`}
            >
              {worker.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#0f1f3d] truncate">{worker.name || "Unknown"}</h3>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${tradeCls}`}>{trade}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[rec.status]?.cls || ""}`}>{STATUS_CONFIG[rec.status]?.label || "Absent"}</span>
                {isApproved && (
                  <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                    <Lock size={9}/> Locked
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* Approved lock notice */}
        {isApproved && (
          <div className="mx-5 mt-4 flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <Lock size={14} className="text-emerald-500 shrink-0 mt-0.5"/>
            <div>
              <p className="text-sm font-bold text-emerald-700">Record is approved &amp; locked</p>
              <p className="text-xs text-emerald-600 mt-0.5">Reject it first if you need to make changes.</p>
            </div>
          </div>
        )}

        {/* Info strip */}
        <div className="px-5 py-3 mt-3 bg-gray-50/60 border-y border-gray-100 grid grid-cols-2 gap-2 text-xs">
          {worker.phone      && <div className="flex items-center gap-1.5 text-gray-500"><Phone size={11}/> {worker.phone}</div>}
          {worker.contractor && <div className="flex items-center gap-1.5 text-gray-500 min-w-0"><Briefcase size={11} className="shrink-0"/><span className="truncate">{worker.contractor}</span></div>}
          {(rec.zone||worker.zone) && <div className="flex items-center gap-1.5 text-gray-500"><Building2 size={11}/> {rec.zone||worker.zone}</div>}
          {fmtDate(rec.date) !== "—" && <div className="flex items-center gap-1.5 text-gray-500"><CalendarDays size={11}/> {fmtDate(rec.date)}</div>}
        </div>

        {/* Form */}
        <div className={`p-5 space-y-4 ${isApproved ? "opacity-50 pointer-events-none select-none" : ""}`}>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                <button key={val} onClick={() => setStatus(val)} disabled={isApproved}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    status===val ? "bg-[#0f1f3d] text-white border-[#0f1f3d]" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}>{cfg.label}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Zone</label>
              <input type="text" placeholder="e.g. Block A" value={zone} onChange={e => setZone(e.target.value)} disabled={isApproved}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-700 placeholder-gray-300 disabled:bg-gray-50"/>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Notes</label>
              <input type="text" placeholder="Any notes…" value={notes} onChange={e => setNotes(e.target.value)} disabled={isApproved}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-700 placeholder-gray-300 disabled:bg-gray-50"/>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
            {isApproved ? "Close" : "Cancel"}
          </button>
          {!isApproved && (
            <button onClick={handleSave} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0f1f3d] text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all active:scale-95">
              {saving ? <><RefreshCw size={13} className="animate-spin"/> Saving…</> : <><Save size={13}/> Save Changes</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({
  action,
  count,
  date,
  projectId,
  selectedIds,
  onClose,
  onDone,
  showToast,
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const isApprove = action === "approve";

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (isApprove) {
        const res = await api.approveBulk(date, projectId, selectedIds);
        showToast(`${res.approvedCount} records approved `, "success");
      } else {
        const res = await api.rejectBulk(
          date,
          projectId,
          selectedIds,
          reason || "Rejected by admin",
        );
        showToast(`${res.rejectedCount} records rejected`, "info");
      }
      onDone();
      onClose();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isApprove ? "bg-emerald-50" : "bg-red-50"}`}
            >
              {isApprove ? (
                <ThumbsUp size={15} className="text-emerald-500" />
              ) : (
                <ThumbsDown size={15} className="text-red-500" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0f1f3d]">{isApprove ? "Approve Attendance" : "Reject Attendance"}</h3>
              <p className="text-xs text-gray-400">{selectedIds?.length ? `${selectedIds.length} selected records` : `${count} pending records`}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X size={15} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${isApprove ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}
          >
            <span className="text-2xl">{isApprove ? "✅" : "❌"}</span>
            <div>
              <p
                className={`text-sm font-bold ${isApprove ? "text-emerald-700" : "text-red-600"}`}
              >
                {count} record{count !== 1 ? "s" : ""} will be{" "}
                {isApprove ? "approved" : "rejected"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {isApprove ? "Approved records will be locked from editing." : "Engineer will need to resubmit after corrections."}
              </p>
            </div>
          </div>
          {!isApprove && (
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Reason (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Punch times inconsistent, please verify…"
                rows={3}
                maxLength={300}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 text-gray-700 placeholder-gray-300 resize-none"
              />
            </div>
          )}
          {isApprove && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 px-3 py-2.5 rounded-xl">
              <Lock size={12} className="text-amber-500 shrink-0 mt-0.5"/>
              <p className="text-xs text-amber-700">Once approved, records are locked. Reject a record first to make edits.</p>
            </div>
          )}
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40 transition-all active:scale-95 ${
              isApprove
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {loading ? (
              <>
                <RefreshCw size={13} className="animate-spin" /> Processing…
              </>
            ) : isApprove ? (
              <>
                <ThumbsUp size={13} /> Approve
              </>
            ) : (
              <>
                <ThumbsDown size={13} /> Reject
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sortable TH ───────────────────────────────────────────────────────────────
function TH({ children, sortKey, sortState = {}, onSort, className = "", right = false }) {
  const active = sortKey && sortState.key === sortKey;
  return (
    <th onClick={() => sortKey && onSort && onSort(sortKey)}
      className={`px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap select-none border-b border-gray-100 ${
        right ? "text-right" : "text-left"
      } ${sortKey ? "cursor-pointer hover:text-gray-600 hover:bg-gray-100/70 transition-colors" : ""} ${className}`}>
      <div className={`flex items-center gap-1.5 ${right ? "justify-end" : ""}`}>
        {children}
        {sortKey && (active
          ? sortState.dir === "asc" ? <ChevronUp size={11} className="text-[#0f1f3d]"/> : <ChevronDown size={11} className="text-[#0f1f3d]"/>
          : <ArrowUpDown size={10} className="opacity-20"/>
        )}
      </div>
    </th>
  );
}

// ── Desktop Table Row ─────────────────────────────────────────────────────────
function TableRow({ rec, selected, onToggleSelect, onEdit, onApproveOne, onRejectOne, idx }) {
  const worker     = rec.worker || {};
  const status     = STATUS_CONFIG[rec.status] || STATUS_CONFIG.absent;
  const approval   = APPROVAL_CONFIG[rec.approvalStatus || "pending"];
  const trade      = worker.trade || "general";
  const tradeCls   = TRADE_COLORS[trade] || TRADE_COLORS.general;
  const projName   = getProjectName(rec);
  const isApproved = rec.approvalStatus === "approved";

  return (
    <tr className={`group transition-colors border-b border-gray-50 last:border-0 ${
      selected    ? "bg-blue-50/60"
      : isApproved? "bg-emerald-50/20"
      : idx%2===0 ? "bg-white"
      : "bg-gray-50/25"
    } hover:bg-slate-50/80`}>

      {/* Checkbox */}
      <td className="pl-5 pr-3 py-4 w-10">
        <input type="checkbox" checked={selected} onChange={onToggleSelect}
          className="w-3.5 h-3.5 rounded accent-[#0f1f3d] cursor-pointer"/>
      </td>

      {/* Worker */}
      <td className="px-4 py-4 min-w-[190px]">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarBg(worker.name)}`}>
            {worker.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[#0f1f3d] truncate leading-snug">{worker.name || "Unknown"}</p>
            {worker.phone && <p className="text-xs text-gray-400 truncate mt-0.5">{worker.phone}</p>}
          </div>
        </div>
      </td>

      {/* Trade */}
      <td className="px-4 py-4 w-[130px]">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${tradeCls}`}>{trade}</span>
      </td>

      {/* Engineer / Project */}
      <td className="px-4 py-4 min-w-[170px]">
        <p className="text-[13px] font-medium text-gray-700 truncate">{getEngineerName(rec)}</p>
        {projName && <p className="text-xs text-blue-500 truncate mt-0.5"> {projName}</p>}
      </td>

      {/* Contractor */}
      <td className="px-4 py-4 min-w-[130px]">
        <p className="text-[13px] text-gray-500 truncate">{worker.contractor || "—"}</p>
      </td>

      {/* Date */}
      <td className="px-4 py-4 w-[120px]">
        <p className="text-[13px] font-medium text-gray-700 whitespace-nowrap">{fmtDate(rec.date)}</p>
      </td>

      {/* Zone */}
      <td className="px-4 py-4 w-[100px]">
        <p className="text-[13px] text-gray-500">{rec.zone || worker.zone || "—"}</p>
      </td>

      {/* Status */}
      <td className="px-4 py-4 w-[130px]">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full shrink-0 ${status.dot}`}/>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${status.cls}`}>{status.label}</span>
        </div>
      </td>

      {/* Approval */}
      <td className="px-4 py-4 w-[130px]">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${approval.cls}`}>{approval.icon} {approval.label}</span>
          {isApproved && <Lock size={11} className="text-emerald-400 shrink-0"/>}
        </div>
      </td>

      {/* Notes */}
      <td className="px-4 py-4 min-w-[140px] max-w-[180px]">
        <p className="text-xs text-gray-400 truncate" title={rec.notes}>{rec.notes || "—"}</p>
      </td>

      {/* Actions */}
      <td className="pl-2 pr-5 py-4 w-[130px]">
        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          {isApproved ? (
            <span className="flex items-center gap-1 text-[11px] text-gray-300 px-2.5 py-1.5 rounded-lg border border-gray-100 bg-gray-50">
              <Lock size={10}/> Locked
            </span>
          ) : (
            <>
              <button onClick={() => onEdit(rec)} title="Edit"
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#0f1f3d] transition-colors">
                <Pencil size={13}/>
              </button>
              <button onClick={() => onApproveOne(rec)} title="Approve"
                className="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors">
                <ThumbsUp size={13}/>
              </button>
            </>
          )}
          {rec.approvalStatus !== "rejected" && (
            <button onClick={() => onRejectOne(rec)} title="Reject"
              className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
              <ThumbsDown size={13}/>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Mobile Record Card ────────────────────────────────────────────────────────
function MobileRecordCard({ rec, selected, onToggleSelect, onEdit, onApproveOne, onRejectOne }) {
  const worker     = rec.worker || {};
  const status     = STATUS_CONFIG[rec.status] || STATUS_CONFIG.absent;
  const approval   = APPROVAL_CONFIG[rec.approvalStatus || "pending"];
  const trade      = worker.trade || "general";
  const tradeCls   = TRADE_COLORS[trade] || TRADE_COLORS.general;
  const projName   = getProjectName(rec);
  const isApproved = rec.approvalStatus === "approved";

  return (
    <div className={`rounded-xl border-l-4 p-4 transition-all ${
      selected     ? "bg-blue-50/40 border border-blue-200 border-l-blue-400 shadow-sm"
      : isApproved ? "bg-emerald-50/30 border border-emerald-100 border-l-emerald-400 shadow-sm"
      : `bg-white border border-gray-100 shadow-sm ${status.leftBorder}`
    }`}>
      <div className="flex items-start gap-3">
        <input type="checkbox" checked={selected} onChange={onToggleSelect}
          className="w-3.5 h-3.5 rounded accent-[#0f1f3d] shrink-0 mt-1 cursor-pointer"/>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarBg(worker.name)}`}>
          {worker.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-[#0f1f3d]">{worker.name || "Unknown"}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${tradeCls}`}>{trade}</span>
            {isApproved && <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold"><Lock size={10}/> Locked</span>}
          </div>
          <p className="text-xs text-gray-500 mb-2">{getEngineerName(rec)}{projName && ` · 🏗️ ${projName}`}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${status.cls}`}>{status.label}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${approval.cls}`}>{approval.icon} {approval.label}</span>
            <span className="text-xs text-gray-400">{fmtDate(rec.date)}</span>
            {(rec.zone||worker.zone) && <span className="text-xs text-gray-400">· {rec.zone||worker.zone}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 justify-end">
        {isApproved ? (
          <span className="flex items-center gap-1 text-xs text-gray-400 px-3 py-1.5 rounded-lg border border-gray-100 bg-gray-50">
            <Lock size={11}/> Approved &amp; Locked
          </span>
        ) : (
          <>
            <button onClick={() => onEdit(rec)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
              <Pencil size={11}/> Edit
            </button>
            <button onClick={() => onApproveOne(rec)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-200 text-emerald-600 bg-emerald-50/60 hover:bg-emerald-100 transition-colors">
              <ThumbsUp size={11}/> Approve
            </button>
          </>
        )}
        {rec.approvalStatus !== "rejected" && (
          <button onClick={() => onRejectOne(rec)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-200 text-red-500 bg-red-50/60 hover:bg-red-100 transition-colors">
            <ThumbsDown size={11}/> Reject
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminAttendancePage() {
  const [records,        setRecords]        = useState([]);
  const [fetching,       setFetching]       = useState(false);
  const [error,          setError]          = useState("");
  const [toast,          setToast]          = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [engineerFilter, setEngineerFilter] = useState("all");
  const [tradeFilter,    setTradeFilter]    = useState("all");
  const [showFilters,    setShowFilters]    = useState(false);

  const [sortState, setSortState] = useState({ key:"date", dir:"desc" });

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return localDateStr(d);
  });
  const [dateTo, setDateTo] = useState(localDateStr());

  const [page,          setPage]          = useState(1);
  const [selectedIds,   setSelectedIds]   = useState(new Set());
  const [editingRec,    setEditingRec]    = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const showToast = (msg, type = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadRecords = useCallback(async () => {
    setFetching(true);
    setError("");
    setSelectedIds(new Set());
    try {
      setRecords(await api.getAllRecords(dateFrom, dateTo));
    } catch (err) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { loadRecords(); }, [loadRecords]);
  useEffect(() => { setPage(1); }, [search, statusFilter, approvalFilter, engineerFilter, tradeFilter, sortState]);

  const engineerOptions = [...new Set(records.map(r => getEngineerName(r)))].filter(Boolean).sort();
  const tradeOptions    = [...new Set(records.map(r => r.worker?.trade).filter(Boolean))].sort();

  const filtered = records.filter(r => {
    const w    = r.worker || {};
    const ms   = !search || [w.name, w.phone, w.contractor, getEngineerName(r), getProjectName(r)||"", r.zone, w.zone]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const mSt  = statusFilter   === "all" || r.status === statusFilter;
    const mAp  = approvalFilter === "all" || (r.approvalStatus||"pending") === approvalFilter;
    const mEng = engineerFilter === "all" || getEngineerName(r) === engineerFilter;
    const mTr  = tradeFilter    === "all" || (r.worker?.trade || "general") === tradeFilter;
    return ms && mSt && mAp && mEng && mTr;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortState.dir === "asc" ? 1 : -1;
    switch (sortState.key) {
      case "worker":   return dir * (a.worker?.name||"").localeCompare(b.worker?.name||"");
      case "engineer": return dir * getEngineerName(a).localeCompare(getEngineerName(b));
      case "date":     return dir * (a.date||"").localeCompare(b.date||"");
      case "status":   return dir * (a.status||"").localeCompare(b.status||"");
      case "approval": return dir * ((a.approvalStatus||"pending").localeCompare(b.approvalStatus||"pending"));
      default: return 0;
    }
  });

  const handleSort = (key) => setSortState(prev =>
    prev.key === key ? { key, dir: prev.dir==="asc" ? "desc" : "asc" } : { key, dir:"asc" }
  );

  const stats = {
    total: filtered.length,
    present: filtered.filter((r) =>
      ["present", "late", "half-day"].includes(r.status),
    ).length,
    absent: filtered.filter((r) => r.status === "absent").length,
    pending: filtered.filter(
      (r) => (r.approvalStatus || "pending") === "pending",
    ).length,
    approved: filtered.filter((r) => r.approvalStatus === "approved").length,
    rejected: filtered.filter((r) => r.approvalStatus === "rejected").length,
  };

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated  = sorted.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const toggleSelect   = (id) => setSelectedIds(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  const clearSelection = () => setSelectedIds(new Set());
  const allPageSel     = paginated.length > 0 && paginated.every(r => selectedIds.has(r._id));
  const somePageSel    = paginated.some(r => selectedIds.has(r._id));
  const pendingSelected = filtered.filter(r => selectedIds.has(r._id) && (r.approvalStatus||"pending") === "pending");

  const handleApproveOne  = (rec) => setConfirmAction({ action:"approve", count:1, date:dateFrom, projectId:"", selectedIds:[rec._id] });
  const handleRejectOne   = (rec) => setConfirmAction({ action:"reject",  count:1, date:dateFrom, projectId:"", selectedIds:[rec._id] });
  const handleActionDone  = () => loadRecords();
  const handleRecordSaved = (updated) => setRecords(prev => prev.map(r => r._id===updated._id ? {...r,...updated} : r));

  const exportCSV = () => {
    const headers = ["Engineer","Project","Worker","Trade","Phone","Contractor","Date","Status","Approval","Zone","Notes"];
    const rows = sorted.map(r => [
      getEngineerName(r), getProjectName(r)||"", r.worker?.name||"", r.worker?.trade||"",
      r.worker?.phone||"", r.worker?.contractor||"", fmtDate(r.date),
      r.status||"", r.approvalStatus||"pending", r.zone||"", r.notes||"",
    ]);
    const csv = [headers, ...rows]
      ?.map((row) =>
        row?.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const a = document.createElement("a");
    const suffix = engineerFilter !== "all" ? `_${engineerFilter.replace(/\s+/g,"_")}` : "";
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = `attendance_${dateFrom}_to_${dateTo}${suffix}.csv`;
    a.click();
  };

  const activeFilterCount = [search, statusFilter!=="all", approvalFilter!=="all", engineerFilter!=="all", tradeFilter!=="all"].filter(Boolean).length;
  const clearFilters = () => { setSearch(""); setStatusFilter("all"); setApprovalFilter("all"); setEngineerFilter("all"); setTradeFilter("all"); };

  return (
    <div className="space-y-5 pb-28">
      {editingRec    && <InlineEditModal rec={editingRec} onClose={() => setEditingRec(null)} onSaved={handleRecordSaved} showToast={showToast}/>}
      {confirmAction && <ConfirmModal {...confirmAction} onClose={() => setConfirmAction(null)} onDone={handleActionDone} showToast={showToast}/>}
      <Toast toast={toast}/>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#0f1f3d]/10 flex items-center justify-center shrink-0">
              <Shield size={15} className="text-[#0f1f3d]"/>
            </div>
            <h2 className="text-xl font-bold text-[#0f1f3d]">Worker Attendance Management</h2>
          </div>
          <p className="text-sm text-gray-400 ml-[42px]">
            {fetching ? "Loading records…" : `${filtered.length} records · ${fmtDate(dateFrom)} – ${fmtDate(dateTo)}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
            <Calendar size={13} className="text-blue-500 shrink-0"/>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="bg-transparent outline-none text-blue-700 text-xs font-semibold cursor-pointer w-[92px]"/>
            <span className="text-blue-300 text-xs">→</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent outline-none text-blue-700 text-xs font-semibold cursor-pointer w-[92px]"
            />
          </div>
          <button onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
              showFilters||activeFilterCount>0 ? "bg-[#0f1f3d] text-white border-[#0f1f3d]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}>
            <SlidersHorizontal size={13}/>
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-white/20 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">{activeFilterCount}</span>
            )}
          </button>
          <button onClick={exportCSV} disabled={filtered.length===0}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all disabled:opacity-40 active:scale-95">
            <Download size={13}/>
            Export CSV
            {engineerFilter !== "all" && <span className="bg-white/25 rounded px-1 text-[10px]">filtered</span>}
          </button>
          <button onClick={loadRecords} disabled={fetching}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50">
            <RefreshCw size={14} className={fetching ? "animate-spin" : ""}/>
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      {!fetching && records.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {[
            { label:"Total",    value:stats.total,    icon:Users,        bg:"bg-slate-50",   ic:"text-slate-500",   filter:null },
            { label:"Present",  value:stats.present,  icon:CheckCircle2, bg:"bg-emerald-50", ic:"text-emerald-600", filter:{ type:"status",   val:"present"  }},
            { label:"Absent",   value:stats.absent,   icon:XCircle,      bg:"bg-red-50",     ic:"text-red-500",     filter:{ type:"status",   val:"absent"   }},
            { label:"Pending",  value:stats.pending,  icon:Clock,        bg:"bg-amber-50",   ic:"text-amber-600",   filter:{ type:"approval", val:"pending"  }},
            { label:"Approved", value:stats.approved, icon:ThumbsUp,     bg:"bg-emerald-50", ic:"text-emerald-600", filter:{ type:"approval", val:"approved" }},
            { label:"Rejected", value:stats.rejected, icon:ThumbsDown,   bg:"bg-red-50",     ic:"text-red-500",     filter:{ type:"approval", val:"rejected" }},
          ].map(s => (
            <button key={s.label}
              onClick={() => {
                if (!s.filter) { clearFilters(); return; }
                if (s.filter.type==="status") setStatusFilter(p => p===s.filter.val ? "all" : s.filter.val);
                else setApprovalFilter(p => p===s.filter.val ? "all" : s.filter.val);
              }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 flex items-center gap-3 hover:shadow-md hover:border-gray-200 transition-all text-left active:scale-[0.98]">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
                <s.icon size={16} className={s.ic}/>
              </div>
              <div>
                <p className="text-xl font-bold text-[#0f1f3d] leading-none mb-0.5">{s.value}</p>
                <p className="text-[11px] font-medium text-gray-400">{s.label}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Approval progress ── */}
      {!fetching && filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <div className="flex items-center justify-between mb-2.5 gap-2 flex-wrap">
            <span className="text-sm font-bold text-[#0f1f3d]">Approval Progress · {stats.approved}/{stats.total}</span>
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              {stats.pending  > 0 && <span className="font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">{stats.pending}</span>}
              {stats.approved > 0 && <span className="font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{stats.approved}</span>}
              {stats.rejected > 0 && <span className="font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200">{stats.rejected}</span>}
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden flex">
            <div className="h-full bg-emerald-500 transition-all duration-700"
              style={{ width:`${filtered.length ? (stats.approved/filtered.length)*100 : 0}%` }}/>
            <div className="h-full bg-red-400 transition-all duration-700"
              style={{ width:`${filtered.length ? (stats.rejected/filtered.length)*100 : 0}%` }}/>
          </div>
        </div>
      )}

      {/* ── Filters Panel ── */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2"><SlidersHorizontal size={12}/> Filters</p>
            {activeFilterCount > 0 && <button onClick={clearFilters} className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1"><X size={11}/> Clear all</button>}
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"/>
            <input type="text" placeholder="Search worker, engineer, contractor, project, zone…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-800 placeholder-gray-300"/>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label:"Engineer",         value:engineerFilter, setter:setEngineerFilter, opts:[["all","All Engineers"],...engineerOptions.map(e=>[e,e])] },
              { label:"Attendance Status",value:statusFilter,   setter:setStatusFilter,   opts:[["all","All Statuses"],...Object.entries(STATUS_CONFIG).map(([v,s])=>[v,s.label])] },
              { label:"Approval Status",  value:approvalFilter, setter:setApprovalFilter, opts:[["all","All"],["pending","Pending"],["approved"," Approved"],["rejected"," Rejected"]] },
              { label:"Trade",            value:tradeFilter,    setter:setTradeFilter,    opts:[["all","All Trades"],...tradeOptions.map(t=>[t,t])] },
            ].map(f => (
              <div key={f.label}>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">{f.label}</label>
                <select value={f.value} onChange={e => f.setter(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-400 text-gray-700 bg-white">
                  {f.opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
          </div>
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {search           && <Chip label={`"${search}"`}       onRemove={() => setSearch("")}/>}
              {engineerFilter!=="all" && <Chip label={` ${engineerFilter}`} onRemove={() => setEngineerFilter("all")} color="bg-blue-100 text-blue-700"/>}
              {statusFilter!=="all"   && <Chip label={STATUS_CONFIG[statusFilter]?.label} onRemove={() => setStatusFilter("all")} color="bg-purple-100 text-purple-700"/>}
              {approvalFilter!=="all" && <Chip label={APPROVAL_CONFIG[approvalFilter]?.label} onRemove={() => setApprovalFilter("all")} color="bg-amber-100 text-amber-700"/>}
              {tradeFilter!=="all"    && <Chip label={tradeFilter} onRemove={() => setTradeFilter("all")} color="bg-orange-100 text-orange-700" capitalize/>}
            </div>
          )}
        </div>
      )}

      {/* Quick search */}
      {!showFilters && (
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"/>
          <input type="text" placeholder="Search worker, engineer, project…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-800 placeholder-gray-300 bg-white"/>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={loadRecords}
            className="ml-auto text-xs font-bold text-red-500 hover:underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Pending banner ── */}
      {!fetching && stats.pending > 0 && selectedIds.size === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Clock size={15} className="text-amber-500 shrink-0"/>
            <p className="text-sm font-bold text-amber-800">{stats.pending} record{stats.pending!==1?"s":""} awaiting approval</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setConfirmAction({ action:"reject", count:stats.pending, date:dateFrom, projectId:"", selectedIds:[] })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 bg-white text-red-500 text-xs font-bold hover:bg-red-50 active:scale-95 transition-all">
              <ThumbsDown size={12}/> Reject All
            </button>
            <button onClick={() => setConfirmAction({ action:"approve", count:stats.pending, date:dateFrom, projectId:"", selectedIds:[] })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold active:scale-95 transition-all shadow-sm">
              <ThumbsUp size={12}/> Approve All {stats.pending}
            </button>
          </div>
        </div>
      )}

      {/* ── Bulk selection bar ── */}
      {selectedIds.size > 0 && (
        <div className="bg-[#0f1f3d] rounded-2xl px-5 py-3.5 flex items-center gap-3 flex-wrap shadow-lg">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <CheckCheck size={15} className="text-white/60 shrink-0"/>
            <span className="text-sm font-bold text-white">{selectedIds.size} selected</span>
            {pendingSelected.length > 0 && <span className="text-xs text-amber-300">({pendingSelected.length} pending)</span>}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={clearSelection} className="text-xs font-bold text-white/50 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors">Clear</button>
            <button onClick={() => setSelectedIds(new Set(filtered.map(r=>r._id)))}
              className="text-xs font-bold text-white/70 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors">All {filtered.length}</button>
            <button onClick={() => setConfirmAction({ action:"approve", count:pendingSelected.length, date:dateFrom, projectId:"", selectedIds:pendingSelected.map(r=>r._id) })}
              disabled={pendingSelected.length===0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold disabled:opacity-40 active:scale-95 transition-all">
              <ThumbsUp size={12}/> Approve ({pendingSelected.length})
            </button>
            <button onClick={() => setConfirmAction({ action:"reject", count:pendingSelected.length, date:dateFrom, projectId:"", selectedIds:pendingSelected.map(r=>r._id) })}
              disabled={pendingSelected.length===0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-bold disabled:opacity-40 active:scale-95 transition-all">
              <ThumbsDown size={12}/> Reject ({pendingSelected.length})
            </button>
          </div>
        </div>
      )}

      {/* ── Main table card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Table toolbar */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2 bg-gray-50/30">
          <div className="flex items-center gap-2.5">
            <Activity size={14} className="text-gray-400"/>
            <span className="text-sm font-semibold text-[#0f1f3d]">
              {fetching ? "Loading…" : `${filtered.length} record${filtered.length!==1?"s":""}`}
            </span>
            {engineerFilter !== "all" && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">👷 {engineerFilter}</span>
            )}
            {activeFilterCount > 0 && engineerFilter==="all" && (
              <span className="text-xs text-gray-400">(filtered)</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1"><X size={10}/> Clear</button>
            )}
            <span className="text-xs text-gray-400">{PAGE_SIZE}/page</span>
          </div>
        </div>

        {/* Skeleton */}
        {fetching && (
          <div className="p-5 space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="rounded-xl bg-gray-50 animate-pulse flex items-center gap-4 px-4 py-4.5">
                <div className="w-4 h-4 rounded bg-gray-200 shrink-0"/>
                <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0"/>
                <div className="flex-1 space-y-2"><div className="h-3 bg-gray-200 rounded w-1/4"/><div className="h-2.5 bg-gray-200 rounded w-1/5"/></div>
                <div className="w-16 h-6 bg-gray-200 rounded-full"/>
                <div className="w-20 h-6 bg-gray-200 rounded-full"/>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!fetching && sorted.length===0 && !error && (
          <div className="py-20 text-center px-4">
            <p className="text-5xl mb-3">📋</p>
            <p className="text-sm font-bold text-gray-500 mb-1">
              {records.length>0 ? "No records match your current filters." : "No attendance submitted for this period."}
            </p>
            <p className="text-xs text-gray-400 mb-4">
              {records.length>0 ? "Try adjusting your search or filters above." : "Adjust the date range and try again."}
            </p>
            {records.length>0 && <button onClick={clearFilters} className="text-xs font-bold text-blue-600 hover:underline">Clear all filters</button>}
          </div>
        )}

        {/* ── DESKTOP TABLE ── */}
        {!fetching && paginated.length > 0 && (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50/70">
                  <th className="pl-5 pr-3 py-4 w-10 border-b border-gray-100">
                    <input type="checkbox" checked={allPageSel}
                      ref={el => { if (el) el.indeterminate = somePageSel && !allPageSel; }}
                      onChange={() => {
                        if (allPageSel) { const n=new Set(selectedIds); paginated.forEach(r=>n.delete(r._id)); setSelectedIds(n); }
                        else { const n=new Set(selectedIds); paginated.forEach(r=>n.add(r._id)); setSelectedIds(n); }
                      }}
                      className="w-3.5 h-3.5 rounded accent-[#0f1f3d] cursor-pointer"/>
                  </th>
                  <TH sortKey="worker"   sortState={sortState} onSort={handleSort}>Worker</TH>
                  <TH sortKey="trade"    sortState={sortState} onSort={handleSort}>Trade</TH>
                  <TH sortKey="engineer" sortState={sortState} onSort={handleSort}>Engineer / Project</TH>
                  <TH>Contractor</TH>
                  <TH sortKey="date"     sortState={sortState} onSort={handleSort}>Date</TH>
                  <TH>Zone</TH>
                  <TH sortKey="status"   sortState={sortState} onSort={handleSort}>Status</TH>
                  <TH sortKey="approval" sortState={sortState} onSort={handleSort}>Approval</TH>
                  <TH>Notes</TH>
                  <TH right>Actions</TH>
                </tr>
              </thead>
              <tbody>
                {paginated.map((rec, idx) => (
                  <TableRow key={rec._id||idx} rec={rec} idx={idx}
                    selected={selectedIds.has(rec._id)}
                    onToggleSelect={() => toggleSelect(rec._id)}
                    onEdit={setEditingRec}
                    onApproveOne={handleApproveOne}
                    onRejectOne={handleRejectOne}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── MOBILE CARDS ── */}
        {!fetching && paginated.length > 0 && (
          <div className="md:hidden p-3 space-y-2.5">
            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <input type="checkbox" checked={allPageSel}
                ref={el => { if (el) el.indeterminate = somePageSel && !allPageSel; }}
                onChange={() => {
                  if (allPageSel) { const n=new Set(selectedIds); paginated.forEach(r=>n.delete(r._id)); setSelectedIds(n); }
                  else { const n=new Set(selectedIds); paginated.forEach(r=>n.add(r._id)); setSelectedIds(n); }
                }}
                className="w-3.5 h-3.5 rounded accent-[#0f1f3d] cursor-pointer"/>
              <span className="text-xs font-semibold text-gray-500">Select all on this page ({paginated.length})</span>
            </div>
            {paginated.map((rec, idx) => (
              <MobileRecordCard key={rec._id||idx} rec={rec}
                selected={selectedIds.has(rec._id)}
                onToggleSelect={() => toggleSelect(rec._id)}
                onEdit={setEditingRec}
                onApproveOne={handleApproveOne}
                onRejectOne={handleRejectOne}
              />
            ))}
          </div>
        )}

        {/* Pagination footer */}
        {!fetching && paginated.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/30">
            <Pagination page={page} totalPages={totalPages} total={sorted.length} pageSize={PAGE_SIZE} onChange={setPage}/>
          </div>
        )}
      </div>

      {/* ── Sticky bottom bar ── */}
      {!fetching && stats.pending > 0 && selectedIds.size === 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-2xl px-4 pointer-events-none">
          <div className="bg-[#0f1f3d] rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-4 flex-wrap pointer-events-auto">
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold">⏳ {stats.pending} records still pending</p>
              <p className="text-white/40 text-xs mt-0.5">Approve or reject to finalize attendance</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setConfirmAction({ action:"reject", count:stats.pending, date:dateFrom, projectId:"", selectedIds:[] })}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/20 text-white/70 text-xs font-bold hover:bg-white/10 active:scale-95 transition-all">
                <ThumbsDown size={13}/> Reject All
              </button>
              <button onClick={() => setConfirmAction({ action:"approve", count:stats.pending, date:dateFrom, projectId:"", selectedIds:[] })}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold active:scale-95 transition-all">
                <ThumbsUp size={14}/> Approve All {stats.pending}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
