"use client";

import { useState, useEffect, useRef } from "react";

// ── Color tokens ──────────────────────────────────────────────────────────
const C = {
  darkBlue:  "#0F2854",
  blue:      "#1C4D8D",
  medBlue:   "#4988C4",
  lightBlue: "#BDE8F5",
  bg:        "#f0f6fb",
  mutedText: "#6b89a5",
  dimText:   "#8fa3b8",
  white:     "#ffffff",
  divider:   "#e3eff8",
  green:     "#34C759",
  orange:    "#E07800",
};

// ── Icons ─────────────────────────────────────────────────────────────────
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 flex-shrink-0">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const MapPinIcon = ({ cls = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={`${cls} flex-shrink-0`}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const CameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 flex-shrink-0">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 flex-shrink-0">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// ── Live Clock ────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-center py-1">
      <div
        className="font-bold tabular-nums tracking-tight leading-none"
        style={{ color: C.darkBlue, fontSize: "clamp(26px, 7vw, 46px)" }}
      >
        {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </div>
      <div className="text-xs font-semibold mt-1.5" style={{ color: C.mutedText }}>
        {time.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </div>
    </div>
  );
}

// ── Camera Modal (bottom sheet on mobile, centered on desktop) ────────────
function CameraModal({ type, onClose, onSubmit }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [photo,     setPhoto]     = useState(null);
  const [location,  setLocation]  = useState("Fetching location…");
  const [locCoords, setLocCoords] = useState(null);
  const [camError,  setCamError]  = useState(false);
  const [step,      setStep]      = useState("capture");

  useEffect(() => {
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setCamError(true));

    navigator.geolocation?.getCurrentPosition(
      pos => {
        setLocCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocation(`${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`);
      },
      () => setLocation("Location unavailable"),
    );

    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const takePhoto = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d").drawImage(video, 0, 0);
    setPhoto(canvas.toDataURL("image/jpeg", 0.85));
    streamRef.current?.getTracks().forEach(t => t.stop());
    setStep("confirm");
  };

  const retake = () => {
    setPhoto(null);
    setStep("capture");
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
  };

  const confirm = () =>
    onSubmit({ photo, location, locCoords, timestamp: new Date().toISOString() });

  const isIn     = type === "in";
  const accentBg = isIn ? C.darkBlue : C.orange;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: "rgba(15,40,84,0.6)", backdropFilter: "blur(6px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:w-auto sm:min-w-80 rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: C.white, maxHeight: "95dvh" }}
      >
        {/* Drag handle – mobile only */}
        <div className="flex justify-center pt-2.5 pb-0.5 sm:hidden">
          <div className="w-9 h-1 rounded-full" style={{ backgroundColor: C.divider }} />
        </div>

        {/* Header */}
        <div
          className="px-5 py-3.5 flex items-center justify-between"
          style={{ backgroundColor: accentBg }}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white opacity-70">
              {isIn ? "Punch In" : "Punch Out"}
            </p>
            <h3 className="text-sm font-bold text-white mt-0.5">
              {step === "capture" ? "Take a Selfie" : "Confirm Photo"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm transition-opacity"
            style={{ backgroundColor: "rgba(255,255,255,0.18)", opacity: 0.8 }}
          >
            ✕
          </button>
        </div>

        {/* Camera / Preview — square on mobile, 4:3 on sm+ */}
        <div
          className="relative bg-black w-full"
          style={{ aspectRatio: "1 / 1", maxHeight: "56vw" }}
        >
          {camError ? (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              style={{ backgroundColor: C.bg }}
            >
              <span style={{ color: C.medBlue }}><CameraIcon /></span>
              <p className="text-xs font-semibold" style={{ color: C.mutedText }}>Camera access denied</p>
              <p className="text-[11px] text-center px-8" style={{ color: C.dimText }}>
                Allow camera access in your browser settings and try again.
              </p>
            </div>
          ) : step === "capture" ? (
            <video
              ref={videoRef} autoPlay playsInline muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
          ) : (
            <img
              src={photo} alt="selfie"
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
          )}
          <canvas ref={canvasRef} className="hidden" />

          {step === "capture" && !camError && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="border-2 border-white rounded-full"
                style={{ width: "42%", aspectRatio: "3/4", opacity: 0.45 }}
              />
            </div>
          )}
          {step === "confirm" && (
            <div
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: C.green }}
            >
              <CheckIcon />
            </div>
          )}
        </div>

        {/* Location strip */}
        <div
          className="px-4 py-2.5 flex items-center gap-2"
          style={{ backgroundColor: C.bg, borderBottom: `1px solid ${C.divider}` }}
        >
          <span style={{ color: C.medBlue }}><MapPinIcon /></span>
          <span className="text-xs font-medium truncate" style={{ color: C.mutedText }}>{location}</span>
        </div>

        {/* Actions */}
        <div className="px-4 py-4 flex gap-3">
          {step === "capture" ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border"
                style={{ borderColor: C.divider, color: C.mutedText, backgroundColor: C.white }}
              >
                Cancel
              </button>
              <button
                onClick={takePhoto}
                disabled={camError}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ backgroundColor: accentBg }}
              >
                📷 Capture
              </button>
            </>
          ) : (
            <>
              <button
                onClick={retake}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border"
                style={{ borderColor: C.divider, color: C.mutedText, backgroundColor: C.white }}
              >
                Retake
              </button>
              <button
                onClick={confirm}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: accentBg }}
              >
                ✓ Confirm
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Ic, barColor, valueColor }) {
  return (
    <div
      className="relative bg-white rounded-xl overflow-hidden shadow-sm flex flex-col gap-1.5"
      style={{ border: `1px solid ${C.lightBlue}`, padding: "10px 12px 12px" }}
    >
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: barColor }} />
      <div className="flex items-center gap-1.5">
        <span style={{ color: barColor }}><Ic /></span>
        <span
          className="font-semibold uppercase tracking-wider leading-tight"
          style={{ color: C.dimText, fontSize: "clamp(9px, 2.5vw, 11px)" }}
        >
          {label}
        </span>
      </div>
      <div
        className="font-bold leading-tight truncate"
        style={{ color: valueColor || C.darkBlue, fontSize: "clamp(15px, 4.5vw, 22px)" }}
      >
        {value}
      </div>
    </div>
  );
}

