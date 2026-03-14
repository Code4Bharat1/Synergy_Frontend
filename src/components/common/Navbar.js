import { Menu } from "lucide-react";
import NotificationPanel from "./NotificationPanel";
import { useAuth } from "@/context/AuthContext";
import { switchRole, restoreRole } from "@/services/auth.service";

function RoleSwitchOptions() {
  const { switchUserRole, restoreUserRole } = useAuth();

  const handleSwitchRole = async (role) => {
    try {
      const res = await switchRole(role);
      localStorage.setItem("accessToken", res.accessToken);
      switchUserRole(role, res.user?.originalRole || "director");
      window.location.href = `/${role === 'installationIncharge' ? 'installationIncharge' : role}`;
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
    { id: "admin", label: "Admin" },
    { id: "attendance", label: "Attendance" },
    { id: "engineer", label: "Engineer" },
    { id: "installationIncharge", label: "Installation Incharge" },
    { id: "marketingCoordinator", label: "Marketing Coordinator" },
    { id: "marketingExecutive", label: "Marketing Executive" },
    { id: "qualityControl", label: "Quality Control" },
    { id: "support", label: "Support" }
  ];

  return (
    <div className="flex flex-col gap-1">
      <button 
        onClick={handleBackToDirector}
        className="text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded"
      >
        Back to Director
      </button>
      <div className="h-px bg-gray-100 my-1" />
      <span className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Switch To:</span>
      {roles.map(r => (
        <button
          key={r.id}
          onClick={() => handleSwitchRole(r.id)}
          className="text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-extra-blue rounded transition-colors"
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
function Navbar({ user, onMenuClick }) {
  return (
    <header className="h-16 border-b border-gray-100 bg-white flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden text-gray-600 hover:text-extra-blue"
        >
          <Menu size={22} />
        </button>

        <div>
          <h1 className="text-sm text-gray-500">Welcome back</h1>
          <p className="text-sm font-semibold">{user.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <NotificationPanel userRole={user.role} />

        {/* Role Switch Dropdown for Directors */}
        {(user?.role === "director" || user?.originalRole === "director") && (
          <div className="relative group">
            <button className="flex items-center gap-1 text-xs font-semibold px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors">
              <span>Viewing As: {user.role}</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="p-1">
                <RoleSwitchOptions />
              </div>
            </div>
          </div>
        )}

        <div className="h-9 w-9 rounded-full bg-medium-blue text-white flex items-center justify-center text-sm font-semibold">
          {user.name.charAt(0)}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
