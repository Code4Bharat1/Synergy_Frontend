"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Search, X, Filter, Calendar, User, MapPin, Package,
  Hash, ChevronRight, Clock, AlertCircle,
} from "lucide-react";
import { mockComplaints, SeverityBadge, StatusBadge, PageHeader, Card, inputStyle, labelStyle } from "./shared";

// ── Inline fallbacks if shared isn't wired up yet ─────────────────────────────
function SeverityBadgeFallback({ level }) {
  const map = {
    Critical: { bg: "#FF3B30", text: "#fff" },
    High:     { bg: "#FF9500", text: "#fff" },
    Medium:   { bg: "#FFCC00", text: "#0F2854" },
    Low:      { bg: "#34C759", text: "#fff" },
  };
  const c = map[level] || map.Low;
  return (
    <span style={{
      background: c.bg, color: c.text,
      padding: "2px 10px", borderRadius: 99,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
      display: "inline-block", whiteSpace: "nowrap",
    }}>{level}</span>
  );
}

function StatusBadgeFallback({ status }) {
  const map = {
    "Open":         { bg: "rgba(255,59,48,0.12)",  border: "#FF3B30", text: "#FF3B30" },
    "Under Review": { bg: "rgba(255,149,0,0.12)",  border: "#FF9500", text: "#FF9500" },
    "Resolved":     { bg: "rgba(52,199,89,0.12)",  border: "#34C759", text: "#34C759" },
  };
  const c = map[status] || map["Open"];
  return (
    <span style={{
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
      display: "inline-block", whiteSpace: "nowrap",
    }}>{status}</span>
  );
}

const SB  = typeof SeverityBadge !== "undefined" ? SeverityBadge : SeverityBadgeFallback;
const STB = typeof StatusBadge   !== "undefined" ? StatusBadge   : StatusBadgeFallback;

// ── Mock data fallback ────────────────────────────────────────────────────────
const _mockComplaints = (typeof mockComplaints !== "undefined" ? mockComplaints : [
  { id: "CMP-001", projectNo: "PRJ-2401", item: "Waterslide Alpha",  severity: "Critical", status: "Open",         daysOpen: 14, client: "AquaPark Dubai",    location: "Dubai"      },
  { id: "CMP-002", projectNo: "PRJ-2389", item: "Wave Pool Panel B", severity: "High",     status: "Under Review", daysOpen: 7,  client: "Blue Lagoon Resort", location: "Maldives"   },
  { id: "CMP-003", projectNo: "PRJ-2401", item: "Lazy River Flume",  severity: "Medium",   status: "Resolved",     daysOpen: 3,  client: "AquaPark Dubai",    location: "Dubai"      },
  { id: "CMP-004", projectNo: "PRJ-2376", item: "Speed Slide Pro",   severity: "Low",      status: "Open",         daysOpen: 2,  client: "SunSplash Inc.",     location: "Florida"    },
  { id: "CMP-005", projectNo: "PRJ-2412", item: "Funnel Ride X2",    severity: "Critical", status: "Under Review", daysOpen: 21, client: "Ocean World",        location: "Singapore"  },
  { id: "CMP-006", projectNo: "PRJ-2398", item: "Body Slide 360",    severity: "High",     status: "Open",         daysOpen: 9,  client: "Aqua Universe",      location: "Spain"      },
  { id: "CMP-007", projectNo: "PRJ-2389", item: "Speed Slide Mini",  severity: "Medium",   status: "Resolved",     daysOpen: 5,  client: "Blue Lagoon Resort", location: "Maldives"   },
  { id: "CMP-008", projectNo: "PRJ-2412", item: "Master Blaster",    severity: "High",     status: "Open",         daysOpen: 11, client: "Ocean World",        location: "Singapore"  },
]);

// ── Filter field config ───────────────────────────────────────────────────────
const FIELDS = [
  { label: "PROJECT NUMBER", key: "project",  placeholder: "e.g. PRJ-2401",    icon: Hash,     type: "text" },
  { label: "CLIENT NAME",    key: "client",   placeholder: "Search client...",  icon: User,     type: "text" },
  { label: "LOCATION",       key: "location", placeholder: "City or country...", icon: MapPin,  type: "text" },
  { label: "ITEM NAME",      key: "item",     placeholder: "e.g. Waterslide...", icon: Package, type: "text" },
  { label: "DATE FROM",      key: "dateFrom", placeholder: "",                  icon: Calendar, type: "date" },
  { label: "DATE TO",        key: "dateTo",   placeholder: "",                  icon: Calendar, type: "date" },
];

