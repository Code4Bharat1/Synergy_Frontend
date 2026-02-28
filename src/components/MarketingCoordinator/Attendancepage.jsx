"use client";
import { useState, useEffect, useRef } from "react";
import {
  UserCheck, Clock, MapPin, Camera,
  CheckCircle, AlertCircle, RefreshCw,
  LogIn, LogOut, FileText, Calendar,
  ChevronRight, Briefcase,
} from "lucide-react";
import { COORDINATOR, PROJECTS } from "./shared";

// ─────────────────────────────────────────────────────────────────────────────
// PUNCH MODAL — same camera + geo pattern as engineer panel
// ─────────────────────────────────────────────────────────────────────────────
function PunchModal({ type = "in", onClose, onSubmit }) {
  const [formData,        setFormData]        = useState({ location: "", notes: "", photo: null });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loadingLoc,      setLoadingLoc]      = useState(true);
  const [currentTime,     setCurrentTime]     = useState(new Date());
  const [isSubmitting,    setIsSubmitting]     = useState(false);
  const [stream,          setStream]          = useState(null);
  const [showCam,         setShowCam]         = useState(true);
  const [camErr,          setCamErr]          = useState(false);
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { fetchLoc(); }, []);
  useEffect(() => { openCam(); return () => stopStream(); }, []);
  useEffect(() => {
    if (stream && videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  const stopStream = () =>
    setStream(prev => { prev?.getTracks().forEach(t => t.stop()); return null; });

  const fetchLoc = () => {
    setLoadingLoc(true);
    if (!navigator.geolocation) {
      setFormData(p => ({ ...p, location: "Geolocation not supported" }));
      setLoadingLoc(false); return;
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCurrentLocation({ lat, lng });
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          setFormData(p => ({ ...p, location: data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
        } catch {
          setFormData(p => ({ ...p, location: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
        }
        setLoadingLoc(false);
      },
      () => { setFormData(p => ({ ...p, location: "Location unavailable" })); setLoadingLoc(false); }
    );
  };

  const openCam = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(s); setCamErr(false);
    } catch { setCamErr(true); setShowCam(false); }
  };

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    ctx.translate(c.width, 0); ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0, c.width, c.height);
    setFormData(p => ({ ...p, photo: c.toDataURL("image/jpeg", 0.9) }));
    setShowCam(false); stopStream();
  };

  const retake = () => {
    setFormData(p => ({ ...p, photo: null }));
    setShowCam(true); openCam();
  };

  const confirm = async () => {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    onSubmit({ ...formData, timestamp: new Date(), coords: currentLocation });
    setIsSubmitting(false);
  };

  const isIn = type === "in";
  const accentBg = isIn
    ? "linear-gradient(135deg, #0F2854, #1C4D8D)"
    : "linear-gradient(135deg, #FF9500, #E07800)";

  return (
    <>
      <style>{`@keyframes pmSpin { to { transform: rotate(360deg); } }`}</style>

      {/* Overlay */}
      <div
        className="fixed inset-0 z-[500] flex items-center justify-end sm:justify-center p-0 sm:p-3"
        style={{ background: "rgba(10,20,48,0.72)", backdropFilter: "blur(6px)" }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Modal */}
        <div className="
          w-full sm:max-w-[360px]
          bg-white flex flex-col
          rounded-t-[22px] sm:rounded-[24px]
          overflow-hidden
          max-h-[96dvh] sm:max-h-[90dvh]
        " style={{ boxShadow: "0 32px 80px rgba(10,20,48,0.45)" }}>

          {/* Header */}
          <div style={{ background: accentBg }}
            className="px-[18px] py-[13px] flex justify-between items-center shrink-0">
            <div>
              <p className="text-[#BDE8F5] text-[14px] font-bold">
                {isIn ? "📍 Punch In" : "🏁 Punch Out"}
              </p>
              <p className="text-[rgba(189,232,245,0.6)] text-[11px] mt-0.5">
                {currentTime.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                &nbsp;·&nbsp;
                {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[15px] border-none cursor-pointer shrink-0"
              style={{ background: "rgba(189,232,245,0.15)", color: "#BDE8F5" }}
            >✕</button>
          </div>

          {/* Camera / Photo area */}
          <div className="relative bg-black overflow-hidden shrink-0"
            style={{ aspectRatio: "3/4" }}>

            {showCam && !camErr ? (
              <video ref={videoRef} autoPlay playsInline muted
                className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
            ) : formData.photo ? (
              <img src={formData.photo} alt="selfie" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#111] p-6">
                <span className="text-[38px]">📷</span>
                <p className="text-[#BDE8F5] text-[13px] text-center m-0 leading-relaxed">
                  Camera access denied.<br />Please allow camera to continue.
                </p>
                <button onClick={openCam}
                  className="bg-[#1C4D8D] text-[#BDE8F5] border-none px-[18px] py-2 rounded-lg text-[12px] cursor-pointer">
                  Retry Camera
                </button>
              </div>
            )}

            {/* Location badge */}
            <div className="absolute top-2.5 left-2.5 right-2.5 rounded-[11px] px-[11px] py-[7px] flex items-start gap-[7px]"
              style={{ background: "rgba(10,20,48,0.65)", backdropFilter: "blur(8px)" }}>
              <span className="text-[13px] shrink-0 mt-0.5">📍</span>
              <div className="flex-1 min-w-0">
                {loadingLoc ? (
                  <p className="text-white/70 text-[10px] flex items-center gap-1 m-0">
                    <span style={{ animation: "pmSpin 1s linear infinite", display: "inline-block" }}>⟳</span>
                    Detecting location…
                  </p>
                ) : (
                  <p className="text-white text-[10px] leading-snug m-0 line-clamp-2">{formData.location}</p>
                )}
              </div>
              <button onClick={fetchLoc}
                className="text-[14px] cursor-pointer shrink-0 p-0 border-none bg-transparent"
                style={{ color: "rgba(189,232,245,0.7)" }}>↺</button>
            </div>

            {/* Bottom actions */}
            <div className="absolute bottom-0 left-0 right-0 px-[18px] pb-[22px] pt-[18px]"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)" }}>

              {showCam && !camErr ? (
                <div className="flex items-center justify-between">
                  <button onClick={onClose}
                    className="text-white/70 text-[12px] cursor-pointer bg-transparent border-none py-1.5 px-1">
                    Cancel
                  </button>
                  {/* Shutter */}
                  <button onClick={capture}
                    className="w-[66px] h-[66px] rounded-full bg-white border-none cursor-pointer flex items-center justify-center"
                    style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
                    <div className="w-[54px] h-[54px] rounded-full flex items-center justify-center text-[22px]"
                      style={{ background: "linear-gradient(135deg,#4988C4,#0F2854)" }}>📷</div>
                  </button>
                  <div className="w-14" />
                </div>
              ) : formData.photo ? (
                <div className="flex gap-2.5">
                  <button onClick={retake}
                    className="flex-1 py-[11px] rounded-[11px] text-[13px] font-bold text-white cursor-pointer border"
                    style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", borderColor: "rgba(255,255,255,0.25)" }}>
                    ↩ Retake
                  </button>
                  <button onClick={confirm} disabled={isSubmitting}
                    className="flex-1 py-[11px] rounded-[11px] text-[13px] font-bold text-white cursor-pointer border-none flex items-center justify-center gap-1.5"
                    style={{ background: isSubmitting ? "rgba(73,136,196,0.7)" : accentBg }}>
                    {isSubmitting
                      ? <><span style={{ animation: "pmSpin 0.8s linear infinite", display: "inline-block" }}>⟳</span>Saving…</>
                      : <><span>✓</span>Confirm {isIn ? "Punch In" : "Punch Out"}</>
                    }
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {/* Notes */}
          {!showCam && formData.photo && (
            <div className="px-4 py-3 border-t border-[rgba(73,136,196,0.12)] shrink-0">
              <p className="text-[#1C4D8D] text-[10px] font-semibold tracking-[0.5px] uppercase mb-1.5">
                Notes (Optional)
              </p>
              <textarea rows={2}
                className="w-full border border-[rgba(73,136,196,0.25)] rounded-[9px] px-[11px] py-2 text-[12px] text-[#0F2854] resize-none outline-none bg-[rgba(189,232,245,0.06)] box-border"
                style={{ fontFamily: "inherit" }}
                placeholder="Add any notes for this attendance record…"
                value={formData.notes}
                onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE HISTORY (mock)
// ─────────────────────────────────────────────────────────────────────────────
const HISTORY = [
  { date: "Fri, 28 Feb",  in: "09:02 AM", out: "06:18 PM", hrs: "9h 16m", status: "Present",  project: "AquaPark Dubai"     },
  { date: "Thu, 27 Feb",  in: "08:55 AM", out: "05:45 PM", hrs: "8h 50m", status: "Present",  project: "Ocean World"         },
  { date: "Wed, 26 Feb",  in: "09:30 AM", out: "06:00 PM", hrs: "8h 30m", status: "Present",  project: "WaveCrest Park"      },
  { date: "Tue, 25 Feb",  in: "—",        out: "—",        hrs: "—",      status: "Leave",    project: "—"                   },
  { date: "Mon, 24 Feb",  in: "09:05 AM", out: "06:30 PM", hrs: "9h 25m", status: "Present",  project: "Blue Lagoon Resort"  },
];

const statusPill = {
  Present: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Leave:   "bg-amber-500/10  text-amber-500  border-amber-500/20",
  Absent:  "bg-red-500/10    text-red-500    border-red-500/20",
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const [showModal,   setShowModal]   = useState(false);
  const [punchType,   setPunchType]   = useState("in");
  const [punchIn,     setPunchIn]     = useState(null);
  const [punchOut,    setPunchOut]    = useState(null);
  const [activeProj,  setActiveProj]  = useState("");
  const [workNotes,   setWorkNotes]   = useState("");
  const [submitted,   setSubmitted]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);

  const punched    = !!punchIn;
  const punchedOut = !!punchOut;

  const openIn  = () => { setPunchType("in");  setShowModal(true); };
  const openOut = () => { setPunchType("out"); setShowModal(true); };

  const handlePunch = (data) => {
    if (punchType === "in") setPunchIn(data);
    else                    setPunchOut(data);
    setShowModal(false);
  };

  const fmt = d =>
    d ? new Date(d.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—";

  const calcDuration = () => {
    if (!punchIn || !punchOut) return null;
    const diff = new Date(punchOut.timestamp) - new Date(punchIn.timestamp);
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1400));
    setSubmitting(false);
    setSubmitted(true);
  };

  const reset = () => {
    setPunchIn(null); setPunchOut(null);
    setActiveProj(""); setWorkNotes(""); setSubmitted(false);
  };

  // ── Stats strip ──
  const stats = [
    { label: "This Month",    value: "21",   sub: "Days present",   color: "text-sky",          icon: Calendar     },
    { label: "Avg Hours",     value: "8.9h", sub: "Per working day", color: "text-emerald-500",  icon: Clock        },
    { label: "Leave Taken",   value: "2",    sub: "Days this month", color: "text-amber-500",    icon: Briefcase    },
    { label: "On Time Rate",  value: "94%",  sub: "Before 9:30 AM",  color: "text-[#4988C4]",    icon: CheckCircle  },
  ];

  return (
    <div className="animate-[fadeUp_0.35s_ease_both] max-w-[1100px] mx-auto">

      {/* ── Header ── */}
      <div className="mb-6">
        <p className="text-[11px] font-bold tracking-[2px] uppercase text-[#4988C4] mb-1">
          Marketing Coordinator
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F2854]">
          Attendance
        </h1>
        <p className="text-[#4988C4] text-[13px] mt-1">{today}</p>
      </div>

      {/* ════════════ STATS STRIP ════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {stats.map((s, i) => (
          <div key={i}
            className="rounded-2xl border border-[rgba(73,136,196,0.15)] bg-white shadow-[0_2px_12px_rgba(15,40,84,0.06)] p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(15,40,84,0.13)] transition-all duration-200">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#4988C4]/80 leading-tight">
                {s.label}
              </p>
              <div className="w-7 h-7 rounded-lg bg-[rgba(73,136,196,0.08)] flex items-center justify-center shrink-0">
                <s.icon size={13} className={s.color} />
              </div>
            </div>
            <p className={`font-display text-3xl sm:text-[32px] font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-[#4988C4] text-[10px] mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ════════════ MAIN GRID ════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

        {/* ── LEFT: Today's Attendance ── */}
        <div className="space-y-4">

          {/* Punch Card */}
          <div className="rounded-2xl border border-[rgba(73,136,196,0.15)] bg-white shadow-[0_2px_12px_rgba(15,40,84,0.06)] p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#0F2854] to-[#1C4D8D] flex items-center justify-center shrink-0">
                <UserCheck size={15} className="text-[#BDE8F5]" />
              </div>
              <div>
                <p className="font-display font-bold text-[15px] text-[#0F2854]">Today's Attendance</p>
                <p className="text-[#4988C4] text-[11px]">Punch in/out with camera &amp; geo-location</p>
              </div>
            </div>

            {/* Status banner */}
            <div className={`rounded-xl px-4 py-3.5 mb-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              !punched
                ? "bg-[rgba(73,136,196,0.04)] border-[rgba(73,136,196,0.15)]"
                : punchedOut
                ? "bg-emerald-500/5 border-emerald-500/20"
                : "bg-[rgba(52,199,89,0.04)] border-[rgba(52,199,89,0.25)]"
            }`}>
              <div className="flex-1 min-w-0">
                <p className="text-[#0F2854] font-bold text-[14px] mb-2">
                  {!punched
                    ? "📍 Not Yet Punched In"
                    : punchedOut
                    ? "🏁 Session Complete"
                    : "✅ Actively Working"}
                </p>

                {!punched && (
                  <p className="text-[#4988C4] text-[12px]">
                    Tap Punch In to record your attendance with selfie + location.
                  </p>
                )}

                {punched && (
                  <div className="flex flex-wrap gap-x-5 gap-y-3">
                    {/* In card */}
                    <div className="flex items-center gap-2.5">
                      {punchIn.photo && (
                        <img src={punchIn.photo} alt="in"
                          className="w-11 h-11 rounded-[9px] object-cover border-2 border-emerald-500/50 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-emerald-500 text-[10px] font-bold mb-0.5">PUNCH IN</p>
                        <p className="text-[#0F2854] text-[14px] font-bold">{fmt(punchIn)}</p>
                        <p className="text-[#4988C4] text-[10px] truncate max-w-[160px]">
                          📍 {punchIn.location || "Location captured"}
                        </p>
                      </div>
                    </div>

                    {/* Out card */}
                    {punchedOut && (
                      <>
                        <div className="text-[#4988C4] text-[12px] self-center font-bold hidden sm:block">→</div>
                        <div className="flex items-center gap-2.5">
                          {punchOut.photo && (
                            <img src={punchOut.photo} alt="out"
                              className="w-11 h-11 rounded-[9px] object-cover border-2 border-[#4988C4]/50 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-[#4988C4] text-[10px] font-bold mb-0.5">PUNCH OUT</p>
                            <p className="text-[#0F2854] text-[14px] font-bold">{fmt(punchOut)}</p>
                            <p className="text-[#4988C4] text-[10px] truncate max-w-[160px]">
                              📍 {punchOut.location || "Location captured"}
                            </p>
                          </div>
                        </div>
                        {calcDuration() && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[rgba(73,136,196,0.08)] border border-[rgba(73,136,196,0.15)] self-start">
                            <Clock size={12} className="text-[#4988C4]" />
                            <span className="text-[#0F2854] text-[13px] font-bold">{calcDuration()}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2.5 flex-wrap sm:flex-nowrap sm:flex-col shrink-0">
                {!punched && (
                  <button onClick={openIn}
                    className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold text-[#BDE8F5] border-none cursor-pointer flex-1 sm:flex-none justify-center"
                    style={{ background: "linear-gradient(135deg,#0F2854,#1C4D8D)" }}>
                    <LogIn size={14} /> Punch In
                  </button>
                )}
                {punched && !punchedOut && (
                  <button onClick={openOut}
                    className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold text-white border-none cursor-pointer flex-1 sm:flex-none justify-center"
                    style={{ background: "linear-gradient(135deg,#FF9500,#E07800)" }}>
                    <LogOut size={14} /> Punch Out
                  </button>
                )}
              </div>
            </div>

            {/* Warning if not punched */}
            {!punched && (
              <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 mb-5 bg-amber-500/7 border border-amber-500/25">
                <AlertCircle size={14} className="text-amber-500 shrink-0" />
                <p className="text-amber-500 text-[12px] font-medium m-0">
                  Please punch in to log your attendance for today.
                </p>
              </div>
            )}

            {/* Active Project */}
            <div className="mb-4">
              <label className="block text-[10.5px] font-bold uppercase tracking-[0.6px] text-[#1C4D8D] mb-1.5">
                Active Project Today
              </label>
              <select
                value={activeProj}
                onChange={e => setActiveProj(e.target.value)}
                className="w-full bg-slate-50 border border-[rgba(73,136,196,0.25)] rounded-xl px-3.5 py-2.5 text-[13px] text-[#0F2854] outline-none cursor-pointer focus:border-[#4988C4] focus:ring-2 focus:ring-[rgba(73,136,196,0.15)] transition-all"
                style={{ fontFamily: "inherit" }}
              >
                <option value="">Select project you're working on</option>
                {PROJECTS.map(p => (
                  <option key={p.id} value={p.id}>{p.id} — {p.name}</option>
                ))}
              </select>
            </div>

            {/* Work Notes */}
            <div className="mb-5">
              <label className="block text-[10.5px] font-bold uppercase tracking-[0.6px] text-[#1C4D8D] mb-1.5">
                Work Summary / Notes
              </label>
              <textarea
                rows={3}
                value={workNotes}
                onChange={e => setWorkNotes(e.target.value)}
                placeholder="Brief summary of today's work activities…"
                className="w-full bg-slate-50 border border-[rgba(73,136,196,0.25)] rounded-xl px-3.5 py-2.5 text-[13px] text-[#0F2854] outline-none resize-none focus:border-[#4988C4] focus:ring-2 focus:ring-[rgba(73,136,196,0.15)] transition-all"
                style={{ fontFamily: "inherit" }}
              />
            </div>

            {/* Submit */}
            {!submitted ? (
              <button
                onClick={handleSubmit}
                disabled={!punched || submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-bold text-white border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg,#34C759,#2EA44F)", fontFamily: "inherit" }}
              >
                {submitting
                  ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</>
                  : <><CheckCircle size={14} />Submit Attendance</>
                }
              </button>
            ) : (
              <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/25 px-4 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-emerald-600 font-bold text-[13px] m-0">Attendance Submitted!</p>
                    <p className="text-[#4988C4] text-[11px] m-0">
                      {fmt(punchIn)} – {fmt(punchOut)} · {calcDuration() || "—"}
                    </p>
                  </div>
                </div>
                <button onClick={reset}
                  className="text-[11px] font-semibold text-[#4988C4] border border-[rgba(73,136,196,0.25)] rounded-lg px-3 py-1.5 cursor-pointer hover:bg-[rgba(73,136,196,0.08)] transition-colors bg-transparent whitespace-nowrap"
                  style={{ fontFamily: "inherit" }}>
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* ── Attendance History ── */}
          <div className="rounded-2xl border border-[rgba(73,136,196,0.15)] bg-white shadow-[0_2px_12px_rgba(15,40,84,0.06)] overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-[rgba(73,136,196,0.1)] flex items-center gap-3">
              <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-[#0F2854] to-[#1C4D8D] flex items-center justify-center shrink-0">
                <Calendar size={14} className="text-[#BDE8F5]" />
              </div>
              <div>
                <p className="font-display font-bold text-[14px] text-[#0F2854]">Recent Attendance</p>
                <p className="text-[#4988C4] text-[11px]">Last 5 working days</p>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="bg-[rgba(189,232,245,0.18)]">
                    {["Date", "Punch In", "Punch Out", "Hours", "Project", "Status"].map(h => (
                      <th key={h}
                        className="px-4 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-[0.5px] text-[#1C4D8D]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HISTORY.map((row, i) => (
                    <tr key={i} className="border-t border-[rgba(73,136,196,0.08)] hover:bg-[rgba(189,232,245,0.06)] transition-colors">
                      <td className="px-4 py-3 text-[#0F2854] font-semibold text-[12px] whitespace-nowrap">{row.date}</td>
                      <td className="px-4 py-3 text-[#1C4D8D] font-bold text-[12px]">{row.in}</td>
                      <td className="px-4 py-3 text-[#1C4D8D] font-bold text-[12px]">{row.out}</td>
                      <td className="px-4 py-3 text-[#0F2854] font-bold text-[12px]">{row.hrs}</td>
                      <td className="px-4 py-3 text-[#4988C4] text-[11px] max-w-[140px] truncate">{row.project}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusPill[row.status] || statusPill.Present}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-[rgba(73,136,196,0.08)]">
              {HISTORY.map((row, i) => (
                <div key={i} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-[#0F2854] font-bold text-[13px] mb-0.5">{row.date}</p>
                      <p className="text-[#4988C4] text-[11px]">{row.project}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${statusPill[row.status] || statusPill.Present}`}>
                      {row.status}
                    </span>
                  </div>
                  <div className="flex gap-4 text-[12px]">
                    <div>
                      <p className="text-[#4988C4] text-[9px] font-bold uppercase tracking-[0.4px] mb-0.5">In</p>
                      <p className="text-[#1C4D8D] font-bold">{row.in}</p>
                    </div>
                    <div>
                      <p className="text-[#4988C4] text-[9px] font-bold uppercase tracking-[0.4px] mb-0.5">Out</p>
                      <p className="text-[#1C4D8D] font-bold">{row.out}</p>
                    </div>
                    <div>
                      <p className="text-[#4988C4] text-[9px] font-bold uppercase tracking-[0.4px] mb-0.5">Hours</p>
                      <p className="text-[#0F2854] font-bold">{row.hrs}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Info panel ── */}
        <div className="space-y-4">

          {/* Today Summary Card */}
          <div className="rounded-2xl border border-[rgba(73,136,196,0.15)] bg-white shadow-[0_2px_12px_rgba(15,40,84,0.06)] p-5 lg:sticky lg:top-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-[#0F2854] to-[#1C4D8D] flex items-center justify-center shrink-0">
                <FileText size={13} className="text-[#BDE8F5]" />
              </div>
              <p className="font-display font-bold text-[14px] text-[#0F2854]">Today's Summary</p>
            </div>

            <div className="space-y-3">
              {[
                { k: "Employee",  v: COORDINATOR.name,   icon: "👤" },
                { k: "ID",        v: COORDINATOR.id,     icon: "🪪" },
                { k: "Role",      v: COORDINATOR.role,   icon: "💼" },
                { k: "Date",      v: new Date().toLocaleDateString("en-GB"), icon: "📅" },
                { k: "Punch In",  v: fmt(punchIn),       icon: "🟢" },
                { k: "Punch Out", v: fmt(punchOut),      icon: "🔴" },
                { k: "Duration",  v: calcDuration() || "—", icon: "⏱" },
                { k: "Project",   v: PROJECTS.find(p => p.id === activeProj)?.name || "Not set", icon: "📁" },
              ].map(({ k, v, icon }) => (
                <div key={k}
                  className="flex items-center justify-between gap-3 py-2 border-b border-[rgba(73,136,196,0.07)] last:border-0">
                  <div className="flex items-center gap-2 text-[#4988C4] text-[12px]">
                    <span className="text-[11px]">{icon}</span>
                    {k}
                  </div>
                  <span className="text-[#0F2854] text-[12px] font-bold text-right truncate max-w-[120px]">{v}</span>
                </div>
              ))}
            </div>

            {/* Visual punch status */}
            <div className="mt-5 pt-4 border-t border-[rgba(73,136,196,0.1)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#4988C4]/70 mb-3">Status</p>
              <div className="flex items-center gap-2">
                {/* In dot */}
                <div className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border transition-all ${
                  punched ? "bg-emerald-500/8 border-emerald-500/25" : "bg-[rgba(73,136,196,0.04)] border-[rgba(73,136,196,0.12)]"
                }`}>
                  <LogIn size={16} className={punched ? "text-emerald-500" : "text-[#4988C4]/30"} />
                  <span className={`text-[10px] font-bold ${punched ? "text-emerald-600" : "text-[#4988C4]/40"}`}>
                    {punched ? fmt(punchIn) : "—"}
                  </span>
                  <span className="text-[9px] text-[#4988C4]/60">IN</span>
                </div>

                {/* Arrow */}
                <ChevronRight size={14} className="text-[rgba(73,136,196,0.3)] shrink-0" />

                {/* Out dot */}
                <div className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border transition-all ${
                  punchedOut ? "bg-[rgba(73,136,196,0.08)] border-[rgba(73,136,196,0.25)]" : "bg-[rgba(73,136,196,0.04)] border-[rgba(73,136,196,0.12)]"
                }`}>
                  <LogOut size={16} className={punchedOut ? "text-[#4988C4]" : "text-[#4988C4]/30"} />
                  <span className={`text-[10px] font-bold ${punchedOut ? "text-[#1C4D8D]" : "text-[#4988C4]/40"}`}>
                    {punchedOut ? fmt(punchOut) : "—"}
                  </span>
                  <span className="text-[9px] text-[#4988C4]/60">OUT</span>
                </div>
              </div>

              {/* Duration bar */}
              {punched && punchedOut && (
                <div className="mt-3 flex items-center gap-2">
                  <Clock size={11} className="text-[#4988C4] shrink-0" />
                  <div className="flex-1 h-1.5 bg-[rgba(73,136,196,0.12)] rounded-full overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-[#4988C4] rounded-full"
                      style={{ width: `${Math.min(100, ((new Date(punchOut.timestamp) - new Date(punchIn.timestamp)) / (9 * 3600000)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[#0F2854] text-[11px] font-bold whitespace-nowrap shrink-0">
                    {calcDuration()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Policy reminder */}
          <div className="rounded-2xl border border-[rgba(73,136,196,0.15)] bg-[rgba(189,232,245,0.08)] p-4">
            <p className="text-[#0F2854] font-bold text-[12px] mb-3 flex items-center gap-2">
              <AlertCircle size={13} className="text-[#4988C4]" /> Attendance Policy
            </p>
            <div className="space-y-1.5">
              {[
                "Office hours: 9:00 AM – 6:00 PM",
                "Grace period: 30 minutes",
                "Selfie + location required for both punches",
                "Submit attendance before 7:00 PM",
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-[rgba(73,136,196,0.5)] mt-1.5 shrink-0" />
                  <p className="text-[#4988C4] text-[11px] leading-snug m-0">{t}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Punch Modal */}
      {showModal && (
        <PunchModal
          type={punchType}
          onClose={() => setShowModal(false)}
          onSubmit={handlePunch}
        />
      )}
    </div>
  );
}