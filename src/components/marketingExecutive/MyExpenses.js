"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Receipt, Loader2, AlertCircle, CheckCircle2, X, Calendar,
  FileText, Download, Printer, Trash2, PenLine, Upload, Eye,
  ChevronDown, ChevronRight, Clock, Send, Building2, MapPin,
  IndianRupee, Paperclip, ExternalLink, FilePlus, ZoomIn,
} from "lucide-react";
import * as svc from "../../services/expense.service";
import axiosInstance from "../../lib/axios";

// ── Constants ─────────────────────────────────────────────────────────────────
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1")
  .replace("/api/v1", "").replace("/api", "");

const STATUS_STYLES = {
  Draft:     "bg-gray-100 text-gray-500 border-gray-200",
  Submitted: "bg-amber-50 text-amber-600 border-amber-200",
  Approved:  "bg-emerald-50 text-emerald-600 border-emerald-200",
  Rejected:  "bg-red-50 text-red-500 border-red-200",
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const fmtDateInput = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toISOString().split("T")[0];
};

const resolveUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, isError }) {
  return (
    <div className={`fixed top-4 right-4 z-[200] flex items-center gap-2 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-xl animate-slide-in ${isError ? "bg-red-500" : "bg-[#0F2854]"}`}>
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
    <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="relative max-w-4xl w-full">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white/60 text-xs font-medium">Bill Preview</span>
          <div className="flex items-center gap-2">
            <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-semibold text-white/70 hover:text-white">
              <ExternalLink size={12} /> Open original
            </a>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"><X size={15} /></button>
          </div>
        </div>
        {isPdf
          ? <iframe src={url} className="w-full h-[78vh] rounded-xl bg-white" title="Bill PDF" />
          : <img src={url} alt="Bill" className="w-full max-h-[82vh] object-contain rounded-xl shadow-2xl" />
        }
      </div>
    </div>
  );
}

