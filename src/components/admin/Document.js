"use client";
import { useState } from "react";
import { FileText, CheckCircle2, XCircle, Clock, Eye, Download, Search } from "lucide-react";

const DOCUMENTS = [
  { id: 1, name: "Greenfield Complex – Handover Report.pdf",  project: "Greenfield Complex", uploadedBy: "Ahmad Raza",  uploaded: "24 Feb 2026", size: "2.4 MB", status: "Complete",   type: "Handover"      },
  { id: 2, name: "Harbor View – As-Built Drawings.pdf",        project: "Harbor View Tower",  uploadedBy: "Sara Malik",  uploaded: "23 Feb 2026", size: "8.1 MB", status: "Complete",   type: "As-Built"      },
  { id: 3, name: "Westgate – Commissioning Checklist.pdf",     project: "Westgate Mall",      uploadedBy: "James K.",    uploaded: "22 Feb 2026", size: "0.9 MB", status: "Incomplete", type: "Checklist"     },
  { id: 4, name: "Greenfield – QC Inspection Report.pdf",      project: "Greenfield Complex", uploadedBy: "Priya Nair",  uploaded: "21 Feb 2026", size: "1.2 MB", status: "Complete",   type: "QC Report"     },
  { id: 5, name: "Harbor View – Material Certification.pdf",   project: "Harbor View Tower",  uploadedBy: "Omar Sheikh", uploaded: "20 Feb 2026", size: "3.5 MB", status: "Pending",    type: "Certification" },
  { id: 6, name: "Westgate – Safety Sign-off.pdf",             project: "Westgate Mall",      uploadedBy: "Bilal Khan",  uploaded: "19 Feb 2026", size: "0.5 MB", status: "Incomplete", type: "Safety"        },
];

const STATUS_CONFIG = {
  Complete:   { cls: "bg-green-50 text-green-600",  icon: CheckCircle2 },
  Incomplete: { cls: "bg-red-50 text-red-500",      icon: XCircle      },
  Pending:    { cls: "bg-amber-50 text-amber-600",  icon: Clock        },
};

const TYPE_COLORS = {
  Handover:      "bg-blue-50 text-blue-600",
  "As-Built":    "bg-purple-50 text-purple-600",
  Checklist:     "bg-teal-50 text-teal-600",
  "QC Report":   "bg-lightblue text-extra-blue",
  Certification: "bg-amber-50 text-amber-600",
  Safety:        "bg-red-50 text-red-500",
};

const ALL_PROJECTS  = ["All Projects", ...new Set(DOCUMENTS.map(d => d.project))];
const ALL_STATUSES  = ["All", "Complete", "Incomplete", "Pending"];

// ── Completeness cards ────────────────────────────────────────────────────────
function CompletenessByProject({ docs }) {
  const projects = [...new Set(docs.map(d => d.project))];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {projects.map(proj => {
        const pd  = docs.filter(d => d.project === proj);
        const pct = Math.round((pd.filter(d => d.status === "Complete").length / pd.length) * 100);
        return (
          <div key={proj} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-bold text-extra-darkblue truncate">{proj}</p>
            <div className="flex justify-between text-xs mt-2 mb-1.5">
              <span className="text-gray-400">{pd.filter(d => d.status === "Complete").length}/{pd.length} complete</span>
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
function DocCard({ doc, isVerified, onVerify }) {
  const s = STATUS_CONFIG[doc.status];
  const StatusIcon = s.icon;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
          <FileText size={16} className="text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-extra-darkblue leading-snug line-clamp-2">{doc.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{doc.project}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_COLORS[doc.type]}`}>{doc.type}</span>
        <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>
          <StatusIcon size={10} /> {doc.status}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-50">
        <span>by {doc.uploadedBy} · {doc.uploaded}</span>
        <span>{doc.size}</span>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-extra-blue bg-lightblue/40 hover:bg-lightblue transition-colors">
          <Eye size={13} /> View
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
          <Download size={13} /> Download
        </button>
        {!isVerified ? (
          <button onClick={() => onVerify(doc.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 transition-colors">
            <CheckCircle2 size={13} /> Verify
          </button>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-green-500 bg-green-50">
            <CheckCircle2 size={13} /> Verified
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DocumentControl() {
  const [search,        setSearch]        = useState("");
  const [filterProject, setFilterProject] = useState("All Projects");
  const [filterStatus,  setFilterStatus]  = useState("All");
  const [verifiedDocs,  setVerifiedDocs]  = useState({});
  const [toast,         setToast]         = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const markVerified = (id) => { setVerifiedDocs(p => ({ ...p, [id]: true })); showToast("Document verified"); };

  const filtered = DOCUMENTS.filter(d => {
    const matchSearch  = d.name.toLowerCase().includes(search.toLowerCase()) || d.uploadedBy.toLowerCase().includes(search.toLowerCase());
    const matchProject = filterProject === "All Projects" || d.project === filterProject;
    const matchStatus  = filterStatus === "All" || d.status === filterStatus;
    return matchSearch && matchProject && matchStatus;
  });

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-extra-darkblue text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg">
          <CheckCircle2 size={15} className="text-green-400" /> {toast}
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-extra-darkblue">Document Control</h2>
        <p className="text-sm text-gray-400 mt-0.5">View and verify uploaded handover documents</p>
      </div>

      <CompletenessByProject docs={DOCUMENTS} />

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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
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
          <DocCard key={doc.id} doc={doc} isVerified={!!verifiedDocs[doc.id]} onVerify={markVerified} />
        ))}
        {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-8 col-span-2">No documents found</p>}
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
              const s = STATUS_CONFIG[doc.status];
              const StatusIcon = s.icon;
              const isVerified = !!verifiedDocs[doc.id];
              return (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0"><FileText size={14} className="text-red-400" /></div>
                      <span className="text-xs font-semibold text-extra-darkblue max-w-[160px] truncate">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">{doc.project}</td>
                  <td className="px-5 py-3.5"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_COLORS[doc.type]}`}>{doc.type}</span></td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{doc.uploadedBy}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">{doc.uploaded}</td>
                  <td className="px-5 py-3.5">
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${s.cls}`}>
                      <StatusIcon size={11} /> {doc.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button title="View"     className="p-1.5 rounded-lg text-gray-400 hover:text-extra-blue hover:bg-lightblue/30 transition-all"><Eye      size={14} /></button>
                      <button title="Download" className="p-1.5 rounded-lg text-gray-400 hover:text-extra-blue hover:bg-lightblue/30 transition-all"><Download size={14} /></button>
                      {!isVerified ? (
                        <button onClick={() => markVerified(doc.id)} title="Verify" className="p-1.5 rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 transition-all"><CheckCircle2 size={14} /></button>
                      ) : (
                        <span className="p-1.5 text-green-500"><CheckCircle2 size={14} /></span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-10">No documents found</p>}
      </div>
    </div>
  );
}