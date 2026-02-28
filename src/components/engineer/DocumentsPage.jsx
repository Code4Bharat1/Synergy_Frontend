"use client";
import { useState } from "react";
import { FileText, CheckCircle, Trash2, Send, Eye } from "lucide-react";
import {
  PageHeader, Card, SectionHead, Label, inputStyle, SubmitBtn,
  UploadBox, FONTS, PROJECTS,
} from "./shared";

const DOC_CATEGORIES = [
  {
    key: "handover",
    title: "Signed Handover Documents",
    subtitle: "Customer-signed project handover sheets",
    icon: "📋",
    accept: ".pdf,.doc,.docx",
    color: "#4988C4",
    required: true,
  },
  {
    key: "trial",
    title: "Trial Formats",
    subtitle: "Completed trial run result sheets",
    icon: "🔬",
    accept: ".pdf,.xlsx,.xls",
    color: "#34C759",
    required: true,
  },
  {
    key: "maintenance",
    title: "Maintenance Manual",
    subtitle: "Operation and maintenance guides for installed items",
    icon: "🔧",
    accept: ".pdf,.doc,.docx",
    color: "#FF9500",
    required: false,
  },
];

const RECENT_DOCS = [
  { name: "Handover_PRJ2401_signed.pdf",   category: "Handover",    project: "PRJ-2401", date: "Today",        size: "2.1 MB" },
  { name: "Trial_WavePool_results.xlsx",    category: "Trial",       project: "PRJ-2389", date: "Yesterday",    size: "560 KB" },
  { name: "Maintenance_SpeedSlide.pdf",     category: "Maintenance", project: "PRJ-2376", date: "Feb 22",       size: "8.4 MB" },
];

