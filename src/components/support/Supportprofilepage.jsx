"use client";
import { useState } from "react";
import {
  User, Mail, Phone, MapPin, Shield, Bell, Lock,
  Camera, Edit3, Check, X, Award, Clock, CheckCircle,
  AlertTriangle, Wrench, ChevronRight, LogOut, Eye, EyeOff,
} from "lucide-react";

// ─── Mock profile data ────────────────────────────────────────────────────────
const INITIAL_PROFILE = {
  name:       "Saud Al-Rashidi",
  role:       "Service Admin",
  email:      "saud.alrashidi@aquaservice.com",
  phone:      "+971 50 234 5678",
  location:   "Dubai, UAE",
  employeeId: "EMP-0042",
  department: "Field Service Team",
  joinDate:   "March 2022",
  avatar:     null,
};

const STATS = [
  { label: "Complaints Handled", value: 142, icon: Wrench,       color: "#4988C4" },
  { label: "Resolved",           value: 128, icon: CheckCircle,  color: "#34C759" },
  { label: "Avg Resolution",     value: "5.2d", icon: Clock,     color: "#FF9500" },
  { label: "Critical Closed",    value: 18,  icon: AlertTriangle,color: "#FF3B30" },
];

const RECENT_ACTIVITY = [
  { id: "CMP-008", action: "Resolved",     item: "Master Blaster",    date: "Today, 09:41 AM",    color: "#34C759" },
  { id: "CMP-006", action: "Punched In",   item: "Body Slide 360",    date: "Today, 08:15 AM",    color: "#4988C4" },
  { id: "CMP-005", action: "Under Review", item: "Funnel Ride X2",    date: "Yesterday, 03:22 PM",color: "#FF9500" },
  { id: "CMP-001", action: "Site Visit",   item: "Waterslide Alpha",  date: "Feb 23, 11:00 AM",   color: "#1C4D8D" },
  { id: "CMP-003", action: "Resolved",     item: "Lazy River Flume",  date: "Feb 22, 04:10 PM",   color: "#34C759" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function Avatar({ name, size = 80, editable = false, onEdit }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: "linear-gradient(135deg, #1C4D8D 0%, #4988C4 60%, #BDE8F5 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.32, fontWeight: 800, color: "#fff",
        border: "3px solid rgba(189,232,245,0.4)",
        boxShadow: "0 8px 24px rgba(15,40,84,0.25)",
        letterSpacing: -1,
      }}>{initials}</div>
      {editable && (
        <button onClick={onEdit} style={{
          position: "absolute", bottom: 0, right: 0,
          width: 26, height: 26, borderRadius: "50%",
          background: "#0F2854", border: "2px solid #fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", padding: 0,
        }}>
          <Camera size={12} color="#BDE8F5" />
        </button>
      )}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16,
      border: "1px solid rgba(73,136,196,0.15)",
      boxShadow: "0 2px 12px rgba(15,40,84,0.06)",
      ...style,
    }}>{children}</div>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, background: "#0F2854",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={15} color="#BDE8F5" />
      </div>
      <span style={{ color: "#0F2854", fontWeight: 700, fontSize: 14 }}>{title}</span>
    </div>
  );
}

function FieldRow({ label, value, editable, editMode, onChange }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "11px 0", borderBottom: "1px solid rgba(73,136,196,0.08)",
    }}>
      <span style={{ color: "#4988C4", fontSize: 12, minWidth: 130 }}>{label}</span>
      {editable && editMode ? (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            background: "rgba(189,232,245,0.1)", border: "1px solid rgba(73,136,196,0.35)",
            borderRadius: 7, padding: "5px 10px", fontSize: 13, color: "#0F2854",
            outline: "none", fontFamily: "inherit", textAlign: "right", width: 220,
          }}
        />
      ) : (
        <span style={{ color: "#0F2854", fontSize: 13, fontWeight: 600 }}>{value}</span>
      )}
    </div>
  );
}

