"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Plus, X, Loader2, CheckCircle2, Clock, AlertCircle,
  Trash2, Pencil, ChevronDown, CircleDot, CalendarDays,
  ListTodo, User2, FolderKanban, Filter, RefreshCw
} from "lucide-react";
import axiosInstance from "../../lib/axios";

// ── API Helper ─────────────────────────────────────────────────────────────────
const apiFetch = async (path, { method = "GET", body } = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const res = await axiosInstance({
    method, url: path,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    ...(body ? { data: body } : {}),
  });
  return res.data;
};

const safeArray = (d, key) =>
  Array.isArray(d) ? d : d?.[key] || d?.data || [];

// ── Constants ──────────────────────────────────────────────────────────────────
const STATUS_META = {
  pending:     { label: "Pending",     color: "bg-amber-50 text-amber-600",  icon: Clock,         dot: "bg-amber-400" },
  "in-progress":{ label: "In Progress",color: "bg-blue-50 text-blue-600",   icon: CircleDot,     dot: "bg-blue-500"  },
  completed:   { label: "Completed",   color: "bg-emerald-50 text-emerald-600", icon: CheckCircle2, dot: "bg-emerald-500" },
  cancelled:   { label: "Cancelled",   color: "bg-gray-100 text-gray-400",   icon: X,             dot: "bg-gray-300"  },
};

const PRIORITY_META = {
  low:      { label: "Low",      bg: "bg-gray-100",   text: "text-gray-500"   },
  medium:   { label: "Medium",   bg: "bg-blue-50",    text: "text-blue-600"   },
  high:     { label: "High",     bg: "bg-amber-50",   text: "text-amber-600"  },
  critical: { label: "Critical", bg: "bg-red-50",     text: "text-red-500"    },
};

const TYPE_META = {
  task:      "Task",
  approval:  "Approval",
  "follow-up": "Follow-up",
  review:    "Review",
};

