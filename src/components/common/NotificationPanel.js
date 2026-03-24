"use client";
import { useState, useEffect, useRef } from "react";
import {
  Bell,
  CheckSquare,
  Clock,
  X,
  BellDot,
  CheckCircle2,
  Circle,
} from "lucide-react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export default function NotificationPanel({ userRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState("notifications"); // "notifications" | "activities"
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const panelRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setActivities(res.data.activities || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    } else {
      // Periodically check for unread count maybe? Or just fetch on open.
      // For now, fetch once on mount to get unread count
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(
        `${API_BASE}/notifications/${id}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        },
      );
      setNotifications((prev) =>
        prev?.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
    } catch (error) {
      console.error("Error marking as read", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }
    setIsOpen(false);
    if (notification.link) {
      router.push(`/${userRole}${notification.link}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(
        `${API_BASE}/notifications/read-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        },
      );
      setNotifications((prev) => prev?.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Error marking all as read", error);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-gray-500 hover:text-extra-blue transition-all p-2 rounded-full hover:bg-gray-100"
      >
        {unreadCount > 0 ? (
          <BellDot size={20} className="text-blue-500" />
        ) : (
          <Bell size={20} />
        )}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[90] sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:translate-x-0 sm:translate-y-0 sm:mt-2 w-[90%] max-w-sm sm:w-96 max-h-[80vh] bg-white rounded-2xl sm:rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] sm:shadow-lg border border-gray-100 z-[100] overflow-hidden flex flex-col transition-all">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 text-lg sm:text-base">
                Notifications
              </h3>
              <div className="flex items-center gap-3 sm:gap-2">
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[10px] sm:text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 bg-blue-50 sm:bg-transparent px-2 py-1 sm:p-0 rounded-full sm:rounded-none"
                  title="Mark all as read"
                >
                  <CheckSquare size={14} />
                  <span className="hidden sm:inline">Mark all read</span>
                  <span className="sm:hidden">Mark Read</span>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="sm:hidden" />
                  <X size={16} className="hidden sm:block" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab("notifications")}
                className={`flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === "notifications" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                Notifications{" "}
                {notifications.filter((n) => !n.isRead).length > 0 &&
                  `(${notifications.filter((n) => !n.isRead).length})`}
              </button>
              {/* <button
              onClick={() => setActiveTab("activities")}
              className={`flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === "activities" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Activity Log
            </button> */}
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-0 overscroll-contain">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : activeTab === "notifications" ? (
                notifications.length > 0 ? (
                  <div className="divide-y divide-gray-50 flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto">
                      {notifications.slice(0, 5)?.map((notification) => (
                        <div
                          key={notification._id}
                          className={`p-4 hover:bg-gray-50 transition-colors flex gap-3 cursor-pointer ${!notification.isRead ? "bg-blue-50/30" : ""}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="mt-1 flex-shrink-0">
                            {notification.isRead ? (
                              <CheckCircle2
                                size={18}
                                className="text-gray-400"
                              />
                            ) : (
                              <Circle
                                size={18}
                                className="text-blue-500 fill-blue-50/50"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <p
                              className={`text-sm ${!notification.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}
                            >
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                              <Clock size={10} />
                              {formatDistanceToNow(
                                new Date(notification.createdAt),
                                { addSuffix: true },
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-gray-100 bg-gray-50 text-center sticky bottom-0">
                      <Link
                        href={`/${userRole}/notifications`}
                        onClick={() => setIsOpen(false)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        View All Notifications
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500 flex flex-col items-center">
                    <Bell className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-sm">No notifications right now.</p>
                  </div>
                )
              ) : activities.length > 0 ? (
                <div className="divide-y divide-gray-50 flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto">
                    {activities.slice(0, 5)?.map((activity) => (
                      <div
                        key={activity._id}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <p className="text-sm font-medium text-gray-800">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {activity.message}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                          <Clock size={10} />
                          {formatDistanceToNow(new Date(activity.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-gray-100 bg-gray-50 text-center sticky bottom-0">
                    <Link
                      href={`/${userRole}/notifications`}
                      onClick={() => setIsOpen(false)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      View All Activities
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500 flex flex-col items-center">
                  <Clock className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-sm">No activity log found.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
