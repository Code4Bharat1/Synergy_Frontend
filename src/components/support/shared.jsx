"use client";

// ─── Mock Data ────────────────────────────────────────────────────────────────
// ⚠️  mockComplaints MUST be a plain array — never wrap in an object
export const mockComplaints = [
  { id: "CMP-001", projectNo: "PRJ-2401", item: "Waterslide Alpha",  severity: "Critical", status: "Open",         daysOpen: 14, client: "AquaPark Dubai",    location: "Dubai, UAE"   },
  { id: "CMP-002", projectNo: "PRJ-2389", item: "Wave Pool Panel B", severity: "High",     status: "Under Review", daysOpen: 7,  client: "Blue Lagoon Resort", location: "Maldives"     },
  { id: "CMP-003", projectNo: "PRJ-2401", item: "Lazy River Flume",  severity: "Medium",   status: "Resolved",     daysOpen: 3,  client: "AquaPark Dubai",    location: "Dubai, UAE"   },
  { id: "CMP-004", projectNo: "PRJ-2376", item: "Speed Slide Pro",   severity: "Low",      status: "Open",         daysOpen: 2,  client: "SunSplash Inc.",     location: "Florida, USA" },
  { id: "CMP-005", projectNo: "PRJ-2412", item: "Funnel Ride X2",    severity: "Critical", status: "Under Review", daysOpen: 21, client: "Ocean World",        location: "Singapore"    },
  { id: "CMP-006", projectNo: "PRJ-2398", item: "Body Slide 360",    severity: "High",     status: "Open",         daysOpen: 9,  client: "Aqua Universe",      location: "Abu Dhabi"    },
  { id: "CMP-007", projectNo: "PRJ-2389", item: "Speed Slide Mini",  severity: "Medium",   status: "Resolved",     daysOpen: 5,  client: "Blue Lagoon Resort", location: "Maldives"     },
  { id: "CMP-008", projectNo: "PRJ-2412", item: "Master Blaster",    severity: "High",     status: "Open",         daysOpen: 11, client: "Ocean World",        location: "Singapore"    },
];

export const mockProjects = [
  { id: "PRJ-2401", client: "AquaPark Dubai",    location: "Dubai, UAE",   items: ["Waterslide Alpha", "Lazy River Flume", "Tube Slide G3"]  },
  { id: "PRJ-2389", client: "Blue Lagoon Resort", location: "Maldives",     items: ["Wave Pool Panel B", "Speed Slide Mini"]                   },
  { id: "PRJ-2376", client: "SunSplash Inc.",     location: "Florida, USA", items: ["Speed Slide Pro", "Funnel Ride Classic"]                  },
  { id: "PRJ-2412", client: "Ocean World",        location: "Singapore",    items: ["Funnel Ride X2", "Body Slide 360", "Master Blaster"]      },
];

// ─── Badges ───────────────────────────────────────────────────────────────────
export const SeverityBadge = ({ level }) => {
  const map = {
    Critical: { bg: "#FF3B30", text: "#fff"    },
    High:     { bg: "#FF9500", text: "#fff"    },
    Medium:   { bg: "#FFCC00", text: "#0F2854" },
    Low:      { bg: "#34C759", text: "#fff"    },
  };
  const c = map[level] || map.Low;
  return (
    <span style={{
      background: c.bg, color: c.text,
      padding: "2px 10px", borderRadius: 99,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    }}>
      {level}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const map = {
    "Open":         { bg: "rgba(255,59,48,0.12)",  border: "#FF3B30", text: "#FF3B30" },
    "Under Review": { bg: "rgba(255,149,0,0.12)",  border: "#FF9500", text: "#FF9500" },
    "Resolved":     { bg: "rgba(52,199,89,0.12)",  border: "#34C759", text: "#34C759" },
  };
  const c = map[status] || map["Open"];
  return (
    <span style={{
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
    }}>
      {status}
    </span>
  );
};

// ─── Shared Styles ────────────────────────────────────────────────────────────
export const inputStyle = {
  background: "#fff",
  border: "1px solid rgba(73,136,196,0.3)",
  borderRadius: 8,
  padding: "10px 13px",
  fontSize: 13,
  color: "#0F2854",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

export const labelStyle = {
  display: "block",
  color: "#1C4D8D",
  fontSize: 11,
  fontWeight: 600,
  marginBottom: 6,
  letterSpacing: 0.5,
};

// ─── Layout Components ────────────────────────────────────────────────────────
export function PageHeader({ eyebrow, title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      {eyebrow && (
        <div style={{
          color: "#4988C4", fontSize: 11, fontWeight: 600,
          letterSpacing: 2, textTransform: "uppercase", marginBottom: 4,
        }}>
          {eyebrow}
        </div>
      )}
      <h1 style={{ color: "#0F2854", fontSize: 26, fontWeight: 800, margin: 0 }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ color: "#4988C4", fontSize: 13, margin: "4px 0 0" }}>
          {subtitle}
        </p>
      )}
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