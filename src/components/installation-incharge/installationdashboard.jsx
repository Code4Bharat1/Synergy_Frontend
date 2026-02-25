"use client";
import { useState } from "react";

const stats = [
  {
    label: "Projects Pending Eligibility",
    value: 7,
    sub: "+2 since yesterday",
    subColor: "text-amber-500",
    accent: "border-blue-400",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
        <path d="M9 12h6M9 16h4"/>
      </svg>
    ),
  },
  {
    label: "Projects In Progress",
    value: 14,
    sub: "3 nearing deadline",
    subColor: "text-red-500",
    accent: "border-blue-700",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-700",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    label: "Engineer Assignments",
    value: 21,
    sub: "4 unassigned projects",
    subColor: "text-amber-500",
    accent: "border-blue-900",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-900",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    label: "Open Issues – Approval",
    value: 5,
    sub: "Requires immediate action",
    subColor: "text-red-500",
    accent: "border-red-500",
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
];

const eligibilityData = [
  { id: "PRJ-2415", name: "AquaZone Riyadh", client: "Gulf Leisure", submitted: "22 Feb 2026", status: "Pending Review", risk: "Low" },
  { id: "PRJ-2418", name: "WaveWorld Cairo", client: "Nile Parks Co.", submitted: "21 Feb 2026", status: "Docs Missing", risk: "Medium" },
  { id: "PRJ-2420", name: "SplashCity Malta", client: "Euro Aqua Ltd", submitted: "20 Feb 2026", status: "Pending Review", risk: "Low" },
  { id: "PRJ-2422", name: "TidalPark Muscat", client: "Oman Leisure", submitted: "19 Feb 2026", status: "Under Assessment", risk: "High" },
];

const progressData = [
  { id: "PRJ-2401", name: "AquaPark Dubai", engineer: "Sara Hassan", phase: "Trial & QC", completion: 78, dueDate: "10 Mar 2026", status: "On Track" },
  { id: "PRJ-2389", name: "Blue Lagoon Resort", engineer: "Karim Nour", phase: "Issue Approval", completion: 52, dueDate: "28 Feb 2026", status: "At Risk" },
  { id: "PRJ-2376", name: "SunSplash Inc.", engineer: "Lena Weber", phase: "Progress Monitoring", completion: 35, dueDate: "15 Apr 2026", status: "On Track" },
  { id: "PRJ-2412", name: "Ocean World", engineer: "Unassigned", phase: "Assign Engineer", completion: 10, dueDate: "5 Mar 2026", status: "Delayed" },
];

const issuesData = [
  { id: "ISS-041", project: "PRJ-2389", item: "Wave Pool Panel B", severity: "High", raisedBy: "Karim Nour", daysOpen: 7 },
  { id: "ISS-039", project: "PRJ-2412", item: "Funnel Ride X2 — Structural", severity: "Critical", raisedBy: "Site Supervisor", daysOpen: 21 },
  { id: "ISS-044", project: "PRJ-2398", item: "Body Slide 360 Paint", severity: "Medium", raisedBy: "QC Team", daysOpen: 3 },
  { id: "ISS-046", project: "PRJ-2401", item: "Waterslide Alpha — Welding", severity: "Critical", raisedBy: "Eng. Ali", daysOpen: 14 },
  { id: "ISS-048", project: "PRJ-2376", item: "Pump System — Flow Rate", severity: "Low", raisedBy: "Sara Hassan", daysOpen: 2 },
];

const severityClass = {
  Critical: "bg-red-100 text-red-800",
  High: "bg-amber-100 text-amber-800",
  Medium: "bg-blue-100 text-blue-800",
  Low: "bg-green-100 text-green-800",
};

const statusClass = {
  "On Track": "bg-green-100 text-green-800",
  "At Risk": "bg-amber-100 text-amber-800",
  "Delayed": "bg-red-100 text-red-800",
  "Pending Review": "bg-blue-100 text-blue-800",
  "Docs Missing": "bg-red-100 text-red-800",
  "Under Assessment": "bg-amber-100 text-amber-800",
};

function Badge({ label, classMap }) {
  const cls = classMap[label] || "bg-gray-100 text-gray-700";
  return (
    <span className={`${cls} px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap`}>
      {label}
    </span>
  );
}

function ProgressBar({ value }) {
  const color = value >= 70 ? "bg-blue-700" : value >= 40 ? "bg-blue-400" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden min-w-[60px]">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{value}%</span>
    </div>
  );
}

// Mobile card views for each tab
function EligibilityCard({ row }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xs font-bold text-blue-700">{row.id}</span>
          <p className="font-semibold text-gray-900 text-sm mt-0.5">{row.name}</p>
          <p className="text-xs text-gray-500">{row.client}</p>
        </div>
        <button className="bg-blue-800 text-white rounded-lg px-3 py-1.5 text-xs font-semibold shrink-0 ml-2">Review</button>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <Badge label={row.status} classMap={statusClass} />
        <Badge label={row.risk} classMap={severityClass} />
        <span className="text-xs text-gray-400">{row.submitted}</span>
      </div>
    </div>
  );
}

function ProgressCard({ row }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-1">
        <div>
          <span className="text-xs font-bold text-blue-700">{row.id}</span>
          <p className="font-semibold text-gray-900 text-sm mt-0.5">{row.name}</p>
        </div>
        <Badge label={row.status} classMap={statusClass} />
      </div>
      <div className="flex items-center gap-2 mt-1 mb-3">
        <span className={`text-xs font-medium ${row.engineer === "Unassigned" ? "text-red-500 font-bold" : "text-gray-500"}`}>
          {row.engineer}
        </span>
        <span className="text-gray-300">·</span>
        <span className="text-xs text-gray-400">{row.phase}</span>
      </div>
      <ProgressBar value={row.completion} />
      <p className="text-xs text-gray-400 mt-2">Due: {row.dueDate}</p>
    </div>
  );
}

