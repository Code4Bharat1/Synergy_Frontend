"use client";
import { useState } from "react";
import { Send, User, Calendar, MessageSquare, CheckCircle, AlertTriangle, Clock, MapPin, Flag } from "lucide-react";
import { PROJECTS, ENGINEERS } from "./shared";

const PRIORITY_OPTS = [
  { value: "Low",      label: "Low",      color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/25", dot: "bg-emerald-400" },
  { value: "Medium",   label: "Medium",   color: "text-orange-500",  bg: "bg-orange-500/10",  border: "border-orange-500/25",  dot: "bg-orange-400"  },
  { value: "High",     label: "High",     color: "text-red-500",     bg: "bg-red-500/10",     border: "border-red-500/25",     dot: "bg-red-400"     },
  { value: "Critical", label: "Critical", color: "text-red-800",     bg: "bg-red-900/10",     border: "border-red-900/25",     dot: "bg-red-800"     },
];

const RECENT_REQUESTS = [
  { id: "REQ-094", project: "AquaPark Dubai",    engineer: "Arjun Mehta",  date: "Today",      priority: "High",   status: "Sent"     },
  { id: "REQ-093", project: "Ocean World",       engineer: "Ali Hassan",   date: "Feb 24",     priority: "Medium", status: "Accepted" },
  { id: "REQ-092", project: "WaveCrest Park",    engineer: "Meera Patel",  date: "Feb 22",     priority: "Low",    status: "Pending"  },
];

const reqStatusStyle = {
  Sent:     { bg: "bg-brand-mid/10",   text: "text-brand-mid",   border: "border-brand-mid/25"   },
  Accepted: { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/25" },
  Pending:  { bg: "bg-orange-500/10",  text: "text-orange-500",  border: "border-orange-500/25"  },
};

export default function InstallationRequestPage() {
  const [form, setForm] = useState({
    project:          "",
    engineer:         null,
    priority:         "Medium",
    requestedDate:    "",
    estimatedDays:    "",
    subject:          "",
    message:          "",
    notifyEmail:      true,
    notifyInApp:      true,
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const selectedPriority = PRIORITY_OPTS.find(p => p.value === form.priority);
  const selectedProject  = PROJECTS.find(p => p.id === form.project);

  const canSubmit = form.project && form.engineer && form.subject && form.requestedDate;

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) return (
    <div className="flex flex-col items-center justify-center py-20 animate-fadeUp">
      <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mb-4">
        <Send size={28} className="text-emerald-500" strokeWidth={1.5} />
      </div>
      <h2 className="font-display text-2xl font-extrabold text-brand-darkest mb-2">Request Sent!</h2>
      <p className="text-brand-mid text-[14px] mb-6 text-center max-w-sm">
        Installation request has been sent to <strong>{form.engineer?.name}</strong> for {selectedProject?.name}.
      </p>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 mb-6 space-y-2">
        {[
          ["Project",    selectedProject?.name || "—"],
          ["Engineer",   form.engineer?.name   || "—"],
          ["Priority",   form.priority],
          ["Requested",  form.requestedDate],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[13px]">
            <span className="text-brand-mid">{k}</span>
            <span className="text-brand-darkest font-bold">{v}</span>
          </div>
        ))}
      </div>
      <button
        onClick={() => { setSubmitted(false); setForm({ project:"", engineer:null, priority:"Medium", requestedDate:"", estimatedDays:"", subject:"", message:"", notifyEmail:true, notifyInApp:true }); }}
        className="rounded-xl bg-brand-darkest px-6 py-2.5 text-[13px] font-bold text-brand-light hover:bg-brand-dark transition-colors"
      >Send Another Request</button>
    </div>
  );

  return (
    <div className="animate-fadeUp">
      {/* Header */}
      <div className="mb-7">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[2px] text-brand-mid">Marketing</p>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-darkest">Installation Request</h1>
        <p className="mt-1 text-[13px] text-brand-mid">Send a formal installation request to the assigned engineer in-charge</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">

        {/* ── Request Form ──────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Project + Priority */}
          <div className="rounded-2xl  bg-white shadow-sm p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-brand-darkest to-brand-dark flex items-center justify-center shrink-0">
                <Send size={14} className="text-brand-light" />
              </div>
              <div className="font-display font-bold text-[14px] text-brand-darkest">Request Details</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-dark mb-1.5">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.project}
                  onChange={e => upd("project", e.target.value)}
                  className="w-full bg-slate-50  rounded-xl px-3.5 py-2.5 text-[13px] text-brand-darkest outline-none focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/15 transition-all cursor-pointer"
                >
                  <option value="">Select project</option>
                  {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-dark mb-1.5">
                  Requested Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.requestedDate}
                  onChange={e => upd("requestedDate", e.target.value)}
                  className="w-full bg-slate-50rounded-xl px-3.5 py-2.5 text-[13px] text-brand-darkest outline-none focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/15 transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-dark mb-1.5">
                  Est. Duration (days)
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.estimatedDays}
                  onChange={e => upd("estimatedDays", e.target.value)}
                  placeholder="e.g. 14"
                  className="w-full bg-slate-50 rounded-xl px-3.5 py-2.5 text-[13px] text-brand-darkest outline-none placeholder-slate-300 focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/15 transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-dark mb-1.5">
                  Priority
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {PRIORITY_OPTS.map(p => (
                    <button
                      key={p.value}
                      onClick={() => upd("priority", p.value)}
                      className={[
                        "rounded-lg py-2 text-[11px] font-bold border transition-all",
                        form.priority === p.value ? `${p.bg} ${p.color} ` : "bg-slate-50 text-brand-mid border-brand-mid/15 hover:bg-brand-mid/8",
                      ].join(" ")}
                    >{p.label}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Priority banner */}
            {selectedPriority && form.priority !== "Low" && (
              <div className={`rounded-xl border ${selectedPriority.border} ${selectedPriority.bg} px-3.5 py-2.5 flex items-center gap-2`}>
                <AlertTriangle size={13} className={selectedPriority.color} />
                <span className={`text-[12px] font-semibold ${selectedPriority.color}`}>
                  {form.priority === "Critical"
                    ? "⛔ Critical — Engineer will be notified immediately"
                    : form.priority === "High"
                    ? "⚠ High priority — Prompt response expected"
                    : "Medium priority — Standard processing"}
                </span>
              </div>
            )}
          </div>

          {/* Assign Engineer */}
          <div className="rounded-2xl  bg-white shadow-sm p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-brand-darkest to-brand-dark flex items-center justify-center shrink-0">
                <User size={14} className="text-brand-light" />
              </div>
              <div className="font-display font-bold text-[14px] text-brand-darkest">
                Installation In-charge <span className="text-red-500">*</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ENGINEERS.map(eng => (
                <button
                  key={eng.id}
                  onClick={() => upd("engineer", eng)}
                  className={[
                    "rounded-xl  p-3.5 text-left transition-all",
                    form.engineer?.id === eng.id
                      ? "border-brand-mid/50 bg-brand-mid/10 ring-2 ring-brand-mid/20"
                      : "border-brand-mid/15 bg-brand-bg/40 hover:border-brand-mid/30 hover:bg-brand-mid/6",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className={[
                      "w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0",
                      form.engineer?.id === eng.id
                        ? "bg-gradient-to-br from-brand-darkest to-brand-dark text-brand-light"
                        : "bg-brand-mid/15 text-brand-dark",
                    ].join(" ")}>
                      {eng.name.split(" ").map(w => w[0]).join("")}
                    </div>
                    <div className="min-w-0">
                      <div className="text-brand-darkest text-[12px] font-bold truncate">{eng.name}</div>
                      <div className="text-brand-mid text-[10px]">{eng.id}</div>
                    </div>
                  </div>
                <div className="text-brand-mid text-[10px] mt-1 flex items-center gap-1">
  <MapPin size={12} className="text-brand-mid" />
  {eng.site}
</div>
                  {form.engineer?.id === eng.id && (
                    <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold mt-1.5">
                      <CheckCircle size={10} /> Selected
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="rounded-2xl  bg-white shadow-sm p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-brand-darkest to-brand-dark flex items-center justify-center shrink-0">
                <MessageSquare size={14} className="text-brand-light" />
              </div>
              <div className="font-display font-bold text-[14px] text-brand-darkest">Request Message</div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-dark mb-1.5">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.subject}
                  onChange={e => upd("subject", e.target.value)}
                  placeholder="e.g. Installation kick-off for Wave Pool — AquaPark Dubai"
                  className="w-full bg-slate-50 rounded-xl px-3.5 py-2.5 text-[13px] text-brand-darkest outline-none placeholder-slate-300 focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/15 transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-dark mb-1.5">
                  Message Body
                </label>
                <textarea
                  rows={5}
                  value={form.message}
                  onChange={e => upd("message", e.target.value)}
                  placeholder="Describe the scope of work, special conditions, access requirements, materials on-site…"
                  className="w-full bg-slate-50  rounded-xl px-3.5 py-2.5 text-[13px] text-brand-darkest outline-none resize-none placeholder-slate-300 focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/15 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Notification prefs */}
          <div className="rounded-2xl  bg-white shadow-sm p-5">
            <div className="text-brand-darkest font-bold text-[13px] mb-4">Notification Preferences</div>
            <div className="space-y-3">
              {[
                { key: "notifyEmail", label: "Email notification to engineer", sub: "Sends request via email" },
                { key: "notifyInApp", label: "In-app notification",            sub: "Push alert in Synergy app" },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-2 border-b border-brand-mid/8 last:border-0">
                  <div>
                    <div className="text-brand-darkest text-[13px] font-semibold">{item.label}</div>
                    <div className="text-brand-mid text-[11px]">{item.sub}</div>
                  </div>
                  <button
                    onClick={() => upd(item.key, !form[item.key])}
                    className={[
                      "relative w-10 h-5 rounded-full transition-colors shrink-0",
                      form[item.key] ? "bg-brand-darkest" : "bg-brand-mid/25",
                    ].join(" ")}
                  >
                    <div className={[
                      "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                      form[item.key] ? "left-5" : "left-0.5",
                    ].join(" ")} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="rounded-2xl  bg-gradient-to-br from-brand-bg to-brand-mid/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-brand-darkest font-bold text-[14px]">Send Installation Request</div>
              <div className="text-brand-mid text-[12px] mt-0.5">
                To: {form.engineer?.name || "no engineer selected"} · {selectedProject?.name || "no project"}
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className="rounded-xl bg-gradient-to-br from-brand-dark to-brand-darkest text-brand-light px-5 py-2.5 text-[13px] font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center gap-2 shrink-0"
            >
              {loading
                ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
                : <><Send size={13} /> Send Request</>
              }
            </button>
          </div>
        </div>

        {/* ── Right: recent requests ────────────────────────────────────── */}
        <div>
          <div className="rounded-2xl bg-white shadow-sm p-5 xl:sticky xl:top-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-brand-darkest to-brand-dark flex items-center justify-center shrink-0">
                <Clock size={14} className="text-brand-light" />
              </div>
              <div className="font-display font-bold text-[14px] text-brand-darkest">Recent Requests</div>
            </div>

            <div className="space-y-3">
              {RECENT_REQUESTS.map(req => {
                const s = reqStatusStyle[req.status] || reqStatusStyle.Pending;
                const p = PRIORITY_OPTS.find(x => x.value === req.priority);
                return (
                  <div key={req.id} className="rounded-xl  bg-brand-bg/50 p-3.5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[10px] font-bold text-brand-dark">{req.id}</span>
                        <div className="text-brand-darkest text-[12px] font-bold mt-0.5">{req.project}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text} border ${s.border} whitespace-nowrap`}>
                        {req.status}
                      </span>
                    </div>
                   


<div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-brand-mid">
  <span className="flex items-center gap-1">
    <User size={12} className="shrink-0" />
    {req.engineer}
  </span>

  <span className="flex items-center gap-1">
    <Calendar size={12} className="shrink-0" />
    {req.date}
  </span>

  <span className={`flex items-center gap-1 font-bold ${p?.color || "text-brand-mid"}`}>
    <Flag size={12} className="shrink-0" />
    {req.priority}
  </span>
</div>
                  </div>
                );
              })}
            </div>

            {/* Stats */}
            <div className="mt-5 pt-4 border-t border-brand-mid/10 grid grid-cols-3 gap-2">
              {[
                { label: "Total",    value: 7,  color: "text-brand-darkest" },
                { label: "Accepted", value: 5,  color: "text-emerald-600"   },
                { label: "Pending",  value: 2,  color: "text-orange-500"    },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className={`font-display text-xl font-extrabold ${s.color}`}>{s.value}</div>
                  <div className="text-brand-mid text-[10px] font-semibold mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}