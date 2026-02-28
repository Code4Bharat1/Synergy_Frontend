"use client";
import { useState } from "react";
import {
  TrendingUp, Layers, HardHat, RefreshCw,
  Clock, Zap, BarChart2, AlertTriangle,
} from "lucide-react";
import { PageHeader, Card, FONTS } from "@/components/engineer/shared";

// ── Data ──────────────────────────────────────────────────────────────────────
const byProject = [
  { label: "PRJ-2401 — AquaPark Dubai", count: 8 },
  { label: "PRJ-2412 — Ocean World",    count: 9 },
  { label: "PRJ-2376 — SunSplash Inc.", count: 6 },
  { label: "PRJ-2389 — Blue Lagoon",    count: 4 },
  { label: "PRJ-2398 — Aqua Universe",  count: 3 },
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

const SEVERITY_STYLES = {
  Critical: { bg: "#FF3B30", text: "#fff"    },
  High:     { bg: "#FF9500", text: "#fff"    },
  Medium:   { bg: "#FFCC00", text: "#0F2854" },
  Low:      { bg: "#34C759", text: "#fff"    },
};

// ── Small sub-components ──────────────────────────────────────────────────────
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
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
      <Icon size={15} color="#4988C4" />
      <span style={{ color: "#0F2854", fontWeight: 700, fontSize: 14, fontFamily: "'Syne',sans-serif" }}>
        {title}
      </span>
    </div>
  );
}

function HBar({ label, value, max, color }) {
  const pct = (value / (max || 1)) * 100;
  const gradient =
    color === "#FF3B30" ? "linear-gradient(90deg,#FF3B30,#FF6B6B)" :
    color === "#FF9500" ? "linear-gradient(90deg,#FF9500,#FFBB55)" :
    color === "#34C759" ? "linear-gradient(90deg,#34C759,#5FD77A)" :
    "linear-gradient(90deg,#0F2854,#4988C4)";
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ color: "#4988C4", fontSize: 12 }}>{label}</span>
        <span style={{ color: color || "#0F2854", fontSize: 12, fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: 8, background: "rgba(73,136,196,0.12)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: 99,
          background: gradient, transition: "width 0.6s ease",
        }} />
      </div>
    </div>
  );
}

