"use client";
import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Plus,
  Trash2,
  CheckCircle,
  Upload,
  AlertCircle,
} from "lucide-react";
import {
  PageHeader,
  Card,
  SectionHead,
  Label,
  inputStyle,
  SubmitBtn,
  FONTS,
} from "./shared";
import axiosInstance from "../../lib/axios";
import ComplaintTracker, { STAGE_ADVANCE_ROLES } from "../common/ComplaintTracker";
import MediaGallery from "../common/MediaGallery";
import { Package } from "lucide-react";

const SEVERITY_OPTS = [
  { label: "Low", color: "#34C759", bg: "rgba(52,199,89,0.1)" },
  { label: "Medium", color: "#FF9500", bg: "rgba(255,149,0,0.1)" },
  { label: "High", color: "#FF3B30", bg: "rgba(255,59,48,0.1)" },
  { label: "Critical", color: "#9B1C1C", bg: "rgba(155,28,28,0.1)" },
];

const DURATION_OPTS = [
  { label: "Short", days: 15, color: "#4988C4", desc: "Quick fix (est. 15 days)" },
  { label: "Standard", days: 30, color: "#1C4D8D", desc: "Standard repair (est. 1 month)" },
  { label: "Long", days: 90, color: "#0F2854", desc: "Major project (est. 3/6 months)" },
];

const sevColorMap = {
  Low: "#34C759",
  Medium: "#FF9500",
  High: "#FF3B30",
  Critical: "#9B1C1C",
};

const MATERIAL_UNITS = ["pcs", "kg", "m", "m²", "litre", "set", "lot"];

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

const authCfg = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

