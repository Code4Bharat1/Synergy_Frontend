"use client";
import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Plus, Trash2, CheckCircle, Package, Loader2, AlertCircle } from "lucide-react";
import {
  PageHeader, Card, SectionHead, Label, inputStyle, SubmitBtn,
  FONTS, PROJECTS as MOCK_PROJECTS, ITEMS_BY_PROJECT,
} from "./shared";
import axiosInstance from "../../lib/axios";

// ── API helpers ────────────────────────────────────────────────────────────────
const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

const authCfg = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

const SEVERITY_OPTS = ["low", "medium", "high", "critical"];
const SEVERITY_LABELS = { low: "Low", medium: "Medium", high: "High", critical: "Critical" };
const SEVERITY_COLORS = { low: "#34C759", medium: "#FF9500", high: "#FF3B30", critical: "#9B1C1C" };
const MATERIAL_UNITS = ["pcs", "kg", "m", "m²", "litre", "set", "lot"];

const STEPS = [
  { n: 1, label: "Select Project" },
  { n: 2, label: "Select Item" },
  { n: 3, label: "Complaint Info" },
  { n: 4, label: "Materials" },
];

export default function ComplaintLogPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    project: "", item: "", title: "", description: "", severity: "medium", photos: [],
  });
  const [materials, setMaterials] = useState([
    { id: 1, name: "", qty: "", unit: "pcs", urgent: false },
  ]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [error, setError] = useState(null);

  const upd = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // ── Fetch projects + recent complaints ────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    try {
      setProjectsLoading(true);
      const r = await axiosInstance.get("/projects", authCfg());
      const data = Array.isArray(r.data) ? r.data : r.data.projects || [];
      setProjects(data.length > 0 ? data : MOCK_PROJECTS);
    } catch {
      setProjects(MOCK_PROJECTS);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  const fetchRecentComplaints = useCallback(async () => {
    try {
      const r = await axiosInstance.get("/complaints", authCfg());
      const data = Array.isArray(r.data) ? r.data : [];
      setRecentComplaints(data.slice(0, 3));
    } catch {
      setRecentComplaints([]);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchRecentComplaints();
  }, [fetchProjects, fetchRecentComplaints]);

  const selectedProject = projects.find(p => (p._id || p.id) === form.project);

  // ── Material helpers ──────────────────────────────────────────────────────────
  const addMat = () => setMaterials(m => [...m, { id: Date.now(), name: "", qty: "", unit: "pcs", urgent: false }]);
  const removeMat = (id) => setMaterials(m => m.filter(x => x.id !== id));
  const updMat = (id, key, val) => setMaterials(m => m.map(x => x.id === id ? { ...x, [key]: val } : x));

  const handlePhoto = (e) => {
    const files = Array.from(e.target.files).map(f => ({ name: f.name, url: URL.createObjectURL(f) }));
    setForm(f => ({ ...f, photos: [...f.photos, ...files] }));
  };

  const selectProject = (id) => {
    setForm(f => ({ ...f, project: id, item: "" }));
    setStep(2);
  };

  // ── Submit complaint to backend ───────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.title.trim()) return setError("Please enter a complaint title.");
    if (!form.description.trim()) return setError("Please enter a description.");

    setLoading(true);
    setError(null);
    try {
      await axiosInstance.post("/complaints", {
        title: form.title.trim(),
        description: form.description.trim(),
        project: form.project || undefined,
        priority: form.severity,
        status: "open",
      }, authCfg());

      await fetchRecentComplaints();
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit complaint. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setStep(1);
    setForm({ project: "", item: "", title: "", description: "", severity: "medium", photos: [] });
    setMaterials([{ id: 1, name: "", qty: "", unit: "pcs", urgent: false }]);
    setError(null);
  };

  // ── Success screen ────────────────────────────────────────────────────────────
  if (submitted) return (
    <>
      <style>{FONTS}</style>
      <div style={{ maxWidth: 500, margin: "80px auto", textAlign: "center" }}>
        <CheckCircle size={54} color="#34C759" strokeWidth={1.5} style={{ marginBottom: 14 }} />
        <h2 style={{ color: "#0F2854", fontSize: 22, fontWeight: 800, fontFamily: "'Syne',sans-serif", marginBottom: 8 }}>Complaint Logged!</h2>
        <p style={{ color: "#4988C4", fontSize: 14, marginBottom: 24 }}>Your complaint has been submitted to the service team for review.</p>
        <div style={{ background: "#fff", border: "1px solid rgba(73,136,196,0.15)", borderRadius: 12, padding: "16px 20px", marginBottom: 22, textAlign: "left" }}>
          {[
            ["Project", selectedProject?.name || form.project || "—"],
            ["Item", form.item || "—"],
            ["Severity", SEVERITY_LABELS[form.severity]],
            ["Materials", `${materials.filter(m => m.name).length} items requested`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(73,136,196,0.07)" }}>
              <span style={{ color: "#4988C4", fontSize: 12 }}>{k}</span>
              <span style={{ color: "#0F2854", fontSize: 12, fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>
        <button onClick={resetForm} style={{
          background: "#0F2854", color: "#BDE8F5", border: "none",
          padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
        }}>Log Another Complaint</button>
      </div>
    </>
  );

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{FONTS}</style>
      <PageHeader
        eyebrow="Field"
        title="Log a Complaint"
        subtitle="4-step complaint submission wizard"
      />

      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
          background: "rgba(255,59,48,0.06)", border: "1px solid rgba(255,59,48,0.2)",
          borderRadius: 10, padding: "10px 14px",
        }}>
          <AlertCircle size={14} color="#FF3B30" />
          <span style={{ color: "#FF3B30", fontSize: 13 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#FF3B30", fontSize: 16 }}>×</button>
        </div>
      )}

      {/* ── Step bar ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", marginBottom: 26, background: "#fff", borderRadius: 13, overflow: "hidden", border: "1px solid rgba(73,136,196,0.15)", boxShadow: "0 2px 10px rgba(15,40,84,0.05)" }}>
        {STEPS.map((s, i) => {
          const active = step === s.n;
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
          {projectsLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#4988C4", padding: "20px 0" }}>
              <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> Loading projects…
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
              {projects.map(p => {
                const id = p._id || p.id;
                return (
                  <button key={id} onClick={() => selectProject(id)} style={{
                    padding: "16px 18px", borderRadius: 13,
                    border: "1.5px solid rgba(73,136,196,0.2)",
                    background: "rgba(73,136,196,0.04)",
                    cursor: "pointer", textAlign: "left",
                    transition: "all 0.2s", fontFamily: "'DM Sans',sans-serif",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(73,136,196,0.1)"; e.currentTarget.style.borderColor = "#4988C4"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(73,136,196,0.04)"; e.currentTarget.style.borderColor = "rgba(73,136,196,0.2)"; }}
                  >
                    <div style={{ color: "#1C4D8D", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{id?.toString().slice(-6).toUpperCase()}</div>
                    <div style={{ color: "#0F2854", fontSize: 14, fontWeight: 700 }}>{p.name}</div>
                    {p.location && <div style={{ color: "#4988C4", fontSize: 11, marginTop: 4 }}>📍 {p.location}</div>}
                    {p.progress !== undefined && (
                      <>
                        <div style={{ marginTop: 10, background: "rgba(73,136,196,0.1)", borderRadius: 99, height: 4 }}>
                          <div style={{ height: 4, borderRadius: 99, background: "#4988C4", width: `${p.progress}%` }} />
                        </div>
                        <div style={{ color: "#4988C4", fontSize: 10, marginTop: 3, textAlign: "right" }}>{p.progress}% complete</div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* ══ STEP 2: SELECT ITEM ══ */}
      {step === 2 && (
        <Card style={{ padding: "26px", animation: "fadeUp 0.3s ease" }}>
          <SectionHead icon={<MessageSquare size={16} color="#BDE8F5" />} title="Select Item" subtitle={selectedProject?.name} />
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
            {/* If no predefined items, show a text input + continue button */}
            {(ITEMS_BY_PROJECT[form.project] || []).length === 0 && (
              <div style={{ gridColumn: "1/-1" }}>
                <p style={{ color: "#4988C4", fontSize: 12, marginBottom: 10 }}>No predefined items for this project. Enter manually:</p>
                <input style={inputStyle} placeholder="Enter item / component name…"
                  value={form.item} onChange={e => upd("item", e.target.value)} />
                <div style={{ marginTop: 12 }}>
                  <SubmitBtn onClick={() => setStep(3)}>Continue to Complaint →</SubmitBtn>
                </div>
              </div>
            )}
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
          <SectionHead icon={<MessageSquare size={16} color="#BDE8F5" />} title="Complaint Details"
            subtitle={`${selectedProject?.name || "Project"} · ${form.item || "Item"}`} />

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
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {SEVERITY_OPTS.map(s => {
                  const col = SEVERITY_COLORS[s];
                  const active = form.severity === s;
                  return (
                    <button key={s} onClick={() => upd("severity", s)} style={{
                      flex: 1, minWidth: 72, padding: "10px", borderRadius: 10, border: "none",
                      cursor: "pointer",
                      background: active ? col : `${col}12`,
                      color: active ? "#fff" : col,
                      fontSize: 12, fontWeight: 700, transition: "all 0.15s",
                      fontFamily: "'DM Sans',sans-serif",
                    }}>{SEVERITY_LABELS[s]}</button>
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
              {["Material Name", "Qty", "Unit", "Urgent", ""].map(h => (
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

          {/* Recent complaints sidebar */}
          {recentComplaints.length > 0 && (
            <div style={{ marginTop: 20, padding: "14px 16px", background: "rgba(73,136,196,0.04)", borderRadius: 11, border: "1px solid rgba(73,136,196,0.1)" }}>
              <div style={{ color: "#0F2854", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Recent Complaints</div>
              {recentComplaints.map(c => (
                <div key={c._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(73,136,196,0.07)" }}>
                  <span style={{ color: "#0F2854", fontSize: 12, fontWeight: 600 }}>{c.title}</span>
                  <span style={{
                    background: `${SEVERITY_COLORS[c.priority] || "#4988C4"}18`,
                    color: SEVERITY_COLORS[c.priority] || "#4988C4",
                    padding: "1px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700,
                  }}>{SEVERITY_LABELS[c.priority] || c.priority}</span>
                </div>
              ))}
            </div>
          )}

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