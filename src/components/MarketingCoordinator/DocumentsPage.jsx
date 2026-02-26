"use client";
import { useState } from "react";
import { FileText, Upload, Trash2, Eye, CheckCircle, Send } from "lucide-react";
import { PROJECTS } from "./shared";

const DOC_TYPES = [
  {
    key:      "handover",
    title:    "Design Handover Acknowledgement",
    subtitle: "Signed design handover sheets from client",
    icon:     "📋",
    accept:   ".pdf,.doc,.docx",
    color:    "text-brand-mid",
    bg:       "bg-brand-mid/8",
    border:   "border-brand-mid/25",
    ring:     "ring-brand-mid/20",
    dot:      "bg-brand-mid",
    required: true,
  },
  {
    key:      "erp",
    title:    "ERP Material Confirmation",
    subtitle: "ERP-generated material approval sheets",
    icon:     "🗂",
    accept:   ".pdf,.xlsx,.xls",
    color:    "text-emerald-600",
    bg:       "bg-emerald-500/8",
    border:   "border-emerald-500/25",
    ring:     "ring-emerald-500/20",
    dot:      "bg-emerald-500",
    required: true,
  },
  {
    key:      "comms",
    title:    "Client Communication Logs",
    subtitle: "Email threads, meeting minutes, approvals",
    icon:     "💬",
    accept:   ".pdf,.doc,.docx,.eml,.msg",
    color:    "text-orange-500",
    bg:       "bg-orange-500/8",
    border:   "border-orange-500/25",
    ring:     "ring-orange-500/20",
    dot:      "bg-orange-400",
    required: false,
  },
];

