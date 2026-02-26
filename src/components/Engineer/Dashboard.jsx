"use client";
import { useState } from "react";
import Link from "next/link";
import {
  FolderOpen, ClipboardList, AlertTriangle,
  CheckSquare, Clock, TrendingUp, MapPin,
  ChevronRight, Bell, Calendar,
} from "lucide-react";
import {
  PageHeader, Card, SectionHead, StatusPill, FONTS,
  PROJECTS, ENGINEER,
} from "./shared";

const TODAY_TASKS = [
  { id: 1, task: "Install gel coat on Waterslide Alpha section B",  project: "PRJ-2401", priority: "High",   done: false },
  { id: 2, task: "QC inspection — Wave Pool Panel B",               project: "PRJ-2389", priority: "Medium", done: false },
  { id: 3, task: "Submit daily report by 5:00 PM",                  project: "All",      priority: "High",   done: false },
  { id: 4, task: "Photo documentation — Speed Slide Pro",           project: "PRJ-2376", priority: "Low",    done: true  },
  { id: 5, task: "Coordinate with contractor — Ocean World site",   project: "PRJ-2412", priority: "Medium", done: false },
];

const SUMMARY = [
  { label: "Active Projects", value: 4, icon: FolderOpen,    color: "#4988C4", href: "#projects"              },
  { label: "Today's Tasks",   value: 5, icon: ClipboardList, color: "#0F2854", href: "/engineer/daily-report" },
  { label: "Open Issues",     value: 3, icon: AlertTriangle, color: "#FF9500", href: "/engineer/issue-log"    },
  { label: "Pending QC",      value: 2, icon: CheckSquare,   color: "#34C759", href: "/engineer/qc-upload"    },
];

const priorityMap = {
  High:   { color: "#FF3B30", bg: "rgba(255,59,48,0.1)"  },
  Medium: { color: "#FF9500", bg: "rgba(255,149,0,0.1)"  },
  Low:    { color: "#34C759", bg: "rgba(52,199,89,0.1)"  },
};

const statusColor = { Active: "blue", Closing: "green" };

/* ── Responsive CSS — theme colours untouched ─────────────────────────────── */
const RWD = `
  .db-banner {
    background: linear-gradient(135deg,rgba(255,149,0,0.12),rgba(255,149,0,0.06));
    border: 1px solid rgba(255,149,0,0.3);
    border-radius: 12px;
    padding: 12px 18px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    animation: fadeUp 0.4s ease;
    flex-wrap: wrap;
  }
  .db-banner-text {
    color: #0F2854;
    font-size: 13px;
    font-weight: 600;
    flex: 1;
    min-width: 160px;
  }
  .db-banner-btn {
    margin-left: auto;
    background: #FF9500;
    color: #fff;
    padding: 5px 14px;
    border-radius: 7px;
    font-size: 12px;
    font-weight: 700;
    text-decoration: none;
    white-space: nowrap;
    flex-shrink: 0;
  }
  @media (max-width: 520px) {
    .db-banner { gap: 8px; padding: 12px 14px; }
    .db-banner-btn { margin-left: 0; width: 100%; text-align: center; display: block; padding: 8px; }
  }

  /* 4-col → 2-col summary grid */
  .db-summary {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 24px;
  }
  @media (max-width: 860px) { .db-summary { grid-template-columns: repeat(2,1fr); gap: 12px; } }
  @media (max-width: 400px) {
    .db-summary { gap: 8px; }
    .db-stat-num  { font-size: 24px !important; }
    .db-stat-label { font-size: 9px !important; }
  }

  /* 2-col → 1-col main */
  .db-main { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; }
  @media (max-width: 860px) { .db-main { grid-template-columns: 1fr; } }

  /* right sidebar */
  .db-right { display: flex; flex-direction: column; gap: 16px; }

  /* projects list: single col → 2-col on mid-mobile */
  .db-projects-list { display: flex; flex-direction: column; gap: 10px; }
  @media (max-width: 600px) {
    .db-projects-list { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  }

  /* quick actions: single col → 2-col on mobile */
  .db-quick-list { display: flex; flex-direction: column; gap: 6px; }
  @media (max-width: 600px) {
    .db-quick-list { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  }

  /* task rows: allow text to wrap, gap tweak on tiny */
  .db-task-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 11px 13px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.18s;
  }
  @media (max-width: 380px) { .db-task-row { padding: 9px 10px; gap: 9px; } }
`;

