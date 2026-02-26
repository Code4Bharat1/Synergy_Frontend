import { PageHeader, Card, SeverityBadge } from "./shared";
import { TrendingUp, Layers, HardHat, RefreshCw, Clock, Zap, BarChart2, AlertTriangle } from "lucide-react";

// ── Inline badge fallback ─────────────────────────────────────────────────────
function SeverityBadgeFallback({ level }) {
  const map = {
    Critical: { bg: "#FF3B30", text: "#fff" },
    High:     { bg: "#FF9500", text: "#fff" },
    Medium:   { bg: "#FFCC00", text: "#0F2854" },
    Low:      { bg: "#34C759", text: "#fff" },
  };
  const c = map[level] || map.Low;
  return (
    <span style={{ background: c.bg, color: c.text, padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, display: "inline-block", whiteSpace: "nowrap" }}>
      {level}
    </span>
  );
}
const SB = typeof SeverityBadge !== "undefined" ? SeverityBadge : SeverityBadgeFallback;

// ── Data ──────────────────────────────────────────────────────────────────────
const byProject = [
  { label: "PRJ-2401 — AquaPark Dubai",  count: 8 },
  { label: "PRJ-2412 — Ocean World",     count: 9 },
  { label: "PRJ-2376 — SunSplash Inc.",  count: 6 },
  { label: "PRJ-2389 — Blue Lagoon",     count: 4 },
  { label: "PRJ-2398 — Aqua Universe",   count: 3 },
];

const batchFailure = [
  { batch: "BT-2024-117", rate: 72 },
  { batch: "BT-2024-102", rate: 55 },
  { batch: "BT-2024-089", rate: 34 },
  { batch: "BT-2024-095", rate: 18 },
];

const byItem = [
  { item: "Funnel Ride X2",    count: 7, severity: "Critical" },
  { item: "Waterslide Alpha",  count: 5, severity: "Critical" },
  { item: "Master Blaster",    count: 4, severity: "High"     },
  { item: "Body Slide 360",    count: 3, severity: "High"     },
  { item: "Wave Pool Panel B", count: 3, severity: "Medium"   },
  { item: "Speed Slide Pro",   count: 2, severity: "Low"      },
];

const contractors = [
  { name: "AquaBuild LLC",  rate: 12.4 },
  { name: "WaterTech Pro",  rate: 8.7  },
  { name: "SlideWorks Co.", rate: 5.2  },
  { name: "AquaForm Ltd.",  rate: 3.1  },
];

const monthlyResolved = [8, 14, 11, 19, 15, 22, 18, 25, 21, 28, 20, 47];
const months          = ["Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb"];
const maxResolved     = Math.max(...monthlyResolved);

