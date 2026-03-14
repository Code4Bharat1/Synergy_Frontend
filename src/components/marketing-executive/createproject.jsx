"use client";

import { useState, useRef, useEffect } from "react";

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

const getUser = () => {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); }
  catch { return {}; }
};

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// ── API ───────────────────────────────────────────────────────────────────────
const api = {
  async getAllUsers() {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: authHeaders() });
    if (res.status === 403) return [];
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load users");
    return Array.isArray(data) ? data : (data.users || []);
  },

  async createProject(body) {
    const res = await fetch(`${API_BASE}/projects`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create project");
    return data.project;
  },
};

// ── Colour tokens ─────────────────────────────────────────────────────────────
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
  green:     "#34C759",
  red:       "#FF3B30",
};

const ROLE_LABELS = {
  admin:                "Administrator",
  director:             "Director",
  marketingExecutive:   "Marketing Executive",
  installationIncharge: "Installation Incharge",
  engineer:             "Engineer",
};
const formatRole = (r) => ROLE_LABELS[r] || r;

const STATUS_OPTIONS = [
  { value: "initiated",    label: "Initiated" },
  { value: "in-progress",  label: "In Progress" },
  { value: "installation", label: "Installation" },
  { value: "testing",      label: "Testing" },
  { value: "completed",    label: "Completed" },
  { value: "on-hold",      label: "On Hold" },
];

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = {
  ChevronLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  Upload: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
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
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Clipboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Phone: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
    </svg>
  ),
  AlignLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" />
    </svg>
  ),
  Loader: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 animate-spin">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

// ── Field Components ──────────────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-gray-400">
      {children}{required && <span className="text-[#1C4D8D]"> *</span>}
    </label>
  );
}

function Input({ icon: Ic, placeholder, value, onChange, type = "text", error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 bg-white transition-all border ${
      error ? "border-red-400" : focused ? "border-[#1C4D8D]" : "border-gray-200"
    } ${focused ? "shadow-sm" : ""}`}>
      {Ic && <span className={focused ? "text-[#1C4D8D]" : "text-gray-400"}><Ic /></span>}
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="flex-1 bg-transparent text-sm outline-none placeholder-gray-300 text-extra-darkblue" />
    </div>
  );
}

function Textarea({ icon: Ic, placeholder, value, onChange, rows = 3 }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className={`flex gap-3 rounded-lg px-3.5 py-2.5 bg-white transition-all border items-start ${
      focused ? "border-[#1C4D8D] shadow-sm" : "border-gray-200"
    }`}>
      {Ic && <span className={`mt-0.5 ${focused ? "text-[#1C4D8D]" : "text-gray-400"}`}><Ic /></span>}
      <textarea placeholder={placeholder} value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        rows={rows} className="flex-1 bg-transparent text-sm outline-none resize-none placeholder-gray-300 text-extra-darkblue"
        style={{ fontFamily: "inherit" }} />
    </div>
  );
}

function SelectField({ icon: Ic, value, onChange, options, placeholder, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 bg-white transition-all border ${
      error ? "border-red-400" : focused ? "border-[#1C4D8D]" : "border-gray-200"
    } ${focused ? "shadow-sm" : ""}`}>
      {Ic && <span className={focused ? "text-[#1C4D8D]" : "text-gray-400"}><Ic /></span>}
      <select value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="flex-1 bg-transparent text-sm outline-none appearance-none cursor-pointer"
        style={{ color: value ? C.darkBlue : "#9ca3af" }}>
        <option value="" disabled>{placeholder}</option>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
        className="w-3.5 h-3.5 flex-shrink-0 text-gray-400">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}

function ErrorMsg({ msg }) {
  if (!msg) return null;
  return <p className="text-[11px] mt-1 font-medium text-red-500">⚠ {msg}</p>;
}

