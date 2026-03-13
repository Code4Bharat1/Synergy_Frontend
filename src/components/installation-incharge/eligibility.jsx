"use client";
import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";

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
        checked ? "bg-blue-800 border-0 shadow-md shadow-blue-200" : "bg-white border-2 border-slate-300"
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

function ProjectCard({ project, pChecks, onToggle, onProceed, proceeding, proceeded }) {
  const doneCount = CHECKS.filter((c) => pChecks[c.key]).length;
  const allDone = doneCount === CHECKS.length;
  const eligibility = getEligibilityStatus(pChecks);
  const progress = (doneCount / CHECKS.length) * 100;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-bold text-blue-700">{project.id}</p>
          <p className="font-semibold text-gray-900 text-sm mt-0.5">{project.name}</p>
          <p className="text-xs text-gray-400">{project.client}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {proceeded ? (
            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">✓ Proceeded</span>
          ) : (
            <span className={`${eligibility.cls} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
              {eligibility.label}
            </span>
          )}
          <span className="text-xs text-gray-400">{doneCount}/{CHECKS.length} checks</span>
        </div>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
        <div className="h-full bg-blue-700 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex items-center gap-3 mb-4 text-xs text-gray-500">
        <span className={project.engineer === "Unassigned" ? "text-red-500 font-bold" : ""}>{project.engineer}</span>
        <span className="text-gray-300">·</span>
        <span>{project.submitted}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {CHECKS.map((c) => (
          <div
            key={c.key}
            onClick={() => !proceeded && onToggle(project.id, c.key)}
            className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all duration-200 text-left ${
              proceeded ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
            } ${pChecks[c.key] ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-100 hover:border-gray-200"}`}
          >
            <CheckBox checked={pChecks[c.key]} onChange={() => {}} />
            <div className="flex flex-col min-w-0">
              <span className={`mb-0.5 ${pChecks[c.key] ? "text-blue-600" : "text-gray-400"}`}>{c.icon}</span>
              <span className="text-[10px] font-medium text-gray-600 leading-tight">{c.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Proceed Button */}
      {!proceeded && (
        <button
          onClick={() => onProceed(project.id)}
          disabled={!allDone || proceeding}
          className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
            allDone && !proceeding
              ? "bg-blue-800 text-white hover:bg-blue-900 shadow-md shadow-blue-200"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {proceeding ? "Processing…" : allDone ? "✓ Proceed to Engineer" : `Complete all checks to proceed (${doneCount}/4)`}
        </button>
      )}

      {proceeded && (
        <div className="w-full py-2.5 rounded-xl text-sm font-bold text-center bg-green-50 text-green-700 border border-green-200">
          ✓ Forwarded to Engineer
        </div>
      )}
    </div>
  );
}

export default function EligibilityChecklist() {
  const [projects, setProjects]   = useState([]);
  const [checks, setChecks]       = useState({});
  const [proceeded, setProceeded] = useState({}); // { projectId: true/false }
  const [proceeding, setProceeding] = useState(null); // projectId currently being saved
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState("all");
  const [toast, setToast]         = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    axiosInstance.get("/projects")
      .then(({ data }) => {
        const mapped = data.map((p) => ({
          id: p._id,
          name: p.name,
          client: p.clientName,
          engineer: p.assignedEngineers?.length > 0 ? p.assignedEngineers[0].name : "Unassigned",
          submitted: new Date(p.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric",
          }),
        }));
        setProjects(mapped);

        // Load saved checks from DB
        const savedChecks = {};
        const savedProceeded = {};
        data.forEach((p) => {
          savedChecks[p._id] = p.eligibilityChecks || {
            material: false, foundation: false, customer: false, acceptance: false,
          };
          savedProceeded[p._id] = p.eligibilityStatus === "proceeded";
        });
        setChecks(savedChecks);
        setProceeded(savedProceeded);
      })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (projectId, key) => {
    if (proceeded[projectId]) return; // lock after proceeding
    setChecks((prev) => ({
      ...prev,
      [projectId]: { ...prev[projectId], [key]: !prev[projectId][key] },
    }));
  };

  const handleProceed = async (projectId) => {
    setProceeding(projectId);
    try {
      await axiosInstance.patch(`/projects/${projectId}/eligibility`, {
        checks: checks[projectId],
      });
      setProceeded((prev) => ({ ...prev, [projectId]: true }));
      showToast("Project forwarded to engineer successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setProceeding(null);
    }
  };

  const totalEligible   = projects.filter((p) => proceeded[p.id]).length;
  const totalChecksCompleted = projects.reduce(
    (acc, p) => acc + CHECKS.filter((c) => checks[p.id]?.[c.key]).length, 0
  );

  const filtered = projects.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === "proceeded") return proceeded[p.id];
    if (filter === "incomplete") return !proceeded[p.id];
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <p className="text-red-500 font-semibold mb-1">Failed to load projects</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  const now = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-blue-950">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg transition-all ${
          toast.type === "error" ? "bg-red-500" : "bg-green-600"
        }`}>
          {toast.type === "error" ? "⚠" : "✓"} {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        <div className="mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-0.5">{now}</p>
          <h1 className="text-xl sm:text-2xl font-bold text-blue-950">Eligibility Checklist</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {[
            { label: "Total Projects",     value: projects.length,                                          accent: "border-blue-700"   },
            { label: "Forwarded",          value: totalEligible,                                            accent: "border-emerald-500" },
            { label: "Pending",            value: projects.length - totalEligible,                          accent: "border-amber-400"  },
            { label: "Checks Completed",   value: `${totalChecksCompleted} / ${projects.length * CHECKS.length}`, accent: "border-blue-400" },
          ].map((s) => (
            <div key={s.label} className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-t-4 ${s.accent}`}>
              <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{s.label}</p>
              <p className="text-3xl sm:text-4xl font-extrabold text-blue-950 leading-none">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by project, ID or client..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-blue-950 outline-none focus:border-blue-400 transition-colors"
            />
          </div>
          <div className="flex gap-1 bg-blue-100/60 rounded-xl p-1 w-full sm:w-auto">
            {[
              { key: "all",        label: "All"        },
              { key: "proceeded",  label: "Forwarded"  },
              { key: "incomplete", label: "Pending"    },
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
                  <th className="px-4 py-3.5 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4 + CHECKS.length + 2} className="py-10 text-center text-sm text-gray-400">
                      No projects match your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((project, i) => {
                    const pChecks   = checks[project.id] || {};
                    const doneCount = CHECKS.filter((c) => pChecks[c.key]).length;
                    const allDone   = doneCount === CHECKS.length;
                    const isProceeded = proceeded[project.id];
                    const eligibility = getEligibilityStatus(pChecks);
                    return (
                      <tr key={project.id} className={`border-t border-gray-50 hover:bg-blue-50/30 transition-colors ${i % 2 === 1 ? "bg-slate-50/50" : ""}`}>
                        <td className="px-4 py-3.5">
                          {/* <p className="font-bold text-blue-700 text-xs">{project.id}</p> */}
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
                              <CheckBox
                                checked={pChecks[c.key]}
                                onChange={() => toggle(project.id, c.key)}
                              />
                            </div>
                          </td>
                        ))}
                        {/* Status */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {isProceeded ? (
                              <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">✓ Forwarded</span>
                            ) : (
                              <span className={`${eligibility.cls} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>{eligibility.label}</span>
                            )}
                            <span className="text-[11px] text-gray-400">{doneCount}/{CHECKS.length}</span>
                          </div>
                        </td>
                        {/* Action */}
                        <td className="px-4 py-3.5 text-center">
                          {isProceeded ? (
                            <span className="text-xs text-green-600 font-semibold">Done</span>
                          ) : (
                            <button
                              onClick={() => handleProceed(project.id)}
                              disabled={!allDone || proceeding === project.id}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                                allDone && proceeding !== project.id
                                  ? "bg-blue-800 text-white hover:bg-blue-900 shadow-sm"
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              {proceeding === project.id ? "..." : "Proceed"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
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
                pChecks={checks[project.id] || {}}
                onToggle={toggle}
                onProceed={handleProceed}
                proceeding={proceeding === project.id}
                proceeded={proceeded[project.id]}
              />
            ))
          )}
        </div>

        <p className="mt-6 text-xs text-gray-400 text-right">
          Data refreshed · {new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}