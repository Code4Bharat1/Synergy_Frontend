"use client";
import { useState } from "react";
import { Plus, Edit2, X, CheckCircle2, MapPin, Calendar, User } from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────
const IN_CHARGES = ["Ahmad Raza", "Sara Malik", "James K.", "Priya Nair", "Omar Sheikh"];

const INITIAL_PROJECTS = [
  { id: 1, name: "Greenfield Complex",  location: "Karachi",  inCharge: "Ahmad Raza",  startDate: "01 Jan 2026", status: "Active",     progress: 65 },
  { id: 2, name: "Harbor View Tower",   location: "Lahore",   inCharge: "Sara Malik",  startDate: "15 Jan 2026", status: "Active",     progress: 40 },
  { id: 3, name: "Westgate Mall",       location: "Islamabad",inCharge: "James K.",    startDate: "05 Feb 2026", status: "Active",     progress: 20 },
  { id: 4, name: "Sunrise Residency",   location: "Karachi",  inCharge: "Priya Nair",  startDate: "10 Dec 2025", status: "Completed",  progress: 100 },
];

const EMPTY_FORM = { name: "", location: "", inCharge: IN_CHARGES[0], startDate: "" };

const STATUS_STYLE = {
  Active:    "bg-green-50 text-green-600",
  Completed: "bg-blue-50 text-extra-blue",
  "On Hold":   "bg-amber-50 text-amber-600",
};

// ── Reusable ──────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-extra-darkblue">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-medium-blue transition-colors text-extra-darkblue placeholder-gray-300";

// ── Component ─────────────────────────────────────────────────────────────────
export default function ProjectManagement() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [modal,    setModal]    = useState(null); // null | "create" | "edit"
  const [selected, setSelected] = useState(null);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [toast,    setToast]    = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const openEdit = (p) => {
    setSelected(p);
    setForm({ name: p.name, location: p.location, inCharge: p.inCharge, startDate: p.startDate });
    setModal("edit");
  };

  const handleCreate = () => {
    if (!form.name || !form.location) return;
    setProjects(prev => [...prev, { id: Date.now(), ...form, status: "Active", progress: 0 }]);
    setModal(null); setForm(EMPTY_FORM); showToast("Project created");
  };

  const handleEdit = () => {
    setProjects(prev => prev.map(p => p.id === selected.id ? { ...p, ...form } : p));
    setModal(null); showToast("Project updated");
  };

  return (
    <div className="space-y-5">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-extra-darkblue text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg">
          <CheckCircle2 size={15} className="text-green-400" /> {toast}
        </div>
      )}

      {/* Modals */}
      {modal === "create" && (
        <Modal title="Create Project" onClose={() => setModal(null)}>
          <Field label="Project Name"><input className={inputCls} placeholder="e.g. Greenfield Complex" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></Field>
          <Field label="Location"><input className={inputCls} placeholder="e.g. Karachi" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} /></Field>
          <Field label="Installation In-Charge">
            <select className={inputCls} value={form.inCharge} onChange={e => setForm(p => ({ ...p, inCharge: e.target.value }))}>
              {IN_CHARGES.map(i => <option key={i}>{i}</option>)}
            </select>
          </Field>
          <Field label="Start Date"><input type="date" className={inputCls} value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} /></Field>
          <button onClick={handleCreate} className="w-full py-2.5 rounded-xl text-sm font-bold text-white mt-2" style={{ background: "#0F2854" }}>Create Project</button>
        </Modal>
      )}

      {modal === "edit" && (
        <Modal title="Edit Project" onClose={() => setModal(null)}>
          <Field label="Project Name"><input className={inputCls} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></Field>
          <Field label="Location"><input className={inputCls} value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} /></Field>
          <Field label="Installation In-Charge">
            <select className={inputCls} value={form.inCharge} onChange={e => setForm(p => ({ ...p, inCharge: e.target.value }))}>
              {IN_CHARGES.map(i => <option key={i}>{i}</option>)}
            </select>
          </Field>
          <button onClick={handleEdit} className="w-full py-2.5 rounded-xl text-sm font-bold text-white mt-2" style={{ background: "#0F2854" }}>Save Changes</button>
        </Modal>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-extra-darkblue">Project Management</h2>
          <p className="text-sm text-gray-400 mt-0.5">{projects.length} projects</p>
        </div>
        <button onClick={() => { setForm(EMPTY_FORM); setModal("create"); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow hover:opacity-90 transition-all"
          style={{ background: "#0F2854" }}>
          <Plus size={15} /> Create Project
        </button>
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:border-lightblue transition-colors">
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-extra-darkblue">{p.name}</h3>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                    <MapPin size={11} /> {p.location}
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLE[p.status]}`}>{p.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <User size={11} className="text-extra-blue" />
                  <span className="font-medium">{p.inCharge}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Calendar size={11} className="text-extra-blue" />
                  <span>{p.startDate}</span>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-400">Progress</span>
                  <span className="font-bold text-extra-blue">{p.progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${p.progress}%`,
                      background: p.progress === 100 ? "#16a34a" : "#1C4D8D"
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button onClick={() => openEdit(p)}
                className="flex items-center gap-1.5 text-xs font-semibold text-extra-blue hover:underline">
                <Edit2 size={12} /> Edit Project
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}