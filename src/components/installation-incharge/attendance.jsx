"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ── Office Location Config ────────────────────────────────────────────────────
const OFFICE_COORDS = { lat: 19.07285143363228, lng: 72.88041850211928 };

// const OFFICE_COORDS = { lat:19.288560434069254,lng:  72.86484411123294}; // Different coords
const ALLOWED_RADIUS_METERS = 200;

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

// ── Axios instance ────────────────────────────────────────────────────────────
const axiosInstance = axios.create({ baseURL: API_BASE });

// Request interceptor — attach Bearer token on every request
axiosInstance.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — redirect to /login on 401, surface backend message
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") window.location.href = "/login";
      return Promise.reject(
        new Error("Session expired. Redirecting to login…"),
      );
    }
    const message =
      error.response?.data?.message || error.message || "Something went wrong";
    return Promise.reject(new Error(message));
  },
);

// ── API Client ────────────────────────────────────────────────────────────────
const api = {
  async punchIn(location, notes) {
    const { data } = await axiosInstance.post("/attendance/punch-in", {
      location,
      notes,
    });
    return data.attendance;
  },

  async punchOut() {
    const { data } = await axiosInstance.post("/attendance/punch-out");
    return data.attendance;
  },

  async getMyAttendance() {
    const { data } = await axiosInstance.get("/attendance/me");
    return Array.isArray(data) ? data : data.records || [];
  },

  async getAllAttendance() {
    const { data } = await axiosInstance.get("/attendance/all");
    return Array.isArray(data) ? data : data.records || [];
  },
};

// Normalise backend record → UI session shape
function normalise(rec) {
  const punchIn =
    rec.punchInTime ||
    rec.punchIn ||
    rec.checkIn ||
    rec.clockIn ||
    rec.startTime;
  const punchOut =
    rec.punchOutTime ||
    rec.punchOut ||
    rec.checkOut ||
    rec.clockOut ||
    rec.endTime;
  return {
    id: rec._id || rec.id,
    userId: rec.userId || rec.user || null,
    userName: rec.userName || rec.name || rec.email || null,
    in: punchIn ? { timestamp: punchIn, location: rec.location || "" } : null,
    out: punchOut
      ? { timestamp: punchOut, location: rec.location || "" }
      : null,
    notes: rec.notes || "",
  };
}

// ── Haversine distance helper ─────────────────────────────────────────────────
function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Colour tokens ─────────────────────────────────────────────────────────────
const C = {
  darkBlue: "#0F2854",
  blue: "#1C4D8D",
  medBlue: "#4988C4",
  lightBlue: "#BDE8F5",
  bg: "#f0f6fb",
  mutedText: "#6b89a5",
  dimText: "#8fa3b8",
  white: "#ffffff",
  divider: "#e3eff8",
  green: "#34C759",
  orange: "#E07800",
  red: "#FF3B30",
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const ClockIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className="w-4 h-4 flex-shrink-0"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const MapPinIcon = ({ cls = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className={`${cls} flex-shrink-0`}
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const CameraIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className="w-6 h-6"
  >
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);
const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    className="w-4 h-4"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const UserIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className="w-4 h-4 flex-shrink-0"
  >
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const CalendarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className="w-4 h-4 flex-shrink-0"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const RefreshIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className="w-3.5 h-3.5"
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
  </svg>
);
const UsersIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className="w-4 h-4 flex-shrink-0"
  >
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);
const NoteIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className="w-3.5 h-3.5 flex-shrink-0"
  >
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

