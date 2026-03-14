"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { switchRole, restoreRole } from "@/services/auth.service";

import {
  FolderKanban, AlertTriangle, Clock, Users, FileText,
  RefreshCw, Loader2, TrendingUp, CheckCircle2, BarChart3,
  Activity, ChevronRight, Calendar
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";
import axiosInstance from "../../lib/axios";


// ── API Helper ────────────────────────────────────────────────────────────────
const apiFetch = async (path) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const res = await axiosInstance({ method: "GET", url: path, headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return res.data;
};

const safeArray = (data, key) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data[key])) return data[key];
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

// ── Color Tokens ──────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  "initiated": "#6366f1",
  "in-progress": "#3b82f6",
  "installation": "#f59e0b",
  "testing": "#8b5cf6",
  "completed": "#10b981",
  "on-hold": "#ef4444",
};

const PRIORITY_COLORS = {
  low: "#94a3b8",
  medium: "#3b82f6",
  high: "#f59e0b",
  critical: "#ef4444",
};

const PHASE_COLORS = {
  "Site Preparation": "#6366f1",
  "Wiring & Plumbing": "#3b82f6",
  "Equipment Setup": "#f59e0b",
  "Installation": "#8b5cf6",
  "Final Testing": "#10b981",
  "Completed": "#22c55e",
};

const TRIAL_COLORS = {
  "Not Started": "#94a3b8",
  "Scheduled": "#3b82f6",
  "In Trial": "#f59e0b",
  "Completed": "#10b981",
};

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2">
      <p className="text-xs font-bold text-gray-800">{payload[0].name}</p>
      <p className="text-xs text-gray-500">Count: <span className="font-bold text-extra-darkblue">{payload[0].value}</span></p>
    </div>
  );
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPICard({ label, value, icon: Icon, color, sub, loading, href, router }) {
  return (
    <div
      onClick={() => href && router && router.push(href)}
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-all ${href ? "cursor-pointer hover:border-blue-200 hover:scale-[1.02] active:scale-[0.98]" : ""}`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        {loading ? (
          <div className="h-7 w-12 bg-gray-100 rounded animate-pulse mb-1" />
        ) : (
          <p className="text-2xl font-bold text-extra-darkblue">{value}</p>
        )}
        <p className="text-sm font-medium text-gray-600 mt-0.5 leading-tight">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      {href && <ChevronRight size={16} className="text-gray-300 mt-1 shrink-0" />}
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, iconColor, title, sub }) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
      <Icon size={15} className={iconColor} />
      <div>
        <h3 className="text-sm font-bold text-extra-darkblue leading-tight">{title}</h3>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

// ── Donut Chart Panel ─────────────────────────────────────────────────────────
function DonutPanel({ title, sub, icon, iconColor, data, note, href, router }) {
  const hasData = data.some(d => d.value > 0);
  const RADIAN = Math.PI / 180;
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, name }) => {
    if (value === 0) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">{value}</text>
    );
  };

  return (
    <div
      onClick={() => href && router && router.push(href)}
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all ${href ? "cursor-pointer hover:border-blue-200 hover:shadow-md" : ""}`}
    >
      <SectionHeader icon={icon} iconColor={iconColor} title={title} sub={sub} />
      <div className="p-5">
        {!hasData ? (
          <div className="py-8 text-center text-gray-300 text-sm">No data available</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}
                  dataKey="value" labelLine={false} label={renderLabel}>
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
              {data.filter(d => d.value > 0).map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-xs text-gray-600 capitalize">{d.name}</span>
                  <span className="text-xs font-bold text-extra-darkblue">{d.value}</span>
                </div>
              ))}
            </div>
            {note && (
              <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50 italic">{note}</p>
            )}
          </>
        )}
      </div>
      {href && (
        <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/40 flex items-center justify-end">
          <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">View Details <ChevronRight size={12} /></span>
        </div>
      )}
    </div>
  );
}

