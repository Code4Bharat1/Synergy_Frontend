"use client";
import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle, RefreshCw, Save } from "lucide-react";
import axiosInstance from "../../lib/axios";

// ── API Helper ────────────────────────────────────────────────────────────────
const apiFetch = async (path, { method = "GET", body } = {}) => {
  const token = localStorage.getItem("accessToken");
  const config = {
    method,
    url: path,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { data: body } : {}),
  };
  const res = await axiosInstance(config);
  return res.data;
};

// ── Static QC items (item string matches DB { item, pass, remarks }) ──────────
const QC_ITEMS = [
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

const CATEGORIES = [...new Set(QC_ITEMS.map((c) => c.category))];

const DEFAULT_TRIAL = {
  operatorPresent: "", clientRepresentative: "", waterFlowRate: "",
  structuralLoadTest: "", safetySystemTest: "",
  clientSatisfaction: "", trialOutcome: "",
};

const TRIAL_FIELDS = [
  { id: "operatorPresent",      label: "Operator Present",      type: "text",   placeholder: "Name of operator"   },
  { id: "clientRepresentative", label: "Client Representative", type: "text",   placeholder: "Client rep present" },
  { id: "waterFlowRate",        label: "Water Flow Rate",       type: "text",   placeholder: "e.g. 850 L/min"     },
  { id: "structuralLoadTest",   label: "Structural Load Test",  type: "select", options: ["Pass", "Fail", "Pending"]              },
  { id: "safetySystemTest",     label: "Safety System Test",    type: "select", options: ["Pass", "Fail", "Pending"]              },
  { id: "clientSatisfaction",   label: "Client Satisfaction",   type: "select", options: ["Satisfied", "Minor Issues", "Unsatisfied"] },
  { id: "trialOutcome",         label: "Trial Outcome",         type: "select", options: ["Passed", "Conditional Pass", "Failed"]  },
];

const STATUS_META = {
  Pending:  { badge: "bg-amber-50 text-amber-700",  dot: "bg-amber-500"  },
  Approved: { badge: "bg-green-50 text-green-700",  dot: "bg-green-500"  },
  Rejected: { badge: "bg-red-50 text-red-600",      dot: "bg-red-500"    },
};

const PROJECT_PROGRESS = {
  initiated: 5, "in-progress": 40, installation: 65,
  testing: 85, completed: 100, "on-hold": 0,
};

// ── CompletionRing ─────────────────────────────────────────────────────────────
function CompletionRing({ value, size = 38 }) {
  const r = (size - 8) / 2, circ = 2 * Math.PI * r;
  const color = value >= 75 ? "#1C4D8D" : value >= 50 ? "#4988C4" : "#BDE8F5";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F1F5F9" strokeWidth="5"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${(value/100)*circ} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dasharray 0.7s ease" }}/>
      <text x={size/2} y={size/2+4} textAnchor="middle"
        fill="#0F2854" fontSize="9" fontWeight="800" fontFamily="system-ui,sans-serif">{value}%</text>
    </svg>
  );
}

// ── DB ↔ state helpers ────────────────────────────────────────────────────────
const dbQcToState = (dbArr) => {
  const map = {};
  QC_ITEMS.forEach(c => { map[c.item] = { pass: false, remarks: "" }; });
  (dbArr || []).forEach(c => { map[c.item] = { pass: !!c.pass, remarks: c.remarks || "" }; });
  return map;
};
const stateToDbQc = (map) =>
  QC_ITEMS.map(c => ({ item: c.item, pass: !!map[c.item]?.pass, remarks: map[c.item]?.remarks || "" }));

