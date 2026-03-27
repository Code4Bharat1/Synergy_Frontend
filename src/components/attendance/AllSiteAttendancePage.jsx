//All Workers Attendance (admin view — fetches every worker regardless of logged-in user)
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  AlertCircle,
  Calendar,
  RefreshCw,
  Send,
  HardHat,
  CheckCheck,
  Plus,
  X,
  User,
  Phone,
  Briefcase,
  Building2,
  CalendarDays,
  Trash2,
  UserPlus,
  Users,
  Activity,
  RotateCcw,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  UserCheck,
  MapPin,
} from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const API_ROOT = API_BASE.replace(/\/api\/v1\/?$/, "");

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

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUSES = [
  { value: "present", label: "P", full: "Present", cls: "bg-emerald-500 text-white" },
  { value: "absent", label: "A", full: "Absent", cls: "bg-red-500 text-white" },
  { value: "late", label: "L", full: "Late", cls: "bg-amber-500 text-white" },
  { value: "half-day", label: "½", full: "Half Day", cls: "bg-purple-500 text-white" },
  { value: "on-leave", label: "OL", full: "On Leave", cls: "bg-sky-500 text-white" },
];

const TRADES = [
  "mason",
  "electrician",
  "plumber",
  "carpenter",
  "welder",
  "painter",
  "supervisor",
  "general",
  "other",
];

const DURATION_OPTIONS = [
  { label: "5 Min (Test)", days: 0.0035 }, // 👈 ADD THIS
  { label: "1 Day", days: 1 },
  { label: "3 Days", days: 3 },
  { label: "1 Week", days: 7 },
  { label: "2 Weeks", days: 14 },
  { label: "1 Month", days: 30 },
  { label: "3 Months", days: 90 },
  { label: "6 Months", days: 180 },
  { label: "1 Year", days: 365 },
];

const TRADE_COLORS = {
  mason: "bg-orange-50 text-orange-600 border-orange-100",
  electrician: "bg-yellow-50 text-yellow-700 border-yellow-100",
  plumber: "bg-blue-50 text-blue-600 border-blue-100",
  carpenter: "bg-amber-50 text-amber-700 border-amber-100",
  welder: "bg-red-50 text-red-600 border-red-100",
  painter: "bg-pink-50 text-pink-600 border-pink-100",
  supervisor: "bg-indigo-50 text-indigo-600 border-indigo-100",
  general: "bg-gray-100 text-gray-500 border-gray-200",
  other: "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUS_BADGE = {
  present: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  absent: "bg-red-50 text-red-600 border border-red-100",
  late: "bg-amber-50 text-amber-700 border border-amber-100",
  "half-day": "bg-purple-50 text-purple-700 border border-purple-100",
  "on-leave": "bg-sky-50 text-sky-700 border border-sky-100",
  "deactivated-present": "bg-gray-200 text-gray-500 border border-gray-300",
  "deactivated-absent": "bg-gray-100 text-gray-400 border border-gray-200",
};

const STATUS_BORDER = {
  present: "border-l-emerald-400",
  absent: "border-l-gray-200",
  late: "border-l-amber-400",
  "half-day": "border-l-purple-400",
  "on-leave": "border-l-sky-400",
  "deactivated-present": "border-l-gray-300",
  "deactivated-absent": "border-l-gray-200",
};

const AVATAR_BG = [
  "bg-orange-100 text-orange-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
  "bg-indigo-100 text-indigo-700",
];

const PAGE_SIZE = 10;

function avatarBg(name = "") {
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return AVATAR_BG[n % AVATAR_BG.length];
}
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function toLocalHHMM(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
function assignmentLabel(start, end) {
  if (!start || !end) return "Day worker";
  const days = Math.round((new Date(end) - new Date(start)) / 86400000);
  if (days >= 150) return `${Math.round(days / 30)}m contract`;
  if (days >= 28) return `${Math.round(days / 7)}w contract`;
  if (days > 1) return `${days}d contract`;
  return "Day worker";
}

const LATE_AFTER = { h: 9, m: 30 };
function calcStatus(punchInHHMM, punchOutHHMM, isActive) {
  if (!isActive) {
  if (!punchInHHMM) return "deactivated-absent";
  return "deactivated-present";
}
  if (!punchInHHMM) return "absent";
  const [inH, inM] = punchInHHMM.split(":")?.map(Number);
  const isLate =
    inH > LATE_AFTER.h || (inH === LATE_AFTER.h && inM > LATE_AFTER.m);
  if (!punchOutHHMM) return isLate ? "late" : "present";
  const [outH, outM] = punchOutHHMM.split(":")?.map(Number);
  const totalMins = outH * 60 + outM - (inH * 60 + inM);
  if (totalMins < 240) return "half-day";
  if (isLate) return "late";
  return "present";
}
function to12hr(hhmm) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":")?.map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

