"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Trash2, Plus, Loader2, AlertCircle, Filter, Search, ChevronRight, MessageCircle, Clock, AlertTriangle, ShieldCheck, X, RefreshCw, CheckCircle2, XCircle, MessageSquareWarning, ImagePlus, Package, FileSpreadsheet } from "lucide-react";
import axiosInstance from "../../lib/axios";
import ComplaintTracker, { STAGE_ADVANCE_ROLES } from "../common/ComplaintTracker";
import MediaGallery from "../common/MediaGallery";
import { useAuth } from "../../context/AuthContext";

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

const STATUS_META = {
  open: {
    label: "Open",
    color: "bg-blue-50 text-blue-600",
    icon: AlertCircle,
    dot: "bg-blue-500",
  },
  "in-progress": {
    label: "In Progress",
    color: "bg-amber-50 text-amber-600",
    icon: Clock,
    dot: "bg-amber-400",
  },
  resolved: {
    label: "Resolved",
    color: "bg-green-50 text-green-600",
    icon: CheckCircle2,
    dot: "bg-green-500",
  },
  closed: {
    label: "Closed",
    color: "bg-gray-100 text-gray-500",
    icon: XCircle,
    dot: "bg-gray-400",
  },
};

const PRIORITY_META = {
  low: { label: "Low", color: "bg-gray-100 text-gray-500" },
  medium: { label: "Medium", color: "bg-blue-50 text-blue-600" },
  high: { label: "High", color: "bg-amber-50 text-amber-600" },
  critical: { label: "Critical", color: "bg-red-50 text-red-500" },
};

const EMPTY_FORM = {
  title: "",
  description: "",
  project: "",
  priority: "medium",
  status: "open",
  duration_type: "standard",
  assignedTo: "",
  resolutionNotes: "",
};

const Badge = ({ text, colorClass }) => (
  <span
    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${colorClass}`}
  >
    {text}
  </span>
);

const StatusIcon = ({ status }) => {
  const Meta = STATUS_META[status];
  if (!Meta) return null;
  const Icon = Meta.icon;
  return <Icon size={13} />;
};

// ── Clickable Stat Card ───────────────────────────────────────────────────────
function StatCard({ label, value, colorClass, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border shadow-sm p-4 text-center cursor-pointer transition-all duration-200
        hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]
        ${active
          ? "border-blue-400 bg-blue-50 ring-2 ring-blue-200"
          : "border-gray-100 bg-white hover:border-blue-200"
        }`}
    >
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      {active && (
        <p className="text-[10px] text-blue-500 font-semibold mt-1">
          ● Filtering
        </p>
      )}
    </div>
  );
}

