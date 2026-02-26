"use client";
import { useState } from "react";
import { ChevronDown, X, CheckCircle2, HardHat, ShieldCheck, MessageSquareWarning } from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────
const PROJECTS = ["Greenfield Complex", "Harbor View Tower", "Westgate Mall", "Sunrise Residency"];

const ALL_USERS = ["Ahmad Raza", "Sara Malik", "James K.", "Priya Nair", "Omar Sheikh", "Bilal Khan", "Riya Sharma"];

const INITIAL_ASSIGNMENTS = {
  "Greenfield Complex":  { engineers: ["Sara Malik", "Omar Sheikh"], qc: ["Ahmad Raza"],  complaints: ["James K."]   },
  "Harbor View Tower":   { engineers: ["Bilal Khan"],                qc: ["Priya Nair"],  complaints: ["Riya Sharma"] },
  "Westgate Mall":       { engineers: ["James K."],                  qc: [],              complaints: []              },
  "Sunrise Residency":   { engineers: ["Ahmad Raza"],                qc: ["Sara Malik"],  complaints: ["Omar Sheikh"] },
};

// ── Multi-select dropdown ─────────────────────────────────────────────────────
function MultiSelect({ label, icon: Icon, color, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const available = ALL_USERS.filter(u => !selected.includes(u));

  return (
    <div>
      <div className={`flex items-center gap-2 mb-2`}>
        <Icon size={13} className={color} />
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full bg-lightblue text-extra-blue`}>{selected.length}</span>
      </div>

      {/* Selected chips */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {selected.map(u => (
          <span key={u} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-lightblue text-extra-blue">
            {u}
            <button onClick={() => onChange(selected.filter(s => s !== u))} className="hover:text-red-500 transition-colors">
              <X size={10} />
            </button>
          </span>
        ))}
        {selected.length === 0 && <span className="text-xs text-gray-300">No one assigned yet</span>}
      </div>

      {/* Add dropdown */}
      {available.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 text-xs font-semibold text-extra-blue hover:underline"
          >
            + Assign <ChevronDown size={11} className={open ? "rotate-180" : ""} />
          </button>
          {open && (
            <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden w-48">
              {available.map(u => (
                <button
                  key={u}
                  onClick={() => { onChange([...selected, u]); setOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-extra-darkblue hover:bg-gray-50 transition-colors"
                >
                  {u}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function RoleAssignment() {
  const [assignments, setAssignments] = useState(INITIAL_ASSIGNMENTS);
  const [toast,       setToast]       = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const update = (project, type, value) => {
    setAssignments(p => ({ ...p, [project]: { ...p[project], [type]: value } }));
  };

  const handleSave = (project) => {
    showToast(`${project} assignments saved`);
  };

  return (
    <div className="space-y-5">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-extra-darkblue text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg">
          <CheckCircle2 size={15} className="text-green-400" /> {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-extra-darkblue">Role Assignment</h2>
        <p className="text-sm text-gray-400 mt-0.5">Assign engineers, QC inspectors and complaint handlers per project</p>
      </div>

      {/* Project Assignment Cards */}
      <div className="space-y-4">
        {PROJECTS.map(project => {
          const a = assignments[project] || { engineers: [], qc: [], complaints: [] };
          return (
            <div key={project} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Project header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between"
                style={{ background: "linear-gradient(135deg, #0F2854, #1C4D8D)" }}>
                <div>
                  <h3 className="text-sm font-bold text-white">{project}</h3>
                  <p className="text-xs text-blue-300 mt-0.5">
                    {a.engineers.length} engineers · {a.qc.length} QC · {a.complaints.length} complaint
                  </p>
                </div>
                <button
                  onClick={() => handleSave(project)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white text-extra-darkblue hover:bg-lightblue transition-colors"
                >
                  Save
                </button>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                <MultiSelect
                  label="Site Engineers"
                  icon={HardHat}
                  color="text-amber-500"
                  selected={a.engineers}
                  onChange={(val) => update(project, "engineers", val)}
                />
                <div className="pt-4 md:pt-0 md:pl-6">
                  <MultiSelect
                    label="QC Inspectors"
                    icon={ShieldCheck}
                    color="text-extra-blue"
                    selected={a.qc}
                    onChange={(val) => update(project, "qc", val)}
                  />
                </div>
                <div className="pt-4 md:pt-0 md:pl-6">
                  <MultiSelect
                    label="Complaint Team"
                    icon={MessageSquareWarning}
                    color="text-red-400"
                    selected={a.complaints}
                    onChange={(val) => update(project, "complaints", val)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}