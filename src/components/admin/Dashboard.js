"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Clock,
  Settings,
  Loader,
  Briefcase,
} from "lucide-react";
import ComplaintTracker from "../common/ComplaintTracker";

// Config
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// API calls
const api = {
  async fetchDashboardData() {
    const fetchApi = async (url) => {
      try {
        const res = await fetch(`${API_BASE}${url}`, {
          headers: authHeaders(),
        });
        if (!res.ok) {
          console.error(
            `Failed to fetch ${url}: ${res.status} ${res.statusText}`,
          );
          return [];
        }
        const data = await res.json();
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.users)) return data.users;
        if (data && Array.isArray(data.projects)) return data.projects;
        if (data && Array.isArray(data.documents)) return data.documents;
        if (data && Array.isArray(data.complaints)) return data.complaints;
        if (data && data.data && Array.isArray(data.data)) return data.data;
        return [];
      } catch (err) {
        console.error(`Error fetching ${url}:`, err);
        return [];
      }
    };

    const [users, projects, documents, complaints] = await Promise.all([
      fetchApi("/admin/users"),
      fetchApi("/projects"),
      fetchApi("/documents"),
      fetchApi("/complaints"),
    ]);

    return { users, projects, documents, complaints };
  },
};

const LOG_TYPE_STYLE = {
  critical: "bg-red-50 text-red-600",
  high: "bg-amber-50 text-amber-600",
  medium: "bg-blue-50 text-blue-600",
  low: "bg-gray-100 text-gray-500",
  open: "bg-amber-50 text-amber-600",
};

function StatCard({ label, value, sub, icon: Icon, color, href }) {
  const router = useRouter();
  return (
    <div
      onClick={() => href && router.push(href)}
      className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 transition-all duration-200 ${href ? "cursor-pointer hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 active:scale-[0.98]" : ""}`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}
      >
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-bold text-extra-darkblue">{value}</p>
        <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState({
    users: [],
    projects: [],
    documents: [],
    complaints: [],
  });
  const [fetching, setFetching] = useState(true);

  const loadData = useCallback(async () => {
    setFetching(true);
    const dashboardData = await api.fetchDashboardData();
    setData(dashboardData);
    setFetching(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived stats
  const totalUsers = data.users.length;
  const activeRoles = new Set(data.users?.map((u) => u.role)).size;
  const healthPercent = fetching ? "..." : "100%";
  const pendingDocs = data.documents.filter(
    (d) => (d.status || "pending") === "pending",
  ).length;

  // Pending tasks derived from documents (unverified/pending documents)
  const pendingTasks = data.documents
    .filter((d) => (d.status || "pending") === "pending")
    .slice(0, 5)
    ?.map((doc, idx) => ({
      id: doc._id || idx,
      user: doc.uploadedBy?.name || doc.uploadedBy?.email || "User",
      requestedRole: doc.documentType || "Document",
      project: doc.project?.name || doc.project || "Unknown",
      since: new Date(doc.createdAt).toLocaleDateString(),
    }));

  const STATS = [
    {
      label: "Total Users",
      value: totalUsers,
      icon: Users,
      color: "bg-lightblue text-extra-blue",
      href: "/admin/user",
    },
    {
      label: "Active Roles",
      value: activeRoles,
      icon: ShieldCheck,
      color: "bg-green-50 text-green-600",
      href: "/admin/role",
    },
    // { label: "System Health", value: healthPercent, sub: "All services operational", icon: Activity, color: "bg-emerald-50 text-emerald-600" },
    {
      label: "Pending Verifications",
      value: pendingDocs,
      icon: Clock,
      color: "bg-amber-50 text-amber-600",
      href: "/admin/document",
    },
  ];

  // Replacing static Audit Logs with Complaints
  const recentComplaints = data.complaints
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    ?.map((c) => ({
      id: c._id,
      user: c.loggedBy?.name || c.loggedBy?.email || "Unknown",
      action: c.title || "Complaint log",
      time: new Date(c.createdAt).toLocaleDateString(),
      type: c.priority || "medium",
      status: c.status || "open",
      currentStage: c.currentStage,
      stageHistory: c.stageHistory,
    }));

  // Replacing static Workflows with Recent/Active Projects
  const activeProjectsList = data.projects
    .filter((p) => p.status !== "completed")
    .slice(0, 5)
    ?.map((p) => ({
      id: p._id,
      name: p.name,
      steps: p.assignedEngineers?.length || 0,
      status: p.status,
    }));

  if (fetching)
    return (
      <div className="py-10 text-gray-500 text-sm flex gap-2 items-center">
        <Loader size={16} className="animate-spin" /> Loading dashboard...
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-extra-darkblue">
          Admin Dashboard
        </h2>
        <p className="text-sm text-gray-400 mt-0.5">
          System overview for managers
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {STATS?.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-fit">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-500" />
              <h3 className="text-sm font-bold text-extra-darkblue">
                Recent Complaints
              </h3>
            </div>
            <span className="text-xs text-gray-400">
              {recentComplaints.length} recent
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {recentComplaints?.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <span
                  className={`mt-0.5 text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${LOG_TYPE_STYLE[log.type] || LOG_TYPE_STYLE.medium}`}
                >
                  {log.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-extra-darkblue font-medium truncate">
                    {log.action}
                  </p>
                  <div className="flex items-center justify-between mt-0.5 mb-2">
                    <p className="text-xs text-gray-400">
                      Logged by {log.user} · {log.time}
                    </p>
                  </div>
                  <ComplaintTracker currentStage={log.currentStage} status={log.status} stageHistory={log.stageHistory} compact />
                </div>
              </div>
            ))}
            {recentComplaints.length === 0 && (
              <p className="px-5 py-6 text-sm text-center text-gray-400">
                No active complaints.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-extra-blue" />
                <h3 className="text-sm font-bold text-extra-darkblue">
                  Pending Document Verifications
                </h3>
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                {pendingTasks.length}
              </span>
            </div>
            <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
              {pendingTasks?.map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-full bg-lightblue text-extra-blue flex items-center justify-center text-xs font-bold shrink-0">
                    {r.user.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-extra-darkblue truncate">
                      {r.user}
                    </p>
                    <p className="text-xs text-gray-400">
                      {r.requestedRole} · {r.project}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <a
                      href="/admin/document"
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Review
                    </a>
                  </div>
                </div>
              ))}
              {pendingTasks.length === 0 && (
                <p className="px-5 py-6 text-sm text-center text-gray-400">
                  No pending verifications.
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <Briefcase size={15} className="text-extra-blue" />
              <h3 className="text-sm font-bold text-extra-darkblue">
                Active Projects Tracker
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {activeProjectsList?.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-extra-darkblue">
                      {w.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {w.steps} engineers assigned
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${w.status === "initiated" ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}`}
                  >
                    {w.status.replace("-", " ")}
                  </span>
                </div>
              ))}
              {activeProjectsList.length === 0 && (
                <p className="px-5 py-6 text-sm text-center text-gray-400">
                  No active projects.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
