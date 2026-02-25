"use client";
import { useState } from "react";

const PROJECTS = [
  { id: "PRJ-2401", name: "AquaPark Dubai",   client: "AquaPark Dubai LLC", engineer: "Sara Hassan",  completion: 78 },
  { id: "PRJ-2435", name: "FlowPark Doha",    client: "Qatar Parks Ltd",    engineer: "Omar Siddiq",  completion: 89 },
  { id: "PRJ-2422", name: "TidalPark Muscat", client: "Oman Leisure",       engineer: "Nadia Farouq", completion: 61 },
  { id: "PRJ-2376", name: "SunSplash Inc.",   client: "SunSplash Inc.",     engineer: "Lena Weber",   completion: 35 },
];

const QC_CHECKS = [
  { id: "qc1",  category: "Structural", item: "All welds inspected and certified",        critical: true  },
  { id: "qc2",  category: "Structural", item: "Anchor bolt torque verified",              critical: true  },
  { id: "qc3",  category: "Structural", item: "Support frame alignment within tolerance", critical: false },
  { id: "qc4",  category: "Hydraulics", item: "Pump flow rate meets specification",       critical: true  },
  { id: "qc5",  category: "Hydraulics", item: "All pipe joints pressure tested",          critical: true  },
  { id: "qc6",  category: "Hydraulics", item: "Filter system operational",                critical: false },
  { id: "qc7",  category: "Surface",    item: "Gel coat applied and cured uniformly",     critical: false },
  { id: "qc8",  category: "Surface",    item: "No delamination or surface defects",       critical: true  },
  { id: "qc9",  category: "Safety",     item: "Emergency stop system functional",         critical: true  },
  { id: "qc10", category: "Safety",     item: "Safety signage installed and visible",     critical: false },
  { id: "qc11", category: "Safety",     item: "Load capacity placard affixed",            critical: false },
  { id: "qc12", category: "Electrical", item: "All electrical connections tested",        critical: true  },
  { id: "qc13", category: "Electrical", item: "Control panel commissioned",               critical: true  },
];

const TRIAL_FIELDS = [
  { id: "t1", label: "Trial Date",            type: "date",     placeholder: "" },
  { id: "t2", label: "Operator Present",      type: "text",     placeholder: "Name of operator" },
  { id: "t3", label: "Client Representative", type: "text",     placeholder: "Client rep present" },
  { id: "t4", label: "Water Flow Rate",       type: "text",     placeholder: "e.g. 850 L/min" },
  { id: "t5", label: "Structural Load Test",  type: "select",   options: ["Pass", "Fail", "Pending"] },
  { id: "t6", label: "Safety System Test",    type: "select",   options: ["Pass", "Fail", "Pending"] },
  { id: "t7", label: "Client Satisfaction",   type: "select",   options: ["Satisfied", "Minor Issues", "Unsatisfied"] },
  { id: "t8", label: "Trial Outcome",         type: "select",   options: ["Passed", "Conditional Pass", "Failed"] },
  { id: "t9", label: "Remarks",               type: "textarea", placeholder: "Any notes from the trial run..." },
];

const CATEGORIES = [...new Set(QC_CHECKS.map((c) => c.category))];

function ini(n) {
  return n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function CompletionRing({ value, size = 44 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (value / 100) * circ;
  const color = value >= 75 ? "#1C4D8D" : value >= 50 ? "#4988C4" : "#BDE8F5";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth="5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 0.7s ease" }} />
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle"
        fill="#0F2854" fontSize="10" fontWeight="800" fontFamily="system-ui,sans-serif">
        {value}%
      </text>
    </svg>
  );
}