export default function DocumentsPage() {
  const [project,   setProject]   = useState("");
  const [date,      setDate]      = useState(new Date().toISOString().split("T")[0]);
  const [uploads,   setUploads]   = useState({ handover: [], erp: [], comms: [] });
  const [notes,     setNotes]     = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const addFiles = (key) => (e) => {
    const files = Array.from(e.target.files).map(f => ({ name: f.name, size: f.size }));
    setUploads(u => ({ ...u, [key]: [...u[key], ...files] }));
  };
  const removeFile = (key, name) => setUploads(u => ({ ...u, [key]: u[key].filter(f => f.name !== name) }));

  const totalFiles = Object.values(uploads).flat().length;
  const requiredDone = DOC_TYPES.filter(d => d.required).every(d => uploads[d.key].length > 0);

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) return (
    <div className="flex flex-col items-center justify-center py-20 animate-fadeUp">
      <CheckCircle size={52} className="text-emerald-500 mb-4" strokeWidth={1.5} />
      <h2 className="font-display text-2xl font-extrabold text-brand-darkest mb-2">Documents Uploaded!</h2>
      <p className="text-brand-mid text-[14px] mb-6 text-center max-w-xs">
        {totalFiles} document(s) submitted for {PROJECTS.find(p => p.id === project)?.name || project || "—"}.
      </p>
      <button
        onClick={() => { setSubmitted(false); setProject(""); setUploads({ handover:[], erp:[], comms:[] }); setNotes(""); }}
        className="rounded-xl bg-brand-darkest px-6 py-2.5 text-[13px] font-bold text-brand-light hover:bg-brand-dark transition-colors"
      >Upload More</button>
    </div>
  );

  return (
    <div className="animate-fadeUp">
      {/* Header */}
      <div className="mb-7">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[2px] text-brand-mid">Marketing</p>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-darkest">Document Upload</h1>
        <p className="mt-1 text-[13px] text-brand-mid">Submit design handover, ERP confirmation, and client communication logs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

        {/* ── Left: upload form ─────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Project + Date */}
          <div className="rounded-2xl  bg-white shadow-sm p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-dark mb-1.5">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  value={project}
                  onChange={e => setProject(e.target.value)}
                  className="w-full bg-slate-50  rounded-xl px-3.5 py-2.5 text-[13px] text-brand-darkest outline-none focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/15 transition-all cursor-pointer"
                >
                  <option value="">Select project</option>
                  {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-dark mb-1.5">
                  Submission Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-slate-50  rounded-xl px-3.5 py-2.5 text-[13px] text-brand-darkest outline-none focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/15 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Upload zones */}
          {DOC_TYPES.map(dt => (
            <div key={dt.key} className={`rounded-2xl bg-white shadow-sm p-5`}>
              {/* Section header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-9 h-9 rounded-[10px] ${dt.bg} flex items-center justify-center text-lg shrink-0`}>
                  {dt.icon}
                </div>
                <div>
                  <div className={`font-display font-bold text-[13px] ${dt.color}`}>
                    {dt.title}
                    {dt.required && <span className="text-red-500 ml-1">*</span>}
                  </div>
                  <div className="text-brand-mid text-[11px]">{dt.subtitle}</div>
                </div>
              </div>

              {/* Drop zone */}
              <label className={[
                "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 cursor-pointer transition-all",
                `border-${dt.border.replace("border-","")} hover:bg-${dt.bg.replace("bg-","")}`,
                uploads[dt.key].length > 0 ? "border-opacity-50" : "",
              ].join(" ")}
                style={{ borderColor: "rgba(73,136,196,0.25)" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(73,136,196,0.5)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(73,136,196,0.25)"}
              >
                <Upload size={20} className={dt.color} strokeWidth={1.5} />
                <span className={`text-[12px] font-semibold ${dt.color}`}>Click to browse files</span>
                <span className="text-brand-mid text-[11px]">{dt.accept} accepted · drag & drop</span>
                <input type="file" accept={dt.accept} multiple className="hidden" onChange={addFiles(dt.key)} />
              </label>

              {/* File list */}
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
                        <button className={`${dt.color} hover:opacity-70 transition-opacity p-1`}><Eye size={12} /></button>
                        <button onClick={() => removeFile(dt.key, f.name)} className="text-red-400 hover:text-red-600 transition-colors p-1"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Notes */}
          <div className="rounded-2xl  bg-white shadow-sm p-5">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-dark mb-1.5">
              Submission Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any notes or context for this document batch…"
              className="w-full bg-slate-50  rounded-xl px-3.5 py-2.5 text-[13px] text-brand-darkest outline-none resize-none placeholder-slate-300 focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/15 transition-all"
            />
          </div>

          {/* Submit */}
          <div className="rounded-2xl  bg-gradient-to-br from-brand-bg to-brand-mid/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-brand-darkest font-bold text-[14px]">Ready to Submit</div>
              <div className="text-brand-mid text-[12px] mt-0.5">
                {totalFiles} file(s) · Project: {PROJECTS.find(p => p.id === project)?.name || "not selected"}
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!project || !requiredDone || loading}
              className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white px-5 py-2.5 text-[13px] font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center gap-2 shrink-0"
            >
              {loading
                ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</>
                : <><Send size={13} /> Submit Documents</>
              }
            </button>
          </div>
        </div>

        {/* ── Right: checklist ─────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="rounded-2xl  bg-white shadow-sm p-5 lg:sticky lg:top-6">
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
                  <div key={dt.key} className={[
                    "flex items-start gap-3 rounded-xl p-3  transition-all",
                    done ? "bg-emerald-500/6 border-emerald-500/25" : "bg-brand-bg/50 border-brand-mid/10",
                  ].join(" ")}>
                    <div className={[
                      "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      done ? "bg-emerald-500" : "bg-brand-mid/15",
                    ].join(" ")}>
                      {done
                        ? <span className="text-white text-[10px] font-bold">✓</span>
                        : <span className="text-[9px]">{dt.icon}</span>
                      }
                    </div>
                    <div className="min-w-0">
                      <div className={`text-[12px] font-bold truncate ${done ? "text-emerald-600" : "text-brand-darkest"}`}>
                        {dt.title}
                      </div>
                      <div className="text-[10px] text-brand-mid mt-0.5">
                        {done
                          ? `${uploads[dt.key].length} file(s) ready`
                          : dt.required ? "Required" : "Optional"
                        }
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress */}
            <div className="mt-5">
              <div className="flex justify-between text-[11px] font-semibold mb-1.5">
                <span className="text-brand-mid uppercase tracking-[0.4px]">Completion</span>
                <span className="text-brand-darkest">
                  {DOC_TYPES.filter(d => uploads[d.key].length > 0).length}/{DOC_TYPES.length}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-brand-mid/12">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-brand-mid transition-all duration-500"
                  style={{ width: `${(DOC_TYPES.filter(d => uploads[d.key].length > 0).length / DOC_TYPES.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}