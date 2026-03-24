"use client";
import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  Clock,
  CircleDot,
  X,
  Loader2,
  RefreshCw,
  CalendarDays,
  User2,
  FolderKanban,
  AlertCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  ListTodo,
  Tag,
  FileText,
  AlarmClock,
  CheckSquare,
  LayoutGrid,
  List,
} from "lucide-react";
import axiosInstance from "@/lib/axios";

// ── API ───────────────────────────────────────────────────────────────────────
const apiFetch = async (path) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const res = await axiosInstance({
    method: "GET",
    url: path,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
};

const apiPatch = async (path, body) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const res = await axiosInstance({
    method: "PATCH",
    url: path,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    data: body,
  });
  return res.data;
};

const getCurrentUser = () => {
  if (typeof window === "undefined")
    return { id: null, name: "User", role: "" };
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return {
      id: u._id || u.id || null,
      name: u.name || u.fullName || "User",
      role: u.role || "",
    };
  } catch {
    return { id: null, name: "User", role: "" };
  }
};

// ── Meta ──────────────────────────────────────────────────────────────────────
const STATUS_META = {
  pending: {
    label: "Pending",
    icon: Clock,
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200",
    dot: "bg-amber-400",
    ring: "ring-amber-200",
  },
  "in-progress": {
    label: "In Progress",
    icon: CircleDot,
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
    dot: "bg-blue-500",
    ring: "ring-blue-200",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    ring: "ring-emerald-200",
  },
  cancelled: {
    label: "Cancelled",
    icon: X,
    bg: "bg-gray-100",
    text: "text-gray-400",
    border: "border-gray-200",
    dot: "bg-gray-300",
    ring: "ring-gray-200",
  },
};

const PRIORITY_META = {
  low: {
    label: "Low",
    bg: "bg-gray-100",
    text: "text-gray-500",
    border: "border-gray-200",
  },
  medium: {
    label: "Medium",
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
  },
  high: {
    label: "High",
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200",
  },
  critical: {
    label: "Critical",
    bg: "bg-red-50",
    text: "text-red-500",
    border: "border-red-200",
  },
};

