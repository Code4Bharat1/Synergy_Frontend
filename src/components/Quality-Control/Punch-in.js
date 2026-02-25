"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  X, RefreshCw, Loader2, CheckCircle2,
  ImageIcon, Camera, LogOut, Clock
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    return data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

function formatDateTime(date) {
  const days   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const d = days[date.getDay()];
  const m = months[date.getMonth()];
  const day = date.getDate();
  let h = date.getHours(), min = date.getMinutes(), sec = date.getSeconds();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const pad = n => String(n).padStart(2, "0");
  return `${d} ${day} ${m} · ${pad(h)}:${pad(min)}:${pad(sec)} ${ampm}`;
}

function formatTimeOnly(date) {
  let h = date.getHours(), min = date.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const pad = n => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(min)} ${ampm}`;
}

function formatDuration(inTime, outTime) {
  const totalSec = Math.floor((outTime - inTime) / 1000);
  const hrs  = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
}

// ── Shared Attendance Modal (Punch In & Punch Out) ────────────────────────────
function AttendanceModal({ mode, onClose, onSuccess }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef  = useRef(null);

  const [timeStr,    setTimeStr]    = useState(formatDateTime(new Date()));
  const [address,    setAddress]    = useState(null);
  const [locErr,     setLocErr]     = useState(null);
  const [loadingLoc, setLoadingLoc] = useState(true);
  const [camReady,   setCamReady]   = useState(false);
  const [camErr,     setCamErr]     = useState(false);
  const [selfie,     setSelfie]     = useState(null);
  const [submitted,  setSubmitted]  = useState(false);

  const isPunchIn = mode === "in";
  const headerBg  = isPunchIn ? "#1C4D8D" : "#7C2D12";
  const actionBg  = isPunchIn ? "#1C4D8D" : "#9A3412";
  const emoji     = isPunchIn ? "📍" : "🚪";
  const label     = isPunchIn ? "Punch In" : "Punch Out";

  // Live clock
  useEffect(() => {
    timerRef.current = setInterval(() => setTimeStr(formatDateTime(new Date())), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) { setLocErr("Geolocation not supported"); setLoadingLoc(false); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const addr = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setAddress(addr); setLoadingLoc(false);
      },
      () => { setLocErr("Location access denied"); setLoadingLoc(false); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  // Camera
  const startCamera = useCallback(async () => {
    setCamErr(false); setCamReady(false); setSelfie(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCamReady(true);
      }
    } catch { setCamErr(true); }
  }, []);

  useEffect(() => {
    startCamera();
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, [startCamera]);

  const captureSelfie = () => {
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.save(); ctx.scale(-1, 1); ctx.drawImage(video, -canvas.width, 0); ctx.restore();
    setSelfie(canvas.toDataURL("image/jpeg", 0.85));
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const retake = () => { setSelfie(null); startCamera(); };

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => { onSuccess(address); }, 1200);
  };

  const canSubmit = !loadingLoc && !locErr && (selfie || camErr);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl z-10" style={{ background: "#1a1a2e" }}>

        {/* Header */}
        <div className="px-5 py-4" style={{ background: headerBg }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>{emoji}</span>
              <h3 className="text-white font-bold text-base">{label}</h3>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all">
              <X size={15} />
            </button>
          </div>
          <p className="text-white/60 text-xs mt-1 font-mono">{timeStr}</p>
        </div>

        {/* Location */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
          <span className="text-sm shrink-0">📍</span>
          <div className="flex-1 min-w-0">
            {loadingLoc ? (
              <div className="flex items-center gap-2">
                <Loader2 size={13} className="text-blue-300 animate-spin" />
                <span className="text-xs text-blue-300">Detecting location…</span>
              </div>
            ) : locErr ? (
              <span className="text-xs text-red-400">{locErr}</span>
            ) : (
              <p className="text-xs text-white/80 leading-snug line-clamp-2">{address}</p>
            )}
          </div>
          {!loadingLoc && !locErr && (
            <button className="text-white/40 hover:text-white transition-colors shrink-0">
              <RefreshCw size={13} />
            </button>
          )}
        </div>

        {/* Camera */}
        <div className="relative bg-black" style={{ minHeight: 260 }}>
          {selfie ? (
            <div className="relative">
              <img src={selfie} alt="Selfie" className="w-full object-cover" style={{ maxHeight: 300 }} />
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 size={10} /> Captured
              </div>
            </div>
          ) : camErr ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                <Camera size={24} className="text-white/40" />
              </div>
              <p className="text-white/70 text-sm font-medium">Camera access denied.</p>
              <p className="text-white/50 text-xs">Please allow camera to continue.</p>
              <button onClick={startCamera} className="mt-1 px-5 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: headerBg }}>
                Retry Camera
              </button>
            </div>
          ) : (
            <div className="relative">
              <video ref={videoRef} autoPlay playsInline muted className="w-full object-cover" style={{ transform: "scaleX(-1)", maxHeight: 300 }} />
              {!camReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <Loader2 size={24} className="text-white animate-spin" />
                </div>
              )}
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Actions */}
        <div className="p-4 space-y-2.5">
          {!selfie && !camErr && (
            <button
              onClick={captureSelfie}
              disabled={!camReady}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${camReady ? "text-white" : "bg-white/10 text-white/30 cursor-not-allowed"}`}
              style={camReady ? { background: "#0F2854" } : {}}
            >
              <Camera size={15} /> Take Selfie
            </button>
          )}
          {selfie && (
            <button onClick={retake} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white bg-white/10 hover:bg-white/15 transition-all">
              <RefreshCw size={12} /> Retake
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitted}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all
              ${canSubmit && !submitted ? "text-white shadow-lg" : "bg-white/10 text-white/30 cursor-not-allowed"}`}
            style={canSubmit && !submitted ? { background: actionBg } : {}}
          >
            {submitted
              ? <><CheckCircle2 size={15} /> {isPunchIn ? "Punched In!" : "Punched Out!"}</>
              : <>{emoji} {label} Now</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Live Elapsed Timer ────────────────────────────────────────────────────────
function ElapsedTimer({ punchInTime }) {
  const [elapsed, setElapsed] = useState("00:00");
  useEffect(() => {
    const tick = () => {
      const totalSec = Math.floor((Date.now() - punchInTime) / 1000);
      const hrs  = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;
      const pad  = n => String(n).padStart(2, "0");
      setElapsed(hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [punchInTime]);
  return <span>{elapsed}</span>;
}

// ── Photo Upload ──────────────────────────────────────────────────────────────
function PhotoUpload({ label, required }) {
  const [files, setFiles] = useState([]);
  const inputRef = useRef(null);
  const handleChange = (e) => {
    const selected = Array.from(e.target.files).map(f => ({ name: f.name, url: URL.createObjectURL(f) }));
    setFiles(p => [...p, ...selected]);
  };
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-medium-blue hover:bg-lightblue/10 transition-all min-h-[110px] flex flex-col items-center justify-center gap-2"
      >
        {files.length > 0 ? (
          <div className="flex flex-wrap gap-2 justify-center">
            {files.map((f, i) => (
              <img key={i} src={f.url} alt={f.name} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
            ))}
            <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300">
              <ImageIcon size={18} />
            </div>
          </div>
        ) : (
          <>
            <ImageIcon size={22} className="text-gray-300" />
            <span className="text-sm text-gray-400">Upload {label.toLowerCase()}</span>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleChange} />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PunchIn() {
  const [modal,        setModal]        = useState(null); // null | "in" | "out"
  const [punchInTime,  setPunchInTime]  = useState(null);
  const [punchOutTime, setPunchOutTime] = useState(null);
  const [punchInAddr,  setPunchInAddr]  = useState(null);
  const [punchOutAddr, setPunchOutAddr] = useState(null);

  const [workDesc,    setWorkDesc]    = useState("");
  const [material,    setMaterial]    = useState("");
  const [replacement, setReplacement] = useState("No replacement");

  const isPunchedIn  = !!punchInTime;
  const isPunchedOut = !!punchOutTime;
  const canSubmit    = isPunchedIn && isPunchedOut;

  const handleSuccess = (addr) => {
    if (modal === "in")  { setPunchInTime(new Date());  setPunchInAddr(addr);  }
    if (modal === "out") { setPunchOutTime(new Date()); setPunchOutAddr(addr); }
    setModal(null);
  };

  return (
    <div className="space-y-5">

      {/* Modal */}
      {modal && <AttendanceModal mode={modal} onClose={() => setModal(null)} onSuccess={handleSuccess} />}

      {/* ── Attendance Banner ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5 space-y-4">

        {/* Top row */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-bold text-extra-darkblue flex items-center gap-2">
              📍 Attendance
              {!isPunchedIn && <span className="text-red-400 text-xs font-semibold bg-red-50 px-2 py-0.5 rounded-full">(Mandatory)</span>}
            </h2>
            <p className="text-sm mt-0.5 text-gray-400">
              {!isPunchedIn && "Selfie + geo-location will be captured. Allow camera & location when prompted."}
              {isPunchedIn && !isPunchedOut && "You're clocked in. Don't forget to punch out when done."}
              {isPunchedOut && "Attendance recorded successfully."}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {!isPunchedIn && (
              <button
                onClick={() => setModal("in")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow hover:opacity-90 transition-all"
                style={{ background: "#0F2854" }}
              >
                📍 Punch In Now
              </button>
            )}

            {isPunchedIn && !isPunchedOut && (
              <>
                <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-green-600 bg-green-50 border border-green-200">
                  <CheckCircle2 size={13} /> Punched In
                </span>
                <button
                  onClick={() => setModal("out")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow hover:opacity-90 transition-all"
                  style={{ background: "#7C2D12" }}
                >
                  <LogOut size={15} /> Punch Out
                </button>
              </>
            )}

            {isPunchedOut && (
              <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200">
                <Clock size={13} /> Session Complete
              </span>
            )}
          </div>
        </div>

        {/* Stats row — shown after punch in */}
        {isPunchedIn && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Punch In</p>
              <p className="text-sm font-bold text-green-600">{formatTimeOnly(punchInTime)}</p>
            </div>
            <div className={`rounded-xl p-3 text-center border ${isPunchedOut ? "bg-red-50 border-red-100" : "bg-lightblue/40 border-lightblue"}`}>
              <p className="text-xs text-gray-400 mb-1">{isPunchedOut ? "Punch Out" : "Elapsed"}</p>
              <p className={`text-sm font-bold font-mono ${isPunchedOut ? "text-red-500" : "text-extra-blue"}`}>
                {isPunchedOut ? formatTimeOnly(punchOutTime) : <ElapsedTimer punchInTime={punchInTime} />}
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Duration</p>
              <p className="text-sm font-bold text-extra-darkblue">
                {isPunchedOut ? formatDuration(punchInTime, punchOutTime) : "–"}
              </p>
            </div>
          </div>
        )}

        {/* Location rows */}
        {punchInAddr && (
          <div className="space-y-2">
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-green-50 border border-green-100">
              <span className="text-xs mt-0.5 shrink-0">📍</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-green-600 mb-0.5">Punch In Location</p>
                <p className="text-xs text-gray-500 leading-snug">{punchInAddr}</p>
              </div>
            </div>
            {punchOutAddr && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-100">
                <span className="text-xs mt-0.5 shrink-0">📍</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-red-500 mb-0.5">Punch Out Location</p>
                  <p className="text-xs text-gray-500 leading-snug">{punchOutAddr}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Service Work Details ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 shrink-0" />
          <h3 className="text-base font-bold text-extra-darkblue">Service Work Details</h3>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Work Description <span className="text-red-400">*</span>
          </label>
          <textarea
            value={workDesc}
            onChange={e => setWorkDesc(e.target.value)}
            rows={4}
            placeholder="Describe the work performed on site..."
            className="w-full text-sm border border-gray-200 rounded-xl p-3.5 resize-none outline-none focus:border-medium-blue transition-colors text-extra-darkblue placeholder-gray-300 bg-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Material Used</label>
            <input
              type="text"
              value={material}
              onChange={e => setMaterial(e.target.value)}
              placeholder="e.g. Gel coat resin, 3 kg"
              className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-medium-blue transition-colors text-extra-darkblue placeholder-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Replacement Done</label>
            <select
              value={replacement}
              onChange={e => setReplacement(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-medium-blue transition-colors text-extra-darkblue bg-white appearance-none cursor-pointer"
            >
              <option>No replacement</option>
              <option>Partial replacement</option>
              <option>Full replacement</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PhotoUpload label="Before Photos" required />
          <PhotoUpload label="After Photos"  required />
        </div>

        <div className="pt-1">
          <button
            disabled={!canSubmit}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all
              ${canSubmit ? "text-white shadow hover:opacity-90" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}
            style={canSubmit ? { background: "#0F2854" } : {}}
          >
            {!isPunchedIn ? "Punch In First to Submit" : !isPunchedOut ? "Punch Out First to Submit" : "Submit Service Report"}
          </button>
          {!canSubmit && (
            <p className="text-xs text-center text-gray-400 mt-2">
              {!isPunchedIn ? "You must punch in before submitting" : "You must punch out before submitting"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}