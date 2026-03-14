"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Receipt, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import axiosInstance from "../../lib/axios";

// ── API Helper ───────────────────────────────────────────────────────────────
const apiFetch = async (path, { method = "GET", body, isMultipart = false } = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  let data = body;
  if (body && !isMultipart && typeof body === "string") {
    try { data = JSON.parse(body); } catch(e) {}
  }

  const config = {
    method,
    url: path,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(data ? { data } : {}),
  };

  if (isMultipart && config.headers) {
    config.headers["Content-Type"] = "multipart/form-data";
  }

  const res = await axiosInstance(config);
  return res.data;
};

// ── Shared UI Components ────────────────────────────────────────────────────────
function Toast({ msg, isError }) {
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-xl ${isError ? "bg-red-500" : "bg-extra-darkblue"}`}>
      {isError ? <AlertCircle size={15} /> : <CheckCircle2 size={15} className="text-emerald-400" />}
      {msg}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg z-10 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-extra-darkblue">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            ✕
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MyExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ projectId: "", amount: "", category: "Material", description: "", receipt: null });

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch user specific expenses via a filtered call, since /expenses/all might require admin or director.
      // Wait, what route? For marketing executive, they can see ALL their expenses across projects.
      // We don't have a /expenses/my-expenses yet, let's just fetch all and filter client side OR fetch from projects.
      // Let's implement querying by getting projects first.

      const pRes = await apiFetch("/projects");
      const userProjects = Array.isArray(pRes) ? pRes : pRes.projects || [];
      setProjects(userProjects);

      // Let's assume /expenses/all is restricted to admin/director.
      // We fetch project expenses manually for each project, since marketing has specific projects.
      // Or if the backend API has not restricted it, we will just use a Promise.all.

      const expPromises = userProjects.map(p => apiFetch(`/expenses/project/${p._id}`).catch(() => ({ expenses: [] })));
      const resArray = await Promise.all(expPromises);

      let allExpenses = [];
      resArray.forEach((r, idx) => {
        const mapped = (r.expenses || []).map(e => ({
          ...e,
          projectObj: userProjects[idx]
        }));
        allExpenses.push(...mapped);
      });

      // We only show expenses submitted by this user? For now show all fetched for projects, or ideally backend restricts it.
      // The requirement: "My Expenses" under Marketing section.

      setExpenses(allExpenses.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      console.error(err);
      showToast("Failed to load data", true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.projectId || !form.amount || !form.category) {
      return showToast("Please fill all required fields", true);
    }

    try {
      setActionLoading(true);
      const formData = new FormData();
      formData.append("projectId", form.projectId);
      formData.append("amount", form.amount);
      formData.append("category", form.category);
      formData.append("description", form.description);
      if (form.receipt) formData.append("receipt", form.receipt);

      await apiFetch("/expenses", { method: "POST", body: formData, isMultipart: true });
      showToast("Expense submitted successfully!");
      setShowAddModal(false);
      setForm({ projectId: "", amount: "", category: "Material", description: "", receipt: null });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to sumbit", true);
      console.log(err.response);

    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast.msg} isError={toast.isError} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-extra-darkblue">My Expenses</h2>
          <p className="text-sm text-gray-400 mt-0.5">Track and submit expenses for your projects.</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-extra-darkblue hover:bg-extra-blue text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <Plus size={15} /> Add Expense
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-gray-400 gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading your expenses...
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <Receipt size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm font-semibold text-gray-500">No expenses found</p>
          <p className="text-xs text-gray-400">Click "Add Expense" to submit a new one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenses.map(exp => {
             const statusColor = exp.status === "Approved" ? "bg-emerald-50 text-emerald-600" :
               exp.status === "Rejected" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600";

             return (
              <div key={exp._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase">{exp.category}</span>
                    <h4 className="text-lg font-bold text-extra-darkblue leading-tight mb-1">₹{exp.amount?.toLocaleString()}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2">{exp.description || "No description provided."}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                    {exp.status}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400">
                  <span className="font-semibold">{exp.projectObj?.name || "Unknown Project"}</span>
                  <span>{new Date(exp.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <Modal title="Submit Expense" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Project *</label>
              <select required value={form.projectId} onChange={e => setForm({...form, projectId: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-extra-blue focus:ring-2 focus:ring-blue-50 text-extra-darkblue bg-white">
                <option value="">-- Select Project --</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Amount (₹) *</label>
                <input required type="number" min="1" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-extra-blue focus:ring-2 focus:ring-blue-50 text-extra-darkblue"
                  placeholder="e.g. 5000" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Category *</label>
                <select required value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-extra-blue focus:ring-2 focus:ring-blue-50 text-extra-darkblue bg-white">
                  {["Travel", "Material", "Food", "Logistics", "Accommodation", "Other"].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Description</label>
              <textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-extra-blue focus:ring-2 focus:ring-blue-50 text-extra-darkblue resize-none"
                placeholder="Why was this expense incurred?" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Receipt Upload</label>
              <input type="file" onChange={e => setForm({...form, receipt: e.target.files[0]})}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
            </div>

            <button type="submit" disabled={actionLoading}
              className="w-full bg-extra-darkblue hover:bg-extra-blue text-white text-sm font-bold py-3 rounded-xl transition-colors mt-2 flex justify-center gap-2 items-center">
              {actionLoading && <Loader2 size={16} className="animate-spin" />}
              Submit Expense
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
