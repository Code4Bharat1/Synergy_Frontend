"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Clipboard,
  Wrench,
  Users,
  RefreshCw,
  ChevronRight,
  ArrowUpRight,
  X,
  MapPin,
  Calendar,
  User,
  Tag,
  Hash,
  Phone,
  Mail,
  Building2,
  Clock,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

// ── Config ────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Data helpers ──────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const installTypeLabel = (status) =>
  ({
    installation: "Full Install",
    testing: "Inspection",
    "in-progress": "Partial Setup",
  })[status] || "Full Install";

const countAssignedEngineers = (projects) => {
  const ids = new Set();
  projects.forEach((p) =>
    (p.assignedEngineers || []).forEach((e) =>
      ids.add(typeof e === "object" ? e._id : e),
    ),
  );
  return ids.size;
};

// ── Badge helpers ─────────────────────────────
const levelBadge = (level) =>
  ({
    High: { bg: "bg-[#0F2854] text-white" },
    Medium: { bg: "bg-[#1C4D8D] text-white" },
    Low: { bg: "bg-[#BDE8F5] text-[#0F2854]" },
  })[level] || { bg: "bg-[#BDE8F5] text-[#0F2854]" };

const statusBadge = (s) =>
  ({
    "Pending Review": "bg-[#BDE8F5] text-[#0F2854]",
    "Docs Missing": "bg-[#0F2854] text-white",
    "Under Assessment": "bg-[#1C4D8D] text-white",
    "Full Install": "bg-[#BDE8F5] text-[#0F2854]",
    "Partial Setup": "bg-[#d6ebf7] text-[#1C4D8D]",
    Inspection: "bg-[#e8f3fb] text-[#4988C4]",
    initiated: "bg-amber-50 text-amber-600",
    "in-progress": "bg-[#d6ebf7] text-[#1C4D8D]",
    installation: "bg-[#BDE8F5] text-[#0F2854]",
    testing: "bg-[#e8f3fb] text-[#4988C4]",
    completed: "bg-green-50 text-green-600",
    "on-hold": "bg-[#0F2854] text-white",
  })[s] || "bg-[#BDE8F5] text-[#0F2854]";

// ── Reusable atoms ────────────────────────────
function Badge({ label, className }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap capitalize ${className}`}
    >
      {label}
    </span>
  );
}

function SkeletonRow({ cols = 5 }) {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: cols })?.map((_, i) => (
        <td key={i} className="px-5 py-3">
          <div
            className="h-3 rounded animate-pulse bg-[#BDE8F5]"
            style={{ width: `${60 + ((i * 13) % 30)}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div className="mx-5 my-3 px-3 py-2 rounded-lg flex items-center justify-between text-xs font-medium bg-red-50 text-red-600 border border-red-200">
      <span>⚠ {message}</span>
      {onRetry && (
        <button onClick={onRetry} className="ml-3 underline hover:no-underline">
          Retry
        </button>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Ic,
  iconClass,
  loading,
  isActive,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`relative bg-white rounded-xl p-5 flex items-start gap-4 text-left w-full transition-all duration-200 shadow-sm overflow-hidden
        ${isActive ? "border-2 border-[#1C4D8D] shadow-md" : "border border-gray-100 hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5"}
      `}
    >
      {isActive && (
        <div className="absolute inset-x-0 top-0 h-[3px] bg-[#1C4D8D]" />
      )}
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}
      >
        <Ic size={18} />
      </div>
      <div>
        {loading ? (
          <div className="h-7 w-12 rounded animate-pulse bg-[#BDE8F5] mb-1" />
        ) : (
          <p className="text-2xl font-bold text-[#0F2854]">{value}</p>
        )}
        <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
        {isActive && (
          <p className="text-[10px] font-bold mt-1 text-[#1C4D8D]">
            ● Active filter
          </p>
        )}
      </div>
    </button>
  );
}

