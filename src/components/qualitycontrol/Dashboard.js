"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  FileText,
  Loader2,
} from "lucide-react";
import axiosInstance from "@/lib/axios";

const PRIORITY_STYLES = {
  High: "bg-red-50 text-red-600",
  Medium: "bg-amber-50 text-amber-600",
  Low: "bg-green-50 text-green-600",
};

const PRIORITY_DOT = {
  High: "bg-red-500",
  Medium: "bg-amber-500",
  Low: "bg-green-500",
};

function priorityFromStatus(status) {
  return (
    {
      initiated: "Low",
      "in-progress": "High",
      installation: "High",
      testing: "Medium",
      completed: "Low",
      "on-hold": "Medium",
    }[status] || "Medium"
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function PriorityBadge({ priority }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_STYLES[priority]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[priority]}`} />
      {priority}
    </span>
  );
}

// ── Clickable Stat Card ───────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  colorClass,
  loading,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3 shadow-sm
        cursor-pointer transition-all duration-200
        hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 active:scale-[0.98]"
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-blue-950">
          {loading ? (
            <Loader2 size={20} className="animate-spin text-gray-300 mt-1" />
          ) : (
            value
          )}
        </p>
        <p className="text-sm font-medium text-gray-700 mt-0.5 leading-tight">
          {label}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function InspectionCard({ row }) {
  const priority = priorityFromStatus(row.status);
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-mono font-bold text-blue-500">
          {row._id.slice(-6).toUpperCase()}
        </span>
        <PriorityBadge priority={priority} />
      </div>
      <p className="text-sm font-semibold text-blue-950 leading-snug">
        <span className="text-blue-500 mr-1.5">
          {row.project?.projectId || row.project?._id?.slice(-6).toUpperCase()}
        </span>
        {row.project?.name || row.name}
      </p>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
        <span>{row.clientName}</span>
        <span>{row.location || "—"}</span>
      </div>
    </div>
  );
}

export default function QCDashboard() {
  const router = useRouter();
  const [qcReports, setQcReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get("/reports/view-qc")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data.data ?? []);
        setQcReports(data);
      })
      .catch(() => setQcReports([]))
      .finally(() => setLoading(false));
  }, []);

  // Derived stats
  const total = qcReports.length;
  const approved = qcReports.filter((r) => r.status === "Approved").length;
  const rejected = qcReports.filter((r) => r.status === "Rejected").length;
  const pending = qcReports.filter(
    (r) => !r.status || r.status === "Pending",
  ).length;
  const needsReview = qcReports.filter(
    (r) =>
      Array.isArray(r.qcChecks) && r.qcChecks.some((c) => c.state === null),
  );

  const recentReports = [...qcReports]
    .sort(
      (a, b) =>
        new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt),
    )
    .slice(0, 5);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // ── All cards navigate to Trial Approval page ─────────────────────────────
  const goToTrialApproval = () => router.push("/qualityControl/trial-approval");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-blue-950">QC Dashboard</h2>
        <p className="text-sm text-gray-400 mt-0.5">{today}</p>
      </div>

      {/* ── Clickable Stat Cards — all go to Trial Approval ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total QC Reports"
          value={total}
          sub="All time"
          icon={ClipboardList}
          colorClass="bg-blue-50 text-blue-500"
          loading={loading}
          onClick={goToTrialApproval}
        />
        <StatCard
          label="Needs Re-review"
          value={needsReview.length}
          sub="Pending items"
          icon={Clock}
          colorClass="bg-amber-50 text-amber-500"
          loading={loading}
          onClick={goToTrialApproval}
        />
        <StatCard
          label="Approved"
          value={approved}
          sub="Signed off"
          icon={CheckCircle2}
          colorClass="bg-green-50 text-green-600"
          loading={loading}
          onClick={goToTrialApproval}
        />
        <StatCard
          label="Rejected / Flagged"
          value={rejected}
          sub="Needs rework"
          icon={XCircle}
          colorClass="bg-red-50 text-red-500"
          loading={loading}
          onClick={goToTrialApproval}
        />
      </div>

      {/* Needs Re-review */}
      {needsReview.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-4 border-b border-amber-100 bg-amber-50/40">
            <h3 className="text-sm font-bold text-blue-950">
              ⏳ Needs Re-review
            </h3>
            <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full">
              {needsReview.length} report{needsReview.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {needsReview?.map((r) => {
              const pendingCount = r.qcChecks.filter(
                (c) => c.state === null,
              ).length;
              const passedCount = r.qcChecks.filter(
                (c) => c.state === true,
              ).length;
              const project = r.project;
              return (
                <div
                  key={r._id}
                  className="flex items-start gap-3 px-4 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                    <ClipboardList size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-blue-950 leading-snug">
                      {typeof project === "object" ? (
                        <>
                          <span className="text-blue-600 mr-2 font-bold whitespace-nowrap">
                            {project?.projectId || project?._id?.slice(-6).toUpperCase()}
                          </span>
                          <span className="text-blue-950">{project?.name}</span>
                        </>
                      ) : (
                        `Report ${r._id.slice(-6).toUpperCase()}`
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {passedCount} passed · {pendingCount} pending ·{" "}
                      {formatDate(r.date || r.createdAt)}
                    </p>
                  </div>
                  <a
                    href="/quality-control/inspection"
                    className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full shrink-0 hover:bg-blue-100 transition-colors"
                  >
                    Review
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent QC Reports */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-blue-950">Recent QC Reports</h3>
          <a
            href="/qualityControl/inspection"
            className="flex items-center gap-1 text-xs font-semibold text-blue-500 hover:underline"
          >
            New Inspection <ArrowRight size={12} />
          </a>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={22} className="animate-spin text-gray-300" />
          </div>
        ) : recentReports.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">
            No QC reports yet
          </div>
        ) : (
          <>
            {/* Mobile */}
            <div className="md:hidden p-3 space-y-3">
              {recentReports?.map((r) => {
                const project = r.project;
                return (
                  <div
                    key={r._id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-blue-500">
                        {r._id.slice(-6).toUpperCase()}
                      </span>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-sm font-semibold text-blue-950 leading-snug">
                      {typeof project === "object" ? (
                        <>
                          <span className="text-blue-500 mr-2 font-bold whitespace-nowrap">
                            {project?.projectId || project?._id?.slice(-6).toUpperCase()}
                          </span>
                          <span className="text-blue-950">{project?.name}</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(r.date || r.createdAt)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Desktop */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {[
                      "Report ID",
                      "Project",
                      "Submitted By",
                      "Date",
                      "Checks",
                      "Status",
                    ]?.map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentReports?.map((r) => {
                    const project = r.project;
                    const submitter = r.submittedBy;
                    const passed =
                      r.qcChecks?.filter((c) => c.state === true).length ?? 0;
                    const total = r.qcChecks?.length ?? 0;
                    const hasPending = r.qcChecks?.some(
                      (c) => c.state === null,
                    );
                    return (
                      <tr
                        key={r._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-mono text-xs font-semibold text-blue-500">
                          {r._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-blue-950">
                          {typeof project === "object" ? (
                            <>
                              <span className="text-blue-600 mr-2 font-bold whitespace-nowrap">
                                {project?.projectId || project?._id?.slice(-6).toUpperCase()}
                              </span>
                              <span className="text-blue-950">{project?.name}</span>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">
                          {typeof submitter === "object"
                            ? submitter?.name
                            : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">
                          {formatDate(r.date || r.createdAt)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-semibold text-blue-950">
                            {passed}/{total}
                          </span>
                          {hasPending && (
                            <span className="ml-2 text-[10px] text-amber-500 font-semibold">
                              pending
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Approved: "bg-green-50 text-green-600",
    Rejected: "bg-red-50 text-red-600",
    Pending: "bg-amber-50 text-amber-600",
  };
  return (
    <span
      className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${styles[status] || "bg-gray-100 text-gray-500"}`}
    >
      {status || "Pending"}
    </span>
  );
}
