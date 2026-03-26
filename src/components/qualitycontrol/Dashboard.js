"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  FileText,
  Loader2,
  MessageSquare,
  X,
} from "lucide-react";
import axiosInstance from "@/lib/axios";
import ComplaintTracker, { STAGE_ADVANCE_ROLES } from "../common/ComplaintTracker";

const PRIORITY_STYLES = {
  High: "bg-red-50 text-red-600",
  Medium: "bg-amber-50 text-amber-600",
  Low: "bg-green-50 text-green-600",
};

const PRIORITY_DOT = {
  High: "bg-red-500",
  Medium: "bg-amber-500",
  Low: "bg-green-500",
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }) {
  const styles = {
    Approved: "bg-green-50 text-green-600",
    Rejected: "bg-red-50 text-red-600",
    Pending: "bg-amber-50 text-amber-600",
  };
  return (
    <span
      className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${styles[status] || "bg-gray-100 text-gray-500"}`}
    >
      {status || "Pending"}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  colorClass,
  loading,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3 shadow-sm
        cursor-pointer transition-all duration-200
        hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 active:scale-[0.98]"
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-blue-950">
          {loading ? (
            <Loader2 size={20} className="animate-spin text-gray-300 mt-1" />
          ) : (
            value
          )}
        </p>
        <p className="text-sm font-medium text-gray-700 mt-0.5 leading-tight">
          {label}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

import MediaGallery from "../common/MediaGallery";
import { Package } from "lucide-react";

function ComplaintDetailModal({ complaint, onClose, onAdvance, actionLoading }) {
  const canAdvance = STAGE_ADVANCE_ROLES[complaint.currentStage || "complaint_raised"]?.includes("qualityControl");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-base font-bold text-blue-950 truncate">{complaint.title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-6">
          <ComplaintTracker 
            currentStage={complaint.currentStage} 
            stageHistory={complaint.stageHistory}
            complaint={complaint}
            onAdvance={onAdvance}
            canAdvance={canAdvance}
            compact
          />
          
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                {complaint.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50/30 p-2.5 rounded-xl border border-gray-100/50">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Project</p>
                <p className="text-sm font-bold text-blue-950 truncate">{complaint.project?.name || "—"}</p>
                {complaint.project?.projectId && <p className="text-[9px] font-bold text-blue-500">#{complaint.project.projectId}</p>}
              </div>
              <div className="bg-gray-50/30 p-2.5 rounded-xl border border-gray-100/50">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Status</p>
                <div className="flex items-center gap-2 mt-0.5">
                   <div className={`w-2 h-2 rounded-full ${complaint.status === 'resolved' ? 'bg-green-500' : 'bg-blue-500'}`} />
                   <span className="text-sm font-bold text-blue-950 capitalize">{complaint.status}</span>
                </div>
              </div>
            </div>

            {/* Materials */}
            {complaint.materials && complaint.materials.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-gray-100">
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Material List / BOM</p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {complaint.materials.map((m, idx) => (
                       <div key={idx} className="flex items-center gap-2 bg-amber-50/40 p-2 rounded-lg border border-amber-100/50">
                          <Package size={14} className="text-amber-500" />
                          <div className="min-w-0">
                             <p className="text-xs font-bold text-gray-800 truncate">{m.name}</p>
                             <p className="text-[10px] text-amber-600 font-bold">{m.qty} {m.unit}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
            )}

            {/* Media */}
            <div className="pt-4 border-t border-gray-100">
               <MediaGallery files={complaint.photos || (complaint.photo ? [complaint.photo] : [])} />
            </div>
          </div>
        </div>
        <div className="p-4 border-t bg-gray-50/50 flex justify-end">
           <button onClick={onClose} className="px-6 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-200 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function QCDashboard() {
  const router = useRouter();
  const [qcReports, setQcReports] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewComplaint, setViewComplaint] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchComplaints = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/complaints");
      const data = Array.isArray(res.data) ? res.data : (res.data.data ?? []);
      setComplaints(data.slice(0, 5));
    } catch {
      setComplaints([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axiosInstance.get("/reports/view-qc"),
      fetchComplaints()
    ]).then(([qcRes]) => {
        const data = Array.isArray(qcRes.data) ? qcRes.data : (qcRes.data.data ?? []);
        setQcReports(data);
      })
      .catch(() => setQcReports([]))
      .finally(() => setLoading(false));
  }, [fetchComplaints]);

  const handleAdvanceStage = async (nextStageKey, stageData = {}) => {
    if (!viewComplaint) return;
    try {
      setActionLoading(true);
      await axiosInstance.put(`/complaints/${viewComplaint._id}`, {
        currentStage: nextStageKey,
        ...stageData,
      });
      setViewComplaint(null);
      fetchComplaints();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const total = qcReports.length;
  const approved = qcReports.filter((r) => r.status === "Approved").length;
  const rejected = qcReports.filter((r) => r.status === "Rejected").length;
  const needsReview = qcReports.filter((r) => Array.isArray(r.qcChecks) && r.qcChecks.some((c) => c.state === null));
  const recentReports = [...qcReports].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)).slice(0, 5);

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-blue-950">QC Dashboard</h2>
        <p className="text-sm text-gray-400 mt-0.5">{today}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total QC Reports" value={total} sub="All time" icon={ClipboardList} colorClass="bg-blue-50 text-blue-500" loading={loading} onClick={() => router.push("/qualityControl/trial-approval")} />
        <StatCard label="Needs Re-review" value={needsReview.length} sub="Pending items" icon={Clock} colorClass="bg-amber-50 text-amber-500" loading={loading} onClick={() => router.push("/qualityControl/trial-approval")} />
        <StatCard label="Approved" value={approved} sub="Signed off" icon={CheckCircle2} colorClass="bg-green-50 text-green-600" loading={loading} onClick={() => router.push("/qualityControl/trial-approval")} />
        <StatCard label="Rejected / Flagged" value={rejected} sub="Needs rework" icon={XCircle} colorClass="bg-red-50 text-red-500" loading={loading} onClick={() => router.push("/qualityControl/trial-approval")} />
      </div>

      {/* Recent Complaints */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-blue-950">Recent Complaints</h3>
          <span className="text-xs font-semibold text-blue-500 bg-blue-50 px-2.5 py-1 rounded-full">{complaints.length} Records</span>
        </div>
        <div className="divide-y divide-gray-50">
          {complaints.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-400">No complaints yet</div>
          ) : (
            complaints.map(c => (
              <div key={c._id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setViewComplaint(c)}>
                <div className="flex justify-between items-start mb-2">
                   <div>
                     <p className="text-sm font-bold text-blue-950 capitalize">{c.title}</p>
                     <p className="text-xs text-gray-400 mt-0.5">{c.project?.name || "No Project"}</p>
                   </div>
                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.priority === 'high' || c.priority === 'critical' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'} uppercase`}>
                     {c.priority}
                   </span>
                </div>
                <ComplaintTracker currentStage={c.currentStage} status={c.status} compact />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent QC Reports */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-blue-950">Recent QC Reports</h3>
          <a href="/qualityControl/inspection" className="flex items-center gap-1 text-xs font-semibold text-blue-500 hover:underline">
            New Inspection <ArrowRight size={12} />
          </a>
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-left">
                {["Report ID", "Project", "Submitted By", "Date", "Status"]?.map((h) => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentReports.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-blue-500">{r._id.slice(-6).toUpperCase()}</td>
                  <td className="px-5 py-3.5 text-blue-950 font-medium">{r.project?.name || "—"}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{r.submittedBy?.name || "—"}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{formatDate(r.date || r.createdAt)}</td>
                  <td className="px-5 py-3.5 text-xs"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewComplaint && (
        <ComplaintDetailModal 
          complaint={viewComplaint} 
          onClose={() => setViewComplaint(null)} 
          onAdvance={handleAdvanceStage}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
}
