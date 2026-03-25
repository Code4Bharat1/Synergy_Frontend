"use client";
import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Plus,
  Trash2,
  CheckCircle,
  Upload,
  AlertCircle,
  MapPin,
  Package,
  Layers,
  HardHat,
  Palette,
  FolderOpen,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { inputStyle, labelStyle, PageHeader, Card } from "./shared";
import axiosInstance from "../../lib/axios";

// ── UI-only constants (not data) ───────────────────────────────────────────────
const SEVERITY_OPTS = [
  { label: "Low",      color: "#34C759", bg: "rgba(52,199,89,0.1)"  },
  { label: "Medium",   color: "#FF9500", bg: "rgba(255,149,0,0.1)"  },
  { label: "High",     color: "#FF3B30", bg: "rgba(255,59,48,0.1)"  },
  { label: "Critical", color: "#9B1C1C", bg: "rgba(155,28,28,0.1)"  },
];

const sevColorMap = {
  Low:      "#34C759",
  Medium:   "#FF9500",
  High:     "#FF3B30",
  Critical: "#9B1C1C",
};

const MATERIAL_UNITS = ["pcs", "kg", "m", "m²", "litre", "set", "lot"];

// ── Auth helpers ───────────────────────────────────────────────────────────────
const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
const authCfg = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

