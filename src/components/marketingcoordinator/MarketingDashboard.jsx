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
} from "lucide-react";

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

  useEffect(() => {
    setCoordName(getCoordinatorName());
  }, []);

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
        {/* ── Pending Replications (hardcoded) ────────────────────────────── */}
        {/* <div className="rounded-2xl bg-white shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-brand-darkest to-brand-dark flex items-center justify-center shrink-0">
                <Copy size={14} className="text-brand-light" />
              </div>
              <div>
                <div className="text-brand-darkest font-bold text-[14px] font-display">Pending Replications</div>
                <div className="text-brand-mid text-[11px]">Projects awaiting replication</div>
              </div>
            </div>
            <Link href="/marketing/project-replication">
              <span className="text-[11px] font-bold text-brand-mid hover:text-brand-dark transition-colors cursor-pointer">
                + New Replication
              </span>
            </Link>
          </div>

          <div className="space-y-3">
            {PENDING_REPLICATIONS?.map(r => {
              const s = statusStyle[r.status] || statusStyle["Pending"];
              return (
                <div key={r.id} className="rounded-xl bg-brand-bg/50 p-3.5">
                  <div className="flex items-start justify-between gap-3 mb-2.5 flex-wrap">
                    <div>
                      <span className="text-[11px] font-bold text-brand-dark">{r.id}</span>
                      <div className="text-brand-darkest text-[13px] font-bold mt-0.5">{r.project}</div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border ${s.bg} ${s.border} px-2.5 py-0.5 text-[11px] font-bold ${s.text} whitespace-nowrap`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {r.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-brand-mid">
                    <span className="flex items-center gap-1"><User size={12} className="shrink-0" />{r.incharge}</span>
                    <span className="flex items-center gap-1"><Package size={12} className="shrink-0" />{r.items} items</span>
                    <span className="flex items-center gap-1"><Calendar1 size={12} className="shrink-0" />Due: {r.due}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div> */}

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
    </div>
  );
}