export default function ComplaintLogPage() {
  const [form, setForm] = useState({
    project: "",
    item: "",
    title: "",
    description: "",
    severity: "Medium",
    duration: "Standard",
    photos: [],
  });
  const [materials, setMaterials] = useState([
    { id: 1, name: "", qty: "", unit: "pcs", urgent: false },
  ]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [error, setError] = useState(null);

  const upd = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // ── Fetch ─────────────────────────────────────────────────────────────────
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
    axiosInstance
      .get("/projects", authCfg())
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : res.data?.projects || [];
        setProjects(raw);
      })
      .catch(console.error);

    fetchRecentComplaints();
  }, [fetchRecentComplaints]);

  // ── Material helpers ──────────────────────────────────────────────────────
  const addMat = () =>
    setMaterials((m) => [
      ...m,
      { id: Date.now(), name: "", qty: "", unit: "pcs", urgent: false },
    ]);
  const removeMat = (id) => setMaterials((m) => m.filter((x) => x.id !== id));
  const updMat = (id, key, val) =>
    setMaterials((m) =>
      m?.map((x) => (x.id === id ? { ...x, [key]: val } : x)),
    );

  const handlePhoto = (e) => {
    const files = Array.from(e.target.files)?.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
      file: f,
    }));
    setForm((f) => ({ ...f, photos: [...f.photos, ...files] }));
  };
  const removePhoto = (name) =>
    setForm((f) => ({ ...f, photos: f.photos.filter((p) => p.name !== name) }));

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.title.trim()) return setError("Please enter a complaint title.");
    if (!form.description.trim())
      return setError("Please enter a description.");

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("priority", form.severity.toLowerCase());
      formData.append("duration_type", form.duration.toLowerCase());
      formData.append("status", "open");
      if (form.project) formData.append("project", form.project);
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
      setError(
        err.response?.data?.message ||
          "Failed to submit complaint. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSubmitted(false);
    setForm({
      project: "",
      item: "",
      title: "",
      description: "",
      severity: "Medium",
      duration: "Standard",
      photos: [],
    });
    setMaterials([{ id: 1, name: "", qty: "", unit: "pcs", urgent: false }]);
    setError(null);
  };

  const selectedSev = SEVERITY_OPTS.find((s) => s.label === form.severity);

  // ── Success ───────────────────────────────────────────────────────────────
  if (submitted)
    return (
      <>
        <style>{FONTS}</style>
        <div
          className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          style={{ 
            maxWidth: 480, 
            width: '90%',
            margin: "80px auto", 
            textAlign: "center",
            padding: "20px",
            background: "#fff",
            borderRadius: "24px",
            boxShadow: "0 10px 40px rgba(15,40,84,0.08)",
            border: "1px solid rgba(73,136,196,0.1)"
          }}
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center animate-bounce duration-1000">
               <CheckCircle size={44} color="#34C759" strokeWidth={1.5} />
            </div>
          </div>
          <h2
            style={{
              color: "#0F2854",
              fontSize: 24,
              fontWeight: 800,
              fontFamily: "'Syne',sans-serif",
              marginBottom: 12,
            }}
          >
            Complaint Logged!
          </h2>
          <p style={{ color: "#4988C4", fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
            The support team and management have been notified. You can track this in your dashboard.
          </p>
          <button
            onClick={reset}
            style={{
              background: "linear-gradient(135deg, #1C4D8D, #0F2854)",
              color: "#fff",
              border: "none",
              padding: "14px 32px",
              borderRadius: 14,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif",
              boxShadow: "0 4px 15px rgba(15,40,84,0.2)",
              transition: "transform 0.2s"
            }}
            onMouseOver={(e) => e.target.style.transform = "scale(1.02)"}
            onMouseOut={(e) => e.target.style.transform = "scale(1)"}
          >
            Log New Complaint
          </button>
        </div>
      </>
    );

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>
        {FONTS +
          `
        .cl-container { padding: 0; width: 100%; max-width: 1400px; margin: 0 auto; }
        .cl-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 24px; }
        
        @media (max-width: 1280px) { .cl-grid { grid-template-columns: 1.4fr 1fr; gap: 20px; } }
        @media (max-width: 1100px) { .cl-grid { grid-template-columns: 1fr; } }
        
        .cl-card { padding: 28px; }
        @media (max-width: 640px) { .cl-card { padding: 20px 16px; } }
        
        .cl-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 640px) { .cl-field-row { grid-template-columns: 1fr; gap: 12px; } }
        
        .cl-severity-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; }
        @media (max-width: 480px) { .cl-severity-row { grid-template-columns: repeat(2,1fr); } }
        
        .cl-mat-row { display: grid; grid-template-columns: 1fr 80px 80px 90px 40px; gap: 12px; align-items: center; }
        @media (max-width: 768px) { 
          .cl-mat-row { 
            grid-template-columns: 1fr 80px 90px; 
            gap: 10px;
            padding: 12px;
            background: #f8fafc;
            border: 1px solid #eef2f8;
            border-radius: 12px;
          }
          .cl-mat-name { grid-column: span 3; }
          .cl-mat-header { display: none !important; }
          .cl-mat-del { 
             grid-column: span 3; 
             display: flex !important; 
             justify-content: center;
             padding: 8px !important;
             background: #fff5f5 !important;
             border-radius: 10px !important;
             margin-top: 4px;
             color: #ef4444 !important;
             font-size: 11px !important;
             font-weight: 700 !important;
             text-transform: uppercase;
          }
        }
      `}
      </style>

      <div className="cl-container">
      <PageHeader
        eyebrow="Field"
        title="Log a Complaint"
        subtitle="Report a complaint and list required materials"
      />

      {/* Error banner */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
            background: "rgba(255,59,48,0.06)",
            border: "1px solid rgba(255,59,48,0.2)",
            borderRadius: 10,
            padding: "10px 14px",
          }}
        >
          <AlertCircle size={14} color="#FF3B30" />
          <span style={{ color: "#FF3B30", fontSize: 13 }}>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#FF3B30",
              fontSize: 16,
            }}
          >
            ×
          </button>
        </div>
      )}

      <div className="cl-grid">
        {/* ── LEFT: Main Form ──────────────────────────────────────────── */}
        <Card className="cl-card">
          <SectionHead
            icon={<MessageSquare size={16} color="#BDE8F5" />}
            title="Complaint Details"
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Project + Item */}
            <div className="cl-field-row">
              <div>
                <Label required>Project</Label>
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={form.project}
                  onChange={(e) => upd("project", e.target.value)}
                >
                  <option value="">Select project</option>
                  {projects?.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Item / Component</Label>
                <input
                  style={inputStyle}
                  placeholder="e.g. Solar Panel, Inverter…"
                  value={form.item}
                  onChange={(e) => upd("item", e.target.value)}
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <Label required>Complaint Title</Label>
              <input
                style={inputStyle}
                placeholder="Brief title for this complaint…"
                value={form.title}
                onChange={(e) => upd("title", e.target.value)}
              />
            </div>

            {/* Description */}
            <div>
              <Label required>Description</Label>
              <textarea
                style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
                placeholder="Describe the complaint in detail — what, where, how it was noticed…"
                value={form.description}
                onChange={(e) => upd("description", e.target.value)}
              />
            </div>

            {/* Severity */}
            <div>
              <Label required>Severity</Label>
              <div className="cl-severity-row">
                {SEVERITY_OPTS?.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => upd("severity", s.label)}
                    style={{
                      padding: "8px 4px",
                      borderRadius: 8,
                      border: "none",
                      cursor: "pointer",
                      background: form.severity === s.label ? s.color : s.bg,
                      color: form.severity === s.label ? "#fff" : s.color,
                      fontSize: 11,
                      fontWeight: 700,
                      transition: "all 0.15s",
                      fontFamily: "'DM Sans',sans-serif",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Type */}
            <div>
              <Label required>Expected Resolution Span</Label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {DURATION_OPTS?.map((d) => (
                  <button
                    key={d.label}
                    onClick={() => upd("duration", d.label)}
                    style={{
                      padding: "10px 6px",
                      borderRadius: 10,
                      border: form.duration === d.label ? `1.5px solid ${d.color}` : "1.5px solid #eee",
                      cursor: "pointer",
                      background: form.duration === d.label ? "rgba(189,232,245,0.06)" : "#fff",
                      transition: "all 0.1s",
                      textAlign: "center"
                    }}
                  >
                     <div style={{ color: form.duration === d.label ? d.color : "#94a3b8", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>{d.label}</div>
                     <div style={{ color: "#94a3b8", fontSize: 9, marginTop: 2 }}>{d.desc.split("(")[1].replace(")", "")}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Upload */}
            <div>
              <Label>Photo Evidence</Label>
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px dashed rgba(73,136,196,0.3)",
                  borderRadius: 12,
                  padding: "20px",
                  cursor: "pointer",
                  background: "rgba(189,232,245,0.04)",
                  gap: 6,
                }}
              >
                <Upload size={22} color="#4988C4" strokeWidth={1.5} />
                <span
                  style={{ color: "#1C4D8D", fontSize: 12, fontWeight: 600 }}
                >
                  Upload Photos / Videos
                </span>
                <span style={{ color: "#4988C4", fontSize: 11 }}>
                  JPG, PNG, MP4 — up to 10 files
                </span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={handlePhoto}
                />
              </label>
              {form.photos.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))",
                    gap: 10,
                    marginTop: 12,
                  }}
                >
                  {form.photos?.map((p) => (
                    <div
                      key={p.name}
                      style={{
                        position: "relative",
                        borderRadius: 12,
                        overflow: "hidden",
                        aspectRatio: "1/1",
                        border: "1px solid #eef2f8"
                      }}
                    >
                      <img
                        src={p.url}
                        alt={p.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      <button
                        onClick={() => removePhoto(p.name)}
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          background: "rgba(0,0,0,0.5)",
                          backdropFilter: "blur(4px)",
                          border: "none",
                          borderRadius: "50%",
                          width: 20,
                          height: 20,
                          color: "#fff",
                          cursor: "pointer",
                          fontSize: 10,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Materials */}
            <div>
              <Label>Required Materials</Label>

              {/* Header row */}
              <div className="cl-mat-row cl-mat-header" style={{ marginBottom: 8, padding: "0 10px" }}>
                {["Material Name", "Qty", "Unit", "Urgent", ""]?.map((h) => (
                  <div
                    key={h}
                    style={{
                      color: "#4988C4",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                    }}
                  >
                    {h.toUpperCase()}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {materials?.map((m) => (
                  <div key={m.id} className="cl-mat-row">
                    <div className="cl-mat-name">
                    <input
                      style={inputStyle}
                      placeholder="e.g. Gel coat resin"
                      value={m.name}
                      onChange={(e) => updMat(m.id, "name", e.target.value)}
                    />
                    </div>
                    <input
                      type="number"
                      min={0}
                      style={inputStyle}
                      placeholder="0"
                      value={m.qty}
                      onChange={(e) => updMat(m.id, "qty", e.target.value)}
                    />
                    <select
                      style={{ ...inputStyle, cursor: "pointer" }}
                      value={m.unit}
                      onChange={(e) => updMat(m.id, "unit", e.target.value)}
                    >
                      {MATERIAL_UNITS?.map((u) => (
                        <option key={u}>{u}</option>
                      ))}
                    </select>
                    <button
                      className="cl-mat-urgent"
                      onClick={() => updMat(m.id, "urgent", !m.urgent)}
                      style={{
                        padding: "6px",
                        borderRadius: 8,
                        border: "none",
                        cursor: "pointer",
                        background: m.urgent
                          ? "rgba(255,59,48,0.12)"
                          : "rgba(73,136,196,0.08)",
                        color: m.urgent ? "#FF3B30" : "#4988C4",
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: "'DM Sans',sans-serif",
                      }}
                    >
                      {m.urgent ? "🔴 Urgent" : "Set Urgent"}
                    </button>
                    {materials.length > 1 && (
                      <button
                        className="cl-mat-del"
                        onClick={() => removeMat(m.id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#FF3B30",
                          padding: 0,
                        }}
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
                  marginTop: 10,
                  background: "rgba(73,136,196,0.07)",
                  border: "1.5px dashed rgba(73,136,196,0.3)",
                  color: "#1C4D8D",
                  borderRadius: 10,
                  padding: "10px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                <Plus size={14} /> Add Material
              </button>
            </div>
          </div>

          {/* Severity banner */}
          {selectedSev && (
            <div
              style={{
                marginTop: 18,
                padding: "10px 14px",
                borderRadius: 10,
                background: selectedSev.bg,
                border: `1px solid ${selectedSev.color}30`,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AlertCircle size={14} color={selectedSev.color} />
              <span
                style={{
                  color: selectedSev.color,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {form.severity === "Critical"
                  ? "⛔ Critical — This will immediately notify management."
                  : form.severity === "High"
                    ? "⚠ High severity — Relevant team will be alerted."
                    : `${form.severity} severity — Complaint will be queued for review.`}
              </span>
            </div>
          )}

          <div
            style={{
              marginTop: 22,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <SubmitBtn loading={loading} color="blue" onClick={handleSubmit}>
              Submit Complaint
            </SubmitBtn>
          </div>
        </Card>

        {/* ── RIGHT: Recent Complaints ─────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card className="cl-card">
            <SectionHead
              icon={<MessageSquare size={16} color="#BDE8F5" />}
              title="Recent Complaints"
              subtitle="Last 30 days"
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentComplaints.length === 0 ? (
                <p
                  style={{
                    color: "#4988C4",
                    fontSize: 12,
                    textAlign: "center",
                    padding: "16px 0",
                  }}
                >
                  No recent complaints.
                </p>
              ) : (
                recentComplaints?.map((c) => (
                  <div
                    key={c._id}
                    className="p-4 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-blue-200 transition-all shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                       <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                         #{c.project?.projectId || c._id?.slice(-6).toUpperCase()}
                       </span>
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.priority === 'High' || c.priority === 'Critical' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'} uppercase border border-current/10`}>
                         {c.priority}
                       </span>
                       {c.duration_type && (
                         <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 uppercase">
                           🕒 {c.duration_type}
                         </span>
                       )}
                    </div>
                    <p className="text-sm font-bold text-blue-950 mb-1">{c.title}</p>
                    <p className="text-[11px] text-gray-500 mb-4 line-clamp-2 italic">"{c.description}"</p>
                    
                    <ComplaintTracker 
                      currentStage={c.currentStage} 
                      status={c.status} 
                      stageHistory={c.stageHistory} 
                      compact 
                    />

                    {/* Timeline Progress */}
                    {c.status !== 'resolved' && (
                       <div className="mt-3 bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                          <div className="flex justify-between items-center mb-1.5">
                             <span className="text-[9px] font-bold text-blue-800 tracking-tight uppercase">Timeline Health</span>
                             <span className="text-[10px] font-bold text-blue-600">
                                {(() => {
                                  const start = new Date(c.createdAt || Date.now());
                                  const now = new Date();
                                  const elapsed = Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
                                  const est = c.duration_type === 'short' ? 15 : c.duration_type === 'long' ? 90 : 30;
                                  const pct = Math.min(100, Math.round((elapsed / est) * 100));
                                  return pct + '%';
                                })()}
                             </span>
                          </div>
                          <div className="w-full h-1 bg-white rounded-full overflow-hidden border border-blue-100/30">
                            <div 
                              className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                              style={{ 
                                width: (() => {
                                  const start = new Date(c.createdAt || Date.now());
                                  const now = new Date();
                                  const elapsed = Math.min(90, Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24))));
                                  const est = c.duration_type === 'short' ? 15 : c.duration_type === 'long' ? 90 : 30;
                                  return Math.min(100, Math.round((elapsed / est) * 100)) + '%';
                                })()
                              }}
                            />
                          </div>
                       </div>
                    )}

                    {/* Materials & Media if available */}
                    {(c.materials?.length > 0 || c.photos?.length > 0) && (
                       <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                          {c.materials?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                               {c.materials.slice(0, 3).map((m, i) => (
                                 <span key={i} className="text-[9px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded border border-amber-100/50">
                                   {m.name} ({m.qty})
                                 </span>
                               ))}
                               {c.materials.length > 3 && <span className="text-[9px] text-gray-400">+{c.materials.length - 3} more</span>}
                            </div>
                          )}
                          <MediaGallery files={c.photos || []} />
                       </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Severity reference */}
          <Card className="cl-card">
            <div
              style={{
                color: "#0F2854",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              Severity Reference
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {SEVERITY_OPTS?.map((s) => (
                <div
                  key={s.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 10px",
                    borderRadius: 8,
                    background: s.bg,
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: s.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{ color: s.color, fontSize: 12, fontWeight: 600 }}
                  >
                    {s.label}
                  </span>
                  <span
                    style={{
                      color: "#4988C4",
                      fontSize: 11,
                      marginLeft: "auto",
                    }}
                  >
                    {s.label === "Low"
                      ? "Minor, non-urgent"
                      : s.label === "Medium"
                        ? "Needs attention soon"
                        : s.label === "High"
                          ? "Urgent, alert team"
                          : "Critical, notify management"}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  </>
);
}