// ── API ───────────────────────────────────────────────────────────────────────
const api = {
  // ─── KEY CHANGE: always passes all=true ───────────────────────────────────
  async getWorkers(site, date, projectId) {
  const params = new URLSearchParams();
  if (site) params.set("site", site);
  if (date) params.set("date", date);
  if (projectId) params.set("project", projectId);
  params.set("all", "true");

  // fetch active workers
  const res = await fetch(`${API_BASE}/site-workers?${params}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load workers");
  const activeWorkers = data.workers || [];

  // also fetch inactive so deactivated show in roster with grey badge
  const inactiveParams = new URLSearchParams();
  if (site) inactiveParams.set("site", site);
  if (projectId) inactiveParams.set("project", projectId);
  inactiveParams.set("active", "false");
  inactiveParams.set("all", "true");
  const inactiveRes = await fetch(`${API_BASE}/site-workers?${inactiveParams}`, {
    headers: authHeaders(),
  });
  const inactiveData = await inactiveRes.json();
  const inactiveWorkers = inactiveRes.ok ? (inactiveData.workers || []) : [];
const seen = new Set(activeWorkers.map((w) => w._id));
  const uniqueInactive = inactiveWorkers.filter((w) => !seen.has(w._id));
  return [...activeWorkers, ...uniqueInactive];
},
  async createWorker(payload) {
    const res = await fetch(`${API_BASE}/site-workers`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create worker");
    return data.worker;
  },
  async registerWorker(payload) {
    const res = await fetch(`${API_BASE}/site-workers/register`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to register worker");
    return data.worker;
  },
  async deactivateWorker(id) {
    const res = await fetch(`${API_BASE}/site-workers/${id}/deactivate`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to deactivate");
    return data;
  },
  async renewWorker(id, durationDays) {
  const start = new Date();
  let end = new Date(start); // ✅ use let ONLY ONCE

  if (Number(durationDays) < 1) {
    // for test durations like 5 min
    end.setMinutes(end.getMinutes() + Number(durationDays) * 1440);
  } else {
    end.setDate(end.getDate() + Number(durationDays));

    // ✅ VERY IMPORTANT (full day validity)
    end.setHours(23, 59, 59, 999);
  }

  const res = await fetch(`${API_BASE}/site-workers/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({
      assignmentStart: start.toISOString(),
      assignmentEnd: end.toISOString(),
      isActive: true,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to renew");
  return data.worker;
},
  async lookupByIdProof(idProof) {
    const params = new URLSearchParams({ idProof });
    const res = await fetch(`${API_BASE}/site-workers/lookup?${params}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Worker not found");
    return data.worker;
  },
  async getWorkerAssignments(workerId) {
    const res = await fetch(
      `${API_BASE}/site-workers/${workerId}/assignments`,
      { headers: authHeaders() },
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load assignments");
    return data.assignments || [];
  },
  async getProjects() {
    const res = await fetch(`${API_BASE}/projects`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load projects");
    return data.projects || data.data || data.result || data || [];
  },
  async getInactiveWorkers(site, projectId) {
    const params = new URLSearchParams({ active: "false", all: "true" }); // ← all=true here too
    if (site) params.set("site", site);
    if (projectId) params.set("project", projectId);
    const res = await fetch(`${API_BASE}/site-workers?${params}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.message || "Failed to load inactive workers");
    return data.workers || [];
  },
  async bulkSubmit(payload) {
    const res = await fetch(`${API_BASE}/site-attendance/bulk`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json"))
      throw new Error(`Server error — check API_BASE (${API_BASE})`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to submit");
    return data;
  },
  async engineerPunchIn(location, notes, projectId) {
    const res = await fetch(`${API_BASE}/attendance/punch-in`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ location, notes, project: projectId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Punch in failed");
    return data.attendance;
  },
  async engineerPunchOut(projectId) {
    const res = await fetch(`${API_BASE}/attendance/punch-out`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ project: projectId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Punch out failed");
    return data.attendance;
  },
  async getMyAttendance() {
    const res = await fetch(`${API_BASE}/attendance/me`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed");
    return Array.isArray(data) ? data : data.records || [];
  },
};

function EngineerAttendanceModal({ onClose, defaultProjectId }) {
  const videoRef = useRef(null),
    canvasRef = useRef(null);
  const streamRef = useRef(null),
    watchRef = useRef(null);

  const [selectedProject, setSelectedProject] = useState(
    defaultProjectId || "",
  );
  const [punchInTime, setPunchInTime] = useState(null);
  const [punchOutTime, setPunchOutTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState(null);
  const [step, setStep] = useState("capture");
  const [pendingAction, setPendingAction] = useState(null);
  const [camError, setCamError] = useState(false);
  const [camErrMsg, setCamErrMsg] = useState("");
  const [geoStatus, setGeoStatus] = useState("fetching");
  const [distanceAway, setDistanceAway] = useState(null);
  const [locationStr, setLocationStr] = useState("Fetching location…");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    api
      .getMyAttendance()
      .then((records) => {
        const todayStr = new Date().toDateString();
        const rec = records.find((r) => {
          const ts = r.punchInTime || r.punchIn || r.checkIn || r.startTime;
          return ts && new Date(ts).toDateString() === todayStr;
        });
        if (rec) {
          const inTs = rec.punchInTime || rec.punchIn || rec.checkIn;
          const outTs = rec.punchOutTime || rec.punchOut || rec.checkOut;
          if (inTs)
            setPunchInTime(
              new Date(inTs).toLocaleTimeString("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
}),
            );
          if (outTs)
            setPunchOutTime(
              new Date(outTs).toLocaleTimeString("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
}),
            );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus("denied");
      return;
    }
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocationStr(`${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);
        const dist = getDistanceMeters(
          lat,
          lng,
          OFFICE_COORDS.lat,
          OFFICE_COORDS.lng,
        );
        setDistanceAway(Math.round(dist));
        setGeoStatus(dist <= ALLOWED_RADIUS_METERS ? "allowed" : "too-far");
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: true, maximumAge: 10000 },
    );
    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  useEffect(() => {
    if (!pendingAction) return;
    setCamError(false);
    setPhoto(null);
    setStep("capture");
    setNotes("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamError(true);
      setCamErrMsg("Camera not supported.");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err) => {
        setCamError(true);
        setCamErrMsg(`Camera error: ${err.message}`);
      });
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, [pendingAction]);

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

  const handleConfirm = async () => {
    if (!selectedProject) {
      setError("Please select a project first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (pendingAction === "in") {
        const rec = await api.engineerPunchIn(
          locationStr,
          notes.trim(),
          selectedProject,
        );
        const inTs = rec.punchInTime || rec.punchIn || rec.checkIn;
        if (inTs)
          setPunchInTime(
            new Date(inTs).toLocaleTimeString("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
}),
          );
        setSuccess("Punched in successfully! ✅");
      } else {
        const rec = await api.engineerPunchOut(selectedProject);
        const outTs = rec.punchOutTime || rec.punchOut || rec.checkOut;
        if (outTs)
          setPunchOutTime(
            new Date(outTs).toLocaleTimeString("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
}),
          );
        setSuccess("Punched out successfully! 🏁");
      }
      setPendingAction(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isPunchedIn = !!punchInTime,
    isPunchedOut = !!punchOutTime;
  const geoBlocked = geoStatus !== "allowed";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <UserCheck size={15} className="text-indigo-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-extra-darkblue">
                My Attendance
              </h3>
              <p className="text-xs text-gray-400">
                Mark your own attendance for today
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="text-center py-1">
            <div className="text-3xl font-bold tabular-nums text-extra-darkblue">
              {now.toLocaleTimeString("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
})}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {now.toLocaleDateString("en-US", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Project <span className="text-red-400">*</span>
              <span className="text-gray-400 font-normal ml-1">
                (attendance tagged to this project)
              </span>
            </label>
            <ProjectSelect
              value={selectedProject}
              onChange={setSelectedProject}
              placeholder="Select project…"
            />
            {!selectedProject && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle size={11} /> Select a project to enable punch in /
                out
              </p>
            )}
          </div>

          <div
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border ${
              geoStatus === "allowed"
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : geoStatus === "fetching"
                  ? "bg-blue-50 text-blue-600 border-blue-100"
                  : "bg-red-50 text-red-600 border-red-100"
            }`}
          >
            <MapPin size={12} className="shrink-0" />
            {geoStatus === "fetching" && "📡 Fetching your location…"}
            {geoStatus === "allowed" && `✓ On-site · ${locationStr}`}
            {geoStatus === "too-far" &&
              `📍 ${distanceAway}m from site — move closer to punch`}
            {geoStatus === "denied" &&
              "⚠ Location access denied — enable in browser settings"}
          </div>

          {(punchInTime || punchOutTime) && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 space-y-1.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Today's Record
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                {punchInTime && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-gray-700">
                      In: {punchInTime}
                    </span>
                  </div>
                )}
                {punchOutTime && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-xs font-semibold text-gray-700">
                      Out: {punchOutTime}
                    </span>
                  </div>
                )}
                {isPunchedIn && !isPunchedOut && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 animate-pulse">
                    ● On-Site
                  </span>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-xs px-3 py-2.5 rounded-xl">
              <AlertCircle size={13} /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs px-3 py-2.5 rounded-xl">
              <CheckCheck size={13} /> {success}
            </div>
          )}

          {pendingAction && (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div
                className={`px-3 py-2 text-xs font-bold text-white ${pendingAction === "in" ? "bg-extra-darkblue" : "bg-orange-500"}`}
              >
                {pendingAction === "in" ? "📍 Punch In" : "🏁 Punch Out"} —{" "}
                {step === "capture" ? "Take a Selfie" : "Confirm & Submit"}
              </div>
              <div
                className="relative bg-black w-full"
                style={{ height: "200px" }}
              >
                {camError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-50 px-4">
                    <p className="text-xs text-gray-400 text-center">
                      {camErrMsg}
                    </p>
                    <button
                      onClick={() => setStep("confirm")}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-extra-darkblue"
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
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <span className="text-4xl">👤</span>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>
              {step === "confirm" && (
                <div className="px-3 pt-3">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={
                      pendingAction === "in"
                        ? "e.g. Starting site inspection…"
                        : "e.g. Completed tasks for today."
                    }
                    rows={2}
                    maxLength={300}
                    disabled={loading}
                    className="w-full text-sm rounded-xl px-3 py-2 resize-none outline-none border border-gray-200 focus:border-blue-400 text-gray-700 placeholder-gray-300 bg-gray-50"
                  />
                  <p className="text-right text-[10px] mt-0.5 text-gray-400">
                    {notes.length}/300
                  </p>
                </div>
              )}
              <div className="flex gap-2 p-3">
                <button
                  onClick={() => {
                    streamRef.current?.getTracks().forEach((t) => t.stop());
                    setPendingAction(null);
                  }}
                  disabled={loading}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                >
                  Cancel
                </button>
                {step === "capture" ? (
                  <>
                    <button
                      onClick={() => setStep("confirm")}
                      disabled={loading}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50"
                    >
                      Skip Photo
                    </button>
                    <button
                      onClick={takePhoto}
                      disabled={camError || loading}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40 ${pendingAction === "in" ? "bg-extra-darkblue" : "bg-orange-500"}`}
                    >
                      📷 Capture
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={retake}
                      disabled={loading}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50"
                    >
                      Retake
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={loading}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40 flex items-center justify-center gap-1.5 ${pendingAction === "in" ? "bg-extra-darkblue" : "bg-orange-500"}`}
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />{" "}
                          Saving…
                        </>
                      ) : (
                        "✓ Confirm"
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {!pendingAction && (
            <div className="flex gap-3">
              {!isPunchedIn ? (
                <button
                  onClick={() => setPendingAction("in")}
                  disabled={geoBlocked || !selectedProject}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition-all"
                  style={{
                    background: "linear-gradient(135deg, #0F2854, #1C4D8D)",
                  }}
                >
                  📍 Punch In
                </button>
              ) : !isPunchedOut ? (
                <>
                  <div className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />{" "}
                    On-Site since {punchInTime}
                  </div>
                  <button
                    onClick={() => setPendingAction("out")}
                    disabled={geoBlocked || !selectedProject}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition-all"
                    style={{
                      background: "linear-gradient(135deg, #E07800, #FF9500)",
                    }}
                  >
                    🏁 Punch Out
                  </button>
                </>
              ) : (
                <div className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold bg-gray-50 text-gray-500 border border-gray-200">
                  <CheckCheck size={15} /> Day Complete · {punchInTime} →{" "}
                  {punchOutTime}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Project Select ────────────────────────────────────────────────────────────
function ProjectSelect({ value, onChange }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getProjects()
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 text-gray-700 bg-white w-36 sm:w-44"
    >
      <option value="">All Projects</option>
      {loading && <option disabled>Loading…</option>}
      {projects?.map((p) => (
        <option key={p._id} value={p._id}>
          {p.name || p.title || p._id}
        </option>
      ))}
    </select>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────
function SectionCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  sub,
  children,
  action,
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
          >
            <Icon size={15} className={iconColor} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-extra-darkblue">{title}</h3>
            {sub && <p className="text-xs text-gray-400">{sub}</p>}
          </div>
        </div>
        {action && (
          <div className="flex items-center gap-2 flex-wrap">{action}</div>
        )}
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </div>
  );
}

// ── Add Worker Modal ──────────────────────────────────────────────────────────
function AddWorkerModal({ site, projectId, onClose, onAdded, isRegister = false }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    trade: "general",
    contractor: "",
    idProof: "",
    zone: "",
    engineer: "",
    durationDays: 1,
    customDays: "",
    customUnit: "days",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [customTrade, setCustomTrade] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const expiry = (() => {
    if (form.durationMode === "custom" && form.customEnd)
      return new Date(form.customEnd);
    const d = new Date();
    d.setDate(d.getDate() + Number(form.durationDays));
    return d;
  })();

  const [engineers, setEngineers] = useState([]);
  useEffect(() => {
    const fetchEngineers = async () => {
      const projId = form.project || projectId;
      if (!projId) { setEngineers([]); return; }
      try {
        const res = await fetch(`${API_BASE}/admin/engineers?projectId=${projId}`, { headers: authHeaders() });
        const data = await res.json();
        setEngineers(Array.isArray(data) ? data : []);
        if (form.engineer && Array.isArray(data) && !data.find(e => e._id === form.engineer)) {
          set("engineer", "");
        }
      } catch (err) {
        setEngineers([]);
      }
    };
    fetchEngineers();
  }, [form.project, projectId]);

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (isRegister) {
  if (!form.email.trim() || !form.password.trim()) {
    setError("Email and Password are required for registration");
    return;
  }
}
if (!form.idProof.trim()) {
  setError("ID Proof is required to uniquely identify the worker");
  return;
}
    if (form.durationMode === "custom" && !form.customEnd) {
      setError("Pick a custom end date");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const finalProject = form.project || projectId;
      if (!finalProject) { setError("Please select a project"); return; }
      const finalTrade =
  form.trade === "other" ? customTrade.trim() : form.trade;
     const payload =
  form.durationMode === "custom"
    ? {
        ...form,
        trade: form.trade === "other" ? "other" : form.trade,
        customTrade: form.trade === "other" ? customTrade.trim() : "",
        site,
        project: finalProject,
        assignmentStart: form.customStart || todayISO(),
        assignmentEnd: form.customEnd,
        durationDays: undefined,
      }
    : {
        ...form,
        trade: form.trade === "other" ? "other" : form.trade,
        customTrade: form.trade === "other" ? customTrade.trim() : "",
        site,
        project: finalProject,
      };
      const worker = isRegister
        ? await api.registerWorker(payload)
        : await api.createWorker(payload);
      onAdded(worker);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <UserPlus size={15} className="text-orange-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-extra-darkblue">
                {isRegister ? "Register Worker (Login Credentials)" : "Add Site Worker"}
              </h3>
              <p className="text-xs text-gray-400">
                {isRegister ? "Creates login credentials to punch in/out" : "Appears in today's roster immediately"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={15} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-xs px-3 py-2.5 rounded-xl">
              <AlertCircle size={13} /> {error}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Full Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input type="text" placeholder="e.g. Ramesh Kumar" value={form.name} onChange={(e) => set("name", e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-800 placeholder-gray-300" />
            </div>
          </div>
          {isRegister && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Email (Username) <span className="text-red-400">*</span></label>
                <div className="relative">
                  <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input type="email" placeholder="worker@example.com" value={form.email} onChange={(e) => set("email", e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-800 placeholder-gray-300" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Password <span className="text-red-400">*</span></label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="Min 6 characters" value={form.password} onChange={(e) => set("password", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-800 placeholder-gray-300" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-500 font-bold">
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">Phone</label>
              <div className="relative">
                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input type="tel" placeholder="9876543210" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-800 placeholder-gray-300" />
              </div>
            </div>
           <div>
  <label className="text-xs font-semibold text-gray-600 block mb-1.5">
    Trade
  </label>

  {/* Dropdown */}
  <select
    value={form.trade}
    onChange={(e) => {
      set("trade", e.target.value);
      if (e.target.value !== "other") setCustomTrade("");
    }}
    className="w-full py-2.5 px-3 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 text-gray-800 capitalize bg-white"
  >
    {TRADES?.map((t) => (
      <option key={t} value={t}>
        {t.charAt(0).toUpperCase() + t.slice(1)}
      </option>
    ))}
  </select>

  {/* SAME PLACE input (only when other) */}
  {form.trade === "other" && (
    <input
      type="text"
      placeholder="Enter custom trade"
      value={customTrade}
      onChange={(e) => setCustomTrade(e.target.value)}
      className="mt-2 w-full py-2.5 px-3 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 text-gray-800"
    />
  )}
</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">Contractor</label>
              <div className="relative">
                <Briefcase size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input type="text" placeholder="Company" value={form.contractor} onChange={(e) => set("contractor", e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-800 placeholder-gray-300" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">Zone</label>
              <div className="relative">
                <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input type="text" placeholder="e.g. Block A" value={form.zone} onChange={(e) => set("zone", e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-800 placeholder-gray-300" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Project <span className="text-red-400">*</span></label>
            <ProjectSelect value={form.project || projectId || ""} onChange={(v) => set("project", v)} />
            {!form.project && !projectId && (
              <p className="text-xs text-amber-600 mt-1">Select a project to assign this worker</p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Assigned Engineer <span className="font-normal text-gray-400 capitalize">(Optional)</span>
            </label>
            <div className="relative">
              <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <select value={form.engineer || ""} onChange={(e) => set("engineer", e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-800 bg-white">
                <option value="">Assign to yourself</option>
                {Array.isArray(engineers) && engineers.map((eng) => (
                  <option key={eng._id} value={eng._id}>{eng.name}</option>
                ))}
              </select>
            </div>
          </div>
          
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                ID Proof (Aadhaar / Any) <span className="text-red-400">*</span>
              </label>
              <input type="text" placeholder="XXXX-XXXX-XXXX" value={form.idProof} onChange={(e) => set("idProof", e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-800 placeholder-gray-300" />
            </div>
        
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-2">
              Active Until{" "}
              <span className="text-gray-400 font-normal">(worker auto-deactivates after this)</span>
            </label>
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-2">
              {["quick", "custom"]?.map((m) => (
                <button key={m} type="button" onClick={() => set("durationMode", m)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${(form.durationMode || "quick") === m ? "bg-white text-extra-darkblue shadow-sm" : "text-gray-400"}`}>
                  {m === "quick" ? "⚡ Quick Pick" : "📅 Custom Date"}
                </button>
              ))}
            </div>
            {(form.durationMode || "quick") === "quick" && (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-1.5">
                  {DURATION_OPTIONS?.map((d) => (
                    <button key={d.days} type="button" onClick={() => { set("durationDays", d.days); set("customDays", ""); }}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${form.durationDays === d.days && !form.customDays ? "bg-extra-darkblue text-white border-extra-darkblue" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
                <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 transition-all ${form.customDays ? "border-extra-darkblue bg-blue-50/30" : "border-gray-200 bg-white"}`}>
                  <span className="text-xs font-semibold text-gray-400 shrink-0">Custom:</span>
                  <input type="number" min="1" max="999" placeholder="e.g. 4" value={form.customDays || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      set("customDays", val);
                      const unit = form.customUnit || "days";
                      if (val && Number(val) > 0) {
                        const multiplier = unit === "weeks" ? 7 : unit === "months" ? 30 : 1;
                        set("durationDays", Number(val) * multiplier);
                      }
                    }}
                    className="w-16 text-sm outline-none bg-transparent font-bold text-extra-darkblue placeholder-gray-300" />
                  <div className="flex items-center gap-1 ml-auto">
                    {["days", "weeks", "months"]?.map((u) => (
                      <button key={u} type="button" onClick={() => {
                        set("customUnit", u);
                        if (form.customDays && Number(form.customDays) > 0) {
                          const multiplier = u === "weeks" ? 7 : u === "months" ? 30 : 1;
                          set("durationDays", Number(form.customDays) * multiplier);
                        }
                      }}
                        className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${(form.customUnit || "days") === u ? "bg-extra-darkblue text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}>
                        {u}
                      </button>
                    ))}
                    {form.customDays && (
                      <button type="button" onClick={() => { set("customDays", ""); set("durationDays", 1); }} className="ml-1 text-gray-300 hover:text-red-400 transition-colors text-xs">✕</button>
                    )}
                  </div>
                </div>
              </div>
            )}
            {form.durationMode === "custom" && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Start Date</label>
                    <input type="date" value={form.customStart || todayISO()} onChange={(e) => set("customStart", e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-700" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">End Date</label>
                    <input type="date" value={form.customEnd || ""} min={form.customStart || todayISO()} onChange={(e) => set("customEnd", e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-700" />
                  </div>
                </div>
                {form.customStart && form.customEnd && (
                  <p className="text-xs text-gray-400">Duration: <span className="font-semibold text-gray-600">{Math.round((new Date(form.customEnd) - new Date(form.customStart)) / 86400000)} days</span></p>
                )}
              </div>
            )}
            <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-100 px-3 py-2.5 rounded-xl">
              <CalendarDays size={13} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700">
                <p className="font-semibold">Auto-deactivates: {fmtDate(expiry)}</p>
                <p className="text-amber-500 mt-0.5">
                  {form.durationMode === "custom"
                    ? form.customEnd ? `From ${fmtDate(form.customStart || todayISO())} to ${fmtDate(form.customEnd)}` : "Pick an end date above"
                    : form.durationDays < 1
  ? "Active for few minutes (test mode)"
  : form.durationDays === 1
  ? "Today only."
  : `Active for ${form.durationDays} days from today.`}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 pb-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-extra-darkblue text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all active:scale-95">
            {saving ? <><RefreshCw size={13} className="animate-spin" /> Adding…</> : <><UserPlus size={13} /> {isRegister ? "Register Worker" : "Add Worker"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Renew Contract Modal ──────────────────────────────────────────────────────
function RenewModal({ worker, onClose, onRenewed }) {
  const [durationDays, setDurationDays] = useState(30);
  const [customDaysInput, setCustomDaysInput] = useState("");
  const [customUnit, setCustomUnit] = useState("days");
  const [mode, setMode] = useState("quick");
  const [customStart, setCustomStart] = useState(todayISO());
  const [customEnd, setCustomEnd] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const expiry = (() => {
    if (mode === "custom" && customEnd) return new Date(customEnd);
    const d = new Date();
    d.setDate(d.getDate() + durationDays);
    return d;
  })();

  const handleRenew = async () => {
    if (mode === "custom" && !customEnd) { setError("Pick a custom end date"); return; }
    setSaving(true);
    setError("");
    try {
      let updated;
      if (mode === "custom") {
        const res = await fetch(`${API_BASE}/site-workers/${worker.assignmentId || worker._id}`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ assignmentStart: customStart, assignmentEnd: customEnd, isActive: true }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to renew");
        updated = data.worker;
      } else {
        updated = await api.renewWorker(worker.assignmentId || worker._id, durationDays);
      }
      onRenewed(updated);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <RotateCcw size={15} className="text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-extra-darkblue">Renew Contract</h3>
              <p className="text-xs text-gray-400">{worker.name} · {worker.trade}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={15} /></button>
        </div>
        <div className="p-4 space-y-3">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-xs px-3 py-2.5 rounded-xl">
              <AlertCircle size={13} /> {error}
            </div>
          )}
          <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Current contract ends</p>
            <p className={`text-sm font-bold ${new Date(worker.assignmentEnd) < new Date() ? "text-red-500" : "text-extra-darkblue"}`}>
              {worker.assignmentEnd ? fmtDate(worker.assignmentEnd) : "Not set"}
              {new Date(worker.assignmentEnd) < new Date() && " · Expired"}
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-2">Extend until</label>
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-2">
              {["quick", "custom"]?.map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === m ? "bg-white text-extra-darkblue shadow-sm" : "text-gray-400"}`}>
                  {m === "quick" ? "⚡ Quick Pick" : "📅 Custom Date"}
                </button>
              ))}
            </div>
            {mode === "quick" && (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-1.5">
                  {DURATION_OPTIONS?.map((d) => (
                    <button key={d.days} type="button" onClick={() => { setDurationDays(d.days); setCustomDaysInput(""); }}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${durationDays === d.days && !customDaysInput ? "bg-extra-darkblue text-white border-extra-darkblue" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
                <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 transition-all ${customDaysInput ? "border-extra-darkblue bg-blue-50/30" : "border-gray-200 bg-white"}`}>
                  <span className="text-xs font-semibold text-gray-400 shrink-0">Custom:</span>
                  <input type="number" min="1" max="999" placeholder="e.g. 4" value={customDaysInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomDaysInput(val);
                      if (val && Number(val) > 0) {
                        const multiplier = customUnit === "weeks" ? 7 : customUnit === "months" ? 30 : 1;
                        setDurationDays(Number(val) * multiplier);
                      }
                    }}
                    className="w-16 text-sm outline-none bg-transparent font-bold text-extra-darkblue placeholder-gray-300" />
                  <div className="flex items-center gap-1 ml-auto">
                    {["days", "weeks", "months"]?.map((u) => (
                      <button key={u} type="button" onClick={() => {
                        setCustomUnit(u);
                        if (customDaysInput && Number(customDaysInput) > 0) {
                          const multiplier = u === "weeks" ? 7 : u === "months" ? 30 : 1;
                          setDurationDays(Number(customDaysInput) * multiplier);
                        }
                      }}
                        className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${customUnit === u ? "bg-extra-darkblue text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}>
                        {u}
                      </button>
                    ))}
                    {customDaysInput && (
                      <button type="button" onClick={() => { setCustomDaysInput(""); setDurationDays(30); }} className="ml-1 text-gray-300 hover:text-red-400 transition-colors text-xs">✕</button>
                    )}
                  </div>
                </div>
              </div>
            )}
            {mode === "custom" && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Start</label>
                    <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 text-gray-700" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">End</label>
                    <input type="date" value={customEnd} min={customStart} onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 text-gray-700" />
                  </div>
                </div>
                {customStart && customEnd && (
                  <p className="text-xs text-gray-400">Duration: <span className="font-semibold text-gray-600">{Math.round((new Date(customEnd) - new Date(customStart)) / 86400000)} days</span></p>
                )}
              </div>
            )}
          </div>
          <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 px-3 py-2.5 rounded-xl">
            <CalendarDays size={13} className="text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-700">
              <p className="font-semibold">New expiry: {fmtDate(expiry)}</p>
              <p className="text-emerald-500 mt-0.5">
                {mode === "custom" ? customEnd ? `${fmtDate(customStart)} → ${fmtDate(customEnd)}` : "Pick an end date above" : `Renewed from today for ${durationDays} days.`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 pb-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleRenew} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-extra-darkblue text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all active:scale-95">
            {saving ? <><RefreshCw size={13} className="animate-spin" /> Renewing…</> : <><RotateCcw size={13} /> Renew Contract</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Deactivate Confirm Modal ──────────────────────────────────────────────────
const DEACTIVATE_REASONS = [
  { value: "contract_ended", label: "Contract Ended", icon: "📅" },
  { value: "absent_long", label: "Long Absence", icon: "🚫" },
  { value: "misconduct", label: "Misconduct", icon: "⚠️" },
  { value: "work_completed", label: "Work Completed", icon: "✅" },
  { value: "other", label: "Other", icon: "📝" },
];

function DeactivateModal({ worker, onClose, onDeactivated }) {
  const [reason, setReason] = useState("contract_ended");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleDeactivate = async () => {
    setSaving(true);
    setError("");
    try {
      await api.deactivateWorker(worker.assignmentId || worker._id);
      onDeactivated(worker._id, reason, notes);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
              <Trash2 size={15} className="text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-extra-darkblue">Deactivate Worker</h3>
              <p className="text-xs text-gray-400">{worker.name} · {worker.trade}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={15} /></button>
        </div>
        <div className="p-4 space-y-3">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-xs px-3 py-2.5 rounded-xl">
              <AlertCircle size={13} /> {error}
            </div>
          )}
          <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarBg(worker.name)}`}>
              {worker.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-extra-darkblue truncate">{worker.name}</p>
              <p className="text-xs text-gray-400">{worker.contractor && `${worker.contractor} · `}Contract ends {fmtDate(worker.assignmentEnd)}</p>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-2">Reason for deactivation</label>
            <div className="grid grid-cols-1 gap-1.5">
              {DEACTIVATE_REASONS?.map((r) => (
                <button key={r.value} type="button" onClick={() => setReason(r.value)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all text-left ${reason === r.value ? "bg-red-50 border-red-200 text-red-700" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                  <span className="text-base shrink-0">{r.icon}</span>
                  {r.label}
                  {reason === r.value && <span className="ml-auto text-red-500">✓</span>}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Additional notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional context..." rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-700 placeholder-gray-300 resize-none" />
          </div>
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 px-3 py-2.5 rounded-xl">
            <span className="text-amber-500 shrink-0 mt-0.5">⚠️</span>
            <p className="text-xs text-amber-700">
              Worker will be moved to <strong>Inactive</strong>. Their attendance history is preserved. You can re-activate anytime via <strong>Renew Contract</strong>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 pb-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleDeactivate} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold disabled:opacity-40 transition-all active:scale-95">
            {saving ? <><RefreshCw size={13} className="animate-spin" /> Deactivating…</> : <><Trash2 size={13} /> Deactivate</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Worker Detail Popup ───────────────────────────────────────────────────────
function WorkerDetailPopup({ worker, record, onClose, onChange, onAutoSave, onDeactivate, onRenew }) {
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    api.getWorkerAssignments(worker._id)
      .then(setAssignments)
      .catch((err) => console.error("Assignments error:", err));
  }, [worker._id]);

  const trade = worker.trade || "general";
const tradeCls = TRADE_COLORS[trade] || TRADE_COLORS.general;
const isDeactivated = worker.isActive === false;
const autoStatus = isDeactivated
  ? (record.punchInTime ? "deactivated-present" : "deactivated-absent")
  : (record.status || calcStatus(record.punchInTime, record.punchOutTime, true));

  const statusCls = STATUS_BADGE[autoStatus] || STATUS_BADGE.absent;
  const statusLabel = isDeactivated
  ? "Inactive"
  : (STATUSES.find((s) => s.value === autoStatus)?.full || "Absent");
  const span = assignmentLabel(worker.assignmentStart, worker.assignmentEnd);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarBg(worker.name)}`}>
              {worker.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-extra-darkblue truncate">{worker.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${tradeCls}`}>{trade}</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{span}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusCls}`}>{statusLabel}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0 ml-2"><X size={15} /></button>
        </div>
        <div className="px-4 py-3 bg-gray-50/60 border-b border-gray-100 grid grid-cols-2 gap-2 text-xs">
          {worker.phone && <div className="flex items-center gap-1.5 text-gray-500"><Phone size={11} /> {worker.phone}</div>}
          {worker.contractor && <div className="flex items-center gap-1.5 text-gray-500 min-w-0"><Briefcase size={11} className="shrink-0" /> <span className="truncate">{worker.contractor}</span></div>}
          {worker.zone && <div className="flex items-center gap-1.5 text-gray-500"><Building2 size={11} /> {worker.zone}</div>}
          {worker.assignmentEnd && <div className="flex items-center gap-1.5 text-gray-500"><CalendarDays size={11} /> Ends {fmtDate(worker.assignmentEnd)}</div>}
          {worker.idProof && (
            <div className="col-span-2 flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 text-amber-700 font-semibold">
              <span className="text-amber-500 shrink-0">🪪</span>
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mr-1">ID Proof</span>
              <span className="truncate">{worker.idProof}</span>
            </div>
          )}
          {assignments.length > 0 && (
            <div className="col-span-2 space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned Under</p>
              <div className="flex flex-wrap gap-1.5">
                {assignments?.map((a) => (
                  <div key={a._id} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border ${a.isActive ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-gray-50 border-gray-200 text-gray-400"}`}>
                    <span>🏗️</span>
                    <span>{a.project?.name || a.project?.title || "Project"}</span>
                    <span className="text-gray-400 font-normal">·</span>
                    <span>{a.engineer?.name || "Engineer"}</span>
                    {!a.isActive && <span className="text-gray-400">(inactive)</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-black block mb-2">Attendance Status</label>
            <div className={`grid grid-cols-3 gap-2 ${isDeactivated ? "opacity-50 pointer-events-none" : ""}`}>
  {STATUSES?.map((s) => {
    const isSelected = autoStatus === s.value;
    return (
      <button key={s.value}
        disabled={isDeactivated}
        onClick={() => {
          if (isDeactivated) return;
          const updated = { ...record, status: s.value };
          onChange(updated);
          onAutoSave(updated);
        }}
        className={`py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${isSelected ? s.cls + " border-transparent shadow-sm scale-[1.02]" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
        {s.full}
      </button>
    );
  })}
</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">Zone</label>
              <input type="text" placeholder="e.g. Block A" value={record.zone || ""} onChange={(e) => onChange({ ...record, zone: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-700 placeholder-gray-300 bg-white" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">Notes</label>
              <input type="text" placeholder="Any notes..." value={record.notes || ""} onChange={(e) => onChange({ ...record, notes: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-700 placeholder-gray-300 bg-white" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 pb-4">
          <button onClick={() => { onRenew(worker); onClose(); }} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-blue-200 text-blue-600 text-xs font-bold hover:bg-blue-50 transition-all">
            <RotateCcw size={12} /> Renew
          </button>
          <button onClick={() => { onDeactivate(worker); onClose(); }} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-red-200 text-red-500 text-xs font-bold hover:bg-red-50 transition-all">
            <Trash2 size={12} /> Deactivate
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-extra-darkblue text-white text-sm font-bold hover:opacity-90 transition-all active:scale-95">Done</button>
        </div>
      </div>
    </div>
  );
}

// ── Worker Card ───────────────────────────────────────────────────────────────
function WorkerCard({ worker, record, onClick }) {
  const trade = worker.trade || "general";
  const tradeCls = TRADE_COLORS[trade] || TRADE_COLORS.general;
 const isDeactivated = worker.isActive === false;
const autoStatus = isDeactivated
  ? (record.punchInTime ? "deactivated-present" : "deactivated-absent")
  : (record.status || calcStatus(record.punchInTime, record.punchOutTime, true));
const statusCls = isDeactivated
  ? "bg-gray-100 text-gray-400 border border-gray-200"
  : (STATUS_BADGE[autoStatus] || STATUS_BADGE.absent);
const statusLabel = isDeactivated
  ? (record.punchInTime ? "Was Present · Inactive" : "Inactive")
  : (STATUSES.find((s) => s.value === autoStatus)?.full || "Absent");
const borderCls = isDeactivated ? "border-l-gray-300" : (STATUS_BORDER[autoStatus] || "border-l-gray-200");



  return (
    <button onClick={onClick}
      className={`w-full text-left bg-white rounded-xl border border-gray-100 border-l-4 ${borderCls} shadow-sm px-3 py-2.5 flex items-center gap-2.5 hover:shadow-md transition-all duration-150 active:scale-[0.99] group`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarBg(worker.name)}`}>
        {worker.name?.charAt(0)?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-bold text-extra-darkblue truncate">{worker.name}</p>
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full border capitalize ${tradeCls}`}>{trade}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400 flex-wrap">
          {record.punchInTime ? <span className="text-emerald-600 font-medium">In {to12hr(record.punchInTime)}</span> : <span>Not punched in</span>}
          {record.punchOutTime && <span className="text-red-500 font-medium">· Out {to12hr(record.punchOutTime)}</span>}
          {worker.contractor && <span className="hidden sm:inline">· {worker.contractor}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusCls}`}>{statusLabel}</span>
        <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1 pt-2">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
        <ChevronLeft size={14} />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1)?.map((p) => (
        <button key={p} onClick={() => onChange(p)}
          className={`w-7 h-7 rounded-lg text-xs font-bold border transition-all ${p === page ? "bg-extra-darkblue text-white border-extra-darkblue" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
          {p}
        </button>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
        className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

// ── ID Proof Lookup Modal ─────────────────────────────────────────────────────
function IdLookupModal({ onClose, onRenew }) {
  const [idInput, setIdInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!idInput.trim()) { setError("Enter an ID proof number"); return; }
    setSearching(true);
    setError("");
    setResult(null);
    try {
      setResult(await api.lookupByIdProof(idInput.trim()));
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const trade = result?.trade || "general";
  const tradeCls = TRADE_COLORS[trade] || TRADE_COLORS.general;
  const isExpired = result?.assignmentEnd && new Date(result.assignmentEnd) < new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-base shrink-0">🪪</div>
            <div>
              <h3 className="text-sm font-bold text-extra-darkblue">Lookup by ID Proof</h3>
              <p className="text-xs text-gray-400">Find any worker — active or deactivated</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0"><X size={15} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">ID Proof Number</label>
            <div className="flex gap-2">
              <input type="text" placeholder="e.g. XXXX-XXXX-XXXX" value={idInput}
                onChange={(e) => { setIdInput(e.target.value); setError(""); setResult(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 min-w-0 px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-800 placeholder-gray-300" />
              <button onClick={handleSearch} disabled={searching}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-extra-darkblue text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 active:scale-95 shrink-0">
                {searching ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
                <span className="hidden sm:inline">{searching ? "Searching…" : "Search"}</span>
              </button>
            </div>
          </div>
          {error && <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-xs px-3 py-2.5 rounded-xl"><AlertCircle size={13} /> {error}</div>}
          {result && (
            <div className={`rounded-xl border-2 overflow-hidden ${result.isActive ? "border-emerald-200" : "border-amber-200"}`}>
              <div className={`px-4 py-2 flex items-center justify-between flex-wrap gap-1 text-xs font-bold ${result.isActive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                <span>{result.isActive 
  ? "✅ Active Worker" 
  : isExpired 
    ? "⚠️ Expired Contract" 
    : "⚠️ Deactivated (Contract still valid)"}</span>
                {result.assignmentEnd && (
  <span className={isExpired ? "text-red-500" : "text-amber-600"}>
    {isExpired ? "Expired" : "Valid until"} {fmtDate(result.assignmentEnd)}
  </span>
)}
</div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-bold shrink-0 ${avatarBg(result.name)}`}>
                    {result.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-extra-darkblue">{result.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${tradeCls}`}>{trade}</span>
                      {result.contractor && <span className="text-xs text-gray-400 truncate">· {result.contractor}</span>}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[{ icon: Phone, label: "Phone", value: result.phone }, { icon: Building2, label: "Site", value: result.site }, { icon: Building2, label: "Zone", value: result.zone }, { icon: CalendarDays, label: "ID", value: result.idProof }]
                    .filter((f) => f.value)?.map((f) => (
                      <div key={f.label} className="flex items-center gap-1.5 text-gray-500 min-w-0">
                        <f.icon size={11} className="text-gray-400 shrink-0" />
                        <span className="font-semibold text-gray-400 shrink-0">{f.label}:</span>
                        <span className="truncate">{f.value}</span>
                      </div>
                    ))}
                </div>
              </div>
              <div className="px-4 pb-4">
                <button onClick={() => { onRenew(result); onClose(); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-extra-darkblue text-white text-sm font-bold hover:opacity-90 transition-all active:scale-95">
                  <RotateCcw size={13} />
                  {result.isActive ? "Renew / Extend Contract" : "Re-activate & Renew Contract"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Inactive Worker Card ──────────────────────────────────────────────────────
function InactiveWorkerCard({ worker, onRenew }) {
  const trade = worker.trade || "general";
  const tradeCls = TRADE_COLORS[trade] || TRADE_COLORS.general;
  const isExpired = worker.assignmentEnd && new Date(worker.assignmentEnd) < new Date();

  return (
    <div className="w-full bg-gray-50 rounded-xl border border-dashed border-gray-200 border-l-4 border-l-gray-300 px-3 py-2.5 flex items-center gap-2.5 opacity-75">
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-gray-200 text-gray-500">
        {worker.name?.charAt(0)?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-bold text-gray-500 truncate">{worker.name}</p>
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full border capitalize ${tradeCls} opacity-60`}>{trade}</span>
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-500">Inactive</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400 flex-wrap">
          {worker.phone && <span>{worker.phone}</span>}
          {worker.idProof && <span>· 🪪 {worker.idProof}</span>}
          {worker.assignmentEnd && <span className={isExpired ? "text-red-400 font-medium" : ""}>· {isExpired ? "Expired" : "Ended"} {fmtDate(worker.assignmentEnd)}</span>}
        </div>
      </div>
      <button onClick={() => onRenew(worker)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-all active:scale-95 shrink-0">
        <RotateCcw size={11} /> <span className="hidden sm:inline">Renew</span>
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
// ─── KEY CHANGE: export name is AllSiteAttendancePage ────────────────────────
export default function AllSiteAttendancePage() {
  const [workers, setWorkers] = useState([]);
  const [inactiveWorkers, setInactiveWorkers] = useState([]);
  const [records, setRecords] = useState({});
  const [fetching, setFetching] = useState(false);
  const [fetchingInactive, setFetchingInactive] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState(null);
  const [showIdLookup, setShowIdLookup] = useState(false);
  const [renewingWorker, setRenewingWorker] = useState(null);
  const [deactivatingWorker, setDeactivatingWorker] = useState(null);
  const [detailWorker, setDetailWorker] = useState(null);
  const [page, setPage] = useState(1);
  const [inactivePage, setInactivePage] = useState(1);
  const [inactiveSearch, setInactiveSearch] = useState("");
  const [showEngineerAttendance, setShowEngineerAttendance] = useState(false);

  const [site, setSiteRaw] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("attendance_site") || "";
  });
  const [projectId, setProjectIdRaw] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("attendance_project") || "";
  });
  const setProjectId = (val) => {
    setProjectIdRaw(val);
    if (typeof window !== "undefined") localStorage.setItem("attendance_project", val);
  };
  const setSite = (val) => {
    setSiteRaw(val);
    if (typeof window !== "undefined") localStorage.setItem("attendance_site", val);
  };
  const [date, setDate] = useState(todayISO());

  const showToast = (msg, type = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadWorkers = useCallback(async () => {
    setFetching(true);
    setSubmitted(false);
    try {
      // ─── KEY CHANGE: api.getWorkers always sends all=true in this file ──
      const data = await api.getWorkers(site, date, projectId);
      setWorkers(data);
      const init = {};
      data.forEach((w) => {
  if (!w?._id) return; // ← skip any malformed worker objects
  const att = w.attendance;
        const attDate = att?.date ? new Date(att.date).toLocaleDateString("en-CA") : null;
        const isForSelectedDate = attDate === date;
        const inTime = isForSelectedDate && att?.punchInTime ? toLocalHHMM(att.punchInTime) : "";
        const outTime = isForSelectedDate && att?.punchOutTime ? toLocalHHMM(att.punchOutTime) : "";
        init[w._id] = {
          workerId: w._id,
          assignmentId: w.assignmentId || null,
          status: isForSelectedDate && att?.status ? att.status : calcStatus(inTime, outTime, w.isActive !== false),
          punchInTime: inTime,
          punchOutTime: outTime,
          zone: att?.zone || w.zone || "",
          taskAssigned: att?.taskAssigned || "",
          notes: att?.notes || "",
        };
      });
      setRecords(init);
    } catch (err) {
      showToast(err.message);
    } finally {
      setFetching(false);
    }
  }, [site, date, projectId]);

  useEffect(() => { loadWorkers(); }, [loadWorkers]);

  const loadInactiveWorkers = useCallback(async () => {
    if (!showInactive) return;
    setFetchingInactive(true);
    try {
      setInactiveWorkers(await api.getInactiveWorkers(site, projectId));
    } catch (err) {
      showToast(err.message);
    } finally {
      setFetchingInactive(false);
    }
  }, [showInactive, site, projectId]);

  useEffect(() => { loadInactiveWorkers(); }, [loadInactiveWorkers]);
  useEffect(() => { setPage(1); }, [search, filterStatus]);
  useEffect(() => { setInactivePage(1); }, [inactiveSearch]);

  const autoSave = useCallback(async (record) => {
    try {
      const base = date || todayISO();
      await api.bulkSubmit({
        site, project: projectId, date: base,
        records: [{
          workerId: record.workerId,
          assignmentId: record.assignmentId || null,
          status: record.status || "present",
          punchInTime: record.punchInTime ? `${base}T${record.punchInTime}:00` : null,
          punchOutTime: record.punchOutTime ? `${base}T${record.punchOutTime}:00` : null,
          zone: record.zone || "",
          taskAssigned: record.taskAssigned || "",
          notes: record.notes || "",
        }],
      });
    } catch (err) {
      showToast("Auto-save failed: " + err.message);
    }
  }, [site, date, projectId]);

  const handleWorkerAdded = (worker) => {
    setWorkers((prev) => [...prev, worker]);
    setRecords((prev) => ({
      ...prev,
      [worker._id]: { workerId: worker._id, status: "present", punchInTime: "", punchOutTime: "", zone: worker.zone || "", taskAssigned: "", notes: "" },
    }));
    showToast(`${worker.name} added to roster`, "success");
  };

const handleDeactivated = (id) => {
  // update isActive in-place so the card immediately shows "Inactive" badge
  setWorkers((prev) => prev.map((w) => w._id === id ? { ...w, isActive: false } : w));
  setRecords((prev) => ({
    ...prev,
    [id]: {
      ...prev[id],
      status: prev[id]?.punchInTime ? "deactivated-present" : "deactivated-absent",
    },
  }));
  showToast("Worker deactivated", "success");
};

  const handleRenewed = (updatedWorker) => {
    const wasInactive = inactiveWorkers.some((w) => w._id === updatedWorker._id);
    if (wasInactive) {
      setInactiveWorkers((prev) => prev.filter((w) => w._id !== updatedWorker._id));
      setWorkers((prev) => [...prev, { ...updatedWorker, isActive: true }]);
      setRecords((prev) => ({
        ...prev,
        [updatedWorker._id]: { workerId: updatedWorker._id, status: "present", punchInTime: "", punchOutTime: "", zone: updatedWorker.zone || "", taskAssigned: "", notes: "" },
      }));
    } else {
      setWorkers((prev) => prev?.map((w) => w._id === updatedWorker._id ? { ...w, ...updatedWorker } : w));
    }
    showToast(`${updatedWorker.name}'s contract renewed`, "success");
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const base = date || todayISO();
      const recordsArray = Object.values(records)?.map((r) => ({
        ...r,
        assignmentId: r.assignmentId || null,
        punchInTime: r.punchInTime ? `${base}T${r.punchInTime}:00` : null,
        punchOutTime: r.punchOutTime ? `${base}T${r.punchOutTime}:00` : null,
      }));
      await api.bulkSubmit({ site, project: projectId, date, records: recordsArray });
      setSubmitted(true);
      showToast(`Attendance saved for ${recordsArray.length} workers`, "success");
    } catch (err) {
      showToast(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = workers.filter((w) => {
    const ms = [w.name, w.phone, w.trade, w.contractor].some((f) => f?.toLowerCase().includes(search.toLowerCase()));
    const mSt = filterStatus === "all" || calcStatus(records[w._id]?.punchInTime, records[w._id]?.punchOutTime, w.isActive !== false) === filterStatus;
    const mSite = !site.trim() || (w.site || "").toLowerCase().includes(site.toLowerCase());
    return ms && mSt && mSite;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const filteredInactive = inactiveWorkers.filter((w) =>
    [w.name, w.phone, w.trade, w.contractor].some((f) => f?.toLowerCase().includes(inactiveSearch.toLowerCase()))
  );
  const totalInactivePages = Math.ceil(filteredInactive.length / PAGE_SIZE);
  const paginatedInactive = filteredInactive.slice((inactivePage - 1) * PAGE_SIZE, inactivePage * PAGE_SIZE);

  const totalWorkers = workers.length;
  const presentCount = Object.values(records).filter((r) => ["present", "late", "half-day"].includes(r.status || calcStatus(r.punchInTime, r.punchOutTime))).length;
  const absentCount = Object.values(records).filter((r) => (r.status || calcStatus(r.punchInTime, r.punchOutTime)) === "absent").length;
  const markedCount = Object.values(records).filter((r) => r.status && r.status !== "absent").length;
  const hasActiveFilter = filterStatus !== "all" || search;

  return (
    <div className="space-y-4 pb-6">
      {showEngineerAttendance && (
        <EngineerAttendanceModal onClose={() => setShowEngineerAttendance(false)} defaultProjectId={projectId} />
      )}
      {showModal && (
        <AddWorkerModal site={site} projectId={projectId} onClose={() => setShowModal(false)} onAdded={handleWorkerAdded} />
      )}
      {showRegisterModal && (
        <AddWorkerModal site={site} projectId={projectId} isRegister={true} onClose={() => setShowRegisterModal(false)} onAdded={handleWorkerAdded} />
      )}
      {renewingWorker && (
        <RenewModal worker={renewingWorker} onClose={() => setRenewingWorker(null)} onRenewed={handleRenewed} />
      )}
      {deactivatingWorker && (
        <DeactivateModal worker={deactivatingWorker} onClose={() => setDeactivatingWorker(null)} onDeactivated={handleDeactivated} />
      )}
      {showIdLookup && (
        <IdLookupModal onClose={() => setShowIdLookup(false)} onRenew={setRenewingWorker} />
      )}
      {detailWorker && (
        <WorkerDetailPopup
          worker={detailWorker}
          record={records[detailWorker._id] || { workerId: detailWorker._id, status: "absent" }}
          onClose={() => setDetailWorker(null)}
          onChange={(updated) => setRecords((prev) => ({ ...prev, [detailWorker._id]: updated }))}
          onAutoSave={autoSave}
          onDeactivate={setDeactivatingWorker}
          onRenew={setRenewingWorker}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg max-w-[calc(100vw-2rem)] ${toast.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}>
          {toast.type === "success" ? <CheckCheck size={15} /> : <AlertCircle size={15} />}
          <span className="truncate">{toast.msg}</span>
        </div>
      )}

      {/* ── Header ── */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            {/* ─── KEY CHANGE: title reflects "All Workers" ──────────────── */}
            <h2 className="text-lg sm:text-xl font-bold text-extra-darkblue">
              All Workers Attendance
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              {fetching
                ? "Loading roster…"
                : site
                  ? `${totalWorkers} workers (all staff) · ${site}`
                  : `${totalWorkers} workers across all staff`}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => setShowEngineerAttendance(true)}
              className="flex items-center gap-1 px-2 sm:px-3 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-all active:scale-95">
              <UserCheck size={13} /> <span className="hidden sm:inline">My Attendance</span>
            </button>
            <button onClick={() => setShowIdLookup(true)}
              className="flex items-center gap-1 px-2 sm:px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all active:scale-95">
              🪪 <span className="hidden sm:inline">Renew Contract</span>
            </button>
            <button onClick={() => setShowRegisterModal(true)}
              className="flex items-center gap-1 px-2 sm:px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all active:scale-95">
              <UserPlus size={13} /> <span className="hidden sm:inline">Register Worker</span>
            </button>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1 px-2 sm:px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all active:scale-95">
              <Plus size={13} /> <span className="hidden sm:inline">Add Worker</span>
            </button>
            <button onClick={loadWorkers} disabled={fetching}
              className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50">
              <RefreshCw size={13} className={fetching ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ProjectSelect value={projectId} onChange={setProjectId} />
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-xl px-2.5 py-2">
            <Calendar size={12} className="text-blue-500 shrink-0" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="bg-transparent outline-none text-blue-700 text-xs font-semibold cursor-pointer w-[100px] sm:w-auto" />
          </div>
        </div>
      </div>

      {/* ── KPI Row ── */}
      {totalWorkers > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: "Total Workers", value: totalWorkers, icon: Users, color: "bg-blue-50 text-blue-600" },
            { label: "Punched In", value: markedCount, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
            { label: "Present", value: presentCount, icon: Activity, color: "bg-indigo-50 text-indigo-600" },
            { label: "Absent", value: absentCount, icon: Clock, color: "bg-red-50 text-red-500" },
          ]?.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                <s.icon size={16} />
              </div>
              <div>
                <p className="text-lg font-bold text-extra-darkblue">{s.value}</p>
                <p className="text-xs font-medium text-gray-500 leading-tight">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Progress bar ── */}
      {totalWorkers > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="font-bold text-extra-darkblue text-xs sm:text-sm whitespace-nowrap">
              {submitted ? "✅ Day submitted" : `${markedCount} / ${totalWorkers} punched in`}
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
              {STATUSES?.map((s) => {
                const count = Object.values(records).filter((r) => (r.status || calcStatus(r.punchInTime, r.punchOutTime)) === s.value).length;
                return count > 0 ? (
                  <span key={s.value} className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${s.cls}`}>
                    {s.full}: {count}
                  </span>
                ) : null;
              })}
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${submitted ? "bg-emerald-500" : "bg-blue-500"}`}
              style={{ width: `${totalWorkers ? (markedCount / totalWorkers) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {/* ── Worker cards section ── */}
      <SectionCard
        icon={HardHat}
        iconBg="bg-orange-50"
        iconColor="text-orange-500"
        title="All Workers Roster"
        sub={fetching ? "Loading…" : `${filtered.length} workers${totalPages > 1 ? ` · Page ${page}/${totalPages}` : ""}`}
        action={
          <>
            <button onClick={() => setShowInactive((v) => !v)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold border transition-all ${showInactive ? "bg-gray-700 text-white border-gray-700" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
              {showInactive ? <><X size={10} /> Inactive</> : <>Inactive</>}
            </button>
            <button onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold border transition-all ${showFilters || hasActiveFilter ? "bg-extra-darkblue text-white border-extra-darkblue" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
              <Filter size={11} /> Filter {hasActiveFilter && "●"}
            </button>
          </>
        }
      >
        {showFilters && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="relative flex-1 min-w-[120px]">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input type="text" placeholder="Search name, trade…" value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-blue-400 text-gray-700 placeholder-gray-300" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 text-gray-600 bg-white">
              <option value="all">All Status</option>
              {STATUSES?.map((s) => <option key={s.value} value={s.value}>{s.full}</option>)}
            </select>
            {hasActiveFilter && (
              <button onClick={() => { setSearch(""); setFilterStatus("all"); }} className="text-xs font-semibold text-red-400 hover:text-red-600 px-1">Clear</button>
            )}
          </div>
        )}

        {fetching && (
          <div className="space-y-2">
            {[1, 2, 3, 4]?.map((i) => (
              <div key={i} className="rounded-xl border border-gray-100 p-3 animate-pulse flex items-center gap-3 bg-gray-50">
                <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
                <div className="w-14 h-5 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {!fetching && workers.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-4xl mb-3">🏗️</p>
            <p className="text-sm font-semibold text-gray-500">
              {site ? `No active workers for "${site}"` : "No active workers found"}
            </p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Add workers to start marking attendance.</p>
            <button onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-all">
              <Plus size={14} /> Add First Worker
            </button>
          </div>
        )}

        {!fetching && workers.length > 0 && filtered.length === 0 && (
          <div className="py-8 text-center text-gray-300 text-sm">
            No workers match your search.
            <button onClick={() => { setSearch(""); setFilterStatus("all"); }} className="block mx-auto mt-2 text-xs font-semibold text-blue-600 hover:underline">Clear filters</button>
          </div>
        )}

        {!fetching && paginated.length > 0 && (
          <div className="space-y-2">
            {paginated?.map((w) => (
              <WorkerCard key={w._id} worker={w} record={records[w._id] || { workerId: w._id, status: "absent" }} onClick={() => setDetailWorker(w)} />
            ))}
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        )}
      </SectionCard>

      {/* ── Inactive Workers Section ── */}
      {showInactive && (
        <SectionCard
          icon={Users}
          iconBg="bg-gray-100"
          iconColor="text-gray-400"
          title="Inactive / Deactivated Workers"
          sub={fetchingInactive ? "Loading…" : `${filteredInactive.length} workers · Renew to re-activate`}
          action={
            <div className="relative">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input type="text" placeholder="Search…" value={inactiveSearch} onChange={(e) => setInactiveSearch(e.target.value)}
                className="pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-blue-400 text-gray-700 placeholder-gray-300 w-28 sm:w-32" />
            </div>
          }
        >
          {fetchingInactive && (
            <div className="space-y-2">
              {[1, 2, 3]?.map((i) => (
                <div key={i} className="rounded-xl border border-dashed border-gray-200 p-3 animate-pulse flex items-center gap-3 bg-gray-50">
                  <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                  </div>
                  <div className="w-14 h-7 bg-gray-200 rounded-xl" />
                </div>
              ))}
            </div>
          )}
          {!fetchingInactive && filteredInactive.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-3xl mb-2">😴</p>
              <p className="text-sm font-semibold text-gray-400">No inactive workers found</p>
              <p className="text-xs text-gray-300 mt-1">Workers you deactivate will appear here.</p>
            </div>
          )}
          {!fetchingInactive && paginatedInactive.length > 0 && (
            <div className="space-y-2">
              {paginatedInactive?.map((w) => (
                <InactiveWorkerCard key={w._id} worker={w} onRenew={setRenewingWorker} />
              ))}
              <Pagination page={inactivePage} totalPages={totalInactivePages} onChange={setInactivePage} />
            </div>
          )}
        </SectionCard>
      )}

      {/* ── Submit bar ── */}
      {workers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3 flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-extra-darkblue truncate">
              {submitted ? "Attendance submitted ✅" : `${totalWorkers} workers · ${date}`}
            </p>
            <p className="text-xs text-gray-400">{submitted ? "Re-submit to update." : "Review then submit."}</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all shrink-0">
            <Plus size={13} /> <span className="hidden sm:inline">Add</span>
          </button>
          <button onClick={handleSubmit} disabled={submitting || totalWorkers === 0}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-40 shrink-0 ${submitted ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-extra-darkblue text-white hover:opacity-90"}`}>
            {submitting ? <><RefreshCw size={14} className="animate-spin" /> <span className="hidden sm:inline">Saving…</span></> :
              submitted ? <><CheckCheck size={14} /> <span className="hidden sm:inline">Re-submit</span></> :
                <><Send size={14} /> Submit</>}
          </button>
        </div>
      )}
    </div>
  );
}