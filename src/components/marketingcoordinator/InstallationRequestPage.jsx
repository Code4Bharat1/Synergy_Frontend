"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import {
  Send,
  User,
  Calendar,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Flag,
  ChevronDown,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;
const getToken = () => localStorage.getItem("accessToken");

// Axios instance with auth header
const api = axios.create({ baseURL: API });
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const PRIORITY_OPTS = [
  {
    value: "Low",
    label: "Low",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    activeBg: "bg-emerald-600",
    activeText: "text-white",
    activeBorder: "border-emerald-600",
  },
  {
    value: "Medium",
    label: "Medium",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
    activeBg: "bg-amber-500",
    activeText: "text-white",
    activeBorder: "border-amber-500",
  },
  {
    value: "High",
    label: "High",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    dot: "bg-orange-500",
    activeBg: "bg-orange-600",
    activeText: "text-white",
    activeBorder: "border-orange-600",
  },
  {
    value: "Critical",
    label: "Critical",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-600",
    activeBg: "bg-red-600",
    activeText: "text-white",
    activeBorder: "border-red-600",
  },
];

const reqStatusStyle = {
  Sent: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  Accepted: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  Pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  Rejected: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  Completed: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
};

const EMPTY_FORM = {
  project: "",
  engineer: null,
  priority: "Medium",
  requestedDate: "",
  estimatedDays: "",
  subject: "",
  message: "",
  notifyEmail: true,
  notifyInApp: true,
};

// ── Reusable field label ────────────────────────────────────────────────
function FieldLabel({ children, required }) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-[0.7px] text-slate-500 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

