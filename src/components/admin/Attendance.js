"use client";
import { useState } from "react";
import { Search, Clock, CheckCircle2, XCircle, AlertCircle, Calendar, Users, Filter } from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────
const ATTENDANCE_DATA = [
  // QC Department
  { id: 1,  name: "Ahmad Raza",   dept: "QC",           role: "QC Inspector",     date: "26 Feb 2026", punchIn: "09:02 AM", punchOut: "06:15 PM", duration: "9h 13m", inLocation: "Willingdon, Mumbai",         outLocation: "Bandra West, Mumbai",      status: "Present"  },
  { id: 2,  name: "Priya Nair",   dept: "QC",           role: "QC Inspector",     date: "26 Feb 2026", punchIn: "08:55 AM", punchOut: "05:50 PM", duration: "8h 55m", inLocation: "Santacruz West, Mumbai",     outLocation: "Santacruz West, Mumbai",   status: "Present"  },
  { id: 3,  name: "Riya Sharma",  dept: "QC",           role: "QC Inspector",     date: "26 Feb 2026", punchIn: null,       punchOut: null,       duration: "–",      inLocation: "–",                          outLocation: "–",                        status: "Absent"   },
  // Engineering Department
  { id: 4,  name: "Sara Malik",   dept: "Engineering",  role: "Site Engineer",    date: "26 Feb 2026", punchIn: "09:30 AM", punchOut: null,       duration: "–",      inLocation: "Greenfield Complex, Karachi",outLocation: "–",                        status: "Late"     },
  { id: 5,  name: "Omar Sheikh",  dept: "Engineering",  role: "Site Engineer",    date: "26 Feb 2026", punchIn: "08:45 AM", punchOut: "06:00 PM", duration: "9h 15m", inLocation: "Harbor View Tower, Lahore",  outLocation: "Harbor View Tower, Lahore",status: "Present"  },
  { id: 6,  name: "Bilal Khan",   dept: "Engineering",  role: "Site Engineer",    date: "26 Feb 2026", punchIn: "09:05 AM", punchOut: "05:30 PM", duration: "8h 25m", inLocation: "Westgate Mall, Islamabad",   outLocation: "Westgate Mall, Islamabad", status: "Present"  },
  // Complaints Department
  { id: 7,  name: "James K.",     dept: "Complaints",   role: "Complaint Handler",date: "26 Feb 2026", punchIn: "10:15 AM", punchOut: "06:30 PM", duration: "8h 15m", inLocation: "Greenfield Complex, Karachi",outLocation: "Greenfield Complex",       status: "Late"     },
  { id: 8,  name: "Layla Ahmed",  dept: "Complaints",   role: "Complaint Handler",date: "26 Feb 2026", punchIn: null,       punchOut: null,       duration: "–",      inLocation: "–",                          outLocation: "–",                        status: "Absent"   },
  // Admin Department
  { id: 9,  name: "Zaid",         dept: "Admin",        role: "Admin",            date: "26 Feb 2026", punchIn: "08:30 AM", punchOut: "07:00 PM", duration: "10h 30m",inLocation: "Head Office, Karachi",       outLocation: "Head Office, Karachi",     status: "Present"  },
  { id: 10, name: "Nadia Farooq", dept: "Admin",        role: "Director",         date: "26 Feb 2026", punchIn: "09:00 AM", punchOut: "06:00 PM", duration: "9h 00m", inLocation: "Head Office, Karachi",       outLocation: "Head Office, Karachi",     status: "Present"  },
];

const DEPTS       = ["All Departments", ...new Set(ATTENDANCE_DATA.map(a => a.dept))];
const ALL_STATUS  = ["All", "Present", "Late", "Absent"];

const STATUS_CONFIG = {
  Present: { cls: "bg-green-50 text-green-600",  icon: CheckCircle2  },
  Late:    { cls: "bg-amber-50 text-amber-600",  icon: AlertCircle   },
  Absent:  { cls: "bg-red-50 text-red-500",      icon: XCircle       },
};

const DEPT_COLORS = {
  QC:          "bg-lightblue text-extra-blue",
  Engineering: "bg-amber-50 text-amber-600",
  Complaints:  "bg-red-50 text-red-500",
  Admin:       "bg-purple-50 text-purple-600",
};