const EMPTY_FORM = {
  title: "", description: "", type: "task", priority: "medium",
  status: "pending", assignedTo: "", project: "", dueDate: "",
};

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ msg, isError }) {
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-xl ${isError ? "bg-red-500" : "bg-extra-darkblue"}`}>
      {isError ? <AlertCircle size={15} /> : <CheckCircle2 size={15} className="text-emerald-400" />}
      {msg}
    </div>
  );
}

// ── Modal Wrapper ──────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="text-sm font-bold text-extra-darkblue">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ── Task Form ──────────────────────────────────────────────────────────────────
function TaskForm({ initial = EMPTY_FORM, onSubmit, loading, submitLabel, users, projects }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      {/* Title */}
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Title *</label>
        <input required value={form.title} onChange={e => set("title", e.target.value)}
          placeholder="Brief task title"
          className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-extra-blue focus:ring-2 focus:ring-blue-50 transition-all text-extra-darkblue" />
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Description</label>
        <textarea rows={3} value={form.description} onChange={e => set("description", e.target.value)}
          placeholder="Detailed instructions for this task…"
          className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-extra-blue focus:ring-2 focus:ring-blue-50 transition-all resize-none text-extra-darkblue" />
      </div>

      {/* Type + Priority */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Type</label>
          <select value={form.type} onChange={e => set("type", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-extra-blue bg-white text-extra-darkblue">
            {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Priority</label>
          <select value={form.priority} onChange={e => set("priority", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-extra-blue bg-white text-extra-darkblue">
            {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      {/* Assign To + Project */}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block flex items-center gap-1">
            <User2 size={11} /> Assign To
          </label>
          <select value={form.assignedTo} onChange={e => set("assignedTo", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-extra-blue bg-white text-extra-darkblue">
            <option value="">— Unassigned —</option>
            {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
          </select>
          <p className="text-xs text-gray-400 mt-1">Source: <code className="bg-gray-50 px-1 rounded">GET /admin/users</code></p>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block flex items-center gap-1">
            <FolderKanban size={11} /> Related Project
          </label>
          <select value={form.project} onChange={e => set("project", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-extra-blue bg-white text-extra-darkblue">
            <option value="">— No Project —</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <p className="text-xs text-gray-400 mt-1">Source: <code className="bg-gray-50 px-1 rounded">GET /projects</code></p>
        </div>
      </div>

      {/* Status + Due Date */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Status</label>
          <select value={form.status} onChange={e => set("status", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-extra-blue bg-white text-extra-darkblue">
            {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block flex items-center gap-1">
            <CalendarDays size={11} /> Due Date
          </label>
          <input type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-extra-blue text-extra-darkblue" />
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="w-full bg-extra-darkblue hover:bg-extra-blue text-white text-sm font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60 mt-2">
        {loading && <Loader2 size={14} className="animate-spin" />}
        {submitLabel}
      </button>
    </form>
  );
}

// ── Task Card ──────────────────────────────────────────────────────────────────
function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const SM = STATUS_META[task.status] || STATUS_META.pending;
  const PM = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const StatusIcon = SM.icon;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 space-y-3 hover:shadow-md transition-shadow ${isOverdue ? "border-red-200" : "border-gray-100"}`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PM.bg} ${PM.text}`}>{PM.label}</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full capitalize">{task.type}</span>
            {isOverdue && <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Overdue</span>}
          </div>
          <p className="text-sm font-bold text-extra-darkblue leading-snug">{task.title}</p>
          {task.description && (
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-2">{task.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onEdit(task)} className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-300 hover:text-amber-500 transition-colors">
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(task)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 flex-wrap text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <User2 size={11} />
          <span>{task.assignedTo?.name || "Unassigned"}</span>
        </div>
        {task.project?.name && (
          <div className="flex items-center gap-1">
            <FolderKanban size={11} />
            <span className="truncate max-w-28">{task.project.name}</span>
          </div>
        )}
        {task.dueDate && (
          <div className={`flex items-center gap-1 ${isOverdue ? "text-red-400" : ""}`}>
            <CalendarDays size={11} />
            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Status selector */}
      <div className="pt-2 border-t border-gray-50 flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${SM.color}`}>
          <StatusIcon size={11} /> {SM.label}
        </span>
        <select
          value={task.status}
          onChange={e => onStatusChange(task._id, e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-extra-blue bg-white text-extra-darkblue">
          {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
    </div>
  );
}

// ── Main TaskPanel ─────────────────────────────────────────────────────────────
export default function TaskPanel() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteTask, setDeleteTask] = useState(null);

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 2800);
  };

  const safeArray = (d, key) => Array.isArray(d) ? d : d?.[key] || d?.data || [];

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [tRes, uRes, pRes] = await Promise.all([
        apiFetch("/pending/list"),
        apiFetch("/admin/users"),
        apiFetch("/projects"),
      ]);
      setTasks(safeArray(tRes, "data"));
      setUsers(safeArray(uRes, "users"));
      setProjects(safeArray(pRes, "projects"));
    } catch (err) {
      console.error("TaskPanel load error:", err);
      showToast("Failed to load tasks", true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── CRUD ────────────────────────────────────────────────────────────────────
  const handleCreate = async (form) => {
    try {
      setActionLoading(true);
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ""));
      await apiFetch("/pending/create", { method: "POST", body: payload });
      setShowCreate(false);
      showToast("Task created successfully");
      await loadData();
    } catch (err) {
      showToast(err.message || "Failed to create task", true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (form) => {
    try {
      setActionLoading(true);
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ""));
      await apiFetch(`/pending/update/${editTask._id}`, { method: "PATCH", body: payload });
      setEditTask(null);
      showToast("Task updated successfully");
      await loadData();
    } catch (err) {
      showToast(err.message || "Failed to update task", true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await apiFetch(`/pending/update/${id}`, { method: "PATCH", body: { status: newStatus } });
      setTasks(prev => prev.map(t => t._id === id ? { ...t, status: newStatus } : t));
    } catch (err) {
      showToast("Failed to update status", true);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await apiFetch(`/pending/delete/${deleteTask._id}`, { method: "DELETE" });
      setDeleteTask(null);
      showToast("Task deleted");
      await loadData();
    } catch (err) {
      showToast("Failed to delete task", true);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Derived Data ─────────────────────────────────────────────────────────────
  const filtered = tasks.filter(t => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    return true;
  });

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === "pending").length,
    inProgress: tasks.filter(t => t.status === "in-progress").length,
    completed: tasks.filter(t => t.status === "completed").length,
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} />}

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-extra-darkblue">Task Panel</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Director-assigned tasks — Source: <code className="bg-gray-100 px-1 rounded text-xs">GET /pending/list</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-extra-darkblue hover:bg-extra-blue text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors">
            <Plus size={15} /> Assign Task
          </button>
        </div>
      </div>

      {/* ── KPI Summary ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Tasks", value: stats.total, color: "bg-gray-100 text-gray-600" },
          { label: "Pending", value: stats.pending, color: "bg-amber-50 text-amber-600" },
          { label: "In Progress", value: stats.inProgress, color: "bg-blue-50 text-blue-600" },
          { label: "Completed", value: stats.completed, color: "bg-emerald-50 text-emerald-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <ListTodo size={18} className={s.color.split(" ")[1]} />
            <div>
              <p className="text-xl font-bold text-extra-darkblue">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
          <Filter size={12} /> Filter:
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "in-progress", "completed", "cancelled"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStatus === s ? "bg-extra-darkblue text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-extra-blue hover:text-extra-blue"}`}>
              {s === "all" ? "All Statuses" : STATUS_META[s]?.label || s}
            </button>
          ))}
        </div>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-500 outline-none focus:border-extra-blue bg-white ml-auto">
          <option value="all">All Priorities</option>
          {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* ── Task Grid ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading tasks…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <ListTodo size={36} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-medium">No tasks found</p>
          <p className="text-xs text-gray-300 mt-1">
            {tasks.length === 0 ? "Assign your first task using the button above." : "Try adjusting filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(task => (
            <TaskCard key={task._id} task={task}
              onEdit={setEditTask} onDelete={setDeleteTask} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}

      {/* ── Data Source Note ── */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <p className="text-xs text-gray-400">
          <strong className="text-gray-600">Data sources:</strong> Tasks from{" "}
          <code className="bg-white px-1 rounded">GET /pending/list</code> · Users from{" "}
          <code className="bg-white px-1 rounded">GET /admin/users</code> · Projects from{" "}
          <code className="bg-white px-1 rounded">GET /projects</code> ·
          Created via <code className="bg-white px-1 rounded">POST /pending/create</code> ·
          Updated via <code className="bg-white px-1 rounded">PATCH /pending/update/:id</code>
        </p>
      </div>

      {/* ── Modals ── */}
      {showCreate && (
        <Modal title="Assign New Task" onClose={() => setShowCreate(false)}>
          <TaskForm onSubmit={handleCreate} loading={actionLoading} submitLabel="Create Task"
            users={users} projects={projects} />
        </Modal>
      )}
      {editTask && (
        <Modal title="Edit Task" onClose={() => setEditTask(null)}>
          <TaskForm
            initial={{
              title: editTask.title || "",
              description: editTask.description || "",
              type: editTask.type || "task",
              priority: editTask.priority || "medium",
              status: editTask.status || "pending",
              assignedTo: editTask.assignedTo?._id || "",
              project: editTask.project?._id || "",
              dueDate: editTask.dueDate ? editTask.dueDate.split("T")[0] : "",
            }}
            onSubmit={handleUpdate} loading={actionLoading} submitLabel="Save Changes"
            users={users} projects={projects} />
        </Modal>
      )}
      {deleteTask && (
        <Modal title="Delete Task" onClose={() => setDeleteTask(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <strong className="text-extra-darkblue">"{deleteTask.title}"</strong>?
              This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTask(null)}
                className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={actionLoading}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {actionLoading && <Loader2 size={13} className="animate-spin" />}
                Delete Task
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
