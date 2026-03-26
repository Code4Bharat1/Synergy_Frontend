"use client";
import { useState } from "react";
import {
  ClipboardList,
  UserCheck,
  PenTool,
  FileSpreadsheet,
  Factory,
  Truck,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Plus,
  Trash2,
  Package,
  File,
  Upload,
} from "lucide-react";

// ── Stage Advance Roles (RBAC) ────────────────────────────────────────────────
export const STAGE_ADVANCE_ROLES = {
  complaint_raised:  ["installationIncharge", "director", "admin"],
  incharge_review:   ["installationIncharge", "director", "admin"],
  design_department: ["support",  "engineer", "director", "admin"],
  erp_bom_packing:   ["admin", "director"],
  production:        ["admin", "director", "marketingCoordinator"],
  dispatch:          ["admin", "director", "marketingCoordinator",
                      "engineer", "installationIncharge", "qualityControl"],
};

// ── Stage Definitions ─────────────────────────────────────────────────────────
const STAGES = [
  {
    key: "complaint_raised",
    step: 1,
    label: "Complaint Raised",
    description: "Marketing coordinator logs complaint in ERP",
    icon: ClipboardList,
    color: "#3b82f6",      // blue
    bgColor: "rgba(59,130,246,0.1)",
    borderColor: "rgba(59,130,246,0.3)",
  },
  {
    key: "incharge_review",
    step: 2,
    label: "Solution In-Charge Review",
    description: "Reviews complaint, assessment and classification",
    icon: UserCheck,
    color: "#f59e0b",      // amber
    bgColor: "rgba(245,158,11,0.1)",
    borderColor: "rgba(245,158,11,0.3)",
  },
  {
    key: "design_department",
    step: 3,
    label: "Design Department",
    description: "Critical material list and applicable design updates. Non-critical material list only",
    icon: PenTool,
    color: "#8b5cf6",      // purple
    bgColor: "rgba(139,92,246,0.1)",
    borderColor: "rgba(139,92,246,0.3)",
  },
  {
    key: "erp_bom_packing",
    step: 4,
    label: "ERP Generates BOM + Packing List",
    description: "Bill of material and packing list uploaded in the ERP system",
    icon: FileSpreadsheet,
    color: "#06b6d4",      // cyan
    bgColor: "rgba(6,182,212,0.1)",
    borderColor: "rgba(6,182,212,0.3)",
  },
  {
    key: "production",
    step: 5,
    label: "Production",
    description: "Manufacturing items as per BOM",
    icon: Factory,
    color: "#d97706",      // dark amber
    bgColor: "rgba(217,119,6,0.1)",
    borderColor: "rgba(217,119,6,0.3)",
  },
  {
    key: "dispatch",
    step: 6,
    label: "Dispatch",
    description: "Material dispatched to site",
    icon: Truck,
    color: "#0ea5e9",      // sky
    bgColor: "rgba(14,165,233,0.1)",
    borderColor: "rgba(14,165,233,0.3)",
  },
  {
    key: "resolved",
    step: 7,
    label: "Resolved after Installation",
    description: "Complaint marked resolved on-site by engineer",
    icon: CheckCircle2,
    color: "#10b981",      // emerald
    bgColor: "rgba(16,185,129,0.1)",
    borderColor: "rgba(16,185,129,0.3)",
  },
];

