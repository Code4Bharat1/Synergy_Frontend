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
MessageSquare,
  ExternalLink,
} from "lucide-react";
import axiosInstance from "../../lib/axios";
import ComplaintTracker, { STAGE_ADVANCE_ROLES } from "../common/ComplaintTracker";
import MediaGallery from "../common/MediaGallery";

// ── Shared Components (inline replacements for shared.js) ─────────────────────
function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-extra-darkblue">{title}</h1>
      {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function StatusPill({ label, color }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    gray: "bg-gray-100 text-gray-500",
  };
  return (
    <span
      className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${colorMap[color] || colorMap.blue}`}
    >
      {label}
    </span>
  );
}

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
  { key: "material", label: "Material Delivered" },
  { key: "foundation", label: "Foundation Completed" },
  { key: "customer", label: "Customer Readiness" },
  { key: "acceptance", label: "Client Acceptance" },
];

const priorityMap = {
  High: { color: "#FF3B30", bg: "rgba(255,59,48,0.08)" },
  Medium: { color: "#FF9500", bg: "rgba(255,149,0,0.08)" },
  Low: { color: "#34C759", bg: "rgba(52,199,89,0.08)" },
  Critical: { color: "#c0392b", bg: "rgba(192,57,43,0.08)" },
  high: { color: "#FF3B30", bg: "rgba(255,59,48,0.08)" },
  medium: { color: "#FF9500", bg: "rgba(255,149,0,0.08)" },
  low: { color: "#34C759", bg: "rgba(52,199,89,0.08)" },
  critical: { color: "#c0392b", bg: "rgba(192,57,43,0.08)" },
};

const statusColor = {
  active: "blue",
  completed: "green",
  "on-hold": "orange",
  initiated: "blue",
  installation: "blue",
  testing: "blue",
  delayed: "red",
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
  { value: "initiated", label: "Initiated" },
  { value: "in-progress", label: "In Progress" },
  { value: "installation", label: "Installation" },
  { value: "testing", label: "Testing" },
  { value: "completed", label: "Completed" },
  { value: "on-hold", label: "On Hold" },
];

const STATUS_PHASE = {
  initiated: "Site Preparation",
  "in-progress": "Wiring & Plumbing",
  installation: "Installation",
  testing: "Final Testing",
  completed: "Completed",
  "on-hold": "Site Preparation",
};

const STATUS_PROGRESS = {
  initiated: 5,
  "in-progress": 40,
  installation: 65,
  testing: 80,
  completed: 100,
  "on-hold": 30,
};

// ── Edit Project Modal ────────────────────────────────────────────────────────
function EditProjectModal({ project, onClose, onSaved }) {
  const [status, setStatus] = useState(project.status || "initiated");
  const [notes, setNotes] = useState(project.engineerNotes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const previewPhase = STATUS_PHASE[status] || "Site Preparation";
  const previewProgress = STATUS_PROGRESS[status] ?? 0;
  const progressBg =
    previewProgress > 80
      ? "#34C759"
      : previewProgress > 50
        ? "#4988C4"
        : "#FF9500";

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await apiPut(`/projects/${project._id}`, {
        status,
        phase: STATUS_PHASE[status],
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,40,84,0.45)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
        style={{ animation: "slideUp 0.3s ease" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-0">
          <div>
            <p className="text-xs font-bold tracking-widest text-blue-500 uppercase mb-1">
              Update Project
            </p>
            <h3
              className="text-lg font-bold text-extra-darkblue"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {project.projectId && (
                <span className="text-blue-500 mr-2 pr-2 border-r border-blue-200">
                  {project.projectId}
                </span>
              )}
              {project.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-100 border border-gray-200 rounded-lg p-2 text-blue-500 hover:bg-gray-200 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <span className="text-xs text-blue-600">
              ℹ️ Set the <strong>status</strong> — phase and progress update
              automatically.
            </span>
          </div>

          {/* Status select */}
          <div>
            <label className="block text-xs font-bold text-gray-400 tracking-widest uppercase mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-blue-100 bg-blue-50/40 text-extra-darkblue text-sm font-medium focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
            >
              {ENGINEER_STATUS_OPTIONS?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Auto preview */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-3">
              Will be set automatically
            </p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-blue-500 font-semibold">Phase</span>
              <span className="text-xs font-bold text-extra-darkblue">
                {previewPhase}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-blue-500 font-semibold">
                Progress
              </span>
              <span className="text-xs font-bold text-extra-darkblue">
                {previewProgress}%
              </span>
            </div>
            <div className="bg-gray-200 rounded-full h-1.5 mt-2">
              <div
                className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${previewProgress}%`, background: progressBg }}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-400 tracking-widest uppercase mb-2">
              Notes{" "}
              <span className="font-normal normal-case tracking-normal">
                (optional)
              </span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any site updates, blockers, or observations…"
              className="w-full px-3 py-2.5 rounded-xl border border-blue-100 bg-blue-50/40 text-extra-darkblue text-sm resize-none focus:outline-none focus:border-blue-400 focus:bg-white transition-colors leading-relaxed"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs font-semibold text-center">
              ⚠ {error}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed"
            style={{ background: saving ? "#94aac4" : "#0F2854" }}
          >
            {saving ? (
              <>
                <Loader size={15} className="animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save size={15} /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>
      <style>{`@keyframes slideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
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
        const allDocs = Array.isArray(data) ? data : data.documents || [];
        setDocuments(
          allDocs.filter((d) => (d.project?._id || d.project) === project._id),
        );
      } catch (err) {
        console.error("Failed to load documents", err);
      } finally {
        setDocsLoading(false);
      }
    };
    if (project?._id) fetchDocs();
  }, [project._id]);

  const handleSaved = (updated) => {
    setLocalProject((prev) => ({ ...prev, ...updated }));
    if (onProjectUpdated) onProjectUpdated(updated);
  };

  const checks = localProject.eligibilityChecks || {};
  const phase = localProject.phase || "Site Preparation";
  const phaseList = [
    "Site Preparation",
    "Wiring & Plumbing",
    "Equipment Setup",
    "Installation",
    "Final Testing",
    "Completed",
  ];
  const phaseIdx = phaseList.indexOf(phase);
  const delayed = isProjectDelayed(localProject);

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  return (
    <>
      {editOpen && (
        <EditProjectModal
          project={localProject}
          onClose={() => setEditOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Top bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <p className="text-xs font-bold tracking-widest text-blue-500 uppercase leading-none mb-0.5">
            Project Detail
          </p>
          <h2
            className="text-xl font-bold text-extra-darkblue"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {localProject.name}
          </h2>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {delayed && (
            <span className="flex items-center gap-1 bg-red-50 text-red-500 text-xs font-bold px-2.5 py-1 rounded-full border border-red-100 animate-pulse">
              <Clock size={10} /> DELAYED
            </span>
          )}
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-500 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors"
          >
            <Edit2 size={13} /> Update Status
          </button>
          <Link
            href={`/engineer/issue-log?projectId=${localProject._id}&projectName=${encodeURIComponent(localProject.name)}`}
            style={{ textDecoration: "none" }}
          >
            <button className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 text-amber-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-100 transition-colors">
              <AlertTriangle size={13} /> Log Installation Issue
            </button>
          </Link>
          <StatusPill
            label={localProject.status || "active"}
            color={statusColor[localProject.status] || "blue"}
          />
        </div>
      </div>

      {/* Delayed warning */}
      {delayed && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-5 flex items-center gap-3">
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-500 m-0">
              Project is delayed
            </p>
            {project.endDate && new Date(project.endDate) < new Date() && (
              <p className="text-xs text-red-400 mt-0.5 m-0">
                Deadline was {fmtDate(project.endDate)} — please update project
                status or contact your manager.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Detail grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
        {/* Left column */}
        <div className="space-y-5">
          {/* Project Info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-extra-darkblue flex items-center justify-center shrink-0">
                <FolderOpen size={16} className="text-sky-200" />
              </div>
              <h3 className="text-sm font-bold text-extra-darkblue">
                Project Information
              </h3>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              {[
                { label: "Client", value: localProject.clientName || "—" },
                { label: "Location", value: localProject.location || "—" },
                { label: "Start Date", value: fmtDate(localProject.startDate) },
                {
                  label: "End Date",
                  value: fmtDate(localProject.endDate),
                  delayed,
                },
                {
                  label: "Description",
                  value: localProject.description || "—",
                  full: true,
                },
              ]?.map(({ label, value, full, delayed: d }) => (
                <div key={label} className={full ? "col-span-2" : ""}>
                  <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">
                    {label}
                  </p>
                  <p
                    className={`text-sm font-semibold m-0 ${d ? "text-red-500" : "text-extra-darkblue"}`}
                  >
                    {value} {d && <span className="text-xs">⚠</span>}
                  </p>
                </div>
              ))}
              {localProject.engineerNotes && (
                <div className="col-span-2">
                  <p className="text-xs font-bold text-amber-500 tracking-widest uppercase mb-1">
                    Engineer Notes
                  </p>
                  <p className="text-sm font-semibold text-extra-darkblue m-0">
                    {localProject.engineerNotes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Progress & Phase */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-extra-darkblue flex items-center justify-center shrink-0">
                <ClipboardList size={16} className="text-sky-200" />
              </div>
              <h3 className="text-sm font-bold text-extra-darkblue">
                Progress &amp; Phase
              </h3>
            </div>
            <div className="p-5">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-gray-400 font-medium">
                  Overall Progress
                </span>
                <span className="text-xs font-bold text-extra-darkblue">
                  {localProject.progress || 0}%
                </span>
              </div>
              <div className="bg-gray-100 rounded-full h-1.5 mb-5">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${localProject.progress || 0}%`,
                    background: delayed
                      ? "#FF3B30"
                      : (localProject.progress || 0) > 80
                        ? "#34C759"
                        : (localProject.progress || 0) > 50
                          ? "#4988C4"
                          : "#FF9500",
                  }}
                />
              </div>
              <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-3">
                Current Phase
              </p>
              <div className="space-y-2">
                {phaseList?.map((p, i) => {
                  const done = i < phaseIdx,
                    current = i === phaseIdx;
                  return (
                    <div
                      key={p}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all"
                      style={{
                        background: current
                          ? `${phaseColors[p]}10`
                          : done
                            ? "rgba(52,199,89,0.05)"
                            : "#fafbfd",
                        borderColor: current
                          ? `${phaseColors[p]}35`
                          : done
                            ? "rgba(52,199,89,0.15)"
                            : "#eef2f8",
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          background: current
                            ? phaseColors[p]
                            : done
                              ? "#34C759"
                              : "#eef2f8",
                          color: current || done ? "#fff" : "#94aac4",
                        }}
                      >
                        {done ? "✓" : i + 1}
                      </div>
                      <span
                        className="text-xs"
                        style={{
                          fontWeight: current ? 700 : 500,
                          color: current
                            ? phaseColors[p]
                            : done
                              ? "#34C759"
                              : "#94aac4",
                        }}
                      >
                        {p}
                      </span>
                      {current && (
                        <span
                          className="ml-auto text-xs font-bold px-2.5 py-0.5 rounded-full"
                          style={{
                            background: `${phaseColors[p]}14`,
                            color: phaseColors[p],
                          }}
                        >
                          Current
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Eligibility Checklist */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-extra-darkblue flex items-center justify-center shrink-0">
                <CheckSquare size={16} className="text-sky-200" />
              </div>
              <h3 className="text-sm font-bold text-extra-darkblue">
                Eligibility Checklist
              </h3>
            </div>
            <div className="p-5">
              {project.eligibilityStatus === "proceeded" ? (
                <>
                  <div className="flex items-center gap-2 mb-4 bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
                    <CheckCircle2 size={14} className="text-green-500" />
                    <span className="text-xs font-bold text-green-700">
                      All checks passed — Approved by admin
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {CHECKS_META?.map((c) => {
                      const passed = checks[c.key];
                      return (
                        <div
                          key={c.key}
                          className="flex items-center gap-2 p-2.5 rounded-xl border"
                          style={{
                            background: passed
                              ? "rgba(52,199,89,0.05)"
                              : "rgba(255,59,48,0.04)",
                            borderColor: passed
                              ? "rgba(52,199,89,0.18)"
                              : "rgba(255,59,48,0.13)",
                          }}
                        >
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                            style={{
                              background: passed ? "#34C759" : "#FF3B30",
                            }}
                          >
                            {passed ? (
                              <CheckCircle2 size={11} color="#fff" />
                            ) : (
                              <XCircle size={11} color="#fff" />
                            )}
                          </div>
                          <span
                            className="text-xs font-semibold"
                            style={{ color: passed ? "#1a6b3c" : "#c0392b" }}
                          >
                            {c.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center py-8 gap-2 text-center">
                  <Package
                    size={32}
                    className="text-gray-200"
                    strokeWidth={1.5}
                  />
                  <p className="text-sm font-semibold text-gray-400 m-0">
                    Eligibility not yet reviewed
                  </p>
                  <p className="text-xs text-gray-300 m-0">
                    Admin will complete this checklist before installation
                    begins.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Team */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-extra-darkblue flex items-center justify-center shrink-0">
                <User size={16} className="text-sky-200" />
              </div>
              <h3 className="text-sm font-bold text-extra-darkblue">
                Assigned Team
              </h3>
            </div>
            <div className="p-5 space-y-2">
              {(localProject.assignedEngineers || [])?.map((e) => (
                <div
                  key={e._id}
                  className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-extra-darkblue flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {(e.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-extra-darkblue m-0">
                      {e.name}
                    </p>
                    <p className="text-xs text-gray-400 m-0">Engineer</p>
                  </div>
                </div>
              ))}
              {(localProject.assignedEngineers || []).length === 0 &&
                !localProject.assignedMarketingExecutive &&
                !localProject.assignedInstallationIncharge && (
                  <p className="text-xs text-gray-400 text-center py-5">
                    No team members assigned yet.
                  </p>
                )}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-extra-darkblue flex items-center justify-center shrink-0">
                <FileText size={16} className="text-sky-200" />
              </div>
              <h3 className="text-sm font-bold text-extra-darkblue">
                Uploaded Documents
              </h3>
            </div>
            <div className="p-5">
              {docsLoading ? (
                <div className="flex items-center gap-2 py-5 text-gray-400 text-xs justify-center">
                  <Loader size={14} className="animate-spin" /> Loading
                  documents...
                </div>
              ) : documents.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-5">
                  No documents uploaded for this project yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {documents?.map((doc) => (
                    <div
                      key={doc._id}
                      className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100 justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-blue-500 shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-extra-darkblue m-0 truncate">
                            {doc.title || doc.name || "Untitled"}
                          </p>
                          <p className="text-xs text-gray-400 m-0 flex gap-1.5">
                            <span className="capitalize">
                              {doc.documentType || "Other"}
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(doc.createdAt).toLocaleDateString(
                                "en-GB",
                                { day: "2-digit", month: "short" },
                              )}
                            </span>
                          </p>
                        </div>
                      </div>
                      {doc.url &&
                      typeof doc.url === "string" &&
                      doc.url.startsWith("http") ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-gray-200 text-blue-500 hover:bg-blue-100 transition-colors shrink-0"
                          title="View Document"
                        >
                          <Eye size={14} />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 font-semibold px-2 py-1 bg-gray-100 rounded-lg shrink-0">
                          Pending
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Delayed Panel ─────────────────────────────────────────────────────────────
function DelayedProjectsPanel({ projects, onClose, onSelectProject }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(15,40,84,0.48)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl w-full max-w-xl max-h-[72vh] overflow-y-auto shadow-2xl"
        style={{ animation: "slideUp 0.3s ease" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 pb-5">
          <div>
            <p className="text-xs font-bold tracking-widest text-red-500 uppercase mb-1">
              Attention Required
            </p>
            <h3
              className="text-lg font-bold text-extra-darkblue"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Delayed Projects ({projects.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-100 border border-gray-200 text-blue-500 font-bold text-sm px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>

        <div className="px-6 pb-6 space-y-3">
          {projects.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              🎉 No delayed projects — you're on track!
            </div>
          ) : (
            projects?.map((p) => (
              <div
                key={p._id}
                onClick={() => {
                  onSelectProject(p);
                  onClose();
                }}
                className="p-4 rounded-2xl cursor-pointer bg-red-50 border border-red-100 hover:bg-red-100 hover:translate-x-0.5 transition-all"
              >
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-extra-darkblue m-0 break-words">
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 m-0 flex items-center gap-1">
                      <MapPin size={10} /> {p.location || "Global"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.endDate && (
                      <span className="text-xs text-red-500 font-semibold flex items-center gap-1">
                        <Calendar size={10} />
                        Due{" "}
                        {new Date(p.endDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    )}
                    <ChevronRight size={13} className="text-red-500" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-red-100 rounded-full h-1">
                    <div
                      className="h-1 rounded-full bg-red-500"
                      style={{ width: `${p.progress || 0}%` }}
                    />
                  </div>
                  <span className="text-red-500 text-xs font-bold min-w-[28px]">
                    {p.progress || 0}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <style>{`@keyframes slideUp{from{transform:translateY(100px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function EngineerDashboard() {
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [togglingTaskId, setTogglingTaskId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectFilter, setProjectFilter] = useState("all");
  const [showDelayedPanel, setShowDelayedPanel] = useState(false);
  const [engineerName, setEngineerName] = useState("Engineer");
  const [viewComplaint, setViewComplaint] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

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
      const myProjects = engineerId
        ? allProjects.filter((p) =>
            (p.assignedEngineers || []).some(
              (e) => (e._id || e) === engineerId,
            ),
          )
        : allProjects;
      setProjects(myProjects);

      // ── Tasks: filter to this engineer ──
      const allTasks = Array.isArray(tData) ? tData : tData?.data || [];
      const myTasks = engineerId
        ? allTasks.filter((t) => {
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

  const handleAdvanceStage = async (nextStageKey, stageData = {}) => {
    if (!viewComplaint) return;
    try {
      setActionLoading(true);
      
      const formData = new FormData();
      formData.append("currentStage", nextStageKey);
      
      if (stageData.stageNotes) formData.append("stageNotes", stageData.stageNotes);
      if (stageData.materials) formData.append("materials", JSON.stringify(stageData.materials));
      if (stageData.files) {
        stageData.files.forEach(f => formData.append("photos", f));
      }

      await axiosInstance.put(`/complaints/${viewComplaint._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setViewComplaint(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle task completion — calls API and reflects on TaskPanel instantly
  const toggleTask = async (task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    setTogglingTaskId(task._id);
    try {
      await apiPatch(`/pending/update/${task._id}`, { status: newStatus });
      setTasks((prev) =>
        prev?.map((t) =>
          t._id === task._id ? { ...t, status: newStatus } : t,
        ),
      );
    } catch (err) {
      console.error("Toggle task failed:", err);
    } finally {
      setTogglingTaskId(null);
    }
  };

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const completedTaskCount = tasks.filter(
    (t) => t.status === "completed",
  ).length;
  const totalTaskCount = tasks.length;
  const taskProgress =
    totalTaskCount > 0 ? (completedTaskCount / totalTaskCount) * 100 : 0;

  const activeProjects = projects.filter(
    (p) => p.status !== "completed" && !isProjectDelayed(p),
  );
  const completedProjects = projects.filter((p) => p.status === "completed");
  const delayedProjects = projects.filter((p) => isProjectDelayed(p));
  const openIssuesCount =
    issues.length || complaints.filter((c) => c.status === "open").length;

  const filteredProjects =
    projectFilter === "active"
      ? activeProjects
      : projectFilter === "delayed"
        ? delayedProjects
        : projectFilter === "completed"
          ? completedProjects
          : projects;

  const SUMMARY = [
    {
      label: "My Projects",
      value: projects.length,
      icon: FolderOpen,
      color: "bg-blue-50 text-blue-600",
      isFilter: true,
      filterKey: "all",
      onClick: () => setProjectFilter("all"),
    },
    {
      label: "Active Projects",
      value: activeProjects.length,
      icon: ClipboardList,
      color: "bg-indigo-50 text-indigo-600",
      isFilter: true,
      filterKey: "active",
      onClick: () =>
        setProjectFilter((p) => (p === "active" ? "all" : "active")),
    },
    {
      label: "Delayed Projects",
      value: delayedProjects.length,
      icon: Clock,
      color: "bg-red-50 text-red-500",
      isFilter: true,
      filterKey: "delayed",
      onClick: () => setShowDelayedPanel(true),
    },
    {
      label: "Open Issues",
      value: openIssuesCount,
      icon: AlertTriangle,
      color: "bg-amber-50 text-amber-600",
      href: "/engineer/issue-log",
    },
  ];

  if (loading)
    return (
      <div className="flex items-center gap-2.5 py-12 px-6 text-gray-400 text-sm">
        <Loader2 size={18} className="animate-spin" /> Loading Engineer
        Dashboard...
      </div>
    );

  return (
    <div className="space-y-6">
      {showDelayedPanel && (
        <DelayedProjectsPanel
          projects={delayedProjects}
          onClose={() => setShowDelayedPanel(false)}
          onSelectProject={(p) => {
            setSelectedProject(p);
          }}
        />
      )}

      {selectedProject && (
        <ProjectDetail
          project={selectedProject}
          onBack={() => setSelectedProject(null)}
          onProjectUpdated={(updated) => {
            setProjects((prev) =>
              prev?.map((p) =>
                p._id === updated._id ? { ...p, ...updated } : p,
              ),
            );
            setSelectedProject((prev) => ({ ...prev, ...updated }));
          }}
        />
      )}

      {!selectedProject && (
        <>
          {/* Delayed alert banner */}
          {delayedProjects.length > 0 && (
            <div className="flex items-center gap-3 px-5 py-3.5 bg-red-50 border border-red-100 rounded-2xl flex-wrap">
              <AlertTriangle size={15} className="text-red-500 shrink-0" />
              <span className="text-sm font-semibold text-red-500 flex-1 min-w-[160px]">
                You have <strong>{delayedProjects.length}</strong> delayed
                project{delayedProjects.length > 1 ? "s" : ""} that need
                attention.
              </span>
              <button
                onClick={() => setShowDelayedPanel(true)}
                className="bg-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                View Delayed →
              </button>
            </div>
          )}

          {/* Header */}
          <div>
            <h2 className="text-lg font-bold text-extra-darkblue">
              Engineer Dashboard
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Good morning, {engineerName} · {today}
            </p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {SUMMARY?.map((s, i) => {
              const isActive = s.isFilter && projectFilter === s.filterKey;
              const inner = (
                <div
                  key={i}
                  onClick={() => {
                    if (s.onClick) s.onClick();
                    else if (s.isFilter)
                      setProjectFilter((p) =>
                        p === s.filterKey ? "all" : s.filterKey,
                      );
                  }}
                  className={`bg-white rounded-xl border shadow-sm p-5 flex items-start gap-4 transition-all duration-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] ${isActive ? "border-blue-300 ring-2 ring-blue-100" : "border-gray-100 hover:border-blue-200"}`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}
                  >
                    <s.icon size={18} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-extra-darkblue">
                      {s.value}
                    </p>
                    <p className="text-sm font-medium text-gray-700 mt-0.5">
                      {s.label}
                    </p>
                  </div>
                </div>
              );
              return s.href ? (
                <Link key={i} href={s.href} style={{ textDecoration: "none" }}>
                  {inner}
                </Link>
              ) : (
                <div key={i}>{inner}</div>
              );
            })}
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 items-start">
            {/* ── My Tasks ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-extra-darkblue flex items-center justify-center shrink-0">
                    <ClipboardList size={16} className="text-sky-200" />
                  </div>
                  <h3 className="text-sm font-bold text-extra-darkblue">
                    My Tasks
                  </h3>
                </div>
                <span className="text-xs font-bold text-gray-400 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full">
                  {tasksLoading
                    ? "…"
                    : `${completedTaskCount}/${totalTaskCount} done`}
                </span>
              </div>

              {/* Progress bar */}
              <div className="px-5 pt-4">
                <div className="bg-gray-100 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-extra-darkblue transition-all duration-700"
                    style={{ width: `${taskProgress}%` }}
                  />
                </div>
              </div>

              {/* Task list */}
              <div className="p-5 pt-3">
                {tasksLoading ? (
                  <div className="flex items-center gap-2 py-5 text-gray-400 text-xs justify-center">
                    <Loader2 size={14} className="animate-spin" /> Loading
                    tasks…
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-7 text-gray-400 text-sm">
                    <ClipboardList
                      size={28}
                      strokeWidth={1.5}
                      className="text-gray-200 mx-auto mb-2"
                    />
                    No tasks assigned to you yet.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {tasks?.map((t) => {
                      const done = t.status === "completed";
                      const pm = priorityMap[t.priority] || priorityMap.medium;
                      const toggling = togglingTaskId === t._id;
                      const isOverdue =
                        t.dueDate && new Date(t.dueDate) < new Date() && !done;
                      const projName =
                        t.project?.name || t.project?.projectId || null;

                      return (
                        <div
                          key={t._id}
                          onClick={() => !toggling && toggleTask(t)}
                          className={`flex items-start gap-3 p-3 rounded-xl border border-transparent hover:bg-blue-50 hover:translate-x-0.5 transition-all ${done ? "opacity-55" : ""}`}
                          style={{
                            cursor: toggling ? "wait" : "pointer",
                            opacity: toggling ? 0.6 : done ? 0.55 : 1,
                          }}
                        >
                          {/* Checkbox */}
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all"
                            style={{
                              background: done ? "#34C759" : "transparent",
                              border: `2px solid ${done ? "#34C759" : "#d4dff0"}`,
                              boxShadow: done
                                ? "0 2px 6px rgba(52,199,89,0.3)"
                                : "none",
                            }}
                          >
                            {toggling ? (
                              <Loader2
                                size={10}
                                color={done ? "#fff" : "#4988C4"}
                                className="animate-spin"
                              />
                            ) : done ? (
                              <span className="text-white text-xs font-bold leading-none">
                                ✓
                              </span>
                            ) : null}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-sm font-semibold text-extra-darkblue leading-snug ${done ? "line-through text-gray-400" : ""}`}
                            >
                              {t.title}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {projName && (
                                <span className="text-xs text-gray-400">
                                  {projName}
                                </span>
                              )}
                              {t.raisedBy?.name && (
                                <span className="text-xs text-blue-500 font-semibold flex items-center gap-1">
                                  <User size={9} /> {t.raisedBy.name}
                                </span>
                              )}
                              {t.dueDate && (
                                <span
                                  className={`text-xs flex items-center gap-1 ${isOverdue ? "text-red-500 font-bold" : "text-gray-400"}`}
                                >
                                  <Calendar size={9} />
                                  {new Date(t.dueDate).toLocaleDateString(
                                    "en-GB",
                                    { day: "2-digit", month: "short" },
                                  )}
                                  {isOverdue && " · Overdue"}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Priority badge */}
                          <span
                            className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0 mt-0.5 whitespace-nowrap"
                            style={{ background: pm.bg, color: pm.color }}
                          >
                            {t.priority
                              ? t.priority.charAt(0).toUpperCase() +
                                t.priority.slice(1)
                              : "Medium"}
                          </span>
                        </div>
                      );
                    })}

                    {/* All done banner */}
                    {totalTaskCount > 0 &&
                      completedTaskCount === totalTaskCount && (
                        <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
                          <CheckCircle2 size={14} className="text-green-500" />
                          <span className="text-xs font-bold text-green-700">
                            All tasks completed — great work! 🎉
                          </span>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-5">
              {/* Projects Overview */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-extra-darkblue flex items-center justify-center shrink-0">
                      <FolderOpen size={16} className="text-sky-200" />
                    </div>
                    <h3 className="text-sm font-bold text-extra-darkblue">
                      Projects Overview
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {projectFilter !== "all" && (
                      <button
                        onClick={() => setProjectFilter("all")}
                        className="text-xs font-bold text-blue-500 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors"
                      >
                        {projectFilter.charAt(0).toUpperCase() +
                          projectFilter.slice(1)}{" "}
                        · Clear ✕
                      </button>
                    )}
                    <a
                      href="/engineer/myProjects"
                      className="flex items-center gap-1 text-blue-500 text-xs font-bold bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors whitespace-nowrap no-underline"
                    >
                      view all <ChevronRight size={11} />
                    </a>
                  </div>
                </div>

                <div className="divide-y divide-gray-50">
                  {filteredProjects.slice(0, 4)?.map((p) => {
                    const delayed = isProjectDelayed(p);
                    return (
                      <div
                        key={p._id}
                        onClick={() => setSelectedProject(p)}
                        className={`px-5 py-3.5 cursor-pointer hover:translate-x-0.5 transition-all ${delayed ? "hover:bg-red-50" : "hover:bg-gray-50"}`}
                      >
                        <div className="flex justify-between items-start mb-2.5 gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-extra-darkblue">
                                {p.name}
                              </span>
                              {delayed && (
                                <span className="text-red-500 text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 border border-red-100 animate-pulse">
                                  DELAYED
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <MapPin size={10} /> {p.location || "Global"}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <StatusPill
                              label={p.status || "active"}
                              color={
                                statusColor[p.status || "active"] || "blue"
                              }
                            />
                            <ChevronRight
                              size={13}
                              className={
                                delayed ? "text-red-400" : "text-gray-300"
                              }
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="flex-1 rounded-full h-1"
                            style={{
                              background: delayed
                                ? "rgba(255,59,48,0.08)"
                                : "#eef2f8",
                            }}
                          >
                            <div
                              className="h-1 rounded-full transition-all duration-500"
                              style={{
                                width: `${p.progress || 0}%`,
                                background: delayed
                                  ? "#FF3B30"
                                  : (p.progress || 0) > 80
                                    ? "#34C759"
                                    : (p.progress || 0) > 50
                                      ? "#4988C4"
                                      : "#FF9500",
                              }}
                            />
                          </div>
                          <span
                            className={`text-xs font-bold min-w-[28px] ${delayed ? "text-red-500" : "text-gray-400"}`}
                          >
                            {p.progress || 0}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {filteredProjects.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-6">
                      {projectFilter === "delayed"
                        ? "🎉 No delayed projects — great work!"
                        : projectFilter === "completed"
                          ? "No completed projects yet."
                          : "No active projects assigned."}
                    </p>
                  )}
                  {filteredProjects.length > 4 && (
                    <p className="text-xs text-gray-400 text-center py-3">
                      +{filteredProjects.length - 4} more — use filter cards
                      above to explore
                    </p>
                  )}
                </div>
              </div>

              {/* Recent Complaints */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                   <div className="flex items-center gap-3">
                     <div className="w-9 h-9 rounded-xl bg-extra-darkblue flex items-center justify-center shrink-0">
                       <MessageSquare size={16} className="text-sky-200" />
                     </div>
                     <h3 className="text-sm font-bold text-extra-darkblue">Recent Complaints</h3>
                   </div>
                   <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-500 uppercase">
                     {complaints.length} Records
                   </span>
                </div>
                <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                   {complaints.length === 0 ? (
                     <p className="text-xs text-gray-400 text-center py-8">No complaints logged yet.</p>
                   ) : (
                     complaints.slice(0, 5).map(c => (
                       <div 
                         key={c._id} 
                         onClick={() => setViewComplaint(c)}
                         className="px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                       >
                         <div className="flex justify-between items-start mb-2 gap-2">
                           <div>
                             <p className="text-sm font-bold text-extra-darkblue leading-tight truncate max-w-[180px]">{c.title}</p>
                             <p className="text-[10px] text-gray-400 mt-0.5">{c.project?.name || "No Project"}</p>
                           </div>
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.priority === 'high' || c.priority === 'critical' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'} uppercase shrink-0`}>
                             {c.priority}
                           </span>
                         </div>
                          <ComplaintTracker 
                            currentStage={c.currentStage} 
                            status={c.status} 
                            stageHistory={c.stageHistory || []}
                            complaint={c}
                            compact 
                          />
                       </div>
                     ))
                   )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                  <div className="w-9 h-9 rounded-xl bg-extra-darkblue flex items-center justify-center shrink-0">
                    <CheckSquare size={16} className="text-sky-200" />
                  </div>
                  <h3 className="text-sm font-bold text-extra-darkblue">
                    Quick Actions
                  </h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {[
                    {
                      label: "Log an Issue",
                      href: "/engineer/issue-log",
                      color: "#FF9500",
                      colorCls:
                        "bg-amber-50 text-amber-600  hover:bg-amber-100",
                    },
                    {
                      label: "Upload QC Results",
                      href: "/engineer/qc-upload",
                      color: "#34C759",
                      colorCls:
                        "bg-green-50 text-green-600   hover:bg-green-100",
                    },
                    {
                      label: "Log a Complaint",
                      href: "/engineer/complaint-log",
                      color: "#4988C4",
                      colorCls:
                        "bg-blue-50  text-blue-600    hover:bg-blue-100",
                    },
                    {
                      label: "Upload Documents",
                      href: "/engineer/documents",
                      color: "#0F2854",
                      colorCls:
                        "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
                    },
                  ]?.map((a, i) => (
                    <Link
                      key={i}
                      href={a.href}
                      style={{ textDecoration: "none", display: "block" }}
                    >
                      <div
                        className={`flex items-center justify-between px-5 py-3.5 transition-all hover:translate-x-0.5 ${a.colorCls}`}
                      >
                        <span className="text-sm font-semibold">{a.label}</span>
                        <ChevronRight
                          size={14}
                          style={{ opacity: 0.6, flexShrink: 0 }}
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {viewComplaint && (
        <ComplaintDetailModal 
          complaint={viewComplaint} 
          onClose={() => setViewComplaint(null)} 
          onAdvance={handleAdvanceStage}
        />
      )}
    </div>
  );
}

function ComplaintDetailModal({ complaint, onClose, onAdvance }) {
  const canAdvance = STAGE_ADVANCE_ROLES[complaint.currentStage || "complaint_raised"]?.includes("engineer");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-extra-darkblue truncate pr-4">{complaint.title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          <ComplaintTracker 
            currentStage={complaint.currentStage} 
            stageHistory={complaint.stageHistory}
            complaint={complaint}
            onAdvance={onAdvance}
            canAdvance={canAdvance}
            compact
          />
          
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1.5 opacity-60">Description</p>
              <p className="text-sm text-extra-darkblue leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 italic">
                "{complaint.description}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50/30 p-3 rounded-xl border border-gray-100/50">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1 opacity-60">Project</p>
                <p className="text-sm font-bold text-extra-darkblue truncate">{complaint.project?.name || "Global / SiteWide"}</p>
                {complaint.project?.projectId && <p className="text-[10px] font-bold text-blue-600/70">#{complaint.project.projectId}</p>}
              </div>
              <div className="bg-gray-50/30 p-3 rounded-xl border border-gray-100/50">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1 opacity-60">Status</p>
                <div className="flex items-center gap-2 mt-0.5">
                   <div className={`w-2 h-2 rounded-full ${complaint.status === 'resolved' ? 'bg-green-500' : 'bg-blue-500'}`} />
                   <span className="text-sm font-bold text-extra-darkblue capitalize">{complaint.status}</span>
                </div>
              </div>
            </div>

            {/* Materials List */}
            {complaint.materials && complaint.materials.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-gray-100">
                 <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest opacity-60">Active Material List / BOM</p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {complaint.materials.map((m, idx) => (
                       <div key={idx} className="flex items-center gap-2.5 bg-amber-50/40 p-2 rounded-lg border border-amber-100/30">
                          <Package size={14} className="text-amber-500" />
                          <div className="min-w-0">
                             <p className="text-xs font-bold text-extra-darkblue truncate">{m.name}</p>
                             <p className="text-[10px] text-amber-600 font-bold">{m.qty} {m.unit}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
            )}

            {/* Media Gallery */}
            <div className="pt-4 border-t border-gray-100">
               <MediaGallery files={complaint.photos || (complaint.photo ? [complaint.photo] : [])} />
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-50 flex justify-end bg-gray-50/50">
           <button onClick={onClose} className="px-8 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all hover:translate-x-0.5">
             Close
           </button>
        </div>
      </div>
    </div>
  );
}
