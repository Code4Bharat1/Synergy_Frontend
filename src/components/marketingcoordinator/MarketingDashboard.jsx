"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import {
  Copy,
  FileText,
  Send,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  User,
  Package,
  Calendar1,
  CheckCircle,
  MessageSquare,
  X,
} from "lucide-react";
import ComplaintTracker, { STAGE_ADVANCE_ROLES } from "../common/ComplaintTracker";
import MediaGallery from "../common/MediaGallery";

// ── API setup (same pattern as your Service Team Dashboard) ───────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Hardcoded replications (no model yet) ─────────────────────────────────────
const PENDING_REPLICATIONS = [
  {
    id: "REP-001",
    project: "Al Barsha Mall Signage",
    status: "Pending",
    incharge: "Ahmed Karimi",
    items: 8,
    due: "10 Mar 2025",
  },
  {
    id: "REP-002",
    project: "Downtown Billboard",
    status: "In Review",
    incharge: "Sara Malik",
    items: 3,
    due: "14 Mar 2025",
  },
  {
    id: "REP-003",
    project: "JBR Promenade Wrap",
    status: "Approved",
    incharge: "Tom Reeves",
    items: 12,
    due: "18 Mar 2025",
  },
];

// ── Status styles ─────────────────────────────────────────────────────────────
const statusStyle = {
  Pending: {
    dot: "bg-orange-400",
    text: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/25",
  },
  "In Review": {
    dot: "bg-brand-mid",
    text: "text-brand-mid",
    bg: "bg-brand-mid/10",
    border: "border-brand-mid/25",
  },
  Approved: {
    dot: "bg-emerald-400",
    text: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getDueLabel(createdAt) {
  if (!createdAt) return "—";
  const diffDays = Math.floor((Date.now() - new Date(createdAt)) / 86400000);
  if (diffDays > 7) return "Overdue";
  if (diffDays === 0) return "Today";
  if (diffDays <= 3) return "This Week";
  return new Date(createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDocType(type) {
  return (
    {
      qc: "QC Report",
      installation: "Installation Report",
      reference: "Reference Document",
      "daily-report": "Daily Report",
      "trail-qc": "Trial QC",
      other: "Other Document",
    }[type] ?? type
  );
}

function getCoordinatorName() {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return "Coordinator";
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.name || payload.email || "Coordinator";
  } catch {
    return "Coordinator";
  }
}

const today = new Date().toLocaleDateString("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

// ── Custom hooks ──────────────────────────────────────────────────────────────
function useDocuments() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/documents", {
        params: { status: "pending" },
      });
      const raw = Array.isArray(res.data) ? res.data : (res.data.data ?? []);
      setData(
        raw?.map((doc) => {
          const due = getDueLabel(doc.createdAt);
          return {
            id: doc._id,
            type: formatDocType(doc.documentType),
            project: doc.project?.name ?? "Unknown Project",
            due,
            urgent: due === "Overdue" || due === "Today",
          };
        }),
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  return { data, loading, error, refetch: load };
}

function useProjects() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/projects");
      setData(Array.isArray(res.data) ? res.data : (res.data.data ?? []));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  return { data, loading, error, refetch: load };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MarketingDashboard() {
  const docs = useDocuments();
  const projects = useProjects();

  const [dismissed, setDismissed] = useState(false);
  const [coordName, setCoordName] = useState("Coordinator");
  const [complaints, setComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(true);
  const [viewComplaint, setViewComplaint] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchComplaints = useCallback(async () => {
    try {
      setComplaintsLoading(true);
      const res = await api.get("/complaints");
      const data = Array.isArray(res.data) ? res.data : (res.data.data ?? []);
      setComplaints(data.slice(0, 5));
    } catch {
      setComplaints([]);
    } finally {
      setComplaintsLoading(false);
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

      await api.put(`/complaints/${viewComplaint._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setViewComplaint(null);
      fetchComplaints();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    setCoordName(getCoordinatorName());
    fetchComplaints();
  }, [fetchComplaints]);

  const overdueCount = docs.data.filter((d) => d.due === "Overdue").length;
  const overdueDoc = docs.data.find((d) => d.due === "Overdue");

  const SUMMARY = [
    // { label: "Pending Replications", value: PENDING_REPLICATIONS.length, color: "text-brand-mid",   bg: "bg-brand-mid/10",   icon: Copy        },
    {
      label: "Docs to Upload",
      value: docs.data.length,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      icon: FileText,
      loading: docs.loading,
    },
    {
      label: "Total Projects",
      value: projects.data.length,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      icon: Send,
      loading: projects.loading,
    },
    {
      label: "Overdue Items",
      value: overdueCount,
      color: "text-red-500",
      bg: "bg-red-500/10",
      icon: AlertCircle,
      loading: docs.loading,
    },
  ];

  return (
    <div className="animate-fadeUp">
      {/* ── Overdue Alert Banner ──────────────────────────────────────────── */}
      {overdueDoc && !dismissed && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-red-400/30 bg-red-500/8 px-4 py-3">
          <AlertCircle size={16} className="shrink-0 text-red-500" />
          <span className="flex-1 text-[13px] font-semibold text-brand-darkest min-w-[180px]">
            ⚠ Overdue: <strong>{overdueDoc.type}</strong> for{" "}
            {overdueDoc.project} — upload immediately
          </span>
          <div className="flex gap-2 ml-auto">
            <Link href="/marketing/documents">
              <span className="block rounded-lg bg-red-500 px-3.5 py-1.5 text-[11px] font-bold text-white cursor-pointer whitespace-nowrap hover:bg-red-600 transition-colors">
                Upload Now →
              </span>
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="rounded-lg border border-red-400/30 px-3 py-1.5 text-[11px] font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="mb-7">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[2px] text-brand-mid">
          Marketing Coordinator
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-darkest">
          Good morning, {coordName.split(" ")[0]}
        </h1>
        <p className="mt-1 text-[13px] text-brand-mid">{today}</p>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {SUMMARY?.map((s, i) => (
          <div
            key={i}
            className="rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-default"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-brand-mid leading-tight">
                {s.label}
              </span>
              <div
                className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}
              >
                <s.icon size={14} className={s.color} />
              </div>
            </div>
            {s.loading ? (
              <div className="h-9 w-12 rounded-lg animate-pulse bg-brand-mid/15 mt-1" />
            ) : (
              <div
                className={`font-display text-3xl sm:text-4xl font-extrabold ${s.color}`}
              >
                {s.value}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Main Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
        {/* Recent Complaints */}
        <div className="rounded-2xl bg-white shadow-sm p-5 sm:p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-brand-darkest to-brand-dark flex items-center justify-center shrink-0">
                <MessageSquare size={14} className="text-brand-light" />
              </div>
              <div>
                <div className="text-brand-darkest font-bold text-[14px] font-display">Recent Complaints</div>
                <div className="text-brand-mid text-[11px]">Track resolution progress</div>
              </div>
            </div>
            <Link href="/marketingCoordinator/complaint-log">
               <span className="text-[11px] font-bold text-brand-mid hover:text-brand-dark transition-colors cursor-pointer">
                 View Log →
               </span>
            </Link>
          </div>

          <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto pr-1">
             {complaintsLoading ? (
                <p className="text-xs text-brand-mid text-center py-8">Loading complaints...</p>
             ) : complaints.length === 0 ? (
                <p className="text-xs text-brand-mid text-center py-8">No complaints logged yet.</p>
             ) : (
                complaints.map(c => (
                  <div 
                    key={c._id} 
                    onClick={() => setViewComplaint(c)}
                    className="py-4 cursor-pointer hover:bg-brand-bg/30 transition-colors first:pt-0"
                  >
                    <div className="flex justify-between items-start mb-2.5 gap-2">
                       <div>
                         <p className="text-[13px] font-bold text-brand-darkest leading-tight">{c.title}</p>
                         <p className="text-[10px] text-brand-mid mt-0.5">{c.project?.name || "No Project"}</p>
                       </div>
                       <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${c.priority === 'high' || c.priority === 'critical' ? 'bg-red-50 text-red-500' : 'bg-brand-mid/10 text-brand-mid'} uppercase shrink-0`}>
                         {c.priority}
                       </span>
                    </div>
                    <ComplaintTracker currentStage={c.currentStage} status={c.status} compact />
                  </div>
                ))
             )}
          </div>
        </div>

        {/* ── Right Column ──────────────────────────────────────────────────── */}
        {/* <div className="flex flex-col gap-5"> */}

        {/* Pending Documents */}
        <div className="rounded-2xl bg-white shadow-sm p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-brand-darkest to-brand-dark flex items-center justify-center shrink-0">
              <FileText size={14} className="text-brand-light" />
            </div>
            <div>
              <div className="text-brand-darkest font-bold text-[14px] font-display">
                Pending Documents
              </div>
              <div className="text-brand-mid text-[11px]">
                Awaiting your upload
              </div>
            </div>
          </div>

          {/* Loading */}
          {docs.loading && (
            <div className="space-y-2.5">
              {[1, 2, 3]?.map((i) => (
                <div
                  key={i}
                  className="rounded-xl bg-brand-bg/50 px-3.5 py-2.5 flex items-center justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="h-3 w-32 rounded animate-pulse bg-brand-mid/20" />
                    <div className="h-2.5 w-20 rounded animate-pulse bg-brand-mid/10" />
                  </div>
                  <div className="h-5 w-14 rounded-full animate-pulse bg-brand-mid/15" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {docs.error && !docs.loading && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/5 border border-red-400/20 px-3.5 py-2.5">
              <AlertCircle size={13} className="text-red-500 shrink-0" />
              <span className="text-[11px] text-red-500 font-medium">
                {docs.error}
              </span>
              <button
                onClick={docs.refetch}
                className="ml-auto text-[11px] font-bold text-red-500 underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty */}
          {!docs.loading && !docs.error && docs.data.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <CheckCircle size={22} className="text-emerald-400" />
              <p className="text-[12px] text-brand-mid font-medium">
                All documents are up to date
              </p>
            </div>
          )}

          {/* List */}
          {!docs.loading && !docs.error && docs.data.length > 0 && (
            <div className="space-y-2.5">
              {docs.data?.map((doc) => (
                <div
                  key={doc.id}
                  className={[
                    "flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5",
                    doc.urgent
                      ? "bg-red-500/5 border border-red-400/20"
                      : "bg-brand-bg/50 border border-brand-mid/10",
                  ].join(" ")}
                >
                  <div className="min-w-0">
                    <div className="text-brand-darkest text-[12px] font-bold truncate">
                      {doc.type}
                    </div>
                    <div className="text-brand-mid text-[10px] truncate">
                      {doc.project}
                    </div>
                  </div>
                  <span
                    className={[
                      "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                      doc.due === "Overdue"
                        ? "bg-red-500/12 text-red-500"
                        : doc.due === "Today"
                          ? "bg-orange-500/12 text-orange-500"
                          : "bg-brand-mid/12 text-brand-mid",
                    ].join(" ")}
                  >
                    {doc.due}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Link href="/marketingCoordinator/documents">
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-bold text-brand-mid hover:bg-brand-mid/6 transition-colors cursor-pointer">
              <FileText size={12} /> Upload Documents
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl bg-white shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-brand-darkest to-brand-dark flex items-center justify-center shrink-0">
              <TrendingUp size={14} className="text-brand-light" />
            </div>
            <div className="text-brand-darkest font-bold text-[14px] font-display">
              Quick Actions
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
            {[
              // { label: "New Project Replication", href: "/marketing-Coordinator/project-replication", color: "text-brand-dark",   bg: "bg-brand-dark/8",  border: "border-brand-dark/15",  icon: Copy     },
              {
                label: "Upload Documents",
                href: "/marketingCoordinator/documents",
                color: "text-orange-500",
                bg: "bg-orange-500/8",
                border: "border-orange-500/15",
                icon: FileText,
              },
              {
                label: "Send Install Request",
                href: "/marketingCoordinator/installation-request",
                color: "text-emerald-500",
                bg: "bg-emerald-500/8",
                border: "border-emerald-500/15",
                icon: Send,
              },
            ]?.map((a, i) => (
              <Link key={i} href={a.href}>
                <div
                  className={`flex items-center justify-between rounded-xl border ${a.border} ${a.bg} px-3.5 py-2.5 cursor-pointer hover:brightness-95 transition-all`}
                >
                  <div className="flex items-center gap-2.5">
                    <a.icon size={13} className={a.color} />
                    <span className={`text-[12px] font-semibold ${a.color}`}>
                      {a.label}
                    </span>
                  </div>
                  <ChevronRight size={12} className={a.color} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* </div> */}
      </div>
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
  const canAdvance = STAGE_ADVANCE_ROLES[complaint.currentStage || "complaint_raised"]?.includes("marketingCoordinator");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-brand-darkest truncate">{complaint.title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-brand-bg rounded-lg text-brand-mid transition-colors">
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
              <p className="text-[10px] font-extrabold text-brand-mid uppercase tracking-widest mb-1.5">Description</p>
              <div className="text-sm text-brand-darkest leading-relaxed bg-brand-bg/40 p-4 rounded-xl border border-brand-mid/10">
                {complaint.description}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-brand-bg/30 p-3 rounded-xl border border-brand-mid/10">
                <p className="text-[10px] font-extrabold text-brand-mid uppercase mb-1">Project</p>
                <p className="text-sm font-bold text-brand-darkest truncate">{complaint.project?.name || "General"}</p>
                {complaint.project?.projectId && <p className="text-[9px] font-bold text-brand-mid">#{complaint.project.projectId}</p>}
              </div>
              <div className="bg-brand-bg/30 p-3 rounded-xl border border-brand-mid/10">
                <p className="text-[10px] font-extrabold text-brand-mid uppercase mb-1">Status</p>
                <div className="flex items-center gap-2 mt-0.5">
                   <div className={`w-2 h-2 rounded-full ${complaint.status === 'resolved' ? 'bg-emerald-500' : 'bg-brand-mid'}`} />
                   <span className="text-sm font-bold text-brand-darkest capitalize">{complaint.status}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-brand-mid uppercase tracking-widest mb-1.5">Project</p>
                <p className="text-sm font-bold text-brand-darkest">{complaint.project?.name || "General"}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-brand-bg flex justify-end">
           <button onClick={onClose} className="px-8 py-2.5 rounded-xl text-sm font-bold text-brand-mid shadow-sm hover:bg-brand-bg transition-all">
             Close
           </button>
        </div>
      </div>
    </div>
  );
}
