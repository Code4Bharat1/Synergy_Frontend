"use client";
import {
  TrendingUp, Layers, HardHat, RefreshCw,
  Clock, Zap, BarChart2, AlertTriangle,
} from "lucide-react";
import { PageHeader} from "./shared";

/* ─────────────────────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────────────────────── */
const byProject = [
  { label: "PRJ-2401 — AquaPark Dubai", count: 8 },
  { label: "PRJ-2412 — Ocean World", count: 9 },
  { label: "PRJ-2376 — SunSplash Inc.", count: 6 },
  { label: "PRJ-2389 — Blue Lagoon", count: 4 },
  { label: "PRJ-2398 — Aqua Universe", count: 3 },
];

const batchFailure = [
  { batch: "BT-2024-117", rate: 72 },
  { batch: "BT-2024-102", rate: 55 },
  { batch: "BT-2024-089", rate: 34 },
  { batch: "BT-2024-095", rate: 18 },
];

const byItem = [
  { item: "Funnel Ride X2", count: 7, severity: "Critical" },
  { item: "Waterslide Alpha", count: 5, severity: "Critical" },
  { item: "Master Blaster", count: 4, severity: "High" },
  { item: "Body Slide 360", count: 3, severity: "High" },
  { item: "Wave Pool Panel B", count: 3, severity: "Medium" },
  { item: "Speed Slide Pro", count: 2, severity: "Low" },
];

const contractors = [
  { name: "AquaBuild LLC", rate: 12.4 },
  { name: "WaterTech Pro", rate: 8.7 },
  { name: "SlideWorks Co.", rate: 5.2 },
  { name: "AquaForm Ltd.", rate: 3.1 },
];

const monthlyResolved = [8, 14, 11, 19, 15, 22, 18, 25, 21, 28, 20, 47];
const months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];
const maxResolved = Math.max(...monthlyResolved);

const SEVERITY_STYLES = {
  Critical: { bg: "#FF3B30", text: "#fff" },
  High: { bg: "#FF9500", text: "#fff" },
  Medium: { bg: "#FFCC00", text: "#0F2854" },
  Low: { bg: "#34C759", text: "#fff" },
};

