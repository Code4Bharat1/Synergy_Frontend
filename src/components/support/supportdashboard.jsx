"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, RefreshCw } from "lucide-react";
import axiosInstance from "../../lib/axios";

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
const authCfg = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

function SeverityBadge({ level }) {
  const map = {
    critical: { bg: "#FF3B30", text: "#fff" },
    high: { bg: "#FF9500", text: "#fff" },
    medium: { bg: "#FFCC00", text: "#0F2854" },
    low: { bg: "#34C759", text: "#fff" },
  };
  const c = map[level?.toLowerCase()] || map.low;
  return (
    <span style={{
      background: c.bg, color: c.text,
      padding: "2px 10px", borderRadius: 99,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
      display: "inline-block", whiteSpace: "nowrap",
    }}>{level}</span>
  );
}

function StatusBadge({ status }) {
  const map = {
    "open": { bg: "rgba(255,59,48,0.12)", border: "#FF3B30", text: "#FF3B30" },
    "in-progress": { bg: "rgba(255,149,0,0.12)", border: "#FF9500", text: "#FF9500" },
    "resolved": { bg: "rgba(52,199,89,0.12)", border: "#34C759", text: "#34C759" },
    "closed": { bg: "rgba(73,136,196,0.12)", border: "#4988C4", text: "#4988C4" },
  };
  const c = map[status?.toLowerCase()] || map["open"];
  const label = status === "in-progress" ? "Under Review" : status;
  return (
    <span style={{
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
      display: "inline-block", whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

const daysSince = (dateStr) => {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000);
};

export default function DashboardPage() {
  const router = useRouter();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const r = await axiosInstance.get("/complaints", authCfg());
      const data = Array.isArray(r.data) ? r.data : r.data.data || [];
      setComplaints(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load complaints.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const open     = complaints.filter(c => c.status === "open").length;
  const review   = complaints.filter(c => c.status === "in-progress").length;
  const resolved = complaints.filter(c => c.status === "resolved" || c.status === "closed").length;
  const critical = complaints.filter(c => c.priority === "critical").length;

  // ── All cards go to the complaint search/list page ────────────────────────
  const summaryCards = [
    { label: "Total Open Complaints",   value: open,     color: "#FF3B30", sub: "Require action"            },
    { label: "Complaints Under Review", value: review,   color: "#FF9500", sub: "Being processed"           },
    { label: "Resolved This Month",     value: resolved, color: "#34C759", sub: "Closed / resolved"         },
    { label: "Critical Complaints",     value: critical, color: "#FF3B30", sub: "Requires immediate action" },
  ];

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <>
      <style>{`
        .dash-wrapper { font-family: 'DM Sans','Segoe UI',sans-serif; padding: 16px; max-width: 100%; box-sizing: border-box; }
        .summary-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 28px; }
        @media (max-width: 900px) { .summary-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 480px) { .summary-grid { grid-template-columns: 1fr 1fr; gap: 10px; } }
        .dash-header { margin-bottom: 28px; }
        .table-card-header { padding: 18px 22px; border-bottom: 1px solid rgba(73,136,196,0.1); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
        .card-value { font-size: 34px; font-weight: 800; line-height: 1; margin-bottom: 8px; }
        @media (max-width: 540px) { .card-value { font-size: 26px; } }
        .summary-card {
          background: #fff; border-radius: 16px;
          border: 1px solid rgba(73,136,196,0.15);
          box-shadow: 0 2px 12px rgba(15,40,84,0.06);
          padding: 20px 22px; overflow: hidden;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        }
        .summary-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(15,40,84,0.12);
          border-color: rgba(73,136,196,0.4);
        }
        .summary-card:active { transform: translateY(0) scale(0.98); }
        .table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .complaints-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 620px; }
        .th-cell { padding: 10px 16px; text-align: left; color: #1C4D8D; font-weight: 600; font-size: 11px; letter-spacing: 0.5px; }
        .td-cell { padding: 12px 16px; cursor: pointer; }
        .complaint-row:hover { background: rgba(189,232,245,0.15) !important; }
        .complaint-cards { display: none; }
        @media (max-width: 768px) {
          .table-scroll { display: none; }
          .complaint-cards { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
          .complaint-card { border-radius: 12px; border: 1px solid rgba(73,136,196,0.15); background: #fff; padding: 14px 16px; box-shadow: 0 1px 8px rgba(15,40,84,0.05); cursor: pointer; }
          .cc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 6px; }
          .cc-id { color: #1C4D8D; font-weight: 700; font-size: 13px; }
          .cc-days { font-weight: 700; font-size: 13px; }
          .cc-item { color: #0F2854; font-weight: 600; font-size: 14px; margin-bottom: 4px; }
          .cc-client { color: #4988C4; font-size: 12px; margin-bottom: 10px; }
          .cc-bottom { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: space-between; }
          .cc-badges { display: flex; gap: 6px; flex-wrap: wrap; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="dash-wrapper">

        {/* ── Header ── */}
        <div className="dash-header">
          <div style={{ color: "#4988C4", fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Overview</div>
          <h1 style={{ color: "#0F2854", fontSize: "clamp(20px,4vw,26px)", fontWeight: 800, margin: 0 }}>Service Team Dashboard</h1>
          <p style={{ color: "#4988C4", fontSize: 13, margin: "4px 0 0" }}>{today} · All Sites Active</p>
        </div>

        {/* ── Clickable Summary Cards ── */}
        {loading ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center", color: "#4988C4", marginBottom: 28, fontSize: 13 }}>
            <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} /> Loading dashboard…
          </div>
        ) : (
          <div className="summary-grid">
            {summaryCards.map((c, i) => (
              <div
                key={i}
                className="summary-card"
                onClick={() => router.push("/support/detail")}
              >
                <div style={{ color: "#4988C4", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>{c.label}</div>
                <div className="card-value" style={{ color: c.color }}>{c.value}</div>
                <div style={{ color: c.color, fontSize: 11, fontWeight: 500, opacity: 0.8 }}>{c.sub}</div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{ background: "rgba(255,59,48,0.06)", border: "1px solid rgba(255,59,48,0.2)", borderRadius: 10, padding: "10px 14px", color: "#FF3B30", fontSize: 13, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>⚠ {error}</span>
            <button onClick={fetchComplaints} style={{ background: "none", border: "none", cursor: "pointer", color: "#FF3B30" }}><RefreshCw size={13} /></button>
          </div>
        )}

        {/* ── Recent Complaints Table ── */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(73,136,196,0.15)", boxShadow: "0 2px 12px rgba(15,40,84,0.06)", overflow: "hidden" }}>
          <div className="table-card-header">
            <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 15 }}>Recent Complaints</div>
            <Link href="/support/search" style={{ background: "#0F2854", color: "#BDE8F5", padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none", display: "inline-block", whiteSpace: "nowrap" }}>
              View All →
            </Link>
          </div>

          {/* Desktop Table */}
          <div className="table-scroll">
            <table className="complaints-table">
              <thead>
                <tr style={{ background: "rgba(189,232,245,0.2)" }}>
                  {["Title", "Project", "Priority", "Status", "Days Open"].map(h => (
                    <th key={h} className="th-cell">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#4988C4", fontSize: 13 }}>Loading…</td></tr>
                ) : complaints.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#4988C4", fontSize: 13 }}>No complaints found.</td></tr>
                ) : complaints.slice(0, 6).map((c, i) => (
                  <tr
                    key={c._id}
                    className="complaint-row"
                    onClick={() => router.push(`/support/detail?id=${c._id}`)}
                    style={{ borderTop: "1px solid rgba(73,136,196,0.08)", background: i % 2 === 0 ? "#fff" : "rgba(189,232,245,0.04)", cursor: "pointer" }}
                  >
                    <td className="td-cell" style={{ color: "#0F2854", fontWeight: 600, maxWidth: 220, wordBreak: "break-word" }}>{c.title}</td>
                    <td className="td-cell" style={{ color: "#4988C4", fontSize: 12 }}>{c.project?.name || "—"}</td>
                    <td className="td-cell"><SeverityBadge level={c.priority} /></td>
                    <td className="td-cell"><StatusBadge status={c.status} /></td>
                    <td className="td-cell" style={{ color: daysSince(c.createdAt) > 10 ? "#FF3B30" : "#34C759", fontWeight: 700 }}>{daysSince(c.createdAt)}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="complaint-cards">
            {complaints.slice(0, 6).map(c => (
              <div
                key={c._id}
                className="complaint-card"
                onClick={() => router.push(`/support/detail?id=${c._id}`)}
              >
                <div className="cc-top">
                  <span className="cc-id">{c._id?.slice(-6).toUpperCase()}</span>
                  <span className="cc-days" style={{ color: daysSince(c.createdAt) > 10 ? "#FF3B30" : "#34C759" }}>
                    {daysSince(c.createdAt)}d open
                  </span>
                </div>
                <div className="cc-item">{c.title}</div>
                <div className="cc-client">{c.project?.name || "No project"}</div>
                <div className="cc-bottom">
                  <div className="cc-badges">
                    <SeverityBadge level={c.priority} />
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}