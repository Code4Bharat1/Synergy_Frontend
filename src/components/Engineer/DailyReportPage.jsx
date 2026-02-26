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

// ─────────────────────────────────────────────────────────────────────────────
// PunchModal — camera + geo-location selfie
// ─────────────────────────────────────────────────────────────────────────────
function PunchModal({ type = "in", onClose, onSubmit }) {
  const [formData, setFormData]           = useState({ location: "", notes: "", photo: null });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [currentTime, setCurrentTime]     = useState(new Date());
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [cameraStream, setCameraStream]   = useState(null);
  const [showCamera, setShowCamera]       = useState(true);
  const [cameraError, setCameraError]     = useState(false);
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

  const stopStream = () => {
    setCameraStream(prev => { prev?.getTracks().forEach(t => t.stop()); return null; });
  };

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
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(10,20,48,0.72)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 24, overflow: "hidden",
        width: "100%", maxWidth: 360,
        boxShadow: "0 32px 80px rgba(10,20,48,0.45)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg,#0F2854,#1C4D8D)",
          padding: "13px 18px", display: "flex", justifyContent: "space-between", alignItems: "center",
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
            width: 28, height: 28, borderRadius: "50%", border: "none", cursor: "pointer",
            background: "rgba(189,232,245,0.15)", color: "#BDE8F5", fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Camera area */}
        <div style={{ position: "relative", background: "#000", aspectRatio: "3/4", overflow: "hidden" }}>
          {showCamera && !cameraError ? (
            <video ref={videoRef} autoPlay playsInline muted
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
          ) : formData.photo ? (
            <img src={formData.photo} alt="selfie"
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{
              width: "100%", height: "100%", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 10, background: "#111",
            }}>
              <span style={{ fontSize: 40 }}>📷</span>
              <p style={{ color: "#BDE8F5", fontSize: 13, textAlign: "center", padding: "0 20px" }}>
                Camera access denied.<br />Please allow camera to continue.
              </p>
              <button onClick={openCamera} style={{
                background: "#1C4D8D", color: "#BDE8F5", border: "none",
                padding: "8px 18px", borderRadius: 8, fontSize: 12, cursor: "pointer",
              }}>Retry Camera</button>
            </div>
          )}

          {/* Location badge */}
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
                  overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                }}>{formData.location}</div>
              )}
            </div>
            <button onClick={fetchLocation} style={{
              background: "none", border: "none", color: "rgba(189,232,245,0.7)",
              fontSize: 13, cursor: "pointer", flexShrink: 0, padding: 0,
            }}>↺</button>
          </div>

          {/* Bottom bar */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, padding: "18px 18px 22px",
            background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
          }}>
            {showCamera && !cameraError ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <button onClick={onClose} style={{
                  background: "none", border: "none", color: "rgba(255,255,255,0.7)",
                  fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: "6px 4px",
                }}>Cancel</button>
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
                    ? <><span style={{ animation: "punchSpin 0.8s linear infinite", display: "inline-block" }}>⟳</span> Saving…</>
                    : <><span>✓</span> Confirm {isIn ? "Punch In" : "Punch Out"}</>
                  }
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Notes */}
        {!showCamera && formData.photo && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(73,136,196,0.12)" }}>
            <div style={{ color: "#1C4D8D", fontSize: 10, fontWeight: 600, letterSpacing: 0.5, marginBottom: 5 }}>NOTES (OPTIONAL)</div>
            <textarea rows={2} style={{
              width: "100%", border: "1px solid rgba(73,136,196,0.25)", borderRadius: 9,
              padding: "8px 11px", fontSize: 12, color: "#0F2854", resize: "none",
              fontFamily: "inherit", outline: "none", background: "rgba(189,232,245,0.06)", boxSizing: "border-box",
            }}
              placeholder="Add any notes for this attendance record…"
              value={formData.notes}
              onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
            />
          </div>
        )}

        <style>{`@keyframes punchSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const ISSUE_SEVERITIES = ["Minor", "Moderate", "Major", "Blocking"];
const sevColor = { Minor: "#34C759", Moderate: "#FF9500", Major: "#FF3B30", Blocking: "#9B1C1C" };

const STEPS = [
  { n: 1, label: "Attendance",      icon: UserCheck   },
  { n: 2, label: "Progress Update", icon: TrendingUp  },
  { n: 3, label: "Issues",          icon: AlertCircle },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function DailyReportPage() {
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // ── Punch state
  const [showPunchModal, setShowPunchModal] = useState(false);
  const [punchType,      setPunchType]      = useState("in");
  const [punchInData,    setPunchInData]    = useState(null);
  const [punchOutData,   setPunchOutData]   = useState(null);

  // ── Section 2: Progress
  const [entries, setEntries] = useState([{ id: 1, project: "", item: "", qty: "", unit: "pcs", notes: "" }]);

  // ── Section 3: Issues
  const [issues, setIssues] = useState([{ id: 1, description: "", severity: "Minor", blocksWork: false }]);

  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [step,      setStep]      = useState(1);

  const punchedIn  = !!punchInData;
  const punchedOut = !!punchOutData;

  const openPunchIn  = () => { setPunchType("in");  setShowPunchModal(true); };
  const openPunchOut = () => { setPunchType("out"); setShowPunchModal(true); };

  const handlePunchSubmit = (data) => {
    if (punchType === "in")  setPunchInData(data);
    else                     setPunchOutData(data);
    setShowPunchModal(false);
  };

  const formatTime = (d) => d ? new Date(d.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";

  // Progress helpers
  const addEntry    = () => setEntries(e => [...e, { id: Date.now(), project: "", item: "", qty: "", unit: "pcs", notes: "" }]);
  const removeEntry = (id) => setEntries(e => e.filter(x => x.id !== id));
  const updateEntry = (id, key, val) => setEntries(e => e.map(x => x.id === id ? { ...x, [key]: val } : x));

  // Issue helpers
  const addIssue    = () => setIssues(i => [...i, { id: Date.now(), description: "", severity: "Minor", blocksWork: false }]);
  const removeIssue = (id) => setIssues(i => i.filter(x => x.id !== id));
  const updateIssue = (id, key, val) => setIssues(i => i.map(x => x.id === id ? { ...x, [key]: val } : x));

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1600));
    setLoading(false);
    setSubmitted(true);
  };

  // ── Submitted screen ──────────────────────────────────────────────────────
  if (submitted) return (
    <>
      <style>{FONTS}</style>
      <div style={{ maxWidth: 520, margin: "80px auto", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: "#0F2854", fontSize: 24, fontWeight: 800, fontFamily: "'Syne',sans-serif", marginBottom: 8 }}>
          Daily Report Submitted!
        </h2>
        <p style={{ color: "#4988C4", fontSize: 14, marginBottom: 28 }}>
          Your report for {today} has been saved successfully.
        </p>
        <div style={{ background: "#fff", border: "1px solid rgba(73,136,196,0.15)", borderRadius: 14, padding: "18px 22px", marginBottom: 20, textAlign: "left" }}>
          {[
            ["Punch In",     formatTime(punchInData) || "—"],
            ["Punch Out",    formatTime(punchOutData) || "—"],
            ["Items Logged", `${entries.filter(e => e.project && e.item).length} entries`],
            ["Issues Filed", `${issues.filter(i => i.description).length} issues`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(73,136,196,0.07)" }}>
              <span style={{ color: "#4988C4", fontSize: 13 }}>{k}</span>
              <span style={{ color: "#0F2854", fontSize: 13, fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>
        <button onClick={() => { setSubmitted(false); setStep(1); setPunchInData(null); setPunchOutData(null); }} style={{
          background: "#0F2854", color: "#BDE8F5", border: "none",
          padding: "11px 24px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>← Back to Dashboard</button>
      </div>
    </>
  );

  return (
    <>
      <style>{FONTS}</style>
      <PageHeader eyebrow="Field" title="Daily Report" subtitle={today + " · 3 mandatory sections"} />

      {/* ── Step Bar ──────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", marginBottom: 28,
        background: "#fff", borderRadius: 14, overflow: "hidden",
        border: "1px solid rgba(73,136,196,0.15)", boxShadow: "0 2px 12px rgba(15,40,84,0.06)",
      }}>
        {STEPS.map((s, i) => {
          const active   = step === s.n;
          const complete = step > s.n;
          return (
            <button key={s.n} onClick={() => complete && setStep(s.n)} style={{
              flex: 1, padding: "16px 12px",
              background: active ? "linear-gradient(135deg,#0F2854,#1C4D8D)" : complete ? "rgba(52,199,89,0.07)" : "#fff",
              border: "none", borderRight: i < 2 ? "1px solid rgba(73,136,196,0.12)" : "none",
              cursor: complete ? "pointer" : "default",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "background 0.2s",
              fontFamily: "inherit",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: active ? "rgba(255,255,255,0.15)" : complete ? "#34C759" : "rgba(73,136,196,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {complete ? <CheckCircle size={16} color="#fff" /> : <s.icon size={15} color={active ? "#BDE8F5" : "#4988C4"} />}
              </div>
              <div>
                <div style={{ color: active ? "#BDE8F5" : complete ? "#34C759" : "#1C4D8D", fontSize: 12, fontWeight: 700 }}>Section {s.n}</div>
                <div style={{ color: active ? "rgba(189,232,245,0.7)" : "#4988C4", fontSize: 11 }}>{s.label}</div>
              </div>
              {active && <span style={{ fontSize: 8, color: "#BDE8F5", background: "rgba(255,255,255,0.2)", padding: "1px 7px", borderRadius: 99 }}>CURRENT</span>}
            </button>
          );
        })}
      </div>

      {/* ══════════════════ SECTION 1: ATTENDANCE ══════════════════ */}
      {step === 1 && (
        <Card style={{ padding: "26px", animation: "fadeUp 0.35s ease" }}>
          <SectionHead icon={<UserCheck size={16} color="#BDE8F5" />} title="Attendance" subtitle="Mandatory — punch in with camera & geo-location" />

          {/* ── Punch In / Out Card ─────────────────────────── */}
          <div style={{
            padding: "18px 20px", borderRadius: 14, marginBottom: 22,
            background: punchedIn ? "rgba(52,199,89,0.04)" : "rgba(73,136,196,0.04)",
            border: `1px solid ${punchedIn ? "rgba(52,199,89,0.3)" : "rgba(73,136,196,0.15)"}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>

              {/* Left: status + previews */}
              <div style={{ flex: 1 }}>
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
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                    {/* punch-in info */}
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      {punchInData.photo && (
                        <img src={punchInData.photo} alt="in"
                          style={{ width: 44, height: 44, borderRadius: 9, objectFit: "cover", border: "2px solid rgba(52,199,89,0.5)" }} />
                      )}
                      <div>
                        <div style={{ color: "#34C759", fontSize: 10, fontWeight: 700, marginBottom: 2 }}>PUNCH IN</div>
                        <div style={{ color: "#0F2854", fontSize: 13, fontWeight: 700 }}>{formatTime(punchInData)}</div>
                        <div style={{ color: "#4988C4", fontSize: 10, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          📍 {typeof punchInData.location === "string" ? punchInData.location : "Location captured"}
                        </div>
                      </div>
                    </div>

                    {/* punch-out info */}
                    {punchedOut && (
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        {punchOutData.photo && (
                          <img src={punchOutData.photo} alt="out"
                            style={{ width: 44, height: 44, borderRadius: 9, objectFit: "cover", border: "2px solid rgba(73,136,196,0.5)" }} />
                        )}
                        <div>
                          <div style={{ color: "#4988C4", fontSize: 10, fontWeight: 700, marginBottom: 2 }}>PUNCH OUT</div>
                          <div style={{ color: "#0F2854", fontSize: 13, fontWeight: 700 }}>{formatTime(punchOutData)}</div>
                          <div style={{ color: "#4988C4", fontSize: 10, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            📍 {typeof punchOutData.location === "string" ? punchOutData.location : "Location captured"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right: action buttons */}
              <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {!punchedIn && (
                  <button onClick={openPunchIn} style={{
                    background: "linear-gradient(135deg,#0F2854,#1C4D8D)", color: "#BDE8F5",
                    border: "none", padding: "10px 18px", borderRadius: 10,
                    fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
                  }}>📍 Punch In Now</button>
                )}
                {punchedIn && !punchedOut && (
                  <button onClick={openPunchOut} style={{
                    background: "linear-gradient(135deg,#FF9500,#E07800)", color: "#fff",
                    border: "none", padding: "10px 18px", borderRadius: 10,
                    fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
                  }}>🏁 Punch Out</button>
                )}
              </div>
            </div>
          </div>

          {/* Warning if not punched in */}
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
        </Card>
      )}

      {/* ══════════════════ SECTION 2: PROGRESS UPDATE ══════════════════ */}
      {step === 2 && (
        <Card style={{ padding: "26px", animation: "fadeUp 0.35s ease" }}>
          <SectionHead icon={<TrendingUp size={16} color="#BDE8F5" />} title="Progress Update" subtitle="Log items installed / work completed today" />

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {entries.map((entry, idx) => (
              <div key={entry.id} style={{
                background: "rgba(73,136,196,0.04)", border: "1px solid rgba(73,136,196,0.12)",
                borderRadius: 12, padding: "16px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ color: "#1C4D8D", fontSize: 12, fontWeight: 700 }}>Entry #{idx + 1}</span>
                  {entries.length > 1 && (
                    <button onClick={() => removeEntry(entry.id)} style={{
                      background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.2)",
                      color: "#FF3B30", borderRadius: 7, padding: "4px 10px",
                      fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit",
                    }}>
                      <Trash2 size={11} /> Remove
                    </button>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 70px", gap: 12, marginBottom: 10 }}>
                  <div>
                    <Label required>Project</Label>
                    <select style={{ ...inputStyle, cursor: "pointer" }}
                      value={entry.project} onChange={e => updateEntry(entry.id, "project", e.target.value)}>
                      <option value="">Select project</option>
                      {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label required>Item / Component</Label>
                    <select style={{ ...inputStyle, cursor: "pointer" }}
                      value={entry.item} onChange={e => updateEntry(entry.id, "item", e.target.value)}>
                      <option value="">Select item</option>
                      {(ITEMS_BY_PROJECT[entry.project] || []).map(it => <option key={it}>{it}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label required>Qty</Label>
                    <input type="number" min={0} style={inputStyle} placeholder="0"
                      value={entry.qty} onChange={e => updateEntry(entry.id, "qty", e.target.value)} />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <select style={{ ...inputStyle, cursor: "pointer" }}
                      value={entry.unit} onChange={e => updateEntry(entry.id, "unit", e.target.value)}>
                      {["pcs", "m", "m²", "kg", "set", "lot"].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Notes / Remarks</Label>
                  <input style={inputStyle} placeholder="Brief note on this entry…"
                    value={entry.notes} onChange={e => updateEntry(entry.id, "notes", e.target.value)} />
                </div>
              </div>
            ))}

            <button onClick={addEntry} style={{
              background: "rgba(73,136,196,0.07)", border: "1.5px dashed rgba(73,136,196,0.35)",
              color: "#1C4D8D", borderRadius: 11, padding: "11px",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit",
            }}>
              <Plus size={15} /> Add Another Entry
            </button>
          </div>

          <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => setStep(1)} style={{
              background: "transparent", border: "1px solid rgba(73,136,196,0.3)",
              color: "#4988C4", padding: "11px 20px", borderRadius: 10,
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>← Back</button>
            <SubmitBtn onClick={() => setStep(3)}>Continue to Issues →</SubmitBtn>
          </div>
        </Card>
      )}

      {/* ══════════════════ SECTION 3: ISSUES ENCOUNTERED ══════════════ */}
      {step === 3 && (
        <Card style={{ padding: "26px", animation: "fadeUp 0.35s ease" }}>
          <SectionHead icon={<AlertCircle size={16} color="#BDE8F5" />} title="Issues Encountered" subtitle="Log any problems found on site today" />

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {issues.map((issue, idx) => (
              <div key={issue.id} style={{
                background: issue.severity === "Blocking" ? "rgba(155,28,28,0.04)" : "rgba(73,136,196,0.04)",
                border: `1px solid ${issue.severity === "Blocking" ? "rgba(155,28,28,0.2)" : "rgba(73,136,196,0.12)"}`,
                borderRadius: 12, padding: "16px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ color: "#1C4D8D", fontSize: 12, fontWeight: 700 }}>Issue #{idx + 1}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {ISSUE_SEVERITIES.map(s => (
                      <button key={s} onClick={() => updateIssue(issue.id, "severity", s)} style={{
                        padding: "3px 10px", borderRadius: 99, border: "none", cursor: "pointer",
                        background: issue.severity === s ? sevColor[s] : "rgba(0,0,0,0.06)",
                        color: issue.severity === s ? "#fff" : "#888",
                        fontSize: 11, fontWeight: 700, fontFamily: "inherit",
                      }}>{s}</button>
                    ))}
                    {issues.length > 1 && (
                      <button onClick={() => removeIssue(issue.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#FF3B30", padding: "2px 4px" }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <Label required>Issue Description</Label>
                  <textarea style={{ ...inputStyle, minHeight: 72, resize: "vertical" }}
                    placeholder="Describe the problem encountered today…"
                    value={issue.description} onChange={e => updateIssue(issue.id, "description", e.target.value)} />
                </div>

                <div style={{ marginTop: 10 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input type="checkbox" checked={issue.blocksWork}
                      onChange={e => updateIssue(issue.id, "blocksWork", e.target.checked)} />
                    <span style={{ color: "#FF3B30", fontSize: 12, fontWeight: 600 }}>⛔ This issue is blocking work progress</span>
                  </label>
                </div>
              </div>
            ))}

            <button onClick={addIssue} style={{
              background: "rgba(255,149,0,0.06)", border: "1.5px dashed rgba(255,149,0,0.35)",
              color: "#FF9500", borderRadius: 11, padding: "11px",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit",
            }}>
              <Plus size={15} /> Add Another Issue
            </button>
          </div>

          {/* Summary */}
          <div style={{
            marginTop: 20, background: "rgba(189,232,245,0.1)",
            border: "1px solid rgba(73,136,196,0.15)", borderRadius: 11, padding: "14px 16px",
          }}>
            <div style={{ color: "#0F2854", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Report Summary</div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[
                ["Punch In",  formatTime(punchInData)  || "Not set"],
                ["Punch Out", formatTime(punchOutData) || "Not set"],
                ["Entries",   entries.filter(e => e.project).length + " items"],
                ["Issues",    issues.filter(i => i.description).length + " logged"],
                ["Date",      new Date().toLocaleDateString("en-GB")],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ color: "#4988C4", fontSize: 10, fontWeight: 600 }}>{k.toUpperCase()}</div>
                  <div style={{ color: "#0F2854", fontSize: 13, fontWeight: 700 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => setStep(2)} style={{
              background: "transparent", border: "1px solid rgba(73,136,196,0.3)",
              color: "#4988C4", padding: "11px 20px", borderRadius: 10,
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>← Back</button>
            <SubmitBtn loading={loading} color="green" onClick={handleSubmit}>
              ✓ Submit Daily Report
            </SubmitBtn>
          </div>
        </Card>
      )}

      {/* ── Punch Modal ────────────────────────────────────────────────────── */}
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