// ── BarChart ──────────────────────────────────────────────────────────────────
function BarChart({ data, getValue, getLabel, getColor, unit = "" }) {
  const max = data.reduce((m, x) => Math.max(m, getValue(x)), 0) || 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {data.map((d, i) => {
        const val = getValue(d);
        const pct = (val / max) * 100;
        const col = getColor ? getColor(val) : null;
        const barBg = col
          ? col === "#FF3B30" ? "linear-gradient(90deg,#FF3B30,#FF6B6B)"
            : col === "#FF9500" ? "linear-gradient(90deg,#FF9500,#FFBB55)"
            : "linear-gradient(90deg,#34C759,#5FD77A)"
          : "linear-gradient(90deg, #0F2854, #4988C4)";
        return (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ color: "#4988C4", fontSize: 12 }}>{getLabel(d)}</span>
              <span style={{ color: col || "#0F2854", fontSize: 12, fontWeight: 700 }}>{val}{unit}</span>
            </div>
            <div style={{ height: 8, background: "rgba(73,136,196,0.12)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: barBg, transition: "width 0.6s ease" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const kpis = [
    { label: "Avg Response Time",      value: "2.4d", sub: "Time to first action",    color: "#4988C4", icon: Clock      },
    { label: "Batch Failure Rate",     value: "23%",  sub: "Across all batches",       color: "#FF3B30", icon: AlertTriangle },
    { label: "Contractor Defect Rate", value: "8.7%", sub: "AquaBuild LLC highest",    color: "#FF9500", icon: HardHat    },
    { label: "Repeat Complaints",      value: "12",   sub: "Same item, same issue",    color: "#9747FF", icon: RefreshCw  },
    { label: "Avg Resolution Time",    value: "6.8d", sub: "All resolved complaints",  color: "#1C4D8D", icon: TrendingUp },
    { label: "First-Visit Fix Rate",   value: "68%",  sub: "Resolved in 1 site visit", color: "#34C759", icon: Zap        },
  ];

  const batchColor      = r => r > 60 ? "#FF3B30" : r > 40 ? "#FF9500" : "#34C759";
  const contractorColor = r => r > 10 ? "#FF3B30" : r > 7  ? "#FF9500" : "#34C759";

  return (
    <>
      <style>{`
        .ap-wrapper {
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          padding: 16px;
          max-width: 100%;
          box-sizing: border-box;
        }

        /* ── KPI strip ── */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }
        @media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .kpi-grid { grid-template-columns: 1fr; } }

        /* ── KPI value ── */
        .kpi-value { font-size: 30px; font-weight: 800; line-height: 1; margin-bottom: 6px; }
        @media (max-width: 480px) { .kpi-value { font-size: 26px; } }

        /* ── Shared card ── */
        .ap-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid rgba(73,136,196,0.15);
          box-shadow: 0 2px 12px rgba(15,40,84,0.06);
        }

        /* ── Two-col chart grid ── */
        .chart-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        @media (max-width: 768px) { .chart-grid { grid-template-columns: 1fr; } }

        /* ── Monthly sparkline ── */
        .sparkline-wrap {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          height: 80px;
          overflow-x: auto;
          padding-bottom: 2px;
        }
        .spark-col {
          flex: 1;
          min-width: 22px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        /* ── Items table → mobile cards ── */
        .items-table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .items-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 320px; }
        .it-th { padding: 9px 14px; text-align: left; color: #1C4D8D; font-size: 11px; font-weight: 600; }
        .it-td { padding: 10px 14px; }

        .items-mob-cards { display: none; }
        @media (max-width: 600px) {
          .items-table-scroll { display: none; }
          .items-mob-cards {
            display: flex; flex-direction: column; gap: 8px; padding: 14px;
          }
          .imc {
            display: flex; justify-content: space-between; align-items: center;
            padding: 10px 12px; border-radius: 10px;
            border: 1px solid rgba(73,136,196,0.12);
            background: rgba(189,232,245,0.04);
            flex-wrap: wrap; gap: 6px;
          }
          .imc-name { color: #0F2854; font-weight: 600; font-size: 13px; }
          .imc-right { display: flex; align-items: center; gap: 8px; }
          .imc-count { color: #1C4D8D; font-weight: 800; font-size: 15px; }
        }

        /* ── Repeat frequency mini-grid ── */
        .freq-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        @media (max-width: 380px) {
          .freq-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="ap-wrapper">

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ color: "#4988C4", fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Reports</div>
          <h1 style={{ color: "#0F2854", fontSize: "clamp(20px,4vw,26px)", fontWeight: 800, margin: 0 }}>Analytics &amp; History</h1>
          <p style={{ color: "#4988C4", fontSize: 13, margin: "4px 0 0" }}>Complaint trends, batch failure rates, and contractor performance</p>
        </div>

        {/* ── KPI Strip ── */}
        <div className="kpi-grid">
          {kpis.map((k, i) => (
            <div key={i} className="ap-card" style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <k.icon size={12} color={k.color} />
                <span style={{ color: "#4988C4", fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>{k.label}</span>
              </div>
              <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
              <div style={{ color: "#4988C4", fontSize: 11 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Monthly Resolved Sparkline ── */}
        <div className="ap-card" style={{ padding: "22px", marginBottom: 16 }}>
          <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 14, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={16} color="#4988C4" /> Monthly Resolved Complaints
          </div>
          <div className="sparkline-wrap">
            {monthlyResolved.map((v, i) => {
              const h = (v / maxResolved) * 100;
              const isCurrent = i === monthlyResolved.length - 1;
              return (
                <div key={i} className="spark-col">
                  <div style={{ fontSize: 9, color: isCurrent ? "#0F2854" : "#4988C4", fontWeight: isCurrent ? 800 : 400 }}>{v}</div>
                  <div style={{
                    width: "100%", height: `${h}%`, minHeight: 4, borderRadius: "4px 4px 0 0",
                    background: isCurrent ? "linear-gradient(180deg,#0F2854,#1C4D8D)" : "linear-gradient(180deg,#4988C4,#BDE8F5)",
                    transition: "height 0.5s",
                  }} />
                  <div style={{ fontSize: 9, color: "#4988C4" }}>{months[i]}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Chart Row 1: by Project + Batch Failure ── */}
        <div className="chart-grid">
          <div className="ap-card" style={{ padding: "22px" }}>
            <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 14, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
              <BarChart2 size={15} color="#4988C4" /> Complaints by Project
            </div>
            <BarChart data={byProject} getValue={d => d.count} getLabel={d => d.label} />
          </div>

          <div className="ap-card" style={{ padding: "22px" }}>
            <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 14, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
              <Layers size={15} color="#4988C4" /> Batch Failure %
            </div>
            <BarChart data={batchFailure} getValue={d => d.rate} getLabel={d => d.batch} getColor={batchColor} unit="%" />
            <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[["Critical >60%","#FF3B30"],["High 40–60%","#FF9500"],["Low <40%","#34C759"]].map(([lbl,col]) => (
                <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#4988C4" }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: col }} />{lbl}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Chart Row 2: by Item + Contractor ── */}
        <div className="chart-grid">

          {/* Complaints by Item */}
          <div className="ap-card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(73,136,196,0.1)", display: "flex", alignItems: "center", gap: 8 }}>
              <BarChart2 size={14} color="#4988C4" />
              <span style={{ color: "#0F2854", fontWeight: 700, fontSize: 14 }}>Complaints by Item</span>
            </div>

            {/* Desktop table */}
            <div className="items-table-scroll">
              <table className="items-table">
                <thead><tr style={{ background: "rgba(189,232,245,0.2)" }}>
                  {["Item", "Count", "Top Severity"].map(h => <th key={h} className="it-th">{h}</th>)}
                </tr></thead>
                <tbody>
                  {byItem.map((b, i) => (
                    <tr key={i} style={{ borderTop: "1px solid rgba(73,136,196,0.08)" }}>
                      <td className="it-td" style={{ color: "#0F2854", fontSize: 12 }}>{b.item}</td>
                      <td className="it-td" style={{ color: "#1C4D8D", fontWeight: 800 }}>{b.count}</td>
                      <td className="it-td"><SB level={b.severity} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="items-mob-cards">
              {byItem.map((b, i) => (
                <div key={i} className="imc">
                  <div className="imc-name">{b.item}</div>
                  <div className="imc-right">
                    <span className="imc-count">{b.count}</span>
                    <SB level={b.severity} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contractor Defect Rate */}
          <div className="ap-card" style={{ padding: "22px" }}>
            <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 14, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
              <HardHat size={15} color="#4988C4" /> Contractor Defect Rate
            </div>
            {contractors.map((c, i) => {
              const col = contractorColor(c.rate);
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: "1px solid rgba(73,136,196,0.08)", gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ color: "#0F2854", fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ color: "#4988C4", fontSize: 10, marginTop: 2 }}>Defect rate</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 72, height: 6, background: "rgba(73,136,196,0.12)", borderRadius: 99 }}>
                      <div style={{ height: "100%", width: `${(c.rate / 15) * 100}%`, background: col, borderRadius: 99 }} />
                    </div>
                    <span style={{ color: col, fontSize: 13, fontWeight: 800, minWidth: 40, textAlign: "right" }}>{c.rate}%</span>
                  </div>
                </div>
              );
            })}

            {/* Repeat Complaint Frequency */}
            <div style={{ marginTop: 20 }}>
              <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 13, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <RefreshCw size={13} color="#4988C4" /> Repeat Complaint Frequency
              </div>
              <div className="freq-grid">
                {[["Same Item","8"],["Same Batch","5"],["Same Client","3"]].map(([k, v]) => (
                  <div key={k} style={{
                    background: "rgba(189,232,245,0.12)", borderRadius: 10, padding: "12px",
                    border: "1px solid rgba(73,136,196,0.15)", textAlign: "center",
                  }}>
                    <div style={{ color: "#FF9500", fontSize: 22, fontWeight: 800 }}>{v}</div>
                    <div style={{ color: "#4988C4", fontSize: 10, marginTop: 4 }}>{k}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}