function Toggle({ label, sub, checked, onChange }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "13px 0", borderBottom: "1px solid rgba(73,136,196,0.08)",
    }}>
      <div>
        <div style={{ color: "#0F2854", fontSize: 13, fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ color: "#4988C4", fontSize: 11, marginTop: 2 }}>{sub}</div>}
      </div>
      <button onClick={() => onChange(!checked)} style={{
        width: 44, height: 24, borderRadius: 99, border: "none", cursor: "pointer",
        background: checked ? "#0F2854" : "rgba(73,136,196,0.2)",
        position: "relative", transition: "background 0.25s", flexShrink: 0,
        padding: 0,
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: "50%", background: "#fff",
          position: "absolute", top: 3,
          left: checked ? 23 : 3,
          transition: "left 0.25s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }} />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SupportProfilePage() {
  const [profile,  setProfile]  = useState(INITIAL_PROFILE);
  const [editMode, setEditMode] = useState(false);
  const [draft,    setDraft]    = useState(INITIAL_PROFILE);
  const [saved,    setSaved]    = useState(false);
  const [tab,      setTab]      = useState("profile"); // profile | security | notifications
  const [showPw,   setShowPw]   = useState({ current: false, new: false, confirm: false });
  const [notifs,   setNotifs]   = useState({
    newComplaint:   true,
    statusUpdate:   true,
    materialReady:  false,
    criticalAlert:  true,
    weeklyReport:   false,
    emailDigest:    true,
  });
  const [pwForm, setPwForm] = useState({ current: "", new: "", confirm: "" });

  const upd = (key, val) => setDraft(d => ({ ...d, [key]: val }));

  const handleSave = () => {
    setProfile(draft);
    setSaved(true);
    setEditMode(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCancel = () => {
    setDraft(profile);
    setEditMode(false);
  };

  const TABS = [
    { id: "profile",       label: "Profile",       icon: User   },
    { id: "security",      label: "Security",      icon: Lock   },
    { id: "notifications", label: "Notifications", icon: Bell   },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", maxWidth: 900 }}>

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: "#4988C4", fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
          Account
        </div>
        <h1 style={{ color: "#0F2854", fontSize: 26, fontWeight: 800, margin: 0 }}>My Profile</h1>
        <p style={{ color: "#4988C4", fontSize: 13, margin: "4px 0 0" }}>
          Manage your personal info, security, and preferences
        </p>
      </div>

      {/* ── Hero Card ─────────────────────────────────────────────────────── */}
      <Card style={{ marginBottom: 20, overflow: "hidden" }}>
        {/* banner */}
        <div style={{
          height: 90,
          background: "linear-gradient(135deg, #0F2854 0%, #1C4D8D 50%, #4988C4 100%)",
          position: "relative",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "radial-gradient(circle at 20% 50%, rgba(189,232,245,0.12) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(189,232,245,0.08) 0%, transparent 50%)",
          }} />
        </div>

        <div style={{ padding: "0 24px 22px", position: "relative" }}>
          {/* avatar — overlaps banner */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ marginTop: -36 }}>
              <Avatar name={profile.name} size={80} editable />
            </div>
            <div style={{ display: "flex", gap: 8, paddingBottom: 4 }}>
              {!editMode ? (
                <button onClick={() => { setDraft(profile); setEditMode(true); }} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "#0F2854", color: "#BDE8F5",
                  border: "none", padding: "8px 16px", borderRadius: 9,
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>
                  <Edit3 size={13} /> Edit Profile
                </button>
              ) : (
                <>
                  <button onClick={handleCancel} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "transparent", color: "#4988C4",
                    border: "1px solid rgba(73,136,196,0.3)", padding: "8px 14px", borderRadius: 9,
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}>
                    <X size={13} /> Cancel
                  </button>
                  <button onClick={handleSave} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "#34C759", color: "#fff",
                    border: "none", padding: "8px 16px", borderRadius: 9,
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}>
                    <Check size={13} /> Save Changes
                  </button>
                </>
              )}
            </div>
          </div>

          {/* name + role */}
          <div style={{ marginTop: 10 }}>
            <div style={{ color: "#0F2854", fontSize: 20, fontWeight: 800 }}>
              {editMode
                ? <input value={draft.name} onChange={e => upd("name", e.target.value)}
                    style={{ background: "rgba(189,232,245,0.1)", border: "1px solid rgba(73,136,196,0.3)", borderRadius: 7, padding: "4px 10px", fontSize: 20, fontWeight: 800, color: "#0F2854", outline: "none", fontFamily: "inherit" }} />
                : profile.name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
              <span style={{
                background: "rgba(15,40,84,0.08)", color: "#1C4D8D",
                padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
              }}>{profile.role}</span>
              <span style={{ color: "#4988C4", fontSize: 12 }}>· {profile.department}</span>
              <span style={{ color: "#4988C4", fontSize: 12 }}>· ID: {profile.employeeId}</span>
            </div>
          </div>
        </div>

        {/* saved toast */}
        {saved && (
          <div style={{
            position: "absolute", bottom: 16, right: 20,
            background: "#34C759", color: "#fff",
            padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700,
            display: "flex", alignItems: "center", gap: 6,
            boxShadow: "0 4px 16px rgba(52,199,89,0.35)",
          }}>
            <Check size={14} /> Profile saved!
          </div>
        )}
      </Card>

      {/* ── Stats Row ─────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {STATS.map((s, i) => (
          <Card key={i} style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ color: "#4988C4", fontSize: 10, fontWeight: 600, letterSpacing: 0.5 }}>
                {s.label.toUpperCase()}
              </span>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: `${s.color}15`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <s.icon size={14} color={s.color} />
              </div>
            </div>
            <div style={{ color: s.color, fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* ── Tab Bar + Content ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer",
              background: active ? "#0F2854" : "rgba(73,136,196,0.08)",
              color: active ? "#BDE8F5" : "#4988C4",
              fontSize: 13, fontWeight: active ? 700 : 500,
              transition: "all 0.2s",
            }}>
              <t.icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab: Profile ─────────────────────────────────────────────────── */}
      {tab === "profile" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* Personal Info */}
          <Card style={{ padding: "22px" }}>
            <SectionTitle icon={User} title="Personal Information" />
            <FieldRow label="Full Name"    value={editMode ? draft.name     : profile.name}     editable editMode={editMode} onChange={v => upd("name", v)} />
            <FieldRow label="Email"        value={editMode ? draft.email    : profile.email}    editable editMode={editMode} onChange={v => upd("email", v)} />
            <FieldRow label="Phone"        value={editMode ? draft.phone    : profile.phone}    editable editMode={editMode} onChange={v => upd("phone", v)} />
            <FieldRow label="Location"     value={editMode ? draft.location : profile.location} editable editMode={editMode} onChange={v => upd("location", v)} />
          </Card>

          {/* Work Info */}
          <Card style={{ padding: "22px" }}>
            <SectionTitle icon={Shield} title="Work Information" />
            <FieldRow label="Employee ID"  value={profile.employeeId} />
            <FieldRow label="Department"   value={profile.department} />
            <FieldRow label="Role"         value={profile.role} />
            <FieldRow label="Joined"       value={profile.joinDate} />

            {/* badge */}
            <div style={{
              marginTop: 18, background: "linear-gradient(135deg, rgba(15,40,84,0.05), rgba(73,136,196,0.08))",
              borderRadius: 12, padding: "14px 16px",
              border: "1px solid rgba(73,136,196,0.15)",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "linear-gradient(135deg, #0F2854, #4988C4)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Award size={18} color="#BDE8F5" />
              </div>
              <div>
                <div style={{ color: "#0F2854", fontSize: 13, fontWeight: 700 }}>Senior Field Agent</div>
                <div style={{ color: "#4988C4", fontSize: 11, marginTop: 2 }}>Top 10% resolution rate · 3 years tenure</div>
              </div>
            </div>
          </Card>

          {/* Recent Activity — full width */}
          <Card style={{ padding: "22px", gridColumn: "1 / -1" }}>
            <SectionTitle icon={Clock} title="Recent Activity" />
            <div>
              {RECENT_ACTIVITY.map((a, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "11px 0",
                  borderBottom: i < RECENT_ACTIVITY.length - 1 ? "1px solid rgba(73,136,196,0.08)" : "none",
                }}>
                  {/* dot */}
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: a.color, flexShrink: 0,
                    boxShadow: `0 0 6px ${a.color}60`,
                  }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ color: "#0F2854", fontSize: 13, fontWeight: 600 }}>{a.action}</span>
                    <span style={{ color: "#4988C4", fontSize: 13 }}> on </span>
                    <span style={{ color: "#1C4D8D", fontSize: 13, fontWeight: 600 }}>{a.item}</span>
                  </div>
                  <span style={{
                    background: `${a.color}12`, color: a.color,
                    padding: "2px 9px", borderRadius: 99, fontSize: 10, fontWeight: 600,
                  }}>{a.id}</span>
                  <span style={{ color: "#4988C4", fontSize: 11, minWidth: 130, textAlign: "right" }}>{a.date}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── Tab: Security ────────────────────────────────────────────────── */}
      {tab === "security" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* Change Password */}
          <Card style={{ padding: "22px" }}>
            <SectionTitle icon={Lock} title="Change Password" />
            {[
              { key: "current", label: "Current Password" },
              { key: "new",     label: "New Password"     },
              { key: "confirm", label: "Confirm Password" },
            ].map(({ key, label }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", color: "#1C4D8D", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: 0.5 }}>
                  {label.toUpperCase()}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw[key] ? "text" : "password"}
                    value={pwForm[key]}
                    onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder="••••••••"
                    style={{
                      width: "100%", background: "#fff",
                      border: "1px solid rgba(73,136,196,0.3)", borderRadius: 8,
                      padding: "10px 38px 10px 13px", fontSize: 13, color: "#0F2854",
                      outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                    }}
                  />
                  <button onClick={() => setShowPw(s => ({ ...s, [key]: !s[key] }))} style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "#4988C4", padding: 0,
                  }}>
                    {showPw[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            ))}
            <button style={{
              width: "100%", background: "linear-gradient(135deg, #0F2854, #1C4D8D)",
              color: "#BDE8F5", border: "none", padding: "11px", borderRadius: 10,
              fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 4,
            }}>Update Password</button>
          </Card>

          {/* Security settings */}
          <Card style={{ padding: "22px" }}>
            <SectionTitle icon={Shield} title="Security Settings" />
            <Toggle
              label="Two-Factor Authentication"
              sub="SMS code required on every login"
              checked={true}
              onChange={() => {}}
            />
            <Toggle
              label="Login Alerts"
              sub="Email me when a new device logs in"
              checked={true}
              onChange={() => {}}
            />
            <Toggle
              label="Session Timeout (30 min)"
              sub="Auto-logout after inactivity"
              checked={false}
              onChange={() => {}}
            />

            {/* active sessions */}
            <div style={{ marginTop: 20 }}>
              <div style={{ color: "#0F2854", fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Active Sessions</div>
              {[
                { device: "Chrome · Windows 11",  location: "Dubai, UAE",     current: true  },
                { device: "Safari · iPhone 15",   location: "Dubai, UAE",     current: false },
              ].map((s, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 12px", borderRadius: 10, marginBottom: 8,
                  background: s.current ? "rgba(189,232,245,0.15)" : "rgba(73,136,196,0.04)",
                  border: `1px solid ${s.current ? "rgba(73,136,196,0.25)" : "rgba(73,136,196,0.1)"}`,
                }}>
                  <div>
                    <div style={{ color: "#0F2854", fontSize: 12, fontWeight: 600 }}>{s.device}</div>
                    <div style={{ color: "#4988C4", fontSize: 11 }}>{s.location}</div>
                  </div>
                  {s.current
                    ? <span style={{ background: "rgba(52,199,89,0.12)", color: "#34C759", padding: "2px 9px", borderRadius: 99, fontSize: 10, fontWeight: 700, border: "1px solid rgba(52,199,89,0.3)" }}>Current</span>
                    : <button style={{ background: "rgba(255,59,48,0.1)", color: "#FF3B30", border: "1px solid rgba(255,59,48,0.2)", padding: "3px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Revoke</button>
                  }
                </div>
              ))}
            </div>
          </Card>

          {/* Danger zone */}
          <Card style={{ padding: "22px", gridColumn: "1 / -1", border: "1px solid rgba(255,59,48,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: "#FF3B30", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>⚠ Danger Zone</div>
                <div style={{ color: "#4988C4", fontSize: 13 }}>
                  Signing out will end your current session and require re-authentication.
                </div>
              </div>
              <button style={{
                display: "flex", alignItems: "center", gap: 7,
                background: "rgba(255,59,48,0.08)", color: "#FF3B30",
                border: "1px solid rgba(255,59,48,0.25)", padding: "10px 18px", borderRadius: 10,
                fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
              }}>
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Tab: Notifications ───────────────────────────────────────────── */}
      {tab === "notifications" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          <Card style={{ padding: "22px" }}>
            <SectionTitle icon={Bell} title="In-App Notifications" />
            <Toggle label="New Complaint Assigned"    sub="When a complaint is assigned to you"         checked={notifs.newComplaint}  onChange={v => setNotifs(n => ({ ...n, newComplaint: v  }))} />
            <Toggle label="Status Updates"            sub="When complaint status changes"               checked={notifs.statusUpdate}  onChange={v => setNotifs(n => ({ ...n, statusUpdate: v  }))} />
            <Toggle label="Material Ready Alert"      sub="When requested material is dispatched"       checked={notifs.materialReady} onChange={v => setNotifs(n => ({ ...n, materialReady: v }))} />
            <Toggle label="Critical Complaint Alert"  sub="Immediate alert for critical severity"       checked={notifs.criticalAlert} onChange={v => setNotifs(n => ({ ...n, criticalAlert: v }))} />
          </Card>

          <Card style={{ padding: "22px" }}>
            <SectionTitle icon={Mail} title="Email Preferences" />
            <Toggle label="Weekly Summary Report"     sub="Every Monday — complaints overview"          checked={notifs.weeklyReport}  onChange={v => setNotifs(n => ({ ...n, weeklyReport: v  }))} />
            <Toggle label="Daily Email Digest"        sub="Morning summary of open complaints"          checked={notifs.emailDigest}   onChange={v => setNotifs(n => ({ ...n, emailDigest: v   }))} />

            <div style={{ marginTop: 20 }}>
              <div style={{ color: "#1C4D8D", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: 0.5 }}>
                NOTIFICATION EMAIL
              </div>
              <input
                defaultValue={profile.email}
                style={{
                  width: "100%", background: "#fff",
                  border: "1px solid rgba(73,136,196,0.3)", borderRadius: 8,
                  padding: "10px 13px", fontSize: 13, color: "#0F2854",
                  outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
              <button style={{
                marginTop: 12, width: "100%",
                background: "linear-gradient(135deg, #0F2854, #1C4D8D)",
                color: "#BDE8F5", border: "none", padding: "10px", borderRadius: 10,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>Save Preferences</button>
            </div>
          </Card>

          {/* notification preview */}
          <Card style={{ padding: "22px", gridColumn: "1 / -1" }}>
            <SectionTitle icon={Bell} title="Notification Preview" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { title: "New Complaint Assigned",  body: "CMP-009 · Speed Slide Classic · SunSplash Inc.",    time: "Just now",    color: "#4988C4", active: notifs.newComplaint  },
                { title: "Critical Alert",          body: "CMP-005 · Funnel Ride X2 · Ocean World",            time: "5 min ago",   color: "#FF3B30", active: notifs.criticalAlert },
                { title: "Material Dispatched",     body: "Gel Coat Resin · 5kg for CMP-001",                  time: "1 hour ago",  color: "#FF9500", active: notifs.materialReady },
              ].map((n, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "12px 14px", borderRadius: 10,
                  background: n.active ? `${n.color}08` : "rgba(0,0,0,0.02)",
                  border: `1px solid ${n.active ? `${n.color}20` : "rgba(73,136,196,0.08)"}`,
                  opacity: n.active ? 1 : 0.4,
                  transition: "all 0.3s",
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: n.active ? n.color : "#ccc", flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#0F2854", fontSize: 13, fontWeight: 700 }}>{n.title}</div>
                    <div style={{ color: "#4988C4", fontSize: 12 }}>{n.body}</div>
                  </div>
                  <span style={{ color: "#4988C4", fontSize: 11 }}>{n.time}</span>
                  <ChevronRight size={14} color="#4988C4" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}