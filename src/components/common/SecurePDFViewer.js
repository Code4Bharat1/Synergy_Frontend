"use client";

import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader } from "lucide-react";

// Set up the worker for React-PDF
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function SecurePDFViewer({ url, userName, userEmail }) {
  const [numPages, setNumPages] = useState(null);
  const [timestamp, setTimestamp] = useState("");
const [scale, setScale] = useState(1.2); // ← add this

  useEffect(() => {
    // Generate static timestamp once on mount
    setTimestamp(new Date().toLocaleString());
  }, []);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  // Generate repeating watermark content
  const watermarkText = `${userName || "Authorized User"} | ${userEmail || "No Email"} | ${timestamp}`;

  return (
  <div
    className="secure-pdf-container relative w-full bg-gray-200 flex flex-col"
    style={{ height: "80vh", userSelect: "none" }}
    onContextMenu={(e) => e.preventDefault()}
  >
    <style>{`
      @media print {
        .secure-pdf-container { display: none !important; }
      }
      .watermark-overlay {
        position: sticky; top: 0; left: 0;
        width: 100%; height: 0;
        overflow: visible; pointer-events: none; z-index: 50;
      }
      .watermark-grid {
        position: absolute; top: 0; left: 0;
        width: 100%; height: 80vh;
        display: flex; flex-wrap: wrap;
        justify-content: space-around; align-content: space-around;
        overflow: hidden; opacity: 0.15;
      }
      .watermark-text {
        transform: rotate(-45deg); font-size: 1.5rem;
        font-weight: bold; color: #000;
        white-space: nowrap; margin: 3rem;
      }
    `}</style>

    {/* ── Zoom Toolbar ── */}
    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 shrink-0 z-20">
      <button
        onClick={() => setScale((s) => Math.max(s - 0.2, 0.4))}
        disabled={scale <= 0.4}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-600 hover:bg-gray-500 text-white text-xl font-bold disabled:opacity-30 transition-colors"
      >−</button>
      <button
        onClick={() => setScale(1.2)}
        className="px-3 h-8 rounded-lg bg-gray-600 hover:bg-gray-500 text-white text-xs font-semibold min-w-[56px] transition-colors"
      >{Math.round(scale * 100)}%</button>
      <button
        onClick={() => setScale((s) => Math.min(s + 0.2, 3.0))}
        disabled={scale >= 3.0}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-600 hover:bg-gray-500 text-white text-xl font-bold disabled:opacity-30 transition-colors"
      >+</button>
    </div>

    {/* ── Scrollable area (both directions) ── */}
    <div className="flex-1 overflow-auto">
      <div className="flex flex-col items-center py-6 relative" style={{ minWidth: "max-content" }}>

        {/* Floating Watermark */}
        <div className="watermark-overlay">
          <div className="watermark-grid">
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className="watermark-text">{watermarkText}</div>
            ))}
          </div>
        </div>

        <div className="w-full flex flex-col items-center relative z-10">
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex flex-col items-center justify-center text-gray-500 py-20">
                <Loader className="animate-spin mb-3 text-[#0F2854]" size={40} />
                <p className="text-sm font-bold text-[#0F2854]">Loading Secure Document...</p>
              </div>
            }
            error={
              <div className="text-red-500 font-semibold py-20 bg-white px-10 rounded-xl shadow">
                Failed to load secure document.
              </div>
            }
          >
            {numPages &&
              Array.from(new Array(numPages), (el, index) => (
                <div key={`page_${index + 1}`} className="mb-6 shadow-2xl select-none border border-gray-100 bg-white">
                  <Page
                    pageNumber={index + 1}
                    scale={scale}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="pointer-events-none"
                  />
                </div>
              ))}
          </Document>
        </div>

      </div>
    </div>
  </div>
);
}