// ── Section card ────────────────────────────────────────────────────────
function SectionCard({ icon: Icon, title, badge, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <Icon size={13} className="text-white" strokeWidth={2} />
          </div>
          <span className="text-[13px] font-semibold text-slate-800 tracking-tight">
            {title}
          </span>
        </div>
        {badge && (
          <span className="text-[11px] font-medium text-slate-400">{badge}</span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function InstallationRequestPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, accepted: 0, pending: 0 });

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const selectedPriority = PRIORITY_OPTS.find((p) => p.value === form.priority);
  const selectedProject = projects.find((p) => p._id === form.project);
  const canSubmit =
    form.project && form.engineer && form.subject && form.requestedDate;

  // ── Fetch projects ────────────────────────────────────────────────────
  useEffect(() => {
    api
      .get("/projects")
      .then((res) => {
        const data = res.data?.data || res.data?.projects || res.data;
        if (Array.isArray(data)) setProjects(data);
      })
      .catch(console.error);
  }, []);

  // ── Fetch engineers ───────────────────────────────────────────────────
  useEffect(() => {
    api
      .get("/admin/incharges")
      .then((res) => {
        if (res.data) setEngineers(res.data);
      })
      .catch(console.error);
  }, []);

  // ── Fetch recent requests ─────────────────────────────────────────────
  const fetchRequests = () => {
    api
      .get("/installation-requests/list")
      .then((res) => {
        if (res.data?.data) {
          const all = res.data.data;
          setRecentRequests(all.slice(0, 3));
          setStats({
            total: all.length,
            accepted: all.filter((r) => r.status === "Accepted").length,
            pending: all.filter(
              (r) => r.status === "Sent" || r.status === "Pending",
            ).length,
          });
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const body = {
        project: form.project,
        engineer: form.engineer._id,
        priority: form.priority,
        requestedDate: form.requestedDate,
        subject: form.subject,
        ...(form.estimatedDays && { duration: Number(form.estimatedDays) }),
        ...(form.message && { message: form.message }),
      };
      await api.post("/installation-requests/create", body);
      fetchRequests();
      setSubmitted(true);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────
  if (submitted)
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-5">
          <CheckCircle size={26} className="text-emerald-600" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-1 tracking-tight">
          Request Submitted
        </h2>
        <p className="text-slate-500 text-[13px] mb-7 text-center max-w-xs leading-relaxed">
          Installation request sent to{" "}
          <span className="font-semibold text-slate-700">{form.engineer?.name}</span>{" "}
          for{" "}
          <span className="font-semibold text-slate-700">{selectedProject?.name}</span>.
        </p>

        {/* Summary table */}
        <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl overflow-hidden mb-6">
          {[
            ["Project", selectedProject?.name || "—"],
            ["Engineer", form.engineer?.name || "—"],
            ["Priority", form.priority],
            ["Requested Date", form.requestedDate],
          ].map(([k, v], i, arr) => (
            <div
              key={k}
              className={`flex justify-between items-center px-4 py-3 text-[13px] ${
                i !== arr.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              <span className="text-slate-500">{k}</span>
              <span className="text-slate-800 font-semibold">{v}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            setSubmitted(false);
            setForm(EMPTY_FORM);
          }}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-slate-700 transition-colors"
        >
          New Request
        </button>
      </div>
    );

  // ── Main form ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1200px] mx-auto">
      {/* ── Page header ── */}
      <div className="mb-7 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
              Marketing
            </span>
            <span className="text-slate-200">/</span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
              Installation
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Installation Request
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Send a formal installation request to the assigned engineer in-charge
          </p>
        </div>

        {/* Quick stat chips */}
        <div className="hidden sm:flex items-center gap-2">
          {[
            { label: "Total", value: stats.total, color: "text-slate-700" },
            { label: "Accepted", value: stats.accepted, color: "text-emerald-600" },
            { label: "Pending", value: stats.pending, color: "text-amber-600" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-center min-w-[68px]"
            >
              <div className={`text-[18px] font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wide">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        {/* ── Left: Form ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Request Details */}
          <SectionCard icon={Send} title="Request Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Project */}
              <div>
                <FieldLabel required>Project</FieldLabel>
                <div className="relative">
                  <select
                    value={form.project}
                    onChange={(e) => upd("project", e.target.value)}
                    className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-[13px] text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all cursor-pointer pr-9"
                  >
                    <option value="">Select project…</option>
                    {projects?.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* Requested Date */}
              <div>
                <FieldLabel required>Requested Start Date</FieldLabel>
                <input
                  type="date"
                  value={form.requestedDate}
                  onChange={(e) => upd("requestedDate", e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-[13px] text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
                />
              </div>

              {/* Duration */}
              <div>
                <FieldLabel>Est. Duration (days)</FieldLabel>
                <input
                  type="number"
                  min={1}
                  value={form.estimatedDays}
                  onChange={(e) => upd("estimatedDays", e.target.value)}
                  placeholder="e.g. 14"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-[13px] text-slate-800 outline-none placeholder-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
                />
              </div>

              {/* Priority */}
              <div>
                <FieldLabel>Priority Level</FieldLabel>
                <div className="grid grid-cols-4 gap-1.5">
                  {PRIORITY_OPTS?.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => upd("priority", p.value)}
                      className={[
                        "rounded-lg py-2 text-[11px] font-semibold border transition-all",
                        form.priority === p.value
                          ? `${p.activeBg} ${p.activeText} ${p.activeBorder}`
                          : `bg-white ${p.color} border-slate-200 hover:${p.bg} hover:${p.border}`,
                      ].join(" ")}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Priority notice */}
            {selectedPriority && form.priority !== "Low" && (
              <div
                className={`rounded-lg border ${selectedPriority.border} ${selectedPriority.bg} px-3.5 py-2.5 flex items-center gap-2.5`}
              >
                <AlertTriangle size={13} className={selectedPriority.color} />
                <span className={`text-[12px] font-medium ${selectedPriority.color}`}>
                  {form.priority === "Critical"
                    ? "Critical — Engineer will be notified immediately"
                    : form.priority === "High"
                      ? "High priority — Prompt response expected"
                      : "Medium priority — Standard processing time applies"}
                </span>
              </div>
            )}
          </SectionCard>

          {/* Assign Engineer */}
          <SectionCard
            icon={User}
            title="Installation In-charge"
            badge={engineers.length > 0 ? `${engineers.length} available` : undefined}
          >
            {engineers.length === 0 ? (
              <div className="flex items-center gap-2.5 py-2 text-slate-400 text-[13px]">
                <span className="w-4 h-4 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
                Loading engineers…
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {engineers?.map((eng) => {
                  const isSelected = form.engineer?._id === eng._id;
                  const initials =
                    eng.name
                      ?.split(" ")
                      ?.map((w) => w[0])
                      .join("") || "?";
                  return (
                    <button
                      key={eng._id}
                      onClick={() => upd("engineer", eng)}
                      className={[
                        "rounded-xl p-3.5 text-left border transition-all",
                        isSelected
                          ? "border-slate-900 bg-slate-900"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <div
                          className={[
                            "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
                            isSelected
                              ? "bg-white/15 text-white"
                              : "bg-slate-100 text-slate-600",
                          ].join(" ")}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div
                            className={`text-[12px] font-semibold truncate ${
                              isSelected ? "text-white" : "text-slate-800"
                            }`}
                          >
                            {eng.name}
                          </div>
                          <div
                            className={`text-[10px] truncate ${
                              isSelected ? "text-slate-300" : "text-slate-400"
                            }`}
                          >
                            {eng.email}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`text-[10px] flex items-center gap-1 ${
                          isSelected ? "text-slate-300" : "text-slate-400"
                        }`}
                      >
                        <MapPin size={10} />
                        {eng.site || eng.department || "—"}
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-1 text-emerald-300 text-[10px] font-semibold mt-2">
                          <CheckCircle size={10} /> Selected
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* Message */}
          <SectionCard icon={MessageSquare} title="Request Message">
            <div className="space-y-3.5">
              <div>
                <FieldLabel required>Subject</FieldLabel>
                <input
                  value={form.subject}
                  onChange={(e) => upd("subject", e.target.value)}
                  placeholder="e.g. Installation kick-off for Wave Pool — AquaPark Dubai"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-[13px] text-slate-800 outline-none placeholder-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
                />
              </div>
              <div>
                <FieldLabel>Message Body</FieldLabel>
                <textarea
                  rows={5}
                  value={form.message}
                  onChange={(e) => upd("message", e.target.value)}
                  placeholder="Describe scope of work, special conditions, access requirements, materials on-site…"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-[13px] text-slate-800 outline-none resize-none placeholder-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
                />
              </div>
            </div>
          </SectionCard>

          {/* Notification Preferences */}
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4">
            <div className="text-[12px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
              Notification Preferences
            </div>
            <div className="space-y-0.5">
              {[
                {
                  key: "notifyEmail",
                  label: "Email notification to engineer",
                  sub: "Sends request via email",
                },
                {
                  key: "notifyInApp",
                  label: "In-app notification",
                  sub: "Push alert in Synergy app",
                },
              ]?.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <div className="text-[13px] font-medium text-slate-700">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-400">{item.sub}</div>
                  </div>
                  <button
                    onClick={() => upd(item.key, !form[item.key])}
                    className={[
                      "relative w-9 h-5 rounded-full transition-colors shrink-0",
                      form[item.key] ? "bg-slate-900" : "bg-slate-200",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                        form[item.key] ? "left-4" : "left-0.5",
                      ].join(" ")}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600 font-medium flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Submit bar */}
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-[13px] font-semibold text-slate-800">
                Send Installation Request
              </div>
              <div className="text-[12px] text-slate-400 mt-0.5">
                To:{" "}
                <span className="text-slate-600">
                  {form.engineer?.name || "no engineer selected"}
                </span>{" "}
                ·{" "}
                <span className="text-slate-600">
                  {selectedProject?.name || "no project selected"}
                </span>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className="rounded-lg bg-slate-900 text-white px-5 py-2.5 text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors flex items-center gap-2 shrink-0"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send size={13} />
                  Send Request
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Right: Recent Requests ──────────────────────────────────── */}
        <div>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden xl:sticky xl:top-6">
            {/* Header */}
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
              <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                <Clock size={13} className="text-white" strokeWidth={2} />
              </div>
              <span className="text-[13px] font-semibold text-slate-800 tracking-tight">
                Recent Requests
              </span>
            </div>

            <div className="p-4 space-y-2.5">
              {recentRequests.length === 0 ? (
                <p className="text-slate-400 text-[13px] py-2">No requests yet.</p>
              ) : (
                recentRequests?.map((req) => {
                  const s = reqStatusStyle[req.status] || reqStatusStyle.Sent;
                  const p = PRIORITY_OPTS.find((x) => x.value === req.priority);
                  const dateLabel = new Date(
                    req.requestedDate,
                  ).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  });
                  return (
                    <div
                      key={req._id}
                      className="rounded-lg border border-slate-100 bg-slate-50 p-3.5"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                            #{req._id.slice(-6).toUpperCase()}
                          </span>
                          <div className="text-slate-800 text-[12px] font-semibold mt-0.5">
                            {req.project?.name || "—"}
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${s.bg} ${s.text} border ${s.border} whitespace-nowrap`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {req.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <User size={11} />
                          {req.engineer?.name || "—"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {dateLabel}
                        </span>
                        <span
                          className={`flex items-center gap-1 font-semibold ${p?.color || "text-slate-400"}`}
                        >
                          <Flag size={11} />
                          {req.priority}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Stats row */}
            <div className="border-t border-slate-100 grid grid-cols-3">
              {[
                { label: "Total", value: stats.total, color: "text-slate-800" },
                { label: "Accepted", value: stats.accepted, color: "text-emerald-600" },
                { label: "Pending", value: stats.pending, color: "text-amber-600" },
              ]?.map((s, i, arr) => (
                <div
                  key={s.label}
                  className={`py-3.5 text-center ${i !== arr.length - 1 ? "border-r border-slate-100" : ""}`}
                >
                  <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wide">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
