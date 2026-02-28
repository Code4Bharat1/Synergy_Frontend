"use client";
import { useState } from "react";
import { CheckSquare, Send, FileCheck, Image, Trash2, CheckCircle } from "lucide-react";
import {
  PageHeader, Card, SectionHead, Label, inputStyle, SubmitBtn,
  UploadBox, FONTS, PROJECTS, ITEMS_BY_PROJECT,
} from "./shared";

const TRIAL_TYPES = ["Hydrostatic Test", "Leak Test", "Load Test", "Flow Rate Test", "Visual Inspection", "Dimensional Check"];
const RESULTS     = ["Pass", "Pass with Conditions", "Fail — Minor", "Fail — Major"];

export default function QCUploadPage() {
  const [form, setForm] = useState({
    project: "", item: "", trialType: "", result: "",
    inspectionDate: "", notes: "",
    trialFiles: [], siteImages: [],
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const upd = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleFiles = (key) => (e) => {
    const files = Array.from(e.target.files).map(f => ({ name: f.name, size: f.size, url: URL.createObjectURL(f) }));
    setForm(f => ({ ...f, [key]: [...f[key], ...files] }));
  };
  const removeFile = (key, name) => setForm(f => ({ ...f, [key]: f[key].filter(x => x.name !== name) }));

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  const resultColor = {
    "Pass":                    { color: "#34C759", bg: "rgba(52,199,89,0.1)"  },
    "Pass with Conditions":    { color: "#FF9500", bg: "rgba(255,149,0,0.1)"  },
    "Fail — Minor":            { color: "#FF3B30", bg: "rgba(255,59,48,0.1)"  },
    "Fail — Major":            { color: "#9B1C1C", bg: "rgba(155,28,28,0.1)"  },
  };

  if (submitted) return (
    <>
      <style>{FONTS + `
  .qc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  @media (max-width: 860px) { .qc-grid { grid-template-columns: 1fr; } }
  .qc-basic-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (max-width: 500px) { .qc-basic-row { grid-template-columns: 1fr; } }
  .qc-result-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .qc-img-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-top: 12px; }
  @media (max-width: 400px) { .qc-img-grid { grid-template-columns: repeat(2,1fr); } }
`}</style>
      <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center" }}>
        <div style={{ fontSize: 54, marginBottom: 12 }}>🔬</div>
        <h2 style={{ color: "#0F2854", fontSize: 22, fontWeight: 800, fontFamily: "'Syne',sans-serif", marginBottom: 8 }}>QC Submission Sent!</h2>
        <p style={{ color: "#4988C4", fontSize: 14, marginBottom: 22 }}>Trial results and site images have been submitted for inspection review.</p>
        <div style={{ background: "#fff", border: "1px solid rgba(73,136,196,0.15)", borderRadius: 12, padding: "16px 20px", marginBottom: 20, textAlign: "left" }}>
          {[
            ["Trial Type", form.trialType],
            ["Result",     form.result],
            ["Files",      `${form.trialFiles.length} trial + ${form.siteImages.length} images`],
          ].map(([k,v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(73,136,196,0.07)" }}>
              <span style={{ color: "#4988C4", fontSize: 12 }}>{k}</span>
              <span style={{ color: "#0F2854", fontSize: 12, fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>
        <button onClick={() => { setSubmitted(false); setForm({ project:"",item:"",trialType:"",result:"",inspectionDate:"",notes:"",trialFiles:[],siteImages:[] }); }} style={{
          background: "#0F2854", color: "#BDE8F5", border: "none",
          padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
        }}>Upload Another</button>
      </div>
    </>
  );

  return (
    <>
      <style>{FONTS + `
  .qc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  @media (max-width: 860px) { .qc-grid { grid-template-columns: 1fr; } }
  .qc-basic-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (max-width: 500px) { .qc-basic-row { grid-template-columns: 1fr; } }
  .qc-result-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .qc-img-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-top: 12px; }
  @media (max-width: 400px) { .qc-img-grid { grid-template-columns: repeat(2,1fr); } }
`}</style>
      <PageHeader
        eyebrow="Quality Control"
        title="QC Upload"
        subtitle="Upload trial results and site images for inspection"
      />

      <div className="qc-grid">

        {/* ── Left: Form ───────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Basic Info */}
          <Card style={{ padding: "24px" }}>
            <SectionHead icon={<FileCheck size={16} color="#BDE8F5" />} title="Trial Information" />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              <div className="qc-basic-row">
                <div>
                  <Label required>Project</Label>
                  <select style={{ ...inputStyle, cursor: "pointer" }}
                    value={form.project} onChange={e => { upd("project", e.target.value); upd("item", ""); }}>
                    <option value="">Select project</option>
                    {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label required>Item / Component</Label>
                  <select style={{ ...inputStyle, cursor: "pointer" }}
                    value={form.item} onChange={e => upd("item", e.target.value)}>
                    <option value="">Select item</option>
                    {(ITEMS_BY_PROJECT[form.project] || []).map(it => <option key={it}>{it}</option>)}
                  </select>
                </div>
              </div>

              <div className="qc-basic-row">
                <div>
                  <Label required>Trial Type</Label>
                  <select style={{ ...inputStyle, cursor: "pointer" }}
                    value={form.trialType} onChange={e => upd("trialType", e.target.value)}>
                    <option value="">Select trial</option>
                    {TRIAL_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <Label required>Inspection Date</Label>
                  <input type="date" style={inputStyle}
                    value={form.inspectionDate} onChange={e => upd("inspectionDate", e.target.value)} />
                </div>
              </div>

              {/* Result */}
              <div>
                <Label required>Trial Result</Label>
                <div className="qc-result-grid">
                  {RESULTS.map(r => {
                    const c = resultColor[r] || {};
                    const active = form.result === r;
                    return (
                      <button key={r} onClick={() => upd("result", r)} style={{
                        padding: "10px 8px", borderRadius: 10, border: `1px solid ${active ? c.color : "rgba(73,136,196,0.2)"}`,
                        background: active ? c.bg : "#F5F8FD",
                        color: active ? c.color : "#4988C4",
                        fontSize: 12, fontWeight: 700, cursor: "pointer",
                        transition: "all 0.15s", fontFamily: "'DM Sans',sans-serif",
                      }}>{r}</button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label>Inspector Notes</Label>
                <textarea style={{ ...inputStyle, minHeight: 75, resize: "vertical" }}
                  placeholder="Any observations, remarks, or conditions…"
                  value={form.notes} onChange={e => upd("notes", e.target.value)} />
              </div>
            </div>
          </Card>
        </div>

        {/* ── Right: File uploads ───────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Trial results upload */}
          <Card style={{ padding: "24px" }}>
            <SectionHead icon={<FileCheck size={16} color="#BDE8F5" />} title="Trial Result Files" subtitle="PDF reports, test sheets" />
            <UploadBox
              label="Upload Trial Results"
              accept=".pdf,.xlsx,.xls,.doc,.docx"
              icon="📄"
              caption="PDF, Excel, Word documents"
              required
              onChange={handleFiles("trialFiles")}
            />
            {form.trialFiles.length > 0 && (
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                {form.trialFiles.map(f => (
                  <div key={f.name} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 12px", borderRadius: 8,
                    background: "rgba(52,199,89,0.06)", border: "1px solid rgba(52,199,89,0.2)",
                  }}>
                    <div>
                      <div style={{ color: "#0F2854", fontSize: 12, fontWeight: 600 }}>{f.name}</div>
                      <div style={{ color: "#4988C4", fontSize: 10 }}>{(f.size / 1024).toFixed(0)} KB</div>
                    </div>
                    <button onClick={() => removeFile("trialFiles", f.name)} style={{
                      background: "none", border: "none", cursor: "pointer", color: "#FF3B30", padding: 2,
                    }}><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Site images upload */}
          <Card style={{ padding: "24px" }}>
            <SectionHead icon={<Image size={16} color="#BDE8F5" />} title="Site Images" subtitle="Before / after photos, QC documentation" />
            <UploadBox
              label="Upload Site Images"
              accept="image/*"
              icon="📷"
              caption="JPG, PNG, HEIC photos"
              required
              onChange={handleFiles("siteImages")}
            />
            {form.siteImages.length > 0 && (
              <div className="qc-img-grid">
                {form.siteImages.map(f => (
                  <div key={f.name} style={{ position: "relative", borderRadius: 9, overflow: "hidden" }}>
                    <img src={f.url} alt={f.name} style={{ width: "100%", height: 72, objectFit: "cover" }} />
                    <button onClick={() => removeFile("siteImages", f.name)} style={{
                      position: "absolute", top: 3, right: 3,
                      background: "rgba(0,0,0,0.65)", border: "none", borderRadius: "50%",
                      width: 18, height: 18, color: "#fff", cursor: "pointer", fontSize: 10,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Submit */}
          <Card style={{ padding: "18px 22px", background: "linear-gradient(135deg,rgba(15,40,84,0.04),rgba(73,136,196,0.06))" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 14 }}>Submit for Inspection</div>
                <div style={{ color: "#4988C4", fontSize: 12, marginTop: 2 }}>
                  {form.trialFiles.length} trial file(s) · {form.siteImages.length} site image(s)
                </div>
              </div>
              <SubmitBtn loading={loading} color="green" onClick={handleSubmit}>
                <Send size={13} /> Submit QC
              </SubmitBtn>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}