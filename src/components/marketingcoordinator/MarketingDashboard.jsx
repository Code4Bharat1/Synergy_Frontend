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
import ComplaintTracker, {
  STAGE_ADVANCE_ROLES,
} from "../common/ComplaintTracker";
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
    try {
      setLoading(true);

      const res = await api.get("/installation-requests/list");

      console.log("INSTALL API RESPONSE:", res.data); // 🔍 DEBUG

      // ✅ HANDLE ALL CASES
      let list = [];

      if (Array.isArray(res.data)) {
        list = res.data;
      } else if (Array.isArray(res.data?.data)) {
        list = res.data.data;
      } else if (Array.isArray(res.data?.requests)) {
        list = res.data.requests;
      }

      setData(list);
    } catch (err) {
      console.error("Install Req Error:", err);
      setData([]);
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
function useInstallationRequests() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/installation-requests/list");
      setData(Array.isArray(res.data) ? res.data : (res.data.data ?? []));
    } catch (err) {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MarketingDashboard() {
  const docs = useDocuments();
  const projects = useProjects();
  const installationRequests = useInstallationRequests();

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

      if (stageData.stageNotes)
        formData.append("stageNotes", stageData.stageNotes);
      if (stageData.materials)
        formData.append("materials", JSON.stringify(stageData.materials));
      if (stageData.files) {
        stageData.files.forEach((f) => formData.append("photos", f));
      }

      await api.put(`/complaints/${viewComplaint._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
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
      label: "Installation Requests",
      value: installationRequests.data.length,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      icon: Send,
      loading: installationRequests.loading,
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
  {/* ── Overdue Alert Banner ───────────────────────────── */}
  {overdueDoc && !dismissed && (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 shadow-sm">
      <AlertCircle size={16} className="text-red-500 shrink-0" />

      <p className="text-sm text-gray-800 flex-1">
        <span className="font-semibold text-red-600">Overdue:</span>{" "}
        {overdueDoc.type} for {overdueDoc.project}
      </p>

      <div className="flex items-center gap-2">
        <Link href="/marketing/documents">
          <span className="text-sm font-medium text-white bg-red-500 px-3 py-1.5 rounded-md cursor-pointer hover:bg-red-600 shadow-sm transition">
            Upload
          </span>
        </Link>

        <button
          onClick={() => setDismissed(true)}
          className="text-sm text-red-500 px-3 py-1.5 rounded-md border border-red-200 hover:bg-red-100 transition"
        >
          Dismiss
        </button>
      </div>
    </div>
  )}

  {/* ── Header ─────────────────────────────────────────── */}
  <div className="mb-8">
    <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
      Marketing Coordinator
    </p>

    <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mt-1">
      Good morning, {coordName.split(" ")[0]}
    </h1>

    <p className="text-sm text-gray-500 mt-1">{today}</p>
  </div>

  {/* ── Summary Cards ──────────────────────────────────── */}
  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
    {SUMMARY?.map((s, i) => (
      <div
        key={i}
        className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-gray-500 uppercase">
            {s.label}
          </p>

          <div className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100">
            <s.icon size={14} className="text-gray-600" />
          </div>
        </div>

        {s.loading ? (
          <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-semibold text-gray-900">
            {s.value}
          </p>
        )}
      </div>
    ))}
  </div>

  {/* ── Recent Complaints ──────────────────────────────── */}
  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">
          Recent Complaints
        </h2>
        <p className="text-xs text-gray-500">
          Track resolution progress
        </p>
      </div>

      <Link href="/marketingCoordinator/complaint-log">
        <span className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
          View all →
        </span>
      </Link>
    </div>

    <div className="divide-y divide-gray-100 max-h-[420px] overflow-y-auto">
      {complaintsLoading ? (
        <p className="text-sm text-gray-500 text-center py-8">
          Loading complaints...
        </p>
      ) : complaints.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          No complaints logged yet.
        </p>
      ) : (
        complaints.map((c) => (
          <div
            key={c._id}
            onClick={() => setViewComplaint(c)}
            className="py-4 px-2 -mx-2 rounded-lg cursor-pointer hover:bg-gray-50 transition"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {c.title}
                </p>
                <p className="text-xs text-gray-500">
                  {c.project?.name || "No Project"}
                </p>
              </div>

              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  c.priority === "high" || c.priority === "critical"
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {c.priority}
              </span>
            </div>

            <ComplaintTracker
              currentStage={c.currentStage}
              status={c.status}
              compact
            />
          </div>
        ))
      )}
    </div>
  </div>

  {/* ── Modal ─────────────────────────────────────────── */}
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
  const canAdvance = STAGE_ADVANCE_ROLES[
    complaint.currentStage || "complaint_raised"
  ]?.includes("marketingCoordinator");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-brand-darkest truncate">
            {complaint.title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-brand-bg rounded-lg text-brand-mid transition-colors"
          >
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
              <p className="text-[10px] font-extrabold text-brand-mid uppercase tracking-widest mb-1.5">
                Description
              </p>
              <div className="text-sm text-brand-darkest leading-relaxed bg-brand-bg/40 p-4 rounded-xl border border-brand-mid/10">
                {complaint.description}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-brand-bg/30 p-3 rounded-xl border border-brand-mid/10">
                <p className="text-[10px] font-extrabold text-brand-mid uppercase mb-1">
                  Project
                </p>
                <p className="text-sm font-bold text-brand-darkest truncate">
                  {complaint.project?.name || "General"}
                </p>
                {complaint.project?.projectId && (
                  <p className="text-[9px] font-bold text-brand-mid">
                    #{complaint.project.projectId}
                  </p>
                )}
              </div>
              <div className="bg-brand-bg/30 p-3 rounded-xl border border-brand-mid/10">
                <p className="text-[10px] font-extrabold text-brand-mid uppercase mb-1">
                  Status
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div
                    className={`w-2 h-2 rounded-full ${complaint.status === "resolved" ? "bg-emerald-500" : "bg-brand-mid"}`}
                  />
                  <span className="text-sm font-bold text-brand-darkest capitalize">
                    {complaint.status}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-brand-mid uppercase tracking-widest mb-1.5">
                  Project
                </p>
                <p className="text-sm font-bold text-brand-darkest">
                  {complaint.project?.name || "General"}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-brand-bg flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-2.5 rounded-xl text-sm font-bold text-brand-mid shadow-sm hover:bg-brand-bg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
