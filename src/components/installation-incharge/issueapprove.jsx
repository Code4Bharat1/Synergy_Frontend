"use client";
import { useState } from "react";

const ISSUES = [
  {
    id: "ISS-041", project: "PRJ-2389", projectName: "Blue Lagoon Resort",
    item: "Wave Pool Panel B — Structural Crack",
    loggedBy: "Karim Nour", loggedDate: "2026-02-18",
    description: "Hairline crack detected along the lower weld seam of Wave Pool Panel B during routine inspection. Crack measures approximately 4 cm and may expand under cyclic load.",
    correctiveAction: "Re-weld the affected seam using a certified structural welder, apply epoxy sealant, and conduct a full load test before pool fill.",
    severity: "High", status: "Pending", attachments: 2,
  },
  {
    id: "ISS-039", project: "PRJ-2412", projectName: "Ocean World",
    item: "Funnel Ride X2 — Support Bracket Fatigue",
    loggedBy: "Site Supervisor", loggedDate: "2026-02-04",
    description: "Support bracket on the upper funnel entry shows signs of stress fatigue. Visual deformation noted on two of four anchor bolts during QC walkthrough.",
    correctiveAction: "Replace all four anchor bolts with Grade 8.8 galvanised bolts. Reinforce bracket base plate with 8 mm steel plate and obtain structural engineer sign-off.",
    severity: "Critical", status: "Pending", attachments: 4,
  },
  {
    id: "ISS-044", project: "PRJ-2398", projectName: "Aqua Universe",
    item: "Body Slide 360 — Surface Paint Delamination",
    loggedBy: "QC Team", loggedDate: "2026-02-22",
    description: "Paint delamination observed on ~15% of the Body Slide 360 interior surface, likely caused by insufficient surface preparation prior to coating.",
    correctiveAction: "Sand affected areas to bare fibreglass, apply primer coat, reapply approved gel coat, and cure for 48 h before re-inspection.",
    severity: "Medium", status: "Pending", attachments: 1,
  },
  {
    id: "ISS-046", project: "PRJ-2401", projectName: "AquaPark Dubai",
    item: "Waterslide Alpha — Weld Quality Failure",
    loggedBy: "Eng. Ali", loggedDate: "2026-02-11",
    description: "Weld joints on Waterslide Alpha sections 3 and 4 failed ultrasonic testing. Porosity detected in three locations indicating potential sub-surface voids.",
    correctiveAction: "Grind out failed weld sections, re-weld using certified operator, and retest via ultrasonic and visual inspection until pass is achieved.",
    severity: "Critical", status: "Approved", attachments: 3,
    resolvedBy: "Project Director", resolvedDate: "2026-02-14",
    comment: "Corrective plan accepted. Proceed immediately and submit re-test report within 48 h.",
  },
  {
    id: "ISS-048", project: "PRJ-2376", projectName: "SunSplash Inc.",
    item: "Pump System — Flow Rate Below Specification",
    loggedBy: "Sara Hassan", loggedDate: "2026-02-23",
    description: "Pump output measured at 680 L/min against specification of 850 L/min. Suspected cause is impeller wear or incorrect pump sizing for the hydraulic circuit.",
    correctiveAction: "Inspect impeller condition and replace if worn. If sizing is incorrect, source replacement pump matching hydraulic calculations.",
    severity: "Low", status: "Rejected", attachments: 0,
    resolvedBy: "Eng. Director", resolvedDate: "2026-02-24",
    comment: "Insufficient evidence provided. Re-submit with full hydraulic report attached.",
  },
];

const SEV = {
  Critical: { badge: "bg-red-100 text-red-800",    dot: "bg-red-500" },
  High:     { badge: "bg-orange-100 text-orange-800", dot: "bg-orange-500" },
  Medium:   { badge: "bg-blue-100 text-blue-800",   dot: "bg-blue-500" },
  Low:      { badge: "bg-green-100 text-green-800", dot: "bg-green-500" },
};

const STA = {
  Pending:  { badge: "bg-amber-100 text-amber-800",  dot: "bg-amber-500" },
  Approved: { badge: "bg-green-100 text-green-800",  dot: "bg-green-500" },
  Rejected: { badge: "bg-red-100 text-red-800",      dot: "bg-red-500" },
};

const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const days = (d) => {
  const diff = Math.ceil((new Date() - new Date(d)) / 86400000);
  return diff === 0 ? "Today" : diff === 1 ? "Yesterday" : `${diff}d ago`;
};

function Chip({ label, badgeCls, dotCls }) {
  return (
    <span className={`${badgeCls} inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap`}>
      <span className={`${dotCls} w-1.5 h-1.5 rounded-full shrink-0`} />
      {label}
    </span>
  );
}

