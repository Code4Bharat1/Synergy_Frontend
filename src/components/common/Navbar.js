import { Menu } from "lucide-react";
import NotificationPanel from "./NotificationPanel";
import { useAuth } from "@/context/AuthContext";
import { switchRole, restoreRole } from "@/services/auth.service";
import { useState, useRef, useEffect } from "react";

function RoleSwitchOptions({ onClose }) {
  const { switchUserRole, restoreUserRole } = useAuth();

  const handleSwitchRole = async (role) => {
    try {
      const res = await switchRole(role);
      localStorage.setItem("accessToken", res.accessToken);
      switchUserRole(role, res.user?.originalRole || "director");
      window.location.href = `/${role}`;
    } catch (err) {
      console.error("Switch role error:", err);
    }
  };

  const handleBackToDirector = async () => {
    try {
      const res = await restoreRole();
      localStorage.setItem("accessToken", res.accessToken);
      restoreUserRole();
      window.location.href = "/director";
    } catch (err) {
      console.error("Restore role error:", err);
    }
  };

  const roles = [
    { id: "admin",                label: "Admin" },
    { id: "attendance",           label: "Attendance" },
    { id: "engineer",             label: "Engineer" },
    { id: "installationIncharge", label: "Installation Incharge" },
    { id: "marketingCoordinator", label: "Marketing Coordinator" },
    { id: "marketingExecutive",   label: "Marketing Executive" },
    { id: "qualityControl",       label: "Quality Control" },
    { id: "support",              label: "Support" },
  ];

  return (
    <div className="flex flex-col gap-0.5">
      <button
        onClick={() => { handleBackToDirector(); onClose?.(); }}
        className="text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded transition-colors"
      >
        Back to Director
      </button>
      <div className="h-px bg-gray-100 my-1" />
      <span className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
        Switch To:
      </span>
      {roles.map(r => (
        <button
          key={r.id}
          onClick={() => { handleSwitchRole(r.id); onClose?.(); }}
          className="text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-extra-blue rounded transition-colors"
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

function Navbar({ user, onMenuClick }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isDirector = user?.role === "director" || user?.originalRole === "director";

  return (
    <header className="h-16 border-b border-gray-100 bg-white flex items-center justify-between px-4 md:px-6 shrink-0">

      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden text-gray-600 hover:text-extra-blue"
        >
          <Menu size={22} />
        </button>

        {/* Welcome text — hidden on mobile */}
        <div className="hidden sm:block">
          <h1 className="text-sm text-gray-500">Welcome back</h1>
          <p className="text-sm font-semibold">{user.name}</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 md:gap-3">
        <NotificationPanel userRole={user.role} />

        {/* Role Switch — Directors only */}
        {isDirector && (
          <div className="relative" ref={dropdownRef}>
            {/* Toggle button — clickable */}
            <button
              onClick={() => setDropdownOpen(prev => !prev)}
              className="flex items-center gap-1 text-xs font-semibold px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            >
              <span className="hidden sm:inline">Viewing As: </span>
              <span>{user.role}</span>
              <svg
                className={`w-3 h-3 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-100 rounded-lg shadow-lg z-50">
                <div className="p-1">
                  <RoleSwitchOptions onClose={() => setDropdownOpen(false)} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Avatar — shows name initial, on mobile shows name tooltip */}
        <div className="h-9 w-9 rounded-full bg-medium-blue text-white flex items-center justify-center text-sm font-semibold shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
      </div>

    </header>
  );
}

export default Navbar;