"use client";
import { useState, useEffect, useCallback, use } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Briefcase,
  Phone,
  Users,
  FileText,
  Upload,
  Trash2,
  Eye,
  Download,
  X,
  Loader,
  CheckCircle2,
  Image as ImageIcon,
  File,
  Search,
  Filter,
  Grid,
  List,
  ChevronDown,
  Clock,
  Shield,
  FolderOpen,
} from "lucide-react";
import ProjectAnalytics from "../director/ProjectAnalytics";

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api-synergy.nexcorealliance.com/api/v1";

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

const authJsonHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// ── API ────────────────────────────────────────────────────────────────────
const api = {
  async getProject(id) {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      headers: authJsonHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load project");
    return data;
  },
  async getProjectFiles(projectId) {
    const res = await fetch(`${API_BASE}/project-files/${projectId}/files`, {
      headers: authJsonHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load files");
    return Array.isArray(data) ? data : [];
  },
  async uploadFiles(projectId, formData) {
    const res = await fetch(`${API_BASE}/project-files/${projectId}/files`, {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to upload files");
    return data.files;
  },
  async deleteFile(fileId) {
    const res = await fetch(`${API_BASE}/project-files/files/${fileId}`, {
      method: "DELETE",
      headers: authJsonHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete file");
  },
  async uploadFolder(projectId, formData) {
    const res = await fetch(
      `${API_BASE}/project-files/${projectId}/files/folder`,
      {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      },
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to upload folder");
    return data.files;
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  initiated: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    dot: "bg-slate-400",
  },
  "in-progress": {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    dot: "bg-emerald-500",
  },
  installation: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-500" },
  testing: {
    bg: "bg-violet-50",
    text: "text-violet-600",
    dot: "bg-violet-500",
  },
  completed: { bg: "bg-green-50", text: "text-green-600", dot: "bg-green-500" },
  "on-hold": { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500" },
};

const STATUS_PROGRESS = {
  initiated: 5,
  "in-progress": 40,
  installation: 65,
  testing: 80,
  completed: 100,
  "on-hold": 30,
};

const formatStatus = (s) =>
  s ? s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—";

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const resolveName = (field) => {
  if (!field) return null;
  if (typeof field === "object") return field.name || field.email || null;
  return null;
};

const getFileIcon = (type) => {
  if (type === "image")
    return <ImageIcon size={18} className="text-pink-500" />;
  return <File size={18} className="text-red-500" />;
};

const isImageFile = (url) => {
  const ext = url?.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext);
};

// Returns a complete URL since the backend stores relative paths like 'uploads/...'
// Automatically strips out "undefined/" corrupted prefixes from previous uploads.
const getFileUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;

  const cleanUrl = url.replace(/^undefined\//, "").replace(/^\/+/, "");

  // Fallback to ensuring the API absolute base URL prepends the static files
  const base = API_BASE.replace("/api/v1", "");
  return `${base}/${cleanUrl}`;
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function ProjectDetail({ params }) {
  // Gracefully handle NextJS 13 params which is synchronous but might be a promise in NextJS 15
  const projectId = params?.id || (params && typeof params.then === 'function' && use(params).id) || null;
  const router = useRouter();
  const pathname = usePathname();
  const backPath = pathname.includes("/director/")
    ? "/director/project"
    : "/admin/project";

  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [preview, setPreview] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadMode, setUploadMode] = useState("files"); // "files" | "folder"

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Load data ───────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [proj, filesData] = await Promise.all([
        api.getProject(projectId),
        api.getProjectFiles(projectId),
      ]);
      setProject(proj);
      setFiles(filesData);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Upload ──────────────────────────────────────────────────────────────────
  const handleUpload = async (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(selectedFiles).forEach((f) => formData.append("files", f));
      const uploaded = await api.uploadFiles(projectId, formData);
      setFiles((prev) => [...(uploaded || []), ...prev]);
      showToast(`${selectedFiles.length} file(s) uploaded successfully`);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setUploading(false);
    }
  };
  const handleFolderInput = async (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(selectedFiles).forEach((f) => {
        formData.append("files", f);
        formData.append("relativePaths", f.webkitRelativePath || f.name);
      });
      const uploaded = await api.uploadFolder(projectId, formData);
      setFiles((prev) => [...(uploaded || []), ...prev]);
      showToast(`${selectedFiles.length} file(s) uploaded from folder`);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e) => handleUpload(e.target.files);

  // Drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleUpload(e.dataTransfer.files);
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (fileId) => {
    if (!confirm("Delete this file? This cannot be undone.")) return;
    try {
      await api.deleteFile(fileId);
      setFiles((prev) => prev.filter((f) => f._id !== fileId));
      showToast("File deleted");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ── Filter files ────────────────────────────────────────────────────────────
  const filteredFiles = files.filter((f) => {
    if (filterType !== "all" && f.fileType !== filterType) return false;
    if (
      searchQuery &&
      !f.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const pdfCount = files.filter((f) => f.fileType === "pdf").length;
  const imageCount = files.filter((f) => f.fileType === "image").length;

  // ── Loading State ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-gray-400 font-medium">
            Loading project details…
          </p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center space-y-3">
          <p className="text-4xl">😵</p>
          <p className="text-sm font-semibold text-gray-500">
            Project not found
          </p>
          <button
            onClick={() => router.push(backPath)}
            className="text-xs text-blue-600 hover:underline"
          >
            ← Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const progress = STATUS_PROGRESS[project.status] ?? 0;
  const statusStyle = STATUS_STYLE[project.status] || STATUS_STYLE["initiated"];

  return (
    <div className="space-y-6 pb-10">
      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] flex items-center gap-2 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-sm transition-all ${toast.type === "error" ? "bg-red-500/95" : "bg-emerald-500/95"}`}
        >
          <CheckCircle2 size={15} />
          {toast.msg}
        </div>
      )}

      {/* ── Preview Modal ── */}
      {preview && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
              <p className="text-sm font-bold text-gray-700 truncate">
                {preview.fileName}
              </p>
              <div className="flex items-center gap-2">
                {/* <a
                  href={preview.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-500"
                >
                  <Download size={16} />
                </a> */}
                <button
                  onClick={() => setPreview(null)}
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-500"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div
              className="flex items-center justify-center bg-gray-100 p-4 overflow-auto"
              style={{ maxHeight: "80vh" }}
            >
              {preview.fileType === "image" ? (
                <img
                  src={getFileUrl(preview.url)}
                  alt={preview.fileName}
                  className="max-w-full max-h-[75vh] object-contain rounded-lg shadow"
                />
              ) : (
                <embed
  src={`${getFileUrl(preview.url)}#toolbar=0`}
  type="application/pdf"
  className="w-full rounded-lg shadow bg-white"
  style={{ height: "75vh" }}
/>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(backPath)}
          className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all hover:shadow-sm"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[#0F2854]">
            {project.projectId && (
              <span className="text-blue-600 mr-2 border-r border-[#0F2854]/20 pr-2">
                {project.projectId}
              </span>
            )}
            {project.name}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Project Details & Files
          </p>
        </div>
      </div>

      {/* ── Project Info Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Status bar at top */}
        <div
          className="h-1.5"
          style={{
            background: `linear-gradient(90deg, ${progress === 100 ? "#16a34a" : "#1C4D8D"} ${progress}%, #f1f5f9 ${progress}%)`,
          }}
        />

        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}
                />
                {formatStatus(project.status)}
              </span>
              <span className="text-xs text-gray-400 font-medium">
                {progress}% Complete
              </span>
            </div>
            {project.phase && (
              <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
                <Shield size={10} className="inline mr-1" />
                {project.phase}
              </span>
            )}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoItem
              icon={<Briefcase size={14} className="text-blue-500" />}
              label="Client"
              value={project.clientName}
            />
            {project.clientContact && (
              <InfoItem
                icon={<Phone size={14} className="text-green-500" />}
                label="Contact"
                value={project.clientContact}
              />
            )}
            {project.location && (
              <InfoItem
                icon={<MapPin size={14} className="text-red-400" />}
                label="Location"
                value={project.location}
              />
            )}
            <InfoItem
              icon={<Calendar size={14} className="text-blue-500" />}
              label="Start Date"
              value={formatDate(project.startDate)}
            />
            {project.endDate && (
              <InfoItem
                icon={<Calendar size={14} className="text-orange-500" />}
                label="End Date"
                value={formatDate(project.endDate)}
              />
            )}
            {resolveName(project.assignedMarketingExecutive) && (
              <InfoItem
                icon={<User size={14} className="text-purple-500" />}
                label="Marketing Exec"
                value={resolveName(project.assignedMarketingExecutive)}
              />
            )}
            {resolveName(project.assignedInstallationIncharge) && (
              <InfoItem
                icon={<User size={14} className="text-indigo-500" />}
                label="Installation Incharge"
                value={resolveName(project.assignedInstallationIncharge)}
              />
            )}
            {project.assignedEngineers?.length > 0 && (
              <InfoItem
                icon={<Users size={14} className="text-teal-500" />}
                label="Engineers"
                value={
                  project.assignedEngineers
                    ?.map((e) => resolveName(e))
                    .filter(Boolean)
                    .join(", ") || "—"
                }
              />
            )}
            {resolveName(project.createdBy) && (
              <InfoItem
                icon={<User size={14} className="text-gray-500" />}
                label="Created By"
                value={resolveName(project.createdBy)}
              />
            )}
          </div>

          {project.description && (
            <div className="mt-5 p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1.5">
                Description
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {project.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Project Live Analytics (Injected) ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <ProjectAnalytics projectId={project._id} project={project} />
      </div>

      {/* ── Files Section ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#0F2854]">
                Project Files
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {files.length} file{files.length !== 1 ? "s" : ""}
                {pdfCount > 0 && (
                  <span className="ml-1">
                    · {pdfCount} PDF{pdfCount !== 1 ? "s" : ""}
                  </span>
                )}
                {imageCount > 0 && (
                  <span className="ml-1">
                    · {imageCount} Image{imageCount !== 1 ? "s" : ""}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Files toggle */}
              <label
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow cursor-pointer hover:opacity-90 transition-all ${uploadMode === "files" ? "text-white" : "text-[#0F2854] bg-white border border-[#0F2854]/20"}`}
                style={uploadMode === "files" ? { background: "#0F2854" } : {}}
              >
                {uploading && uploadMode === "files" ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
                {uploading && uploadMode === "files"
                  ? "Uploading…"
                  : "Upload Files"}
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp"
                  className="hidden"
                  onChange={handleFileInput}
                  disabled={uploading}
                />
              </label>

              {/* Folder toggle */}
              <label
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow cursor-pointer hover:opacity-90 transition-all ${uploadMode === "folder" ? "text-white" : "text-[#0F2854] bg-white border border-[#0F2854]/20"}`}
                style={uploadMode === "folder" ? { background: "#0F2854" } : {}}
                onClick={() => setUploadMode("folder")}
              >
                {uploading && uploadMode === "folder" ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <FolderOpen size={14} />
                )}
                {uploading && uploadMode === "folder"
                  ? "Uploading…"
                  : "Upload Folder"}
                <input
                  type="file"
                  className="hidden"
                  multiple
                  ref={(el) => {
                    if (el) el.setAttribute("webkitdirectory", "");
                  }}
                  onChange={handleFolderInput}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
              />
              <input
                type="text"
                placeholder="Search files…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 transition-colors text-gray-700 placeholder-gray-300"
              />
            </div>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-2 text-xs font-semibold transition-colors ${filterType === "all" ? "bg-[#0F2854] text-white" : "text-gray-500 hover:bg-gray-50"}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType("pdf")}
                className={`px-3 py-2 text-xs font-semibold transition-colors border-x border-gray-200 ${filterType === "pdf" ? "bg-[#0F2854] text-white" : "text-gray-500 hover:bg-gray-50"}`}
              >
                PDFs
              </button>
              <button
                onClick={() => setFilterType("image")}
                className={`px-3 py-2 text-xs font-semibold transition-colors ${filterType === "image" ? "bg-[#0F2854] text-white" : "text-gray-500 hover:bg-gray-50"}`}
              >
                Images
              </button>
            </div>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors ${viewMode === "grid" ? "bg-[#0F2854] text-white" : "text-gray-400 hover:bg-gray-50"}`}
              >
                <Grid size={14} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 transition-colors border-l border-gray-200 ${viewMode === "list" ? "bg-[#0F2854] text-white" : "text-gray-400 hover:bg-gray-50"}`}
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Drag & Drop zone */}
        <div
          className={`mx-5 mt-4 rounded-xl border-2 border-dashed transition-all ${dragActive ? "border-blue-400 bg-blue-50/50" : "border-gray-200 bg-gray-50/50"}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Upload
              size={24}
              className={`mb-2 ${dragActive ? "text-blue-500" : "text-gray-300"}`}
            />
            <p className="text-xs text-gray-400">
              {dragActive
                ? "Drop files here…"
                : "Drag & drop files here, or click Upload button above"}
            </p>
            <p className="text-[10px] text-gray-300 mt-1">
              PDF, JPG, PNG, GIF, WebP, SVG (Max 10MB each)
            </p>
          </div>
        </div>

        {/* Files display */}
        <div className="p-5">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={36} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm font-semibold text-gray-400">
                {files.length === 0
                  ? "No files uploaded yet"
                  : "No files match your filter"}
              </p>
              <p className="text-xs text-gray-300 mt-1">
                {files.length === 0
                  ? "Upload PDFs or images to get started"
                  : "Try changing your search or filter"}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredFiles?.map((file) => (
                <FileGridCard
                  key={file._id}
                  file={file}
                  onPreview={() => {
                    const isPreviewable = file.fileType === "image" || file.fileType === "pdf" || file.fileName?.toLowerCase().endsWith(".pdf");
                    if (isPreviewable) {
                      setPreview(file);
                    } else {
                      showToast("Preview not available for this file type. Downloads are disabled.", "error");
                    }
                  }}
                  onDelete={() => handleDelete(file._id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles?.map((file) => (
                <FileListRow
                  key={file._id}
                  file={file}
                  onPreview={() => {
                    const isPreviewable = file.fileType === "image" || file.fileName?.toLowerCase().endsWith(".pdf");
                    if (isPreviewable) {
                      setPreview(file);
                    } else {
                      showToast("Preview not available for this file type. Downloads are disabled.", "error");
                    }
                  }}
                  onDelete={() => handleDelete(file._id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 p-3 bg-gray-50/70 rounded-xl">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          {label}
        </p>
        <p className="text-sm font-medium text-gray-700 truncate">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function FileGridCard({ file, onPreview, onDelete }) {
  return (
    <div className="group relative bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-blue-200 hover:shadow-md transition-all">
      {/* Preview area */}
      <div
        className="relative aspect-[4/3] bg-gray-50 flex items-center justify-center cursor-pointer overflow-hidden"
        onClick={onPreview}
      >
        {file.fileType === "image" ? (
          <img
            src={getFileUrl(file.url)}
            alt={file.fileName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-14 rounded-lg bg-red-50 flex items-center justify-center">
              <FileText size={24} className="text-red-400" />
            </div>
            <span className="text-[10px] text-gray-400 font-medium">PDF</span>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Eye size={24} className="text-white drop-shadow-lg" />
          </div>
        </div>
      </div>
      {/* Info */}
      <div className="p-2.5">
        <p
          className="text-xs font-semibold text-gray-700 truncate"
          title={file.fileName}
        >
          {file.fileName}
        </p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="flex items-center gap-1 text-[10px] text-gray-400">
            <Clock size={9} />
            {formatDateTime(file.createdAt).split(",")[0]}
          </span>
          {/* <div className="flex items-center gap-1">
            <a
              href={getFileUrl(file.url)}
              target="_blank"
              rel="noreferrer"
              className="p-1 rounded text-gray-300 hover:text-blue-500 transition-colors"
            >
              <Download size={12} />
            </a>
            <button
              onClick={onDelete}
              className="p-1 rounded text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
}

function FileListRow({ file, onPreview, onDelete }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all group">
      {/* Thumbnail */}
      <div
        className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
        onClick={onPreview}
      >
        {file.fileType === "image" ? (
          <img
            src={getFileUrl(file.url)}
            alt={file.fileName}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <FileText size={20} className="text-red-400" />
        )}
      </div>
      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-700 truncate">
          {file.fileName}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          <span
            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${file.fileType === "image" ? "bg-pink-50 text-pink-500" : "bg-red-50 text-red-500"}`}
          >
            {file.fileType}
          </span>
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Clock size={9} /> {formatDateTime(file.createdAt)}
          </span>
          {file.uploadedBy && (
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <User size={9} /> {file.uploadedBy.name || file.uploadedBy.email}
            </span>
          )}
        </div>
      </div>
      {/* Actions */}
      {/* <div className="flex items-center gap-1">
        <button
          onClick={onPreview}
          className="p-2 rounded-lg text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
        >
          <Eye size={14} />
        </button>
        <a
          href={getFileUrl(file.url)}
          target="_blank"
          rel="noreferrer"
          className="p-2 rounded-lg text-gray-300 hover:text-green-600 hover:bg-green-50 transition-all"
        >
          <Download size={14} />
        </a>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div> */}
    </div>
  );
}
