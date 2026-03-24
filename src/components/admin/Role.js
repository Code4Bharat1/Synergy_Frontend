"use client";
import { useState, useEffect, useCallback } from "react";
import {
  ChevronDown,
  X,
  CheckCircle2,
  HardHat,
  ShieldCheck,
  MessageSquareWarning,
  Loader,
} from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const api = {
  async getProjects() {
    const res = await fetch(`${API_BASE}/projects`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load projects");
    return Array.isArray(data) ? data : data.projects || [];
  },
  async getUsers() {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load users");
    return Array.isArray(data) ? data : data.users || [];
  },
  async updateProjectRoles(id, payload) {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update roles");
    return data.project || data;
  },
};

function MultiSelect({
  label,
  icon: Icon,
  color,
  selectedIds,
  allUsers,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const selectedUsers = allUsers.filter((u) => selectedIds.includes(u._id));
  const availableUsers = allUsers.filter((u) => !selectedIds.includes(u._id));

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} className={color} />
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {label}
        </span>
        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-lightblue text-extra-blue">
          {selectedIds.length}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {selectedUsers?.map((u) => (
          <span
            key={u._id}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-lightblue text-extra-blue"
          >
            {u.name || u.email}
            <button
              onClick={() => onChange(selectedIds.filter((id) => id !== u._id))}
              className="hover:text-red-500 transition-colors"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        {selectedIds.length === 0 && (
          <span className="text-xs text-gray-300">No one assigned yet</span>
        )}
      </div>

      {availableUsers.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 text-xs font-semibold text-extra-blue hover:underline"
          >
            + Assign{" "}
            <ChevronDown size={11} className={open ? "rotate-180" : ""} />
          </button>
          {open && (
            <div
              className="absolute z-[999] mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden w-48 max-h-48 overflow-y-auto"
              style={{ top: "100%", left: 0 }}
            >
              {availableUsers?.map((u) => (
                <button
                  key={u._id}
                  onClick={() => {
                    onChange([...selectedIds, u._id]);
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-extra-darkblue hover:bg-gray-50 transition-colors"
                >
                  {u.name || u.email}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RoleAssignment() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [assignments, setAssignments] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const loadData = useCallback(async () => {
    setFetching(true);
    try {
      const [ps, us] = await Promise.all([api.getProjects(), api.getUsers()]);
      setProjects(ps);
      setUsers(us);

      const initAssig = {};
      ps.forEach((p) => {
        initAssig[p._id] = {
          engineers: (p.assignedEngineers || [])?.map((e) => e._id || e),
          qc: (p.assignedQC || [])?.map((u) => u._id || u),
          complaints: (p.assignedComplaints || [])?.map((u) => u._id || u),
        };
      });
      setAssignments(initAssig);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const update = (projectId, type, newIds) => {
    setAssignments((prev) => ({
      ...prev,
      [projectId]: { ...prev[projectId], [type]: newIds },
    }));
  };

  const handleSave = async (project) => {
    setSavingId(project._id);
    try {
      const a = assignments[project._id];
      await api.updateProjectRoles(project._id, {
        assignedEngineers: a.engineers,
        assignedQC: a.qc,
        assignedComplaints: a.complaints,
      });
      showToast(`Roles for ${project.name} saved!`);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSavingId(null);
    }
  };

  if (fetching)
    return (
      <div className="text-gray-500 text-sm py-10 flex gap-2 items-center">
        <Loader size={16} className="animate-spin" /> Loading data...
      </div>
    );

  return (
    <div className="space-y-5">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg ${toast.type === "error" ? "bg-red-500" : "bg-extra-darkblue"}`}
        >
          <CheckCircle2
            size={15}
            className={`${toast.type === "error" ? "text-red-200" : "text-green-400"}`}
          />{" "}
          {toast.msg}
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-extra-darkblue">
          Role Assignment
        </h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Assign engineers, QC inspectors and complaint handlers per project
        </p>
      </div>

      {projects.length === 0 && (
        <p className="text-sm text-gray-400">No projects found.</p>
      )}

      {/* ── 2 project cards per row ── */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
        {projects?.map((project) => {
          const a = assignments[project._id] || {
            engineers: [],
            qc: [],
            complaints: [],
          };
          const isSaving = savingId === project._id;
          return (
            <div
              key={project._id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm"
            >
              {/* Card Header */}
              <div
                className="px-5 py-4 rounded-t-xl flex items-center justify-between"
                style={{
                  background: "linear-gradient(135deg, #0F2854, #1C4D8D)",
                }}
              >
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {project.name}
                  </h3>
                  <p className="text-xs text-blue-300 mt-0.5">
                    {a.engineers.length} engineers · {a.qc.length} QC ·{" "}
                    {a.complaints.length} handlers
                  </p>
                </div>
                <button
                  onClick={() => handleSave(project)}
                  disabled={isSaving}
                  className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-white text-extra-darkblue hover:bg-lightblue transition-colors disabled:opacity-50"
                >
                  {isSaving && <Loader size={12} className="animate-spin" />}{" "}
                  Save
                </button>
              </div>

              {/* Card Body — 3 role columns */}
              <div className="p-5 grid grid-cols-3 gap-4 divide-x divide-gray-100">
                {/* Site Engineers */}
                <div className="relative">
                  <MultiSelect
                    label="Site Engineers"
                    icon={HardHat}
                    color="text-amber-500"
                    allUsers={users.filter((u) => u.role === "engineer")}
                    selectedIds={a.engineers}
                    onChange={(val) => update(project._id, "engineers", val)}
                  />
                </div>

                {/* QC Inspectors */}
                <div className="relative pl-4">
                  <MultiSelect
                    label="QC Inspectors"
                    icon={ShieldCheck}
                    color="text-extra-blue"
                    allUsers={users.filter(
                      (u) =>
                        u.role === "qualityControl" ||
                        u.role === "admin" ||
                        u.role === "director",
                    )}
                    selectedIds={a.qc}
                    onChange={(val) => update(project._id, "qc", val)}
                  />
                </div>

                {/* Complaint Team */}
                <div className="relative pl-4">
                  <MultiSelect
                    label="Complaint Team"
                    icon={MessageSquareWarning}
                    color="text-red-400"
                    allUsers={users.filter(
                      (u) =>
                        u.role === "support" ||
                        u.role === "admin" ||
                        u.role === "director",
                    )}
                    selectedIds={a.complaints}
                    onChange={(val) => update(project._id, "complaints", val)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