// ── Live Clock ────────────────────────────────────────────────────────────────
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
        style={{ color: C.darkBlue, fontSize: "clamp(26px,7vw,46px)" }}
      >
        {time.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </div>
      <div
        className="text-xs font-semibold mt-1.5"
        style={{ color: C.mutedText }}
      >
        {time.toLocaleDateString("en-US", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, [onDismiss]);
  const bg = type === "error" ? C.red : type === "success" ? C.green : C.blue;
  return (
    <div
      className="fixed bottom-6 left-1/2 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-white text-sm font-semibold"
      style={{
        backgroundColor: bg,
        transform: "translateX(-50%)",
        maxWidth: "90vw",
      }}
    >
      <span>{type === "error" ? "⚠" : "✓"}</span>
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="ml-2 opacity-70 hover:opacity-100 text-xs"
      >
        ✕
      </button>
    </div>
  );
}

// ── Camera Modal (with Notes field) ──────────────────────────────────────────
// coords prop: { lat, lng } already resolved by parent — skips its own geo fetch
function CameraModal({ type, onClose, onSubmit, loading, coords }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState("Fetching location…");
  const [camError, setCamError] = useState(false);
  const [camErrMsg, setCamErrMsg] = useState("Camera unavailable");
  const [step, setStep] = useState("capture");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    // Use parent-resolved coords if available, else fall back to one-shot geo
    if (coords) {
      setLocation(`${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E`);
    } else {
      navigator.geolocation?.getCurrentPosition(
        (pos) =>
          setLocation(
            `${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`,
          ),
        () => setLocation("Location unavailable"),
      );
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCamError(true);
      setCamErrMsg("Camera not supported in this browser.");
      return;
    }
    const tryCamera = (constraints) =>
      navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          const videoTracks = stream.getVideoTracks();
          if (!videoTracks.length || videoTracks[0].readyState === "ended") {
            setCamError(true);
            setCamErrMsg("No active camera feed detected.");
          }
        }
      });

    tryCamera({ video: true, audio: false })
      .catch(() => tryCamera({ video: { facingMode: "user" }, audio: false }))
      .catch((err) => {
        setCamError(true);
        if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError")
          setCamErrMsg("No camera found on this device.");
        else if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        )
          setCamErrMsg("Camera access denied. Allow it in browser settings.");
        else if (err.name === "NotReadableError")
          setCamErrMsg("Camera is in use by another app.");
        else setCamErrMsg(`Camera error: ${err.message}`);
      });

    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, [coords]);

  const takePhoto = () => {
    const v = videoRef.current,
      c = canvasRef.current;
    c.width = v.videoWidth || 640;
    c.height = v.videoHeight || 480;
    c.getContext("2d").drawImage(v, 0, 0);
    setPhoto(c.toDataURL("image/jpeg", 0.85));
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setStep("confirm");
  };

  const retake = () => {
    setPhoto(null);
    setStep("capture");
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
  };

  const isIn = type === "in";
  const accent = isIn ? C.darkBlue : C.orange;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{
        backgroundColor: "rgba(15,40,84,0.6)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div
        className="w-full sm:w-[420px] rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ backgroundColor: C.white, maxHeight: "90dvh" }}
      >
        {/* Drag pill */}
        <div className="flex justify-center pt-2.5 pb-0.5 sm:hidden">
          <div
            className="w-9 h-1 rounded-full"
            style={{ backgroundColor: C.divider }}
          />
        </div>
        {/* Header */}
        <div
          className="px-5 py-3.5 flex items-center justify-between"
          style={{ backgroundColor: accent }}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white opacity-70">
              {isIn ? "Punch In" : "Punch Out"}
            </p>
            <h3 className="text-sm font-bold text-white mt-0.5">
              {step === "capture" ? "Take a Selfie" : "Confirm & Submit"}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm"
            style={{
              backgroundColor: "rgba(255,255,255,0.18)",
              opacity: loading ? 0.4 : 0.8,
            }}
          >
            ✕
          </button>
        </div>
        {/* Camera viewport — fixed height, never taller than 280px */}
        <div
          className="relative bg-black w-full flex-shrink-0"
          style={{ height: "clamp(200px, 40vw, 280px)" }}
        >
          {camError ? (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6"
              style={{ backgroundColor: C.bg }}
            >
              <span style={{ color: C.medBlue }}>
                <CameraIcon />
              </span>
              <p
                className="text-xs font-semibold text-center"
                style={{ color: C.mutedText }}
              >
                {camErrMsg}
              </p>
              <button
                onClick={() => {
                  setStep("confirm");
                  setPhoto(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white"
                style={{ backgroundColor: accent }}
              >
                Skip Photo & Continue →
              </button>
            </div>
          ) : step === "capture" ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
          ) : photo ? (
            <img
              src={photo}
              alt="selfie"
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
          ) : (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2"
              style={{ backgroundColor: C.bg }}
            >
              <span className="text-4xl">👤</span>
              <p
                className="text-xs font-semibold"
                style={{ color: C.mutedText }}
              >
                No photo captured
              </p>
            </div>
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
        {/* Scrollable bottom — location + notes + buttons always reachable */}
        <div className="overflow-y-auto">
          <div
            className="px-4 py-2.5 flex items-center gap-2"
            style={{
              backgroundColor: C.bg,
              borderBottom: `1px solid ${C.divider}`,
            }}
          >
            <span style={{ color: C.medBlue }}>
              <MapPinIcon />
            </span>
            <span
              className="text-xs font-medium truncate"
              style={{ color: C.mutedText }}
            >
              {location}
            </span>
          </div>

          {step === "confirm" && (
            <div className="px-4 pt-3 pb-0">
              <label
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-1.5"
                style={{ color: C.mutedText }}
              >
                <NoteIcon /> Notes{" "}
                <span
                  className="font-normal normal-case tracking-normal"
                  style={{ color: C.dimText }}
                >
                  (optional)
                </span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  isIn
                    ? "e.g. Starting site inspection…"
                    : "e.g. Completed all tasks for today."
                }
                rows={2}
                maxLength={300}
                disabled={loading}
                className="w-full text-sm rounded-xl px-3 py-2 resize-none outline-none disabled:opacity-50"
                style={{
                  border: `1.5px solid ${C.divider}`,
                  color: C.darkBlue,
                  backgroundColor: C.bg,
                  fontFamily: "inherit",
                }}
              />
              <p
                className="text-right text-[10px] mt-0.5"
                style={{ color: C.dimText }}
              >
                {notes.length}/300
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="px-4 py-4 flex gap-3">
            {step === "capture" ? (
              <>
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold border"
                  style={{
                    borderColor: C.divider,
                    color: C.mutedText,
                    backgroundColor: C.white,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setStep("confirm");
                    setPhoto(null);
                  }}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold border disabled:opacity-40"
                  style={{
                    borderColor: C.divider,
                    color: C.mutedText,
                    backgroundColor: C.white,
                  }}
                >
                  Skip Photo
                </button>
                <button
                  onClick={takePhoto}
                  disabled={camError || loading}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                  style={{ backgroundColor: accent }}
                >
                  📷 Capture
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={retake}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold border disabled:opacity-40"
                  style={{
                    borderColor: C.divider,
                    color: C.mutedText,
                    backgroundColor: C.white,
                  }}
                >
                  Retake
                </button>
                <button
                  onClick={() =>
                    onSubmit({
                      photo,
                      location,
                      notes: notes.trim(),
                      timestamp: new Date().toISOString(),
                    })
                  }
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ backgroundColor: accent }}
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "✓ Confirm"
                  )}
                </button>
              </>
            )}
          </div>
        </div>{" "}
        {/* end scrollable */}
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Ic, barColor, valueColor }) {
  return (
    <div
      className="relative bg-white rounded-xl overflow-hidden shadow-sm flex flex-col gap-1.5"
      style={{ border: `1px solid ${C.lightBlue}`, padding: "10px 12px 12px" }}
    >
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ backgroundColor: barColor }}
      />
      <div className="flex items-center gap-1.5">
        <span style={{ color: barColor }}>
          <Ic />
        </span>
        <span
          className="font-semibold uppercase tracking-wider leading-tight"
          style={{ color: C.dimText, fontSize: "clamp(9px,2.5vw,11px)" }}
        >
          {label}
        </span>
      </div>
      <div
        className="font-bold leading-tight truncate"
        style={{
          color: valueColor || C.darkBlue,
          fontSize: "clamp(15px,4.5vw,22px)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ── Desktop Log Row (my sessions) ─────────────────────────────────────────────
function LogRow({ entry, idx }) {
  const [hov, setHov] = useState(false);
  const dur = () => {
    if (!entry.out) return "Ongoing";
    const ms = new Date(entry.out.timestamp) - new Date(entry.in.timestamp);
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  };
  const fmt = (d) =>
    d
      ? new Date(d.timestamp).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

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
      <td
        className="px-4 py-3 text-sm font-medium whitespace-nowrap"
        style={{ color: C.darkBlue }}
      >
        {fmt(entry.in)}
      </td>
      <td
        className="px-4 py-3 text-sm whitespace-nowrap"
        style={{ color: C.darkBlue }}
      >
        {entry.out ? (
          fmt(entry.out)
        ) : (
          <span className="text-xs font-bold" style={{ color: C.orange }}>
            Active
          </span>
        )}
      </td>
      <td
        className="px-4 py-3 text-sm whitespace-nowrap"
        style={{ color: C.mutedText }}
      >
        {dur()}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
          style={
            entry.out
              ? { backgroundColor: C.lightBlue, color: C.darkBlue }
              : { backgroundColor: "#fff3e0", color: C.orange }
          }
        >
          {entry.out ? "Completed" : "In Progress"}
        </span>
      </td>
      <td
        className="px-4 py-3 text-xs"
        style={{ color: C.dimText, maxWidth: 140 }}
      >
        <span className="block truncate">{entry.in?.location || "—"}</span>
      </td>
      <td
        className="px-4 py-3 text-xs"
        style={{ color: C.dimText, maxWidth: 160 }}
      >
        {entry.notes ? (
          <span className="block truncate" title={entry.notes}>
            {entry.notes}
          </span>
        ) : (
          <span style={{ color: C.divider }}>—</span>
        )}
      </td>
    </tr>
  );
}

// ── Mobile Log Card ───────────────────────────────────────────────────────────
function MobileLogCard({ entry, idx }) {
  const dur = () => {
    if (!entry.out) return "Ongoing";
    const ms = new Date(entry.out.timestamp) - new Date(entry.in.timestamp);
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  };
  const fmt = (d) =>
    d
      ? new Date(d.timestamp).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  return (
    <div
      className="px-4 py-3 flex items-start gap-3"
      style={{ borderBottom: `1px solid ${C.divider}` }}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
        style={{ backgroundColor: C.bg, color: C.blue }}
      >
        {String(idx + 1).padStart(2, "0")}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: C.green }}
            >
              IN
            </span>
            <span
              className="text-sm font-semibold"
              style={{ color: C.darkBlue }}
            >
              {fmt(entry.in)}
            </span>
          </div>
          {entry.out && (
            <>
              <span style={{ color: C.dimText }}>→</span>
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: C.orange }}
                >
                  OUT
                </span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: C.darkBlue }}
                >
                  {fmt(entry.out)}
                </span>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-xs" style={{ color: C.mutedText }}>
            {dur()}
          </span>
          {entry.in?.location && (
            <>
              <span className="text-xs" style={{ color: C.divider }}>
                ·
              </span>
              <div className="flex items-center gap-1 min-w-0">
                <MapPinIcon cls="w-3 h-3" />
                <span
                  className="text-xs truncate"
                  style={{ color: C.dimText, maxWidth: 140 }}
                >
                  {entry.in.location}
                </span>
              </div>
            </>
          )}
        </div>
        {entry.notes && (
          <div className="flex items-start gap-1 mt-1 min-w-0">
            <span style={{ color: C.medBlue, marginTop: 1 }}>
              <NoteIcon />
            </span>
            <span className="text-xs" style={{ color: C.dimText }}>
              {entry.notes}
            </span>
          </div>
        )}
      </div>
      <span
        className="text-[11px] font-semibold px-2 py-0.5 rounded flex-shrink-0 mt-0.5"
        style={
          entry.out
            ? { backgroundColor: C.lightBlue, color: C.darkBlue }
            : { backgroundColor: "#fff3e0", color: C.orange }
        }
      >
        {entry.out ? "Done" : "Active"}
      </span>
    </div>
  );
}

