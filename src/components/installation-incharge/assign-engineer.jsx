"use client";
import { useState } from "react";

const ENGINEERS = [
  { id: "E001", name: "Sara Hassan",   role: "Senior Engineer",  avatar: "SH", capacity: 5 },
  { id: "E002", name: "Karim Nour",    role: "Project Engineer", avatar: "KN", capacity: 5 },
  { id: "E003", name: "Lena Weber",    role: "Senior Engineer",  avatar: "LW", capacity: 5 },
  { id: "E004", name: "Omar Siddiq",   role: "Junior Engineer",  avatar: "OS", capacity: 3 },
  { id: "E005", name: "Nadia Farouq",  role: "Project Engineer", avatar: "NF", capacity: 5 },
  { id: "E006", name: "Tariq Mansoor", role: "Senior Engineer",  avatar: "TM", capacity: 5 },
];

const INITIAL_PROJECTS = [
  { id: "PRJ-2412", name: "Ocean World",        client: "Ocean World LLC", location: "Dubai, UAE",     priority: "High",     engineerId: null,   completionDate: "" },
  { id: "PRJ-2422", name: "TidalPark Muscat",   client: "Oman Leisure",    location: "Muscat, Oman",   priority: "Critical", engineerId: null,   completionDate: "" },
  { id: "PRJ-2431", name: "BlueLake Athens",    client: "Hellas Aqua",     location: "Athens, Greece", priority: "Medium",   engineerId: null,   completionDate: "" },
  { id: "PRJ-2435", name: "FlowPark Doha",      client: "Qatar Parks Ltd", location: "Doha, Qatar",    priority: "High",     engineerId: null,   completionDate: "" },
  { id: "PRJ-2401", name: "AquaPark Dubai",     client: "AquaPark Dubai",  location: "Dubai, UAE",     priority: "Medium",   engineerId: "E001", completionDate: "2026-03-10" },
  { id: "PRJ-2389", name: "Blue Lagoon Resort", client: "Blue Lagoon Co.", location: "Bahrain",        priority: "High",     engineerId: "E002", completionDate: "2026-02-28" },
  { id: "PRJ-2376", name: "SunSplash Inc.",     client: "SunSplash Inc.",  location: "Abu Dhabi, UAE", priority: "Low",      engineerId: "E003", completionDate: "2026-04-15" },
];

const PRIORITY_CLS = {
  Critical: { badge: "bg-red-100 text-red-700",    bar: "bg-red-500",    border: "border-t-red-500" },
  High:     { badge: "bg-amber-100 text-amber-700", bar: "bg-amber-400",  border: "border-t-amber-400" },
  Medium:   { badge: "bg-blue-100 text-blue-700",   bar: "bg-blue-400",   border: "border-t-blue-400" },
  Low:      { badge: "bg-green-100 text-green-700", bar: "bg-green-400",  border: "border-t-green-400" },
};

