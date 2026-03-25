"use client";
import { useState, useEffect, useCallback } from "react";
import { Eye, Pencil, Trash2, Plus, Loader2, AlertCircle, Filter, Search, ChevronRight, MessageCircle, Clock, AlertTriangle, ShieldCheck, X, RefreshCw, CheckCircle2, XCircle, MessageSquareWarning } from "lucide-react";
import axiosInstance from "../../lib/axios";

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
        ${
          active
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

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
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
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
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
          Photo URL
        </label>
        <input
          value={form.photo || ""}
          onChange={(e) => set("photo", e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Image URL (if any)"
        />
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

function ComplaintDetail({ complaint }) {
  const SM = STATUS_META[complaint.status] || {};
  const PM = PRIORITY_META[complaint.priority] || {};
  return (
    <div className="space-y-4 text-sm">
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
        <p className="text-xs font-semibold text-gray-400 mb-1">Description</p>
        <p className="text-gray-700 leading-relaxed">{complaint.description}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-1">Project</p>
          <p className="text-sm font-bold text-extra-darkblue">
            <span className="text-blue-600 mr-2 font-bold">
              {complaint.project?.projectId || complaint.project?._id?.slice(-6).toUpperCase()}
            </span>
            {complaint.project?.name || "—"}
          </p>
          {complaint.project?.clientName && (
            <p className="text-xs text-gray-400">
              {complaint.project.clientName}
            </p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-1">Logged By</p>
          <p className="text-gray-700">{complaint.loggedBy?.name || "—"}</p>
          <p className="text-xs text-gray-400">
            {complaint.loggedBy?.role || ""}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-1">
            Assigned To
          </p>
          <p className="text-gray-700">
            {complaint.assignedTo?.name || "Unassigned"}
          </p>
          <p className="text-xs text-gray-400">
            {complaint.assignedTo?.role || ""}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-1">Created</p>
          <p className="text-gray-700">
            {new Date(complaint.createdAt).toLocaleDateString()}
          </p>
        </div>
        {complaint.resolvedAt && (
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-1">
              Resolved At
            </p>
            <p className="text-gray-700">
              {new Date(complaint.resolvedAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
      {complaint.resolutionNotes && (
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-1">
            Resolution Notes
          </p>
          <p className="text-gray-700 bg-green-50 rounded-lg p-3 text-xs leading-relaxed">
            {complaint.resolutionNotes}
          </p>
        </div>
      )}
      {complaint.photos && complaint.photos.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 mb-1">Uploaded Evidence</p>
          <div className="grid grid-cols-2 gap-3">
            {complaint.photos?.map((url, idx) => {
              const fullUrl = url.startsWith("http") ? url : `${axiosInstance.defaults.baseURL.replace("/api/v1", "")}${url}`;
              return (
              <div key={idx} className="rounded-xl overflow-hidden border border-gray-100 shadow-sm aspect-video">
                {url.endsWith(".mp4") ? (
                  <video src={fullUrl} controls className="w-full h-full object-cover" />
                ) : (
                  <img 
                    src={fullUrl} 
                    alt={`Evidence ${idx + 1}`} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://placehold.co/600x400?text=Image+Not+Found";
                    }}
                  />
                )}
              </div>
            )})}
          </div>
        </div>
      )}
      {!complaint.photos && complaint.photo && (
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-1">Uploaded Image</p>
          <div className="mt-2 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <img 
              src={complaint.photo?.startsWith("http") ? complaint.photo : `${axiosInstance.defaults.baseURL.replace("/api/v1", "")}${complaint.photo}`} 
              alt="Complaint evidence" 
              className="w-full h-auto object-cover max-h-60"
            />
          </div>
        </div>
      )}
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
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState("list");

  const [showCreate, setShowCreate] = useState(false);
  const [viewComplaint, setViewComplaint] = useState(null);
  const [editComplaint, setEditComplaint] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // "all" | "open" | "in-progress" | "resolved-closed"
  const [activeCard, setActiveCard] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
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

  const handleCreate = async (form) => {
    try {
      setActionLoading(true);
      const payload = {
        ...form,
        project: form.project?._id || form.project || undefined,
        assignedTo: form.assignedTo?._id || form.assignedTo || undefined,
        loggedBy: undefined, // Let backend handle loggedBy
      };
      // remove undefined
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

      await apiFetch("/complaints", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setShowCreate(false);
      fetchComplaints();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (form) => {
    try {
      setActionLoading(true);
      const payload = {
        ...form,
        project: form.project?._id || form.project || undefined,
        assignedTo: form.assignedTo?._id || form.assignedTo || undefined,
      };
      // remove undefined/null
      Object.keys(payload).forEach(key => (payload[key] === undefined || payload[key] === null) && delete payload[key]);

      await apiFetch(`/complaints/${editComplaint._id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setEditComplaint(null);
      fetchComplaints();
    } catch (err) {
      alert(err.message);
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
                        <td className="px-5 py-3.5 font-semibold text-gray-800 max-w-[180px] truncate">
                          {c.title}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
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
        >
          <ComplaintDetail complaint={viewComplaint} />
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
