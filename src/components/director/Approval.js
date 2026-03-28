"use client";
import { useState, useEffect, useCallback } from "react";
import {
  DollarSign, Calendar, MessageSquareWarning, Wrench, X,
  CheckCircle2, XCircle, Clock, Loader2, FileText, Eye,
  IndianRupee, Paperclip, ZoomIn, ExternalLink, Receipt,
  MapPin, Building2,
} from "lucide-react";
import axiosInstance from "../../lib/axios";
import Link from "next/link";
import * as expSvc from "../../services/expense.service";

// ── Helpers ───────────────────────────────────────────────────────────────────
const apiFetch = async (path, { method = "GET", body } = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const config = {
    method, url: path,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { data: JSON.parse(body) } : {}),
  };
  const res = await axiosInstance(config);

  return res.data;



};

const FILE_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1")
  .replace("/api/v1", "").replace("/api", "");

const resolveUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${FILE_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

// ── Type / Status Config ──────────────────────────────────────────────────────
const TYPE_CONFIG = {
  "Budget Deviation":    { icon: DollarSign,          color: "bg-amber-50 text-amber-600" },
  "Timeline Extension":  { icon: Calendar,             color: "bg-blue-50 text-blue-600"   },
  "High-Value Complaint":{ icon: MessageSquareWarning, color: "bg-red-50 text-red-500"     },
  "Corrective Action":   { icon: Wrench,               color: "bg-purple-50 text-purple-600"},
  "Document Review":     { icon: FileText,             color: "bg-blue-50 text-blue-600"   },
  "Expense Approval":    { icon: Receipt,              color: "bg-green-50 text-green-600" },
};

const PRIORITY_STYLE = {
  High:    "bg-red-50 text-red-500",
  Medium:  "bg-amber-50 text-amber-600",
  Low:     "bg-gray-100 text-gray-500",
  default: "bg-gray-50 text-gray-500",
};

const STATUS_CONFIG = {
  Pending:   { cls: "bg-amber-50 text-amber-600",   icon: Clock        },
  Submitted: { cls: "bg-amber-50 text-amber-600",   icon: Clock        },
  Approved:  { cls: "bg-green-50 text-green-600",   icon: CheckCircle2 },
  Rejected:  { cls: "bg-red-50 text-red-500",       icon: XCircle      },
};

const ALL_TYPES = [
  "All", "Budget Deviation", "Timeline Extension",
  "High-Value Complaint", "Corrective Action", "Document Review", "Expense Approval",
];

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
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
          ? <iframe src={url} className="w-full h-[78vh] rounded-xl bg-white" title="Bill" />
          : <img src={url} alt="Bill preview" className="w-full max-h-[82vh] object-contain rounded-xl shadow-2xl" />
        }
      </div>
    </div>
  );
}

