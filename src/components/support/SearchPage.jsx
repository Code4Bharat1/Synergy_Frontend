"use client";
import { useState } from "react";
import Link from "next/link";
import { mockComplaints, SeverityBadge, StatusBadge, PageHeader, Card, inputStyle, labelStyle } from "./shared";

export default function SearchPage() {
  const [filters, setFilters] = useState({
    project: "", client: "", location: "", item: "", status: "", dateFrom: "", dateTo: "",
  });

  const set = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

  const filtered = mockComplaints.filter(c =>
    (!filters.project  || c.projectNo.toLowerCase().includes(filters.project.toLowerCase())) &&
    (!filters.client   || c.client.toLowerCase().includes(filters.client.toLowerCase()))    &&
    (!filters.location || c.location.toLowerCase().includes(filters.location.toLowerCase())) &&
    (!filters.item     || c.item.toLowerCase().includes(filters.item.toLowerCase()))         &&
    (!filters.status   || c.status === filters.status)
  );

  return (
    <div>
      <PageHeader eyebrow="Complaints" title="Search & Filter" subtitle="Quickly locate any project or complaint" />

      {/* ── Filter Card ──────────────────────────────────────────────────── */}
      <Card style={{ padding: "22px", marginBottom: 20 }}>
        <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 14, marginBottom: 16 }}>
          🔍 Filter Complaints
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 14 }}>
          {[
            ["PROJECT NUMBER", "project", "e.g. PRJ-2401"],
            ["CLIENT NAME",    "client",  "Search client..."],
            ["LOCATION",       "location","City or country..."],
            ["ITEM NAME",      "item",    "e.g. Waterslide..."],
            ["DATE FROM",      "dateFrom", ""],
            ["DATE TO",        "dateTo",   ""],
          ].map(([lbl, key, ph]) => (
            <div key={key}>
              <label style={labelStyle}>{lbl}</label>
              <input
                style={inputStyle}
                type={key.startsWith("date") ? "date" : "text"}
                placeholder={ph}
                value={filters[key]}
                onChange={e => set(key, e.target.value)}
              />
            </div>
          ))}
        </div>

        {/* Status row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: "0 0 200px" }}>
            <label style={labelStyle}>STATUS</label>
            <select style={{ ...inputStyle, cursor: "pointer" }} value={filters.status} onChange={e => set("status", e.target.value)}>
              <option value="">All Statuses</option>
              <option>Open</option>
              <option>Under Review</option>
              <option>Resolved</option>
            </select>
          </div>
          <button
            onClick={() => setFilters({ project: "", client: "", location: "", item: "", status: "", dateFrom: "", dateTo: "" })}
            style={{
              marginTop: 20, background: "transparent", border: "1px solid rgba(73,136,196,0.3)",
              color: "#4988C4", padding: "9px 20px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 600,
            }}
          >✕ Clear Filters</button>
        </div>
      </Card>

      {/* ── Results Table ─────────────────────────────────────────────────── */}
      <Card style={{ overflow: "hidden" }}>
        <div style={{
          padding: "14px 22px",
          borderBottom: "1px solid rgba(73,136,196,0.1)",
          background: "rgba(189,232,245,0.08)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ color: "#0F2854", fontWeight: 700, fontSize: 13 }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} found
          </span>
          <span style={{ color: "#4988C4", fontSize: 11 }}>Click View to open complaint detail</span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "rgba(189,232,245,0.2)" }}>
              {["Complaint ID","Project No.","Item","Client","Severity","Status","Days Open","Action"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#1C4D8D", fontWeight: 600, fontSize: 11, letterSpacing: 0.5 }}>
                  {h.toUpperCase()}
                </th>
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
                <td style={{ padding: "12px 14px", color: "#1C4D8D", fontWeight: 700 }}>{c.id}</td>
                <td style={{ padding: "12px 14px", color: "#0F2854" }}>{c.projectNo}</td>
                <td style={{ padding: "12px 14px", color: "#4988C4" }}>{c.item}</td>
                <td style={{ padding: "12px 14px", color: "#0F2854", fontSize: 12 }}>{c.client}</td>
                <td style={{ padding: "12px 14px" }}><SeverityBadge level={c.severity} /></td>
                <td style={{ padding: "12px 14px" }}><StatusBadge status={c.status} /></td>
                <td style={{
                  padding: "12px 14px",
                  color: c.daysOpen > 10 ? "#FF3B30" : "#34C759",
                  fontWeight: 700,
                }}>{c.daysOpen}d</td>
                <td style={{ padding: "12px 14px" }}>
                  <Link href={`/support/detail?id=${c.id}`}>
                    <span style={{
                      background: "#0F2854", color: "#BDE8F5",
                      padding: "5px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    }}>View →</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}