export default function DocumentsPage() {
  const [project,   setProject]   = useState("");
  const [uploads,   setUploads]   = useState({ handover: [], trial: [], maintenance: [] });
  const [notes,     setNotes]     = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const handleFiles = (key) => (e) => {
    const files = Array.from(e.target.files).map(f => ({ name: f.name, size: f.size, key }));
    setUploads(u => ({ ...u, [key]: [...u[key], ...files] }));
  };
  const removeFile = (key, name) => setUploads(u => ({ ...u, [key]: u[key].filter(f => f.name !== name) }));

  const totalFiles = Object.values(uploads).flat().length;

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1600));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) return (
    <>
      <style>{FONTS + `
  .doc-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 20px; }
  @media (max-width: 860px) { .doc-grid { grid-template-columns: 1fr; } }
  .doc-proj-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: end; }
  @media (max-width: 500px) { .doc-proj-row { grid-template-columns: 1fr; } }
`}</style>
      <div style={{ maxWidth: 500, margin: "80px auto", textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>📁</div>
        <h2 style={{ color: "#0F2854", fontSize: 22, fontWeight: 800, fontFamily: "'Syne',sans-serif", marginBottom: 8 }}>Documents Uploaded!</h2>
        <p style={{ color: "#4988C4", fontSize: 14, marginBottom: 24 }}>{totalFiles} document(s) submitted successfully for project {project || "—"}.</p>
        <button onClick={() => { setSubmitted(false); setProject(""); setUploads({ handover: [], trial: [], maintenance: [] }); setNotes(""); }} style={{
          background: "#0F2854", color: "#BDE8F5", border: "none",
          padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
        }}>Upload More</button>
      </div>
    </>
  );

  return (
    <>
      <style>{FONTS + `
  .doc-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 20px; }
  @media (max-width: 860px) { .doc-grid { grid-template-columns: 1fr; } }
  .doc-proj-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: end; }
  @media (max-width: 500px) { .doc-proj-row { grid-template-columns: 1fr; } }
`}</style>
      <PageHeader
        eyebrow="Documents"
        title="Document Upload"
        subtitle="Submit handover docs, trial formats, and maintenance manuals"
      />

      <div className="doc-grid">

        {/* ── Upload Form ──────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Project selector */}
          <Card style={{ padding: "22px 24px" }}>
            <div className="doc-proj-row">
              <div>
                <Label required>Project</Label>
                <select style={{ ...inputStyle, cursor: "pointer" }}
                  value={project} onChange={e => setProject(e.target.value)}>
                  <option value="">Select project</option>
                  {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Submission Date</Label>
                <input type="date" style={inputStyle}
                  defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
            </div>
          </Card>

          {/* Upload boxes */}
          {DOC_CATEGORIES.map(cat => (
            <Card key={cat.key} style={{ padding: "22px 24px", borderLeft: `3px solid ${cat.color}40` }}>
              <SectionHead icon={<span style={{ fontSize: 16 }}>{cat.icon}</span>} title={cat.title} subtitle={cat.subtitle} />

              <UploadBox
                label={`Upload ${cat.title}`}
                accept={cat.accept}
                icon={cat.icon}
                caption={`${cat.accept.split(",").join(", ")} files accepted`}
                required={cat.required}
                onChange={handleFiles(cat.key)}
              />

              {uploads[cat.key].length > 0 && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                  {uploads[cat.key].map(f => (
                    <div key={f.name} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "9px 12px", borderRadius: 9,
                      background: `${cat.color}08`, border: `1px solid ${cat.color}25`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <FileText size={14} color={cat.color} />
                        <div>
                          <div style={{ color: "#0F2854", fontSize: 12, fontWeight: 600 }}>{f.name}</div>
                          <div style={{ color: "#4988C4", fontSize: 10 }}>{(f.size / 1024).toFixed(0)} KB</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={{
                          background: "none", border: "none", cursor: "pointer", color: cat.color, padding: 2,
                        }}><Eye size={13} /></button>
                        <button onClick={() => removeFile(cat.key, f.name)} style={{
                          background: "none", border: "none", cursor: "pointer", color: "#FF3B30", padding: 2,
                        }}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}

          {/* Notes */}
          <Card style={{ padding: "22px 24px" }}>
            <Label>Submission Notes (Optional)</Label>
            <textarea style={{ ...inputStyle, minHeight: 72, resize: "vertical" }}
              placeholder="Any notes or special instructions for this document batch…"
              value={notes} onChange={e => setNotes(e.target.value)} />
          </Card>

          {/* Submit */}
          <Card style={{
            padding: "18px 22px",
            background: "linear-gradient(135deg,rgba(15,40,84,0.04),rgba(73,136,196,0.06))",
            border: "1px solid rgba(73,136,196,0.2)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 14 }}>Ready to Submit</div>
                <div style={{ color: "#4988C4", fontSize: 12, marginTop: 2 }}>
                  {totalFiles} file(s) queued · Project: {project || "not selected"}
                </div>
              </div>
              <SubmitBtn loading={loading} color="green" onClick={handleSubmit}>
                <Send size={13} /> Submit Documents
              </SubmitBtn>
            </div>
          </Card>
        </div>

        {/* ── Sidebar: progress + recent ────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Upload checklist */}
          <Card style={{ padding: "22px" }}>
            <SectionHead icon={<CheckCircle size={16} color="#BDE8F5" />} title="Upload Checklist" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {DOC_CATEGORIES.map(cat => {
                const done = uploads[cat.key].length > 0;
                return (
                  <div key={cat.key} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "11px 13px", borderRadius: 10,
                    background: done ? "rgba(52,199,89,0.06)" : "rgba(73,136,196,0.04)",
                    border: `1px solid ${done ? "rgba(52,199,89,0.25)" : "rgba(73,136,196,0.1)"}`,
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                      background: done ? "#34C759" : "rgba(73,136,196,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {done ? <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>
                             : <span style={{ color: "#4988C4", fontSize: 11 }}>{cat.icon}</span>}
                    </div>
                    <div>
                      <div style={{ color: done ? "#34C759" : "#0F2854", fontSize: 12, fontWeight: 700 }}>{cat.title}</div>
                      <div style={{ color: "#4988C4", fontSize: 10 }}>
                        {done
                          ? `${uploads[cat.key].length} file(s) ready`
                          : cat.required ? "Required" : "Optional"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* overall progress */}
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#4988C4", fontSize: 11, fontWeight: 600 }}>COMPLETION</span>
                <span style={{ color: "#0F2854", fontSize: 11, fontWeight: 700 }}>
                  {DOC_CATEGORIES.filter(c => uploads[c.key].length > 0).length}/{DOC_CATEGORIES.length}
                </span>
              </div>
              <div style={{ background: "rgba(73,136,196,0.1)", borderRadius: 99, height: 6 }}>
                <div style={{
                  height: 6, borderRadius: 99,
                  background: "linear-gradient(90deg,#34C759,#4988C4)",
                  width: `${(DOC_CATEGORIES.filter(c => uploads[c.key].length > 0).length / DOC_CATEGORIES.length) * 100}%`,
                  transition: "width 0.4s ease",
                }} />
              </div>
            </div>
          </Card>

          {/* Recent uploads */}
          <Card style={{ padding: "22px" }}>
            <SectionHead icon={<FileText size={16} color="#BDE8F5" />} title="Recent Uploads" />
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {RECENT_DOCS.map((d, i) => (
                <div key={i} style={{
                  padding: "10px 12px", borderRadius: 9,
                  background: "rgba(73,136,196,0.04)",
                  border: "1px solid rgba(73,136,196,0.08)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ background: "rgba(73,136,196,0.12)", color: "#1C4D8D", padding: "1px 7px", borderRadius: 99, fontSize: 10, fontWeight: 700 }}>{d.category}</span>
                    <span style={{ color: "#4988C4", fontSize: 10 }}>{d.date}</span>
                  </div>
                  <div style={{ color: "#0F2854", fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{d.name}</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#4988C4", fontSize: 10 }}>{d.project}</span>
                    <span style={{ color: "#4988C4", fontSize: 10 }}>{d.size}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}