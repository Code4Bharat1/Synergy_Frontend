"use client";
import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  Loader2,
  RefreshCw,
} from "lucide-react";
import axiosInstance from "@/lib/axios";

const DEFAULT_QC_CHECKS = [
  {
    id: "qc-1",
    category: "Safety",
    item: "Site safety measures verified",
    critical: true,
  },
  {
    id: "qc-2",
    category: "Documentation",
    item: "Material specifications match approved drawings",
    critical: true,
  },
  {
    id: "qc-3",
    category: "Quality",
    item: "Workmanship quality meets standard",
    critical: false,
  },
  {
    id: "qc-4",
    category: "Dimensions",
    item: "As-built dimensions within tolerance",
    critical: true,
  },
  {
    id: "qc-5",
    category: "Structural",
    item: "All connections and fixings secure",
    critical: true,
  },
  {
    id: "qc-6",
    category: "Snag",
    item: "Previous snag items resolved",
    critical: false,
  },
  {
    id: "qc-7",
    category: "Safety",
    item: "Protective measures in place",
    critical: false,
  },
  {
    id: "qc-8",
    category: "Documentation",
    item: "Documentation complete and signed",
    critical: false,
  },
];

const PRIORITY_STYLES = {
  High: "bg-red-50 text-red-600",
  Medium: "bg-amber-50 text-amber-600",
  Low: "bg-green-50 text-green-600",
};

const freshChecks = () =>
  DEFAULT_QC_CHECKS?.map((c) => ({ ...c, state: null }));

