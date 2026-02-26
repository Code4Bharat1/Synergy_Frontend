"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Copy, FileText, Send, AlertCircle,
  Clock, CheckCircle, ChevronRight, Bell, TrendingUp,
  User,
  Package,
  Calendar,
  Calendar1,
} from "lucide-react";
import {
  COORDINATOR, PENDING_REPLICATIONS, PENDING_DOCUMENTS,
} from "./shared";

const SUMMARY = [
  { label: "Pending Replications", value: 3,  color: "text-brand-mid",   bg: "bg-brand-mid/10",    border: "border-brand-mid/20",   icon: Copy         },
  { label: "Docs to Upload",       value: 4,  color: "text-orange-500",  bg: "bg-orange-500/10",   border: "border-orange-500/20",  icon: FileText     },
  { label: "Requests Sent",        value: 7,  color: "text-emerald-500", bg: "bg-emerald-500/10",  border: "border-emerald-500/20", icon: Send         },
  { label: "Overdue Items",        value: 2,  color: "text-red-500",     bg: "bg-red-500/10",      border: "border-red-500/20",     icon: AlertCircle  },
];

const statusStyle = {
  "Pending":   { dot: "bg-orange-400",  text: "text-orange-500",  bg: "bg-orange-500/10",  border: "border-orange-500/25"  },
  "In Review": { dot: "bg-brand-mid",   text: "text-brand-mid",   bg: "bg-brand-mid/10",   border: "border-brand-mid/25"   },
  "Approved":  { dot: "bg-emerald-400", text: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
};

const today = new Date().toLocaleDateString("en-GB", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
});

export default function MarketingDashboard() {
  const [dismissed, setDismissed] = useState(false);
  const overdueDoc = PENDING_DOCUMENTS.find(d => d.due === "Overdue");

  return (
    <div className="animate-fadeUp">
      {/* ── Overdue Alert Banner ─────────────────────────────────────────── */}
      {overdueDoc && !dismissed && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-red-400/30 bg-red-500/8 px-4 py-3">
          <AlertCircle size={16} className="shrink-0 text-red-500" />
          <span className="flex-1 text-[13px] font-semibold text-brand-darkest min-w-[180px]">
            ⚠ Overdue: <strong>{overdueDoc.type}</strong> for {overdueDoc.project} — upload immediately
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

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="mb-7">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[2px] text-brand-mid">
          Marketing Coordinator
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-darkest">
          Good morning, {COORDINATOR.name.split(" ")[0]} 
        </h1>
        <p className="mt-1 text-[13px] text-brand-mid">{today}</p>
      </div>

      {/* ── Summary Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {SUMMARY.map((s, i) => (
          <div key={i} className={`rounded-2xl  p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-default`}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-brand-mid leading-tight">
                {s.label}
              </span>
              <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon size={14} className={s.color} />
              </div>
            </div>
            <div className={`font-display text-3xl sm:text-4xl font-extrabold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Main Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">

        {/* ── Pending Replications ──────────────────────────────────────── */}
        <div className="rounded-2xl  bg-white shadow-sm p-5 sm:p-6">
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
  {PENDING_REPLICATIONS.map(r => {
    const s = statusStyle[r.status] || statusStyle["Pending"];
    return (
      <div key={r.id} className="rounded-xl bg-brand-bg/50 p-3.5">
        <div className="flex items-start justify-between gap-3 mb-2.5 flex-wrap">
          <div>
            <span className="text-[11px] font-bold text-brand-dark">
              {r.id}
            </span>
            <div className="text-brand-darkest text-[13px] font-bold mt-0.5">
              {r.project}
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border ${s.bg} ${s.border} px-2.5 py-0.5 text-[11px] font-bold ${s.text} whitespace-nowrap`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {r.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-brand-mid">
          <span className="flex items-center gap-1">
            <User size={12} className="shrink-0" />
            {r.incharge}
          </span>

          <span className="flex items-center gap-1">
            <Package size={12} className="shrink-0" />
            {r.items} items
          </span>

          <span className="flex items-center gap-1">
            <Calendar1 size={12} className="shrink-0" />
            Due: {r.due}
          </span>
        </div>
      </div>
    );
  })}
</div>
        </div>

        {/* ── Right Column ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">

          {/* Pending Documents */}
          <div className="rounded-2xl  bg-white shadow-sm p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-brand-darkest to-brand-dark flex items-center justify-center shrink-0">
                <FileText size={14} className="text-brand-light" />
              </div>
              <div>
                <div className="text-brand-darkest font-bold text-[14px] font-display">Pending Documents</div>
                <div className="text-brand-mid text-[11px]">Awaiting your upload</div>
              </div>
            </div>

            <div className="space-y-2.5">
              {PENDING_DOCUMENTS.map(doc => (
                <div key={doc.id} className={[
                  "flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5",
                  doc.urgent
                    ? "bg-red-500/5 border border-red-400/20"
                    : "bg-brand-bg/50 border border-brand-mid/10",
                ].join(" ")}>
                  <div className="min-w-0">
                    <div className="text-brand-darkest text-[12px] font-bold truncate">{doc.type}</div>
                    <div className="text-brand-mid text-[10px] truncate">{doc.project}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={[
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      doc.due === "Overdue"
                        ? "bg-red-500/12 text-red-500"
                        : doc.due === "Today"
                        ? "bg-orange-500/12 text-orange-500"
                        : "bg-brand-mid/12 text-brand-mid",
                    ].join(" ")}>{doc.due}</span>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/marketing/documents">
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
              <div className="text-brand-darkest font-bold text-[14px] font-display">Quick Actions</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              {[
                { label: "New Project Replication", href: "/marketing-coordinator/project-replication", color: "text-brand-dark",  bg: "bg-brand-dark/8",   border: "border-brand-dark/15",  icon: Copy     },
                { label: "Upload Documents",         href: "/marketing-coordinator/documents",            color: "text-orange-500", bg: "bg-orange-500/8",   border: "border-orange-500/15",  icon: FileText },
                { label: "Send Install Request",     href: "/marketing-coordinator/installation-request", color: "text-emerald-500",bg: "bg-emerald-500/8",  border: "border-emerald-500/15", icon: Send     },
              ].map((a, i) => (
                <Link key={i} href={a.href}>
                  <div className={`flex items-center justify-between rounded-xl border ${a.border} ${a.bg} px-3.5 py-2.5 cursor-pointer hover:brightness-95 transition-all`}>
                    <div className="flex items-center gap-2.5">
                      <a.icon size={13} className={a.color} />
                      <span className={`text-[12px] font-semibold ${a.color}`}>{a.label}</span>
                    </div>
                    <ChevronRight size={12} className={a.color} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}