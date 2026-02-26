import Link from "next/link";

// ─── Inline Data ───────────────────────────────────────────────────────────────
const mockComplaints = [
  { id: "CMP-001", projectNo: "PRJ-2401", item: "Waterslide Alpha",  severity: "Critical", status: "Open",         daysOpen: 14, client: "AquaPark Dubai"    },
  { id: "CMP-002", projectNo: "PRJ-2389", item: "Wave Pool Panel B", severity: "High",     status: "Under Review", daysOpen: 7,  client: "Blue Lagoon Resort" },
  { id: "CMP-003", projectNo: "PRJ-2401", item: "Lazy River Flume",  severity: "Medium",   status: "Resolved",     daysOpen: 3,  client: "AquaPark Dubai"    },
  { id: "CMP-004", projectNo: "PRJ-2376", item: "Speed Slide Pro",   severity: "Low",      status: "Open",         daysOpen: 2,  client: "SunSplash Inc."    },
  { id: "CMP-005", projectNo: "PRJ-2412", item: "Funnel Ride X2",    severity: "Critical", status: "Under Review", daysOpen: 21, client: "Ocean World"        },
  { id: "CMP-006", projectNo: "PRJ-2398", item: "Body Slide 360",    severity: "High",     status: "Open",         daysOpen: 9,  client: "Aqua Universe"      },
  { id: "CMP-007", projectNo: "PRJ-2389", item: "Speed Slide Mini",  severity: "Medium",   status: "Resolved",     daysOpen: 5,  client: "Blue Lagoon Resort" },
  { id: "CMP-008", projectNo: "PRJ-2412", item: "Master Blaster",    severity: "High",     status: "Open",         daysOpen: 11, client: "Ocean World"        },
];

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
      display: "inline-block", whiteSpace: "nowrap",
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
      display: "inline-block", whiteSpace: "nowrap",
    }}>{status}</span>
  );
}

const summaryCards = [
  { label: "Total Open Complaints",     value: 24,     color: "#FF3B30", sub: "+3 since yesterday"        },
  { label: "Complaints Under Review",   value: 8,      color: "#FF9500", sub: "Avg 4.2 days in review"    },
  { label: "Resolved This Month",       value: 47,     color: "#34C759", sub: "↑ 12% vs last month"       },
  { label: "Critical Complaints",       value: 5,      color: "#FF3B30", sub: "Requires immediate action" },
  { label: "Avg Resolution Time",       value: "6.8d", color: "#4988C4", sub: "Target: 5 days"            },
  { label: "Pending Material Dispatch", value: 12,     color: "#FF9500", sub: "3 urgent requests"         },
];

