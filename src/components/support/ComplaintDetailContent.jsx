"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import {
  ArrowLeft, FileText, Wrench, Camera, Package,
  Settings, PenLine, MapPin, User, Hash, Calendar,
  Clock, Layers, HardHat, Palette, Loader2,
} from "lucide-react";
import axiosInstance from "../../lib/axios";

const getToken = () => typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
const authCfg = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });
const daysSince = d => Math.floor((Date.now() - new Date(d)) / 86400000);

// ── Badge Components ─────────────────────────────────────────────────────────
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

// ── InfoRow helper ─────────────────────────────────────────────────────────────
function InfoRow({ label, value, icon: Icon }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 0", borderBottom: "1px solid rgba(73,136,196,0.08)",
    }}>
      <span style={{ color: "#4988C4", fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
        {Icon && <Icon size={12} />} {label}
      </span>
      <span style={{ color: "#0F2854", fontSize: 13, fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{value}</span>
    </div>
  );
}

// ── Main content (fetches by ID from backend) ───────────────────────────────────────
function ComplaintDetailContent() {
  const params = useSearchParams();
  const id = params.get("id");

  const [c, setC] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) { setError("No complaint ID in URL."); setLoading(false); return; }
    axiosInstance.get(`/complaints/${id}`, authCfg())
      .then(r => {
        const data = r.data.data || r.data;
        setC(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching complaint:", err);
        setError("Complaint not found.");
      });
  }, [id]);

  if (loading) return <div style={{ padding: 32, color: "#4988C4", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 8 }}><Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> Loading complaint…<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
  if (error || !c) return <div style={{ padding: 32, color: "#FF3B30", fontFamily: "'DM Sans',sans-serif" }}>⚠ {error || "Complaint not found."} <Link href="/support/search" style={{ color: "#4988C4", marginLeft: 12 }}>← Back</Link></div>;

  const loggedDate = new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const materials = [
    ["Gel Coat Resin", "5 kg", "$240", "Dispatched"],
    ["Fiberglass Cloth", "10 m²", "$180", "Pending"],
    ["Hardener", "2 L", "$60", "Pending"],
  ];

  return (
    <>
      <style>{`
        .dp-wrapper {
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          padding: 16px;
          max-width: 100%;
          box-sizing: border-box;
        }

        /* ── Page header top row ── */
        .dp-title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .dp-badges { display: flex; gap: 10px; flex-wrap: wrap; }

        /* ── Two-column info grid ── */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        @media (max-width: 768px) {
          .info-grid { grid-template-columns: 1fr; }
        }

        /* ── sp-card ── */
        .dp-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid rgba(73,136,196,0.15);
          box-shadow: 0 2px 12px rgba(15,40,84,0.06);
        }

        /* ── Card section header ── */
        .card-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .card-icon {
          width: 30px; height: 30px; border-radius: 8px;
          background: #0F2854;
          display: flex; align-items: center; justify-content: center;
          color: #BDE8F5; flex-shrink: 0;
        }
        .card-title { color: #0F2854; fontWeight: 700; fontSize: 14px; }

        /* ── Photos grid ── */
        .photos-grid {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .photo-thumb {
          width: 110px; height: 90px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(73,136,196,0.2); cursor: pointer; flex-shrink: 0;
        }
        @media (max-width: 540px) {
          .photo-thumb { width: calc(50% - 6px); height: 80px; }
        }

        /* ── Materials table ── */
        .mat-table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .mat-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 420px; }
        .mat-th { padding: 9px 16px; text-align: left; color: #1C4D8D; font-size: 11px; font-weight: 600; }
        .mat-td { padding: 11px 16px; }

        /* Mobile cards for materials */
        .mat-cards { display: none; }
        @media (max-width: 768px) {
          .mat-table-scroll { display: none; }
          .mat-cards {
            display: flex; flex-direction: column; gap: 10px; padding: 16px;
          }
          .mat-card {
            display: flex; justify-content: space-between; align-items: center;
            padding: 12px 14px; border-radius: 10px;
            border: 1px solid rgba(73,136,196,0.12);
            background: rgba(189,232,245,0.04);
            flex-wrap: wrap; gap: 8px;
          }
          .mat-name { color: #0F2854; font-weight: 600; font-size: 13px; }
          .mat-meta { color: #4988C4; font-size: 12px; display: flex; gap: 10px; flex-wrap: wrap; margin-top: 2px; }
          .mat-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        }

        /* ── Action buttons ── */
        .action-row {
          display: flex;
          gap: 12px;
          margin-top: 20px;
          flex-wrap: wrap;
        }
        .btn-primary {
          background: linear-gradient(135deg, #0F2854, #1C4D8D);
          color: #BDE8F5;
          padding: 11px 24px; border-radius: 10px;
          font-size: 13px; font-weight: 700; cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px;
          text-decoration: none; border: none; font-family: inherit;
        }
        .btn-secondary {
          background: #fff;
          border: 1px solid rgba(73,136,196,0.3);
          color: #4988C4;
          padding: 11px 24px; border-radius: 10px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px;
          font-family: inherit;
        }
        @media (max-width: 480px) {
          .btn-primary, .btn-secondary { flex: 1; justify-content: center; }
        }

        /* ── Complaint info stat row ── */
        .stat-row {
          display: flex; gap: 16px; margin-bottom: 14px; flex-wrap: wrap;
        }
        .stat-item { display: flex; flex-direction: column; gap: 4px; }
        .stat-label {
          color: #4988C4; font-size: 11px; font-weight: 600; letter-spacing: 0.5px;
          text-transform: uppercase;
        }
      `}</style>

      <div className="dp-wrapper">

        {/* ── Back ── */}
        <div style={{ marginBottom: 12 }}>
          <Link href="/support/search" style={{ color: "#4988C4", fontSize: 13, cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
            <ArrowLeft size={14} /> Back to Search
          </Link>
        </div>

        {/* ── Title Row ── */}
        <div className="dp-title-row">
          <div>
            <div style={{ color: "#4988C4", fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
              Complaint Detail
            </div>
            <h1 style={{ color: "#0F2854", fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 800, margin: 0 }}>{c.title}</h1>
            <p style={{ color: "#4988C4", fontSize: 13, margin: "4px 0 0" }}>{c.project?.name || "—"} · {c.priority} priority</p>
          </div>
          <div className="dp-badges">
            <SeverityBadge level={c.priority} />
            <StatusBadge status={c.status} />
          </div>
        </div>

        {/* ── Info Grid ── */}
        <div className="info-grid">

          {/* Basic Info */}
          <div className="dp-card" style={{ padding: "22px" }}>
            <div className="card-heading">
              <div className="card-icon"><FileText size={15} /></div>
              <span className="card-title">Basic Information</span>
            </div>
            <InfoRow label="Project" value={c.project?.name || "—"} icon={Hash} />
            <InfoRow label="Logged By" value={c.loggedBy?.name || "—"} icon={User} />
            <InfoRow label="Status" value={c.status} icon={Clock} />
            <InfoRow label="Priority" value={c.priority} icon={Package} />
          </div>

          {/* Complaint Info */}
          <div className="dp-card" style={{ padding: "22px" }}>
            <div className="card-heading">
              <div className="card-icon"><Wrench size={15} /></div>
              <span className="card-title">Complaint Info</span>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div className="stat-label" style={{ marginBottom: 6 }}>Description</div>
              <div style={{
                color: "#0F2854", fontSize: 13, lineHeight: 1.6,
                background: "rgba(189,232,245,0.1)", padding: "12px 14px", borderRadius: 8,
              }}>
                {c.description || "No detailed description provided."}
              </div>
            </div>

            <div className="stat-row">
              <div className="stat-item">
                <span className="stat-label">Severity</span>
                <SeverityBadge level={c.priority} />
              </div>
              <div className="stat-item">
                <span className="stat-label">Status</span>
                <StatusBadge status={c.status} />
              </div>
              <div className="stat-item">
                <span className="stat-label">Days Open</span>
                <span style={{ color: daysSince(c.createdAt) > 10 ? "#FF3B30" : "#34C759", fontSize: 15, fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={13} /> {daysSince(c.createdAt)}d
                </span>
              </div>
            </div>

            <div>
              <div className="stat-label" style={{ marginBottom: 6 }}>Logged Date</div>
              <div style={{ color: "#0F2854", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                <Calendar size={13} color="#4988C4" /> {loggedDate}
              </div>
            </div>
          </div>
        </div>

        {/* ── Photos ── */}
        <div className="dp-card" style={{ padding: "22px", marginBottom: 16 }}>
          <div className="card-heading">
            <div className="card-icon"><Camera size={15} /></div>
            <span className="card-title">Complaint Photos</span>
          </div>
          <div className="photos-grid">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="photo-thumb" style={{
                background: `linear-gradient(135deg, rgba(73,136,196,${0.1 + n * 0.05}), rgba(189,232,245,0.3))`,
              }}>
                <Camera size={24} color="rgba(73,136,196,0.4)" />
              </div>
            ))}
          </div>
        </div>

        {/* ── Materials ── */}
        <div className="dp-card" style={{ overflow: "hidden", marginBottom: 0 }}>
          <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(73,136,196,0.1)", display: "flex", alignItems: "center", gap: 8 }}>
            <Package size={15} color="#4988C4" />
            <span style={{ color: "#0F2854", fontWeight: 700, fontSize: 14 }}>Required Materials</span>
          </div>

          {/* Desktop table */}
          <div className="mat-table-scroll">
            <table className="mat-table">
              <thead>
                <tr style={{ background: "rgba(189,232,245,0.2)" }}>
                  {["Material", "Quantity", "Est. Cost", "Status"].map(h => (
                    <th key={h} className="mat-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materials.map(([mat, qty, cost, st], i) => (
                  <tr key={i} style={{ borderTop: "1px solid rgba(73,136,196,0.08)" }}>
                    <td className="mat-td" style={{ color: "#0F2854" }}>{mat}</td>
                    <td className="mat-td" style={{ color: "#4988C4" }}>{qty}</td>
                    <td className="mat-td" style={{ color: "#34C759", fontWeight: 700 }}>{cost}</td>
                    <td className="mat-td">
                      <span style={{
                        padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                        background: st === "Dispatched" ? "rgba(52,199,89,0.12)" : "rgba(255,149,0,0.12)",
                        border: `1px solid ${st === "Dispatched" ? "#34C759" : "#FF9500"}`,
                        color: st === "Dispatched" ? "#34C759" : "#FF9500",
                      }}>{st}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mat-cards">
            {materials.map(([mat, qty, cost, st], i) => (
              <div key={i} className="mat-card">
                <div>
                  <div className="mat-name">{mat}</div>
                  <div className="mat-meta">
                    <span>{qty}</span>
                    <span style={{ color: "#34C759", fontWeight: 700 }}>{cost}</span>
                  </div>
                </div>
                <div className="mat-right">
                  <span style={{
                    padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                    background: st === "Dispatched" ? "rgba(52,199,89,0.12)" : "rgba(255,149,0,0.12)",
                    border: `1px solid ${st === "Dispatched" ? "#34C759" : "#FF9500"}`,
                    color: st === "Dispatched" ? "#34C759" : "#FF9500",
                  }}>{st}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="action-row">
          <Link href={`/support/service?id=${id}`} className="btn-primary">
            <Settings size={15} /> Start Service Execution
          </Link>
          <button className="btn-secondary">
            <PenLine size={15} /> Edit Complaint
          </button>
        </div>

      </div>
    </>
  );
}

export default function ComplaintDetailPage() {
  return (
    <Suspense fallback={<div style={{ color: "#4988C4", padding: 32, fontFamily: "'DM Sans', sans-serif" }}>Loading...</div>}>
      <ComplaintDetailContent />
    </Suspense>
  );
}