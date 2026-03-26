"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FolderOpen,
  AlertTriangle,
  CheckSquare,
  ChevronRight,
  MapPin,
  Loader2,
  ArrowLeft,
  User,
  Calendar,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ClipboardList,
  Edit2,
  X,
  Save,
  Loader,
  ListTodo,
  ChevronDown,
  FileText,
  Eye,
  ExternalLink,
} from "lucide-react";
import axiosInstance from "../../lib/axios";

// ── Inline shared components (replaces shared.js imports) ────────────────────
function StatusPill({ label, color }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-500",
    gray: "bg-gray-100 text-gray-500",
  };
  return (
    <span
      className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${colorMap[color] || colorMap.blue}`}
    >
      {label}
    </span>
  );
}

function SectionHead({ icon, title }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-extra-darkblue flex items-center justify-center shrink-0">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-extra-darkblue">{title}</h3>
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
      style={style}
    >
      {children}
    </div>
  );
}

function PageHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <p className="text-xs font-bold tracking-widest text-blue-500 uppercase mb-1">
          {eyebrow}
        </p>
      )}
      <h1 className="text-2xl font-bold text-extra-darkblue">{title}</h1>
      {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

// ── API Helpers ───────────────────────────────────────────────────────────────
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

const apiPut = async (path, body) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const res = await axiosInstance({
    method: "PUT",
    url: path,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    data: body,
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

const getCurrentEngineerId = () => {
  if (typeof window === "undefined") return null;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user._id || user.id || null;
  } catch {
    return null;
  }
};

const getCurrentEngineerName = () => {
  if (typeof window === "undefined") return "Engineer";
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.name || user.fullName || "Engineer";
  } catch {
    return "Engineer";
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const isProjectDelayed = (project) => {
  if (project.status === "delayed") return true;
  if (project.delayed === true) return true;
  if (project.status === "completed") return false;
  if (project.endDate) return new Date(project.endDate) < new Date();
  return false;
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

// ── Constants ─────────────────────────────────────────────────────────────────
const CHECKS_META = [
  { key: "material", label: "Material Delivered" },
  { key: "foundation", label: "Foundation Completed" },
  { key: "customer", label: "Customer Readiness" },
  { key: "acceptance", label: "Client Acceptance" },
];

const statusColor = {
  active: "blue",
  completed: "green",
  "on-hold": "orange",
  initiated: "blue",
  installation: "blue",
  testing: "blue",
  delayed: "red",
  "in-progress": "blue",
};

const phaseList = [
  "Site Preparation",
  "Wiring & Plumbing",
  "Equipment Setup",
  "Installation",
  "Final Testing",
  "Completed",
];

const phaseHex = {
  "Site Preparation": "#4988C4",
  "Wiring & Plumbing": "#FF9500",
  "Equipment Setup": "#9B59B6",
  Installation: "#0F2854",
  "Final Testing": "#34C759",
  Completed: "#34C759",
};

const ENGINEER_STATUS_OPTIONS = [
  { value: "initiated", label: "Initiated" },
  { value: "in-progress", label: "In Progress" },
  { value: "installation", label: "Installation" },
  { value: "testing", label: "Testing" },
  { value: "completed", label: "Completed" },
  { value: "on-hold", label: "On Hold" },
];

const STATUS_PHASE = {
  initiated: "Site Preparation",
  "in-progress": "Wiring & Plumbing",
  installation: "Installation",
  testing: "Final Testing",
  completed: "Completed",
  "on-hold": "Site Preparation",
};

const STATUS_PROGRESS = {
  initiated: 5,
  "in-progress": 40,
  installation: 65,
  testing: 80,
  completed: 100,
  "on-hold": 30,
};

const PRIORITY_META = {
  low: {
    label: "Low",
    color: "#34C759",
    bg: "rgba(52,199,89,0.1)",
    border: "rgba(52,199,89,0.2)",
  },
  medium: {
    label: "Medium",
    color: "#FF9500",
    bg: "rgba(255,149,0,0.1)",
    border: "rgba(255,149,0,0.2)",
  },
  high: {
    label: "High",
    color: "#FF3B30",
    bg: "rgba(255,59,48,0.1)",
    border: "rgba(255,59,48,0.2)",
  },
  critical: {
    label: "Critical",
    color: "#c0392b",
    bg: "rgba(192,57,43,0.1)",
    border: "rgba(192,57,43,0.2)",
  },
};

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "delayed", label: "Delayed" },
  { key: "completed", label: "Completed" },
  { key: "on-hold", label: "On Hold" },
];

const SORT_OPTIONS = [
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
  { value: "progress-desc", label: "Progress ↑" },
  { value: "progress-asc", label: "Progress ↓" },
  { value: "date-desc", label: "Newest First" },
  { value: "date-asc", label: "Oldest First" },
];

// ── Edit Project Modal ────────────────────────────────────────────────────────
function EditProjectModal({ project, onClose, onSaved }) {
  const [status, setStatus] = useState(project.status || "initiated");
  const [notes, setNotes] = useState(project.engineerNotes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const previewPhase = STATUS_PHASE[status] || "Site Preparation";
  const previewProgress = STATUS_PROGRESS[status] ?? 0;
  const progressBg =
    previewProgress > 80
      ? "#34C759"
      : previewProgress > 50
        ? "#4988C4"
        : "#FF9500";

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await apiPut(`/projects/${project._id}`, {
        status,
        phase: STATUS_PHASE[status],
        progress: STATUS_PROGRESS[status] ?? 0,
        ...(notes.trim() && { engineerNotes: notes.trim() }),
      });
      onSaved(updated.project || updated);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,40,84,0.45)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
        style={{ animation: "slideUp 0.25s ease both" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <p className="text-xs font-bold tracking-widest text-blue-500 uppercase mb-1">
              Update Project
            </p>
            <h3 className="text-lg font-bold text-extra-darkblue">
              {project.projectId && (
                <span className="text-blue-500 mr-2 pr-2 border-r border-blue-200">
                  {project.projectId}
                </span>
              )}
              {project.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-100 border border-gray-200 rounded-lg p-2 text-blue-500 hover:bg-gray-200 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <span className="text-xs text-blue-600">
              ℹ️ Set the <strong>status</strong> — phase and progress update
              automatically.
            </span>
          </div>

          {/* Status select */}
          <div>
            <label className="block text-xs font-bold text-gray-400 tracking-widest uppercase mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-blue-100 bg-blue-50/40 text-extra-darkblue text-sm font-medium focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
            >
              {ENGINEER_STATUS_OPTIONS?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Auto-set preview */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-3">
              Will be set automatically
            </p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-blue-500 font-semibold">Phase</span>
              <span className="text-xs font-bold text-extra-darkblue">
                {previewPhase}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-blue-500 font-semibold">
                Progress
              </span>
              <span className="text-xs font-bold text-extra-darkblue">
                {previewProgress}%
              </span>
            </div>
            <div className="bg-gray-200 rounded-full h-1.5 mt-2">
              <div
                className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${previewProgress}%`, background: progressBg }}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-400 tracking-widest uppercase mb-2">
              Notes{" "}
              <span className="font-normal normal-case tracking-normal">
                (optional)
              </span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any site updates, blockers, or observations…"
              className="w-full px-3 py-2.5 rounded-xl border border-blue-100 bg-blue-50/40 text-extra-darkblue text-sm resize-none focus:outline-none focus:border-blue-400 focus:bg-white transition-colors leading-relaxed"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs font-semibold text-center">
              ⚠ {error}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed"
            style={{ background: saving ? "#94aac4" : "#0F2854" }}
          >
            {saving ? (
              <>
                <Loader size={15} className="animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save size={15} /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>
      <style>{`@keyframes slideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}

// ── Task Checklist Section (inside ProjectDetail) ─────────────────────────────
function ProjectTaskChecklist({ projectId, engineerId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);

      const res = await apiFetch("/pending/list");
      const all = Array.isArray(res) ? res : res?.data || [];

      // ✅ ONLY tasks assigned to current engineer
      const mine = all.filter((t) => {
        const assignedId = t.assignedTo?._id || t.assignedTo;
        return assignedId === engineerId;
      });

      setTasks(mine);
    } catch (err) {
      console.error("Task load error:", err);
    } finally {
      setLoading(false);
    }
  }, [engineerId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const toggleTask = async (task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    setTogglingId(task._id);
    try {
      await apiPatch(`/pending/update/${task._id}`, { status: newStatus });
      setTasks((prev) =>
        prev?.map((t) =>
          t._id === task._id ? { ...t, status: newStatus } : t,
        ),
      );
    } catch (err) {
      console.error("Task toggle error:", err);
    } finally {
      setTogglingId(null);
    }
  };

  const done = tasks.filter((t) => t.status === "completed").length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = total > 0 && done === total;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 text-blue-400 text-sm">
          <Loader2 size={14} className="animate-spin" /> Loading tasks…
        </div>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-extra-darkblue flex items-center justify-center shrink-0">
            <ListTodo size={16} className="text-sky-200" />
          </div>
          <h3 className="text-sm font-bold text-extra-darkblue">My Tasks</h3>
        </div>
        <div className="flex flex-col items-center py-8 gap-2 text-center px-5">
          <ListTodo size={28} strokeWidth={1.5} className="text-gray-200" />
          <p className="text-xs text-blue-400 m-0">
            No tasks assigned for this project.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Collapsible Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${allDone ? "bg-green-50" : "bg-extra-darkblue"}`}
          >
            <ListTodo
              size={16}
              className={allDone ? "text-green-500" : "text-sky-200"}
            />
          </div>
          <div>
            <p className="text-sm font-bold text-extra-darkblue m-0">
              My Tasks
            </p>
            <p className="text-xs text-blue-400 m-0">
              {done}/{total} completed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${allDone ? "bg-green-50 text-green-600 border-green-100" : "bg-blue-50 text-blue-500 border-blue-100"}`}
          >
            {pct}% done
          </span>
          <ChevronDown
            size={14}
            className="text-blue-400 transition-transform duration-200"
            style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
          />
        </div>
      </div>

      {!collapsed && (
        <div className="p-5">
          {/* Progress bar */}
          <div className="bg-gray-100 rounded-full h-1 mb-4">
            <div
              className="h-1 rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: allDone
                  ? "#34C759"
                  : pct > 60
                    ? "#4988C4"
                    : "#FF9500",
              }}
            />
          </div>

          {/* Task rows */}
          <div className="divide-y divide-gray-50">
            {tasks?.map((task) => {
              const isDone = task.status === "completed";
              const PM = PRIORITY_META[task.priority] || PRIORITY_META.medium;
              const toggling = togglingId === task._id;
              const isOverdue =
                task.dueDate && new Date(task.dueDate) < new Date() && !isDone;

              return (
                <div
                  key={task._id}
                  className="flex items-center gap-3 py-3 hover:bg-blue-50/40 transition-colors rounded-lg px-1"
                  style={{ opacity: toggling ? 0.6 : 1 }}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTask(task)}
                    disabled={toggling}
                    className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center transition-all"
                    style={{
                      border: isDone
                        ? "none"
                        : "2px solid rgba(73,136,196,0.35)",
                      background: isDone ? "#34C759" : "#fff",
                      cursor: toggling ? "wait" : "pointer",
                      boxShadow: isDone
                        ? "0 2px 8px rgba(52,199,89,0.3)"
                        : "none",
                    }}
                  >
                    {toggling ? (
                      <Loader2
                        size={10}
                        color={isDone ? "#fff" : "#4988C4"}
                        className="animate-spin"
                      />
                    ) : isDone ? (
                      <CheckCircle2 size={12} color="#fff" strokeWidth={3} />
                    ) : null}
                  </button>

                  {/* Task info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold m-0 truncate"
                      style={{
                        color: isDone ? "rgba(73,136,196,0.4)" : "#0F2854",
                        textDecoration: isDone ? "line-through" : "none",
                      }}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {task.type && (
                        <span className="text-xs text-gray-400 capitalize">
                          {task.type}
                        </span>
                      )}
                      {task.raisedBy?.name && (
                        <span className="text-xs text-blue-500 font-semibold flex items-center gap-1">
                          <User size={9} /> {task.raisedBy.name}
                        </span>
                      )}
                      {task.dueDate && (
                        <span
                          className={`text-xs flex items-center gap-1 ${isOverdue ? "text-red-500 font-bold" : "text-gray-400"}`}
                        >
                          <Calendar size={9} />
                          {fmtDate(task.dueDate)}
                          {isOverdue && " · Overdue"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Priority badge */}
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 border"
                    style={{
                      background: PM.bg,
                      color: PM.color,
                      border: `1px solid ${PM.border}`,
                      opacity: isDone ? 0.45 : 1,
                    }}
                  >
                    {PM.label}
                  </span>
                </div>
              );
            })}
          </div>

          {allDone && (
            <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
              <CheckCircle2 size={14} className="text-green-500" />
              <span className="text-xs font-bold text-green-700">
                All tasks completed — great work! 🎉
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



function buildDocTree(files) {
  const root = { __files: [] };
  files.forEach((file) => {
    const rawName = file.relativePath || file.fileName || file.name || "";
    const parts = rawName.split("/").filter(Boolean);
    if (parts.length <= 1) {
      root.__files.push(file);
    } else {
      let node = root;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!node[parts[i]]) node[parts[i]] = { __files: [] };
        node = node[parts[i]];
      }
      node.__files.push({ ...file, _displayName: parts[parts.length - 1] });
    }
  });
  return root;
}

function DocFileRow({ doc }) {
  const displayName = doc._displayName || doc.fileName || doc.name || "Untitled";
  const isPdf = doc.fileType === "pdf" || displayName.toLowerCase().endsWith(".pdf");
  return (
    <div className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-blue-50/40 group transition-colors">
      <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${isPdf ? "bg-red-50 text-red-400" : "bg-blue-50 text-blue-400"}`}>
        <FileText size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-extra-darkblue truncate m-0">{displayName}</p>
        <p className="text-[10px] text-blue-400 mt-0.5 m-0 flex gap-1.5">
          <span className="capitalize">{doc.fileType || "file"}</span>
          <span>·</span>
          <span>{new Date(doc.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
        </p>
      </div>
      {doc.url && doc.url.startsWith("http") && (
        <a href={doc.url} target="_blank" rel="noopener noreferrer"
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-blue-100 text-blue-400 shrink-0">
          <Eye size={13} />
        </a>
      )}
    </div>
  );
}

function DocFolderNode({ name, node, depth = 0 }) {
  const [open, setOpen] = useState(true);
  const subFolders = Object.keys(node).filter((k) => k !== "__files");
  const files = node.__files || [];
  return (
    <div className={depth > 0 ? "ml-3 border-l border-blue-100 pl-2" : ""}>
      {name && (
        <button onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 py-2 text-xs font-semibold text-blue-600 hover:text-extra-darkblue w-full text-left">
          <ChevronDown size={13} className="text-gray-400 shrink-0 transition-transform duration-200"
            style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }} />
          <FolderOpen size={13} className="text-amber-500 shrink-0" />
          <span className="truncate flex-1">{name}</span>
          <span className="ml-auto text-[10px] font-normal text-gray-400 shrink-0">
            {files.length} file{files.length !== 1 ? "s" : ""}
          </span>
        </button>
      )}
      {(open || !name) && (
        <>
          {files.map((f) => <DocFileRow key={f._id || f.url} doc={f} />)}
          {subFolders.map((folder) => (
            <DocFolderNode key={folder} name={folder} node={node[folder]} depth={depth + 1} />
          ))}
        </>
      )}
    </div>
  );
}

