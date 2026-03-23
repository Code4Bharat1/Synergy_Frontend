"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Search, Calendar, RefreshCw, Download, Filter,
  ChevronLeft, ChevronRight, HardHat, Clock, Users,
  CheckCircle2, XCircle, AlertCircle, X, Activity,
  ChevronDown, ChevronUp, CheckCheck, Shield,
  ThumbsUp, ThumbsDown, Pencil, Save, FolderOpen,
  CalendarDays, Phone, Briefcase, Building2, MapPin,
} from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const getToken = () => typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});
const PAGE_SIZE = 10;

// ── Helpers ───────────────────────────────────────────────────────────────────
function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
}
function fmtTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso), h = d.getHours(), m = d.getMinutes();
  return `${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`;
}
function fmtDuration(inIso, outIso) {
  if (!inIso || !outIso) return "—";
  const mins = Math.round((new Date(outIso) - new Date(inIso)) / 60000);
  if (mins <= 0) return "—";
  return `${Math.floor(mins/60)}h ${mins%60}m`;
}
function toLocalHHMM(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}
function to12hr(hhmm) {
  if (!hhmm) return "—";
  const [h,m] = hhmm.split(":").map(Number);
  return `${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`;
}
const LATE_AFTER = { h:9, m:30 };
function calcStatus(inHHMM, outHHMM) {
  if (!inHHMM) return "absent";
  const [inH,inM] = inHHMM.split(":").map(Number);
  const isLate = inH > LATE_AFTER.h || (inH === LATE_AFTER.h && inM > LATE_AFTER.m);
  if (!outHHMM) return isLate ? "late" : "present";
  const [outH,outM] = outHHMM.split(":").map(Number);
  const mins = (outH*60+outM)-(inH*60+inM);
  if (mins < 240) return "half-day";
  return isLate ? "late" : "present";
}
function groupByDate(records) {
  const map = {};
  records.forEach(r => {
    const k = r.date ? r.date.split("T")[0] : "unknown";
    if (!map[k]) map[k] = [];
    map[k].push(r);
  });
  return Object.entries(map).sort(([a],[b]) => b.localeCompare(a)).map(([date,rows]) => ({ date, rows }));
}
function groupByEngineer(records) {
  const map = {};
  records.forEach(r => {
    const key = getEngineerName(r);
    if (!map[key]) map[key] = { engineerName: key, records: [] };
    map[key].records.push(r);
  });
  return Object.values(map).sort((a,b) => a.engineerName.localeCompare(b.engineerName));
}
function getEngineerName(rec) {
  return rec.assignment?.engineer?.name || rec.markedBy?.name || rec.markedBy?.email || "Unknown Engineer";
}
function getProjectName(rec) {
  if (rec.assignment?.project?.name)  return rec.assignment.project.name;
  if (rec.assignment?.project?.title) return rec.assignment.project.title;
  return null;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  present:    { label:"Present",  cls:"bg-emerald-50 text-emerald-700 border-emerald-200", border:"border-l-emerald-400" },
  absent:     { label:"Absent",   cls:"bg-red-50 text-red-600 border-red-200",             border:"border-l-gray-300"    },
  late:       { label:"Late",     cls:"bg-amber-50 text-amber-700 border-amber-200",       border:"border-l-amber-400"   },
  "half-day": { label:"Half Day", cls:"bg-purple-50 text-purple-700 border-purple-200",    border:"border-l-purple-400"  },
  "on-leave": { label:"On Leave", cls:"bg-sky-50 text-sky-700 border-sky-200",             border:"border-l-sky-400"     },
};
const APPROVAL_CONFIG = {
  pending:  { label:"Pending",  cls:"bg-amber-50 text-amber-600 border-amber-200",       icon:"⏳" },
  approved: { label:"Approved", cls:"bg-emerald-50 text-emerald-700 border-emerald-200", icon:"✅" },
  rejected: { label:"Rejected", cls:"bg-red-50 text-red-600 border-red-200",             icon:"❌" },
};
const TRADE_COLORS = {
  mason:"bg-orange-50 text-orange-600 border-orange-100",
  electrician:"bg-yellow-50 text-yellow-700 border-yellow-100",
  plumber:"bg-blue-50 text-blue-600 border-blue-100",
  carpenter:"bg-amber-50 text-amber-700 border-amber-100",
  welder:"bg-red-50 text-red-600 border-red-100",
  painter:"bg-pink-50 text-pink-600 border-pink-100",
  supervisor:"bg-indigo-50 text-indigo-600 border-indigo-100",
  general:"bg-gray-100 text-gray-500 border-gray-200",
  other:"bg-gray-100 text-gray-500 border-gray-200",
};
const AVATAR_BG = [
  "bg-orange-100 text-orange-700","bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700","bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700","bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700","bg-indigo-100 text-indigo-700",
];
function avatarBg(name="") {
  let n=0; for(let i=0;i<name.length;i++) n+=name.charCodeAt(i);
  return AVATAR_BG[n%AVATAR_BG.length];
}

