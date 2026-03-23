"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { FileText, Upload, Trash2, Eye, CheckCircle, Send, ClipboardCheck, FolderKanban, Check, MessageSquare ,FolderOpen} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const api = axios.create({ baseURL: API });
api.interceptors.request.use(config => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const DOC_TYPES = [
  {
    key: "handover",
    title: "Design Handover Acknowledgement",
    subtitle: "Signed design handover sheets from client",
    icon: ClipboardCheck,
    accept: ".pdf,.doc,.docx",
    docType: "other",
    color: "text-brand-mid",
    bg: "bg-brand-mid/8",
    border: "border-brand-mid/25",
    required: true,
  },
  {
    key: "erp",
    title: "ERP Material Confirmation",
    subtitle: "ERP-generated material approval sheets",
    icon: FolderKanban,
    accept: ".pdf,.xlsx,.xls",
    docType: "reference",
    color: "text-emerald-600",
    bg: "bg-emerald-500/8",
    border: "border-emerald-500/25",
    required: true,
  },
  {
    key: "comms",
    title: "Client Communication Logs",
    subtitle: "Email threads, meeting minutes, approvals",
    icon: MessageSquare,
    accept: ".pdf,.doc,.docx,.eml,.msg",
    docType: "other",
    color: "text-orange-500",
    bg: "bg-orange-500/8",
    border: "border-orange-500/25",
    required: false,
  },
];

const TYPE_STYLE = {
  "other":        "text-brand-mid bg-brand-mid/8 border-brand-mid/25",
  "reference":    "text-emerald-600 bg-emerald-500/8 border-emerald-500/25",
  "qc":           "text-orange-500 bg-orange-500/8 border-orange-500/25",
  "installation": "text-blue-500 bg-blue-500/8 border-blue-500/25",
  "daily-report": "text-purple-500 bg-purple-500/8 border-purple-500/25",
  "trail-qc":     "text-red-500 bg-red-500/8 border-red-500/25",
};

const STATUS_STYLE = {
  pending:  "text-orange-500 bg-orange-500/8 border-orange-500/25",
  approved: "text-emerald-600 bg-emerald-500/8 border-emerald-500/25",
  rejected: "text-red-500 bg-red-500/8 border-red-500/25",
};

export default function DocumentsPage() {
  const [project,      setProject]      = useState("");
  const [projects,     setProjects]     = useState([]);
  const [date,         setDate]         = useState(new Date().toISOString().split("T")[0]);
  const [uploads,      setUploads]      = useState({ handover: [], erp: [], comms: [] });
  const [notes,        setNotes]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [progress,     setProgress]     = useState(0);
  const [existingDocs, setExistingDocs] = useState([]);
  const [docsLoading,  setDocsLoading]  = useState(false);
const [folderUploads, setFolderUploads] = useState({ handover: [], erp: [], comms: [] });

const addFolder = key => e => {
  const files = Array.from(e.target.files); // all files from folder
  setFolderUploads(u => ({ ...u, [key]: [...u[key], ...files] }));
};

const removeFolderFile = (key, name) =>
  setFolderUploads(u => ({ ...u, [key]: u[key].filter(f => f.name !== name) }));

  // Fetch projects
  useEffect(() => {
    api.get("/projects")
      .then(res => {
        const data = res.data?.data || res.data?.projects || res.data;
        if (Array.isArray(data)) setProjects(data);
      })
      .catch(console.error);
  }, []);

  // Fetch docs when project changes
  useEffect(() => {
    if (!project) return setExistingDocs([]);
    setDocsLoading(true);
    api.get(`/documents?project=${project}`)
      .then(res => {
        const data = res.data?.data || res.data;
        if (Array.isArray(data)) setExistingDocs(data);
      })
      .catch(console.error)
      .finally(() => setDocsLoading(false));
  }, [project]);

  const refreshDocs = () => {
    if (!project) return;
    api.get(`/documents?project=${project}`)
      .then(res => {
        const data = res.data?.data || res.data;
        if (Array.isArray(data)) setExistingDocs(data);
      })
      .catch(console.error);
  };

  const addFiles   = key => e => {
    const files = Array.from(e.target.files);
    setUploads(u => ({ ...u, [key]: [...u[key], ...files] }));
  };
  const removeFile = (key, name) =>
    setUploads(u => ({ ...u, [key]: u[key].filter(f => f.name !== name) }));

  const totalFiles   = Object.values(uploads).flat().length + Object.values(folderUploads).flat().length;
const requiredDone = DOC_TYPES.filter(d => d.required).every(d => uploads[d.key].length > 0 || folderUploads[d.key].length > 0);

  const handleSubmit = async () => {
  setLoading(true);
  setError("");
  setProgress(0);
  try {
    let done = 0;

    // existing single file uploads (unchanged)
    for (const dt of DOC_TYPES) {
      for (const file of uploads[dt.key]) {
        const formData = new FormData();
        formData.append("file",         file);
        formData.append("title",        `${dt.title} — ${file.name}`);
        formData.append("documentType", dt.docType);
        formData.append("project",      project);
        if (notes) formData.append("notes", notes);

        await api.post("/documents", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        done++;
        setProgress(Math.round((done / totalFiles) * 100));
      }
    }

    // new folder uploads — sent in one batch per doc type
    for (const dt of DOC_TYPES) {
      if (folderUploads[dt.key].length === 0) continue;

      const formData = new FormData();
      folderUploads[dt.key].forEach(file => {
        formData.append("files", file);
        formData.append("relativePaths", file.webkitRelativePath || file.name); // 👈 key part
      });
      formData.append("documentType", dt.docType);
      formData.append("project",      project);

      await api.post("/documents/folder", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      done += folderUploads[dt.key].length;
      setProgress(Math.round((done / totalFiles) * 100));
    }

    // reset both
    setUploads({ handover: [], erp: [], comms: [] });
    setFolderUploads({ handover: [], erp: [], comms: [] });
    setNotes("");
    setProgress(0);
    refreshDocs();
  } catch (err) {
    setError(err.response?.data?.message || err.message || "Upload failed");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="animate-fadeUp">
      <div className="mb-7">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[2px] text-brand-mid">Marketing</p>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-darkest">Document Upload</h1>
        <p className="mt-1 text-[13px] text-brand-mid">Submit design handover, ERP confirmation, and client communication logs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-4">

          {/* Project + Date */}
          <div className="rounded-2xl bg-white shadow-sm p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-dark mb-1.5">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  value={project} onChange={e => setProject(e.target.value)}
                  className="w-full bg-slate-50 rounded-xl px-3.5 py-2.5 text-[13px] text-brand-darkest outline-none focus:ring-2 focus:ring-brand-mid/15 transition-all cursor-pointer"
                >
                  <option value="">Select project</option>
                  {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-dark mb-1.5">
                  Submission Date
                </label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full bg-slate-50 rounded-xl px-3.5 py-2.5 text-[13px] text-brand-darkest outline-none focus:ring-2 focus:ring-brand-mid/15 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Upload zones */}
          {DOC_TYPES.map(dt => (
            <div key={dt.key} className="rounded-2xl bg-white shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-9 h-9 rounded-[10px] ${dt.bg} flex items-center justify-center shrink-0`}>
                  <dt.icon size={18} className={dt.color} strokeWidth={1.5} />
                </div>
                <div>
                  <div className={`font-display font-bold text-[13px] ${dt.color}`}>
                    {dt.title}{dt.required && <span className="text-red-500 ml-1">*</span>}
                  </div>
                  <div className="text-brand-mid text-[11px]">{dt.subtitle}</div>
                </div>
              </div>

              <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 cursor-pointer hover:bg-slate-50 transition-all"
                style={{ borderColor: "rgba(73,136,196,0.25)" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(73,136,196,0.5)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(73,136,196,0.25)"}
              >
                <Upload size={20} className={dt.color} strokeWidth={1.5} />
                <span className={`text-[12px] font-semibold ${dt.color}`}>Click to browse files</span>
                <span className="text-brand-mid text-[11px]">{dt.accept} accepted · drag & drop</span>
                <input type="file" accept={dt.accept} multiple className="hidden" onChange={addFiles(dt.key)} />
              </label>
              <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 cursor-pointer hover:bg-slate-50 transition-all mt-2"
  style={{ borderColor: "rgba(73,136,196,0.25)" }}
  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(73,136,196,0.5)"}
  onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(73,136,196,0.25)"}
>
  <FolderOpen size={15} className={dt.color} strokeWidth={1.5} />
  <span className={`text-[12px] font-semibold ${dt.color}`}>Upload a folder</span>
  <input
    type="file"
    className="hidden"
    webkitdirectory=""   
    multiple
    onChange={addFolder(dt.key)}
  />
</label>

{/* folder files list */}
{folderUploads[dt.key].length > 0 && (
  <div className="mt-3 space-y-2">
    {folderUploads[dt.key].map(f => (
      <div key={f.webkitRelativePath || f.name} className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 ${dt.bg} border ${dt.border}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <FileText size={13} className={dt.color} />
          <div className="min-w-0">
            <div className="text-brand-darkest text-[12px] font-semibold truncate">
              {f.webkitRelativePath || f.name}  {/* shows full path */}
            </div>
            <div className="text-brand-mid text-[10px]">{(f.size / 1024).toFixed(0)} KB</div>
          </div>
        </div>
        <button onClick={() => removeFolderFile(dt.key, f.name)} className="text-red-400 hover:text-red-600 transition-colors p-1">
          <Trash2 size={12} />
        </button>
      </div>
    ))}
  </div>
)}

              {uploads[dt.key].length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploads[dt.key].map(f => (
                    <div key={f.name} className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 ${dt.bg} border ${dt.border}`}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText size={13} className={dt.color} />
                        <div className="min-w-0">
                          <div className="text-brand-darkest text-[12px] font-semibold truncate">{f.name}</div>
                          <div className="text-brand-mid text-[10px]">{(f.size / 1024).toFixed(0)} KB</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => window.open(URL.createObjectURL(f), "_blank")}
                          className={`${dt.color} hover:opacity-70 transition-opacity p-1`}>
                          <Eye size={12} />
                        </button>
                        <button onClick={() => removeFile(dt.key, f.name)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Notes */}
          <div className="rounded-2xl bg-white shadow-sm p-5">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-dark mb-1.5">
              Submission Notes
            </label>
            <textarea
              rows={3} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Any notes or context for this document batch…"
              className="w-full bg-slate-50 rounded-xl px-3.5 py-2.5 text-[13px] text-brand-darkest outline-none resize-none placeholder-slate-300 focus:ring-2 focus:ring-brand-mid/15 transition-all"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600 font-semibold">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="rounded-2xl bg-gradient-to-br from-brand-bg to-brand-mid/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-brand-darkest font-bold text-[14px]">Ready to Submit</div>
              <div className="text-brand-mid text-[12px] mt-0.5">
                {totalFiles} file(s) · {projects.find(p => p._id === project)?.name || "no project selected"}
              </div>
              {loading && (
                <div className="mt-2 h-1.5 w-48 rounded-full bg-brand-mid/15">
                  <div className="h-1.5 rounded-full bg-brand-mid transition-all duration-300"
                    style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!project || !requiredDone || loading}
              className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white px-5 py-2.5 text-[13px] font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center gap-2 shrink-0"
            >
              {loading
                ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading {progress}%</>
                : <><Send size={13} /> Submit Documents</>}
            </button>
          </div>

          {/* Existing Docs for selected project */}
          {project && (
            <div className="rounded-2xl bg-white shadow-sm p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-brand-darkest to-brand-dark flex items-center justify-center shrink-0">
                  <FileText size={14} className="text-brand-light" />
                </div>
                <div className="font-display font-bold text-[14px] text-brand-darkest flex items-center gap-2">
                  Uploaded Documents
                  {existingDocs.length > 0 && (
                    <span className="text-[11px] font-semibold text-brand-mid bg-brand-mid/10 px-2 py-0.5 rounded-full">
                      {existingDocs.length}
                    </span>
                  )}
                </div>
              </div>

              {docsLoading ? (
                <p className="text-brand-mid text-[13px]">Loading documents…</p>
              ) : existingDocs.length === 0 ? (
                <p className="text-brand-mid text-[13px]">No documents uploaded for this project yet.</p>
              ) : (
                <div className="space-y-2">
                  {existingDocs.map(doc => (
                    <div key={doc._id} className="flex items-center justify-between gap-3 rounded-xl px-3.5 py-3 bg-slate-50 border border-brand-mid/10">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText size={14} className="text-brand-mid shrink-0" />
                        <div className="min-w-0">
                          <div className="text-brand-darkest text-[12px] font-bold truncate">{doc.title}</div>
                          <div className="text-brand-mid text-[10px] mt-0.5">
                            {doc.uploadedBy?.name || "—"} · {new Date(doc.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TYPE_STYLE[doc.documentType] || TYPE_STYLE["other"]}`}>
                          {doc.documentType}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[doc.status]}`}>
                          {doc.status}
                        </span>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer"
                          className="text-brand-mid hover:text-brand-darkest transition-colors p-1">
                          <Eye size={13} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Checklist */}
        <div>
          <div className="rounded-2xl bg-white shadow-sm p-5 lg:sticky lg:top-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-brand-darkest to-brand-dark flex items-center justify-center shrink-0">
                <CheckCircle size={14} className="text-brand-light" />
              </div>
              <div className="font-display font-bold text-[14px] text-brand-darkest">Upload Checklist</div>
            </div>
            <div className="space-y-3">
              {DOC_TYPES.map(dt => {
                const done = uploads[dt.key].length > 0;
                return (
                  <div key={dt.key} className={`flex items-start gap-3 rounded-xl p-3 border transition-all ${done ? "bg-emerald-500/6 border-emerald-500/25" : "bg-brand-bg/50 border-brand-mid/10"}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${done ? "bg-emerald-500" : "bg-brand-mid/15"}`}>
                      {done ? <Check size={12} className="text-white" /> : <dt.icon size={11} className="text-brand-mid" />}
                    </div>
                    <div className="min-w-0">
                      <div className={`text-[12px] font-bold truncate ${done ? "text-emerald-600" : "text-brand-darkest"}`}>{dt.title}</div>
                      <div className="text-[10px] text-brand-mid mt-0.5">
                        {done ? `${uploads[dt.key].length} file(s) ready` : dt.required ? "Required" : "Optional"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5">
              <div className="flex justify-between text-[11px] font-semibold mb-1.5">
                <span className="text-brand-mid uppercase tracking-[0.4px]">Completion</span>
                <span className="text-brand-darkest">{DOC_TYPES.filter(d => uploads[d.key].length > 0).length}/{DOC_TYPES.length}</span>
              </div>
              <div className="h-1.5 rounded-full bg-brand-mid/12">
                <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-brand-mid transition-all duration-500"
                  style={{ width: `${(DOC_TYPES.filter(d => uploads[d.key].length > 0).length / DOC_TYPES.length) * 100}%` }} />
              </div>
            </div>

            {/* Project doc count */}
            {project && (
              <div className="mt-4 pt-4 border-t border-brand-mid/10">
                <div className="text-[11px] font-semibold text-brand-mid uppercase tracking-[0.4px] mb-1">Project Documents</div>
                <div className="font-display text-xl font-extrabold text-brand-darkest">{existingDocs.length}</div>
                <div className="text-[10px] text-brand-mid mt-0.5">total uploaded</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}