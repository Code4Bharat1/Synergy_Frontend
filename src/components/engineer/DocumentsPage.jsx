"use client";
import { useState, useEffect, useCallback } from "react";
import {
  FileText, CheckCircle, Trash2, Send, Eye,
  Plus, RefreshCw, X, Loader2, AlertCircle,
  Pencil, ExternalLink, Clock, FolderOpen,
} from "lucide-react";
import axiosInstance from "../../lib/axios";

// ── API Helper ────────────────────────────────────────────────────────────────
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

// ── Constants ─────────────────────────────────────────────────────────────────
const DOC_TYPES = {
  "qc":           { label: "QC",           color: "bg-blue-50 text-blue-600",   dot: "#3b82f6" },
  "installation": { label: "Installation", color: "bg-purple-50 text-purple-600", dot: "#9333ea" },
  "reference":    { label: "Reference",    color: "bg-gray-100 text-gray-600",  dot: "#6b7280" },
  "daily-report": { label: "Daily Report", color: "bg-green-50 text-green-600", dot: "#16a34a" },
  "trail-qc":     { label: "Trial QC",     color: "bg-amber-50 text-amber-600", dot: "#d97706" },
  "other":        { label: "Other",        color: "bg-gray-100 text-gray-500",  dot: "#9ca3af" },
};

const STATUS_META = {
  pending:  { label: "Pending",  color: "bg-amber-50 text-amber-600" },
  approved: { label: "Approved", color: "bg-green-50 text-green-600" },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-500" },
};

const MAX_FILES = 5;

const FILE_ICONS = {
  "pdf":  { icon: "📄", color: "text-red-500",    bg: "bg-red-50" },
  "doc":  { icon: "📝", color: "text-blue-500",   bg: "bg-blue-50" },
  "docx": { icon: "📝", color: "text-blue-500",   bg: "bg-blue-50" },
  "xlsx": { icon: "📊", color: "text-green-500",  bg: "bg-green-50" },
  "xls":  { icon: "📊", color: "text-green-500",  bg: "bg-green-50" },
  "png":  { icon: "🖼️", color: "text-purple-500", bg: "bg-purple-50" },
  "jpg":  { icon: "🖼️", color: "text-purple-500", bg: "bg-purple-50" },
  "jpeg": { icon: "🖼️", color: "text-purple-500", bg: "bg-purple-50" },
};

