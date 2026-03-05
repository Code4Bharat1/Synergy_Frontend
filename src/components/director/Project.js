"use client";
import { useState, useEffect, useCallback } from "react";
import {
  X, AlertTriangle, AlertCircle, ChevronRight,
  MessageSquareWarning, Plus, RefreshCw, Pencil,
  Trash2, Loader2, CheckCircle2, Clock,
} from "lucide-react";
import axiosInstance from "../../lib/axios";

// ── API Helpers ───────────────────────────────────────────────────────────────
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

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  "initiated":    "bg-gray-100 text-gray-500",
  "in-progress":  "bg-blue-50 text-blue-600",
  "installation": "bg-purple-50 text-purple-600",
  "testing":      "bg-amber-50 text-amber-600",
  "completed":    "bg-green-50 text-green-600",
  "on-hold":      "bg-red-50 text-red-500",
};

const STATUS_LABELS = {
  "initiated":    "Initiated",
  "in-progress":  "In Progress",
  "installation": "Installation",
  "testing":      "Testing",
  "completed":    "Completed",
  "on-hold":      "On Hold",
};

const FILTER_OPTIONS = ["All", "initiated", "in-progress", "installation", "testing", "completed", "on-hold"];

const EMPTY_FORM = {
  name: "",
  clientName: "",
  clientContact: "",
  location: "",
  status: "initiated",
  description: "",
  startDate: "",
  endDate: "",
  assignedMarketingExecutive: "",
  assignedInstallationIncharge: "",
  assignedEngineers: "",   // comma-separated IDs
};

