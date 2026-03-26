"use client";

import { useState, useEffect } from "react";
import { 
  MapPin, 
  Clock, 
  CalendarDays, 
  LogOut, 
  RefreshCw, 
  MapPinOff, 
  CheckCircle2,
  AlertCircle,
  Camera,
  Check,
  FileText,
  User,
  Building
} from "lucide-react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const OFFICE_COORDS = { lat: 19.07285143363228, lng: 72.88041850211928 };
const ALLOWED_RADIUS_METERS = 200;

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

function to12hr(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

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

import { useRef } from "react";

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
    if (coords) {
      setLocation(`${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E`);
    } else {
      navigator.geolocation?.getCurrentPosition(
        (pos) => setLocation(`${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`),
        () => setLocation("Location unavailable")
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
        if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") setCamErrMsg("No camera found on this device.");
        else if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") setCamErrMsg("Camera access denied. Allow it in browser settings.");
        else setCamErrMsg(`Camera error: ${err.message}`);
      });

    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, [coords]);

  const takePhoto = () => {
    const v = videoRef.current, c = canvasRef.current;
    if(!v || !c) return;
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
      style={{ backgroundColor: "rgba(15,40,84,0.6)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div
        className="w-full sm:w-[420px] rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ backgroundColor: C.white, maxHeight: "90dvh" }}
      >
        <div className="flex justify-center pt-2.5 pb-0.5 sm:hidden">
          <div className="w-9 h-1 rounded-full" style={{ backgroundColor: C.divider }} />
        </div>
        <div className="px-5 py-3.5 flex items-center justify-between" style={{ backgroundColor: accent }}>
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
            style={{ backgroundColor: "rgba(255,255,255,0.18)", opacity: loading ? 0.4 : 0.8 }}
          >
            ✕
          </button>
        </div>
        <div className="relative bg-black w-full flex-shrink-0" style={{ height: "clamp(200px, 40vw, 280px)" }}>
          {camError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6" style={{ backgroundColor: C.bg }}>
              <span style={{ color: C.medBlue }}><Camera size={24} /></span>
              <p className="text-xs font-semibold text-center" style={{ color: C.mutedText }}>{camErrMsg}</p>
              <button
                onClick={() => { setStep("confirm"); setPhoto(null); }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white"
                style={{ backgroundColor: accent }}
              >
                Skip Photo & Continue →
              </button>
            </div>
          ) : step === "capture" ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
          ) : photo ? (
            <img src={photo} alt="selfie" className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ backgroundColor: C.bg }}>
              <span className="text-4xl">👤</span>
              <p className="text-xs font-semibold" style={{ color: C.mutedText }}>No photo captured</p>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
          {step === "capture" && !camError && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-white rounded-full" style={{ width: "42%", aspectRatio: "3/4", opacity: 0.45 }} />
            </div>
          )}
          {step === "confirm" && (
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: C.green }}>
              <Check size={16} strokeWidth={3} />
            </div>
          )}
        </div>
        <div className="overflow-y-auto">
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ backgroundColor: C.bg, borderBottom: `1px solid ${C.divider}` }}>
            <span style={{ color: C.medBlue }}><MapPin size={16} /></span>
            <span className="text-xs font-medium truncate" style={{ color: C.mutedText }}>{location}</span>
          </div>
          {step === "confirm" && (
            <div className="px-4 pt-3 pb-0">
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: C.mutedText }}>
                <FileText size={14} /> Notes <span className="font-normal normal-case tracking-normal" style={{ color: C.dimText }}>(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isIn ? "e.g. Starting site tasks…" : "e.g. Completed all tasks for today."}
                rows={2}
                maxLength={300}
                disabled={loading}
                className="w-full text-sm rounded-xl px-3 py-2 resize-none outline-none disabled:opacity-50"
                style={{ border: `1.5px solid ${C.divider}`, color: C.darkBlue, backgroundColor: C.bg, fontFamily: "inherit" }}
              />
            </div>
          )}
          <div className="px-4 py-4 flex gap-3">
            {step === "capture" ? (
              <>
                <button onClick={onClose} disabled={loading} className="flex-1 py-3 rounded-xl text-sm font-semibold border" style={{ borderColor: C.divider, color: C.mutedText, backgroundColor: C.white }}>Cancel</button>
                <button onClick={() => { setStep("confirm"); setPhoto(null); }} disabled={loading} className="flex-1 py-3 rounded-xl text-sm font-semibold border disabled:opacity-40" style={{ borderColor: C.divider, color: C.mutedText, backgroundColor: C.white }}>Skip Photo</button>
                <button onClick={takePhoto} disabled={camError || loading} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40" style={{ backgroundColor: accent }}>📷 Capture</button>
              </>
            ) : (
              <>
                <button onClick={retake} disabled={loading} className="flex-1 py-3 rounded-xl text-sm font-semibold border disabled:opacity-40" style={{ borderColor: C.divider, color: C.mutedText, backgroundColor: C.white }}>Retake</button>
                <button onClick={() => onSubmit({ photo, location, notes: notes.trim(), timestamp: new Date().toISOString() })} disabled={loading} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2" style={{ backgroundColor: accent }}>
                  {loading ? "Saving…" : "✓ Confirm"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkerDashboard() {
  const router = useRouter();
  const [worker, setWorker] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(null); // "in" or "out"
  
  const [punching, setPunching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [geoStatus, setGeoStatus] = useState("fetching");
  const [distanceAway, setDistanceAway] = useState(null);
  const [geoCoords, setGeoCoords] = useState(null);
  const [geoErrorMsg, setGeoErrorMsg] = useState("");
  
  const [now, setNow] = useState(new Date());

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch History
  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("accessToken") || localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No token found");
      }
      const res = await fetch(`${API_BASE}/site-attendance/worker/history`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch dashboard");
      
      setWorker(data.worker);
      setAssignment(data.activeAssignment);
      setRecords(data.records || []);
    } catch (err) {
      setError(err.message);
      if (err.message === "No token found") {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [router]);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus("denied");
      setGeoErrorMsg("Geolocation not supported");
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setGeoCoords({ lat, lng });
        const dist = getDistanceMeters(lat, lng, OFFICE_COORDS.lat, OFFICE_COORDS.lng);
        setDistanceAway(Math.round(dist));
        if (dist <= ALLOWED_RADIUS_METERS) {
          setGeoStatus("allowed");
          setGeoErrorMsg("");
        } else {
          setGeoStatus("too-far");
          setGeoErrorMsg(`Too far from site (${Math.round(dist)}m)`);
        }
      },
      (err) => {
        setGeoStatus("denied");
        setGeoErrorMsg(err.message);
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handlePunchSubmit = async ({ photo, location, notes }) => {
    if (geoStatus !== "allowed" || !showModal) return;
    setPunching(true);
    setError("");
    setSuccess("");
    try {
      const token = Cookies.get("accessToken") || localStorage.getItem("accessToken");
      const url = `${API_BASE}/site-attendance/worker/punch-${showModal}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD local format
          notes // Included for future proofing
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Action failed");
      
      setSuccess(`Successfully punched ${showModal}!`);
      setShowModal(null);
      fetchDashboard();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setPunching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw size={24} className="animate-spin text-extra-darkblue" />
      </div>
    );
  }

  // Find today's record
  const todayStr = new Date().toDateString();
  const todayRecord = records.find(r => new Date(r.date || r.punchInTime).toDateString() === todayStr);
  const isPunchedIn = !!todayRecord?.punchInTime;
  const isPunchedOut = !!todayRecord?.punchOutTime;
  
  const geoOk = geoStatus === "allowed";

  return (
    <div className="max-w-2xl mx-auto space-y-4 p-4 sm:p-6 pb-24">
      {showModal && (
        <CameraModal 
          type={showModal} 
          onClose={() => setShowModal(null)} 
          onSubmit={handlePunchSubmit} 
          loading={punching}
          coords={geoCoords}
        />
      )}
      {/* Header Profile */}
      <div className="bg-extra-darkblue text-white rounded-3xl p-6 shadow-lg shadow-blue-900/20 flex flex-col justify-between">
        <div className="flex justify-between items-start w-full">
          <div className="flex flex-col">
            <p className="text-blue-200 text-sm font-semibold">Welcome Back</p>
            <h1 className="text-2xl font-bold truncate pr-4">{worker?.name || "Worker"}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="bg-white/20 px-2.5 py-1 rounded-full capitalize">{worker?.trade || "General Worker"}</span>
              <span className="bg-white/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <MapPin size={12} /> {assignment?.project?.name || "No Active Project"}
              </span>
            </div>
          </div>
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10 flex items-center justify-center text-xl sm:text-2xl font-bold flex-shrink-0">
            {worker?.name?.charAt(0).toUpperCase() || "W"}
          </div>
        </div>

        {/* Assigned Under Section */}
        {assignment && (
          <div className="mt-5 pt-4 border-t border-white/10">
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1.5">Assigned Under</p>
            <div className="flex items-center gap-1.5 text-sm font-semibold bg-white/10 w-fit px-3 py-1.5 rounded-lg">
              <Building size={14} className="text-emerald-400" />
              <span>{assignment.project?.name}</span>
              <span className="text-white/40 px-1">•</span>
              <User size={14} className="text-emerald-400" />
              <span>{assignment.engineer?.name || "Unknown Manager"}</span>
            </div>
          </div>
        )}
      </div>

      {/* Clock & Geolocation */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
        <div className="text-5xl font-black text-extra-darkblue tabular-nums tracking-tight">
          {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </div>
        <div className="text-sm text-gray-400 font-semibold mt-1">
          {now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
        </div>
        
        <div className={`mt-4 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${geoOk ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
          {geoOk ? <MapPin size={14} /> : <MapPinOff size={14} />}
          {geoOk ? "On-Site (Verified)" : geoErrorMsg || "Location restricted"}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-2xl flex items-center gap-2 text-sm font-semibold">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-2xl flex items-center gap-2 text-sm font-semibold">
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowModal("in")}
          disabled={!geoOk || isPunchedIn || punching}
          className={`relative overflow-hidden group flex flex-col items-center justify-center py-6 px-4 rounded-3xl transition-all shadow-md active:scale-95 ${
            isPunchedIn 
              ? "bg-gray-100 text-gray-400 shadow-none border border-gray-200 cursor-not-allowed" 
              : !geoOk 
                ? "bg-gray-100 text-gray-400 opacity-70 cursor-not-allowed"
                : "bg-gradient-to-br from-indigo-500 to-blue-600 text-white hover:shadow-indigo-500/30 hover:scale-[1.02]"
          }`}
        >
          {isPunchedIn ? (
            <CheckCircle2 size={32} className="mb-2 opacity-50" />
          ) : punching && !isPunchedIn ? (
            <RefreshCw size={32} className="mb-2 animate-spin" />
          ) : (
            <MapPin size={32} className="mb-2 group-hover:scale-110 transition-transform" />
          )}
          <span className="font-bold text-lg">{isPunchedIn ? "Punched In" : "Punch In"}</span>
          {isPunchedIn && todayRecord?.punchInTime && (
            <span className="text-xs mt-1 font-semibold">{to12hr(todayRecord.punchInTime)}</span>
          )}
        </button>

        <button
          onClick={() => setShowModal("out")}
          disabled={!geoOk || !isPunchedIn || isPunchedOut || punching}
          className={`relative overflow-hidden group flex flex-col items-center justify-center py-6 px-4 rounded-3xl transition-all shadow-md active:scale-95 ${
            !isPunchedIn || isPunchedOut
              ? "bg-gray-100 text-gray-400 shadow-none border border-gray-200 cursor-not-allowed"
              : !geoOk
                ? "bg-gray-100 text-gray-400 opacity-70 cursor-not-allowed"
                : "bg-gradient-to-br from-orange-500 to-red-500 text-white hover:shadow-orange-500/30 hover:scale-[1.02]"
          }`}
        >
          {isPunchedOut ? (
            <CheckCircle2 size={32} className="mb-2 opacity-50" />
          ) : punching && isPunchedIn && !isPunchedOut ? (
            <RefreshCw size={32} className="mb-2 animate-spin" />
          ) : (
            <LogOut size={32} className="mb-2 group-hover:scale-110 transition-transform" />
          )}
          <span className="font-bold text-lg">{isPunchedOut ? "Punched Out" : "Punch Out"}</span>
          {isPunchedOut && todayRecord?.punchOutTime && (
            <span className="text-xs mt-1 font-semibold">{to12hr(todayRecord.punchOutTime)}</span>
          )}
        </button>
      </div>

      {/* History List */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-extra-darkblue mb-3">Recent Attendance</h3>
        <div className="space-y-3">
          {records.length === 0 ? (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-center text-gray-400">
              <CalendarDays size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">No attendance records found</p>
            </div>
          ) : (
             records.slice(0, 7).map((rec, i) => (
              <div key={rec._id || i} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-gray-700">
                    {new Date(rec.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </div>
                  <div className="text-xs font-semibold text-gray-400 mt-0.5 flex items-center gap-2">
                    {rec.punchInTime ? <span className="text-emerald-600">In: {to12hr(rec.punchInTime)}</span> : <span>—</span>}
                    {rec.punchOutTime && <span className="text-red-500">Out: {to12hr(rec.punchOutTime)}</span>}
                  </div>
                </div>
                <div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    rec.status === "present" ? "bg-emerald-50 text-emerald-700" :
                    rec.status === "absent" ? "bg-red-50 text-red-600" :
                    "bg-amber-50 text-amber-700"
                  }`}>
                    {rec.status ? rec.status.toUpperCase() : "UNKNOWN"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
