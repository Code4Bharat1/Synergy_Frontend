"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  ImagePlus,
} from "lucide-react";
import axiosInstance from "@/lib/axios";
import ComplaintTracker from "@/components/common/ComplaintTracker";

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
  open: { label: "Open", color: "bg-blue-50 text-blue-600", icon: AlertCircle, dot: "bg-blue-500" },
  "in-progress": { label: "In Progress", color: "bg-amber-50 text-amber-600", icon: Clock, dot: "bg-amber-400" },
  resolved: { label: "Resolved", color: "bg-green-50 text-green-600", icon: CheckCircle2, dot: "bg-green-500" },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-500", icon: XCircle, dot: "bg-gray-400" },
};

const PRIORITY_META = {
  low: { label: "Low", color: "bg-gray-100 text-gray-500" },
  medium: { label: "Medium", color: "bg-blue-50 text-blue-600" },
  high: { label: "High", color: "bg-amber-50 text-amber-600" },
  critical: { label: "Critical", color: "bg-red-50 text-red-500" },
};

const Badge = ({ text, colorClass }) => (
  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${colorClass}`}>
    {text}
  </span>
);

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export default function DirectorComplaintDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [projectsList, setProjectsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const fetchComplaint = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Try fetching single complaint by ID
      const data = await apiFetch(`/complaints/${id}`);
      setComplaint(data);
    } catch (err) {
      // Fallback: fetch all and find by ID
      try {
        const all = await apiFetch("/complaints");
        const arr = Array.isArray(all) ? all : [];
        const found = arr.find((c) => c._id === id);
        if (found) {
          setComplaint(found);
        } else {
          setError("Complaint not found.");
        }
      } catch (e2) {
        setError(e2.message || "Failed to load complaint.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

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
    if (id) {
      fetchComplaint();
      fetchDropdownData();
    }
  }, [id, fetchComplaint, fetchDropdownData]);

  const openEdit = () => {
    setEditForm({
      title: complaint.title || "",
      description: complaint.description || "",
      project: complaint.project?._id || "",
      priority: complaint.priority || "medium",
      status: complaint.status || "open",
      assignedTo: complaint.assignedTo?._id || "",
      resolutionNotes: complaint.resolutionNotes || "",
    });
    setSelectedFiles([]);
    setEditMode(true);
  };

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

  const handleUpdate = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };
      const editableFields = ["title", "description", "priority", "status", "project", "assignedTo", "resolutionNotes"];

      if (selectedFiles.length === 0) {
        const payload = {};
        editableFields.forEach(k => {
          const v = editForm[k];
          if (v !== undefined && v !== null && v !== "") {
            if (k === "priority") payload[k] = String(v).toLowerCase();
            else payload[k] = v._id || v;
          }
        });
        await axiosInstance.put(`/complaints/${id}`, payload, { headers });
      } else {
        const formData = new FormData();
        editableFields.forEach(k => {
          const v = editForm[k];
          if (v === "" || v === undefined || v === null) return;
          let val = v._id || v;
          if (k === "priority") val = String(v).toLowerCase();
          formData.append(k, val);
        });
        selectedFiles.forEach((f) => formData.append("photos", f.file));
        await axiosInstance.put(`/complaints/${id}`, formData, { headers });
      }

      setEditMode(false);
      fetchComplaint();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await apiFetch(`/complaints/${id}`, { method: "DELETE" });
      router.push("/director/complaint");
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-2 text-gray-400">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Loading complaint…</span>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="space-y-4 max-w-xl mx-auto py-16 text-center">
        <AlertCircle size={32} className="text-red-400 mx-auto" />
        <p className="text-sm text-red-500">{error || "Complaint not found."}</p>
        <button
          onClick={() => router.push("/director/complaint")}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Complaints
        </button>
      </div>
    );
  }

  const SM = STATUS_META[complaint.status] || {};
  const PM = PRIORITY_META[complaint.priority] || {};
  const StatusIcon = SM.icon;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={() => router.push("/director/complaint")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Complaints
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchComplaint}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={openEdit}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <Pencil size={12} /> Edit
          </button>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>

      {/* Complaint Tracker */}
      <ComplaintTracker
        currentStage={
          complaint.currentStage ||
          (complaint.status === "resolved" || complaint.status === "closed"
            ? "resolved"
            : complaint.status === "in-progress"
              ? "incharge_review"
              : "complaint_raised")
        }
        stageHistory={complaint.stageHistory || []}
        compact={true}
        complaint={complaint}
      />

      {/* Complaint Detail Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{complaint.title}</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {SM.label && (
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${SM.color}`}>
                {StatusIcon && <StatusIcon size={12} />}
                {SM.label}
              </span>
            )}
            <Badge text={PM.label || complaint.priority} colorClass={PM.color || "bg-gray-100 text-gray-600"} />
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-1">Description</p>
            <p className="text-sm text-gray-700 leading-relaxed">{complaint.description}</p>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">Project</p>
              <p className="text-sm font-bold text-extra-darkblue">
                <span className="text-blue-600 mr-2 font-bold">
                  {complaint.project?.projectId || complaint.project?._id?.slice(-6).toUpperCase()}
                </span>
                {complaint.project?.name || "—"}
              </p>
              {complaint.project?.clientName && (
                <p className="text-xs text-gray-400">{complaint.project.clientName}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">Logged By</p>
              <p className="text-sm text-gray-700">{complaint.loggedBy?.name || "—"}</p>
              <p className="text-xs text-gray-400">{complaint.loggedBy?.role || ""}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">Assigned To</p>
              <p className="text-sm text-gray-700">{complaint.assignedTo?.name || "Unassigned"}</p>
              <p className="text-xs text-gray-400">{complaint.assignedTo?.role || ""}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">Created</p>
              <p className="text-sm text-gray-700">{new Date(complaint.createdAt).toLocaleDateString()}</p>
            </div>
            {complaint.resolvedAt && (
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-1">Resolved At</p>
                <p className="text-sm text-gray-700">{new Date(complaint.resolvedAt).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          {/* Resolution Notes */}
          {complaint.resolutionNotes && (
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">Resolution Notes</p>
              <p className="text-sm text-gray-700 bg-green-50 rounded-lg p-3 leading-relaxed">
                {complaint.resolutionNotes}
              </p>
            </div>
          )}

          {/* Photos */}
          {complaint.photos && complaint.photos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2">Uploaded Evidence</p>
              <div className="grid grid-cols-2 gap-3">
                {complaint.photos.map((url, idx) => {
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
                  );
                })}
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
      </div>

      {/* Edit Modal */}
      {editMode && (
        <Modal title="Edit Complaint" onClose={() => setEditMode(false)}>
          <form
            onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}
            className="space-y-4"
          >
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Title *</label>
              <input
                required
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Description *</label>
              <textarea
                required
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Priority</label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {Object.entries(PRIORITY_META).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {Object.entries(STATUS_META).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Project</label>
              <select
                value={editForm.project}
                onChange={(e) => setEditForm((f) => ({ ...f, project: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Select Project</option>
                {projectsList.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.projectId ? `[${p.projectId}] ` : ""}{p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Assigned To</label>
              <select
                value={editForm.assignedTo}
                onChange={(e) => setEditForm((f) => ({ ...f, assignedTo: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Unassigned</option>
                {usersList.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
            {(editForm.status === "resolved" || editForm.status === "closed") && (
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Resolution Notes</label>
                <textarea
                  rows={2}
                  value={editForm.resolutionNotes}
                  onChange={(e) => setEditForm((f) => ({ ...f, resolutionNotes: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Add Photos / Evidence</label>
              <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-200 rounded-lg px-3 py-4 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer">
                <ImagePlus size={18} />
                <span>Select files</span>
                <input type="file" accept="image/*,video/*" multiple onChange={handleFileSelect} className="hidden" />
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
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={actionLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {actionLoading && <Loader2 size={14} className="animate-spin" />}
              Save Changes
            </button>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <Modal title="Delete Complaint" onClose={() => setDeleteConfirm(false)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-800">"{complaint.title}"</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {actionLoading && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
