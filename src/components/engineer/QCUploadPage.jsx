"use client";
import { useState, useEffect, useCallback } from "react";
import {
  CheckSquare,
  Send,
  FileCheck,
  Image,
  Trash2,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  PageHeader,
  Card,
  SectionHead,
  Label,
  inputStyle,
  SubmitBtn,
  UploadBox,
  FONTS,
  PROJECTS as MOCK_PROJECTS,
  ITEMS_BY_PROJECT,
} from "./shared";
import axiosInstance from "../../lib/axios";

// ── API helpers ────────────────────────────────────────────────────────────────
const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

const authCfg = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

const TRIAL_TYPES = [
  "Hydrostatic Test",
  "Leak Test",
  "Load Test",
  "Flow Rate Test",
  "Visual Inspection",
  "Dimensional Check",
];
const RESULTS = [
  "Pass",
  "Pass with Conditions",
  "Fail — Minor",
  "Fail — Major",
];

const resultColor = {
  Pass: { color: "#34C759", bg: "rgba(52,199,89,0.1)" },
  "Pass with Conditions": { color: "#FF9500", bg: "rgba(255,149,0,0.1)" },
  "Fail — Minor": { color: "#FF3B30", bg: "rgba(255,59,48,0.1)" },
  "Fail — Major": { color: "#9B1C1C", bg: "rgba(155,28,28,0.1)" },
};

const CSS = `
  .qc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  @media (max-width: 860px) { .qc-grid { grid-template-columns: 1fr; } }
  .qc-basic-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (max-width: 500px) { .qc-basic-row { grid-template-columns: 1fr; } }
  .qc-result-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .qc-img-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-top: 12px; }
  @media (max-width: 400px) { .qc-img-grid { grid-template-columns: repeat(2,1fr); } }
  .qc-report-row { display: flex; flex-direction: column; gap: 10px; }
`;