// ── Summary Stats ─────────────────────────────────────────────────────────────
function SummaryStats({ data }) {
  const present = data.filter(d => d.status === "Present").length;
  const late    = data.filter(d => d.status === "Late").length;
  const absent  = data.filter(d => d.status === "Absent").length;
  const stats = [
    { label: "Total",   value: data.length, icon: Users,        cls: "bg-lightblue text-extra-blue"   },
    { label: "Present", value: present,     icon: CheckCircle2, cls: "bg-green-50 text-green-600"     },
    { label: "Late",    value: late,        icon: AlertCircle,  cls: "bg-amber-50 text-amber-600"     },
    { label: "Absent",  value: absent,      icon: XCircle,      cls: "bg-red-50 text-red-500"         },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(s => (
        <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.cls}`}>
            <s.icon size={17} />
          </div>
          <div>
            <p className="text-xl font-bold text-extra-darkblue">{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Mobile Attendance Card ────────────────────────────────────────────────────
function AttendanceCard({ record }) {
  const s = STATUS_CONFIG[record.status];
  const StatusIcon = s.icon;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-lightblue text-extra-blue flex items-center justify-center text-sm font-bold shrink-0">
            {record.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-extra-darkblue truncate">{record.name}</p>
            <p className="text-xs text-gray-400 truncate">{record.role}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${s.cls}`}>
            <StatusIcon size={10} /> {record.status}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DEPT_COLORS[record.dept]}`}>{record.dept}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Punch In</p>
          <p className="text-sm font-semibold text-green-600">{record.punchIn || "–"}</p>
          {record.punchIn && <p className="text-xs text-gray-400 truncate mt-0.5">{record.inLocation}</p>}
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Punch Out</p>
          <p className="text-sm font-semibold text-red-500">{record.punchOut || "–"}</p>
          {record.punchOut && <p className="text-xs text-gray-400 truncate mt-0.5">{record.outLocation}</p>}
        </div>
      </div>

      {record.duration !== "–" && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock size={12} className="text-extra-blue" />
          <span>Duration: <strong className="text-extra-darkblue">{record.duration}</strong></span>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Attendance() {
  const [search,     setSearch]     = useState("");
  const [filterDept, setFilterDept] = useState("All Departments");
  const [filterStat, setFilterStat] = useState("All");
  const [date,       setDate]       = useState("26 Feb 2026");

  const filtered = ATTENDANCE_DATA.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.role.toLowerCase().includes(search.toLowerCase());
    const matchDept   = filterDept === "All Departments" || r.dept === filterDept;
    const matchStat   = filterStat === "All" || r.status === filterStat;
    return matchSearch && matchDept && matchStat;
  });

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-extra-darkblue">Attendance</h2>
          <p className="text-sm text-gray-400 mt-0.5">All departments — {date}</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-extra-blue bg-lightblue px-3 py-2 rounded-xl">
          <Calendar size={14} /> {date}
        </div>
      </div>

      {/* Stats */}
      <SummaryStats data={filtered} />

      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
          <input type="text" placeholder="Search by name or role…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-medium-blue transition-colors text-extra-darkblue placeholder-gray-300 bg-white" />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-medium-blue text-extra-darkblue bg-white flex-1 min-w-0">
            {DEPTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl overflow-x-auto">
            {ALL_STATUS.map(s => (
              <button key={s} onClick={() => setFilterStat(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
                  ${filterStat === s ? "bg-white text-extra-darkblue shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MOBILE: Cards grouped by dept */}
      <div className="md:hidden space-y-4">
        {[...new Set(filtered.map(r => r.dept))].map(dept => (
          <div key={dept}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${DEPT_COLORS[dept]}`}>{dept}</span>
              <span className="text-xs text-gray-400">{filtered.filter(r => r.dept === dept).length} employees</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.filter(r => r.dept === dept).map(r => (
                <AttendanceCard key={r.id} record={r} />
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No records found</p>}
      </div>

      {/* DESKTOP: Table */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Employee", "Department", "Punch In", "In Location", "Punch Out", "Out Location", "Duration", "Status"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(r => {
              const s = STATUS_CONFIG[r.status];
              const StatusIcon = s.icon;
              return (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-lightblue text-extra-blue flex items-center justify-center text-xs font-bold shrink-0">{r.name.charAt(0)}</div>
                      <div>
                        <p className="font-semibold text-extra-darkblue text-sm">{r.name}</p>
                        <p className="text-xs text-gray-400">{r.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${DEPT_COLORS[r.dept]}`}>{r.dept}</span>
                  </td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-green-600 whitespace-nowrap">{r.punchIn || "–"}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-400 max-w-[140px] truncate">{r.inLocation}</td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-red-500 whitespace-nowrap">{r.punchOut || "–"}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-400 max-w-[140px] truncate">{r.outLocation}</td>
                  <td className="px-4 py-3.5">
                    {r.duration !== "–" ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-extra-blue">
                        <Clock size={11} /> {r.duration}
                      </span>
                    ) : <span className="text-gray-300">–</span>}
                  </td>
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
        {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-10">No records found</p>}
      </div>
    </div>
  );
}