"use client";

import { LogOut, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function MobileSidebar({ navigation, active, setActive, onClose }) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch {
      router.replace("/login");
    }
  };

  return (
    <aside className="h-full w-64 bg-white shadow-lg flex flex-col">
      {/* Header */}
      <div className="min-h-16 flex items-center justify-between text-extra-blue px-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold">Synergy</h2>
        <X onClick={onClose} />
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
              onClick={() => {
                setActive(item.label);
                onClose();
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${
                  isActive
                    ? "bg-lightblue text-extra-darkblue"
                    : "text-gray-600 hover:bg-gray-50 hover:text-extra-blue"
                }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-red-500 transition-all"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default MobileSidebar;