const getFileExt  = (name)  => name.split(".").pop().toLowerCase();
const formatSize  = (bytes) => {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
const isRealUrl = (url) =>
  typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"));

// ── Sub-components ────────────────────────────────────────────────────────────
function Badge({ text, colorClass }) {
  return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${colorClass}`}>{text}</span>;
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

// ── Upload Document Form ──────────────────────────────────────────────────────
function UploadDocumentForm({ onSubmit, loading, projects = [] }) {
  const [title,        setTitle]    = useState("");
  const [documentType, setDocType]  = useState("other");
  const [projectId,    setProjectId]= useState("");
  const [files,        setFiles]    = useState([]);
  const [dragOver,     setDragOver] = useState(false);
  const [folderFiles, setFolderFiles] = useState([]);
const [uploadMode,  setUploadMode]  = useState("files"); // "files" | "folder"

const addFolderFiles = (incoming) => {
  const arr = Array.from(incoming).map(f => ({
    file: f,
    name: f.webkitRelativePath || f.name,
    size: f.size,
    ext:  getFileExt(f.name),
  }));
  setFolderFiles(arr);
};

  const addFiles = (incoming) => {
    const arr = Array.from(incoming);
    setFiles(prev => {
      const combined = [
        ...prev,
        ...arr.map(f => ({ file: f, name: f.name, size: f.size, ext: getFileExt(f.name) })),
      ];
      return combined.slice(0, MAX_FILES);
    });
  };

  const removeFile = (idx) => setFiles(f => f.filter((_, i) => i !== idx));

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

 const handleSubmit = (e) => {
  e.preventDefault();

  if (uploadMode === "folder") {
    if (folderFiles.length === 0) return alert("Please select a folder.");
    onSubmit({ title: title.trim(), documentType, projectId, files: [], folderFiles });
    return;
  }

  if (files.length === 0) return alert("Please add at least one file.");
  if (!title.trim())       return alert("Please enter a document title.");
  onSubmit({ title: title.trim(), documentType, projectId, files, folderFiles: [] });
};

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Title */}
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1 block">Document Title *</label>
        <input
          required
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="e.g. Handover Sheet – Site A"
        />
      </div>

      {/* Project selector ← NEW */}
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1 block">
          Project <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <select
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
        >
          <option value="">— No project —</option>
          {projects.map(p => (
            <option key={p._id} value={p._id}>
              {p.projectId ? `${p.projectId} – ${p.name}` : p.name}
            </option>
          ))}
        </select>
        {projects.length === 0 && (
          <p className="text-xs text-amber-500 mt-1">⚠ No projects found</p>
        )}
      </div>

      {/* Type */}
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1 block">Document Type</label>
        <select
          value={documentType}
          onChange={e => setDocType(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          {Object.entries(DOC_TYPES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* File drop zone */}
      {/* File drop zone */}
<div>
  {/* Mode toggle */}
  <div className="flex items-center gap-2 mb-3">
    <button type="button"
      onClick={() => setUploadMode("files")}
      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all
        ${uploadMode === "files" ? "bg-blue-700 text-white border-blue-700" : "border-gray-200 text-gray-500 hover:border-blue-300"}`}>
      Files
    </button>
    <button type="button"
      onClick={() => setUploadMode("folder")}
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all
        ${uploadMode === "folder" ? "bg-blue-700 text-white border-blue-700" : "border-gray-200 text-gray-500 hover:border-blue-300"}`}>
      <FolderOpen size={12} /> Folder
    </button>
  </div>

  {uploadMode === "files" ? (
    <>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-gray-600">
          Files * <span className="text-gray-400 font-normal">({files.length}/{MAX_FILES} max)</span>
        </label>
        {files.length > 0 && files.length < MAX_FILES && (
          <label className="flex items-center gap-1 text-xs font-semibold text-blue-600 cursor-pointer hover:text-blue-800 transition-colors">
            <Plus size={12} /> Add more
            <input type="file" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
          </label>
        )}
      </div>

      <label
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed rounded-xl py-8 cursor-pointer transition-all
          ${dragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"}
          ${files.length >= MAX_FILES ? "pointer-events-none opacity-50" : ""}`}
      >
        <input type="file" multiple className="hidden"
          onChange={e => addFiles(e.target.files)} disabled={files.length >= MAX_FILES} />
        <div className="text-3xl">📂</div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700">
            {files.length >= MAX_FILES ? "Maximum 5 files reached" : "Click to browse or drag & drop"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">PDF, DOC, XLSX, images — up to 5 files</p>
        </div>
      </label>

      {/* existing file list — unchanged */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((f, idx) => {
            const meta = FILE_ICONS[f.ext] || { icon: "📎", color: "text-gray-500", bg: "bg-gray-100" };
            return (
              <div key={idx} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 ${meta.bg} group`}>
                <span className="text-lg shrink-0">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{f.name}</p>
                  <p className="text-xs text-gray-400">{formatSize(f.size)} · .{f.ext.toUpperCase()}</p>
                </div>
                <button type="button" onClick={() => removeFile(idx)}
                  className="p-1 rounded-lg hover:bg-red-100 text-gray-300 hover:text-red-500 transition-colors shrink-0">
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  ) : (
    <>
      {/* Folder upload */}
      <label className="flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-gray-50 rounded-xl py-8 cursor-pointer transition-all">
       <input
  type="file"
  className="hidden"
  multiple
  ref={el => { if (el) el.setAttribute("webkitdirectory", ""); }}
  onChange={e => addFolderFiles(e.target.files)}
/>
        <FolderOpen size={28} className="text-blue-400" />
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700">Click to select a folder</p>
          <p className="text-xs text-gray-400 mt-0.5">All supported files inside will be uploaded</p>
        </div>
      </label>

      {folderFiles.length > 0 && (
        <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
          <p className="text-xs text-gray-400 font-semibold">{folderFiles.length} files selected</p>
          {folderFiles.map((f, idx) => {
            const meta = FILE_ICONS[f.ext] || { icon: "📎", color: "text-gray-500", bg: "bg-gray-100" };
            return (
              <div key={idx} className={`flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-100 ${meta.bg}`}>
                <span className="text-base shrink-0">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{f.name}</p>
                  <p className="text-xs text-gray-400">{formatSize(f.size)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  )}
</div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, idx) => {
            const meta = FILE_ICONS[f.ext] || { icon: "📎", color: "text-gray-500", bg: "bg-gray-100" };
            return (
              <div key={idx}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 ${meta.bg} group`}>
                <span className="text-lg shrink-0">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{f.name}</p>
                  <p className="text-xs text-gray-400">{formatSize(f.size)} · .{f.ext.toUpperCase()}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="p-1 rounded-lg hover:bg-red-100 text-gray-300 hover:text-red-500 transition-colors shrink-0"
                >
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || (uploadMode === "files" ? files.length === 0 : folderFiles.length === 0)}
        className="w-full bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        {loading ? "Uploading…" : `Upload ${files.length > 0 ? files.length : ""} Document${files.length !== 1 ? "s" : ""}`}
      </button>
    </form>
  );
}

// ── Edit Document Form ────────────────────────────────────────────────────────
function EditDocumentForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1 block">Document Title *</label>
        <input required value={form.title} onChange={e => set("title", e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Document Type</label>
          <select value={form.documentType} onChange={e => set("documentType", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
            {Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Status</label>
          <select value={form.status} onChange={e => set("status", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
            {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>
      <button type="submit" disabled={loading}
        className="w-full bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
        {loading && <Loader2 size={14} className="animate-spin" />}
        Save Changes
      </button>
    </form>
  );
}

// ── Detail View ───────────────────────────────────────────────────────────────
function DocumentDetail({ doc }) {
  const DT = DOC_TYPES[doc.documentType] || DOC_TYPES.other;
  const SM = STATUS_META[doc.status]     || STATUS_META.pending;

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap gap-2">
        <Badge text={DT.label} colorClass={DT.color} />
        <Badge text={SM.label} colorClass={SM.color} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-1">Project</p>
          <p className="text-gray-700">
            {typeof doc.project === "object" ? doc.project?.name : "—"}
          </p>
          {typeof doc.project === "object" && doc.project?.clientName && (
            <p className="text-xs text-gray-400">{doc.project.clientName}</p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-1">Uploaded By</p>
          <p className="text-gray-700">{doc.uploadedBy?.name || "—"}</p>
          <p className="text-xs text-gray-400">{doc.uploadedBy?.role || ""}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-1">Uploaded On</p>
          <p className="text-gray-700">{new Date(doc.createdAt).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-1">Last Updated</p>
          <p className="text-gray-700">{new Date(doc.updatedAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-400 mb-2">Document Link</p>
        {isRealUrl(doc.url) ? (
          <a href={doc.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-semibold bg-blue-50 px-4 py-2.5 rounded-lg w-fit transition-colors">
            <ExternalLink size={13} /> Open Document
          </a>
        ) : (
          <div className="flex items-center gap-2 text-amber-600 text-sm font-semibold bg-amber-50 px-4 py-2.5 rounded-lg w-fit border border-amber-100">
            <Clock size={13} /> Upload Pending — file not yet hosted
          </div>
        )}
      </div>
    </div>
  );
}

// ── Checklist sidebar ─────────────────────────────────────────────────────────
function UploadChecklist({ documents }) {
  const types        = Object.entries(DOC_TYPES);
  const uploadedTypes = new Set(documents.map(d => d.documentType));
  const required     = ["qc", "installation", "daily-report", "trail-qc"];
  const doneCount    = required.filter(t => uploadedTypes.has(t)).length;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle size={15} className="text-green-500" />
        <h3 className="text-sm font-bold text-gray-800">Upload Checklist</h3>
      </div>
      <div className="space-y-2">
        {types.map(([k, v]) => {
          const done       = uploadedTypes.has(k);
          const isRequired = required.includes(k);
          return (
            <div key={k} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all
              ${done ? "bg-green-50 border-green-100" : "bg-gray-50 border-gray-100"}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold
                ${done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                {done ? "✓" : "·"}
              </div>
              <div className="flex-1">
                <p className={`text-xs font-semibold ${done ? "text-green-700" : "text-gray-700"}`}>{v.label}</p>
                <p className="text-xs text-gray-400">
                  {done
                    ? `${documents.filter(d => d.documentType === k).length} uploaded`
                    : isRequired ? "Required" : "Optional"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-gray-400 font-semibold">REQUIRED</span>
          <span className="font-bold text-gray-700">{doneCount}/{required.length}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(doneCount / required.length) * 100}%`, background: "linear-gradient(90deg,#16a34a,#4ade80)" }} />
        </div>
      </div>
    </div>
  );
}

// ── Recent Documents sidebar card ─────────────────────────────────────────────
function RecentDocuments({ documents, onView }) {
  const recent = documents.slice(0, 5);
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <FileText size={15} className="text-blue-500" />
        <h3 className="text-sm font-bold text-gray-800">Recent Uploads</h3>
      </div>
      {recent.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">No documents yet</p>
      ) : (
        <div className="space-y-2">
          {recent.map(d => {
            const DT = DOC_TYPES[d.documentType] || DOC_TYPES.other;
            const SM = STATUS_META[d.status]     || STATUS_META.pending;
            const projectName = typeof d.project === "object" ? d.project?.name : null;
            return (
              <div key={d._id} onClick={() => onView(d)}
                className="p-3 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <Badge text={DT.label} colorClass={DT.color} />
                  <span className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs font-semibold text-gray-800 truncate">{d.title}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-400">{projectName || "No project"}</p>
                  <Badge text={SM.label} colorClass={SM.color} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const [documents,     setDocuments]     = useState([]);
  const [projects,      setProjects]      = useState([]);   // ← NEW
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error,         setError]         = useState(null);

  const [filterType,   setFilterType]   = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search,       setSearch]       = useState("");

  const [showCreate,    setShowCreate]    = useState(false);
  const [viewDoc,       setViewDoc]       = useState(null);
  const [editDoc,       setEditDoc]       = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);

  // ── Fetch documents ────────────────────────────────────────────────────────
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch("/documents");
      setDocuments(Array.isArray(data) ? data : data.documents ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch projects for the dropdown ───────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    try {
      const data = await apiFetch("/projects");
      setProjects(Array.isArray(data) ? data : data.projects ?? []);
    } catch {
      setProjects([]);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
    fetchProjects();
  }, [fetchDocuments, fetchProjects]);

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const handleCreate = async ({ title, documentType, projectId, files, folderFiles }) => {
     console.log("files:", files.length, "folderFiles:", folderFiles.length); //
  try {
    setActionLoading(true);
    const token = localStorage.getItem("accessToken");

    // regular files — unchanged
    if (files.length > 0) {
      const promises = files.map((f) => {
        const formData = new FormData();
        formData.append("file",         f.file);
        formData.append("title",        title);
        formData.append("documentType", documentType);
        if (projectId) formData.append("project", projectId);
        return axiosInstance.post("/documents", formData, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
      });
      await Promise.all(promises);
    }

    // folder files — new
    if (folderFiles.length > 0) {
      const formData = new FormData();
      folderFiles.forEach(f => {
        formData.append("files",         f.file);
        formData.append("relativePaths", f.name); // webkitRelativePath already stored in f.name
      });
      formData.append("documentType", documentType);
      if (projectId) formData.append("project", projectId);

      await axiosInstance.post("/documents/folder", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
    }

    setShowCreate(false);
    fetchDocuments();
  } catch (err) {
    alert(err.response?.data?.message || err.message);
  } finally {
    setActionLoading(false);
  }
};

  const handleUpdate = async (payload) => {
    try {
      setActionLoading(true);
      await apiFetch(`/documents/${editDoc._id}`, { method: "PUT", body: JSON.stringify(payload) });
      setEditDoc(null);
      fetchDocuments();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await apiFetch(`/documents/${deleteTarget._id}`, { method: "DELETE" });
      setDeleteTarget(null);
      fetchDocuments();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getProjectName = (project) => {
    if (!project) return "—";
    if (typeof project === "object") return project.name || "—";
    // It's still a raw ID — find it in our projects list
    const found = projects.find(p => p._id === project);
    return found ? found.name : "—";
  };

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = documents.filter(d => {
    if (filterType   !== "all" && d.documentType !== filterType)   return false;
    if (filterStatus !== "all" && d.status       !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      const projectName = getProjectName(d.project).toLowerCase();
      if (
        !d.title?.toLowerCase().includes(q) &&
        !projectName.includes(q) &&
        !d.uploadedBy?.name?.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    total:    documents.length,
    pending:  documents.filter(d => d.status === "pending").length,
    approved: documents.filter(d => d.status === "approved").length,
    rejected: documents.filter(d => d.status === "rejected").length,
  };

  const handleStatClick = (key) => {
    setFilterStatus(key === "total" ? "all" : prev => prev === key ? "all" : key);
  };

  return (
    <div className="space-y-5">

      {/* ── Modals ── */}
      {showCreate && (
        <Modal title="Upload Documents" onClose={() => setShowCreate(false)}>
          <UploadDocumentForm onSubmit={handleCreate} loading={actionLoading} projects={projects} />
        </Modal>
      )}

      {viewDoc && (
        <Modal title={viewDoc.title} onClose={() => setViewDoc(null)}>
          <DocumentDetail doc={viewDoc} />
        </Modal>
      )}

      {editDoc && (
        <Modal title="Edit Document" onClose={() => setEditDoc(null)}>
          <EditDocumentForm
            initial={{
              title:        editDoc.title        || "",
              documentType: editDoc.documentType || "other",
              status:       editDoc.status       || "pending",
            }}
            onSubmit={handleUpdate}
            loading={actionLoading}
          />
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Delete Document" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Delete <span className="font-semibold text-gray-800">"{deleteTarget.title}"</span>? This cannot be undone.
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
          <h2 className="text-lg font-bold text-gray-900">Document Upload</h2>
          <p className="text-sm text-gray-400 mt-0.5">Submit handover docs, trial formats & maintenance manuals</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchDocuments}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
            <Plus size={13} /> Upload Document
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
          <AlertCircle size={14} />
          <span>{error}</span>
          <button onClick={fetchDocuments} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: "total",    label: "Total",    value: stats.total,    color: "text-blue-600",  activeBg: "ring-2 ring-blue-400",  hoverBg: "hover:border-blue-300" },
          { key: "pending",  label: "Pending",  value: stats.pending,  color: "text-amber-600", activeBg: "ring-2 ring-amber-400", hoverBg: "hover:border-amber-300" },
          { key: "approved", label: "Approved", value: stats.approved, color: "text-green-600", activeBg: "ring-2 ring-green-400", hoverBg: "hover:border-green-300" },
          { key: "rejected", label: "Rejected", value: stats.rejected, color: "text-red-500",   activeBg: "ring-2 ring-red-400",   hoverBg: "hover:border-red-300" },
        ].map(s => {
          const isActive = s.key === "total" ? filterStatus === "all" : filterStatus === s.key;
          return (
            <button key={s.key} onClick={() => handleStatClick(s.key)}
              className={`bg-white rounded-xl border shadow-sm p-4 text-center transition-all cursor-pointer
                ${isActive ? `border-transparent ${s.activeBg} shadow-md` : `border-gray-100 ${s.hoverBg} hover:shadow-md`}`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              {isActive && <p className={`text-xs font-semibold mt-1 ${s.color}`}>● Active</p>}
            </button>
          );
        })}
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Document Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-100">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search documents…"
              className="flex-1 min-w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
              <option value="all">All Types</option>
              {Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Loading documents…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <FolderOpen size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                {documents.length === 0 ? "No documents yet. Upload the first one!" : "No documents match your filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Title", "Type", "Project", "Uploaded By", "Status", "Date", "Actions"].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 px-5 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(d => {
                    const DT = DOC_TYPES[d.documentType] || DOC_TYPES.other;
                    const SM = STATUS_META[d.status]     || STATUS_META.pending;
                    return (
                      <tr key={d._id} className="hover:bg-gray-50/60 transition-colors group">
                        <td className="px-5 py-3.5 font-semibold text-gray-800 max-w-[160px] truncate">{d.title}</td>
                        <td className="px-5 py-3.5"><Badge text={DT.label} colorClass={DT.color} /></td>
                        <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{getProjectName(d.project)}</td>
                        <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{d.uploadedBy?.name || "—"}</td>
                        <td className="px-5 py-3.5"><Badge text={SM.label} colorClass={SM.color} /></td>
                        <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">
                          {new Date(d.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setViewDoc(d)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="View">
                              <Eye size={13} />
                            </button>
                            {isRealUrl(d.url) ? (
                              <a href={d.url} target="_blank" rel="noopener noreferrer"
                                className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors" title="Open Document">
                                <ExternalLink size={13} />
                              </a>
                            ) : (
                              <span className="p-1.5 rounded-lg text-gray-200 cursor-not-allowed" title="File not yet uploaded">
                                <ExternalLink size={13} />
                              </span>
                            )}
                            <button onClick={() => setEditDoc(d)}
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors" title="Edit">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => setDeleteTarget(d)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
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
              Showing {filtered.length} of {documents.length} documents
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <UploadChecklist documents={documents} />
          <RecentDocuments documents={documents} onView={setViewDoc} />
        </div>
      </div>
    </div>
  );
}