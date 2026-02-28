"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Page = () => {
  const router = useRouter();
  const [dots, setDots] = useState(".");

  useEffect(() => {
    // Animated dots
    const dotInterval = setInterval(() => {
      setDots(d => d.length >= 3 ? "." : d + ".");
    }, 400);

    // Redirect after brief delay so loader is visible
    const redirect = setTimeout(() => {
      router.replace("/login");
    }, 1200);

    return () => {
      clearInterval(dotInterval);
      clearTimeout(redirect);
    };
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#EEF4FB",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Syne:wght@700;800&display=swap');
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        animation: "fadeIn 0.4s ease both",
      }}>
        {/* Logo mark */}
        <div style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: "linear-gradient(135deg, #4988C4, #0F2854)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: 22,
          color: "#BDE8F5",
          boxShadow: "0 8px 24px rgba(15,40,84,0.2)",
        }}>S</div>

        {/* Spinner */}
        <div style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "3px solid rgba(73,136,196,0.15)",
          borderTop: "3px solid #4988C4",
          animation: "spin 0.8s linear infinite",
        }} />

        {/* Text */}
        <div style={{ textAlign: "center" }}>
          <p style={{
            color: "#0F2854",
            fontSize: 14,
            fontWeight: 600,
            margin: 0,
            letterSpacing: 0.2,
          }}>
            Redirecting{dots}
          </p>
          <p style={{
            color: "#4988C4",
            fontSize: 12,
            margin: "4px 0 0",
          }}>
            Taking you to login
          </p>
        </div>
      </div>
    </div>
  );
};

export default Page;