"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Search, Clock, CheckCircle2, XCircle, AlertCircle,
  Calendar, Users, RefreshCw, Download, Filter,
  ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown,
  CheckCheck, X, Shield, FileText, TrendingUp,
  ChevronDown, ChevronUp,
} from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const getToken = () => typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// ── API ───────────────────────────────────────────────────────────────────────
const api = {
  async getAll({ date = "", showAll = false } = {}) {
    const params = new URLSearchParams();
    if (showAll)   params.set("all", "true");
    else if (date) params.set("date", date);
    const qs  = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE}/attendance/all${qs}`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load attendance");
    return Array.isArray(data) ? data : (data.records || []);
  },
  async approveBulk(date, recordIds) {
    const body = recordIds?.length ? { recordIds } : { date };
    const res  = await fetch(`${API_BASE}/attendance/approve-bulk`, {
      method: "POST", headers: authHeaders(), body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Approval failed");
    return data;
  },
  async rejectBulk(date, recordIds, reason) {
    const body = recordIds?.length ? { recordIds, reason } : { date, reason };
    const res  = await fetch(`${API_BASE}/attendance/reject-bulk`, {
      method: "POST", headers: authHeaders(), body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Rejection failed");
    return data;
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function fmtRole(r) {
  if (!r) return "—";
  return r.replace(/([A-Z])/g, " $1").replace(/\b\w/g, c => c.toUpperCase()).trim();
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
}
function fmtTime(d) {
  return new Date(d).toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" });
}

const roleToDept = {
  qualityControl: "QC", engineer: "Engineering", support: "Support",
  installationIncharge: "Installation", marketingExecutive: "Marketing",
  marketingCoordinator: "Marketing", admin: "Admin", director: "Admin",
};

function normalise(rec) {
  const user = rec.user || {};
  const punchIn  = rec.punchInTime  ? new Date(rec.punchInTime)  : null;
  const punchOut = rec.punchOutTime ? new Date(rec.punchOutTime) : null;
  let duration = "–";
  if (punchIn && punchOut) {
    const ms = punchOut - punchIn;
    duration = `${Math.floor(ms/3600000)}h ${Math.floor((ms%3600000)/60000)}m`;
  }
  const statusRaw = rec.status || "absent";
  const statusMap = { present:"Present", late:"Late", absent:"Absent", "half-day":"Half Day", "on-leave":"On Leave" };
  return {
   _id: rec._id ? String(rec._id) : null,  // ← add String() cast
  uid: rec._id ?? `absent-${user._id ?? user.email}`,
    name:           user.name  || user.email || "Unknown",
    email:          user.email || "",
    role:           fmtRole(user.role),
    dept:           roleToDept[user.role] || "Other",
    rawRole:        user.role || "",
    date:           rec.date ? fmtDate(rec.date) : "—",
    rawDate:        rec.date ? rec.date.split("T")[0] : "",
    punchIn:        punchIn  ? fmtTime(punchIn)  : null,
    punchOut:       punchOut ? fmtTime(punchOut) : null,
    duration,
    location:       rec.location || "—",
    notes:          rec.notes    || "",
    status:         statusMap[statusRaw] || "Absent",
    approvalStatus: rec.approvalStatus || "pending",
  };
}

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  Present:    { cls:"bg-emerald-50 text-emerald-700 border border-emerald-200", icon:CheckCircle2 },
  Late:       { cls:"bg-amber-50 text-amber-700 border border-amber-200",       icon:AlertCircle  },
  Absent:     { cls:"bg-red-50 text-red-600 border border-red-200",             icon:XCircle      },
  "Half Day": { cls:"bg-purple-50 text-purple-700 border border-purple-200",    icon:AlertCircle  },
  "On Leave": { cls:"bg-sky-50 text-sky-700 border border-sky-200",             icon:Clock        },
};
const APPROVAL_CONFIG = {
  pending:  { cls:"bg-amber-50 text-amber-600 border border-amber-200",    label:"Pending"  },
  approved: { cls:"bg-emerald-50 text-emerald-700 border border-emerald-200", label:"Approved" },
  rejected: { cls:"bg-red-50 text-red-600 border border-red-200",label:"Rejected" },
};
const DEPT_COLORS = {
  QC:"bg-blue-50 text-blue-600", Engineering:"bg-amber-50 text-amber-700",
  Support:"bg-red-50 text-red-500", Installation:"bg-teal-50 text-teal-600",
  Marketing:"bg-pink-50 text-pink-600", Admin:"bg-purple-50 text-purple-600",
  Other:"bg-gray-100 text-gray-500",
};
const PAGE_SIZE = 15;

// ── CSV Export ────────────────────────────────────────────────────────────────
function exportCSV(records, label) {
  const headers = ["Name","Email","Role","Department","Date","Punch In","Punch Out","Duration","Status","Approval","Location","Notes"];
  const rows = records.map(r => [
    r.name, r.email, r.role, r.dept, r.date,
    r.punchIn||"–", r.punchOut||"–", r.duration,
    r.status, r.approvalStatus, r.location, r.notes,
  ]);
  const csv = [headers, ...rows].map(row =>
    row.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(",")
  ).join("\n");
  const blob = new Blob([csv], { type:"text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `attendance-${label}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Subcomponents ─────────────────────────────────────────────────────────────
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

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1 pt-3">
      <button onClick={() => onChange(page-1)} disabled={page===1}
        className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
        <ChevronLeft size={14}/>
      </button>
      {Array.from({length:totalPages},(_,i)=>i+1).slice(
        Math.max(0,page-3), Math.min(totalPages,page+2)
      ).map(p => (
        <button key={p} onClick={() => onChange(p)}
          className={`w-7 h-7 rounded-lg text-xs font-bold border transition-all ${
            p===page ? "bg-extra-darkblue text-white border-extra-darkblue" : "border-gray-200 text-gray-500 hover:bg-gray-50"
          }`}>{p}</button>
      ))}
      <button onClick={() => onChange(page+1)} disabled={page===totalPages}
        className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
        <ChevronRight size={14}/>
      </button>
    </div>
  );
}

