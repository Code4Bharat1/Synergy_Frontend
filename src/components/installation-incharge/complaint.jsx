"use client";
import { useState } from "react";

const COMPLAINTS = [
  {
    id: "CMP-001", project: "PRJ-2401", projectName: "AquaPark Dubai",
    client: "AquaPark Dubai LLC", loggedBy: "Client Site Manager",
    loggedDate: "2026-02-20", category: "Structural",
    title: "Waterslide Alpha — Joint Gap Visible",
    description: "A visible gap of approximately 8 mm has appeared at the junction between sections 3 and 4 of Waterslide Alpha. The gap is causing water leakage and requires immediate rectification before commissioning.",
    materials: [
      { item: "Structural Sealant (300 ml cartridge)", qty: 6, unit: "Cartridges" },
      { item: "Fibreglass Repair Patch Kit",           qty: 2, unit: "Kits"       },
      { item: "Stainless Steel Clamp (50 mm)",         qty: 8, unit: "Pcs"        },
    ],
    priority: "Critical", status: "Pending",
  },
  {
    id: "CMP-002", project: "PRJ-2389", projectName: "Blue Lagoon Resort",
    client: "Blue Lagoon Co.", loggedBy: "Karim Nour",
    loggedDate: "2026-02-18", category: "Hydraulics",
    title: "Wave Pool — Nozzle Blockage",
    description: "Three inlet nozzles on the wave pool system are partially blocked, resulting in uneven wave distribution. Client has flagged this as affecting the guest experience. Nozzles need to be removed, cleaned, and reinstalled.",
    materials: [
      { item: "Nozzle Cleaning Kit",        qty: 1, unit: "Kit"   },
      { item: "Replacement O-Ring Set",     qty: 3, unit: "Sets"  },
      { item: "Thread Sealant Tape (PTFE)", qty: 4, unit: "Rolls" },
    ],
    priority: "High", status: "Approved",
    dispatchedBy: "Operations Manager", dispatchDate: "2026-02-19",
    comment: "Materials approved. Dispatch coordinated with warehouse — ETA 2 days.",
  },
  {
    id: "CMP-003", project: "PRJ-2422", projectName: "TidalPark Muscat",
    client: "Oman Leisure", loggedBy: "Nadia Farouq",
    loggedDate: "2026-02-23", category: "Surface Finish",
    title: "Lazy River — Paint Discolouration",
    description: "Discolouration noted across approximately 20% of the lazy river channel interior. The gel coat appears to have reacted with the water treatment chemicals used during initial fill.",
    materials: [
      { item: "Chemical-Resistant Gel Coat (White, 5L)", qty: 4,  unit: "Cans"   },
      { item: "Surface Primer",                          qty: 2,  unit: "Cans"   },
      { item: "Abrasive Sanding Sheets (240 grit)",      qty: 20, unit: "Sheets" },
    ],
    priority: "Medium", status: "Pending",
  },
  {
    id: "CMP-004", project: "PRJ-2435", projectName: "FlowPark Doha",
    client: "Qatar Parks Ltd", loggedBy: "Omar Siddiq",
    loggedDate: "2026-02-22", category: "Electrical",
    title: "Speed Slide Pro — Control Panel Fault",
    description: "The control panel for Speed Slide Pro is intermittently failing to register the dispatch signal from the start button. Issue first appeared during trial run. Safety interlock is triggering false positives.",
    materials: [
      { item: "Control Panel PCB Board (Slide Controller V2)", qty: 1, unit: "Pcs" },
      { item: "Connector Terminal Block",                      qty: 2, unit: "Pcs" },
      { item: "24V DC Power Supply Module",                    qty: 1, unit: "Pcs" },
    ],
    priority: "High", status: "Rejected",
    dispatchedBy: "Technical Lead", dispatchDate: "2026-02-23",
    comment: "Incorrect part number submitted. Please re-submit with updated BOM reference.",
  },
  {
    id: "CMP-005", project: "PRJ-2376", projectName: "SunSplash Inc.",
    client: "SunSplash Inc.", loggedBy: "Lena Weber",
    loggedDate: "2026-02-24", category: "Structural",
    title: "Funnel Bowl — Anchor Plate Corrosion",
    description: "Early-stage surface corrosion identified on two anchor plates supporting the funnel bowl. Corrosion appears to be due to inadequate surface coating prior to installation. Plates need to be treated or replaced.",
    materials: [
      { item: "Anti-Corrosion Epoxy Coating (1L)",    qty: 3, unit: "Cans" },
      { item: "Galvanised Anchor Plate (200×200 mm)", qty: 2, unit: "Pcs"  },
      { item: "Wire Brush Set",                       qty: 1, unit: "Set"  },
    ],
    priority: "Medium", status: "Pending",
  },
];

