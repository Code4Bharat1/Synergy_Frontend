"use client";
import { useState } from "react";
import { mockProjects, PageHeader, Card, inputStyle, labelStyle } from "./shared";

const STEPS = ["Select Project", "Select Item", "Complaint Details", "Required Materials"];

function StepBar({ step }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
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
                fontSize: 12, fontWeight: 700, transition: "all 0.3s",
                flexShrink: 0,
              }}>{done ? "✓" : s}</div>
              <span style={{
                fontSize: 12, fontWeight: active ? 700 : 400,
                color: active ? "#0F2854" : done ? "#4988C4" : "#9DB5C8",
                whiteSpace: "nowrap",
              }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                width: 36, height: 2, margin: "0 10px",
                background: done ? "#0F2854" : "rgba(73,136,196,0.2)",
                transition: "all 0.3s", flexShrink: 0,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function LogComplaintPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    project: null, item: "", batchNo: "BT-2024-117", contractor: "AquaBuild LLC", gelCoat: "GC-003-A",
    title: "", desc: "", severity: "Medium", materials: [],
  });
  const [mat, setMat] = useState({ name: "", qty: "", cost: "" });
  const [submitted, setSubmitted] = useState(false);

  const upd = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const addMaterial = () => {
    if (!mat.name) return;
    setForm(f => ({ ...f, materials: [...f.materials, { ...mat }] }));
    setMat({ name: "", qty: "", cost: "" });
  };

  const removeMaterial = (idx) => setForm(f => ({ ...f, materials: f.materials.filter((_, i) => i !== idx) }));

  if (submitted) return (
    <div>
      <PageHeader eyebrow="New Entry" title="Log New Complaint" />
      <Card style={{ padding: "48px", textAlign: "center", maxWidth: 520 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
        <div style={{ color: "#0F2854", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Complaint Submitted!</div>
        <div style={{ color: "#4988C4", fontSize: 13, marginBottom: 24 }}>
          Complaint ID <strong>CMP-009</strong> has been created for {form.project?.client}.
        </div>
        <button onClick={() => { setSubmitted(false); setStep(1); setForm({ project: null, item: "", batchNo: "BT-2024-117", contractor: "AquaBuild LLC", gelCoat: "GC-003-A", title: "", desc: "", severity: "Medium", materials: [] }); }}
          style={{ background: "#0F2854", color: "#BDE8F5", border: "none", padding: "10px 24px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          + Log Another Complaint
        </button>
      </Card>
    </div>
  );

  return (
    <div>
      <PageHeader eyebrow="New Entry" title="Log New Complaint" subtitle="Follow the steps to register a new complaint" />

      <Card style={{ padding: "28px", maxWidth: 700 }}>
        <StepBar step={step} />

        {/* ── Step 1: Select Project ──────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>
              Step 1 — Select Project
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>SEARCH BY PROJECT NUMBER</label>
              <input style={inputStyle} placeholder="Type to search..." />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {mockProjects.map(p => (
                <div key={p.id} onClick={() => upd("project", p)} style={{
                  padding: "14px 16px", borderRadius: 10, cursor: "pointer",
                  border: `2px solid ${form.project?.id === p.id ? "#0F2854" : "rgba(73,136,196,0.2)"}`,
                  background: form.project?.id === p.id ? "rgba(15,40,84,0.04)" : "#fff",
                  transition: "all 0.2s",
                }}>
                  <div style={{ color: "#1C4D8D", fontWeight: 700, fontSize: 12, marginBottom: 2 }}>{p.id}</div>
                  <div style={{ color: "#0F2854", fontWeight: 600, fontSize: 13 }}>{p.client}</div>
                  <div style={{ color: "#4988C4", fontSize: 11, marginTop: 4 }}>📍 {p.location}</div>
                </div>
              ))}
            </div>
            {form.project && (
              <div style={{ background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#1C4D8D" }}>
                ✓ Auto-loaded: <strong>{form.project.client}</strong> · {form.project.location} · {form.project.items.length} items installed
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Select Item ─────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>
              Step 2 — Select Item
            </div>
            {!form.project ? (
              <div style={{ background: "rgba(255,149,0,0.08)", border: "1px solid rgba(255,149,0,0.25)", borderRadius: 8, padding: "12px 14px", color: "#FF9500", fontSize: 13 }}>
                ← Please go back and select a project first.
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>INSTALLED ITEMS — {form.project.id}</label>
                  <select style={{ ...inputStyle, cursor: "pointer" }} value={form.item} onChange={e => upd("item", e.target.value)}>
                    <option value="">Choose an item...</option>
                    {form.project.items.map(it => <option key={it}>{it}</option>)}
                  </select>
                </div>
                {form.item && (
                  <div style={{ background: "rgba(189,232,245,0.15)", border: "1px solid rgba(73,136,196,0.2)", borderRadius: 10, padding: "18px" }}>
                    <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 13, marginBottom: 14 }}>📦 Item Details (Auto-loaded)</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                      {[["Batch Number", form.batchNo], ["Contractor Name", form.contractor], ["Gel Coat Batch", form.gelCoat]].map(([k, v]) => (
                        <div key={k}>
                          <div style={{ color: "#4988C4", fontSize: 10, fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>{k.toUpperCase()}</div>
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

        {/* ── Step 3: Complaint Details ───────────────────────────────────── */}
        {step === 3 && (
          <div>
            <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>
              Step 3 — Complaint Details
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>COMPLAINT TITLE *</label>
                <input style={inputStyle} placeholder="Short description of the issue..." value={form.title} onChange={e => upd("title", e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>DESCRIPTION *</label>
                <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} placeholder="Detailed description..." value={form.desc} onChange={e => upd("desc", e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>SEVERITY LEVEL</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {["Low", "Medium", "High", "Critical"].map(s => {
                    const colors = { Low: "#34C759", Medium: "#FFCC00", High: "#FF9500", Critical: "#FF3B30" };
                    const active = form.severity === s;
                    return (
                      <button key={s} onClick={() => upd("severity", s)} style={{
                        flex: 1, padding: "9px 4px", borderRadius: 8,
                        border: `2px solid ${active ? colors[s] : "rgba(73,136,196,0.2)"}`,
                        background: active ? `${colors[s]}18` : "#fff",
                        color: active ? colors[s] : "#4988C4",
                        fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                      }}>{s}</button>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelStyle}>PHOTO UPLOAD *</label>
                  <label style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    border: "2px dashed rgba(73,136,196,0.35)", borderRadius: 10, padding: "24px 16px",
                    color: "#4988C4", fontSize: 12, cursor: "pointer", gap: 6,
                    background: "rgba(189,232,245,0.05)", transition: "all 0.2s",
                  }}>
                    <span style={{ fontSize: 28 }}>📷</span>
                    <span>Click to upload photos</span>
                    <input type="file" accept="image/*" multiple style={{ display: "none" }} />
                  </label>
                </div>
                <div>
                  <label style={labelStyle}>VIDEO UPLOAD (OPTIONAL)</label>
                  <label style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    border: "2px dashed rgba(73,136,196,0.35)", borderRadius: 10, padding: "24px 16px",
                    color: "#4988C4", fontSize: 12, cursor: "pointer", gap: 6,
                    background: "rgba(189,232,245,0.05)",
                  }}>
                    <span style={{ fontSize: 28 }}>🎥</span>
                    <span>Click to upload video</span>
                    <input type="file" accept="video/*" style={{ display: "none" }} />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Required Materials ──────────────────────────────────── */}
        {step === 4 && (
          <div>
            <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>
              Step 4 — Required Materials
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px auto", gap: 10, marginBottom: 14, alignItems: "end" }}>
              <div>
                <label style={labelStyle}>MATERIAL NAME</label>
                <input style={inputStyle} placeholder="e.g. Gel coat resin" value={mat.name} onChange={e => setMat(m => ({ ...m, name: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>QUANTITY</label>
                <input style={inputStyle} type="number" placeholder="0" value={mat.qty} onChange={e => setMat(m => ({ ...m, qty: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>EST. COST (USD)</label>
                <input style={inputStyle} type="number" placeholder="0.00" value={mat.cost} onChange={e => setMat(m => ({ ...m, cost: e.target.value }))} />
              </div>
              <button onClick={addMaterial} style={{
                background: "#0F2854", color: "#BDE8F5", border: "none",
                padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 2,
              }}>+ Add</button>
            </div>

            {form.materials.length === 0 ? (
              <div style={{ background: "rgba(189,232,245,0.1)", borderRadius: 8, padding: "20px", textAlign: "center", color: "#4988C4", fontSize: 12, border: "1px dashed rgba(73,136,196,0.2)" }}>
                No materials added yet.
              </div>
            ) : (
              <div style={{ border: "1px solid rgba(73,136,196,0.2)", borderRadius: 10, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ background: "rgba(189,232,245,0.2)" }}>
                    {["Material", "Qty", "Est. Cost", ""].map((h, i) => (
                      <th key={i} style={{ padding: "8px 14px", textAlign: "left", color: "#1C4D8D", fontSize: 11, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {form.materials.map((m, i) => (
                      <tr key={i} style={{ borderTop: "1px solid rgba(73,136,196,0.1)" }}>
                        <td style={{ padding: "10px 14px", color: "#0F2854" }}>{m.name}</td>
                        <td style={{ padding: "10px 14px", color: "#4988C4" }}>{m.qty}</td>
                        <td style={{ padding: "10px 14px", color: "#34C759", fontWeight: 700 }}>${m.cost}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <button onClick={() => removeMaterial(i)} style={{ background: "none", border: "none", color: "#FF3B30", cursor: "pointer", fontSize: 14 }}>✕</button>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: "2px solid rgba(73,136,196,0.15)", background: "rgba(189,232,245,0.1)" }}>
                      <td colSpan={2} style={{ padding: "10px 14px", color: "#0F2854", fontWeight: 700, fontSize: 12 }}>TOTAL ESTIMATED COST</td>
                      <td style={{ padding: "10px 14px", color: "#0F2854", fontWeight: 800 }}>
                        ${form.materials.reduce((sum, m) => sum + (parseFloat(m.cost) || 0), 0).toFixed(2)}
                      </td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <button onClick={() => setSubmitted(true)} style={{
              marginTop: 22, width: "100%",
              background: "linear-gradient(135deg, #0F2854, #1C4D8D)",
              color: "#BDE8F5", border: "none", padding: "14px", borderRadius: 10,
              fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5,
            }}>✦ Submit Complaint</button>
          </div>
        )}

        {/* ── Nav Buttons ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(73,136,196,0.1)" }}>
          <button onClick={() => setStep(s => Math.max(1, s - 1))} style={{
            background: "transparent", border: "1px solid rgba(73,136,196,0.3)", color: "#4988C4",
            padding: "8px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600,
            visibility: step === 1 ? "hidden" : "visible",
          }}>← Back</button>

          {step < 4 && (
            <button onClick={() => setStep(s => Math.min(4, s + 1))} style={{
              background: "#0F2854", color: "#BDE8F5", border: "none",
              padding: "8px 24px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600,
            }}>Continue →</button>
          )}
        </div>
      </Card>
    </div>
  );
}