const EMPTY = { project: "", client: "", location: "", item: "", status: "", dateFrom: "", dateTo: "" };

// ── Page ─────────────────────────────────────────────────────────────────────
export default function SearchPage() {
  const [filters, setFilters] = useState(EMPTY);
  const set = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

  const filtered = _mockComplaints.filter(c =>
    (!filters.project  || c.projectNo.toLowerCase().includes(filters.project.toLowerCase()))  &&
    (!filters.client   || c.client.toLowerCase().includes(filters.client.toLowerCase()))      &&
    (!filters.location || (c.location || "").toLowerCase().includes(filters.location.toLowerCase())) &&
    (!filters.item     || c.item.toLowerCase().includes(filters.item.toLowerCase()))           &&
    (!filters.status   || c.status === filters.status)
  );

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <style>{`
        .sp-wrapper {
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          padding: 16px;
          max-width: 100%;
          box-sizing: border-box;
        }

        /* ── Filter grid ── */
        .filter-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 14px;
        }
        @media (max-width: 900px) {
          .filter-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 540px) {
          .filter-grid { grid-template-columns: 1fr; }
        }

        /* ── Input with icon ── */
        .input-wrap {
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #4988C4;
          pointer-events: none;
          display: flex;
          align-items: center;
        }
        .sp-input {
          width: 100%;
          box-sizing: border-box;
          padding: 9px 10px 9px 32px;
          border: 1px solid rgba(73,136,196,0.25);
          border-radius: 8px;
          font-size: 13px;
          color: #0F2854;
          background: #fff;
          outline: none;
          font-family: inherit;
          transition: border-color 0.15s;
        }
        .sp-input:focus { border-color: #4988C4; }
        .sp-input::placeholder { color: #aac3dc; }

        .sp-label {
          display: block;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.6px;
          color: #4988C4;
          margin-bottom: 5px;
          text-transform: uppercase;
        }

        /* ── Status row ── */
        .status-row {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          flex-wrap: wrap;
        }
        .status-select-wrap { flex: 0 0 200px; }
        @media (max-width: 540px) {
          .status-select-wrap { flex: 1 1 100%; }
        }

        /* ── Card shell ── */
        .sp-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid rgba(73,136,196,0.15);
          box-shadow: 0 2px 12px rgba(15,40,84,0.06);
          margin-bottom: 20px;
        }

        /* ── Desktop table ── */
        .results-table-scroll {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .results-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 680px;
        }
        .rt-th {
          padding: 10px 14px;
          text-align: left;
          color: #1C4D8D;
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 0.5px;
        }
        .rt-td { padding: 12px 14px; }

        /* Show table, hide cards on desktop */
        .results-cards  { display: none; }
        .results-table-scroll { display: block; }

        /* ── Mobile / Tablet (≤ 768px) ── */
        @media (max-width: 768px) {
          .results-table-scroll { display: none; }
          .results-cards {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 16px;
          }

          .rc-card {
            border-radius: 12px;
            border: 1px solid rgba(73,136,196,0.15);
            background: #fff;
            padding: 14px 16px;
            box-shadow: 0 1px 8px rgba(15,40,84,0.05);
          }
          .rc-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            flex-wrap: wrap;
            gap: 6px;
          }
          .rc-id { color: #1C4D8D; font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 4px; }
          .rc-item { color: #0F2854; font-weight: 600; font-size: 14px; margin-bottom: 3px; }
          .rc-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            font-size: 12px;
            color: #4988C4;
            margin-bottom: 10px;
            align-items: center;
          }
          .rc-meta-item { display: flex; align-items: center; gap: 3px; }
          .rc-bottom {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
          }
          .rc-badges { display: flex; gap: 6px; flex-wrap: wrap; }
          .rc-view-btn {
            background: #0F2854;
            color: #BDE8F5;
            padding: 6px 14px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 3px;
            white-space: nowrap;
          }
        }
      `}</style>

      <div className="sp-wrapper">

        {/* ── Page Header ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ color: "#4988C4", fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
            Complaints
          </div>
          <h1 style={{ color: "#0F2854", fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 800, margin: 0 }}>
            Search &amp; Filter
          </h1>
          <p style={{ color: "#4988C4", fontSize: 13, margin: "4px 0 0" }}>
            Quickly locate any project or complaint
          </p>
        </div>

        {/* ── Filter Card ── */}
        <div className="sp-card" style={{ padding: "22px" }}>
          <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Filter size={16} color="#4988C4" />
            Filter Complaints
          </div>

          <div className="filter-grid">
            {FIELDS.map(({ label, key, placeholder, icon: Icon, type }) => (
              <div key={key}>
                <label className="sp-label">{label}</label>
                <div className="input-wrap">
                  <span className="input-icon"><Icon size={14} /></span>
                  <input
                    className="sp-input"
                    type={type}
                    placeholder={placeholder}
                    value={filters[key]}
                    onChange={e => set(key, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Status + Clear */}
          <div className="status-row">
            <div className="status-select-wrap">
              <label className="sp-label">STATUS</label>
              <div className="input-wrap">
                <span className="input-icon"><AlertCircle size={14} /></span>
                <select
                  className="sp-input"
                  style={{ cursor: "pointer", appearance: "none" }}
                  value={filters.status}
                  onChange={e => set("status", e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option>Open</option>
                  <option>Under Review</option>
                  <option>Resolved</option>
                </select>
              </div>
            </div>

            {hasFilters && (
              <button
                onClick={() => setFilters(EMPTY)}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(73,136,196,0.3)",
                  color: "#4988C4",
                  padding: "9px 16px",
                  borderRadius: 8,
                  fontSize: 12,
                  cursor: "pointer",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "inherit",
                }}
              >
                <X size={13} /> Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* ── Results ── */}
        <div className="sp-card" style={{ overflow: "hidden" }}>

          {/* Results header */}
          <div style={{
            padding: "14px 22px",
            borderBottom: "1px solid rgba(73,136,196,0.1)",
            background: "rgba(189,232,245,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
          }}>
            <span style={{ color: "#0F2854", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <Search size={14} color="#4988C4" />
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} found
            </span>
            <span style={{ color: "#4988C4", fontSize: 11 }}>Click View to open complaint detail</span>
          </div>

          {/* ── Desktop Table ── */}
          <div className="results-table-scroll">
            <table className="results-table">
              <thead>
                <tr style={{ background: "rgba(189,232,245,0.2)" }}>
                  {["Complaint ID","Project No.","Item","Client","Severity","Status","Days Open","Action"].map(h => (
                    <th key={h} className="rt-th">{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: "32px", textAlign: "center", color: "#4988C4", fontSize: 13 }}>
                    No complaints match your filters.
                  </td></tr>
                ) : filtered.map((c, i) => (
                  <tr key={c.id} style={{
                    borderTop: "1px solid rgba(73,136,196,0.08)",
                    background: i % 2 === 0 ? "#fff" : "rgba(189,232,245,0.03)",
                  }}>
                    <td className="rt-td" style={{ color: "#1C4D8D", fontWeight: 700 }}>{c.id}</td>
                    <td className="rt-td" style={{ color: "#0F2854" }}>{c.projectNo}</td>
                    <td className="rt-td" style={{ color: "#4988C4" }}>{c.item}</td>
                    <td className="rt-td" style={{ color: "#0F2854", fontSize: 12 }}>{c.client}</td>
                    <td className="rt-td"><SB level={c.severity} /></td>
                    <td className="rt-td"><STB status={c.status} /></td>
                    <td className="rt-td" style={{ color: c.daysOpen > 10 ? "#FF3B30" : "#34C759", fontWeight: 700 }}>
                      {c.daysOpen}d
                    </td>
                    <td className="rt-td">
                      <Link href={`/support/detail?id=${c.id}`}>
                        <span style={{
                          background: "#0F2854", color: "#BDE8F5",
                          padding: "5px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                          cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4,
                        }}>
                          View <ChevronRight size={11} />
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile / Tablet Cards ── */}
          <div className="results-cards">
            {filtered.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "#4988C4", fontSize: 13 }}>
                No complaints match your filters.
              </div>
            ) : filtered.map((c) => (
              <div key={c.id} className="rc-card">
                <div className="rc-top">
                  <span className="rc-id">
                    <Hash size={12} /> {c.id}
                  </span>
                  <span style={{ color: c.daysOpen > 10 ? "#FF3B30" : "#34C759", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 3 }}>
                    <Clock size={12} /> {c.daysOpen}d open
                  </span>
                </div>

                <div className="rc-item">{c.item}</div>

                <div className="rc-meta">
                  <span className="rc-meta-item"><User size={11} /> {c.client}</span>
                  <span className="rc-meta-item"><Hash size={11} /> {c.projectNo}</span>
                  {c.location && <span className="rc-meta-item"><MapPin size={11} /> {c.location}</span>}
                </div>

                <div className="rc-bottom">
                  <div className="rc-badges">
                    <SB level={c.severity} />
                    <STB status={c.status} />
                  </div>
                  <Link href={`/support/detail?id=${c.id}`} className="rc-view-btn">
                    View <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}