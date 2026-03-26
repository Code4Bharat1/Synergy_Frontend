"use client";

import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader } from "lucide-react";

// Set up the worker for React-PDF
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function SecurePDFViewer({ url, userName, userEmail }) {
  const [numPages, setNumPages] = useState(null);
  const [timestamp, setTimestamp] = useState("");

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
      className="secure-pdf-container relative w-full bg-gray-200 flex flex-col items-center overflow-auto"
      style={{ maxHeight: "80vh", userSelect: "none" }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <style>{`
        @media print {
          .secure-pdf-container {
            display: none !important;
          }
        }
        .watermark-overlay {
          position: sticky;
          top: 0;
          left: 0;
          width: 100%;
          height: 0; /* Let it overflow without expanding container */
          overflow: visible;
          pointer-events: none;
          z-index: 50;
        }
        .watermark-grid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 80vh; /* Match the max height of the container */
          display: flex;
          flex-wrap: wrap;
          justify-content: space-around;
          align-content: space-around;
          overflow: hidden;
          opacity: 0.15;
        }
        .watermark-text {
          transform: rotate(-45deg);
          font-size: 1.5rem;
          font-weight: bold;
          color: #000;
          white-space: nowrap;
          margin: 3rem;
        }
      `}</style>

      {/* Floating Watermark */}
      <div className="watermark-overlay">
        <div className="watermark-grid">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="watermark-text">
              {watermarkText}
            </div>
          ))}
        </div>
      </div>

      <div className="py-6 w-full flex flex-col items-center relative z-10">
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
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="pointer-events-none"
                />
              </div>
            ))}
        </Document>
      </div>
    </div>
  );
}
