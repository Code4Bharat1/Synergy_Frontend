"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, Edit2, KeyRound, UserX, X, CheckCircle2,
  MoreVertical, RefreshCw, Loader, Phone, Shield, AlertCircle,
} from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// ── API client ────────────────────────────────────────────────────────────────
// Routes: POST /admin/users  GET /admin/users  GET /admin/users/:id
//         PUT  /admin/users/:id   DELETE /admin/users/:id
const api = {
  async getAll() {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load users");
    return Array.isArray(data) ? data : (data.users || []);
  },

  async create(body) {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: "POST", headers: authHeaders(), body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create user");
    return data.user;
  },

  async update(id, body) {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: "PUT", headers: authHeaders(), body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update user");
    return data.user;
  },

  async remove(id) {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: "DELETE", headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete user");
  },
};

// ── Constants ─────────────────────────────────────────────────────────────────
// Roles exactly as defined in the User schema enum
const ROLES = [
  "admin",
  "director",
  "engineer",
  "support",
  "installationIncharge",
  "marketingCoordinator",
  "marketingExecutive",
  "qualityControl",
];

const STATUSES = ["active", "inactive", "suspended"];

// Pretty-print role / status for display
const fmtRole = (r) =>
  r ? r.replace(/([A-Z])/g, " $1").replace(/\b\w/g, c => c.toUpperCase()).trim() : "—";

const fmtStatus = (s) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const STATUS_CLS = {
  active:    "bg-green-50 text-green-600",
  inactive:  "bg-gray-100 text-gray-400",
  suspended: "bg-red-50 text-red-500",
};

// ── Empty form ────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: "", email: "", phone: "", role: "engineer", status: "active", password: "",
};

// ── Shared UI pieces ──────────────────────────────────────────────────────────
const inputCls = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 transition-colors text-gray-800 placeholder-gray-300";

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 z-10 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
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

