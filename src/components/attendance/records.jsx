"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Search, Calendar, RefreshCw, Download, Filter,
  ChevronLeft, ChevronRight, HardHat, Clock, Users,
  CheckCircle2, XCircle, AlertCircle, TrendingUp,
  MapPin, Briefcase, Phone, X, Activity, ChevronDown,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const getToken = () => typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const PAGE_SIZE = 10;

function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso), h = d.getHours(), m = d.getMinutes();
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function fmtDuration(inIso, outIso) {
  if (!inIso || !outIso) return "—";
  const mins = Math.round((new Date(outIso) - new Date(inIso)) / 60000);
  if (mins <= 0) return "—";
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

const STATUS_CONFIG = {
  present:    { label: "Present",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200", border: "border-l-emerald-400" },
  absent:     { label: "Absent",   cls: "bg-red-50 text-red-600 border-red-200",             border: "border-l-gray-300"    },
  late:       { label: "Late",     cls: "bg-amber-50 text-amber-700 border-amber-200",       border: "border-l-amber-400"   },
  "half-day": { label: "Half Day", cls: "bg-purple-50 text-purple-700 border-purple-200",    border: "border-l-purple-400"  },
  "on-leave": { label: "On Leave", cls: "bg-sky-50 text-sky-700 border-sky-200",             border: "border-l-sky-400"     },
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
  "bg-orange-100 text-orange-700", "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700", "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700", "bg-pink-100 text-pink-700",
];
function avatarBg(name = "") {
  let n = 0; for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return AVATAR_BG[n % AVATAR_BG.length];
}
function groupByDate(records) {
  const map = {};
  records.forEach(r => {
    const k = r.date ? r.date.split("T")[0] : "unknown";
    if (!map[k]) map[k] = [];
    map[k].push(r);
  });
  return Object.entries(map).sort(([a], [b]) => b.localeCompare(a)).map(([date, rows]) => ({ date, rows }));
}

// ── Section Card ──────────────────────────────────────────────────────────────
function SectionCard({ icon: Icon, iconColor, iconBg, title, sub, children, action }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon size={15} className={iconColor} />
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

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  // show at most 5 page buttons around current
  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);
  const visible = pages.slice(start - 1, end);

  return (
    <div className="flex items-center justify-center gap-1 pt-3">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        <ChevronLeft size={14} />
      </button>
      {start > 1 && <><button onClick={() => onChange(1)} className="w-7 h-7 rounded-lg text-xs font-bold border border-gray-200 text-gray-500 hover:bg-gray-50">1</button>{start > 2 && <span className="text-gray-300 text-xs">…</span>}</>}
      {visible.map(p => (
        <button key={p} onClick={() => onChange(p)}
          className={`w-7 h-7 rounded-lg text-xs font-bold border transition-all ${p === page ? "bg-extra-darkblue text-white border-extra-darkblue" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
          {p}
        </button>
      ))}
      {end < totalPages && <>{end < totalPages - 1 && <span className="text-gray-300 text-xs">…</span>}<button onClick={() => onChange(totalPages)} className="w-7 h-7 rounded-lg text-xs font-bold border border-gray-200 text-gray-500 hover:bg-gray-50">{totalPages}</button></>}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
        className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

// ── Record Detail Popup ───────────────────────────────────────────────────────
function RecordDetailPopup({ rec, onClose }) {
  const worker = rec.worker || {};
  const status = STATUS_CONFIG[rec.status] || STATUS_CONFIG.absent;
  const trade = worker.trade || "general";
  const tradeCls = TRADE_COLORS[trade] || TRADE_COLORS.general;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
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
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0"><X size={15} /></button>
        </div>

        {/* Date */}
        <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100">
          <p className="text-xs text-gray-400 font-semibold">Date: <span className="text-gray-700">{fmtDate(rec.date)}</span></p>
        </div>

        {/* Times */}
        <div className="px-5 py-4 grid grid-cols-3 gap-3 border-b border-gray-100">
          {[
            { label: "Punch In", value: fmtTime(rec.punchInTime), color: "text-emerald-600" },
            { label: "Punch Out", value: fmtTime(rec.punchOutTime), color: "text-red-500" },
            { label: "Duration", value: fmtDuration(rec.punchInTime, rec.punchOutTime), color: "text-gray-700" },
          ].map(t => (
            <div key={t.label} className="bg-gray-50 rounded-xl px-3 py-2.5 text-center border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t.label}</p>
              <p className={`text-sm font-bold ${t.color}`}>{t.value}</p>
            </div>
          ))}
        </div>

        {/* Details */}
        <div className="px-5 py-4 space-y-3">
          {[
            { icon: Phone, label: "Phone", value: worker.phone },
            { icon: Briefcase, label: "Contractor", value: worker.contractor },
            { icon: MapPin, label: "Site", value: worker.site || rec.site },
            { icon: MapPin, label: "Zone", value: rec.zone || worker.zone },
            { icon: HardHat, label: "Task", value: rec.taskAssigned },
          ].filter(f => f.value).map(f => (
            <div key={f.label} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                <f.icon size={12} className="text-gray-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase">{f.label}</p>
                <p className="text-sm font-semibold text-gray-700 truncate">{f.value}</p>
              </div>
            </div>
          ))}

          {rec.overtime > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
              <Clock size={13} className="text-amber-500 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-amber-600 uppercase">Overtime</p>
                <p className="text-sm font-semibold text-amber-700">{rec.overtime} mins</p>
              </div>
            </div>
          )}

          {rec.notes && (
            <div className="bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Notes</p>
              <p className="text-sm text-gray-600">{rec.notes}</p>
            </div>
          )}

          {rec.markedBy && (
            <p className="text-xs text-gray-400">
              Marked by: <span className="font-semibold text-gray-600">{rec.markedBy?.name || rec.markedBy?.email || "—"}</span>
            </p>
          )}
        </div>

        <div className="px-5 pb-5">
          <button onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-extra-darkblue text-white text-sm font-bold hover:opacity-90 transition-all active:scale-95">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Record Card (compact) ─────────────────────────────────────────────────────
function RecordCard({ rec, onClick }) {
  const worker = rec.worker || {};
  const status = STATUS_CONFIG[rec.status] || STATUS_CONFIG.absent;
  const trade = worker.trade || "general";
  const tradeCls = TRADE_COLORS[trade] || TRADE_COLORS.general;
  const borderCls = status.border || "border-l-gray-200";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white rounded-xl border border-gray-100 border-l-4 ${borderCls} shadow-sm px-4 py-3 flex items-center gap-3 hover:shadow-md hover:border-gray-200 transition-all duration-150 active:scale-[0.99] group`}>
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarBg(worker.name)}`}>
        {worker.name?.charAt(0)?.toUpperCase() || "?"}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-extra-darkblue truncate">{worker.name || "Unknown"}</p>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${tradeCls}`}>{trade}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 flex-wrap">
          {rec.punchInTime && <span className="text-emerald-600 font-medium">{fmtTime(rec.punchInTime)}</span>}
          {rec.punchInTime && rec.punchOutTime && <span>→ {fmtTime(rec.punchOutTime)}</span>}
          {rec.punchInTime && rec.punchOutTime && <span className="text-gray-500 font-medium">· {fmtDuration(rec.punchInTime, rec.punchOutTime)}</span>}
          {!rec.punchInTime && <span>Not punched in</span>}
          {worker.site && <span>· {worker.site}</span>}
        </div>
      </div>

      {/* Status + chevron */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${status.cls}`}>{status.label}</span>
        <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
      </div>
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SiteAttendanceViewPage() {
  const [records, setRecords] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tradeFilter, setTradeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRec, setSelectedRec] = useState(null);
  const [page, setPage] = useState(1);

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 6); return localDateStr(d);
  });
  const [dateTo, setDateTo] = useState(localDateStr());

  const loadRecords = useCallback(async () => {
    setFetching(true); setError("");
    try {
      const params = new URLSearchParams({ all: "true" });
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const res = await fetch(`${API_BASE}/site-attendance/all?${params}`, { headers: authHeaders() });
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) throw new Error("Server error — check API_BASE in .env");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load");
      setRecords(data.records || []);
    } catch (err) { setError(err.message); }
    finally { setFetching(false); }
  }, [dateFrom, dateTo]);

  useEffect(() => { loadRecords(); }, [loadRecords]);
  useEffect(() => { setPage(1); }, [search, siteFilter, statusFilter, tradeFilter]);

  const sites  = [...new Set(records.map(r => r.worker?.site || r.site).filter(Boolean))].sort();
  const trades = [...new Set(records.map(r => r.worker?.trade).filter(Boolean))].sort();

  const filtered = records.filter(r => {
    const ms = !search ||
      (r.worker?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.worker?.phone || "").includes(search) ||
      (r.worker?.contractor || "").toLowerCase().includes(search.toLowerCase());
    const mSite   = !siteFilter || (r.worker?.site || r.site) === siteFilter;
    const mStatus = statusFilter === "all" || r.status === statusFilter;
    const mTrade  = tradeFilter === "all" || r.worker?.trade === tradeFilter;
    return ms && mSite && mStatus && mTrade;
  });

  const stats = {
    total:    filtered.length,
    present:  filtered.filter(r => ["present", "late", "half-day"].includes(r.status)).length,
    absent:   filtered.filter(r => r.status === "absent" || r.status === "on-leave").length,
    late:     filtered.filter(r => r.status === "late").length,
    halfDay:  filtered.filter(r => r.status === "half-day").length,
    onLeave:  filtered.filter(r => r.status === "on-leave").length,
    overtime: filtered.reduce((s, r) => s + (r.overtime || 0), 0),
  };

  // Flatten for pagination (all records in date order)
  const grouped = groupByDate(filtered);
  const allSorted = grouped.flatMap(g => g.rows);
  const totalPages = Math.ceil(allSorted.length / PAGE_SIZE);
  const paginated = allSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  // Re-group the paginated slice by date for headers
  const paginatedGrouped = groupByDate(paginated);

  const activeFilters = [siteFilter, statusFilter !== "all" && statusFilter, tradeFilter !== "all" && tradeFilter].filter(Boolean).length;

  const exportCSV = () => {
    const headers = ["Name", "Trade", "Phone", "Contractor", "Site", "Zone", "Date", "Punch In", "Punch Out", "Duration", "Status", "OT (mins)", "Task", "Notes", "Marked By"];
    const rows = filtered.map(r => [
      r.worker?.name || "", r.worker?.trade || "", r.worker?.phone || "",
      r.worker?.contractor || "", r.worker?.site || r.site || "", r.zone || r.worker?.zone || "",
      fmtDate(r.date), fmtTime(r.punchInTime), fmtTime(r.punchOutTime),
      fmtDuration(r.punchInTime, r.punchOutTime), r.status || "", r.overtime || 0,
      r.taskAssigned || "", r.notes || "", r.markedBy?.name || r.markedBy?.email || "",
    ]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `attendance_${dateFrom}_to_${dateTo}.csv`;
    a.click();
  };

  return (
    <div className="space-y-5">

      {/* Detail popup */}
      {selectedRec && <RecordDetailPopup rec={selectedRec} onClose={() => setSelectedRec(null)} />}

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-extra-darkblue">Attendance Records</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {fetching ? "Loading records…" : `${filtered.length} records · ${fmtDate(dateFrom)} – ${fmtDate(dateTo)}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date range */}
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
            <Calendar size={13} className="text-blue-500 shrink-0" />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="bg-transparent outline-none text-blue-700 text-xs font-semibold cursor-pointer w-[92px]" />
            <span className="text-blue-300 text-xs">→</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="bg-transparent outline-none text-blue-700 text-xs font-semibold cursor-pointer w-[92px]" />
          </div>
          <button onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${showFilters || activeFilters > 0 ? "bg-extra-darkblue text-white border-extra-darkblue" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
            <Filter size={13} /> Filters {activeFilters > 0 && `(${activeFilters})`}
          </button>
          <button onClick={exportCSV} disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all disabled:opacity-40 active:scale-95">
            <Download size={13} /> Export
          </button>
          <button onClick={loadRecords} disabled={fetching}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50">
            <RefreshCw size={14} className={fetching ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      {!fetching && records.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Records", value: stats.total,   icon: Users,        color: "bg-blue-50 text-blue-600"       },
            { label: "Present",       value: stats.present, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
            { label: "Absent",        value: stats.absent,  icon: XCircle,      color: "bg-red-50 text-red-500"         },
            { label: "Late / Half",   value: `${stats.late} · ${stats.halfDay}`, icon: AlertCircle, color: "bg-amber-50 text-amber-600" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                <s.icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-extra-darkblue">{s.value}</p>
                <p className="text-xs font-medium text-gray-500 leading-tight">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Status Breakdown — compact 2×3 grid instead of long bar ── */}
      {!fetching && records.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Activity size={13} className="text-indigo-500" />
            </div>
            <h3 className="text-sm font-bold text-extra-darkblue">Breakdown</h3>
            <span className="text-xs text-gray-400 ml-auto">{filtered.length} records</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: "Present",  value: stats.present, pct: filtered.length ? Math.round((stats.present / filtered.length) * 100) : 0,  color: "bg-emerald-500", light: "bg-emerald-50 text-emerald-700" },
              { label: "Absent",   value: stats.absent,  pct: filtered.length ? Math.round((stats.absent  / filtered.length) * 100) : 0,  color: "bg-red-400",     light: "bg-red-50 text-red-600"         },
              { label: "Late",     value: stats.late,    pct: filtered.length ? Math.round((stats.late    / filtered.length) * 100) : 0,  color: "bg-amber-400",   light: "bg-amber-50 text-amber-700"     },
              { label: "Half Day", value: stats.halfDay, pct: filtered.length ? Math.round((stats.halfDay / filtered.length) * 100) : 0,  color: "bg-purple-400",  light: "bg-purple-50 text-purple-700"   },
              { label: "On Leave", value: stats.onLeave, pct: filtered.length ? Math.round((stats.onLeave / filtered.length) * 100) : 0,  color: "bg-sky-400",     light: "bg-sky-50 text-sky-700"         },
              { label: "OT (min)", value: stats.overtime, pct: null, color: "bg-blue-400", light: "bg-blue-50 text-blue-700" },
            ].map(s => (
              <div key={s.label} className={`rounded-xl px-3 py-2.5 ${s.light} border border-transparent`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{s.label}</span>
                  <span className="text-sm font-bold">{s.value}</span>
                </div>
                {s.pct !== null && (
                  <div className="w-full bg-white/60 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${s.color} transition-all duration-700`} style={{ width: `${s.pct}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Filters panel ── */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input type="text" placeholder="Search name, phone, contractor…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-800 placeholder-gray-300" />
          </div>
          {[
            { label: "Site", value: siteFilter, set: setSiteFilter, opts: sites.map(s => ({ v: s, l: s })) },
            { label: "Status", value: statusFilter, set: setStatusFilter, opts: Object.entries(STATUS_CONFIG).map(([v, s]) => ({ v, l: s.label })) },
            { label: "Trade", value: tradeFilter, set: setTradeFilter, opts: trades.map(t => ({ v: t, l: t.charAt(0).toUpperCase() + t.slice(1) })) },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs font-semibold text-gray-500 block mb-1">{f.label}</label>
              <select value={f.value} onChange={e => f.set(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 text-gray-700 bg-white">
                <option value="">All {f.label}s</option>
                {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          ))}
          <div className="flex items-end sm:col-span-2">
            <button onClick={() => { setSearch(""); setSiteFilter(""); setStatusFilter("all"); setTradeFilter("all"); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
              <X size={12} /> Clear All
            </button>
          </div>
        </div>
      )}

      {/* Quick search (when filter panel hidden) */}
      {!showFilters && (
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input type="text" placeholder="Search by name, phone, contractor…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-800 placeholder-gray-300 bg-white" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* ── Records section ── */}
      <SectionCard
        icon={Users} iconBg="bg-blue-50" iconColor="text-blue-500"
        title="Attendance Log"
        sub={fetching ? "Loading…" : `${filtered.length} records${filtered.length !== records.length ? ` (filtered from ${records.length})` : ""}${totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ""}`}>

        {/* Skeleton */}
        {fetching && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="rounded-xl border border-gray-100 p-3 animate-pulse flex items-center gap-3 bg-gray-50">
                <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
                <div className="w-20 h-6 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!fetching && filtered.length === 0 && !error && (
          <div className="py-12 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm font-semibold text-gray-400">
              {records.length > 0 ? "No records match your filters." : "No attendance submitted for this period yet."}
            </p>
            {records.length > 0 && (
              <button onClick={() => { setSearch(""); setSiteFilter(""); setStatusFilter("all"); setTradeFilter("all"); }}
                className="mt-3 text-xs font-semibold text-blue-600 hover:underline">Clear filters</button>
            )}
          </div>
        )}

        {/* Record cards grouped by date */}
        {!fetching && paginated.length > 0 && (
          <div className="space-y-4">
            {paginatedGrouped.map(({ date, rows }) => (
              <div key={date}>
                {/* Date header */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-extra-darkblue text-white text-xs font-bold px-3 py-1 rounded-lg whitespace-nowrap">{fmtDate(date)}</div>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400 font-semibold whitespace-nowrap">{rows.length} record{rows.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="space-y-2">
                  {rows.map((rec, i) => (
                    <RecordCard key={rec._id || i} rec={rec} onClick={() => setSelectedRec(rec)} />
                  ))}
                </div>
              </div>
            ))}

            <Pagination page={page} totalPages={totalPages} onChange={setPage} />

            <p className="text-center text-xs text-gray-400 pt-1">
              Showing <span className="font-semibold text-gray-600">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
              <span className="font-semibold text-gray-600">{filtered.length}</span> records
            </p>
          </div>
        )}
      </SectionCard>
    </div>
  );
}