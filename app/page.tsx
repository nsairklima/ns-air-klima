"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MainDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);

  // Statisztikák betöltése
  useEffect(() => {
    fetch("/api/stats")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Hiba:", err));
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

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>NS-AIR KÖZPONT</h1>
        <div style={statusDot}>Online</div>
      </header>

      {/* STATISZTIKA SZEKCIÓ */}
      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, color: "#27ae60", fontSize: "16px", letterSpacing: "1px" }}>📊 HAVI STATISZTIKA</h2>
        {stats ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px" }}>
            <div style={statBox}>
              <span style={statLabel}>FORGALOM</span>
              <span style={statValue}>{stats.monthlyGross?.toLocaleString()} Ft</span>
            </div>
            <div style={statBox}>
              <span style={statLabel}>HASZON</span>
              <span style={{...statValue, color: "#2ecc71"}}>{stats.monthlyProfit?.toLocaleString()} Ft</span>
            </div>
            <div style={statBox}>
              <span style={statLabel}>ÁRRÉS</span>
              <span style={statValue}>{stats.avgMargin}%</span>
            </div>
            <div style={statBox}>
              <span style={statLabel}>SÜRGŐS</span>
              <span style={{...statValue, color: "#e74c3c"}}>{stats.urgentCount} gép</span>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: "12px", opacity: 0.5 }}>Adatok betöltése...</p>
        )}
      </div>

      <div style={gridStyle}>
        {/* RENDSZERJELENTÉS */}
        <div 
          onClick={handleBackup}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          style={{ ...tileStyle, background: "#2ecc71", gridColumn: "span 2" }}
        >
          <span style={iconStyle}>🛡️</span>
          <div style={tileLabelStyle}>Rendszerjelentés</div>
          <span style={smallLabelStyle}>Adatbázis export emailben</span>
        </div>

        {/* NAPTÁR */}
        <div 
          onClick={() => router.push("/admin/calendar")}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          style={{ ...tileStyle, background: "#008272" }}
        >
          <span style={iconStyle}>📅</span>
          <div style={tileLabelStyle}>Naptár</div>
        </div>

        {/* ÁRAJÁNLATOK */}
        <div 
          onClick={() => router.push("/quotes")}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          style={{ ...tileStyle, background: "#00bcf2" }}
        >
          <span style={iconStyle}>📄</span>
          <div style={tileLabelStyle}>Árajánlatok</div>
        </div>

        {/* RAKTÁR */}
        <div 
          onClick={() => router.push("/admin/items")}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          style={{ ...tileStyle, background: "#0078d7" }}
        >
          <span style={iconStyle}>📦</span>
          <div style={tileLabelStyle}>Raktár</div>
        </div>

        {/* ÜTEMTERV */}
        <div 
          onClick={() => router.push("/maintenance")}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          style={{ ...tileStyle, background: "#a4379f" }}
        >
          <span style={iconStyle}>🗓️</span>
          <div style={tileLabelStyle}>Ütemterv</div>
        </div>

        {/* ÜGYFELEK */}
        <div 
          onClick={() => router.push("/clients")}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          style={{ ...tileStyle, background: "#d83b01", gridColumn: "span 2" }}
        >
          <span style={iconStyle}>👥</span>
          <div style={tileLabelStyle}>Ügyfelek kezelése</div>
        </div>
      </div>

      <footer style={footerContainer}>
        <div style={footerLine} />
        <p style={footerText}>NS-Air Klíma Rendszer v2.0 | 2026</p>
      </footer>
    </div>
  );
}

// STÍLUSOK
const containerStyle: React.CSSProperties = {
  minHeight: "100vh", 
  backgroundColor: "#000", 
  color: "#fff",
  fontFamily: "'Segoe UI', sans-serif", 
  padding: "40px 20px",
};

const headerStyle: React.CSSProperties = {
  maxWidth: "800px", 
  margin: "0 auto 30px auto",
  display: "flex", 
  justifyContent: "space-between", 
  alignItems: "baseline",
};

const titleStyle: React.CSSProperties = { fontSize: "32px", fontWeight: "lighter", margin: 0 };
const statusDot: React.CSSProperties = { fontSize: "12px", color: "#2ecc71", textTransform: "uppercase", letterSpacing: "1px" };

const cardStyle: React.CSSProperties = {
  maxWidth: "800px",
  margin: "0 auto 20px auto",
  background: "#111",
  padding: "20px",
  borderRadius: "4px", // Windows-os szögletes stílus
  borderLeft: "4px solid #27ae60",
};

const statBox: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "5px"
};

const statLabel: React.CSSProperties = { fontSize: "10px", opacity: 0.6, fontWeight: "bold" };
const statValue: React.CSSProperties = { fontSize: "16px", fontWeight: "bold" };

const gridStyle: React.CSSProperties = {
  display: "grid", 
  gridTemplateColumns: "repeat(2, 1fr)",
  gridAutoRows: "140px",
  gap: "10px", 
  maxWidth: "800px", 
  margin: "0 auto",
};

const tileStyle: React.CSSProperties = {
  padding: "15px", 
  display: "flex", 
  flexDirection: "column",
  justifyContent: "space-between", 
  cursor: "pointer", 
  transition: "all 0.2s ease",
};

const iconStyle: React.CSSProperties = { fontSize: "28px" };
const tileLabelStyle: React.CSSProperties = { fontSize: "18px", fontWeight: "600" };
const smallLabelStyle: React.CSSProperties = { fontSize: "11px", opacity: 0.7 };

const footerContainer: React.CSSProperties = {
  textAlign: "center", 
  width: "100%",
  maxWidth: "800px",
  margin: "60px auto 0 auto"
};

const footerLine: React.CSSProperties = {
  height: "1px",
  background: "linear-gradient(90deg, transparent, #333, transparent)",
  marginBottom: "15px"
};

const footerText: React.CSSProperties = {
  fontSize: "12px", 
  color: "#2ecc71", 
  fontWeight: "bold",
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  margin: 0
};