// ── Bar Chart Panel ───────────────────────────────────────────────────────────
function BarPanel({ title, sub, icon, iconColor, data, colors, note, href, router }) {
  return (
    <div
      onClick={() => href && router && router.push(href)}
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all ${href ? "cursor-pointer hover:border-blue-200 hover:shadow-md" : ""}`}
    >
      <SectionHeader icon={icon} iconColor={iconColor} title={title} sub={sub} />
      <div className="p-5">
        {!data.some(d => d.value > 0) ? (
          <div className="py-8 text-center text-gray-300 text-sm">No data available</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {data.map((entry, i) => (
                    <Cell key={entry.name} fill={colors[entry.name] || "#3b82f6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {note && <p className="text-xs text-gray-400 mt-2 italic">{note}</p>}
          </>
        )}
      </div>
      {href && (
        <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/40 flex items-center justify-end">
          <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">View Details <ChevronRight size={12} /></span>
        </div>
      )}
    </div>
  );
}

// ── Phase Progress Panel ──────────────────────────────────────────────────────
function PhaseProgressPanel({ projects, href, router }) {
  const phaseCounts = {};
  const phaseOrder = ["Site Preparation", "Wiring & Plumbing", "Equipment Setup", "Installation", "Final Testing", "Completed"];
  phaseOrder.forEach(p => { phaseCounts[p] = 0; });
  projects.filter(p => p.status !== "completed").forEach(p => {
    if (p.phase && phaseCounts[p.phase] !== undefined) phaseCounts[p.phase]++;
  });
  const total = projects.filter(p => p.status !== "completed").length || 1;

  return (
    <div
      onClick={() => href && router && router.push(href)}
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all ${href ? "cursor-pointer hover:border-blue-200 hover:shadow-md" : ""}`}
    >
      <SectionHeader
        icon={Activity}
        iconColor="text-indigo-500"
        title="Active Projects by Phase"
        sub="Based on project.phase field — active projects only (excludes completed)"
      />
      <div className="p-5 space-y-3">
        {phaseOrder.map(phase => {
          const count = phaseCounts[phase];
          const pct = Math.round((count / total) * 100);
          const color = PHASE_COLORS[phase] || "#94a3b8";
          return (
            <div key={phase}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-600">{phase}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-extra-darkblue">{count}</span>
                  <span className="text-xs text-gray-400">{pct}%</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
            </div>
          );
        })}
        <p className="text-xs text-gray-400 pt-2 border-t border-gray-50 italic">
          Metric: count of active projects per phase enum value from <code className="bg-gray-50 px-1 rounded">project.phase</code>
        </p>
      </div>
      {href && (
        <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/40 flex items-center justify-end">
          <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">View Projects <ChevronRight size={12} /></span>
        </div>
      )}
    </div>
  );
}