const PRIORITY_CLS = {
  Critical: { badge: "bg-red-100 text-red-700 border border-red-200",    dot: "bg-red-500"    },
  High:     { badge: "bg-amber-100 text-amber-700 border border-amber-200", dot: "bg-amber-500" },
  Medium:   { badge: "bg-blue-100 text-blue-700 border border-blue-200",  dot: "bg-blue-500"   },
  Low:      { badge: "bg-green-100 text-green-700 border border-green-200",dot: "bg-green-500" },
};

const STATUS_CLS = {
  Pending:  { badge: "bg-amber-100 text-amber-700 border border-amber-200", dot: "bg-amber-500"  },
  Approved: { badge: "bg-green-100 text-green-700 border border-green-200", dot: "bg-green-500"  },
  Rejected: { badge: "bg-red-100 text-red-700 border border-red-200",       dot: "bg-red-500"    },
};

const CAT_ICONS = {
  Structural:      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
  Hydraulics:      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z"/><circle cx="12" cy="9" r="2.5"/></svg>,
  "Surface Finish":<svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  Electrical:      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
};

function Chip({ label, badgeCls, dotCls }) {
  return (
    <span className={`${badgeCls} inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap`}>
      {dotCls && <span className={`${dotCls} w-1.5 h-1.5 rounded-full shrink-0`} />}
      {label}
    </span>
  );
}

const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const daysAgo = (d) => {
  const n = Math.ceil((new Date() - new Date(d)) / 86400000);
  return n === 0 ? "Today" : n === 1 ? "Yesterday" : `${n}d ago`;
};

