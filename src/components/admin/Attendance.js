"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Search, Clock, CheckCircle2, XCircle, AlertCircle,
  Calendar, Users, RefreshCw, Loader,
} from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// ── API ───────────────────────────────────────────────────────────────────────
// GET /attendance/all?date=YYYY-MM-DD  → specific day + absent fill
// GET /attendance/all?all=true         → every record ever, no absent fill
// GET /attendance/all                  → today + absent fill (default)
const api = {
  async getAll({ date = "", showAll = false } = {}) {
    const params = new URLSearchParams();
    if (showAll)       params.set("all",  "true");
    else if (date)     params.set("date", date);
    const qs  = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE}/attendance/all${qs}`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load attendance");
    return Array.isArray(data) ? data : (data.records || []);
  },
};

// ── Normalise backend record → UI shape ───────────────────────────────────────
// Backend shape:
// { _id, user: { _id, name, email, role }, date, punchInTime, punchOutTime,
//   status, location, notes, createdAt }
function normalise(rec) {
  const user = rec.user || {};

  // Derive a display-friendly department from the user's role
  const roleToDept = {
    qualityControl:       "QC",
    engineer:             "Engineering",
    support:              "Support",
    installationIncharge: "Installation",
    marketingExecutive:   "Marketing",
    marketingCoordinator: "Marketing",
    admin:                "Admin",
    director:             "Admin",
  };

  const punchIn  = rec.punchInTime  ? new Date(rec.punchInTime)  : null;
  const punchOut = rec.punchOutTime ? new Date(rec.punchOutTime) : null;

  // Duration in "Xh Ym" format
  let duration = "–";
  if (punchIn && punchOut) {
    const ms = punchOut - punchIn;
    const h  = Math.floor(ms / 3600000);
    const m  = Math.floor((ms % 3600000) / 60000);
    duration = `${h}h ${m}m`;
  }

  // Capitalise status for display: "present" → "Present"
  const statusRaw = rec.status || "absent";
  const statusMap = {
    present:  "Present",
    late:     "Late",
    absent:   "Absent",
    "half-day": "Half Day",
    "on-leave": "On Leave",
  };
  const status = statusMap[statusRaw] || "Absent";

  return {
    _id:        rec._id,
    // Stable React key: real _id for DB records, "absent-<userId>" for synthetic ones
    uid:        rec._id ?? `absent-${user._id ?? user.email}`,
    name:       user.name  || user.email || "Unknown",
    email:      user.email || "",
    role:       fmtRole(user.role),
    dept:       roleToDept[user.role] || "Other",
    rawRole:    user.role || "",
    date:       rec.date ? fmtDate(rec.date) : "—",
    punchIn:    punchIn  ? fmtTime(punchIn)  : null,
    punchOut:   punchOut ? fmtTime(punchOut) : null,
    duration,
    location:   rec.location || "—",
    notes:      rec.notes    || "",
    status,
  };
}

// ── Format helpers ────────────────────────────────────────────────────────────
function fmtRole(r) {
  if (!r) return "—";
  return r.replace(/([A-Z])/g, " $1").replace(/\b\w/g, c => c.toUpperCase()).trim();
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
function fmtTime(d) {
  return new Date(d).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  Present:    { cls: "bg-green-50 text-green-600",   icon: CheckCircle2 },
  Late:       { cls: "bg-amber-50 text-amber-600",   icon: AlertCircle  },
  Absent:     { cls: "bg-red-50 text-red-500",       icon: XCircle      },
  "Half Day": { cls: "bg-purple-50 text-purple-500", icon: AlertCircle  },
  "On Leave": { cls: "bg-blue-50 text-blue-500",     icon: Clock        },
};

const DEPT_COLORS = {
  QC:           "bg-blue-50 text-blue-600",
  Engineering:  "bg-amber-50 text-amber-600",
  Support:      "bg-red-50 text-red-500",
  Installation: "bg-teal-50 text-teal-600",
  Marketing:    "bg-pink-50 text-pink-600",
  Admin:        "bg-purple-50 text-purple-600",
  Other:        "bg-gray-100 text-gray-500",
};

// ── Summary Stats ─────────────────────────────────────────────────────────────
function SummaryStats({ data }) {
  const present  = data.filter(d => d.status === "Present").length;
  const late     = data.filter(d => d.status === "Late").length;
  const absent   = data.filter(d => d.status === "Absent").length;
  const stats = [
    { label: "Total",   value: data.length, icon: Users,        cls: "bg-blue-50 text-blue-600"    },
    { label: "Present", value: present,     icon: CheckCircle2, cls: "bg-green-50 text-green-600"  },
    { label: "Late",    value: late,        icon: AlertCircle,  cls: "bg-amber-50 text-amber-600"  },
    { label: "Absent",  value: absent,      icon: XCircle,      cls: "bg-red-50 text-red-500"      },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(s => (
        <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.cls}`}>
            <s.icon size={17} />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Mobile Attendance Card ────────────────────────────────────────────────────
