"use client";

import { useState } from "react";

const C = {
  darkBlue:  "#0F2854",
  blue:      "#1C4D8D",
  medBlue:   "#4988C4",
  lightBlue: "#BDE8F5",
  bg:        "#f0f6fb",
  mutedText: "#6b89a5",
  dimText:   "#8fa3b8",
  white:     "#ffffff",
  divider:   "#e3eff8",
};

// ── Icons ─────────────────────────────────────
const Icon = {
  Clipboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  Wrench: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  Mail: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  ArrowRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
      <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
    </svg>
  ),
};

// ── Data ──────────────────────────────────────
const initiatedProjects = [
  { id: "PRJ-2415", name: "AquaZone Riyadh",  client: "Gulf Leisure",   submitted: "22 Feb 2026", status: "Pending Review",   risk: "Low"    },
  { id: "PRJ-2418", name: "WaveWorld Cairo",   client: "Nile Parks Co.", submitted: "21 Feb 2026", status: "Docs Missing",     risk: "Medium" },
  { id: "PRJ-2420", name: "SplashCity Malta",  client: "Euro Aqua Ltd",  submitted: "20 Feb 2026", status: "Pending Review",   risk: "Low"    },
  { id: "PRJ-2422", name: "TidalPark Muscat",  client: "Oman Leisure",   submitted: "19 Feb 2026", status: "Under Assessment", risk: "High"   },
  { id: "PRJ-2425", name: "AquaDome Karachi",  client: "Blue Wave Inc",  submitted: "18 Feb 2026", status: "Pending Review",   risk: "Low"    },
];

const pendingInstallations = [
  { id: "INS-0842", name: "WaterPlex Dubai",  engineer: "Ahmed K.",   scheduled: "28 Feb 2026", type: "Full Install",  priority: "High"   },
  { id: "INS-0845", name: "OceanPark Jeddah", engineer: "Sara M.",    scheduled: "01 Mar 2026", type: "Partial Setup", priority: "Medium" },
  { id: "INS-0849", name: "AquaHub Istanbul", engineer: "Unassigned", scheduled: "03 Mar 2026", type: "Full Install",  priority: "High"   },
  { id: "INS-0851", name: "SplashDome Lagos", engineer: "James O.",   scheduled: "05 Mar 2026", type: "Inspection",    priority: "Low"    },
];

const followUpClients = [
  { id: "PRJ-2398", client: "Horizon Parks",   contact: "Mr. Farooq", lastContact: "10 Feb 2026", reason: "Missing NOC document",      urgency: "High"   },
  { id: "PRJ-2401", client: "AquaVentures",    contact: "Ms. Lina",   lastContact: "14 Feb 2026", reason: "Contract revision pending",  urgency: "Medium" },
  { id: "PRJ-2407", client: "BlueSky Leisure", contact: "Mr. Tariq",  lastContact: "16 Feb 2026", reason: "Site survey confirmation",   urgency: "Low"    },
  { id: "PRJ-2411", client: "Delta Parks",     contact: "Ms. Rana",   lastContact: "18 Feb 2026", reason: "Payment clearance pending",  urgency: "High"   },
  { id: "PRJ-2414", client: "Coral Resorts",   contact: "Mr. Hamad",  lastContact: "20 Feb 2026", reason: "Engineer assignment needed", urgency: "Medium" },
];

// ── Helpers ───────────────────────────────────
const levelBadge = (level) => ({
  High:   { bg: C.darkBlue,  color: C.white    },
  Medium: { bg: C.blue,      color: C.white    },
  Low:    { bg: C.lightBlue, color: C.darkBlue },
}[level] || { bg: C.lightBlue, color: C.darkBlue });

const statusBadge = (s) => ({
  "Pending Review":   { bg: C.lightBlue, color: C.darkBlue },
  "Docs Missing":     { bg: C.darkBlue,  color: C.white    },
  "Under Assessment": { bg: C.blue,      color: C.white    },
  "Full Install":     { bg: C.lightBlue, color: C.darkBlue },
  "Partial Setup":    { bg: "#d6ebf7",   color: C.blue     },
  "Inspection":       { bg: "#e8f3fb",   color: C.medBlue  },
}[s] || { bg: C.lightBlue, color: C.darkBlue });

const urgencyDot = { High: C.darkBlue, Medium: C.medBlue, Low: C.lightBlue };

// ── Reusable atoms ────────────────────────────
function Badge({ label, bg, color }) {
  return (
    <span
      style={{ backgroundColor: bg, color }}
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap"
    >
      {label}
    </span>
  );
}

