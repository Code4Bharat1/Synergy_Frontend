"use client";
import { useState } from "react";
import {
  Search, MapPin, Package, Layers, HardHat, Palette,
  FileText, AlignLeft, AlertTriangle, Camera, Video,
  Plus, X, CheckCircle, ChevronLeft, ChevronRight, Send,
} from "lucide-react";
import { mockProjects, PageHeader, Card, inputStyle, labelStyle } from "./shared";

// ── Mock fallback ─────────────────────────────────────────────────────────────
const _mockProjects = (typeof mockProjects !== "undefined" ? mockProjects : [
  { id: "PRJ-2401", client: "AquaPark Dubai",    location: "Dubai",     items: ["Waterslide Alpha", "Lazy River Flume", "Body Slide 360"] },
  { id: "PRJ-2389", client: "Blue Lagoon Resort", location: "Maldives",  items: ["Wave Pool Panel B", "Speed Slide Mini"] },
  { id: "PRJ-2412", client: "Ocean World",        location: "Singapore", items: ["Funnel Ride X2", "Master Blaster"] },
  { id: "PRJ-2376", client: "SunSplash Inc.",     location: "Florida",   items: ["Speed Slide Pro"] },
]);

const STEPS = ["Select Project", "Select Item", "Complaint Details", "Required Materials"];

const _inputStyle = (typeof inputStyle !== "undefined" ? inputStyle : {
  width: "100%", boxSizing: "border-box",
  padding: "9px 12px",
  border: "1px solid rgba(73,136,196,0.25)", borderRadius: 8,
  fontSize: 13, color: "#0F2854", background: "#fff", outline: "none",
  fontFamily: "inherit",
});
const _labelStyle = (typeof labelStyle !== "undefined" ? labelStyle : {
  display: "block", fontSize: 10, fontWeight: 600,
  letterSpacing: 0.6, color: "#4988C4", marginBottom: 5, textTransform: "uppercase",
});

