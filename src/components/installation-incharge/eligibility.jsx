"use client";
import { useState } from "react";

const PROJECTS = [
  { id: "PRJ-2415", name: "AquaZone Riyadh", client: "Gulf Leisure", engineer: "Sara Hassan", submitted: "22 Feb 2026" },
  { id: "PRJ-2418", name: "WaveWorld Cairo", client: "Nile Parks Co.", engineer: "Karim Nour", submitted: "21 Feb 2026" },
  { id: "PRJ-2420", name: "SplashCity Malta", client: "Euro Aqua Ltd", engineer: "Lena Weber", submitted: "20 Feb 2026" },
  { id: "PRJ-2422", name: "TidalPark Muscat", client: "Oman Leisure", engineer: "Unassigned", submitted: "19 Feb 2026" },
  { id: "PRJ-2431", name: "BlueLake Athens", client: "Hellas Aqua", engineer: "Nadia Farouq", submitted: "18 Feb 2026" },
  { id: "PRJ-2435", name: "FlowPark Doha", client: "Qatar Parks Ltd", engineer: "Omar Siddiq", submitted: "17 Feb 2026" },
];

const CHECKS = [
  {
    key: "material",
    label: "Material Delivered",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
        <path d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z" />
      </svg>
    ),
  },
  {
    key: "foundation",
    label: "Foundation Completed",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="17" width="18" height="4" rx="1" />
        <path d="M12 3v14M7 8l5-5 5 5" />
      </svg>
    ),
  },
  {
    key: "customer",
    label: "Customer Readiness",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    key: "acceptance",
    label: "Client Acceptance",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
];

function getEligibilityStatus(checks) {
  const total = CHECKS.length;
  const done = CHECKS.filter((c) => checks[c.key]).length;
  if (done === total) return { label: "Eligible", cls: "bg-green-100 text-green-800" };
  if (done >= 2) return { label: "In Progress", cls: "bg-blue-100 text-blue-800" };
  if (done === 1) return { label: "Partial", cls: "bg-amber-100 text-amber-800" };
  return { label: "Not Started", cls: "bg-gray-100 text-gray-500" };
}

