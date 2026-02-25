"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { mockComplaints, SeverityBadge, StatusBadge, PageHeader, Card } from "./shared";

function ComplaintDetailContent() {
  const params = useSearchParams();
  const id = params.get("id");
  const c = mockComplaints.find(x => x.id === id) || mockComplaints[0];

  const infoRow = (label, value) => (
    <div key={label} style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 0", borderBottom: "1px solid rgba(73,136,196,0.08)",
    }}>
      <span style={{ color: "#4988C4", fontSize: 12 }}>{label}</span>
      <span style={{ color: "#0F2854", fontSize: 13, fontWeight: 600 }}>{value}</span>
    </div>
  );

  return (
    <div>
      {/* Back link */}
      <div style={{ marginBottom: 12 }}>
        <Link href="/support/search">
          <span style={{ color: "#4988C4", fontSize: 13, cursor: "pointer" }}>← Back to Search</span>
        </Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ color: "#4988C4", fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Complaint Detail</div>
          <h1 style={{ color: "#0F2854", fontSize: 26, fontWeight: 800, margin: 0 }}>{c.id}</h1>
          <p style={{ color: "#4988C4", fontSize: 13, margin: "4px 0 0" }}>{c.item} · {c.projectNo} · {c.client}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <SeverityBadge level={c.severity} />
          <StatusBadge status={c.status} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* ── Basic Info ──────────────────────────────────────────────────── */}
        <Card style={{ padding: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "#0F2854", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🧾</div>
            <span style={{ color: "#0F2854", fontWeight: 700, fontSize: 14 }}>Basic Information</span>
          </div>
          {infoRow("Project Number", c.projectNo)}
          {infoRow("Client Name",    c.client)}
          {infoRow("Location",       c.location)}
          {infoRow("Item",           c.item)}
          {infoRow("Batch Number",   "BT-2024-117")}
          {infoRow("Contractor",     "AquaBuild LLC")}
          {infoRow("Gel Coat Batch", "GC-003-A")}
        </Card>

        {/* ── Complaint Info ───────────────────────────────────────────────── */}
        <Card style={{ padding: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "#0F2854", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🛠</div>
            <span style={{ color: "#0F2854", fontWeight: 700, fontSize: 14 }}>Complaint Info</span>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ color: "#4988C4", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: 0.5 }}>DESCRIPTION</div>
            <div style={{
              color: "#0F2854", fontSize: 13, lineHeight: 1.6,
              background: "rgba(189,232,245,0.1)", padding: "12px 14px", borderRadius: 8,
            }}>
              Gel coat delamination observed across 3 panels. Surface cracking visible near joints.
              Issue likely related to batch GC-003-A. Reported by site inspector during routine check.
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
            <div>
              <div style={{ color: "#4988C4", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: 0.5 }}>SEVERITY</div>
              <SeverityBadge level={c.severity} />
            </div>
            <div>
              <div style={{ color: "#4988C4", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: 0.5 }}>STATUS</div>
              <StatusBadge status={c.status} />
            </div>
            <div>
              <div style={{ color: "#4988C4", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: 0.5 }}>DAYS OPEN</div>
              <span style={{ color: c.daysOpen > 10 ? "#FF3B30" : "#34C759", fontSize: 15, fontWeight: 800 }}>{c.daysOpen}d</span>
            </div>
          </div>

          <div>
            <div style={{ color: "#4988C4", fontSize: 11, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>LOGGED DATE</div>
            <div style={{ color: "#0F2854", fontSize: 13, fontWeight: 600 }}>
              {new Date(Date.now() - c.daysOpen * 86400000).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Photos ───────────────────────────────────────────────────────── */}
      <Card style={{ padding: "22px", marginBottom: 16 }}>
        <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 14, marginBottom: 16 }}>📷 Complaint Photos</div>
        <div style={{ display: "flex", gap: 12 }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} style={{
              width: 110, height: 90, borderRadius: 10,
              background: `linear-gradient(135deg, rgba(73,136,196,${0.1 + n * 0.05}), rgba(189,232,245,0.3))`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, border: "1px solid rgba(73,136,196,0.2)", cursor: "pointer",
            }}>📷</div>
          ))}
        </div>
      </Card>

      {/* ── Materials Required ───────────────────────────────────────────── */}
      <Card style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(73,136,196,0.1)" }}>
          <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 14 }}>📦 Required Materials</div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr style={{ background: "rgba(189,232,245,0.2)" }}>
            {["Material", "Quantity", "Est. Cost", "Status"].map(h => (
              <th key={h} style={{ padding: "9px 16px", textAlign: "left", color: "#1C4D8D", fontSize: 11, fontWeight: 600 }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {[["Gel Coat Resin", "5 kg", "$240", "Dispatched"], ["Fiberglass Cloth", "10 m²", "$180", "Pending"], ["Hardener", "2 L", "$60", "Pending"]].map(([mat, qty, cost, st], i) => (
              <tr key={i} style={{ borderTop: "1px solid rgba(73,136,196,0.08)" }}>
                <td style={{ padding: "11px 16px", color: "#0F2854" }}>{mat}</td>
                <td style={{ padding: "11px 16px", color: "#4988C4" }}>{qty}</td>
                <td style={{ padding: "11px 16px", color: "#34C759", fontWeight: 700 }}>{cost}</td>
                <td style={{ padding: "11px 16px" }}>
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
      </Card>

      {/* ── Action Buttons ───────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <Link href="/support/service">
          <span style={{
            background: "linear-gradient(135deg, #0F2854, #1C4D8D)", color: "#BDE8F5",
            padding: "11px 24px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
            display: "inline-block",
          }}>⚙ Start Service Execution</span>
        </Link>
        <button style={{
          background: "#fff", border: "1px solid rgba(73,136,196,0.3)", color: "#4988C4",
          padding: "11px 24px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>✏ Edit Complaint</button>
      </div>
    </div>
  );
}

export default function ComplaintDetailPage() {
  return (
    <Suspense fallback={<div style={{ color: "#4988C4", padding: 32 }}>Loading...</div>}>
      <ComplaintDetailContent />
    </Suspense>
  );
}