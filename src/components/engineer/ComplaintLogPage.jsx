"use client";
import { useState } from "react";
import { MessageSquare, Plus, Trash2, CheckCircle, Package } from "lucide-react";
import {
  PageHeader, Card, SectionHead, Label, inputStyle, SubmitBtn,
  FONTS, PROJECTS, ITEMS_BY_PROJECT,
} from "./shared";

const SEVERITY_OPTS = ["Low", "Medium", "High", "Critical"];
const SEVERITY_COLORS = { Low: "#34C759", Medium: "#FF9500", High: "#FF3B30", Critical: "#9B1C1C" };
const MATERIAL_UNITS  = ["pcs", "kg", "m", "m²", "litre", "set", "lot"];

// 4-step flow
const STEPS = [
  { n: 1, label: "Select Project" },
  { n: 2, label: "Select Item"    },
  { n: 3, label: "Complaint Info" },
  { n: 4, label: "Materials"      },
];

export default function ComplaintLogPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    project: "", item: "",
    batch: "", contractor: "", gelCoat: "",
    title: "", description: "", severity: "Medium",
    photos: [],
  });
  const [materials, setMaterials] = useState([
    { id: 1, name: "", qty: "", unit: "pcs", urgent: false },
  ]);
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const upd = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // project metadata (simulated)
  const PROJECT_META = {
    "PRJ-2401": { batch: "BATCH-2024-A3", contractor: "Gulf Build Co.", gelCoat: "GC-7700 White" },
    "PRJ-2389": { batch: "BATCH-2024-B1", contractor: "Island Works Ltd.", gelCoat: "GC-5500 Aqua" },
    "PRJ-2376": { batch: "BATCH-2024-C2", contractor: "SunTech Corp.",    gelCoat: "GC-6600 Blue"  },
    "PRJ-2412": { batch: "BATCH-2024-D1", contractor: "Pacific Builders",  gelCoat: "GC-8800 Teal"  },
  };

  const selectProject = (id) => {
    const meta = PROJECT_META[id] || {};
    setForm(f => ({ ...f, project: id, item: "", batch: meta.batch || "", contractor: meta.contractor || "", gelCoat: meta.gelCoat || "" }));
    setStep(2);
  };

  const addMat  = () => setMaterials(m => [...m, { id: Date.now(), name: "", qty: "", unit: "pcs", urgent: false }]);
  const removeMat = (id) => setMaterials(m => m.filter(x => x.id !== id));
  const updMat  = (id, key, val) => setMaterials(m => m.map(x => x.id === id ? { ...x, [key]: val } : x));

  const handlePhoto = (e) => {
    const files = Array.from(e.target.files).map(f => ({ name: f.name, url: URL.createObjectURL(f) }));
    setForm(f => ({ ...f, photos: [...f.photos, ...files] }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  const selectedProject = PROJECTS.find(p => p.id === form.project);

  if (submitted) return (
    <>
      <style>{FONTS}</style>
      <div style={{ maxWidth: 500, margin: "80px auto", textAlign: "center" }}>
        <CheckCircle size={54} color="#34C759" strokeWidth={1.5} style={{ marginBottom: 14 }} />
        <h2 style={{ color: "#0F2854", fontSize: 22, fontWeight: 800, fontFamily: "'Syne',sans-serif", marginBottom: 8 }}>Complaint Logged!</h2>
        <p style={{ color: "#4988C4", fontSize: 14, marginBottom: 24 }}>Your complaint has been submitted to the service team for review.</p>
        <div style={{ background: "#fff", border: "1px solid rgba(73,136,196,0.15)", borderRadius: 12, padding: "16px 20px", marginBottom: 22, textAlign: "left" }}>
          {[
            ["Project",   selectedProject?.name || form.project],
            ["Item",      form.item],
            ["Severity",  form.severity],
            ["Materials", `${materials.filter(m => m.name).length} items requested`],
          ].map(([k,v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(73,136,196,0.07)" }}>
              <span style={{ color: "#4988C4", fontSize: 12 }}>{k}</span>
              <span style={{ color: "#0F2854", fontSize: 12, fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>
        <button onClick={() => { setSubmitted(false); setStep(1); setForm({ project:"",item:"",batch:"",contractor:"",gelCoat:"",title:"",description:"",severity:"Medium",photos:[] }); setMaterials([{id:1,name:"",qty:"",unit:"pcs",urgent:false}]); }} style={{
          background: "#0F2854", color: "#BDE8F5", border: "none",
          padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
        }}>Log Another Complaint</button>
      </div>
    </>
  );

  return (
    <>
      <style>{FONTS}</style>
      <PageHeader
        eyebrow="Field"
        title="Log a Complaint"
        subtitle="4-step complaint submission wizard"
      />

      {/* ── Step bar ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", marginBottom: 26, background: "#fff", borderRadius: 13, overflow: "hidden", border: "1px solid rgba(73,136,196,0.15)", boxShadow: "0 2px 10px rgba(15,40,84,0.05)" }}>
        {STEPS.map((s, i) => {
          const active   = step === s.n;
          const complete = step > s.n;
          return (
            <div key={s.n} onClick={() => complete && setStep(s.n)} style={{
              flex: 1, padding: "13px 10px", textAlign: "center",
              borderRight: i < 3 ? "1px solid rgba(73,136,196,0.1)" : "none",
              background: active ? "linear-gradient(135deg,#0F2854,#1C4D8D)" : complete ? "rgba(52,199,89,0.06)" : "#fff",
              cursor: complete ? "pointer" : "default",
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", margin: "0 auto 5px",
                background: active ? "rgba(255,255,255,0.2)" : complete ? "#34C759" : "rgba(73,136,196,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700,
                color: active ? "#BDE8F5" : complete ? "#fff" : "#4988C4",
              }}>
                {complete ? "✓" : s.n}
              </div>
              <div style={{ color: active ? "#BDE8F5" : complete ? "#34C759" : "#4988C4", fontSize: 11, fontWeight: 600 }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* ══ STEP 1: SELECT PROJECT ══ */}
      {step === 1 && (
        <Card style={{ padding: "26px", animation: "fadeUp 0.3s ease" }}>
          <SectionHead icon={<MessageSquare size={16} color="#BDE8F5" />} title="Select Project" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
            {PROJECTS.map(p => (
              <button key={p.id} onClick={() => selectProject(p.id)} style={{
                padding: "16px 18px", borderRadius: 13,
                border: "1.5px solid rgba(73,136,196,0.2)",
                background: "rgba(73,136,196,0.04)",
                cursor: "pointer", textAlign: "left",
                transition: "all 0.2s", fontFamily: "'DM Sans',sans-serif",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(73,136,196,0.1)"; e.currentTarget.style.borderColor = "#4988C4"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(73,136,196,0.04)"; e.currentTarget.style.borderColor = "rgba(73,136,196,0.2)"; }}
              >
                <div style={{ color: "#1C4D8D", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{p.id}</div>
                <div style={{ color: "#0F2854", fontSize: 14, fontWeight: 700 }}>{p.name}</div>
                <div style={{ color: "#4988C4", fontSize: 11, marginTop: 4 }}>📍 {p.location}</div>
                <div style={{ marginTop: 10, background: "rgba(73,136,196,0.1)", borderRadius: 99, height: 4 }}>
                  <div style={{ height: 4, borderRadius: 99, background: "#4988C4", width: `${p.progress}%` }} />
                </div>
                <div style={{ color: "#4988C4", fontSize: 10, marginTop: 3, textAlign: "right" }}>{p.progress}% complete</div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* ══ STEP 2: SELECT ITEM ══ */}
      {step === 2 && (
        <Card style={{ padding: "26px", animation: "fadeUp 0.3s ease" }}>
          <SectionHead icon={<MessageSquare size={16} color="#BDE8F5" />} title="Select Item" subtitle={selectedProject?.name} />

          {/* auto-loaded metadata */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
            {[
              ["Batch No.",   form.batch],
              ["Contractor",  form.contractor],
              ["Gel Coat",    form.gelCoat],
            ].map(([k, v]) => (
              <div key={k} style={{ background: "rgba(189,232,245,0.15)", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ color: "#4988C4", fontSize: 10, fontWeight: 600, marginBottom: 3 }}>{k.toUpperCase()}</div>
                <div style={{ color: "#0F2854", fontSize: 13, fontWeight: 700 }}>{v}</div>
              </div>
            ))}
          </div>

          <Label required>Item / Component</Label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
            {(ITEMS_BY_PROJECT[form.project] || []).map(item => (
              <button key={item} onClick={() => { upd("item", item); setStep(3); }} style={{
                padding: "12px 16px", borderRadius: 11,
                border: `1.5px solid ${form.item === item ? "#4988C4" : "rgba(73,136,196,0.2)"}`,
                background: form.item === item ? "rgba(73,136,196,0.1)" : "#F5F8FD",
                color: "#0F2854", fontSize: 13, fontWeight: 600,
                cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                fontFamily: "'DM Sans',sans-serif",
              }}>{item}</button>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <button onClick={() => setStep(1)} style={{
              background: "transparent", border: "1px solid rgba(73,136,196,0.3)",
              color: "#4988C4", padding: "10px 18px", borderRadius: 10,
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
            }}>← Back</button>
          </div>
        </Card>
      )}

      {/* ══ STEP 3: COMPLAINT DETAILS ══ */}
      {step === 3 && (
        <Card style={{ padding: "26px", animation: "fadeUp 0.3s ease" }}>
          <SectionHead icon={<MessageSquare size={16} color="#BDE8F5" />} title="Complaint Details" subtitle={`${selectedProject?.name} · ${form.item}`} />

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <Label required>Complaint Title</Label>
              <input style={inputStyle} placeholder="Brief title for this complaint…"
                value={form.title} onChange={e => upd("title", e.target.value)} />
            </div>
            <div>
              <Label required>Description</Label>
              <textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
                placeholder="Describe the complaint in detail — what, where, how it was noticed…"
                value={form.description} onChange={e => upd("description", e.target.value)} />
            </div>

            {/* Severity */}
            <div>
              <Label required>Severity</Label>
              <div style={{ display: "flex", gap: 10 }}>
                {SEVERITY_OPTS.map(s => {
                  const col = SEVERITY_COLORS[s];
                  const active = form.severity === s;
                  return (
                    <button key={s} onClick={() => upd("severity", s)} style={{
                      flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer",
                      background: active ? col : `${col}12`,
                      color: active ? "#fff" : col,
                      fontSize: 12, fontWeight: 700, transition: "all 0.15s",
                      fontFamily: "'DM Sans',sans-serif",
                    }}>{s}</button>
                  );
                })}
              </div>
            </div>

            {/* Photos */}
            <div>
              <Label>Photo Evidence</Label>
              <label style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                border: "2px dashed rgba(73,136,196,0.3)", borderRadius: 12, padding: "18px",
                cursor: "pointer", background: "rgba(189,232,245,0.04)", gap: 6,
              }}>
                <span style={{ fontSize: 24 }}>📷</span>
                <span style={{ color: "#1C4D8D", fontSize: 12, fontWeight: 600 }}>Upload Photos / Videos</span>
                <input type="file" accept="image/*,video/*" multiple style={{ display: "none" }} onChange={handlePhoto} />
              </label>
              {form.photos.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, marginTop: 8 }}>
                  {form.photos.map(p => (
                    <div key={p.name} style={{ position: "relative", borderRadius: 7, overflow: "hidden" }}>
                      <img src={p.url} alt="" style={{ width: "100%", height: 56, objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 22, display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => setStep(2)} style={{
              background: "transparent", border: "1px solid rgba(73,136,196,0.3)",
              color: "#4988C4", padding: "11px 18px", borderRadius: 10,
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
            }}>← Back</button>
            <SubmitBtn onClick={() => setStep(4)}>Continue to Materials →</SubmitBtn>
          </div>
        </Card>
      )}

      {/* ══ STEP 4: REQUIRED MATERIALS ══ */}
      {step === 4 && (
        <Card style={{ padding: "26px", animation: "fadeUp 0.3s ease" }}>
          <SectionHead icon={<Package size={16} color="#BDE8F5" />} title="Required Materials" subtitle="List materials needed for this complaint" />

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            {/* header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 80px 32px", gap: 10 }}>
              {["Material Name","Qty","Unit","Urgent",""].map(h => (
                <div key={h} style={{ color: "#4988C4", fontSize: 10, fontWeight: 600, letterSpacing: 0.5 }}>{h.toUpperCase()}</div>
              ))}
            </div>

            {materials.map(m => (
              <div key={m.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 80px 32px", gap: 10, alignItems: "center" }}>
                <input style={inputStyle} placeholder="e.g. Gel coat resin"
                  value={m.name} onChange={e => updMat(m.id, "name", e.target.value)} />
                <input type="number" min={0} style={inputStyle} placeholder="0"
                  value={m.qty} onChange={e => updMat(m.id, "qty", e.target.value)} />
                <select style={{ ...inputStyle, cursor: "pointer" }}
                  value={m.unit} onChange={e => updMat(m.id, "unit", e.target.value)}>
                  {MATERIAL_UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
                <button onClick={() => updMat(m.id, "urgent", !m.urgent)} style={{
                  padding: "6px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: m.urgent ? "rgba(255,59,48,0.12)" : "rgba(73,136,196,0.08)",
                  color: m.urgent ? "#FF3B30" : "#4988C4", fontSize: 11, fontWeight: 700,
                  fontFamily: "'DM Sans',sans-serif",
                }}>
                  {m.urgent ? "🔴 Urgent" : "Set Urgent"}
                </button>
                {materials.length > 1 && (
                  <button onClick={() => removeMat(m.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#FF3B30", padding: 0 }}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button onClick={addMat} style={{
            background: "rgba(73,136,196,0.07)", border: "1.5px dashed rgba(73,136,196,0.3)",
            color: "#1C4D8D", borderRadius: 10, padding: "10px",
            fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            fontFamily: "'DM Sans',sans-serif",
          }}>
            <Plus size={14} /> Add Material
          </button>

          <div style={{ marginTop: 22, display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => setStep(3)} style={{
              background: "transparent", border: "1px solid rgba(73,136,196,0.3)",
              color: "#4988C4", padding: "11px 18px", borderRadius: 10,
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
            }}>← Back</button>
            <SubmitBtn loading={loading} color="green" onClick={handleSubmit}>
              ✓ Submit Complaint
            </SubmitBtn>
          </div>
        </Card>
      )}
    </>
  );
}