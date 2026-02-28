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
  MessageSquareWarning,
  BarChart3,
  CalendarCheck,
  ShieldCheck,
  Users,
  UserCog,
  FlaskConical,
} from "lucide-react";

import Navbar from "@/components/common/Navbar";
import { useAuth } from "@/context/AuthContext";
import MobileSidebar from "@/components/common/MobileSidebar";
import DesktopSidebar from "@/components/common/DesktopSidebar";

const ROLE_NAVIGATION = {
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    { label: "User Management", icon: Users, href: "/admin/user" },
    { label: "Projects", icon: FolderKanban, href: "/admin/project" },
    { label: "Role Assignment", icon: ShieldCheck, href: "/admin/role" },
    { label: "Document Control", icon: FileText, href: "/admin/document" },
    { label: "Attendance", icon: CalendarCheck, href: "/admin/attendance" },
  ],
  director: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/director" },
    { label: "Projects", icon: FolderKanban, href: "/director/project" },
    { label: "Approvals", icon: CheckSquare, href: "/director/approval" },
    {
      label: "Complaints",
      icon: MessageSquareWarning,
      href: "/director/complaint",
    },
    { label: "Performance", icon: BarChart3, href: "/director/performance" },
  ],
  engineer: [
    { href: "/engineer/", icon: LayoutDashboard, label: "Dashboard" },
    {
      href: "/engineer/daily-report",
      icon: ClipboardList,
      label: "Daily Report",
    },
    { href: "/engineer/issue-log", icon: AlertTriangle, label: "Issue Log" },
    { href: "/engineer/qc-upload", icon: CheckSquare, label: "QC Upload" },
    {
      href: "/engineer/complaint-log",
      icon: MessageSquare,
      label: "Complaint Log",
    },
    { href: "/engineer/documents", icon: FileText, label: "Documents" },
  ],
  support: [
    { href: "/support", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/support/search", icon: Search, label: "Search" },
    { href: "/support/log", icon: FilePlus, label: "Log Complaint" },
    { href: "/support/detail", icon: FileText, label: "Complaint Detail" },
    { href: "/support/service", icon: Wrench, label: "Service Execution" },
    { href: "/support/analytics", icon: BarChart2, label: "Analytics" },
    // { href: "/support/profile", icon: User, label: "Profile" },
  ],
  "installation-incharge": [
    {
      href: "/installation-incharge",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      href: "/installation-incharge/eligibility",
      icon: ClipboardList,
      label: "Eligibility Checklist",
    },
    {
      href: "/installation-incharge/assign-engineer",
      icon: UserCog,
      label: "Assign Engineer",
    },
    {
      href: "/installation-incharge/issue-approval",
      icon: ShieldCheck,
      label: "Issue Approval",
    },
    {
      href: "/installation-incharge/progress",
      icon: BarChart2,
      label: "Progress Monitoring",
    },
    {
      href: "/installation-incharge/Trial",
      icon: FlaskConical,
      label: "Trial & QC",
    },
    {
      href: "/installation-incharge/complaint-approval",
      icon: MessageSquareWarning,
      label: "Complaint Approval",
    },
    {
      href: "/installation-incharge/Attendance",
      icon: CalendarCheck,
      label: "Attendance",
    },
  ],
  "quality-control": [
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
  "marketing-executive": [
    {
      href: "/marketing-executive/",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      href: "/marketing-executive/Create-Project",
      icon: Copy,
      label: "Create Project",
    },
    {
      href: "/marketing-executive/project-status",
      icon: FileText,
      label: "Project Status",
    },
    {
      href: "/marketing-executive/Attendance",
      icon: CalendarCheck,
      label: "Attendance",
    },
  ],
  "marketing-coordinator": [
    {
      href: "/marketing-coordinator/",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      href: "/marketing-coordinator/project-replication",
      icon: Copy,
      label: "Project Replication",
    },
    {
      href: "/marketing-coordinator/documents",
      icon: FileText,
      label: "Documents",
    },
    {
      href: "/marketing-coordinator/installation-request",
      icon: Send,
      label: "Installation Request",
    },
  ],
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

      const navigation = ROLE_NAVIGATION[user.role] || [];
      const allowedPaths = navigation.map((item) => item.href);

      const isAllowed = allowedPaths.some((path) => pathname.startsWith(path));

      if (!isAllowed && allowedPaths.length > 0) {
        router.replace(allowedPaths[0]);
      }
    }
  }, [user, loading, pathname, router]);

  if (loading || !user) return null;

  const navigation = ROLE_NAVIGATION[user.role] || [];

  return (
    <div className="flex h-screen overflow-hidden bg-white text-extra-darkblue">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <DesktopSidebar
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
          <div className="absolute left-0 top-0 h-full">
            <MobileSidebar
              navigation={navigation}
              active={active}
              setActive={setActive}
              onClose={() => setSidebarOpen(false)}
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
