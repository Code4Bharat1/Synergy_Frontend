"use client";
import { useState, useEffect, useCallback } from "react";
import { FileText, CheckCircle2, XCircle, Clock, Eye, Download, Search, Loader } from "lucide-react";

// Config
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const getToken = () => typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// API calls
const api = {
  async getAll() {
    const res = await fetch(`${API_BASE}/documents`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load documents");
    return Array.isArray(data) ? data : (data.documents || []);
  },
  async verifyDocument(id) {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: "PUT", headers: authHeaders(), body: JSON.stringify({ status: "approved" })
    });
    if (!res.ok) throw new Error("Failed to verify document");
    return res.json();
  }
};

const STATUS_CONFIG = {
  approved: { cls: "bg-green-50 text-green-600", icon: CheckCircle2 },
  rejected: { cls: "bg-red-50 text-red-500", icon: XCircle },
  pending: { cls: "bg-amber-50 text-amber-600", icon: Clock },
};

const TYPE_COLORS = {
  Handover: "bg-blue-50 text-blue-600",
  "As-Built": "bg-purple-50 text-purple-600",
  Checklist: "bg-teal-50 text-teal-600",
  "QC Report": "bg-lightblue text-extra-blue",
  Certification: "bg-amber-50 text-amber-600",
  Safety: "bg-red-50 text-red-500",
  default: "bg-gray-50 text-gray-500",
};

