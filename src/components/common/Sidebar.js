import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";

function Sidebar({ navigation, active, setActive, collapsed, setCollapsed }) {
  return (
    <aside
      className={`border-r border-gray-100 bg-white flex flex-col h-screen transition-all duration-300
        ${collapsed ? "w-20" : "w-64"}`}
    >
      {/* Header */}
      <div
        className={`min-h-16 flex items-center px-4 border-b transition-all duration-300 border-gray-100

          ${collapsed ? "justify-center" : "justify-between"}
          `}
      >
        {!collapsed && (
          <h2 className="text-lg font-semibold text-extra-blue">Synergy</h2>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-gray-50 cursor-pointer text-gray-600"
        >
          {collapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <PanelLeftClose size={18} />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.label;

          return (
            <Link
              href={item.href}
              key={item.label}
              onClick={() => setActive(item.label)}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all

                ${collapsed ? "justify-center" : "justify-start"}
                ${
                  isActive
                    ? "bg-lightblue text-extra-darkblue"
                    : "text-gray-600 hover:bg-gray-50 hover:text-extra-blue"
                }`}
            >
              <Icon size={18} />

              {/* Label */}
              {!collapsed && <span>{item.label}</span>}

              {/* Tooltip (Collapsed Mode) */}
              {collapsed && (
                <span className="absolute left-16 bg-extra-darkblue text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-gray-100">
        <button className="group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-red-500 transition-all">
          <LogOut size={18} />

          {!collapsed && <span>Logout</span>}

          {collapsed && (
            <span className="absolute left-16 bg-extra-darkblue text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap">
              Logout
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
export default Sidebar;
