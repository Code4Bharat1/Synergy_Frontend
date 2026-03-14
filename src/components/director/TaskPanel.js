"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Plus, X, Loader2, CheckCircle2, Clock, AlertCircle,
  Trash2, Pencil, CircleDot, CalendarDays,
  User2, FolderKanban, RefreshCw, Eye, ChevronDown, ChevronRight
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
  pending:      { label: "Pending",     color: "bg-amber-50 text-amber-600",       icon: Clock,        dot: "bg-amber-400" },
  "in-progress":{ label: "In Progress", color: "bg-blue-50 text-blue-600",         icon: CircleDot,    dot: "bg-blue-500"  },
  completed:    { label: "Completed",   color: "bg-emerald-50 text-emerald-600",   icon: CheckCircle2, dot: "bg-emerald-500" },
  cancelled:    { label: "Cancelled",   color: "bg-gray-100 text-gray-400",        icon: X,            dot: "bg-gray-300"  },
};

const PRIORITY_META = {
  low:      { label: "Low",      bg: "bg-gray-100",  text: "text-gray-500",   border: "border-gray-200"  },
  medium:   { label: "Medium",   bg: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-100"  },
  high:     { label: "High",     bg: "bg-amber-50",  text: "text-amber-600",  border: "border-amber-100" },
  critical: { label: "Critical", bg: "bg-red-50",    text: "text-red-500",    border: "border-red-100"   },
};

const TYPE_META = {
  task: "Task", approval: "Approval", "follow-up": "Follow-up", review: "Review",
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

// ── Task Detail Modal ──────────────────────────────────────────────────────────
function TaskDetailModal({ task, onClose }) {
  const SM = STATUS_META[task.status] || STATUS_META.pending;
  const PM = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const StatusIcon = SM.icon;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";

  const Row = ({ label, children }) => (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold text-gray-400 w-24 shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-extra-darkblue flex-1">{children}</span>
    </div>
  );

  return (
    <Modal title="Task Details" onClose={onClose}>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PM.bg} ${PM.text}`}>{PM.label}</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full capitalize">{task.type}</span>
            {isOverdue && <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Overdue</span>}
          </div>
          <p className="text-base font-bold text-extra-darkblue leading-snug">{task.title}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${SM.color}`}>
          <StatusIcon size={12} /> {SM.label}
        </span>
        <div className="bg-gray-50 rounded-xl px-4 py-1 mt-2">
          <Row label="Description">
            {task.description
              ? <span className="whitespace-pre-wrap leading-relaxed">{task.description}</span>
              : <span className="text-gray-300 italic">No description</span>}
          </Row>
          <Row label="Assigned To">
            <span className="flex items-center gap-1.5">
              <User2 size={11} className="text-gray-400" />
              {task.assignedTo?.name || <span className="text-gray-300 italic">Unassigned</span>}
              {task.assignedTo?.role && <span className="text-gray-400">({task.assignedTo.role})</span>}
            </span>
          </Row>
          <Row label="Project">
            <span className="flex items-center gap-1.5">
              <FolderKanban size={11} className="text-gray-400" />
              {task.project?.name || <span className="text-gray-300 italic">No project</span>}
            </span>
          </Row>
          <Row label="Due Date">
            <span className={`flex items-center gap-1.5 ${isOverdue ? "text-red-500 font-semibold" : ""}`}>
              <CalendarDays size={11} className="text-gray-400" />
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
                : <span className="text-gray-300 italic">No due date</span>}
              {isOverdue && " — Overdue"}
            </span>
          </Row>
          <Row label="Priority">{PM.label}</Row>
          <Row label="Type"><span className="capitalize">{TYPE_META[task.type] || task.type}</span></Row>
          {task.createdAt && (
            <Row label="Created">
              {new Date(task.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
            </Row>
          )}
        </div>
        <button onClick={onClose}
          className="w-full border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
          Close
        </button>
      </div>
    </Modal>
  );
}

// ── Task Form ──────────────────────────────────────────────────────────────────
function TaskForm({ initial = EMPTY_FORM, onSubmit, loading, submitLabel, users, projects }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Title *</label>
        <input required value={form.title} onChange={e => set("title", e.target.value)}
          placeholder="Brief task title"
          className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-extra-blue focus:ring-2 focus:ring-blue-50 transition-all text-extra-darkblue" />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Description</label>
        <textarea rows={3} value={form.description} onChange={e => set("description", e.target.value)}
          placeholder="Detailed instructions…"
          className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-extra-blue focus:ring-2 focus:ring-blue-50 transition-all resize-none text-extra-darkblue" />
      </div>
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
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1.5 block flex items-center gap-1">
          <FolderKanban size={11} /> Project *
        </label>
        <select required value={form.project} onChange={e => set("project", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-extra-blue bg-white text-extra-darkblue">
          <option value="">— Select Project —</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1.5 block flex items-center gap-1">
          <User2 size={11} /> Assign To *
        </label>
        <select required value={form.assignedTo} onChange={e => set("assignedTo", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-extra-blue bg-white text-extra-darkblue">
          <option value="">— Select Worker —</option>
          {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
        </select>
      </div>
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

// ── Checklist Row (single task) ────────────────────────────────────────────────
function ChecklistRow({ task, onStatusChange, onEdit, onDelete, onView }) {
  const PM = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const done = task.status === "completed";
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !done;

  const toggle = () => onStatusChange(task._id, done ? "pending" : "completed");

  return (
    <div className={`flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 group ${done ? "opacity-60" : ""}`}>
      {/* Checkbox */}
      <button
        onClick={toggle}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all
          ${done
            ? "bg-emerald-500 border-emerald-500"
            : "border-gray-300 hover:border-extra-blue bg-white"}`}
      >
        {done && <CheckCircle2 size={11} className="text-white" strokeWidth={3} />}
      </button>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-snug ${done ? "line-through text-gray-300" : "text-extra-darkblue"}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <User2 size={10} />
            {task.assignedTo?.name || "Unassigned"}
          </span>
          {task.raisedBy?.name && (
            <span className="text-xs text-extra-blue flex items-center gap-1 font-medium">
              · raised by {task.raisedBy.name}
            </span>
          )}
          {task.dueDate && (
            <span className={`text-xs flex items-center gap-1 ${isOverdue ? "text-red-400 font-semibold" : "text-gray-400"}`}>
              <CalendarDays size={10} />
              {new Date(task.dueDate).toLocaleDateString()}
              {isOverdue && " · Overdue"}
            </span>
          )}
        </div>
      </div>

      {/* Priority badge */}
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 ${PM.bg} ${PM.text} ${PM.border}`}>
        {PM.label}
      </span>

      {/* Actions — visible on hover */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => onView(task)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-300 hover:text-blue-500 transition-colors">
          <Eye size={12} />
        </button>
        <button onClick={() => onEdit(task)} className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-300 hover:text-amber-500 transition-colors">
          <Pencil size={12} />
        </button>
        <button onClick={() => onDelete(task)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// ── Project Checklist Block ────────────────────────────────────────────────────
function ProjectChecklist({ projectName, tasks, onStatusChange, onEdit, onDelete, onView, onAddTask }) {
  const [collapsed, setCollapsed] = useState(false);
  const done = tasks.filter(t => t.status === "completed").length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Project header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-extra-darkblue/10 flex items-center justify-center shrink-0">
            <FolderKanban size={15} className="text-extra-darkblue" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-extra-darkblue truncate">{projectName}</p>
            <p className="text-xs text-gray-400">{done}/{total} tasks done</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Mini progress bar */}
          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-extra-darkblue rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-bold text-gray-400 w-8 text-right">{pct}%</span>
          {collapsed
            ? <ChevronRight size={14} className="text-gray-300" />
            : <ChevronDown size={14} className="text-gray-300" />}
        </div>
      </div>

      {/* Task checklist */}
      {!collapsed && (
        <div className="px-5 pb-2 border-t border-gray-50">
          {tasks.length === 0 ? (
            <p className="text-xs text-gray-300 italic py-4 text-center">No tasks yet for this project.</p>
          ) : (
            tasks.map(task => (
              <ChecklistRow
                key={task._id}
                task={task}
                onStatusChange={onStatusChange}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
              />
            ))
          )}

          {/* Add task to this project */}
          <button
            onClick={() => onAddTask()}
            className="mt-2 mb-3 flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-extra-blue transition-colors"
          >
            <Plus size={13} /> Add task to this project
          </button>
        </div>
      )}
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

  const [showCreate, setShowCreate] = useState(false);
  const [defaultProjectId, setDefaultProjectId] = useState("");
  const [editTask, setEditTask] = useState(null);
  const [deleteTask, setDeleteTask] = useState(null);
  const [viewTask, setViewTask] = useState(null);

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 2800);
  };

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

  // ── CRUD ──────────────────────────────────────────────────────────────────────
  const handleCreate = async (form) => {
    try {
      setActionLoading(true);
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ""));
      await apiFetch("/pending/create", { method: "POST", body: payload });
      setShowCreate(false);
      setDefaultProjectId("");
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

  // ── Group tasks by project ─────────────────────────────────────────────────
  // Build a map: projectId → { name, tasks[] }
  // Use projects list to preserve order; unassigned tasks go to a separate bucket.
  const projectMap = {};

  // Seed from projects list (preserves order)
  projects.forEach(p => {
    projectMap[p._id] = { name: p.name, tasks: [] };
  });

  // Distribute tasks
  tasks.forEach(task => {
    const pid = task.project?._id;
    if (pid && projectMap[pid]) {
      projectMap[pid].tasks.push(task);
    } else {
      if (!projectMap["__none__"]) {
        projectMap["__none__"] = { name: "No Project", tasks: [] };
      }
      projectMap["__none__"].tasks.push(task);
    }
  });

  // Only show projects that have tasks
  const activeProjects = Object.entries(projectMap).filter(([, v]) => v.tasks.length > 0);

  // KPI
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === "completed").length;
  const pendingTasks = tasks.filter(t => t.status === "pending").length;
  const inProgressTasks = tasks.filter(t => t.status === "in-progress").length;

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} />}

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-extra-darkblue">Task Panel</h2>
          <p className="text-sm text-gray-400 mt-0.5">Tasks grouped by project — workers see their assigned checklist</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData}
            className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => { setDefaultProjectId(""); setShowCreate(true); }}
            className="flex items-center gap-1.5 bg-extra-darkblue hover:bg-extra-blue text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors">
            <Plus size={15} /> Assign Task
          </button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Tasks",  value: totalTasks,      color: "text-gray-600",       bg: "bg-gray-100"    },
          { label: "Pending",      value: pendingTasks,    color: "text-amber-600",      bg: "bg-amber-50"    },
          { label: "In Progress",  value: inProgressTasks, color: "text-blue-600",       bg: "bg-blue-50"     },
          { label: "Completed",    value: doneTasks,       color: "text-emerald-600",    bg: "bg-emerald-50"  },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border border-gray-100 shadow-sm p-4 ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Project Checklists ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading tasks…</span>
        </div>
      ) : activeProjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <FolderKanban size={36} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-medium">No tasks assigned yet</p>
          <p className="text-xs text-gray-300 mt-1">Use "Assign Task" to create the first task.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeProjects.map(([projectId, { name, tasks: projectTasks }]) => (
            <ProjectChecklist
              key={projectId}
              projectName={name}
              tasks={projectTasks}
              onStatusChange={handleStatusChange}
              onEdit={setEditTask}
              onDelete={setDeleteTask}
              onView={setViewTask}
              onAddTask={() => {
                setDefaultProjectId(projectId === "__none__" ? "" : projectId);
                setShowCreate(true);
              }}
            />
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {showCreate && (
        <Modal title="Assign New Task" onClose={() => { setShowCreate(false); setDefaultProjectId(""); }}>
          <TaskForm
            initial={{ ...EMPTY_FORM, project: defaultProjectId }}
            onSubmit={handleCreate}
            loading={actionLoading}
            submitLabel="Create Task"
            users={users}
            projects={projects}
          />
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
            onSubmit={handleUpdate}
            loading={actionLoading}
            submitLabel="Save Changes"
            users={users}
            projects={projects}
          />
        </Modal>
      )}

      {deleteTask && (
        <Modal title="Delete Task" onClose={() => setDeleteTask(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <strong className="text-extra-darkblue">"{deleteTask.title}"</strong>? This cannot be undone.
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

      {viewTask && (
        <TaskDetailModal task={viewTask} onClose={() => setViewTask(null)} />
      )}
    </div>
  );
}