// ── Print View ─────────────────────────────────────────────────────────────────
function PrintView({ sheet, onClose }) {
  const printRef = useRef(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>Expense Sheet - ${sheet.submittedBy?.name}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #000; }
        .page { width: 595px; margin: 0 auto; padding: 20px; }
        h1 { text-align: center; font-size: 16px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
        .header-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; margin-bottom: 12px; border: 1px solid #000; padding: 8px; }
        .header-row { display: flex; gap: 6px; font-size: 11px; }
        .label { font-weight: bold; min-width: 80px; }
        .period-bar { border: 1px solid #000; text-align: center; font-weight: bold; padding: 4px; margin-bottom: 0; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 0; }
        th, td { border: 1px solid #000; padding: 5px 6px; }
        th { background: #f5f5f5; font-weight: bold; text-align: center; }
        td.date-col { white-space: nowrap; }
        td.amt-col { text-align: right; }
        td.center { text-align: center; }
        .total-row td { font-weight: bold; background: #f9f9f9; }
        .words-row td { font-style: italic; border-top: 2px solid #000; }
        .signature-row { display: flex; justify-content: space-between; margin-top: 40px; font-size: 11px; }
        .sig-box { text-align: center; border-top: 1px solid #000; padding-top: 4px; min-width: 120px; }
        @media print { body { -webkit-print-color-adjust: exact; } }
      </style></head><body>${content}</body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const total = sheet.totalAmount || sheet.items?.reduce((s, i) => s + (i.amount || 0), 0) || 0;

  return (
    <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-sm font-bold text-[#0F2854]">Print Preview — Expense Sheet</h3>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-[#0F2854] text-white hover:bg-[#1C4D8D]">
              <Printer size={14} /> Print / Download PDF
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"><X size={15} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div ref={printRef} className="page bg-white p-5 mx-auto" style={{ width: "595px", fontFamily: "Arial, sans-serif", fontSize: "12px" }}>
            <h1 className="text-center font-bold text-base border-b-2 border-black pb-2 mb-3">
              Synergy Water Park Rides Private Limited.
            </h1>

            <div className="header-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", border: "1px solid #000", padding: "8px", marginBottom: 0 }}>
              <div className="header-row" style={{ fontSize: "11px" }}>
                <span className="label" style={{ fontWeight: "bold", minWidth: "80px" }}>Name</span>
                <span>{sheet.submittedBy?.name || "—"}</span>
              </div>
              <div className="header-row" style={{ fontSize: "11px" }}>
                <span className="label" style={{ fontWeight: "bold", minWidth: "80px" }}>Date</span>
                <span>{fmtDate(sheet.submittedAt || sheet.createdAt)}</span>
                <span style={{ marginLeft: "12px", fontWeight: "bold" }}>Bill Months & Year:</span>
                <span style={{ marginLeft: "4px" }}>{sheet.billMonth || "—"}</span>
              </div>
              <div className="header-row" style={{ fontSize: "11px" }}>
                <span className="label" style={{ fontWeight: "bold", minWidth: "80px" }}>Designation</span>
                <span>{sheet.designation || sheet.submittedBy?.role || "—"}</span>
              </div>
              <div className="header-row" style={{ fontSize: "11px" }}>
                <span className="label" style={{ fontWeight: "bold", minWidth: "80px" }}>Project no.</span>
                <span>{sheet.projectNumber || sheet.project?.projectId || "—"}</span>
              </div>
              <div className="header-row" style={{ fontSize: "11px" }}>
                <span className="label" style={{ fontWeight: "bold", minWidth: "80px" }}>Location Name</span>
                <span>{sheet.locationName || sheet.project?.location || "—"}</span>
              </div>
              <div className="header-row" style={{ fontSize: "11px" }}>
                <span className="label" style={{ fontWeight: "bold", minWidth: "80px" }}>State & Country</span>
                <span>{sheet.state || "—"}</span>
              </div>
            </div>

            <div className="period-bar" style={{ border: "1px solid #000", textAlign: "center", fontWeight: "bold", padding: "4px", fontSize: "11px" }}>
              Expenses Bills &nbsp;&nbsp;&nbsp; {fmtDate(sheet.billStartDate)} TO {fmtDate(sheet.billEndDate)}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid #000", padding: "5px 6px", background: "#f5f5f5", textAlign: "center" }}>Date</th>
                  <th style={{ border: "1px solid #000", padding: "5px 6px", background: "#f5f5f5", textAlign: "center", width: "40%" }}>Particulars</th>
                  <th style={{ border: "1px solid #000", padding: "5px 6px", background: "#f5f5f5", textAlign: "center" }}>Conv.</th>
                  <th style={{ border: "1px solid #000", padding: "5px 6px", background: "#f5f5f5", textAlign: "center" }}>PROJECT NO</th>
                  <th style={{ border: "1px solid #000", padding: "5px 6px", background: "#f5f5f5", textAlign: "center" }}>Bill (Y/N)</th>
                </tr>
              </thead>
              <tbody>
                {(sheet.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ border: "1px solid #000", padding: "4px 6px", whiteSpace: "nowrap" }}>{fmtDate(item.date)}</td>
                    <td style={{ border: "1px solid #000", padding: "4px 6px" }}>{item.particulars}</td>
                    <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "right" }}>₹&nbsp;{item.amount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center" }}>{item.projectNo || ""}</td>
                    <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center" }}>{item.hasBill ? "Y" : "N"}</td>
                  </tr>
                ))}
                {/* Blank rows to reach at least 15 */}
                {Array.from({ length: Math.max(0, 15 - (sheet.items?.length || 0)) }).map((_, i) => (
                  <tr key={`blank-${i}`}>
                    <td style={{ border: "1px solid #000", padding: "8px 6px" }}>&nbsp;</td>
                    <td style={{ border: "1px solid #000", padding: "8px 6px" }}>&nbsp;</td>
                    <td style={{ border: "1px solid #000", padding: "8px 6px" }}>&nbsp;</td>
                    <td style={{ border: "1px solid #000", padding: "8px 6px" }}>&nbsp;</td>
                    <td style={{ border: "1px solid #000", padding: "8px 6px" }}>&nbsp;</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td style={{ border: "1px solid #000", padding: "5px 6px", fontWeight: "bold" }}>&nbsp;</td>
                  <td style={{ border: "1px solid #000", padding: "5px 6px", fontWeight: "bold" }}>TOTAL</td>
                  <td style={{ border: "1px solid #000", padding: "5px 6px", fontWeight: "bold", textAlign: "right" }}>₹&nbsp;{total?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td style={{ border: "1px solid #000", padding: "5px 6px" }}>&nbsp;</td>
                  <td style={{ border: "1px solid #000", padding: "5px 6px" }}>&nbsp;</td>
                </tr>
                <tr className="words-row">
                  <td style={{ border: "1px solid #000", padding: "5px 6px", fontWeight: "bold", borderTop: "2px solid #000" }}>Total In Word</td>
                  <td colSpan={4} style={{ border: "1px solid #000", padding: "5px 6px", fontStyle: "italic", fontSize: "12px", fontWeight: "bold" }}>
                    {sheet.totalAmountInWords || "—"}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px", fontSize: "11px" }}>
              <div style={{ textAlign: "center", borderTop: "1px solid #000", paddingTop: "4px", minWidth: "120px" }}>Prepared By:</div>
              <div style={{ textAlign: "center", borderTop: "1px solid #000", paddingTop: "4px", minWidth: "120px" }}>Authorized By:</div>
              <div style={{ textAlign: "center", borderTop: "1px solid #000", paddingTop: "4px", minWidth: "120px" }}>Authorized By:</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Create Sheet Modal ─────────────────────────────────────────────────────────
function CreateSheetModal({ projects, onClose, onCreated, showToast }) {
  const [form, setForm] = useState({
    project: "", designation: "", locationName: "", state: "",
    billStartDate: "", billEndDate: "", billMonth: "", projectNumber: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.project || !form.billStartDate || !form.billEndDate) {
      showToast("Project, start date and end date are required", true);
      return;
    }
    try {
      setLoading(true);
      const res = await svc.createExpenseSheet(form);
      onCreated(res.data.expenseSheet);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to create sheet", true);
    } finally {
      setLoading(false);
    }
  };

  const field = (label, key, type = "text", required = false) => (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">{label}{required && " *"}</label>
      <input
        type={type} value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1C4D8D] focus:ring-2 focus:ring-blue-50 text-[#0F2854]"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0F2854]/40 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh] overflow-hidden modal-pop">
        <div className="bg-gradient-to-r from-[#0F2854] to-[#1C4D8D] px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-bold text-white">New Expense Sheet</h3>
            <p className="text-xs text-blue-200 mt-0.5">Create a day-wise expense record</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"><X size={15} /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Project *</label>
            <select value={form.project} onChange={(e) => {
              const p = projects.find(p => p._id === e.target.value);
              setForm({ ...form, project: e.target.value, locationName: p?.location || "", projectNumber: p?.projectId || "" });
            }} className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1C4D8D] text-[#0F2854] bg-white">
              <option value="">— Select Project —</option>
              {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field("Designation", "designation")}
            {field("Project Number", "projectNumber")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("Location Name", "locationName")}
            {field("State & Country", "state")}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Bill Month / Year Label</label>
            <input type="text" placeholder="e.g. Dec 2025" value={form.billMonth}
              onChange={(e) => setForm({ ...form, billMonth: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1C4D8D] text-[#0F2854]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Bill Period Start *</label>
              <input type="date" value={form.billStartDate} onChange={(e) => setForm({ ...form, billStartDate: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1C4D8D] text-[#0F2854]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Bill Period End *</label>
              <input type="date" value={form.billEndDate} onChange={(e) => setForm({ ...form, billEndDate: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1C4D8D] text-[#0F2854]" />
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 shrink-0">
          <button disabled={loading} onClick={handleSubmit}
            className="w-full bg-[#0F2854] hover:bg-[#1C4D8D] text-white text-sm font-bold py-3 rounded-xl transition-colors flex justify-center gap-2 items-center">
            {loading && <Loader2 size={16} className="animate-spin" />}
            Create Expense Sheet
          </button>
        </div>
      </div>
      <style>{`.modal-pop{animation:modal-pop .18s ease-out forwards}@keyframes modal-pop{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  );
}

// ── Add Item Modal ─────────────────────────────────────────────────────────────
function AddItemModal({ sheetId, editItem, onClose, onSaved, showToast }) {
  const [form, setForm] = useState({
    date: editItem ? fmtDateInput(editItem.date) : "",
    particulars: editItem?.particulars || "",
    amount: editItem?.amount || "",
    projectNo: editItem?.projectNo || "",
    hasBill: editItem?.hasBill || false,
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.date || !form.particulars || !form.amount) {
      showToast("Date, particulars, and amount are required", true);
      return;
    }
    try {
      setLoading(true);
      let res;
      if (editItem) {
        res = await svc.updateExpenseItem(sheetId, editItem._id, { ...form, amount: parseFloat(form.amount) });
      } else {
        res = await svc.addExpenseItem(sheetId, { ...form, amount: parseFloat(form.amount) });
      }
      onSaved(res.data.expenseSheet);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to save item", true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-[#0F2854]/40 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col modal-pop">
        <div className="bg-gradient-to-r from-[#0F2854] to-[#1C4D8D] px-6 py-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">{editItem ? "Edit Expense Item" : "Add Expense Item"}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"><X size={15} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Date *</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1C4D8D] text-[#0F2854]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Amount (₹) *</label>
              <input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1C4D8D] text-[#0F2854]" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Particulars *</label>
            <input type="text" value={form.particulars} onChange={(e) => setForm({ ...form, particulars: e.target.value })}
              placeholder="e.g. Malad to CST, Site allowance..."
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1C4D8D] text-[#0F2854]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Project No.</label>
              <input type="text" value={form.projectNo} onChange={(e) => setForm({ ...form, projectNo: e.target.value })}
                placeholder="e.g. 26315"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1C4D8D] text-[#0F2854]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Bill Available?</label>
              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="hasBill" checked={form.hasBill === true} onChange={() => setForm({ ...form, hasBill: true })} /> Yes
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="hasBill" checked={form.hasBill === false} onChange={() => setForm({ ...form, hasBill: false })} /> No
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button disabled={loading} onClick={handleSave}
            className="w-full bg-[#0F2854] hover:bg-[#1C4D8D] text-white text-sm font-bold py-3 rounded-xl transition-colors flex justify-center gap-2 items-center">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {editItem ? "Update Item" : "Add Item"}
          </button>
        </div>
      </div>
      <style>{`.modal-pop{animation:modal-pop .18s ease-out forwards}@keyframes modal-pop{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  );
}

// ── Sheet Detail / Editor View ─────────────────────────────────────────────────
function SheetDetailView({ sheet: initSheet, onClose, onUpdated, showToast }) {
  const [sheet, setSheet] = useState(initSheet);
  const [addItem, setAddItem] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showPrint, setShowPrint] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const fileInputRef = useRef(null);

  const isDraft = sheet.status === "Draft";
  const isSubmitted = sheet.status === "Submitted";
  const total = sheet.totalAmount ?? sheet.items?.reduce((s, i) => s + (i.amount || 0), 0) ?? 0;

  const refreshSheet = async () => {
    try {
      const res = await svc.getExpenseSheetById(sheet._id);
      setSheet(res.data.expenseSheet);
      onUpdated(res.data.expenseSheet);
    } catch {}
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm("Remove this item?")) return;
    try {
      const res = await svc.deleteExpenseItem(sheet._id, itemId);
      setSheet(res.data.expenseSheet);
      onUpdated(res.data.expenseSheet);
      showToast("Item removed");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to delete item", true);
    }
  };

  const handleUploadFiles = async (files) => {
    if (!files?.length) return;
    try {
      setUploadingFiles(true);
      await svc.uploadHardcopy(sheet._id, Array.from(files));
      await refreshSheet();
      showToast("Attachments uploaded");
    } catch (err) {
      showToast(err?.response?.data?.message || "Upload failed", true);
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleSubmit = async () => {
    if (!sheet.items?.length) { showToast("Add at least one expense item before submitting", true); return; }
    if (!confirm("Submit this expense sheet for director approval?")) return;
    try {
      setActionLoading(true);
      const res = await svc.submitExpenseSheet(sheet._id);
      setSheet(res.data.expenseSheet);
      onUpdated(res.data.expenseSheet);
      showToast("Sheet submitted for approval!");
    } catch (err) {
      showToast(err?.response?.data?.message || "Submit failed", true);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#0F2854]/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden modal-pop">

          {/* Header */}
          <div className="bg-gradient-to-r from-[#0F2854] to-[#1C4D8D] px-6 py-5 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[sheet.status] || STATUS_STYLES.Draft}`}>
                    {sheet.status}
                  </span>
                  {sheet.billMonth && <span className="text-xs text-blue-200">{sheet.billMonth}</span>}
                </div>
                <p className="text-lg font-bold text-white">{sheet.project?.name || "—"}</p>
                <p className="text-xs text-blue-200 mt-0.5">
                  {fmtDate(sheet.billStartDate)} → {fmtDate(sheet.billEndDate)}
                  {sheet.locationName && ` · ${sheet.locationName}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowPrint(true)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white">
                  <Printer size={13} /> Print
                </button>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"><X size={15} /></button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {/* Info Banner */}
            <div className="px-6 pt-4 pb-2 border-b border-gray-100">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 font-medium mb-0.5">Submitted By</p>
                  <p className="font-bold text-[#0F2854]">{sheet.submittedBy?.name || "—"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 font-medium mb-0.5">Designation</p>
                  <p className="font-bold text-[#0F2854]">{sheet.designation || sheet.submittedBy?.role || "—"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 font-medium mb-0.5">Project No.</p>
                  <p className="font-bold text-[#0F2854]">{sheet.projectNumber || "—"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 font-medium mb-0.5">Total Amount</p>
                  <p className="font-bold text-[#0F2854] flex items-center gap-1"><IndianRupee size={11} />{total.toLocaleString("en-IN")}</p>
                </div>
              </div>
            </div>

            {/* Reviewer notes */}
            {sheet.reviewNotes && (
              <div className={`mx-6 mt-4 p-3 rounded-xl border text-sm ${sheet.status === "Rejected" ? "bg-red-50 border-red-100 text-red-700" : "bg-emerald-50 border-emerald-100 text-emerald-700"}`}>
                <p className="font-bold text-xs uppercase tracking-widest mb-1">{sheet.status === "Rejected" ? "Rejection Reason" : "Director Notes"}</p>
                {sheet.reviewNotes}
              </div>
            )}

            {/* Items Table */}
            <div className="px-6 pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-[#4988C4]">Expense Items ({sheet.items?.length || 0})</p>
                {isDraft && (
                  <button onClick={() => setAddItem(true)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#0F2854] text-white hover:bg-[#1C4D8D]">
                    <Plus size={13} /> Add Item
                  </button>
                )}
              </div>

              {sheet.items?.length > 0 ? (
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2.5 text-left text-gray-400 font-semibold">Date</th>
                        <th className="px-3 py-2.5 text-left text-gray-400 font-semibold">Particulars</th>
                        <th className="px-3 py-2.5 text-right text-gray-400 font-semibold">Conv. (₹)</th>
                        <th className="px-3 py-2.5 text-center text-gray-400 font-semibold">Proj. No.</th>
                        <th className="px-3 py-2.5 text-center text-gray-400 font-semibold">Bill</th>
                        {isDraft && <th className="px-3 py-2.5 text-center text-gray-400 font-semibold">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {sheet.items.map((item, idx) => (
                        <tr key={item._id || idx} className="hover:bg-gray-50/50">
                          <td className="px-3 py-2.5 font-medium text-[#0F2854] whitespace-nowrap">{fmtDate(item.date)}</td>
                          <td className="px-3 py-2.5 text-gray-600">{item.particulars}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-[#0F2854]">₹{item.amount?.toLocaleString("en-IN")}</td>
                          <td className="px-3 py-2.5 text-center text-gray-500">{item.projectNo || "—"}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${item.hasBill ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
                              {item.hasBill ? "Y" : "N"}
                            </span>
                          </td>
                          {isDraft && (
                            <td className="px-3 py-2.5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => setEditItem(item)} className="text-blue-400 hover:text-blue-600"><PenLine size={13} /></button>
                                <button onClick={() => handleDeleteItem(item._id)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#0F2854]/5 border-t-2 border-[#0F2854]/10">
                        <td colSpan={isDraft ? 2 : 2} className="px-3 py-3 font-bold text-[#0F2854] uppercase text-xs tracking-wider">TOTAL</td>
                        <td className="px-3 py-3 text-right font-bold text-[#0F2854]">₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td colSpan={isDraft ? 3 : 2} className="px-3 py-3"></td>
                      </tr>
                      <tr className="bg-gray-50/50">
                        <td className="px-3 py-2 text-xs font-bold text-gray-500 uppercase">In Words:</td>
                        <td colSpan={isDraft ? 5 : 4} className="px-3 py-2 text-xs italic text-gray-600">{sheet.totalAmountInWords || "—"}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-xl py-10 text-center text-gray-400">
                  <Receipt size={24} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-medium">No expense items yet</p>
                  {isDraft && <p className="text-xs mt-1">Click "Add Item" to start building your sheet</p>}
                </div>
              )}
            </div>

            {/* Hard-copy Attachments */}
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-[#4988C4]">
                  Hard-copy Attachments ({sheet.hardCopyAttachments?.length || 0})
                </p>
                <div className="flex items-center gap-2">
                  <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf" className="hidden"
                    onChange={(e) => handleUploadFiles(e.target.files)} />
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFiles}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50">
                    {uploadingFiles ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                    Upload Bills
                  </button>
                </div>
              </div>

              {sheet.hardCopyAttachments?.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {sheet.hardCopyAttachments.map((url, idx) => {
                    const fullUrl = resolveUrl(url);
                    const isPdf = url.toLowerCase().endsWith(".pdf");
                    return (
                      <div key={idx} onClick={() => setLightboxUrl(fullUrl)}
                        className="relative group rounded-xl overflow-hidden border border-gray-100 bg-gray-50 cursor-pointer h-20">
                        {isPdf
                          ? <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-300"><FileText size={22} /><span className="text-[10px] font-semibold text-gray-400">PDF</span></div>
                          : <img src={fullUrl} alt={`bill-${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                        }
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-1.5"><ZoomIn size={13} className="text-[#0F2854]" /></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-xl py-6 text-center">
                  <Paperclip size={20} className="mx-auto mb-1.5 text-gray-300" />
                  <p className="text-xs text-gray-400 font-medium">No attachments yet</p>
                  <p className="text-[11px] text-gray-300 mt-0.5">Upload physical bills, receipts or PDFs</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
            <button onClick={onClose} className="text-xs font-bold px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100">Close</button>
            {isDraft && (
              <button onClick={handleSubmit} disabled={actionLoading || !sheet.items?.length}
                className="flex items-center gap-2 text-xs font-bold px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={13} />}
                Submit for Approval
              </button>
            )}
          </div>
        </div>
      </div>

      {addItem && (
        <AddItemModal sheetId={sheet._id} onClose={() => setAddItem(false)}
          onSaved={(updated) => { setSheet(updated); onUpdated(updated); setAddItem(false); showToast("Item added"); }}
          showToast={showToast} />
      )}

      {editItem && (
        <AddItemModal sheetId={sheet._id} editItem={editItem} onClose={() => setEditItem(null)}
          onSaved={(updated) => { setSheet(updated); onUpdated(updated); setEditItem(null); showToast("Item updated"); }}
          showToast={showToast} />
      )}

      {showPrint && <PrintView sheet={sheet} onClose={() => setShowPrint(false)} />}
      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
      <style>{`.modal-pop{animation:modal-pop .18s ease-out forwards}@keyframes modal-pop{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}@keyframes slide-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}.animate-slide-in{animation:slide-in .18s ease-out forwards}`}</style>
    </>
  );
}

// ── Sheet Card ─────────────────────────────────────────────────────────────────
function SheetCard({ sheet, onView }) {
  const total = sheet.totalAmount ?? sheet.items?.reduce((s, i) => s + (i.amount || 0), 0) ?? 0;
  return (
    <div onClick={() => onView(sheet)}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer group p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#0F2854] truncate">{sheet.project?.name || "—"}</p>
          <p className="text-xs text-gray-400 mt-0.5">{fmtDate(sheet.billStartDate)} → {fmtDate(sheet.billEndDate)}</p>
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${STATUS_STYLES[sheet.status] || STATUS_STYLES.Draft}`}>
          {sheet.status}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Total</p>
          <p className="text-xl font-bold text-[#0F2854] flex items-center gap-1"><IndianRupee size={14} />{total.toLocaleString("en-IN")}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400">{sheet.items?.length || 0} items</p>
          {sheet.billMonth && <p className="text-xs text-gray-500 font-medium">{sheet.billMonth}</p>}
        </div>
      </div>

      {sheet.locationName && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <MapPin size={11} className="shrink-0" />
          <span className="truncate">{sheet.locationName}{sheet.state ? `, ${sheet.state}` : ""}</span>
        </div>
      )}

      <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <Calendar size={11} />
          <span>{fmtDate(sheet.createdAt)}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-[#4988C4] group-hover:text-[#1C4D8D]">
          Open <ChevronRight size={12} />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function MyExpenses() {
  const [sheets, setSheets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [projRes, sheetRes] = await Promise.all([
        axiosInstance.get("/projects"),
        svc.getMyExpenseSheets(),
      ]);
      const prjs = Array.isArray(projRes.data) ? projRes.data : projRes.data?.projects || [];
      setProjects(prjs);
      const shts = sheetRes.data?.expenseSheets || [];
      setSheets(shts);
    } catch (err) {
      showToast("Failed to load data", true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSheetCreated = (newSheet) => {
    setSheets((prev) => [newSheet, ...prev]);
    setShowCreate(false);
    setSelectedSheet(newSheet);
    showToast("Expense sheet created");
  };

  const handleSheetUpdated = (updated) => {
    setSheets((prev) => prev.map((s) => s._id === updated._id ? updated : s));
    if (selectedSheet?._id === updated._id) setSelectedSheet(updated);
  };

  const STATUS_FILTERS = ["All", "Draft", "Submitted", "Approved", "Rejected"];
  const filtered = filterStatus === "All" ? sheets : sheets.filter((s) => s.status === filterStatus);

  const stats = {
    total: sheets.length,
    draft: sheets.filter((s) => s.status === "Draft").length,
    submitted: sheets.filter((s) => s.status === "Submitted").length,
    approved: sheets.filter((s) => s.status === "Approved").length,
  };

  return (
    <div className="w-full max-w-full space-y-5">
      {toast && <Toast msg={toast.msg} isError={toast.isError} />}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#0F2854]">My Expense Sheets</h2>
          <p className="text-sm text-gray-400 mt-0.5">Day-wise expense records for project reimbursement</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-[#0F2854] text-white hover:bg-[#1C4D8D] transition-colors">
          <FilePlus size={14} /> New Expense Sheet
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Sheets", value: stats.total, color: "bg-blue-50 text-blue-600" },
          { label: "Drafts", value: stats.draft, color: "bg-gray-100 text-gray-500" },
          { label: "Pending Review", value: stats.submitted, color: "bg-amber-50 text-amber-600" },
          { label: "Approved", value: stats.approved, color: "bg-emerald-50 text-emerald-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 font-medium">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color.split(" ")[1]}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${filterStatus === s ? "bg-[#0F2854] text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-[#1C4D8D] hover:text-[#1C4D8D]"}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
          <Loader2 size={18} className="animate-spin" /> Loading expense sheets…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Receipt size={36} className="text-gray-200 mb-3" />
          <p className="text-sm font-bold text-gray-400">No expense sheets found</p>
          {filterStatus === "All" && (
            <p className="text-xs text-gray-300 mt-1">Click "New Expense Sheet" to create your first one</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((sheet) => (
            <SheetCard key={sheet._id} sheet={sheet} onView={setSelectedSheet} />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateSheetModal projects={projects} onClose={() => setShowCreate(false)}
          onCreated={handleSheetCreated} showToast={showToast} />
      )}

      {selectedSheet && (
        <SheetDetailView sheet={selectedSheet} onClose={() => setSelectedSheet(null)}
          onUpdated={handleSheetUpdated} showToast={showToast} />
      )}

      <style>{`
        @keyframes slide-in { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .animate-slide-in { animation: slide-in .18s ease-out forwards; }
      `}</style>
    </div>
  );
}