// ── Completeness By Project ────────────────────────────────────────────────────────
function CompletenessByProject({ docs }) {
  const projects = [...new Set(docs.map(d => d.project?.name || d.project || "Unknown"))];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {projects.map(proj => {
        const pd = docs.filter(d => (d.project?.name || d.project || "Unknown") === proj);
        const completeCount = pd.filter(d => d.status === "approved").length;
        const pct = pd.length > 0 ? Math.round((completeCount / pd.length) * 100) : 0;
        return (
          <div key={proj} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-bold text-extra-darkblue truncate">{proj}</p>
            <div className="flex justify-between text-xs mt-2 mb-1.5">
              <span className="text-gray-400">{completeCount}/{pd.length} approved</span>
              <span className={`font-bold ${pct === 100 ? "text-green-600" : pct >= 50 ? "text-amber-500" : "text-red-500"}`}>{pct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: pct === 100 ? "#16a34a" : pct >= 50 ? "#d97706" : "#ef4444" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Mobile Doc Card ───────────────────────────────────────────────────────────
function DocCard({ doc, onVerify, verifyingId }) {
  const statusKey = doc.status || "pending";
  const s = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
  const StatusIcon = s.icon;
  const projectName = doc.project?.name || doc.project || "Unknown";
  const uploaderName = doc.uploadedBy?.name || doc.uploadedBy?.email || "Unknown";
  const typeColor = TYPE_COLORS[doc.documentType] || TYPE_COLORS.default;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
          <FileText size={16} className="text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-extra-darkblue leading-snug line-clamp-2">{doc.title || doc.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{projectName}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeColor}`}>{doc.documentType}</span>
        <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${s.cls}`}>
          <StatusIcon size={10} /> {statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-50">
        <span>by {uploaderName} · {new Date(doc.createdAt).toLocaleDateString()}</span>
        <span>{doc.size || "- MB"}</span>
      </div>

      <div className="flex gap-2">
        {doc.url && (
          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center py-2 rounded-lg text-xs font-semibold text-extra-blue bg-lightblue/40 hover:bg-lightblue transition-colors">
            <Eye size={13} className="mr-1.5" /> View
          </a>
        )}
        {statusKey === 'pending' ? (
          <button onClick={() => onVerify(doc._id)} disabled={verifyingId === doc._id}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50">
            {verifyingId === doc._id ? <Loader size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Approve
          </button>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-green-500 bg-green-50">
            <CheckCircle2 size={13} /> Approved
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────
export default function DocumentControl() {
  const [documents, setDocuments] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState("All Projects");
  const [filterStatus, setFilterStatus] = useState("All");
  const [verifyingId, setVerifyingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2500); };

  const loadDocs = useCallback(async () => {
    try {
      setFetching(true);
      const data = await api.getAll();
      setDocuments(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const verifyDoc = async (id) => {
    setVerifyingId(id);
    try {
      await api.verifyDocument(id);
      setDocuments(prev => prev.map(d => d._id === id ? { ...d, status: "approved" } : d));
      showToast("Document approved successfully");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setVerifyingId(null);
    }
  };

  const ALL_PROJECTS = ["All Projects", ...new Set(documents.map(d => d.project?.name || d.project || "Unknown"))];
  const ALL_STATUSES = ["All", "approved", "pending", "rejected"];

  const filtered = documents.filter(d => {
    const pName = d.project?.name || d.project || "Unknown";
    const uName = d.uploadedBy?.name || d.uploadedBy?.email || "Unknown";
    const title = d.title || d.name || "";

    const matchSearch = title.toLowerCase().includes(search.toLowerCase()) || uName.toLowerCase().includes(search.toLowerCase());
    const matchProject = filterProject === "All Projects" || pName === filterProject;
    const matchStatus = filterStatus === "All" || (d.status || "pending") === filterStatus;
    return matchSearch && matchProject && matchStatus;
  });

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg ${toast.type === 'error' ? 'bg-red-500' : 'bg-extra-darkblue'}`}>
          <CheckCircle2 size={15} className={`${toast.type === 'error' ? 'text-red-200' : 'text-green-400'}`} /> {toast.msg}
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-extra-darkblue">Document Control</h2>
        <p className="text-sm text-gray-400 mt-0.5">View and verify uploaded handover documents.</p>
      </div>

      {fetching ? (
        <div className="py-10 text-center text-sm text-gray-500 flex justify-center items-center gap-2">
          <Loader className="animate-spin text-extra-blue" size={20} /> Loading documents...
        </div>
      ) : (
        <>
          {documents.length > 0 && <CompletenessByProject docs={documents} />}

          {/* Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input type="text" placeholder="Search documents…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-medium-blue transition-colors text-extra-darkblue placeholder-gray-300 bg-white" />
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-medium-blue text-extra-darkblue bg-white flex-1 min-w-0">
                {ALL_PROJECTS.map(p => <option key={p}>{p}</option>)}
              </select>
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl overflow-x-auto">
                {ALL_STATUSES.map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all capitalize
                      ${filterStatus === s ? "bg-white text-extra-darkblue shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* MOBILE: Cards */}
          <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(doc => (
              <DocCard key={doc._id} doc={doc} onVerify={verifyDoc} verifyingId={verifyingId} />
            ))}
            {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-8 col-span-2">No documents found.</p>}
          </div>

          {/* DESKTOP: Table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Document", "Project", "Type", "Uploaded By", "Date", "Status", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(doc => {
                  const statusKey = doc.status || "pending";
                  const s = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
                  const StatusIcon = s.icon;
                  return (
                    <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0"><FileText size={14} className="text-red-400" /></div>
                          <span className="text-xs font-semibold text-extra-darkblue max-w-[160px] truncate">{doc.title || doc.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">{doc.project?.name || doc.project || "Unknown"}</td>
                      <td className="px-5 py-3.5"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_COLORS[doc.documentType] || TYPE_COLORS.default}`}>{doc.documentType}</span></td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">{doc.uploadedBy?.name || doc.uploadedBy?.email || "Unknown"}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">{new Date(doc.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5">
                        <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${s.cls}`}>
                          <StatusIcon size={11} /> {statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 text-xs">
                          {doc.url && (
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-gray-400 hover:text-extra-blue hover:bg-lightblue/30 transition-all">
                              <Eye size={16} />
                            </a>
                          )}
                          {statusKey === 'pending' ? (
                            <button disabled={verifyingId === doc._id} onClick={() => verifyDoc(doc._id)} title="Approve" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-gray-500 font-bold border border-gray-200 hover:text-green-600 hover:border-green-600 transition-all disabled:opacity-50">
                              {verifyingId === doc._id ? <Loader size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Approve
                            </button>
                          ) : (
                            <span className="p-1.5 text-green-500" title="Approved"><CheckCircle2 size={16} /></span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-10">No documents found matching the criteria.</p>}
          </div>
        </>
      )}
    </div>
  );
}