const getCurrentUser = () => {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TrialQC() {
  const [projects, setProjects]           = useState([]);
  const [projLoading, setProjLoading]     = useState(true);
  const [selectedId, setSelectedId]       = useState(null);
  const [showDetail, setShowDetail]       = useState(false);
  const [tab, setTab]                     = useState("qc");

  const [record, setRecord]               = useState(null);
  const [recordLoading, setRecordLoading] = useState(false);
  const [error, setError]                 = useState(null);

  const [qcState, setQcState]             = useState(dbQcToState(null));
  const [trialDetails, setTrialDetails]   = useState({ ...DEFAULT_TRIAL });
  const [trialDate, setTrialDate]         = useState("");
  const [remarks, setRemarks]             = useState("");

  const [savingQc, setSavingQc]           = useState(false);
  const [savingTrial, setSavingTrial]     = useState(false);
  const [savingHandover, setSavingHandover] = useState(false);
  const [handoverModal, setHandoverModal] = useState(false);
  const [handoverComment, setHandoverComment] = useState("");

  // ── Fetch projects ──────────────────────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    try {
      setProjLoading(true);
      const data = await apiFetch("/projects");
      const list = Array.isArray(data) ? data : [];
      setProjects(list);
      if (list.length > 0) setSelectedId(list[0]._id);
    } catch (err) { setError(err.message); }
    finally { setProjLoading(false); }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // ── Fetch TrialQC record for project ───────────────────────────────────────
  const fetchRecord = useCallback(async (projectId) => {
    if (!projectId) return;
    try {
      setRecordLoading(true);
      setError(null);
      // GET /trial-qc/list — filter by project in response
      const res  = await apiFetch(`/trial-qc/list`);
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      const found = list.find(r =>
        (r.project?._id || r.project) === projectId
      ) || null;

      setRecord(found);
      if (found) {
        setQcState(dbQcToState(found.qcChecks));
        setTrialDetails({ ...DEFAULT_TRIAL, ...found.trialDetails });
        setTrialDate(found.trialDate ? found.trialDate.slice(0, 10) : "");
        setRemarks(found.remarks || "");
      } else {
        setQcState(dbQcToState(null));
        setTrialDetails({ ...DEFAULT_TRIAL });
        setTrialDate("");
        setRemarks("");
      }
    } catch {
      setRecord(null);
    } finally { setRecordLoading(false); }
  }, []);

  useEffect(() => { if (selectedId) fetchRecord(selectedId); }, [selectedId, fetchRecord]);

  // ── Save QC Checks ──────────────────────────────────────────────────────────
  const saveQcChecks = async () => {
    try {
      setSavingQc(true);
      const user     = getCurrentUser();
      const qcChecks = stateToDbQc(qcState);

      if (!record) {
        if (!trialDate) return alert("Please set a Trial Date before saving.");
        const res = await apiFetch("/trial-qc/create", {
          method: "POST",
          body: {
            project:              selectedId,
            installationIncharge: user._id || user.id,
            trialDate,
            qcChecks,
            remarks,
          },
        });
        setRecord(res?.data || res);
      } else {
        await apiFetch(`/trial-qc/update/${record._id}`, {
          method: "PATCH",
          body: { qcChecks, remarks },
        });
      }
      await fetchRecord(selectedId);
    } catch (err) { alert(err.message); }
    finally { setSavingQc(false); }
  };

  // ── Save Trial Details ──────────────────────────────────────────────────────
  const saveTrialDetails = async () => {
    try {
      setSavingTrial(true);
      const user = getCurrentUser();

      if (!record) {
        if (!trialDate) return alert("Please set a Trial Date before saving.");
        const res = await apiFetch("/trial-qc/create", {
          method: "POST",
          body: {
            project:              selectedId,
            installationIncharge: user._id || user.id,
            trialDate,
            trialDetails,
            remarks,
          },
        });
        setRecord(res?.data || res);
      } else {
        await apiFetch(`/trial-qc/update/${record._id}`, {
          method: "PATCH",
          body: { trialDate: trialDate || record.trialDate, trialDetails, remarks },
        });
      }
      await fetchRecord(selectedId);
    } catch (err) { alert(err.message); }
    finally { setSavingTrial(false); }
  };

  // ── Approve ─────────────────────────────────────────────────────────────────
  const submitApproval = async () => {
    if (!record) return;
    try {
      setSavingHandover(true);
      await apiFetch(`/trial-qc/update/${record._id}`, {
        method: "PATCH",
        body: { status: "Approved", approvalRemarks: handoverComment },
      });
      setHandoverModal(false);
      setHandoverComment("");
      await fetchRecord(selectedId);
    } catch (err) { alert(err.message); }
    finally { setSavingHandover(false); }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const proj          = projects.find(p => p._id === selectedId);
  const passedCount   = QC_ITEMS.filter(c => qcState[c.item]?.pass).length;
  const failedCount   = QC_ITEMS.filter(c => !qcState[c.item]?.pass).length;
  const criticalFails = QC_ITEMS.filter(c => c.critical && !qcState[c.item]?.pass).length;
  const allCritPass   = QC_ITEMS.filter(c => c.critical).every(c => qcState[c.item]?.pass);
  const trialPassed   = ["Passed", "Conditional Pass"].includes(trialDetails.trialOutcome);
  const isApproved    = record?.status === "Approved";
  const canApprove    = allCritPass && trialPassed && !isApproved && !!record;
  const sm            = STATUS_META[record?.status] || STATUS_META.Pending;

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-blue-950 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all font-sans";

  if (projLoading) return (
    <div className="flex items-center justify-center py-24 gap-2 text-gray-400">
      <Loader2 size={20} className="animate-spin"/>
      <span className="text-sm">Loading projects…</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-blue-950 flex flex-col">

      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-0.5">Quality Assurance</p>
          <h1 className="text-xl sm:text-2xl font-bold text-blue-950">Trial &amp; QC</h1>
        </div>
        <button onClick={() => fetchRecord(selectedId)}
          className="p-2 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-gray-600 transition-all">
          <RefreshCw size={13} className={recordLoading ? "animate-spin" : ""}/>
        </button>
      </div>

      {error && (
        <div className="mx-4 sm:mx-6 mb-3 flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
          <AlertCircle size={14}/><span>{error}</span>
          <button onClick={() => fetchRecord(selectedId)} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}

      {showDetail && (
        <div className="lg:hidden px-4 pb-3">
          <button onClick={() => setShowDetail(false)} className="flex items-center gap-2 text-sm font-semibold text-blue-700">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back to projects
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">

        {/* LEFT sidebar */}
        <div className={`${showDetail ? "hidden" : "flex"} lg:flex flex-col w-full lg:w-64 lg:shrink-0 bg-white border-r border-gray-100`}>
          <p className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
            Select Project
          </p>
          <div className="flex-1 overflow-y-auto">
            {projects.length === 0 && <p className="py-10 text-center text-xs text-gray-300">No projects found</p>}
            {projects.map(p => {
              const isSel = selectedId === p._id;
              return (
                <div key={p._id}
                  onClick={() => { setSelectedId(p._id); setShowDetail(true); }}
                  className={`px-4 py-3.5 border-b border-gray-50 cursor-pointer border-l-[3px] transition-all
                    ${isSel ? "bg-blue-50 border-l-blue-800" : "bg-white border-l-transparent hover:bg-slate-50"}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className={`text-[10px] font-bold mb-0.5 ${isSel ? "text-blue-700" : "text-blue-400"}`}>
                        {p._id.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-xs font-bold text-blue-950 leading-snug">{p.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{p.clientName}</p>
                    </div>
                    <CompletionRing value={PROJECT_PROGRESS[p.status] ?? 0}/>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-gray-400">{p.status || "—"}</span>
                    {isSel && record?.status === "Approved" && (
                      <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                        Approved
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT content */}
        <div className={`${!showDetail ? "hidden" : "flex"} lg:flex flex-1 flex-col overflow-y-auto px-4 sm:px-6 py-5`}>
          {!proj ? (
            <div className="flex items-center justify-center h-full text-gray-300 text-sm">Select a project</div>
          ) : (
            <div className="max-w-4xl w-full mx-auto">

              {recordLoading && (
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-3">
                  <Loader2 size={12} className="animate-spin"/> Loading…
                </div>
              )}

              {/* Banner */}
              <div className="relative bg-gradient-to-br from-blue-950 to-blue-700 rounded-2xl p-4 sm:p-5 mb-4 text-white overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2"/>
                <div className="flex flex-wrap justify-between items-start gap-3 relative">
                  <div>
                    <p className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider mb-1">{proj._id.slice(-8).toUpperCase()}</p>
                    <h2 className="text-lg font-bold mb-1">{proj.name}</h2>
                    <p className="text-xs text-white/60">{proj.clientName} · {proj.location || "—"}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { label: `${passedCount} Passed`,  cls: "bg-green-500/20 text-green-200" },
                      { label: `${failedCount} Failed`,  cls: "bg-red-500/20 text-red-200"     },
                    ].map(s => (
                      <span key={s.label} className={`${s.cls} text-xs font-bold px-2.5 py-1 rounded-full`}>{s.label}</span>
                    ))}
                    {criticalFails > 0 && (
                      <span className="bg-red-500/20 text-red-200 text-xs font-bold px-2.5 py-1 rounded-full">⚠ {criticalFails} Critical Fail</span>
                    )}
                    {record ? (
                      <span className={`${sm.badge} text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5`}>
                        <span className={`${sm.dot} w-1.5 h-1.5 rounded-full`}/>{record.status}
                      </span>
                    ) : (
                      <span className="bg-white/10 text-white/60 text-xs px-2.5 py-1 rounded-full">No record yet</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Trial Date strip */}
              <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 mb-3 flex items-center gap-6 flex-wrap">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trial Date *</label>
                  <input type="date" value={trialDate} onChange={e => setTrialDate(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-blue-950 outline-none focus:border-blue-400 transition-all"/>
                </div>
                {record?.installationIncharge && (
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Incharge</p>
                    <p className="text-xs font-bold text-blue-950">{record.installationIncharge?.name || "—"}</p>
                  </div>
                )}
                {record?.qcEngineer && (
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">QC Engineer</p>
                    <p className="text-xs font-bold text-blue-950">{record.qcEngineer?.name || "—"}</p>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-t-2xl border border-gray-100 border-b-0 px-5 flex">
                {[{ key: "qc", label: "QC Checks" }, { key: "trial", label: "Trial Details" }].map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    className={`px-1 py-3.5 mr-5 text-xs font-bold border-b-2 transition-all
                      ${tab === t.key ? "border-blue-800 text-blue-950" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* QC Checks */}
              {tab === "qc" && (
                <>
                  <div className="bg-white border border-gray-100 rounded-b-2xl overflow-hidden mb-3">
                    {CATEGORIES.map((cat, ci) => (
                      <div key={cat}>
                        <div className={`px-5 py-2.5 bg-slate-50 ${ci > 0 ? "border-t border-gray-100" : ""}`}>
                          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{cat}</p>
                        </div>
                        {QC_ITEMS.filter(c => c.category === cat).map((check, i, arr) => {
                          const st = qcState[check.item];
                          return (
                            <div key={check.id}
                              className={`flex items-start gap-3 px-5 py-3 hover:bg-slate-50/60 transition-colors ${i < arr.length-1 ? "border-b border-gray-50" : ""}`}>
                              {/* Toggle */}
                              <div className="flex gap-1.5 shrink-0 mt-0.5">
                                <button onClick={() => setQcState(p => ({ ...p, [check.item]: { ...p[check.item], pass: !p[check.item]?.pass } }))}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all
                                    ${st?.pass ? "bg-green-50 text-green-600 ring-1 ring-green-200" : "bg-slate-50 text-gray-300 ring-1 ring-gray-200 hover:ring-green-200"}`}>
                                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                                </button>
                                <button onClick={() => setQcState(p => ({ ...p, [check.item]: { ...p[check.item], pass: false } }))}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all
                                    ${!st?.pass ? "bg-red-50 text-red-600 ring-1 ring-red-200" : "bg-slate-50 text-gray-300 ring-1 ring-gray-200 hover:ring-red-200"}`}>
                                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                </button>
                              </div>
                              {/* Item + remarks */}
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs sm:text-sm mb-1.5 ${st?.pass ? "text-blue-950 font-semibold" : "text-gray-500"}`}>{check.item}</p>
                                <input type="text" value={st?.remarks || ""}
                                  onChange={e => setQcState(p => ({ ...p, [check.item]: { ...p[check.item], remarks: e.target.value } }))}
                                  placeholder="Remarks (optional)"
                                  className="w-full px-2.5 py-1.5 border border-gray-100 rounded-lg text-xs text-gray-500 outline-none focus:border-blue-200 bg-slate-50 transition-all"/>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {check.critical && (
                                  <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full hidden sm:inline">Critical</span>
                                )}
                                <span className={`text-xs font-bold w-8 text-right ${st?.pass ? "text-green-600" : "text-red-400"}`}>
                                  {st?.pass ? "Pass" : "Fail"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    {/* Overall remarks */}
                    <div className="px-5 py-4 border-t border-gray-100">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Overall Remarks</label>
                      <textarea value={remarks} onChange={e => setRemarks(e.target.value)}
                        placeholder="Any overall notes..." rows={2} className={`${inputCls} resize-y`}/>
                    </div>
                  </div>
                  <div className="flex justify-end mb-4">
                    <button onClick={saveQcChecks} disabled={savingQc}
                      className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all disabled:opacity-60">
                      {savingQc ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>}
                      {savingQc ? "Saving…" : "Save QC Checks"}
                    </button>
                  </div>
                </>
              )}

              {/* Trial Details */}
              {tab === "trial" && (
                <>
                  <div className="bg-white border border-gray-100 rounded-b-2xl p-4 sm:p-5 mb-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {TRIAL_FIELDS.map(f => (
                        <div key={f.id} className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{f.label}</label>
                          {f.type === "text" && (
                            <input type="text" value={trialDetails[f.id]} placeholder={f.placeholder}
                              onChange={e => setTrialDetails(p => ({ ...p, [f.id]: e.target.value }))}
                              className={inputCls}/>
                          )}
                          {f.type === "select" && (
                            <select value={trialDetails[f.id]}
                              onChange={e => setTrialDetails(p => ({ ...p, [f.id]: e.target.value }))}
                              className={`${inputCls} cursor-pointer`}>
                              <option value="">— Select —</option>
                              {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end mb-4">
                    <button onClick={saveTrialDetails} disabled={savingTrial}
                      className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all disabled:opacity-60">
                      {savingTrial ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>}
                      {savingTrial ? "Saving…" : "Save Trial Details"}
                    </button>
                  </div>
                </>
              )}

              {/* Approval bar */}
              <div className={`rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border
                ${isApproved ? "bg-green-50 border-green-200" : canApprove ? "bg-white border-gray-100" : "bg-slate-50 border-gray-100"}`}>
                <div>
                  <p className={`text-sm font-bold mb-0.5 ${isApproved ? "text-green-700" : "text-blue-950"}`}>
                    {isApproved ? "✓ Trial QC Approved" : "Approve Trial QC"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {isApproved
                      ? `Approved on ${record?.approvedAt ? new Date(record.approvedAt).toLocaleDateString() : "—"}`
                      : !record ? "Save QC checks first to create a record."
                      : !allCritPass ? "All critical QC checks must pass before approval."
                      : !trialPassed ? "Trial outcome must be Passed or Conditional Pass."
                      : "All conditions met — ready for approval."}
                  </p>
                  {isApproved && record?.approvalRemarks && (
                    <p className="text-xs text-green-600 mt-1 italic">"{record.approvalRemarks}"</p>
                  )}
                </div>
                {!isApproved && (
                  <button disabled={!canApprove} onClick={() => setHandoverModal(true)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all
                      ${canApprove ? "bg-blue-950 text-white hover:bg-blue-800 hover:-translate-y-0.5 hover:shadow-lg" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                    Approve
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {handoverModal && proj && (
        <div className="fixed inset-0 bg-blue-950/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                  <svg width="15" height="15" fill="none" stroke="#16A34A" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-950">Approve Trial QC</p>
                  <p className="text-xs text-gray-400">{proj.name}</p>
                </div>
              </div>
              <button onClick={() => setHandoverModal(false)} className="text-gray-300 hover:text-gray-500">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="px-5 py-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "QC Passed",     value: `${passedCount} / ${QC_ITEMS.length}` },
                  { label: "Critical",      value: "All Passed"                           },
                  { label: "Trial Outcome", value: trialDetails.trialOutcome || "—"       },
                  { label: "Trial Date",    value: trialDate || "—"                       },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50 border border-gray-100 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
                    <p className="text-sm font-bold text-blue-950">{s.value}</p>
                  </div>
                ))}
              </div>
              <label className="block text-xs font-bold text-blue-950 mb-2">
                Approval Remarks <span className="font-normal text-gray-400">— optional</span>
              </label>
              <textarea value={handoverComment} onChange={e => setHandoverComment(e.target.value)}
                placeholder="Add any approval notes..." rows={3} className={`${inputCls} resize-none`}/>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={() => setHandoverModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-500 rounded-xl text-sm font-semibold transition-colors">
                Cancel
              </button>
              <button onClick={submitApproval} disabled={savingHandover}
                className="flex-[2] py-2.5 bg-blue-950 hover:bg-blue-800 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {savingHandover && <Loader2 size={13} className="animate-spin"/>}
                {savingHandover ? "Approving…" : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}