// ── UserForm — defined OUTSIDE main component to prevent remount/focus loss ───
function UserForm({ form, setForm, isCreate = false }) {
  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Full Name *">
          <input className={inputCls} placeholder="e.g. Ahmad Raza"
            value={form.name} onChange={set("name")} />
        </Field>
        <Field label="Phone">
          <input className={inputCls} placeholder="+92 300 0000000"
            value={form.phone} onChange={set("phone")} />
        </Field>
      </div>
      <Field label="Email *">
        <input type="email" className={inputCls} placeholder="user@company.com"
          value={form.email} onChange={set("email")} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Role">
          <select className={inputCls} value={form.role} onChange={set("role")}>
            {ROLES.map(r => <option key={r} value={r}>{fmtRole(r)}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select className={inputCls} value={form.status} onChange={set("status")}>
            {STATUSES.map(s => <option key={s} value={s}>{fmtStatus(s)}</option>)}
          </select>
        </Field>
      </div>
      {isCreate && (
        <Field label="Password *">
          <input type="password" className={inputCls} placeholder="Min 8 characters"
            value={form.password} onChange={set("password")} />
        </Field>
      )}
    </>
  );
}

// ── Mobile card ───────────────────────────────────────────────────────────────
function UserCard({ user, onEdit, onReset, onDelete }) {
  const [open, setOpen] = useState(false);
  const actions = [
    { label: "Edit User",       icon: Edit2,   fn: () => onEdit(user),   cls: "text-gray-700" },
    { label: "Reset Password",  icon: KeyRound, fn: () => onReset(user),  cls: "text-amber-500" },
    { label: "Delete User",     icon: UserX,   fn: () => onDelete(user), cls: "text-red-500"  },
  ];
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
            {(user.name || user.email).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{user.name || "—"}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
        <div className="relative shrink-0">
          <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <MoreVertical size={16} />
          </button>
          {open && (
            <div className="absolute right-0 top-8 z-20 bg-white border border-gray-100 rounded-xl shadow-xl w-44 overflow-hidden">
              {actions.map(a => (
                <button key={a.label} onClick={() => { a.fn(); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors ${a.cls}`}>
                  <a.icon size={14} /> {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 items-center">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">{fmtRole(user.role)}</span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CLS[user.status] || "bg-gray-100 text-gray-400"}`}>
          {fmtStatus(user.status)}
        </span>
        {user.phone && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Phone size={10} /> {user.phone}
          </span>
        )}
        <span className="text-xs text-gray-400 ml-auto">
          {fmtDate(user.createdAt)}
        </span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function UserManagement() {
  const [users,    setUsers]    = useState([]);
  const [fetching, setFetching] = useState(true);
  const [search,   setSearch]   = useState("");
  const [modal,    setModal]    = useState(null);   // null | "create" | "edit" | "reset" | "delete"
  const [selected, setSelected] = useState(null);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);   // { msg, type }

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  // ── Load all users ─────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setFetching(true);
    try {
      const data = await api.getAll();
      setUsers(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ── Openers ────────────────────────────────────────────────────────────────
  const openCreate = () => { setForm(EMPTY_FORM); setModal("create"); };
  const openEdit   = (u) => {
    setSelected(u);
    setForm({ name: u.name || "", email: u.email, phone: u.phone || "", role: u.role, status: u.status, password: "" });
    setModal("edit");
  };
  const openReset  = (u) => { setSelected(u); setModal("reset"); };
  const openDelete = (u) => { setSelected(u); setModal("delete"); };

  // ── Create ─────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      showToast("Name, email and password are required", "error"); return;
    }
    setSaving(true);
    try {
      const user = await api.create({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        role: form.role,
        status: form.status,
        password: form.password,
      });
      setUsers(prev => [user, ...prev]);
      setModal(null);
      showToast("User created");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const handleEdit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      showToast("Name and email are required", "error"); return;
    }
    setSaving(true);
    try {
      const updated = await api.update(selected._id, {
        name:   form.name.trim(),
        email:  form.email.trim(),
        phone:  form.phone.trim() || undefined,
        role:   form.role,
        status: form.status,
      });
      setUsers(prev => prev.map(u => u._id === updated._id ? updated : u));
      setModal(null);
      showToast("User updated");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Reset password — calls PUT /admin/users/:id with a new password ────────
  const handleReset = async (newPassword) => {
    if (!newPassword || newPassword.length < 8) {
      showToast("Password must be at least 8 characters", "error"); return;
    }
    setSaving(true);
    try {
      await api.update(selected._id, { password: newPassword });
      setModal(null);
      showToast("Password reset successfully");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.remove(selected._id);
      setUsers(prev => prev.filter(u => u._id !== selected._id));
      setModal(null);
      showToast("User deleted");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = users.filter(u =>
    [u.name, u.email, u.role, u.phone].some(f =>
      f?.toLowerCase().includes(search.toLowerCase())
    )
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg ${toast.type === "error" ? "bg-red-500" : "bg-gray-900"}`}>
          {toast.type === "error"
            ? <AlertCircle size={15} className="text-red-200" />
            : <CheckCircle2 size={15} className="text-green-400" />}
          {toast.msg}
        </div>
      )}

      {/* ── Create Modal ─────────────────────────────────────────────────── */}
      {modal === "create" && (
        <Modal title="Create User" onClose={() => !saving && setModal(null)}>
          <UserForm form={form} setForm={setForm} isCreate />
          <button onClick={handleCreate} disabled={saving}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#0F2854" }}>
            {saving && <Loader size={14} className="animate-spin" />}
            Create User
          </button>
        </Modal>
      )}

      {/* ── Edit Modal ───────────────────────────────────────────────────── */}
      {modal === "edit" && (
        <Modal title="Edit User" onClose={() => !saving && setModal(null)}>
          <UserForm form={form} setForm={setForm} isCreate={false} />
          <button onClick={handleEdit} disabled={saving}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#0F2854" }}>
            {saving && <Loader size={14} className="animate-spin" />}
            Save Changes
          </button>
        </Modal>
      )}

      {/* ── Reset Password Modal ─────────────────────────────────────────── */}
      {modal === "reset" && (
        <ResetPasswordModal
          user={selected}
          saving={saving}
          onSubmit={handleReset}
          onClose={() => !saving && setModal(null)}
        />
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────────── */}
      {modal === "delete" && (
        <Modal title="Delete User" onClose={() => !saving && setModal(null)}>
          <p className="text-sm text-gray-500">
            Permanently delete{" "}
            <strong className="text-gray-900">{selected?.name || selected?.email}</strong>?
            This cannot be undone.
          </p>
          <button onClick={handleDelete} disabled={saving}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white mt-2 bg-red-500 hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-60">
            {saving && <Loader size={14} className="animate-spin" />}
            Yes, Delete User
          </button>
          <button onClick={() => setModal(null)} disabled={saving}
            className="w-full py-2 rounded-xl text-xs font-semibold text-gray-400 border border-gray-200 hover:bg-gray-50">
            Cancel
          </button>
        </Modal>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {fetching ? "Loading…" : `${users.length} user${users.length !== 1 ? "s" : ""} total`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadUsers} disabled={fetching}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 disabled:opacity-40">
            <RefreshCw size={14} className={fetching ? "animate-spin" : ""} />
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow hover:opacity-90"
            style={{ background: "#0F2854" }}>
            <Plus size={15} /> Create User
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
        <input type="text" placeholder="Search by name, email, role or phone…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 transition-colors text-gray-800 placeholder-gray-300 bg-white" />
      </div>

      {/* Loading skeleton */}
      {fetching && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!fetching && users.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-2xl mb-2">👤</p>
          <p className="text-sm font-semibold text-gray-500">No users found</p>
          <p className="text-xs text-gray-400 mt-1">Click "Create User" to add the first one.</p>
        </div>
      )}

      {/* Mobile cards */}
      {!fetching && filtered.length > 0 && (
        <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(u => (
            <UserCard key={u._id} user={u} onEdit={openEdit} onReset={openReset} onDelete={openDelete} />
          ))}
        </div>
      )}
      {!fetching && filtered.length === 0 && users.length > 0 && (
        <p className="text-sm text-gray-400 text-center py-8">No users match your search.</p>
      )}

      {/* Desktop table */}
      {!fetching && filtered.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Name", "Email", "Phone", "Role", "Status", "Joined", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(u => (
                <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {(u.name || u.email).charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-900">{u.name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{u.email}</td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{u.phone || "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                      {fmtRole(u.role)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CLS[u.status] || "bg-gray-100 text-gray-400"}`}>
                      {fmtStatus(u.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                    {fmtDate(u.createdAt)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(u)} title="Edit"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => openReset(u)} title="Reset Password"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-all">
                        <KeyRound size={14} />
                      </button>
                      <button onClick={() => openDelete(u)} title="Delete User"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                        <UserX size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Reset Password Modal — separate component keeps its own local state ───────
function ResetPasswordModal({ user, saving, onSubmit, onClose }) {
  const [pw,  setPw]  = useState("");
  const [pw2, setPw2] = useState("");

  return (
    <Modal title="Reset Password" onClose={onClose}>
      <p className="text-sm text-gray-500">
        Set a new password for{" "}
        <strong className="text-gray-900">{user?.name || user?.email}</strong>.
      </p>
      <Field label="New Password">
        <input type="password" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 transition-colors text-gray-800 placeholder-gray-300"
          placeholder="Min 8 characters" value={pw} onChange={e => setPw(e.target.value)} />
      </Field>
      <Field label="Confirm Password">
        <input type="password" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 transition-colors text-gray-800 placeholder-gray-300"
          placeholder="Repeat password" value={pw2} onChange={e => setPw2(e.target.value)} />
      </Field>
      {pw && pw2 && pw !== pw2 && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={12} /> Passwords do not match
        </p>
      )}
      <button
        onClick={() => onSubmit(pw)}
        disabled={saving || !pw || pw !== pw2}
        className="w-full py-2.5 rounded-xl text-sm font-bold text-white mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ background: "#0F2854" }}>
        {saving && <Loader size={14} className="animate-spin" />}
        Reset Password
      </button>
    </Modal>
  );
}