function DocFolderTree({ documents }) {
  const tree = buildDocTree(documents);
  const rootFiles = tree.__files || [];
  const subFolders = Object.keys(tree).filter((k) => k !== "__files");
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/50 px-2 py-1">
      {rootFiles.map((f) => <DocFileRow key={f._id || f.url} doc={f} />)}
      {subFolders.map((folder) => (
        <DocFolderNode key={folder} name={folder} node={tree[folder]} depth={1} />
      ))}
    </div>
  );
}
// ── Project Detail View ───────────────────────────────────────────────────────
function ProjectDetail({ project, onBack, onProjectUpdated }) {
  const [editOpen, setEditOpen] = useState(false);
  const [localProject, setLocalProject] = useState(project);
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const engineerId = getCurrentEngineerId();

  useEffect(() => {
    const fetchDocs = async () => {
      setDocsLoading(true);
      try {
        const data = await apiFetch(`/project-files/${project._id}/files`);
        const allDocs = Array.isArray(data) ? data : data.documents || [];
        console.log("DOC FIELDS:", allDocs[0]);
        setDocuments(
          allDocs.filter((d) => (d.project?._id || d.project) === project._id),
        );
      } catch (err) {
        console.error("Failed to load documents", err);
      } finally {
        setDocsLoading(false);
      }
    };
    if (project?._id) fetchDocs();
  }, [project._id]);

  const checks = localProject.eligibilityChecks || {};
  const phase = localProject.phase || "Site Preparation";
  const phaseIdx = phaseList.indexOf(phase);
  const delayed = isProjectDelayed(localProject);

  const progressBg = delayed
    ? "#FF3B30"
    : (localProject.progress || 0) > 80
      ? "#34C759"
      : (localProject.progress || 0) > 50
        ? "#4988C4"
        : "#FF9500";

  const handleSaved = (updated) => {
    setLocalProject((prev) => ({ ...prev, ...updated }));
    onProjectUpdated(updated);
  };

  return (
    <div>
      {editOpen && (
        <EditProjectModal
          project={localProject}
          onClose={() => setEditOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Top bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl border bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <p className="text-xs font-bold tracking-widest text-blue-500 uppercase mb-0.5">
            PROJECT DETAIL
          </p>
          <h2 className="text-xl font-bold text-extra-darkblue m-0">
            {localProject.projectId && (
              <span className="text-blue-500 mr-2 pr-2 border-r border-blue-200">
                {localProject.projectId}
              </span>
            )}
            {localProject.name}
          </h2>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {delayed && (
            <span className="flex items-center gap-1 bg-red-50 text-red-500 text-xs font-bold px-2.5 py-1 rounded-full border border-red-100 animate-pulse">
              <Clock size={10} /> DELAYED
            </span>
          )}
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <Edit2 size={13} /> Update Status
          </button>
          <Link
            href={`/engineer/issue-log?projectId=${localProject._id}&projectName=${encodeURIComponent(localProject.name)}`}
            style={{ textDecoration: "none" }}
          >
            <button className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 hover:bg-amber-100 transition-colors cursor-pointer">
              <AlertTriangle size={13} /> Log Installation Issue
            </button>
          </Link>
          <StatusPill
            label={localProject.status || "active"}
            color={statusColor[localProject.status] || "blue"}
          />
        </div>
      </div>

      {/* Delayed banner */}
      {delayed && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-3 mb-5">
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-500 m-0">
              Project is delayed
            </p>
            {localProject.endDate &&
              new Date(localProject.endDate) < new Date() && (
                <p className="text-xs text-red-400 mt-0.5 m-0">
                  Deadline was {fmtDate(localProject.endDate)} — please update
                  status or contact your manager.
                </p>
              )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
        {/* LEFT COLUMN */}
        <div className="space-y-5">
          {/* Project Information */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-extra-darkblue flex items-center justify-center shrink-0">
                <FolderOpen size={16} className="text-sky-200" />
              </div>
              <h3 className="text-sm font-bold text-extra-darkblue">
                Project Information
              </h3>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  label: "Project ID",
                  value: localProject._id?.slice(-8).toUpperCase() || "—",
                },
                { label: "Client", value: localProject.clientName || "—" },
                { label: "Location", value: localProject.location || "—" },
                { label: "Start Date", value: fmtDate(localProject.startDate) },
                {
                  label: "End Date",
                  value: fmtDate(localProject.endDate),
                  isDelayed: delayed,
                },
                {
                  label: "Status",
                  value:
                    (localProject.status || "active").charAt(0).toUpperCase() +
                    (localProject.status || "active").slice(1),
                },
              ]?.map(({ label, value, isDelayed: d }) => (
                <div key={label}>
                  <p className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-1">
                    {label}
                  </p>
                  <p
                    className={`text-sm font-semibold m-0 ${d ? "text-red-500" : "text-extra-darkblue"}`}
                  >
                    {value} {d && <span className="text-xs">⚠</span>}
                  </p>
                </div>
              ))}
              {localProject.description && (
                <div className="col-span-2">
                  <p className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-1">
                    DESCRIPTION
                  </p>
                  <p className="text-sm font-medium m-0 leading-relaxed text-extra-darkblue">
                    {localProject.description}
                  </p>
                </div>
              )}
              {localProject.engineerNotes && (
                <div className="col-span-2">
                  <p className="text-xs font-bold tracking-widest text-amber-500 uppercase mb-1">
                    ENGINEER NOTES
                  </p>
                  <p className="text-sm font-medium m-0 leading-relaxed text-extra-darkblue">
                    {localProject.engineerNotes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Progress & Phase */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-extra-darkblue flex items-center justify-center shrink-0">
                <ClipboardList size={16} className="text-sky-200" />
              </div>
              <h3 className="text-sm font-bold text-extra-darkblue">
                Progress &amp; Phase
              </h3>
            </div>
            <div className="p-5">
              <div className="flex justify-between mb-1.5">
                <span className="text-xs text-blue-400">Overall Progress</span>
                <span className="text-xs font-bold text-extra-darkblue">
                  {localProject.progress || 0}%
                </span>
              </div>
              <div className="bg-gray-100 rounded-full h-2 mb-5">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${localProject.progress || 0}%`,
                    background: progressBg,
                  }}
                />
              </div>
              <p className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-3">
                CURRENT PHASE
              </p>
              <div className="space-y-2">
                {phaseList?.map((p, i) => {
                  const done = i < phaseIdx;
                  const current = i === phaseIdx;
                  const hex = phaseHex[p] || "#4988C4";
                  return (
                    <div
                      key={p}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all"
                      style={{
                        background: current
                          ? `${hex}12`
                          : done
                            ? "rgba(52,199,89,0.05)"
                            : "rgba(73,136,196,0.03)",
                        borderColor: current
                          ? `${hex}40`
                          : done
                            ? "rgba(52,199,89,0.15)"
                            : "rgba(73,136,196,0.08)",
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          background: current
                            ? hex
                            : done
                              ? "#34C759"
                              : "rgba(73,136,196,0.12)",
                          color: current || done ? "#fff" : "#4988C4",
                        }}
                      >
                        {done ? "✓" : i + 1}
                      </div>
                      <span
                        className="text-xs"
                        style={{
                          color: current ? hex : done ? "#34C759" : "#4988C4",
                          fontWeight: current ? 700 : 500,
                        }}
                      >
                        {p}
                      </span>
                      {current && (
                        <span
                          className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${hex}18`, color: hex }}
                        >
                          Current
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Task Checklist */}
          <ProjectTaskChecklist
            projectId={localProject._id}
            engineerId={engineerId}
          />
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-5">
          {/* Eligibility Checklist */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-extra-darkblue flex items-center justify-center shrink-0">
                <CheckSquare size={16} className="text-sky-200" />
              </div>
              <h3 className="text-sm font-bold text-extra-darkblue">
                Eligibility Checklist
              </h3>
            </div>
            <div className="p-5">
              {localProject.eligibilityStatus === "proceeded" ? (
                <>
                  <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2.5 mb-4">
                    <CheckCircle2 size={14} className="text-green-500" />
                    <span className="text-xs font-bold text-green-700">
                      All checks passed — Approved by admin
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {CHECKS_META?.map((c) => {
                      const passed = checks[c.key];
                      return (
                        <div
                          key={c.key}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border"
                          style={{
                            background: passed
                              ? "rgba(52,199,89,0.06)"
                              : "rgba(255,59,48,0.05)",
                            borderColor: passed
                              ? "rgba(52,199,89,0.2)"
                              : "rgba(255,59,48,0.15)",
                          }}
                        >
                          <div
                            className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center"
                            style={{
                              background: passed ? "#34C759" : "#FF3B30",
                            }}
                          >
                            {passed ? (
                              <CheckCircle2 size={12} color="#fff" />
                            ) : (
                              <XCircle size={12} color="#fff" />
                            )}
                          </div>
                          <span
                            className="text-xs font-semibold"
                            style={{ color: passed ? "#1a6b3c" : "#c0392b" }}
                          >
                            {c.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {localProject.eligibilityProceededAt && (
                    <p className="text-xs text-right mt-3 text-blue-400">
                      Approved · {fmtDate(localProject.eligibilityProceededAt)}
                    </p>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center py-8 gap-3 text-center">
                  <Package
                    size={28}
                    strokeWidth={1.5}
                    className="text-gray-200"
                  />
                  <p className="text-xs font-semibold text-blue-400 m-0">
                    Eligibility not yet reviewed
                  </p>
                  <p className="text-xs text-blue-300 m-0">
                    Admin will complete this checklist before installation
                    begins.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Team */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-extra-darkblue flex items-center justify-center shrink-0">
                <User size={16} className="text-sky-200" />
              </div>
              <h3 className="text-sm font-bold text-extra-darkblue">
                Assigned Team
              </h3>
            </div>
            <div className="p-5 space-y-2">
              {(localProject.assignedEngineers || [])?.map((e) => (
                <div
                  key={e._id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50/40 border border-blue-100"
                >
                  <div
                    className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-bold"
                    style={{
                      background: "linear-gradient(135deg,#4988C4,#0F2854)",
                    }}
                  >
                    {(e.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-extra-darkblue m-0">
                      {e.name}
                    </p>
                    <p className="text-xs text-blue-400 m-0">Engineer</p>
                  </div>
                </div>
              ))}
              {localProject.assignedMarketingExecutive && (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-100">
                  <div
                    className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-bold"
                    style={{
                      background: "linear-gradient(135deg,#FF9500,#e67e22)",
                    }}
                  >
                    {(localProject.assignedMarketingExecutive.name || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-extra-darkblue m-0">
                      {localProject.assignedMarketingExecutive.name}
                    </p>
                    <p className="text-xs text-amber-500 m-0">
                      Marketing Executive
                    </p>
                  </div>
                </div>
              )}
              {localProject.assignedInstallationIncharge && (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-green-50 border border-green-100">
                  <div
                    className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-bold"
                    style={{
                      background: "linear-gradient(135deg,#34C759,#27ae60)",
                    }}
                  >
                    {(localProject.assignedInstallationIncharge.name || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-extra-darkblue m-0">
                      {localProject.assignedInstallationIncharge.name}
                    </p>
                    <p className="text-xs text-green-500 m-0">
                      Installation Incharge
                    </p>
                  </div>
                </div>
              )}
              {(localProject.assignedEngineers || []).length === 0 &&
                !localProject.assignedMarketingExecutive &&
                !localProject.assignedInstallationIncharge && (
                  <p className="text-xs text-blue-300 text-center py-5">
                    No team members assigned yet.
                  </p>
                )}
            </div>
          </div>

          {/* Uploaded Documents */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-extra-darkblue flex items-center justify-center shrink-0">
                <FileText size={16} className="text-sky-200" />
              </div>
              <h3 className="text-sm font-bold text-extra-darkblue">
                Uploaded Documents
              </h3>
            </div>
            <div className="p-5">
              {docsLoading ? (
                <div className="flex items-center justify-center gap-2 py-5 text-gray-400 text-xs">
                  <Loader size={14} className="animate-spin" /> Loading
                  documents...
                </div>
              ) : documents.length === 0 ? (
                <p className="text-xs text-blue-300 text-center py-5">
                  No documents uploaded for this project yet.
                </p>
              ) :(
  <DocFolderTree documents={documents} />
)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({ project, onClick, onEdit, index }) {
  const delayed = isProjectDelayed(project);
  const progressBg = delayed
    ? "#FF3B30"
    : (project.progress || 0) > 80
      ? "#34C759"
      : (project.progress || 0) > 50
        ? "#4988C4"
        : "#FF9500";

  return (
    <div
      className="bg-white rounded-xl border shadow-sm overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{
        borderColor: delayed ? "rgba(255,59,48,0.2)" : "rgba(73,136,196,0.12)",
        animationDelay: `${index * 0.04}s`,
      }}
      onClick={onClick}
    >
      {/* Card Header */}
      <div
        className="px-5 py-4 border-b"
        style={{
          background: delayed
            ? "rgba(255,59,48,0.03)"
            : "rgba(73,136,196,0.03)",
          borderColor: delayed
            ? "rgba(255,59,48,0.1)"
            : "rgba(73,136,196,0.08)",
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-sm font-bold text-extra-darkblue m-0 break-words">
                {project.projectId && (
                  <span className="text-blue-500 mr-1.5">
                    {project.projectId}
                  </span>
                )}
                {project.name}
              </h3>
              {delayed && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full border bg-red-50 text-red-500 border-red-100 animate-pulse shrink-0">
                  DELAYED
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-400">
              <MapPin size={10} className="shrink-0" />{" "}
              {project.location || "—"}
            </div>
          </div>
          <div className="shrink-0">
            <StatusPill
              label={project.status || "active"}
              color={statusColor[project.status] || "blue"}
            />
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="px-5 py-4">
        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between mb-1.5">
            <span className="text-xs font-semibold text-blue-400">
              Progress
            </span>
            <span
              className={`text-xs font-bold ${delayed ? "text-red-500" : "text-extra-darkblue"}`}
            >
              {project.progress || 0}%
            </span>
          </div>
          <div
            className="rounded-full h-1.5"
            style={{
              background: delayed
                ? "rgba(255,59,48,0.1)"
                : "rgba(73,136,196,0.12)",
            }}
          >
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${project.progress || 0}%`,
                background: progressBg,
              }}
            />
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 mb-4">
          {[
            { label: "CLIENT", value: project.clientName || "—" },
            { label: "PHASE", value: project.phase || "—" },
            { label: "START", value: fmtDate(project.startDate) },
            {
              label: "DEADLINE",
              value: fmtDate(project.endDate),
              isDelayed: delayed,
            },
          ]?.map(({ label, value, isDelayed: d }) => (
            <div key={label}>
              <p
                className={`text-xs font-bold tracking-widest uppercase mb-0.5 ${d ? "text-red-400" : "text-blue-300"}`}
              >
                {label}
              </p>
              <p
                className={`text-xs font-semibold m-0 truncate flex items-center gap-1 ${d ? "text-red-500" : "text-extra-darkblue"}`}
              >
                {d && <Calendar size={10} />}
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Engineers avatars */}
        {(project.assignedEngineers || []).length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex">
              {(project.assignedEngineers || []).slice(0, 4)?.map((e, i) => (
                <div
                  key={e._id || i}
                  title={e.name}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                  style={{
                    background: "linear-gradient(135deg,#4988C4,#0F2854)",
                    marginLeft: i > 0 ? "-6px" : "0",
                  }}
                >
                  {(e.name || "?").charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            <span className="text-xs text-blue-400">
              {(project.assignedEngineers || []).length} engineer
              {(project.assignedEngineers || []).length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-3 border-t"
          style={{
            borderColor: delayed
              ? "rgba(255,59,48,0.1)"
              : "rgba(73,136,196,0.08)",
          }}
        >
          <span
            className={`text-xs font-semibold ${delayed ? "text-red-400" : "text-blue-400"}`}
          >
            View full details
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <Edit2 size={11} /> Edit
            </button>
            <ChevronRight
              size={14}
              className={delayed ? "text-red-400" : "text-blue-400"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EngineerMyProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [filterTab, setFilterTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");
  const [engineerName, setEngineerName] = useState("Engineer");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const engineerId = getCurrentEngineerId();
      setEngineerName(getCurrentEngineerName());
      const pData = await apiFetch("/projects");
      const allProjects = Array.isArray(pData) ? pData : pData.projects || [];
      const myProjects = engineerId
        ? allProjects.filter((p) =>
            (p.assignedEngineers || []).some(
              (e) => (e._id || e) === engineerId,
            ),
          )
        : allProjects;
      setProjects(myProjects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleProjectUpdated = (updated) => {
    setProjects((prev) =>
      prev?.map((p) => (p._id === updated._id ? { ...p, ...updated } : p)),
    );
    if (selectedProject?._id === updated._id)
      setSelectedProject((prev) => ({ ...prev, ...updated }));
  };

  const delayedProjects = projects.filter((p) => isProjectDelayed(p));
  const activeProjects = projects.filter(
    (p) => p.status !== "completed" && !isProjectDelayed(p),
  );
  const completedProjects = projects.filter((p) => p.status === "completed");
  const onHoldProjects = projects.filter((p) => p.status === "on-hold");

  const tabCounts = {
    all: projects.length,
    active: activeProjects.length,
    delayed: delayedProjects.length,
    completed: completedProjects.length,
    "on-hold": onHoldProjects.length,
  };

  const STATS = [
    {
      label: "Total",
      value: projects.length,
      color: "#4988C4",
      bg: "bg-blue-50",
      border: "border-blue-100",
      ring: "ring-blue-300",
      filterKey: "all",
    },
    {
      label: "Active",
      value: activeProjects.length,
      color: "#0F2854",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
      ring: "ring-indigo-300",
      filterKey: "active",
    },
    {
      label: "Delayed",
      value: delayedProjects.length,
      color: "#FF3B30",
      bg: "bg-red-50",
      border: "border-red-100",
      ring: "ring-red-300",
      filterKey: "delayed",
    },
    {
      label: "Completed",
      value: completedProjects.length,
      color: "#34C759",
      bg: "bg-green-50",
      border: "border-green-100",
      ring: "ring-green-300",
      filterKey: "completed",
    },
  ];

  const filtered = (() => {
    let list = [...projects];
    if (filterTab === "active") list = [...activeProjects];
    if (filterTab === "delayed") list = [...delayedProjects];
    if (filterTab === "completed") list = [...completedProjects];
    if (filterTab === "on-hold") list = [...onHoldProjects];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.clientName || "").toLowerCase().includes(q) ||
          (p.location || "").toLowerCase().includes(q) ||
          (p.phase || "").toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => {
      if (sortBy === "name-asc")
        return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "name-desc")
        return (b.name || "").localeCompare(a.name || "");
      if (sortBy === "progress-desc")
        return (b.progress || 0) - (a.progress || 0);
      if (sortBy === "progress-asc")
        return (a.progress || 0) - (b.progress || 0);
      if (sortBy === "date-desc")
        return new Date(b.startDate || 0) - new Date(a.startDate || 0);
      if (sortBy === "date-asc")
        return new Date(a.startDate || 0) - new Date(b.startDate || 0);
      return 0;
    });
  })();

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 px-6 text-blue-400 text-sm">
        <Loader2 size={16} className="animate-spin" /> Loading your projects…
      </div>
    );
  }

  if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        onProjectUpdated={handleProjectUpdated}
      />
    );
  }

  return (
    <div className="space-y-5">
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSaved={(updated) => {
            handleProjectUpdated(updated);
            setEditingProject(null);
          }}
        />
      )}

      {/* Page Header */}
      <div>
        <p className="text-xs font-bold tracking-widest text-blue-500 uppercase mb-1">
          Engineer Panel
        </p>
        <h1 className="text-2xl font-bold text-extra-darkblue">My Projects</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {engineerName} · {projects.length} project
          {projects.length !== 1 ? "s" : ""} assigned to you
        </p>
      </div>

      {/* Delayed alert */}
      {delayedProjects.length > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-3 flex-wrap">
          <AlertTriangle size={15} className="text-red-500 shrink-0" />
          <span className="text-sm font-semibold text-red-500 flex-1 min-w-[160px]">
            You have <strong>{delayedProjects.length}</strong> delayed project
            {delayedProjects.length > 1 ? "s" : ""} that need attention.
          </span>
          <button
            onClick={() => setFilterTab("delayed")}
            className="text-white text-xs font-bold px-4 py-1.5 rounded-lg bg-red-500 hover:opacity-90 transition-opacity cursor-pointer border-none"
          >
            View Delayed →
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATS?.map((s) => {
          const isActive = filterTab === s.filterKey;
          return (
            <button
              key={s.label}
              onClick={() => setFilterTab(s.filterKey)}
              className={`rounded-xl px-5 py-4 text-left w-full transition-all duration-150 cursor-pointer border ${s.bg} ${isActive ? `${s.border} ring-2 ${s.ring} shadow-sm` : "border-gray-100 hover:shadow-sm"}`}
            >
              <p className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-1">
                {s.label}
              </p>
              <p className="text-3xl font-bold m-0" style={{ color: s.color }}>
                {s.value}
              </p>
              {isActive && (
                <p
                  className="text-xs font-bold mt-1 m-0"
                  style={{ color: s.color }}
                >
                  ● Active filter
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Search + Sort */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1" style={{ minWidth: "200px" }}>
          <Search
            size={14}
            className="absolute pointer-events-none text-blue-400"
            style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            type="text"
            placeholder="Search by name, client, location, phase…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm pl-9 pr-3 py-2.5 rounded-xl border border-blue-100 bg-blue-50/40 text-extra-darkblue placeholder-blue-200 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-sm px-3 py-2.5 rounded-xl border border-blue-100 bg-blue-50/40 text-extra-darkblue focus:outline-none focus:border-blue-400 focus:bg-white transition-colors cursor-pointer"
        >
          {SORT_OPTIONS?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS?.map((tab) => {
          const isActive = filterTab === tab.key;
          const isDelayed = tab.key === "delayed";
          return (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              className={`text-xs font-bold px-4 py-1.5 rounded-full border transition-all cursor-pointer ${
                isActive
                  ? isDelayed
                    ? "bg-red-500 text-white border-red-500"
                    : "bg-extra-darkblue text-white border-extra-darkblue"
                  : "bg-transparent text-blue-400 border-blue-100 hover:bg-blue-50"
              }`}
            >
              {tab.label}
              {tab.key !== "all" && (
                <span className="ml-1.5 opacity-70">
                  ({tabCounts[tab.key]})
                </span>
              )}
            </button>
          );
        })}
        {(searchQuery || filterTab !== "all") && (
          <button
            onClick={() => {
              setSearchQuery("");
              setFilterTab("all");
            }}
            className="text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100 text-blue-400 bg-transparent hover:bg-blue-50 transition-colors cursor-pointer"
          >
            Clear ✕
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs font-semibold text-blue-300">
        {filtered.length} project{filtered.length !== 1 ? "s" : ""} found
        {searchQuery && ` for "${searchQuery}"`}
      </p>

      {/* Project grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered?.map((project, i) => (
          <ProjectCard
            key={project._id}
            project={project}
            index={i}
            onClick={() => setSelectedProject(project)}
            onEdit={() => setEditingProject(project)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center py-16 gap-3 text-center">
            <FolderOpen size={40} strokeWidth={1.5} className="text-blue-100" />
            <p className="text-sm font-semibold text-blue-300 m-0">
              {searchQuery
                ? `No projects match "${searchQuery}"`
                : filterTab === "delayed"
                  ? "🎉 No delayed projects — you're on track!"
                  : filterTab === "completed"
                    ? "No completed projects yet."
                    : filterTab === "on-hold"
                      ? "No on-hold projects."
                      : "No projects assigned to you yet."}
            </p>
            {(searchQuery || filterTab !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterTab("all");
                }}
                className="text-xs font-bold underline text-blue-400 bg-transparent border-none cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