function Modal({ title, onClose, children, size = "lg" }) {
  const maxWidth = {
    sm: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
    "5xl": "max-w-5xl",
  }[size] || "max-w-lg";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:px-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[92vh] overflow-y-auto overflow-x-hidden relative flex flex-col transition-all duration-300`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ComplaintForm({
  initial = EMPTY_FORM,
  onSubmit,
  loading,
  submitLabel = "Submit",
  projects = [],
  users = [],
}) {
  const [form, setForm] = useState(initial);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (idx) => {
    setSelectedFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[idx].preview);
      updated.splice(idx, 1);
      return updated;
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form, selectedFiles);
      }}
      className="space-y-4"
    >
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1 block">
          Title *
        </label>
        <input
          required
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Brief complaint title"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1 block">
          Description *
        </label>
        <textarea
          required
          rows={3}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
          placeholder="Detailed description of the complaint"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">
            Priority
          </label>
          <select
            value={form.priority}
            onChange={(e) => set("priority", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {Object.entries(PRIORITY_META)?.map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">
            Resolution Span
          </label>
          <select
            value={form.duration_type}
            onChange={(e) => set("duration_type", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 font-bold text-blue-600"
          >
            <option value="short">Short (15 Days)</option>
            <option value="standard">Standard (1 Month)</option>
            <option value="long">Long (3/6 Months)</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs font-semibold text-gray-600 mb-1 block">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {Object.entries(STATUS_META)?.map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1 block">
          Project
        </label>
        <select
          value={form.project?._id || form.project || ""}
          onChange={(e) => set("project", e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="">Select Project</option>
          {projects?.map((p) => (
            <option key={p._id} value={p._id}>
              {p.projectId ? `[${p.projectId}] ` : ""}{p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1 block">
          Assigned To
        </label>
        <select
          value={form.assignedTo?._id || form.assignedTo || ""}
          onChange={(e) => set("assignedTo", e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="">Unassigned</option>
          {users?.map((u) => (
            <option key={u._id} value={u._id}>
              {u.name} ({u.role})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1 block">
          Photos / Evidence
        </label>
        <label
          className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-200 rounded-lg px-3 py-4 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer"
        >
          <ImagePlus size={18} />
          <span>Click to select images or videos</span>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
        {selectedFiles.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {selectedFiles.map((f, idx) => (
              <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-100 aspect-video group">
                {f.file.type.startsWith("video/") ? (
                  <video src={f.preview} className="w-full h-full object-cover" />
                ) : (
                  <img src={f.preview} alt={f.name} className="w-full h-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
                <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] px-1 py-0.5 truncate">
                  {f.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      {(form.status === "resolved" || form.status === "closed") && (
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">
            Resolution Notes
          </label>
          <textarea
            rows={2}
            value={form.resolutionNotes}
            onChange={(e) => set("resolutionNotes", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
            placeholder="How was this complaint resolved?"
          />
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {submitLabel}
      </button>
    </form>
  );
}

function ComplaintDetail({ complaint, onAdvance, canAdvance }) {
  const SM = STATUS_META[complaint.status] || {};
  const PM = PRIORITY_META[complaint.priority] || {};

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 text-sm">
      {/* Left Column: Complaint Details */}
      <div className="lg:col-span-7 space-y-6">
        <div className="flex flex-wrap gap-2">
          <Badge
            text={SM.label || complaint.status}
            colorClass={SM.color || "bg-gray-100 text-gray-600"}
          />
          <Badge
            text={PM.label || complaint.priority}
            colorClass={PM.color || "bg-gray-100 text-gray-600"}
          />
        </div>

        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Detailed Description</p>
          <p className="text-gray-700 leading-relaxed bg-gray-50/50 p-4 rounded-2xl border border-gray-100 break-words whitespace-pre-wrap text-sm shadow-inner">
            {complaint.description}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DetailCard
            label="Project"
            value={complaint.project?.name || "—"}
            sub={complaint.project?.projectId ? `#${complaint.project.projectId}` : null}
            iconColor="text-blue-500"
          />
          <DetailCard
            label="Estimated Resolution"
            value={complaint.duration_type ? (complaint.duration_type.charAt(0).toUpperCase() + complaint.duration_type.slice(1)) : "Standard"}
            sub={complaint.duration_type === "short" ? "15-day turnaround" : complaint.duration_type === "long" ? "3/6 month project" : "30-day/1 mo repair"}
            iconColor="text-indigo-500"
          />
          <DetailCard
            label="Logged By"
            value={complaint.loggedBy?.name || "—"}
            sub={complaint.loggedBy?.role}
            iconColor="text-emerald-500"
          />
          <DetailCard
            label="Assigned To"
            value={complaint.assignedTo?.name || "Unassigned"}
            sub={complaint.assignedTo?.role}
            iconColor="text-amber-500"
          />
        </div>

        {/* Materials List */}
        {complaint.materials && complaint.materials.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={14} className="text-gray-400" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active BOM / Materials</p>
              </div>

              {/* Time Progress Calculation */}
              {complaint.status !== 'resolved' && (
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Est. Timeline Progress</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-100/50">
                      <div
                        style={{
                          width: (() => {
                            const start = new Date(complaint.createdAt || Date.now());
                            const now = new Date();
                            const diffDays = Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
                            const est = complaint.duration_type === 'short' ? 15 : complaint.duration_type === 'long' ? 90 : 30;
                            return Math.min(100, Math.round((diffDays / est) * 100)) + '%';
                          })(),
                          transition: 'width 1s ease-in-out'
                        }}
                        className="h-full bg-blue-500 rounded-full"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-blue-600">
                      {(() => {
                        const start = new Date(complaint.createdAt || Date.now());
                        const now = new Date();
                        const diffDays = Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
                        const est = complaint.duration_type === 'short' ? 15 : complaint.duration_type === 'long' ? 90 : 30;
                        return Math.min(100, Math.round((diffDays / est) * 100)) + '%';
                      })()}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {complaint.materials.map((m, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-blue-50/30 p-3 rounded-xl border border-blue-100/30 group hover:border-blue-200 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-blue-500 shadow-sm font-bold text-xs">{m.qty}</div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{m.name}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{m.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Media Gallery */}
        <div className="pt-4 border-t border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Evidence & Attachments</p>
          <div className="rounded-2xl border border-gray-50 overflow-hidden bg-gray-50/20">
            <MediaGallery
              files={complaint.photos || (complaint.photo ? [complaint.photo] : [])}
              hideTitle
              compact
            />
          </div>
        </div>

        {complaint.resolutionNotes && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Resolution Summary</p>
            <div className="bg-emerald-50/40 rounded-2xl border border-emerald-100 p-4 relative group">
              <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
                <ShieldCheck size={24} className="text-emerald-500" />
              </div>
              <p className="text-gray-700 text-xs leading-relaxed italic pr-8">
                "{complaint.resolutionNotes}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Progress Tracker */}
      <div className="lg:col-span-5 lg:border-l lg:border-gray-100 lg:pl-8 space-y-6">
        <div className="sticky top-0">
          <ComplaintTracker
            currentStage={complaint.currentStage || "complaint_raised"}
            stageHistory={complaint.stageHistory || []}
            compact={false}
            complaint={complaint}
            onAdvance={onAdvance}
            canAdvance={canAdvance}
          />
        </div>
      </div>
    </div>
  );
}

function DetailCard({ label, value, sub, iconColor }) {
  return (
    <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
      <p className={`text-[9px] font-black uppercase tracking-widest ${iconColor} mb-1.5 opacity-60 group-hover:opacity-100`}>{label}</p>
      <p className="text-sm font-bold text-gray-900 truncate">{value}</p>
      {sub && <p className="text-[10px] font-bold text-gray-400 mt-0.5 truncate">{sub}</p>}
    </div>
  );
}

function AnalyticsPanel({ complaints }) {
  const byProject = {};
  complaints.forEach((c) => {
    const key = c.project?.name || "Unassigned";
    if (!byProject[key])
      byProject[key] = { total: 0, resolved: 0, open: 0, escalated: 0 };
    byProject[key].total++;
    if (c.status === "resolved" || c.status === "closed")
      byProject[key].resolved++;
    else if (c.status === "open") byProject[key].open++;
    else if (c.status === "in-progress") byProject[key].escalated++;
  });
  const byPriority = { low: 0, medium: 0, high: 0, critical: 0 };
  complaints.forEach((c) => {
    if (byPriority[c.priority] !== undefined) byPriority[c.priority]++;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquareWarning size={15} className="text-blue-500" />
          <h3 className="text-sm font-bold text-gray-800">
            Complaints per Project
          </h3>
        </div>
        <div className="space-y-3">
          {Object.entries(byProject)?.map(([name, d]) => (
            <div key={name} className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-700 truncate max-w-[60%]">
                  {name}
                </span>
                <span className="text-gray-400">{d.total} total</span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                <div
                  className="bg-green-400"
                  style={{ width: `${(d.resolved / d.total) * 100}%` }}
                />
                <div
                  className="bg-amber-400"
                  style={{ width: `${(d.open / d.total) * 100}%` }}
                />
                <div
                  className="bg-blue-400"
                  style={{ width: `${(d.escalated / d.total) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {Object.keys(byProject).length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">
              No data yet
            </p>
          )}
        </div>
        <div className="flex gap-4 text-xs text-gray-400 pt-1 border-t border-gray-50">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />{" "}
            Resolved
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />{" "}
            Open
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />{" "}
            In Progress
          </span>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} className="text-amber-500" />
          <h3 className="text-sm font-bold text-gray-800">
            Priority Breakdown
          </h3>
        </div>
        <div className="space-y-3">
          {Object.entries(byPriority)?.map(([p, count]) => {
            const PM = PRIORITY_META[p];
            const pct = complaints.length
              ? Math.round((count / complaints.length) * 100)
              : 0;
            return (
              <div key={p} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-16 capitalize">
                  {PM.label}
                </span>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background:
                        p === "critical"
                          ? "#ef4444"
                          : p === "high"
                            ? "#d97706"
                            : p === "medium"
                              ? "#3b82f6"
                              : "#9ca3af",
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-700 w-8 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ComplaintAnalytics() {
  const router = useRouter();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState("list");

  const { user } = useAuth();
  const userRole = user?.role;

  const [showCreate, setShowCreate] = useState(false);
  const [viewComplaint, setViewComplaint] = useState(null);
  const [editComplaint, setEditComplaint] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // "all" | "open" | "in-progress" | "resolved-closed"
  const [activeCard, setActiveCard] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterDuration, setFilterDuration] = useState("all");
  const [search, setSearch] = useState("");

  const [projectsList, setProjectsList] = useState([]);
  const [usersList, setUsersList] = useState([]);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch("/complaints");
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDropdownData = useCallback(async () => {
    try {
      const [pData, uData] = await Promise.all([
        apiFetch("/projects"),
        apiFetch("/admin/users"),
      ]);
      setProjectsList(Array.isArray(pData) ? pData : []);
      setUsersList(Array.isArray(uData) ? uData : []);
    } catch (err) {
      console.error("Failed to fetch dropdown data:", err);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
    fetchDropdownData();
  }, [fetchComplaints, fetchDropdownData]);

  const handleCreate = async (form, files = []) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };
      const editableFields = ["title", "description", "priority", "status", "project", "assignedTo", "resolutionNotes"];

      if (files.length === 0) {
        const payload = {};
        editableFields.forEach(k => {
          if (form[k] !== undefined && form[k] !== null && form[k] !== "") {
            if (k === "project" || k === "assignedTo") payload[k] = form[k]._id || form[k];
            else if (k === "priority") payload[k] = String(form[k]).toLowerCase();
            else payload[k] = form[k];
          }
        });
        await axiosInstance.post("/complaints", payload, { headers });
      } else {
        const formData = new FormData();
        editableFields.forEach(k => {
          const v = form[k];
          if (v === undefined || v === null || v === "") return;
          let val = v;
          if (k === "project" || k === "assignedTo") val = v._id || v;
          if (k === "priority") val = String(v).toLowerCase();
          formData.append(k, val);
        });
        files.forEach((f) => formData.append("photos", f.file));
        await axiosInstance.post("/complaints", formData, { headers });
      }

      setShowCreate(false);
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdvanceStage = async (nextStageKey, stageData = {}) => {
    if (!viewComplaint) return;
    try {
      setActionLoading(true);
      const formData = new FormData();
      formData.append("currentStage", nextStageKey);

      if (stageData.stageNotes) formData.append("stageNotes", stageData.stageNotes);
      if (stageData.materials) formData.append("materials", JSON.stringify(stageData.materials));
      if (stageData.files) {
        stageData.files.forEach(f => formData.append("photos", f));
      }

      await axiosInstance.put(`/complaints/${viewComplaint._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setViewComplaint(null);
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (form, files = []) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };
      const editableFields = ["title", "description", "priority", "status", "project", "assignedTo", "resolutionNotes"];

      if (files.length === 0) {
        const payload = {};
        editableFields.forEach(k => {
          if (form[k] !== undefined && form[k] !== null && form[k] !== "") {
            if (k === "project" || k === "assignedTo") payload[k] = form[k]._id || form[k];
            else if (k === "priority") payload[k] = String(form[k]).toLowerCase();
            else payload[k] = form[k];
          }
        });
        await axiosInstance.put(`/complaints/${editComplaint._id}`, payload, { headers });
      } else {
        const formData = new FormData();
        editableFields.forEach(k => {
          const v = form[k];
          if (v === undefined || v === null || v === "") return;
          let val = v;
          if (k === "project" || k === "assignedTo") val = v._id || v;
          if (k === "priority") val = String(v).toLowerCase();
          formData.append(k, val);
        });
        files.forEach((f) => formData.append("photos", f.file));
        await axiosInstance.put(`/complaints/${editComplaint._id}`, formData, { headers });
      }

      setEditComplaint(null);
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await apiFetch(`/complaints/${deleteTarget._id}`, { method: "DELETE" });
      setDeleteTarget(null);
      fetchComplaints();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // clicking the active card again → resets to "all"
  const handleCardClick = (key) => {
    setActiveCard((prev) => (prev === key ? "all" : key));
    setView("list");
  };

  const filtered = complaints.filter((c) => {
    if (activeCard === "open" && c.status !== "open") return false;
    if (activeCard === "in-progress" && c.status !== "in-progress")
      return false;
    if (
      activeCard === "resolved-closed" &&
      c.status !== "resolved" &&
      c.status !== "closed"
    )
      return false;
    if (filterPriority !== "all" && c.priority !== filterPriority) return false;
    if (filterDuration !== "all" && c.duration_type !== filterDuration) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !c.title?.toLowerCase().includes(q) &&
        !c.description?.toLowerCase().includes(q) &&
        !c.project?.name?.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const stats = {
    total: complaints.length,
    open: complaints.filter((c) => c.status === "open").length,
    inProgress: complaints.filter((c) => c.status === "in-progress").length,
    resolved: complaints.filter(
      (c) => c.status === "resolved" || c.status === "closed",
    ).length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Complaint Management
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {complaints.length} total complaints across all projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${view === "list" ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"}`}
            >
              List
            </button>
            <button
              onClick={() => setView("analytics")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${view === "analytics" ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"}`}
            >
              Analytics
            </button>
          </div>
          <button
            onClick={fetchComplaints}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={13} /> New Complaint
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
          <AlertCircle size={14} />
          <span>{error}</span>
          <button
            onClick={fetchComplaints}
            className="ml-auto text-xs underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Clickable Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total"
          value={stats.total}
          colorClass="text-blue-600"
          active={activeCard === "all"}
          onClick={() => handleCardClick("all")}
        />
        <StatCard
          label="Open"
          value={stats.open}
          colorClass="text-amber-600"
          active={activeCard === "open"}
          onClick={() => handleCardClick("open")}
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          colorClass="text-blue-500"
          active={activeCard === "in-progress"}
          onClick={() => handleCardClick("in-progress")}
        />
        <StatCard
          label="Resolved / Closed"
          value={stats.resolved}
          colorClass="text-green-600"
          active={activeCard === "resolved-closed"}
          onClick={() => handleCardClick("resolved-closed")}
        />
      </div>

      {view === "analytics" && <AnalyticsPanel complaints={complaints} />}

      {view === "list" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-100">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search complaints…"
              className="flex-1 min-w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />

            {/* Active filter pill */}
            {activeCard !== "all" && (
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-200">
                {activeCard === "open" && "Open"}
                {activeCard === "in-progress" && "In Progress"}
                {activeCard === "resolved-closed" && "Resolved / Closed"}
                <button
                  onClick={() => setActiveCard("all")}
                  className="ml-1 hover:text-blue-800"
                >
                  <X size={11} />
                </button>
              </span>
            )}

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All Priorities</option>
              {Object.entries(PRIORITY_META)?.map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>

            <select
              value={filterDuration}
              onChange={(e) => setFilterDuration(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All Timeline Spans</option>
              <option value="short">Short (15 Days)</option>
              <option value="standard">Standard (1 Month)</option>
              <option value="long">Long (3/6 Months)</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Loading complaints…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              {complaints.length === 0
                ? "No complaints found. Create the first one!"
                : "No complaints match your filters."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {[
                      "Title",
                      "Project",
                      "Priority",
                      "Status",
                    
                      "Logged By",
                      "Assigned To",
                      "Date",
                      "Actions",
                    ]?.map((h) => (
                      <th
                        key={h}
                        className="text-left text-xs font-semibold text-gray-500 px-5 py-3 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered?.map((c) => {
                    const SM = STATUS_META[c.status] || {};
                    const PM = PRIORITY_META[c.priority] || {};
                    return (
                      <tr
                        key={c._id}
                        className="hover:bg-gray-50/60 transition-colors group"
                      >
                        <td
                          onClick={() => router.push(`/director/complaint/${c._id}`)}
                          className="px-5 py-3.5 font-semibold text-gray-800 max-w-[180px] truncate cursor-pointer"
                        >
                          {c.title}
                        </td>
                        <td
                          onClick={() => router.push(`/director/complaint/${c._id}`)}
                          className="px-5 py-3.5 text-gray-500 whitespace-nowrap cursor-pointer"
                        >
                          <span className="text-blue-600 mr-2 font-bold">
                            {c.project?.projectId || c.project?._id?.slice(-6).toUpperCase()}
                          </span>
                          {c.project?.name || "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            text={PM.label || c.priority}
                            colorClass={PM.color || "bg-gray-100 text-gray-500"}
                          />
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${SM.color || "bg-gray-100 text-gray-500"}`}
                          >
                            <StatusIcon status={c.status} />
                            {SM.label || c.status}
                          </span>
                        </td>
                        {/* <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5 w-24">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                              {c.duration_type || 'standard'}
                            </span>
                            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden border border-gray-100/30">
                              <div
                                style={{
                                  width: (() => {
                                    const start = new Date(c.createdAt || Date.now());
                                    const now = new Date();
                                    const elapsed = Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
                                    const est = c.duration_type === 'short' ? 15 : c.duration_type === 'long' ? 90 : 30;
                                    return Math.min(100, Math.round((elapsed / est) * 100)) + '%';
                                  })(),
                                  transition: 'width 0.5s'
                                }}
                                className="h-full bg-blue-500 rounded-full"
                              />
                            </div>
                          </div>
                        </td> */}
                        <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                          {c.loggedBy?.name || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                          {c.assignedTo?.name || (
                            <span className="text-gray-300">Unassigned</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setViewComplaint(c)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                              title="View"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              onClick={() => setEditComplaint(c)}
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
                              title="Edit"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(c)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-50 text-xs text-gray-400">
              Showing {filtered.length} of {complaints.length} complaints
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <Modal title="Log New Complaint" onClose={() => setShowCreate(false)}>
          <ComplaintForm
            onSubmit={handleCreate}
            loading={actionLoading}
            projects={projectsList}
            users={usersList}
          />
        </Modal>
      )}
      {viewComplaint && (
        <Modal
          title={viewComplaint.title}
          onClose={() => setViewComplaint(null)}
          size="5xl"
        >
          <ComplaintDetail
            complaint={viewComplaint}
            onAdvance={handleAdvanceStage}
            canAdvance={STAGE_ADVANCE_ROLES[viewComplaint.currentStage || "complaint_raised"]?.includes(userRole)}
          />
        </Modal>
      )}
      {editComplaint && (
        <Modal
          title="Edit Complaint"
          onClose={() => setEditComplaint(null)}
        >
          <ComplaintForm
            initial={editComplaint}
            onSubmit={handleUpdate}
            submitLabel="Save Changes"
            loading={actionLoading}
            projects={projectsList}
            users={usersList}
          />
        </Modal>
      )}
      {deleteTarget && (
        <Modal title="Delete Complaint" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-800">
                "{deleteTarget.title}"
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {actionLoading && (
                  <Loader2 size={14} className="animate-spin" />
                )}{" "}
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