// ── Admin Row (all-staff table) ───────────────────────────────────────────────
function AdminRow({ entry, idx }) {
  const [hov, setHov] = useState(false);
  const dur = () => {
    if (!entry.out) return "Ongoing";
    const ms = new Date(entry.out.timestamp) - new Date(entry.in.timestamp);
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  };
  const fmt = (d) =>
    d
      ? new Date(d.timestamp).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";
  const fmtDate = (d) =>
    d
      ? new Date(d.timestamp).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
        })
      : "—";

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
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
            style={{ backgroundColor: C.blue }}
          >
            {(entry.userName || "?")[0].toUpperCase()}
          </div>
          <span
            className="text-sm font-medium truncate"
            style={{ color: C.darkBlue, maxWidth: 120 }}
          >
            {entry.userName || entry.userId || "Unknown"}
          </span>
        </div>
      </td>
      <td
        className="px-4 py-3 text-xs whitespace-nowrap"
        style={{ color: C.mutedText }}
      >
        {fmtDate(entry.in)}
      </td>
      <td
        className="px-4 py-3 text-sm whitespace-nowrap"
        style={{ color: C.darkBlue }}
      >
        {fmt(entry.in)}
      </td>
      <td
        className="px-4 py-3 text-sm whitespace-nowrap"
        style={{ color: C.darkBlue }}
      >
        {entry.out ? (
          fmt(entry.out)
        ) : (
          <span className="text-xs font-bold" style={{ color: C.orange }}>
            Active
          </span>
        )}
      </td>
      <td
        className="px-4 py-3 text-sm whitespace-nowrap"
        style={{ color: C.mutedText }}
      >
        {dur()}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
          style={
            entry.out
              ? { backgroundColor: C.lightBlue, color: C.darkBlue }
              : { backgroundColor: "#fff3e0", color: C.orange }
          }
        >
          {entry.out ? "Completed" : "Active"}
        </span>
      </td>
      <td
        className="px-4 py-3 text-xs"
        style={{ color: C.dimText, maxWidth: 160 }}
      >
        {entry.notes ? (
          <span className="block truncate" title={entry.notes}>
            {entry.notes}
          </span>
        ) : (
          <span style={{ color: C.divider }}>—</span>
        )}
      </td>
    </tr>
  );
}

