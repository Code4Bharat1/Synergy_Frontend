"use client";
import { useState, useEffect, useRef } from "react";

export default function PunchModal({ type = "in", onClose, onSubmit }) {
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

  // tick every second
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // geo-location
  useEffect(() => { fetchLocation(); }, []);

  // camera
  useEffect(() => {
    openCamera();
    return () => stopStream();
  }, []);

  // wire stream to video element once both are ready
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  const stopStream = () => {
    setCameraStream(prev => {
      prev?.getTracks().forEach(t => t.stop());
      return null;
    });
  };

  const fetchLocation = () => {
    setLoadingLocation(true);
    if (!navigator.geolocation) {
      setFormData(p => ({ ...p, location: "Geolocation not supported" }));
      setLoadingLocation(false);
      return;
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
      () => {
        setFormData(p => ({ ...p, location: "Location unavailable" }));
        setLoadingLocation(false);
      }
    );
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setCameraStream(stream);
      setCameraError(false);
    } catch {
      setCameraError(true);
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width  = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0, c.width, c.height);
    const photo = c.toDataURL("image/jpeg", 0.9);
    setFormData(p => ({ ...p, photo }));
    setShowCamera(false);
    stopStream();
  };

  const retakePhoto = () => {
    setFormData(p => ({ ...p, photo: null }));
    setShowCamera(true);
    openCamera();
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    onSubmit({
      ...formData,
      timestamp: new Date(),
      coords: currentLocation,
    });
    setIsSubmitting(false);
  };

  // ── overlay backdrop ──────────────────────────────────────────────────────
  const S = {
    overlay: {
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(10,20,48,0.7)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
    },
    modal: {
      background: "#fff", borderRadius: 24, overflow: "hidden",
      width: "100%", maxWidth: 380,
      boxShadow: "0 32px 80px rgba(10,20,48,0.45)",
      display: "flex", flexDirection: "column",
    },
    header: {
      background: "linear-gradient(135deg, #0F2854 0%, #1C4D8D 100%)",
      padding: "14px 18px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
    },
    closeBtn: {
      width: 30, height: 30, borderRadius: "50%",
      background: "rgba(189,232,245,0.12)", border: "none",
      color: "#BDE8F5", fontSize: 16, cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
    },
    cameraBg: {
      position: "relative", background: "#000",
      aspectRatio: "3/4", overflow: "hidden",
    },
    locBadge: {
      position: "absolute", top: 12, left: 12, right: 12,
      background: "rgba(10,20,48,0.65)", backdropFilter: "blur(8px)",
      borderRadius: 12, padding: "8px 12px",
      display: "flex", alignItems: "flex-start", gap: 8,
    },
    bottomBar: {
      position: "absolute", bottom: 0, left: 0, right: 0,
      padding: "20px 20px 24px",
      background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
    },
    captureRing: {
      width: 70, height: 70, borderRadius: "50%",
      background: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", border: "none",
      boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
    },
    captureInner: {
      width: 58, height: 58, borderRadius: "50%",
      background: "linear-gradient(135deg, #4988C4, #0F2854)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 24, border: "none", cursor: "pointer",
    },
    photoActionsRow: {
      display: "flex", gap: 10,
    },
    retakeBtn: {
      flex: 1, padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 700,
      background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)",
      border: "1px solid rgba(255,255,255,0.25)", color: "#fff", cursor: "pointer",
    },
    confirmBtn: (loading) => ({
      flex: 1, padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 700,
      background: loading
        ? "rgba(73,136,196,0.7)"
        : "linear-gradient(135deg, #4988C4, #0F2854)",
      border: "none", color: "#fff", cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    }),
    notesArea: {
      padding: "14px 18px", borderTop: "1px solid rgba(73,136,196,0.12)",
    },
    textarea: {
      width: "100%", border: "1px solid rgba(73,136,196,0.25)", borderRadius: 10,
      padding: "9px 12px", fontSize: 12, color: "#0F2854", resize: "none",
      fontFamily: "inherit", outline: "none", background: "rgba(189,232,245,0.06)",
      boxSizing: "border-box",
    },
  };

  const isIn = type === "in";

  return (
    <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={S.modal}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={S.header}>
          <div>
            <div style={{ color: "#BDE8F5", fontSize: 15, fontWeight: 700 }}>
              {isIn ? "📍 Punch In" : "📍 Punch Out"}
            </div>
            <div style={{ color: "rgba(189,232,245,0.6)", fontSize: 12, marginTop: 2 }}>
              {currentTime.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
              &nbsp;·&nbsp;
              {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
          </div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* ── Camera / Photo area ─────────────────────────────────────────── */}
        <div style={S.cameraBg}>

          {/* live viewfinder or captured photo */}
          {showCamera && !cameraError ? (
            <video
              ref={videoRef}
              autoPlay playsInline muted
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
            />
          ) : formData.photo ? (
            <img src={formData.photo} alt="captured" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            /* camera denied fallback */
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, background: "#111" }}>
              <div style={{ fontSize: 42 }}>📷</div>
              <div style={{ color: "#BDE8F5", fontSize: 13, textAlign: "center", padding: "0 20px" }}>Camera access denied.<br />Please allow camera to continue.</div>
              <button onClick={openCamera} style={{ background: "#1C4D8D", color: "#BDE8F5", border: "none", padding: "8px 18px", borderRadius: 8, fontSize: 12, cursor: "pointer", marginTop: 6 }}>
                Retry Camera
              </button>
            </div>
          )}

          {/* location badge */}
          <div style={S.locBadge}>
            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>📍</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              {loadingLocation ? (
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
                  Detecting location…
                </div>
              ) : (
                <div style={{ color: "#fff", fontSize: 11, lineHeight: 1.4,
                  overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {formData.location}
                </div>
              )}
            </div>
            <button onClick={fetchLocation} title="Refresh location" style={{
              background: "none", border: "none", color: "rgba(189,232,245,0.7)",
              fontSize: 14, cursor: "pointer", flexShrink: 0, padding: 0,
            }}>↺</button>
          </div>

          {/* bottom action bar */}
          <div style={S.bottomBar}>
            {showCamera && !cameraError ? (
              /* Capture row */
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 13, cursor: "pointer", padding: "8px 4px" }}>
                  Cancel
                </button>
                <button style={S.captureRing} onClick={capturePhoto}>
                  <div style={S.captureInner}>📷</div>
                </button>
                <div style={{ width: 60 }} />
              </div>
            ) : formData.photo ? (
              /* Retake / Confirm row */
              <div style={S.photoActionsRow}>
                <button style={S.retakeBtn} onClick={retakePhoto}>↩ Retake</button>
                <button style={S.confirmBtn(isSubmitting)} onClick={handleConfirm} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><span style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}>⟳</span> Submitting…</>
                  ) : (
                    <><span>✓</span> Confirm {isIn ? "Punch In" : "Punch Out"}</>
                  )}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* ── Notes ──────────────────────────────────────────────────────── */}
        {!showCamera && formData.photo && (
          <div style={S.notesArea}>
            <div style={{ color: "#1C4D8D", fontSize: 10, fontWeight: 600, letterSpacing: 0.5, marginBottom: 6 }}>
              NOTES (OPTIONAL)
            </div>
            <textarea
              rows={2}
              style={S.textarea}
              placeholder="Add any notes for this attendance record…"
              value={formData.notes}
              onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
            />
          </div>
        )}

        {/* spin keyframe */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}