function CheckBox({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      aria-pressed={checked}
      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center shrink-0 transition-all duration-200 cursor-pointer ${
        checked
          ? "bg-blue-800 border-0 shadow-md shadow-blue-200"
          : "bg-white border-2 border-slate-300"
      }`}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
          <path d="M2.5 6.5L5.5 9.5L10.5 4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

// Mobile card for each project
function ProjectCard({ project, pChecks, onToggle }) {
  const doneCount = CHECKS.filter((c) => pChecks[c.key]).length;
  const eligibility = getEligibilityStatus(pChecks);
  const progress = (doneCount / CHECKS.length) * 100;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-bold text-blue-700">{project.id}</p>
          <p className="font-semibold text-gray-900 text-sm mt-0.5">{project.name}</p>
          <p className="text-xs text-gray-400">{project.client}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`${eligibility.cls} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
            {eligibility.label}
          </span>
          <span className="text-xs text-gray-400">{doneCount}/{CHECKS.length} checks</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-blue-700 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Engineer & date */}
      <div className="flex items-center gap-3 mb-4 text-xs text-gray-500">
        <span className={project.engineer === "Unassigned" ? "text-red-500 font-bold" : ""}>
          {project.engineer}
        </span>
        <span className="text-gray-300">·</span>
        <span>{project.submitted}</span>
      </div>

      {/* Checklist items */}
      <div className="grid grid-cols-2 gap-2">
        {CHECKS.map((c) => (
          <button
            key={c.key}
            onClick={() => onToggle(project.id, c.key)}
            className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all duration-200 text-left ${
              pChecks[c.key]
                ? "bg-blue-50 border-blue-200"
                : "bg-gray-50 border-gray-100 hover:border-gray-200"
            }`}
          >
            <CheckBox checked={pChecks[c.key]} onChange={() => {}} />
            <div className="flex flex-col min-w-0">
              <span className={`text-blue-500 mb-0.5 ${pChecks[c.key] ? "text-blue-600" : "text-gray-400"}`}>
                {c.icon}
              </span>
              <span className="text-[10px] font-medium text-gray-600 leading-tight">{c.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function EligibilityChecklist() {
  const [checks, setChecks] = useState(() =>
    Object.fromEntries(
      PROJECTS.map((p) => [
        p.id,
        { material: false, foundation: false, customer: false, acceptance: false },
      ])
    )
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const toggle = (projectId, key) => {
    setChecks((prev) => ({
      ...prev,
      [projectId]: { ...prev[projectId], [key]: !prev[projectId][key] },
    }));
  };

  const totalEligible = PROJECTS.filter((p) => CHECKS.every((c) => checks[p.id][c.key])).length;
  const totalChecksCompleted = PROJECTS.reduce(
    (acc, p) => acc + CHECKS.filter((c) => checks[p.id][c.key]).length, 0
  );

  const filtered = PROJECTS.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === "eligible") return CHECKS.every((c) => checks[p.id][c.key]);
    if (filter === "incomplete") return !CHECKS.every((c) => checks[p.id][c.key]);
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-blue-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-0.5">
            Wednesday, 25 February 2026
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-blue-950">Eligibility Checklist</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {[
            { label: "Total Projects", value: PROJECTS.length, accent: "border-blue-700" },
            { label: "Fully Eligible", value: totalEligible, accent: "border-emerald-500" },
            { label: "In Progress", value: PROJECTS.length - totalEligible, accent: "border-amber-400" },
            {
              label: "Checks Completed",
              value: `${totalChecksCompleted} / ${PROJECTS.length * CHECKS.length}`,
              accent: "border-blue-400",
            },
          ].map((s) => (
            <div key={s.label} className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-t-4 ${s.accent}`}>
              <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{s.label}</p>
              <p className="text-3xl sm:text-4xl font-extrabold text-blue-950 leading-none">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by project, ID or client..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-blue-950 outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Filter pills */}
          <div className="flex gap-1 bg-blue-100/60 rounded-xl p-1 w-full sm:w-auto">
            {[
              { key: "all", label: "All" },
              { key: "eligible", label: "Eligible" },
              { key: "incomplete", label: "Incomplete" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  filter === f.key ? "bg-blue-800 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100">
                  <th className="px-4 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Project</th>
                  <th className="px-4 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Client</th>
                  <th className="px-4 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Engineer</th>
                  <th className="px-4 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Submitted</th>
                  {CHECKS.map((c) => (
                    <th key={c.key} className="px-3 py-3.5 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider w-24 min-w-[90px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-blue-400">{c.icon}</span>
                        <span className="leading-tight">{c.label}</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3.5 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4 + CHECKS.length + 1} className="py-10 text-center text-sm text-gray-400">
                      No projects match your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((project, i) => {
                    const pChecks = checks[project.id];
                    const doneCount = CHECKS.filter((c) => pChecks[c.key]).length;
                    const eligibility = getEligibilityStatus(pChecks);
                    return (
                      <tr
                        key={project.id}
                        className={`border-t border-gray-50 hover:bg-blue-50/30 transition-colors ${i % 2 === 1 ? "bg-slate-50/50" : ""}`}
                      >
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-blue-700 text-xs">{project.id}</p>
                          <p className="text-gray-800 font-medium text-xs mt-0.5">{project.name}</p>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500">{project.client}</td>
                        <td className={`px-4 py-3.5 text-xs font-medium ${project.engineer === "Unassigned" ? "text-red-500 font-bold" : "text-gray-600"}`}>
                          {project.engineer}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500">{project.submitted}</td>
                        {CHECKS.map((c) => (
                          <td key={c.key} className="px-3 py-3.5 text-center w-24">
                            <div className="flex justify-center">
                              <CheckBox checked={pChecks[c.key]} onChange={() => toggle(project.id, c.key)} />
                            </div>
                          </td>
                        ))}
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`${eligibility.cls} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                              {eligibility.label}
                            </span>
                            <span className="text-[11px] text-gray-400">{doneCount}/{CHECKS.length}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile & Tablet Cards */}
        <div className="flex flex-col gap-3 lg:hidden">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center text-sm text-gray-400 shadow-sm">
              No projects match your search.
            </div>
          ) : (
            filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                pChecks={checks[project.id]}
                onToggle={toggle}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-xs text-gray-400 text-right">
          Data refreshed · 25 Feb 2026, 09:41 AM
        </p>
      </div>
    </div>
  );
}