const ENG_COLORS = [
  { bg: "bg-blue-50",   border: "border-blue-200",  text: "text-blue-800",   avatarBg: "bg-blue-100",   avatarText: "text-blue-800" },
  { bg: "bg-emerald-50",border: "border-emerald-200",text: "text-emerald-800",avatarBg: "bg-emerald-100",avatarText: "text-emerald-800" },
  { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", avatarBg: "bg-orange-100", avatarText: "text-orange-800" },
  { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-800",    avatarBg: "bg-red-100",    avatarText: "text-red-800" },
  { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-800", avatarBg: "bg-violet-100", avatarText: "text-violet-800" },
  { bg: "bg-teal-50",   border: "border-teal-200",   text: "text-teal-800",   avatarBg: "bg-teal-100",   avatarText: "text-teal-800" },
];

function Avatar({ initials, index, size = "md" }) {
  const c = ENG_COLORS[index % ENG_COLORS.length];
  const sz = size === "sm" ? "w-7 h-7 text-[10px]" : "w-8 h-8 text-xs";
  return (
    <div className={`${sz} ${c.avatarBg} ${c.avatarText} rounded-full flex items-center justify-center font-extrabold border ${c.border} shrink-0`}>
      {initials}
    </div>
  );
}

export default function AssignEngineer() {
  const [projects, setProjects]   = useState(INITIAL_PROJECTS);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft]         = useState({ engineerId: "", completionDate: "" });
  const [filter, setFilter]       = useState("all");
  const [savedId, setSavedId]     = useState(null);

  const liveLoad = (id)   => projects.filter((p) => p.engineerId === id).length;
  const getEng   = (id)   => ENGINEERS.find((e) => e.id === id);
  const daysLeft = (date) => !date ? null : Math.ceil((new Date(date) - new Date()) / 86400000);

  const openEdit = (p) => {
    setEditingId(p.id);
    setDraft({ engineerId: p.engineerId || "", completionDate: p.completionDate || "" });
  };

  const save = (projectId) => {
    setProjects((prev) => prev.map((p) =>
      p.id === projectId ? { ...p, engineerId: draft.engineerId || null, completionDate: draft.completionDate } : p
    ));
    setEditingId(null);
    setSavedId(projectId);
    setTimeout(() => setSavedId(null), 2000);
  };

  const unassigned = projects.filter((p) => !p.engineerId).length;
  const filtered = projects.filter((p) => {
    if (filter === "assigned")   return !!p.engineerId;
    if (filter === "unassigned") return !p.engineerId;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-blue-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-0.5">Wednesday, 25 February 2026</p>
            <h1 className="text-xl sm:text-2xl font-bold text-blue-950">Assign Engineer</h1>
          </div>
          {unassigned > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <svg width="14" height="14" fill="none" stroke="#D97706" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span className="text-xs font-bold text-amber-700">{unassigned} project{unassigned > 1 ? "s" : ""} need an engineer</span>
            </div>
          )}
        </div>

        {/* Engineer Capacity Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {ENGINEERS.map((eng, i) => {
            const load = liveLoad(eng.id);
            const pct  = load / eng.capacity;
            const c    = ENG_COLORS[i % ENG_COLORS.length];
            const barCls = pct >= 0.8 ? "bg-red-500" : pct >= 0.6 ? "bg-amber-400" : "bg-blue-700";
            return (
              <div key={eng.id} className={`bg-white rounded-2xl border-t-4 ${PRIORITY_CLS["Medium"].border.replace("border-t-blue-400", "")} border border-gray-100 shadow-sm p-3.5`}
                style={{ borderTopColor: pct >= 0.8 ? "#EF4444" : pct >= 0.6 ? "#F59E0B" : "#1C4D8D" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Avatar initials={eng.avatar} index={i} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-blue-950 truncate">{eng.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{eng.role}</p>
                  </div>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-gray-400">Workload</span>
                  <span className={`text-[10px] font-bold ${pct >= 0.8 ? "text-red-500" : pct >= 0.6 ? "text-amber-500" : "text-blue-700"}`}>{load}/{eng.capacity}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${barCls} rounded-full transition-all duration-500`} style={{ width: `${pct * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <p className="text-sm font-bold text-blue-950">{filtered.length} Project{filtered.length !== 1 ? "s" : ""}</p>
          <div className="flex gap-1 bg-blue-100/60 rounded-xl p-1">
            {[
              { key: "all",        label: "All" },
              { key: "unassigned", label: `Unassigned · ${unassigned}` },
              { key: "assigned",   label: "Assigned" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  filter === f.key ? "bg-blue-800 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((project) => {
            const isEditing = editingId === project.id;
            const isSaved   = savedId === project.id;
            const eng       = getEng(project.engineerId);
            const engIdx    = eng ? ENGINEERS.findIndex((e) => e.id === eng.id) : -1;
            const pm        = PRIORITY_CLS[project.priority];
            const dl        = daysLeft(project.completionDate);
            const dlCls     = dl === null ? "text-gray-400" : dl < 0 ? "text-red-500" : dl < 7 ? "text-amber-500" : "text-green-600";

            return (
              <div
                key={project.id}
                className={`bg-white rounded-2xl shadow-sm border-t-4 overflow-hidden transition-all duration-200 ${pm.border} ${
                  isEditing ? "ring-2 ring-blue-400 ring-offset-1" : "border border-gray-100 hover:shadow-md"
                }`}
              >
                <div className="p-4 sm:p-5">
                  {/* Row 1: ID + priority + saved */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold text-blue-700">{project.id}</span>
                    <span className={`${pm.badge} text-[10px] font-semibold px-2 py-0.5 rounded-full`}>{project.priority}</span>
                    {isSaved && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                        Saved
                      </span>
                    )}
                  </div>

                  {/* Row 2: Name + location */}
                  <p className="text-base font-bold text-blue-950 mb-0.5">{project.name}</p>
                  <p className="text-xs text-gray-400 mb-4">{project.client} · {project.location}</p>

                  <div className="h-px bg-gray-100 mb-4" />

                  {/* Row 3: Engineer + Date */}
                  <div className="flex gap-4 flex-wrap">
                    {/* Engineer */}
                    <div className="flex-1 min-w-[140px]">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1.5">Engineer</p>
                      {isEditing ? (
                        <select
                          value={draft.engineerId}
                          onChange={(e) => setDraft((d) => ({ ...d, engineerId: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border-2 border-blue-400 text-xs text-blue-950 bg-slate-50 outline-none cursor-pointer"
                        >
                          <option value="">— Select —</option>
                          {ENGINEERS.map((e) => {
                            const ll   = liveLoad(e.id);
                            const full = ll >= e.capacity && e.id !== project.engineerId;
                            return <option key={e.id} value={e.id} disabled={full}>{e.name} ({ll}/{e.capacity}){full ? " Full" : ""}</option>;
                          })}
                        </select>
                      ) : eng ? (
                        <div className="flex items-center gap-2">
                          <Avatar initials={eng.avatar} index={engIdx} />
                          <div>
                            <p className="text-xs font-bold text-blue-950">{eng.name}</p>
                            <p className="text-[10px] text-gray-400">{eng.role}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 bg-red-50 border border-dashed border-red-200 rounded-lg px-2.5 py-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          <span className="text-xs font-bold text-red-600">Unassigned</span>
                        </div>
                      )}
                    </div>

                    {/* Date */}
                    <div className="flex-1 min-w-[120px]">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1.5">Completion</p>
                      {isEditing ? (
                        <input
                          type="date"
                          value={draft.completionDate}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) => setDraft((d) => ({ ...d, completionDate: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border-2 border-blue-400 text-xs text-blue-950 bg-slate-50 outline-none"
                        />
                      ) : project.completionDate ? (
                        <div>
                          <p className="text-sm font-bold text-blue-950">
                            {new Date(project.completionDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                          <p className={`text-xs font-semibold mt-0.5 ${dlCls}`}>
                            {dl < 0 ? "Overdue" : `${dl}d remaining`}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">Not set</span>
                      )}
                    </div>
                  </div>

                  {/* Row 4: Actions */}
                  <div className="mt-4 flex gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => save(project.id)}
                          className="flex-1 bg-blue-800 hover:bg-blue-900 text-white rounded-xl py-2.5 text-xs font-bold transition-colors"
                        >
                          Save Assignment
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="bg-slate-100 hover:bg-slate-200 text-gray-500 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => openEdit(project)}
                        className={`w-full rounded-xl py-2.5 text-xs font-bold transition-colors ${
                          project.engineerId
                            ? "bg-slate-100 hover:bg-slate-200 text-blue-700"
                            : "bg-blue-950 hover:bg-blue-800 text-white"
                        }`}
                      >
                        {project.engineerId ? "✎  Reassign" : "＋  Assign Engineer"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-sm text-gray-400 bg-white rounded-2xl shadow-sm">
              No projects match this filter.
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-xs text-gray-400 text-right">
          Data refreshed · 25 Feb 2026, 09:41 AM
        </p>
      </div>
    </div>
  );
}