// ── API ───────────────────────────────────────────────────────────────────────
const api = {
  async getAllRecords(dateFrom, dateTo) {
    const params = new URLSearchParams({ all:"true" });
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo)   params.set("dateTo",   dateTo);
    const res  = await fetch(`${API_BASE}/site-attendance/all?${params}`, { headers: authHeaders() });
    const ct   = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) throw new Error("Server error — check API_BASE");
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load");
    return data.records || [];
  },
  async patchRecord(id, payload) {
    const res  = await fetch(`${API_BASE}/site-attendance/${id}`, {
      method:"PATCH", headers: authHeaders(), body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update");
    return data.record;
  },
  async approveBulk(date, projectId, recordIds) {
    const body = recordIds?.length ? { recordIds } : { date, ...(projectId ? { projectId } : {}) };
    const res  = await fetch(`${API_BASE}/site-attendance/approve-bulk`, {
      method:"POST", headers: authHeaders(), body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Approval failed");
    return data;
  },
  async rejectBulk(date, projectId, recordIds, reason) {
    const body = recordIds?.length ? { recordIds, reason } : { date, reason, ...(projectId ? { projectId } : {}) };
    const res  = await fetch(`${API_BASE}/site-attendance/reject-bulk`, {
      method:"POST", headers: authHeaders(), body: JSON.stringify(body),
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
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-xl max-w-[calc(100vw-2rem)] ${
      toast.type==="success" ? "bg-emerald-500" : toast.type==="info" ? "bg-blue-500" : "bg-red-500"
    }`}>
      {toast.type==="success" ? <CheckCheck size={15}/> : <AlertCircle size={15}/>}
      <span className="truncate">{toast.msg}</span>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_,i) => i+1);
  let start = Math.max(1, page-2), end = Math.min(totalPages, start+4);
  if (end-start < 4) start = Math.max(1, end-4);
  const visible = pages.slice(start-1, end);
  return (
    <div className="flex items-center justify-center gap-1 pt-3">
      <button onClick={() => onChange(page-1)} disabled={page===1}
        className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        <ChevronLeft size={14}/>
      </button>
      {start > 1 && <><button onClick={() => onChange(1)} className="w-7 h-7 rounded-lg text-xs font-bold border border-gray-200 text-gray-500 hover:bg-gray-50">1</button>{start > 2 && <span className="text-gray-300 text-xs">…</span>}</>}
      {visible.map(p => (
        <button key={p} onClick={() => onChange(p)}
          className={`w-7 h-7 rounded-lg text-xs font-bold border transition-all ${p===page ? "bg-extra-darkblue text-white border-extra-darkblue" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
          {p}
        </button>
      ))}
      {end < totalPages && <>{end < totalPages-1 && <span className="text-gray-300 text-xs">…</span>}<button onClick={() => onChange(totalPages)} className="w-7 h-7 rounded-lg text-xs font-bold border border-gray-200 text-gray-500 hover:bg-gray-50">{totalPages}</button></>}
      <button onClick={() => onChange(page+1)} disabled={page===totalPages}
        className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        <ChevronRight size={14}/>
      </button>
    </div>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────
function SectionCard({ icon:Icon, iconColor, iconBg, title, sub, children, action }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon size={15} className={iconColor}/>
          </div>
          <div>
            <h3 className="text-sm font-bold text-extra-darkblue">{title}</h3>
            {sub && <p className="text-xs text-gray-400">{sub}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ── Inline Edit Modal ─────────────────────────────────────────────────────────
function InlineEditModal({ rec, onClose, onSaved, showToast }) {
  const [punchIn,  setPunchIn]  = useState(toLocalHHMM(rec.punchInTime));
  const [punchOut, setPunchOut] = useState(toLocalHHMM(rec.punchOutTime));
  const [status,   setStatus]   = useState(rec.status || "absent");
  const [zone,     setZone]     = useState(rec.zone || "");
  const [notes,    setNotes]    = useState(rec.notes || "");
  const [saving,   setSaving]   = useState(false);

  useEffect(() => { if (punchIn) setStatus(calcStatus(punchIn, punchOut)); }, [punchIn, punchOut]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const base = rec.date ? new Date(rec.date).toISOString().split("T")[0] : localDateStr();
      const updated = await api.patchRecord(rec._id, {
        status,
        punchInTime:  punchIn  ? `${base}T${punchIn}:00`  : null,
        punchOutTime: punchOut ? `${base}T${punchOut}:00` : null,
        zone, notes,
      });
      onSaved(updated);
      showToast("Record updated successfully", "success");
      onClose();
    } catch(err) { showToast(err.message, "error"); }
    finally { setSaving(false); }
  };

  const worker   = rec.worker || {};
  const trade    = worker.trade || "general";
  const tradeCls = TRADE_COLORS[trade] || TRADE_COLORS.general;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarBg(worker.name)}`}>
              {worker.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-extra-darkblue truncate">{worker.name || "Unknown"}</h3>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${tradeCls}`}>{trade}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[rec.status]?.cls || ""}`}>{STATUS_CONFIG[rec.status]?.label || "Absent"}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${APPROVAL_CONFIG[rec.approvalStatus||"pending"].cls}`}>
                  {APPROVAL_CONFIG[rec.approvalStatus||"pending"].icon} {APPROVAL_CONFIG[rec.approvalStatus||"pending"].label}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0"><X size={15}/></button>
        </div>

        {/* Worker info strip */}
        <div className="px-5 py-3 bg-gray-50/60 border-b border-gray-100 grid grid-cols-2 gap-2 text-xs">
          {worker.phone      && <div className="flex items-center gap-1.5 text-gray-500"><Phone     size={11}/> {worker.phone}</div>}
          {worker.contractor && <div className="flex items-center gap-1.5 text-gray-500 min-w-0"><Briefcase size={11} className="shrink-0"/> <span className="truncate">{worker.contractor}</span></div>}
          {(rec.zone||worker.zone) && <div className="flex items-center gap-1.5 text-gray-500"><Building2 size={11}/> {rec.zone||worker.zone}</div>}
          {fmtDate(rec.date) !== "—" && <div className="flex items-center gap-1.5 text-gray-500"><CalendarDays size={11}/> {fmtDate(rec.date)}</div>}
          {worker.idProof && (
            <div className="col-span-2 flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 text-amber-700 font-semibold">
              <span className="text-amber-500 shrink-0">🪪</span>
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mr-1">ID Proof</span>
              <span className="truncate">{worker.idProof}</span>
            </div>
          )}
          {/* Engineer + Project */}
          {(getEngineerName(rec) !== "Unknown Engineer" || getProjectName(rec)) && (
            <div className="col-span-2 space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned Under</p>
              <div className="flex flex-wrap gap-1.5">
                {getProjectName(rec) && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border bg-blue-50 border-blue-100 text-blue-700">
                    <span>🏗️</span>
                    <span>{getProjectName(rec)}</span>
                    <span className="text-blue-300 font-normal">·</span>
                    <span>{getEngineerName(rec)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Status</label>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                <button key={val} onClick={() => setStatus(val)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    status===val ? "bg-extra-darkblue text-white border-extra-darkblue" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}>{cfg.label}</button>
              ))}
            </div>
          </div>
          {/* <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Punch In</label>
              <div className="flex gap-1.5">
                <input type="time" value={punchIn} onChange={e => setPunchIn(e.target.value)}
                  className="flex-1 min-w-0 text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-700"/>
                {!punchIn && (
                  <button onClick={() => setPunchIn(new Date().toTimeString().slice(0,5))}
                    className="px-2 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold hover:bg-emerald-100 shrink-0">Now</button>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Punch Out</label>
              <div className="flex gap-1.5">
                <input type="time" value={punchOut} onChange={e => setPunchOut(e.target.value)}
                  className="flex-1 min-w-0 text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-700"/>
                {punchIn && !punchOut && (
                  <button onClick={() => setPunchOut(new Date().toTimeString().slice(0,5))}
                    className="px-2 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-500 text-xs font-bold hover:bg-red-100 shrink-0">Now</button>
                )}
              </div>
            </div>
          </div> */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Zone</label>
              <input type="text" placeholder="e.g. Block A" value={zone} onChange={e => setZone(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-700 placeholder-gray-300"/>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Notes</label>
              <input type="text" placeholder="Any notes…" value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-700 placeholder-gray-300"/>
            </div>
          </div>
          {(punchIn || punchOut) && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 flex items-center gap-3 flex-wrap text-xs">
              {punchIn  && <span className="text-emerald-600 font-bold">In: {to12hr(punchIn)}</span>}
              {punchOut && <span className="text-red-500 font-bold">Out: {to12hr(punchOut)}</span>}
              {punchIn && punchOut && (() => {
                const today = localDateStr();
                const mins = Math.round((new Date(`${today}T${punchOut}:00`) - new Date(`${today}T${punchIn}:00`))/60000);
                return mins > 0 ? <span className="text-gray-600 font-semibold">{Math.floor(mins/60)}h {mins%60}m</span> : null;
              })()}
              <span className={`ml-auto px-2 py-0.5 rounded-full border font-bold text-xs ${STATUS_CONFIG[status]?.cls||""}`}>
                {STATUS_CONFIG[status]?.label}
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-extra-darkblue text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all active:scale-95">
            {saving ? <><RefreshCw size={13} className="animate-spin"/> Saving…</> : <><Save size={13}/> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ action, count, date, projectId, selectedIds, onClose, onDone, showToast }) {
  const [reason,  setReason]  = useState("");
  const [loading, setLoading] = useState(false);
  const isApprove = action === "approve";

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (isApprove) {
        const res = await api.approveBulk(date, projectId, selectedIds);
        showToast(`${res.approvedCount} records approved ✅`, "success");
      } else {
        const res = await api.rejectBulk(date, projectId, selectedIds, reason || "Rejected by admin");
        showToast(`${res.rejectedCount} records rejected`, "info");
      }
      onDone(); onClose();
    } catch(err) { showToast(err.message, "error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isApprove ? "bg-emerald-50" : "bg-red-50"}`}>
              {isApprove ? <ThumbsUp size={15} className="text-emerald-500"/> : <ThumbsDown size={15} className="text-red-500"/>}
            </div>
            <div>
              <h3 className="text-sm font-bold text-extra-darkblue">{isApprove ? "Approve Attendance" : "Reject Attendance"}</h3>
              <p className="text-xs text-gray-400">{selectedIds?.length ? `${selectedIds.length} selected records` : `${count} pending records`}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={15}/></button>
        </div>
        <div className="p-5 space-y-3">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${isApprove ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}>
            <span className="text-2xl">{isApprove ? "✅" : "❌"}</span>
            <div>
              <p className={`text-sm font-bold ${isApprove ? "text-emerald-700" : "text-red-600"}`}>
                {count} record{count!==1?"s":""} will be {isApprove ? "approved" : "rejected"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {isApprove ? "This finalizes attendance in the database." : "Engineer will need to resubmit after corrections."}
              </p>
            </div>
          </div>
          {!isApprove && (
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Reason (optional)</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)}
                placeholder="e.g. Punch times inconsistent, please verify…"
                rows={3} maxLength={300}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 text-gray-700 placeholder-gray-300 resize-none"/>
            </div>
          )}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 px-3 py-2.5 rounded-xl">
            <AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5"/>
            <p className="text-xs text-amber-700">
              {isApprove ? "You can still edit individual records after approval." : "Rejected records are flagged. Engineers can correct and resubmit."}
            </p>
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleConfirm} disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40 transition-all active:scale-95 ${
              isApprove ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"
            }`}>
            {loading ? <><RefreshCw size={13} className="animate-spin"/> Processing…</> : isApprove ? <><ThumbsUp size={13}/> Approve</> : <><ThumbsDown size={13}/> Reject</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Worker Row (approve tab) ──────────────────────────────────────────────────
function WorkerRow({ rec, selected, onToggleSelect, onEdit, onApprove, onReject }) {
  const worker   = rec.worker || {};
  const status   = STATUS_CONFIG[rec.status]   || STATUS_CONFIG.absent;
  const approval = APPROVAL_CONFIG[rec.approvalStatus || "pending"];
  const trade    = worker.trade || "general";
  const tradeCls = TRADE_COLORS[trade] || TRADE_COLORS.general;
  const projName = getProjectName(rec);

  return (
    <div
      onClick={onEdit}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-l-4 transition-all cursor-pointer hover:shadow-md active:scale-[0.99] ${
        selected ? "bg-blue-50/60 border-blue-200 border-l-blue-400" : `bg-white border-gray-100 ${status.border}`
      }`}>
      <input type="checkbox" checked={selected}
        onClick={e => e.stopPropagation()}
        onChange={onToggleSelect}
        className="w-3.5 h-3.5 rounded accent-extra-darkblue shrink-0 cursor-pointer"/>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarBg(worker.name)}`}>
        {worker.name?.charAt(0)?.toUpperCase() || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-bold text-extra-darkblue truncate">{worker.name || "Unknown"}</p>
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full border capitalize ${tradeCls}`}>{trade}</span>
          {projName && <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full border bg-blue-50 text-blue-600 border-blue-100 hidden sm:inline">🏗️ {projName}</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 flex-wrap">
          {rec.punchInTime
            ? <span className="text-emerald-600 font-semibold">{fmtTime(rec.punchInTime)}</span>
            : <span className="text-gray-300">Not punched in</span>}
          {rec.punchInTime && rec.punchOutTime && (
            <><span className="text-gray-300">→</span>
            <span className="text-red-400 font-semibold">{fmtTime(rec.punchOutTime)}</span>
            <span className="text-gray-500 font-medium">· {fmtDuration(rec.punchInTime, rec.punchOutTime)}</span></>
          )}
          {worker.contractor && <span className="hidden sm:inline">· {worker.contractor}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${status.cls}`}>{status.label}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${approval.cls}`}>{approval.icon} {approval.label}</span>
      </div>
      <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
        <button onClick={onEdit} title="Edit"
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-extra-darkblue transition-colors">
          <Pencil size={12}/>
        </button>
        {(rec.approvalStatus||"pending") !== "approved" && (
          <button onClick={onApprove} title="Approve"
            className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors">
            <ThumbsUp size={12}/>
          </button>
        )}
        {(rec.approvalStatus||"pending") !== "rejected" && (
          <button onClick={onReject} title="Reject"
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
            <ThumbsDown size={12}/>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Engineer Group Card ───────────────────────────────────────────────────────
function EngineerGroup({ engineerName, records, selectedIds, onToggleSelect, onSelectAll, onEdit, onApproveOne, onRejectOne }) {
  const [collapsed, setCollapsed] = useState(false);
  const [page,      setPage]      = useState(1);
  const allSelected  = records.length > 0 && records.every(r => selectedIds.has(r._id));
  const someSelected = records.some(r => selectedIds.has(r._id));
  const pendingCount  = records.filter(r => (r.approvalStatus||"pending") === "pending").length;
  const approvedCount = records.filter(r => r.approvalStatus === "approved").length;
  const presentCount  = records.filter(r => ["present","late","half-day"].includes(r.status)).length;
  const totalPages    = Math.ceil(records.length / PAGE_SIZE);
  const paginated     = records.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Entire header row is clickable to collapse — checkbox stops propagation */}
      <div
        onClick={() => setCollapsed(v => !v)}
        className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex-wrap gap-y-2 cursor-pointer hover:bg-gray-100/70 transition-colors select-none">
        {/* Checkbox stops propagation so clicking it only toggles selection */}
        <input type="checkbox"
          checked={allSelected}
          ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
          onClick={e => e.stopPropagation()}
          onChange={() => onSelectAll(records, !allSelected)}
          className="w-3.5 h-3.5 rounded accent-extra-darkblue shrink-0 cursor-pointer"/>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarBg(engineerName)}`}>
          {engineerName?.charAt(0)?.toUpperCase() || "E"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-extra-darkblue truncate">{engineerName}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-gray-400">{records.length} workers</span>
            <span className="text-xs font-semibold text-emerald-600">· {presentCount} present</span>
            {pendingCount > 0 && <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">⏳ {pendingCount} pending</span>}
            {approvedCount > 0 && <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">✅ {approvedCount} approved</span>}
          </div>
        </div>
        <div className="p-1.5 rounded-lg text-gray-400 shrink-0">
          {collapsed ? <ChevronDown size={14}/> : <ChevronUp size={14}/>}
        </div>
      </div>
      {!collapsed && (
        <div className="p-3 space-y-2">
          {paginated.map(rec => (
            <WorkerRow key={rec._id} rec={rec}
              selected={selectedIds.has(rec._id)}
              onToggleSelect={() => onToggleSelect(rec._id)}
              onEdit={() => onEdit(rec)}
              onApprove={() => onApproveOne(rec)}
              onReject={() => onRejectOne(rec)}
            />
          ))}
          <Pagination page={page} totalPages={totalPages} onChange={setPage}/>
        </div>
      )}
    </div>
  );
}

// ── Record Card (records tab, matches original view page style) ───────────────
function RecordCard({ rec, onClick }) {
  const worker   = rec.worker || {};
  const status   = STATUS_CONFIG[rec.status]   || STATUS_CONFIG.absent;
  const approval = APPROVAL_CONFIG[rec.approvalStatus || "pending"];
  const trade    = worker.trade || "general";
  const tradeCls = TRADE_COLORS[trade] || TRADE_COLORS.general;
  const projName = getProjectName(rec);

  return (
    <button onClick={onClick}
      className={`w-full text-left bg-white rounded-xl border border-gray-100 border-l-4 ${status.border} shadow-sm px-4 py-3 flex items-center gap-3 hover:shadow-md hover:border-gray-200 transition-all duration-150 active:scale-[0.99] group`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarBg(worker.name)}`}>
        {worker.name?.charAt(0)?.toUpperCase() || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-bold text-extra-darkblue truncate">{worker.name || "Unknown"}</p>
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full border capitalize ${tradeCls}`}>{trade}</span>
          {projName && <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full border bg-blue-50 text-blue-600 border-blue-100">🏗️ {projName}</span>}
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full border ${approval.cls}`}>{approval.icon} {approval.label}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 flex-wrap">
          <span className="text-gray-500 font-semibold">{getEngineerName(rec)}</span>
          {rec.punchInTime  && <span className="text-emerald-600 font-medium">· {fmtTime(rec.punchInTime)}</span>}
          {rec.punchInTime && rec.punchOutTime && <span>→ {fmtTime(rec.punchOutTime)} · {fmtDuration(rec.punchInTime, rec.punchOutTime)}</span>}
          {!rec.punchInTime && <span className="text-gray-300">· Not punched in</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${status.cls}`}>{status.label}</span>
        <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-400 transition-colors"/>
      </div>
    </button>
  );
}

// ── Record Detail Popup ───────────────────────────────────────────────────────
function RecordDetailPopup({ rec, onClose, onEdit }) {
  const worker   = rec.worker || {};
  const status   = STATUS_CONFIG[rec.status]   || STATUS_CONFIG.absent;
  const approval = APPROVAL_CONFIG[rec.approvalStatus || "pending"];
  const trade    = worker.trade || "general";
  const tradeCls = TRADE_COLORS[trade] || TRADE_COLORS.general;
  const projName = getProjectName(rec);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarBg(worker.name)}`}>
              {worker.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div>
              <h3 className="text-sm font-bold text-extra-darkblue">{worker.name || "Unknown"}</h3>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${tradeCls}`}>{trade}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${status.cls}`}>{status.label}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${approval.cls}`}>{approval.icon} {approval.label}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={15}/></button>
        </div>
        <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100">
          <p className="text-xs text-gray-400 font-semibold">Date: <span className="text-gray-700">{fmtDate(rec.date)}</span></p>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">Marked by: <span className="text-gray-700">{getEngineerName(rec)}</span></p>
        </div>
        {/* <div className="px-5 py-4 grid grid-cols-3 gap-3 border-b border-gray-100">
          {[
            { label:"Punch In",  value:fmtTime(rec.punchInTime),  color:"text-emerald-600" },
            { label:"Punch Out", value:fmtTime(rec.punchOutTime), color:"text-red-500"     },
            { label:"Duration",  value:fmtDuration(rec.punchInTime, rec.punchOutTime), color:"text-gray-700" },
          ].map(t => (
            <div key={t.label} className="bg-gray-50 rounded-xl px-3 py-2.5 text-center border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t.label}</p>
              <p className={`text-sm font-bold ${t.color}`}>{t.value}</p>
            </div>
          ))}
        </div> */}
        {projName && (
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Project</p>
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
              <FolderOpen size={13} className="text-blue-500 shrink-0"/>
              <p className="text-sm font-bold text-blue-700">{projName}</p>
            </div>
          </div>
        )}
        <div className="px-5 py-4 space-y-3">
          {[
            { icon:Phone,     label:"Phone",      value:worker.phone           },
            { icon:Briefcase, label:"Contractor", value:worker.contractor      },
            { icon:Building2, label:"Zone",       value:rec.zone||worker.zone  },
            // { icon:MapPin,    label:"Site",        value:worker.site||rec.site  },
          ].filter(f => f.value).map(f => (
            <div key={f.label} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                <f.icon size={12} className="text-gray-400"/>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase">{f.label}</p>
                <p className="text-sm font-semibold text-gray-700 truncate">{f.value}</p>
              </div>
            </div>
          ))}
          {rec.notes && (
            <div className="bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Notes</p>
              <p className="text-sm text-gray-600">{rec.notes}</p>
            </div>
          )}
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={() => { onEdit(rec); onClose(); }}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all">
            <Pencil size={12}/> Edit
          </button>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-extra-darkblue text-white text-sm font-bold hover:opacity-90 transition-all active:scale-95">
            Close
          </button>
        </div>
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
  const [activeTab,      setActiveTab]      = useState("approve");

  const [search,         setSearch]         = useState("");
  const [statusFilter,   setStatusFilter]   = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [showFilters,    setShowFilters]    = useState(false);

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate()-6); return localDateStr(d);
  });
  const [dateTo, setDateTo] = useState(localDateStr());

  const [recPage,       setRecPage]       = useState(1);
  const [selectedIds,   setSelectedIds]   = useState(new Set());
  const [editingRec,    setEditingRec]    = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [detailRec,     setDetailRec]     = useState(null);

  const showToast = (msg, type="error") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const loadRecords = useCallback(async () => {
    setFetching(true); setError(""); setSelectedIds(new Set());
    try { setRecords(await api.getAllRecords(dateFrom, dateTo)); }
    catch(err) { setError(err.message); }
    finally { setFetching(false); }
  }, [dateFrom, dateTo]);

  useEffect(() => { loadRecords(); }, [loadRecords]);
  useEffect(() => { setRecPage(1); }, [search, statusFilter, approvalFilter]);

  const filtered = records.filter(r => {
    const w   = r.worker || {};
    const ms  = !search || [w.name, w.phone, w.contractor, getEngineerName(r), getProjectName(r)||""]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const mSt = statusFilter   === "all" || r.status === statusFilter;
    const mAp = approvalFilter === "all" || (r.approvalStatus||"pending") === approvalFilter;
    return ms && mSt && mAp;
  });

  const grouped = groupByEngineer(filtered);
  const stats = {
    total:    filtered.length,
    present:  filtered.filter(r => ["present","late","half-day"].includes(r.status)).length,
    absent:   filtered.filter(r => r.status === "absent").length,
    pending:  filtered.filter(r => (r.approvalStatus||"pending") === "pending").length,
    approved: filtered.filter(r => r.approvalStatus === "approved").length,
    rejected: filtered.filter(r => r.approvalStatus === "rejected").length,
  };

  const toggleSelect = (id) => setSelectedIds(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  const selectAll = (recs, select) => setSelectedIds(prev => { const n=new Set(prev); recs.forEach(r => select?n.add(r._id):n.delete(r._id)); return n; });
  const clearSelection = () => setSelectedIds(new Set());
  const pendingSelected = filtered.filter(r => selectedIds.has(r._id) && (r.approvalStatus||"pending") === "pending");

  const handleApproveOne = (rec) => setConfirmAction({ action:"approve", count:1, date:dateFrom, projectId:"", selectedIds:[rec._id] });
  const handleRejectOne  = (rec) => setConfirmAction({ action:"reject",  count:1, date:dateFrom, projectId:"", selectedIds:[rec._id] });
  const handleActionDone = () => loadRecords();
  const handleRecordSaved = (updated) => setRecords(prev => prev.map(r => r._id===updated._id ? {...r,...updated} : r));

  // Records tab
  const recGrouped      = groupByDate(filtered);
  const recAllSorted    = recGrouped.flatMap(g => g.rows);
  const recTotalPages   = Math.ceil(recAllSorted.length / PAGE_SIZE);
  const recPaginated    = recAllSorted.slice((recPage-1)*PAGE_SIZE, recPage*PAGE_SIZE);
  const recPagGrouped   = groupByDate(recPaginated);

  const activeFilters = [search, statusFilter!=="all"&&statusFilter, approvalFilter!=="all"&&approvalFilter].filter(Boolean).length;

  const exportCSV = () => {
    const headers = ["Engineer","Project","Worker","Trade","Phone","Contractor","Date","Punch In","Punch Out","Duration","Status","Approval","Zone","OT (mins)","Notes"];
    const rows = filtered.map(r => [
      getEngineerName(r), getProjectName(r)||"", r.worker?.name||"", r.worker?.trade||"",
      r.worker?.phone||"", r.worker?.contractor||"", fmtDate(r.date),
      fmtTime(r.punchInTime), fmtTime(r.punchOutTime), fmtDuration(r.punchInTime, r.punchOutTime),
      r.status||"", r.approvalStatus||"pending", r.zone||"", r.overtime||0, r.notes||"",
    ]);
    const csv = [headers,...rows].map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = `admin_attendance_${dateFrom}_to_${dateTo}.csv`; a.click();
  };

  return (
    <div className="space-y-5 pb-24">
      {editingRec    && <InlineEditModal   rec={editingRec}   onClose={() => setEditingRec(null)}    onSaved={handleRecordSaved} showToast={showToast}/>}
      {confirmAction && <ConfirmModal      {...confirmAction}  onClose={() => setConfirmAction(null)} onDone={handleActionDone}   showToast={showToast}/>}
      {detailRec     && <RecordDetailPopup rec={detailRec}    onClose={() => setDetailRec(null)}     onEdit={setEditingRec}/>}
      <Toast toast={toast}/>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-7 h-7 rounded-lg bg-extra-darkblue/10 flex items-center justify-center shrink-0">
              <Shield size={14} className="text-extra-darkblue"/>
            </div>
            <h2 className="text-xl font-bold text-extra-darkblue">Worker Attendance Management</h2>
          </div>
          <p className="text-sm text-gray-400 ml-9">
            {fetching ? "Loading records…" : `${filtered.length} records · ${fmtDate(dateFrom)} – ${fmtDate(dateTo)}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
            <Calendar size={13} className="text-blue-500 shrink-0"/>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="bg-transparent outline-none text-blue-700 text-xs font-semibold cursor-pointer w-[92px]"/>
            <span className="text-blue-300 text-xs">→</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="bg-transparent outline-none text-blue-700 text-xs font-semibold cursor-pointer w-[92px]"/>
          </div>
          <button onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
              showFilters||activeFilters>0 ? "bg-extra-darkblue text-white border-extra-darkblue" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}>
            <Filter size={13}/> Filters {activeFilters>0 && `(${activeFilters})`}
          </button>
          <button onClick={exportCSV} disabled={filtered.length===0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all disabled:opacity-40 active:scale-95">
            <Download size={13}/> Export CSV
          </button>
          <button onClick={loadRecords} disabled={fetching}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50">
            <RefreshCw size={14} className={fetching ? "animate-spin" : ""}/>
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      {!fetching && records.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {[
            { label:"Total Records", value:stats.total,    icon:Users,        color:"bg-blue-50 text-blue-600"       },
            { label:"Present",       value:stats.present,  icon:CheckCircle2, color:"bg-emerald-50 text-emerald-600" },
            { label:"Absent",        value:stats.absent,   icon:XCircle,      color:"bg-red-50 text-red-500"         },
            { label:"Pending",       value:stats.pending,  icon:Clock,        color:"bg-amber-50 text-amber-600"     },
            { label:"Approved",      value:stats.approved, icon:ThumbsUp,     color:"bg-emerald-50 text-emerald-600" },
            { label:"Rejected",      value:stats.rejected, icon:ThumbsDown,   color:"bg-red-50 text-red-500"         },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                <s.icon size={18}/>
              </div>
              <div>
                <p className="text-xl font-bold text-extra-darkblue">{s.value}</p>
                <p className="text-xs font-medium text-gray-500 leading-tight">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Progress bar ── */}
      {!fetching && filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3.5">
          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
            <span className="text-sm font-bold text-extra-darkblue">Approval Progress · {stats.approved} / {stats.total} approved</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {stats.pending  > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">⏳ {stats.pending} pending</span>}
              {stats.approved > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">✅ {stats.approved} approved</span>}
              {stats.rejected > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200">❌ {stats.rejected} rejected</span>}
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden flex">
            <div className="h-full bg-emerald-500 transition-all duration-700 rounded-l-full" style={{ width:`${filtered.length?(stats.approved/filtered.length)*100:0}%` }}/>
            <div className="h-full bg-red-400 transition-all duration-700" style={{ width:`${filtered.length?(stats.rejected/filtered.length)*100:0}%` }}/>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-3 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"/>
            <input type="text" placeholder="Search worker name, engineer, contractor, project…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-800 placeholder-gray-300"/>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Attendance Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 text-gray-700 bg-white">
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([v,s]) => <option key={v} value={v}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Approval Status</label>
            <select value={approvalFilter} onChange={e => setApprovalFilter(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 text-gray-700 bg-white">
              <option value="all">All</option>
              <option value="pending">⏳ Pending</option>
              <option value="approved">✅ Approved</option>
              <option value="rejected">❌ Rejected</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => { setSearch(""); setStatusFilter("all"); setApprovalFilter("all"); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
              <X size={12}/> Clear All
            </button>
          </div>
        </div>
      )}
      {!showFilters && (
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"/>
          <input type="text" placeholder="Search worker, engineer, project…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-800 placeholder-gray-300 bg-white"/>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-400 shrink-0"/>
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={loadRecords} className="ml-auto text-xs font-bold text-red-500 hover:underline shrink-0">Retry</button>
        </div>
      )}

      {/* ── Tabs ── */}
      {!fetching && records.length > 0 && (
        <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl">
          {[
            { key:"approve", label:"Approve Attendance", icon:Shield   },
            { key:"records", label:"All Records",        icon:Activity },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab===t.key ? "bg-white text-extra-darkblue shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              <t.icon size={15}/>
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.key==="approve" ? "Approve" : "Records"}</span>
              {t.key==="approve" && stats.pending > 0 && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">{stats.pending}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ══════════════════ TAB: APPROVE ══════════════════ */}
      {activeTab === "approve" && (
        <div className="space-y-4">

          {/* Pending banner */}
          {!fetching && stats.pending > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Clock size={16} className="text-amber-500 shrink-0"/>
                <div>
                  <p className="text-sm font-bold text-amber-800">{stats.pending} record{stats.pending!==1?"s":""} awaiting your approval</p>
                  <p className="text-xs text-amber-600 mt-0.5">{fmtDate(dateFrom)}{dateFrom!==dateTo ? ` – ${fmtDate(dateTo)}` : ""}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setConfirmAction({ action:"reject", count:stats.pending, date:dateFrom, projectId:"", selectedIds:[] })}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 bg-white text-red-500 text-xs font-bold hover:bg-red-50 transition-all active:scale-95">
                  <ThumbsDown size={13}/> Reject All
                </button>
                <button onClick={() => setConfirmAction({ action:"approve", count:stats.pending, date:dateFrom, projectId:"", selectedIds:[] })}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all active:scale-95 shadow-sm">
                  <ThumbsUp size={13}/> Approve All {stats.pending}
                </button>
              </div>
            </div>
          )}

          {/* All approved */}
          {!fetching && filtered.length > 0 && stats.pending===0 && stats.rejected===0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 flex items-center gap-3">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0"/>
              <p className="text-sm font-bold text-emerald-700">All records approved for this period ✅</p>
            </div>
          )}

          {/* Selection toolbar */}
          {selectedIds.size > 0 && (
            <div className="bg-extra-darkblue/5 border border-extra-darkblue/20 rounded-2xl px-4 py-3 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <CheckCheck size={15} className="text-extra-darkblue shrink-0"/>
                <span className="text-sm font-bold text-extra-darkblue">{selectedIds.size} selected</span>
                {pendingSelected.length > 0 && <span className="text-xs text-amber-600 font-semibold">({pendingSelected.length} pending)</span>}
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={clearSelection} className="text-xs font-bold text-gray-500 px-2 py-1.5 rounded-lg hover:bg-white transition-colors">Clear</button>
                <button onClick={() => setSelectedIds(new Set(filtered.map(r=>r._id)))} className="text-xs font-bold text-extra-darkblue px-2 py-1.5 rounded-lg hover:bg-white transition-colors">Select all {filtered.length}</button>
                <button onClick={() => setConfirmAction({ action:"approve", count:pendingSelected.length, date:dateFrom, projectId:"", selectedIds:pendingSelected.map(r=>r._id) })}
                  disabled={pendingSelected.length===0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all disabled:opacity-40 active:scale-95">
                  <ThumbsUp size={12}/> Approve ({pendingSelected.length})
                </button>
                <button onClick={() => setConfirmAction({ action:"reject", count:pendingSelected.length, date:dateFrom, projectId:"", selectedIds:pendingSelected.map(r=>r._id) })}
                  disabled={pendingSelected.length===0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all disabled:opacity-40 active:scale-95">
                  <ThumbsDown size={12}/> Reject ({pendingSelected.length})
                </button>
              </div>
            </div>
          )}

          {/* Loading */}
          {fetching && (
            <div className="space-y-4">
              {[1,2].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3 animate-pulse">
                  <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gray-200 shrink-0"/><div className="flex-1 space-y-2"><div className="h-3 bg-gray-200 rounded w-1/3"/><div className="h-2 bg-gray-200 rounded w-1/4"/></div></div>
                  {[1,2,3].map(j => <div key={j} className="rounded-xl border border-gray-100 p-3 flex items-center gap-3 bg-gray-50 animate-pulse"><div className="w-4 h-4 rounded bg-gray-200 shrink-0"/><div className="w-8 h-8 rounded-full bg-gray-200 shrink-0"/><div className="flex-1 space-y-2"><div className="h-3 bg-gray-200 rounded w-1/4"/><div className="h-2 bg-gray-200 rounded w-1/3"/></div><div className="w-16 h-5 bg-gray-200 rounded-full"/></div>)}
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!fetching && filtered.length===0 && !error && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
              <p className="text-5xl mb-3">📋</p>
              <p className="text-sm font-bold text-gray-500">{records.length>0 ? "No records match your filters." : "No attendance submitted for this period."}</p>
              {records.length > 0 && <button onClick={() => { setSearch(""); setStatusFilter("all"); setApprovalFilter("all"); }} className="mt-3 text-xs font-bold text-blue-600 hover:underline">Clear filters</button>}
            </div>
          )}

          {/* Engineer groups */}
          {!fetching && grouped.length > 0 && (
            <div className="space-y-4">
              {/* ── Global select all bar ── */}
              <div className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-gray-100 shadow-sm">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && filtered.every(r => selectedIds.has(r._id))}
                  ref={el => {
                    if (el) el.indeterminate =
                      filtered.some(r => selectedIds.has(r._id)) &&
                      !filtered.every(r => selectedIds.has(r._id));
                  }}
                  onChange={() => {
                    const allSelected = filtered.every(r => selectedIds.has(r._id));
                    if (allSelected) {
                      clearSelection();
                    } else {
                      setSelectedIds(new Set(filtered.map(r => r._id)));
                    }
                  }}
                  className="w-4 h-4 rounded accent-extra-darkblue shrink-0 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-600">
                    {filtered.every(r => selectedIds.has(r._id)) && filtered.length > 0
                      ? `All ${filtered.length} records selected — click to deselect all`
                      : selectedIds.size > 0
                        ? `${selectedIds.size} of ${filtered.length} selected — check to select all`
                        : `Select all ${filtered.length} records at once`}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Check individual engineers below to select by group, or use this to select everything
                  </p>
                </div>
                {selectedIds.size > 0 && (
                  <button
                    onClick={clearSelection}
                    className="text-xs font-bold text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors shrink-0 flex items-center gap-1">
                    <X size={11}/> Clear
                  </button>
                )}
              </div>

              {grouped.map(({ engineerName, records:engRecs }) => (
                <EngineerGroup key={engineerName} engineerName={engineerName} records={engRecs}
                  selectedIds={selectedIds} onToggleSelect={toggleSelect} onSelectAll={selectAll}
                  onEdit={setEditingRec} onApproveOne={handleApproveOne} onRejectOne={handleRejectOne}/>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ TAB: RECORDS ══════════════════ */}
      {activeTab === "records" && (
        <SectionCard icon={Activity} iconBg="bg-blue-50" iconColor="text-blue-500"
          title="All Attendance Records"
          sub={fetching ? "Loading…" : `${filtered.length} records${recTotalPages>1 ? ` · Page ${recPage} of ${recTotalPages}` : ""}`}>

          {fetching && (
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="rounded-xl border border-gray-100 p-3 animate-pulse flex items-center gap-3 bg-gray-50">
                  <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0"/>
                  <div className="flex-1 space-y-2"><div className="h-3 bg-gray-200 rounded w-1/4"/><div className="h-2 bg-gray-200 rounded w-1/3"/></div>
                  <div className="w-20 h-6 bg-gray-200 rounded-full"/>
                </div>
              ))}
            </div>
          )}

          {!fetching && filtered.length===0 && !error && (
            <div className="py-12 text-center">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-sm font-semibold text-gray-400">{records.length>0 ? "No records match your filters." : "No attendance submitted yet."}</p>
              {records.length > 0 && <button onClick={() => { setSearch(""); setStatusFilter("all"); setApprovalFilter("all"); }} className="mt-3 text-xs font-semibold text-blue-600 hover:underline">Clear filters</button>}
            </div>
          )}

          {!fetching && recPaginated.length > 0 && (
            <div className="space-y-4">
              {recPagGrouped.map(({ date, rows }) => (
                <div key={date}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-extra-darkblue text-white text-xs font-bold px-3 py-1 rounded-lg whitespace-nowrap">{fmtDate(date)}</div>
                    <div className="flex-1 h-px bg-gray-100"/>
                    <span className="text-xs text-gray-400 font-semibold whitespace-nowrap">{rows.length} record{rows.length!==1?"s":""}</span>
                  </div>
                  <div className="space-y-2">
                    {rows.map((rec,i) => <RecordCard key={rec._id||i} rec={rec} onClick={() => setDetailRec(rec)}/>)}
                  </div>
                </div>
              ))}
              <Pagination page={recPage} totalPages={recTotalPages} onChange={setRecPage}/>
              <p className="text-center text-xs text-gray-400 pt-1">
                Showing <span className="font-semibold text-gray-600">{(recPage-1)*PAGE_SIZE+1}–{Math.min(recPage*PAGE_SIZE, filtered.length)}</span> of{" "}
                <span className="font-semibold text-gray-600">{filtered.length}</span> records
              </p>
            </div>
          )}
        </SectionCard>
      )}

      {/* ── Sticky bottom approve bar ── */}
      {activeTab==="approve" && !fetching && stats.pending > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-2xl px-4">
          <div className="bg-extra-darkblue rounded-2xl shadow-2xl px-5 py-3.5 flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold">⏳ {stats.pending} records still pending</p>
              <p className="text-white/50 text-xs mt-0.5">Approve or reject to finalize attendance</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setConfirmAction({ action:"reject", count:stats.pending, date:dateFrom, projectId:"", selectedIds:[] })}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/20 text-white/80 text-xs font-bold hover:bg-white/10 transition-all active:scale-95">
                <ThumbsDown size={13}/> Reject All
              </button>
              <button onClick={() => setConfirmAction({ action:"approve", count:stats.pending, date:dateFrom, projectId:"", selectedIds:[] })}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-all active:scale-95">
                <ThumbsUp size={14}/> Approve All {stats.pending}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}