function HoverTr({ children }) {
  const [hov, setHov] = useState(false);
  return (
    <tr
      className={`border-b border-gray-100 transition-colors group ${hov ? "bg-gray-50" : ""}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </tr>
  );
}

// ── Mobile cards ──────────────────────────────
function MobileProjectCard({ p, onReview }) {
  return (
    <div className="px-5 py-3 flex flex-col gap-2 border-b border-gray-100">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold mt-0.5 text-[#0F2854]">
            {p.projectId && (
              <span className="text-[#4988C4] mr-1.5">{p.projectId}</span>
            )}
            {p.name}
          </p>
          <p className="text-xs text-gray-400">{p.clientName}</p>
        </div>
        <Badge label="Medium" className={levelBadge("Medium").bg} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{formatDate(p.createdAt)}</span>
        <div className="flex items-center gap-2">
          <Badge label={p.status} className={statusBadge(p.status)} />
          <button
            onClick={() => onReview(p)}
            className="text-xs font-semibold text-[#1C4D8D] flex items-center gap-0.5"
          >
            Review <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileInstallCard({ p, onReview }) {
  const type = installTypeLabel(p.status);
  const engineerName =
    p.assignedInstallationIncharge?.name ||
    p.assignedEngineers?.[0]?.name ||
    "Unassigned";
  return (
    <div className="px-5 py-3 flex flex-col gap-2 border-b border-gray-100">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold mt-0.5 text-[#0F2854]">
            {p.projectId && (
              <span className="text-[#4988C4] mr-1.5">{p.projectId}</span>
            )}
            {p.name}
          </p>
          <p
            className={`text-xs ${engineerName === "Unassigned" ? "font-bold text-[#0F2854]" : "text-gray-400"}`}
          >
            {engineerName === "Unassigned" ? "— Unassigned" : engineerName}
          </p>
        </div>
        <Badge label="Medium" className={levelBadge("Medium").bg} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{formatDate(p.startDate)}</span>
        <div className="flex items-center gap-2">
          <Badge label={type} className={statusBadge(type)} />
          <button
            onClick={() => onReview(p)}
            className="text-xs font-semibold text-[#1C4D8D] flex items-center gap-0.5"
          >
            Review <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Row helper ─────────────────────────
function DetailRow({ icon: Ic, label, value, valueClass = "" }) {
  if (!value || value === "—") return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="w-7 h-7 rounded-md bg-[#e8f3fb] flex items-center justify-center shrink-0 mt-0.5">
        <Ic size={13} className="text-[#1C4D8D]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
          {label}
        </p>
        <p
          className={`text-sm font-medium text-gray-800 break-words ${valueClass}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ── Project Detail Modal ──────────────────────
function ProjectDetailModal({ project, onClose, mode = "initiated" }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!project) return null;

  const isInstall = mode === "installation";
  const incharge =
    project.assignedInstallationIncharge?.name ||
    project.assignedEngineers?.[0]?.name ||
    "Unassigned";
  const engineersList =
    (project.assignedEngineers || [])
      ?.map((e) => (typeof e === "object" ? e.name : e))
      .filter(Boolean)
      .join(", ") || "None assigned";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(15,40,84,0.45)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F2854] to-[#1C4D8D] px-6 py-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {project.projectId && (
                <span className="text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                  {project.projectId}
                </span>
              )}
              <Badge
                label={
                  isInstall ? installTypeLabel(project.status) : project.status
                }
                className={`${statusBadge(isInstall ? installTypeLabel(project.status) : project.status)} border border-white/20`}
              />
            </div>
            <h2 className="text-base font-bold text-white leading-snug">
              {project.name || "Untitled Project"}
            </h2>
            <p className="text-xs text-blue-200 mt-0.5">
              {project.clientName || "—"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 shrink-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X size={15} />
          </button>
        </div>

        {/* Priority strip */}
        <div className="px-6 py-2.5 bg-[#f7fafd] border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">
            Risk Priority
          </span>
          <Badge label="Medium" className={levelBadge("Medium").bg} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          {/* Core info */}
          <div className="mb-1">
            <DetailRow
              icon={Hash}
              label="Project ID"
              value={project.projectId}
            />
            <DetailRow
              icon={Building2}
              label="Client"
              value={project.clientName}
            />
            <DetailRow
              icon={MapPin}
              label="Site / Location"
              value={project.location || project.siteAddress || project.address}
            />
            <DetailRow
              icon={Calendar}
              label={isInstall ? "Start Date" : "Submitted On"}
              value={formatDateTime(
                isInstall ? project.startDate : project.createdAt,
              )}
            />
            {project.endDate && (
              <DetailRow
                icon={Clock}
                label="End Date"
                value={formatDate(project.endDate)}
              />
            )}
          </div>

          {/* People */}
          {isInstall && (
            <div className="mb-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#4988C4] mt-3 mb-1">
                Team
              </p>
              <DetailRow
                icon={User}
                label="Installation Incharge"
                value={incharge}
                valueClass={
                  incharge === "Unassigned" ? "text-amber-600 font-bold" : ""
                }
              />
              <DetailRow
                icon={Users}
                label="Assigned Engineers"
                value={engineersList}
              />
            </div>
          )}

          {/* Contact info */}
          {(project.contactPerson ||
            project.contactPhone ||
            project.contactEmail) && (
            <div className="mb-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#4988C4] mt-3 mb-1">
                Contact
              </p>
              <DetailRow
                icon={User}
                label="Contact Person"
                value={project.contactPerson}
              />
              <DetailRow
                icon={Phone}
                label="Phone"
                value={project.contactPhone}
              />
              <DetailRow
                icon={Mail}
                label="Email"
                value={project.contactEmail}
              />
            </div>
          )}

          {/* Description */}
          {project.description && (
            <div className="mt-3 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#4988C4] mb-1.5">
                Description
              </p>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                {project.description}
              </p>
            </div>
          )}

          {/* Notes */}
          {project.notes && (
            <div className="mt-3 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#4988C4] mb-1.5">
                Notes
              </p>
              <p className="text-sm text-gray-600 leading-relaxed bg-amber-50 rounded-lg px-3 py-2.5 border border-amber-100">
                {project.notes}
              </p>
            </div>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="mt-3 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#4988C4] mb-1.5">
                Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {project.tags?.map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs bg-[#e8f3fb] text-[#1C4D8D] px-2 py-0.5 rounded-full font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="h-3" />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-[10px] text-gray-400">
            Last updated: {formatDate(project.updatedAt || project.createdAt)}
          </p>
          <button
            onClick={onClose}
            className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-[#0F2854] text-white hover:bg-[#1C4D8D] transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes animate-in {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-in { animation: animate-in 0.18s ease-out forwards; }
      `}</style>
    </div>
  );
}

// ── View All Drawer ───────────────────────────
function ViewAllDrawer({ title, projects, mode, onClose, onReview }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const allStatuses = [
    ...new Set(projects?.map((p) => p.status).filter(Boolean)),
  ];

  const filtered = projects.filter((p) => {
    const matchSearch =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      p.projectId?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const isInstall = mode === "installation";

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{
        backgroundColor: "rgba(15,40,84,0.35)",
        backdropFilter: "blur(3px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl drawer-slide">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F2854] to-[#1C4D8D] px-6 py-5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">{title}</h2>
            <p className="text-xs text-blue-200 mt-0.5">
              {projects.length} total records
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X size={15} />
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row gap-2 shrink-0 bg-[#f7fafd]">
          <input
            type="text"
            placeholder="Search by name, client, ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#1C4D8D] bg-white"
          />
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 pr-7 focus:outline-none focus:border-[#1C4D8D] bg-white appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {allStatuses?.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Count */}
        <div className="px-5 py-2 border-b border-gray-100 shrink-0">
          <p className="text-xs text-gray-400 font-medium">
            Showing{" "}
            <span className="font-bold text-[#1C4D8D]">{filtered.length}</span>{" "}
            of {projects.length} projects
          </p>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <AlertCircle size={32} className="mb-2 opacity-40" />
              <p className="text-sm">No projects match your filters</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {isInstall
                        ? [
                            "Site",
                            "Incharge",
                            "Start Date",
                            "Type",
                            "Priority",
                            "",
                          ]?.map((h) => (
                            <th
                              key={h}
                              className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-2.5 whitespace-nowrap text-[#4988C4]"
                            >
                              {h}
                            </th>
                          ))
                        : [
                            "Project",
                            "Client",
                            "Submitted",
                            "Status",
                            "Priority",
                            "",
                          ]?.map((h) => (
                            <th
                              key={h}
                              className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-2.5 whitespace-nowrap text-[#4988C4]"
                            >
                              {h}
                            </th>
                          ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered?.map((p) => {
                      const incharge =
                        p.assignedInstallationIncharge?.name ||
                        p.assignedEngineers?.[0]?.name ||
                        "Unassigned";
                      const type = installTypeLabel(p.status);
                      return (
                        <HoverTr key={p._id}>
                          <td className="px-5 py-3 font-medium whitespace-nowrap text-sm text-[#0F2854]">
                            {p.projectId && (
                              <span className="text-[#4988C4] mr-1.5">
                                {p.projectId}
                              </span>
                            )}
                            {p.name}
                          </td>
                          {isInstall ? (
                            <>
                              <td className="px-5 py-3 whitespace-nowrap text-sm">
                                {incharge === "Unassigned" ? (
                                  <span className="text-xs font-bold text-[#0F2854]">
                                    — Unassigned
                                  </span>
                                ) : (
                                  <span className="text-gray-500">
                                    {incharge}
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3 whitespace-nowrap text-xs text-gray-400">
                                {formatDate(p.startDate)}
                              </td>
                              <td className="px-5 py-3 whitespace-nowrap">
                                <Badge
                                  label={type}
                                  className={statusBadge(type)}
                                />
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-500">
                                {p.clientName}
                              </td>
                              <td className="px-5 py-3 whitespace-nowrap text-xs text-gray-400">
                                {formatDate(p.createdAt)}
                              </td>
                              <td className="px-5 py-3 whitespace-nowrap">
                                <Badge
                                  label={p.status}
                                  className={statusBadge(p.status)}
                                />
                              </td>
                            </>
                          )}
                          <td className="px-5 py-3 whitespace-nowrap">
                            <Badge
                              label="Medium"
                              className={levelBadge("Medium").bg}
                            />
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <button
                              onClick={() => onReview(p)}
                              className="text-xs font-semibold flex items-center gap-1 text-[#1C4D8D] hover:text-[#0F2854] transition-colors opacity-0 group-hover:opacity-100"
                            >
                              Review <ChevronRight size={13} />
                            </button>
                          </td>
                        </HoverTr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden">
                {filtered?.map((p) =>
                  isInstall ? (
                    <MobileInstallCard key={p._id} p={p} onReview={onReview} />
                  ) : (
                    <MobileProjectCard key={p._id} p={p} onReview={onReview} />
                  ),
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes drawer-slide {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .drawer-slide { animation: drawer-slide 0.22s ease-out forwards; }
      `}</style>
    </div>
  );
}

// ── Custom hooks ──────────────────────────────
function useProjects(status) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = status ? { status } : {};
      const res = await api.get("/projects", { params });
      const projects = Array.isArray(res.data)
        ? res.data
        : (res.data.data ?? []);
      setData(projects);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetch();
  }, [fetch]);
  return { data, loading, error, refetch: fetch };
}

function useEngineers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/engineers")
      .then((res) =>
        setData(Array.isArray(res.data) ? res.data : (res.data.data ?? [])),
      )
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

// ── Main ──────────────────────────────────────
export default function Dashboard() {
  const initiated = useProjects("initiated");
  const installation = useProjects("installation");
  const engineers = useEngineers();

  const [activeFilter, setActiveFilter] = useState(null);

  // Modal state
  const [reviewProject, setReviewProject] = useState(null);
  const [reviewMode, setReviewMode] = useState("initiated");

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("initiated");

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const unassignedInstalls = installation.data.filter(
    (p) =>
      !p.assignedInstallationIncharge &&
      (!p.assignedEngineers || p.assignedEngineers.length === 0),
  ).length;

  const assignedEngineersCount = countAssignedEngineers([
    ...initiated.data,
    ...installation.data,
  ]);

  const handleStatClick = (key) =>
    setActiveFilter((prev) => (prev === key ? null : key));

  const openReview = (project, mode) => {
    setReviewProject(project);
    setReviewMode(mode);
  };

  const openDrawer = (mode) => {
    setDrawerMode(mode);
    setDrawerOpen(true);
  };

  // When user clicks Review from inside the drawer, close drawer and open modal
  const handleDrawerReview = (project) => {
    setDrawerOpen(false);
    openReview(project, drawerMode);
  };

  const showInitiated = activeFilter === null || activeFilter === "initiated";
  const showInstallation =
    activeFilter === null || activeFilter === "installation";

  const drawerProjects =
    drawerMode === "initiated" ? initiated.data : installation.data;
  const drawerTitle =
    drawerMode === "initiated"
      ? "All Initiated Projects"
      : "All Pending Installations";

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#4988C4]">
          {today} · All Sites Active
        </p>
        <h1 className="text-lg font-bold mt-0.5 text-[#0F2854]">
          Service Team Dashboard
        </h1>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Projects Initiated"
          value={initiated.data.length}
          sub={`+${
            initiated.data.filter((p) => {
              const d = new Date(p.createdAt);
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return d >= weekAgo;
            }).length
          } this week`}
          icon={Clipboard}
          iconClass="bg-[#e0eefa] text-[#1C4D8D]"
          loading={initiated.loading}
          isActive={activeFilter === "initiated"}
          onClick={() => handleStatClick("initiated")}
        />
        <StatCard
          label="Pending Installations"
          value={installation.data.length}
          sub={`${unassignedInstalls} unassigned`}
          icon={Wrench}
          iconClass="bg-[#e0eefa] text-[#1C4D8D]"
          loading={installation.loading}
          isActive={activeFilter === "installation"}
          onClick={() => handleStatClick("installation")}
        />
        <StatCard
          label="Engineers Assigned"
          value={engineers.loading ? "…" : engineers.data.length}
          sub={`${assignedEngineersCount} on active projects`}
          icon={Users}
          iconClass="bg-[#BDE8F5] text-[#0F2854]"
          loading={engineers.loading}
          isActive={activeFilter === "engineers"}
          onClick={() => handleStatClick("engineers")}
        />
      </div>

      {/* ── Projects Initiated ── */}
      {showInitiated && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#0F2854]">
                Projects Initiated
              </h2>
              {initiated.loading ? (
                <div className="w-6 h-5 rounded-full animate-pulse bg-[#BDE8F5]" />
              ) : (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#0F2854] text-white">
                  {initiated.data.length}
                </span>
              )}
            </div>
            <button
              onClick={initiated.refetch}
              className="p-1 rounded hover:opacity-60 transition-opacity text-[#4988C4]"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {initiated.error && (
            <ErrorBanner
              message={initiated.error}
              onRetry={initiated.refetch}
            />
          )}

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {[
                    "Project Name",
                    "Client",
                    "Submitted",
                    "Status",
                    "Risk",
                    "",
                  ]?.map((h) => (
                    <th
                      key={h}
                      className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-2.5 whitespace-nowrap text-[#4988C4]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {initiated.loading ? (
                  Array.from({ length: 4 })?.map((_, i) => (
                    <SkeletonRow key={i} cols={6} />
                  ))
                ) : initiated.data.length === 0 && !initiated.error ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-8 text-center text-sm text-gray-400"
                    >
                      No initiated projects found
                    </td>
                  </tr>
                ) : (
                  initiated.data?.map((p) => (
                    <HoverTr key={p._id}>
                      <td className="px-5 py-3 font-medium whitespace-nowrap text-sm text-[#0F2854]">
                        {p.projectId && (
                          <span className="text-[#4988C4] mr-1.5">
                            {p.projectId}
                          </span>
                        )}
                        {p.name}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-500">
                        {p.clientName}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs text-gray-400">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <Badge
                          label={p.status}
                          className={statusBadge(p.status)}
                        />
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <Badge
                          label="Medium"
                          className={levelBadge("Medium").bg}
                        />
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <button
                          onClick={() => openReview(p, "initiated")}
                          className="text-xs font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-[#1C4D8D] hover:text-[#0F2854]"
                        >
                          Review <ChevronRight size={13} />
                        </button>
                      </td>
                    </HoverTr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden">
            {initiated.loading
              ? Array.from({ length: 3 })?.map((_, i) => (
                  <div key={i} className="px-5 py-3 border-b border-gray-100">
                    <div className="h-3 rounded animate-pulse bg-[#BDE8F5] mb-2 w-2/5" />
                    <div className="h-4 rounded animate-pulse bg-[#BDE8F5] mb-1 w-3/5" />
                    <div className="h-3 rounded animate-pulse bg-[#BDE8F5] w-1/2" />
                  </div>
                ))
              : initiated.data?.map((p) => (
                  <MobileProjectCard
                    key={p._id}
                    p={p}
                    onReview={(proj) => openReview(proj, "initiated")}
                  />
                ))}
          </div>

          <div className="px-5 py-3 flex justify-end border-t border-gray-100">
            <button
              onClick={() => openDrawer("initiated")}
              className="text-xs font-semibold flex items-center gap-1 text-[#4988C4] hover:text-[#1C4D8D] transition-colors"
            >
              View all <ArrowUpRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* ── Pending Installations ── */}
      {showInstallation && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#0F2854]">
                Pending Installations
              </h2>
              {installation.loading ? (
                <div className="w-6 h-5 rounded-full animate-pulse bg-[#BDE8F5]" />
              ) : (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#1C4D8D] text-white">
                  {installation.data.length}
                </span>
              )}
            </div>
            <button
              onClick={installation.refetch}
              className="p-1 rounded hover:opacity-60 transition-opacity text-[#4988C4]"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {installation.error && (
            <ErrorBanner
              message={installation.error}
              onRetry={installation.refetch}
            />
          )}

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {[
                    "Site",
                    "Incharge",
                    "Start Date",
                    "Type",
                    "Priority",
                    "",
                  ]?.map((h) => (
                    <th
                      key={h}
                      className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-2.5 whitespace-nowrap text-[#4988C4]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {installation.loading ? (
                  Array.from({ length: 3 })?.map((_, i) => (
                    <SkeletonRow key={i} cols={6} />
                  ))
                ) : installation.data.length === 0 && !installation.error ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-8 text-center text-sm text-gray-400"
                    >
                      No pending installations
                    </td>
                  </tr>
                ) : (
                  installation.data?.map((p) => {
                    const type = installTypeLabel(p.status);
                    const incharge =
                      p.assignedInstallationIncharge?.name ||
                      p.assignedEngineers?.[0]?.name ||
                      "Unassigned";
                    return (
                      <HoverTr key={p._id}>
                        <td className="px-5 py-3 font-medium whitespace-nowrap text-sm text-[#0F2854]">
                          {p.projectId && (
                            <span className="text-[#4988C4] mr-1.5">
                              {p.projectId}
                            </span>
                          )}
                          {p.name}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-sm">
                          {incharge === "Unassigned" ? (
                            <span className="text-xs font-bold text-[#0F2854]">
                              — Unassigned
                            </span>
                          ) : (
                            <span className="text-gray-500">{incharge}</span>
                          )}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-xs text-gray-400">
                          {formatDate(p.startDate)}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <Badge label={type} className={statusBadge(type)} />
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <Badge
                            label="Medium"
                            className={levelBadge("Medium").bg}
                          />
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <button
                            onClick={() => openReview(p, "installation")}
                            className="text-xs font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-[#1C4D8D] hover:text-[#0F2854]"
                          >
                            Review <ChevronRight size={13} />
                          </button>
                        </td>
                      </HoverTr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden">
            {installation.loading
              ? Array.from({ length: 3 })?.map((_, i) => (
                  <div key={i} className="px-5 py-3 border-b border-gray-100">
                    <div className="h-3 rounded animate-pulse bg-[#BDE8F5] mb-2 w-2/5" />
                    <div className="h-4 rounded animate-pulse bg-[#BDE8F5] mb-1 w-3/5" />
                    <div className="h-3 rounded animate-pulse bg-[#BDE8F5] w-1/2" />
                  </div>
                ))
              : installation.data?.map((p) => (
                  <MobileInstallCard
                    key={p._id}
                    p={p}
                    onReview={(proj) => openReview(proj, "installation")}
                  />
                ))}
          </div>

          <div className="px-5 py-3 flex justify-end border-t border-gray-100">
            <button
              onClick={() => openDrawer("installation")}
              className="text-xs font-semibold flex items-center gap-1 text-[#4988C4] hover:text-[#1C4D8D] transition-colors"
            >
              View all <ArrowUpRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* ── Project Detail Modal ── */}
      {reviewProject && (
        <ProjectDetailModal
          project={reviewProject}
          mode={reviewMode}
          onClose={() => setReviewProject(null)}
        />
      )}

      {/* ── View All Drawer ── */}
      {drawerOpen && (
        <ViewAllDrawer
          title={drawerTitle}
          projects={drawerProjects}
          mode={drawerMode}
          onClose={() => setDrawerOpen(false)}
          onReview={handleDrawerReview}
        />
      )}
    </div>
  );
}
