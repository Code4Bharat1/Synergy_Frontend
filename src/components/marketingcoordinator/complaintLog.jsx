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
import ComplaintTracker from "../common/ComplaintTracker";

const SEVERITY_OPTS = [
  { label: "Low", color: "#34C759", bg: "rgba(52,199,89,0.1)" },
  { label: "Medium", color: "#FF9500", bg: "rgba(255,149,0,0.1)" },
  { label: "High", color: "#FF3B30", bg: "rgba(255,59,48,0.1)" },
  { label: "Critical", color: "#9B1C1C", bg: "rgba(155,28,28,0.1)" },
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
        const completedProjects = res.data.filter(
          (p) => p.status === "completed",
        );
        setProjects(completedProjects);
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
      await axiosInstance.post(
        "/complaints",
        {
          title: form.title.trim(),
          description: form.description.trim(),
          project: form.project || undefined,
          item: form.item || undefined,
          priority: form.severity,
          status: "open",
          materials: materials.filter((m) => m.name.trim()),
        },
        authCfg(),
      );

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
          style={{ maxWidth: 480, margin: "80px auto", textAlign: "center" }}
        >
          <CheckCircle
            size={56}
            color="#34C759"
            strokeWidth={1.5}
            style={{ marginBottom: 16 }}
          />
          <h2
            style={{
              color: "#0F2854",
              fontSize: 22,
              fontWeight: 800,
              fontFamily: "'Syne',sans-serif",
              marginBottom: 8,
            }}
          >
            Complaint Logged!
          </h2>
          <p style={{ color: "#4988C4", fontSize: 14, marginBottom: 24 }}>
            Your complaint has been submitted to the service team for review.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#0F2854",
              color: "#BDE8F5",
              border: "none",
              padding: "10px 22px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            Log Another Complaint
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
        .cl-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; }
        @media (max-width: 860px) { .cl-grid { grid-template-columns: 1fr; } }
        .cl-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 560px) { .cl-field-row { grid-template-columns: 1fr; } }
        .cl-severity-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 6px; margin-top: 2px; }
        @media (max-width: 420px) { .cl-severity-row { grid-template-columns: repeat(2,1fr); gap: 8px; } }
        .cl-mat-row { display: grid; grid-template-columns: 1fr 80px 70px 90px 32px; gap: 10px; align-items: center; }
        @media (max-width: 560px) { .cl-mat-row { grid-template-columns: 1fr 60px 60px; } .cl-mat-urgent, .cl-mat-del { display: none; } }
      `}
      </style>

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
        <Card style={{ padding: "26px" }}>
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
                    gridTemplateColumns: "repeat(4,1fr)",
                    gap: 8,
                    marginTop: 10,
                  }}
                >
                  {form.photos?.map((p) => (
                    <div
                      key={p.name}
                      style={{
                        position: "relative",
                        borderRadius: 8,
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={p.url}
                        alt={p.name}
                        style={{
                          width: "100%",
                          height: 70,
                          objectFit: "cover",
                        }}
                      />
                      <button
                        onClick={() => removePhoto(p.name)}
                        style={{
                          position: "absolute",
                          top: 3,
                          right: 3,
                          background: "rgba(0,0,0,0.6)",
                          border: "none",
                          borderRadius: "50%",
                          width: 18,
                          height: 18,
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
              <div className="cl-mat-row" style={{ marginBottom: 6 }}>
                {["Material Name", "Qty", "Unit", "Urgent", ""]?.map((h) => (
                  <div
                    key={h}
                    style={{
                      color: "#4988C4",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: 0.5,
                    }}
                  >
                    {h.toUpperCase()}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {materials?.map((m) => (
                  <div key={m.id} className="cl-mat-row">
                    <input
                      style={inputStyle}
                      placeholder="e.g. Gel coat resin"
                      value={m.name}
                      onChange={(e) => updMat(m.id, "name", e.target.value)}
                    />
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
          <Card style={{ padding: "22px" }}>
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
                    style={{
                      padding: "12px 14px",
                      borderRadius: 11,
                      background: "rgba(73,136,196,0.04)",
                      border: "1px solid rgba(73,136,196,0.1)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          color: "#1C4D8D",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {c._id?.slice(-6).toUpperCase()}
                      </span>
                      <span
                        style={{
                          background: `${sevColorMap[c.priority] || "#4988C4"}18`,
                          color: sevColorMap[c.priority] || "#4988C4",
                          padding: "1px 8px",
                          borderRadius: 99,
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {c.priority}
                      </span>
                    </div>
                    <div
                      style={{
                        color: "#0F2854",
                        fontSize: 12,
                        fontWeight: 600,
                        marginBottom: 3,
                      }}
                    >
                      {c.title}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ color: "#4988C4", fontSize: 11 }}>
                        {c.status || "open"}
                      </span>
                      <span style={{ color: "#4988C4", fontSize: 11 }}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-3">
                      <ComplaintTracker currentStage={c.currentStage} status={c.status} stageHistory={c.stageHistory} compact />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Severity reference */}
          <Card style={{ padding: "20px 22px" }}>
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
    </>
  );
}
