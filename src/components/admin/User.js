"use client";
import { useState } from "react";
import { Plus, Search, Edit2, KeyRound, UserX, X, CheckCircle2, MoreVertical } from "lucide-react";

const ROLES = ["Admin", "Site Engineer", "QC Inspector", "Complaint Handler", "Director"];
const INITIAL_USERS = [
  { id: 1, name: "Ahmad Raza",  email: "ahmad@synergy.com",  role: "QC Inspector",     status: "Active",   joined: "01 Jan 2026" },
  { id: 2, name: "Sara Malik",  email: "sara@synergy.com",   role: "Site Engineer",     status: "Active",   joined: "15 Jan 2026" },
  { id: 3, name: "James K.",    email: "james@synergy.com",  role: "Complaint Handler", status: "Active",   joined: "20 Jan 2026" },
  { id: 4, name: "Priya Nair",  email: "priya@synergy.com",  role: "QC Inspector",      status: "Inactive", joined: "05 Feb 2026" },
  { id: 5, name: "Omar Sheikh", email: "omar@synergy.com",   role: "Site Engineer",     status: "Active",   joined: "10 Feb 2026" },
];
const EMPTY_FORM = { name: "", email: "", role: ROLES[1], password: "" };
const inputCls = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-medium-blue transition-colors text-extra-darkblue placeholder-gray-300";

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

