"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();

  const handleBackup = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Biztonsági mentés indítása? Az emailt hamarosan küldjük.")) return;

    try {
      const response = await fetch(`/api/admin/backup?t=${Date.now()}`, {
        method: "POST",
      });

      if (response.ok) {
        alert("A mentés sikeresen elindult! Ellenőrizze az email fiókját.");
      } else {
        alert("Hiba történt a mentés során. Próbálja meg később.");
      }
    } catch (error) {
      console.error("Backup hiba:", error);
      alert("Hálózati hiba történt.");
    }
  };

  // Segédfüggvény a csempe animációhoz
  const tileHover = (e: React.MouseEvent<HTMLDivElement>, enter: boolean) => {
    e.currentTarget.style.transform = enter ? "scale(0.96)" : "scale(1)";
    e.currentTarget.style.opacity = enter ? "0.9" : "1";
  };

  return (
    <div style={containerStyle}>
      {/* FEJLÉC */}
      <header style={headerStyle}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={subTitleStyle}>RENDSZER</span>
          <h1 style={titleStyle}>Adminisztráció</h1>
        </div>
        <button 
          onClick={() => router.push("/")} 
          style={homeButtonStyle}
        >
          főoldal
        </button>
      </header>

      {/* CSEMPE RÁCS */}
      <div style={gridStyle}>
        
        {/* MENTÉS (Nagy csempe) */}
        <div 
          onClick={handleBackup}
          onMouseEnter={(e) => tileHover(e, true)}
          onMouseLeave={(e) => tileHover(e, false)}
          style={{ ...tileStyle, background: "#2ecc71", gridColumn: "span 2" }}
        >
          <span style={iconStyle}>🛡️</span>
          <div style={tileLabelContainer}>
            <div style={tileLabelStyle}>Biztonsági mentés</div>
            <span style={smallLabelStyle}>Adatbázis export küldése emailben</span>
          </div>
        </div>

        {/* RAKTÁR */}
        <div 
          onClick={() => router.push("/admin/items")}
          onMouseEnter={(e) => tileHover(e, true)}
          onMouseLeave={(e) => tileHover(e, false)}
          style={{ ...tileStyle, background: "#0078d7" }}
        >
          <span style={iconStyle}>📦</span>
          <div style={tileLabelStyle}>Raktár</div>
        </div>

        {/* ÜTEMTERV */}
        <div 
          onClick={() => router.push("/maintenance")}
          onMouseEnter={(e) => tileHover(e, true)}
          onMouseLeave={(e) => tileHover(e, false)}
          style={{ ...tileStyle, background: "#a4379f" }}
        >
          <span style={iconStyle}>🗓️</span>
          <div style={tileLabelStyle}>Ütemterv</div>
        </div>

        {/* ÜGYFELEK */}
        <div 
          onClick={() => router.push("/clients")}
          onMouseEnter={(e) => tileHover(e, true)}
          onMouseLeave={(e) => tileHover(e, false)}
          style={{ ...tileStyle, background: "#d83b01" }}
        >
          <span style={iconStyle}>👥</span>
          <div style={tileLabelStyle}>Ügyfelek</div>
        </div>

        {/* NAPLÓK */}
        <div 
          onMouseEnter={(e) => tileHover(e, true)}
          onMouseLeave={(e) => tileHover(e, false)}
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

// --- WINDOWS PHONE / METRO UI STÍLUSOK ---

const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#000",
  color: "#fff",
  fontFamily: "'Segoe UI Neue', 'Segoe UI', helvetica, sans-serif",
  padding: "40px 20px",
  transition: "all 0.5s ease",
};

const headerStyle: React.CSSProperties = {
  maxWidth: "800px",
  margin: "0 auto 50px auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
};

const subTitleStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "600",
  letterSpacing: "2px",
  color: "#fff",
  opacity: 0.7,
};

const titleStyle: React.CSSProperties = {
  fontSize: "42px",
  fontWeight: "lighter",
  margin: "0",
  lineHeight: "1.1",
};

const homeButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "2px solid rgba(255,255,255,0.5)",
  color: "#fff",
  padding: "10px 20px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
  textTransform: "lowercase",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gridAutoRows: "160px",
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
  transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
  userSelect: "none",
};

const iconStyle: React.CSSProperties = {
  fontSize: "36px",
};

const tileLabelContainer: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const tileLabelStyle: React.CSSProperties = {
  fontSize: "19px",
  fontWeight: "600",
};

const smallLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  opacity: 0.8,
  marginTop: "4px",
};

const footerStyle: React.CSSProperties = {
  textAlign: "left",
  maxWidth: "800px",
  margin: "60px auto 0 auto",
  fontSize: "12px",
  color: "#444",
  textTransform: "uppercase",
  letterSpacing: "1px",
};
