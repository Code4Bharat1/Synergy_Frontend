"use client";
import { useState, useEffect } from "react";
import axios from "axios";

// ─── Config ────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

const PRIORITY_CLS = {
  Critical: { badge: "bg-red-100 text-red-700",    bar: "bg-red-500",    border: "border-t-red-500" },
  High:     { badge: "bg-amber-100 text-amber-700", bar: "bg-amber-400",  border: "border-t-amber-400" },
  Medium:   { badge: "bg-blue-100 text-blue-700",   bar: "bg-blue-400",   border: "border-t-blue-400" },
  Low:      { badge: "bg-green-100 text-green-700", bar: "bg-green-400",  border: "border-t-green-400" },
};

// Map project status → priority label for display
const STATUS_PRIORITY_MAP = {
  initiated:   "Medium",
  "in-progress": "High",
  critical:    "Critical",
  completed:   "Low",
};

const ENG_COLORS = [
  { bg: "bg-blue-50",   border: "border-blue-200",  text: "text-blue-800",   avatarBg: "bg-blue-100",   avatarText: "text-blue-800" },
  { bg: "bg-emerald-50",border: "border-emerald-200",text: "text-emerald-800",avatarBg: "bg-emerald-100",avatarText: "text-emerald-800" },
  { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", avatarBg: "bg-orange-100", avatarText: "text-orange-800" },
  { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-800",    avatarBg: "bg-red-100",    avatarText: "text-red-800" },
  { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-800", avatarBg: "bg-violet-100", avatarText: "text-violet-800" },
  { bg: "bg-teal-50",   border: "border-teal-200",   text: "text-teal-800",   avatarBg: "bg-teal-100",   avatarText: "text-teal-800" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────
function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function Avatar({ name, index, size = "md" }) {
  const c  = ENG_COLORS[index % ENG_COLORS.length];
  const sz = size === "sm" ? "w-7 h-7 text-[10px]" : "w-8 h-8 text-xs";
  return (
    <div className={`${sz} ${c.avatarBg} ${c.avatarText} rounded-full flex items-center justify-center font-extrabold border ${c.border} shrink-0`}>
      {getInitials(name)}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function AssignEngineer() {
  const [projects,   setProjects]   = useState([]);
  const [engineers,  setEngineers]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [editingId,  setEditingId]  = useState(null);
  const [draft,      setDraft]      = useState({ engineerIds: [], endDate: "" });
  const [filter,     setFilter]     = useState("all");
  const [savedId,    setSavedId]    = useState(null);
  const [saving,     setSaving]     = useState(false);

  // ── Fetch data on mount ────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = authHeaders();
        const [projRes, userRes] = await Promise.all([
          axios.get(`${API_BASE}/projects`, { headers }),
          axios.get(`${API_BASE}/admin/engineers`, { headers }),
        ]);

        setProjects(projRes.data);
        setEngineers(userRes.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────
  const liveLoad = (id) =>
    projects.filter((p) =>
      (p.assignedEngineers || []).some((e) => (e._id || e) === id)
    ).length;

  const getPriority = (project) =>
    STATUS_PRIORITY_MAP[project.status] || "Medium";

  const daysLeft = (date) =>
    !date ? null : Math.ceil((new Date(date) - new Date()) / 86400000);

  const unassigned = projects.filter(
    (p) => !p.assignedEngineers || p.assignedEngineers.length === 0
  ).length;

  const filtered = projects.filter((p) => {
    const hasEng = p.assignedEngineers && p.assignedEngineers.length > 0;
    if (filter === "assigned")   return hasEng;
    if (filter === "unassigned") return !hasEng;
    return true;
  });

  // ── Edit helpers ───────────────────────────────────────────────────────
  const openEdit = (project) => {
    setEditingId(project._id);
    setDraft({
      engineerIds: (project.assignedEngineers || []).map((e) => e._id || e),
      endDate: project.endDate ? project.endDate.split("T")[0] : "",
    });
  };

  const toggleEngineer = (id) => {
    setDraft((d) => ({
      ...d,
      engineerIds: d.engineerIds.includes(id)
        ? d.engineerIds.filter((e) => e !== id)
        : [...d.engineerIds, id],
    }));
  };

  const save = async (projectId) => {
    try {
      setSaving(true);
      const { data } = await axios.put(
        `${API_BASE}/projects/${projectId}`,
        { assignedEngineers: draft.engineerIds, endDate: draft.endDate || undefined },
        { headers: authHeaders() }
      );

      setProjects((prev) =>
        prev.map((p) => (p._id === projectId ? data.project : p))
      );
      setEditingId(null);
      setSavedId(projectId);
      setTimeout(() => setSavedId(null), 2000);
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  // ── Loading / Error states ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading projects…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center max-w-sm">
          <p className="text-sm font-bold text-red-600 mb-1">Error loading data</p>
          <p className="text-xs text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-blue-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-0.5">
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-blue-950">Assign Engineer</h1>
          </div>
          {unassigned > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <svg width="14" height="14" fill="none" stroke="#D97706" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span className="text-xs font-bold text-amber-700">
                {unassigned} project{unassigned > 1 ? "s" : ""} need an engineer
              </span>
            </div>
          )}
        </div>

        {/* Engineer Capacity Cards */}
        {engineers.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {engineers.map((eng, i) => {
              const load = liveLoad(eng._id);
              const capacity = 5; // default capacity
              const pct  = load / capacity;
              const barCls = pct >= 0.8 ? "bg-red-500" : pct >= 0.6 ? "bg-amber-400" : "bg-blue-700";
              return (
                <div
                  key={eng._id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5"
                  style={{ borderTopWidth: 4, borderTopColor: pct >= 0.8 ? "#EF4444" : pct >= 0.6 ? "#F59E0B" : "#1C4D8D" }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar name={eng.name} index={i} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-blue-950 truncate">{eng.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{eng.role}</p>
                    </div>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] text-gray-400">Workload</span>
                    <span className={`text-[10px] font-bold ${pct >= 0.8 ? "text-red-500" : pct >= 0.6 ? "text-amber-500" : "text-blue-700"}`}>
                      {load}/{capacity}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${barCls} rounded-full transition-all duration-500`} style={{ width: `${Math.min(pct * 100, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

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
            const isEditing   = editingId === project._id;
            const isSaved     = savedId === project._id;
            const priority    = getPriority(project);
            const pm          = PRIORITY_CLS[priority];
            const dl          = daysLeft(project.endDate);
            const dlCls       = dl === null ? "text-gray-400" : dl < 0 ? "text-red-500" : dl < 7 ? "text-amber-500" : "text-green-600";
            const assignedEngs = (project.assignedEngineers || []).map((e) =>
              typeof e === "object" ? e : engineers.find((eng) => eng._id === e)
            ).filter(Boolean);
            const hasEngineers = assignedEngs.length > 0;

            return (
              <div
                key={project._id}
                className={`bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-200 ${pm.border} border-t-4 ${
                  isEditing ? "ring-2 ring-blue-400 ring-offset-1" : "border border-gray-100 hover:shadow-md"
                }`}
              >
                <div className="p-4 sm:p-5">
                  {/* Row 1: ID + priority + saved */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold text-blue-700">{project._id?.slice(-6).toUpperCase()}</span>
                    <span className={`${pm.badge} text-[10px] font-semibold px-2 py-0.5 rounded-full`}>{priority}</span>
                    <span className="text-[10px] font-medium text-gray-400 capitalize">{project.status}</span>
                    {isSaved && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                        Saved
                      </span>
                    )}
                  </div>

                  {/* Row 2: Name + location */}
                  <p className="text-base font-bold text-blue-950 mb-0.5">{project.name}</p>
                  <p className="text-xs text-gray-400 mb-4">{project.clientName} · {project.location}</p>

                  <div className="h-px bg-gray-100 mb-4" />

                  {/* Row 3: Engineers + Date */}
                  <div className="flex gap-4 flex-wrap">
                    {/* Engineers */}
                    <div className="flex-1 min-w-[160px]">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1.5">Engineers</p>

                      {isEditing ? (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {engineers.map((eng, i) => {
                            const selected = draft.engineerIds.includes(eng._id);
                            return (
                              <label
                                key={eng._id}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border cursor-pointer transition-all ${
                                  selected
                                    ? "border-blue-400 bg-blue-50"
                                    : "border-gray-200 hover:border-blue-200"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() => toggleEngineer(eng._id)}
                                  className="accent-blue-700 w-3 h-3"
                                />
                                <Avatar name={eng.name} index={i} size="sm" />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-blue-950 truncate">{eng.name}</p>
                                  <p className="text-[10px] text-gray-400 truncate">{eng.role} · {liveLoad(eng._id)} active</p>
                                </div>
                              </label>
                            );
                          })}
                          {engineers.length === 0 && (
                            <p className="text-xs text-gray-400">No engineers available</p>
                          )}
                        </div>
                      ) : hasEngineers ? (
                        <div className="flex flex-col gap-1.5">
                          {assignedEngs.map((eng, i) => {
                            const engIdx = engineers.findIndex((e) => e._id === (eng._id || eng));
                            return (
                              <div key={eng._id || i} className="flex items-center gap-2">
                                <Avatar name={eng.name} index={engIdx >= 0 ? engIdx : i} />
                                <div>
                                  <p className="text-xs font-bold text-blue-950">{eng.name}</p>
                                  <p className="text-[10px] text-gray-400">{eng.role}</p>
                                </div>
                              </div>
                            );
                          })}
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
                          value={draft.endDate}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border-2 border-blue-400 text-xs text-blue-950 bg-slate-50 outline-none"
                        />
                      ) : project.endDate ? (
                        <div>
                          <p className="text-sm font-bold text-blue-950">
                            {new Date(project.endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                          <p className={`text-xs font-semibold mt-0.5 ${dlCls}`}>
                            {dl === null ? "No date" : dl < 0 ? "Overdue" : `${dl}d remaining`}
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
                          onClick={() => save(project._id)}
                          disabled={saving}
                          className="flex-1 bg-blue-800 hover:bg-blue-900 disabled:opacity-60 text-white rounded-xl py-2.5 text-xs font-bold transition-colors"
                        >
                          {saving ? "Saving…" : "Save Assignment"}
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
                          hasEngineers
                            ? "bg-slate-100 hover:bg-slate-200 text-blue-700"
                            : "bg-blue-950 hover:bg-blue-800 text-white"
                        }`}
                      >
                        {hasEngineers ? "✎  Reassign" : "＋  Assign Engineer"}
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
          Data refreshed · {new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}