"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FolderOpen, ClipboardList, AlertTriangle,
  CheckSquare, ChevronRight, Bell, MapPin, Loader2,
  ArrowLeft, User, Calendar, Package, CheckCircle2, XCircle,
} from "lucide-react";
import {
  PageHeader, Card, SectionHead, StatusPill, FONTS,
} from "./shared";
import axiosInstance from "../../lib/axios";

// ── API Helper ────────────────────────────────────────────────────────────────
const apiFetch = async (path) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const res = await axiosInstance({ method: "GET", url: path, headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return res.data;
};

// ── Static / Mock ─────────────────────────────────────────────────────────────
const TODAY_TASKS = [
  { id: 1, task: "Install gel coat on Waterslide Alpha section B", project: "PRJ-2401", priority: "High",   done: false },
  { id: 2, task: "QC inspection — Wave Pool Panel B",              project: "PRJ-2389", priority: "Medium", done: false },
  { id: 3, task: "Submit daily report by 5:00 PM",                 project: "All",      priority: "High",   done: false },
  { id: 4, task: "Photo documentation — Speed Slide Pro",          project: "PRJ-2376", priority: "Low",    done: true  },
];

const CHECKS_META = [
  { key: "material",   label: "Material Delivered"   },
  { key: "foundation", label: "Foundation Completed" },
  { key: "customer",   label: "Customer Readiness"   },
  { key: "acceptance", label: "Client Acceptance"    },
];

const priorityMap  = { High: { color: "#FF3B30", bg: "rgba(255,59,48,0.1)" }, Medium: { color: "#FF9500", bg: "rgba(255,149,0,0.1)" }, Low: { color: "#34C759", bg: "rgba(52,199,89,0.1)" } };
const statusColor  = { active: "blue", completed: "green", "on-hold": "orange", initiated: "blue", installation: "blue", testing: "blue" };
const phaseColors  = { "Site Preparation": "#4988C4", "Wiring & Plumbing": "#FF9500", "Equipment Setup": "#9B59B6", "Installation": "#0F2854", "Final Testing": "#34C759", "Completed": "#34C759" };

// ── CSS ───────────────────────────────────────────────────────────────────────
const RWD = `
  .db-banner { background:linear-gradient(135deg,rgba(255,149,0,.12),rgba(255,149,0,.06));border:1px solid rgba(255,149,0,.3);border-radius:12px;padding:12px 18px;margin-bottom:20px;display:flex;align-items:center;gap:12px;animation:fadeUp .4s ease;flex-wrap:wrap; }
  .db-banner-text { color:#0F2854;font-size:13px;font-weight:600;flex:1;min-width:160px; }
  .db-banner-btn  { margin-left:auto;background:#FF9500;color:#fff;padding:5px 14px;border-radius:7px;font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap;flex-shrink:0; }
  @media(max-width:520px){.db-banner{gap:8px;padding:12px 14px}.db-banner-btn{margin-left:0;width:100%;text-align:center;display:block;padding:8px}}

  .db-summary { display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px; }
  @media(max-width:860px){.db-summary{grid-template-columns:repeat(2,1fr);gap:12px}}
  @media(max-width:400px){.db-summary{gap:8px}.db-stat-num{font-size:24px!important}.db-stat-label{font-size:9px!important}}

  .db-main { display:grid;grid-template-columns:1.4fr 1fr;gap:20px; }
  @media(max-width:860px){.db-main{grid-template-columns:1fr}}
  .db-right { display:flex;flex-direction:column;gap:16px; }

  .db-projects-list { display:flex;flex-direction:column;gap:10px; }
  @media(max-width:600px){.db-projects-list{display:grid;grid-template-columns:1fr 1fr;gap:10px}}
  .db-quick-list { display:flex;flex-direction:column;gap:6px; }
  @media(max-width:600px){.db-quick-list{display:grid;grid-template-columns:1fr 1fr;gap:8px}}

  .db-task-row { display:flex;align-items:flex-start;gap:12px;padding:11px 13px;border-radius:10px;cursor:pointer;transition:all .18s; }
  @media(max-width:380px){.db-task-row{padding:9px 10px;gap:9px}}

  /* ── Project Detail ── */
  .pd-grid { display:grid;grid-template-columns:1.4fr 1fr;gap:20px; }
  @media(max-width:860px){.pd-grid{grid-template-columns:1fr}}
  .pd-info-grid { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
  @media(max-width:500px){.pd-info-grid{grid-template-columns:1fr}}
  .pd-checks-grid { display:grid;grid-template-columns:1fr 1fr;gap:10px; }
  .pd-team-list { display:flex;flex-direction:column;gap:8px; }
`;

// ── Project Detail View ───────────────────────────────────────────────────────
function ProjectDetail({ project, onBack }) {
  const checks  = project.eligibilityChecks  || {};
  const phase   = project.phase              || "Site Preparation";
  const phaseList = ["Site Preparation","Wiring & Plumbing","Equipment Setup","Installation","Final Testing","Completed"];
  const phaseIdx  = phaseList.indexOf(phase);

  const engineers    = project.assignedEngineers            || [];
  const marketing    = project.assignedMarketingExecutive;
  const installation = project.assignedInstallationIncharge;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—";

  return (
    <>
      {/* Back button + header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <button
          onClick={onBack}
          style={{
            display:"flex", alignItems:"center", gap:6,
            background:"rgba(73,136,196,0.08)", border:"1px solid rgba(73,136,196,0.2)",
            color:"#1C4D8D", padding:"7px 14px", borderRadius:9,
            fontSize:13, fontWeight:700, cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif",
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <p style={{ color:"#4988C4", fontSize:11, fontWeight:600, letterSpacing:.5 }}>PROJECT DETAIL</p>
          <h2 style={{ color:"#0F2854", fontSize:18, fontWeight:800, fontFamily:"'Syne',sans-serif", margin:0 }}>
            {project.name}
          </h2>
        </div>
        <div style={{ marginLeft:"auto" }}>
          <StatusPill label={project.status || "active"} color={statusColor[project.status] || "blue"} />
        </div>
      </div>

      <div className="pd-grid">

        {/* ── LEFT ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Basic Info */}
          <Card style={{ padding:"22px" }}>
            <SectionHead icon={<FolderOpen size={16} color="#BDE8F5" />} title="Project Information" />
            <div className="pd-info-grid">
              {[
                { label:"Client",       value: project.clientName    || "—" },
                { label:"Location",     value: project.location      || "—" },
                { label:"Start Date",   value: fmtDate(project.startDate) },
                { label:"End Date",     value: fmtDate(project.endDate)   },
                { label:"Description",  value: project.description   || "—", full: true },
              ].map(({ label, value, full }) => (
                <div key={label} style={full ? { gridColumn:"1/-1" } : {}}>
                  <p style={{ color:"#4988C4", fontSize:10, fontWeight:600, letterSpacing:.5, marginBottom:3 }}>
                    {label.toUpperCase()}
                  </p>
                  <p style={{ color:"#0F2854", fontSize:13, fontWeight:600 }}>{value}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Progress & Phase */}
          <Card style={{ padding:"22px" }}>
            <SectionHead icon={<ClipboardList size={16} color="#BDE8F5" />} title="Progress & Phase" />

            {/* Overall progress bar */}
            <div style={{ marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ color:"#4988C4", fontSize:12 }}>Overall Progress</span>
                <span style={{ color:"#0F2854", fontSize:12, fontWeight:700 }}>{project.progress || 0}%</span>
              </div>
              <div style={{ background:"rgba(73,136,196,0.12)", borderRadius:99, height:8 }}>
                <div style={{
                  height:8, borderRadius:99,
                  background: (project.progress||0) > 80 ? "#34C759" : (project.progress||0) > 50 ? "#4988C4" : "#FF9500",
                  width:`${project.progress || 0}%`,
                  transition:"width 0.5s ease",
                }} />
              </div>
            </div>

            {/* Phase stepper */}
            <p style={{ color:"#4988C4", fontSize:10, fontWeight:600, letterSpacing:.5, marginBottom:10 }}>CURRENT PHASE</p>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {phaseList.map((p, i) => {
                const done    = i < phaseIdx;
                const current = i === phaseIdx;
                return (
                  <div key={p} style={{
                    display:"flex", alignItems:"center", gap:10,
                    padding:"9px 12px", borderRadius:9,
                    background: current ? `${phaseColors[p]}12` : done ? "rgba(52,199,89,0.05)" : "rgba(73,136,196,0.03)",
                    border: `1px solid ${current ? phaseColors[p]+"40" : done ? "rgba(52,199,89,0.15)" : "rgba(73,136,196,0.08)"}`,
                  }}>
                    <div style={{
                      width:20, height:20, borderRadius:"50%", flexShrink:0,
                      background: current ? phaseColors[p] : done ? "#34C759" : "rgba(73,136,196,0.12)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:10, fontWeight:700,
                      color: (current || done) ? "#fff" : "#4988C4",
                    }}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span style={{
                      fontSize:12, fontWeight: current ? 700 : 500,
                      color: current ? phaseColors[p] : done ? "#34C759" : "#4988C4",
                    }}>{p}</span>
                    {current && (
                      <span style={{
                        marginLeft:"auto", background:`${phaseColors[p]}18`,
                        color: phaseColors[p], fontSize:10, fontWeight:700,
                        padding:"2px 8px", borderRadius:99,
                      }}>Current</span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ── RIGHT ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Eligibility Checklist — read-only */}
          <Card style={{ padding:"22px" }}>
            <SectionHead icon={<CheckSquare size={16} color="#BDE8F5" />} title="Eligibility Checklist" />
            {project.eligibilityStatus === "proceeded" ? (
              <>
                <div style={{
                  display:"flex", alignItems:"center", gap:6, marginBottom:14,
                  background:"rgba(52,199,89,0.08)", border:"1px solid rgba(52,199,89,0.2)",
                  borderRadius:9, padding:"8px 12px",
                }}>
                  <CheckCircle2 size={14} color="#34C759" />
                  <span style={{ color:"#34C759", fontSize:12, fontWeight:700 }}>All checks passed — Approved by admin</span>
                </div>
                <div className="pd-checks-grid">
                  {CHECKS_META.map(c => {
                    const passed = checks[c.key];
                    return (
                      <div key={c.key} style={{
                        display:"flex", alignItems:"center", gap:8, padding:"10px 12px",
                        borderRadius:10,
                        background: passed ? "rgba(52,199,89,0.06)" : "rgba(255,59,48,0.05)",
                        border: `1px solid ${passed ? "rgba(52,199,89,0.2)" : "rgba(255,59,48,0.15)"}`,
                      }}>
                        <div style={{
                          width:20, height:20, borderRadius:6, flexShrink:0,
                          background: passed ? "#34C759" : "#FF3B30",
                          display:"flex", alignItems:"center", justifyContent:"center",
                        }}>
                          {passed
                            ? <CheckCircle2 size={12} color="#fff" />
                            : <XCircle size={12} color="#fff" />}
                        </div>
                        <span style={{ fontSize:11, fontWeight:600, color: passed ? "#1a6b3c" : "#c0392b" }}>
                          {c.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {project.eligibilityProceededAt && (
                  <p style={{ color:"#4988C4", fontSize:10, textAlign:"right", marginTop:10 }}>
                    Approved · {new Date(project.eligibilityProceededAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}
                  </p>
                )}
              </>
            ) : (
              <div style={{
                display:"flex", flexDirection:"column", alignItems:"center",
                padding:"24px 16px", gap:8, textAlign:"center",
              }}>
                <Package size={28} color="rgba(73,136,196,0.3)" strokeWidth={1.5} />
                <p style={{ color:"#4988C4", fontSize:12, fontWeight:600 }}>Eligibility not yet reviewed</p>
                <p style={{ color:"#4988C4", fontSize:11, opacity:.7 }}>Admin will complete this checklist before installation begins.</p>
              </div>
            )}
          </Card>

          {/* Assigned Team */}
          <Card style={{ padding:"22px" }}>
            <SectionHead icon={<User size={16} color="#BDE8F5" />} title="Assigned Team" />
            <div className="pd-team-list">
              {engineers.map(e => (
                <div key={e._id} style={{
                  display:"flex", alignItems:"center", gap:10, padding:"9px 12px",
                  background:"rgba(73,136,196,0.04)", borderRadius:9, border:"1px solid rgba(73,136,196,0.1)",
                }}>
                  <div style={{
                    width:30, height:30, borderRadius:"50%", flexShrink:0,
                    background:"linear-gradient(135deg,#4988C4,#0F2854)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    color:"#fff", fontSize:12, fontWeight:700,
                  }}>
                    {(e.name||"?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ color:"#0F2854", fontSize:12, fontWeight:700, margin:0 }}>{e.name}</p>
                    <p style={{ color:"#4988C4", fontSize:10, margin:0 }}>Engineer</p>
                  </div>
                </div>
              ))}

              {marketing && (
                <div style={{
                  display:"flex", alignItems:"center", gap:10, padding:"9px 12px",
                  background:"rgba(255,149,0,0.04)", borderRadius:9, border:"1px solid rgba(255,149,0,0.12)",
                }}>
                  <div style={{
                    width:30, height:30, borderRadius:"50%", flexShrink:0,
                    background:"linear-gradient(135deg,#FF9500,#e67e22)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    color:"#fff", fontSize:12, fontWeight:700,
                  }}>
                    {(marketing.name||"?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ color:"#0F2854", fontSize:12, fontWeight:700, margin:0 }}>{marketing.name}</p>
                    <p style={{ color:"#FF9500", fontSize:10, margin:0 }}>Marketing Executive</p>
                  </div>
                </div>
              )}

              {installation && (
                <div style={{
                  display:"flex", alignItems:"center", gap:10, padding:"9px 12px",
                  background:"rgba(52,199,89,0.04)", borderRadius:9, border:"1px solid rgba(52,199,89,0.12)",
                }}>
                  <div style={{
                    width:30, height:30, borderRadius:"50%", flexShrink:0,
                    background:"linear-gradient(135deg,#34C759,#27ae60)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    color:"#fff", fontSize:12, fontWeight:700,
                  }}>
                    {(installation.name||"?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ color:"#0F2854", fontSize:12, fontWeight:700, margin:0 }}>{installation.name}</p>
                    <p style={{ color:"#34C759", fontSize:10, margin:0 }}>Installation Incharge</p>
                  </div>
                </div>
              )}

              {engineers.length === 0 && !marketing && !installation && (
                <p style={{ color:"#4988C4", fontSize:12, textAlign:"center", padding:"16px 0" }}>
                  No team members assigned yet.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function EngineerDashboard() {
  const [tasks,      setTasks]      = useState(TODAY_TASKS);
  const [projects,   setProjects]   = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [issues,     setIssues]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selectedProject, setSelectedProject] = useState(null); // null = dashboard view

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [pData, cData, iData] = await Promise.all([
        apiFetch("/projects"),
        apiFetch("/complaints"),
        apiFetch("/issues").catch(() => []),
      ]);
      setProjects(Array.isArray(pData) ? pData : pData.projects || []);
      setComplaints(Array.isArray(cData) ? cData : []);
      setIssues(Array.isArray(iData) ? iData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const today = new Date().toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
  const reportDue      = tasks.find(t => t.task.includes("daily report") && !t.done);
  const completedCount = tasks.filter(t => t.done).length;
  const toggle         = (id) => setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const activeProjects  = projects.filter(p => p.status !== "completed");
  const openIssuesCount = issues.length || complaints.filter(c => c.status === "open").length;

  const SUMMARY = [
    { label:"Active Projects", value: activeProjects.length, icon: FolderOpen,    color:"#4988C4", href:"/engineer"              },
    { label:"Today's Tasks",   value: tasks.length,          icon: ClipboardList, color:"#0F2854", href:"/engineer/daily-report"  },
    { label:"Open Issues",     value: openIssuesCount,       icon: AlertTriangle, color:"#FF9500", href:"/engineer/issue-log"     },
    { label:"Pending QC",      value: "N/A",                 icon: CheckSquare,   color:"#34C759", href:"/engineer/qc-upload"     },
  ];

  if (loading) return (
    <div className="py-10 px-5 text-gray-500 text-sm flex gap-2 items-center">
      <Loader2 size={16} className="animate-spin" /> Loading Engineer Dashboard...
    </div>
  );

  return (
    <>
      <style>{FONTS + RWD}</style>

      {/* ── PROJECT DETAIL VIEW ──────────────────────────────────────── */}
      {selectedProject && (
        <ProjectDetail
          project={selectedProject}
          onBack={() => setSelectedProject(null)}
        />
      )}

      {/* ── DASHBOARD VIEW ───────────────────────────────────────────── */}
      {!selectedProject && (
        <>
          {reportDue && (
            <div className="db-banner">
              <Bell size={16} color="#FF9500" style={{ flexShrink:0 }} />
              <span className="db-banner-text">
                📋 Daily Report Due Today — Submit before <strong>5:00 PM</strong>
              </span>
              <Link href="/engineer/daily-report" className="db-banner-btn">Submit Now →</Link>
            </div>
          )}

          <PageHeader eyebrow="Engineer Panel" title="Good morning, Engineer" subtitle={today} />

          {/* Summary Cards */}
          <div className="db-summary">
            {SUMMARY.map((s, i) => (
              <Link key={i} href={s.href} style={{ textDecoration:"none" }}>
                <Card
                  style={{ padding:"18px 20px", cursor:"pointer", transition:"transform .18s, box-shadow .18s", overflow:"hidden", position:"relative" }}
                  onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 28px rgba(15,40,84,0.12)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)";    e.currentTarget.style.boxShadow="0 2px 12px rgba(15,40,84,0.06)"; }}
                >
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <span className="db-stat-label" style={{ color:"#4988C4", fontSize:10, fontWeight:600, letterSpacing:.5, lineHeight:1.3 }}>
                      {s.label.toUpperCase()}
                    </span>
                    <s.icon size={16} color={s.color} strokeWidth={1.8} style={{ opacity:.7, flexShrink:0 }} />
                  </div>
                  <div className="db-stat-num" style={{ color:s.color, fontSize:32, fontWeight:800, lineHeight:1, fontFamily:"'Syne',sans-serif" }}>
                    {s.value}
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Main Grid */}
          <div className="db-main">

            {/* Today's Tasks */}
            <Card style={{ padding:"22px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, flexWrap:"wrap", gap:8 }}>
                <SectionHead icon={<ClipboardList size={16} color="#BDE8F5" />} title="Today's Tasks" />
                <span style={{ color:"#4988C4", fontSize:12 }}>{completedCount}/{tasks.length} done</span>
              </div>
              <div style={{ background:"rgba(73,136,196,0.12)", borderRadius:99, height:5, marginBottom:18 }}>
                <div style={{
                  height:5, borderRadius:99,
                  background:"linear-gradient(90deg,#4988C4,#0F2854)",
                  width:`${(completedCount / tasks.length) * 100}%`,
                  transition:"width .4s ease",
                }} />
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {tasks.map(t => {
                  const p = priorityMap[t.priority];
                  return (
                    <div key={t.id} className="db-task-row" onClick={() => toggle(t.id)} style={{
                      background: t.done ? "rgba(52,199,89,0.04)" : "rgba(73,136,196,0.04)",
                      border: `1px solid ${t.done ? "rgba(52,199,89,0.2)" : "rgba(73,136,196,0.1)"}`,
                      opacity: t.done ? 0.65 : 1,
                    }}>
                      <div style={{
                        width:18, height:18, borderRadius:5, flexShrink:0, marginTop:1,
                        background: t.done ? "#34C759" : "transparent",
                        border: `2px solid ${t.done ? "#34C759" : "rgba(73,136,196,0.4)"}`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                      }}>
                        {t.done && <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>✓</span>}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ color:"#0F2854", fontSize:12, fontWeight:600, textDecoration: t.done ? "line-through" : "none", wordBreak:"break-word" }}>
                          {t.task}
                        </div>
                        <div style={{ color:"#4988C4", fontSize:10, marginTop:2 }}>{t.project}</div>
                      </div>
                      <span style={{ background:p.bg, color:p.color, padding:"2px 8px", borderRadius:99, fontSize:10, fontWeight:700, flexShrink:0, whiteSpace:"nowrap" }}>
                        {t.priority}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Right Column */}
            <div className="db-right">

              {/* Projects — clickable */}
              <Card style={{ padding:"22px" }}>
                <SectionHead icon={<FolderOpen size={16} color="#BDE8F5" />} title="Projects Overview" />
                <div className="db-projects-list">
                  {projects.slice(0, 4).map(p => (
                    <div
                      key={p._id}
                      onClick={() => setSelectedProject(p)}
                      style={{
                        padding:"12px 14px", borderRadius:11, cursor:"pointer",
                        background:"rgba(73,136,196,0.04)",
                        border:"1px solid rgba(73,136,196,0.1)",
                        transition:"all .18s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background="rgba(73,136,196,0.1)"; e.currentTarget.style.borderColor="#4988C4"; }}
                      onMouseLeave={e => { e.currentTarget.style.background="rgba(73,136,196,0.04)"; e.currentTarget.style.borderColor="rgba(73,136,196,0.1)"; }}
                    >
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8, gap:8 }}>
                        <div style={{ minWidth:0 }}>
                          <div style={{ color:"#0F2854", fontSize:13, fontWeight:700, wordBreak:"break-word" }}>{p.name}</div>
                          <div style={{ color:"#4988C4", fontSize:11, display:"flex", alignItems:"center", gap:4, marginTop:2, flexWrap:"wrap" }}>
                            <MapPin size={10} style={{ flexShrink:0 }} /> {p.location || "Global"}
                          </div>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                          <StatusPill label={p.status || "active"} color={statusColor[p.status || "active"] || "blue"} />
                          <ChevronRight size={13} color="#4988C4" />
                        </div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ flex:1, background:"rgba(73,136,196,0.12)", borderRadius:99, height:4 }}>
                          <div style={{
                            height:4, borderRadius:99, width:`${p.progress || 0}%`,
                            background:(p.progress||0) > 80 ? "#34C759" : (p.progress||0) > 50 ? "#4988C4" : "#FF9500",
                            transition:"width .6s ease",
                          }} />
                        </div>
                        <span style={{ color:"#4988C4", fontSize:10, fontWeight:700, minWidth:28 }}>{p.progress || 0}%</span>
                      </div>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <p style={{ color:"#4988C4", fontSize:12, textAlign:"center", padding:"16px 0" }}>No active projects assigned</p>
                  )}
                </div>
              </Card>

              {/* Quick Actions */}
              <Card style={{ padding:"18px 22px" }}>
                <SectionHead icon={<FolderOpen size={16} color="#BDE8F5" />} title="Quick Actions" />
                <div className="db-quick-list">
                  {[
                    { label:"Log an Issue",       href:"/engineer/issue-log",     color:"#FF9500" },
                    { label:"Upload QC Results",  href:"/engineer/qc-upload",     color:"#34C759" },
                    { label:"Log a Complaint",    href:"/engineer/complaint-log", color:"#4988C4" },
                    { label:"Upload Documents",   href:"/engineer/documents",     color:"#0F2854" },
                  ].map((a, i) => (
                    <Link key={i} href={a.href} style={{ textDecoration:"none" }}>
                      <div
                        style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 12px", borderRadius:9, background:`${a.color}08`, border:`1px solid ${a.color}20`, cursor:"pointer", transition:"background .15s" }}
                        onMouseEnter={e => e.currentTarget.style.background=`${a.color}14`}
                        onMouseLeave={e => e.currentTarget.style.background=`${a.color}08`}
                      >
                        <span style={{ color:a.color, fontSize:12, fontWeight:600 }}>{a.label}</span>
                        <ChevronRight size={13} color={a.color} style={{ flexShrink:0 }} />
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </>
  );
}