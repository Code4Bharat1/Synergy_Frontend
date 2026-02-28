"use client";

// ─── Theme ────────────────────────────────────────────────────────────────────
// #0F2854  extra-darkblue
// #1C4D8D  extra-blue
// #4988C4  medium-blue
// #BDE8F5  lightblue
// #EEF4FB  bg

// ─── Mock Data ────────────────────────────────────────────────────────────────
export const ENGINEER = {
  name: "Arjun Mehta",
  role: "Site Engineer",
  id: "ENG-0019",
  avatar: "AM",
};

export const PROJECTS = [
  { id: "PRJ-2401", name: "AquaPark Dubai",     location: "Dubai, UAE",    progress: 68, status: "Active"   },
  { id: "PRJ-2389", name: "Blue Lagoon Resort",  location: "Maldives",      progress: 45, status: "Active"   },
  { id: "PRJ-2376", name: "SunSplash Inc.",      location: "Florida, USA",  progress: 91, status: "Closing"  },
  { id: "PRJ-2412", name: "Ocean World",         location: "Singapore",     progress: 22, status: "Active"   },
];

export const ITEMS_BY_PROJECT = {
  "PRJ-2401": ["Waterslide Alpha", "Lazy River Flume", "Tube Slide G3", "Wave Pool Panel A"],
  "PRJ-2389": ["Wave Pool Panel B", "Speed Slide Mini", "Kiddie Pool Slide"],
  "PRJ-2376": ["Speed Slide Pro", "Funnel Ride Classic", "Body Slide 360"],
  "PRJ-2412": ["Funnel Ride X2", "Master Blaster", "Aqua Loop"],
};

export const DEPARTMENTS = [
  "Production", "QC / Quality Control", "Logistics", "Procurement",
  "Engineering", "On-site Contractor", "Management", "Other",
];

// ─── Shared UI ────────────────────────────────────────────────────────────────
export function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        {eyebrow && (
          <div style={{ color: "#4988C4", fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
            {eyebrow}
          </div>
        )}
        <h1 style={{ color: "#0F2854", fontSize: 26, fontWeight: 800, margin: 0, fontFamily: "'Syne', sans-serif" }}>{title}</h1>
        {subtitle && <p style={{ color: "#4988C4", fontSize: 13, margin: "4px 0 0" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      border: "1px solid rgba(73,136,196,0.15)",
      boxShadow: "0 2px 12px rgba(15,40,84,0.06)",
      ...style,
    }}>
      {children}
    </div>
  );
}

export function SectionHead({ icon, title, subtitle }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: "linear-gradient(135deg, #0F2854, #1C4D8D)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 17, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 14, fontFamily: "'Syne', sans-serif" }}>{title}</div>
        {subtitle && <div style={{ color: "#4988C4", fontSize: 11, marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

export const inputStyle = {
  width: "100%", background: "#F5F8FD",
  border: "1.5px solid rgba(73,136,196,0.25)",
  borderRadius: 10, padding: "10px 14px",
  fontSize: 13, color: "#0F2854",
  outline: "none", fontFamily: "'DM Sans', sans-serif",
  boxSizing: "border-box",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

export const labelStyle = {
  display: "block", color: "#1C4D8D",
  fontSize: 11, fontWeight: 600,
  marginBottom: 6, letterSpacing: 0.5,
};

export function Label({ children, required }) {
  return (
    <label style={labelStyle}>
      {String(children).toUpperCase()}
      {required && <span style={{ color: "#FF3B30", marginLeft: 3 }}>*</span>}
    </label>
  );
}

export function SubmitBtn({ children, loading, onClick, color = "blue" }) {
  const bg = color === "green"
    ? "linear-gradient(135deg, #34C759, #2EA44F)"
    : "linear-gradient(135deg, #1C4D8D, #0F2854)";
  return (
    <button onClick={onClick} disabled={loading} style={{
      background: loading ? "rgba(73,136,196,0.5)" : bg,
      color: "#fff", border: "none",
      padding: "12px 28px", borderRadius: 11,
      fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
      display: "flex", alignItems: "center", gap: 8,
      boxShadow: "0 4px 16px rgba(15,40,84,0.2)",
      transition: "opacity 0.2s, transform 0.15s",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {loading && <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />}
      {children}
    </button>
  );
}

export function StatusPill({ label, color }) {
  const map = {
    green:  { bg: "rgba(52,199,89,0.12)",  border: "#34C759", text: "#34C759" },
    orange: { bg: "rgba(255,149,0,0.12)",  border: "#FF9500", text: "#FF9500" },
    red:    { bg: "rgba(255,59,48,0.12)",  border: "#FF3B30", text: "#FF3B30" },
    blue:   { bg: "rgba(73,136,196,0.12)", border: "#4988C4", text: "#4988C4" },
  };
  const c = map[color] || map.blue;
  return (
    <span style={{
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
    }}>{label}</span>
  );
}

export function UploadBox({ label, accept, icon, caption, required, onChange }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <label style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 8,
        border: "2px dashed rgba(73,136,196,0.3)",
        borderRadius: 12, padding: "24px 16px",
        cursor: "pointer", background: "rgba(189,232,245,0.04)",
        transition: "background 0.2s, border-color 0.2s",
      }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(189,232,245,0.1)"; e.currentTarget.style.borderColor = "rgba(73,136,196,0.55)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(189,232,245,0.04)"; e.currentTarget.style.borderColor = "rgba(73,136,196,0.3)"; }}
      >
        <span style={{ fontSize: 28 }}>{icon}</span>
        <span style={{ color: "#1C4D8D", fontSize: 12, fontWeight: 600 }}>{caption}</span>
        <span style={{ color: "#4988C4", fontSize: 11 }}>Click to browse or drag & drop</span>
        <input type="file" accept={accept} style={{ display: "none" }} onChange={onChange} multiple />
      </label>
    </div>
  );
}

export const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Syne:wght@600;700;800&display=swap');
*, *::before, *::after { box-sizing: border-box; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
body { font-family: 'DM Sans', sans-serif; background: #EEF4FB; margin: 0; }`;