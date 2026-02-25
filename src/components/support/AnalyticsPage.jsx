import { PageHeader, Card, SeverityBadge } from "./shared";

const byProject = [
  { label: "PRJ-2401 — AquaPark Dubai",    count: 8, max: 10 },
  { label: "PRJ-2412 — Ocean World",       count: 9, max: 10 },
  { label: "PRJ-2376 — SunSplash Inc.",    count: 6, max: 10 },
  { label: "PRJ-2389 — Blue Lagoon",       count: 4, max: 10 },
  { label: "PRJ-2398 — Aqua Universe",     count: 3, max: 10 },
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
  { name: "AquaBuild LLC",   rate: 12.4 },
  { name: "WaterTech Pro",   rate: 8.7  },
  { name: "SlideWorks Co.",  rate: 5.2  },
  { name: "AquaForm Ltd.",   rate: 3.1  },
];

const monthlyResolved = [8, 14, 11, 19, 15, 22, 18, 25, 21, 28, 20, 47];
const months = ["Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb"];
const maxResolved = Math.max(...monthlyResolved);

function BarChart({ data, getValue, getLabel, getColor, unit = "" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {data.map((d, i) => {
        const val = getValue(d);
        const pct = (val / (data.reduce((m, x) => Math.max(m, getValue(x)), 0) || 1)) * 100;
        return (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ color: "#4988C4", fontSize: 12 }}>{getLabel(d)}</span>
              <span style={{ color: getColor ? getColor(val) : "#0F2854", fontSize: 12, fontWeight: 700 }}>{val}{unit}</span>
            </div>
            <div style={{ height: 8, background: "rgba(73,136,196,0.12)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${pct}%`, borderRadius: 99,
                background: getColor
                  ? getColor(val) === "#FF3B30" ? "linear-gradient(90deg,#FF3B30,#FF6B6B)"
                    : getColor(val) === "#FF9500" ? "linear-gradient(90deg,#FF9500,#FFBB55)"
                    : "linear-gradient(90deg,#34C759,#5FD77A)"
                  : "linear-gradient(90deg, #0F2854, #4988C4)",
                transition: "width 0.6s ease",
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const kpis = [
    { label: "Avg Response Time",      value: "2.4d", sub: "Time to first action",      color: "#4988C4" },
    { label: "Batch Failure Rate",     value: "23%",  sub: "Across all batches",         color: "#FF3B30" },
    { label: "Contractor Defect Rate", value: "8.7%", sub: "AquaBuild LLC highest",      color: "#FF9500" },
    { label: "Repeat Complaints",      value: "12",   sub: "Same item, same issue",      color: "#9747FF" },
    { label: "Avg Resolution Time",    value: "6.8d", sub: "All resolved complaints",    color: "#1C4D8D" },
    { label: "First-Visit Fix Rate",   value: "68%",  sub: "Resolved in 1 site visit",   color: "#34C759" },
  ];

  const batchColor = (rate) => rate > 60 ? "#FF3B30" : rate > 40 ? "#FF9500" : "#34C759";
  const contractorColor = (rate) => rate > 10 ? "#FF3B30" : rate > 7 ? "#FF9500" : "#34C759";

  return (
    <div>
      <PageHeader eyebrow="Reports" title="Analytics & History" subtitle="Complaint trends, batch failure rates, and contractor performance" />

      {/* ── KPI Strip ────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
        {kpis.map((k, i) => (
          <Card key={i} style={{ padding: "18px 20px" }}>
            <div style={{ color: "#4988C4", fontSize: 10, fontWeight: 600, letterSpacing: 0.5, marginBottom: 8 }}>{k.label.toUpperCase()}</div>
            <div style={{ color: k.color, fontSize: 30, fontWeight: 800, lineHeight: 1, marginBottom: 6 }}>{k.value}</div>
            <div style={{ color: "#4988C4", fontSize: 11 }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      {/* ── Monthly Resolved – Sparkline ─────────────────────────────────── */}
      <Card style={{ padding: "22px", marginBottom: 16 }}>
        <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 14, marginBottom: 18 }}>📈 Monthly Resolved Complaints</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
          {monthlyResolved.map((v, i) => {
            const h = (v / maxResolved) * 100;
            const isCurrent = i === monthlyResolved.length - 1;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 9, color: isCurrent ? "#0F2854" : "#4988C4", fontWeight: isCurrent ? 800 : 400 }}>{v}</div>
                <div style={{
                  width: "100%", height: `${h}%`, minHeight: 4, borderRadius: "4px 4px 0 0",
                  background: isCurrent
                    ? "linear-gradient(180deg, #0F2854, #1C4D8D)"
                    : "linear-gradient(180deg, #4988C4, #BDE8F5)",
                  transition: "height 0.5s",
                }} />
                <div style={{ fontSize: 9, color: "#4988C4" }}>{months[i]}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* ── Complaints by Project ─────────────────────────────────────── */}
        <Card style={{ padding: "22px" }}>
          <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 14, marginBottom: 18 }}>Complaints by Project</div>
          <BarChart
            data={byProject}
            getValue={d => d.count}
            getLabel={d => d.label}
          />
        </Card>

        {/* ── Batch Failure % ───────────────────────────────────────────── */}
        <Card style={{ padding: "22px" }}>
          <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 14, marginBottom: 18 }}>Batch Failure %</div>
          <BarChart
            data={batchFailure}
            getValue={d => d.rate}
            getLabel={d => d.batch}
            getColor={batchColor}
            unit="%"
          />
          <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
            {[["Critical >60%", "#FF3B30"], ["High 40–60%", "#FF9500"], ["Low <40%", "#34C759"]].map(([lbl, col]) => (
              <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#4988C4" }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: col }} />{lbl}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* ── Complaints by Item ───────────────────────────────────────── */}
        <Card style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(73,136,196,0.1)" }}>
            <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 14 }}>Complaints by Item</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: "rgba(189,232,245,0.2)" }}>
              {["Item", "Count", "Top Severity"].map(h => (
                <th key={h} style={{ padding: "9px 14px", textAlign: "left", color: "#1C4D8D", fontSize: 11, fontWeight: 600 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {byItem.map((b, i) => (
                <tr key={i} style={{ borderTop: "1px solid rgba(73,136,196,0.08)" }}>
                  <td style={{ padding: "10px 14px", color: "#0F2854", fontSize: 12 }}>{b.item}</td>
                  <td style={{ padding: "10px 14px", color: "#1C4D8D", fontWeight: 800 }}>{b.count}</td>
                  <td style={{ padding: "10px 14px" }}><SeverityBadge level={b.severity} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* ── Contractor Defect Rate ───────────────────────────────────── */}
        <Card style={{ padding: "22px" }}>
          <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 14, marginBottom: 18 }}>Contractor Defect Rate</div>
          {contractors.map((c, i) => {
            const col = contractorColor(c.rate);
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: "1px solid rgba(73,136,196,0.08)" }}>
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

          {/* ── Repeat Complaint Frequency ────────────────────────────── */}
          <div style={{ marginTop: 20 }}>
            <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Repeat Complaint Frequency</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {[["Same Item", "8"], ["Same Batch", "5"], ["Same Client", "3"]].map(([k, v]) => (
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
        </Card>
      </div>
    </div>
  );
}