export default function ComplaintApproval() {
  const [complaints, setComplaints] = useState(COMPLAINTS);
  const [selected, setSelected]     = useState(COMPLAINTS[0].id);
  const [filter, setFilter]         = useState("All");
  const [modal, setModal]           = useState(null);
  const [comment, setComment]       = useState("");
  const [showDetail, setShowDetail] = useState(false);

  const counts = { All: complaints.length, Pending: 0, Approved: 0, Rejected: 0 };
  complaints.forEach((c) => counts[c.status]++);

  const list   = filter === "All" ? complaints : complaints.filter((c) => c.status === filter);
  const active = complaints.find((c) => c.id === selected) || list[0];

  const resolve = () => {
    const newStatus = modal.type === "approve" ? "Approved" : "Rejected";
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === active.id
          ? { ...c, status: newStatus, dispatchedBy: "Operations Manager", dispatchDate: new Date().toISOString().split("T")[0], comment: comment.trim() || undefined }
          : c
      )
    );
    const remaining = complaints.filter((c) => c.id !== active.id && c.status === "Pending");
    if (remaining.length) setSelected(remaining[0].id);
    setModal(null);
    setComment("");
  };

  const selectComplaint = (id) => {
    setSelected(id);
    setShowDetail(true);
  };

  if (!active) return null;

  const pm = PRIORITY_CLS[active.priority];
  const sm = STATUS_CLS[active.status];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-blue-950 flex flex-col">

      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4 flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-0.5">Client Relations</p>
          <h1 className="text-xl sm:text-2xl font-bold text-blue-950">Complaint Approval</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: `${counts.Pending} Pending`,  cls: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
            { label: `${counts.Approved} Approved`,cls: "bg-green-50 text-green-700", dot: "bg-green-500" },
            { label: `${counts.Rejected} Rejected`,cls: "bg-red-50 text-red-700",     dot: "bg-red-500"   },
          ].map((s) => (
            <div key={s.label} className={`${s.cls} flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold`}>
              <span className={`${s.dot} w-1.5 h-1.5 rounded-full`} />
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile back */}
      {showDetail && (
        <div className="lg:hidden px-4 pb-3">
          <button onClick={() => setShowDetail(false)} className="flex items-center gap-2 text-sm font-semibold text-blue-700">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to complaints
          </button>
        </div>
      )}

      {/* Split layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT list */}
        <div className={`${showDetail ? "hidden" : "flex"} lg:flex flex-col w-full lg:w-72 lg:shrink-0 bg-white border-r border-gray-100`}>
          {/* Filter tabs */}
          <div className="px-4 border-b border-gray-100 flex gap-0">
            {["All", "Pending", "Approved", "Rejected"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-1 py-3 mr-4 text-xs font-bold border-b-2 transition-all ${
                  filter === f ? "border-blue-800 text-blue-950" : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {f} <span className="opacity-60 ml-0.5">{counts[f]}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {list.length === 0 && (
              <p className="py-10 text-center text-sm text-gray-300">No complaints</p>
            )}
            {list.map((c) => {
              const cpm = PRIORITY_CLS[c.priority];
              const csm = STATUS_CLS[c.status];
              const isActive = selected === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => selectComplaint(c.id)}
                  className={`px-4 py-3.5 border-b border-gray-50 cursor-pointer border-l-[3px] transition-all ${
                    isActive ? "bg-blue-50 border-l-blue-800" : "bg-white border-l-transparent hover:bg-slate-50"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-[10px] font-bold tracking-wide ${isActive ? "text-blue-700" : "text-gray-400"}`}>{c.id}</span>
                    <Chip label={c.status} badgeCls={csm.badge} dotCls={csm.dot} />
                  </div>
                  <p className="text-xs font-bold text-blue-950 leading-snug line-clamp-2 mb-1.5">{c.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">{c.projectName}</span>
                    <Chip label={c.priority} badgeCls={cpm.badge} dotCls={null} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT detail */}
        <div className={`${!showDetail ? "hidden" : "flex"} lg:flex flex-1 flex-col overflow-y-auto px-4 sm:px-6 py-5`}>
          <div className="max-w-3xl w-full">

            {/* Title row */}
            <div className="mb-5">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-xs font-bold text-blue-500 tracking-wider">{active.id}</span>
                <span className="text-gray-200 text-xs">·</span>
                <span className="text-xs text-gray-400">{active.project}</span>
                <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-gray-500">
                  {CAT_ICONS[active.category]}
                </div>
                <span className="text-xs text-gray-500 font-medium">{active.category}</span>
                <Chip label={active.priority} badgeCls={pm.badge} dotCls={null} />
                <Chip label={active.status} badgeCls={sm.badge} dotCls={sm.dot} />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-blue-950 leading-snug mb-1">{active.title}</h2>
              <p className="text-xs text-gray-400">{active.projectName} · {active.client}</p>
            </div>

            {/* Meta strip */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-4 grid grid-cols-2 sm:grid-cols-4">
              {[
                { label: "Logged By", value: active.loggedBy },
                { label: "Date",      value: fmtDate(active.loggedDate) },
                { label: "Time Open", value: daysAgo(active.loggedDate) },
                { label: "Category",  value: active.category },
              ].map((m, i) => (
                <div key={m.label} className={`p-3.5 sm:p-4 ${i < 3 ? "border-b sm:border-b-0 sm:border-r border-gray-50" : ""} ${i === 1 ? "border-r border-gray-50" : ""}`}>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{m.label}</p>
                  <p className="text-sm font-bold text-blue-950">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Description + Materials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {/* Complaint details */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <svg width="12" height="12" fill="none" stroke="#4988C4" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-blue-950">Complaint Details</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{active.description}</p>
              </div>

              {/* Required materials */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <svg width="12" height="12" fill="none" stroke="#1C4D8D" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-blue-950">Required Materials</span>
                </div>
                <div className="flex flex-col gap-2">
                  {active.materials.map((m, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 border border-gray-100 rounded-xl px-3 py-2">
                      <p className="text-xs text-gray-700 flex-1 mr-3">{m.item}</p>
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                        {m.qty} {m.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Resolution block */}
            {active.status !== "Pending" && (
              <div className={`mb-4 rounded-2xl p-4 flex items-start gap-3 border ${
                active.status === "Approved" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              }`}>
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                  active.status === "Approved" ? "bg-green-100" : "bg-red-100"
                }`}>
                  {active.status === "Approved"
                    ? <svg width="13" height="13" fill="none" stroke="#16A34A" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                    : <svg width="13" height="13" fill="none" stroke="#DC2626" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  }
                </div>
                <div>
                  <p className={`text-xs font-bold mb-1 ${active.status === "Approved" ? "text-green-700" : "text-red-700"}`}>
                    {active.status === "Approved" ? "Dispatch Approved" : "Dispatch Rejected"} by {active.dispatchedBy} · {fmtDate(active.dispatchDate)}
                  </p>
                  {active.comment && <p className="text-xs text-gray-500 leading-relaxed">{active.comment}</p>}
                </div>
              </div>
            )}

            {/* Action buttons */}
            {active.status === "Pending" && (
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => setModal({ type: "approve" })}
                  className="flex items-center gap-2 bg-blue-950 hover:bg-blue-800 text-white rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                  Approve Dispatch
                </button>
                <button
                  onClick={() => setModal({ type: "reject" })}
                  className="flex items-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl px-5 py-2.5 text-sm font-bold transition-all"
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-blue-950/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${modal.type === "approve" ? "bg-green-50" : "bg-red-50"}`}>
                  {modal.type === "approve"
                    ? <svg width="15" height="15" fill="none" stroke="#16A34A" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                    : <svg width="15" height="15" fill="none" stroke="#DC2626" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  }
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-950">
                    {modal.type === "approve" ? "Approve Material Dispatch" : "Reject Dispatch Request"}
                  </p>
                  <p className="text-xs text-gray-400">{active.id} · {active.title}</p>
                </div>
              </div>
              <button onClick={() => setModal(null)} className="text-gray-300 hover:text-gray-500 transition-colors">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="px-5 py-4">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2">Materials to Dispatch</p>
              <div className="bg-slate-50 border border-gray-100 rounded-xl overflow-hidden mb-4">
                {active.materials.map((m, i) => (
                  <div key={i} className={`flex items-center justify-between px-3.5 py-2.5 ${i < active.materials.length - 1 ? "border-b border-gray-100" : ""}`}>
                    <span className="text-xs text-gray-600">{m.item}</span>
                    <span className="text-xs font-bold text-blue-700 ml-3 shrink-0">{m.qty} {m.unit}</span>
                  </div>
                ))}
              </div>
              <label className="block text-xs font-bold text-blue-950 mb-2">
                Comment <span className="font-normal text-gray-300">— optional</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={modal.type === "approve" ? "Add dispatch instructions or notes..." : "Reason for rejection..."}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs text-blue-950 resize-none font-sans bg-white outline-none focus:border-blue-400 transition-colors"
              />
            </div>

            <div className="px-5 pb-5 flex gap-3">
              <button onClick={() => setModal(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-500 rounded-xl text-sm font-semibold transition-colors">
                Cancel
              </button>
              <button onClick={resolve}
                className={`flex-[2] py-2.5 text-white rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                  modal.type === "approve" ? "bg-blue-950 hover:bg-blue-800" : "bg-red-600 hover:bg-red-700"
                }`}>
                {modal.type === "approve" ? "Confirm Dispatch" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}