"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Receipt, Loader2, AlertCircle, CheckCircle2,
  X, ZoomIn, Calendar, Tag, FileText, User, Hash,
  Building2, ImageOff, ExternalLink, ChevronRight
} from "lucide-react";
import axiosInstance from "../../lib/axios";

// ── API Helper ────────────────────────────────────────────────────────────────
const apiFetch = async (path, { method = "GET", body, isMultipart = false } = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  let data = body;
  if (body && !isMultipart && typeof body === "string") {
    try { data = JSON.parse(body); } catch (e) {}
  }

  const config = {
    method,
    url: path,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(data ? { data } : {}),
  };
  if (isMultipart && config.headers) config.headers["Content-Type"] = "multipart/form-data";

  const res = await axiosInstance(config);
  return res.data;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const STATUS_STYLES = {
  Approved: "bg-emerald-50 text-emerald-600 border-emerald-200",
  Rejected: "bg-red-50 text-red-500 border-red-200",
  Pending:  "bg-amber-50 text-amber-600 border-amber-200",
};
const statusStyle = (s) => STATUS_STYLES[s] || STATUS_STYLES.Pending;

const CATEGORY_COLORS = {
  Travel:        "bg-violet-50 text-violet-600",
  Material:      "bg-blue-50 text-blue-600",
  Food:          "bg-orange-50 text-orange-600",
  Logistics:     "bg-cyan-50 text-cyan-600",
  Accommodation: "bg-pink-50 text-pink-600",
  Other:         "bg-gray-100 text-gray-600",
};
const catColor = (c) => CATEGORY_COLORS[c] || CATEGORY_COLORS.Other;

// Resolves receipt URL — backend stores it as `receiptUrl` with a relative path like /uploads/file.png
const resolveReceiptUrl = (exp) => {
  const raw = exp?.receiptUrl || exp?.receipt;
  if (!raw) return null;
  const str = typeof raw === "object"
    ? (raw.url || raw.path || raw.secure_url || null)
    : raw;
  if (!str) return null;
  if (str.startsWith("http://") || str.startsWith("https://")) return str;
  // Relative path — prepend base URL (strip trailing /api if present)
  const base = API_BASE.replace(/\/api(\/v\d+)?$/, "");
  return `${base}${str.startsWith("/") ? "" : "/"}${str}`;
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, isError }) {
  return (
    <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-xl animate-slide-in ${isError ? "bg-red-500" : "bg-[#0F2854]"}`}>
      {isError ? <AlertCircle size={15} /> : <CheckCircle2 size={15} className="text-emerald-400" />}
      {msg}
    </div>
  );
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ url, onClose }) {
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
  }, [onClose]);

  const isPdf = url?.toLowerCase().endsWith(".pdf");

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative max-w-3xl w-full">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white/60 text-xs font-medium">Receipt Preview</span>
          <div className="flex items-center gap-2">
            <a href={url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs font-semibold text-white/70 hover:text-white transition-colors">
              <ExternalLink size={12} /> Open original
            </a>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>
        {isPdf ? (
          <iframe src={url} className="w-full h-[75vh] rounded-xl bg-white" title="Receipt PDF" />
        ) : (
          <img src={url} alt="Receipt" className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl" />
        )}
      </div>
    </div>
  );
}

// ── Expense Detail Modal ──────────────────────────────────────────────────────
function ExpenseDetailModal({ exp, onClose }) {
  const [lightboxUrl, setLightboxUrl] = useState(null);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape" && !lightboxUrl) onClose(); };
    document.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
  }, [onClose, lightboxUrl]);

  if (!exp) return null;

  const receiptUrl = resolveReceiptUrl(exp);
  const isPdf = receiptUrl?.toLowerCase().endsWith(".pdf");
  const submitterName = exp.submittedBy?.name || exp.createdBy?.name || exp.user?.name || "—";
  const submitterRole = exp.submittedBy?.role || exp.createdBy?.role || exp.user?.role || "";

  return (
    <>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(15,40,84,0.45)", backdropFilter: "blur(4px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden modal-pop">

          {/* Header */}
          <div className="bg-gradient-to-r from-[#0F2854] to-[#1C4D8D] px-6 py-5 shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusStyle(exp.status)}`}>
                    {exp.status || "Pending"}
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${catColor(exp.category)}`}>
                    {exp.category}
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">₹{exp.amount?.toLocaleString()}</p>
                <p className="text-xs text-blue-200 mt-0.5">{exp.projectObj?.name || "Unknown Project"}</p>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors shrink-0 ml-3">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

            {/* Receipt */}
            {receiptUrl ? (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#4988C4] mb-2">Receipt</p>
                <div
                  className="relative group rounded-xl overflow-hidden border border-gray-100 cursor-pointer bg-gray-50"
                  onClick={() => setLightboxUrl(receiptUrl)}
                >
                  {isPdf ? (
                    <div className="h-28 flex flex-col items-center justify-center gap-2 text-gray-400">
                      <FileText size={28} />
                      <span className="text-xs font-semibold">PDF Receipt — click to view</span>
                    </div>
                  ) : (
                    <img
                      src={receiptUrl}
                      alt="Receipt thumbnail"
                      className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold text-[#0F2854]">
                      <ZoomIn size={13} /> View full
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-gray-50 border border-dashed border-gray-200 rounded-xl px-4 py-3 text-gray-400">
                <ImageOff size={16} />
                <span className="text-xs font-medium">No receipt uploaded</span>
              </div>
            )}

            {/* Details */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#4988C4] mb-2">Expense Details</p>
              <div className="space-y-0 rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                <DetailRow icon={Hash}      label="Expense ID"   value={exp._id?.slice(-8).toUpperCase()} mono />
                <DetailRow icon={Building2} label="Project"      value={exp.projectObj?.name} />
                {exp.projectObj?.projectId && (
                  <DetailRow icon={Tag}     label="Project ID"   value={exp.projectObj.projectId} />
                )}
                <DetailRow icon={Tag}       label="Category"     value={exp.category} />
                <DetailRow icon={Calendar}  label="Submitted On" value={fmtDateTime(exp.createdAt)} />
                {exp.updatedAt && exp.updatedAt !== exp.createdAt && (
                  <DetailRow icon={Calendar} label="Last Updated" value={fmtDateTime(exp.updatedAt)} />
                )}
              </div>
            </div>

            {/* Submitter */}
            {submitterName !== "—" && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#4988C4] mb-2">Submitted By</p>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-[#1C4D8D] flex items-center justify-center text-white font-bold text-sm">
                    {submitterName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0F2854]">{submitterName}</p>
                    {submitterRole && <p className="text-xs text-gray-400 capitalize">{submitterRole}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Reviewer / Approver */}
            {(exp.reviewedBy?.name || exp.approvedBy?.name) && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#4988C4] mb-2">
                  {exp.status === "Approved" ? "Approved By" : "Reviewed By"}
                </p>
                <div className="flex items-center gap-3 bg-emerald-50 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                    {(exp.reviewedBy?.name || exp.approvedBy?.name).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">{exp.reviewedBy?.name || exp.approvedBy?.name}</p>
                    {exp.reviewedAt && <p className="text-xs text-emerald-500">{fmtDateTime(exp.reviewedAt)}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {exp.description && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#4988C4] mb-2">Description</p>
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  {exp.description}
                </p>
              </div>
            )}

            {/* Rejection reason */}
            {exp.status === "Rejected" && exp.rejectionReason && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2">Rejection Reason</p>
                <p className="text-sm text-red-600 leading-relaxed bg-red-50 rounded-xl px-4 py-3 border border-red-100">
                  {exp.rejectionReason}
                </p>
              </div>
            )}

            <div className="h-1" />
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
            <button onClick={onClose}
              className="text-xs font-bold px-5 py-2 rounded-lg bg-[#0F2854] text-white hover:bg-[#1C4D8D] transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>

      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

      <style>{`
        @keyframes modal-pop {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-pop { animation: modal-pop 0.18s ease-out forwards; }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in { animation: slide-in 0.18s ease-out forwards; }
      `}</style>
    </>
  );
}

// ── Detail Row ─────────────────────────────────────────────────────────────────
function DetailRow({ icon: Ic, label, value, mono = false }) {
  if (!value || value === "—") return null;
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-white">
      <div className="w-6 h-6 rounded-md bg-[#e8f3fb] flex items-center justify-center shrink-0">
        <Ic size={12} className="text-[#1C4D8D]" />
      </div>
      <span className="text-xs text-gray-400 w-24 shrink-0">{label}</span>
      <span className={`text-xs font-semibold text-[#0F2854] truncate ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

// ── Add Modal ─────────────────────────────────────────────────────────────────
function AddModal({ projects, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({
    projectId: "", amount: "", category: "Material", description: "", receipt: null,
  });
  const [preview, setPreview] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(f => ({ ...f, receipt: file }));
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview("pdf");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,40,84,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden modal-pop">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F2854] to-[#1C4D8D] px-6 py-4 flex items-center justify-between shrink-0">
          <h3 className="text-sm font-bold text-white">Submit New Expense</h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {/* Project */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Project *</label>
            <select required value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1C4D8D] focus:ring-2 focus:ring-blue-50 text-[#0F2854] bg-white">
              <option value="">— Select Project —</option>
              {projects?.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>

          {/* Amount + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Amount (₹) *</label>
              <input required type="number" min="1" value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1C4D8D] focus:ring-2 focus:ring-blue-50 text-[#0F2854]"
                placeholder="e.g. 5000" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Category *</label>
              <select required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1C4D8D] focus:ring-2 focus:ring-blue-50 text-[#0F2854] bg-white">
                {["Travel", "Material", "Food", "Logistics", "Accommodation", "Other"]?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1C4D8D] focus:ring-2 focus:ring-blue-50 text-[#0F2854] resize-none"
              placeholder="Why was this expense incurred?" />
          </div>

          {/* Receipt upload */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Receipt</label>
            {preview ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                {preview === "pdf" ? (
                  <div className="h-24 flex items-center justify-center gap-2 text-gray-400">
                    <FileText size={20} />
                    <span className="text-xs font-semibold">{form.receipt?.name}</span>
                  </div>
                ) : (
                  <img src={preview} alt="Preview" className="w-full h-32 object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => { setPreview(null); setForm(f => ({ ...f, receipt: null })); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <X size={11} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#1C4D8D] hover:bg-blue-50/30 transition-colors">
                <Receipt size={20} className="text-gray-300 mb-1" />
                <span className="text-xs text-gray-400 font-medium">Click to upload image or PDF</span>
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
              </label>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 shrink-0">
          <button
            disabled={loading}
            onClick={() => onSubmit(form)}
            className="w-full bg-[#0F2854] hover:bg-[#1C4D8D] text-white text-sm font-bold py-3 rounded-xl transition-colors flex justify-center gap-2 items-center">
            {loading && <Loader2 size={16} className="animate-spin" />}
            Submit Expense
          </button>
        </div>
      </div>
      <style>{`
        @keyframes modal-pop {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-pop { animation: modal-pop 0.18s ease-out forwards; }
      `}</style>
    </div>
  );
}

// ── Expense Card ──────────────────────────────────────────────────────────────
function ExpenseCard({ exp, onView }) {
  const receiptUrl = resolveReceiptUrl(exp);
  const isPdf      = receiptUrl?.toLowerCase().endsWith(".pdf");

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col cursor-pointer group"
      onClick={() => onView(exp)}
    >
      {/* Receipt thumbnail */}
      <div className="relative h-32 bg-gray-50 shrink-0 overflow-hidden">
        {receiptUrl && !isPdf ? (
          <>
            <img
              src={receiptUrl}
              alt="Receipt"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm rounded-full p-1.5">
              <ZoomIn size={11} className="text-white" />
            </div>
          </>
        ) : receiptUrl && isPdf ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-gray-300">
            <FileText size={28} />
            <span className="text-[11px] font-semibold text-gray-400">PDF Receipt</span>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-gray-200">
            <ImageOff size={24} />
            <span className="text-[11px] text-gray-300 font-medium">No receipt</span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${catColor(exp.category)}`}>
              {exp.category}
            </span>
            <p className="text-xl font-bold text-[#0F2854] mt-1 leading-tight">
              ₹{exp.amount?.toLocaleString()}
            </p>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${statusStyle(exp.status || "Pending")}`}>
            {exp.status || "Pending"}
          </span>
        </div>

        <p className="text-xs text-gray-500 line-clamp-2 flex-1 mb-3">
          {exp.description || "No description provided."}
        </p>

        <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-[#0F2854] truncate">{exp.projectObj?.name || "Unknown Project"}</p>
            <p className="text-[10px] text-gray-400">{fmtDate(exp.createdAt)}</p>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-[#4988C4] shrink-0 group-hover:text-[#1C4D8D] transition-colors">
            View <ChevronRight size={12} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MyExpenses() {
  const [expenses,      setExpenses]      = useState([]);
  const [projects,      setProjects]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast,         setToast]         = useState(null);
  const [showAddModal,  setShowAddModal]  = useState(false);
  const [detailExp,     setDetailExp]     = useState(null);

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const pRes = await apiFetch("/projects");
      const userProjects = Array.isArray(pRes) ? pRes : pRes.projects || [];
      setProjects(userProjects);

      const expPromises = userProjects?.map(p =>
        apiFetch(`/expenses/project/${p._id}`).catch(() => ({ expenses: [] }))
      );
      const resArray = await Promise.all(expPromises);

      let allExpenses = [];
      resArray.forEach((r, idx) => {
        const mapped = (r.expenses || [])?.map(e => ({ ...e, projectObj: userProjects[idx] }));
        allExpenses.push(..?.mapped);
      });

      setExpenses(allExpenses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      showToast("Failed to load data", true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (form) => {
    if (!form.projectId || !form.amount || !form.category) {
      return showToast("Please fill all required fields", true);
    }
    try {
      setActionLoading(true);
      const formData = new FormData();
      formData.append("projectId",   form.projectId);
      formData.append("amount",      form.amount);
      formData.append("category",    form.category);
      formData.append("description", form.description);
      if (form.receipt) formData.append("receipt", form.receipt);

      await apiFetch("/expenses", { method: "POST", body: formData, isMultipart: true });
      showToast("Expense submitted successfully!");
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to submit", true);
    } finally {
      setActionLoading(false);
    }
  };

  // Summary counts
  const total    = expenses.length;
  const approved = expenses.filter(e => e.status === "Approved").length;
  const pending  = expenses.filter(e => !e.status || e.status === "Pending").length;
  const totalAmt = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast.msg} isError={toast.isError} />}

      {/* Page header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#0F2854]">My Expenses</h2>
          <p className="text-sm text-gray-400 mt-0.5">Track and submit project expenses.</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-[#0F2854] hover:bg-[#1C4D8D] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0">
          <Plus size={15} /> Add Expense
        </button>
      </div>

      {/* Summary strip */}
      {!loading && total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total",    value: total,                              sub: "expenses" },
            { label: "Approved", value: approved,                           sub: "of total", color: "text-emerald-600" },
            { label: "Pending",  value: pending,                            sub: "awaiting",  color: "text-amber-600" },
            { label: "Amount",   value: `₹${totalAmt.toLocaleString()}`,   sub: "submitted" },
          ]?.map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
              <p className={`text-xl font-bold ${s.color || "text-[#0F2854]"}`}>{s.value}</p>
              <p className="text-xs text-gray-500 font-medium">{s.label} <span className="text-gray-500">{s.sub}</span></p>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenses?.map(exp => (
            <ExpenseCard key={exp._id} exp={exp} onView={setDetailExp} />
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddModal
          projects={projects}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleSubmit}
          loading={actionLoading}
        />
      )}

      {/* Detail Modal */}
      {detailExp && (
        <ExpenseDetailModal exp={detailExp} onClose={() => setDetailExp(null)} />
      )}
    </div>
  );
}