// ── Desktop Log Row ───────────────────────────────────────────────────────
function LogRow({ entry, idx }) {
  const [hov, setHov] = useState(false);
  const dur = () => {
    if (!entry.out) return "Ongoing";
    const ms = new Date(entry.out.timestamp) - new Date(entry.in.timestamp);
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  };
  const fmt = d =>
    d ? new Date(d.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <tr
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        backgroundColor: hov ? C.bg : "transparent",
        borderBottom: `1px solid ${C.divider}`,
        transition: "background 0.15s",
      }}
    >
      <td className="px-4 py-3 text-sm font-semibold" style={{ color: C.blue }}>
        {String(idx + 1).padStart(2, "0")}
      </td>
      <td className="px-4 py-3 text-sm font-medium whitespace-nowrap" style={{ color: C.darkBlue }}>
        {fmt(entry.in)}
      </td>
      <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: C.darkBlue }}>
        {entry.out
          ? fmt(entry.out)
          : <span className="text-xs font-bold" style={{ color: C.orange }}>Active</span>}
      </td>
      <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: C.mutedText }}>{dur()}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
          style={entry.out
            ? { backgroundColor: C.lightBlue, color: C.darkBlue }
            : { backgroundColor: "#fff3e0", color: C.orange }}
        >
          {entry.out ? "Completed" : "In Progress"}
        </span>
      </td>
      <td className="px-4 py-3 text-xs" style={{ color: C.dimText, maxWidth: 160 }}>
        <span className="block truncate">{entry.in?.location || "—"}</span>
      </td>
    </tr>
  );
}