function SummaryStats({ data }) {
  const late    = data.filter(d=>d.status==="Late").length;
  const halfDay = data.filter(d=>d.status==="Half Day").length;
  const present = data.filter(d=>d.status==="Present").length + late + halfDay;
  const absent  = data.filter(d=>d.status==="Absent").length;
  const pending = data.filter(d=>d.approvalStatus==="pending").length;
  const stats = [
    { label:"Total",    value:data.length, icon:Users,        cls:"bg-blue-50 text-blue-600"    },
    { label:"Present",  value:present,     icon:CheckCircle2, cls:"bg-emerald-50 text-emerald-600" },
    { label:"Absent",   value:absent,      icon:XCircle,      cls:"bg-red-50 text-red-500"      },
    { label:"Pending",  value:pending,     icon:Clock,        cls:"bg-amber-50 text-amber-600"  },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
      {stats.map(s => (
        <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.cls}`}>
            <s.icon size={16}/>
          </div>
          <div>
            <p className="text-lg sm:text-xl font-bold text-extra-darkblue">{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Reject Modal ──────────────────────────────────────────────────────────────
function RejectModal({ count, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
              <ThumbsDown size={15} className="text-red-500"/>
            </div>
            <div>
              <h3 className="text-sm font-bold text-extra-darkblue">Reject Attendance</h3>
              <p className="text-xs text-gray-400">{count} record{count!==1?"s":""} will be rejected</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={15}/></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Reason (optional)</label>
            <textarea value={reason} onChange={e=>setReason(e.target.value)}
              placeholder="e.g. Punch times inconsistent, please verify…"
              rows={3} maxLength={300}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 text-gray-700 placeholder-gray-300 resize-none"/>
          </div>
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 px-3 py-2.5 rounded-xl">
            <AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5"/>
            <p className="text-xs text-amber-700">Rejected records are flagged. Engineers can correct and resubmit.</p>
          </div>
        </div>
        <div className="flex gap-2 px-4 pb-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onConfirm(reason)} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold disabled:opacity-40 active:scale-95">
            {loading ? <><RefreshCw size={13} className="animate-spin"/> Processing…</> : <><ThumbsDown size={13}/> Reject</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Export Modal ──────────────────────────────────────────────────────────────
function ExportModal({ onClose, onExport }) {
  const [mode, setMode] = useState("today");
  const [from, setFrom] = useState(todayISO());
  const [to,   setTo]   = useState(todayISO());

  const presets = [
    { key:"today",     label:"Today" },
    { key:"yesterday", label:"Yesterday" },
    { key:"week",      label:"This Week" },
    { key:"month",     label:"This Month" },
    { key:"custom",    label:"Custom Range" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Download size={15} className="text-emerald-600"/>
            </div>
            <div>
              <h3 className="text-sm font-bold text-extra-darkblue">Export CSV</h3>
              <p className="text-xs text-gray-400">Choose date range to export</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={15}/></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 gap-1.5">
            {presets.map(p => (
              <button key={p.key} onClick={() => setMode(p.key)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all text-left ${
                  mode===p.key ? "bg-extra-darkblue text-white border-extra-darkblue" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                }`}>
                {mode===p.key && <CheckCheck size={13}/>}
                {mode!==p.key && <span className="w-3.5"/>}
                {p.label}
              </button>
            ))}
          </div>
          {mode==="custom" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">From</label>
                <input type="date" value={from} onChange={e=>setFrom(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 text-gray-700"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">To</label>
                <input type="date" value={to} min={from} onChange={e=>setTo(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 text-gray-700"/>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 px-4 pb-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onExport(mode, from, to)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold active:scale-95">
            <Download size={13}/> Export
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mobile Attendance Card ────────────────────────────────────────────────────
function AttendanceCard({ record, selected, onToggle, showCheckbox }) {
  const s  = STATUS_CONFIG[record.status]  || STATUS_CONFIG.Absent;
  const ap = APPROVAL_CONFIG[record.approvalStatus] || APPROVAL_CONFIG.pending;
  const StatusIcon = s.icon;
  return (
    <div onClick={showCheckbox ? onToggle : undefined}
      className={`bg-white rounded-xl border shadow-sm p-4 space-y-3 transition-all ${
        selected ? "border-blue-300 bg-blue-50/30" : "border-gray-100"
      } ${showCheckbox ? "cursor-pointer active:scale-[0.99]" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {showCheckbox && (
            <input type="checkbox" checked={selected} onChange={onToggle}
              onClick={e=>e.stopPropagation()}
              className="w-3.5 h-3.5 rounded accent-extra-darkblue shrink-0"/>
          )}
          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
            {record.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-extra-darkblue truncate">{record.name}</p>
            <p className="text-xs text-gray-400 truncate">{record.role}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${s.cls}`}>
            <StatusIcon size={10}/> {record.status}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ap.cls}`}>
            {ap.icon} {ap.label}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-50 text-xs">
        <div>
          <p className="text-gray-400 mb-0.5">In</p>
          <p className="font-semibold text-emerald-600">{record.punchIn||"–"}</p>
        </div>
        <div>
          <p className="text-gray-400 mb-0.5">Out</p>
          <p className="font-semibold text-red-500">{record.punchOut||"–"}</p>
        </div>
        <div>
          <p className="text-gray-400 mb-0.5">Duration</p>
          <p className="font-semibold text-gray-700">{record.duration}</p>
        </div>
      </div>
      {record.notes && <p className="text-xs text-gray-400 italic truncate"> {record.notes}</p>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AttendanceAdmin() {
  // Data
  const [records,    setRecords]    = useState([]);
  const [fetching,   setFetching]   = useState(true);
  // Tabs: "approval" | "records"
  const [activeTab,  setActiveTab]  = useState("approval");
  // Filters
  const [search,     setSearch]     = useState("");
  const [filterDept, setFilterDept] = useState("All Departments");
  const [filterStat, setFilterStat] = useState("All");
  const [filterAppr, setFilterAppr] = useState("All");
  const [filterDate, setFilterDate] = useState(todayISO());
  const [showAll,    setShowAll]    = useState(false);
  const [showFilters,setShowFilters]= useState(false);
  // Pagination
  const [page,       setPage]       = useState(1);
  // Selection
  const [selectedIds,setSelectedIds]= useState(new Set());
  // Modals
  const [rejectModal,setRejectModal]= useState(false);
  const [exportModal,setExportModal]= useState(false);
  const [actionLoading,setActionLoading] = useState(false);
  // Toast
  const [toast,      setToast]      = useState(null);

  const showToast = (msg, type="error") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null),3500);
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const loadAll = useCallback(async (all=showAll, date=filterDate) => {
    setFetching(true);
    try {
      const raw = await api.getAll({ showAll:all, date: all?"":date });
      setRecords(raw.map(normalise));
      setSelectedIds(new Set());
      setPage(1);
    } catch(err) { showToast(err.message); }
    finally { setFetching(false); }
  }, [showAll, filterDate]);

  useEffect(()=>{ loadAll(); }, [loadAll]);

  const handleToggleAll = () => {
    const next = !showAll;
    setShowAll(next);
    if (next) setFilterDate("");
    loadAll(next, next?"":filterDate);
  };
  const handleDateChange = e => {
    setFilterDate(e.target.value);
    if (showAll) setShowAll(false);
    loadAll(false, e.target.value);
  };

  // ── Filter ─────────────────────────────────────────────────────────────────
  const depts     = ["All Departments", ...new Set(records.map(r=>r.dept))];
  const allStatus = ["All","Present","Late","Absent","Half Day","On Leave"];
  const allAppr   = ["All","pending","approved","rejected"];

  const filtered = records.filter(r => {
    const ms = [r.name,r.role,r.email].some(f=>f?.toLowerCase().includes(search.toLowerCase()));
    const md = filterDept==="All Departments" || r.dept===filterDept;
    const mst= filterStat==="All" || r.status===filterStat ||
               (filterStat==="Present" && (r.status==="Late"||r.status==="Half Day"));
    const ma = filterAppr==="All" || r.approvalStatus===filterAppr;
    return ms && md && mst && ma;
  });

  // For approval tab — show only today's pending by default
  const approvalRecords = activeTab==="approval"
    ? filtered.filter(r => !showAll ? true : true) // all filtered
    : filtered;

  const totalPages = Math.ceil(approvalRecords.length / PAGE_SIZE);
  const paginated  = approvalRecords.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  // Reset page on filter change
  useEffect(()=>{ setPage(1); }, [search,filterDept,filterStat,filterAppr,activeTab]);

  // ── Selection helpers ──────────────────────────────────────────────────────
  const toggleOne = id => {
  if (!id) return; // ← guard: don't select absent/null-id records
  setSelectedIds(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
};
  const toggleAll = () => {
  const validIds = paginated.map(r => r._id).filter(Boolean);
  const allValidSelected = validIds.length > 0 && validIds.every(id => selectedIds.has(id));
  if (allValidSelected) setSelectedIds(new Set());
  else setSelectedIds(new Set(validIds));
};
  const allSelected  = paginated.length>0 && paginated.every(r=>selectedIds.has(r._id));
  const someSelected = paginated.some(r=>selectedIds.has(r._id));
  const selectedArr  = [...selectedIds].filter(Boolean);

  // ── Approval actions ───────────────────────────────────────────────────────
 const handleApprove = async () => {
  if (!selectedArr.length) {
    showToast("Please select records to approve", "error");
    return;
  }
  setActionLoading(true);
  try {
    const res = await api.approveBulk(filterDate || todayISO(), selectedArr);
    showToast(`${res.approvedCount || selectedArr.length} records approved`, "success");
    setSelectedIds(new Set());
    loadAll();
  } catch (err) { showToast(err.message); }
  finally { setActionLoading(false); }
};
 const handleReject = async (reason) => {
  if (!selectedArr.length) {
    showToast("Please select records to reject", "error");
    setRejectModal(false);
    return;
  }
  setActionLoading(true);
  try {
    const res = await api.rejectBulk(filterDate || todayISO(), selectedArr, reason || "Rejected by admin");
    showToast(`${res.rejectedCount || selectedArr.length} records rejected`, "info");
    setSelectedIds(new Set());
    setRejectModal(false);
    loadAll();
  } catch (err) { showToast(err.message); }
  finally { setActionLoading(false); }
};

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = (mode, from, to) => {
    const today = todayISO();
    let toExport = records;
    let label = "all";

    if (mode==="today") {
      toExport = records.filter(r=>r.rawDate===today);
      label = today;
    } else if (mode==="yesterday") {
      const yest = new Date(); yest.setDate(yest.getDate()-1);
      const yestStr = yest.toISOString().split("T")[0];
      toExport = records.filter(r=>r.rawDate===yestStr);
      label = yestStr;
    } else if (mode==="week") {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate()-7);
      toExport = records.filter(r=>r.rawDate && r.rawDate>=weekAgo.toISOString().split("T")[0]);
      label = "this-week";
    } else if (mode==="month") {
      const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate()-30);
      toExport = records.filter(r=>r.rawDate && r.rawDate>=monthAgo.toISOString().split("T")[0]);
      label = "this-month";
    } else if (mode==="custom") {
      toExport = records.filter(r=>r.rawDate && r.rawDate>=from && r.rawDate<=to);
      label = `${from}-to-${to}`;
    }

    if (toExport.length === 0) {
  showToast("No records found for the selected range", "error");
  return;
}
exportCSV(toExport, label);
setExportModal(false);
showToast(`Exported ${toExport.length} records`, "success");
  };

  // ── Stats for current filter ───────────────────────────────────────────────
  const pendingCount  = filtered.filter(r=>r.approvalStatus==="pending").length;
  const approvedCount = filtered.filter(r=>r.approvalStatus==="approved").length;
  const viewLabel = showAll ? "All time" : filterDate
    ? new Date(filterDate+"T00:00:00").toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})
    : "Today";

  return (
    <div className="space-y-4 pb-6">
      <Toast toast={toast}/>
      {rejectModal && (
        <RejectModal
          count={selectedArr.length||filtered.filter(r=>r.approvalStatus==="pending").length}
          loading={actionLoading}
          onClose={()=>setRejectModal(false)}
          onConfirm={handleReject}/>
      )}
      {exportModal && (
        <ExportModal onClose={()=>setExportModal(false)} onExport={handleExport}/>
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-extra-darkblue">Attendance</h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            {fetching ? "Loading…" : `All departments — ${viewLabel}`}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Date picker */}
          {!showAll && (
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-xl px-2.5 py-2">
              <Calendar size={12} className="text-blue-500 shrink-0"/>
              <input type="date" value={filterDate} onChange={handleDateChange}
                className="bg-transparent outline-none text-blue-700 text-xs font-semibold cursor-pointer w-[100px] sm:w-auto"/>
            </div>
          )}
          {/* View All toggle */}
          <button onClick={handleToggleAll} disabled={fetching}
            className={`px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold border transition-colors disabled:opacity-40 ${
              showAll ? "bg-extra-darkblue text-white border-extra-darkblue" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}>
            {showAll ? "Today" : "All"}
          </button>
          {/* Export */}
          <button onClick={()=>setExportModal(true)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all active:scale-95">
            <Download size={13}/> <span className="hidden sm:inline">Export</span>
          </button>
          {/* Refresh */}
          <button onClick={()=>loadAll()} disabled={fetching}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw size={13} className={fetching?"animate-spin":""}/>
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <SummaryStats data={filtered}/>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        {[
          { key:"approval", label:"Approve / Review", icon:Shield },
          { key:"records",  label:"All Records",      icon:FileText },
        ].map(t => (
          <button key={t.key} onClick={()=>setActiveTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab===t.key ? "bg-white text-extra-darkblue shadow-sm" : "text-gray-400"
            }`}>
            <t.icon size={13}/> {t.label}
            {t.key==="approval" && pendingCount>0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button onClick={()=>setShowFilters(v=>!v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-extra-darkblue hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <Filter size={13} className="text-gray-400"/>
            Filters
            {(search||filterDept!=="All Departments"||filterStat!=="All"||filterAppr!=="All") && (
              <span className="w-2 h-2 rounded-full bg-blue-500"/>
            )}
          </div>
          {showFilters ? <ChevronUp size={14} className="text-gray-400"/> : <ChevronDown size={14} className="text-gray-400"/>}
        </button>
        {showFilters && (
          <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
            <div className="relative mt-3">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"/>
              <input type="text" placeholder="Search name, email, role…" value={search} onChange={e=>setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 text-gray-800 placeholder-gray-300"/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select value={filterDept} onChange={e=>setFilterDept(e.target.value)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 text-gray-700 bg-white">
                {depts.map(d=><option key={d}>{d}</option>)}
              </select>
              <select value={filterStat} onChange={e=>setFilterStat(e.target.value)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 text-gray-700 bg-white">
                {allStatus.map(s=><option key={s}>{s}</option>)}
              </select>
              <select value={filterAppr} onChange={e=>setFilterAppr(e.target.value)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 text-gray-700 bg-white">
                {allAppr.map(a=><option key={a} value={a}>{a==="All"?"All Approval":a.charAt(0).toUpperCase()+a.slice(1)}</option>)}
              </select>
            </div>
            {(search||filterDept!=="All Departments"||filterStat!=="All"||filterAppr!=="All") && (
              <button onClick={()=>{setSearch("");setFilterDept("All Departments");setFilterStat("All");setFilterAppr("All");}}
                className="text-xs font-semibold text-red-400 hover:text-red-600">✕ Clear all filters</button>
            )}
          </div>
        )}
      </div>

      {/* ── Approval actions bar ── */}
      {activeTab==="approval" && !fetching && filtered.length>0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input type="checkbox" checked={allSelected}
              ref={el=>{if(el)el.indeterminate=someSelected&&!allSelected;}}
              onChange={toggleAll}
              className="w-3.5 h-3.5 rounded accent-extra-darkblue"/>
            <span className="text-xs font-semibold text-gray-600">
              {selectedArr.length>0 ? `${selectedArr.length} selected` : `${pendingCount} pending · ${approvedCount} approved`}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold disabled:opacity-40 active:scale-95 transition-all">
              {actionLoading ? <RefreshCw size={12} className="animate-spin"/> : <ThumbsUp size={12}/>}
              {selectedArr.length>0 ? `Approve (${selectedArr.length})` : "Select to Approve"}
            </button>
            <button
              onClick={()=>setRejectModal(true)}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold disabled:opacity-40 active:scale-95 transition-all">
              <ThumbsDown size={12}/>
              {selectedArr.length>0 ? `Reject (${selectedArr.length})` : "Select to Reject"}
            </button>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {fetching && (
        <div className="space-y-2">
          {[1,2,3,4].map(i=>(
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0"/>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-1/3"/>
                <div className="h-3 bg-gray-100 rounded w-1/2"/>
              </div>
              <div className="h-6 w-16 bg-gray-100 rounded-full"/>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty ── */}
      {!fetching && records.length===0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-3xl mb-2">🕐</p>
          <p className="text-sm font-semibold text-gray-500">No attendance records found</p>
          <p className="text-xs text-gray-400 mt-1">Records appear once employees start punching in.</p>
        </div>
      )}
      {!fetching && records.length>0 && filtered.length===0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-sm text-gray-400">No records match your filters.</p>
          <button onClick={()=>{setSearch("");setFilterDept("All Departments");setFilterStat("All");setFilterAppr("All");}}
            className="mt-3 text-xs font-semibold text-blue-600 hover:underline">Clear filters</button>
        </div>
      )}

      {/* ── MOBILE: Cards ── */}
      {!fetching && paginated.length>0 && (
        <div className="md:hidden space-y-2">
          {paginated.map(r=>(
            <AttendanceCard key={r.uid} record={r}
              selected={selectedIds.has(r._id)}
              onToggle={()=>toggleOne(r._id)}
              showCheckbox={activeTab==="approval"}/>
          ))}
          <Pagination page={page} totalPages={totalPages} onChange={setPage}/>
        </div>
      )}

      {/* ── DESKTOP: Table ── */}
      {!fetching && paginated.length>0 && (
        <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {activeTab==="approval" && (
                  <th className="px-4 py-3 w-8">
                    <input type="checkbox" checked={allSelected}
                      ref={el=>{if(el)el.indeterminate=someSelected&&!allSelected;}}
                      onChange={toggleAll}
                      className="w-3.5 h-3.5 rounded accent-extra-darkblue"/>
                  </th>
                )}
                {["Employee","Department","Date","Punch In","Punch Out","Duration","Status","Approval"].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map(r=>{
                const s  = STATUS_CONFIG[r.status]  || STATUS_CONFIG.Absent;
                const ap = APPROVAL_CONFIG[r.approvalStatus] || APPROVAL_CONFIG.pending;
                const StatusIcon = s.icon;
                return (
                  <tr key={r.uid}
                    onClick={activeTab==="approval" ? ()=>toggleOne(r._id) : undefined}
                    className={`transition-colors ${activeTab==="approval" ? "cursor-pointer" : ""} ${
                      selectedIds.has(r._id) ? "bg-blue-50/40" : "hover:bg-gray-50"
                    }`}>
                    {activeTab==="approval" && (
                      <td className="px-4 py-3.5">
                        <input type="checkbox" checked={selectedIds.has(r._id)}
                          onClick={e=>e.stopPropagation()}
                          onChange={()=>toggleOne(r._id)}
                          className="w-3.5 h-3.5 rounded accent-extra-darkblue"/>
                      </td>
                    )}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-extra-darkblue text-sm">{r.name}</p>
                          <p className="text-xs text-gray-400">{r.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${DEPT_COLORS[r.dept]||DEPT_COLORS.Other}`}>{r.dept}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{r.date}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-emerald-600 whitespace-nowrap">{r.punchIn||"–"}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-red-500 whitespace-nowrap">{r.punchOut||"–"}</td>
                    <td className="px-4 py-3.5">
                      {r.duration!=="–"
                        ? <span className="flex items-center gap-1 text-xs font-semibold text-blue-600"><Clock size={11}/> {r.duration}</span>
                        : <span className="text-gray-300 text-xs">–</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full w-fit ${s.cls}`}>
                        <StatusIcon size={11}/> {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full w-fit ${ap.cls}`}>
                        {ap.icon} {ap.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 pb-4">
            <Pagination page={page} totalPages={totalPages} onChange={setPage}/>
          </div>
        </div>
      )}
    </div>
  );
}