function StatCard({ label, value, sub, icon: Ic, barColor, iconBg, iconColor, subColor }) {
  return (
    <div className="relative bg-white rounded-xl p-4 flex flex-col gap-2 overflow-hidden shadow-sm"
      style={{ border: `1px solid ${C.lightBlue}` }}>
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: barColor }} />
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.dimText }}>{label}</span>
        <span className="p-1.5 rounded-lg" style={{ backgroundColor: iconBg, color: iconColor }}><Ic /></span>
      </div>
      <div className="text-2xl font-bold tracking-tight" style={{ color: C.darkBlue }}>{value}</div>
      <div className="text-xs font-semibold" style={{ color: subColor }}>{sub}</div>
    </div>
  );
}

function Card({ children, footer }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col"
      style={{ border: `1px solid ${C.lightBlue}` }}>
      <div className="flex-1 min-w-0">{children}</div>
      {footer && (
        <div className="px-4 py-3 flex justify-end" style={{ borderTop: `1px solid ${C.divider}` }}>
          {footer}
        </div>
      )}
    </div>
  );
}

function Thead({ cols }) {
  return (
    <tr style={{ backgroundColor: C.bg, borderBottom: `1px solid ${C.divider}` }}>
      {cols.map(h => (
        <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5 whitespace-nowrap"
          style={{ color: C.medBlue }}>{h}</th>
      ))}
    </tr>
  );
}

function HoverTr({ children }) {
  const [hov, setHov] = useState(false);
  return (
    <tr
      style={{ backgroundColor: hov ? C.bg : "transparent", borderBottom: `1px solid ${C.divider}` }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="transition-colors group"
    >
      {children}
    </tr>
  );
}

function SectionTitle({ title, count, countBg }) {
  return (
    <div className="px-4 pt-4 pb-0 flex items-center gap-2">
      <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: C.darkBlue }}>{title}</h2>
      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: countBg, color: C.white }}>
        {count}
      </span>
    </div>
  );
}

function ViewAll() {
  return (
    <button className="text-xs font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity"
      style={{ color: C.medBlue }}>
      View all <Icon.ArrowRight />
    </button>
  );
}

// ── Mobile card for projects ──────────────────
function MobileProjectCard({ p }) {
  const sb = statusBadge(p.status);
  const rb = levelBadge(p.risk);
  return (
    <div className="px-4 py-3 flex flex-col gap-2" style={{ borderBottom: `1px solid ${C.divider}` }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-bold" style={{ color: C.blue }}>{p.id}</span>
          <p className="text-sm font-semibold mt-0.5" style={{ color: C.darkBlue }}>{p.name}</p>
          <p className="text-xs" style={{ color: C.mutedText }}>{p.client}</p>
        </div>
        <Badge label={p.risk} bg={rb.bg} color={rb.color} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: C.dimText }}>{p.submitted}</span>
        <Badge label={p.status} bg={sb.bg} color={sb.color} />
      </div>
    </div>
  );
}

