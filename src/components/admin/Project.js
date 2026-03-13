"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, X, CheckCircle2, MapPin, Calendar, User, RefreshCw, Loader, Phone, FileText, Users, Briefcase, Eye } from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// ── API calls ─────────────────────────────────────────────────────────────────
const api = {
  async getProjects() {
    const res = await fetch(`${API_BASE}/projects`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load projects");
    return Array.isArray(data) ? data : (data.projects || []);
  },
  async createProject(body) {
    const res = await fetch(`${API_BASE}/projects`, {
      method: "POST", headers: authHeaders(), body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create project");
    return data.project;
  },
  async updateProject(id, body) {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: "PUT", headers: authHeaders(), body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update project");
    return data.project;
  },
  async deleteProject(id) {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: "DELETE", headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete project");
  },
  async getUsers() {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: authHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.users || []);
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ["initiated", "in-progress", "installation", "testing", "completed", "on-hold"];

const STATUS_STYLE = {
  "initiated": "bg-gray-50 text-gray-500",
  "in-progress": "bg-green-50 text-green-600",
  "installation": "bg-blue-50 text-blue-600",
  "testing": "bg-purple-50 text-purple-600",
  "completed": "bg-emerald-50 text-emerald-600",
  "on-hold": "bg-amber-50 text-amber-600",
};

const STATUS_PROGRESS = {
  "initiated": 5,
  "in-progress": 40,
  "installation": 65,
  "testing": 80,
  "completed": 100,
  "on-hold": 30,
};

const formatStatus = (s) =>
  s ? s.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "—";

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const resolveName = (field, users) => {
  if (!field) return null;
  if (typeof field === "object") return field.name || field.email || null;
  const found = users.find(u => u._id === field);
  return found ? (found.name || found.email) : null;
};

const resolveNames = (arr, users) => {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr
    .map(item => resolveName(item, users))
    .filter(Boolean)
    .join(", ");
};

// ── Static UI helpers ─────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 z-10 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-extra-darkblue">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 transition-colors text-gray-800 placeholder-gray-300";

// ── Empty form state ──────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: "",
  clientName: "",
  clientContact: "",
  location: "",
  status: "initiated",
  startDate: "",
  endDate: "",
  description: "",
  assignedMarketingExecutive: "",
  assignedInstallationIncharge: "",
  assignedEngineers: [],   // array of _id strings
};

const projectToForm = (p) => ({
  name: p.name || "",
  clientName: p.clientName || "",
  clientContact: p.clientContact || "",
  location: p.location || "",
  status: p.status || "initiated",
  startDate: p.startDate ? p.startDate.slice(0, 10) : "",
  endDate: p.endDate ? p.endDate.slice(0, 10) : "",
  description: p.description || "",
  assignedMarketingExecutive:
    p.assignedMarketingExecutive?._id || p.assignedMarketingExecutive || "",
  assignedInstallationIncharge:
    p.assignedInstallationIncharge?._id || p.assignedInstallationIncharge || "",
  assignedEngineers: Array.isArray(p.assignedEngineers)
    ? p.assignedEngineers.map(e => e._id || e)
    : [],
});
const STATUS_PHASE = {
  "initiated":    "Site Preparation",
  "in-progress":  "Wiring & Plumbing",
  "installation": "Installation",
  "testing":      "Final Testing",
  "completed":    "Completed",
  "on-hold":      "Site Preparation",
};
const toPayload = (f) => ({
  name: f.name.trim(),
  clientName: f.clientName.trim(),
  status: f.status,
  progress: STATUS_PROGRESS[f.status] ?? 0,
   phase: STATUS_PHASE[f.status],
  ...(f.clientContact.trim() && { clientContact: f.clientContact.trim() }),
  ...(f.location.trim() && { location: f.location.trim() }),
  ...(f.description.trim() && { description: f.description.trim() }),
  ...(f.startDate && { startDate: f.startDate }),
  ...(f.endDate && { endDate: f.endDate }),
  ...(f.assignedMarketingExecutive && { assignedMarketingExecutive: f.assignedMarketingExecutive }),
  ...(f.assignedInstallationIncharge && { assignedInstallationIncharge: f.assignedInstallationIncharge }),
  ...(f.assignedEngineers.length > 0 && { assignedEngineers: f.assignedEngineers }),
});

// ── FormFields — defined OUTSIDE the main component to prevent remounting ─────
// Receives form state + setters as props. This is the critical fix for the
// "one character at a time" bug: when FormFields was defined inside the render
// function, React treated it as a new component type on every render and
// unmounted+remounted it (and its inputs) after each keystroke.
function FormFields({ form, setForm, users }) {
  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const marketingExecs = users.filter(u => u.role === "marketingExecutive");
  const incharges = users.filter(u => u.role === "installationIncharge");
  const engineers = users.filter(u => u.role === "engineer");

  const toggleEngineer = (id) => {
    setForm(f => ({
      ...f,
      assignedEngineers: f.assignedEngineers.includes(id)
        ? f.assignedEngineers.filter(e => e !== id)
        : [...f.assignedEngineers, id],
    }));
  };

  return (
    <>
      {/* ── Section: Project Info ── */}
      <div className="pb-1 border-b border-gray-100">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Project Info</p>
      </div>

      <Field label="Project Name *">
        <input
          className={inputCls}
          placeholder="e.g. Greenfield Complex"
          value={form.name}
          onChange={set("name")}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Client Name *">
          <input
            className={inputCls}
            placeholder="e.g. Gulf Leisure"
            value={form.clientName}
            onChange={set("clientName")}
          />
        </Field>
        <Field label="Client Contact">
          <input
            className={inputCls}
            placeholder="+92 300 0000000"
            value={form.clientContact}
            onChange={set("clientContact")}
          />
        </Field>
      </div>

      <Field label="Location">
        <input
          className={inputCls}
          placeholder="e.g. Karachi, Block 5"
          value={form.location}
          onChange={set("location")}
        />
      </Field>

      <Field label="Description">
        <textarea
          className={`${inputCls} resize-none`}
          rows={3}
          placeholder="Brief project description…"
          value={form.description}
          onChange={set("description")}
        />
      </Field>

      {/* ── Section: Schedule & Status ── */}
      <div className="pb-1 border-b border-gray-100 pt-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Schedule & Status</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Start Date">
          <input
            type="date"
            className={inputCls}
            value={form.startDate}
            onChange={set("startDate")}
          />
        </Field>
        <Field label="End Date">
          <input
            type="date"
            className={inputCls}
            value={form.endDate}
            onChange={set("endDate")}
          />
        </Field>
      </div>

      <Field label="Status">
        <select className={inputCls} value={form.status} onChange={set("status")}>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{formatStatus(s)}</option>
          ))}
        </select>
      </Field>

      {/* ── Section: Team Assignment ── */}
      <div className="pb-1 border-b border-gray-100 pt-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Team Assignment</p>
      </div>

      <Field label="Marketing Executive">
        <select
          className={inputCls}
          value={form.assignedMarketingExecutive}
          onChange={set("assignedMarketingExecutive")}
        >
          <option value="">— None —</option>
          {marketingExecs.map(u => (
            <option key={u._id} value={u._id}>{u.name || u.email}</option>
          ))}
        </select>
      </Field>

      <Field label="Installation In-Charge">
        <select
          className={inputCls}
          value={form.assignedInstallationIncharge}
          onChange={set("assignedInstallationIncharge")}
        >
          <option value="">— None —</option>
          {incharges.map(u => (
            <option key={u._id} value={u._id}>{u.name || u.email}</option>
          ))}
        </select>
      </Field>

      <Field label={`Engineers${form.assignedEngineers.length > 0 ? ` (${form.assignedEngineers.length} selected)` : ""}`}>
        {engineers.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">No engineers found.</p>
        ) : (
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-40 overflow-y-auto">
            {engineers.map(u => {
              const checked = form.assignedEngineers.includes(u._id);
              return (
                <label
                  key={u._id}
                  onClick={() => toggleEngineer(u._id)}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${checked ? "bg-blue-50" : "hover:bg-gray-50"}`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checked ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
                    {checked && (
                      <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2.5">
                        <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-gray-700">{u.name || u.email}</span>
                </label>
              );
            })}
          </div>
        )}
      </Field>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ProjectManagement() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [modal, setModal] = useState(null);   // null | "create" | "edit"
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadProjects = useCallback(async () => {
    setFetching(true);
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
    api.getUsers().then(setUsers).catch(() => { });
  }, [loadProjects]);

  // ── Create ────────────────────────────────────────────────────────────────
  const openCreate = () => { setForm(EMPTY_FORM); setModal("create"); };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.clientName.trim()) {
      showToast("Project name and client name are required", "error");
      return;
    }
    setSaving(true);
    try {
      const project = await api.createProject(toPayload(form));
      setProjects(prev => [project, ...prev]);
      setModal(null);
      showToast("Project created");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEdit = (p) => { setSelected(p); setForm(projectToForm(p)); setModal("edit"); };

  const handleEdit = async () => {
    if (!form.name.trim() || !form.clientName.trim()) {
      showToast("Project name and client name are required", "error");
      return;
    }
    setSaving(true);
    try {
      const updated = await api.updateProject(selected._id, toPayload(form));
      setProjects(prev => prev.map(p => p._id === updated._id ? updated : p));
      setModal(null);
      showToast("Project updated");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await api.deleteProject(id);
      setProjects(prev => prev.filter(p => p._id !== id));
      setModal(null);
      showToast("Project deleted");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setDeleting(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg ${toast.type === "error" ? "bg-red-500" : "bg-blue-900"}`}>
          <CheckCircle2 size={15} className={toast.type === "error" ? "text-red-200" : "text-green-400"} />
          {toast.msg}
        </div>
      )}

      {/* Create Modal */}
      {modal === "create" && (
        <Modal title="Create Project" onClose={() => !saving && setModal(null)}>
          <FormFields form={form} setForm={setForm} users={users} />
          <button
            onClick={handleCreate}
            disabled={saving}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#0F2854" }}
          >
            {saving && <Loader size={14} className="animate-spin" />}
            Create Project
          </button>
        </Modal>
      )}

      {/* Edit Modal */}
      {modal === "edit" && (
        <Modal title="Edit Project" onClose={() => !saving && setModal(null)}>
          <FormFields form={form} setForm={setForm} users={users} />
          <button
            onClick={handleEdit}
            disabled={saving}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#0F2854" }}
          >
            {saving && <Loader size={14} className="animate-spin" />}
            Save Changes
          </button>
          <button
            onClick={() => handleDelete(selected._id)}
            disabled={!!deleting}
            className="w-full py-2 rounded-xl text-xs font-semibold text-red-400 border border-red-100 hover:bg-red-50 transition-colors disabled:opacity-40"
          >
            {deleting ? "Deleting…" : "Delete Project"}
          </button>
        </Modal>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-extra-darkblue">Project Management</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {fetching ? "Loading…" : `${projects.length} project${projects.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadProjects}
            disabled={fetching}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={14} className={fetching ? "animate-spin" : ""} />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow hover:opacity-90 transition-all"
            style={{ background: "#0F2854" }}
          >
            <Plus size={15} /> Create Project
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {fetching && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
              <div className="h-2 bg-gray-100 rounded w-full mt-4" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!fetching && projects.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-2xl mb-2">📋</p>
          <p className="text-sm font-semibold text-gray-500">No projects yet</p>
          <p className="text-xs text-gray-400 mt-1">Click "Create Project" to get started.</p>
        </div>
      )}

      {/* Project Cards */}
      {!fetching && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(p => {
            const progress = STATUS_PROGRESS[p.status] ?? 0;
            const inchargeName = resolveName(p.assignedInstallationIncharge, users);
            const mktExecName = resolveName(p.assignedMarketingExecutive, users);
            const engNames = resolveNames(p.assignedEngineers, users);

            return (
              <div key={p._id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:border-blue-200 transition-colors">
                <div className="p-5">
                  {/* Title + status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-extra-darkblue">{p.name}</h3>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                        <MapPin size={11} /> {p.location || p.clientName}
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLE[p.status] || "bg-gray-50 text-gray-500"}`}>
                      {formatStatus(p.status)}
                    </span>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 col-span-2">
                      <Briefcase size={11} className="text-blue-500 shrink-0" />
                      <span className="font-medium truncate">{p.clientName}</span>
                      {p.clientContact && (
                        <span className="text-gray-400 flex items-center gap-1 ml-1">
                          <Phone size={10} /> {p.clientContact}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <User size={11} className="text-blue-500 shrink-0" />
                      <span className="truncate">{inchargeName || "No Incharge"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar size={11} className="text-blue-500 shrink-0" />
                      <span>{formatDate(p.startDate)}</span>
                    </div>
                    {mktExecName && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 col-span-2">
                        <Briefcase size={11} className="text-blue-500 shrink-0" />
                        <span className="truncate">Mktg: {mktExecName}</span>
                      </div>
                    )}
                    {engNames && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 col-span-2">
                        <Users size={11} className="text-blue-500 shrink-0" />
                        <span className="truncate">Engineers: {engNames}</span>
                      </div>
                    )}
                    {p.endDate && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar size={11} className="text-red-400 shrink-0" />
                        <span>Due: {formatDate(p.endDate)}</span>
                      </div>
                    )}
                  </div>

                  {/* Description preview */}
                  {p.description && (
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                      <FileText size={10} className="inline mr-1 text-gray-300" />
                      {p.description}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-gray-400">Progress</span>
                      <span className="font-bold text-blue-600">{progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                          background: progress === 100 ? "#16a34a" : "#1C4D8D",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card footer */}
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => router.push(`/admin/project/${p._id}`)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:underline"
                  >
                    <Eye size={12} /> View Details
                  </button>
                  <button
                    onClick={() => openEdit(p)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    <Edit2 size={12} /> Edit Project
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}