export default function DashboardPage() {
  return (
    <>
      {/* ── Responsive Styles ── */}
      <style>{`
        .dash-wrapper {
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          padding: 16px;
          max-width: 100%;
          box-sizing: border-box;
        }

        /* Summary grid: 3 cols → 2 cols → 1 col */
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }
        @media (max-width: 900px) {
          .summary-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 540px) {
          .summary-grid { grid-template-columns: 1fr; }
        }

        /* Header flex: stack on mobile */
        .dash-header { margin-bottom: 28px; }
        .table-card-header {
          padding: 18px 22px;
          border-bottom: 1px solid rgba(73,136,196,0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        /* Card value size */
        .card-value {
          color: #0F2854;
          font-size: 34px;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 8px;
        }
        @media (max-width: 540px) {
          .card-value { font-size: 28px; }
        }

        /* ── Desktop table ── */
        .table-scroll {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .complaints-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 620px;
        }
        .th-cell {
          padding: 10px 16px;
          text-align: left;
          color: #1C4D8D;
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 0.5px;
        }
        .td-cell { padding: 12px 16px; }

        /* Show table, hide cards on desktop */
        .complaint-cards { display: none; }
        .table-scroll     { display: block; }

        /* ── Mobile / Tablet (≤ 768px): show cards, hide table ── */
        @media (max-width: 768px) {
          .table-scroll     { display: none; }
          .complaint-cards  { display: flex; flex-direction: column; gap: 12px; padding: 16px; }

          .complaint-card {
            border-radius: 12px;
            border: 1px solid rgba(73,136,196,0.15);
            background: #fff;
            padding: 14px 16px;
            box-shadow: 0 1px 8px rgba(15,40,84,0.05);
          }

          .cc-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            flex-wrap: wrap;
            gap: 6px;
          }
          .cc-id {
            color: #1C4D8D;
            font-weight: 700;
            font-size: 13px;
          }
          .cc-days {
            font-weight: 700;
            font-size: 13px;
          }

          .cc-item {
            color: #0F2854;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 4px;
          }
          .cc-client {
            color: #4988C4;
            font-size: 12px;
            margin-bottom: 10px;
          }

          .cc-bottom {
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
            justify-content: space-between;
          }
          .cc-badges { display: flex; gap: 6px; flex-wrap: wrap; }

          .cc-project {
            color: #4988C4;
            font-size: 11px;
            font-weight: 500;
          }
        }
      `}</style>

      <div className="dash-wrapper">

        {/* ── Header ── */}
        <div className="dash-header">
          <div style={{ color: "#4988C4", fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
            Overview
          </div>
          <h1 style={{ color: "#0F2854", fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 800, margin: 0 }}>
            Service Team Dashboard
          </h1>
          <p style={{ color: "#4988C4", fontSize: 13, margin: "4px 0 0" }}>
            Wednesday, 25 February 2026 · All Sites Active
          </p>
        </div>

        {/* ── Summary Cards ── */}
        <div className="summary-grid">
          {summaryCards.map((c, i) => (
            <div key={i} style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid rgba(73,136,196,0.15)",
              boxShadow: "0 2px 12px rgba(15,40,84,0.06)",
              padding: "20px 22px",
              overflow: "hidden",
            }}>
              <div style={{ color: "#4988C4", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>
                {c.label}
              </div>
              <div className="card-value">{c.value}</div>
              <div style={{ color: c.color, fontSize: 11, fontWeight: 500 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Recent Complaints Table ── */}
        <div style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid rgba(73,136,196,0.15)",
          boxShadow: "0 2px 12px rgba(15,40,84,0.06)",
          overflow: "hidden",
        }}>
          <div className="table-card-header">
            <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 15 }}>Recent Complaints</div>
            <Link href="/support/search" style={{
              background: "#0F2854", color: "#BDE8F5",
              padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              textDecoration: "none", display: "inline-block", whiteSpace: "nowrap",
            }}>View All →</Link>
          </div>

          {/* ── Desktop Table ── */}
          <div className="table-scroll">
            <table className="complaints-table">
              <thead>
                <tr style={{ background: "rgba(189,232,245,0.2)" }}>
                  {["ID", "Project", "Client", "Item", "Severity", "Status", "Days Open"].map(h => (
                    <th key={h} className="th-cell">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockComplaints.slice(0, 6).map((c, i) => (
                  <tr key={c.id} style={{
                    borderTop: "1px solid rgba(73,136,196,0.08)",
                    background: i % 2 === 0 ? "#fff" : "rgba(189,232,245,0.04)",
                  }}>
                    <td className="td-cell" style={{ color: "#1C4D8D", fontWeight: 700 }}>{c.id}</td>
                    <td className="td-cell" style={{ color: "#0F2854" }}>{c.projectNo}</td>
                    <td className="td-cell" style={{ color: "#4988C4", fontSize: 12 }}>{c.client}</td>
                    <td className="td-cell" style={{ color: "#0F2854" }}>{c.item}</td>
                    <td className="td-cell"><SeverityBadge level={c.severity} /></td>
                    <td className="td-cell"><StatusBadge status={c.status} /></td>
                    <td className="td-cell" style={{
                      color: c.daysOpen > 10 ? "#FF3B30" : "#34C759",
                      fontWeight: 700,
                    }}>{c.daysOpen}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile / Tablet Cards ── */}
          <div className="complaint-cards">
            {mockComplaints.slice(0, 6).map((c) => (
              <div key={c.id} className="complaint-card">
                <div className="cc-top">
                  <span className="cc-id">{c.id}</span>
                  <span className="cc-days" style={{ color: c.daysOpen > 10 ? "#FF3B30" : "#34C759" }}>
                    {c.daysOpen}d open
                  </span>
                </div>
                <div className="cc-item">{c.item}</div>
                <div className="cc-client">{c.client} · {c.projectNo}</div>
                <div className="cc-bottom">
                  <div className="cc-badges">
                    <SeverityBadge level={c.severity} />
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}