// ── Mobile Card ───────────────────────────────────────────────────────────────
function UserCard({ user, onEdit, onRole, onReset, onDeactivate }) {
  const [open, setOpen] = useState(false);
  const actions = [
    { label: "Edit",           icon: Edit2,        fn: () => onEdit(user),       cls: "text-extra-darkblue" },
    { label: "Assign Role",    icon: CheckCircle2, fn: () => onRole(user),       cls: "text-extra-blue"     },
    { label: "Reset Password", icon: KeyRound,     fn: () => onReset(user),      cls: "text-amber-500"      },
    { label: user.status === "Active" ? "Deactivate" : "Activate", icon: UserX, fn: () => onDeactivate(user),
      cls: user.status === "Active" ? "text-red-500" : "text-green-600" },
  ];
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-lightblue text-extra-blue flex items-center justify-center text-sm font-bold shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-extra-darkblue truncate">{user.name}</p>
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
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-lightblue text-extra-blue">{user.role}</span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${user.status === "Active" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}>{user.status}</span>
        <span className="text-xs text-gray-400 ml-auto">Joined {user.joined}</span>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function UserManagement() {
  const [users,    setUsers]    = useState(INITIAL_USERS);
  const [search,   setSearch]   = useState("");
  const [modal,    setModal]    = useState(null);
  const [selected, setSelected] = useState(null);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [newRole,  setNewRole]  = useState("");
  const [toast,    setToast]    = useState(null);

  const showToast      = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const openEdit       = (u) => { setSelected(u); setForm({ name: u.name, email: u.email, role: u.role, password: "" }); setModal("edit"); };
  const openRole       = (u) => { setSelected(u); setNewRole(u.role); setModal("role"); };
  const openReset      = (u) => { setSelected(u); setModal("reset"); };
  const openDeactivate = (u) => { setSelected(u); setModal("deactivate"); };

  const handleCreate     = () => { if (!form.name || !form.email) return; setUsers(p => [...p, { id: Date.now(), ...form, status: "Active", joined: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) }]); setModal(null); setForm(EMPTY_FORM); showToast("User created"); };
  const handleEdit       = () => { setUsers(p => p.map(u => u.id === selected.id ? { ...u, name: form.name, email: form.email } : u)); setModal(null); showToast("User updated"); };
  const handleRole       = () => { setUsers(p => p.map(u => u.id === selected.id ? { ...u, role: newRole } : u)); setModal(null); showToast(`Role updated to ${newRole}`); };
  const handleDeactivate = () => { setUsers(p => p.map(u => u.id === selected.id ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" } : u)); setModal(null); showToast(`User ${selected.status === "Active" ? "deactivated" : "activated"}`); };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-extra-darkblue text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg">
          <CheckCircle2 size={15} className="text-green-400" /> {toast}
        </div>
      )}

      {modal === "create" && (
        <Modal title="Create User" onClose={() => setModal(null)}>
          <Field label="Full Name"><input className={inputCls} placeholder="e.g. Ahmad Raza" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></Field>
          <Field label="Email"><input className={inputCls} placeholder="user@synergy.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></Field>
          <Field label="Role"><select className={inputCls} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>{ROLES.map(r => <option key={r}>{r}</option>)}</select></Field>
          <Field label="Temp Password"><input type="password" className={inputCls} placeholder="Min 8 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} /></Field>
          <button onClick={handleCreate} className="w-full py-2.5 rounded-xl text-sm font-bold text-white mt-2" style={{ background: "#0F2854" }}>Create User</button>
        </Modal>
      )}
      {modal === "edit" && (
        <Modal title="Edit User" onClose={() => setModal(null)}>
          <Field label="Full Name"><input className={inputCls} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></Field>
          <Field label="Email"><input className={inputCls} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></Field>
          <button onClick={handleEdit} className="w-full py-2.5 rounded-xl text-sm font-bold text-white mt-2" style={{ background: "#0F2854" }}>Save Changes</button>
        </Modal>
      )}
      {modal === "role" && (
        <Modal title="Assign Role" onClose={() => setModal(null)}>
          <p className="text-sm text-gray-500">Changing role for <strong className="text-extra-darkblue">{selected?.name}</strong></p>
          <Field label="New Role"><select className={inputCls} value={newRole} onChange={e => setNewRole(e.target.value)}>{ROLES.map(r => <option key={r}>{r}</option>)}</select></Field>
          <button onClick={handleRole} className="w-full py-2.5 rounded-xl text-sm font-bold text-white mt-2" style={{ background: "#0F2854" }}>Assign Role</button>
        </Modal>
      )}
      {modal === "reset" && (
        <Modal title="Reset Password" onClose={() => setModal(null)}>
          <p className="text-sm text-gray-500">Send reset link to <strong className="text-extra-darkblue">{selected?.email}</strong>?</p>
          <button onClick={() => { setModal(null); showToast("Reset link sent"); }} className="w-full py-2.5 rounded-xl text-sm font-bold text-white mt-2" style={{ background: "#0F2854" }}>Send Reset Link</button>
        </Modal>
      )}
      {modal === "deactivate" && (
        <Modal title={selected?.status === "Active" ? "Deactivate User" : "Activate User"} onClose={() => setModal(null)}>
          <p className="text-sm text-gray-500">Are you sure you want to <strong>{selected?.status === "Active" ? "deactivate" : "activate"}</strong> <strong className="text-extra-darkblue">{selected?.name}</strong>?</p>
          <button onClick={handleDeactivate} className={`w-full py-2.5 rounded-xl text-sm font-bold text-white mt-2 transition-colors ${selected?.status === "Active" ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}>
            {selected?.status === "Active" ? "Yes, Deactivate" : "Yes, Activate"}
          </button>
        </Modal>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-extra-darkblue">User Management</h2>
          <p className="text-sm text-gray-400 mt-0.5">{users.length} users total</p>
        </div>
        <button onClick={() => { setForm(EMPTY_FORM); setModal("create"); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow hover:opacity-90 transition-all"
          style={{ background: "#0F2854" }}>
          <Plus size={15} /> Create User
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
        <input type="text" placeholder="Search by name, email or role…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-medium-blue transition-colors text-extra-darkblue placeholder-gray-300 bg-white" />
      </div>

      {/* MOBILE: Cards */}
      <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(u => (
          <UserCard key={u.id} user={u} onEdit={openEdit} onRole={openRole} onReset={openReset} onDeactivate={openDeactivate} />
        ))}
        {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-8 col-span-2">No users found</p>}
      </div>

      {/* DESKTOP: Table */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Name", "Email", "Role", "Status", "Joined", "Actions"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-lightblue text-extra-blue flex items-center justify-center text-xs font-bold shrink-0">{u.name.charAt(0)}</div>
                    <span className="font-semibold text-extra-darkblue">{u.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-500">{u.email}</td>
                <td className="px-5 py-3.5"><span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-lightblue text-extra-blue">{u.role}</span></td>
                <td className="px-5 py-3.5"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.status === "Active" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}>{u.status}</span></td>
                <td className="px-5 py-3.5 text-gray-400 text-xs">{u.joined}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(u)}       title="Edit"           className="p-1.5 rounded-lg text-gray-400 hover:text-extra-blue hover:bg-lightblue/30 transition-all"><Edit2       size={14} /></button>
                    <button onClick={() => openRole(u)}       title="Assign Role"    className="p-1.5 rounded-lg text-gray-400 hover:text-extra-blue hover:bg-lightblue/30 transition-all"><CheckCircle2 size={14} /></button>
                    <button onClick={() => openReset(u)}      title="Reset Password" className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-all"><KeyRound     size={14} /></button>
                    <button onClick={() => openDeactivate(u)} title={u.status === "Active" ? "Deactivate" : "Activate"} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><UserX size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-10">No users found</p>}
      </div>
    </div>
  );
}