export default function TrialQC() {
  const [selected, setSelected]           = useState(PROJECTS[0].id);
  const [showDetail, setShowDetail]       = useState(false); // mobile toggle
  const [tab, setTab]                     = useState("qc");
  const [qcState, setQcState]             = useState(() =>
    Object.fromEntries(PROJECTS.map((p) => [p.id, Object.fromEntries(QC_CHECKS.map((c) => [c.id, null]))]))
  );
  const [trialData, setTrialData]         = useState(() =>
    Object.fromEntries(PROJECTS.map((p) => [p.id, Object.fromEntries(TRIAL_FIELDS.map((f) => [f.id, ""]))]))
  );
  const [handoverModal, setHandoverModal] = useState(false);
  const [handoverComment, setHandoverComment] = useState("");
  const [handoverDone, setHandoverDone]   = useState(() => Object.fromEntries(PROJECTS.map((p) => [p.id, false])));

  const proj   = PROJECTS.find((p) => p.id === selected);
  const checks = qcState[selected];
  const trial  = trialData[selected];

  const toggleQC = (id, val) =>
    setQcState((prev) => ({ ...prev, [selected]: { ...prev[selected], [id]: val } }));
  const setTrial = (id, val) =>
    setTrialData((prev) => ({ ...prev, [selected]: { ...prev[selected], [id]: val } }));

  const passedCount    = QC_CHECKS.filter((c) => checks[c.id] === true).length;
  const failedCount    = QC_CHECKS.filter((c) => checks[c.id] === false).length;
  const pendingCount   = QC_CHECKS.filter((c) => checks[c.id] === null).length;
  const criticalFails  = QC_CHECKS.filter((c) => c.critical && checks[c.id] === false).length;
  const allCriticalPass = QC_CHECKS.filter((c) => c.critical).every((c) => checks[c.id] === true);
  const trialPassed    = trial["t8"] === "Passed" || trial["t8"] === "Conditional Pass";
  const canHandover    = allCriticalPass && trialPassed && !handoverDone[selected];

  const submitHandover = () => {
    setHandoverDone((prev) => ({ ...prev, [selected]: true }));
    setHandoverModal(false);
    setHandoverComment("");
  };

  const selectProject = (id) => {
    setSelected(id);
    setShowDetail(true);
  };

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-blue-950 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all font-sans";

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-blue-950 flex flex-col">

      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-0.5">Quality Assurance</p>
        <h1 className="text-xl sm:text-2xl font-bold text-blue-950">Trial &amp; QC</h1>
      </div>

      {/* Mobile back button */}
      {showDetail && (
        <div className="lg:hidden px-4 pb-3">
          <button onClick={() => setShowDetail(false)} className="flex items-center gap-2 text-sm font-semibold text-blue-700">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to projects
          </button>
        </div>
      )}

      {/* Split layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT — Project sidebar */}
        <div className={`
          ${showDetail ? "hidden" : "flex"} lg:flex
          flex-col w-full lg:w-64 lg:shrink-0
          bg-white border-r border-gray-100
        `}>
          <p className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 m-0">
            Select Project
          </p>
          <div className="flex-1 overflow-y-auto">
            {PROJECTS.map((p) => {
              const pp = QC_CHECKS.filter((c) => qcState[p.id][c.id] === true).length;
              const isHandedOver = handoverDone[p.id];
              const isSelected = selected === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => selectProject(p.id)}
                  className={`px-4 py-3.5 border-b border-gray-50 cursor-pointer border-l-[3px] transition-all ${
                    isSelected ? "bg-blue-50 border-l-blue-800" : "bg-white border-l-transparent hover:bg-slate-50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className={`text-[10px] font-bold mb-0.5 ${isSelected ? "text-blue-700" : "text-blue-400"}`}>{p.id}</p>
                      <p className="text-xs font-bold text-blue-950 leading-snug">{p.name}</p>
                    </div>
                    <CompletionRing value={p.completion} size={38} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-gray-400">{pp}/{QC_CHECKS.length} checks</span>
                    {isHandedOver && (
                      <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                        Handed Over
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Main content */}
        <div className={`
          ${!showDetail ? "hidden" : "flex"} lg:flex
          flex-1 flex-col overflow-y-auto
          px-4 sm:px-6 py-5
        `}>
          <div className="max-w-4xl w-full mx-auto">

            {/* Project banner */}
            <div className="relative bg-gradient-to-br from-blue-950 to-blue-700 rounded-2xl p-4 sm:p-5 mb-4 text-white overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
              <div className="flex flex-wrap justify-between items-start gap-3 relative">
                <div>
                  <p className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider mb-1">{proj.id}</p>
                  <h2 className="text-lg font-bold mb-1">{proj.name}</h2>
                  <p className="text-xs text-white/60">{proj.client} · {proj.engineer}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: `${passedCount} Passed`,  cls: "bg-green-500/20 text-green-200" },
                    { label: `${failedCount} Failed`,  cls: "bg-red-500/20 text-red-200" },
                    { label: `${pendingCount} Pending`,cls: "bg-blue-300/20 text-blue-200" },
                  ].map((s) => (
                    <span key={s.label} className={`${s.cls} text-xs font-bold px-2.5 py-1 rounded-full`}>{s.label}</span>
                  ))}
                  {criticalFails > 0 && (
                    <span className="bg-red-500/20 text-red-200 text-xs font-bold px-2.5 py-1 rounded-full">⚠ {criticalFails} Critical Fail</span>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-t-2xl border border-gray-100 border-b-0 px-4 sm:px-5 flex gap-0">
              {[{ key: "qc", label: "QC Report" }, { key: "trial", label: "Trial Results" }].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-1 py-3.5 mr-5 text-xs font-bold border-b-2 transition-all ${
                    tab === t.key ? "border-blue-800 text-blue-950" : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* QC REPORT */}
            {tab === "qc" && (
              <div className="bg-white border border-gray-100 rounded-b-2xl overflow-hidden mb-4">
                {CATEGORIES.map((cat, ci) => (
                  <div key={cat}>
                    <div className={`px-4 sm:px-5 py-2.5 bg-slate-50 ${ci > 0 ? "border-t border-gray-100" : ""}`}>
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider m-0">{cat}</p>
                    </div>
                    {QC_CHECKS.filter((c) => c.category === cat).map((check, i, arr) => {
                      const state = checks[check.id];
                      return (
                        <div
                          key={check.id}
                          className={`flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-slate-50/60 transition-colors ${i < arr.length - 1 ? "border-b border-gray-50" : ""}`}
                        >
                          {/* Pass/Fail buttons */}
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => toggleQC(check.id, state === true ? null : true)}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                state === true
                                  ? "bg-green-50 text-green-600 ring-1 ring-green-200"
                                  : "bg-slate-50 text-gray-300 ring-1 ring-gray-200 hover:ring-green-200"
                              }`}
                            >
                              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                            </button>
                            <button
                              onClick={() => toggleQC(check.id, state === false ? null : false)}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                state === false
                                  ? "bg-red-50 text-red-600 ring-1 ring-red-200"
                                  : "bg-slate-50 text-gray-300 ring-1 ring-gray-200 hover:ring-red-200"
                              }`}
                            >
                              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          </div>

                          {/* Label */}
                          <p className={`flex-1 text-xs sm:text-sm m-0 ${
                            state === null ? "text-gray-500 font-normal" : state ? "text-blue-950 font-semibold" : "text-red-600 font-semibold"
                          }`}>
                            {check.item}
                          </p>

                          {/* Critical badge */}
                          {check.critical && (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 hidden sm:inline">
                              Critical
                            </span>
                          )}

                          {/* State label */}
                          <span className={`text-xs font-bold w-8 text-right shrink-0 ${
                            state === true ? "text-green-600" : state === false ? "text-red-500" : "text-gray-300"
                          }`}>
                            {state === true ? "Pass" : state === false ? "Fail" : "—"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* TRIAL RESULTS */}
            {tab === "trial" && (
              <div className="bg-white border border-gray-100 rounded-b-2xl p-4 sm:p-5 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {TRIAL_FIELDS.map((f) => (
                    <div key={f.id} className={`flex flex-col gap-1.5 ${f.type === "textarea" ? "sm:col-span-2 lg:col-span-3" : ""}`}>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{f.label}</label>
                      {f.type === "text" && (
                        <input type="text" value={trial[f.id]} placeholder={f.placeholder}
                          onChange={(e) => setTrial(f.id, e.target.value)} className={inputCls} />
                      )}
                      {f.type === "date" && (
                        <input type="date" value={trial[f.id]}
                          onChange={(e) => setTrial(f.id, e.target.value)} className={inputCls} />
                      )}
                      {f.type === "select" && (
                        <select value={trial[f.id]} onChange={(e) => setTrial(f.id, e.target.value)} className={`${inputCls} cursor-pointer`}>
                          <option value="">— Select —</option>
                          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      )}
                      {f.type === "textarea" && (
                        <textarea value={trial[f.id]} placeholder={f.placeholder}
                          onChange={(e) => setTrial(f.id, e.target.value)}
                          rows={3} className={`${inputCls} resize-y`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Handover bar */}
            <div className={`rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border ${
              handoverDone[selected]
                ? "bg-green-50 border-green-200"
                : canHandover
                  ? "bg-white border-gray-100"
                  : "bg-slate-50 border-gray-100"
            }`}>
              <div>
                <p className={`text-sm font-bold mb-0.5 ${handoverDone[selected] ? "text-green-700" : "text-blue-950"}`}>
                  {handoverDone[selected] ? "✓ Approved for Handover" : "Approve for Handover"}
                </p>
                <p className="text-xs text-gray-400">
                  {handoverDone[selected]
                    ? `${proj.name} has been approved and handed over.`
                    : !allCriticalPass
                      ? "All critical QC checks must pass before handover."
                      : !trialPassed
                        ? "Trial result must be Passed or Conditional Pass."
                        : "All conditions met — ready for handover approval."}
                </p>
              </div>
              {!handoverDone[selected] && (
                <button
                  disabled={!canHandover}
                  onClick={() => setHandoverModal(true)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    canHandover
                      ? "bg-blue-950 text-white hover:bg-blue-800 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Approve Handover
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Handover Modal */}
      {handoverModal && (
        <div className="fixed inset-0 bg-blue-950/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                  <svg width="15" height="15" fill="none" stroke="#16A34A" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-950">Approve for Handover</p>
                  <p className="text-xs text-gray-400">{proj.id} · {proj.name}</p>
                </div>
              </div>
              <button onClick={() => setHandoverModal(false)} className="text-gray-300 hover:text-gray-500 transition-colors">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="px-5 py-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "QC Checks Passed", value: `${passedCount} / ${QC_CHECKS.length}` },
                  { label: "Critical Items",   value: "All Passed" },
                  { label: "Trial Outcome",    value: trial["t8"] || "—" },
                  { label: "Engineer",         value: proj.engineer },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-50 border border-gray-100 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
                    <p className="text-sm font-bold text-blue-950">{s.value}</p>
                  </div>
                ))}
              </div>
              <label className="block text-xs font-bold text-blue-950 mb-2">
                Handover Comment <span className="font-normal text-gray-300">— optional</span>
              </label>
              <textarea
                value={handoverComment}
                onChange={(e) => setHandoverComment(e.target.value)}
                placeholder="Add any notes for the handover record..."
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </div>

            <div className="px-5 pb-5 flex gap-3">
              <button onClick={() => setHandoverModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-500 rounded-xl text-sm font-semibold transition-colors">
                Cancel
              </button>
              <button onClick={submitHandover}
                className="flex-[2] py-2.5 bg-blue-950 hover:bg-blue-800 text-white rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg">
                Confirm Handover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}