"use client";
import { useState } from "react";
import { Copy, Plus, Trash2, Search, CheckCircle, ChevronRight, User } from "lucide-react";
import { PROJECTS, ITEMS_POOL, ENGINEERS } from "./shared";

const STEPS = [
  { n: 1, label: "Source Project" },
  { n: 2, label: "Link Items"     },
  { n: 3, label: "Assign Lead"    },
];

export default function ProjectReplicationPage() {
  const [step,        setStep]        = useState(1);
  const [sourceId,    setSourceId]    = useState("");
  const [projectNum,  setProjectNum]  = useState("");
  const [targetName,  setTargetName]  = useState("");
  const [targetLoc,   setTargetLoc]   = useState("");
  const [linkedItems, setLinkedItems] = useState([]);
  const [itemSearch,  setItemSearch]  = useState("");
  const [incharge,    setIncharge]    = useState(null);
  const [notes,       setNotes]       = useState("");
  const [submitted,   setSubmitted]   = useState(false);
  const [loading,     setLoading]     = useState(false);

  const sourceProject = PROJECTS.find(p => p.id === sourceId);
  const filteredItems  = ITEMS_POOL.filter(i =>
    i.toLowerCase().includes(itemSearch.toLowerCase()) && !linkedItems.includes(i)
  );

  const toggleItem = (item) => {
    setLinkedItems(prev =>
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  const canProceed1 = sourceId && projectNum && targetName;
  const canProceed2 = linkedItems.length > 0;

  if (submitted) return (
    <div className="flex flex-col items-center justify-center py-20 animate-fadeUp">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="font-display text-2xl font-extrabold text-brand-darkest mb-2">Replication Created!</h2>
      <p className="text-brand-mid text-[14px] mb-6 text-center max-w-xs">
        Project replication for <strong>{targetName}</strong> has been submitted with {linkedItems.length} items.
      </p>
      <div className="w-full max-w-sm rounded-2xl  bg-white p-5 mb-6 space-y-2">
        {[
          ["Source",    sourceProject?.name || sourceId],
          ["New Project", targetName],
          ["Location",  targetLoc || "—"],
          ["Items",     `${linkedItems.length} linked`],
          ["In-charge", incharge?.name || "—"],
        ].map(([k,v]) => (
          <div key={k} className="flex justify-between text-[13px]">
            <span className="text-brand-mid">{k}</span>
            <span className="text-brand-darkest font-bold">{v}</span>
          </div>
        ))}
      </div>
      <button
        onClick={() => { setSubmitted(false); setStep(1); setSourceId(""); setProjectNum(""); setTargetName(""); setTargetLoc(""); setLinkedItems([]); setIncharge(null); setNotes(""); }}
        className="rounded-xl bg-brand-darkest px-6 py-2.5 text-[13px] font-bold text-brand-light hover:bg-brand-dark transition-colors"
      >New Replication</button>
    </div>
  );

  return (
    <div className="animate-fadeUp">
      {/* Header */}
      <div className="mb-7">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[2px] text-brand-mid">Marketing</p>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-darkest">Project Replication</h1>
        <p className="mt-1 text-[13px] text-brand-mid">Replicate an existing project with linked items and assigned lead</p>
      </div>

      {/* Step Bar */}
      <div className="flex rounded-2xl overflow-hidden bg-white shadow-sm mb-6">
        {STEPS.map((s, i) => {
          const active   = step === s.n;
          const complete = step > s.n;
          return (
            <button
              key={s.n}
              onClick={() => complete && setStep(s.n)}
              className={[
                "flex-1 py-4 px-2 flex flex-col items-center gap-1.5 transition-all border-none",
                i < 2 ? "border-r border-brand-mid/10" : "",
                active   ? "bg-gradient-to-br from-brand-darkest to-brand-dark" : "",
                complete ? "bg-emerald-500/7 cursor-pointer"                    : "bg-white cursor-default",
              ].join(" ")}
            >
              <div className={[
                "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold",
                active   ? "bg-white/15 text-brand-light"  : "",
                complete ? "bg-emerald-500 text-white"      : "",
                !active && !complete ? "bg-brand-mid/12 text-brand-mid" : "",
              ].join(" ")}>
                {complete ? "✓" : s.n}
              </div>
              <span className={[
                "text-[11px] font-bold",
                active   ? "text-brand-light"   : "",
                complete ? "text-emerald-500"   : "",
                !active && !complete ? "text-brand-mid" : "",
              ].join(" ")}>{s.label}</span>
              {active && <span className="text-[8px] text-brand-light/60 bg-white/15 px-2 py-0.5 rounded-full">CURRENT</span>}
            </button>
          );
        })}
      </div>

      {/* ══ STEP 1: SOURCE PROJECT ══ */}
      {step === 1 && (
        <div className="rounded-2xl  bg-white shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-brand-darkest to-brand-dark flex items-center justify-center shrink-0">
              <Copy size={15} className="text-brand-light" />
            </div>
            <div>
              <div className="font-display font-bold text-[14px] text-brand-darkest">Source Project</div>
              <div className="text-brand-mid text-[11px]">Select the existing project to replicate</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Source project selector */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-dark mb-1.5">
                Existing Project <span className="text-red-500">*</span>
              </label>
              <select
                value={sourceId}
                onChange={e => setSourceId(e.target.value)}
                className="w-full bg-slate-50  rounded-xl px-3.5 py-2.5 text-[13px] text-brand-darkest outline-none focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/15 transition-all cursor-pointer"
              >
                <option value="">Select source project</option>
                {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}
              </select>
            </div>

            {/* New project number */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-dark mb-1.5">
                New Project Number <span className="text-red-500">*</span>
              </label>
              <input
                value={projectNum}
                onChange={e => setProjectNum(e.target.value)}
                placeholder="e.g. PRJ-2501"
                className="w-full bg-slate-50   rounded-xl px-3.5 py-2.5 text-[13px] text-brand-darkest outline-none placeholder-slate-300 focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/15 transition-all"
              />
            </div>

            {/* Target project name */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-dark mb-1.5">
                New Project Name <span className="text-red-500">*</span>
              </label>
              <input
                value={targetName}
                onChange={e => setTargetName(e.target.value)}
                placeholder="e.g. WaveCity Resort"
                className="w-full bg-slate-50  rounded-xl px-3.5 py-2.5 text-[13px] text-brand-darkest outline-none placeholder-slate-300 focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/15 transition-all"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-dark mb-1.5">
                Location
              </label>
              <input
                value={targetLoc}
                onChange={e => setTargetLoc(e.target.value)}
                placeholder="City, Country"
                className="w-full bg-slate-50  rounded-xl px-3.5 py-2.5 text-[13px] text-brand-darkest outline-none placeholder-slate-300 focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/15 transition-all"
              />
            </div>
          </div>

          {/* Source preview */}
          {sourceProject && (
            <div className="mb-6 rounded-xl bg-brand-bg/50 p-4 flex items-center gap-4 flex-wrap">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-darkest to-brand-dark flex items-center justify-center shrink-0">
                <Copy size={16} className="text-brand-light" />
              </div>
              <div className="min-w-0">
                <div className="text-brand-darkest font-bold text-[13px]">Replicating from: {sourceProject.name}</div>
                <div className="text-brand-mid text-[11px]">📍 {sourceProject.location} · {sourceProject.id}</div>
              </div>
              <span className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                {sourceProject.status}
              </span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => canProceed1 && setStep(2)}
              disabled={!canProceed1}
              className="rounded-xl bg-gradient-to-br from-brand-dark to-brand-darkest text-brand-light px-5 py-2.5 text-[13px] font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              Continue to Link Items <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ══ STEP 2: LINK ITEMS ══ */}
      {step === 2 && (
        <div className="rounded-2xl  bg-white shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-brand-darkest to-brand-dark flex items-center justify-center shrink-0">
              <Plus size={15} className="text-brand-light" />
            </div>
            <div>
              <div className="font-display font-bold text-[14px] text-brand-darkest">Link Items</div>
              <div className="text-brand-mid text-[11px]">Select items to include in this replication</div>
            </div>
            <span className="ml-auto text-[11px] font-bold text-brand-mid">{linkedItems.length} selected</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left: search + item list */}
            <div>
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-mid" />
                <input
                  value={itemSearch}
                  onChange={e => setItemSearch(e.target.value)}
                  placeholder="Search items…"
                  className="w-full bg-slate-50  rounded-xl pl-9 pr-3.5 py-2.5 text-[13px] text-brand-darkest outline-none focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/15 transition-all"
                />
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {filteredItems.map(item => (
                  <button
                    key={item}
                    onClick={() => toggleItem(item)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl  bg-brand-bg/40 hover:bg-brand-mid/8 hover:border-brand-mid/25 text-left transition-all"
                  >
                    <span className="text-brand-darkest text-[12px] font-medium">{item}</span>
                    <Plus size={13} className="text-brand-mid shrink-0" />
                  </button>
                ))}
                {filteredItems.length === 0 && (
                  <div className="text-center py-6 text-brand-mid text-[12px]">No more items to add</div>
                )}
              </div>
            </div>

            {/* Right: selected items */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-dark mb-3">
                Selected Items ({linkedItems.length})
              </div>
              {linkedItems.length === 0 ? (
                <div className="rounded-xl  p-8 text-center text-brand-mid text-[12px]">
                  Click items on the left to add them
                </div>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {linkedItems.map((item, idx) => (
                    <div key={item} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/6">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-emerald-500/15 text-emerald-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-brand-darkest text-[12px] font-semibold truncate">{item}</span>
                      </div>
                      <button onClick={() => toggleItem(item)} className="text-red-400 hover:text-red-600 transition-colors shrink-0 ml-2">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button onClick={() => setStep(1)} className="rounded-xl border border-brand-mid/30 px-4 py-2.5 text-[13px] font-semibold text-brand-mid hover:bg-brand-mid/8 transition-colors">
              ← Back
            </button>
            <button
              onClick={() => canProceed2 && setStep(3)}
              disabled={!canProceed2}
              className="rounded-xl bg-gradient-to-br from-brand-dark to-brand-darkest text-brand-light px-5 py-2.5 text-[13px] font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              Continue to Assign <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ══ STEP 3: ASSIGN INSTALLATION IN-CHARGE ══ */}
      {step === 3 && (
        <div className="rounded-2xl  bg-white shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-brand-darkest to-brand-dark flex items-center justify-center shrink-0">
              <User size={15} className="text-brand-light" />
            </div>
            <div>
              <div className="font-display font-bold text-[14px] text-brand-darkest">Assign Installation In-charge</div>
              <div className="text-brand-mid text-[11px]">Choose the engineer who will lead this installation</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {ENGINEERS.map(eng => (
              <button
                key={eng.id}
                onClick={() => setIncharge(eng)}
                className={[
                  "rounded-xl  text-left transition-all",
                  incharge?.id === eng.id
                    ? "border-brand-mid/50 bg-brand-mid/10 ring-2 ring-brand-mid/20"
                    : "border-brand-mid/15 bg-brand-bg/40 hover:border-brand-mid/30 hover:bg-brand-mid/6",
                ].join(" ")}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={[
                    "w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0",
                    incharge?.id === eng.id
                      ? "bg-gradient-to-br from-brand-darkest to-brand-dark text-brand-light"
                      : "bg-brand-mid/15 text-brand-dark",
                  ].join(" ")}>
                    {eng.name.split(" ").map(w => w[0]).join("")}
                  </div>
                  <div className="min-w-0">
                    <div className="text-brand-darkest text-[13px] font-bold truncate">{eng.name}</div>
                    <div className="text-brand-mid text-[10px]">{eng.id}</div>
                  </div>
                </div>
                <div className="text-brand-mid text-[10px]">📍 {eng.site}</div>
                {incharge?.id === eng.id && (
                  <div className="mt-2 flex items-center gap-1 text-emerald-600 text-[10px] font-bold">
                    <CheckCircle size={11} /> Selected
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-dark mb-1.5">
              Notes / Special Instructions
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Any instructions for the installation team…"
              className="w-full bg-slate-50 rounded-xl px-3.5 py-2.5 text-[13px] text-brand-darkest outline-none resize-none placeholder-slate-300 focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/15 transition-all"
            />
          </div>

          {/* Summary */}
          <div className="mb-6 rounded-xl  bg-brand-bg/50 p-4">
            <div className="text-brand-darkest font-bold text-[12px] mb-3">Replication Summary</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ["Source",    sourceProject?.name || "—"],
                ["New",       targetName],
                ["Items",     `${linkedItems.length} linked`],
                ["Lead",      incharge?.name || "Not set"],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-brand-mid text-[10px] font-semibold uppercase tracking-[0.4px]">{k}</div>
                  <div className="text-brand-darkest text-[13px] font-bold mt-0.5 truncate">{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="rounded-xl border border-brand-mid/30 px-4 py-2.5 text-[13px] font-semibold text-brand-mid hover:bg-brand-mid/8 transition-colors">
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!incharge || loading}
              className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white px-5 py-2.5 text-[13px] font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              {loading ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
              ) : (
                <><CheckCircle size={14} /> Create Replication</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}