// ── Mobile Log Card ───────────────────────────────────────────────────────
function MobileLogCard({ entry, idx }) {
  const dur = () => {
    if (!entry.out) return "Ongoing";
    const ms = new Date(entry.out.timestamp) - new Date(entry.in.timestamp);
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  };
  const fmt = d =>
    d ? new Date(d.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div
      className="px-4 py-3 flex items-start gap-3"
      style={{ borderBottom: `1px solid ${C.divider}` }}
    >
      {/* Index bubble */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
        style={{ backgroundColor: C.bg, color: C.blue }}
      >
        {String(idx + 1).padStart(2, "0")}
      </div>

      {/* Times + location */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.green }}>IN</span>
            <span className="text-sm font-semibold" style={{ color: C.darkBlue }}>{fmt(entry.in)}</span>
          </div>
          {entry.out && (
            <>
              <span style={{ color: C.dimText }}>→</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.orange }}>OUT</span>
                <span className="text-sm font-semibold" style={{ color: C.darkBlue }}>{fmt(entry.out)}</span>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-xs" style={{ color: C.mutedText }}>{dur()}</span>
          {entry.in?.location && (
            <>
              <span className="text-xs" style={{ color: C.divider }}>·</span>
              <div className="flex items-center gap-1 min-w-0">
                <MapPinIcon cls="w-3 h-3" />
                <span className="text-xs truncate" style={{ color: C.dimText, maxWidth: 160 }}>
                  {entry.in.location}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Badge */}
      <span
        className="text-[11px] font-semibold px-2 py-0.5 rounded flex-shrink-0 mt-0.5"
        style={entry.out
          ? { backgroundColor: C.lightBlue, color: C.darkBlue }
          : { backgroundColor: "#fff3e0", color: C.orange }}
      >
        {entry.out ? "Done" : "Active"}
      </span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const [modal,     setModal]     = useState(null);
  const [sessions,  setSessions]  = useState([]);
  const [animPulse, setAnimPulse] = useState(false);

  const activeSession = sessions.find(s => !s.out) || null;
  const isPunchedIn   = !!activeSession;
  const totalSessions = sessions.length;
  const totalHours    = sessions
    .reduce((acc, s) => {
      if (!s.out) return acc;
      return acc + (new Date(s.out.timestamp) - new Date(s.in.timestamp)) / 3600000;
    }, 0)
    .toFixed(1);

  const handlePunch = data => {
    if (modal === "in") {
      setSessions(prev => [...prev, { in: data, out: null }]);
    } else {
      setSessions(prev => prev.map(s => (!s.out ? { ...s, out: data } : s)));
    }
    setModal(null);
    setAnimPulse(true);
    setTimeout(() => setAnimPulse(false), 700);
  };

  const fmt = d =>
    d ? new Date(d.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";

  const today = new Date().toLocaleDateString("en-US", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      <main className="p-3 sm:p-4 md:p-5 space-y-4 max-w-2xl mx-auto">

        {/* Page heading */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.medBlue }}>
            {today} · Field Attendance
          </p>
          <h1 className="text-xl font-bold mt-0.5" style={{ color: C.darkBlue }}>Attendance</h1>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <StatCard label="Sessions" value={String(totalSessions)} icon={CalendarIcon} barColor={C.darkBlue} />
          <StatCard label="Hours"    value={`${totalHours}h`}      icon={ClockIcon}    barColor={C.blue} />
          <StatCard
            label="Status"
            value={isPunchedIn ? "On-Site" : "Off-Site"}
            icon={UserIcon}
            barColor={isPunchedIn ? C.green : C.medBlue}
            valueColor={isPunchedIn ? C.green : C.darkBlue}
          />
        </div>

        {/* Punch card */}
        <div
          className="bg-white rounded-xl shadow-sm overflow-hidden"
          style={{
            border: `1px solid ${isPunchedIn ? "rgba(52,199,89,0.35)" : C.lightBlue}`,
            transition: "border-color 0.4s",
          }}
        >
          <div
            className="h-[3px]"
            style={{
              backgroundColor: isPunchedIn ? C.green : C.darkBlue,
              transition: "background-color 0.4s",
            }}
          />

          <div className="p-4 sm:p-6">
            <LiveClock />

            <div className="my-4" style={{ borderTop: `1px solid ${C.divider}` }} />

            {/* Active session info */}
            {isPunchedIn && (
              <div
                className="mb-4 p-3 rounded-xl flex flex-wrap items-center gap-3"
                style={{
                  backgroundColor: "rgba(52,199,89,0.05)",
                  border: "1px solid rgba(52,199,89,0.2)",
                }}
              >
                {activeSession.in.photo && (
                  <img
                    src={activeSession.in.photo}
                    alt="selfie"
                    className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                    style={{ border: "2px solid rgba(52,199,89,0.4)", transform: "scaleX(-1)" }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.green }}>
                      ● Punched In
                    </span>
                    <span className="text-sm font-bold" style={{ color: C.darkBlue }}>
                      {fmt(activeSession.in)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5" style={{ color: C.mutedText }}>
                    <MapPinIcon cls="w-3 h-3" />
                    <span className="text-xs truncate">{activeSession.in.location}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              {!isPunchedIn ? (
                <button
                  onClick={() => setModal("in")}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  style={{ background: `linear-gradient(135deg, ${C.darkBlue}, ${C.blue})` }}
                >
                  📍 Punch In
                </button>
              ) : (
                <>
                  <div
                    className="flex-1 py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
                    style={{
                      backgroundColor: "rgba(52,199,89,0.07)",
                      color: C.green,
                      border: "1px solid rgba(52,199,89,0.25)",
                    }}
                  >
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${animPulse ? "animate-ping" : "animate-pulse"}`}
                      style={{ backgroundColor: C.green }}
                    />
                    On-Site
                  </div>
                  <button
                    onClick={() => setModal("out")}
                    className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    style={{ background: `linear-gradient(135deg, ${C.orange}, #FF9500)` }}
                  >
                    🏁 Punch Out
                  </button>
                </>
              )}
            </div>

            {!isPunchedIn && (
              <p className="text-center text-xs mt-3" style={{ color: C.dimText }}>
                Selfie + geo-location captured on punch in.
              </p>
            )}
          </div>
        </div>

        {/* Sessions log */}
        {sessions.length > 0 ? (
          <div
            className="bg-white rounded-xl shadow-sm overflow-hidden"
            style={{ border: `1px solid ${C.lightBlue}` }}
          >
            <div className="px-4 pt-4 pb-0 flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: C.darkBlue }}>
                Today's Sessions
              </h2>
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: C.darkBlue }}
              >
                {sessions.length}
              </span>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: C.bg, borderBottom: `1px solid ${C.divider}` }}>
                    {["#", "Punch In", "Punch Out", "Duration", "Status", "Location"].map(h => (
                      <th
                        key={h}
                        className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5 whitespace-nowrap"
                        style={{ color: C.medBlue }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...sessions].reverse().map((s, i) => (
                    <LogRow key={i} entry={s} idx={sessions.length - 1 - i} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="md:hidden mt-2">
              {[...sessions].reverse().map((s, i) => (
                <MobileLogCard key={i} entry={s} idx={sessions.length - 1 - i} />
              ))}
            </div>

            <div
              className="px-4 py-3 flex items-center justify-between flex-wrap gap-2"
              style={{ borderTop: `1px solid ${C.divider}` }}
            >
              <span className="text-xs" style={{ color: C.dimText }}>
                {totalSessions} session{totalSessions !== 1 ? "s" : ""} recorded
              </span>
              <span className="text-xs font-semibold" style={{ color: C.medBlue }}>
                {totalHours}h total today
              </span>
            </div>
          </div>
        ) : (
          <div
            className="bg-white rounded-xl shadow-sm p-8 text-center"
            style={{ border: `1px solid ${C.lightBlue}` }}
          >
            <div className="text-4xl mb-3">🕐</div>
            <p className="text-sm font-semibold" style={{ color: C.mutedText }}>No sessions recorded yet</p>
            <p className="text-xs mt-1" style={{ color: C.dimText }}>Punch in to start tracking attendance.</p>
          </div>
        )}

      </main>

      {modal && (
        <CameraModal
          type={modal}
          onClose={() => setModal(null)}
          onSubmit={handlePunch}
        />
      )}
    </div>
  );
}