"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FolderOpen,
  ClipboardList,
  AlertTriangle,
  CheckSquare,
  ChevronRight,
  Bell,
  MapPin,
  Loader2,
  ArrowLeft,
  User,
  Calendar,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  X,
  Save,
  Loader,
  FileText,
  Eye,
  ExternalLink,
} from "lucide-react";
import { PageHeader, Card, SectionHead, StatusPill, FONTS } from "./shared";
import axiosInstance from "../../lib/axios";

// ── API Helpers ───────────────────────────────────────────────────────────────
const apiFetch = async (path) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const res = await axiosInstance({
    method: "GET",
    url: path,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
};

const apiPut = async (path, body) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const res = await axiosInstance({
    method: "PUT",
    url: path,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    data: body,
  });
  return res.data;
};

const apiPatch = async (path, body) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const res = await axiosInstance({
    method: "PATCH",
    url: path,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    data: body,
  });
  return res.data;
};

const getCurrentEngineerId = () => {
  if (typeof window === "undefined") return null;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user._id || user.id || null;
  } catch {
    return null;
  }
};

const getCurrentEngineerName = () => {
  if (typeof window === "undefined") return "Engineer";
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.name || user.fullName || "Engineer";
  } catch {
    return "Engineer";
  }
};

const isProjectDelayed = (project) => {
  if (project.status === "delayed") return true;
  if (project.delayed === true) return true;
  if (project.status === "completed") return false;
  if (project.endDate) {
    return new Date(project.endDate) < new Date();
  }
  return false;
};

const CHECKS_META = [
  { key: "material",   label: "Material Delivered"   },
  { key: "foundation", label: "Foundation Completed" },
  { key: "customer",   label: "Customer Readiness"   },
  { key: "acceptance", label: "Client Acceptance"    },
];

// Priority colours — support both capitalised (API) and lowercase keys
const priorityMap = {
  High:     { color: "#FF3B30", bg: "rgba(255,59,48,0.08)"  },
  Medium:   { color: "#FF9500", bg: "rgba(255,149,0,0.08)"  },
  Low:      { color: "#34C759", bg: "rgba(52,199,89,0.08)"  },
  Critical: { color: "#c0392b", bg: "rgba(192,57,43,0.08)"  },
  high:     { color: "#FF3B30", bg: "rgba(255,59,48,0.08)"  },
  medium:   { color: "#FF9500", bg: "rgba(255,149,0,0.08)"  },
  low:      { color: "#34C759", bg: "rgba(52,199,89,0.08)"  },
  critical: { color: "#c0392b", bg: "rgba(192,57,43,0.08)"  },
};

const statusColor = {
  active: "blue", completed: "green", "on-hold": "orange",
  initiated: "blue", installation: "blue", testing: "blue", delayed: "red",
};

const phaseColors = {
  "Site Preparation": "#4988C4",
  "Wiring & Plumbing": "#FF9500",
  "Equipment Setup": "#9B59B6",
  Installation: "#0F2854",
  "Final Testing": "#34C759",
  Completed: "#34C759",
};

const ENGINEER_STATUS_OPTIONS = [
  { value: "initiated",    label: "Initiated"    },
  { value: "in-progress",  label: "In Progress"  },
  { value: "installation", label: "Installation" },
  { value: "testing",      label: "Testing"      },
  { value: "completed",    label: "Completed"    },
  { value: "on-hold",      label: "On Hold"      },
];

const STATUS_PHASE = {
  "initiated":    "Site Preparation",
  "in-progress":  "Wiring & Plumbing",
  "installation": "Installation",
  "testing":      "Final Testing",
  "completed":    "Completed",
  "on-hold":      "Site Preparation",
};

const STATUS_PROGRESS = {
  "initiated":    5,
  "in-progress":  40,
  "installation": 65,
  "testing":      80,
  "completed":    100,
  "on-hold":      30,
};

const inputCls = {
  padding: "9px 12px", borderRadius: "10px",
  border: "1px solid rgba(73,136,196,0.25)",
  background: "rgba(73,136,196,0.04)",
  color: "#0F2854", fontFamily: "'DM Sans',sans-serif",
  fontSize: 13, width: "100%", outline: "none",
  transition: "border-color .18s, background .18s",
};


