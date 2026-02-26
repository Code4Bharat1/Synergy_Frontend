"use client";

import { useState, useRef } from "react";

const C = {
  darkBlue:  "#0F2854",
  blue:      "#1C4D8D",
  medBlue:   "#4988C4",
  lightBlue: "#BDE8F5",
  bg:        "#f0f6fb",
  mutedText: "#6b89a5",
  dimText:   "#8fa3b8",
  white:     "#ffffff",
  divider:   "#e3eff8",
};

// ── Icons ─────────────────────────────────────
const Icon = {
  Bell: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  Upload: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  File: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Hash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  ),
  User: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  MapPin: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Wrench: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  CheckCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Clipboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
    </svg>
  ),
};

const INSTALLATION_TYPES = [
  "Full Installation",
  "Partial Setup",
  "Equipment Inspection",
  "System Upgrade",
  "Maintenance & Repair",
  "Site Survey",
];

// ── Field Components ──────────────────────────

function Label({ children, required }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.mutedText }}>
      {children} {required && <span style={{ color: C.blue }}>*</span>}
    </label>
  );
}

function Input({ icon: Ic, placeholder, value, onChange, type = "text", error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 transition-all"
      style={{
        border: `1.5px solid ${error ? C.darkBlue : focused ? C.blue : C.lightBlue}`,
        backgroundColor: focused ? C.white : C.bg,
      }}
    >
      {Ic && <span style={{ color: focused ? C.blue : C.medBlue }}><Ic /></span>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="flex-1 bg-transparent text-sm outline-none placeholder-[#8fa3b8]"
        style={{ color: C.darkBlue }}
      />
    </div>
  );
}

function Select({ icon: Ic, value, onChange, options, placeholder, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 transition-all"
      style={{
        border: `1.5px solid ${error ? C.darkBlue : focused ? C.blue : C.lightBlue}`,
        backgroundColor: focused ? C.white : C.bg,
      }}
    >
      {Ic && <span style={{ color: focused ? C.blue : C.medBlue }}><Ic /></span>}
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="flex-1 bg-transparent text-sm outline-none appearance-none cursor-pointer"
        style={{ color: value ? C.darkBlue : C.dimText }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 flex-shrink-0" style={{ color: C.medBlue }}>
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}

function ErrorMsg({ msg }) {
  if (!msg) return null;
  return <p className="text-[11px] mt-1 font-medium" style={{ color: C.darkBlue }}>⚠ {msg}</p>;
}

// ── Main Page ─────────────────────────────────
export default function CreateProject() {
  const fileInputRef = useRef(null);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    projectNumber: "",
    clientName: "",
    location: "",
    installationType: "",
  });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [dragOver, setDragOver] = useState(false);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.projectNumber.trim()) e.projectNumber = "Project number is required";
    if (!form.clientName.trim())    e.clientName    = "Client name is required";
    if (!form.location.trim())      e.location      = "Location is required";
    if (!form.installationType)     e.installationType = "Please select an installation type";
    return e;
  };

  const handleFiles = (incoming) => {
    const valid = Array.from(incoming).filter(f => f.size < 20 * 1024 * 1024);
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...valid.filter(f => !names.has(f.name))];
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (name) => setFiles(f => f.filter(x => x.name !== name));

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitted(true);
  };

  // ── Success State ──
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: C.bg }}>
        <div className="bg-white rounded-2xl p-10 flex flex-col items-center gap-4 shadow-sm max-w-sm w-full text-center"
          style={{ border: `1px solid ${C.lightBlue}` }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: C.lightBlue }}>
            <span style={{ color: C.darkBlue }}><Icon.CheckCircle /></span>
          </div>
          <h2 className="text-lg font-bold" style={{ color: C.darkBlue }}>Project Created</h2>
          <p className="text-sm" style={{ color: C.mutedText }}>
            <span className="font-semibold" style={{ color: C.blue }}>{form.projectNumber}</span> has been submitted successfully.
          </p>
          <button
            onClick={() => { setSubmitted(false); setForm({ projectNumber: "", clientName: "", location: "", installationType: "" }); setFiles([]); setErrors({}); }}
            className="mt-2 text-sm font-semibold px-5 py-2.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ backgroundColor: C.darkBlue, color: C.white }}
          >
            Create Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>

      

      {/* ── Page Content ── */}
      <main className="p-4 md:p-6 max-w-3xl mx-auto">

        {/* Page heading */}
        <div className="flex items-center gap-3 mb-6">
          <button
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: C.white, border: `1px solid ${C.lightBlue}`, color: C.medBlue }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = C.lightBlue}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = C.white}
          >
            <Icon.ChevronLeft />
          </button>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.dimText }}>Projects</p>
            <h2 className="text-base font-bold leading-tight" style={{ color: C.darkBlue }}>Create New Project</h2>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: `1px solid ${C.lightBlue}` }}>

          {/* Card header */}
          <div className="px-5 md:px-7 py-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.divider}`, backgroundColor: C.bg }}>
            <div className="p-2 rounded-lg" style={{ backgroundColor: C.darkBlue }}>
              <span style={{ color: C.white }}><Icon.Clipboard /></span>
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: C.darkBlue }}>Project Details</h3>
              <p className="text-[11px]" style={{ color: C.dimText }}>Fill in the information below to register a new project</p>
            </div>
          </div>

          <div className="px-5 md:px-7 py-6 space-y-6">

            {/* Row 1: Project Number + Client Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label required>Project Number</Label>
                <Input
                  icon={Icon.Hash}
                  placeholder="e.g. PRJ-2430"
                  value={form.projectNumber}
                  onChange={set("projectNumber")}
                  error={errors.projectNumber}
                />
                <ErrorMsg msg={errors.projectNumber} />
              </div>
              <div>
                <Label required>Client Name</Label>
                <Input
                  icon={Icon.User}
                  placeholder="e.g. Gulf Leisure"
                  value={form.clientName}
                  onChange={set("clientName")}
                  error={errors.clientName}
                />
                <ErrorMsg msg={errors.clientName} />
              </div>
            </div>

            {/* Row 2: Location + Installation Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label required>Location</Label>
                <Input
                  icon={Icon.MapPin}
                  placeholder="e.g. Riyadh, Saudi Arabia"
                  value={form.location}
                  onChange={set("location")}
                  error={errors.location}
                />
                <ErrorMsg msg={errors.location} />
              </div>
              <div>
                <Label required>Installation Type</Label>
                <Select
                  icon={Icon.Wrench}
                  value={form.installationType}
                  onChange={set("installationType")}
                  options={INSTALLATION_TYPES}
                  placeholder="Select type…"
                  error={errors.installationType}
                />
                <ErrorMsg msg={errors.installationType} />
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: `1px solid ${C.divider}` }} />

            {/* Upload Section */}
            <div>
              <Label>Design Documents</Label>
              <p className="text-[11px] mb-3" style={{ color: C.dimText }}>
                Upload PDFs, drawings, or any relevant design files. Max 20 MB per file.
              </p>

              {/* Drop Zone */}
              <div
                className="rounded-xl transition-all cursor-pointer"
                style={{
                  border: `2px dashed ${dragOver ? C.blue : C.lightBlue}`,
                  backgroundColor: dragOver ? `${C.lightBlue}40` : C.bg,
                  padding: "2rem 1.5rem",
                }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.dwg,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <div className="flex flex-col items-center gap-2 text-center">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: dragOver ? C.blue : C.lightBlue }}
                  >
                    <span style={{ color: dragOver ? C.white : C.darkBlue }}><Icon.Upload /></span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: C.darkBlue }}>
                    {dragOver ? "Drop files here" : "Click to upload or drag & drop"}
                  </p>
                  <p className="text-[11px]" style={{ color: C.dimText }}>PDF, DOC, DWG, PNG, JPG supported</p>
                </div>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map(f => (
                    <div
                      key={f.name}
                      className="flex items-center gap-3 rounded-lg px-3.5 py-2.5"
                      style={{ backgroundColor: C.white, border: `1px solid ${C.divider}` }}
                    >
                      <span style={{ color: C.blue }}><Icon.File /></span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: C.darkBlue }}>{f.name}</p>
                        <p className="text-[11px]" style={{ color: C.dimText }}>{formatSize(f.size)}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(f.name); }}
                        className="p-1 rounded-md transition-colors flex-shrink-0"
                        style={{ color: C.dimText }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.lightBlue; e.currentTarget.style.color = C.darkBlue; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = C.dimText; }}
                      >
                        <Icon.X />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div
            className="px-5 md:px-7 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
            style={{ borderTop: `1px solid ${C.divider}`, backgroundColor: C.bg }}
          >
            <p className="text-[11px]" style={{ color: C.dimText }}>
              Fields marked with <span style={{ color: C.blue }}>*</span> are required
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ backgroundColor: C.white, border: `1px solid ${C.lightBlue}`, color: C.mutedText }}
                onClick={() => { setForm({ projectNumber: "", clientName: "", location: "", installationType: "" }); setFiles([]); setErrors({}); }}
              >
                Clear
              </button>
              <button
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
                style={{ backgroundColor: C.darkBlue, color: C.white }}
                onClick={handleSubmit}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>

        {/* Helper note */}
        <p className="text-center text-[11px] mt-4" style={{ color: C.dimText }}>
          Project will be submitted for eligibility review after creation.
        </p>
      </main>
    </div>
  );
}