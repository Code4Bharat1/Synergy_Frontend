"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FolderOpen, AlertTriangle, CheckSquare, ChevronRight,
  MapPin, Loader2, ArrowLeft, User, Calendar, Package,
  CheckCircle2, XCircle, Clock, Search, ClipboardList,
  Edit2, X, Save, Loader,
} from "lucide-react";
import { PageHeader, Card, SectionHead, StatusPill, FONTS } from "./shared";
import axiosInstance from "../../lib/axios";

// ── API Helper ────────────────────────────────────────────────────────────────
const apiFetch = async (path) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const res = await axiosInstance({
    method: "GET",
    url: path,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
};

const apiPut = async (path, body) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const res = await axiosInstance({
    method: "PUT",
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
  } catch { return null; }
};

const getCurrentEngineerName = () => {
  if (typeof window === "undefined") return "Engineer";
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.name || user.fullName || "Engineer";
  } catch { return "Engineer"; }
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const isProjectDelayed = (project) => {
  if (project.status === "delayed") return true;
  if (project.delayed === true) return true;
  if (project.status === "completed") return false;
  if (project.endDate) return new Date(project.endDate) < new Date();
  return false;
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ── Constants ─────────────────────────────────────────────────────────────────
const CHECKS_META = [
  { key: "material",   label: "Material Delivered"   },
  { key: "foundation", label: "Foundation Completed" },
  { key: "customer",   label: "Customer Readiness"   },
  { key: "acceptance", label: "Client Acceptance"    },
];

const statusColor = {
  active: "blue", completed: "green", "on-hold": "orange",
  initiated: "blue", installation: "blue", testing: "blue", delayed: "red",
  "in-progress": "blue",
};

const phaseList = [
  "Site Preparation", "Wiring & Plumbing", "Equipment Setup",
  "Installation", "Final Testing", "Completed",
];

const phaseHex = {
  "Site Preparation":  "#4988C4",
  "Wiring & Plumbing": "#FF9500",
  "Equipment Setup":   "#9B59B6",
  "Installation":      "#0F2854",
  "Final Testing":     "#34C759",
  "Completed":         "#34C759",
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

const FILTER_TABS = [
  { key: "all",       label: "All"       },
  { key: "active",    label: "Active"    },
  { key: "delayed",   label: "Delayed"   },
  { key: "completed", label: "Completed" },
  { key: "on-hold",   label: "On Hold"   },
];

const SORT_OPTIONS = [
  { value: "name-asc",      label: "Name A–Z"     },
  { value: "name-desc",     label: "Name Z–A"     },
  { value: "progress-desc", label: "Progress ↑"   },
  { value: "progress-asc",  label: "Progress ↓"   },
  { value: "date-desc",     label: "Newest First" },
  { value: "date-asc",      label: "Oldest First" },
];

const ANIM_CSS = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(20px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes delayedPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.55; }
  }
  .anim-fade-up    { animation: fadeUp 0.3s ease both; }
  .anim-slide-in   { animation: slideIn 0.25s ease both; }
  .delayed-pulse   { animation: delayedPulse 2s ease-in-out infinite; }
  .card-hover      { transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; }
  .card-hover:hover{ transform: translateY(-3px); }
`;

const inputCls = {
  padding: "9px 12px", borderRadius: "10px",
  border: "1px solid rgba(73,136,196,0.25)",
  background: "rgba(73,136,196,0.04)",
  color: "#0F2854", fontFamily: "'DM Sans',sans-serif",
  fontSize: 13, width: "100%", outline: "none",
  transition: "border-color .18s, background .18s",
};

// ── Edit Project Modal (Engineer) ─────────────────────────────────────────────
function EditProjectModal({ project, onClose, onSaved }) {
  const [status, setStatus] = useState(project.status || "initiated");
  const [notes,  setNotes]  = useState(project.engineerNotes || "");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const previewPhase    = STATUS_PHASE[status]    || "Site Preparation";
  const previewProgress = STATUS_PROGRESS[status] ?? 0;
  const progressBg      = previewProgress > 80 ? "#34C759" : previewProgress > 50 ? "#4988C4" : "#FF9500";

  const handleSave = async () => {
    setSaving(true);
    setError("");
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
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(15,40,84,0.45)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="anim-slide-in"
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, padding: "28px 26px",
          width: "100%", maxWidth: 460,
          boxShadow: "0 24px 64px rgba(15,40,84,0.18)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
          <div>
            <p style={{ color: "#4988C4", fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", margin: 0 }}>
              Update Project
            </p>
            <h3 style={{ color: "#0F2854", fontSize: 17, fontWeight: 800, fontFamily: "'Syne',sans-serif", margin: 0, marginTop: 3 }}>
              {project.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: "#f0f4fa", border: "1px solid #d4dff0", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#4988C4" }}
          >
            <X size={15} />
          </button>
        </div>

        <div style={{
          background: "rgba(73,136,196,0.06)", border: "1px solid rgba(73,136,196,0.15)",
          borderRadius: 10, padding: "9px 13px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 12, color: "#4988C4" }}>
            ℹ️ Set the <strong>status</strong> — phase and progress update automatically.
          </span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#94aac4", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
            Status
          </label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            style={inputCls}
            onFocus={e => { e.target.style.borderColor = "#4988C4"; e.target.style.background = "#fff"; }}
            onBlur={e  => { e.target.style.borderColor = "rgba(73,136,196,0.25)"; e.target.style.background = "rgba(73,136,196,0.04)"; }}
          >
            {ENGINEER_STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
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
          <textarea
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any site updates, blockers, or observations…"
            style={{ ...inputCls, resize: "none", lineHeight: 1.5 }}
            onFocus={e => { e.target.style.borderColor = "#4988C4"; e.target.style.background = "#fff"; }}
            onBlur={e  => { e.target.style.borderColor = "rgba(73,136,196,0.25)"; e.target.style.background = "rgba(73,136,196,0.04)"; }}
          />
        </div>

        {error && (
          <p style={{ color: "#FF3B30", fontSize: 12, fontWeight: 600, marginBottom: 14, textAlign: "center" }}>
            ⚠ {error}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%", padding: "12px", borderRadius: 12, border: "none",
            background: saving ? "#94aac4" : "#0F2854",
            color: "#fff", fontSize: 14, fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            fontFamily: "'DM Sans',sans-serif", transition: "background .2s",
          }}
        >
          {saving ? <><Loader size={15} className="animate-spin" /> Saving…</> : <><Save size={15} /> Save Changes</>}
        </button>
      </div>
    </div>
  );
}

// ── Project Detail View ───────────────────────────────────────────────────────
function ProjectDetail({ project, onBack, onProjectUpdated }) {
  const [editOpen, setEditOpen] = useState(false);
  const [localProject, setLocalProject] = useState(project);

  const checks   = localProject.eligibilityChecks || {};
  const phase    = localProject.phase || "Site Preparation";
  const phaseIdx = phaseList.indexOf(phase);
  const delayed  = isProjectDelayed(localProject);

  const progressBg = delayed ? "#FF3B30"
    : (localProject.progress || 0) > 80 ? "#34C759"
    : (localProject.progress || 0) > 50 ? "#4988C4"
    : "#FF9500";

  const handleSaved = (updated) => {
    setLocalProject(prev => ({ ...prev, ...updated }));
    onProjectUpdated(updated);
  };

  return (
    <div className="anim-fade-up">
      {editOpen && (
        <EditProjectModal
          project={localProject}
          onClose={() => setEditOpen(false)}
          onSaved={handleSaved}
        />
      )}

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl border cursor-pointer"
          style={{ background: "rgba(73,136,196,0.08)", border: "1px solid rgba(73,136,196,0.2)", color: "#1C4D8D", fontFamily: "'DM Sans',sans-serif" }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div>
          <p className="text-xs font-semibold tracking-widest m-0" style={{ color: "#4988C4", letterSpacing: "0.05em" }}>PROJECT DETAIL</p>
          <h2 className="text-xl font-extrabold m-0" style={{ color: "#0F2854", fontFamily: "'Syne',sans-serif" }}>
            {localProject.name}
          </h2>
        </div>

        <div className="ml-auto flex gap-2 items-center flex-wrap">
          {delayed && (
            <span
              className="delayed-pulse flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border"
              style={{ background: "rgba(255,59,48,0.1)", color: "#FF3B30", border: "1px solid rgba(255,59,48,0.25)" }}
            >
              <Clock size={10} /> DELAYED
            </span>
          )}

          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl border cursor-pointer"
            style={{ background: "rgba(73,136,196,0.08)", border: "1px solid rgba(73,136,196,0.2)", color: "#1C4D8D", fontFamily: "'DM Sans',sans-serif" }}
          >
            <Edit2 size={13} /> Update Status
          </button>

          <Link href={`/engineer/issue-log?projectId=${localProject._id}&projectName=${encodeURIComponent(localProject.name)}`} style={{ textDecoration: "none" }}>
            <button
              className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl border cursor-pointer transition-colors"
              style={{ background: "rgba(255,149,0,0.1)", border: "1px solid rgba(255,149,0,0.3)", color: "#FF9500", fontFamily: "'DM Sans',sans-serif" }}
            >
              <AlertTriangle size={13} /> Log Installation Issue
            </button>
          </Link>
          <StatusPill label={localProject.status || "active"} color={statusColor[localProject.status] || "blue"} />
        </div>
      </div>

      {delayed && (
        <div
          className="flex items-center gap-3 rounded-xl px-5 py-3 mb-5"
          style={{ background: "rgba(255,59,48,0.06)", border: "1px solid rgba(255,59,48,0.2)" }}
        >
          <AlertTriangle size={16} color="#FF3B30" className="shrink-0" />
          <div>
            <p className="text-sm font-bold m-0" style={{ color: "#FF3B30" }}>Project is delayed</p>
            {localProject.endDate && new Date(localProject.endDate) < new Date() && (
              <p className="text-xs m-0" style={{ color: "#FF3B30", opacity: 0.7 }}>
                Deadline was {fmtDate(localProject.endDate)} — please update status or contact your manager.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
        <div className="flex flex-col gap-4">
          <Card style={{ padding: "22px" }}>
            <SectionHead icon={<FolderOpen size={16} color="#BDE8F5" />} title="Project Information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Project ID", value: localProject._id?.slice(-8).toUpperCase() || "—" },
                { label: "Client",     value: localProject.clientName || "—" },
                { label: "Location",   value: localProject.location   || "—" },
                { label: "Start Date", value: fmtDate(localProject.startDate) },
                { label: "End Date",   value: fmtDate(localProject.endDate), isDelayed: delayed },
                { label: "Status",     value: (localProject.status || "active").charAt(0).toUpperCase() + (localProject.status || "active").slice(1) },
              ].map(({ label, value, isDelayed: d }) => (
                <div key={label}>
                  <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: "#4988C4" }}>{label.toUpperCase()}</p>
                  <p className="text-sm font-semibold m-0" style={{ color: d ? "#FF3B30" : "#0F2854" }}>
                    {value} {d && <span className="text-xs">⚠</span>}
                  </p>
                </div>
              ))}
              {localProject.description && (
                <div className="col-span-full">
                  <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: "#4988C4" }}>DESCRIPTION</p>
                  <p className="text-sm font-medium m-0 leading-relaxed" style={{ color: "#0F2854" }}>{localProject.description}</p>
                </div>
              )}
              {localProject.engineerNotes && (
                <div className="col-span-full">
                  <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: "#FF9500" }}>ENGINEER NOTES</p>
                  <p className="text-sm font-medium m-0 leading-relaxed" style={{ color: "#0F2854" }}>{localProject.engineerNotes}</p>
                </div>
              )}
            </div>
          </Card>

          <Card style={{ padding: "22px" }}>
            <SectionHead icon={<ClipboardList size={16} color="#BDE8F5" />} title="Progress & Phase" />
            <div className="mb-5">
              <div className="flex justify-between mb-1.5">
                <span className="text-xs" style={{ color: "#4988C4" }}>Overall Progress</span>
                <span className="text-xs font-bold" style={{ color: "#0F2854" }}>{localProject.progress || 0}%</span>
              </div>
              <div className="rounded-full h-2" style={{ background: "rgba(73,136,196,0.12)" }}>
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${localProject.progress || 0}%`, background: progressBg, transition: "width 0.5s ease" }}
                />
              </div>
            </div>

            <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: "#4988C4" }}>CURRENT PHASE</p>
            <div className="flex flex-col gap-2">
              {phaseList.map((p, i) => {
                const done    = i < phaseIdx;
                const current = i === phaseIdx;
                const hex     = phaseHex[p] || "#4988C4";
                return (
                  <div
                    key={p}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl"
                    style={{
                      background: current ? `${hex}12` : done ? "rgba(52,199,89,0.05)" : "rgba(73,136,196,0.03)",
                      border: `1px solid ${current ? hex + "40" : done ? "rgba(52,199,89,0.15)" : "rgba(73,136,196,0.08)"}`,
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                      style={{
                        background: current ? hex : done ? "#34C759" : "rgba(73,136,196,0.12)",
                        color: (current || done) ? "#fff" : "#4988C4",
                      }}
                    >
                      {done ? "✓" : i + 1}
                    </div>
                    <span className="text-xs font-semibold" style={{ color: current ? hex : done ? "#34C759" : "#4988C4", fontWeight: current ? 700 : 500 }}>
                      {p}
                    </span>
                    {current && (
                      <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${hex}18`, color: hex }}>
                        Current
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card style={{ padding: "22px" }}>
            <SectionHead icon={<CheckSquare size={16} color="#BDE8F5" />} title="Eligibility Checklist" />
            {localProject.eligibilityStatus === "proceeded" ? (
              <>
                <div className="flex items-center gap-2 rounded-xl px-3 py-2 mb-4" style={{ background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.2)" }}>
                  <CheckCircle2 size={14} color="#34C759" />
                  <span className="text-xs font-bold" style={{ color: "#34C759" }}>All checks passed — Approved by admin</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {CHECKS_META.map((c) => {
                    const passed = checks[c.key];
                    return (
                      <div key={c.key} className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: passed ? "rgba(52,199,89,0.06)" : "rgba(255,59,48,0.05)", border: `1px solid ${passed ? "rgba(52,199,89,0.2)" : "rgba(255,59,48,0.15)"}` }}>
                        <div className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center" style={{ background: passed ? "#34C759" : "#FF3B30" }}>
                          {passed ? <CheckCircle2 size={12} color="#fff" /> : <XCircle size={12} color="#fff" />}
                        </div>
                        <span className="text-xs font-semibold" style={{ color: passed ? "#1a6b3c" : "#c0392b" }}>{c.label}</span>
                      </div>
                    );
                  })}
                </div>
                {localProject.eligibilityProceededAt && (
                  <p className="text-xs text-right mt-3" style={{ color: "#4988C4" }}>
                    Approved · {fmtDate(localProject.eligibilityProceededAt)}
                  </p>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center py-8 gap-3 text-center">
                <Package size={28} strokeWidth={1.5} style={{ color: "rgba(73,136,196,0.3)" }} />
                <p className="text-xs font-semibold m-0" style={{ color: "#4988C4" }}>Eligibility not yet reviewed</p>
                <p className="text-xs m-0" style={{ color: "#4988C4", opacity: 0.7 }}>Admin will complete this checklist before installation begins.</p>
              </div>
            )}
          </Card>

          <Card style={{ padding: "22px" }}>
            <SectionHead icon={<User size={16} color="#BDE8F5" />} title="Assigned Team" />
            <div className="flex flex-col gap-2">
              {(localProject.assignedEngineers || []).map((e) => (
                <div key={e._id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(73,136,196,0.04)", border: "1px solid rgba(73,136,196,0.1)" }}>
                  <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-bold" style={{ background: "linear-gradient(135deg,#4988C4,#0F2854)" }}>
                    {(e.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold m-0" style={{ color: "#0F2854" }}>{e.name}</p>
                    <p className="text-xs m-0" style={{ color: "#4988C4" }}>Engineer</p>
                  </div>
                </div>
              ))}
              {localProject.assignedMarketingExecutive && (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,149,0,0.04)", border: "1px solid rgba(255,149,0,0.12)" }}>
                  <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-bold" style={{ background: "linear-gradient(135deg,#FF9500,#e67e22)" }}>
                    {(localProject.assignedMarketingExecutive.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold m-0" style={{ color: "#0F2854" }}>{localProject.assignedMarketingExecutive.name}</p>
                    <p className="text-xs m-0" style={{ color: "#FF9500" }}>Marketing Executive</p>
                  </div>
                </div>
              )}
              {localProject.assignedInstallationIncharge && (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(52,199,89,0.04)", border: "1px solid rgba(52,199,89,0.12)" }}>
                  <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-bold" style={{ background: "linear-gradient(135deg,#34C759,#27ae60)" }}>
                    {(localProject.assignedInstallationIncharge.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold m-0" style={{ color: "#0F2854" }}>{localProject.assignedInstallationIncharge.name}</p>
                    <p className="text-xs m-0" style={{ color: "#34C759" }}>Installation Incharge</p>
                  </div>
                </div>
              )}
              {(localProject.assignedEngineers || []).length === 0 && !localProject.assignedMarketingExecutive && !localProject.assignedInstallationIncharge && (
                <p className="text-xs text-center py-4" style={{ color: "#4988C4" }}>No team members assigned yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({ project, onClick, onEdit, index }) {
  const delayed    = isProjectDelayed(project);
  const progressBg = delayed ? "#FF3B30"
    : (project.progress || 0) > 80 ? "#34C759"
    : (project.progress || 0) > 50 ? "#4988C4"
    : "#FF9500";

  return (
    <div
      className="card-hover anim-fade-up rounded-2xl cursor-pointer overflow-hidden bg-white"
      style={{
        border: `1px solid ${delayed ? "rgba(255,59,48,0.2)" : "rgba(73,136,196,0.12)"}`,
        boxShadow: "0 2px 10px rgba(15,40,84,0.06)",
        animationDelay: `${index * 0.04}s`,
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow   = delayed ? "0 10px 32px rgba(255,59,48,0.1)" : "0 10px 32px rgba(15,40,84,0.12)";
        e.currentTarget.style.borderColor = delayed ? "rgba(255,59,48,0.4)" : "rgba(73,136,196,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow   = "0 2px 10px rgba(15,40,84,0.06)";
        e.currentTarget.style.borderColor = delayed ? "rgba(255,59,48,0.2)" : "rgba(73,136,196,0.12)";
      }}
    >
      <div className="px-5 py-4" style={{ borderBottom: `1px solid ${delayed ? "rgba(255,59,48,0.1)" : "rgba(73,136,196,0.08)"}`, background: delayed ? "rgba(255,59,48,0.03)" : "rgba(73,136,196,0.03)" }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-sm font-bold m-0 break-words" style={{ color: "#0F2854" }}>{project.name}</h3>
              {delayed && (
                <span className="delayed-pulse shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border" style={{ background: "rgba(255,59,48,0.1)", color: "#FF3B30", border: "1px solid rgba(255,59,48,0.2)" }}>
                  DELAYED
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs" style={{ color: "#4988C4" }}>
              <MapPin size={10} className="shrink-0" />
              {project.location || "—"}
            </div>
          </div>
          <div className="shrink-0">
            <StatusPill label={project.status || "active"} color={statusColor[project.status] || "blue"} />
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="mb-4">
          <div className="flex justify-between mb-1.5">
            <span className="text-xs font-semibold" style={{ color: "#4988C4" }}>Progress</span>
            <span className="text-xs font-bold" style={{ color: delayed ? "#FF3B30" : "#0F2854" }}>{project.progress || 0}%</span>
          </div>
          <div className="rounded-full h-1.5" style={{ background: delayed ? "rgba(255,59,48,0.1)" : "rgba(73,136,196,0.12)" }}>
            <div className="h-1.5 rounded-full" style={{ width: `${project.progress || 0}%`, background: progressBg, transition: "width 0.6s ease" }}/>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 mb-4">
          {[
            { label: "CLIENT",   value: project.clientName || "—" },
            { label: "PHASE",    value: project.phase      || "—" },
            { label: "START",    value: fmtDate(project.startDate) },
            { label: "DEADLINE", value: fmtDate(project.endDate), isDelayed: delayed },
          ].map(({ label, value, isDelayed: d }) => (
            <div key={label}>
              <p className="text-xs font-semibold tracking-widest mb-0.5" style={{ color: d ? "rgba(255,59,48,0.6)" : "rgba(73,136,196,0.6)" }}>{label}</p>
              <p className="text-xs font-semibold m-0 truncate flex items-center gap-1" style={{ color: d ? "#FF3B30" : "#0F2854" }}>
                {d && <Calendar size={10} />}{value}
              </p>
            </div>
          ))}
        </div>

        {(project.assignedEngineers || []).length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex">
              {(project.assignedEngineers || []).slice(0, 4).map((e, i) => (
                <div key={e._id || i} title={e.name} className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(135deg,#4988C4,#0F2854)", border: "2px solid #fff", marginLeft: i > 0 ? "-6px" : "0" }}>
                  {(e.name || "?").charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            <span className="text-xs" style={{ color: "#4988C4" }}>
              {(project.assignedEngineers || []).length} engineer{(project.assignedEngineers || []).length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${delayed ? "rgba(255,59,48,0.1)" : "rgba(73,136,196,0.08)"}` }}>
          <span className="text-xs font-semibold" style={{ color: delayed ? "#FF3B30" : "#4988C4" }}>
            View full details
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="flex items-center gap-1 text-xs font-bold cursor-pointer border-none"
              style={{ background: "rgba(73,136,196,0.08)", color: "#1C4D8D", padding: "4px 10px", borderRadius: 7, border: "1px solid rgba(73,136,196,0.2)" }}
            >
              <Edit2 size={11} /> Edit
            </button>
            <ChevronRight size={14} color={delayed ? "#FF3B30" : "#4988C4"} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EngineerMyProjects() {
  const [projects,        setProjects]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject,  setEditingProject]  = useState(null);
  const [filterTab,       setFilterTab]       = useState("all");
  const [searchQuery,     setSearchQuery]     = useState("");
  const [sortBy,          setSortBy]          = useState("name-asc");
  const [engineerName,    setEngineerName]    = useState("Engineer");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const engineerId = getCurrentEngineerId();
      setEngineerName(getCurrentEngineerName());
      const pData       = await apiFetch("/projects");
      const allProjects = Array.isArray(pData) ? pData : pData.projects || [];
      const myProjects  = engineerId
        ? allProjects.filter((p) => (p.assignedEngineers || []).some((e) => (e._id || e) === engineerId))
        : allProjects;
      setProjects(myProjects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleProjectUpdated = (updated) => {
    setProjects(prev => prev.map(p => p._id === updated._id ? { ...p, ...updated } : p));
    if (selectedProject?._id === updated._id) {
      setSelectedProject(prev => ({ ...prev, ...updated }));
    }
  };

  const delayedProjects   = projects.filter((p) => isProjectDelayed(p));
  const activeProjects    = projects.filter((p) => p.status !== "completed" && !isProjectDelayed(p));
  const completedProjects = projects.filter((p) => p.status === "completed");
  const onHoldProjects    = projects.filter((p) => p.status === "on-hold");

  const tabCounts = {
    all: projects.length, active: activeProjects.length,
    delayed: delayedProjects.length, completed: completedProjects.length, "on-hold": onHoldProjects.length,
  };

  // ── Stat card click → set filterTab ──────────────────────────────────────
  const STATS = [
    { label: "Total",     value: projects.length,         color: "#4988C4", bg: "rgba(73,136,196,0.08)",  border: "rgba(73,136,196,0.15)",  filterKey: "all"       },
    { label: "Active",    value: activeProjects.length,    color: "#0F2854", bg: "rgba(15,40,84,0.05)",    border: "rgba(15,40,84,0.1)",     filterKey: "active"    },
    { label: "Delayed",   value: delayedProjects.length,   color: "#FF3B30", bg: "rgba(255,59,48,0.06)",   border: "rgba(255,59,48,0.15)",   filterKey: "delayed"   },
    { label: "Completed", value: completedProjects.length, color: "#34C759", bg: "rgba(52,199,89,0.07)",   border: "rgba(52,199,89,0.18)",   filterKey: "completed" },
  ];

  const filtered = (() => {
    let list = [...projects];
    if (filterTab === "active")    list = [...activeProjects];
    if (filterTab === "delayed")   list = [...delayedProjects];
    if (filterTab === "completed") list = [...completedProjects];
    if (filterTab === "on-hold")   list = [...onHoldProjects];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.clientName || "").toLowerCase().includes(q) ||
        (p.location || "").toLowerCase().includes(q) ||
        (p.phase || "").toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      if (sortBy === "name-asc")      return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "name-desc")     return (b.name || "").localeCompare(a.name || "");
      if (sortBy === "progress-desc") return (b.progress || 0) - (a.progress || 0);
      if (sortBy === "progress-asc")  return (a.progress || 0) - (b.progress || 0);
      if (sortBy === "date-desc")     return new Date(b.startDate || 0) - new Date(a.startDate || 0);
      if (sortBy === "date-asc")      return new Date(a.startDate || 0) - new Date(b.startDate || 0);
      return 0;
    });
    return list;
  })();

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 px-5 text-sm" style={{ color: "#4988C4" }}>
        <Loader2 size={16} className="animate-spin" /> Loading your projects…
      </div>
    );
  }

  if (selectedProject) {
    return (
      <>
        <style>{ANIM_CSS + FONTS}</style>
        <ProjectDetail
          project={selectedProject}
          onBack={() => setSelectedProject(null)}
          onProjectUpdated={handleProjectUpdated}
        />
      </>
    );
  }

  return (
    <>
      <style>{ANIM_CSS + FONTS}</style>

      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSaved={(updated) => { handleProjectUpdated(updated); setEditingProject(null); }}
        />
      )}

      <PageHeader
        eyebrow="Engineer Panel"
        title="My Projects"
        subtitle={`${engineerName} · ${projects.length} project${projects.length !== 1 ? "s" : ""} assigned to you`}
      />

      {delayedProjects.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl px-5 py-3 mb-5 flex-wrap" style={{ background: "rgba(255,59,48,0.06)", border: "1px solid rgba(255,59,48,0.2)" }}>
          <AlertTriangle size={15} color="#FF3B30" className="shrink-0" />
          <span className="text-sm font-semibold flex-1" style={{ color: "#c0392b", minWidth: "160px" }}>
            You have <strong>{delayedProjects.length}</strong> delayed project{delayedProjects.length > 1 ? "s" : ""} that need attention.
          </span>
          <button onClick={() => setFilterTab("delayed")} className="text-white text-xs font-bold px-4 py-1.5 rounded-lg cursor-pointer border-none" style={{ background: "#FF3B30" }}>
            View Delayed →
          </button>
        </div>
      )}

      {/* ── Stat Cards (clickable filters) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {STATS.map((s) => {
          const isActive = filterTab === s.filterKey;
          return (
            <button
              key={s.label}
              onClick={() => setFilterTab(s.filterKey)}
              className="card-hover rounded-2xl px-5 py-4 text-left w-full"
              style={{
                background: s.bg,
                border: isActive
                  ? `2px solid ${s.color}`
                  : `1px solid ${s.border}`,
                boxShadow: isActive ? `0 4px 16px ${s.color}30` : "none",
                cursor: "pointer",
                transition: "border .15s, box-shadow .15s",
                outline: "none",
              }}
            >
              <p className="text-xs font-semibold tracking-widest mb-1 uppercase m-0" style={{ color: "#4988C4" }}>{s.label}</p>
              <p className="text-3xl font-extrabold m-0" style={{ color: s.color, fontFamily: "'Syne',sans-serif" }}>{s.value}</p>
              {isActive && (
                <p className="text-xs font-bold mt-1 m-0" style={{ color: s.color }}>● Active filter</p>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <div className="relative flex-1" style={{ minWidth: "200px" }}>
          <Search size={14} className="absolute pointer-events-none" style={{ left: "12px", top: "50%", transform: "translateY(-50%)", color: "#4988C4" }} />
          <input
            type="text"
            placeholder="Search by name, client, location, phase…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm outline-none"
            style={{ padding: "9px 12px 9px 36px", borderRadius: "10px", border: "1px solid rgba(73,136,196,0.2)", background: "rgba(73,136,196,0.04)", color: "#0F2854", fontFamily: "'DM Sans',sans-serif", transition: "border-color .18s, background .18s" }}
            onFocus={(e) => { e.target.style.borderColor = "#4988C4"; e.target.style.background = "#fff"; }}
            onBlur={(e)  => { e.target.style.borderColor = "rgba(73,136,196,0.2)"; e.target.style.background = "rgba(73,136,196,0.04)"; }}
          />
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-sm outline-none cursor-pointer" style={{ padding: "9px 12px", borderRadius: "10px", border: "1px solid rgba(73,136,196,0.2)", background: "rgba(73,136,196,0.04)", color: "#0F2854", fontFamily: "'DM Sans',sans-serif" }}>
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTER_TABS.map((tab) => {
          const isActive  = filterTab === tab.key;
          const isDelayed = tab.key === "delayed";
          return (
            <button key={tab.key} onClick={() => setFilterTab(tab.key)} className="text-xs font-bold px-4 py-1.5 rounded-full border cursor-pointer transition-all" style={{ background: isActive ? (isDelayed ? "#FF3B30" : "#0F2854") : "transparent", color: isActive ? "#fff" : "#4988C4", border: `1px solid ${isActive ? (isDelayed ? "#FF3B30" : "#0F2854") : "rgba(73,136,196,0.2)"}`, fontFamily: "'DM Sans',sans-serif" }}>
              {tab.label}
              {tab.key !== "all" && <span className="ml-1.5 opacity-70">({tabCounts[tab.key]})</span>}
            </button>
          );
        })}
        {(searchQuery || filterTab !== "all") && (
          <button onClick={() => { setSearchQuery(""); setFilterTab("all"); }} className="text-xs font-bold px-3 py-1.5 rounded-full border cursor-pointer" style={{ color: "#4988C4", border: "1px solid rgba(73,136,196,0.2)", background: "transparent", fontFamily: "'DM Sans',sans-serif" }}>
            Clear ✕
          </button>
        )}
      </div>

      <p className="text-xs font-semibold mb-3" style={{ color: "rgba(73,136,196,0.6)" }}>
        {filtered.length} project{filtered.length !== 1 ? "s" : ""} found{searchQuery && ` for "${searchQuery}"`}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((project, i) => (
          <ProjectCard
            key={project._id}
            project={project}
            index={i}
            onClick={() => setSelectedProject(project)}
            onEdit={() => setEditingProject(project)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3 text-center" style={{ gridColumn: "1/-1" }}>
            <FolderOpen size={40} strokeWidth={1.5} style={{ color: "rgba(73,136,196,0.25)" }} />
            <p className="text-sm font-semibold m-0" style={{ color: "#4988C4" }}>
              {searchQuery ? `No projects match "${searchQuery}"` : filterTab === "delayed" ? "🎉 No delayed projects — you're on track!" : filterTab === "completed" ? "No completed projects yet." : filterTab === "on-hold" ? "No on-hold projects." : "No projects assigned to you yet."}
            </p>
            {(searchQuery || filterTab !== "all") && (
              <button onClick={() => { setSearchQuery(""); setFilterTab("all"); }} className="text-xs font-bold underline cursor-pointer bg-transparent border-none" style={{ color: "#4988C4" }}>
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}