const CSS = `
  @keyframes delayedPulse { 0%,100%{opacity:1} 50%{opacity:.55} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp { from{transform:translateY(100px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes checkPop { 0%{transform:scale(0.6);opacity:0} 60%{transform:scale(1.2)} 100%{transform:scale(1);opacity:1} }

  .db-root { font-family:'DM Sans',sans-serif;color:#0F2854; }

  .db-eyebrow { color:#4988C4;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;
    margin-bottom:6px;display:flex;align-items:center;gap:8px; }
  .db-eyebrow::before { content:'';width:20px;height:2px;background:#4988C4;border-radius:99px; }
  .db-title { font-family:'Syne',sans-serif;font-size:28px;font-weight:800;color:#0F2854;margin:0 0 5px;line-height:1.15; }
  .db-subtitle { color:#94aac4;font-size:13px;font-weight:500;margin:0 0 28px; }

  .db-alert { display:flex;align-items:center;gap:12px;padding:13px 20px;border-radius:14px;margin-bottom:24px;
    background:linear-gradient(135deg,rgba(255,59,48,0.07),rgba(255,59,48,0.03));
    border:1px solid rgba(255,59,48,0.18);animation:fadeUp .35s ease;flex-wrap:wrap; }
  .db-alert-text { color:#c0392b;font-size:13px;font-weight:600;flex:1;min-width:160px; }
  .db-alert-btn { background:#FF3B30;color:#fff;border:none;padding:7px 18px;border-radius:9px;
    font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:'DM Sans',sans-serif;transition:opacity .15s; }
  .db-alert-btn:hover { opacity:.88; }

  .db-summary { display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px; }
  @media(max-width:900px){ .db-summary{grid-template-columns:repeat(2,1fr)} }
  @media(max-width:480px){ .db-summary{grid-template-columns:repeat(2,1fr);gap:10px} }

  .db-stat { background:#fff;border-radius:18px;padding:20px 22px;border:1.5px solid #eef2f8;
    cursor:pointer;transition:transform .2s,box-shadow .2s,border-color .2s;
    position:relative;overflow:hidden;
    animation:fadeUp .4s ease both;box-shadow:0 2px 8px rgba(15,40,84,0.04); }
  .db-stat:hover { transform:translateY(-3px);box-shadow:0 14px 36px rgba(15,40,84,0.1);border-color:#d4dff0; }
  .db-stat.active { box-shadow:0 0 0 3px rgba(73,136,196,0.15);border-color:#4988C4; }
  .db-stat-glow { position:absolute;top:-40px;right:-40px;width:100px;height:100px;
    border-radius:50%;opacity:.07;pointer-events:none; }
  .db-stat-label { font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;
    color:#94aac4;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between; }
  .db-stat-num { font-family:'Syne',sans-serif;font-size:40px;font-weight:800;line-height:1; }
  .db-stat-underline { height:3px;border-radius:99px;margin-top:14px;opacity:.25;transition:opacity .2s; }
  .db-stat:hover .db-stat-underline { opacity:.5; }
  .db-stat:nth-child(1){animation-delay:.04s}
  .db-stat:nth-child(2){animation-delay:.09s}
  .db-stat:nth-child(3){animation-delay:.14s}
  .db-stat:nth-child(4){animation-delay:.19s}

  .db-main { display:grid;grid-template-columns:1.4fr 1fr;gap:20px;align-items:start; }
  @media(max-width:860px){ .db-main{grid-template-columns:1fr} }

  .db-card { background:#fff;border-radius:18px;padding:24px;border:1.5px solid #eef2f8;
    box-shadow:0 2px 8px rgba(15,40,84,0.04);animation:fadeUp .45s ease both; }
  .db-card-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;gap:8px;flex-wrap:wrap; }
  .db-card-title-row { display:flex;align-items:center;gap:10px; }
  .db-sec-icon { width:36px;height:36px;border-radius:11px;background:#0F2854;
    display:flex;align-items:center;justify-content:center;flex-shrink:0; }
  .db-sec-title { font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:#0F2854; }

  .db-prog-track { background:#f0f4fa;border-radius:99px;height:6px;overflow:hidden;margin-bottom:20px; }
  .db-prog-fill { height:6px;border-radius:99px;background:linear-gradient(90deg,#4988C4,#0F2854);
    transition:width .7s ease; }

  /* Task rows */
  .db-task { display:flex;align-items:flex-start;gap:12px;padding:12px 10px;border-radius:12px;
    transition:background .18s,transform .18s;border:1px solid transparent;margin-bottom:4px; }
  .db-task:last-child { margin-bottom:0; }
  .db-task:hover { background:#f5f9ff;transform:translateX(2px); }
  .db-task.done { opacity:.55; }
  .db-task-label { font-size:13px;font-weight:600;color:#0F2854;line-height:1.4; }
  .db-task-label.done { text-decoration:line-through;color:#94aac4; }
  .db-task-sub { font-size:11px;color:#94aac4;margin-top:2px;display:flex;align-items:center;gap:6px;flex-wrap:wrap; }
  .db-priority { padding:3px 10px;border-radius:99px;font-size:10px;font-weight:700;flex-shrink:0;white-space:nowrap;margin-top:1px; }

  /* Checkbox */
  .db-task-check { width:20px;height:20px;border-radius:6px;flex-shrink:0;margin-top:1px;
    display:flex;align-items:center;justify-content:center;transition:all .2s;cursor:pointer;border:none;padding:0; }
  .check-pop { animation:checkPop .22s ease both; }

  /* Empty state */
  .db-task-empty { text-align:center;padding:28px 0;color:#94aac4;font-size:13px; }

  /* Projects */
  .db-proj { padding:14px 16px;border-radius:14px;cursor:pointer;transition:all .18s;
    border:1.5px solid #eef2f8;background:#fafbfe;margin-bottom:8px; }
  .db-proj:last-child { margin-bottom:0; }
  .db-proj:hover { background:#f0f6ff;border-color:#c8daf5;transform:translateX(2px); }
  .db-proj.delayed { background:rgba(255,59,48,0.03);border-color:rgba(255,59,48,0.14); }
  .db-proj.delayed:hover { background:rgba(255,59,48,0.07);border-color:rgba(255,59,48,0.28); }
  .db-proj-name { font-size:13px;font-weight:700;color:#0F2854;word-break:break-word; }
  .db-proj-loc { font-size:11px;color:#94aac4;display:flex;align-items:center;gap:4px;margin-top:3px; }
  .db-proj-bar-track { flex:1;border-radius:99px;height:4px; }
  .db-proj-bar-fill { height:4px;border-radius:99px;transition:width .6s ease; }

  .delayed-badge { animation:delayedPulse 2s ease-in-out infinite;background:rgba(255,59,48,0.1);
    color:#FF3B30;font-size:9px;font-weight:800;padding:2px 8px;border-radius:99px;
    border:1px solid rgba(255,59,48,0.22);white-space:nowrap;letter-spacing:.6px; }

  .db-viewall { display:flex;align-items:center;gap:4px;color:#4988C4;font-size:11px;font-weight:700;
    text-decoration:none;padding:5px 13px;border-radius:99px;background:#f0f6ff;
    border:1px solid #d4e8ff;transition:all .15s;white-space:nowrap; }
  .db-viewall:hover { background:#ddeeff;border-color:#4988C4; }
  .db-clear-filter { background:#f0f4fa;border:1px solid #d4dff0;color:#4988C4;font-size:10px;
    font-weight:700;padding:4px 10px;border-radius:99px;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif; }
  .db-clear-filter:hover { background:#e2eaf8; }

  .db-action { display:flex;justify-content:space-between;align-items:center;padding:11px 14px;
    border-radius:12px;cursor:pointer;transition:all .18s;border:1px solid transparent;margin-bottom:7px; }
  .db-action:last-child { margin-bottom:0; }

  .db-right { display:flex;flex-direction:column;gap:20px; }

  .pd-topbar { display:flex;align-items:center;gap:12px;margin-bottom:22px;flex-wrap:wrap; }
  .pd-topbar-right { margin-left:auto;display:flex;gap:8px;align-items:center;flex-wrap:wrap; }
  @media(max-width:580px){ .pd-topbar-right{margin-left:0;width:100%} }
  .pd-grid { display:grid;grid-template-columns:1.4fr 1fr;gap:20px; }
  @media(max-width:860px){ .pd-grid{grid-template-columns:1fr} }
  .pd-info-grid { display:grid;grid-template-columns:1fr 1fr;gap:14px; }
  @media(max-width:480px){ .pd-info-grid{grid-template-columns:1fr} }
  .pd-checks-grid { display:grid;grid-template-columns:1fr 1fr;gap:10px; }

  .drawer-overlay { position:fixed;inset:0;background:rgba(15,40,84,0.48);z-index:1000;
    display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(6px); }
  .drawer-panel { background:#fff;border-radius:24px 24px 0 0;padding:30px 26px;width:100%;
    max-width:640px;max-height:72vh;overflow-y:auto;
    box-shadow:0 -16px 52px rgba(15,40,84,0.14);animation:slideUp .3s ease; }

  .db-done-badge { color:#94aac4;font-size:12px;font-weight:600;background:#f0f4fa;
    padding:4px 12px;border-radius:99px;border:1px solid #e4ecf8;white-space:nowrap; }
  .db-tasks-loading { display:flex;align-items:center;gap:8px;padding:20px 0;
    color:#94aac4;font-size:12px;justify-content:center; }
`;