// ── StepBar ───────────────────────────────────────────────────────────────────
function StepBar({ step }) {
  return (
    <>
      <style>{`
        .stepbar { display: flex; align-items: center; margin-bottom: 28px; flex-wrap: nowrap; overflow-x: auto; padding-bottom: 4px; }
        .step-label { font-size: 12px; white-space: nowrap; }
        .step-connector { width: 36px; height: 2px; margin: 0 8px; flex-shrink: 0; transition: background 0.3s; }
        @media (max-width: 540px) {
          .step-label { display: none; }
          .step-connector { width: 20px; margin: 0 4px; }
          .stepbar { justify-content: center; }
        }
      `}</style>
      <div className="stepbar">
        {STEPS.map((label, i) => {
          const s = i + 1;
          const done   = step > s;
          const active = step === s;
          return (
            <div key={s} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: done || active ? "#0F2854" : "#fff",
                  border: `2px solid ${done || active ? "#0F2854" : "rgba(73,136,196,0.3)"}`,
                  color: done || active ? "#BDE8F5" : "#4988C4",
                  fontSize: 12, fontWeight: 700, flexShrink: 0, transition: "all 0.3s",
                }}>
                  {done ? <CheckCircle size={14} /> : s}
                </div>
                <span className="step-label" style={{
                  fontWeight: active ? 700 : 400,
                  color: active ? "#0F2854" : done ? "#4988C4" : "#9DB5C8",
                }}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="step-connector" style={{ background: done ? "#0F2854" : "rgba(73,136,196,0.2)" }} />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── IconInput ─────────────────────────────────────────────────────────────────
function IconInput({ icon: Icon, ...props }) {
  return (
    <div style={{ position: "relative" }}>
      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#4988C4", pointerEvents: "none", display: "flex" }}>
        <Icon size={13} />
      </span>
      <input {...props} style={{ ..._inputStyle, paddingLeft: 30, ...props.style }} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LogComplaintPage() {
  const [step, setStep]       = useState(1);
  const [form, setForm]       = useState({
    project: null, item: "", batchNo: "BT-2024-117", contractor: "AquaBuild LLC", gelCoat: "GC-003-A",
    title: "", desc: "", severity: "Medium", materials: [],
  });
  const [mat, setMat]         = useState({ name: "", qty: "", cost: "" });
  const [submitted, setSubmitted] = useState(false);

  const upd = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const addMaterial = () => {
    if (!mat.name) return;
    setForm(f => ({ ...f, materials: [...f.materials, { ...mat }] }));
    setMat({ name: "", qty: "", cost: "" });
  };
  const removeMaterial = idx => setForm(f => ({ ...f, materials: f.materials.filter((_, i) => i !== idx) }));

  const resetAll = () => {
    setSubmitted(false); setStep(1);
    setForm({ project: null, item: "", batchNo: "BT-2024-117", contractor: "AquaBuild LLC", gelCoat: "GC-003-A", title: "", desc: "", severity: "Medium", materials: [] });
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) return (
    <>
      <style>{`.lc-wrapper{font-family:'DM Sans','Segoe UI',sans-serif;padding:16px;max-width:100%;box-sizing:border-box}`}</style>
      <div className="lc-wrapper">
        <div style={{ marginBottom: 24 }}>
          <div style={{ color: "#4988C4", fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>New Entry</div>
          <h1 style={{ color: "#0F2854", fontSize: "clamp(20px,4vw,26px)", fontWeight: 800, margin: 0 }}>Log New Complaint</h1>
        </div>
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(73,136,196,0.15)", boxShadow: "0 2px 12px rgba(15,40,84,0.06)", padding: "48px 32px", textAlign: "center", maxWidth: 520 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(52,199,89,0.12)", border: "2px solid #34C759", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <CheckCircle size={30} color="#34C759" />
          </div>
          <div style={{ color: "#0F2854", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Complaint Submitted!</div>
          <div style={{ color: "#4988C4", fontSize: 13, marginBottom: 24 }}>
            Complaint ID <strong>CMP-009</strong> has been created for {form.project?.client}.
          </div>
          <button onClick={resetAll} style={{ background: "#0F2854", color: "#BDE8F5", border: "none", padding: "10px 24px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
            <Plus size={14} /> Log Another Complaint
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        .lc-wrapper {
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          padding: 16px;
          max-width: 100%;
          box-sizing: border-box;
        }
        .lc-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid rgba(73,136,196,0.15);
          box-shadow: 0 2px 12px rgba(15,40,84,0.06);
          padding: 28px;
          width: 100%;
          box-sizing: border-box;
        }

        /* Project grid: 2 cols → 1 col */
        .project-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }
        @media (max-width: 540px) {
          .project-grid { grid-template-columns: 1fr; }
          .lc-card { padding: 20px 16px; }
        }

        /* Item detail auto-loaded grid */
        .item-detail-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        @media (max-width: 540px) {
          .item-detail-grid { grid-template-columns: 1fr 1fr; }
        }

        /* Upload boxes */
        .upload-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 480px) {
          .upload-grid { grid-template-columns: 1fr; }
        }

        /* Material add row */
        .mat-add-row {
          display: grid;
          grid-template-columns: 1fr 100px 120px auto;
          gap: 10px;
          margin-bottom: 14px;
          align-items: end;
        }
        @media (max-width: 600px) {
          .mat-add-row {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto auto;
          }
          .mat-add-btn { grid-column: span 2; }
        }

        /* Material table → cards on mobile */
        .mat-table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .mat-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 380px; }
        .mat-th { padding: 8px 14px; text-align: left; color: #1C4D8D; font-size: 11px; font-weight: 600; }
        .mat-td { padding: 10px 14px; }

        .mat-mob-cards { display: none; }
        @media (max-width: 600px) {
          .mat-table-scroll { display: none; }
          .mat-mob-cards { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
          .mat-mob-card {
            display: flex; justify-content: space-between; align-items: center;
            padding: 10px 12px; border-radius: 10px;
            border: 1px solid rgba(73,136,196,0.12);
            background: rgba(189,232,245,0.04);
          }
          .mat-mob-name { color: #0F2854; font-weight: 600; font-size: 13px; }
          .mat-mob-meta { color: #4988C4; font-size: 11px; display: flex; gap: 8px; margin-top: 2px; }
        }

        /* Nav buttons */
        .nav-row {
          display: flex;
          justify-content: space-between;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid rgba(73,136,196,0.1);
          gap: 10px;
        }
        .btn-back {
          background: transparent;
          border: 1px solid rgba(73,136,196,0.3);
          color: #4988C4;
          padding: 8px 20px; border-radius: 8px;
          font-size: 13px; cursor: pointer; font-weight: 600;
          display: inline-flex; align-items: center; gap: 6px;
          font-family: inherit;
        }
        .btn-next {
          background: #0F2854; color: #BDE8F5; border: none;
          padding: 8px 24px; border-radius: 8px;
          font-size: 13px; cursor: pointer; font-weight: 600;
          display: inline-flex; align-items: center; gap: 6px;
          font-family: inherit;
        }
        .btn-submit {
          width: 100%;
          background: linear-gradient(135deg, #0F2854, #1C4D8D);
          color: #BDE8F5; border: none;
          padding: 14px; border-radius: 10px;
          font-size: 14px; font-weight: 700; cursor: pointer;
          letter-spacing: 0.5px; margin-top: 22px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          font-family: inherit;
        }
      `}</style>

      <div className="lc-wrapper">

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ color: "#4988C4", fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>New Entry</div>
          <h1 style={{ color: "#0F2854", fontSize: "clamp(20px,4vw,26px)", fontWeight: 800, margin: 0 }}>Log New Complaint</h1>
          <p style={{ color: "#4988C4", fontSize: 13, margin: "4px 0 0" }}>Follow the steps to register a new complaint</p>
        </div>

        <div className="lc-card">
          <StepBar step={step} />

          {/* ── Step 1: Select Project ── */}
          {step === 1 && (
            <div>
              <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Step 1 — Select Project</div>
              <div style={{ marginBottom: 16 }}>
                <label style={_labelStyle}>SEARCH BY PROJECT NUMBER</label>
                <IconInput icon={Search} placeholder="Type to search..." />
              </div>
              <div className="project-grid">
                {_mockProjects.map(p => (
                  <div key={p.id} onClick={() => upd("project", p)} style={{
                    padding: "14px 16px", borderRadius: 10, cursor: "pointer",
                    border: `2px solid ${form.project?.id === p.id ? "#0F2854" : "rgba(73,136,196,0.2)"}`,
                    background: form.project?.id === p.id ? "rgba(15,40,84,0.04)" : "#fff",
                    transition: "all 0.2s",
                  }}>
                    <div style={{ color: "#1C4D8D", fontWeight: 700, fontSize: 12, marginBottom: 2 }}>{p.id}</div>
                    <div style={{ color: "#0F2854", fontWeight: 600, fontSize: 13 }}>{p.client}</div>
                    <div style={{ color: "#4988C4", fontSize: 11, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={11} /> {p.location}
                    </div>
                  </div>
                ))}
              </div>
              {form.project && (
                <div style={{ background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#1C4D8D", display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle size={13} color="#34C759" />
                  Auto-loaded: <strong>{form.project.client}</strong> · {form.project.location} · {form.project.items.length} items installed
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Select Item ── */}
          {step === 2 && (
            <div>
              <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Step 2 — Select Item</div>
              {!form.project ? (
                <div style={{ background: "rgba(255,149,0,0.08)", border: "1px solid rgba(255,149,0,0.25)", borderRadius: 8, padding: "12px 14px", color: "#FF9500", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                  <ChevronLeft size={14} /> Please go back and select a project first.
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={_labelStyle}>INSTALLED ITEMS — {form.project.id}</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#4988C4", display: "flex", pointerEvents: "none" }}><Package size={13} /></span>
                      <select style={{ ..._inputStyle, paddingLeft: 30, cursor: "pointer", appearance: "none" }} value={form.item} onChange={e => upd("item", e.target.value)}>
                        <option value="">Choose an item...</option>
                        {form.project.items.map(it => <option key={it}>{it}</option>)}
                      </select>
                    </div>
                  </div>
                  {form.item && (
                    <div style={{ background: "rgba(189,232,245,0.15)", border: "1px solid rgba(73,136,196,0.2)", borderRadius: 10, padding: "18px" }}>
                      <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 13, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                        <Package size={14} color="#4988C4" /> Item Details (Auto-loaded)
                      </div>
                      <div className="item-detail-grid">
                        {[["Batch Number", form.batchNo, Layers], ["Contractor Name", form.contractor, HardHat], ["Gel Coat Batch", form.gelCoat, Palette]].map(([k, v, Icon]) => (
                          <div key={k}>
                            <div style={{ color: "#4988C4", fontSize: 10, fontWeight: 600, letterSpacing: 0.5, marginBottom: 4, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
                              <Icon size={10} /> {k}
                            </div>
                            <div style={{ color: "#0F2854", fontSize: 13, fontWeight: 700 }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Step 3: Complaint Details ── */}
          {step === 3 && (
            <div>
              <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Step 3 — Complaint Details</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                <div>
                  <label style={_labelStyle}>COMPLAINT TITLE *</label>
                  <IconInput icon={FileText} placeholder="Short description of the issue..." value={form.title} onChange={e => upd("title", e.target.value)} />
                </div>

                <div>
                  <label style={_labelStyle}>DESCRIPTION *</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 10, top: 12, color: "#4988C4", display: "flex", pointerEvents: "none" }}><AlignLeft size={13} /></span>
                    <textarea style={{ ..._inputStyle, minHeight: 90, resize: "vertical", paddingLeft: 30 }} placeholder="Detailed description..." value={form.desc} onChange={e => upd("desc", e.target.value)} />
                  </div>
                </div>

                <div>
                  <label style={_labelStyle}>SEVERITY LEVEL</label>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {["Low", "Medium", "High", "Critical"].map(s => {
                      const colors = { Low: "#34C759", Medium: "#FFCC00", High: "#FF9500", Critical: "#FF3B30" };
                      const active = form.severity === s;
                      return (
                        <button key={s} onClick={() => upd("severity", s)} style={{
                          flex: "1 1 60px", padding: "9px 4px", borderRadius: 8,
                          border: `2px solid ${active ? colors[s] : "rgba(73,136,196,0.2)"}`,
                          background: active ? `${colors[s]}18` : "#fff",
                          color: active ? colors[s] : "#4988C4",
                          fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                          fontFamily: "inherit",
                        }}>
                          {s === "Critical" && <AlertTriangle size={10} style={{ marginRight: 3 }} />}
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="upload-grid">
                  {[
                    { label: "PHOTO UPLOAD *", accept: "image/*", Icon: Camera, hint: "Click to upload photos", multiple: true },
                    { label: "VIDEO UPLOAD (OPTIONAL)", accept: "video/*", Icon: Video, hint: "Click to upload video", multiple: false },
                  ].map(({ label, accept, Icon, hint, multiple }) => (
                    <div key={label}>
                      <label style={_labelStyle}>{label}</label>
                      <label style={{
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        border: "2px dashed rgba(73,136,196,0.35)", borderRadius: 10, padding: "24px 16px",
                        color: "#4988C4", fontSize: 12, cursor: "pointer", gap: 8,
                        background: "rgba(189,232,245,0.05)", transition: "all 0.2s",
                      }}>
                        <Icon size={28} color="rgba(73,136,196,0.5)" />
                        <span>{hint}</span>
                        <input type="file" accept={accept} multiple={multiple} style={{ display: "none" }} />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Required Materials ── */}
          {step === 4 && (
            <div>
              <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Step 4 — Required Materials</div>

              {/* Add material row */}
              <div className="mat-add-row">
                <div>
                  <label style={_labelStyle}>MATERIAL NAME</label>
                  <IconInput icon={Package} placeholder="e.g. Gel coat resin" value={mat.name} onChange={e => setMat(m => ({ ...m, name: e.target.value }))} />
                </div>
                <div>
                  <label style={_labelStyle}>QUANTITY</label>
                  <input style={_inputStyle} type="number" placeholder="0" value={mat.qty} onChange={e => setMat(m => ({ ...m, qty: e.target.value }))} />
                </div>
                <div>
                  <label style={_labelStyle}>EST. COST (USD)</label>
                  <input style={_inputStyle} type="number" placeholder="0.00" value={mat.cost} onChange={e => setMat(m => ({ ...m, cost: e.target.value }))} />
                </div>
                <button onClick={addMaterial} className="mat-add-btn" style={{
                  background: "#0F2854", color: "#BDE8F5", border: "none",
                  padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5,
                  fontFamily: "inherit",
                }}>
                  <Plus size={14} /> Add
                </button>
              </div>

              {form.materials.length === 0 ? (
                <div style={{ background: "rgba(189,232,245,0.1)", borderRadius: 8, padding: "20px", textAlign: "center", color: "#4988C4", fontSize: 12, border: "1px dashed rgba(73,136,196,0.2)" }}>
                  No materials added yet.
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div style={{ border: "1px solid rgba(73,136,196,0.2)", borderRadius: 10, overflow: "hidden" }}>
                    <div className="mat-table-scroll">
                      <table className="mat-table">
                        <thead><tr style={{ background: "rgba(189,232,245,0.2)" }}>
                          {["Material", "Qty", "Est. Cost", ""].map((h, i) => (
                            <th key={i} className="mat-th">{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>
                          {form.materials.map((m, i) => (
                            <tr key={i} style={{ borderTop: "1px solid rgba(73,136,196,0.1)" }}>
                              <td className="mat-td" style={{ color: "#0F2854" }}>{m.name}</td>
                              <td className="mat-td" style={{ color: "#4988C4" }}>{m.qty}</td>
                              <td className="mat-td" style={{ color: "#34C759", fontWeight: 700 }}>${m.cost}</td>
                              <td className="mat-td">
                                <button onClick={() => removeMaterial(i)} style={{ background: "none", border: "none", color: "#FF3B30", cursor: "pointer", display: "flex", alignItems: "center" }}>
                                  <X size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          <tr style={{ borderTop: "2px solid rgba(73,136,196,0.15)", background: "rgba(189,232,245,0.1)" }}>
                            <td colSpan={2} className="mat-td" style={{ color: "#0F2854", fontWeight: 700, fontSize: 12 }}>TOTAL ESTIMATED COST</td>
                            <td className="mat-td" style={{ color: "#0F2854", fontWeight: 800 }}>
                              ${form.materials.reduce((s, m) => s + (parseFloat(m.cost) || 0), 0).toFixed(2)}
                            </td>
                            <td />
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile material cards */}
                    <div className="mat-mob-cards">
                      {form.materials.map((m, i) => (
                        <div key={i} className="mat-mob-card">
                          <div>
                            <div className="mat-mob-name">{m.name}</div>
                            <div className="mat-mob-meta">
                              <span>Qty: {m.qty}</span>
                              <span style={{ color: "#34C759", fontWeight: 700 }}>${m.cost}</span>
                            </div>
                          </div>
                          <button onClick={() => removeMaterial(i)} style={{ background: "none", border: "none", color: "#FF3B30", cursor: "pointer", display: "flex", alignItems: "center" }}>
                            <X size={15} />
                          </button>
                        </div>
                      ))}
                      <div style={{ padding: "10px 12px", background: "rgba(189,232,245,0.1)", borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#0F2854", fontWeight: 700, fontSize: 12 }}>TOTAL</span>
                        <span style={{ color: "#0F2854", fontWeight: 800 }}>
                          ${form.materials.reduce((s, m) => s + (parseFloat(m.cost) || 0), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <button onClick={() => setSubmitted(true)} className="btn-submit">
                <Send size={15} /> Submit Complaint
              </button>
            </div>
          )}

          {/* ── Nav Buttons ── */}
          <div className="nav-row">
            <button
              onClick={() => setStep(s => Math.max(1, s - 1))}
              className="btn-back"
              style={{ visibility: step === 1 ? "hidden" : "visible" }}
            >
              <ChevronLeft size={14} /> Back
            </button>
            {step < 4 && (
              <button onClick={() => setStep(s => Math.min(4, s + 1))} className="btn-next">
                Continue <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>

      </div>
    </>
  );
}