export default function QCUploadPage() {
  const [form, setForm] = useState({
    project: "",
    item: "",
    trialType: "",
    result: "",
    inspectionDate: "",
    notes: "",
    trialFiles: [],
    siteImages: [],
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [recentQC, setRecentQC] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [error, setError] = useState(null);

  const upd = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // ── Fetch projects + recent QC reports ───────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    try {
      const r = await axiosInstance.get("/projects", authCfg());
      setProjects(
        Array.isArray(r.data) ? r.data : r.data.projects || MOCK_PROJECTS,
      );
    } catch {
      setProjects(MOCK_PROJECTS); // fallback to mock
    }
  }, []);

  const fetchRecentQC = useCallback(async () => {
    try {
      setRecentLoading(true);
      const r = await axiosInstance.get("/reports/view-qc", authCfg());
      setRecentQC(Array.isArray(r.data) ? r.data.slice(0, 5) : []);
    } catch {
      setRecentQC([]);
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchRecentQC();
  }, [fetchProjects, fetchRecentQC]);

  // ── File handlers ─────────────────────────────────────────────────────────────
  const handleFiles = (key) => (e) => {
    const files = Array.from(e.target.files)?.map((f) => ({
      name: f.name,
      size: f.size,
      url: URL.createObjectURL(f),
      file: f,
    }));
    setForm((f) => ({ ...f, [key]: [...f[key], ...files] }));
  };
  const removeFile = (key, name) =>
    setForm((f) => ({ ...f, [key]: f[key].filter((x) => x.name !== name) }));

  // ── Submit QC report to backend ───────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.project) return setError("Please select a project.");
    if (!form.trialType) return setError("Please select a trial type.");
    if (!form.result) return setError("Please select a trial result.");
    if (!form.inspectionDate)
      return setError("Please select an inspection date.");

    setLoading(true);
    setError(null);
    try {
      const payload = {
        reportType: "QC",
        project: form.project,
        qcChecks: [
          {
            id: "trial-1",
            category: form.trialType,
            item: form.item || "General",
            critical: form.result.startsWith("Fail"),
            state:
              form.result === "Pass" || form.result === "Pass with Conditions",
          },
        ],
        trialData: {
          trialOutcome: form.result,
        },
        remarks: form.notes,
        date: form.inspectionDate,
        status: "Submitted",
      };

      await axiosInstance.post("/reports/add-qc", payload, authCfg());
      await fetchRecentQC();
      setSubmitted(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to submit QC report. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setForm({
      project: "",
      item: "",
      trialType: "",
      result: "",
      inspectionDate: "",
      notes: "",
      trialFiles: [],
      siteImages: [],
    });
  };

  // ── Success screen ────────────────────────────────────────────────────────────
  if (submitted)
    return (
      <>
        <style>{FONTS + CSS}</style>
        <div
          style={{ maxWidth: 480, margin: "80px auto", textAlign: "center" }}
        >
          <CheckCircle
            size={54}
            color="#34C759"
            strokeWidth={1.5}
            style={{ marginBottom: 12 }}
          />
          <h2
            style={{
              color: "#0F2854",
              fontSize: 22,
              fontWeight: 800,
              fontFamily: "'Syne',sans-serif",
              marginBottom: 8,
            }}
          >
            QC Report Submitted!
          </h2>
          <p style={{ color: "#4988C4", fontSize: 14, marginBottom: 22 }}>
            Trial results have been submitted for inspection review.
          </p>
          <div
            style={{
              background: "#fff",
              border: "1px solid rgba(73,136,196,0.15)",
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 22,
              textAlign: "left",
            }}
          >
            {[
              ["Trial Type", form.trialType],
              ["Result", form.result],
              ["Date", form.inspectionDate],
              [
                "Files",
                `${form.trialFiles.length} trial + ${form.siteImages.length} images`,
              ],
            ]?.map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px solid rgba(73,136,196,0.07)",
                }}
              >
                <span style={{ color: "#4988C4", fontSize: 12 }}>{k}</span>
                <span
                  style={{ color: "#0F2854", fontSize: 12, fontWeight: 700 }}
                >
                  {v}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={resetForm}
            style={{
              background: "#0F2854",
              color: "#BDE8F5",
              border: "none",
              padding: "10px 22px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            Upload Another
          </button>
        </div>
      </>
    );

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{FONTS + CSS}</style>
      <PageHeader
        eyebrow="Quality Control"
        title="Project Test Upload"
        subtitle="Upload trial results and site images for inspection"
      />

      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
            background: "rgba(255,59,48,0.06)",
            border: "1px solid rgba(255,59,48,0.2)",
            borderRadius: 10,
            padding: "10px 14px",
          }}
        >
          <AlertCircle size={14} color="#FF3B30" />
          <span style={{ color: "#FF3B30", fontSize: 13 }}>{error}</span>
        </div>
      )}

      <div className="qc-grid">
        {/* ── Left: Form ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Card style={{ padding: "24px" }}>
            <SectionHead
              icon={<FileCheck size={16} color="#BDE8F5" />}
              title="Trial Information"
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Project + Item */}
              <div className="qc-basic-row">
                <div>
                  <Label required>Project</Label>
                  <select
                    style={{ ...inputStyle, cursor: "pointer" }}
                    value={form.project}
                    onChange={(e) => {
                      upd("project", e.target.value);
                      upd("item", "");
                    }}
                  >
                    <option value="">Select project</option>
                    {projects?.map((p) => (
                      <option key={p._id || p.id} value={p._id || p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Item / Component</Label>
                  <select
                    style={{ ...inputStyle, cursor: "pointer" }}
                    value={form.item}
                    onChange={(e) => upd("item", e.target.value)}
                  >
                    <option value="">Select item (optional)</option>
                    {(ITEMS_BY_PROJECT[form.project] || [])?.map((it) => (
                      <option key={it}>{it}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Trial Type + Date */}
              <div className="qc-basic-row">
                <div>
                  <Label required>Trial Type</Label>
                  <select
                    style={{ ...inputStyle, cursor: "pointer" }}
                    value={form.trialType}
                    onChange={(e) => upd("trialType", e.target.value)}
                  >
                    <option value="">Select trial</option>
                    {TRIAL_TYPES?.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label required>Inspection Date</Label>
                  <input
                    type="date"
                    style={inputStyle}
                    value={form.inspectionDate}
                    onChange={(e) => upd("inspectionDate", e.target.value)}
                  />
                </div>
              </div>

              {/* Result */}
              <div>
                <Label required>Trial Result</Label>
                <div className="qc-result-grid">
                  {RESULTS?.map((r) => {
                    const c = resultColor[r] || {};
                    const active = form.result === r;
                    return (
                      <button
                        key={r}
                        onClick={() => upd("result", r)}
                        style={{
                          padding: "10px 8px",
                          borderRadius: 10,
                          border: `1px solid ${active ? c.color : "rgba(73,136,196,0.2)"}`,
                          background: active ? c.bg : "#F5F8FD",
                          color: active ? c.color : "#4988C4",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.15s",
                          fontFamily: "'DM Sans',sans-serif",
                        }}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>Inspector Notes</Label>
                <textarea
                  style={{ ...inputStyle, minHeight: 75, resize: "vertical" }}
                  placeholder="Any observations, remarks, or conditions…"
                  value={form.notes}
                  onChange={(e) => upd("notes", e.target.value)}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* ── Right: File uploads + Submit ──────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Trial result files */}
          <Card style={{ padding: "24px" }}>
            <SectionHead
              icon={<FileCheck size={16} color="#BDE8F5" />}
              title="Trial Result Files"
              subtitle="PDF reports, test sheets"
            />
            <UploadBox
              label="Upload Trial Results"
              accept=".pdf,.xlsx,.xls,.doc,.docx"
              icon="📄"
              caption="PDF, Excel, Word documents"
              onChange={handleFiles("trialFiles")}
            />
            {form.trialFiles.length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {form.trialFiles?.map((f) => (
                  <div
                    key={f.name}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: "rgba(52,199,89,0.06)",
                      border: "1px solid rgba(52,199,89,0.2)",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: "#0F2854",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {f.name}
                      </div>
                      <div style={{ color: "#4988C4", fontSize: 10 }}>
                        {(f.size / 1024).toFixed(0)} KB
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile("trialFiles", f.name)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#FF3B30",
                        padding: 2,
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Site images */}
          <Card style={{ padding: "24px" }}>
            <SectionHead
              icon={<Image size={16} color="#BDE8F5" />}
              title="Site Images"
              subtitle="Before / after photos, QC documentation"
            />
            <UploadBox
              label="Upload Site Images"
              accept="image/*"
              icon="📷"
              caption="JPG, PNG, HEIC photos"
              onChange={handleFiles("siteImages")}
            />
            {form.siteImages.length > 0 && (
              <div className="qc-img-grid">
                {form.siteImages?.map((f) => (
                  <div
                    key={f.name}
                    style={{
                      position: "relative",
                      borderRadius: 9,
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={f.url}
                      alt={f.name}
                      style={{ width: "100%", height: 72, objectFit: "cover" }}
                    />
                    <button
                      onClick={() => removeFile("siteImages", f.name)}
                      style={{
                        position: "absolute",
                        top: 3,
                        right: 3,
                        background: "rgba(0,0,0,0.65)",
                        border: "none",
                        borderRadius: "50%",
                        width: 18,
                        height: 18,
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Submit */}
          <Card
            style={{
              padding: "18px 22px",
              background:
                "linear-gradient(135deg,rgba(15,40,84,0.04),rgba(73,136,196,0.06))",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div>
                <div
                  style={{ color: "#0F2854", fontWeight: 700, fontSize: 14 }}
                >
                  Submit for Inspection
                </div>
                <div style={{ color: "#4988C4", fontSize: 12, marginTop: 2 }}>
                  {form.trialFiles.length} trial file(s) ·{" "}
                  {form.siteImages.length} site image(s)
                </div>
              </div>
              <SubmitBtn loading={loading} color="green" onClick={handleSubmit}>
                <Send size={13} /> Submit QC
              </SubmitBtn>
            </div>
          </Card>

          {/* Recent QC Reports */}
          <Card style={{ padding: "22px" }}>
            <SectionHead
              icon={<CheckSquare size={16} color="#BDE8F5" />}
              title="Recent QC Reports"
              subtitle="Latest submissions"
            />
            {recentLoading ? (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  color: "#4988C4",
                  fontSize: 13,
                }}
              >
                <Loader2
                  size={14}
                  style={{ animation: "spin 0.8s linear infinite" }}
                />{" "}
                Loading…
              </div>
            ) : recentQC.length === 0 ? (
              <p style={{ color: "#4988C4", fontSize: 13, margin: 0 }}>
                No QC reports yet.
              </p>
            ) : (
              <div className="qc-report-row">
                {recentQC?.map((r) => {
                  const outcome =
                    r.trialData?.trialOutcome || r.status || "Submitted";
                  const c = resultColor[outcome] || {
                    color: "#4988C4",
                    bg: "rgba(73,136,196,0.08)",
                  };
                  return (
                    <div
                      key={r._id}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: "rgba(73,136,196,0.04)",
                        border: "1px solid rgba(73,136,196,0.1)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 4,
                          flexWrap: "wrap",
                          gap: 4,
                        }}
                      >
                        <span
                          style={{
                            color: "#0F2854",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {r.project?.name || "Project"}
                        </span>
                        <span
                          style={{
                            background: c.bg,
                            color: c.color,
                            padding: "1px 10px",
                            borderRadius: 99,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          {outcome}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#4988C4", fontSize: 11 }}>
                          {r.qcChecks?.[0]?.category || "QC Check"}
                        </span>
                        <span style={{ color: "#4988C4", fontSize: 11 }}>
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