// ── Trial Status Panel ────────────────────────────────────────────────────────
function TrialStatusPanel({ projects, href, router }) {
  const trialCounts = { "Not Started": 0, "Scheduled": 0, "In Trial": 0, "Completed": 0 };
  projects.forEach(p => {
    if (p.trialStatus && trialCounts[p.trialStatus] !== undefined) trialCounts[p.trialStatus]++;
  });
  return (
    <div
      onClick={() => href && router && router.push(href)}
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all ${href ? "cursor-pointer hover:border-blue-200 hover:shadow-md" : ""}`}
    >
      <SectionHeader
        icon={CheckCircle2}
        iconColor="text-emerald-500"
        title="Trial Run Status"
        sub="Based on project.trialStatus field — across all projects"
      />
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(trialCounts).map(([status, count]) => (
            <div key={status} className="rounded-xl p-3 border border-gray-100 bg-gray-50 flex items-center gap-3 hover:bg-blue-50/50 transition-colors">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: TRIAL_COLORS[status] }} />
              <div>
                <p className="text-lg font-bold text-extra-darkblue">{count}</p>
                <p className="text-xs text-gray-500">{status}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50 italic">
          Metric: count per <code className="bg-gray-50 px-1 rounded">project.trialStatus</code> enum value
        </p>
      </div>
      {href && (
        <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/40 flex items-center justify-end">
          <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">View Projects <ChevronRight size={12} /></span>
        </div>
      )}
    </div>
  );
}

// ── Pending Documents Panel ───────────────────────────────────────────────────
function PendingDocsPanel({ documents }) {
  const pending = documents
    .filter(d => d.status === "pending")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  const DOC_TYPE_COLOR = {
    qc: "bg-purple-50 text-purple-600",
    installation: "bg-blue-50 text-blue-600",
    "daily-report": "bg-amber-50 text-amber-600",
    "trail-qc": "bg-red-50 text-red-500",
    reference: "bg-gray-100 text-gray-500",
    other: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <SectionHeader
        icon={FileText}
        iconColor="text-orange-500"
        title="Pending Document Approvals"
        sub={`${documents.filter(d => d.status === 'pending').length} total awaiting review — sorted by upload date`}
      />
      <div className="divide-y divide-gray-50">
        {pending.length === 0 ? (
          <p className="px-5 py-8 text-sm text-gray-400 text-center">No pending documents.</p>
        ) : (
          pending.map(doc => (
            <div key={doc._id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-extra-darkblue truncate">{doc.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DOC_TYPE_COLOR[doc.documentType] || DOC_TYPE_COLOR.other}`}>
                    {doc.documentType}
                  </span>
                  <span className="text-xs text-gray-400">{doc.project?.name || "No project"}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-400">By {doc.uploadedBy?.name || "Unknown"}</p>
                <p className="text-xs text-gray-300">{new Date(doc.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
      {pending.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-50">
          <a href="/director/approval" className="text-xs font-semibold text-extra-blue hover:underline flex items-center gap-1">
            Review all approvals <ChevronRight size={12} />
          </a>
        </div>
      )}
      <div className="px-5 py-2.5 border-t border-gray-50 bg-gray-50/40">
        <p className="text-xs text-gray-400 italic">
          Metric: <code className="bg-white px-1 rounded">document.status === &quot;pending&quot;</code> from <code className="bg-white px-1 rounded">GET /documents</code>
        </p>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DirectorDashboard() {
  const router = useRouter();
  const { user, switchUserRole, restoreUserRole } = useAuth();
  const [projects, setProjects] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [pRes, cRes, dRes, uRes] = await Promise.all([
        apiFetch("/projects"),
        apiFetch("/complaints"),
        apiFetch("/documents"),
        apiFetch("/admin/users"),
      ]);
      setProjects(safeArray(pRes, "projects"));
      setComplaints(safeArray(cRes, "complaints"));
      setDocuments(safeArray(dRes, "documents"));
      setUsers(safeArray(uRes, "users"));
    } catch (err) {
      console.error("Dashboard load error:", err);
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

  /* ---------------- SWITCH ROLE ---------------- */
  const handleSwitchRole = async (role) => {
    try {
      const res = await switchRole(role);

      // store new access token with switched role
      localStorage.setItem("accessToken", res.accessToken);

      // update React context and user object in localStorage
      switchUserRole(role, res.user?.originalRole || "director");

      // redirect to selected role dashboard
      window.location.href = `/${role === 'installationIncharge' ? 'installationIncharge' : role}`;

    } catch (err) {
      console.error("Switch role error:", err);
    }
  };


  /* ---------------- RESTORE ROLE ---------------- */
  const handleBackToDirector = async () => {
    try {
      const res = await restoreRole();

      // restore director token
      localStorage.setItem("accessToken", res.accessToken);

      // restore user state to director
      restoreUserRole();

      // redirect to director dashboard
      window.location.href = "/director";

    } catch (err) {
      console.error("Restore role error:", err);
    }
  };

  // ── KPI Derivations (all annotated) ─────────────────────────────────────────
  // projects.filter(p => p.status !== "completed")  →  active projects
  const activeProjects = projects.filter(p => p.status !== "completed");
  // complaints where status = "open" or "in-progress"
  const activeComplaints = complaints.filter(c => c.status === "open" || c.status === "in-progress");
  // documents where status = "pending"
  const pendingDocs = documents.filter(d => d.status === "pending");
  // users where status = "active"
  const activeUsers = users.filter(u => u.status === "active");

  // ── Project Status Donut data (from project.status enum) ─────────────────────
  const projectStatusData = Object.entries(STATUS_COLORS).map(([s, color]) => ({
    name: s, value: projects.filter(p => p.status === s).length, color,
  }));

  // ── Complaint Priority Bar data (from complaint.priority enum) ───────────────
  const complaintPriorityData = ["low", "medium", "high", "critical"].map(p => ({
    name: p.charAt(0).toUpperCase() + p.slice(1),
    value: complaints.filter(c => c.priority === p).length,
    color: PRIORITY_COLORS[p],
  }));

  const complaintPriorityColors = {
    Low: PRIORITY_COLORS.low,
    Medium: PRIORITY_COLORS.medium,
    High: PRIORITY_COLORS.high,
    Critical: PRIORITY_COLORS.critical,
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
      <Loader2 size={20} className="animate-spin" />
      <span className="text-sm font-medium">Loading Director Analytics…</span>
    </div>
  );

  return (
    <div className="space-y-6">


      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">

        <div>
          <h2 className="text-xl font-bold text-extra-darkblue">
            Director Dashboard
          </h2>

          <p className="text-sm text-gray-400 mt-0.5">
            Live analytics from all projects, complaints & documents
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

      </div>

      {/* ── KPI Row ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Active Projects"
          value={activeProjects.length}
          icon={FolderKanban}
          color="bg-blue-50 text-blue-600"
          loading={loading}
          href="/director/project"
          router={router}
        />
        <KPICard
          label="Active Complaints"
          value={activeComplaints.length}
          icon={AlertTriangle}
          color="bg-amber-50 text-amber-600"
          loading={loading}
          href="/director/complaint"
          router={router}
        />
        <KPICard
          label="Pending Documents"
          value={pendingDocs.length}
          icon={Clock}
          color="bg-orange-50 text-orange-500"
          loading={loading}
          href="/director/approval"
          router={router}
        />
        <KPICard
          label="Active Team Members"
          value={activeUsers.length}
          icon={Users}
          color="bg-emerald-50 text-emerald-600"
          loading={loading}
          href="/director/performance"
          router={router}
        />
      </div>

      {/* ── Charts Row 1 ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DonutPanel
          title="Project Status Distribution"
          sub="Source: project.status enum — all projects"
          icon={FolderKanban}
          iconColor="text-blue-500"
          data={projectStatusData}
          note="Metric: count of projects per status enum value from GET /projects"
          href="/director/project"
          router={router}
        />
        <BarPanel
          title="Complaint Priority Breakdown"
          sub="Source: complaint.priority enum — all complaints on record"
          icon={AlertTriangle}
          iconColor="text-amber-500"
          data={complaintPriorityData}
          colors={complaintPriorityColors}
          note="Metric: count per priority level from GET /complaints"
          href="/director/complaint"
          router={router}
        />
      </div>

      {/* ── Charts Row 2 ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PhaseProgressPanel projects={projects} href="/director/project" router={router} />
        <TrialStatusPanel projects={projects} href="/director/project" router={router} />
      </div>

      {/* ── Pending Documents ─────────────────────────────────────────────────── */}
      <PendingDocsPanel documents={documents} />

    </div>
  );
}
