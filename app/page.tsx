"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MainDashboard() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  // Figyeljük a képernyőméretet a reszponzivitáshoz
  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 768);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const handleBackup = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Biztonsági mentés indítása?")) return;
    try {
      const response = await fetch(`/api/admin/backup?t=${Date.now()}`, { method: "POST" });
      if (response.ok) alert("A mentés sikeresen elindult!");
      else alert("Hiba történt a mentés során.");
    } catch (error) {
      alert("Hálózati hiba történt.");
    }
  };

  const onEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "scale(0.97)";
    e.currentTarget.style.opacity = "0.9";
  };

  const onLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "scale(1)";
    e.currentTarget.style.opacity = "1";
  };

  // Dinamikus Grid stílus
  const dynamicGridStyle: React.CSSProperties = {
    display: "grid",
    // Mobilon 2 oszlop, asztalin 4
    gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
    gridAutoRows: isMobile ? "120px" : "140px",
    gap: "10px",
    maxWidth: "1000px",
    margin: "0 auto",
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={{ ...titleStyle, fontSize: isMobile ? "24px" : "32px" }}>NS-AIR KÖZPONT</h1>
        <div style={statusDot}>Online</div>
      </header>

      <div style={dynamicGridStyle}>
        {/* STATISZTIKA */}
        <div onClick={() => router.push("/stats")} onMouseEnter={onEnter} onMouseLeave={onLeave} style={{ ...tileStyle, background: "#f39c12" }}>
          <span style={iconStyle}>📊</span>
          <div style={tileLabelStyle}>Statisztika</div>
          <span style={smallLabelStyle}>Jelentések</span>
        </div>

        {/* NAPTÁR */}
        <div onClick={() => router.push("/admin/calendar")} onMouseEnter={onEnter} onMouseLeave={onLeave} style={{ ...tileStyle, background: "#008272" }}>
          <span style={iconStyle}>📅</span>
          <div style={tileLabelStyle}>Naptár</div>
        </div>

        {/* ÁRAJÁNLATOK */}
        <div onClick={() => router.push("/quotes")} onMouseEnter={onEnter} onMouseLeave={onLeave} style={{ ...tileStyle, background: "#00bcf2" }}>
          <span style={iconStyle}>📄</span>
          <div style={tileLabelStyle}>Ajánlatok</div>
        </div>

        {/* RAKTÁR */}
        <div onClick={() => router.push("/admin/items")} onMouseEnter={onEnter} onMouseLeave={onLeave} style={{ ...tileStyle, background: "#0078d7" }}>
          <span style={iconStyle}>📦</span>
          <div style={tileLabelStyle}>Raktár</div>
        </div>

        {/* ÜTEMTERV */}
        <div onClick={() => router.push("/maintenance")} onMouseEnter={onEnter} onMouseLeave={onLeave} style={{ ...tileStyle, background: "#a4379f" }}>
          <span style={iconStyle}>🗓️</span>
          <div style={tileLabelStyle}>Ütemterv</div>
        </div>

        {/* ÜGYFELEK */}
        <div onClick={() => router.push("/clients")} onMouseEnter={onEnter} onMouseLeave={onLeave} style={{ ...tileStyle, background: "#d83b01" }}>
          <span style={iconStyle}>👥</span>
          <div style={tileLabelStyle}>Ügyfelek</div>
        </div>

        {/* BIZTONSÁGI MENTÉS */}
        <div onClick={handleBackup} onMouseEnter={onEnter} onMouseLeave={onLeave} style={{ ...tileStyle, background: "#2ecc71" }}>
          <span style={iconStyle}>🛡️</span>
          <div style={tileLabelStyle}>Mentés</div>
        </div>
      </div>

      <footer style={footerContainer}>
        <div style={footerLine} />
        <p style={footerText}>NS-Air Klíma Rendszer v2.0 | 2026</p>
      </footer>
    </div>
  );
}

// ALAP STÍLUSOK
const containerStyle: React.CSSProperties = { minHeight: "100vh", backgroundColor: "#000", color: "#fff", fontFamily: "'Segoe UI', sans-serif", padding: "20px" };
const headerStyle: React.CSSProperties = { maxWidth: "1000px", margin: "0 auto 30px auto", display: "flex", justifyContent: "space-between", alignItems: "center" };
const titleStyle: React.CSSProperties = { fontWeight: "lighter", margin: 0 };
const statusDot: React.CSSProperties = { fontSize: "10px", color: "#2ecc71", textTransform: "uppercase", letterSpacing: "1px", border: "1px solid #2ecc71", padding: "2px 6px", borderRadius: "4px" };
const tileStyle: React.CSSProperties = { padding: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between", cursor: "pointer", transition: "all 0.2s ease" };
const iconStyle: React.CSSProperties = { fontSize: "24px" };
const tileLabelStyle: React.CSSProperties = { fontSize: "15px", fontWeight: "600" };
const smallLabelStyle: React.CSSProperties = { fontSize: "10px", opacity: 0.7 };
const footerContainer: React.CSSProperties = { textAlign: "center", width: "100%", maxWidth: "1000px", margin: "60px auto 0 auto" };
const footerLine: React.CSSProperties = { height: "1px", background: "linear-gradient(90deg, transparent, #333, transparent)", marginBottom: "15px" };
const footerText: React.CSSProperties = { fontSize: "10px", color: "#2ecc71", fontWeight: "bold", letterSpacing: "1px", textTransform: "uppercase", margin: 0 };
