"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();

  const handleBackup = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Biztonsági mentés indítása?")) return;

    try {
      const response = await fetch(`/api/admin/backup?t=${Date.now()}`, {
        method: "POST",
      });

      if (response.ok) {
        alert("A mentés sikeresen elindult!");
      } else {
        alert("Hiba történt a mentés során.");
      }
    } catch (error) {
      alert("Hálózati hiba történt.");
    }
  };

  return (
    <div style={containerStyle}>
      {/* Fejléc */}
      <header style={headerStyle}>
        <h1 style={titleStyle}>NS-AIR ADMIN</h1>
        <button onClick={() => router.push("/")} style={homeButtonStyle}>
          ← főoldal
        </button>
      </header>

      {/* Csempe Rács */}
      <div style={gridStyle}>
        
        {/* Mentés Csempe (Nagy dupla csempe) */}
        <div 
          onClick={handleBackup}
          style={{ ...tileStyle, background: "#2ecc71", gridColumn: "span 2" }}
        >
          <span style={iconStyle}>🛡️</span>
          <div style={tileLabelStyle}>Biztonsági mentés</div>
          <span style={subLabelStyle}>Adatbázis export küldése</span>
        </div>

        {/* Raktár Csempe */}
        <div 
          onClick={() => router.push("/admin/items")}
          style={{ ...tileStyle, background: "#0078d7" }}
        >
          <span style={iconStyle}>📦</span>
          <div style={tileLabelStyle}>Raktár</div>
        </div>

        {/* Ütemterv Csempe */}
        <div 
          onClick={() => router.push("/maintenance")}
          style={{ ...tileStyle, background: "#a4379f" }}
        >
          <span style={iconStyle}>🗓️</span>
          <div style={tileLabelStyle}>Ütemterv</div>
        </div>

        {/* Ügyfelek (példa egy újabb csempére) */}
        <div 
          onClick={() => router.push("/clients")}
          style={{ ...tileStyle, background: "#d83b01" }}
        >
          <span style={iconStyle}>👥</span>
          <div style={tileLabelStyle}>Ügyfelek</div>
        </div>

        {/* Beállítások / Statisztika */}
        <div 
          style={{ ...tileStyle, background: "#008272" }}
        >
          <span style={iconStyle}>📊</span>
          <div style={tileLabelStyle}>Naplók</div>
        </div>

      </div>

      <footer style={footerStyle}>
        NS-Air Klíma Rendszer v2.0 | 2026
      </footer>
    </div>
  );
}

// --- STÍLUSOK (Windows Phone / Metro UI stílus) ---

const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#000", // Fekete háttér a klasszikus WP kinézethez
  color: "#fff",
  fontFamily: "'Segoe UI', Roboto, Helvetica, sans-serif",
  padding: "40px 20px",
};

const headerStyle: React.CSSProperties = {
  maxWidth: "800px",
  margin: "0 auto 40px auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
};

const titleStyle: React.CSSProperties = {
  fontSize: "48px",
  fontWeight: "lighter",
  margin: 0,
  textTransform: "uppercase",
};

const homeButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "2px solid #fff",
  color: "#fff",
  padding: "8px 15px",
  cursor: "pointer",
  fontSize: "14px",
  textTransform: "uppercase",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gridAutoRows: "150px",
  gap: "12px",
  maxWidth: "800px",
  margin: "0 auto",
};

const tileStyle: React.CSSProperties = {
  padding: "15px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  cursor: "pointer",
  transition: "transform 0.1s",
  position: "relative",
  overflow: "hidden",
};

const iconStyle: React.CSSProperties = {
  fontSize: "32px",
};

const tileLabelStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: "600",
};

const subLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  opacity: 0.8,
};

const footerStyle: React.CSSProperties = {
  textAlign: "center",
  marginTop: "60px",
  fontSize: "12px",
  color: "#666",
  textTransform: "uppercase",
  letterSpacing: "2px",
};
