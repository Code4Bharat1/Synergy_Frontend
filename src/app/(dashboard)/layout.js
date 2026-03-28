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
  UserCheck,
  ListTodo,
  Banknote,
  HardHat,
  ChartNoAxesCombined,
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
    // { label: "Role Assignment", icon: ShieldCheck, href: "/admin/role" },
    { label: "Document Control", icon: FileText, href: "/admin/document" },
    {
      label: "Staff Attendance",
      icon: CalendarCheck,
      href: "/admin/attendance",
    },
    {
      label: "Worker attendance",
      icon: CalendarCheck,
      href: "/allAttendance",
    },
    { label: "Issue Log", icon: AlertTriangle, href: "/admin/issue-log" },
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
    { label: "Task Panel", icon: ListTodo, href: "/director/tasks" },
    { label: "Attendance", icon: CalendarCheck, href: "/admin/attendance" },
    {
      label: "Worker attendance",
      icon: CalendarCheck,
      href: "/allAttendance",
    },
    { label: "Issue Log", icon: AlertTriangle, href: "/director/issue-log" },
  ],
  engineer: [
    { href: "/engineer/", icon: LayoutDashboard, label: "Dashboard" },
    {
      href: "/engineer/myProjects",
      icon: ClipboardList,
      label: "My Projects",
    },
    {
      href: "/engineer/issue-log",
      icon: AlertTriangle,
      label: "Installation Issues",
    },
    // {
    //   href: "/engineer/qc-upload",
    //   icon: CheckSquare,
    //   label: "Project Test Upload",
    // },
    {
      href: "/engineer/complaint-log",
      icon: MessageSquare,
      label: "Complaint Log",
    },
    { href: "/engineer/documents", icon: FileText, label: "Documents" },
     {
      href: "/engineer/Attendance",
      icon: HardHat,
      label: "Attendance",
    },
    {
      href: "/engineer/log-issued",
      icon: AlertTriangle,
      label: "Log Issued",
    },
    // { label: "Mark Attendance", icon: HardHat, href: "/attendance" },
  ],
  support: [
    { href: "/support", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/support/search", icon: Search, label: "Complaint History" },
    { href: "/support/log", icon: FilePlus, label: "Log Complaint" },
    { href: "/support/detail", icon: FileText, label: "Complaint Detail" },
    // { href: "/support/service", icon: Wrench, label: "Service Execution" },
    // { href: "/support/analytics", icon: BarChart2, label: "Analytics" },
    {
      href: "/task-assigned",
      icon: CalendarCheck,
      label: "Task Assigned",
    },
    // { href: "/support/profile", icon: User, label: "Profile" },
  ],
  attendance: [
    { label: "Mark Attendance", icon: HardHat, href: "/attendance-manager" },
    { label: "Records", icon: ClipboardList, href: "/attendance/records" },
  ],
  worker: [
    { label: "Mark Attendance", icon: HardHat, href: "/worker" },
  ],
  installationIncharge: [
    {
      href: "/installationIncharge",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      href: "/installationIncharge/installation-requests",
      icon: Send,
      label: "Installation Requests",
    },
    {
      href: "/installationIncharge/eligibility",
      icon: ClipboardList,
      label: "Eligibility Checklist",
    },
    {
      href: "/installationIncharge/assign-engineer",
      icon: UserCog,
      label: "Assign Engineer",
    },
    {
      href: "/installationIncharge/issue-approval",
      icon: ShieldCheck,
      label: "Issue Approval",
    },
    {
      href: "/installationIncharge/progress",
      icon: BarChart2,
      label: "Progress Monitoring",
    },
    {
      href: "/installationIncharge/Trial",
      icon: FlaskConical,
      label: "Trial & QC",
    },
    {
      href: "/installationIncharge/complaint-approval",
      icon: MessageSquareWarning,
      label: "Complaint Approval",
    },
    {
      href: "/installationIncharge/Attendance",
      icon: HardHat,
      label: "Attendance",
    },
    {
      href: "/task-assigned",
      icon: CalendarCheck,
      label: "Task Assigned",
    },
  ],
  qualityControl: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/qualityControl" },
    {
      label: "Inspection",
      icon: ClipboardCheck,
      href: "/qualityControl/inspection",
    },
    {
      label: "Trial Approval",
      icon: ClipboardList,
      href: "/qualityControl/trial-approval",
    },
    { label: "Punch In", icon: Hammer, href: "/qualityControl/punch-in" },
    {
      href: "/task-assigned",
      icon: CalendarCheck,
      label: "Task Assigned",
    },
  ],
  marketingExecutive: [
    {
      href: "/marketingExecutive/",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      href: "/marketingExecutive/Create-Project",
      icon: Copy,
      label: "Create Project",
    },
    {
      href: "/marketingExecutive/project-status",
      icon: FileText,
      label: "Project Status",
    },
    {
      href: "/marketingExecutive/my-expenses",
      icon: Banknote,
      label: "My Expenses",
    },
    {
      href: "/marketingExecutive/Attendance",
      icon: CalendarCheck,
      label: "Attendance",
    },
    {
      href: "/task-assigned",
      icon: CalendarCheck,
      label: "Task Assigned",
    },
    {
      href: "/marketingExecutive/log-issued",
      icon: AlertTriangle,
      label: "Log Issued",
    },
  ],
  marketingCoordinator: [
    {
      href: "/marketingCoordinator/",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    // {
    //   href: "/marketingCoordinator/documents",
    //   icon: FileText,
    //   label: "Documents",
    // },
      {
      href: "/marketingCoordinator/ProjectProgress",
      icon: ChartNoAxesCombined,
      label: "Project Status",
    },
    {
      href: "/marketingCoordinator/installation-request",
      icon: Send,
      label: "Installation Request",
    },
     {
      href: "/marketingCoordinator/complaintLog",
      icon: MessageSquare,
      label: "Complaint Log",
    },
    {
      href: "/marketingCoordinator/my-expenses",
      icon: Banknote,
      label: "My Expenses",
    },
    {
      href: "/marketingCoordinator/attendance",
      icon: UserCheck,
      label: "Attendance",
    },
    {
      href: "/task-assigned",
      icon: CalendarCheck,
      label: "Task Assigned",
    },
    {
      href: "/marketingCoordinator/log-issued",
      icon: AlertTriangle,
      label: "Log Issued",
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

  useEffect(() => {
    const label = localStorage.getItem("label");
    if (label) setActive(label);
  }, []);

  useEffect(() => {
    if (active) {
      localStorage.setItem("label", active);
    }
  }, [active]);

  /* ---------------- AUTH GUARD ---------------- */
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
        return;
      }

      const navigation = ROLE_NAVIGATION[user.role] || [];
      const allowedPaths = navigation?.map((item) => item.href);

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
      <div className="flex flex-col flex-1 h-screen min-w-0 overflow-hidden">
        <Navbar user={user} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-white p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
