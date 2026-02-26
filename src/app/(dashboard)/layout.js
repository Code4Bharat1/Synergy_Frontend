"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  FolderKanban,
  CheckSquare,
  Bell,
  Settings,
  LayoutDashboard,
  Search,
  FilePlus,
  FileText,
  Wrench,
  BarChart2,
  User,
  ClipboardCheck,
  ClipboardList,
  Hammer,
  AlertTriangle,
  MessageSquare,
  Copy,
  Send,
} from "lucide-react";

import Navbar from "@/components/common/Navbar";
import Sidebar from "@/components/common/Sidebar";
import { useAuth } from "@/context/AuthContext";

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
  ],
  installationIncharge: [
    {
      href: "/installation-incharge",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      href: "/installation-incharge/eligibility",
      icon: CheckSquare,
      label: "Eligibility Checklist",
    },
    {
      href: "/installation-incharge/assign-engineer",
      icon: CheckSquare,
      label: "Assign Engineer",
    },
    {
      href: "/installation-incharge/issue-approval",
      icon: CheckSquare,
      label: "Issue Approval",
    },
    {
      href: "/installation-incharge/progress",
      icon: CheckSquare,
      label: "Progress Monitoring",
    },
    {
      href: "/installation-incharge/Trial",
      icon: CheckSquare,
      label: "Trial & QC",
    },
    {
      href: "/installation-incharge/complaint-approval",
      icon: CheckSquare,
      label: "Complaint Approval",
    },
  ],
  qualityControl: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/quality-control" },
    {
      label: "Inspection",
      icon: ClipboardCheck,
      href: "/quality-control/inspection",
    },
    {
      label: "Trial Approval",
      icon: ClipboardList,
      href: "/quality-control/trial-approval",
    },
    { label: "Punch In", icon: Hammer, href: "/quality-control/punch-in" },
  ],
  marketingExecutive: [],
  marketingCoordinator: [],
};

export default function SynergyDashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [active, setActive] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  /* ---------------- AUTH GUARD ---------------- */
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
        return;
      }

      const rolePrefix = `/${user.role}`;

      if (!pathname.startsWith(rolePrefix)) {
        router.replace(`${rolePrefix}/dashboard`);
      }
    }
  }, [user, loading, pathname, router]);

  if (loading || !user) return null;

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
