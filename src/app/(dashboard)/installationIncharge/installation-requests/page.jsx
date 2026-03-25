"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import {
  Clock,
  Flag,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Send,
  Building,
  RefreshCcw
} from "lucide-react";
import toast from "react-hot-toast";

const reqStatusStyle = {
  Sent: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  Accepted: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  Pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  Rejected: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  Completed: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
};

const PRIORITY_COLOR = {
  Low: "text-emerald-600",
  Medium: "text-amber-600",
  High: "text-orange-600",
  Critical: "text-red-600",
};

export default function InstallationApprovals() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      if (!user?._id && !user?.id) return;
      const res = await api.get(`/installation-requests/list?engineer=${user._id || user.id}`);
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        setRequests(data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchRequests();
  }, [user]);

  const handleUpdate = async (id, newStatus) => {
    try {
      setUpdating(id);
      await api.patch(`/installation-requests/update/${id}`, { status: newStatus });
      toast.success(`Request marked as ${newStatus}`);
      fetchRequests();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 gap-2 text-sm">
        <RefreshCcw className="animate-spin" size={16} /> Loading requests...
      </div>
    );
  }

  const pendingCount = requests.filter(r => r.status === "Sent" || r.status === "Pending").length;
  const acceptedCount = requests.filter(r => r.status === "Accepted").length;
  const rejectedCount = requests.filter(r => r.status === "Rejected").length;

  return (
    <div className="max-w-[1200px] mx-auto animate-fadeUp">
      {/* ── Header ── */}
      <div className="mb-7 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
              Installation
            </span>
            <span className="text-slate-200">/</span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
              Approvals
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Installation Requests
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Review and approve installation requests assigned to you by Marketing.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {[
            { label: "New / Pending", value: pendingCount, color: "text-blue-600" },
            { label: "Accepted", value: acceptedCount, color: "text-emerald-600" },
            { label: "Rejected", value: rejectedCount, color: "text-red-500" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-center flex-1 sm:min-w-[90px]"
            >
              <div className={`text-[18px] font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-slate-500 font-semibold mt-0.5 uppercase tracking-wide">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── List ── */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="py-20 text-center bg-white border border-slate-200 rounded-xl">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Send size={20} className="text-slate-300" />
            </div>
            <h3 className="text-[14px] font-semibold text-slate-700">No requests found</h3>
            <p className="text-[13px] text-slate-400 mt-1">You have no installation requests assigned to you.</p>
          </div>
        ) : (
          requests.map((req) => {
            const s = reqStatusStyle[req.status] || reqStatusStyle.Sent;
            const pColor = PRIORITY_COLOR[req.priority] || "text-slate-500";

            let dateLabel = "—";
            if (req.requestedDate) {
              try { dateLabel = format(new Date(req.requestedDate), "MMM dd, yyyy"); }
              catch (e) { dateLabel = String(req.requestedDate).substring(0,10); }
            }

            return (
              <div key={req._id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-slate-300 transition-colors">
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <Building size={18} className="text-indigo-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          #{req._id.slice(-6).toUpperCase()}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md ${s.bg} ${s.text} border ${s.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {req.status === "Sent" ? "New Request" : req.status}
                        </span>
                      </div>
                      <h3 className="text-[15px] font-bold text-slate-900 leading-tight">
                        {req.project?.name || "Unknown Project"}
                      </h3>
                    </div>
                  </div>

                  {/* Actions */}
                  {(req.status === "Sent" || req.status === "Pending") && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleUpdate(req._id, "Rejected")}
                        disabled={updating === req._id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-200 text-[12px] font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 transition-all disabled:opacity-50"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                      <button
                        onClick={() => handleUpdate(req._id, "Accepted")}
                        disabled={updating === req._id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-[12px] font-semibold text-white hover:bg-slate-700 transition-all disabled:opacity-50 shadow-sm"
                      >
                        <CheckCircle size={14} /> Accept
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-[1fr_260px] gap-6">
                  {/* Left: Message & Details */}
                  <div className="space-y-4">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Subject</div>
                      <div className="text-[13px] font-medium text-slate-800">{req.subject}</div>
                    </div>
                    {req.message && (
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Message / Details</div>
                        <div className="text-[13px] text-slate-600 leading-relaxed bg-slate-50/50 p-3.5 rounded-lg border border-slate-100">
                          {req.message}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-[12px] text-slate-500 pt-2">
                       <div className="flex items-center gap-1.5">
                         <User size={13} className="text-slate-400 shrink-0" />
                         <span className="truncate max-w-[150px]">From: <span className="font-semibold text-slate-700">{req.requestedBy?.name || "Marketing"}</span></span>
                       </div>
                       <div className="flex items-center gap-1.5">
                         <Clock size={13} className="text-slate-400 shrink-0" />
                         <span>Sent: {format(new Date(req.createdAt), "MMM dd, hh:mm a")}</span>
                       </div>
                    </div>
                  </div>

                  {/* Right: Metadata */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-4 h-fit">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Priority Level</div>
                      <div className={`flex items-center gap-1.5 text-[13px] font-bold ${pColor}`}>
                        <Flag size={14} /> {req.priority}
                      </div>
                    </div>

                    <div className="h-px bg-slate-200/60 w-full" />

                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Target Start Date</div>
                      <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
                        <Calendar size={14} className="text-slate-400 shrink-0" /> {dateLabel}
                      </div>
                    </div>

                    <div className="h-px bg-slate-200/60 w-full" />

                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Est. Duration</div>
                      <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
                        <Clock size={14} className="text-slate-400 shrink-0" /> {req.duration ? `${req.duration} days` : "Not specified"}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
