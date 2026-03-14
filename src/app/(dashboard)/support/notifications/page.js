"use client";
import React, { useState, useEffect } from "react";
import { Bell, Clock, CheckSquare, Search, Filter, CheckCircle2, Circle } from "lucide-react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("notifications");
  const [notifications, setNotifications] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { user } = useAuth();
  
  const userRole = user?.role || "admin";

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`
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
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(`${API_BASE}/notifications/${id}/read`, {}, { 
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true 
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("Error marking as read", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }
    if (notification.link) {
      router.push(`/${userRole}${notification.link}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(`${API_BASE}/notifications/read-all`, {}, { 
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true 
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Error marking all as read", error);
    }
  };

  const filteredNotifications = notifications.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredActivities = activities.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications & Activity</h1>
          <p className="text-sm text-gray-500 mt-1">Stay updated with the latest alerts and activities.</p>
        </div>
        
        {activeTab === "notifications" && unreadCount > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors text-sm font-medium shadow-sm"
          >
            <CheckSquare size={16} />
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Header Tabs & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50 gap-4">
          <div className="flex p-1 bg-gray-100 rounded-lg w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("notifications")}
              className={`flex-1 sm:w-32 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "notifications" 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Notifications {unreadCount > 0 && <span className="ml-1 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">{unreadCount}</span>}
            </button>
            <button
              onClick={() => setActiveTab("activities")}
              className={`flex-1 sm:w-32 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "activities" 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Activity Log
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-0 bg-gray-50/30">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : activeTab === "notifications" ? (
            filteredNotifications.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <div 
                    key={notification._id} 
                    className={`p-5 hover:bg-white transition-colors flex gap-4 cursor-pointer group ${!notification.isRead ? 'bg-blue-50/40' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="mt-1 flex-shrink-0">
                      {notification.isRead ? (
                        <CheckCircle2 size={20} className="text-gray-300 group-hover:text-gray-400" />
                      ) : (
                        <Circle size={20} className="text-blue-500 fill-blue-100" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4">
                        <h4 className={`text-base ${!notification.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-400 flex items-center gap-1 whitespace-nowrap bg-white px-2 py-1 rounded-md border border-gray-100">
                          <Clock size={12} />
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className={`mt-1 text-sm ${!notification.isRead ? 'text-gray-700' : 'text-gray-500'}`}>
                        {notification.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No notifications found</h3>
                <p className="text-sm mt-1 text-gray-500">You're all caught up!</p>
              </div>
            )
          ) : (
            filteredActivities.length > 0 ? (
              <div className="relative border-l border-gray-200 ml-6 md:ml-10 my-6 space-y-8 pb-4">
                {filteredActivities.map((activity, index) => (
                  <div key={activity._id} className="relative pl-6 md:pl-8 group">
                    <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-white border-2 border-gray-300 group-hover:border-blue-500 transition-colors"></span>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4">
                        <h4 className="text-sm font-semibold text-gray-800">{activity.title}</h4>
                        <span className="text-xs text-gray-400 flex items-center gap-1 whitespace-nowrap">
                          <Clock size={12} />
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{activity.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No activity logs found</h3>
                <p className="text-sm mt-1 text-gray-500">There are no recent activities to display.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