// ── Local sub-components ───────────────────────────────────────────────────────
function SectionHead({ icon, title, subtitle }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: "linear-gradient(135deg, #0F2854, #1C4D8D)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 14 }}>{title}</div>
        {subtitle && <div style={{ color: "#4988C4", fontSize: 11, marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

function Label({ children, required }) {
  return (
    <label style={labelStyle}>
      {String(children).toUpperCase()}
      {required && <span style={{ color: "#FF3B30", marginLeft: 3 }}>*</span>}
    </label>
  );
}

function SubmitBtn({ children, loading, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        background: loading
          ? "rgba(73,136,196,0.5)"
          : "linear-gradient(135deg, #1C4D8D, #0F2854)",
        color: "#fff",
        border: "none",
        padding: "12px 28px",
        borderRadius: 11,
        fontSize: 13,
        fontWeight: 700,
        cursor: loading ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
        boxShadow: "0 4px 16px rgba(15,40,84,0.2)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {loading && <Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} />}
      {children}
    </button>
  );
}

// Skeleton pulse for loading states
function Skeleton({ width = "100%", height = 16, radius = 6 }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: "linear-gradient(90deg, rgba(73,136,196,0.08) 25%, rgba(73,136,196,0.16) 50%, rgba(73,136,196,0.08) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }} />
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function LogComplaintPage() {
  const [form, setForm] = useState({
    project:     null,
    item:        "",
    title:       "",
    description: "",
    severity:    "Medium",
    photos:      [],
  });
  const [materials,        setMaterials]        = useState([{ id: 1, name: "", qty: "", unit: "pcs", urgent: false }]);
  const [submitted,        setSubmitted]        = useState(false);
  const [loading,          setLoading]          = useState(false);
  const [projectsLoading,  setProjectsLoading]  = useState(true);
  const [projectsError,    setProjectsError]    = useState(null);
  const [complaintsLoading,setComplaintsLoading]= useState(true);
  const [projects,         setProjects]         = useState([]);
  const [itemDetails,      setItemDetails]      = useState(null);
  const [itemLoading,      setItemLoading]      = useState(false);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [error,            setError]            = useState(null);

  const upd = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // ── Fetch projects ─────────────────────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    setProjectsError(null);
    try {
      const res = await axiosInstance.get("/projects", authCfg());
      const raw = Array.isArray(res.data) ? res.data : res.data?.projects || [];
      const completed = raw
        .filter((p) => p.status === "completed")
        .map((p) => ({
          id:       p._id,
          name:     p.name || p.clientName || "Unnamed Project",
          client:   p.clientName || p.name || "—",
          location: p.location || "—",
          items:    Array.isArray(p.items) ? p.items : [],
        }));
      setProjects(completed);
    } catch (err) {
      setProjectsError(err.response?.data?.message || "Failed to load projects.");
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  // ── Fetch recent complaints ────────────────────────────────────────────────
  const fetchRecentComplaints = useCallback(async () => {
    setComplaintsLoading(true);
    try {
      const r = await axiosInstance.get("/complaints", authCfg());
      const data = Array.isArray(r.data) ? r.data : r.data?.complaints || [];
      setRecentComplaints(data.slice(0, 3));
    } catch {
      setRecentComplaints([]);
    } finally {
      setComplaintsLoading(false);
    }
  }, []);

  // ── Fetch item details when item changes ───────────────────────────────────
  const fetchItemDetails = useCallback(async (projectId, itemName) => {
    if (!projectId || !itemName) { setItemDetails(null); return; }
    setItemLoading(true);
    try {
      // Try a dedicated item-details endpoint; fall back gracefully if 404
      const res = await axiosInstance.get(
        `/projects/${projectId}/items/${encodeURIComponent(itemName)}`,
        authCfg(),
      );
      setItemDetails(res.data || null);
    } catch {
      // Endpoint may not exist — just show nothing rather than crash
      setItemDetails(null);
    } finally {
      setItemLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchRecentComplaints();
  }, [fetchProjects, fetchRecentComplaints]);

  useEffect(() => {
    fetchItemDetails(form.project?.id, form.item);
  }, [form.project?.id, form.item, fetchItemDetails]);

  // ── Material helpers ────────────────────────────────────────────────────────
  const addMat    = () => setMaterials((m) => [...m, { id: Date.now(), name: "", qty: "", unit: "pcs", urgent: false }]);
  const removeMat = (id) => setMaterials((m) => m.filter((x) => x.id !== id));
  const updMat    = (id, key, val) => setMaterials((m) => m.map((x) => (x.id === id ? { ...x, [key]: val } : x)));

  const handlePhoto = (e) => {
    const files = Array.from(e.target.files).map((f) => ({
      name: f.name, url: URL.createObjectURL(f), file: f,
    }));
    setForm((f) => ({ ...f, photos: [...f.photos, ...files] }));
  };
  const removePhoto = (name) =>
    setForm((f) => ({ ...f, photos: f.photos.filter((p) => p.name !== name) }));

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.title.trim())       return setError("Please enter a complaint title.");
    if (!form.description.trim()) return setError("Please enter a description.");
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("priority", form.severity.toLowerCase());
      formData.append("status", "open");
      if (form.project?.id) formData.append("project", form.project.id);
      if (form.item) formData.append("item", form.item);
      
      const mats = materials.filter((m) => m.name.trim());
      formData.append("materials", JSON.stringify(mats));

      form.photos.forEach((p) => {
        if (p.file) formData.append("photos", p.file);
      });

      await axiosInstance.post("/complaints", formData, {
        headers: {
          ...authCfg().headers,
          "Content-Type": "multipart/form-data",
        },
      });

      await fetchRecentComplaints();
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit complaint. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSubmitted(false);
    setItemDetails(null);
    setForm({ project: null, item: "", title: "", description: "", severity: "Medium", photos: [] });
    setMaterials([{ id: 1, name: "", qty: "", unit: "pcs", urgent: false }]);
    setError(null);
    fetchRecentComplaints();
  };

  const selectedSev = SEVERITY_OPTS.find((s) => s.label === form.severity);

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted)
    return (
      <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <CheckCircle size={56} color="#34C759" strokeWidth={1.5} style={{ marginBottom: 16 }} />
        <h2 style={{ color: "#0F2854", fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
          Complaint Logged!
        </h2>
        <p style={{ color: "#4988C4", fontSize: 14, marginBottom: 24 }}>
          <strong>{form.title}</strong> has been submitted to the service team for review.
        </p>
        <button
          onClick={reset}
          style={{
            background: "#0F2854", color: "#BDE8F5", border: "none",
            padding: "10px 22px", borderRadius: 10, fontSize: 13,
            fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Log Another Complaint
        </button>
      </div>
    );

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

        .lc-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; }
        @media (max-width: 860px) { .lc-grid { grid-template-columns: 1fr; } }

        .lc-severity-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 6px; margin-top: 2px; }
        @media (max-width: 420px) { .lc-severity-row { grid-template-columns: repeat(2,1fr); gap: 8px; } }

        .lc-project-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
        @media (max-width: 560px) { .lc-project-grid { grid-template-columns: 1fr; } }

        .lc-item-detail-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
        @media (max-width: 500px) { .lc-item-detail-grid { grid-template-columns: 1fr 1fr; } }

        .lc-mat-row { display: grid; grid-template-columns: 1fr 80px 70px 90px 32px; gap: 10px; align-items: center; }
        @media (max-width: 560px) {
          .lc-mat-row { grid-template-columns: 1fr 60px 60px; }
          .lc-mat-urgent, .lc-mat-del { display: none !important; }
        }

        .lc-photo-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-top: 10px; }
        @media (max-width: 480px) { .lc-photo-grid { grid-template-columns: repeat(3,1fr); } }

        .lc-card-inner { padding: 26px; }
        @media (max-width: 480px) { .lc-card-inner { padding: 18px 16px; } }

        .lc-project-card:hover { border-color: rgba(15,40,84,0.4) !important; background: rgba(15,40,84,0.02) !important; }
      `}</style>

      <PageHeader
        eyebrow="New Entry"
        title="Log New Complaint"
        subtitle="Report a complaint and list required materials"
      />

      {/* Global error banner */}
      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
          background: "rgba(255,59,48,0.06)", border: "1px solid rgba(255,59,48,0.2)",
          borderRadius: 10, padding: "10px 14px",
        }}>
          <AlertCircle size={14} color="#FF3B30" />
          <span style={{ color: "#FF3B30", fontSize: 13 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#FF3B30", fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
      )}

      <div className="lc-grid">

        {/* ── LEFT: Main Form ─────────────────────────────────────────────── */}
        <Card>
          <div className="lc-card-inner">
            <SectionHead icon={<MessageSquare size={16} color="#BDE8F5" />} title="Complaint Details" />

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              {/* ── Project selection ── */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <Label>Project</Label>
                  {!projectsLoading && (
                    <button
                      onClick={fetchProjects}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#4988C4", display: "flex", alignItems: "center", gap: 4, fontSize: 11, padding: 0 }}
                    >
                      <RefreshCw size={11} /> Refresh
                    </button>
                  )}
                </div>

                {/* Loading skeletons */}
                {projectsLoading && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[1, 2].map((i) => (
                      <div key={i} style={{ padding: "14px 16px", borderRadius: 10, border: "2px solid rgba(73,136,196,0.1)" }}>
                        <Skeleton width="40%" height={11} />
                        <div style={{ marginTop: 6 }}><Skeleton width="70%" height={13} /></div>
                        <div style={{ marginTop: 6 }}><Skeleton width="50%" height={11} /></div>
                      </div>
                    ))}
                  </div>
                )}

                {/* API error */}
                {!projectsLoading && projectsError && (
                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                    padding: "24px 20px", borderRadius: 12,
                    border: "2px dashed rgba(255,59,48,0.25)", background: "rgba(255,59,48,0.03)",
                    textAlign: "center",
                  }}>
                    <AlertCircle size={28} color="rgba(255,59,48,0.5)" strokeWidth={1.5} />
                    <div style={{ color: "#FF3B30", fontWeight: 600, fontSize: 13 }}>Could not load projects</div>
                    <div style={{ color: "#4988C4", fontSize: 12 }}>{projectsError}</div>
                    <button
                      onClick={fetchProjects}
                      style={{
                        marginTop: 4, background: "#0F2854", color: "#BDE8F5", border: "none",
                        padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      <RefreshCw size={12} /> Try Again
                    </button>
                  </div>
                )}

                {/* Empty state — loaded but no completed projects */}
                {!projectsLoading && !projectsError && projects.length === 0 && (
                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", gap: 10, padding: "28px 20px",
                    borderRadius: 12, border: "2px dashed rgba(73,136,196,0.25)",
                    background: "rgba(189,232,245,0.05)", textAlign: "center",
                  }}>
                    <FolderOpen size={32} color="rgba(73,136,196,0.4)" strokeWidth={1.5} />
                    <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 14 }}>
                      No Completed Projects Yet
                    </div>
                    <div style={{ color: "#4988C4", fontSize: 12, maxWidth: 280 }}>
                      Complaints can only be logged against completed projects. Once a project is marked complete it will appear here.
                    </div>
                  </div>
                )}

                {/* Project cards */}
                {!projectsLoading && !projectsError && projects.length > 0 && (
                  <>
                    <div className="lc-project-grid">
                      {projects.map((p) => {
                        const selected = form.project?.id === p.id;
                        return (
                          <div
                            key={p.id}
                            className="lc-project-card"
                            onClick={() => { upd("project", p); upd("item", ""); setItemDetails(null); }}
                            style={{
                              padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                              border: `2px solid ${selected ? "#0F2854" : "rgba(73,136,196,0.2)"}`,
                              background: selected ? "rgba(15,40,84,0.04)" : "#fff",
                              transition: "all 0.2s",
                            }}
                          >
                            <div style={{ color: "#1C4D8D", fontWeight: 700, fontSize: 11, marginBottom: 2 }}>
                              {String(p.id).slice(-6).toUpperCase()}
                            </div>
                            <div style={{ color: "#0F2854", fontWeight: 600, fontSize: 13 }}>
                              {p.name}
                            </div>
                            <div style={{ color: "#4988C4", fontSize: 11, marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}>
                              <MapPin size={10} /> {p.location}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {form.project && (
                      <div style={{
                        background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.3)",
                        borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#1C4D8D",
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        <CheckCircle size={13} color="#34C759" />
                        Selected: <strong>{form.project.name}</strong> · {form.project.location} · {form.project.items.length} items
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ── Item / Component ── */}
              <div>
                <Label>Item / Component</Label>
                {form.project && form.project.items.length > 0 ? (
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#4988C4", display: "flex", pointerEvents: "none" }}>
                      <Package size={13} />
                    </span>
                    <select
                      style={{ ...inputStyle, paddingLeft: 30, cursor: "pointer", appearance: "none" }}
                      value={form.item}
                      onChange={(e) => upd("item", e.target.value)}
                    >
                      <option value="">Choose an item…</option>
                      {form.project.items.map((it) => (
                        <option key={typeof it === "object" ? it._id || it.name : it}>
                          {typeof it === "object" ? it.name : it}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <input
                    style={inputStyle}
                    placeholder={form.project ? "No items found for this project" : "Select a project first…"}
                    value={form.item}
                    disabled={!form.project}
                    onChange={(e) => upd("item", e.target.value)}
                  />
                )}
              </div>

              {/* ── Item details from API ── */}
              {form.item && form.project && (
                <div style={{
                  background: "rgba(189,232,245,0.15)", border: "1px solid rgba(73,136,196,0.2)",
                  borderRadius: 10, padding: "16px",
                }}>
                  <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 12, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <Package size={13} color="#4988C4" />
                    Item Details
                    {itemLoading && <Loader2 size={12} color="#4988C4" style={{ animation: "spin 0.7s linear infinite", marginLeft: 4 }} />}
                  </div>

                  {itemLoading ? (
                    <div className="lc-item-detail-grid">
                      {[1, 2, 3].map((i) => (
                        <div key={i}>
                          <Skeleton width="60%" height={10} />
                          <div style={{ marginTop: 5 }}><Skeleton width="80%" height={13} /></div>
                        </div>
                      ))}
                    </div>
                  ) : itemDetails ? (
                    <div className="lc-item-detail-grid">
                      {[
                        ["Batch Number",   itemDetails.batchNo   || itemDetails.batch_number || "—", Layers  ],
                        ["Contractor",     itemDetails.contractor || itemDetails.contractorName || "—", HardHat],
                        ["Gel Coat Batch", itemDetails.gelCoat    || itemDetails.gel_coat_batch || "—", Palette],
                      ].map(([k, v, Icon]) => (
                        <div key={k}>
                          <div style={{ color: "#4988C4", fontSize: 10, fontWeight: 600, letterSpacing: 0.5, marginBottom: 3, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 3 }}>
                            <Icon size={10} /> {k}
                          </div>
                          <div style={{ color: "#0F2854", fontSize: 13, fontWeight: 700 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: "#4988C4", fontSize: 12, margin: 0 }}>
                      No additional details available for this item.
                    </p>
                  )}
                </div>
              )}

              {/* ── Complaint title ── */}
              <div>
                <Label required>Complaint Title</Label>
                <input
                  style={inputStyle}
                  placeholder="Brief title for this complaint…"
                  value={form.title}
                  onChange={(e) => upd("title", e.target.value)}
                />
              </div>

              {/* ── Description ── */}
              <div>
                <Label required>Description</Label>
                <textarea
                  style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
                  placeholder="Describe the complaint in detail — what, where, how it was noticed…"
                  value={form.description}
                  onChange={(e) => upd("description", e.target.value)}
                />
              </div>

              {/* ── Severity ── */}
              <div>
                <Label required>Severity</Label>
                <div className="lc-severity-row">
                  {SEVERITY_OPTS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => upd("severity", s.label)}
                      style={{
                        padding: "8px 4px", borderRadius: 8, border: "none", cursor: "pointer",
                        background: form.severity === s.label ? s.color : s.bg,
                        color:      form.severity === s.label ? "#fff"   : s.color,
                        fontSize: 11, fontWeight: 700, transition: "all 0.15s",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Photo Upload ── */}
              <div>
                <Label>Photo Evidence</Label>
                <label style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", border: "2px dashed rgba(73,136,196,0.3)",
                  borderRadius: 12, padding: "20px", cursor: "pointer",
                  background: "rgba(189,232,245,0.04)", gap: 6,
                }}>
                  <Upload size={22} color="#4988C4" strokeWidth={1.5} />
                  <span style={{ color: "#1C4D8D", fontSize: 12, fontWeight: 600 }}>Upload Photos / Videos</span>
                  <span style={{ color: "#4988C4", fontSize: 11 }}>JPG, PNG, MP4 — up to 10 files</span>
                  <input type="file" accept="image/*,video/*" multiple style={{ display: "none" }} onChange={handlePhoto} />
                </label>
                {form.photos.length > 0 && (
                  <div className="lc-photo-grid">
                    {form.photos.map((p) => (
                      <div key={p.name} style={{ position: "relative", borderRadius: 8, overflow: "hidden" }}>
                        <img src={p.url} alt={p.name} style={{ width: "100%", height: 70, objectFit: "cover" }} />
                        <button
                          onClick={() => removePhoto(p.name)}
                          style={{
                            position: "absolute", top: 3, right: 3, background: "rgba(0,0,0,0.6)",
                            border: "none", borderRadius: "50%", width: 18, height: 18,
                            color: "#fff", cursor: "pointer", fontSize: 10,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Required Materials ── */}
              <div>
                <Label>Required Materials</Label>

                <div className="lc-mat-row" style={{ marginBottom: 6 }}>
                  {["Material Name", "Qty", "Unit", "Urgent", ""].map((h) => (
                    <div key={h} style={{ color: "#4988C4", fontSize: 10, fontWeight: 600, letterSpacing: 0.5 }}>
                      {h.toUpperCase()}
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {materials.map((m) => (
                    <div key={m.id} className="lc-mat-row">
                      <input
                        style={inputStyle}
                        placeholder="e.g. Gel coat resin"
                        value={m.name}
                        onChange={(e) => updMat(m.id, "name", e.target.value)}
                      />
                      <input
                        type="number" min={0} style={inputStyle} placeholder="0"
                        value={m.qty}
                        onChange={(e) => updMat(m.id, "qty", e.target.value)}
                      />
                      <select
                        style={{ ...inputStyle, cursor: "pointer" }}
                        value={m.unit}
                        onChange={(e) => updMat(m.id, "unit", e.target.value)}
                      >
                        {MATERIAL_UNITS.map((u) => <option key={u}>{u}</option>)}
                      </select>
                      <button
                        className="lc-mat-urgent"
                        onClick={() => updMat(m.id, "urgent", !m.urgent)}
                        style={{
                          padding: "6px", borderRadius: 8, border: "none", cursor: "pointer",
                          background: m.urgent ? "rgba(255,59,48,0.12)" : "rgba(73,136,196,0.08)",
                          color: m.urgent ? "#FF3B30" : "#4988C4",
                          fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {m.urgent ? "🔴 Urgent" : "Set Urgent"}
                      </button>
                      {materials.length > 1 && (
                        <button
                          className="lc-mat-del"
                          onClick={() => removeMat(m.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#FF3B30", padding: 0 }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={addMat}
                  style={{
                    marginTop: 10, background: "rgba(73,136,196,0.07)",
                    border: "1.5px dashed rgba(73,136,196,0.3)", color: "#1C4D8D",
                    borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", width: "100%",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <Plus size={14} /> Add Material
                </button>
              </div>
            </div>

            {/* Severity banner */}
            {selectedSev && (
              <div style={{
                marginTop: 18, padding: "10px 14px", borderRadius: 10,
                background: selectedSev.bg, border: `1px solid ${selectedSev.color}30`,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <AlertCircle size={14} color={selectedSev.color} />
                <span style={{ color: selectedSev.color, fontSize: 12, fontWeight: 600 }}>
                  {form.severity === "Critical"
                    ? "⛔ Critical — This will immediately notify management."
                    : form.severity === "High"
                    ? "⚠ High severity — Relevant team will be alerted."
                    : `${form.severity} severity — Complaint will be queued for review.`}
                </span>
              </div>
            )}

            <div style={{ marginTop: 22, display: "flex", justifyContent: "flex-end" }}>
              <SubmitBtn loading={loading} onClick={handleSubmit}>
                Submit Complaint
              </SubmitBtn>
            </div>
          </div>
        </Card>

        {/* ── RIGHT: Sidebar ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Recent Complaints */}
          <Card>
            <div style={{ padding: "22px" }}>
              <SectionHead
                icon={<MessageSquare size={16} color="#BDE8F5" />}
                title="Recent Complaints"
                subtitle="Last 30 days"
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {complaintsLoading ? (
                  [1, 2, 3].map((i) => (
                    <div key={i} style={{ padding: "12px 14px", borderRadius: 11, border: "1px solid rgba(73,136,196,0.1)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <Skeleton width="30%" height={11} />
                        <Skeleton width="20%" height={11} />
                      </div>
                      <Skeleton width="80%" height={12} />
                      <div style={{ marginTop: 6 }}><Skeleton width="50%" height={11} /></div>
                    </div>
                  ))
                ) : recentComplaints.length === 0 ? (
                  <p style={{ color: "#4988C4", fontSize: 12, textAlign: "center", padding: "16px 0", margin: 0 }}>
                    No recent complaints.
                  </p>
                ) : (
                  recentComplaints.map((c) => (
                    <div
                      key={c._id}
                      style={{
                        padding: "12px 14px", borderRadius: 11,
                        background: "rgba(73,136,196,0.04)",
                        border: "1px solid rgba(73,136,196,0.1)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: "#1C4D8D", fontSize: 11, fontWeight: 700 }}>
                          {c._id?.slice(-6).toUpperCase()}
                        </span>
                        <span style={{
                          background: `${sevColorMap[c.priority] || "#4988C4"}18`,
                          color: sevColorMap[c.priority] || "#4988C4",
                          padding: "1px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700,
                        }}>
                          {c.priority}
                        </span>
                      </div>
                      <div style={{ color: "#0F2854", fontSize: 12, fontWeight: 600, marginBottom: 3 }}>
                        {c.title}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#4988C4", fontSize: 11 }}>{c.status || "open"}</span>
                        <span style={{ color: "#4988C4", fontSize: 11 }}>
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

          {/* Severity Reference — UI only, no data */}
          <Card>
            <div style={{ padding: "20px 22px" }}>
              <div style={{ color: "#0F2854", fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                Severity Reference
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {SEVERITY_OPTS.map((s) => (
                  <div
                    key={s.label}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "7px 10px", borderRadius: 8, background: s.bg,
                    }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                    <span style={{ color: s.color, fontSize: 12, fontWeight: 600 }}>{s.label}</span>
                    <span style={{ color: "#4988C4", fontSize: 11, marginLeft: "auto" }}>
                      {s.label === "Low"      ? "Minor, non-urgent"
                       : s.label === "Medium" ? "Needs attention soon"
                       : s.label === "High"   ? "Urgent, alert team"
                       :                        "Critical, notify management"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

        </div>
      </div>
    </>
  );
}