function IssueCard({ row }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xs font-bold text-blue-700">{row.id}</span>
          <p className="font-semibold text-gray-900 text-sm mt-0.5">{row.item}</p>
          <p className="text-xs text-gray-500">{row.project}</p>
        </div>
        <button className="bg-blue-950 text-white rounded-lg px-3 py-1.5 text-xs font-semibold shrink-0 ml-2">Approve</button>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <Badge label={row.severity} classMap={severityClass} />
        <span className="text-xs text-gray-400">{row.raisedBy}</span>
        <span className={`text-xs font-semibold ml-auto ${row.daysOpen > 14 ? "text-red-500" : "text-gray-500"}`}>
          {row.daysOpen}d open
        </span>
      </div>
    </div>
  );
}

const tabs = [
  { key: "eligibility", label: "Eligibility" },
  { key: "progress", label: "In Progress" },
  { key: "issues", label: "Issues" },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("eligibility");

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-blue-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-0.5">
            Wednesday, 25 Feb 2026 · All Sites Active
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-blue-950">Service Team Dashboard</h1>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-t-4 ${s.accent} flex flex-col gap-2`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider leading-tight">{s.label}</p>
                <span className={`${s.iconBg} ${s.iconColor} p-1.5 rounded-lg shrink-0`}>{s.icon}</span>
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold text-blue-950 leading-none">{s.value}</p>
              <p className={`text-xs font-medium ${s.subColor}`}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-blue-100/60 rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 sm:flex-none items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-blue-800 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {tab.key === "issues" && (
                <span className="inline-flex items-center justify-center bg-red-500 text-white rounded-full text-[10px] font-bold w-4 h-4 ml-1">5</span>
              )}
            </button>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden">
          {activeTab === "eligibility" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100">
                    {["Project ID", "Project Name", "Client", "Submitted", "Status", "Risk", "Action"].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {eligibilityData.map((row, i) => (
                    <tr key={row.id} className={`border-t border-gray-50 hover:bg-blue-50/40 transition-colors ${i % 2 === 1 ? "bg-slate-50/50" : ""}`}>
                      <td className="px-5 py-3.5 font-bold text-blue-700">{row.id}</td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900">{row.name}</td>
                      <td className="px-5 py-3.5 text-gray-500">{row.client}</td>
                      <td className="px-5 py-3.5 text-gray-500">{row.submitted}</td>
                      <td className="px-5 py-3.5"><Badge label={row.status} classMap={statusClass} /></td>
                      <td className="px-5 py-3.5"><Badge label={row.risk} classMap={severityClass} /></td>
                      <td className="px-5 py-3.5">
                        <button className="bg-blue-800 hover:bg-blue-900 text-white rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors">Review</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "progress" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100">
                    {["Project ID", "Project Name", "Engineer", "Phase", "Completion", "Due Date", "Status"].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {progressData.map((row, i) => (
                    <tr key={row.id} className={`border-t border-gray-50 hover:bg-blue-50/40 transition-colors ${i % 2 === 1 ? "bg-slate-50/50" : ""}`}>
                      <td className="px-5 py-3.5 font-bold text-blue-700">{row.id}</td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900">{row.name}</td>
                      <td className={`px-5 py-3.5 ${row.engineer === "Unassigned" ? "text-red-500 font-bold" : "text-gray-600"}`}>{row.engineer}</td>
                      <td className="px-5 py-3.5 text-gray-500">{row.phase}</td>
                      <td className="px-5 py-3.5 min-w-[160px]"><ProgressBar value={row.completion} /></td>
                      <td className="px-5 py-3.5 text-gray-500">{row.dueDate}</td>
                      <td className="px-5 py-3.5"><Badge label={row.status} classMap={statusClass} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "issues" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100">
                    {["Issue ID", "Project", "Item", "Severity", "Raised By", "Days Open", "Action"].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {issuesData.map((row, i) => (
                    <tr key={row.id} className={`border-t border-gray-50 hover:bg-blue-50/40 transition-colors ${i % 2 === 1 ? "bg-slate-50/50" : ""}`}>
                      <td className="px-5 py-3.5 font-bold text-blue-700">{row.id}</td>
                      <td className="px-5 py-3.5 text-gray-500">{row.project}</td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900">{row.item}</td>
                      <td className="px-5 py-3.5"><Badge label={row.severity} classMap={severityClass} /></td>
                      <td className="px-5 py-3.5 text-gray-500">{row.raisedBy}</td>
                      <td className={`px-5 py-3.5 font-semibold ${row.daysOpen > 14 ? "text-red-500" : "text-gray-600"}`}>{row.daysOpen}d</td>
                      <td className="px-5 py-3.5">
                        <button className="bg-blue-950 hover:bg-blue-900 text-white rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors">Approve</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Mobile Cards */}
        <div className="flex flex-col gap-3 md:hidden">
          {activeTab === "eligibility" && eligibilityData.map((row) => <EligibilityCard key={row.id} row={row} />)}
          {activeTab === "progress" && progressData.map((row) => <ProgressCard key={row.id} row={row} />)}
          {activeTab === "issues" && issuesData.map((row) => <IssueCard key={row.id} row={row} />)}
        </div>

        {/* Footer */}
        <p className="mt-6 text-xs text-gray-400 text-right">
          Data refreshed · 25 Feb 2026, 09:41 AM
        </p>
      </div>
    </div>
  );
}