// ── Sub-components ────────────────────────────────────────────────────────────
function Bar({ pct, color }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, pct)}%`, background: color }} />
    </div>
  );
}

function Badge({ text, colorClass }) {
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colorClass}`}>{text}</span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ── Project Form ──────────────────────────────────────────────────────────────
function ProjectForm({ initial = EMPTY_FORM, onSubmit, loading, submitLabel = "Submit" }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // Build payload — parse engineers as array, strip empty fields
    const payload = {};
    Object.entries(form).forEach(([k, v]) => {
      if (v === "") return;
      if (k === "assignedEngineers") {
        const ids = v.split(",").map(s => s.trim()).filter(Boolean);
        if (ids.length) payload[k] = ids;
      } else {
        payload[k] = v;
      }
    });
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Project Name *</label>
          <input required value={form.name} onChange={e => set("name", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="e.g. Greenfield Complex" />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Client Name *</label>
          <input required value={form.clientName} onChange={e => set("clientName", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Client full name" />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Client Contact</label>
          <input value={form.clientContact} onChange={e => set("clientContact", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="+92 3xx xxxxxxx" />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Location</label>
          <input value={form.location} onChange={e => set("location", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="City / Address" />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Status</label>
          <select value={form.status} onChange={e => set("status", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Start Date</label>
          <input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">End Date</label>
          <input type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
        <textarea rows={2} value={form.description} onChange={e => set("description", e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
          placeholder="Brief project description" />
      </div>

      <div className="border-t border-gray-100 pt-3 space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Assignments (User ObjectIds)</p>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Marketing Executive</label>
          <input value={form.assignedMarketingExecutive} onChange={e => set("assignedMarketingExecutive", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="MongoDB User ObjectId" />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Installation Incharge</label>
          <input value={form.assignedInstallationIncharge} onChange={e => set("assignedInstallationIncharge", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="MongoDB User ObjectId" />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Engineers (comma-separated IDs)</label>
          <input value={form.assignedEngineers} onChange={e => set("assignedEngineers", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="id1, id2, id3" />
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="w-full bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
        {loading && <Loader2 size={14} className="animate-spin" />}
        {submitLabel}
      </button>
    </form>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({ project: p, onClose }) {
  const [tab, setTab] = useState("overview");
  const tabs = [
    { key: "overview",    label: "Overview"    },
    { key: "team",        label: "Team"        },
    { key: "timeline",    label: "Timeline"    },
  ];

  const statusStyle = STATUS_STYLE[p.status] || "bg-gray-100 text-gray-500";
  const statusLabel = STATUS_LABELS[p.status] || p.status;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col z-10">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0"
          style={{ background: "linear-gradient(135deg, #0F2854, #1C4D8D)" }}>
          <div>
            <h3 className="text-white font-bold text-base">{p.name}</h3>
            <p className="text-blue-300 text-xs mt-0.5">
              {p.location || "No location"} · Client: {p.clientName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge text={statusLabel} colorClass={`${statusStyle} !text-xs`} />
            <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-2 overflow-x-auto shrink-0">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all
                ${tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Overview */}
          {tab === "overview" && (
            <div className="space-y-4">
              {p.description && (
                <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed">{p.description}</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Client",         value: p.clientName },
                  { label: "Contact",        value: p.clientContact || "—" },
                  { label: "Location",       value: p.location || "—" },
                  { label: "Created By",     value: p.createdBy?.name || "—" },
                ].map(i => (
                  <div key={i.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">{i.label}</p>
                    <p className="text-sm font-semibold text-gray-800">{i.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team */}
          {tab === "team" && (
            <div className="space-y-3">
              {/* Marketing Executive */}
              {p.assignedMarketingExecutive ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                    {p.assignedMarketingExecutive.name?.[0] || "M"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{p.assignedMarketingExecutive.name}</p>
                    <p className="text-xs text-gray-400">Marketing Executive · {p.assignedMarketingExecutive.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 px-4">No marketing executive assigned</p>
              )}

              {/* Installation Incharge */}
              {p.assignedInstallationIncharge ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold shrink-0">
                    {p.assignedInstallationIncharge.name?.[0] || "I"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{p.assignedInstallationIncharge.name}</p>
                    <p className="text-xs text-gray-400">Installation Incharge · {p.assignedInstallationIncharge.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 px-4">No installation incharge assigned</p>
              )}

              {/* Engineers */}
              {p.assignedEngineers?.length > 0 ? (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">Engineers</p>
                  <div className="space-y-2">
                    {p.assignedEngineers.map((eng) => (
                      <div key={eng._id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold shrink-0">
                          {eng.name?.[0] || "E"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{eng.name}</p>
                          <p className="text-xs text-gray-400">Engineer · {eng.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 px-4">No engineers assigned</p>
              )}
            </div>
          )}

          {/* Timeline */}
          {tab === "timeline" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Start Date",  value: p.startDate ? new Date(p.startDate).toLocaleDateString() : "—" },
                  { label: "End Date",    value: p.endDate   ? new Date(p.endDate).toLocaleDateString()   : "—" },
                  { label: "Created",     value: new Date(p.createdAt).toLocaleDateString() },
                ].map(i => (
                  <div key={i.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">{i.label}</p>
                    <p className="text-sm font-bold text-gray-800">{i.value}</p>
                  </div>
                ))}
              </div>

              {/* Status timeline visual */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Status Pipeline</p>
                <div className="flex items-center gap-1 flex-wrap">
                  {Object.entries(STATUS_LABELS).map(([k, v], idx, arr) => {
                    const isActive = k === p.status;
                    const statusKeys = Object.keys(STATUS_LABELS);
                    const currentIdx = statusKeys.indexOf(p.status);
                    const isPast = idx < currentIdx;
                    return (
                      <div key={k} className="flex items-center gap-1">
                        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all
                          ${isActive ? STATUS_STYLE[k] + " ring-2 ring-offset-1 ring-blue-300" : isPast ? "bg-green-50 text-green-500" : "bg-gray-100 text-gray-400"}`}>
                          {isPast && !isActive ? "✓ " : ""}{v}
                        </div>
                        {idx < arr.length - 1 && <span className="text-gray-200 text-xs">→</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ProjectOverview() {
  const [projects, setProjects]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError]             = useState(null);
  const [filter, setFilter]           = useState("All");

  // Modals
  const [detailProject, setDetailProject] = useState(null);
  const [showCreate, setShowCreate]       = useState(false);
  const [editProject, setEditProject]     = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch("/projects");
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const handleCreate = async (payload) => {
    try {
      setActionLoading(true);
      await apiFetch("/projects", { method: "POST", body: JSON.stringify(payload) });
      setShowCreate(false);
      fetchProjects();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (payload) => {
    try {
      setActionLoading(true);
      await apiFetch(`/projects/${editProject._id}`, { method: "PUT", body: JSON.stringify(payload) });
      setEditProject(null);
      fetchProjects();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await apiFetch(`/projects/${deleteTarget._id}`, { method: "DELETE" });
      setDeleteTarget(null);
      fetchProjects();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = filter === "All" ? projects : projects.filter(p => p.status === filter);

  // Progress: derive rough % from status
  const statusProgress = { initiated: 5, "in-progress": 40, installation: 65, testing: 85, completed: 100, "on-hold": 0 };

  return (
    <div className="space-y-5">

      {/* Detail modal */}
      {detailProject && <DetailModal project={detailProject} onClose={() => setDetailProject(null)} />}

      {/* Create modal */}
      {showCreate && (
        <Modal title="Create New Project" onClose={() => setShowCreate(false)}>
          <ProjectForm onSubmit={handleCreate} loading={actionLoading} submitLabel="Create Project" />
        </Modal>
      )}

      {/* Edit modal */}
      {editProject && (
        <Modal title="Edit Project" onClose={() => setEditProject(null)}>
          <ProjectForm
            initial={{
              name:                          editProject.name || "",
              clientName:                    editProject.clientName || "",
              clientContact:                 editProject.clientContact || "",
              location:                      editProject.location || "",
              status:                        editProject.status || "initiated",
              description:                   editProject.description || "",
              startDate:                     editProject.startDate ? editProject.startDate.slice(0, 10) : "",
              endDate:                       editProject.endDate   ? editProject.endDate.slice(0, 10)   : "",
              assignedMarketingExecutive:    editProject.assignedMarketingExecutive?._id || "",
              assignedInstallationIncharge:  editProject.assignedInstallationIncharge?._id || "",
              assignedEngineers:             (editProject.assignedEngineers || []).map(e => e._id).join(", "),
            }}
            onSubmit={handleUpdate}
            loading={actionLoading}
            submitLabel="Save Changes"
          />
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <Modal title="Delete Project" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Delete <span className="font-semibold text-gray-800">"{deleteTarget.name}"</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={actionLoading}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60">
                {actionLoading && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Project Overview</h2>
          <p className="text-sm text-gray-400 mt-0.5">{projects.length} projects total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchProjects}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
            <Plus size={13} /> New Project
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
          <AlertCircle size={14} />
          <span>{error}</span>
          <button onClick={fetchProjects} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {Object.entries(STATUS_LABELS).map(([k, v]) => {
          const count = projects.filter(p => p.status === k).length;
          return (
            <button key={k} onClick={() => setFilter(filter === k ? "All" : k)}
              className={`rounded-xl border p-3 text-center transition-all cursor-pointer
                ${filter === k ? "border-blue-300 bg-blue-50" : "border-gray-100 bg-white hover:border-gray-200"}`}>
              <p className={`text-xl font-bold ${STATUS_STYLE[k].split(" ")[1]}`}>{count}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">{v}</p>
            </button>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit overflow-x-auto">
        {["All", ...Object.keys(STATUS_LABELS)].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
              ${filter === f ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
            {f === "All" ? "All" : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Project Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading projects…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-gray-400 text-sm">
          {projects.length === 0 ? "No projects yet. Create the first one!" : "No projects match this filter."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(p => {
            const progress = statusProgress[p.status] ?? 0;
            const statusLabel = STATUS_LABELS[p.status] || p.status;
            const statusStyle = STATUS_STYLE[p.status] || "bg-gray-100 text-gray-500";

            return (
              <div key={p._id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group relative">

                {/* Action buttons — top right */}
                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={e => { e.stopPropagation(); setEditProject(p); }}
                    className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
                    title="Edit">
                    <Pencil size={13} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); setDeleteTarget(p); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>

                <div onClick={() => setDetailProject(p)}>
                  <div className="flex items-start justify-between gap-3 mb-4 pr-16">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{p.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{p.location || "No location"} · {p.clientName}</p>
                    </div>
                    <Badge text={statusLabel} colorClass={statusStyle} />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Progress</span>
                        <span className="font-bold text-blue-700">{progress}%</span>
                      </div>
                      <Bar pct={progress} color="#1C4D8D" />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex gap-3 text-xs text-gray-500 flex-wrap">
                      {p.assignedEngineers?.length > 0 && (
                        <span>{p.assignedEngineers.length} engineer{p.assignedEngineers.length > 1 ? "s" : ""}</span>
                      )}
                      {p.startDate && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} className="text-gray-400" />
                          {new Date(p.startDate).toLocaleDateString()}
                        </span>
                      )}
                      {p.endDate && (
                        <span className="text-gray-400">→ {new Date(p.endDate).toLocaleDateString()}</span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-blue-700 flex items-center gap-1 group-hover:gap-2 transition-all">
                      View Detail <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}