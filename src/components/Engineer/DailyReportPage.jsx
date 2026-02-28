"use client";
import { useState, useEffect, useRef } from "react";
import {
  UserCheck, TrendingUp, AlertCircle,
  Plus, Trash2, CheckCircle,
} from "lucide-react";
import {
  PageHeader, Card, SectionHead, Label, inputStyle, SubmitBtn,
  FONTS, PROJECTS, ITEMS_BY_PROJECT,
} from "./shared";

/* ─────────────────────────────────────────────────────────────────────────────
   RESPONSIVE CSS
   Breakpoints: 1024 | 768 | 600 | 480 | 380 | 320
───────────────────────────────────────────────────────────────────────────── */
const RWD = `
  /* ── Base / Animations ── */
  @keyframes punchSpin { to { transform: rotate(360deg); } }
  @keyframes drFadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

  /* ── Page wrapper: horizontal padding shrinks on small screens ── */
  .dr-page { animation: drFadeUp 0.35s ease both; }

  /* ════════════════════════════════
     STEP BAR
  ════════════════════════════════ */
  .dr-steps {
    display: flex;
    margin-bottom: 24px;
    background: #fff;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid rgba(73,136,196,0.15);
    box-shadow: 0 2px 12px rgba(15,40,84,0.06);
  }
  .dr-step-btn {
    flex: 1;
    padding: 16px 12px;
    border: none;
    border-right: 1px solid rgba(73,136,196,0.12);
    background: #fff;
    cursor: default;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    transition: background 0.2s;
    font-family: inherit;
  }
  .dr-step-btn:last-child { border-right: none; }
  .dr-step-num  { font-size: 12px; font-weight: 700; }
  .dr-step-name { font-size: 11px; }
  .dr-step-cur  { font-size: 8px; padding: 1px 7px; border-radius: 99px; }

  /* Compact step bar at 480px */
  @media (max-width: 480px) {
    .dr-step-btn  { padding: 12px 6px; gap: 4px; }
    .dr-step-icon { width: 26px !important; height: 26px !important; }
    .dr-step-num  { font-size: 10px; }
    .dr-step-name { font-size: 9px; }
    .dr-step-cur  { display: none !important; }
  }
  /* Ultra-small: hide text labels, show only icons + numbers */
  @media (max-width: 360px) {
    .dr-step-btn  { padding: 10px 4px; }
    .dr-step-name { display: none; }
  }

  /* ════════════════════════════════
     CARD INNER PADDING
  ════════════════════════════════ */
  .dr-card-inner { padding: 26px; }
  @media (max-width: 600px) { .dr-card-inner { padding: 18px 16px; } }
  @media (max-width: 380px) { .dr-card-inner { padding: 14px 12px; } }

  /* ════════════════════════════════
     SECTION 1 — ATTENDANCE
  ════════════════════════════════ */

  /* Punch card: row → column at 540px */
  .dr-punch-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 14px;
  }
  .dr-punch-info  { flex: 1; min-width: 0; }
  .dr-punch-btns  { flex-shrink: 0; display: flex; flex-direction: column; gap: 8px; }
  @media (max-width: 540px) {
    .dr-punch-row   { flex-direction: column; gap: 12px; }
    .dr-punch-btns  { flex-direction: row; width: 100%; }
    .dr-punch-btns button { flex: 1; text-align: center; justify-content: center; }
  }
  @media (max-width: 360px) {
    .dr-punch-btns { flex-direction: column; }
    .dr-punch-btns button { flex: none; width: 100%; }
  }

  /* Punch previews: side-by-side → column at 400px */
  .dr-punch-previews { display: flex; gap: 20px; flex-wrap: wrap; }
  @media (max-width: 400px) {
    .dr-punch-previews { flex-direction: column; gap: 10px; }
  }

  /* ════════════════════════════════
     SECTION 2 — PROGRESS
  ════════════════════════════════ */

  /* Entry grid:
     4-col (lg) → 2-col (md) → 1-col (sm)
  */
  .dr-entry-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 90px 80px;
    gap: 12px;
    margin-bottom: 12px;
  }
  @media (max-width: 700px) {
    .dr-entry-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  }
  @media (max-width: 420px) {
    .dr-entry-grid { grid-template-columns: 1fr; gap: 8px; }
  }

  /* Entry card header */
  .dr-entry-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    flex-wrap: wrap;
    gap: 8px;
  }

  /* ════════════════════════════════
     SECTION 3 — ISSUES
  ════════════════════════════════ */

  /* Issue header: label + severity pills + remove btn */
  .dr-issue-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    flex-wrap: wrap;
    gap: 8px;
  }

  /* Severity pills row */
  .dr-sev-group { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }

  /* 2×2 grid for severity at very small sizes */
  @media (max-width: 460px) {
    .dr-sev-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px;
      width: 100%;
    }
    /* Remove button sits after grid, full width */
    .dr-sev-remove { margin-top: 4px; width: 100%; justify-content: center; }
  }
  @media (max-width: 320px) {
    .dr-sev-group { grid-template-columns: 1fr; }
  }

  /* ════════════════════════════════
     SUMMARY ROW (step 3)
  ════════════════════════════════ */
  .dr-summary-row {
    display: flex;
    gap: 16px 24px;
    flex-wrap: wrap;
  }
  .dr-summary-item { min-width: 80px; }
  @media (max-width: 480px) {
    .dr-summary-row { gap: 12px 20px; }
  }

  /* ════════════════════════════════
     BOTTOM NAV (Back / Continue)
  ════════════════════════════════ */
  .dr-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-top: 20px;
    flex-wrap: wrap;
  }
  .dr-back-btn {
    background: transparent;
    border: 1px solid rgba(73,136,196,0.3);
    color: #4988C4;
    padding: 11px 20px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
  }
  @media (max-width: 380px) {
    .dr-nav { flex-direction: column-reverse; }
    .dr-nav > * { width: 100%; text-align: center; justify-content: center; }
    .dr-back-btn { order: 2; }
  }

  /* ════════════════════════════════
     PUNCH MODAL
  ════════════════════════════════ */
  .pm-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(10,20,48,0.72);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 12px;
  }
  .pm-modal {
    background: #fff;
    border-radius: 24px;
    overflow: hidden;
    width: 100%;
    max-width: 360px;
    box-shadow: 0 32px 80px rgba(10,20,48,0.45);
    display: flex;
    flex-direction: column;
    max-height: calc(100dvh - 24px);
  }
  /* Full-screen on tiny devices */
  @media (max-width: 400px) {
    .pm-overlay  { padding: 0; align-items: flex-end; }
    .pm-modal    { border-radius: 20px 20px 0 0; max-width: 100%; max-height: 96dvh; }
  }
  .pm-camera-area {
    position: relative;
    background: #000;
    flex-shrink: 0;
    /* 3:4 aspect on normal, taller on tiny */
    aspect-ratio: 3/4;
    overflow: hidden;
  }
  @media (max-width: 400px) {
    .pm-camera-area { aspect-ratio: auto; height: 56dvh; }
  }
  /* Notes section inside modal */
  .pm-notes { padding: 12px 16px; border-top: 1px solid rgba(73,136,196,0.12); flex-shrink: 0; }
  @media (max-width: 400px) {
    .pm-notes { padding: 10px 14px; }
  }

  /* ════════════════════════════════
     SUBMIT SUCCESS SCREEN
  ════════════════════════════════ */
  .dr-success {
    max-width: 520px;
    margin: 60px auto;
    text-align: center;
    padding: 0 16px;
  }
  @media (max-width: 480px) {
    .dr-success { margin: 32px auto; }
  }
  .dr-success-card {
    background: #fff;
    border: 1px solid rgba(73,136,196,0.15);
    border-radius: 14px;
    padding: 18px 22px;
    margin-bottom: 20px;
    text-align: left;
  }
  @media (max-width: 380px) {
    .dr-success-card { padding: 14px 14px; }
  }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   PUNCH MODAL
───────────────────────────────────────────────────────────────────────────── */
function PunchModal({ type = "in", onClose, onSubmit }) {
  const [formData,        setFormData]        = useState({ location: "", notes: "", photo: null });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [currentTime,     setCurrentTime]     = useState(new Date());
  const [isSubmitting,    setIsSubmitting]     = useState(false);
  const [cameraStream,    setCameraStream]     = useState(null);
  const [showCamera,      setShowCamera]       = useState(true);
  const [cameraError,     setCameraError]      = useState(false);
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { fetchLocation(); }, []);
  useEffect(() => { openCamera(); return () => stopStream(); }, []);
  useEffect(() => {
    if (cameraStream && videoRef.current) videoRef.current.srcObject = cameraStream;
  }, [cameraStream]);

  const stopStream = () =>
    setCameraStream(prev => { prev?.getTracks().forEach(t => t.stop()); return null; });

  const fetchLocation = () => {
    setLoadingLocation(true);
    if (!navigator.geolocation) {
      setFormData(p => ({ ...p, location: "Geolocation not supported" }));
      setLoadingLocation(false); return;
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
        setLoadingLocation(false);
      },
      () => { setFormData(p => ({ ...p, location: "Location unavailable" })); setLoadingLocation(false); }
    );
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setCameraStream(stream); setCameraError(false);
    } catch { setCameraError(true); setShowCamera(false); }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    ctx.translate(c.width, 0); ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0, c.width, c.height);
    const photo = c.toDataURL("image/jpeg", 0.9);
    setFormData(p => ({ ...p, photo }));
    setShowCamera(false); stopStream();
  };

  const retakePhoto = () => {
    setFormData(p => ({ ...p, photo: null }));
    setShowCamera(true); openCamera();
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    onSubmit({ ...formData, timestamp: new Date(), coords: currentLocation });
    setIsSubmitting(false);
  };

  const isIn = type === "in";

  return (
    <div className="pm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pm-modal">

        {/* ── Header ── */}
        <div style={{
          background: "linear-gradient(135deg,#0F2854,#1C4D8D)",
          padding: "13px 18px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ color: "#BDE8F5", fontSize: 14, fontWeight: 700 }}>
              {isIn ? "📍 Punch In" : "🏁 Punch Out"}
            </div>
            <div style={{ color: "rgba(189,232,245,0.6)", fontSize: 11, marginTop: 2 }}>
              {currentTime.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
              &nbsp;·&nbsp;
              {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: "50%", border: "none", cursor: "pointer",
            background: "rgba(189,232,245,0.15)", color: "#BDE8F5", fontSize: 15,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>✕</button>
        </div>

        {/* ── Camera / Preview area ── */}
        <div className="pm-camera-area">

          {/* Video / Photo / Error */}
          {showCamera && !cameraError ? (
            <video ref={videoRef} autoPlay playsInline muted
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
          ) : formData.photo ? (
            <img src={formData.photo} alt="selfie"
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{
              width: "100%", height: "100%", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 12, background: "#111", padding: 24,
            }}>
              <span style={{ fontSize: 40 }}>📷</span>
              <p style={{ color: "#BDE8F5", fontSize: 13, textAlign: "center", margin: 0, lineHeight: 1.5 }}>
                Camera access denied.<br />Please allow camera to continue.
              </p>
              <button onClick={openCamera} style={{
                background: "#1C4D8D", color: "#BDE8F5", border: "none",
                padding: "8px 18px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
              }}>Retry Camera</button>
            </div>
          )}

          {/* Location badge — overlaid on top */}
          <div style={{
            position: "absolute", top: 10, left: 10, right: 10,
            background: "rgba(10,20,48,0.65)", backdropFilter: "blur(8px)",
            borderRadius: 11, padding: "7px 11px",
            display: "flex", alignItems: "flex-start", gap: 7,
          }}>
            <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>📍</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              {loadingLocation ? (
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ animation: "punchSpin 1s linear infinite", display: "inline-block" }}>⟳</span>
                  Detecting location…
                </div>
              ) : (
                <div style={{
                  color: "#fff", fontSize: 10, lineHeight: 1.4,
                  overflow: "hidden", display: "-webkit-box",
                  WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                }}>{formData.location}</div>
              )}
            </div>
            <button onClick={fetchLocation} style={{
              background: "none", border: "none", color: "rgba(189,232,245,0.7)",
              fontSize: 14, cursor: "pointer", flexShrink: 0, padding: 0,
            }}>↺</button>
          </div>

          {/* Bottom action row */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "18px 18px 22px",
            background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
          }}>
            {showCamera && !cameraError ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <button onClick={onClose} style={{
                  background: "none", border: "none", color: "rgba(255,255,255,0.7)",
                  fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: "6px 4px",
                }}>Cancel</button>

                {/* Shutter button */}
                <button onClick={capturePhoto} style={{
                  width: 66, height: 66, borderRadius: "50%", background: "#fff",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                }}>
                  <div style={{
                    width: 54, height: 54, borderRadius: "50%",
                    background: "linear-gradient(135deg,#4988C4,#0F2854)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                  }}>📷</div>
                </button>
                <div style={{ width: 56 }} />
              </div>
            ) : formData.photo ? (
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={retakePhoto} style={{
                  flex: 1, padding: "11px", borderRadius: 11, fontSize: 13, fontWeight: 700,
                  background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.25)", color: "#fff", cursor: "pointer",
                  fontFamily: "inherit",
                }}>↩ Retake</button>

                <button onClick={handleConfirm} disabled={isSubmitting} style={{
                  flex: 1, padding: "11px", borderRadius: 11, fontSize: 13, fontWeight: 700,
                  background: isSubmitting ? "rgba(73,136,196,0.7)" : "linear-gradient(135deg,#4988C4,#0F2854)",
                  border: "none", color: "#fff", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  fontFamily: "inherit",
                }}>
                  {isSubmitting
                    ? <><span style={{ animation: "punchSpin 0.8s linear infinite", display: "inline-block" }}>⟳</span>Saving…</>
                    : <><span>✓</span>Confirm {isIn ? "Punch In" : "Punch Out"}</>
                  }
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Notes */}
        {!showCamera && formData.photo && (
          <div className="pm-notes">
            <div style={{ color: "#1C4D8D", fontSize: 10, fontWeight: 600, letterSpacing: 0.5, marginBottom: 5 }}>
              NOTES (OPTIONAL)
            </div>
            <textarea rows={2} style={{
              width: "100%", border: "1px solid rgba(73,136,196,0.25)", borderRadius: 9,
              padding: "8px 11px", fontSize: 12, color: "#0F2854", resize: "none",
              fontFamily: "inherit", outline: "none",
              background: "rgba(189,232,245,0.06)", boxSizing: "border-box",
            }}
              placeholder="Add any notes for this attendance record…"
              value={formData.notes}
              onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────────────────── */
const ISSUE_SEVERITIES = ["Minor", "Moderate", "Major", "Blocking"];
const sevColor = { Minor: "#34C759", Moderate: "#FF9500", Major: "#FF3B30", Blocking: "#9B1C1C" };

const STEPS = [
  { n: 1, label: "Attendance",      icon: UserCheck   },
  { n: 2, label: "Progress Update", icon: TrendingUp  },
  { n: 3, label: "Issues",          icon: AlertCircle },
];

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function DailyReportPage() {
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const [showPunchModal, setShowPunchModal] = useState(false);
  const [punchType,      setPunchType]      = useState("in");
  const [punchInData,    setPunchInData]    = useState(null);
  const [punchOutData,   setPunchOutData]   = useState(null);
  const [entries,        setEntries]        = useState([{ id: 1, project: "", item: "", qty: "", unit: "pcs", notes: "" }]);
  const [issues,         setIssues]         = useState([{ id: 1, description: "", severity: "Minor", blocksWork: false }]);
  const [submitted,      setSubmitted]      = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [step,           setStep]           = useState(1);

  const punchedIn  = !!punchInData;
  const punchedOut = !!punchOutData;

  const openPunchIn  = () => { setPunchType("in");  setShowPunchModal(true); };
  const openPunchOut = () => { setPunchType("out"); setShowPunchModal(true); };
  const handlePunchSubmit = (data) => {
    if (punchType === "in") setPunchInData(data);
    else                    setPunchOutData(data);
    setShowPunchModal(false);
  };

  const fmt = (d) =>
    d ? new Date(d.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";

  const addEntry    = () => setEntries(e => [...e, { id: Date.now(), project: "", item: "", qty: "", unit: "pcs", notes: "" }]);
  const removeEntry = (id) => setEntries(e => e.filter(x => x.id !== id));
  const upEntry     = (id, k, v) => setEntries(e => e.map(x => x.id === id ? { ...x, [k]: v } : x));

  const addIssue    = () => setIssues(i => [...i, { id: Date.now(), description: "", severity: "Minor", blocksWork: false }]);
  const removeIssue = (id) => setIssues(i => i.filter(x => x.id !== id));
  const upIssue     = (id, k, v) => setIssues(i => i.map(x => x.id === id ? { ...x, [k]: v } : x));

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1600));
    setLoading(false); setSubmitted(true);
  };

  /* ── Submitted screen ──────────────────────────────────────────────────── */
  if (submitted) return (
    <>
      <style>{FONTS + RWD}</style>
      <div className="dr-success">
        <div style={{ fontSize: "clamp(40px,10vw,56px)", marginBottom: 16 }}>✅</div>
        <h2 style={{
          color: "#0F2854", fontSize: "clamp(18px,5vw,24px)",
          fontWeight: 800, fontFamily: "'Syne',sans-serif", marginBottom: 8,
        }}>Daily Report Submitted!</h2>
        <p style={{ color: "#4988C4", fontSize: 13, marginBottom: 24 }}>
          Your report for {today} has been saved successfully.
        </p>
        <div className="dr-success-card">
          {[
            ["Punch In",     fmt(punchInData)  || "—"],
            ["Punch Out",    fmt(punchOutData) || "—"],
            ["Items Logged", `${entries.filter(e => e.project && e.item).length} entries`],
            ["Issues Filed", `${issues.filter(i => i.description).length} issues`],
          ].map(([k, v]) => (
            <div key={k} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "7px 0", borderBottom: "1px solid rgba(73,136,196,0.07)",
              flexWrap: "wrap", gap: 4,
            }}>
              <span style={{ color: "#4988C4", fontSize: 13 }}>{k}</span>
              <span style={{ color: "#0F2854", fontSize: 13, fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => { setSubmitted(false); setStep(1); setPunchInData(null); setPunchOutData(null); }}
          style={{
            background: "#0F2854", color: "#BDE8F5", border: "none",
            padding: "11px 24px", borderRadius: 10, fontSize: 13,
            fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            width: "100%", maxWidth: 220,
          }}
        >← Back to Dashboard</button>
      </div>
    </>
  );

  /* ── Main render ───────────────────────────────────────────────────────── */
  return (
    <>
      <style>{FONTS + RWD}</style>

      <PageHeader
        eyebrow="Field"
        title="Daily Report"
        subtitle={`${today} · 3 mandatory sections`}
      />

      {/* ════════════════ STEP BAR ════════════════ */}
      <div className="dr-steps">
        {STEPS.map((s, i) => {
          const active   = step === s.n;
          const complete = step > s.n;
          return (
            <button
              key={s.n}
              className="dr-step-btn"
              onClick={() => complete && setStep(s.n)}
              style={{
                background: active
                  ? "linear-gradient(135deg,#0F2854,#1C4D8D)"
                  : complete ? "rgba(52,199,89,0.07)" : "#fff",
                cursor: complete ? "pointer" : "default",
              }}
            >
              {/* Circle icon */}
              <div className="dr-step-icon" style={{
                width: 32, height: 32, borderRadius: "50%",
                background: active ? "rgba(255,255,255,0.15)" : complete ? "#34C759" : "rgba(73,136,196,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {complete
                  ? <CheckCircle size={16} color="#fff" />
                  : <s.icon size={15} color={active ? "#BDE8F5" : "#4988C4"} />
                }
              </div>

              {/* Labels */}
              <div>
                <div className="dr-step-num" style={{ color: active ? "#BDE8F5" : complete ? "#34C759" : "#1C4D8D" }}>
                  Section {s.n}
                </div>
                <div className="dr-step-name" style={{ color: active ? "rgba(189,232,245,0.7)" : "#4988C4" }}>
                  {s.label}
                </div>
              </div>

              {active && (
                <span className="dr-step-cur"
                  style={{ color: "#BDE8F5", background: "rgba(255,255,255,0.2)" }}>
                  CURRENT
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ════════════════ SECTION 1: ATTENDANCE ════════════════ */}
      {step === 1 && (
        <Card style={{ animation: "drFadeUp 0.35s ease" }}>
          <div className="dr-card-inner">
            <SectionHead
              icon={<UserCheck size={16} color="#BDE8F5" />}
              title="Attendance"
              subtitle="Mandatory — punch in with camera & geo-location"
            />

            {/* Punch card */}
            <div style={{
              padding: "16px 18px",
              borderRadius: 14,
              marginBottom: 18,
              background: punchedIn ? "rgba(52,199,89,0.04)" : "rgba(73,136,196,0.04)",
              border: `1px solid ${punchedIn ? "rgba(52,199,89,0.3)" : "rgba(73,136,196,0.15)"}`,
            }}>
              <div className="dr-punch-row">

                {/* Left: status + thumb + info */}
                <div className="dr-punch-info">
                  <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                    {!punchedIn    ? "📍 Punch In Required"
                     : !punchedOut ? "✅ Punched In · Work in Progress"
                     :               "🏁 Session Complete"}
                  </div>

                  {!punchedIn && (
                    <div style={{ color: "#4988C4", fontSize: 12 }}>
                      Selfie + geo-location will be captured automatically.
                    </div>
                  )}

                  {punchedIn && (
                    <div className="dr-punch-previews">
                      {/* Punch In */}
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        {punchInData.photo && (
                          <img src={punchInData.photo} alt="punch-in"
                            style={{ width: 44, height: 44, borderRadius: 9, objectFit: "cover",
                              border: "2px solid rgba(52,199,89,0.5)", flexShrink: 0 }} />
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: "#34C759", fontSize: 10, fontWeight: 700, marginBottom: 2 }}>PUNCH IN</div>
                          <div style={{ color: "#0F2854", fontSize: 13, fontWeight: 700 }}>{fmt(punchInData)}</div>
                          <div style={{
                            color: "#4988C4", fontSize: 10,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            maxWidth: "min(180px, 55vw)",
                          }}>
                            📍 {typeof punchInData.location === "string" ? punchInData.location : "Location captured"}
                          </div>
                        </div>
                      </div>

                      {/* Punch Out */}
                      {punchedOut && (
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          {punchOutData.photo && (
                            <img src={punchOutData.photo} alt="punch-out"
                              style={{ width: 44, height: 44, borderRadius: 9, objectFit: "cover",
                                border: "2px solid rgba(73,136,196,0.5)", flexShrink: 0 }} />
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ color: "#4988C4", fontSize: 10, fontWeight: 700, marginBottom: 2 }}>PUNCH OUT</div>
                            <div style={{ color: "#0F2854", fontSize: 13, fontWeight: 700 }}>{fmt(punchOutData)}</div>
                            <div style={{
                              color: "#4988C4", fontSize: 10,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              maxWidth: "min(180px, 55vw)",
                            }}>
                              📍 {typeof punchOutData.location === "string" ? punchOutData.location : "Location captured"}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: punch buttons */}
                <div className="dr-punch-btns">
                  {!punchedIn && (
                    <button onClick={openPunchIn} style={{
                      background: "linear-gradient(135deg,#0F2854,#1C4D8D)",
                      color: "#BDE8F5", border: "none", padding: "10px 18px",
                      borderRadius: 10, fontSize: 12, fontWeight: 700,
                      cursor: "pointer", whiteSpace: "nowrap",
                      fontFamily: "inherit", display: "flex", alignItems: "center",
                      justifyContent: "center", gap: 6,
                    }}>📍 Punch In Now</button>
                  )}
                  {punchedIn && !punchedOut && (
                    <button onClick={openPunchOut} style={{
                      background: "linear-gradient(135deg,#FF9500,#E07800)",
                      color: "#fff", border: "none", padding: "10px 18px",
                      borderRadius: 10, fontSize: 12, fontWeight: 700,
                      cursor: "pointer", whiteSpace: "nowrap",
                      fontFamily: "inherit", display: "flex", alignItems: "center",
                      justifyContent: "center", gap: 6,
                    }}>🏁 Punch Out</button>
                  )}
                </div>
              </div>
            </div>

            {/* Warning */}
            {!punchedIn && (
              <div style={{
                marginBottom: 18, padding: "9px 13px", borderRadius: 8,
                background: "rgba(255,149,0,0.07)", border: "1px solid rgba(255,149,0,0.22)",
                color: "#FF9500", fontSize: 12, fontWeight: 500,
              }}>
                ⚠ Please punch in before continuing to the next section.
              </div>
            )}

            <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
              <SubmitBtn onClick={() => setStep(2)}>Continue to Progress →</SubmitBtn>
            </div>
          </div>
        </Card>
      )}

      {/* ════════════════ SECTION 2: PROGRESS UPDATE ════════════════ */}
      {step === 2 && (
        <Card style={{ animation: "drFadeUp 0.35s ease" }}>
          <div className="dr-card-inner">
            <SectionHead
              icon={<TrendingUp size={16} color="#BDE8F5" />}
              title="Progress Update"
              subtitle="Log items installed / work completed today"
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {entries.map((entry, idx) => (
                <div key={entry.id} style={{
                  background: "rgba(73,136,196,0.04)",
                  border: "1px solid rgba(73,136,196,0.12)",
                  borderRadius: 12, padding: 14,
                }}>
                  {/* Entry header row */}
                  <div className="dr-entry-header">
                    <span style={{ color: "#1C4D8D", fontSize: 12, fontWeight: 700 }}>
                      Entry #{idx + 1}
                    </span>
                    {entries.length > 1 && (
                      <button onClick={() => removeEntry(entry.id)} style={{
                        background: "rgba(255,59,48,0.08)",
                        border: "1px solid rgba(255,59,48,0.2)",
                        color: "#FF3B30", borderRadius: 7, padding: "4px 10px",
                        fontSize: 11, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 4,
                        fontFamily: "inherit",
                      }}>
                        <Trash2 size={11} /> Remove
                      </button>
                    )}
                  </div>

                  {/* Responsive fields grid */}
                  <div className="dr-entry-grid">
                    <div>
                      <Label required>Project</Label>
                      <select style={{ ...inputStyle, cursor: "pointer" }}
                        value={entry.project}
                        onChange={e => upEntry(entry.id, "project", e.target.value)}>
                        <option value="">Select project</option>
                        {PROJECTS.map(p => (
                          <option key={p.id} value={p.id}>{p.id} — {p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label required>Item / Component</Label>
                      <select style={{ ...inputStyle, cursor: "pointer" }}
                        value={entry.item}
                        onChange={e => upEntry(entry.id, "item", e.target.value)}>
                        <option value="">Select item</option>
                        {(ITEMS_BY_PROJECT[entry.project] || []).map(it => (
                          <option key={it}>{it}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label required>Qty</Label>
                      <input type="number" min={0} style={inputStyle} placeholder="0"
                        value={entry.qty}
                        onChange={e => upEntry(entry.id, "qty", e.target.value)} />
                    </div>

                    <div>
                      <Label>Unit</Label>
                      <select style={{ ...inputStyle, cursor: "pointer" }}
                        value={entry.unit}
                        onChange={e => upEntry(entry.id, "unit", e.target.value)}>
                        {["pcs", "m", "m²", "kg", "set", "lot"].map(u => (
                          <option key={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Notes row — always full width */}
                  <div>
                    <Label>Notes / Remarks</Label>
                    <input style={inputStyle} placeholder="Brief note on this entry…"
                      value={entry.notes}
                      onChange={e => upEntry(entry.id, "notes", e.target.value)} />
                  </div>
                </div>
              ))}

              {/* Add entry button */}
              <button onClick={addEntry} style={{
                background: "rgba(73,136,196,0.07)",
                border: "1.5px dashed rgba(73,136,196,0.35)",
                color: "#1C4D8D", borderRadius: 11, padding: "11px",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontFamily: "inherit",
              }}>
                <Plus size={15} /> Add Another Entry
              </button>
            </div>

            <div className="dr-nav">
              <button className="dr-back-btn" onClick={() => setStep(1)}>← Back</button>
              <SubmitBtn onClick={() => setStep(3)}>Continue to Issues →</SubmitBtn>
            </div>
          </div>
        </Card>
      )}

      {/* ════════════════ SECTION 3: ISSUES ENCOUNTERED ════════════════ */}
      {step === 3 && (
        <Card style={{ animation: "drFadeUp 0.35s ease" }}>
          <div className="dr-card-inner">
            <SectionHead
              icon={<AlertCircle size={16} color="#BDE8F5" />}
              title="Issues Encountered"
              subtitle="Log any problems found on site today"
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {issues.map((issue, idx) => (
                <div key={issue.id} style={{
                  background: issue.severity === "Blocking"
                    ? "rgba(155,28,28,0.04)"
                    : "rgba(73,136,196,0.04)",
                  border: `1px solid ${issue.severity === "Blocking"
                    ? "rgba(155,28,28,0.2)"
                    : "rgba(73,136,196,0.12)"}`,
                  borderRadius: 12, padding: 14,
                }}>

                  {/* Issue header */}
                  <div className="dr-issue-header">
                    <span style={{ color: "#1C4D8D", fontSize: 12, fontWeight: 700 }}>
                      Issue #{idx + 1}
                    </span>

                    {/* Severity pills + remove */}
                    <div className="dr-sev-group">
                      {ISSUE_SEVERITIES.map(s => (
                        <button key={s}
                          onClick={() => upIssue(issue.id, "severity", s)}
                          style={{
                            padding: "4px 11px", borderRadius: 99, border: "none",
                            cursor: "pointer",
                            background: issue.severity === s ? sevColor[s] : "rgba(0,0,0,0.06)",
                            color: issue.severity === s ? "#fff" : "#888",
                            fontSize: 11, fontWeight: 700, fontFamily: "inherit",
                            whiteSpace: "nowrap",
                          }}
                        >{s}</button>
                      ))}

                      {issues.length > 1 && (
                        <button
                          className="dr-sev-remove"
                          onClick={() => removeIssue(issue.id)}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "#FF3B30", padding: "3px 5px",
                            display: "flex", alignItems: "center",
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label required>Issue Description</Label>
                    <textarea
                      style={{ ...inputStyle, minHeight: 72, resize: "vertical" }}
                      placeholder="Describe the problem encountered today…"
                      value={issue.description}
                      onChange={e => upIssue(issue.id, "description", e.target.value)}
                    />
                  </div>

                  {/* Blocks work */}
                  <div style={{ marginTop: 10 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input type="checkbox" checked={issue.blocksWork}
                        onChange={e => upIssue(issue.id, "blocksWork", e.target.checked)} />
                      <span style={{ color: "#FF3B30", fontSize: 12, fontWeight: 600 }}>
                        ⛔ This issue is blocking work progress
                      </span>
                    </label>
                  </div>
                </div>
              ))}

              {/* Add issue button */}
              <button onClick={addIssue} style={{
                background: "rgba(255,149,0,0.06)",
                border: "1.5px dashed rgba(255,149,0,0.35)",
                color: "#FF9500", borderRadius: 11, padding: "11px",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontFamily: "inherit",
              }}>
                <Plus size={15} /> Add Another Issue
              </button>
            </div>

            {/* Summary box */}
            <div style={{
              marginTop: 20,
              background: "rgba(189,232,245,0.1)",
              border: "1px solid rgba(73,136,196,0.15)",
              borderRadius: 11, padding: "14px 16px",
            }}>
              <div style={{ color: "#0F2854", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                Report Summary
              </div>
              <div className="dr-summary-row">
                {[
                  ["Punch In",  fmt(punchInData)  || "Not set"],
                  ["Punch Out", fmt(punchOutData) || "Not set"],
                  ["Entries",   entries.filter(e => e.project).length + " items"],
                  ["Issues",    issues.filter(i => i.description).length + " logged"],
                  ["Date",      new Date().toLocaleDateString("en-GB")],
                ].map(([k, v]) => (
                  <div key={k} className="dr-summary-item">
                    <div style={{ color: "#4988C4", fontSize: 10, fontWeight: 600 }}>
                      {k.toUpperCase()}
                    </div>
                    <div style={{ color: "#0F2854", fontSize: 13, fontWeight: 700 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dr-nav">
              <button className="dr-back-btn" onClick={() => setStep(2)}>← Back</button>
              <SubmitBtn loading={loading} color="green" onClick={handleSubmit}>
                ✓ Submit Daily Report
              </SubmitBtn>
            </div>
          </div>
        </Card>
      )}

      {/* Punch Modal */}
      {showPunchModal && (
        <PunchModal
          type={punchType}
          onClose={() => setShowPunchModal(false)}
          onSubmit={handlePunchSubmit}
        />
      )}
    </>
  );
}