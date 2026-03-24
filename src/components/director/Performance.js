"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  HardHat,
  BarChart3,
  Calendar,
  RefreshCw,
  Loader2,
  TrendingUp,
  FileText,
  CheckCircle2,
  Clock,
  Activity,
  ClipboardList,
  ChevronRight,
  Search,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import axiosInstance from "../../lib/axios";

// ── API ────────────────────────────────────────────────────────────────────────
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
const safeArr = (d, k) => (Array.isArray(d) ? d : d?.[k] || d?.data || []);

// ── Minimal tooltip ────────────────────────────────────────────────────────────
const ChartTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-bold text-gray-800">
        {payload[0].name || payload[0].dataKey}
      </p>
      <p className="text-gray-500">
        Count:{" "}
        <span className="font-bold text-extra-darkblue">
          {payload[0].value}
        </span>
      </p>
    </div>
  );
};

// ── Progress Bar ───────────────────────────────────────────────────────────────
function ProgressBar({ value = 0, color = "#3b82f6" }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-bold w-9 text-right" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

// ── Score Badge ────────────────────────────────────────────────────────────────
function ScoreBadge({ value, label, cls }) {
  return (
    <div className={`rounded-xl px-3 py-2 text-center ${cls}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs opacity-70 mt-0.5">{label}</p>
    </div>
  );
}

// ── Section Card ───────────────────────────────────────────────────────────────
function SectionCard({ icon: Icon, iconColor, title, sub, children, note }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
        <Icon size={15} className={iconColor} />
        <div>
          <h3 className="text-sm font-bold text-extra-darkblue">{title}</h3>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
      {note && (
        <div className="px-5 py-2.5 border-t border-gray-50 bg-gray-50/40">
          <p className="text-xs text-gray-400 italic">{note}</p>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PerformanceAnalytics() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");

  const loadData = useCallback(async () => {
    try {
      const [uRes, pRes, rRes, aRes] = await Promise.all([
        apiFetch("/admin/users"),
        apiFetch("/projects"),
        apiFetch("/reports/view-all"),
        apiFetch("/attendance/all"),
      ]);
      setUsers(safeArr(uRes, "users"));
      setProjects(safeArr(pRes, "projects"));
      setReports(safeArr(rRes, "reports"));
      setAttendance(safeArr(aRes, "attendance"));
    } catch (err) {
      console.error("Performance load error:", err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ── Derived Metrics (all real, no random) ─────────────────────────────────
  // Engineers: users with role="engineer"
  const engineers = users.filter((u) => u.role === "engineer");
  // Installation Incharges: users with role="installationIncharge"
  const incharges = users.filter((u) => u.role === "installationIncharge");

  // Project progress distribution (from project.progress field, 0–100)
  const progressBuckets = [
    { name: "0–25%", value: projects.filter((p) => p.progress < 25).length },
    {
      name: "25–50%",
      value: projects.filter((p) => p.progress >= 25 && p.progress < 50).length,
    },
    {
      name: "50–75%",
      value: projects.filter((p) => p.progress >= 50 && p.progress < 75).length,
    },
    {
      name: "75–99%",
      value: projects.filter((p) => p.progress >= 75 && p.progress < 100)
        .length,
    },
    { name: "100%", value: projects.filter((p) => p.progress === 100).length },
  ];
  const PROGRESS_COLORS = [
    "#ef4444",
    "#f59e0b",
    "#3b82f6",
    "#8b5cf6",
    "#10b981",
  ];

  // Report type breakdown (from report.reportType enum)
  const reportByType = ["Daily", "QC", "Safety", "SiteInspection"]?.map(
    (t) => ({
      name: t,
      value: reports.filter((r) => r.reportType === t).length,
    }),
  );
  const REPORT_COLORS = {
    Daily: "#3b82f6",
    QC: "#8b5cf6",
    Safety: "#f59e0b",
    SiteInspection: "#10b981",
  };

  // Attendance status distribution (from attendance.status enum)
  const attByStatus = [
    "present",
    "absent",
    "half-day",
    "on-leave",
    "late",
  ]?.map((s) => ({
    name: s.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    raw: s,
    value: attendance.filter((a) => a.status === s).length,
  }));
  const ATT_COLORS = {
    present: "#10b981",
    absent: "#ef4444",
    "half-day": "#f59e0b",
    "on-leave": "#6366f1",
    late: "#f97316",
  };

  // Summary KPIs
  const completedProjects = projects.filter(
    (p) => p.status === "completed",
  ).length;
  const avgProgress = projects.length
    ? Math.round(
        projects.reduce((s, p) => s + (p.progress || 0), 0) / projects.length,
      )
    : 0;
  const presentToday = attendance.filter((a) => a.status === "present").length;

  if (loading)
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm font-medium">
          Loading Performance Analytics…
        </span>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-extra-darkblue">
            Performance Analytics
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Real metrics from projects, reports & attendance — no mock data
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />{" "}
          Refresh
        </button>
      </div>

      {/* ── KPI Summary Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Engineers",
            value: engineers.length,
            color: "bg-blue-50 text-blue-600",
            icon: Users,
          },
          {
            label: "Installation Incharges",
            value: incharges.length,
            color: "bg-amber-50 text-amber-600",
            icon: HardHat,
          },
          {
            label: "Avg Project Progress",
            value: `${avgProgress}%`,
            color: "bg-indigo-50 text-indigo-600",
            icon: Activity,
          },
          {
            label: "Completed Projects",
            value: completedProjects,
            color: "bg-emerald-50 text-emerald-600",
            icon: CheckCircle2,
          },
        ]?.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}
            >
              <s.icon size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-extra-darkblue">{s.value}</p>
              <p className="text-xs font-medium text-gray-600 leading-tight">
                {s.label}
              </p>
              <p className="text-xs text-gray-400">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 1: Project Progress + Report Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Project Progress Buckets */}
        <SectionCard
          icon={Activity}
          iconColor="text-indigo-500"
          title="Project Progress Distribution"
          sub="Source: project.progress (0–100 numeric field)"
          note="Metric: projects grouped into progress buckets from project.progress field — GET /projects"
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={progressBuckets} barCategoryGap="35%">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                width={25}
              />
              <Tooltip content={<ChartTip />} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {progressBuckets?.map((_, i) => (
                  <Cell key={i} fill={PROGRESS_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Report Type Breakdown */}
        <SectionCard
          icon={FileText}
          iconColor="text-purple-500"
          title="Reports by Type"
          sub="Source: report.reportType enum — GET /reports/view-all"
          note="Metric: count of submitted reports grouped by reportType (Daily/QC/Safety/SiteInspection)"
        >
          {reportByType.every((r) => r.value === 0) ? (
            <div className="py-8 text-center text-gray-300 text-sm">
              No reports submitted yet
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {reportByType?.map((r, i) => (
                <div key={r.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-gray-700">
                      {r.name}
                    </span>
                    <span className="text-gray-400">
                      {r.value} report{r.value !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <ProgressBar
                    value={
                      reports.length
                        ? Math.round((r.value / reports.length) * 100)
                        : 0
                    }
                    color={REPORT_COLORS[r.name]}
                  />
                </div>
              ))}
              <p className="text-xs text-gray-400 mt-2">
                Total reports:{" "}
                <strong className="text-extra-darkblue">
                  {reports.length}
                </strong>
              </p>
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Row 2: Engineer List + Attendance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Engineers & Incharges */}
        <SectionCard
          icon={Users}
          iconColor="text-blue-500"
          title="Team Members by Role"
          sub="Source: GET /admin/users — real user accounts"
          note="Metric: users grouped by role field; status=active subset shown"
        >
          <div className="space-y-2">
            {[
              {
                role: "engineer",
                label: "Engineers",
                color: "bg-blue-50 text-blue-600",
                count: engineers.length,
              },
              {
                role: "installationIncharge",
                label: "Installation Incharges",
                color: "bg-amber-50 text-amber-600",
                count: incharges.length,
              },
              {
                role: "marketingExecutive",
                label: "Marketing Executives",
                color: "bg-pink-50 text-pink-600",
                count: users.filter((u) => u.role === "marketingExecutive")
                  .length,
              },
              {
                role: "qualityControl",
                label: "Quality Control",
                color: "bg-purple-50 text-purple-600",
                count: users.filter((u) => u.role === "qualityControl").length,
              },
              {
                role: "support",
                label: "Support",
                color: "bg-teal-50 text-teal-600",
                count: users.filter((u) => u.role === "support").length,
              },
            ]?.map((r) => (
              <div
                key={r.role}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100"
              >
                <span className="text-sm font-medium text-gray-700">
                  {r.label}
                </span>
                <span
                  className={`text-sm font-bold px-3 py-1 rounded-lg ${r.color}`}
                >
                  {r.count}
                </span>
              </div>
            ))}
            <p className="text-xs text-gray-400 mt-2">
              Total users:{" "}
              <strong className="text-extra-darkblue">{users.length}</strong>
            </p>
          </div>
        </SectionCard>

        {/* Attendance Distribution */}
        <SectionCard
          icon={Calendar}
          iconColor="text-emerald-500"
          title="Attendance Status Distribution"
          sub="Source: GET /attendance/all — all attendance records"
          note="Metric: count per attendance.status enum (present/absent/half-day/on-leave/late)"
        >
          {attendance.length === 0 ? (
            <div className="py-8 text-center text-gray-300 text-sm">
              No attendance records found
            </div>
          ) : (
            <div className="space-y-3">
              {attByStatus?.map((a) => (
                <div key={a.raw}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-gray-700">
                      {a.name}
                    </span>
                    <span className="text-gray-400">{a.value}</span>
                  </div>
                  <ProgressBar
                    value={
                      attendance.length
                        ? Math.round((a.value / attendance.length) * 100)
                        : 0
                    }
                    color={ATT_COLORS[a.raw]}
                  />
                </div>
              ))}
              <p className="text-xs text-gray-400 mt-2">
                Total records:{" "}
                <strong className="text-extra-darkblue">
                  {attendance.length}
                </strong>
              </p>
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Project Cards Grid ── */}
      <div>
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <div className="flex items-center gap-2.5">
            <ClipboardList size={15} className="text-blue-500" />
            <div>
              <h3 className="text-sm font-bold text-extra-darkblue">
                All Projects — Progress & Phase
              </h3>
              <p className="text-xs text-gray-400">
                {projects.length} projects total
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
            />
            <input
              type="text"
              placeholder="Search projects by name, client, location…"
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-gray-700 placeholder-gray-300 bg-white"
            />
          </div>
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl overflow-x-auto">
            {[
              "All",
              "in-progress",
              "installation",
              "testing",
              "completed",
              "on-hold",
            ]?.map((f) => (
              <button
                key={f}
                onClick={() => setProjectFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
                  ${projectFilter === f ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              >
                {f === "All"
                  ? "All"
                  : f
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {(() => {
          const filteredProjects = projects.filter((p) => {
            const matchesSearch =
              !projectSearch ||
              (p.name || "")
                .toLowerCase()
                .includes(projectSearch.toLowerCase()) ||
              (p.clientName || "")
                .toLowerCase()
                .includes(projectSearch.toLowerCase()) ||
              (p.location || "")
                .toLowerCase()
                .includes(projectSearch.toLowerCase());
            const matchesFilter =
              projectFilter === "All" || p.status === projectFilter;
            return matchesSearch && matchesFilter;
          });

          return filteredProjects.length === 0 ? (
            <div className="py-12 text-center text-gray-300 text-sm bg-white rounded-2xl border border-gray-100">
              {projects.length === 0
                ? "No projects found"
                : "No projects match your search or filter"}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects?.map((p) => {
                const PHASE_COLOR_MAP = {
                  "Site Preparation": "#6366f1",
                  "Wiring & Plumbing": "#3b82f6",
                  "Equipment Setup": "#f59e0b",
                  Installation: "#8b5cf6",
                  "Final Testing": "#10b981",
                  Completed: "#22c55e",
                };
                const STATUS_COLOR_MAP = {
                  initiated: "bg-gray-100 text-gray-500",
                  "in-progress": "bg-blue-50 text-blue-600",
                  installation: "bg-purple-50 text-purple-600",
                  testing: "bg-amber-50 text-amber-600",
                  completed: "bg-emerald-50 text-emerald-600",
                  "on-hold": "bg-red-50 text-red-500",
                };
                const progress = p.progress ?? 0;
                const barColor = PHASE_COLOR_MAP[p.phase] || "#1C4D8D";

                return (
                  <div
                    key={p._id}
                    onClick={() => router.push(`/director/project/${p._id}`)}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group relative"
                  >
                    {/* Top: Name + Status */}
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                          {p.name}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {p.location || "No location"} · {p.clientName}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${STATUS_COLOR_MAP[p.status] || "bg-gray-100 text-gray-500"}`}
                      >
                        {(p.status || "")
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-400">Progress</span>
                        <span className="font-bold" style={{ color: barColor }}>
                          {progress}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${progress}%`,
                            background: barColor,
                          }}
                        />
                      </div>
                    </div>

                    {/* Footer: Details + View Detail */}
                    <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex gap-3 text-xs text-gray-500 flex-wrap">
                        {p.assignedEngineers?.length > 0 && (
                          <span>
                            {p.assignedEngineers.length} engineer
                            {p.assignedEngineers.length > 1 ? "s" : ""}
                          </span>
                        )}
                        {p.startDate && (
                          <span className="flex items-center gap-1">
                            <Clock size={10} className="text-gray-400" />
                            {new Date(p.startDate).toLocaleDateString()}
                          </span>
                        )}
                        {p.endDate && (
                          <span className="text-gray-400">
                            → {new Date(p.endDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-blue-700 flex items-center gap-1 group-hover:gap-2 transition-all">
                        View Detail <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
