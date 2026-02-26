"use client";
import { useState } from "react";
import { AlertTriangle, Upload, Plus, Trash2, CheckCircle } from "lucide-react";
import {
  PageHeader, Card, SectionHead, Label, inputStyle, SubmitBtn,
  FONTS, DEPARTMENTS, PROJECTS,
} from "./shared";

const SEVERITIES = [
  { label: "Low",      color: "#34C759", bg: "rgba(52,199,89,0.1)"   },
  { label: "Medium",   color: "#FF9500", bg: "rgba(255,149,0,0.1)"   },
  { label: "High",     color: "#FF3B30", bg: "rgba(255,59,48,0.1)"   },
  { label: "Critical", color: "#9B1C1C", bg: "rgba(155,28,28,0.1)"   },
];

const RECENT_ISSUES = [
  { id: "ISS-014", description: "Gel coat delamination on section B", dept: "Production",    severity: "High",   date: "Today"       },
  { id: "ISS-013", description: "Missing anchor bolts – Wave pool",   dept: "Logistics",     severity: "Medium", date: "Yesterday"   },
  { id: "ISS-012", description: "Incorrect fiberglass thickness",     dept: "QC / Quality",  severity: "High",   date: "Feb 22"      },
];

const sevColorMap = { Low: "#34C759", Medium: "#FF9500", High: "#FF3B30", Critical: "#9B1C1C" };

