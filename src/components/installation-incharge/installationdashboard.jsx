"use client";
import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";

const severityClass = {
  Critical: "bg-red-100 text-red-800",
  High: "bg-amber-100 text-amber-800",
  Medium: "bg-blue-100 text-blue-800",
  Low: "bg-green-100 text-green-800",
};

const statusClass = {
  "On Track": "bg-green-100 text-green-800",
  "At Risk": "bg-amber-100 text-amber-800",
  Delayed: "bg-red-100 text-red-800",
  "Pending Review": "bg-blue-100 text-blue-800",
  "Docs Missing": "bg-red-100 text-red-800",
  "Under Assessment": "bg-amber-100 text-amber-800",
  initiated: "bg-gray-100 text-gray-700",
  "in-progress": "bg-blue-100 text-blue-800",
  installation: "bg-amber-100 text-amber-800",
  testing: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  "on-hold": "bg-red-100 text-red-800",
};

function Badge({ label, classMap }) {
  const cls = classMap[label] || "bg-gray-100 text-gray-700";
  return (
    <span
      className={`${cls} px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap`}
    >
      {label}
    </span>
  );
}

function ProgressBar({ value }) {
  const color =
    value >= 70 ? "bg-blue-700" : value >= 40 ? "bg-blue-400" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden min-w-[60px]">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{value}%</span>
    </div>
  );
}