// ── Reject Modal ──────────────────────────────────────────────────────────────
function RejectModal({ item, onConfirm, onCancel }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#0F2854]">Reject Expense Sheet</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-500">Rejecting: <strong className="text-[#0F2854]">{item?.project}</strong></p>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
          placeholder="Reason for rejection…"
          className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none outline-none focus:border-[#1C4D8D] transition-colors placeholder-gray-300 text-[#0F2854]" />
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button onClick={() => reason.trim() && onConfirm(reason)} disabled={!reason.trim()}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors ${reason.trim() ? "bg-red-500 hover:bg-red-600" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}>
            Confirm Reject
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Expense Sheet Detail Modal ────────────────────────────────────────────────
function ExpenseSheetDetailModal({ sheetId, onClose, onApprove, onReject }) {
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await expSvc.getExpenseSheetById(sheetId);
        setSheet(res.data.expenseSheet);
      } catch {
        onClose();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sheetId]);

  if (!sheet && !loading) return null;

  const total = sheet?.totalAmount ?? sheet?.items?.reduce((s, i) => s + (i.amount || 0), 0) ?? 0;
  const isSubmitted = sheet?.status === "Submitted";

  return (
    <>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#0F2854]/50 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden anim-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0F2854] to-[#1C4D8D] px-6 py-5 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {sheet && <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    sheet.status === "Approved" ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                    : sheet.status === "Rejected" ? "bg-red-50 text-red-500 border-red-200"
                    : "bg-amber-50 text-amber-600 border-amber-200"
                  }`}>{sheet.status}</span>}
                </div>
                <p className="text-lg font-bold text-white">{sheet?.project?.name || "—"}</p>
                <p className="text-xs text-blue-200 mt-0.5">
                  Expense Sheet · {fmtDate(sheet?.billStartDate)} → {fmtDate(sheet?.billEndDate)}
                </p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white shrink-0"><X size={15} /></button>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-[#1C4D8D]" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {/* Info Grid */}
              <div className="px-6 pt-5 pb-3 border-b border-gray-100">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  {[
                    { label: "Employee", value: sheet.submittedBy?.name },
                    { label: "Designation", value: sheet.designation || sheet.submittedBy?.role },
                    { label: "Bill Month", value: sheet.billMonth },
                    { label: "Project No.", value: sheet.projectNumber },
                    { label: "Location", value: sheet.locationName },
                    { label: "State", value: sheet.state },
                  ].map(({ label, value }) => value ? (
                    <div key={label} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-gray-400 font-medium mb-0.5">{label}</p>
                      <p className="font-bold text-[#0F2854] truncate">{value}</p>
                    </div>
                  ) : null)}
                </div>
              </div>

              {/* Review Notes */}
              {sheet.reviewNotes && (
                <div className={`mx-6 mt-4 p-3 rounded-xl border text-sm ${sheet.status === "Rejected" ? "bg-red-50 border-red-100 text-red-700" : "bg-emerald-50 border-emerald-100 text-emerald-700"}`}>
                  <p className="font-bold text-xs uppercase tracking-widest mb-1">{sheet.status === "Rejected" ? "Rejection Reason" : "Director Notes"}</p>
                  {sheet.reviewNotes}
                </div>
              )}

              {/* Items Table */}
              <div className="px-6 pt-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[#4988C4] mb-3">
                  Expense Items ({sheet.items?.length || 0})
                </p>
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
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[#0F2854]/5 border-t-2 border-[#0F2854]/10">
                          <td colSpan={2} className="px-3 py-3 font-bold text-[#0F2854] uppercase text-xs tracking-wider">TOTAL</td>
                          <td className="px-3 py-3 text-right font-bold text-[#0F2854]">₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          <td colSpan={2}></td>
                        </tr>
                        <tr className="bg-gray-50/50">
                          <td className="px-3 py-2 text-xs font-bold text-gray-500">In Words:</td>
                          <td colSpan={4} className="px-3 py-2 text-xs italic text-gray-600">{sheet.totalAmountInWords || "—"}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-200 rounded-xl py-8 text-center text-gray-400 text-sm">No items</div>
                )}
              </div>

              {/* Attachments */}
              {sheet.hardCopyAttachments?.length > 0 && (
                <div className="px-6 py-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#4988C4] mb-3">
                    Bill Attachments ({sheet.hardCopyAttachments.length})
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {sheet.hardCopyAttachments.map((url, idx) => {
                      const full = resolveUrl(url);
                      const isPdf = url.toLowerCase().endsWith(".pdf");
                      return (
                        <div key={idx} onClick={() => setLightboxUrl(full)}
                          className="relative group rounded-xl overflow-hidden border border-gray-100 bg-gray-50 cursor-pointer h-16">
                          {isPdf
                            ? <div className="w-full h-full flex flex-col items-center justify-center gap-0.5 text-gray-300"><FileText size={18} /><span className="text-[9px] text-gray-400">PDF</span></div>
                            : <img src={full} alt={`att-${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          }
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 bg-white/90 rounded-full p-1"><ZoomIn size={11} className="text-[#0F2854]" /></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
            <button onClick={onClose} className="text-xs font-bold px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100">Close</button>
            {isSubmitted && (
              <div className="flex items-center gap-2">
                <button onClick={() => { onReject(sheet._id); onClose(); }}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200">
                  <XCircle size={13} /> Reject
                </button>
                <button onClick={() => { onApprove(sheet._id); onClose(); }}
                  className="flex items-center gap-1.5 text-xs font-bold px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
                  <CheckCircle2 size={13} /> Approve Sheet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
      <style>{`.anim-scale-in{animation:scale-in .18s ease-out forwards}@keyframes scale-in{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </>
  );
}

// ── Detail With Links ─────────────────────────────────────────────────────────
function DetailWithLinks({ text }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return (
    <p className="text-sm text-gray-600 leading-relaxed break-words">
      {parts.map((part, i) =>
        urlRegex.test(part)
          ? <Link key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline hover:text-blue-700 break-all">Click Here</Link>
          : <span key={i}>{part}</span>
      )}
    </p>
  );
}

// ── Generic Detail Modal ──────────────────────────────────────────────────────
function DetailModal({ item, onClose }) {
  if (!item) return null;
  const t = TYPE_CONFIG[item.type] || TYPE_CONFIG["Document Review"];
  const s = STATUS_CONFIG[item.status] || STATUS_CONFIG.Pending;
  const TypeIcon = t.icon;
  const StatusIcon = s.icon;

  const renderContent = () => {
    if (item.detail?.startsWith("Details: {")) {
      try {
        const obj = JSON.parse(item.detail.replace("Details: ", ""));
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(obj).map(([k, v]) => (
              <div key={k} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{k.replace(/([A-Z])/g, " $1").trim()}</p>
                <p className="text-sm font-semibold text-[#0F2854] break-words">{typeof v === "object" ? JSON.stringify(v) : String(v)}</p>
              </div>
            ))}
          </div>
        );
      } catch { }
    }
    return <DetailWithLinks text={item.detail || ""} />;
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col z-10 anim-scale-in">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${t.color}`}><TypeIcon size={20} /></div>
            <div>
              <h3 className="text-lg font-bold text-[#0F2854] leading-none">{item.type}</h3>
              <p className="text-xs text-gray-400 mt-1">{item.project} {item.projectId && `· ${item.projectId}`}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Status", content: <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.cls}`}><StatusIcon size={12} />{item.status}</div> },
              { label: "Priority", content: <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.default}`}>{item.priority}</div> },
              { label: "Requested By", content: <p className="text-sm font-bold text-[#0F2854]">{item.requestedBy}</p> },
              { label: "Date", content: <p className="text-sm font-bold text-[#0F2854]">{item.date}</p> },
            ].map(({ label, content }) => (
              <div key={label} className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                {content}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1">Request Information</p>
            {renderContent()}
            {item.amount && (
              <div className="mt-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
                <span className="text-sm font-bold text-blue-900">Requested Amount</span>
                <span className="text-xl font-bold text-blue-600">{item.amount}</span>
              </div>
            )}
            {(item.reviewNotes || item.rejectReason) && (
              <div className="mt-4 p-4 bg-red-50/50 rounded-2xl border border-red-100 space-y-1">
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Review Notes</p>
                <p className="text-sm text-red-600 font-medium">{item.reviewNotes || item.rejectReason}</p>
              </div>
            )}
            {item.url && (
              <div className="mt-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-0.5">Attachment</p>
                  <p className="text-sm font-bold text-emerald-900">Receipt / Document File</p>
                </div>
                <Link href={item.url} target="_blank" className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20">
                  <Eye size={14} /> View File
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#0F2854] hover:opacity-90 transition-all">Got it</button>
        </div>
      </div>
      <style>{`.anim-scale-in{animation:scale-in .18s ease-out forwards}@keyframes scale-in{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  );
}

// ── Approval Card ─────────────────────────────────────────────────────────────
function ApprovalCard({ item, onApprove, onReject, onViewSheet, loadingActionId }) {
  const t = TYPE_CONFIG[item.type] || TYPE_CONFIG["Document Review"];
  const s = STATUS_CONFIG[item.status] || STATUS_CONFIG.Pending;
  const StatusIcon = s.icon;
  const TypeIcon = t.icon;
  const isPending = item.status === "Pending" || item.status === "Submitted";
  const isExpenseSheet = item.source === "expenseSheets";
  const isActionLoading = loadingActionId === item.id;

  return (
    <div className={`w-full bg-white rounded-xl border shadow-sm overflow-hidden ${isPending ? "border-gray-100" : item.status === "Approved" ? "border-green-200" : "border-red-200"}`}>
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3 w-full">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${t.color}`}><TypeIcon size={16} /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 w-full">
              <p className="text-sm font-bold text-[#0F2854]">{item.type}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.default}`}>{item.priority}</span>
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${s.cls}`}><StatusIcon size={10} />{item.status}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{item.project}</p>
            <p className="text-xs text-gray-400">{item.requestedBy} · {item.date}</p>
          </div>
        </div>

        <DetailWithLinks text={item.detail} />

        <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            {item.amount ? <span className="text-sm font-bold text-[#0F2854]">{item.amount}</span> : <div />}
            <button
              onClick={() => isExpenseSheet ? onViewSheet(item.id) : onApprove(item, true)}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider">
              <Eye size={13} /> View Details
            </button>
          </div>

          {isPending && (
            <div className="flex gap-2 w-full pt-1">
              <button onClick={() => onReject(item)} disabled={isActionLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50">
                <XCircle size={13} /> Reject
              </button>
              <button onClick={() => onApprove(item)} disabled={isActionLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50">
                {isActionLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Approve
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Approvals() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("All");
  const [rejecting, setRejecting] = useState(null);        // { id, source, project }
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingActionId, setLoadingActionId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);  // generic detail modal
  const [sheetDetailId, setSheetDetailId] = useState(null); // expense sheet detail modal

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const [docRes, appRes, expRes] = await Promise.all([
        apiFetch("/documents").catch(() => []),
        apiFetch("/approvals/all").catch(() => ({ approvals: [] })),
        expSvc.getAllExpenseSheets({ status: "" }).catch(() => ({ data: { expenseSheets: [] } })),
      ]);

      const docs = Array.isArray(docRes) ? docRes : docRes.documents || [];
      const approvals = Array.isArray(appRes) ? appRes : appRes.approvals || [];
      const expenseSheets = expRes.data?.expenseSheets || [];

      const mappedDocs = docs.map((d) => ({
        id: d._id, source: "documents", type: "Document Review",
        project: d.project?.name || "Global",
        detail: `Title: ${d.title}. Type: ${d.documentType}. \nURL: ${d.url}`,
        amount: "", requestedBy: d.uploadedBy?.name || "Unknown User",
        date: new Date(d.createdAt).toLocaleDateString(),
        priority: "Medium",
        status: d.status ? d.status.charAt(0).toUpperCase() + d.status.slice(1) : "Pending",
        projectId: d.project?.projectId || "",
        reviewNotes: d.reviewNotes || d.rejectReason || "",
        url: d.url ? (d.url.startsWith("http") ? d.url : `${FILE_BASE}${d.url}`) : "",
      }));

      const mappedApps = approvals.map((a) => {
        let detailString = "";
        try { detailString = `Details: ${JSON.stringify(a.details)}`; } catch {}
        return {
          id: a._id, source: "approvals", type: a.type || "Other",
          project: a.project?.name || "Global", detail: detailString,
          amount: a.details?.requestedBudget ? `₹${a.details.requestedBudget}` : "",
          requestedBy: a.requestedBy?.name || "Unknown",
          date: new Date(a.createdAt).toLocaleDateString(),
          priority: "High",
          status: a.status ? a.status.charAt(0).toUpperCase() + a.status.slice(1) : "Pending",
          projectId: a.project?.projectId || "", reviewNotes: a.reviewNotes || "",
        };
      });

      // New: expense sheets (submitted or already reviewed)
      const mappedSheets = expenseSheets.map((e) => {
        const total = e.totalAmount ?? e.items?.reduce((s, i) => s + (i.amount || 0), 0) ?? 0;
        return {
          id: e._id, source: "expenseSheets", type: "Expense Approval",
          project: e.project?.name || "Global",
          detail: `Employee: ${e.submittedBy?.name || "—"}. Period: ${fmtDate(e.billStartDate)} → ${fmtDate(e.billEndDate)}. Items: ${e.items?.length || 0}`,
          amount: `₹${total.toLocaleString("en-IN")}`,
          requestedBy: e.submittedBy?.name || "Unknown",
          date: new Date(e.submittedAt || e.createdAt).toLocaleDateString(),
          priority: "Medium",
          status: e.status === "Draft" ? "Draft" : e.status === "Submitted" ? "Submitted" : e.status,
          projectId: e.project?.projectId || "",
          reviewNotes: e.reviewNotes || "",
        };
      });

      setItems([...mappedDocs, ...mappedApps, ...mappedSheets]
        .sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (err) {
      console.error(err);
      showToast("Error loading approvals", true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const approve = async (item, justView = false) => {
    if (justView) { setSelectedItem(item); return; }
    try {
      setLoadingActionId(item.id);
      if (item.source === "expenseSheets") {
        await expSvc.approveExpenseSheet(item.id, "Approved");
      } else if (item.source === "approvals") {
        await apiFetch(`/approvals/${item.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "Approved" }) });
      } else {
        await apiFetch(`/documents/${item.id}`, { method: "PUT", body: JSON.stringify({ status: "approved" }) });
      }
      setItems((p) => p.map((i) => i.id === item.id ? { ...i, status: "Approved" } : i));
      showToast("Approved successfully");
    } catch (err) {
      showToast("Failed to approve", true);
    } finally {
      setLoadingActionId(null);
    }
  };

  const reject = async (reason) => {
    try {
      setLoadingActionId(rejecting.id);
      if (rejecting.source === "expenseSheets") {
        await expSvc.approveExpenseSheet(rejecting.id, "Rejected", reason);
      } else if (rejecting.source === "approvals") {
        await apiFetch(`/approvals/${rejecting.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "Rejected", reviewNotes: reason }) });
      } else {
        await apiFetch(`/documents/${rejecting.id}`, { method: "PUT", body: JSON.stringify({ status: "rejected", rejectReason: reason }) });
      }
      setItems((p) => p.map((i) => i.id === rejecting.id ? { ...i, status: "Rejected" } : i));
      setRejecting(null);
      showToast("Request rejected");
    } catch {
      showToast("Failed to reject", true);
    } finally {
      setLoadingActionId(null);
    }
  };

  const filtered = filter === "All" ? items : items.filter((i) => i.type === filter);
  const pending = items.filter((i) => i.status === "Pending" || i.status === "Submitted").length;

  return (
    <div className="w-full max-w-full overflow-hidden space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg ${toast.isError ? "bg-red-500" : "bg-[#0F2854]"}`}>
          <CheckCircle2 size={15} className={toast.isError ? "text-red-200" : "text-green-400"} /> {toast.msg}
        </div>
      )}

      {rejecting && <RejectModal item={rejecting} onConfirm={reject} onCancel={() => setRejecting(null)} />}
      {selectedItem && <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
      {sheetDetailId && (
        <ExpenseSheetDetailModal
          sheetId={sheetDetailId}
          onClose={() => setSheetDetailId(null)}
          onApprove={(id) => { approve({ id, source: "expenseSheets" }); setSheetDetailId(null); }}
          onReject={(id) => {
            const item = items.find((i) => i.id === id);
            setRejecting({ id, source: "expenseSheets", project: item?.project || "" });
            setSheetDetailId(null);
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#0F2854]">Approvals</h2>
          <p className="text-sm text-gray-400 mt-0.5">{pending} pending review</p>
        </div>
        {pending > 0 && (
          <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shrink-0">
            <Clock size={13} /> {pending} awaiting decision
          </span>
        )}
      </div>

      {/* Type Filter */}
      <div className="w-full">
        <div className="block sm:hidden">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="w-full text-sm border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-[#0F2854] text-[#0F2854] font-bold bg-white shadow-sm">
            {ALL_TYPES.map((f) => <option key={f} value={f}>{f === "All" ? "Filter by Category" : f}</option>)}
          </select>
        </div>
        <div className="hidden sm:flex gap-2 overflow-x-auto pb-1">
          {ALL_TYPES.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${filter === f ? "bg-[#0F2854] text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-[#1C4D8D] hover:text-[#1C4D8D]"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
          <Loader2 size={18} className="animate-spin" /> Fetching pending approvals…
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <ApprovalCard key={item.id} item={item}
              onApprove={approve}
              onReject={(i) => setRejecting(i)}
              onViewSheet={(id) => setSheetDetailId(id)}
              loadingActionId={loadingActionId}
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-10">No approvals in this category</p>
          )}
        </div>
      )}
    </div>
  );
}