// ── Edit Project Modal ────────────────────────────────────────────────────────
function EditProjectModal({ project, onClose, onSaved }) {
  const [status, setStatus] = useState(project.status || "initiated");
  const [notes,  setNotes]  = useState(project.engineerNotes || "");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const previewPhase    = STATUS_PHASE[status]    || "Site Preparation";
  const previewProgress = STATUS_PROGRESS[status] ?? 0;
  const progressBg      = previewProgress > 80 ? "#34C759" : previewProgress > 50 ? "#4988C4" : "#FF9500";

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const updated = await apiPut(`/projects/${project._id}`, {
        status,
        phase:    STATUS_PHASE[status],
        progress: STATUS_PROGRESS[status] ?? 0,
        ...(notes.trim() && { engineerNotes: notes.trim() }),
      });
      onSaved(updated.project || updated);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,40,84,0.45)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}
    >
      <div style={{ background: "#fff", borderRadius: 20, padding: "28px 26px", width: "100%", maxWidth: 460, boxShadow: "0 24px 64px rgba(15,40,84,0.18)", animation: "slideUp 0.3s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
          <div>
            <p style={{ color: "#4988C4", fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", margin: 0 }}>Update Project</p>
            <h3 style={{ color: "#0F2854", fontSize: 17, fontWeight: 800, fontFamily: "'Syne',sans-serif", margin: 0, marginTop: 3 }}>{project.name}</h3>
          </div>
          <button onClick={onClose} style={{ background: "#f0f4fa", border: "1px solid #d4dff0", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#4988C4" }}>
            <X size={15} />
          </button>
        </div>
        <div style={{ background: "rgba(73,136,196,0.06)", border: "1px solid rgba(73,136,196,0.15)", borderRadius: 10, padding: "9px 13px", marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: "#4988C4" }}>ℹ️ Set the <strong>status</strong> — phase and progress update automatically.</span>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#94aac4", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} style={inputCls}
            onFocus={e => { e.target.style.borderColor = "#4988C4"; e.target.style.background = "#fff"; }}
            onBlur={e  => { e.target.style.borderColor = "rgba(73,136,196,0.25)"; e.target.style.background = "rgba(73,136,196,0.04)"; }}>
            {ENGINEER_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div style={{ background: "rgba(73,136,196,0.04)", border: "1px solid rgba(73,136,196,0.15)", borderRadius: 12, padding: "14px 16px", marginBottom: 18 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#94aac4", letterSpacing: 1, textTransform: "uppercase", margin: "0 0 10px 0" }}>Will be set automatically</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "#4988C4", fontWeight: 600 }}>Phase</span>
            <span style={{ fontSize: 12, color: "#0F2854", fontWeight: 700 }}>{previewPhase}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "#4988C4", fontWeight: 600 }}>Progress</span>
            <span style={{ fontSize: 12, color: "#0F2854", fontWeight: 700 }}>{previewProgress}%</span>
          </div>
          <div style={{ background: "#eef2f8", borderRadius: 99, height: 5 }}>
            <div style={{ height: 5, borderRadius: 99, background: progressBg, width: `${previewProgress}%`, transition: "width .35s ease" }}/>
          </div>
        </div>
        <div style={{ marginBottom: 22 }}>
          <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#94aac4", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
            Notes <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
          </label>
          <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Any site updates, blockers, or observations…"
            style={{ ...inputCls, resize: "none", lineHeight: 1.5 }}
            onFocus={e => { e.target.style.borderColor = "#4988C4"; e.target.style.background = "#fff"; }}
            onBlur={e  => { e.target.style.borderColor = "rgba(73,136,196,0.25)"; e.target.style.background = "rgba(73,136,196,0.04)"; }}
          />
        </div>
        {error && <p style={{ color: "#FF3B30", fontSize: 12, fontWeight: 600, marginBottom: 14, textAlign: "center" }}>⚠ {error}</p>}
        <button onClick={handleSave} disabled={saving}
          style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", background: saving ? "#94aac4" : "#0F2854", color: "#fff", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "'DM Sans',sans-serif", transition: "background .2s" }}>
          {saving ? <><Loader size={15} className="animate-spin" /> Saving…</> : <><Save size={15} /> Save Changes</>}
        </button>
      </div>
    </div>
  );
}

// ── Project Detail ────────────────────────────────────────────────────────────
function ProjectDetail({ project, onBack, onProjectUpdated }) {
  const [editOpen, setEditOpen] = useState(false);
  const [localProject, setLocalProject] = useState(project);
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);

  useEffect(() => {
    setLocalProject(project);
  }, [project]);

  useEffect(() => {
    const fetchDocs = async () => {
      setDocsLoading(true);
      try {
        const data = await apiFetch("/documents");
        const allDocs = Array.isArray(data) ? data : (data.documents || []);
        setDocuments(allDocs.filter(d => (d.project?._id || d.project) === project._id));
      } catch (err) {
        console.error("Failed to load documents", err);
      } finally {
        setDocsLoading(false);
      }
    };
    if (project?._id) fetchDocs();
  }, [project._id]);

  const handleSaved = (updated) => {
    setLocalProject(prev => ({ ...prev, ...updated }));
    if (onProjectUpdated) onProjectUpdated(updated);
  };

  const checks   = localProject.eligibilityChecks || {};
  const phase    = localProject.phase || "Site Preparation";
  const phaseList = ["Site Preparation","Wiring & Plumbing","Equipment Setup","Installation","Final Testing","Completed"];
  const phaseIdx = phaseList.indexOf(phase);
  const delayed  = isProjectDelayed(localProject);

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : "—";

  return (
    <>
      {editOpen && (
        <EditProjectModal project={localProject} onClose={() => setEditOpen(false)} onSaved={handleSaved} />
      )}
      <div className="pd-topbar">
        <button onClick={onBack} style={{
          display:"flex",alignItems:"center",gap:6,background:"#f0f6ff",
          border:"1px solid #d4e8ff",color:"#1C4D8D",padding:"8px 16px",
          borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
        }}
          onMouseEnter={e=>{e.currentTarget.style.background="#ddeeff"}}
          onMouseLeave={e=>{e.currentTarget.style.background="#f0f6ff"}}
        >
          <ArrowLeft size={14}/> Back
        </button>
        <div>
          <p style={{color:"#4988C4",fontSize:11,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",margin:0}}>Project Detail</p>
          <h2 style={{color:"#0F2854",fontSize:20,fontWeight:800,fontFamily:"'Syne',sans-serif",margin:0}}>{localProject.name}</h2>
        </div>
        <div className="pd-topbar-right">
          {delayed && (
            <span className="delayed-badge" style={{display:"flex",alignItems:"center",gap:4}}>
              <Clock size={10}/> DELAYED
            </span>
          )}
          <button onClick={() => setEditOpen(true)} style={{
            display:"flex",alignItems:"center",gap:6,background:"rgba(73,136,196,0.08)",
            border:"1px solid rgba(73,136,196,0.22)",color:"#4988C4",padding:"8px 16px",
            borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
          }}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(73,136,196,0.15)"}}
            onMouseLeave={e=>{e.currentTarget.style.background="rgba(73,136,196,0.08)"}}
          >
            <Edit2 size={13}/> Update Status
          </button>
          <Link href={`/engineer/issue-log?projectId=${localProject._id}&projectName=${encodeURIComponent(localProject.name)}`} style={{textDecoration:"none"}}>
            <button style={{
              display:"flex",alignItems:"center",gap:6,background:"rgba(255,149,0,0.08)",
              border:"1px solid rgba(255,149,0,0.22)",color:"#FF9500",padding:"8px 16px",
              borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
            }}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,149,0,0.15)"}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,149,0,0.08)"}}
            >
              <AlertTriangle size={13}/> Log Issue
            </button>
          </Link>
          <StatusPill label={localProject.status||"active"} color={statusColor[localProject.status]||"blue"}/>
        </div>
      </div>

      {delayed && (
        <div style={{background:"rgba(255,59,48,0.05)",border:"1px solid rgba(255,59,48,0.15)",
          borderRadius:14,padding:"13px 20px",marginBottom:22,display:"flex",alignItems:"center",gap:12}}>
          <AlertTriangle size={16} color="#FF3B30" style={{flexShrink:0}}/>
          <div>
            <p style={{color:"#FF3B30",fontSize:13,fontWeight:700,margin:0}}>Project is delayed</p>
            {project.endDate && new Date(project.endDate)<new Date() && (
              <p style={{color:"#FF3B30",fontSize:11,margin:0,opacity:.7}}>
                Deadline was {fmtDate(project.endDate)} — please update project status or contact your manager.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="pd-grid">
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          <div className="db-card">
            <div className="db-card-header">
              <div className="db-card-title-row">
                <div className="db-sec-icon"><FolderOpen size={16} color="#BDE8F5"/></div>
                <span className="db-sec-title">Project Information</span>
              </div>
            </div>
            <div className="pd-info-grid">
              {[
                {label:"Client",value:localProject.clientName||"—"},
                {label:"Location",value:localProject.location||"—"},
                {label:"Start Date",value:fmtDate(localProject.startDate)},
                {label:"End Date",value:fmtDate(localProject.endDate),delayed},
                {label:"Description",value:localProject.description||"—",full:true},
              ].map(({label,value,full,delayed:d})=>(
                <div key={label} style={full?{gridColumn:"1/-1"}:{}}>
                  <p style={{color:"#94aac4",fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>{label}</p>
                  <p style={{color:d?"#FF3B30":"#0F2854",fontSize:13,fontWeight:600,margin:0}}>
                    {value} {d&&<span style={{fontSize:10}}>⚠</span>}
                  </p>
                </div>
              ))}
              {localProject.engineerNotes && (
                <div style={{gridColumn:"1/-1"}}>
                  <p style={{color:"#FF9500",fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>Engineer Notes</p>
                  <p style={{color:"#0F2854",fontSize:13,fontWeight:600,margin:0}}>
                    {localProject.engineerNotes}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="db-card">
            <div className="db-card-header">
              <div className="db-card-title-row">
                <div className="db-sec-icon"><ClipboardList size={16} color="#BDE8F5"/></div>
                <span className="db-sec-title">Progress & Phase</span>
              </div>
            </div>
            <div style={{marginBottom:22}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{color:"#94aac4",fontSize:12,fontWeight:500}}>Overall Progress</span>
                <span style={{color:"#0F2854",fontSize:12,fontWeight:800}}>{localProject.progress||0}%</span>
              </div>
              <div className="db-prog-track">
                <div style={{
                  height:6,borderRadius:99,
                  background:delayed?"#FF3B30":(localProject.progress||0)>80?"#34C759":(localProject.progress||0)>50?"#4988C4":"#FF9500",
                  width:`${localProject.progress||0}%`,transition:"width .6s ease",
                }}/>
              </div>
            </div>
            <p style={{color:"#94aac4",fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>Current Phase</p>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {phaseList.map((p,i)=>{
                const done=i<phaseIdx, current=i===phaseIdx;
                return (
                  <div key={p} style={{
                    display:"flex",alignItems:"center",gap:10,padding:"10px 13px",borderRadius:12,
                    background:current?`${phaseColors[p]}10`:done?"rgba(52,199,89,0.05)":"#fafbfd",
                    border:`1px solid ${current?phaseColors[p]+"35":done?"rgba(52,199,89,0.15)":"#eef2f8"}`,
                  }}>
                    <div style={{
                      width:22,height:22,borderRadius:"50%",flexShrink:0,
                      background:current?phaseColors[p]:done?"#34C759":"#eef2f8",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:10,fontWeight:800,color:current||done?"#fff":"#94aac4",
                    }}>
                      {done?"✓":i+1}
                    </div>
                    <span style={{fontSize:12,fontWeight:current?700:500,color:current?phaseColors[p]:done?"#34C759":"#94aac4"}}>{p}</span>
                    {current&&<span style={{
                      marginLeft:"auto",background:`${phaseColors[p]}14`,color:phaseColors[p],
                      fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:99,
                    }}>Current</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          <div className="db-card">
            <div className="db-card-header">
              <div className="db-card-title-row">
                <div className="db-sec-icon"><CheckSquare size={16} color="#BDE8F5"/></div>
                <span className="db-sec-title">Eligibility Checklist</span>
              </div>
            </div>
            {project.eligibilityStatus==="proceeded"?(
              <>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,
                  background:"rgba(52,199,89,0.07)",border:"1px solid rgba(52,199,89,0.18)",
                  borderRadius:10,padding:"9px 13px"}}>
                  <CheckCircle2 size={14} color="#34C759"/>
                  <span style={{color:"#1a6b3c",fontSize:12,fontWeight:700}}>All checks passed — Approved by admin</span>
                </div>
                <div className="pd-checks-grid">
                  {CHECKS_META.map(c=>{
                    const passed=checks[c.key];
                    return (
                      <div key={c.key} style={{
                        display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:11,
                        background:passed?"rgba(52,199,89,0.05)":"rgba(255,59,48,0.04)",
                        border:`1px solid ${passed?"rgba(52,199,89,0.18)":"rgba(255,59,48,0.13)"}`,
                      }}>
                        <div style={{width:20,height:20,borderRadius:6,flexShrink:0,
                          background:passed?"#34C759":"#FF3B30",
                          display:"flex",alignItems:"center",justifyContent:"center"}}>
                          {passed?<CheckCircle2 size={12} color="#fff"/>:<XCircle size={12} color="#fff"/>}
                        </div>
                        <span style={{fontSize:11,fontWeight:600,color:passed?"#1a6b3c":"#c0392b"}}>{c.label}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ):(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"28px 16px",gap:10,textAlign:"center"}}>
                <Package size={32} color="#d4dff0" strokeWidth={1.5}/>
                <p style={{color:"#94aac4",fontSize:13,fontWeight:600,margin:0}}>Eligibility not yet reviewed</p>
                <p style={{color:"#b0c0d4",fontSize:11,margin:0}}>Admin will complete this checklist before installation begins.</p>
              </div>
            )}
          </div>

          <div className="db-card">
            <div className="db-card-header">
              <div className="db-card-title-row">
                <div className="db-sec-icon"><User size={16} color="#BDE8F5"/></div>
                <span className="db-sec-title">Assigned Team</span>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {(localProject.assignedEngineers||[]).map(e=>(
                <div key={e._id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 13px",
                  background:"#fafbfe",borderRadius:12,border:"1.5px solid #eef2f8"}}>
                  <div style={{width:34,height:34,borderRadius:"50%",flexShrink:0,
                    background:"linear-gradient(135deg,#4988C4,#0F2854)",
                    display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:700}}>
                    {(e.name||"?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{color:"#0F2854",fontSize:13,fontWeight:700,margin:0}}>{e.name}</p>
                    <p style={{color:"#94aac4",fontSize:11,margin:0}}>Engineer</p>
                  </div>
                </div>
              ))}
              {(localProject.assignedEngineers||[]).length===0&&!localProject.assignedMarketingExecutive&&!localProject.assignedInstallationIncharge&&(
                <p style={{color:"#94aac4",fontSize:12,textAlign:"center",padding:"20px 0"}}>No team members assigned yet.</p>
              )}
            </div>
          </div>

          <div className="db-card">
            <div className="db-card-header">
              <div className="db-card-title-row">
                <div className="db-sec-icon"><FileText size={16} color="#BDE8F5"/></div>
                <span className="db-sec-title">Uploaded Documents</span>
              </div>
            </div>
            {docsLoading ? (
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"20px",color:"#94aac4",fontSize:13,justifyContent:"center"}}>
                <Loader size={14} className="animate-spin" /> Loading documents...
              </div>
            ) : documents.length === 0 ? (
              <p style={{color:"#94aac4",fontSize:12,textAlign:"center",padding:"20px 0"}}>No documents uploaded for this project yet.</p>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {documents.map(doc => (
                  <div key={doc._id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 13px",
                    background:"#fafbfe",borderRadius:12,border:"1.5px solid #eef2f8",justifyContent:"space-between"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
                      <div style={{width:34,height:34,borderRadius:"8px",flexShrink:0,
                        background:"#f0f4fa",display:"flex",alignItems:"center",justifyContent:"center",color:"#4988C4"}}>
                        <FileText size={16} />
                      </div>
                      <div style={{minWidth:0}}>
                        <p style={{color:"#0F2854",fontSize:13,fontWeight:700,margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{doc.title || doc.name || "Untitled"}</p>
                        <p style={{color:"#94aac4",fontSize:11,margin:0,display:"flex",gap:6}}>
                          <span style={{textTransform:"capitalize"}}>{doc.documentType || "Other"}</span>
                          <span>•</span>
                          <span>{new Date(doc.createdAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short"})}</span>
                        </p>
                      </div>
                    </div>
                    {doc.url && typeof doc.url === "string" && doc.url.startsWith("http") ? (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{
                        padding:"8px",borderRadius:"8px",background:"#eef2f8",color:"#4988C4",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0
                      }} title="View Document">
                        <Eye size={14} />
                      </a>
                    ) : (
                      <span style={{fontSize:10,color:"#94aac4",fontWeight:600,padding:"4px 8px",background:"#f0f4fa",borderRadius:6,flexShrink:0}}>Pending</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Delayed Panel ─────────────────────────────────────────────────────────────
function DelayedProjectsPanel({ projects, onClose, onSelectProject }) {
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div>
            <p style={{color:"#FF3B30",fontSize:11,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",margin:0}}>Attention Required</p>
            <h3 style={{color:"#0F2854",fontSize:18,fontWeight:800,fontFamily:"'Syne',sans-serif",margin:0}}>
              Delayed Projects ({projects.length})
            </h3>
          </div>
          <button onClick={onClose} style={{background:"#f0f4fa",border:"1.5px solid #d4dff0",borderRadius:10,
            padding:"7px 18px",cursor:"pointer",color:"#4988C4",fontWeight:700,fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>
            Close
          </button>
        </div>
        {projects.length===0?(
          <div style={{textAlign:"center",padding:"40px 0",color:"#94aac4",fontSize:13}}>
            🎉 No delayed projects — you're on track!
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {projects.map(p=>(
              <div key={p._id} onClick={()=>{onSelectProject(p);onClose();}}
                style={{padding:"14px 16px",borderRadius:14,cursor:"pointer",
                  background:"rgba(255,59,48,0.03)",border:"1.5px solid rgba(255,59,48,0.12)",transition:"all .18s"}}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,59,48,0.08)";e.currentTarget.style.transform="translateX(2px)"}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,59,48,0.03)";e.currentTarget.style.transform="translateX(0)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,gap:8}}>
                  <div style={{minWidth:0}}>
                    <p style={{color:"#0F2854",fontSize:13,fontWeight:700,margin:0,wordBreak:"break-word"}}>{p.name}</p>
                    <p style={{color:"#94aac4",fontSize:11,margin:"3px 0 0",display:"flex",alignItems:"center",gap:4}}>
                      <MapPin size={10}/> {p.location||"Global"}
                    </p>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                    {p.endDate&&(
                      <span style={{fontSize:10,color:"#FF3B30",fontWeight:600,display:"flex",alignItems:"center",gap:3}}>
                        <Calendar size={10}/>
                        Due {new Date(p.endDate).toLocaleDateString("en-GB",{day:"2-digit",month:"short"})}
                      </span>
                    )}
                    <ChevronRight size={13} color="#FF3B30"/>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{flex:1,background:"rgba(255,59,48,0.1)",borderRadius:99,height:4}}>
                    <div style={{height:4,borderRadius:99,width:`${p.progress||0}%`,background:"#FF3B30"}}/>
                  </div>
                  <span style={{color:"#FF3B30",fontSize:10,fontWeight:700,minWidth:28}}>{p.progress||0}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function EngineerDashboard() {
  const [tasks,             setTasks]             = useState([]);
  const [tasksLoading,      setTasksLoading]      = useState(true);
  const [togglingTaskId,    setTogglingTaskId]    = useState(null);
  const [projects,          setProjects]          = useState([]);
  const [complaints,        setComplaints]        = useState([]);
  const [issues,            setIssues]            = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [selectedProject,   setSelectedProject]   = useState(null);
  const [projectFilter,     setProjectFilter]     = useState("all");
  const [showDelayedPanel,  setShowDelayedPanel]  = useState(false);
  const [engineerName,      setEngineerName]      = useState("Engineer");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setTasksLoading(true);
      const engineerId = getCurrentEngineerId();
      setEngineerName(getCurrentEngineerName());

      const [pData, cData, iData, tData] = await Promise.all([
        apiFetch("/projects"),
        apiFetch("/complaints"),
        apiFetch("/issues").catch(() => []),
        apiFetch("/pending/list"),
      ]);

      // ── Projects ──
      const allProjects = Array.isArray(pData) ? pData : pData.projects || [];
      const myProjects  = engineerId
        ? allProjects.filter(p => (p.assignedEngineers || []).some(e => (e._id || e) === engineerId))
        : allProjects;
      setProjects(myProjects);

      // ── Tasks: filter to this engineer ──
      const allTasks = Array.isArray(tData) ? tData : tData?.data || [];
      const myTasks  = engineerId
        ? allTasks.filter(t => {
            const assignedId = t.assignedTo?._id || t.assignedTo;
            return assignedId === engineerId;
          })
        : allTasks;
      setTasks(myTasks);

      setComplaints(Array.isArray(cData) ? cData : []);
      setIssues(Array.isArray(iData) ? iData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setTasksLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Toggle task completion — calls API and reflects on TaskPanel instantly
  const toggleTask = async (task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    setTogglingTaskId(task._id);
    try {
      await apiPatch(`/pending/update/${task._id}`, { status: newStatus });
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error("Toggle task failed:", err);
    } finally {
      setTogglingTaskId(null);
    }
  };

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const completedTaskCount = tasks.filter(t => t.status === "completed").length;
  const totalTaskCount     = tasks.length;
  const taskProgress       = totalTaskCount > 0 ? (completedTaskCount / totalTaskCount) * 100 : 0;

  const activeProjects    = projects.filter(p => p.status !== "completed" && !isProjectDelayed(p));
  const completedProjects = projects.filter(p => p.status === "completed");
  const delayedProjects   = projects.filter(p => isProjectDelayed(p));
  const openIssuesCount   = issues.length || complaints.filter(c => c.status === "open").length;

  const filteredProjects = projectFilter === "active"    ? activeProjects
    : projectFilter === "delayed"   ? delayedProjects
    : projectFilter === "completed" ? completedProjects
    : projects;

  const SUMMARY = [
    { label: "My Projects",      value: projects.length,        icon: FolderOpen,    color: "#4988C4", isFilter: true, filterKey: "all",     onClick: () => setProjectFilter("all") },
    { label: "Active Projects",  value: activeProjects.length,  icon: ClipboardList, color: "#0F2854", isFilter: true, filterKey: "active",  onClick: () => setProjectFilter(p => p === "active" ? "all" : "active") },
    { label: "Delayed Projects", value: delayedProjects.length, icon: Clock,         color: "#FF3B30", isFilter: true, filterKey: "delayed", onClick: () => setShowDelayedPanel(true) },
    { label: "Open Issues",      value: openIssuesCount,        icon: AlertTriangle, color: "#FF9500", href: "/engineer/issue-log" },
  ];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "48px 24px", color: "#94aac4", fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>
      <Loader2 size={18} className="animate-spin" /> Loading Engineer Dashboard...
    </div>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="db-root">

        {showDelayedPanel && (
          <DelayedProjectsPanel
            projects={delayedProjects}
            onClose={() => setShowDelayedPanel(false)}
            onSelectProject={p => { setSelectedProject(p); }}
          />
        )}

        {selectedProject && (
          <ProjectDetail 
            project={selectedProject} 
            onBack={() => setSelectedProject(null)} 
            onProjectUpdated={(updated) => {
              setProjects(prev => prev.map(p => p._id === updated._id ? { ...p, ...updated } : p));
              setSelectedProject(prev => ({ ...prev, ...updated }));
            }}
          />
        )}

        {!selectedProject && (
          <>
            {delayedProjects.length > 0 && (
              <div className="db-alert">
                <AlertTriangle size={15} color="#FF3B30" style={{ flexShrink: 0 }} />
                <span className="db-alert-text">
                  You have <strong>{delayedProjects.length}</strong> delayed project{delayedProjects.length > 1 ? "s" : ""} that need attention.
                </span>
                <button className="db-alert-btn" onClick={() => setShowDelayedPanel(true)}>
                  View Delayed →
                </button>
              </div>
            )}

            <div className="db-eyebrow">Engineer Panel</div>
            <h1 className="db-title">Good morning, {engineerName}</h1>
            <p className="db-subtitle">{today}</p>

            {/* Summary cards */}
            <div className="db-summary">
              {SUMMARY.map((s, i) => {
                const isActive = s.isFilter && projectFilter === s.filterKey;
                const inner = (
                  <div key={i}
                    className={`db-stat${isActive ? " active" : ""}`}
                    onClick={() => { if (s.onClick) s.onClick(); else if (s.isFilter) setProjectFilter(p => p === s.filterKey ? "all" : s.filterKey); }}>
                    <div className="db-stat-glow" style={{ background: s.color }} />
                    <div className="db-stat-label">
                      <span>{s.label.toUpperCase()}</span>
                      <s.icon size={15} color={s.color} strokeWidth={2} />
                    </div>
                    <div className="db-stat-num" style={{ color: s.color }}>{s.value}</div>
                    <div className="db-stat-underline" style={{ background: s.color }} />
                  </div>
                );
                return s.href
                  ? <Link key={i} href={s.href} style={{ textDecoration: "none" }}>{inner}</Link>
                  : <div key={i}>{inner}</div>;
              })}
            </div>

            {/* Main grid */}
            <div className="db-main">

              {/* ── Today's Tasks (real data) ── */}
              <div className="db-card">
                <div className="db-card-header">
                  <div className="db-card-title-row">
                    <div className="db-sec-icon"><ClipboardList size={16} color="#BDE8F5" /></div>
                    <span className="db-sec-title">My Tasks</span>
                  </div>
                  <span className="db-done-badge">
                    {tasksLoading ? "…" : `${completedTaskCount}/${totalTaskCount} done`}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="db-prog-track">
                  <div className="db-prog-fill" style={{ width: `${taskProgress}%` }} />
                </div>

                {/* Task rows */}
                {tasksLoading ? (
                  <div className="db-tasks-loading">
                    <Loader2 size={14} className="animate-spin" /> Loading tasks…
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="db-task-empty">
                    <ClipboardList size={28} strokeWidth={1.5} style={{ color: "#d4dff0", display: "block", margin: "0 auto 8px" }} />
                    No tasks assigned to you yet.
                  </div>
                ) : (
                  <div>
                    {tasks.map(t => {
                      const done      = t.status === "completed";
                      const pm        = priorityMap[t.priority] || priorityMap.medium;
                      const toggling  = togglingTaskId === t._id;
                      const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && !done;
                      const projName  = t.project?.name || t.project?.projectId || null;

                      return (
                        <div
                          key={t._id}
                          className={`db-task${done ? " done" : ""}`}
                          onClick={() => !toggling && toggleTask(t)}
                          style={{ cursor: toggling ? "wait" : "pointer", opacity: toggling ? 0.6 : done ? 0.55 : 1 }}
                        >
                          {/* Checkbox */}
                          <div
                            className="db-task-check"
                            style={{
                              background:  done ? "#34C759" : "transparent",
                              border:      `2px solid ${done ? "#34C759" : "#d4dff0"}`,
                              boxShadow:   done ? "0 2px 6px rgba(52,199,89,0.3)" : "none",
                              borderRadius: 6,
                            }}
                          >
                            {toggling
                              ? <Loader2 size={10} color={done ? "#fff" : "#4988C4"} className="animate-spin" />
                              : done
                                ? <span className="check-pop" style={{ color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>✓</span>
                                : null
                            }
                          </div>

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className={`db-task-label${done ? " done" : ""}`}>{t.title}</div>
                            <div className="db-task-sub">
                              {projName && <span>{projName}</span>}
                              {t.raisedBy?.name && (
                                <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#4988C4", fontWeight: 600 }}>
                                  <User size={9} />
                                  {t.raisedBy.name}
                                </span>
                              )}
                              {t.dueDate && (
                                <span style={{ color: isOverdue ? "#FF3B30" : "#94aac4", fontWeight: isOverdue ? 700 : 400, display: "flex", alignItems: "center", gap: 3 }}>
                                  <Calendar size={9} />
                                  {new Date(t.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                                  {isOverdue && " · Overdue"}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Priority badge */}
                          <span className="db-priority" style={{ background: pm.bg, color: pm.color }}>
                            {t.priority
                              ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1)
                              : "Medium"}
                          </span>
                        </div>
                      );
                    })}

                    {/* All done banner */}
                    {totalTaskCount > 0 && completedTaskCount === totalTaskCount && (
                      <div style={{
                        marginTop: 14, display: "flex", alignItems: "center", gap: 8,
                        background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.2)",
                        borderRadius: 10, padding: "9px 12px",
                      }}>
                        <CheckCircle2 size={14} color="#34C759" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1a6b3c" }}>All tasks completed — great work! 🎉</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right column */}
              <div className="db-right">

                {/* Projects Overview */}
                <div className="db-card">
                  <div className="db-card-header">
                    <div className="db-card-title-row">
                      <div className="db-sec-icon"><FolderOpen size={16} color="#BDE8F5" /></div>
                      <span className="db-sec-title">Projects Overview</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {projectFilter !== "all" && (
                        <button className="db-clear-filter" onClick={() => setProjectFilter("all")}>
                          {projectFilter.charAt(0).toUpperCase() + projectFilter.slice(1)} · Clear ✕
                        </button>
                      )}
                      <a href="/engineer/myProjects" className="db-viewall">
                        view all <ChevronRight size={11} />
                      </a>
                    </div>
                  </div>

                  <div>
                    {filteredProjects.slice(0, 4).map(p => {
                      const delayed = isProjectDelayed(p);
                      return (
                        <div key={p._id} className={`db-proj${delayed ? " delayed" : ""}`}
                          onClick={() => setSelectedProject(p)}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 8 }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                <div className="db-proj-name">{p.name}</div>
                                {delayed && <span className="delayed-badge">DELAYED</span>}
                              </div>
                              <div className="db-proj-loc"><MapPin size={10} /> {p.location || "Global"}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                              <StatusPill label={p.status || "active"} color={statusColor[p.status || "active"] || "blue"} />
                              <ChevronRight size={13} color={delayed ? "#FF3B30" : "#c4d4e8"} />
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div className="db-proj-bar-track" style={{ background: delayed ? "rgba(255,59,48,0.08)" : "#eef2f8" }}>
                              <div className="db-proj-bar-fill" style={{
                                width: `${p.progress || 0}%`,
                                background: delayed ? "#FF3B30" : (p.progress || 0) > 80 ? "#34C759" : (p.progress || 0) > 50 ? "#4988C4" : "#FF9500",
                              }} />
                            </div>
                            <span style={{ color: delayed ? "#FF3B30" : "#94aac4", fontSize: 10, fontWeight: 700, minWidth: 28 }}>
                              {p.progress || 0}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {filteredProjects.length === 0 && (
                      <p style={{ color: "#94aac4", fontSize: 12, textAlign: "center", padding: "22px 0" }}>
                        {projectFilter === "delayed" ? "🎉 No delayed projects — great work!"
                          : projectFilter === "completed" ? "No completed projects yet."
                          : "No active projects assigned."}
                      </p>
                    )}
                    {filteredProjects.length > 4 && (
                      <p style={{ color: "#94aac4", fontSize: 11, textAlign: "center", marginTop: 8 }}>
                        +{filteredProjects.length - 4} more — use filter cards above to explore
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="db-card">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                    <div className="db-sec-icon"><CheckSquare size={16} color="#BDE8F5" /></div>
                    <span className="db-sec-title">Quick Actions</span>
                  </div>
                  {[
                    { label: "Log an Issue",      href: "/engineer/issue-log",     color: "#FF9500" },
                    { label: "Upload QC Results", href: "/engineer/qc-upload",     color: "#34C759" },
                    { label: "Log a Complaint",   href: "/engineer/complaint-log", color: "#4988C4" },
                    { label: "Upload Documents",  href: "/engineer/documents",     color: "#0F2854" },
                  ].map((a, i) => (
                    <Link key={i} href={a.href} style={{ textDecoration: "none", display: "block" }}>
                      <div className="db-action"
                        style={{ background: `${a.color}07`, borderColor: `${a.color}18` }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${a.color}12`; e.currentTarget.style.borderColor = `${a.color}35`; e.currentTarget.style.transform = "translateX(3px)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = `${a.color}07`; e.currentTarget.style.borderColor = `${a.color}18`; e.currentTarget.style.transform = "translateX(0)"; }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: a.color }}>{a.label}</span>
                        <ChevronRight size={14} color={a.color} style={{ flexShrink: 0, opacity: .6 }} />
                      </div>
                    </Link>
                  ))}
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}