function MobileInstallCard({ p }) {
  const sb = statusBadge(p.type);
  const pb = levelBadge(p.priority);
  return (
    <div className="px-4 py-3 flex flex-col gap-2" style={{ borderBottom: `1px solid ${C.divider}` }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-bold" style={{ color: C.blue }}>{p.id}</span>
          <p className="text-sm font-semibold mt-0.5" style={{ color: C.darkBlue }}>{p.name}</p>
          <p className="text-xs" style={{ color: p.engineer === "Unassigned" ? C.darkBlue : C.mutedText }}>
            {p.engineer === "Unassigned" ? "— Unassigned" : p.engineer}
          </p>
        </div>
        <Badge label={p.priority} bg={pb.bg} color={pb.color} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: C.dimText }}>{p.scheduled}</span>
        <Badge label={p.type} bg={sb.bg} color={sb.color} />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────
export default function Dashboard() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      <main className="p-3 sm:p-0 md:p-5 space-y-4">

        {/* Page heading */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.medBlue }}>
            Wednesday, 25 Feb 2026 · All Sites Active
          </p>
          <h1 className="text-xl font-bold mt-0.5" style={{ color: C.darkBlue }}>Service Team Dashboard</h1>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Projects Initiated"    value="23" sub="+3 this week"       icon={Icon.Clipboard} barColor={C.darkBlue} iconBg={C.darkBlue} iconColor={C.white}    subColor={C.blue}    />
          <StatCard label="Pending Installations" value="4"  sub="2 scheduled today"  icon={Icon.Wrench}    barColor={C.blue}     iconBg={C.blue}     iconColor={C.white}    subColor={C.blue}    />
          <StatCard label="Client Follow-ups"     value="5"  sub="2 require action"   icon={Icon.Mail}      barColor={C.medBlue}  iconBg={C.medBlue}  iconColor={C.white}    subColor={C.medBlue} />
          <StatCard label="Engineers Assigned"    value="21" sub="4 unassigned"        icon={Icon.Users}     barColor={C.lightBlue}iconBg={C.lightBlue}iconColor={C.darkBlue} subColor={C.medBlue} />
        </div>

        {/* Projects Initiated */}
        <Card footer={<ViewAll />}>
          <SectionTitle title="Projects Initiated" count={initiatedProjects.length} countBg={C.darkBlue} />

          {/* Desktop table */}
          <div className="hidden md:block mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><Thead cols={["Project ID", "Project Name", "Client", "Submitted", "Status", "Risk", ""]} /></thead>
              <tbody>
                {initiatedProjects.map(p => {
                  const sb = statusBadge(p.status);
                  const rb = levelBadge(p.risk);
                  return (
                    <HoverTr key={p.id}>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap text-sm" style={{ color: C.blue }}>{p.id}</td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap text-sm" style={{ color: C.darkBlue }}>{p.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: C.mutedText }}>{p.client}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: C.dimText }}>{p.submitted}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><Badge label={p.status} bg={sb.bg} color={sb.color} /></td>
                      <td className="px-4 py-3 whitespace-nowrap"><Badge label={p.risk} bg={rb.bg} color={rb.color} /></td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button className="text-xs font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: C.blue }}>
                          Review <Icon.ChevronRight />
                        </button>
                      </td>
                    </HoverTr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden mt-2">
            {initiatedProjects.map(p => <MobileProjectCard key={p.id} p={p} />)}
          </div>
        </Card>

        {/* Bottom two panels */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {/* Pending Installations */}
          <Card footer={<ViewAll />}>
            <SectionTitle title="Pending Installations" count={pendingInstallations.length} countBg={C.blue} />

            {/* Desktop table */}
            <div className="hidden md:block mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><Thead cols={["ID", "Site", "Engineer", "Scheduled", "Type", "Priority"]} /></thead>
                <tbody>
                  {pendingInstallations.map(p => {
                    const sb = statusBadge(p.type);
                    const pb = levelBadge(p.priority);
                    return (
                      <HoverTr key={p.id}>
                        <td className="px-4 py-3 font-semibold whitespace-nowrap text-sm" style={{ color: C.blue }}>{p.id}</td>
                        <td className="px-4 py-3 font-medium whitespace-nowrap text-sm" style={{ color: C.darkBlue }}>{p.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {p.engineer === "Unassigned"
                            ? <span className="text-xs font-bold" style={{ color: C.darkBlue }}>— Unassigned</span>
                            : <span style={{ color: C.mutedText }}>{p.engineer}</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: C.dimText }}>{p.scheduled}</td>
                        <td className="px-4 py-3 whitespace-nowrap"><Badge label={p.type} bg={sb.bg} color={sb.color} /></td>
                        <td className="px-4 py-3 whitespace-nowrap"><Badge label={p.priority} bg={pb.bg} color={pb.color} /></td>
                      </HoverTr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden mt-2">
              {pendingInstallations.map(p => <MobileInstallCard key={p.id} p={p} />)}
            </div>
          </Card>

          {/* Client Follow-up */}
          <Card footer={<ViewAll />}>
            <SectionTitle title="Client Follow-up List" count={followUpClients.length} countBg={C.medBlue} />
            <div className="mt-2">
              {followUpClients.map((f, i) => {
                const ub = levelBadge(f.urgency);
                const dot = urgencyDot[f.urgency];
                return (
                  <div
                    key={f.id}
                    className="px-4 py-3 flex items-start gap-3 transition-colors"
                    style={{ borderBottom: i < followUpClients.length - 1 ? `1px solid ${C.divider}` : "none" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = C.bg}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <div className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm" style={{ color: C.darkBlue }}>{f.client}</span>
                        <span className="text-[11px] font-medium" style={{ color: C.dimText }}>{f.id}</span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: C.mutedText }}>{f.contact} · {f.reason}</p>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                      <Badge label={f.urgency} bg={ub.bg} color={ub.color} />
                      <span className="text-[11px]" style={{ color: C.dimText }}>{f.lastContact}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

        </div>
      </main>
    </div>
  );
}