// ── Admin Mobile Card ─────────────────────────────────────────────────────────
function AdminMobileCard({ entry, idx }) {
  const dur = () => {
    if (!entry.out) return "Ongoing";
    const ms = new Date(entry.out.timestamp) - new Date(entry.in.timestamp);
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  };
  const fmt = (d) =>
    d
      ? new Date(d.timestamp).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";
  const fmtDate = (d) =>
    d
      ? new Date(d.timestamp).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
        })
      : "—";

  return (
    <div
      className="px-4 py-3 flex items-start gap-3"
      style={{ borderBottom: `1px solid ${C.divider}` }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={{ backgroundColor: C.blue }}
      >
        {(entry.userName || "?")[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-sm font-semibold truncate"
            style={{ color: C.darkBlue }}
          >
            {entry.userName || entry.userId || "Unknown"}
          </span>
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded flex-shrink-0"
            style={
              entry.out
                ? { backgroundColor: C.lightBlue, color: C.darkBlue }
                : { backgroundColor: "#fff3e0", color: C.orange }
            }
          >
            {entry.out ? "Done" : "Active"}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[10px]" style={{ color: C.dimText }}>
            {fmtDate(entry.in)}
          </span>
          <span className="text-xs font-medium" style={{ color: C.green }}>
            {fmt(entry.in)}
          </span>
          {entry.out && (
            <>
              <span style={{ color: C.dimText }}>→</span>
              <span className="text-xs font-medium" style={{ color: C.orange }}>
                {fmt(entry.out)}
              </span>
            </>
          )}
          <span className="text-xs" style={{ color: C.mutedText }}>
            · {dur()}
          </span>
        </div>
        {entry.notes && (
          <div className="flex items-start gap-1 mt-0.5">
            <span style={{ color: C.medBlue, marginTop: 1 }}>
              <NoteIcon />
            </span>
            <span className="text-xs" style={{ color: C.dimText }}>
              {entry.notes}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const [modal, setModal] = useState(null); // null | "in" | "out"
  const [sessions, setSessions] = useState([]);
  const [allRecords, setAllRecords] = useState([]); // admin view
  const [loading, setLoading] = useState(false); // punch API in-flight
  const [fetching, setFetching] = useState(true);
  const [adminFetch, setAdminFetch] = useState(false);
  const [animPulse, setAnimPulse] = useState(false);
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState("my"); // "my" | "all"
  const [isAdmin, setIsAdmin] = useState(false);

  // ── Geofence state ────────────────────────────────────────────────────────
  // "fetching" | "allowed" | "too-far" | "denied"
  const [geoStatus, setGeoStatus] = useState("fetching");
  const [distanceAway, setDistanceAway] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const watchIdRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  // Read role from the 'user' object stored by your auth service
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.role === "admin" || user.role === "director") setIsAdmin(true);
    } catch {
      /* ignore */
    }
  }, []);

  // ── Live geo watcher — updates distance continuously ─────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus("denied");
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        const dist = getDistanceMeters(
          latitude,
          longitude,
          OFFICE_COORDS.lat,
          OFFICE_COORDS.lng,
        );
        setDistanceAway(Math.round(dist));
        setGeoStatus(dist <= ALLOWED_RADIUS_METERS ? "allowed" : "too-far");
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: true, maximumAge: 10000 },
    );
    return () => navigator.geolocation.clearWatch(watchIdRef.current);
  }, []);

  // ── Load my sessions ──────────────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    setFetching(true);
    try {
      const records = await api.getMyAttendance();
      const todayStr = new Date().toDateString();
      const today = records.filter((r) => {
        const ts =
          r.punchInTime ||
          r.punchIn ||
          r.checkIn ||
          r.clockIn ||
          r.startTime ||
          r.date;
        return ts && new Date(ts).toDateString() === todayStr;
      });
      setSessions(today?.map(normalise));
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setFetching(false);
    }
  }, [showToast]);

  // ── Load all attendance (admin) ───────────────────────────────────────────
  const loadAllAttendance = useCallback(async () => {
    setAdminFetch(true);
    try {
      const records = await api.getAllAttendance();
      setAllRecords(records?.map(normalise));
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setAdminFetch(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Load all records when admin switches to "all" tab
  useEffect(() => {
    if (tab === "all" && isAdmin && allRecords.length === 0) {
      loadAllAttendance();
    }
  }, [tab, isAdmin, allRecords.length, loadAllAttendance]);

  // ── Punch In / Out ────────────────────────────────────────────────────────
  const handlePunch = async ({ location, notes }) => {
    setLoading(true);
    try {
      if (modal === "in") {
        const record = await api.punchIn(location, notes);
        setSessions((prev) => [...prev, normalise(record)]);
        showToast("Punched in successfully!");
      } else {
        const record = await api.punchOut();
        const updated = normalise(record);
        setSessions((prev) =>
          prev?.map((s) => (!s.out || s.id === updated.id ? updated : s)),
        );
        showToast("Punched out successfully!");
      }
      setModal(null);
      setAnimPulse(true);
      setTimeout(() => setAnimPulse(false), 700);
    } catch (err) {
      showToast(err.message, "error");
      if (err.message?.toLowerCase().includes("already")) {
        setModal(null);
        loadSessions();
      }
    } finally {
      setLoading(false);
    }
  };

  const activeSession = sessions.find((s) => !s.out) || null;
  const isPunchedIn = !!activeSession;
  const totalSessions = sessions.length;
  const totalHours = sessions
    .reduce((acc, s) => {
      if (!s.out) return acc;
      return (
        acc + (new Date(s.out.timestamp) - new Date(s.in.timestamp)) / 3600000
      );
    }, 0)
    .toFixed(1);

  const fmt = (d) =>
    d
      ? new Date(d.timestamp).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  const today = new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Both punch-in and punch-out require being within the geofence
  const geoBlocked = geoStatus !== "allowed";

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      <main className="p-3 sm:p-4 md:p-5 space-y-4 max-w-2xl mx-auto">
        {/* Heading + refresh */}
        <div className="flex items-start justify-between">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: C.medBlue }}
            >
              {today} · Field Attendance
            </p>
            <h1
              className="text-xl font-bold mt-0.5"
              style={{ color: C.darkBlue }}
            >
              Attendance
            </h1>
          </div>
          <button
            onClick={tab === "my" ? loadSessions : loadAllAttendance}
            disabled={fetching || adminFetch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border disabled:opacity-50"
            style={{
              borderColor: C.divider,
              color: C.mutedText,
              backgroundColor: C.white,
            }}
            title="Refresh from server"
          >
            <span className={fetching || adminFetch ? "animate-spin" : ""}>
              <RefreshIcon />
            </span>
            {fetching || adminFetch ? "Loading…" : "Refresh"}
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <StatCard
            label="Sessions"
            value={String(totalSessions)}
            icon={CalendarIcon}
            barColor={C.darkBlue}
          />
          <StatCard
            label="Hours"
            value={`${totalHours}h`}
            icon={ClockIcon}
            barColor={C.blue}
          />
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
            <div
              className="my-4"
              style={{ borderTop: `1px solid ${C.divider}` }}
            />

            {isPunchedIn && (
              <div
                className="mb-4 p-3 rounded-xl flex flex-wrap items-center gap-3"
                style={{
                  backgroundColor: "rgba(52,199,89,0.05)",
                  border: "1px solid rgba(52,199,89,0.2)",
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: C.green }}
                    >
                      ● Punched In
                    </span>
                    <span
                      className="text-sm font-bold"
                      style={{ color: C.darkBlue }}
                    >
                      {fmt(activeSession.in)}
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-1.5 mt-0.5"
                    style={{ color: C.mutedText }}
                  >
                    <MapPinIcon cls="w-3 h-3" />
                    <span className="text-xs truncate">
                      {activeSession.in?.location || "Location captured"}
                    </span>
                  </div>
                  {activeSession.notes && (
                    <div className="flex items-start gap-1.5 mt-1">
                      <span style={{ color: C.medBlue, marginTop: 1 }}>
                        <NoteIcon />
                      </span>
                      <span className="text-xs" style={{ color: C.dimText }}>
                        {activeSession.notes}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {!isPunchedIn ? (
                <button
                  onClick={() => setModal("in")}
                  disabled={fetching || geoBlocked}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${C.darkBlue}, ${C.blue})`,
                  }}
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
                    disabled={fetching || geoBlocked}
                    className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
                    style={{
                      background: `linear-gradient(135deg, ${C.orange}, #FF9500)`,
                    }}
                  >
                    🏁 Punch Out
                  </button>
                </>
              )}
            </div>

            {/* ── Geo status messages (always shown) ── */}
            <>
              {geoStatus === "fetching" && (
                <p
                  className="text-center text-xs mt-3"
                  style={{ color: C.dimText }}
                >
                  📡 Fetching your location…
                </p>
              )}
              {geoStatus === "too-far" && distanceAway !== null && (
                <p
                  className="text-center text-xs mt-3 font-semibold"
                  style={{ color: C.red }}
                >
                  📍 You are {distanceAway}m away from the site. Move closer to
                  punch {isPunchedIn ? "out" : "in"}.
                </p>
              )}
              {geoStatus === "denied" && (
                <p
                  className="text-center text-xs mt-3 font-semibold"
                  style={{ color: C.red }}
                >
                  ⚠ Location access denied. Enable it in browser settings.
                </p>
              )}
              {geoStatus === "allowed" && (
                <p
                  className="text-center text-xs mt-3"
                  style={{ color: C.green }}
                >
                  ✓ You&apos;re on-site.{" "}
                  {isPunchedIn ? "Ready to punch out." : "Ready to punch in."}
                </p>
              )}
            </>
          </div>
        </div>

        {/* ── Tab bar (only shown for admins/directors) ───────────────── */}
        {isAdmin && (
          <div
            className="flex gap-1 p-1 rounded-xl"
            style={{ backgroundColor: C.divider }}
          >
            {[
              { key: "my", label: "My Sessions", Icon: UserIcon },
              { key: "all", label: "All Staff", Icon: UsersIcon },
            ]?.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all"
                style={
                  tab === key
                    ? {
                        backgroundColor: C.white,
                        color: C.darkBlue,
                        boxShadow: "0 1px 4px rgba(15,40,84,0.1)",
                      }
                    : { backgroundColor: "transparent", color: C.mutedText }
                }
              >
                <Icon />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ── My Sessions log ───────────────────────────────────────────────── */}
        {tab === "my" &&
          (fetching ? (
            <div
              className="bg-white rounded-xl shadow-sm p-8 text-center"
              style={{ border: `1px solid ${C.lightBlue}` }}
            >
              <div
                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
                style={{
                  borderColor: C.medBlue,
                  borderTopColor: "transparent",
                }}
              />
              <p
                className="text-sm font-semibold"
                style={{ color: C.mutedText }}
              >
                Loading sessions…
              </p>
            </div>
          ) : sessions.length > 0 ? (
            <div
              className="bg-white rounded-xl shadow-sm overflow-hidden"
              style={{ border: `1px solid ${C.lightBlue}` }}
            >
              <div className="px-4 pt-4 pb-0 flex items-center gap-2">
                <h2
                  className="text-sm font-bold uppercase tracking-wide"
                  style={{ color: C.darkBlue }}
                >
                  Today&apos;s Sessions
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
                    <tr
                      style={{
                        backgroundColor: C.bg,
                        borderBottom: `1px solid ${C.divider}`,
                      }}
                    >
                      {[
                        "#",
                        "Punch In",
                        "Punch Out",
                        "Duration",
                        "Status",
                        "Location",
                        "Notes",
                      ]?.map((h) => (
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
                    {[...sessions].reverse()?.map((s, i) => (
                      <LogRow
                        key={s.id || i}
                        entry={s}
                        idx={sessions.length - 1 - i}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <div className="md:hidden mt-2">
                {[...sessions].reverse()?.map((s, i) => (
                  <MobileLogCard
                    key={s.id || i}
                    entry={s}
                    idx={sessions.length - 1 - i}
                  />
                ))}
              </div>

              <div
                className="px-4 py-3 flex items-center justify-between flex-wrap gap-2"
                style={{ borderTop: `1px solid ${C.divider}` }}
              >
                <span className="text-xs" style={{ color: C.dimText }}>
                  {totalSessions} session{totalSessions !== 1 ? "s" : ""}{" "}
                  recorded
                </span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: C.medBlue }}
                >
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
              <p
                className="text-sm font-semibold"
                style={{ color: C.mutedText }}
              >
                No sessions recorded yet
              </p>
              <p className="text-xs mt-1" style={{ color: C.dimText }}>
                Punch in to start tracking attendance.
              </p>
            </div>
          ))}

        {/* ── All Staff (admin) tab ─────────────────────────────────────────── */}
        {tab === "all" &&
          isAdmin &&
          (adminFetch ? (
            <div
              className="bg-white rounded-xl shadow-sm p-8 text-center"
              style={{ border: `1px solid ${C.lightBlue}` }}
            >
              <div
                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
                style={{
                  borderColor: C.medBlue,
                  borderTopColor: "transparent",
                }}
              />
              <p
                className="text-sm font-semibold"
                style={{ color: C.mutedText }}
              >
                Loading all records…
              </p>
            </div>
          ) : allRecords.length > 0 ? (
            <div
              className="bg-white rounded-xl shadow-sm overflow-hidden"
              style={{ border: `1px solid ${C.lightBlue}` }}
            >
              <div className="px-4 pt-4 pb-0 flex items-center gap-2">
                <h2
                  className="text-sm font-bold uppercase tracking-wide"
                  style={{ color: C.darkBlue }}
                >
                  All Staff Attendance
                </h2>
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: C.darkBlue }}
                >
                  {allRecords.length}
                </span>
              </div>

              {/* Desktop admin table */}
              <div className="hidden md:block mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      style={{
                        backgroundColor: C.bg,
                        borderBottom: `1px solid ${C.divider}`,
                      }}
                    >
                      {[
                        "#",
                        "Staff",
                        "Date",
                        "Punch In",
                        "Punch Out",
                        "Duration",
                        "Status",
                        "Notes",
                      ]?.map((h) => (
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
                    {allRecords?.map((s, i) => (
                      <AdminRow key={s.id || i} entry={s} idx={i} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile admin list */}
              <div className="md:hidden mt-2">
                {allRecords?.map((s, i) => (
                  <AdminMobileCard key={s.id || i} entry={s} idx={i} />
                ))}
              </div>

              <div
                className="px-4 py-3"
                style={{ borderTop: `1px solid ${C.divider}` }}
              >
                <span className="text-xs" style={{ color: C.dimText }}>
                  {allRecords.length} record{allRecords.length !== 1 ? "s" : ""}{" "}
                  total
                </span>
              </div>
            </div>
          ) : (
            <div
              className="bg-white rounded-xl shadow-sm p-8 text-center"
              style={{ border: `1px solid ${C.lightBlue}` }}
            >
              <div className="text-4xl mb-3">👥</div>
              <p
                className="text-sm font-semibold"
                style={{ color: C.mutedText }}
              >
                No records found
              </p>
              <p className="text-xs mt-1" style={{ color: C.dimText }}>
                No staff attendance data available yet.
              </p>
            </div>
          ))}
      </main>

      {/* Camera modal */}
      {modal && (
        <CameraModal
          type={modal}
          loading={loading}
          onClose={() => !loading && setModal(null)}
          onSubmit={handlePunch}
          coords={userCoords}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