const TYPE_META = {
  task: { label: "Task", bg: "bg-indigo-50", text: "text-indigo-600" },
  approval: { label: "Approval", bg: "bg-purple-50", text: "text-purple-600" },
  "follow-up": { label: "Follow-up", bg: "bg-sky-50", text: "text-sky-600" },
  review: { label: "Review", bg: "bg-pink-50", text: "text-pink-600" },
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const isOverdue = (task) =>
  task.dueDate &&
  new Date(task.dueDate) < new Date() &&
  task.status !== "completed";

// ── Task Detail Modal ─────────────────────────────────────────────────────────
function TaskDetailModal({ task, onClose, onToggle, toggling }) {
  const SM = STATUS_META[task.status] || STATUS_META.pending;
  const PM = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const TM = TYPE_META[task.type] || TYPE_META.task;
  const StatusIcon = SM.icon;
  const overdue = isOverdue(task);
  const done = task.status === "completed";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10 animate-[slideUp_0.22s_ease_both]"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "slideUp 0.22s ease both" }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-3 z-10">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-2">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${PM.bg} ${PM.text} ${PM.border}`}
              >
                {PM.label}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TM.bg} ${TM.text}`}
              >
                {TM.label}
              </span>
              {overdue && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200 flex items-center gap-1">
                  <AlarmClock size={10} /> Overdue
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-[#0F2854] leading-snug">
              {task.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Status pill */}
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${SM.bg} ${SM.text} ${SM.border} border`}
          >
            <StatusIcon size={12} /> {SM.label}
          </span>

          {/* Description */}
          {task.description && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Description
              </p>
              <p className="text-sm text-[#0F2854] leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-xl px-4 py-3">
                {task.description}
              </p>
            </div>
          )}

          {/* Detail grid */}
          <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
            {[
              {
                label: "Assigned By",
                icon: <User2 size={12} className="text-[#4988C4]" />,
                value: task.raisedBy?.name ? (
                  <span className="font-semibold text-[#4988C4]">
                    {task.raisedBy.name}
                  </span>
                ) : (
                  <span className="text-gray-300 italic">—</span>
                ),
              },
              {
                label: "Assigned To",
                icon: <User2 size={12} className="text-gray-400" />,
                value: task.assignedTo?.name || (
                  <span className="text-gray-300 italic">Unassigned</span>
                ),
              },
              {
                label: "Project",
                icon: <FolderKanban size={12} className="text-gray-400" />,
                value: task.project?.name || (
                  <span className="text-gray-300 italic">No project</span>
                ),
              },
              {
                label: "Due Date",
                icon: (
                  <CalendarDays
                    size={12}
                    className={overdue ? "text-red-400" : "text-gray-400"}
                  />
                ),
                value: task.dueDate ? (
                  <span className={overdue ? "text-red-500 font-semibold" : ""}>
                    {fmtDate(task.dueDate)}
                    {overdue && " · Overdue"}
                  </span>
                ) : (
                  <span className="text-gray-300 italic">No due date</span>
                ),
              },
              {
                label: "Priority",
                icon: <Tag size={12} className="text-gray-400" />,
                value: (
                  <span className={`font-semibold ${PM.text}`}>{PM.label}</span>
                ),
              },
              {
                label: "Type",
                icon: <FileText size={12} className="text-gray-400" />,
                value: (
                  <span className={`font-semibold ${TM.text}`}>{TM.label}</span>
                ),
              },
              {
                label: "Created",
                icon: <Clock size={12} className="text-gray-400" />,
                value: fmtDateTime(task.createdAt),
              },
              task.completedAt && {
                label: "Completed At",
                icon: <CheckCircle2 size={12} className="text-emerald-500" />,
                value: (
                  <span className="text-emerald-600 font-semibold">
                    {fmtDateTime(task.completedAt)}
                  </span>
                ),
              },
            ]
              .filter(Boolean)
              ?.map((row) => (
                <div
                  key={row.label}
                  className="flex items-start gap-3 px-4 py-2.5"
                >
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 w-28 shrink-0 pt-0.5">
                    {row.icon} {row.label}
                  </span>
                  <span className="text-xs text-[#0F2854] flex-1">
                    {row.value}
                  </span>
                </div>
              ))}
          </div>

          {/* Toggle button */}
          <button
            onClick={() => onToggle(task)}
            disabled={toggling}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60
              ${
                done
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  : "bg-[#0F2854] text-white hover:bg-[#4988C4]"
              }`}
          >
            {toggling ? (
              <Loader2 size={14} className="animate-spin" />
            ) : done ? (
              <>
                <CircleDot size={14} /> Mark as Pending
              </>
            ) : (
              <>
                <CheckCircle2 size={14} /> Mark as Completed
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Task Card (grid view) ─────────────────────────────────────────────────────
function TaskCard({ task, onView, onToggle, toggling }) {
  const SM = STATUS_META[task.status] || STATUS_META.pending;
  const PM = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const TM = TYPE_META[task.type] || TYPE_META.task;
  const StatusIcon = SM.icon;
  const overdue = isOverdue(task);
  const done = task.status === "completed";

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all group
        ${overdue ? "border-red-200" : "border-gray-100"}
        ${done ? "opacity-70" : ""}`}
    >
      {/* Top accent bar */}
      <div
        className={`h-1 rounded-t-2xl ${done ? "bg-emerald-400" : overdue ? "bg-red-400" : "bg-[#4988C4]"}`}
      />

      <div className="p-5 space-y-3">
        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5">
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full border ${PM.bg} ${PM.text} ${PM.border}`}
          >
            {PM.label}
          </span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TM.bg} ${TM.text}`}
          >
            {TM.label}
          </span>
          {overdue && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200 flex items-center gap-1">
              <AlarmClock size={9} /> Overdue
            </span>
          )}
        </div>

        {/* Title */}
        <p
          className={`text-sm font-bold leading-snug ${done ? "line-through text-gray-400" : "text-[#0F2854]"}`}
        >
          {task.title}
        </p>

        {/* Description snippet */}
        {task.description && (
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Meta */}
        <div className="space-y-1.5 pt-1">
          {task.raisedBy?.name && (
            <div className="flex items-center gap-1.5 text-xs">
              <User2 size={11} className="text-[#4988C4] shrink-0" />
              <span className="text-gray-400">Assigned by</span>
              <span className="font-semibold text-[#4988C4]">
                {task.raisedBy.name}
              </span>
            </div>
          )}
          {task.project?.name && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <FolderKanban size={11} className="shrink-0" />
              <span className="truncate">{task.project.name}</span>
            </div>
          )}
          {task.dueDate && (
            <div
              className={`flex items-center gap-1.5 text-xs ${overdue ? "text-red-500 font-semibold" : "text-gray-400"}`}
            >
              <CalendarDays size={11} className="shrink-0" />
              <span>Due {fmtDate(task.dueDate)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50 gap-2">
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${SM.bg} ${SM.text}`}
          >
            <StatusIcon size={10} /> {SM.label}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onView(task)}
              className="p-1.5 rounded-lg text-gray-300 hover:text-[#4988C4] hover:bg-blue-50 transition-colors"
              title="View details"
            >
              <Eye size={13} />
            </button>
            <button
              onClick={() => onToggle(task)}
              disabled={toggling === task._id}
              className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50
                ${
                  done
                    ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    : "bg-[#0F2854] text-white hover:bg-[#4988C4]"
                }`}
            >
              {toggling === task._id ? (
                <Loader2 size={11} className="animate-spin" />
              ) : done ? (
                <>
                  <CircleDot size={11} /> Undo
                </>
              ) : (
                <>
                  <CheckCircle2 size={11} /> Done
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Task Row (list view) ──────────────────────────────────────────────────────
function TaskRow({ task, onView, onToggle, toggling }) {
  const SM = STATUS_META[task.status] || STATUS_META.pending;
  const PM = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const StatusIcon = SM.icon;
  const overdue = isOverdue(task);
  const done = task.status === "completed";

  return (
    <div
      className={`flex items-center gap-4 px-5 py-3.5 bg-white border-b border-gray-50 hover:bg-gray-50/60 transition-colors group
      ${overdue ? "border-l-2 border-l-red-400" : done ? "border-l-2 border-l-emerald-400" : "border-l-2 border-l-transparent"}`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task)}
        disabled={toggling === task._id}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all
          ${done ? "bg-emerald-500 border-emerald-500 shadow-[0_2px_6px_rgba(52,199,89,0.35)]" : "border-gray-300 hover:border-[#4988C4] bg-white"}`}
      >
        {toggling === task._id ? (
          <Loader2 size={10} className="animate-spin text-[#4988C4]" />
        ) : done ? (
          <span className="text-white text-[10px] font-black">✓</span>
        ) : null}
      </button>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-semibold truncate ${done ? "line-through text-gray-400" : "text-[#0F2854]"}`}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {task.raisedBy?.name && (
            <span className="text-xs text-[#4988C4] font-semibold flex items-center gap-1">
              <User2 size={9} /> {task.raisedBy.name}
            </span>
          )}
          {task.project?.name && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <FolderKanban size={9} /> {task.project.name}
            </span>
          )}
          {task.dueDate && (
            <span
              className={`text-xs flex items-center gap-1 ${overdue ? "text-red-500 font-semibold" : "text-gray-400"}`}
            >
              <CalendarDays size={9} />
              {fmtDate(task.dueDate)}
              {overdue && " · Overdue"}
            </span>
          )}
        </div>
      </div>

      {/* Priority */}
      <span
        className={`text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 hidden sm:block ${PM.bg} ${PM.text} ${PM.border}`}
      >
        {PM.label}
      </span>

      {/* Status */}
      <span
        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full shrink-0 hidden md:flex ${SM.bg} ${SM.text}`}
      >
        <StatusIcon size={10} /> {SM.label}
      </span>

      {/* View */}
      <button
        onClick={() => onView(task)}
        className="p-1.5 rounded-lg text-gray-300 hover:text-[#4988C4] hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
      >
        <Eye size={13} />
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null); // task._id being toggled
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewTask, setViewTask] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [user, setUser] = useState({ id: null, name: "User", role: "" });

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const me = getCurrentUser();
      setUser(me);
      const res = await apiFetch("/pending/list");
      const all = Array.isArray(res) ? res : res?.data || [];
      // Filter: only tasks assigned to this user
      const mine = me.id
        ? all.filter((t) => {
            const assignedId = t.assignedTo?._id || t.assignedTo;
            return assignedId === me.id;
          })
        : all;
      setTasks(mine);
    } catch (err) {
      console.error("MyTasksPage load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const toggleTask = async (task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    setToggling(task._id);
    try {
      await apiPatch(`/pending/update/${task._id}`, { status: newStatus });
      setTasks((prev) =>
        prev?.map((t) =>
          t._id === task._id ? { ...t, status: newStatus } : t,
        ),
      );
      // Update modal task too if open
      if (viewTask?._id === task._id)
        setViewTask((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error("Toggle failed:", err);
    } finally {
      setToggling(null);
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    "in-progress": tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    overdue: tasks.filter((t) => isOverdue(t)).length,
  };

  const filtered =
    filterStatus === "overdue"
      ? tasks.filter((t) => isOverdue(t))
      : filterStatus === "all"
        ? tasks
        : tasks.filter(
            (t) => t.status === "overdue" || t.status === filterStatus,
          );

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const pct =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const FILTER_TABS = [
    { key: "all", label: "All", count: counts.all },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "in-progress", label: "In Progress", count: counts["in-progress"] },
    { key: "completed", label: "Completed", count: counts.completed },
    { key: "overdue", label: "Overdue", count: counts.overdue, red: true },
  ];

  const KPI_CARDS = [
    {
      label: "Total Tasks",
      value: counts.all,
      color: "text-[#0F2854]",
      bg: "bg-[#0F2854]/5",
      border: "border-[#0F2854]/10",
    },
    {
      label: "Pending",
      value: counts.pending,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
    {
      label: "In Progress",
      value: counts["in-progress"],
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      label: "Completed",
      value: counts.completed,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
  ];

  return (
    <div className="space-y-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Detail Modal ── */}
      {viewTask && (
        <TaskDetailModal
          task={viewTask}
          onClose={() => setViewTask(null)}
          onToggle={toggleTask}
          toggling={toggling === viewTask._id}
        />
      )}

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold tracking-widest text-[#4988C4] uppercase mb-1">
            {user.role ? user.role.replace(/-/g, " ") : "My"} Panel
          </p>
          <h2
            className="text-2xl font-extrabold text-[#0F2854]"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            My Tasks
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Tasks assigned to you · {user.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors ${viewMode === "grid" ? "bg-[#0F2854] text-white" : "text-gray-400 hover:bg-gray-50"}`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${viewMode === "list" ? "bg-[#0F2854] text-white" : "text-gray-400 hover:bg-gray-50"}`}
            >
              <List size={15} />
            </button>
          </div>
          <button
            onClick={loadTasks}
            className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {KPI_CARDS?.map((k) => (
          <div
            key={k.label}
            className={`rounded-2xl border p-4 ${k.bg} ${k.border}`}
          >
            <p
              className={`text-2xl font-extrabold ${k.color}`}
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {k.value}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* ── Overall progress bar ── */}
      {tasks.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Overall Progress
            </span>
            <span className="text-xs font-extrabold text-[#0F2854]">
              {pct}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background:
                  pct === 100 ? "#34C759" : pct > 60 ? "#4988C4" : "#FF9500",
              }}
            />
          </div>
          {pct === 100 && (
            <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1">
              <CheckCircle2 size={12} /> All tasks completed — great work! 🎉
            </p>
          )}
        </div>
      )}

      {/* ── Overdue warning ── */}
      {counts.overdue > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3 flex-wrap">
          <AlertCircle size={15} className="text-red-500 shrink-0" />
          <span className="text-sm font-semibold text-red-700 flex-1">
            You have <strong>{counts.overdue}</strong> overdue task
            {counts.overdue > 1 ? "s" : ""} — please action them.
          </span>
          <button
            onClick={() => setFilterStatus("overdue")}
            className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded-lg transition-colors"
          >
            View Overdue →
          </button>
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTER_TABS?.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border
              ${
                filterStatus === tab.key
                  ? tab.red
                    ? "bg-red-500 text-white border-red-500"
                    : "bg-[#0F2854] text-white border-[#0F2854]"
                  : "bg-white text-gray-500 border-gray-200 hover:border-[#4988C4] hover:text-[#4988C4]"
              }`}
          >
            {tab.label}
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold
              ${filterStatus === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}
            >
              {tab.count}
            </span>
          </button>
        ))}
        {filterStatus !== "all" && (
          <button
            onClick={() => setFilterStatus("all")}
            className="text-xs text-gray-400 hover:text-gray-600 font-semibold px-2 py-1.5 transition-colors"
          >
            Clear ✕
          </button>
        )}
      </div>

      {/* ── Task List / Grid ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading your tasks…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
          <ListTodo
            size={38}
            className="text-gray-200 mx-auto mb-3"
            strokeWidth={1.5}
          />
          <p className="text-sm font-semibold text-gray-400">
            {filterStatus === "overdue"
              ? "🎉 No overdue tasks — you're on track!"
              : filterStatus !== "all"
                ? `No ${filterStatus} tasks.`
                : "No tasks assigned to you yet."}
          </p>
          {filterStatus !== "all" && (
            <button
              onClick={() => setFilterStatus("all")}
              className="mt-3 text-xs font-bold text-[#4988C4] hover:underline"
            >
              View all tasks
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered?.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onView={setViewTask}
              onToggle={toggleTask}
              toggling={toggling}
            />
          ))}
        </div>
      ) : (
        /* List view */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* List header */}
          <div className="flex items-center gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
            <div className="w-5 shrink-0" />
            <span className="flex-1 text-xs font-bold text-gray-400 uppercase tracking-widest">
              Task
            </span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:block w-20 text-center">
              Priority
            </span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden md:block w-28 text-center">
              Status
            </span>
            <div className="w-8 shrink-0" />
          </div>
          {filtered?.map((task) => (
            <TaskRow
              key={task._id}
              task={task}
              onView={setViewTask}
              onToggle={toggleTask}
              toggling={toggling}
            />
          ))}
        </div>
      )}

      {/* ── Footer note ── */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
        <p className="text-xs text-gray-400">
          <strong className="text-gray-500">Data source:</strong> Tasks from{" "}
          <code className="bg-white px-1 rounded text-xs">
            GET /pending/list
          </code>{" "}
          filtered to your user ID · Updates via{" "}
          <code className="bg-white px-1 rounded text-xs">
            PATCH /pending/update/:id
          </code>
        </p>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