// ── Single user select with avatar ────────────────────────────────────────────
function UserSelect({ users, value, onChange, placeholder, icon: Ic }) {
  const [focused, setFocused] = useState(false);
  const selected = users.find(u => u._id === value);
  return (
    <div className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 bg-white transition-all border ${
      focused ? "border-[#1C4D8D] shadow-sm" : "border-gray-200"
    }`}>
      {selected ? (
        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
          style={{ backgroundColor: C.blue }}>
          {(selected.name || selected.email || "?")[0].toUpperCase()}
        </div>
      ) : Ic && <span className={focused ? "text-[#1C4D8D]" : "text-gray-400"}><Ic /></span>}
      <select value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="flex-1 bg-transparent text-sm outline-none appearance-none cursor-pointer"
        style={{ color: value ? C.darkBlue : "#9ca3af" }}>
        <option value="">{placeholder}</option>
        {users.map(u => (
          <option key={u._id} value={u._id}>
            {u.name || u.email} — {formatRole(u.role)}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
        className="w-3.5 h-3.5 flex-shrink-0 text-gray-400">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}

// ── Multi-select checkbox dropdown for engineers ──────────────────────────────
function MultiUserSelect({ users, selected, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const toggle = (id) =>
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  const selectedUsers = users.filter(u => selected.includes(u._id));

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-left bg-white transition-all border ${
          open ? "border-[#1C4D8D] shadow-sm" : "border-gray-200"
        }`}>
        <span className={open ? "text-[#1C4D8D]" : "text-gray-400"}><Icon.Users /></span>
        <span className="flex-1 text-sm truncate" style={{ color: selectedUsers.length ? C.darkBlue : "#9ca3af" }}>
          {selectedUsers.length === 0
            ? placeholder
            : selectedUsers.map(u => u.name || u.email).join(", ")}
        </span>
        {selected.length > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
            style={{ backgroundColor: C.blue }}>
            {selected.length}
          </span>
        )}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          className="w-3.5 h-3.5 flex-shrink-0 text-gray-400">
          <path d={open ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full rounded-xl overflow-hidden shadow-xl bg-white border border-gray-100">
            {users.length === 0 ? (
              <p className="px-4 py-3 text-xs text-gray-400">No engineers found</p>
            ) : users.map(u => (
              <button key={u._id} type="button" onClick={() => toggle(u._id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 border-b border-gray-100">
                <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: selected.includes(u._id) ? C.blue : "transparent",
                    border: `2px solid ${selected.includes(u._id) ? C.blue : "#e5e7eb"}`,
                  }}>
                  {selected.includes(u._id) && <span className="text-white"><Icon.Check /></span>}
                </div>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: C.medBlue }}>
                  {(u.name || u.email || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-extra-darkblue">{u.name || u.email}</p>
                  <p className="text-[10px] text-gray-400">{formatRole(u.role)}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type, onDismiss }) {
  useEffect(() => { const t = setTimeout(onDismiss, 4500); return () => clearTimeout(t); }, [onDismiss]);
  return (
    <div className="fixed bottom-6 left-1/2 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-white text-sm font-semibold"
      style={{ backgroundColor: type === "error" ? C.red : C.green, transform: "translateX(-50%)", maxWidth: "90vw" }}>
      <span>{type === "error" ? "⚠" : "✓"}</span>
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-2 opacity-70 hover:opacity-100 text-xs">✕</button>
    </div>
  );
}

// ── Creator Badge ─────────────────────────────────────────────────────────────
function CreatorBadge({ user }) {
  if (!user?.name && !user?.email) return null;
  const initials = (user.name || user.email || "?")
    .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-gray-100 shadow-sm">
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${C.darkBlue}, ${C.blue})` }}>
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold truncate text-extra-darkblue">{user.name || user.email}</p>
        <p className="text-[11px] font-medium text-gray-400">
          {formatRole(user.role)} · Creating this project
        </p>
      </div>
      <span className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 bg-[#e0eefa] text-[#1C4D8D]">You</span>
    </div>
  );
}

function SectionHead({ children }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-[#4988C4]">
      {children}
    </p>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CreateProject() {
  const fileInputRef = useRef(null);
  const [submitted,      setSubmitted]      = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [toast,          setToast]          = useState(null);
  const [createdProject, setCreatedProject] = useState(null);
  const [currentUser,    setCurrentUser]    = useState({});
  const [allUsers,       setAllUsers]       = useState([]);
  const [usersLoading,   setUsersLoading]   = useState(false);
  const [canAssign,      setCanAssign]      = useState(false);

  useEffect(() => {
    const u = getUser();
    setCurrentUser(u);
    if (u.role === "admin" || u.role === "director") {
      setCanAssign(true);
      setUsersLoading(true);
      api.getAllUsers()
        .then(setAllUsers)
        .catch(() => {})
        .finally(() => setUsersLoading(false));
    }
  }, []);

  const marketingExecs        = allUsers.filter(u => u.role === "marketingExecutive");
  const engineers             = allUsers.filter(u => u.role === "engineer");
  const installationIncharges = allUsers.filter(u => u.role === "installationIncharge");

  const EMPTY_FORM = {
    name: "", clientName: "", clientContact: "", location: "",
    status: "initiated", description: "", startDate: "", endDate: "",
    assignedMarketingExecutive: "", assignedInstallationIncharge: "", assignedEngineers: [],
  };

  const [form,     setForm]     = useState(EMPTY_FORM);
  const [files,    setFiles]    = useState([]);
  const [errors,   setErrors]   = useState({});
  const [dragOver, setDragOver] = useState(false);

  const set = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors(p => ({ ...p, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())       e.name       = "Project name is required";
    if (!form.clientName.trim()) e.clientName = "Client name is required";
    return e;
  };

  const handleFiles = (incoming) => {
    const valid = Array.from(incoming).filter(f => f.size < 20 * 1024 * 1024);
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...valid.filter(f => !names.has(f.name))];
    });
  };

  const formatSize = (b) =>
    b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

  const handleReset = () => { setForm(EMPTY_FORM); setFiles([]); setErrors({}); };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    try {
      const payload = {
        name:       form.name.trim(),
        clientName: form.clientName.trim(),
        status:     form.status,
        ...(form.clientContact.trim()         && { clientContact:                form.clientContact.trim() }),
        ...(form.location.trim()              && { location:                     form.location.trim() }),
        ...(form.description.trim()           && { description:                  form.description.trim() }),
        ...(form.startDate                    && { startDate:                    form.startDate }),
        ...(form.endDate                      && { endDate:                      form.endDate }),
        ...(form.assignedMarketingExecutive   && { assignedMarketingExecutive:   form.assignedMarketingExecutive }),
        ...(form.assignedInstallationIncharge && { assignedInstallationIncharge: form.assignedInstallationIncharge }),
        ...(form.assignedEngineers.length     && { assignedEngineers:            form.assignedEngineers }),
      };
      const project = await api.createProject(payload);
      setCreatedProject(project);
      setSubmitted(true);
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted && createdProject) {
    const assignedME  = allUsers.find(u => u._id === form.assignedMarketingExecutive);
    const assignedII  = allUsers.find(u => u._id === form.assignedInstallationIncharge);
    const assignedEng = allUsers.filter(u => form.assignedEngineers.includes(u._id));

    return (
      <div className="flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-5 shadow-sm w-full max-w-md border border-gray-100">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${C.darkBlue}, ${C.blue})` }}>
            <span className="text-white"><Icon.CheckCircle /></span>
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-extra-darkblue">Project Created!</h2>
            <p className="text-sm mt-1 text-gray-400">Successfully submitted for review.</p>
          </div>

          <div className="w-full rounded-xl overflow-hidden border border-gray-100">
            {[
              { label: "Project Name", value: createdProject.name },
              { label: "Client",       value: createdProject.clientName },
              { label: "Status",       value: createdProject.status },
              { label: "Location",     value: createdProject.location || "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-400">{label}</span>
                <span className="text-xs font-bold capitalize text-extra-darkblue">{value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-2.5"
              style={{ borderBottom: assignedME || assignedII || assignedEng.length ? "1px solid #f3f4f6" : "none" }}>
              <span className="text-xs font-semibold text-gray-400">Created by</span>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ backgroundColor: C.blue }}>
                  {(currentUser.name || "?")[0]?.toUpperCase()}
                </div>
                <span className="text-xs font-bold text-extra-darkblue">
                  {currentUser.name || currentUser.email || "You"}
                </span>
                <span className="text-[10px] text-gray-400">({formatRole(currentUser.role)})</span>
              </div>
            </div>
            {assignedME && (
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-400">Marketing Exec</span>
                <span className="text-xs font-bold text-extra-darkblue">{assignedME.name || assignedME.email}</span>
              </div>
            )}
            {assignedII && (
              <div className="flex items-center justify-between px-4 py-2.5"
                style={{ borderBottom: assignedEng.length ? "1px solid #f3f4f6" : "none" }}>
                <span className="text-xs font-semibold text-gray-400">Installation IC</span>
                <span className="text-xs font-bold text-extra-darkblue">{assignedII.name || assignedII.email}</span>
              </div>
            )}
            {assignedEng.length > 0 && (
              <div className="flex items-start justify-between px-4 py-2.5">
                <span className="text-xs font-semibold text-gray-400">Engineers</span>
                <div className="flex flex-col items-end gap-0.5">
                  {assignedEng.map(u => (
                    <span key={u._id} className="text-xs font-bold text-extra-darkblue">
                      {u.name || u.email}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={() => { setSubmitted(false); setCreatedProject(null); handleReset(); }}
            className="w-full py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: C.darkBlue }}>
            Create Another Project
          </button>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div>
      <main className="p-4 md:p-6">

        <div className="flex items-center gap-3 mb-5">
          <button className="p-2 rounded-lg transition-colors bg-white border border-gray-200 text-gray-400 hover:bg-gray-50">
            <Icon.ChevronLeft />
          </button>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Projects</p>
            <h2 className="text-base font-bold leading-tight text-extra-darkblue">Create New Project</h2>
          </div>
        </div>

        <div className="mb-4"><CreatorBadge user={currentUser} /></div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">

          {/* Header */}
          <div className="px-5 md:px-7 py-4 flex items-center gap-3 border-b border-gray-100 bg-gray-50">
            <div className="p-2 rounded-lg" style={{ backgroundColor: C.darkBlue }}>
              <span style={{ color: C.white }}><Icon.Clipboard /></span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-extra-darkblue">Project Details</h3>
              <p className="text-[11px] text-gray-400">Fill in all required information to register a new project</p>
            </div>
          </div>

          <div className="px-5 md:px-7 py-6 space-y-7">

            {/* ── 1. Basic Info ── */}
            <div>
              <SectionHead>Basic Information</SectionHead>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <Label required>Project Name</Label>
                  <Input icon={Icon.Hash} placeholder="e.g. Gulf Leisure Phase 2 Installation"
                    value={form.name} onChange={set("name")} error={errors.name} />
                  <ErrorMsg msg={errors.name} />
                </div>
                <div>
                  <Label required>Client Name</Label>
                  <Input icon={Icon.User} placeholder="e.g. Gulf Leisure"
                    value={form.clientName} onChange={set("clientName")} error={errors.clientName} />
                  <ErrorMsg msg={errors.clientName} />
                </div>
                <div>
                  <Label>Client Contact</Label>
                  <Input icon={Icon.Phone} placeholder="e.g. +971 50 000 0000"
                    value={form.clientContact} onChange={set("clientContact")} />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input icon={Icon.MapPin} placeholder="e.g. Riyadh, Saudi Arabia"
                    value={form.location} onChange={set("location")} />
                </div>
                <div>
                  <Label>Status</Label>
                  <SelectField icon={Icon.Wrench} value={form.status} onChange={set("status")}
                    options={STATUS_OPTIONS} placeholder="Select status…" />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* ── 2. Schedule ── */}
            <div>
              <SectionHead>Schedule</SectionHead>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Label>Start Date</Label>
                  <Input icon={Icon.Calendar} type="date" value={form.startDate} onChange={set("startDate")} />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input icon={Icon.Calendar} type="date" value={form.endDate} onChange={set("endDate")} />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* ── 3. Staff Assignment (admin/director only) ── */}
            {canAssign && (
              <>
                <div>
                  <SectionHead>Staff Assignment</SectionHead>
                  {usersLoading ? (
                    <div className="flex items-center gap-2 py-3 text-gray-400">
                      <Icon.Loader /><span className="text-xs">Loading users…</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <Label>Marketing Executive</Label>
                        {marketingExecs.length === 0 ? (
                          <div className="rounded-lg px-3.5 py-2.5 text-xs bg-white border border-gray-200 text-gray-400">
                            No marketing executives in system
                          </div>
                        ) : (
                          <UserSelect users={marketingExecs} value={form.assignedMarketingExecutive}
                            onChange={set("assignedMarketingExecutive")}
                            placeholder="Select marketing executive…" icon={Icon.User} />
                        )}
                      </div>

                      <div>
                        <Label>Installation Incharge</Label>
                        {installationIncharges.length === 0 ? (
                          <div className="rounded-lg px-3.5 py-2.5 text-xs bg-white border border-gray-200 text-gray-400">
                            No installation incharges in system
                          </div>
                        ) : (
                          <UserSelect users={installationIncharges} value={form.assignedInstallationIncharge}
                            onChange={set("assignedInstallationIncharge")}
                            placeholder="Select installation incharge…" icon={Icon.User} />
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <Label>Assigned Engineers</Label>
                        <MultiUserSelect
                          users={engineers}
                          selected={form.assignedEngineers}
                          onChange={(val) => setForm(f => ({ ...f, assignedEngineers: val }))}
                          placeholder="Select one or more engineers…"
                        />
                        {engineers.length === 0 && (
                          <p className="text-[11px] mt-1 text-gray-400">No engineers found in the system.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="border-t border-gray-100" />
              </>
            )}

            {/* ── 4. Description ── */}
            <div>
              <SectionHead>Description</SectionHead>
              <Label>Project Description</Label>
              <Textarea icon={Icon.AlignLeft}
                placeholder="Describe the project scope, requirements, or any special instructions…"
                value={form.description} onChange={set("description")} rows={3} />
            </div>

            <div className="border-t border-gray-100" />

            {/* ── 5. Documents ── */}
            <div>
              <SectionHead>Design Documents</SectionHead>
              <p className="text-[11px] mb-3 text-gray-400">
                Upload PDFs, drawings, or design files. Max 20 MB each.
              </p>
              <div className="rounded-xl transition-all cursor-pointer"
                style={{
                  border: `2px dashed ${dragOver ? C.blue : "#e5e7eb"}`,
                  backgroundColor: dragOver ? "#eff6ff" : "#f9fafb",
                  padding: "2rem 1.5rem",
                }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}>
                <input ref={fileInputRef} type="file" multiple
                  accept=".pdf,.doc,.docx,.dwg,.png,.jpg,.jpeg" className="hidden"
                  onChange={(e) => handleFiles(e.target.files)} />
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: dragOver ? C.blue : C.lightBlue }}>
                    <span style={{ color: dragOver ? C.white : C.darkBlue }}><Icon.Upload /></span>
                  </div>
                  <p className="text-sm font-semibold text-extra-darkblue">
                    {dragOver ? "Drop files here" : "Click to upload or drag & drop"}
                  </p>
                  <p className="text-[11px] text-gray-400">PDF, DOC, DWG, PNG, JPG supported</p>
                </div>
              </div>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map(f => (
                    <div key={f.name} className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 bg-white border border-gray-100">
                      <span style={{ color: C.blue }}><Icon.File /></span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate text-extra-darkblue">{f.name}</p>
                        <p className="text-[11px] text-gray-400">{formatSize(f.size)}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setFiles(prev => prev.filter(x => x.name !== f.name)); }}
                        className="p-1 rounded-md flex-shrink-0 transition-colors text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <Icon.X />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 md:px-7 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-gray-100 bg-gray-50">
            <p className="text-[11px] text-gray-400">
              Fields marked with <span style={{ color: C.blue }}>*</span> are required
            </p>
            <div className="flex gap-3">
              <button onClick={handleReset} disabled={submitting}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-100 disabled:opacity-40 transition-colors bg-white border border-gray-200 text-gray-500">
                Clear
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-60 flex items-center gap-2 justify-center transition-opacity text-white"
                style={{ backgroundColor: C.darkBlue }}>
                {submitting ? <><Icon.Loader /> Creating…</> : "Create Project"}
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] mt-4 text-gray-400">
          Project will be submitted for eligibility review after creation.
        </p>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}