export default function IssueApproval() {
  const [issues, setIssues]     = useState(ISSUES);
  const [filter, setFilter]     = useState("Pending");
  const [selected, setSelected] = useState(ISSUES[0].id);
  const [modal, setModal]       = useState(null);
  const [comment, setComment]   = useState("");
  const [showDetail, setShowDetail] = useState(false); // mobile: toggle between list & detail

  const counts = { All: issues.length, Pending: 0, Approved: 0, Rejected: 0 };
  issues.forEach((i) => counts[i.status]++);

  const list   = filter === "All" ? issues : issues.filter((i) => i.status === filter);
  const active = issues.find((i) => i.id === selected) || list[0];

  const resolve = () => {
    const newStatus = modal.type === "approve" ? "Approved" : "Rejected";
    setIssues((prev) =>
      prev.map((i) =>
        i.id === modal.id
          ? { ...i, status: newStatus, resolvedBy: "Project Director", resolvedDate: new Date().toISOString().split("T")[0], comment: comment.trim() || undefined }
          : i
      )
    );
    const remaining = issues.filter((i) => i.id !== modal.id && i.status === "Pending");
    if (remaining.length) setSelected(remaining[0].id);
    setModal(null);
    setComment("");
  };

  const selectIssue = (id) => {
    setSelected(id);
    setShowDetail(true); // on mobile, switch to detail view
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-blue-950 flex flex-col">

      {/* ── Page Header (non-sticky, inline) ── */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-0.5">Issue Management</p>
          <h1 className="text-xl sm:text-2xl font-bold text-blue-950">Issue Approval</h1>
        </div>
        {/* Stat pills */}
        <div className="flex gap-2 flex-wrap">
          {[
            { k: "Pending",  v: counts.Pending,  cls: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
            { k: "Approved", v: counts.Approved, cls: "bg-green-50 text-green-700", dot: "bg-green-500" },
            { k: "Rejected", v: counts.Rejected, cls: "bg-red-50 text-red-700",     dot: "bg-red-500" },
          ].map((s) => (
            <div key={s.k} className={`${s.cls} flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold`}>
              <span className={`${s.dot} w-1.5 h-1.5 rounded-full`} />
              {s.v} {s.k}
            </div>
          ))}
        </div>
      </div>

      {/* ── Mobile back button (when viewing detail) ── */}
      {showDetail && (
        <div className="lg:hidden px-4 pb-2">
          <button
            onClick={() => setShowDetail(false)}
            className="flex items-center gap-2 text-sm font-semibold text-blue-700"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to issues
          </button>
        </div>
      )}

      {/* ── Main split layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT LIST PANEL */}
        <div className={`
          ${showDetail ? "hidden" : "flex"} lg:flex
          flex-col w-full lg:w-80 lg:min-w-[280px] lg:max-w-xs lg:shrink-0
          bg-white border-r border-gray-100
        `}>
          {/* Filter tabs */}
          <div className="px-4 pt-3 pb-0 border-b border-gray-100">
            <div className="flex gap-0.5">
              {["All", "Pending", "Approved", "Rejected"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition-all duration-150 ${
                    filter === f
                      ? "border-blue-800 text-blue-950"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {f} <span className="opacity-60 ml-0.5">{counts[f]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Issue rows */}
          <div className="flex-1 overflow-y-auto">
            {list.length === 0 && (
              <div className="py-10 text-center text-sm text-gray-300">No issues</div>
            )}
            {list.map((issue) => {
              const sv = SEV[issue.severity];
              const st = STA[issue.status];
              const isActive = selected === issue.id;
              return (
                <div
                  key={issue.id}
                  onClick={() => selectIssue(issue.id)}
                  className={`px-4 py-3.5 border-b border-gray-50 cursor-pointer border-l-[3px] transition-all duration-150 ${
                    isActive
                      ? "bg-blue-50 border-l-blue-800"
                      : "bg-white border-l-transparent hover:bg-slate-50"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-[11px] font-bold tracking-wide ${isActive ? "text-blue-700" : "text-gray-400"}`}>
                      {issue.id}
                    </span>
                    <Chip label={st.Pending || issue.status} badgeCls={st.badge} dotCls={st.dot} />
                  </div>
                  <p className="text-xs font-bold text-blue-950 leading-snug line-clamp-2 mb-1.5">
                    {issue.item}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">{issue.projectName}</span>
                    <Chip label={issue.severity} badgeCls={sv.badge} dotCls={sv.dot} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT DETAIL PANEL */}
        <div className={`
          ${!showDetail ? "hidden" : "flex"} lg:flex
          flex-1 flex-col overflow-y-auto
          px-4 sm:px-6 lg:px-8 py-5
        `}>
          {!active ? (
            <div className="flex items-center justify-center h-full text-sm text-gray-300">
              Select an issue to review
            </div>
          ) : (() => {
            const sv = SEV[active.severity];
            const st = STA[active.status];
            return (
              <div className="max-w-3xl w-full">

                {/* Detail header */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-xs font-bold text-blue-500 tracking-wider">{active.id}</span>
                    <span className="text-gray-300 text-xs">·</span>
                    <span className="text-xs text-gray-400">{active.project}</span>
                    <Chip label={active.severity} badgeCls={sv.badge} dotCls={sv.dot} />
                    <Chip label={active.status} badgeCls={st.badge} dotCls={st.dot} />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-blue-950 leading-snug mb-1">{active.item}</h2>
                  <p className="text-xs text-gray-400">{active.projectName}</p>
                </div>

                {/* Meta row */}
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-4 grid grid-cols-2 sm:grid-cols-4">
                  {[
                    { label: "Logged By",   value: active.loggedBy },
                    { label: "Date Logged", value: fmtDate(active.loggedDate) },
                    { label: "Time Open",   value: days(active.loggedDate) },
                    { label: "Attachments", value: active.attachments > 0 ? `${active.attachments} file${active.attachments > 1 ? "s" : ""}` : "None" },
                  ].map((m, idx) => (
                    <div key={m.label} className={`p-3.5 sm:p-4 ${idx < 3 ? "border-b sm:border-b-0 sm:border-r border-gray-50" : ""} ${idx === 1 ? "border-r border-gray-50" : ""}`}>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{m.label}</p>
                      <p className="text-sm font-bold text-blue-950">{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Description + Corrective Action */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="bg-white border border-gray-100 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <svg width="12" height="12" fill="none" stroke="#4988C4" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-blue-950">Issue Description</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{active.description}</p>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                        <svg width="12" height="12" fill="none" stroke="#22C55E" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-blue-950">Proposed Corrective Action</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{active.correctiveAction}</p>
                  </div>
                </div>

                {/* Resolution block */}
                {active.status !== "Pending" && (
                  <div className={`mb-4 rounded-2xl p-4 flex items-start gap-3 border ${
                    active.status === "Approved"
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}>
                    <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                      active.status === "Approved" ? "bg-green-100" : "bg-red-100"
                    }`}>
                      {active.status === "Approved"
                        ? <svg width="13" height="13" fill="none" stroke="#16A34A" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                        : <svg width="13" height="13" fill="none" stroke="#DC2626" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      }
                    </div>
                    <div>
                      <p className={`text-xs font-bold mb-1 ${active.status === "Approved" ? "text-green-700" : "text-red-700"}`}>
                        {active.status} by {active.resolvedBy} · {fmtDate(active.resolvedDate)}
                      </p>
                      {active.comment && <p className="text-xs text-gray-500 leading-relaxed">{active.comment}</p>}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                {active.status === "Pending" && (
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => setModal({ id: active.id, type: "approve" })}
                      className="flex items-center gap-2 bg-blue-950 hover:bg-blue-800 text-white rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                      Approve Issue
                    </button>
                    <button
                      onClick={() => setModal({ id: active.id, type: "reject" })}
                      className="flex items-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl px-5 py-2.5 text-sm font-bold transition-all"
                    >
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Confirmation Modal ── */}
      {modal && (() => {
        const issue = issues.find((i) => i.id === modal.id);
        const isApprove = modal.type === "approve";
        return (
          <div className="fixed inset-0 bg-blue-950/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              {/* Modal header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isApprove ? "bg-green-50" : "bg-red-50"}`}>
                    {isApprove
                      ? <svg width="15" height="15" fill="none" stroke="#16A34A" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                      : <svg width="15" height="15" fill="none" stroke="#DC2626" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    }
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-950">{isApprove ? "Approve Issue" : "Reject Issue"}</p>
                    <p className="text-xs text-gray-400">{issue.id}</p>
                  </div>
                </div>
                <button onClick={() => setModal(null)} className="text-gray-300 hover:text-gray-500 transition-colors p-1">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Modal body */}
              <div className="px-5 py-4">
                <div className="bg-slate-50 border border-gray-100 rounded-xl p-3.5 mb-4">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1.5">Corrective Action</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{issue.correctiveAction}</p>
                </div>
                <label className="block text-xs font-bold text-blue-950 mb-2">
                  Comment <span className="font-normal text-gray-300">— optional</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={isApprove ? "Add any approval notes..." : "Reason for rejection..."}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs text-blue-950 resize-none font-sans bg-white outline-none focus:border-blue-400 transition-colors"
                />
              </div>

              {/* Modal footer */}
              <div className="px-5 pb-5 flex gap-3">
                <button
                  onClick={() => setModal(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-500 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={resolve}
                  className={`flex-[2] py-2.5 text-white rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                    isApprove ? "bg-blue-950 hover:bg-blue-800" : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {isApprove ? "Confirm Approval" : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}