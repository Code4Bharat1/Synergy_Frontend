"use client";
import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  X,
  MessageSquare,
  RefreshCw,
  AlertCircle,
  User,
  Calendar,
  Wrench,
} from "lucide-react";
import axios from "@/lib/axios";

// ── Helpers ───────────────────────────────────────────────────────────────────
const TYPE_STYLES = {
  Mechanical: { badge: "bg-blue-50 text-blue-600", dot: "bg-blue-500" },
  "Fire Safety": { badge: "bg-red-50 text-red-600", dot: "bg-red-500" },
  Electrical: { badge: "bg-amber-50 text-amber-600", dot: "bg-amber-500" },
  Default: { badge: "bg-gray-100 text-gray-500", dot: "bg-gray-400" },
};

function getTypeStyle(type) {
  return TYPE_STYLES[type] || TYPE_STYLES.Default;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Skeleton Loader ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-100 rounded w-1/4" />
          <div className="h-4 bg-gray-100 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
        <div className="h-7 w-20 bg-gray-100 rounded-full" />
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ filter }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 py-16 text-center flex flex-col items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
        <FileText size={20} className="text-gray-300" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-400">No trials found</p>
        <p className="text-xs text-gray-300 mt-0.5">
          {filter === "all"
            ? "No trial QC records yet."
            : `No ${filter} trials at the moment.`}
        </p>
      </div>
    </div>
  );
}

// ── Error Banner ──────────────────────────────────────────────────────────────
function ErrorBanner({ message, onRetry }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
      <AlertCircle size={16} className="shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 text-xs font-semibold hover:underline"
        >
          <RefreshCw size={12} /> Retry
        </button>
      )}
    </div>
  );
}

// ── Reject Modal ──────────────────────────────────────────────────────────────
function RejectModal({ trial, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState("");
  const projectName = trial?.project?.name || trial?.project || "this trial";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-extra-darkblue">
            Reject Trial
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-gray-500">
          You are rejecting{" "}
          <span className="font-semibold text-extra-darkblue">
            {projectName}
          </span>
          . Please provide a reason.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="Reason for rejection…"
          className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none outline-none focus:border-medium-blue transition-colors bg-gray-50 text-extra-darkblue placeholder-gray-300"
        />
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason)}
            disabled={!reason.trim() || loading}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2
              ${reason.trim() && !loading ? "bg-red-500 text-white hover:bg-red-600" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}
          >
            {loading && <RefreshCw size={13} className="animate-spin" />}
            Confirm Reject
          </button>
        </div>
      </div>
    </div>
  );
}