function AttendanceCard({ record }) {
  const s = STATUS_CONFIG[record.status] || STATUS_CONFIG.Absent;
  const StatusIcon = s.icon;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
            {record.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{record.name}</p>
            <p className="text-xs text-gray-400 truncate">{record.role}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${s.cls}`}>
            <StatusIcon size={10} /> {record.status}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DEPT_COLORS[record.dept] || DEPT_COLORS.Other}`}>
            {record.dept}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Punch In</p>
          <p className="text-sm font-semibold text-green-600">{record.punchIn || "–"}</p>
          {record.punchIn && <p className="text-xs text-gray-400 truncate mt-0.5">{record.location}</p>}
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Punch Out</p>
          <p className="text-sm font-semibold text-red-500">{record.punchOut || "–"}</p>
        </div>
      </div>

      {record.duration !== "–" && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock size={12} className="text-blue-500" />
          <span>Duration: <strong className="text-gray-900">{record.duration}</strong></span>
        </div>
      )}

      {record.notes && (
        <p className="text-xs text-gray-400 italic truncate">📝 {record.notes}</p>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AttendanceAdmin() {
  const [records,    setRecords]    = useState([]);
  const [fetching,   setFetching]   = useState(true);
  const [search,     setSearch]     = useState("");
  const [filterDept, setFilterDept] = useState("All Departments");
  const [filterStat, setFilterStat] = useState("All");
  const [filterDate, setFilterDate] = useState("");   // YYYY-MM-DD, empty = today
  const [showAll,    setShowAll]    = useState(false); // toggle: today vs all-time
  const [toast,      setToast]      = useState(null);

  const showToast = (msg, type = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch attendance ───────────────────────────────────────────────────────
  const loadAll = useCallback(async (all = showAll, date = filterDate) => {
    setFetching(true);
    try {
      const raw = await api.getAll({
        showAll: all,
        date:    all ? "" : (date || ""), // no date param when showAll
      });
      setRecords(raw.map(normalise));
    } catch (err) {
      showToast(err.message);
    } finally {
      setFetching(false);
    }
  }, [showAll, filterDate]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Toggle between today-view and all-time view
  const handleToggleAll = () => {
    const next = !showAll;
    setShowAll(next);
    if (next) setFilterDate(""); // clear date picker when switching to all-time
    loadAll(next, next ? "" : filterDate);
  };

  // When date picker changes, also force today-view off
  const handleDateChange = (e) => {
    setFilterDate(e.target.value);
    if (showAll) setShowAll(false);
    loadAll(false, e.target.value);
  };

  // ── Derived filter options from live data ──────────────────────────────────
  const depts      = ["All Departments", ...new Set(records.map(r => r.dept))];
  const allStatus  = ["All", "Present", "Late", "Absent", "Half Day", "On Leave"];

  // ── Client-side filter ─────────────────────────────────────────────────────
  // When showAll=true the date picker is hidden, so matchDate is always true.
  // When showAll=false and no date is picked, we still show all fetched records
  // (they're already scoped to today by the server).
  const filtered = records.filter(r => {
    const matchSearch = [r.name, r.role, r.email].some(f =>
      f?.toLowerCase().includes(search.toLowerCase())
    );
    const matchDept = filterDept === "All Departments" || r.dept === filterDept;
    const matchStat = filterStat === "All" || r.status === filterStat;
    return matchSearch && matchDept && matchStat;
  });

  // ── Header label ───────────────────────────────────────────────────────────
  const viewLabel = showAll
    ? "All time"
    : filterDate
      ? new Date(filterDate + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      : "Today";

  return (
    <div className="space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg ${toast.type === "error" ? "bg-red-500" : "bg-gray-900"}`}>
          <AlertCircle size={15} />
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Attendance</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {fetching ? "Loading…" : `All departments — ${viewLabel}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">

          {/* Date picker — hidden when "View All" is active */}
          {!showAll && (
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded-xl">
              <Calendar size={14} />
              <input
                type="date"
                value={filterDate}
                onChange={handleDateChange}
                className="bg-transparent outline-none text-blue-700 text-xs font-semibold cursor-pointer"
                title="Filter by date"
              />
            </div>
          )}

          {/* View All / View Today toggle */}
          <button
            onClick={handleToggleAll}
            disabled={fetching}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors disabled:opacity-40 ${
              showAll
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {showAll ? "📅 Today Only" : "📋 View All"}
          </button>

          {/* Refresh */}
          <button
            onClick={() => loadAll()}
            disabled={fetching}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw size={14} className={fetching ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Stats — always computed from filtered set */}
      <SummaryStats data={filtered} />

      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            placeholder="Search by name, email or role…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 transition-colors text-gray-800 placeholder-gray-300 bg-white"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 text-gray-800 bg-white flex-1 min-w-0"
          >
            {depts.map(d => <option key={d}>{d}</option>)}
          </select>
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl overflow-x-auto">
            {allStatus.map(s => (
              <button
                key={s}
                onClick={() => setFilterStat(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
                  ${filterStat === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading skeleton */}
      {fetching && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
              <div className="h-6 w-16 bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!fetching && records.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-3xl mb-2">🕐</p>
          <p className="text-sm font-semibold text-gray-500">No attendance records found</p>
          <p className="text-xs text-gray-400 mt-1">Records will appear here once employees start punching in.</p>
        </div>
      )}

      {/* No results after filter */}
      {!fetching && records.length > 0 && filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-sm text-gray-400">No records match your filters.</p>
          <button
            onClick={() => { setSearch(""); setFilterDept("All Departments"); setFilterStat("All"); setFilterDate(""); }}
            className="mt-3 text-xs font-semibold text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* MOBILE: Cards grouped by department */}
      {!fetching && filtered.length > 0 && (
        <div className="md:hidden space-y-4">
          {[...new Set(filtered.map(r => r.dept))].map(dept => (
            <div key={dept}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${DEPT_COLORS[dept] || DEPT_COLORS.Other}`}>
                  {dept}
                </span>
                <span className="text-xs text-gray-400">
                  {filtered.filter(r => r.dept === dept).length} employees
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filtered.filter(r => r.dept === dept).map(r => (
                  <AttendanceCard key={r.uid} record={r} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DESKTOP: Table */}
      {!fetching && filtered.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Employee", "Department", "Date", "Punch In", "Punch Out", "Duration", "Location", "Status"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(r => {
                const s = STATUS_CONFIG[r.status] || STATUS_CONFIG.Absent;
                const StatusIcon = s.icon;
                return (
                  <tr key={r.uid} className="hover:bg-gray-50 transition-colors">
                    {/* Employee */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
                          <p className="text-xs text-gray-400">{r.role}</p>
                        </div>
                      </div>
                    </td>
                    {/* Dept */}
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${DEPT_COLORS[r.dept] || DEPT_COLORS.Other}`}>
                        {r.dept}
                      </span>
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{r.date}</td>
                    {/* Punch In */}
                    <td className="px-4 py-3.5 text-sm font-semibold text-green-600 whitespace-nowrap">
                      {r.punchIn || "–"}
                    </td>
                    {/* Punch Out */}
                    <td className="px-4 py-3.5 text-sm font-semibold text-red-500 whitespace-nowrap">
                      {r.punchOut || "–"}
                    </td>
                    {/* Duration */}
                    <td className="px-4 py-3.5">
                      {r.duration !== "–" ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                          <Clock size={11} /> {r.duration}
                        </span>
                      ) : <span className="text-gray-300">–</span>}
                    </td>
                    {/* Location */}
                    <td className="px-4 py-3.5 text-xs text-gray-400 max-w-[160px] truncate" title={r.location}>
                      {r.location}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full w-fit ${s.cls}`}>
                        <StatusIcon size={11} /> {r.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}