export default function IssueLogPage() {
  const [form, setForm] = useState({
    project: "", description: "", department: "",
    severity: "Medium", proposedSolution: "", photos: [],
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const upd = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handlePhoto = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map(f => ({ name: f.name, url: URL.createObjectURL(f) }));
    setForm(f => ({ ...f, photos: [...f.photos, ...previews] }));
  };
  const removePhoto = (name) => setForm(f => ({ ...f, photos: f.photos.filter(p => p.name !== name) }));

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    setLoading(false);
    setSubmitted(true);
  };

  const selectedSev = SEVERITIES.find(s => s.label === form.severity);

  if (submitted) return (
    <>
      <style>{FONTS + `
  .il-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; }
  @media (max-width: 860px) { .il-grid { grid-template-columns: 1fr; } }
  .il-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  @media (max-width: 560px) { .il-field-row { grid-template-columns: 1fr; } }
  .il-severity-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 6px; margin-top: 2px; }
  @media (max-width: 420px) { .il-severity-row { grid-template-columns: repeat(2,1fr); gap: 8px; } }
`}</style>
      <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center" }}>
        <CheckCircle size={56} color="#34C759" strokeWidth={1.5} style={{ marginBottom: 16 }} />
        <h2 style={{ color: "#0F2854", fontSize: 22, fontWeight: 800, fontFamily: "'Syne',sans-serif", marginBottom: 8 }}>Issue Logged!</h2>
        <p style={{ color: "#4988C4", fontSize: 14, marginBottom: 24 }}>Your issue has been filed and the relevant department has been notified.</p>
        <button onClick={() => { setSubmitted(false); setForm({ project: "", description: "", department: "", severity: "Medium", proposedSolution: "", photos: [] }); }} style={{
          background: "#0F2854", color: "#BDE8F5", border: "none",
          padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
          fontFamily: "'DM Sans',sans-serif",
        }}>Log Another Issue</button>
      </div>
    </>
  );

  return (
    <>
      <style>{FONTS + `
  .il-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; }
  @media (max-width: 860px) { .il-grid { grid-template-columns: 1fr; } }
  .il-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  @media (max-width: 560px) { .il-field-row { grid-template-columns: 1fr; } }
  .il-severity-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 6px; margin-top: 2px; }
  @media (max-width: 420px) { .il-severity-row { grid-template-columns: repeat(2,1fr); gap: 8px; } }
`}</style>
      <PageHeader
        eyebrow="Field"
        title="Log an Issue"
        subtitle="Report problems and assign to the responsible department"
      />

      <div className="il-grid">

        {/* ── Form ─────────────────────────────────────────────────────── */}
        <Card style={{ padding: "26px" }}>
          <SectionHead icon={<AlertTriangle size={16} color="#BDE8F5" />} title="Issue Details" />

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Project */}
            <div>
              <Label required>Project</Label>
              <select style={{ ...inputStyle, cursor: "pointer" }}
                value={form.project} onChange={e => upd("project", e.target.value)}>
                <option value="">Select project</option>
                {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}
              </select>
            </div>

            {/* Problem description */}
            <div>
              <Label required>Problem Description</Label>
              <textarea
                style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
                placeholder="Describe the problem clearly — what happened, where, when…"
                value={form.description}
                onChange={e => upd("description", e.target.value)}
              />
            </div>

            {/* Dept + Severity */}
            <div className="il-field-row">
              <div>
                <Label required>Responsible Department</Label>
                <select style={{ ...inputStyle, cursor: "pointer" }}
                  value={form.department} onChange={e => upd("department", e.target.value)}>
                  <option value="">Select department</option>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <Label required>Severity</Label>
                <div className="il-severity-row">
                  {SEVERITIES.map(s => (
                    <button key={s.label} onClick={() => upd("severity", s.label)} style={{
                      padding: "8px 4px", borderRadius: 8, border: "none", cursor: "pointer",
                      background: form.severity === s.label ? s.color : s.bg,
                      color: form.severity === s.label ? "#fff" : s.color,
                      fontSize: 11, fontWeight: 700, transition: "all 0.15s",
                      fontFamily: "'DM Sans',sans-serif",
                    }}>{s.label}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Photo Upload */}
            <div>
              <Label>Photo Evidence</Label>
              <label style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                border: "2px dashed rgba(73,136,196,0.3)", borderRadius: 12, padding: "20px",
                cursor: "pointer", background: "rgba(189,232,245,0.04)", gap: 6,
              }}>
                <Upload size={22} color="#4988C4" strokeWidth={1.5} />
                <span style={{ color: "#1C4D8D", fontSize: 12, fontWeight: 600 }}>Upload Photos</span>
                <span style={{ color: "#4988C4", fontSize: 11 }}>JPG, PNG, HEIC — up to 10 photos</span>
                <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePhoto} />
              </label>

              {form.photos.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 10 }}>
                  {form.photos.map(p => (
                    <div key={p.name} style={{ position: "relative", borderRadius: 8, overflow: "hidden" }}>
                      <img src={p.url} alt={p.name} style={{ width: "100%", height: 70, objectFit: "cover" }} />
                      <button onClick={() => removePhoto(p.name)} style={{
                        position: "absolute", top: 3, right: 3,
                        background: "rgba(0,0,0,0.6)", border: "none",
                        borderRadius: "50%", width: 18, height: 18,
                        color: "#fff", cursor: "pointer", fontSize: 10,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Proposed Solution */}
            <div>
              <Label>Proposed Solution</Label>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                placeholder="What do you suggest to fix this issue?"
                value={form.proposedSolution}
                onChange={e => upd("proposedSolution", e.target.value)}
              />
            </div>
          </div>

          {/* Severity banner */}
          {selectedSev && (
            <div style={{
              marginTop: 18, padding: "10px 14px", borderRadius: 10,
              background: selectedSev.bg, border: `1px solid ${selectedSev.color}30`,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <AlertTriangle size={14} color={selectedSev.color} />
              <span style={{ color: selectedSev.color, fontSize: 12, fontWeight: 600 }}>
                {form.severity === "Critical"
                  ? "⛔ Critical — This will immediately notify management."
                  : form.severity === "High"
                  ? "⚠ High severity — Relevant department will be alerted."
                  : `${form.severity} severity — Issue will be queued for review.`}
              </span>
            </div>
          )}

          <div style={{ marginTop: 22, display: "flex", justifyContent: "flex-end" }}>
            <SubmitBtn loading={loading} color="blue" onClick={handleSubmit}>
              Submit Issue Report
            </SubmitBtn>
          </div>
        </Card>

        {/* ── Recent Issues ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ padding: "22px" }}>
            <SectionHead icon={<AlertTriangle size={16} color="#BDE8F5" />} title="Recent Issues" subtitle="Last 30 days" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {RECENT_ISSUES.map(issue => (
                <div key={issue.id} style={{
                  padding: "12px 14px", borderRadius: 11,
                  background: "rgba(73,136,196,0.04)",
                  border: "1px solid rgba(73,136,196,0.1)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "#1C4D8D", fontSize: 11, fontWeight: 700 }}>{issue.id}</span>
                    <span style={{ background: `${sevColorMap[issue.severity]}18`, color: sevColorMap[issue.severity], padding: "1px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700 }}>{issue.severity}</span>
                  </div>
                  <div style={{ color: "#0F2854", fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{issue.description}</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#4988C4", fontSize: 11 }}>{issue.dept}</span>
                    <span style={{ color: "#4988C4", fontSize: 11 }}>{issue.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Dept quick ref */}
          <Card style={{ padding: "20px 22px" }}>
            <div style={{ color: "#0F2854", fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Department Reference</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {DEPARTMENTS.map(d => (
                <div key={d} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "7px 10px", borderRadius: 8,
                  background: "rgba(73,136,196,0.04)",
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4988C4", flexShrink: 0 }} />
                  <span style={{ color: "#1C4D8D", fontSize: 12 }}>{d}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}