// ── Review Modal ──────────────────────────────────────────────────────────────
function ReviewModal({ project, onClose }) {
  if (!project) return null;

  const submitted = new Date(project.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const engineers = project.assignedEngineers?.length
    ? project.assignedEngineers?.map((e) => e.name).join(", ")
    : "Unassigned";
  const endDate = project.endDate
    ? new Date(project.endDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "TBD";

  const fields = [
    { label: "Project ID", value: project.projectId || project._id },
    { label: "Client", value: project.clientName || "—" },
    {
      label: "Status",
      value: project.status,
      isBadge: true,
      classMap: statusClass,
    },
    { label: "Phase", value: project.phase || "—" },
    { label: "Submitted", value: submitted },
    { label: "Due Date", value: endDate },
    { label: "Engineers", value: engineers },
    { label: "Progress", value: project.progress || 0, isProgress: true },
    {
      label: "Description",
      value: project.description || "No description provided.",
      isWide: true,
    },
  ];

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-950 px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-1">
              Eligibility Review
            </p>
            <h2 className="text-white text-lg font-bold leading-snug">
              <span className="text-blue-200 mr-2">
                {project.projectId || project._id?.slice(-6).toUpperCase()}
              </span>
              {project.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-blue-300 hover:text-white transition-colors mt-0.5 shrink-0"
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 grid grid-cols-2 gap-x-6 gap-y-4">
          {fields?.map(
            ({ label, value, isBadge, classMap, isProgress, isWide }) => (
              <div key={label} className={isWide ? "col-span-2" : ""}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  {label}
                </p>
                {isBadge ? (
                  <Badge label={value} classMap={classMap} />
                ) : isProgress ? (
                  <ProgressBar value={value} />
                ) : (
                  <p
                    className={`text-sm font-medium ${
                      label === "Engineers" && value === "Unassigned"
                        ? "text-red-500"
                        : label === "Project ID"
                          ? "text-blue-700 font-mono text-xs"
                          : "text-gray-800"
                    }`}
                  >
                    {value}
                  </p>
                )}
              </div>
            ),
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 pb-5 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          {/* <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-800 hover:bg-blue-900 text-white transition-colors"
          >
            Mark as Reviewed
          </button> */}
        </div>
      </div>
    </div>
  );
}

// ── Cards (mobile) ────────────────────────────────────────────────────────────
function EligibilityCard({ row, onReview }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-900 text-sm mt-0.5">
            <span className="text-blue-700 mr-1.5">{row.id}</span>
            {row.name}
          </p>
          <p className="text-xs text-gray-500">{row.client}</p>
        </div>
        <button
          onClick={() => onReview(row.raw)}
          className="bg-blue-800 text-white rounded-lg px-3 py-1.5 text-xs font-semibold shrink-0 ml-2 hover:bg-blue-900 transition-colors"
        >
          Review
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <Badge label={row.status} classMap={statusClass} />
        <span className="text-xs text-gray-400">{row.submitted}</span>
      </div>
    </div>
  );
}

function ProgressCard({ row }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="font-semibold text-gray-900 text-sm mt-0.5">
            <span className="text-blue-700 mr-1.5">{row.id}</span>
            {row.name}
          </p>
        </div>
        <Badge label={row.status} classMap={statusClass} />
      </div>
      <div className="flex items-center gap-2 mt-1 mb-3">
        <span
          className={`text-xs font-medium ${row.engineer === "Unassigned" ? "text-red-500 font-bold" : "text-gray-500"}`}
        >
          {row.engineer}
        </span>
        <span className="text-gray-300">·</span>
        <span className="text-xs text-gray-400">{row.phase}</span>
      </div>
      <ProgressBar value={row.completion} />
      <p className="text-xs text-gray-400 mt-2">Due: {row.dueDate}</p>
    </div>
  );
}

function IssueCard({ row }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xs font-bold text-blue-700">{row.id}</span>
          <p className="font-semibold text-gray-900 text-sm mt-0.5">
            {row.item}
          </p>
          <p className="text-xs text-gray-500">{row.project}</p>
        </div>
        <button className="bg-blue-950 text-white rounded-lg px-3 py-1.5 text-xs font-semibold shrink-0 ml-2">
          Approve
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <Badge label={row.severity} classMap={severityClass} />
        <span className="text-xs text-gray-400">{row.raisedBy}</span>
        <span
          className={`text-xs font-semibold ml-auto ${row.daysOpen > 14 ? "text-red-500" : "text-gray-500"}`}
        >
          {row.daysOpen}d open
        </span>
      </div>
    </div>
  );
}

// ── Tabs config ───────────────────────────────────────────────────────────────
const tabs = [
  { key: "eligibility", label: "Eligibility" },
  { key: "progress", label: "In Progress" },
  { key: "issues", label: "Issues" },
];

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("eligibility");
  const [projects, setProjects] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewProject, setReviewProject] = useState(null); // modal state

  useEffect(() => {
    Promise.all([axiosInstance.get("/projects"), axiosInstance.get("/issues")])
      .then(([{ data: projectsData }, { data: issuesData }]) => {
        setProjects(projectsData);
        setIssues(issuesData);
      })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived rows ────────────────────────────────────────────────────────────
  const eligibilityRows = projects
    .filter((p) => p.status === "initiated")
    ?.map((p) => ({
      id: p.projectId || p._id?.slice(-6).toUpperCase() || p._id,
      name: p.name,
      client: p.clientName,
      submitted: new Date(p.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      status: p.status,
      raw: p, // keep the full object for the modal
    }));

  const progressRows = projects
    .filter((p) =>
      ["in-progress", "installation", "testing"].includes(p.status),
    )
    ?.map((p) => ({
      id: p.projectId || p._id?.slice(-6).toUpperCase() || p._id,
      name: p.name,
      engineer:
        p.assignedEngineers?.length > 0
          ? p.assignedEngineers[0].name
          : "Unassigned",
      phase: p.phase || "—",
      completion: p.progress || 0,
      dueDate: p.endDate
        ? new Date(p.endDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "TBD",
      status: p.status,
    }));

  const issueRows = issues?.map((iss) => ({
    id: iss._id,
    project: iss.responsibleDepartment || "—",
    item: iss.problemDescription || "—",
    severity:
      iss.status === "open"
        ? "High"
        : iss.status === "in-progress"
          ? "Medium"
          : "Low",
    raisedBy: iss.createdBy?.name || "—",
    daysOpen: Math.floor(
      (Date.now() - new Date(iss.createdAt)) / (1000 * 60 * 60 * 24),
    ),
  }));

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = [
    {
      label: "Projects Pending Eligibility",
      value: eligibilityRows.length,
      sub: `${projects.filter((p) => p.status === "initiated").length} awaiting review`,
      subColor: "text-amber-500",
      accent: "border-blue-400",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      tab: "eligibility",
      icon: (
        <svg
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 12h6M9 16h4" />
        </svg>
      ),
    },
    {
      label: "Projects In Progress",
      value: progressRows.length,
      sub: `${progressRows.filter((p) => p.status === "testing").length} in testing`,
      subColor: "text-blue-500",
      accent: "border-blue-700",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-700",
      tab: "progress",
      icon: (
        <svg
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: "Engineer Assignments",
      value: projects.filter((p) => p.assignedEngineers?.length > 0).length,
      sub: `${projects.filter((p) => !p.assignedEngineers?.length).length} unassigned`,
      subColor: "text-amber-500",
      accent: "border-blue-900",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-900",
      tab: "progress",
      icon: (
        <svg
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
    },
    {
      label: "Open Issues – Approval",
      value: issueRows.length,
      sub:
        issueRows.filter((i) => i.severity === "Critical").length > 0
          ? `${issueRows.filter((i) => i.severity === "Critical").length} critical`
          : "No critical issues",
      subColor: "text-red-500",
      accent: "border-red-500",
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
      tab: "issues",
      icon: (
        <svg
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
  ];

  const now = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // ── Loading / Error states ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <p className="text-red-500 font-semibold mb-1">
            Failed to load dashboard
          </p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-blue-950">
      {/* Review Modal */}
      <ReviewModal
        project={reviewProject}
        onClose={() => setReviewProject(null)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-0.5">
            {now} · All Sites Active
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-blue-950">
            Service Team Dashboard
          </h1>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {stats?.map((s) => (
            <div
              key={s.label}
              onClick={() => setActiveTab(s.tab)}
              className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-t-4 ${s.accent} flex flex-col gap-2 cursor-pointer hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider leading-tight">
                  {s.label}
                </p>
                <span
                  className={`${s.iconBg} ${s.iconColor} p-1.5 rounded-lg shrink-0`}
                >
                  {s.icon}
                </span>
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold text-blue-950 leading-none">
                {s.value}
              </p>
              <p className={`text-xs font-medium ${s.subColor}`}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-5 bg-blue-100/60 rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
          {tabs?.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 sm:flex-none items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-blue-800 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {tab.key === "issues" && issueRows.length > 0 && (
                <span className="inline-flex items-center justify-center bg-red-500 text-white rounded-full text-[10px] font-bold w-4 h-4 ml-1">
                  {issueRows.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Desktop table ── */}
        <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Eligibility tab */}
          {activeTab === "eligibility" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100">
                    {[
                      "Project Name",
                      "Client",
                      "Submitted",
                      "Status",
                      "Action",
                    ]?.map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {eligibilityRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-10 text-center text-sm text-gray-400"
                      >
                        No projects pending eligibility.
                      </td>
                    </tr>
                  ) : (
                    eligibilityRows?.map((row, i) => (
                      <tr
                        key={row.id}
                        className={`border-t border-gray-50 hover:bg-blue-50/40 transition-colors ${i % 2 === 1 ? "bg-slate-50/50" : ""}`}
                      >
                        <td className="px-5 py-3.5 font-semibold text-gray-900">
                          {row.id && (
                            <span className="text-blue-700 mr-2 cursor-pointer">
                              {row.id}
                            </span>
                          )}
                          {row.name}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">
                          {row.client}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">
                          {row.submitted}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge label={row.status} classMap={statusClass} />
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => setReviewProject(row.raw)}
                            className="bg-blue-800 hover:bg-blue-900 text-white rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Progress tab */}
          {activeTab === "progress" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100">
                    {[
                      "Project Name / ID",
                      "Engineer",
                      "Phase",
                      "Completion",
                      "Due Date",
                      "Status",
                    ]?.map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {progressRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-10 text-center text-sm text-gray-400"
                      >
                        No projects in progress.
                      </td>
                    </tr>
                  ) : (
                    progressRows?.map((row, i) => (
                      <tr
                        key={row.id}
                        className={`border-t border-gray-50 hover:bg-blue-50/40 transition-colors ${i % 2 === 1 ? "bg-slate-50/50" : ""}`}
                      >
                        <td className="px-5 py-3.5 font-semibold text-gray-900">
                          <span className="text-blue-700 mr-2">
                            {row.id}
                          </span>
                          {row.name}
                        </td>
                        <td
                          className={`px-5 py-3.5 ${row.engineer === "Unassigned" ? "text-red-500 font-bold" : "text-gray-600"}`}
                        >
                          {row.engineer}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">
                          {row.phase}
                        </td>
                        <td className="px-5 py-3.5 min-w-[160px]">
                          <ProgressBar value={row.completion} />
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">
                          {row.dueDate}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge label={row.status} classMap={statusClass} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Issues tab */}
          {activeTab === "issues" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100">
                    {[
                      "Issue ID",
                      "Department",
                      "Problem",
                      "Status",
                      "Raised By",
                      "Days Open",
                      "Action",
                    ]?.map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {issueRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-10 text-center text-sm text-gray-400"
                      >
                        No open issues.
                      </td>
                    </tr>
                  ) : (
                    issueRows?.map((row, i) => (
                      <tr
                        key={row.id}
                        className={`border-t border-gray-50 hover:bg-blue-50/40 transition-colors ${i % 2 === 1 ? "bg-slate-50/50" : ""}`}
                      >
                        <td className="px-5 py-3.5 text-gray-500">
                          {row.project}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-gray-900">
                          {row.item}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            label={row.severity}
                            classMap={severityClass}
                          />
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">
                          {row.raisedBy}
                        </td>
                        <td
                          className={`px-5 py-3.5 font-semibold ${row.daysOpen > 14 ? "text-red-500" : "text-gray-600"}`}
                        >
                          {row.daysOpen}d
                        </td>
                        <td className="px-5 py-3.5">
                          <button className="bg-blue-950 hover:bg-blue-900 text-white rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors">
                            Approve
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Mobile cards ── */}
        <div className="flex flex-col gap-3 md:hidden">
          {activeTab === "eligibility" &&
            (eligibilityRows.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-10">
                No projects pending eligibility.
              </p>
            ) : (
              eligibilityRows?.map((row) => (
                <EligibilityCard
                  key={row.id}
                  row={row}
                  onReview={setReviewProject}
                />
              ))
            ))}
          {activeTab === "progress" &&
            (progressRows.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-10">
                No projects in progress.
              </p>
            ) : (
              progressRows?.map((row) => (
                <ProgressCard key={row.id} row={row} />
              ))
            ))}
          {activeTab === "issues" &&
            (issueRows.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-10">
                No open issues.
              </p>
            ) : (
              issueRows?.map((row) => <IssueCard key={row.id} row={row} />)
            ))}
        </div>

        <p className="mt-6 text-xs text-gray-400 text-right">
          Data refreshed ·{" "}
          {new Date().toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