// ── Responsive CSS ────────────────────────────────────────────────────────────
const RWD = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* KPI strip: 3-col → 2-col → 1-col */
  .an-kpi { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-bottom: 22px; }
  @media (max-width: 900px) { .an-kpi { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 480px) { .an-kpi { grid-template-columns: 1fr; gap: 10px; } }
  .an-kpi-val { font-size: 30px; font-weight: 800; line-height: 1; margin-bottom: 4px; font-family: 'Syne',sans-serif; }
  @media (max-width: 480px) { .an-kpi-val { font-size: 26px; } }

  /* Sparkline: horizontal scroll on tiny screens */
  .an-spark { display: flex; align-items: flex-end; gap: 5px; height: 80px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: thin; }
  .an-spark::-webkit-scrollbar { height: 3px; }
  .an-spark::-webkit-scrollbar-thumb { background: rgba(73,136,196,0.25); border-radius: 99px; }
  .an-spark-col { flex: 1; min-width: 22px; display: flex; flex-direction: column; align-items: center; gap: 5px; }

  /* Chart grid: 2-col → 1-col */
  .an-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  @media (max-width: 820px) { .an-charts { grid-template-columns: 1fr; } }

  /* Items table → hide on mobile, show cards */
  .an-tbl-wrap { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .an-tbl { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 280px; }
  .an-th { padding: 9px 14px; text-align: left; color: #1C4D8D; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
  .an-td { padding: 10px 14px; }
  .an-mob-cards { display: none; }
  @media (max-width: 580px) {
    .an-tbl-wrap { display: none; }
    .an-mob-cards { display: flex; flex-direction: column; gap: 8px; padding: 14px; }
    .an-mc { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(73,136,196,0.12); background: rgba(189,232,245,0.04); }
    .an-mc-name { color: #0F2854; font-weight: 600; font-size: 13px; }
    .an-mc-right { display: flex; align-items: center; gap: 8px; }
    .an-mc-count { color: #1C4D8D; font-weight: 800; font-size: 15px; }
  }

  /* Frequency grid: 3-col → 2-col */
  .an-freq { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
  @media (max-width: 360px) { .an-freq { grid-template-columns: 1fr 1fr; } }

  /* Legend row wrap */
  .an-legend { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 14px; }

  /* KPI card row: icon + label */
  .an-kpi-head { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }

  /* Contractor row */
  .an-ctr-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid rgba(73,136,196,0.08); gap: 10px; flex-wrap: wrap; }
  .an-ctr-bar-wrap { display: flex; align-items: center; gap: 10px; }
`;

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const batchColor      = r => r > 60 ? "#FF3B30" : r > 40 ? "#FF9500" : "#34C759";
  const contractorColor = r => r > 10 ? "#FF3B30" : r > 7  ? "#FF9500" : "#34C759";

  const kpis = [
    { label: "Avg Response Time",      value: "2.4d", sub: "Time to first action",     color: "#4988C4", icon: Clock       },
    { label: "Batch Failure Rate",     value: "23%",  sub: "Across all batches",        color: "#FF3B30", icon: AlertTriangle },
    { label: "Contractor Defect Rate", value: "8.7%", sub: "AquaBuild LLC highest",     color: "#FF9500", icon: HardHat     },
    { label: "Repeat Complaints",      value: "12",   sub: "Same item, same issue",     color: "#9747FF", icon: RefreshCw   },
    { label: "Avg Resolution Time",    value: "6.8d", sub: "All resolved complaints",   color: "#1C4D8D", icon: TrendingUp  },
    { label: "First-Visit Fix Rate",   value: "68%",  sub: "Resolved in 1 site visit",  color: "#34C759", icon: Zap         },
  ];

  const batchMax = Math.max(...batchFailure.map(d => d.rate));
  const projMax  = Math.max(...byProject.map(d => d.count));

  return (
    <>
      <style>{FONTS + RWD}</style>

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <PageHeader
        eyebrow="Reports"
        title="Analytics & History"
        subtitle="Complaint trends, batch failure rates, and contractor performance"
      />

      {/* ── KPI Strip ────────────────────────────────────────────────────── */}
      <div className="an-kpi">
        {kpis.map((k, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid rgba(73,136,196,0.15)",
              boxShadow: "0 2px 12px rgba(15,40,84,0.06)",
              padding: "18px 20px",
              animation: `fadeUp 0.4s ease ${i * 55}ms both`,
            }}
          >
            <div className="an-kpi-head">
              <k.icon size={13} color={k.color} />
              <span style={{ color: "#4988C4", fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>
                {k.label}
              </span>
            </div>
            <div className="an-kpi-val" style={{ color: k.color }}>{k.value}</div>
            <div style={{ color: "#4988C4", fontSize: 11 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Monthly Resolved Sparkline ───────────────────────────────────── */}
      <div style={{
        background: "#fff", borderRadius: 16,
        border: "1px solid rgba(73,136,196,0.15)",
        boxShadow: "0 2px 12px rgba(15,40,84,0.06)",
        padding: "22px", marginBottom: 16,
      }}>
        <SectionTitle icon={TrendingUp} title="Monthly Resolved Complaints" />
        <div className="an-spark">
          {monthlyResolved.map((v, i) => {
            const h       = (v / maxResolved) * 100;
            const isLast  = i === monthlyResolved.length - 1;
            return (
              <div key={i} className="an-spark-col">
                <div style={{ fontSize: 9, color: isLast ? "#0F2854" : "#4988C4", fontWeight: isLast ? 800 : 400 }}>
                  {v}
                </div>
                <div style={{
                  width: "100%", height: `${h}%`, minHeight: 4,
                  borderRadius: "4px 4px 0 0",
                  background: isLast
                    ? "linear-gradient(180deg,#0F2854,#1C4D8D)"
                    : "linear-gradient(180deg,#4988C4,#BDE8F5)",
                  transition: "height 0.5s",
                }} />
                <div style={{ fontSize: 9, color: "#4988C4" }}>{months[i]}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Chart Row 1: By Project + Batch Failure ──────────────────────── */}
      <div className="an-charts">

        {/* Complaints by Project */}
        <div style={{
          background: "#fff", borderRadius: 16,
          border: "1px solid rgba(73,136,196,0.15)",
          boxShadow: "0 2px 12px rgba(15,40,84,0.06)",
          padding: "22px",
        }}>
          <SectionTitle icon={BarChart2} title="Complaints by Project" />
          {byProject.map((d, i) => (
            <HBar
              key={i}
              label={d.label}
              value={d.count}
              max={projMax}
            />
          ))}
        </div>

        {/* Batch Failure % */}
        <div style={{
          background: "#fff", borderRadius: 16,
          border: "1px solid rgba(73,136,196,0.15)",
          boxShadow: "0 2px 12px rgba(15,40,84,0.06)",
          padding: "22px",
        }}>
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
            {[["Critical >60%","#FF3B30"],["High 40–60%","#FF9500"],["Low <40%","#34C759"]].map(([lbl, col]) => (
              <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#4988C4" }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: col, flexShrink: 0 }} />
                {lbl}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Chart Row 2: Items + Contractor ──────────────────────────────── */}
      <div className="an-charts">

        {/* Complaints by Item */}
        <div style={{
          background: "#fff", borderRadius: 16,
          border: "1px solid rgba(73,136,196,0.15)",
          boxShadow: "0 2px 12px rgba(15,40,84,0.06)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "16px 22px",
            borderBottom: "1px solid rgba(73,136,196,0.10)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <BarChart2 size={14} color="#4988C4" />
            <span style={{ color: "#0F2854", fontWeight: 700, fontSize: 14, fontFamily: "'Syne',sans-serif" }}>
              Complaints by Item
            </span>
          </div>

          {/* Desktop table */}
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

          {/* Mobile cards */}
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
        <div style={{
          background: "#fff", borderRadius: 16,
          border: "1px solid rgba(73,136,196,0.15)",
          boxShadow: "0 2px 12px rgba(15,40,84,0.06)",
          padding: "22px",
        }}>
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
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${(c.rate / 15) * 100}%`,
                      background: col, borderRadius: 99,
                    }} />
                  </div>
                  <span style={{ color: col, fontSize: 13, fontWeight: 800, minWidth: 40, textAlign: "right" }}>
                    {c.rate}%
                  </span>
                </div>
              </div>
            );
          })}

          {/* Repeat Complaint Frequency */}
          <div style={{ marginTop: 22 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              color: "#0F2854", fontWeight: 700, fontSize: 13,
              fontFamily: "'Syne',sans-serif", marginBottom: 12,
            }}>
              <RefreshCw size={13} color="#4988C4" />
              Repeat Complaint Frequency
            </div>
            <div className="an-freq">
              {[
                ["Same Item",  "8",  "#FF9500"],
                ["Same Batch", "5",  "#FF9500"],
                ["Same Client","3",  "#4988C4"],
              ].map(([k, v, col]) => (
                <div key={k} style={{
                  background: "rgba(189,232,245,0.12)",
                  borderRadius: 10, padding: "12px 8px",
                  border: "1px solid rgba(73,136,196,0.15)",
                  textAlign: "center",
                }}>
                  <div style={{ color: col, fontSize: 22, fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>
                    {v}
                  </div>
                  <div style={{ color: "#4988C4", fontSize: 10, marginTop: 4 }}>{k}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}