// ── QC Checks Table ───────────────────────────────────────────────────────────
function QCChecksTable({ checks }) {
  if (!checks?.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        QC Checks
      </p>
      <div className="rounded-lg border border-gray-100 overflow-hidden">
        {checks?.map((c, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 px-3 py-2 text-xs ${i !== checks.length - 1 ? "border-b border-gray-50" : ""}`}
          >
            <span
              className={`mt-0.5 shrink-0 ${c.pass ? "text-green-500" : "text-red-400"}`}
            >
              {c.pass ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
            </span>
            <span className="flex-1 text-gray-600 font-medium">{c.item}</span>
            {c.remarks && (
              <span className="text-gray-400 italic">{c.remarks}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Trial Detail Fields ───────────────────────────────────────────────────────
function TrialDetailFields({ details }) {
  if (!details) return null;
  const fields = [
    ["Operator Present", details.operatorPresent],
    ["Client Representative", details.clientRepresentative],
    ["Water Flow Rate", details.waterFlowRate],
    ["Structural Load Test", details.structuralLoadTest],
    ["Safety System Test", details.safetySystemTest],
    ["Client Satisfaction", details.clientSatisfaction],
    ["Trial Outcome", details.trialOutcome],
  ].filter(([, v]) => v);

  if (!fields.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Trial Details
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {fields?.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-xs font-semibold text-gray-600">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Trial Card ────────────────────────────────────────────────────────────────
function TrialCard({ trial, onApprove, onReject, actionLoading }) {
  const [expanded, setExpanded] = useState(false);

  const status = trial.status;
  const isDecided = status !== "Pending";
  const projectName = trial.project?.name || "—";
  const siteName = trial.project?.location || "—";
  const inchargeName = trial.installationIncharge?.name || "—";
  const qcEngName = trial.qcEngineer?.name || "—";
  const typeStyle = getTypeStyle(trial.type);

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all duration-200
      ${status === "Approved" ? "border-green-200" : status === "Rejected" ? "border-red-200" : "border-gray-100"}`}
    >
      <div className="flex items-start gap-4 p-5">
        <div className="w-10 h-10 rounded-lg bg-lightblue text-extra-blue flex items-center justify-center shrink-0 mt-0.5">
          <FileText size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-extra-blue">
              {trial._id?.slice(-6).toUpperCase()}
            </span>
            {trial.type && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${typeStyle.badge}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${typeStyle.dot}`} />
                {trial.type}
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-extra-darkblue mt-1">
            {projectName}
          </h4>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            {siteName !== "—" && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Wrench size={10} /> {siteName}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <User size={10} /> {inchargeName}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar size={10} /> {formatDate(trial.trialDate)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {status === "Approved" && (
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-green-50 text-green-600">
              ✓ Approved
            </span>
          )}
          {status === "Rejected" && (
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-50 text-red-600">
              ✗ Rejected
            </span>
          )}
          {status === "Pending" && (
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
              Pending
            </span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-extra-blue transition-colors"
          >
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-4 space-y-4 border-t border-gray-50 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-400 mb-0.5">
                Installation Incharge
              </p>
              <p className="text-xs font-semibold text-gray-700">
                {inchargeName}
              </p>
              {trial.installationIncharge?.email && (
                <p className="text-xs text-gray-400">
                  {trial.installationIncharge.email}
                </p>
              )}
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-400 mb-0.5">QC Engineer</p>
              <p className="text-xs font-semibold text-gray-700">
                {qcEngName !== "—" ? qcEngName : "Not assigned"}
              </p>
              {trial.qcEngineer?.email && (
                <p className="text-xs text-gray-400">
                  {trial.qcEngineer.email}
                </p>
              )}
            </div>
          </div>
          <TrialDetailFields details={trial.trialDetails} />
          <QCChecksTable checks={trial.qcChecks} />
          {trial.remarks && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Remarks
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {trial.remarks}
              </p>
            </div>
          )}
          {status === "Approved" && trial.approvalRemarks && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-100">
              <MessageSquare
                size={13}
                className="text-green-400 mt-0.5 shrink-0"
              />
              <div>
                <p className="text-xs font-semibold text-green-600 mb-0.5">
                  Approval Remarks
                </p>
                <p className="text-xs text-green-700">
                  {trial.approvalRemarks}
                </p>
              </div>
            </div>
          )}
          {status === "Rejected" && trial.approvalRemarks && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
              <MessageSquare
                size={13}
                className="text-red-400 mt-0.5 shrink-0"
              />
              <div>
                <p className="text-xs font-semibold text-red-500 mb-0.5">
                  Rejection Reason
                </p>
                <p className="text-xs text-red-600">{trial.approvalRemarks}</p>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-3 pt-1">
            {trial.approvedAt && (
              <span className="text-xs text-gray-400">
                Approved at:{" "}
                <span className="font-medium">
                  {formatDate(trial.approvedAt)}
                </span>
              </span>
            )}
            {trial.rejectedAt && (
              <span className="text-xs text-gray-400">
                Rejected at:{" "}
                <span className="font-medium">
                  {formatDate(trial.rejectedAt)}
                </span>
              </span>
            )}
          </div>
        </div>
      )}

      {!isDecided && (
        <div className="flex gap-3 px-5 py-3.5 bg-gray-50 border-t border-gray-100 justify-end">
          <button
            onClick={() => onReject(trial)}
            disabled={actionLoading === trial._id}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {actionLoading === trial._id ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <XCircle size={14} />
            )}
            Reject
          </button>
          <button
            onClick={() => onApprove(trial)}
            disabled={actionLoading === trial._id}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-green-600 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50"
          >
            {actionLoading === trial._id ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <CheckCircle2 size={14} />
            )}
            Approve
          </button>
        </div>
      )}
    </div>
  );
}

// ── Filter Tabs ───────────────────────────────────────────────────────────────
function FilterTabs({ active, onChange, counts }) {
  const tabs = [
    { key: "all", label: "All" },
    { key: "Pending", label: "Pending" },
    { key: "Approved", label: "Approved" },
    { key: "Rejected", label: "Rejected" },
  ];
  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
      {tabs?.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5
            ${active === t.key ? "bg-white text-extra-darkblue shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          {t.label}
          {counts[t.key] > 0 && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-bold
              ${active === t.key ? "bg-lightblue text-extra-blue" : "bg-gray-200 text-gray-500"}`}
            >
              {counts[t.key]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Clickable Stat Card ───────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, cls, loading, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border shadow-sm p-4 flex items-center gap-3 cursor-pointer
        transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]
        ${
          active
            ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200"
            : "bg-white border-gray-100 hover:border-blue-200"
        }`}
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cls}`}
      >
        <Icon size={17} />
      </div>
      <div>
        <p className="text-xl font-bold text-extra-darkblue">
          {loading ? "—" : value}
        </p>
        <p className="text-xs text-gray-400">{label}</p>
        {active && (
          <p className="text-[10px] text-blue-500 font-semibold mt-0.5">
            ● Filtering
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TrialApproval() {
  const [trials, setTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [rejectingTrial, setRejectingTrial] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchTrials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/trial-qc/list");
      setTrials(res.data.data || []);
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to load trials",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrials();
  }, [fetchTrials]);

  // ── Approve ───────────────────────────────────────────────────────────────
  const handleApprove = async (trial) => {
    setActionLoading(trial._id);
    setActionError(null);
    try {
      const res = await axios.patch(`/trial-qc/update/${trial._id}`, {
        status: "Approved",
      });
      setTrials((prev) =>
        prev?.map((t) => (t._id === trial._id ? res.data.data : t)),
      );
    } catch (err) {
      setActionError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to approve trial",
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ── Reject ────────────────────────────────────────────────────────────────
  const handleReject = (trial) => {
    setRejectingTrial(trial);
    setActionError(null);
  };

  const confirmReject = async (reason) => {
    setModalLoading(true);
    setActionError(null);
    try {
      const res = await axios.patch(`/trial-qc/update/${rejectingTrial._id}`, {
        status: "Rejected",
        approvalRemarks: reason,
      });
      setTrials((prev) =>
        prev?.map((t) => (t._id === rejectingTrial._id ? res.data.data : t)),
      );
      setRejectingTrial(null);
    } catch (err) {
      setActionError(
        err?.response?.data?.message || err.message || "Failed to reject trial",
      );
    } finally {
      setModalLoading(false);
    }
  };

  // ── Counts ────────────────────────────────────────────────────────────────
  const counts = {
    all: trials.length,
    Pending: trials.filter((t) => t.status === "Pending").length,
    Approved: trials.filter((t) => t.status === "Approved").length,
    Rejected: trials.filter((t) => t.status === "Rejected").length,
  };

  // ── Card click — clicking active card resets to "all" ─────────────────────
  const handleCardClick = (key) => {
    setFilter((prev) => (prev === key ? "all" : key));
  };

  const filtered =
    filter === "all" ? trials : trials.filter((t) => t.status === filter);

  return (
    <div className="space-y-5">
      {rejectingTrial && (
        <RejectModal
          trial={rejectingTrial}
          onConfirm={confirmReject}
          onCancel={() => setRejectingTrial(null)}
          loading={modalLoading}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-extra-darkblue">
            Trial Approval
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Review and approve or reject submitted trials
          </p>
        </div>
        <button
          onClick={fetchTrials}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-extra-blue transition-colors disabled:opacity-40"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ── Clickable Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Total Trials"
          value={counts.all}
          icon={FileText}
          cls="bg-lightblue text-extra-blue"
          loading={loading}
          active={filter === "all"}
          onClick={() => handleCardClick("all")}
        />
        <StatCard
          label="Pending"
          value={counts.Pending}
          icon={Clock}
          cls="bg-amber-50 text-amber-600"
          loading={loading}
          active={filter === "Pending"}
          onClick={() => handleCardClick("Pending")}
        />
        <StatCard
          label="Approved"
          value={counts.Approved}
          icon={CheckCircle2}
          cls="bg-green-50 text-green-600"
          loading={loading}
          active={filter === "Approved"}
          onClick={() => handleCardClick("Approved")}
        />
        <StatCard
          label="Rejected"
          value={counts.Rejected}
          icon={XCircle}
          cls="bg-red-50 text-red-500"
          loading={loading}
          active={filter === "Rejected"}
          onClick={() => handleCardClick("Rejected")}
        />
      </div>

      {/* Filter Tabs — stays in sync with card clicks */}
      <FilterTabs active={filter} onChange={setFilter} counts={counts} />

      {/* Errors */}
      {(error || actionError) && (
        <ErrorBanner
          message={error || actionError}
          onRetry={error ? fetchTrials : undefined}
        />
      )}

      {/* Trial Cards */}
      <div className="space-y-3">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          filtered?.map((t) => (
            <TrialCard
              key={t._id}
              trial={t}
              onApprove={handleApprove}
              onReject={handleReject}
              actionLoading={actionLoading}
            />
          ))
        )}
      </div>
    </div>
  );
}