export default function EngineerDashboard() {
  const [tasks, setTasks] = useState(TODAY_TASKS);
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const reportDue      = tasks.find(t => t.task.includes("daily report") && !t.done);
  const completedCount = tasks.filter(t => t.done).length;
  const toggle = (id) => setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));

  return (
    <>
      <style>{FONTS + RWD}</style>

      {/* ── Report Due Banner ─────────────────────────────────────────── */}
      {reportDue && (
        <div className="db-banner">
          <Bell size={16} color="#FF9500" style={{ flexShrink: 0 }} />
          <span className="db-banner-text">
            📋 Daily Report Due Today — Submit before <strong>5:00 PM</strong>
          </span>
          <Link href="/engineer/daily-report" className="db-banner-btn">
            Submit Now →
          </Link>
        </div>
      )}

      <PageHeader
        eyebrow="Engineer Panel"
        title={`Good morning, ${ENGINEER.name.split(" ")[0]} `}
        subtitle={today}
      />

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div className="db-summary">
        {SUMMARY.map((s, i) => (
          <Link key={i} href={s.href} style={{ textDecoration: "none" }}>
            <Card
              style={{ padding: "18px 20px", cursor: "pointer", transition: "transform 0.18s, box-shadow 0.18s", overflow: "hidden", position: "relative" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(15,40,84,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)";    e.currentTarget.style.boxShadow = "0 2px 12px rgba(15,40,84,0.06)"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <span className="db-stat-label" style={{ color: "#4988C4", fontSize: 10, fontWeight: 600, letterSpacing: 0.5, lineHeight: 1.3 }}>
                  {s.label.toUpperCase()}
                </span>
                <s.icon size={16} color={s.color} strokeWidth={1.8} style={{ opacity: 0.7, flexShrink: 0 }} />
              </div>
              <div className="db-stat-num" style={{ color: s.color, fontSize: 32, fontWeight: 800, lineHeight: 1, fontFamily: "'Syne',sans-serif" }}>
                {s.value}
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* ── Main Grid ─────────────────────────────────────────────────── */}
      <div className="db-main">

        {/* ── Today's Tasks ───────────────────────────────────────────── */}
        <Card style={{ padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
            <SectionHead icon={<ClipboardList size={16} color="#BDE8F5" />} title="Today's Tasks" />
            <span style={{ color: "#4988C4", fontSize: 12 }}>
              {completedCount}/{tasks.length} done
            </span>
          </div>

          {/* progress bar */}
          <div style={{ background: "rgba(73,136,196,0.12)", borderRadius: 99, height: 5, marginBottom: 18 }}>
            <div style={{
              height: 5, borderRadius: 99,
              background: "linear-gradient(90deg,#4988C4,#0F2854)",
              width: `${(completedCount / tasks.length) * 100}%`,
              transition: "width 0.4s ease",
            }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tasks.map(t => {
              const p = priorityMap[t.priority];
              return (
                <div
                  key={t.id}
                  className="db-task-row"
                  onClick={() => toggle(t.id)}
                  style={{
                    background: t.done ? "rgba(52,199,89,0.04)" : "rgba(73,136,196,0.04)",
                    border:     `1px solid ${t.done ? "rgba(52,199,89,0.2)" : "rgba(73,136,196,0.1)"}`,
                    opacity: t.done ? 0.65 : 1,
                  }}
                >
                  {/* checkbox */}
                  <div style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
                    background: t.done ? "#34C759" : "transparent",
                    border: `2px solid ${t.done ? "#34C759" : "rgba(73,136,196,0.4)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {t.done && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      color: "#0F2854", fontSize: 12, fontWeight: 600,
                      textDecoration: t.done ? "line-through" : "none",
                      wordBreak: "break-word",
                    }}>{t.task}</div>
                    <div style={{ color: "#4988C4", fontSize: 10, marginTop: 2 }}>{t.project}</div>
                  </div>

                  <span style={{
                    background: p.bg, color: p.color,
                    padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700,
                    flexShrink: 0, whiteSpace: "nowrap",
                  }}>{t.priority}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ── Right Column ─────────────────────────────────────────────── */}
        <div className="db-right">

          {/* Assigned Projects */}
          <Card style={{ padding: "22px" }}>
            <SectionHead icon={<FolderOpen size={16} color="#BDE8F5" />} title="Assigned Projects" />
            <div className="db-projects-list">
              {PROJECTS.map(p => (
                <div key={p.id} style={{
                  padding: "12px 14px", borderRadius: 11,
                  background: "rgba(73,136,196,0.04)",
                  border: "1px solid rgba(73,136,196,0.1)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: "#0F2854", fontSize: 13, fontWeight: 700, wordBreak: "break-word" }}>{p.name}</div>
                      <div style={{ color: "#4988C4", fontSize: 11, display: "flex", alignItems: "center", gap: 4, marginTop: 2, flexWrap: "wrap" }}>
                        <MapPin size={10} style={{ flexShrink: 0 }} /> {p.location}
                      </div>
                    </div>
                    <StatusPill label={p.status} color={statusColor[p.status] || "blue"} />
                  </div>
                  {/* progress */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, background: "rgba(73,136,196,0.12)", borderRadius: 99, height: 4 }}>
                      <div style={{
                        height: 4, borderRadius: 99, width: `${p.progress}%`,
                        background: p.progress > 80 ? "#34C759" : p.progress > 50 ? "#4988C4" : "#FF9500",
                        transition: "width 0.6s ease",
                      }} />
                    </div>
                    <span style={{ color: "#4988C4", fontSize: 10, fontWeight: 700, minWidth: 28 }}>{p.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card style={{ padding: "18px 22px" }}>
            <SectionHead icon={<TrendingUp size={16} color="#BDE8F5" />} title="Quick Actions" />
            <div className="db-quick-list">
              {[
                { label: "Log an Issue",      href: "/engineer/issue-log",     color: "#FF9500" },
                { label: "Upload QC Results", href: "/engineer/qc-upload",     color: "#34C759" },
                { label: "Log a Complaint",   href: "/engineer/complaint-log", color: "#4988C4" },
                { label: "Upload Documents",  href: "/engineer/documents",     color: "#0F2854" },
              ].map((a, i) => (
                <Link key={i} href={a.href} style={{ textDecoration: "none" }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "9px 12px", borderRadius: 9,
                    background: `${a.color}08`,
                    border: `1px solid ${a.color}20`,
                    cursor: "pointer", transition: "background 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = `${a.color}14`}
                    onMouseLeave={e => e.currentTarget.style.background = `${a.color}08`}
                  >
                    <span style={{ color: a.color, fontSize: 12, fontWeight: 600 }}>{a.label}</span>
                    <ChevronRight size={13} color={a.color} style={{ flexShrink: 0 }} />
                  </div>
                </Link>
              ))}
            </div>
          </Card>

        </div>
      </div>
    </>
  );
}