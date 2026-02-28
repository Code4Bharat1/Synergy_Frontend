"use client";
import { useState } from "react";
import { CheckCircle2, XCircle, Upload, ChevronDown } from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────
const INSPECTIONS = [
  { id: "INS-001", project: "Block A – Level 3 Electrical", site: "Greenfield Complex", assignedTo: "Ahmad Raza", due: "26 Feb 2026", priority: "High"   },
  { id: "INS-002", project: "Block B – Plumbing Rough-in",  site: "Greenfield Complex", assignedTo: "Sara Malik",  due: "27 Feb 2026", priority: "Medium" },
  { id: "INS-003", project: "Roof Waterproofing Phase 2",   site: "Harbor View Tower",  assignedTo: "James K.",    due: "28 Feb 2026", priority: "High"   },
  { id: "INS-004", project: "Foundation Slab Inspection",   site: "Westgate Mall",      assignedTo: "Priya Nair",  due: "01 Mar 2026", priority: "Low"    },
];

const CHECKLIST = [
  "Site safety measures verified",
  "Material specifications match approved drawings",
  "Workmanship quality meets standard",
  "As-built dimensions within tolerance",
  "All connections and fixings secure",
  "Previous snag items resolved",
  "Protective measures in place",
  "Documentation complete and signed",
];

const PRIORITY_STYLES = {
  High:   "bg-red-50 text-red-600",
  Medium: "bg-amber-50 text-amber-600",
  Low:    "bg-green-50 text-green-600",
};

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-extra-darkblue">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ProjectSelector({ selected, setSelected }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white text-sm font-medium text-extra-darkblue hover:border-medium-blue transition-colors"
      >
        <span className="truncate">{selected ? `${selected.id} — ${selected.project}` : "Select an inspection…"}</span>
        <ChevronDown size={15} className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden text-sm">
          {INSPECTIONS.map(ins => (
            <li key={ins.id}>
              <button
                onClick={() => { setSelected(ins); setOpen(false); }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <span className="font-mono text-xs text-extra-blue font-semibold mr-2">{ins.id}</span>
                <span className="text-extra-darkblue font-medium">{ins.project}</span>
                <span className="text-gray-400 ml-2 text-xs">{ins.site}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProjectDetails({ proj }) {
  const fields = [
    { label: "Inspection ID", value: proj.id },
    { label: "Site",          value: proj.site },
    { label: "Assigned To",   value: proj.assignedTo },
    { label: "Due Date",      value: proj.due },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 rounded-lg bg-lightblue/40 border border-lightblue">
      {fields.map(f => (
        <div key={f.label}>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{f.label}</p>
          <p className="text-sm font-semibold text-extra-darkblue mt-0.5">{f.value}</p>
        </div>
      ))}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Priority</p>
        <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${PRIORITY_STYLES[proj.priority]}`}>
          {proj.priority}
        </span>
      </div>
    </div>
  );
}

function ChecklistPanel({ checklist, toggle }) {
  const done  = checklist.filter(Boolean).length;
  const total = CHECKLIST.length;
  const pct   = Math.round((done / total) * 100);

  return (
    <SectionCard title={`Installation Checklist — ${done}/${total} verified`}>
      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
          <span>Progress</span>
          <span className="font-semibold text-extra-blue">{pct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-extra-blue rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Items */}
      <ul className="space-y-1">
        {CHECKLIST.map((item, i) => (
          <li
            key={i}
            onClick={() => toggle(i)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors select-none
              ${checklist[i] ? "bg-lightblue/50 text-extra-darkblue" : "hover:bg-gray-50 text-gray-600"}`}
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all
              ${checklist[i] ? "bg-extra-blue border-extra-blue" : "border-gray-300 bg-white"}`}
            >
              {checklist[i] && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </div>
            <span className={`text-sm ${checklist[i] ? "font-semibold" : "font-normal"}`}>{item}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

function RemarksPanel({ remarks, setRemarks }) {
  return (
    <SectionCard title="Remarks">
      <textarea
        value={remarks}
        onChange={e => setRemarks(e.target.value)}
        rows={5}
        placeholder="Enter inspection remarks, observations, or issues found…"
        className="w-full resize-none text-sm text-extra-darkblue placeholder-gray-300 border border-gray-200 rounded-lg p-3 outline-none focus:border-medium-blue transition-colors bg-gray-50"
      />
    </SectionCard>
  );
}

function UploadPanel({ fileName, setFileName }) {
  return (
    <SectionCard title="Upload Evidence">
      <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg p-6 cursor-pointer hover:border-medium-blue hover:bg-lightblue/20 transition-all group">
        <Upload size={22} className="text-gray-300 group-hover:text-extra-blue transition-colors" />
        <span className="text-sm font-semibold text-gray-500 group-hover:text-extra-blue transition-colors">
          {fileName ? fileName : "Click to upload photos / documents"}
        </span>
        <span className="text-xs text-gray-300">PNG, JPG, PDF up to 20MB</span>
        <input type="file" className="hidden" onChange={e => setFileName(e.target.files[0]?.name || null)} />
      </label>
    </SectionCard>
  );
}

function DecisionPanel({ allChecked, decision, setDecision }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
      <h3 className="text-sm font-bold text-extra-darkblue">Final Decision</h3>

      {decision && (
        <div className={`text-sm font-semibold text-center py-2.5 rounded-lg ${
          decision === "approved" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
        }`}>
          {decision === "approved" ? "✓ Inspection Approved" : "✗ Inspection Rejected"}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setDecision("rejected")}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
        >
          <XCircle size={15} /> Reject
        </button>
        <button
          onClick={() => setDecision("approved")}
          disabled={!allChecked}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-colors
            ${allChecked
              ? "bg-green-50 text-green-600 hover:bg-green-100"
              : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}
        >
          <CheckCircle2 size={15} /> Approve
        </button>
      </div>

      {!allChecked && (
        <p className="text-xs text-gray-400 text-center">Complete all checklist items to enable approval</p>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function QCInspection() {
  const [selected,  setSelected]  = useState(null);
  const [checklist, setChecklist] = useState(Array(CHECKLIST.length).fill(false));
  const [remarks,   setRemarks]   = useState("");
  const [fileName,  setFileName]  = useState(null);
  const [decision,  setDecision]  = useState(null);

  const toggle     = (i) => setChecklist(c => c.map((v, idx) => idx === i ? !v : v));
  const allChecked = checklist.every(Boolean);

  return (
    <div className="space-y-5">

      {/* ── Page Header ── */}
      <div>
        <h2 className="text-lg font-bold text-extra-darkblue">Inspection</h2>
        <p className="text-sm text-gray-400 mt-0.5">Select a pending inspection to begin</p>
      </div>

      {/* ── Project Selector ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Select Inspection</p>
        <ProjectSelector selected={selected} setSelected={(ins) => {
          setSelected(ins);
          setChecklist(Array(CHECKLIST.length).fill(false));
          setRemarks("");
          setFileName(null);
          setDecision(null);
        }} />
        {selected && <ProjectDetails proj={selected} />}
      </div>

      {/* ── Form — only show after selection ── */}
      {selected && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left */}
          <ChecklistPanel checklist={checklist} toggle={toggle} />

          {/* Right */}
          <div className="space-y-5">
            <RemarksPanel  remarks={remarks}   setRemarks={setRemarks}   />
            <UploadPanel   fileName={fileName} setFileName={setFileName} />
            <DecisionPanel allChecked={allChecked} decision={decision} setDecision={setDecision} />
          </div>
        </div>
      )}

    </div>
  );
}