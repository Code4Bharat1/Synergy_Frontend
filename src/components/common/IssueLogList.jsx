"use client";
import React, { useState, useEffect } from "react";
import { 
  AlertTriangle, Eye, Search, Filter, Calendar, User, 
  MapPin, CheckCircle2, Clock, X, Info, Image as ImageIcon 
} from "lucide-react";
import axiosInstance from "../../lib/axios";

const SEVERITY_COLORS = {
  Low: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", dot: "bg-emerald-500" },
  Medium: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", dot: "bg-amber-500" },
  High: { bg: "bg-red-50", text: "text-red-600", border: "border-red-100", dot: "bg-red-500" },
  Critical: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-600" },
};

const STATUS_COLORS = {
  open: { bg: "bg-blue-50", text: "text-blue-600", icon: Clock },
  "in-progress": { bg: "bg-indigo-50", text: "text-indigo-600", icon: Info },
  resolved: { bg: "bg-green-50", text: "text-green-600", icon: CheckCircle2 },
};

export default function IssueLogList({ title = "Issue log" }) {
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  
  // Filters
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/issues?_t=${Date.now()}`);
      setIssues(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch issues", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await axiosInstance.get(`/projects?_t=${Date.now()}`);
      const raw = Array.isArray(res.data) ? res.data : res.data?.projects || [];
      setProjects(raw);
    } catch (error) {
      console.error("Failed to fetch projects", error);
    }
  };

  useEffect(() => {
    fetchIssues();
    fetchProjects();
  }, []);

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = search === "" || 
                         issue.problemDescription.toLowerCase().includes(search.toLowerCase()) ||
                         issue.project?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === "All" || issue.responsibleDepartment === deptFilter;
    const matchesProject = projectFilter === "All" || issue.project?._id === projectFilter;
    const matchesSeverity = severityFilter === "All" || issue.severity === severityFilter;
    const matchesStatus = statusFilter === "All" || issue.status === statusFilter;
    
    return matchesSearch && matchesDept && matchesProject && matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            <p className="text-xs text-gray-500 mt-1">Total {filteredIssues.length} issues identified</p>
          </div>
        </div>
        
        {/* Filters Grid */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search description or project.."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Dept Filter */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5">
              <Filter size={14} className="text-gray-400" />
              <select
                className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 outline-none cursor-pointer"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <option value="All">All Departments</option>
                <option value="attendance">Attendance</option>
                <option value="admin">Admin</option>
                <option value="director">Director</option>
                <option value="engineer">Engineer</option>
                <option value="support">Support</option>
                <option value="installationIncharge">Installation Incharge</option>
                <option value="marketingCoordinator">Marketing Coordinator</option>
                <option value="marketingExecutive">Marketing Executive</option>
                <option value="qualityControl">Quality Control</option>
              </select>
            </div>

            {/* Project Filter */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5">
              <ImageIcon size={14} className="text-gray-400" />
              <select
                className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 outline-none cursor-pointer max-w-[150px]"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
              >
                <option value="All">All Projects</option>
                {projects?.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5">
              <AlertTriangle size={14} className="text-gray-400" />
              <select
                className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 outline-none cursor-pointer"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="All">All Severity</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5">
              <CheckCircle2 size={14} className="text-gray-400" />
              <select
                className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 outline-none cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-2xl"></div>
          ))
        ) : filteredIssues.length > 0 ? (
          filteredIssues.map((issue) => (
            <div 
              key={issue._id} 
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col group cursor-pointer"
              onClick={() => setSelectedIssue(issue)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${SEVERITY_COLORS[issue.severity || 'Medium'].dot}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${SEVERITY_COLORS[issue.severity || 'Medium'].text}`}>
                    {issue.severity || 'Medium'}
                  </span>
                </div>
                <div className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase ${STATUS_COLORS[issue.status || 'open'].bg} ${STATUS_COLORS[issue.status || 'open'].text}`}>
                  {issue.status || 'open'}
                </div>
              </div>

              <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                {issue.project ? (
                   <>
                     <span className="text-blue-600 font-extrabold mr-1">
                       [{typeof issue.project === 'object' ? (issue.project.projectId || 'N/A') : issue.project.slice(-6).toUpperCase()}]
                     </span>
                     {typeof issue.project === 'object' ? issue.project.name : "Unpopulated Project"}
                   </>
                ) : "No Project Linked"}
              </h3>
              
              <p className="text-xs text-gray-500 line-clamp-3 mb-4 flex-1 italic">
                "{issue.problemDescription}"
              </p>

              <div className="mt-auto pt-4 border-t border-gray-50 space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-400 flex items-center gap-1">
                    <MapPin size={10} /> {issue.responsibleDepartment}
                  </span>
                  <span className="text-gray-400 flex items-center gap-1">
                    <Calendar size={10} /> {new Date(issue.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-medium text-gray-600 bg-gray-50 p-1.5 rounded-lg">
                  <User size={10} className="text-blue-500" />
                  <span>Logged by: {issue.createdBy?.name || "Unknown"}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-center">
            <AlertTriangle className="mx-auto text-gray-300 mb-3" size={40} />
            <p className="text-gray-500 font-medium font-syne">No issues found matching your filters</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${SEVERITY_COLORS[selectedIssue.severity || 'Medium'].bg}`}>
                  <AlertTriangle size={20} className={SEVERITY_COLORS[selectedIssue.severity || 'Medium'].text} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">Issue Details</h2>
                  <p className="text-xs text-gray-500">#{selectedIssue._id.slice(-8).toUpperCase()}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedIssue(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Top Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Status</p>
                    <p className="text-xs font-bold text-blue-600 capitalize">{selectedIssue.status}</p>
                 </div>
                 <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Severity</p>
                    <p className={`text-xs font-bold ${SEVERITY_COLORS[selectedIssue.severity || 'Medium'].text}`}>{selectedIssue.severity || 'Medium'}</p>
                 </div>
                 <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Dept</p>
                    <p className="text-xs font-bold text-gray-700 capitalize">{selectedIssue.responsibleDepartment}</p>
                 </div>
                 <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Date</p>
                    <p className="text-xs font-bold text-gray-700">{new Date(selectedIssue.createdAt).toLocaleDateString()}</p>
                 </div>
              </div>

              {/* Project Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Project Information</h4>
                <div className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100/50">
                  <p className="text-blue-900 font-bold text-sm">
                    {selectedIssue.project ? (
                      <>
                        <span className="text-blue-600 mr-2">
                          [{typeof selectedIssue.project === 'object' ? (selectedIssue.project.projectId || 'N/A') : selectedIssue.project.slice(-6).toUpperCase()}]
                        </span>
                        {typeof selectedIssue.project === 'object' ? selectedIssue.project.name : "Unpopulated Project"}
                      </>
                    ) : (
                      "No Project Linked"
                    )}
                  </p>
                </div>
              </div>

              {/* Problem Description */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Problem Description</h4>
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedIssue.problemDescription}
                  </p>
                </div>
              </div>

              {/* Proposed Solution */}
              {selectedIssue.proposedSolution && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Proposed Solution</h4>
                  <div className="p-5 bg-emerald-50/30 rounded-2xl border border-emerald-100/50">
                    <p className="text-emerald-900 text-sm leading-relaxed">
                      {selectedIssue.proposedSolution}
                    </p>
                  </div>
                </div>
              )}

              {/* Media Gallery */}
              {selectedIssue.photos?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Evidence Photos</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedIssue.photos.map((photo, idx) => (
                      <div key={idx} className="aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-100 group">
                        <img 
                          src={photo.startsWith('http') ? photo : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${photo}`} 
                          alt={`Evidence ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reporter */}
              <div className="pt-6 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    {selectedIssue.createdBy?.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{selectedIssue.createdBy?.name || "Unknown User"}</p>
                    <p className="text-[11px] text-gray-400">{selectedIssue.createdBy?.email || "No email available"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
