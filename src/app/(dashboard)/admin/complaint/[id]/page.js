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
import ComplaintTracker, { STAGE_ADVANCE_ROLES } from "@/components/common/ComplaintTracker";
import MediaGallery from "@/components/common/MediaGallery";
import { useAuth } from "@/context/AuthContext";
import { Package, FileSpreadsheet } from "lucide-react";

const apiFetch = async (path, { method = "GET", body } = {}) => {
  const token = localStorage.getItem("accessToken");
  const config = {
    method,
    url: path,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { data: typeof body === "string" ? JSON.parse(body) : body } : {}),
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

export default function AdminComplaintDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role;

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
      const data = await apiFetch(`/complaints/${id}`);
      setComplaint(data);
    } catch (err) {
      setError(err.message || "Failed to load complaint.");
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

      setEditMode(false);
      fetchComplaint();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdvanceStage = async (nextStageKey, stageData = {}) => {
    try {
      setActionLoading(true);
      const formData = new FormData();
      formData.append("currentStage", nextStageKey);
      if (stageData.stageNotes) formData.append("stageNotes", stageData.stageNotes);
      if (stageData.materials) formData.append("materials", JSON.stringify(stageData.materials));
      if (stageData.files) stageData.files.forEach(f => formData.append("photos", f));

      await axiosInstance.put(`/complaints/${id}`, formData);
      fetchComplaint();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await apiFetch(`/complaints/${id}`, { method: "DELETE" });
      router.push("/admin/complaint");
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400">Loading…</div>;
  if (!complaint) return <div className="p-10 text-center text-red-500">Complaint not found.</div>;

  const SM = STATUS_META[complaint.status] || {};
  const PM = PRIORITY_META[complaint.priority] || {};

  return (
    <div className="space-y-5 max-w-4xl mx-auto p-4 animate-fadeUp">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={() => router.push("/admin/complaint")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex items-center gap-2">
           <button onClick={openEdit} className="bg-amber-500 text-white text-xs px-3 py-2 rounded-lg font-bold transition-all hover:scale-105">Edit</button>
           <button onClick={() => setDeleteConfirm(true)} className="bg-red-500 text-white text-xs px-3 py-2 rounded-lg font-bold transition-all hover:scale-105">Delete</button>
        </div>
      </div>

      <ComplaintTracker
        currentStage={complaint.currentStage || "complaint_raised"}
        stageHistory={complaint.stageHistory || []}
        complaint={complaint}
        onAdvance={handleAdvanceStage}
        canAdvance={STAGE_ADVANCE_ROLES[complaint.currentStage || "complaint_raised"]?.includes(userRole)}
        compact={true}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
           <div>
              <h1 className="text-xl font-bold text-gray-900">{complaint.title}</h1>
              <div className="flex gap-2 mt-2">
                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SM.color}`}>{SM.label}</span>
                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PM.color}`}>{PM.label}</span>
              </div>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Created</p>
              <p className="text-xs font-bold text-gray-900">{new Date(complaint.createdAt).toLocaleDateString()}</p>
           </div>
        </div>
        <div className="p-6 space-y-6">
           <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Description</p>
              <p className="text-sm text-gray-700 mt-1 leading-relaxed">{complaint.description}</p>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Project</p>
                <p className="text-sm font-bold text-blue-900 mt-0.5">{complaint.project?.name || "—"}</p>
                {complaint.project?.projectId && <p className="text-[9px] font-bold text-blue-500/80 mt-0.5">#{complaint.project.projectId}</p>}
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Logged By</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{complaint.loggedBy?.name || "—"}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Assigned To</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{complaint.assignedTo?.name || "Unassigned"}</p>
              </div>
           </div>

           {/* Material List / BOM */}
           {(complaint.materials && complaint.materials.length > 0) && (
              <div className="space-y-3 pt-6 border-t border-gray-100">
                 <p className="text-[10px] font-bold text-gray-400 uppercase">Active BOM / Material List</p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {complaint.materials.map((m, idx) => (
                       <div key={idx} className="flex items-center gap-3 bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                          <Package size={14} className="text-amber-500" />
                          <div className="flex-1">
                             <p className="text-xs font-bold text-gray-800">{m.name}</p>
                             <p className="text-[10px] text-amber-600 font-bold">{m.qty} {m.unit}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           )}

           {/* Evidence / Photos / Designs */}
           <div className="pt-6 border-t border-gray-100">
              <MediaGallery files={complaint.photos || []} title="Evidence / Designs / Documents" />
           </div>
        </div>
      </div>

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

      {deleteConfirm && (
        <Modal title="Delete Complaint" onClose={() => setDeleteConfirm(false)}>
           <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">Are you sure you want to delete this complaint?</p>
              <div className="flex gap-2">
                 <button onClick={() => setDeleteConfirm(false)} className="flex-1 bg-gray-100 py-2 rounded-lg text-sm font-bold">Cancel</button>
                 <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-bold">Delete</button>
              </div>
           </div>
        </Modal>
      )}
    </div>
  );
}