// Merge saved qcChecks states back into DEFAULT_QC_CHECKS structure
const mergeChecks = (savedChecks) => {
  return DEFAULT_QC_CHECKS?.map((def) => {
    const saved = savedChecks?.find((s) => s.id === def.id);
    return { ...def, state: saved ? (saved.state ?? null) : null };
  });
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

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-blue-950">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ProjectSelector({ selected, setSelected, projects, loading }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <div
        onClick={() => !loading && setOpen(!open)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white text-sm font-medium text-blue-950 hover:border-blue-400 transition-colors select-none ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span className="truncate">
          {loading
            ? "Loading projects…"
            : selected
              ? `${selected.projectId || selected._id.slice(-6).toUpperCase()} ${selected.name}`
              : "Select a project…"}
        </span>
        {loading ? (
          <Loader2 size={15} className="animate-spin text-gray-400 shrink-0" />
        ) : (
          <ChevronDown
            size={15}
            className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </div>

      {open && projects.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden text-sm max-h-60 overflow-y-auto">
          {projects?.map((p) => (
            <li key={p._id}>
              <button
                onClick={() => {
                  setSelected(p);
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <span className="font-mono text-xs text-blue-500 font-semibold mr-2">
                  {p.projectId || p._id.slice(-6).toUpperCase()}
                </span>
                <span className="text-blue-950 font-medium">{p.name}</span>
                <span className="text-gray-400 ml-2 text-xs">
                  {p.clientName}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProjectDetails({ proj }) {
  const incharge =
    proj.assignedInstallationIncharge?.name ||
    proj.assignedEngineers?.[0]?.name ||
    "Unassigned";
  const fields = [
    {
      label: "Project ID",
      value: proj.projectId || proj._id.slice(-6).toUpperCase(),
    },
    { label: "Client", value: proj.clientName },
    { label: "Assigned To", value: incharge },
    { label: "Location", value: proj.location || "—" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 rounded-lg bg-blue-50/40 border border-blue-100">
      {fields?.map((f) => (
        <div key={f.label}>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
            {f.label}
          </p>
          <p className="text-sm font-semibold text-blue-950 mt-0.5">
            {f.value}
          </p>
        </div>
      ))}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
          Priority
        </p>
        <span
          className={`inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${PRIORITY_STYLES[priorityFromStatus(proj.status)]}`}
        >
          {priorityFromStatus(proj.status)}
        </span>
      </div>
    </div>
  );
}

function ChecklistPanel({ checks, onToggle }) {
  const done = checks.filter((c) => c.state === true).length;
  const failed = checks.filter((c) => c.state === false).length;
  const pending = checks.filter((c) => c.state === null).length;
  const total = checks.length;
  const pct = Math.round((done / total) * 100);

  return (
    <SectionCard title={`QC Checklist — ${done}/${total} passed`}>
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="flex gap-3">
            <span className="text-blue-600 font-semibold">{done} passed</span>
            {failed > 0 && (
              <span className="text-red-500 font-semibold">
                {failed} failed
              </span>
            )}
            {pending > 0 && (
              <span className="text-gray-400">{pending} pending</span>
            )}
          </span>
          <span className="font-semibold text-blue-600">{pct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ul className="space-y-1">
        {checks?.map((check, i) => {
          const isPassed = check.state === true;
          const isFailed = check.state === false;
          return (
            <li
              key={check.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg select-none
                ${isPassed ? "bg-blue-50/50 text-blue-950" : isFailed ? "bg-red-50/50 text-red-700" : "hover:bg-gray-50 text-gray-600"}`}
            >
              <button
                onClick={() => onToggle(i, true)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all
                  ${isPassed ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white hover:border-blue-400"}`}
              >
                {isPassed && (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </button>

              <span
                className={`text-sm flex-1 ${isPassed ? "font-semibold" : "font-normal"}`}
              >
                {check.item}
                {check.critical && (
                  <span className="ml-2 text-[10px] font-bold text-red-400 uppercase">
                    Critical
                  </span>
                )}
                {check.state === null && (
                  <span className="ml-2 text-[10px] font-medium text-gray-300 uppercase">
                    Pending
                  </span>
                )}
              </span>

              <button
                onClick={() => onToggle(i, false)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all
                  ${isFailed ? "bg-red-500 border-red-500" : "border-gray-300 bg-white hover:border-red-300"}`}
              >
                {isFailed && (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

function RemarksPanel({ remarks, setRemarks }) {
  return (
    <SectionCard title="Remarks">
      <textarea
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        rows={5}
        placeholder="Enter inspection remarks, observations, or issues found…"
        className="w-full resize-none text-sm text-blue-950 placeholder-gray-300 border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-400 transition-colors bg-gray-50"
      />
    </SectionCard>
  );
}

function DecisionPanel({
  checks,
  hasFailed,
  decision,
  setDecision,
  onSubmit,
  submitting,
  isUpdate,
}) {
  const canApprove = !hasFailed && checks.some((c) => c.state === true);
  const pendingCount = checks.filter((c) => c.state === null).length;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
      <h3 className="text-sm font-bold text-blue-950">Final Decision</h3>

      {pendingCount > 0 && (
        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          ⏳ {pendingCount} item{pendingCount > 1 ? "s" : ""} still pending —
          you can submit now or complete them later.
        </div>
      )}

      {decision && (
        <div
          className={`text-sm font-semibold text-center py-2.5 rounded-lg ${
            decision === "Approved"
              ? "bg-green-50 text-green-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {decision === "Approved"
            ? "✓ Inspection Approved"
            : "✗ Inspection Rejected"}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setDecision("Rejected")}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
        >
          <XCircle size={15} /> Reject
        </button>
        <button
          onClick={() => setDecision("Approved")}
          disabled={!canApprove}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-colors
            ${canApprove ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}
        >
          <CheckCircle2 size={15} /> Approve
        </button>
      </div>

      {!canApprove && (
        <p className="text-xs text-gray-400 text-center">
          {hasFailed
            ? "Resolve all failed items to enable approval"
            : "Pass at least one item to enable approval"}
        </p>
      )}

      {decision && (
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold bg-blue-950 text-white hover:bg-blue-800 transition-colors disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Submitting…
            </>
          ) : isUpdate ? (
            "Update QC Report"
          ) : (
            "Submit QC Report"
          )}
        </button>
      )}
    </div>
  );
}

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2
      ${type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}
    >
      {type === "success" ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
      {msg}
    </div>
  );
}

export default function QCInspection() {
  const [projects, setProjects] = useState([]);
  const [projLoad, setProjLoad] = useState(true);
  const [selected, setSelected] = useState(null);
  const [checks, setChecks] = useState(freshChecks());
  const [remarks, setRemarks] = useState("");
  const [decision, setDecision] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ msg: null, type: "success" });
  const [existingReport, setExistingReport] = useState(null); // holds loaded report
  const [reportLoading, setReportLoading] = useState(false);
  const [reportChecked, setReportChecked] = useState(false); // whether we've checked for existing

  const getCurrentUserId = () => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.id || parsed?._id || null;
    } catch {
      return null;
    }
  };

  // Fetch projects on mount
  useEffect(() => {
    axiosInstance
      .get("/projects")
      .then((res) =>
        setProjects(Array.isArray(res.data) ? res.data : (res.data.data ?? [])),
      )
      .catch(() => setProjects([]))
      .finally(() => setProjLoad(false));
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: null, type: "success" }), 3500);
  };

  const handleToggle = (index, value) => {
    setChecks((prev) =>
      prev?.map((c, i) =>
        i === index ? { ...c, state: c.state === value ? null : value } : c,
      ),
    );
  };

  // When project is selected — reset form and check if a QC report exists
  const handleSelectProject = async (proj) => {
    setSelected(proj);
    setChecks(freshChecks());
    setRemarks("");
    setDecision(null);
    setExistingReport(null);
    setReportChecked(false);

    // Check for existing QC report for this project
    setReportLoading(true);
    try {
      const res = await axiosInstance.get(
        `/report/view-qc?project=${proj._id}`,
      );
      const reports = Array.isArray(res.data)
        ? res.data
        : (res.data.data ?? []);
      if (reports.length > 0) {
        // Store the most recent report but don't load it yet — show button instead
        setExistingReport(reports[0]);
      }
    } catch {
      // No report found or error — that's fine, fresh form
    } finally {
      setReportLoading(false);
      setReportChecked(true);
    }
  };

  // Load the existing report into the form
  const handleLoadPreviousReport = () => {
    if (!existingReport) return;
    setChecks(mergeChecks(existingReport.qcChecks));
    setRemarks(existingReport.remarks || "");
    setDecision(existingReport.status || null);
  };

  const handleSubmit = async () => {
    if (!selected || !decision) return;

    const submittedBy = getCurrentUserId();
    if (!submittedBy) {
      showToast("User session not found. Please log in again.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        project: selected._id,
        status: decision,
        remarks: remarks,
        qcChecks: checks,
        date: new Date().toISOString(),
        submittedBy: submittedBy,
      };

      if (existingReport) {
        // PATCH — update existing report
        await axiosInstance.patch(
          `/report/update/${existingReport._id}`,
          payload,
        );
        showToast("QC Report updated successfully!", "success");
      } else {
        // POST — create new report
        await axiosInstance.post("/report/add-qc", payload);
        showToast("QC Report submitted successfully!", "success");
      }

      setSelected(null);
      setChecks(freshChecks());
      setRemarks("");
      setDecision(null);
      setExistingReport(null);
      setReportChecked(false);
    } catch (err) {
      showToast(err.response?.data?.message || "Submission failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const hasFailed = checks.some((c) => c.state === false);

  return (
    <div className="space-y-5">
      <Toast msg={toast.msg} type={toast.type} />

      <div>
        <h2 className="text-lg font-bold text-blue-950">QC Inspection</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Select a project and complete the checklist
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Select Project
        </p>
        <ProjectSelector
          selected={selected}
          setSelected={handleSelectProject}
          projects={projects}
          loading={projLoad}
        />
        {selected && <ProjectDetails proj={selected} />}

        {/* Load Previous Report button — shown only if existing report found */}
        {reportLoading && (
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
            <Loader2 size={13} className="animate-spin" /> Checking for existing
            report…
          </div>
        )}
        {reportChecked && existingReport && (
          <div className="mt-3 flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
            <div>
              <p className="text-xs font-semibold text-amber-700">
                Existing QC report found
              </p>
              <p className="text-xs text-amber-500 mt-0.5">
                Status:{" "}
                <span className="font-semibold">{existingReport.status}</span> —
                Last updated:{" "}
                {new Date(existingReport.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={handleLoadPreviousReport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors shrink-0 ml-3"
            >
              <RefreshCw size={12} /> Load Previous Report
            </button>
          </div>
        )}
        {reportChecked && !existingReport && selected && (
          <p className="text-xs text-green-600 mt-2">
            ✓ No previous report — starting fresh
          </p>
        )}
      </div>

      {selected && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChecklistPanel checks={checks} onToggle={handleToggle} />
          <div className="space-y-5">
            <RemarksPanel remarks={remarks} setRemarks={setRemarks} />
            <DecisionPanel
              checks={checks}
              hasFailed={hasFailed}
              decision={decision}
              setDecision={setDecision}
              onSubmit={handleSubmit}
              submitting={submitting}
              isUpdate={!!existingReport}
            />
          </div>
        </div>
      )}
    </div>
  );
}
