"use client";
import { useState } from "react";
import { Home, FolderKanban, CheckSquare, Bell, Settings, LayoutDashboard, Search, FilePlus, FileText, Wrench, BarChart2, User } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Sidebar from "@/components/common/Sidebar";

const ROLE_NAVIGATION = {
  admin: [
    { label: "Dashboard", icon: Home, href: "/admin" },
    { label: "Projects", icon: FolderKanban, href: "/admin/projects" },
    { label: "Tasks", icon: CheckSquare, href: "/admin/tasks" },
    { label: "Complaints", icon: Bell, href: "/admin/complaints" },
    { label: "Settings", icon: Settings, href: "/admin/settings" },
  ],
  director: [
    { label: "Dashboard", icon: Home, href: "/director" },
    { label: "Projects", icon: FolderKanban, href: "/director/projects" },
    { label: "Reports", icon: FolderKanban, href: "/director/reports" },
  ],
  engineer: [
    { label: "Dashboard", icon: Home, href: "/engineer" },
    { label: "Tasks", icon: CheckSquare, href: "/engineer/tasks" },
    { label: "Projects", icon: FolderKanban, href: "/engineer/projects" },
  ],
  support: [
    { href: "/support", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/support/search", icon: Search, label: "Search" },
    { href: "/support/log", icon: FilePlus, label: "Log Complaint" },
    { href: "/support/detail", icon: FileText, label: "Complaint Detail" },
    { href: "/support/service", icon: Wrench, label: "Service Execution" },
    { href: "/support/analytics", icon: BarChart2, label: "Analytics" },
    { href: "/support/profile", icon: User, label: "Profile" }, 
  ]
};

export default function SynergyDashboardLayout({ children }) {
  const [active, setActive] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const user = {
    name: "Zaid",
    role: "support",
  };

  const navigation = ROLE_NAVIGATION[user.role] || [];

  return (
    <div className="flex h-screen overflow-hidden bg-white text-extra-darkblue">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          navigation={navigation}
          active={active}
          setActive={setActive}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setSidebarOpen(false)}
          />

          <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-lg">
            <Sidebar
              navigation={navigation}
              active={active}
              setActive={(label) => {
                setActive(label);
                setSidebarOpen(false);
              }}
              collapsed={false}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Navbar user={user} onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto bg-white p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
