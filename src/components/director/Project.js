"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  AlertCircle,
  ChevronRight,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Loader2,
  Clock,
  Receipt,
  Banknote,
  FileText,
  IndianRupee,
} from "lucide-react";
import axiosInstance from "../../lib/axios";

// ── API Helpers ───────────────────────────────────────────────────────────────
const apiFetch = async (
  path,
  { method = "GET", body, isMultipart = false } = {},
) => {
  const token = localStorage.getItem("accessToken");

  let data = body;
  if (body && !isMultipart && typeof body === "string") {
    try {
      data = JSON.parse(body);
    } catch (e) { }
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

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  initiated: "bg-gray-100 text-gray-500",
  "in-progress": "bg-blue-50 text-blue-600",
  installation: "bg-purple-50 text-purple-600",
  testing: "bg-amber-50 text-amber-600",
  completed: "bg-green-50 text-green-600",
  "on-hold": "bg-red-50 text-red-500",
};

const STATUS_LABELS = {
  initiated: "Initiated",
  "in-progress": "In Progress",
  installation: "Installation",
  testing: "Testing",
  completed: "Completed",
  "on-hold": "On Hold",
};

const EMPTY_FORM = {
  name: "",
  clientName: "",
  clientContact: "",
  location: "",
  status: "initiated",
  description: "",
  startDate: "",
  endDate: "",
  assignedMarketingExecutive: "",
  assignedInstallationIncharge: "",
  assignedEngineers: [], // array of IDs
};

const isProjectDelayed = (project) => {
  if (project.status === "completed") return false;
  if (project.endDate) return new Date(project.endDate) < new Date();
  return false;
};

// ── Sub-components ────────────────────────────────────────────────────────────
function Bar({ pct, color }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, pct)}%`, background: color }}
      />
    </div>
  );
}

function Badge({ text, colorClass }) {
  return (
    <span
      className={`text-xs font-bold px-2.5 py-1 rounded-full ${colorClass}`}
    >
      {text}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ── User Select (single) ──────────────────────────────────────────────────────
function UserSelect({
  label,
  value,
  onChange,
  users,
  placeholder = "Select user",
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-1 block">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
      >
        <option value="">{placeholder}</option>
        {users?.map((u) => (
          <option key={u._id} value={u._id}>
            {u.name} — {u.email}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Engineers Multi-Select ────────────────────────────────────────────────────
function EngineersSelect({ value, onChange, users }) {
  const toggle = (id) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-1 block">
        Engineers
      </label>
      <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto divide-y divide-gray-50">
        {users.length === 0 && (
          <p className="text-xs text-gray-400 px-3 py-2">
            No engineers available
          </p>
        )}
        {users?.map((u) => (
          <label
            key={u._id}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <input
              type="checkbox"
              checked={value.includes(u._id)}
              onChange={() => toggle(u._id)}
              className="accent-blue-600"
            />
            <span className="text-sm text-gray-700">{u.name}</span>
            <span className="text-xs text-gray-400 ml-auto">{u.email}</span>
          </label>
        ))}
      </div>
      {value.length > 0 && (
        <p className="text-xs text-blue-600 mt-1">
          {value.length} engineer{value.length > 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}

// ── Project Form ──────────────────────────────────────────────────────────────
function ProjectForm({
  initial = EMPTY_FORM,
  onSubmit,
  loading,
  submitLabel = "Submit",
  users = [],
}) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Split users by role for targeted dropdowns
  const marketingUsers = users.filter(
    (u) => u.role === "marketing_executive" || u.role === "admin",
  );
  const inchargeUsers = users.filter(
    (u) => u.role === "installation_incharge" || u.role === "admin",
  );
  const engineerUsers = users.filter(
    (u) => u.role === "engineer",
  );
  // ↑ Remove the `|| true` if you want strict role filtering

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {};
    Object.entries(form).forEach(([k, v]) => {
      if (k === "assignedEngineers") {
        if (v.length) payload[k] = v;
      } else if (v !== "") {
        payload[k] = v;
      }
    });
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-semibold text-gray-600 mb-1 block">
            Project Name *
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="e.g. Greenfield Complex"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">
            Client Name *
          </label>
          <input
            required
            value={form.clientName}
            onChange={(e) => set("clientName", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Client full name"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">
            Client Contact
          </label>
          <input
            value={form.clientContact}
            onChange={(e) => set("clientContact", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="+92 3xx xxxxxxx"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">
            Location
          </label>
          <input
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="City / Address"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {Object.entries(STATUS_LABELS)?.map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">
            Start Date
          </label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">
            End Date
          </label>
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => set("endDate", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1 block">
          Description
        </label>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
          placeholder="Brief project description"
        />
      </div>

      {/* ── Assignments — now dropdowns with names ── */}
      <div className="border-t border-gray-100 pt-3 space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Assignments
        </p>

        <UserSelect
          label="Marketing Executive"
          value={form.assignedMarketingExecutive}
          onChange={(v) => set("assignedMarketingExecutive", v)}
          users={marketingUsers}
          placeholder="Select marketing executive"
        />

        <UserSelect
          label="Installation Incharge"
          value={form.assignedInstallationIncharge}
          onChange={(v) => set("assignedInstallationIncharge", v)}
          users={inchargeUsers}
          placeholder="Select installation incharge"
        />

        <EngineersSelect
          value={form.assignedEngineers}
          onChange={(v) => set("assignedEngineers", v)}
          users={engineerUsers}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {submitLabel}
      </button>
    </form>
  );
}

// ── Project Expenses Tab ──────────────────────────────────────────────────────
function ProjectExpensesTab({ projectId }) {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    category: "Material",
    description: "",
    receipt: null,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [expRes, sumRes] = await Promise.all([
        apiFetch(`/expenses/project/${projectId}`),
        apiFetch(`/expenses/project/${projectId}/summary`),
      ]);
      setExpenses(expRes.expenses || []);
      setSummary(sumRes.summary || null);
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("amount", expenseForm.amount);
      formData.append("category", expenseForm.category);
      formData.append("description", expenseForm.description);
      if (expenseForm.receipt) {
        formData.append("receipt", expenseForm.receipt);
      }

      await apiFetch("/expenses", {
        method: "POST",
        body: formData,
        isMultipart: true,
      });
      setShowAddExpense(false);
      setExpenseForm({
        amount: "",
        category: "Material",
        description: "",
        receipt: null,
      });
      fetchData();
    } catch (err) {
      alert(
        err.response?.data?.message || err.message || "Failed to add expense",
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Loading expenses...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Total Budget</p>
            <p className="text-sm font-bold text-gray-800">
              ₹{summary.budget?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
            <p className="text-xs text-emerald-500 mb-1">Actual Cost</p>
            <p className="text-sm font-bold text-emerald-700">
              ₹{summary.actualCost?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
            <p className="text-xs text-amber-500 mb-1">Pending Cost</p>
            <p className="text-sm font-bold text-amber-700">
              ₹{summary.pendingCost?.toLocaleString() || 0}
            </p>
          </div>
          <div
            className={`rounded-xl p-3 text-center border ${summary.isBudgetExceeded ? "bg-red-50 border-red-100" : "bg-blue-50 border-blue-100"}`}
          >
            <p
              className={`text-xs mb-1 ${summary.isBudgetExceeded ? "text-red-500" : "text-blue-500"}`}
            >
              Remaining
            </p>
            <p
              className={`text-sm font-bold ${summary.isBudgetExceeded ? "text-red-700" : "text-blue-700"}`}
            >
              ₹{summary.remainingBudget?.toLocaleString() || 0}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Expense Logs
        </p>
        <button
          onClick={() => setShowAddExpense(true)}
          className="flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={13} /> Add Expense
        </button>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          No expenses recorded for this project yet.
        </div>
      ) : (
        <div className="space-y-2">
          {expenses?.map((exp) => (
            <div
              key={exp._id}
              className="bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-between gap-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                  <Receipt size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">
                    {exp.category}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {exp.description || "No description provided"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      By: {exp.submittedBy?.name || "Unknown"}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(exp.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800">
                  ₹{exp.amount?.toLocaleString()}
                </p>
                <div className="mt-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${exp.status === "Approved"
                        ? "bg-emerald-50 text-emerald-600"
                        : exp.status === "Rejected"
                          ? "bg-red-50 text-red-600"
                          : "bg-amber-50 text-amber-600"
                      }`}
                  >
                    {exp.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddExpense && (
        <Modal
          title="Submit New Expense"
          onClose={() => setShowAddExpense(false)}
        >
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">
                Amount *
              </label>
              <input
                required
                type="number"
                min="0"
                value={expenseForm.amount}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, amount: e.target.value })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="e.g. 5000"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">
                Category *
              </label>
              <select
                value={expenseForm.category}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, category: e.target.value })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {[
                  "Travel",
                  "Material",
                  "Food",
                  "Logistics",
                  "Accommodation",
                  "Other",
                ]?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">
                Description
              </label>
              <textarea
                rows={2}
                value={expenseForm.description}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    description: e.target.value,
                  })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                placeholder="Details about this expense..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">
                Receipt (Optional)
              </label>
              <input
                type="file"
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, receipt: e.target.files[0] })
                }
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {actionLoading && <Loader2 size={14} className="animate-spin" />}
              Submit Expense
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({ project: p, onClose }) {
  const [tab, setTab] = useState("overview");
  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "team", label: "Team" },
    { key: "timeline", label: "Timeline" },
    { key: "expenses", label: "Expenses" },
  ];

  const statusStyle = STATUS_STYLE[p.status] || "bg-gray-100 text-gray-500";
  const statusLabel = STATUS_LABELS[p.status] || p.status;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col z-10">
        <div
          className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0"
          style={{ background: "linear-gradient(135deg, #0F2854, #1C4D8D)" }}
        >
          <div>
            <h3 className="text-white font-bold text-base">
              {p.projectId && (
                <span className="text-blue-200 text-sm mr-2">
                  {p.projectId}
                </span>
              )}
              {p.name}
            </h3>
            <p className="text-blue-300 text-xs mt-0.5">
              {p.location || "No location"} · Client: {p.clientName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge text={statusLabel} colorClass={`${statusStyle} !text-xs`} />
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex border-b border-gray-100 px-2 overflow-x-auto shrink-0">
          {tabs?.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all
                ${tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {tab === "overview" && (
            <div className="space-y-4">
              {p.description && (
                <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed">
                  {p.description}
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Client", value: p.clientName },
                  { label: "Contact", value: p.clientContact || "—" },
                  { label: "Location", value: p.location || "—" },
                  { label: "Created By", value: p.createdBy?.name || "—" },
                ]?.map((i) => (
                  <div key={i.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">{i.label}</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {i.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "team" && (
            <div className="space-y-3">
              {p.assignedMarketingExecutive ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                    {p.assignedMarketingExecutive.name?.[0] || "M"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      {p.assignedMarketingExecutive.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      Marketing Executive · {p.assignedMarketingExecutive.email}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 px-4">
                  No marketing executive assigned
                </p>
              )}

              {p.assignedInstallationIncharge ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold shrink-0">
                    {p.assignedInstallationIncharge.name?.[0] || "I"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      {p.assignedInstallationIncharge.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      Installation Incharge ·{" "}
                      {p.assignedInstallationIncharge.email}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 px-4">
                  No installation incharge assigned
                </p>
              )}

              {p.assignedEngineers?.length > 0 ? (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">
                    Engineers
                  </p>
                  <div className="space-y-2">
                    {p.assignedEngineers?.map((eng) => (
                      <div
                        key={eng._id}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50"
                      >
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold shrink-0">
                          {eng.name?.[0] || "E"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            {eng.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            Engineer · {eng.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 px-4">
                  No engineers assigned
                </p>
              )}
            </div>
          )}

          {tab === "timeline" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Start Date",
                    value: p.startDate
                      ? new Date(p.startDate).toLocaleDateString()
                      : "—",
                  },
                  {
                    label: "End Date",
                    value: p.endDate
                      ? new Date(p.endDate).toLocaleDateString()
                      : "—",
                  },
                  {
                    label: "Created",
                    value: new Date(p.createdAt).toLocaleDateString(),
                  },
                ]?.map((i) => (
                  <div
                    key={i.label}
                    className="bg-gray-50 rounded-xl p-3 text-center"
                  >
                    <p className="text-xs text-gray-400 mb-1">{i.label}</p>
                    <p className="text-sm font-bold text-gray-800">{i.value}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Status Pipeline
                </p>
                <div className="flex items-center gap-1 flex-wrap">
                  {Object.entries(STATUS_LABELS)?.map(([k, v], idx, arr) => {
                    const isActive = k === p.status;
                    const statusKeys = Object.keys(STATUS_LABELS);
                    const currentIdx = statusKeys.indexOf(p.status);
                    const isPast = idx < currentIdx;
                    return (
                      <div key={k} className="flex items-center gap-1">
                        <div
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all
                          ${isActive ? STATUS_STYLE[k] + " ring-2 ring-offset-1 ring-blue-300" : isPast ? "bg-green-50 text-green-500" : "bg-gray-100 text-gray-400"}`}
                        >
                          {isPast && !isActive ? "✓ " : ""}
                          {v}
                        </div>
                        {idx < arr.length - 1 && (
                          <span className="text-gray-200 text-xs">→</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === "expenses" && <ProjectExpensesTab projectId={p._id} />}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ProjectOverview() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]); // ← all users for dropdowns
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");

  const [detailProject, setDetailProject] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Fetch users for dropdowns ─────────────────────────────────────────────
  // Change "/users" to whatever your backend endpoint is that returns all users
  const fetchUsers = useCallback(async () => {
    try {
      const data = await apiFetch("admin/users");
      setUsers(Array.isArray(data) ? data : (data.users ?? []));
    } catch {
      // non-critical — dropdowns just won't show names
    }
  }, []);

  // ── Fetch projects ────────────────────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch("/projects");
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, [fetchProjects, fetchUsers]);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleCreate = async (payload) => {
    try {
      setActionLoading(true);
      await apiFetch("/projects", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setShowCreate(false);
      fetchProjects();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (payload) => {
    try {
      setActionLoading(true);
      await apiFetch(`/projects/${editProject._id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setEditProject(null);
      fetchProjects();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await apiFetch(`/projects/${deleteTarget._id}`, { method: "DELETE" });
      setDeleteTarget(null);
      fetchProjects();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered =
    filter === "All"
      ? projects
      : filter === "Delayed"
        ? projects.filter((p) => isProjectDelayed(p))
        : projects.filter((p) => p.status === filter);
  const statusProgress = {
    initiated: 5,
    "in-progress": 40,
    installation: 65,
    testing: 85,
    completed: 100,
    "on-hold": 0,
  };

  // Build initial form values for editing — engineers as array of IDs
  const buildEditInitial = (p) => ({
    name: p.name || "",
    clientName: p.clientName || "",
    clientContact: p.clientContact || "",
    location: p.location || "",
    status: p.status || "initiated",
    description: p.description || "",
    startDate: p.startDate ? p.startDate.slice(0, 10) : "",
    endDate: p.endDate ? p.endDate.slice(0, 10) : "",
    assignedMarketingExecutive: p.assignedMarketingExecutive?._id || "",
    assignedInstallationIncharge: p.assignedInstallationIncharge?._id || "",
    assignedEngineers: (p.assignedEngineers || [])?.map((e) => e._id),
  });

  return (
    <div className="space-y-5">
      {detailProject && (
        <DetailModal
          project={detailProject}
          onClose={() => setDetailProject(null)}
        />
      )}

      {showCreate && (
        <Modal title="Create New Project" onClose={() => setShowCreate(false)}>
          <ProjectForm
            onSubmit={handleCreate}
            loading={actionLoading}
            submitLabel="Create Project"
            users={users}
          />
        </Modal>
      )}

      {editProject && (
        <Modal title="Edit Project" onClose={() => setEditProject(null)}>
          <ProjectForm
            initial={buildEditInitial(editProject)}
            onSubmit={handleUpdate}
            loading={actionLoading}
            submitLabel="Save Changes"
            users={users}
          />
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Delete Project" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Delete{" "}
              <span className="font-semibold text-gray-800">
                "{deleteTarget.name}"
              </span>
              ? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {actionLoading && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Project Overview</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {projects.length} projects total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchProjects}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={13} /> New Project
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
          <AlertCircle size={14} />
          <span>{error}</span>
          <button onClick={fetchProjects} className="ml-auto text-xs underline">
            Retry
          </button>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {Object.entries(STATUS_LABELS)?.map(([k, v]) => {
          const count = projects.filter((p) => p.status === k).length;
          return (
            <button
              key={k}
              onClick={() => setFilter(filter === k ? "All" : k)}
              className={`rounded-xl border p-3 text-center transition-all cursor-pointer
                ${filter === k ? "border-blue-300 bg-blue-50" : "border-gray-100 bg-white hover:border-gray-200"}`}
            >
              <p
                className={`text-xl font-bold ${STATUS_STYLE[k].split(" ")[1]}`}
              >
                {count}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">{v}</p>
            </button>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit overflow-x-auto">
        {["All", "Delayed", ...Object.keys(STATUS_LABELS)]?.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
              ${filter === f ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
          >
            {f === "All" ? "All" : f === "Delayed" ? "Delayed" : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Project Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading projects…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-gray-400 text-sm">
          {projects.length === 0
            ? "No projects yet. Create the first one!"
            : "No projects match this filter."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered?.map((p) => {
            const progress = statusProgress[p.status] ?? 0;
            const statusLabel = STATUS_LABELS[p.status] || p.status;
            const statusStyle =
              STATUS_STYLE[p.status] || "bg-gray-100 text-gray-500";

            return (
              <div
                key={p._id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group relative"
              >
                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditProject(p);
                    }}
                    className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(p);
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div onClick={() => router.push(`/director/project/${p._id}`)}>
                  <div className="flex items-start justify-between gap-3 mb-4 pr-16">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {p.projectId && (
                          <span className="text-blue-600 mr-1.5">
                            {p.projectId}
                          </span>
                        )}
                        {p.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {p.location || "No location"} · {p.clientName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isProjectDelayed(p) && (
                        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded animate-pulse">
                          DELAYED
                        </span>
                      )}
                      <Badge text={statusLabel} colorClass={statusStyle} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Progress</span>
                        <span className="font-bold text-blue-700">
                          {progress}%
                        </span>
                      </div>
                      <Bar pct={progress} color="#1C4D8D" />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex gap-3 text-xs text-gray-500 flex-wrap">
                      {p.assignedEngineers?.length > 0 && (
                        <span>
                          {p.assignedEngineers.length} engineer
                          {p.assignedEngineers.length > 1 ? "s" : ""}
                        </span>
                      )}
                      {p.startDate && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} className="text-gray-400" />
                          {new Date(p.startDate).toLocaleDateString()}
                        </span>
                      )}
                      {p.endDate && (
                        <span className="text-gray-400">
                          → {new Date(p.endDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-blue-700 flex items-center gap-1 group-hover:gap-2 transition-all">
                      View Detail <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
