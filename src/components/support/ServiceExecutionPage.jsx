"use client";
import { useState } from "react";
import { PageHeader, Card, inputStyle, labelStyle } from "./shared";
import PunchModal from "./Punchmodal";

export default function ServiceExecutionPage() {
  // ── punch state ─────────────────────────────────────────────────────────────
  const [showPunchModal, setShowPunchModal] = useState(false);
  const [punchType,      setPunchType]      = useState("in");
  const [punchInData,    setPunchInData]    = useState(null);
  const [punchOutData,   setPunchOutData]   = useState(null);

  // ── service form state ───────────────────────────────────────────────────────
  const [resolved,    setResolved]    = useState(false);
  const [workDesc,    setWorkDesc]    = useState("");
  const [material,    setMaterial]    = useState("");
  const [replacement, setReplacement] = useState("No replacement");

  const punchedIn  = !!punchInData;
  const punchedOut = !!punchOutData;

  const openPunchIn  = () => { setPunchType("in");  setShowPunchModal(true); };
  const openPunchOut = () => { setPunchType("out"); setShowPunchModal(true); };

  const handlePunchSubmit = (data) => {
    if (punchType === "in")  setPunchInData(data);
    else                     setPunchOutData(data);
    setShowPunchModal(false);
  };

  const formatTime = (d) =>
    d ? new Date(d.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";

  const resolutionDays = () => {
    if (!punchInData) return "—";
    const diff = Date.now() - new Date(punchInData.timestamp).getTime();
    return Math.max(1, Math.ceil(diff / 86400000)) + " day(s)";
  };

  const sectionTitle = (icon, text) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8, background: "#0F2854",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
      }}>{icon}</div>
      <span style={{ color: "#0F2854", fontWeight: 700, fontSize: 14 }}>{text}</span>
    </div>
  );

  const uploadBox = (label, icon, caption) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <label style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        border: "2px dashed rgba(73,136,196,0.35)", borderRadius: 10, padding: "22px 16px",
        color: "#4988C4", fontSize: 12, cursor: "pointer", gap: 6,
        background: "rgba(189,232,245,0.05)",
      }}>
        <span style={{ fontSize: 26 }}>{icon}</span>
        <span>{caption}</span>
        <input type="file" style={{ display: "none" }} />
      </label>
    </div>
  );

  return (
    <div>
      <PageHeader
        eyebrow="Field"
        title="Service Execution"
        subtitle="CMP-001 · Waterslide Alpha · AquaPark Dubai"
      />

      {/* ── Punch In / Out Card ─────────────────────────────────────────────── */}
      <Card style={{
        padding: "22px", marginBottom: 16,
        border: punchedIn
          ? (punchedOut ? "1px solid rgba(73,136,196,0.3)" : "1px solid rgba(52,199,89,0.35)")
          : "1px solid rgba(73,136,196,0.15)",
        background: punchedIn
          ? (punchedOut ? "rgba(189,232,245,0.06)" : "rgba(52,199,89,0.04)")
          : "#fff",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>

          {/* status + selfie previews */}
          <div style={{ flex: 1 }}>
            <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
              {!punchedIn    ? "📍 Punch In (Mandatory)"
               : !punchedOut ? "✅ Punched In · Work in Progress"
               :               "🏁 Punched Out · Session Ended"}
            </div>

            {punchedIn && (
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>

                {/* punch-in preview */}
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {punchInData.photo && (
                    <img src={punchInData.photo} alt="in-selfie"
                      style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover",
                               border: "2px solid rgba(52,199,89,0.5)" }} />
                  )}
                  <div>
                    <div style={{ color: "#34C759", fontSize: 10, fontWeight: 700, marginBottom: 2 }}>PUNCH IN</div>
                    <div style={{ color: "#0F2854", fontSize: 13, fontWeight: 700 }}>{formatTime(punchInData)}</div>
                    <div style={{ color: "#4988C4", fontSize: 10, marginTop: 2, maxWidth: 200,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      📍 {typeof punchInData.location === "string" ? punchInData.location : "Location captured"}
                    </div>
                  </div>
                </div>

                {/* punch-out preview */}
                {punchedOut && (
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {punchOutData.photo && (
                      <img src={punchOutData.photo} alt="out-selfie"
                        style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover",
                                 border: "2px solid rgba(73,136,196,0.5)" }} />
                    )}
                    <div>
                      <div style={{ color: "#4988C4", fontSize: 10, fontWeight: 700, marginBottom: 2 }}>PUNCH OUT</div>
                      <div style={{ color: "#0F2854", fontSize: 13, fontWeight: 700 }}>{formatTime(punchOutData)}</div>
                      <div style={{ color: "#4988C4", fontSize: 10, marginTop: 2, maxWidth: 200,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        📍 {typeof punchOutData.location === "string" ? punchOutData.location : "Location captured"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!punchedIn && (
              <div style={{ color: "#4988C4", fontSize: 12 }}>
                Selfie + geo-location will be captured. Allow camera &amp; location when prompted.
              </div>
            )}
          </div>

          {/* action buttons */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {!punchedIn && (
              <button onClick={openPunchIn} style={{
                background: "linear-gradient(135deg, #0F2854, #1C4D8D)", color: "#BDE8F5",
                border: "none", padding: "11px 20px", borderRadius: 10,
                fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
              }}>📍 Punch In Now</button>
            )}
            {punchedIn && !punchedOut && (
              <button onClick={openPunchOut} style={{
                background: "linear-gradient(135deg, #FF9500, #E07800)", color: "#fff",
                border: "none", padding: "11px 20px", borderRadius: 10,
                fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
              }}>🏁 Punch Out</button>
            )}
          </div>
        </div>
      </Card>

      {/* ── Service Work (gated) ────────────────────────────────────────────── */}
      <div style={{ opacity: punchedIn ? 1 : 0.38, pointerEvents: punchedIn ? "auto" : "none", transition: "opacity 0.3s",  }}>

        <Card style={{ padding: "24px", marginBottom: 16 }}>
          {sectionTitle("🛠", "Service Work Details")}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>WORK DESCRIPTION *</label>
              <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
                placeholder="Describe the work performed on site..."
                value={workDesc} onChange={e => setWorkDesc(e.target.value)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>MATERIAL USED</label>
                <input style={inputStyle} placeholder="e.g. Gel coat resin, 3 kg"
                  value={material} onChange={e => setMaterial(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>REPLACEMENT DONE</label>
                <select style={{ ...inputStyle, cursor: "pointer" }}
                  value={replacement} onChange={e => setReplacement(e.target.value)}>
                  <option>No replacement</option>
                  <option>Partial replacement</option>
                  <option>Full replacement</option>
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {uploadBox("BEFORE PHOTOS *", "📷", "Upload before-service photos")}
              {uploadBox("AFTER PHOTOS *",  "📸", "Upload after-service photos")}
            </div>
          </div>
        </Card>

        <Card style={{ padding: "24px", marginBottom: 16 }}>
          {sectionTitle("📁", "Document Uploads")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {uploadBox("SERVICE REPORT *",        "📄", "Upload signed service report (PDF)")}
            {uploadBox("CUSTOMER SIGNATURE COPY", "✍️", "Upload customer-signed copy")}
          </div>
        </Card>

        {/* ── Mark Resolved ────────────────────────────────────────────────── */}
        <Card style={{
          padding: "24px",
          border: resolved ? "1px solid rgba(52,199,89,0.4)" : "1px solid rgba(73,136,196,0.15)",
          background: resolved ? "rgba(52,199,89,0.05)" : "#fff",
        }}>
          {resolved ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 26 }}>✅</span>
                <span style={{ color: "#0F2854", fontWeight: 700, fontSize: 16 }}>Complaint Marked as Resolved</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                {[
                  ["Resolution Days", resolutionDays(), "#4988C4"],
                  ["Resolved By",     "Service Admin",  "#0F2854"],
                  ["Analytics",       "✓ Updated",      "#34C759"],
                ].map(([k, v, col]) => (
                  <div key={k} style={{ background: "rgba(189,232,245,0.1)", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ color: "#4988C4", fontSize: 10, fontWeight: 600, marginBottom: 4 }}>{k.toUpperCase()}</div>
                    <div style={{ color: col, fontSize: 15, fontWeight: 700 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Mark as Resolved</div>
                <div style={{ color: "#4988C4", fontSize: 12 }}>
                  System will auto-calculate resolution days and update all analytics.
                </div>
              </div>
              <button onClick={() => setResolved(true)} style={{
                background: "linear-gradient(135deg, #34C759, #2EA44F)", color: "#fff",
                border: "none", padding: "11px 24px", borderRadius: 10,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>✓ Resolve Complaint</button>
            </div>
          )}
        </Card>
      </div>

      {!punchedIn && (
        <div style={{
          marginTop: 12, padding: "10px 14px", borderRadius: 8,
          background: "rgba(255,149,0,0.08)", border: "1px solid rgba(255,149,0,0.25)",
          color: "#FF9500", fontSize: 12, fontWeight: 500,
        }}>
          ⚠ Please punch in first to unlock service work details.
        </div>
      )}

      {/* ── Modal ───────────────────────────────────────────────────────────── */}
      {showPunchModal && (
        <PunchModal
          type={punchType}
          onClose={() => setShowPunchModal(false)}
          onSubmit={handlePunchSubmit}
        />
      )}
    </div>
  );
}