/* ─────────────────────────────────────────────────────────────────────────────
   RESPONSIVE CSS
   Breakpoints: 1024 | 820 | 600 | 480 | 380 | 320
───────────────────────────────────────────────────────────────────────────── */
const RWD = `
  @keyframes anFadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ════════════ KPI STRIP ════════════
     3-col → 2-col → 1-col              */
  .an-kpi {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-bottom: 20px;
  }
  @media (max-width: 900px) { .an-kpi { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 540px) { .an-kpi { grid-template-columns: 1fr 1fr; gap: 10px; } }
  @media (max-width: 380px) { .an-kpi { grid-template-columns: 1fr; gap: 8px; } }

  .an-kpi-card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid rgba(73,136,196,0.15);
    box-shadow: 0 2px 12px rgba(15,40,84,0.06);
    padding: 18px 20px;
  }
  @media (max-width: 480px) { .an-kpi-card { padding: 14px 16px; } }
  @media (max-width: 380px) { .an-kpi-card { padding: 12px 14px; } }

  .an-kpi-head {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
  }
  .an-kpi-label {
    color: #4988C4;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    line-height: 1.3;
  }
  /* Wrap long label on tiny screen */
  @media (max-width: 380px) { .an-kpi-label { font-size: 9px; } }

  .an-kpi-val {
    font-size: 30px;
    font-weight: 800;
    line-height: 1;
    margin-bottom: 4px;
    font-family: 'Syne', sans-serif;
  }
  @media (max-width: 540px) { .an-kpi-val { font-size: 26px; } }
  @media (max-width: 380px) { .an-kpi-val { font-size: 22px; } }

  .an-kpi-sub { color: #4988C4; font-size: 11px; }
  @media (max-width: 380px) { .an-kpi-sub { font-size: 10px; } }

  /* ════════════ SPARKLINE ════════════ */
  .an-spark-card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid rgba(73,136,196,0.15);
    box-shadow: 0 2px 12px rgba(15,40,84,0.06);
    padding: 22px;
    margin-bottom: 16px;
  }
  @media (max-width: 480px) { .an-spark-card { padding: 16px 14px; } }

  .an-spark {
    display: flex;
    align-items: flex-end;
    gap: 5px;
    height: 80px;
    overflow-x: auto;
    padding-bottom: 2px;
    scrollbar-width: thin;
  }
  .an-spark::-webkit-scrollbar { height: 3px; }
  .an-spark::-webkit-scrollbar-thumb {
    background: rgba(73,136,196,0.25);
    border-radius: 99px;
  }
  /* Taller sparkline on desktop, shorter on mobile */
  @media (max-width: 480px) { .an-spark { height: 64px; } }

  .an-spark-col {
    flex: 1;
    min-width: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .an-spark-num  { font-size: 9px; }
  .an-spark-mo   { font-size: 9px; color: #4988C4; }
  /* Hide values on tiny to reduce clutter */
  @media (max-width: 400px) {
    .an-spark-num { display: none; }
    .an-spark-col { min-width: 16px; gap: 2px; }
  }

  /* ════════════ CHART GRID ════════════
     2-col → 1-col                       */
  .an-charts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }
  @media (max-width: 820px) { .an-charts { grid-template-columns: 1fr; } }

  /* Shared chart card */
  .an-chart-card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid rgba(73,136,196,0.15);
    box-shadow: 0 2px 12px rgba(15,40,84,0.06);
    padding: 22px;
  }
  @media (max-width: 480px) { .an-chart-card { padding: 16px 14px; } }

  /* ════════════ ITEMS TABLE / CARDS ════════════ */
  .an-item-card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid rgba(73,136,196,0.15);
    box-shadow: 0 2px 12px rgba(15,40,84,0.06);
    overflow: hidden;
  }
  .an-item-header {
    padding: 16px 22px;
    border-bottom: 1px solid rgba(73,136,196,0.10);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  @media (max-width: 480px) { .an-item-header { padding: 14px 14px; } }

  /* Desktop: table */
  .an-tbl-wrap { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .an-tbl { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 260px; }
  .an-th { padding: 9px 14px; text-align: left; color: #1C4D8D; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
  .an-td { padding: 10px 14px; }
  @media (max-width: 480px) {
    .an-th { padding: 8px 10px; font-size: 10px; }
    .an-td { padding: 9px 10px; font-size: 12px; }
  }

  /* Mobile: cards (hidden by default, shown ≤580px) */
  .an-mob-cards { display: none; }
  @media (max-width: 580px) {
    .an-tbl-wrap  { display: none; }
    .an-mob-cards { display: flex; flex-direction: column; gap: 8px; padding: 12px 14px; }
  }
  .an-mc {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(73,136,196,0.12);
    background: rgba(189,232,245,0.04);
  }
  .an-mc-name  { color: #0F2854; font-weight: 600; font-size: 13px; }
  .an-mc-right { display: flex; align-items: center; gap: 8px; }
  .an-mc-count { color: #1C4D8D; font-weight: 800; font-size: 15px; }

  /* ════════════ CONTRACTOR ROW ════════════ */
  .an-ctr-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 11px 0;
    border-bottom: 1px solid rgba(73,136,196,0.08);
    gap: 10px;
    flex-wrap: wrap;
  }
  .an-ctr-bar-wrap { display: flex; align-items: center; gap: 10px; }
  /* Stack contractor row on very small screens */
  @media (max-width: 360px) {
    .an-ctr-row       { flex-direction: column; align-items: flex-start; gap: 6px; }
    .an-ctr-bar-wrap  { width: 100%; }
    .an-ctr-bar-wrap > div { flex: 1; } /* bar fill full width */
  }

  /* ════════════ FREQ GRID ════════════
     3-col → 2-col → 1-col             */
  .an-freq {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  @media (max-width: 400px) { .an-freq { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 320px) { .an-freq { grid-template-columns: 1fr; } }

  .an-freq-cell {
    background: rgba(189,232,245,0.12);
    border-radius: 10px;
    padding: 12px 8px;
    border: 1px solid rgba(73,136,196,0.15);
    text-align: center;
  }
  @media (max-width: 480px) { .an-freq-cell { padding: 10px 6px; } }
  .an-freq-val { font-size: 22px; font-weight: 800; font-family: 'Syne', sans-serif; }
  .an-freq-lbl { color: #4988C4; font-size: 10px; margin-top: 4px; }
  @media (max-width: 400px) {
    .an-freq-val { font-size: 20px; }
    .an-freq-lbl { font-size: 9px; }
  }

  /* ════════════ LEGEND ════════════ */
  .an-legend {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 14px;
  }
  @media (max-width: 380px) { .an-legend { gap: 8px; } }

  /* ════════════ SECTION TITLE ════════════ */
  .an-sec-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 18px;
  }
  .an-sec-title-text {
    color: #0F2854;
    font-weight: 700;
    font-size: 14px;
    font-family: 'Syne', sans-serif;
  }
  @media (max-width: 380px) {
    .an-sec-title { margin-bottom: 14px; }
    .an-sec-title-text { font-size: 13px; }
  }

  /* ════════════ H-BAR ════════════ */
  .an-hbar { margin-bottom: 12px; }
  .an-hbar-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    gap: 8px;
  }
  .an-hbar-label { color: #4988C4; font-size: 12px; word-break: break-word; }
  .an-hbar-val   { font-size: 12px; font-weight: 700; white-space: nowrap; flex-shrink: 0; }
  /* Smaller label on phones */
  @media (max-width: 480px) {
    .an-hbar-label { font-size: 11px; }
    .an-hbar-val   { font-size: 11px; }
  }
  @media (max-width: 360px) {
    .an-hbar-label { font-size: 10px; }
  }
  .an-hbar-track {
    height: 8px;
    background: rgba(73,136,196,0.12);
    border-radius: 99px;
    overflow: hidden;
  }
  .an-hbar-fill {
    height: 100%;
    border-radius: 99px;
    transition: width 0.6s ease;
  }
  @media (max-width: 480px) { .an-hbar-track { height: 7px; } }

  /* ════════════ PAGE HEADER RESPONSIVE ════════════ */
  .an-page-header { margin-bottom: 20px; }
  @media (max-width: 480px) { .an-page-header { margin-bottom: 14px; } }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────────────────────── */
function SeverityBadge({ level }) {
  const c = SEVERITY_STYLES[level] || SEVERITY_STYLES.Low;
  return (
    <span style={{
      background: c.bg, color: c.text,
      padding: "2px 10px", borderRadius: 99,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.4,
      display: "inline-block", whiteSpace: "nowrap",
    }}>{level}</span>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="an-sec-title">
      <Icon size={15} color="#4988C4" />
      <span className="an-sec-title-text">{title}</span>
    </div>
  );
}

function HBar({ label, value, max, color }) {
  const pct = ((typeof value === "string" ? parseFloat(value) : value) / (max || 1)) * 100;
  const gradient =
    color === "#FF3B30" ? "linear-gradient(90deg,#FF3B30,#FF6B6B)" :
      color === "#FF9500" ? "linear-gradient(90deg,#FF9500,#FFBB55)" :
        color === "#34C759" ? "linear-gradient(90deg,#34C759,#5FD77A)" :
          "linear-gradient(90deg,#0F2854,#4988C4)";
  return (
    <div className="an-hbar">
      <div className="an-hbar-row">
        <span className="an-hbar-label">{label}</span>
        <span className="an-hbar-val" style={{ color: color || "#0F2854" }}>{value}</span>
      </div>
      <div className="an-hbar-track">
        <div className="an-hbar-fill" style={{ width: `${pct}%`, background: gradient }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CARD WRAPPER (shared style)
───────────────────────────────────────────────────────────────────────────── */
const cardStyle = {
  background: "#fff",
  borderRadius: 16,
  border: "1px solid rgba(73,136,196,0.15)",
  boxShadow: "0 2px 12px rgba(15,40,84,0.06)",
};

/* ─────────────────────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const batchColor = r => r > 60 ? "#FF3B30" : r > 40 ? "#FF9500" : "#34C759";
  const contractorColor = r => r > 10 ? "#FF3B30" : r > 7 ? "#FF9500" : "#34C759";

  const projMax = Math.max(...byProject.map(d => d.count));

  const kpis = [
    { label: "Avg Response Time", value: "2.4d", sub: "Time to first action", color: "#4988C4", icon: Clock },
    { label: "Batch Failure Rate", value: "23%", sub: "Across all batches", color: "#FF3B30", icon: AlertTriangle },
    { label: "Contractor Defect Rate", value: "8.7%", sub: "AquaBuild LLC highest", color: "#FF9500", icon: HardHat },
    { label: "Repeat Complaints", value: "12", sub: "Same item, same issue", color: "#9747FF", icon: RefreshCw },
    { label: "Avg Resolution Time", value: "6.8d", sub: "All resolved complaints", color: "#1C4D8D", icon: TrendingUp },
    { label: "First-Visit Fix Rate", value: "68%", sub: "Resolved in 1 site visit", color: "#34C759", icon: Zap },
  ];

  return (
    <>
      <style>{ RWD}</style>

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="an-page-header">
        <PageHeader
          eyebrow="Reports"
          title="Analytics & History"
          subtitle="Complaint trends, batch failure rates, and contractor performance"
        />
      </div>

      {/* ════════════ KPI STRIP ════════════ */}
      <div className="an-kpi">
        {kpis.map((k, i) => (
          <div
            key={i}
            className="an-kpi-card"
            style={{ animation: `anFadeUp 0.4s ease ${i * 55}ms both` }}
          >
            <div className="an-kpi-head">
              <k.icon size={13} color={k.color} />
              <span className="an-kpi-label">{k.label}</span>
            </div>
            <div
              className="an-kpi-val"
              style={{
                color: "#0F2854",
                fontSize: "clamp(20px, 4vw, 26px)",
                fontWeight: 800,
                margin: 0
              }}
            >{k.value}</div>
            <div className="an-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ════════════ MONTHLY SPARKLINE ════════════ */}
      <div className="an-spark-card">
        <SectionTitle icon={TrendingUp} title="Monthly Resolved Complaints" />
        <div className="an-spark">
          {monthlyResolved.map((v, i) => {
            const h = (v / maxResolved) * 100;
            const isLast = i === monthlyResolved.length - 1;
            return (
              <div key={i} className="an-spark-col">
                <span
                  className="an-spark-num"
                  style={{ color: isLast ? "#0F2854" : "#4988C4", fontWeight: isLast ? 800 : 400 }}
                >{v}</span>
                <div style={{
                  width: "100%",
                  height: `${h}%`,
                  minHeight: 4,
                  borderRadius: "4px 4px 0 0",
                  background: isLast
                    ? "linear-gradient(180deg,#0F2854,#1C4D8D)"
                    : "linear-gradient(180deg,#4988C4,#BDE8F5)",
                  transition: "height 0.5s",
                }} />
                <span className="an-spark-mo">{months[i]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ════════════ CHART ROW 1: By Project + Batch Failure ════════════ */}
      <div className="an-charts">

        {/* Complaints by Project */}
        <div className="an-chart-card">
          <SectionTitle icon={BarChart2} title="Complaints by Project" />
          {byProject.map((d, i) => (
            <HBar key={i} label={d.label} value={d.count} max={projMax} />
          ))}
        </div>

        {/* Batch Failure % */}
        <div className="an-chart-card">
          <SectionTitle icon={Layers} title="Batch Failure %" />
          {batchFailure.map((d, i) => (
            <HBar
              key={i}
              label={d.batch}
              value={`${d.rate}%`}
              max={100}
              color={batchColor(d.rate)}
            />
          ))}
          <div className="an-legend">
            {[["Critical >60%", "#FF3B30"], ["High 40–60%", "#FF9500"], ["Low <40%", "#34C759"]].map(([lbl, col]) => (
              <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#4988C4" }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: col, flexShrink: 0 }} />
                {lbl}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════ CHART ROW 2: Items + Contractor ════════════ */}
      <div className="an-charts">

        {/* Complaints by Item */}
        <div className="an-item-card">
          <div className="an-item-header">
            <BarChart2 size={14} color="#4988C4" />
            <span style={{ color: "#0F2854", fontWeight: 700, fontSize: 14, fontFamily: "'Syne',sans-serif" }}>
              Complaints by Item
            </span>
          </div>

          {/* ── Desktop table ── */}
          <div className="an-tbl-wrap">
            <table className="an-tbl">
              <thead>
                <tr style={{ background: "rgba(189,232,245,0.2)" }}>
                  {["Item", "Count", "Top Severity"].map(h => (
                    <th key={h} className="an-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byItem.map((b, i) => (
                  <tr key={i} style={{ borderTop: "1px solid rgba(73,136,196,0.08)" }}>
                    <td className="an-td" style={{ color: "#0F2854", fontSize: 12 }}>{b.item}</td>
                    <td className="an-td" style={{ color: "#1C4D8D", fontWeight: 800 }}>{b.count}</td>
                    <td className="an-td"><SeverityBadge level={b.severity} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="an-mob-cards">
            {byItem.map((b, i) => (
              <div key={i} className="an-mc">
                <span className="an-mc-name">{b.item}</span>
                <div className="an-mc-right">
                  <span className="an-mc-count">{b.count}</span>
                  <SeverityBadge level={b.severity} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contractor Defect Rate */}
        <div className="an-chart-card">
          <SectionTitle icon={HardHat} title="Contractor Defect Rate" />

          {contractors.map((c, i) => {
            const col = contractorColor(c.rate);
            return (
              <div key={i} className="an-ctr-row">
                <div>
                  <div style={{ color: "#0F2854", fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                  <div style={{ color: "#4988C4", fontSize: 10, marginTop: 2 }}>Defect rate</div>
                </div>
                <div className="an-ctr-bar-wrap">
                  <div style={{
                    width: 72, height: 6,
                    background: "rgba(73,136,196,0.12)",
                    borderRadius: 99, overflow: "hidden",
                    flexShrink: 0,
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${(c.rate / 15) * 100}%`,
                      background: col, borderRadius: 99,
                    }} />
                  </div>
                  <span style={{
                    color: col, fontSize: 13, fontWeight: 800,
                    minWidth: 40, textAlign: "right",
                  }}>{c.rate}%</span>
                </div>
              </div>
            );
          })}

          {/* Repeat Complaint Frequency */}
          <div style={{ marginTop: 22 }}>
            <div className="an-sec-title" style={{ marginBottom: 12 }}>
              <RefreshCw size={13} color="#4988C4" />
              <span className="an-sec-title-text" style={{ fontSize: 13 }}>
                Repeat Complaint Frequency
              </span>
            </div>
            <div className="an-freq">
              {[
                ["Same Item", "8", "#FF9500"],
                ["Same Batch", "5", "#FF9500"],
                ["Same Client", "3", "#4988C4"],
              ].map(([k, v, col]) => (
                <div key={k} className="an-freq-cell">
                  <div className="an-freq-val" style={{ color: col }}>{v}</div>
                  <div className="an-freq-lbl">{k}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}