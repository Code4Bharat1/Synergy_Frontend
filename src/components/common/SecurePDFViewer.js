"use client";

import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader } from "lucide-react";

// Set up the PDF.js worker via CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Helper: detect if a URL points to an image based on file extension
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];
export function isImageUrl(url) {
  if (!url) return false;
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

// ─── Shared Secure Styles ─────────────────────────────────────────────────────
const SECURE_STYLES = `
  @media print {
    .secure-file-container { display: none !important; }
  }
  .wm-grid {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    align-content: space-around;
    overflow: hidden;
    pointer-events: none;
    z-index: 50;
    opacity: 0.13;
  }
  .wm-text {
    transform: rotate(-45deg);
    font-size: 0.85rem;
    font-weight: 700;
    color: #000;
    white-space: nowrap;
    padding: 1.2rem;
    letter-spacing: 0.01em;
  }
`;

// ─── Watermark Overlay ────────────────────────────────────────────────────────
function WatermarkOverlay({ text }) {
  return (
    <div className="wm-grid" aria-hidden="true">
      {Array.from({ length: 50 }).map((_, i) => (
        <span key={i} className="wm-text">{text}</span>
      ))}
    </div>
  );
}

// ─── SecureFileViewer ─────────────────────────────────────────────────────────
/**
 * Universal secure file viewer for PDFs and images.
 *
 * Features:
 * - PDFs rendered page-by-page on <canvas> via react-pdf (no browser native PDF toolbar)
 * - Images rendered inside a protected container (no drag, no context menu)
 * - Repeating diagonal watermark stamped with user identity + timestamp + CONFIDENTIAL
 * - Right-click disabled, text selection disabled, print blocked via @media print
 *
 * Props:
 *   url        {string}  Full resolved URL of the file
 *   userName   {string}  Logged-in user's name (from localStorage)
 *   userEmail  {string}  Logged-in user's email (from localStorage)
 */
export default function SecureFileViewer({ url, userName, userEmail }) {
  const [numPages, setNumPages] = useState(null);
  const [timestamp, setTimestamp] = useState("");
  const isImage = isImageUrl(url);

  useEffect(() => {
    setTimestamp(new Date().toLocaleString("en-GB"));
  }, []);

  const watermarkText = `${userName || "Authorized User"} | ${userEmail || ""} | ${timestamp} | CONFIDENTIAL`;

  return (
    <div
      className="secure-file-container relative w-full flex flex-col items-center overflow-auto bg-gray-200"
      style={{ maxHeight: "80vh", userSelect: "none" }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <style>{SECURE_STYLES}</style>

      {/* ── Image Mode ── */}
      {isImage ? (
        <div
          className="relative w-full flex items-center justify-center p-6"
          style={{ minHeight: "40vh" }}
        >
          <WatermarkOverlay text={watermarkText} />
          <img
            src={url}
            alt="Secure Preview"
            className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-2xl relative z-10"
            draggable={false}
          />
        </div>
      ) : (
        /* ── PDF Mode ── */
        <div className="relative w-full">
          {/* Sticky floating watermark that stays visible as user scrolls through PDF pages */}
          <div
            className="sticky top-0 left-0 w-full"
            style={{ height: "80vh", overflow: "visible", pointerEvents: "none", zIndex: 50, position: "sticky" }}
          >
            <WatermarkOverlay text={watermarkText} />
          </div>
          <div
            className="flex flex-col items-center gap-4 px-4"
            style={{ marginTop: "-80vh" }} // Overlay on top of pages
          >
            <Document
              file={url}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              loading={
                <div className="flex flex-col items-center justify-center text-gray-500 py-20">
                  <Loader className="animate-spin mb-3 text-[#0F2854]" size={40} />
                  <p className="text-sm font-bold text-[#0F2854]">Loading Secure Document…</p>
                </div>
              }
              error={
                <div className="text-red-500 font-semibold py-20 bg-white px-10 rounded-xl shadow">
                  Failed to load the secure document. Please try again.
                </div>
              }
            >
              {numPages &&
                Array.from(new Array(numPages), (_, i) => (
                  <div
                    key={`page_${i + 1}`}
                    className="mb-4 shadow-2xl border border-gray-100 bg-white select-none"
                    style={{ pointerEvents: "none" }}
                  >
                    <Page
                      pageNumber={i + 1}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </div>
                ))}
            </Document>
          </div>
        </div>
      )}
    </div>
  );
}
