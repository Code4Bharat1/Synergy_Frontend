import Link from "next/link";

// ─── Inline Data (no shared.jsx dependency) ───────────────────────────────────
const mockComplaints = [
  { id: "CMP-001", projectNo: "PRJ-2401", item: "Waterslide Alpha",  severity: "Critical", status: "Open",         daysOpen: 14, client: "AquaPark Dubai"     },
  { id: "CMP-002", projectNo: "PRJ-2389", item: "Wave Pool Panel B", severity: "High",     status: "Under Review", daysOpen: 7,  client: "Blue Lagoon Resort"  },
  { id: "CMP-003", projectNo: "PRJ-2401", item: "Lazy River Flume",  severity: "Medium",   status: "Resolved",     daysOpen: 3,  client: "AquaPark Dubai"     },
  { id: "CMP-004", projectNo: "PRJ-2376", item: "Speed Slide Pro",   severity: "Low",      status: "Open",         daysOpen: 2,  client: "SunSplash Inc."      },
  { id: "CMP-005", projectNo: "PRJ-2412", item: "Funnel Ride X2",    severity: "Critical", status: "Under Review", daysOpen: 21, client: "Ocean World"         },
  { id: "CMP-006", projectNo: "PRJ-2398", item: "Body Slide 360",    severity: "High",     status: "Open",         daysOpen: 9,  client: "Aqua Universe"       },
  { id: "CMP-007", projectNo: "PRJ-2389", item: "Speed Slide Mini",  severity: "Medium",   status: "Resolved",     daysOpen: 5,  client: "Blue Lagoon Resort"  },
  { id: "CMP-008", projectNo: "PRJ-2412", item: "Master Blaster",    severity: "High",     status: "Open",         daysOpen: 11, client: "Ocean World"         },
];

// ─── Inline Components ────────────────────────────────────────────────────────
function SeverityBadge({ level }) {
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
      display: "inline-block",
    }}>{level}</span>
  );
}

function StatusBadge({ status }) {
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
      display: "inline-block",
    }}>{status}</span>
  );
}

// ─── Summary cards config ─────────────────────────────────────────────────────
const summaryCards = [
  { label: "Total Open Complaints",     value: 24,     color: "#FF3B30", sub: "+3 since yesterday"        },
  { label: "Complaints Under Review",   value: 8,      color: "#FF9500", sub: "Avg 4.2 days in review"    },
  { label: "Resolved This Month",       value: 47,     color: "#34C759", sub: "↑ 12% vs last month"       },
  { label: "Critical Complaints",       value: 5,      color: "#FF3B30", sub: "Requires immediate action" },
  { label: "Avg Resolution Time",       value: "6.8d", color: "#4988C4", sub: "Target: 5 days"            },
  { label: "Pending Material Dispatch", value: 12,     color: "#FF9500", sub: "3 urgent requests"          },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: "#4988C4", fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
          Overview
        </div>
        <h1 style={{ color: "#0F2854", fontSize: 26, fontWeight: 800, margin: 0 }}>
          Service Team Dashboard
        </h1>
        <p style={{ color: "#4988C4", fontSize: 13, margin: "4px 0 0" }}>
          Wednesday, 25 February 2026 · All Sites Active
        </p>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
        marginBottom: 28,
      }}>
        {summaryCards.map((c, i) => (
          <div key={i} style={{
            background: "#fff",
            borderRadius: 16,
            border: "1px solid rgba(73,136,196,0.15)",
            boxShadow: "0 2px 12px rgba(15,40,84,0.06)",
            padding: "20px 22px",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* <div style={{
              position: "absolute", top: -14, right: -14,
              width: 64, height: 64, borderRadius: "50%",
              background: `${c.color}18`,
            }} /> */}
            <div style={{ color: "#4988C4", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, marginBottom: 8 }}>
              {c.label.toUpperCase()}
            </div>
            <div style={{ color: "#0F2854", fontSize: 34, fontWeight: 800, lineHeight: 1, marginBottom: 8 }}>
              {c.value}
            </div>
            <div style={{ color: c.color, fontSize: 11, fontWeight: 500 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Recent Complaints Table ────────────────────────────────────────── */}
      <div style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid rgba(73,136,196,0.15)",
        boxShadow: "0 2px 12px rgba(15,40,84,0.06)",
        overflow: "hidden",
      }}>
        <div style={{
          padding: "18px 22px",
          borderBottom: "1px solid rgba(73,136,196,0.1)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 15 }}>Recent Complaints</div>
          <Link href="/support/search" style={{
            background: "#0F2854", color: "#BDE8F5",
            padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            textDecoration: "none", display: "inline-block",
          }}>View All →</Link>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "rgba(189,232,245,0.2)" }}>
              {["ID", "Project", "Client", "Item", "Severity", "Status", "Days Open"].map(h => (
                <th key={h} style={{
                  padding: "10px 16px", textAlign: "left",
                  color: "#1C4D8D", fontWeight: 600, fontSize: 11, letterSpacing: 0.5,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockComplaints.slice(0, 6).map((c, i) => (
              <tr key={c.id} style={{
                borderTop: "1px solid rgba(73,136,196,0.08)",
                background: i % 2 === 0 ? "#fff" : "rgba(189,232,245,0.04)",
              }}>
                <td style={{ padding: "12px 16px", color: "#1C4D8D", fontWeight: 700 }}>{c.id}</td>
                <td style={{ padding: "12px 16px", color: "#0F2854" }}>{c.projectNo}</td>
                <td style={{ padding: "12px 16px", color: "#4988C4", fontSize: 12 }}>{c.client}</td>
                <td style={{ padding: "12px 16px", color: "#0F2854" }}>{c.item}</td>
                <td style={{ padding: "12px 16px" }}><SeverityBadge level={c.severity} /></td>
                <td style={{ padding: "12px 16px" }}><StatusBadge status={c.status} /></td>
                <td style={{
                  padding: "12px 16px",
                  color: c.daysOpen > 10 ? "#FF3B30" : "#34C759",
                  fontWeight: 700,
                }}>{c.daysOpen}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}