// ── Utility: compute time difference label ────────────────────────────────────
function timeDiff(start, end) {
  if (!start || !end) return null;
  const ms = new Date(end) - new Date(start);
  if (ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h`;
}

function formatDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }) + ", " + dt.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Stage Status Helpers ──────────────────────────────────────────────────────
function getStageStatus(stageIndex, currentStageIndex, complaintStatus) {
  // If the complaint is officially resolved or closed, mark all stages as completed
  if (complaintStatus === "resolved" || complaintStatus === "closed") return "completed";
  
  if (stageIndex < currentStageIndex) return "completed";
  if (stageIndex === currentStageIndex) return "active";
  return "pending";
}

// ── Main Tracker Component ────────────────────────────────────────────────────
/**
 * ComplaintTracker
 *
 * Props:
 *   currentStage  — (string) one of the STAGES[].key values, e.g. "production"
 *   stageHistory  — (array)  optional array of { stage, timestamp, updatedBy, notes }
 *   compact       — (bool)   if true, renders a horizontal compact bar
 *   onAdvance     — (fn)     optional callback(nextStageKey) when user clicks "Advance"
 *   canAdvance    — (bool)   whether the advance button should be shown
 *   complaint     — (object) the full complaint object (for fallback dates)
 */
export default function ComplaintTracker({
  currentStage,
  status,
  stageHistory = [],
  compact = false,
  onAdvance,
  canAdvance = false,
  complaint = {},
}) {
  const [expanded, setExpanded] = useState(!compact);
  const [stageNotes, setStageNotes] = useState("");
  const [materials, setMaterials] = useState([]);
  const [files, setFiles] = useState([]); // local files for stage advancement upload
  const [showWorkshop, setShowWorkshop] = useState(false);

  const addMaterial = () => setMaterials([...materials, { name: "", qty: "", unit: "pcs", urgent: false }]);
  const removeMaterial = (idx) => setMaterials(materials.filter((_, i) => i !== idx));
  const updateMaterial = (idx, key, val) => {
    const next = [...materials];
    next[idx][key] = val;
    setMaterials(next);
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files).map(f => ({
      name: f.name,
      file: f
    }));
    setFiles([...files, ...newFiles]);
  };

  const removeFile = (idx) => setFiles(files.filter((_, i) => i !== idx));

  // Fallback to infer stage from status if currentStage is missing
  let derivedStage = currentStage;
  if (!derivedStage && status) {
    if (status === "resolved" || status === "closed") derivedStage = "resolved";
    else if (status === "in-progress") derivedStage = "incharge_review";
    else derivedStage = "complaint_raised";
  }
  if (!derivedStage) derivedStage = "complaint_raised";

  const currentIdx = STAGES.findIndex((s) => s.key === derivedStage);
  const activeIdx = currentIdx >= 0 ? currentIdx : 0;

  // Build a map of stage → history entry for quick lookup
  const historyMap = {};
  stageHistory.forEach((h) => {
    historyMap[h.stage] = h;
  });

  // If no stageHistory provided, use complaint.createdAt as stage 1 timestamp
  if (!historyMap["complaint_raised"] && complaint.createdAt) {
    historyMap["complaint_raised"] = {
      stage: "complaint_raised",
      timestamp: complaint.createdAt,
      updatedBy: complaint.loggedBy?.name || "System",
    };
  }

  // If resolved, use complaint.resolvedAt as stage 7 timestamp
  if (!historyMap["resolved"] && complaint.resolvedAt) {
    historyMap["resolved"] = {
      stage: "resolved",
      timestamp: complaint.resolvedAt,
      updatedBy: complaint.assignedTo?.name || "Engineer",
    };
  }

  // ── Compact horizontal bar ────────────────────────────────────────────────
  if (!expanded) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5">
              {STAGES.map((s, i) => {
                const status = getStageStatus(i, activeIdx, complaint.status);
                return (
                  <div key={s.key} className="flex items-center">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                      style={{
                        background: status === "completed" ? s.color : status === "active" ? s.bgColor : "#f1f5f9",
                        color: status === "completed" ? "#fff" : status === "active" ? s.color : "#94a3b8",
                        border: `2px solid ${status === "active" ? s.color : status === "completed" ? s.color : "#e2e8f0"}`,
                      }}
                    >
                      {status === "completed" ? "✓" : s.step}
                    </div>
                    {i < STAGES.length - 1 && (
                      <div
                        className="w-4 h-0.5"
                        style={{
                          background: status === "completed" ? s.color : "#e2e8f0",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-gray-800">
                Step {activeIdx + 1} of {STAGES.length}
              </p>
              <p className="text-xs text-gray-400">{STAGES[activeIdx]?.label}</p>
            </div>
          </div>
          <ChevronDown size={16} className="text-gray-400" />
        </button>
      </div>
    );
  }

  // ── Expanded vertical tracker ─────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <ClipboardList size={15} className="text-blue-500" />
          <div>
            <h3 className="text-sm font-bold text-gray-800">Complaint Tracker</h3>
            <p className="text-xs text-gray-400">
              Step {activeIdx + 1} of {STAGES.length} — {STAGES[activeIdx]?.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Time elapsed since complaint raised */}
          {complaint.createdAt && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={11} />
              {timeDiff(complaint.createdAt, complaint.resolvedAt || new Date().toISOString()) || "—"} total
            </span>
          )}
          {compact && (
            <button
              onClick={() => setExpanded(false)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronUp size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-500">Progress</span>
          <span className="text-xs font-bold text-blue-600">
            {Math.round(((activeIdx + 1) / STAGES.length) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${((activeIdx + 1) / STAGES.length) * 100}%`,
              background: `linear-gradient(90deg, ${STAGES[0].color}, ${STAGES[activeIdx]?.color || STAGES[0].color})`,
            }}
          />
        </div>
      </div>

      {/* Stages */}
      <div className="px-5 py-4 space-y-0">
        {STAGES.map((stage, i) => {
          const status = getStageStatus(i, activeIdx, complaint.status);
          const Icon = stage.icon;
          const historyEntry = historyMap[stage.key];
          const prevEntry = i > 0 ? historyMap[STAGES[i - 1].key] : null;
          const duration = historyEntry && prevEntry ? timeDiff(prevEntry.timestamp, historyEntry.timestamp) : null;

          return (
            <div key={stage.key} className="flex gap-3">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
                  style={{
                    background: status === "completed" ? stage.color : status === "active" ? stage.bgColor : "#f8fafc",
                    border: `2.5px solid ${status === "pending" ? "#e2e8f0" : stage.color}`,
                    boxShadow: status === "active" ? `0 0 0 4px ${stage.bgColor}` : "none",
                  }}
                >
                  {status === "completed" ? (
                    <CheckCircle2 size={16} color="#fff" />
                  ) : (
                    <Icon
                      size={16}
                      color={status === "active" ? stage.color : "#cbd5e1"}
                    />
                  )}
                </div>
                {i < STAGES.length - 1 && (
                  <div
                    className="w-0.5 flex-1 min-h-[28px] transition-all duration-500"
                    style={{
                      background: status === "completed" ? stage.color : "#e2e8f0",
                    }}
                  />
                )}
              </div>

              {/* Stage content */}
              <div className={`pb-5 flex-1 min-w-0 ${i === STAGES.length - 1 ? "pb-0" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p
                      className="text-sm font-bold leading-tight"
                      style={{
                        color: status === "pending" ? "#94a3b8" : status === "active" ? stage.color : "#1e293b",
                      }}
                    >
                      Step {stage.step} — {stage.label}
                    </p>
                    <p
                      className="text-xs mt-0.5 leading-relaxed"
                      style={{ color: status === "pending" ? "#cbd5e1" : "#64748b" }}
                    >
                      {stage.description}
                    </p>
                  </div>
                  {/* Status pill */}
                  {status === "completed" && (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: stage.bgColor, color: stage.color }}
                    >
                      ✓ Done
                    </span>
                  )}
                  {status === "active" && (
                    <span
                      className="text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 animate-pulse"
                      style={{ background: stage.bgColor, color: stage.color, border: `1px solid ${stage.borderColor}` }}
                    >
                      ● Current
                    </span>
                  )}
                </div>

                {/* Timestamp & metadata */}
                {historyEntry && (
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={10} />
                      {formatDate(historyEntry.timestamp)}
                    </span>
                    {historyEntry.updatedBy && (
                      <span className="text-xs text-gray-400">
                        by <span className="font-semibold text-gray-500">{historyEntry.updatedBy}</span>
                      </span>
                    )}
                    {duration && (
                      <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        ⏱ {duration}
                      </span>
                    )}
                  </div>
                )}
                {historyEntry?.notes && (
                  <p className="text-xs text-gray-500 mt-1 bg-gray-50 rounded-lg px-2.5 py-1.5 italic">
                    {historyEntry.notes}
                  </p>
                )}

                {/* Delay warning for active stage */}
                {status === "active" && historyEntry && (() => {
                  const daysSince = Math.floor((Date.now() - new Date(historyEntry.timestamp)) / 86400000);
                  if (daysSince > 3) {
                    return (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-red-500 bg-red-50 rounded-lg px-2.5 py-1.5">
                        <AlertTriangle size={12} />
                        <span className="font-semibold">
                          Stuck for {daysSince} days — requires attention
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Advance / Action Section */}
      {canAdvance && activeIdx < STAGES.length - 1 && onAdvance && (
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 space-y-4">
          {!showWorkshop ? (
            <button
              onClick={() => setShowWorkshop(true)}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-200"
            >
              Advance to Step {activeIdx + 2}: {STAGES[activeIdx + 1].label}
            </button>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                 <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Advancement Workshop</h4>
                 <button onClick={() => setShowWorkshop(false)} className="text-[10px] font-bold text-gray-400 hover:text-gray-600">Cancel</button>
              </div>

              {/* Stage Notes */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">Stage Notes / Comments</label>
                <textarea 
                  value={stageNotes}
                  onChange={(e) => setStageNotes(e.target.value)}
                  placeholder={`Provide context for ${STAGES[activeIdx + 1].label}...`}
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none resize-none min-h-[80px]"
                />
              </div>

              {/* Material List Builder - only for Design / BOM stages */}
              {(derivedStage === "incharge_review" || derivedStage === "design_department" || derivedStage === "erp_bom_packing") && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block">Material List / BOM Update</label>
                    <button 
                      onClick={addMaterial}
                      className="text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded"
                    >
                      + Add Item
                    </button>
                  </div>
                  
                  {materials.length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic">No materials added. Skip if not required.</p>
                  ) : (
                    <div className="space-y-2">
                       {materials.map((m, idx) => (
                         <div key={idx} className="flex gap-2 items-start">
                            <input 
                              placeholder="Name" 
                              className="flex-1 text-[11px] p-2 border border-gray-200 rounded-lg outline-none"
                              value={m.name}
                              onChange={(e) => updateMaterial(idx, "name", e.target.value)}
                            />
                            <input 
                              placeholder="Qty" 
                              className="w-14 text-[11px] p-2 border border-gray-200 rounded-lg outline-none"
                              value={m.qty}
                              onChange={(e) => updateMaterial(idx, "qty", e.target.value)}
                            />
                            <select 
                              className="text-[11px] p-2 border border-gray-200 rounded-lg outline-none bg-white"
                              value={m.unit}
                              onChange={(e) => updateMaterial(idx, "unit", e.target.value)}
                            >
                               {["pcs", "kg", "m", "m²", "lot", "set"].map(u => <option key={u}>{u}</option>)}
                            </select>
                            <button onClick={() => removeMaterial(idx)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={13}/></button>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              )}

              {/* File Upload - for Design / BOM / Resolution */}
              {(derivedStage === "design_department" || derivedStage === "erp_bom_packing" || derivedStage === "dispatch") && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase block">Design / Evidence Upload</label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:bg-blue-50/10 cursor-pointer transition-all">
                    <Upload size={18} className="text-gray-400 mb-1" />
                    <span className="text-[10px] text-gray-500 font-semibold">Click to upload design files</span>
                    <input type="file" multiple className="hidden" onChange={handleFileChange} />
                  </label>
                  
                  {files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {files.map((f, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-2 py-1 rounded text-[10px] font-bold text-blue-700">
                           <File size={10} />
                           <span className="max-w-[80px] truncate">{f.name}</span>
                           <button onClick={() => removeFile(idx)} className="ml-1 hover:text-red-500">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  onAdvance(STAGES[activeIdx + 1].key, { 
                    stageNotes, 
                    materials, 
                    files: files.map(f => f.file) 
                  });
                  setShowWorkshop(false);
                }}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-3 rounded-xl transition-all shadow-lg shadow-green-100"
              >
                Confirm & Advance Stage
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Export the STAGES array for use elsewhere
export { STAGES };
