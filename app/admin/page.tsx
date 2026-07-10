


"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();

  // Biztonsági mentés kezelő
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

  // Egyszerűsített hover effekt (inline style változtatással)
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
        <h1 style={titleStyle}>NS-AIR ADMIN</h1>
        <button onClick={() => router.push("/")} style={homeButtonStyle}>
          főoldal
        </button>
      </header>

      <div style={gridStyle}>
        
        {/* MENTÉS CSEMPE */}
        <div 
          onClick={handleBackup}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          style={{ ...tileStyle, background: "#2ecc71", gridColumn: "span 2" }}
        >
          <span style={iconStyle}>🛡️</span>
          <div style={tileLabelStyle}>Rendszerjelentés</div>
          <span style={{ fontSize: "12px", opacity: 0.8 }}>Adatbázis mentés küldése</span>
        </div>

        {/* NAPTÁR CSEMPE (AZ ÚJ!) */}
        <div 
          onClick={() => router.push("/admin/calendar")}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          style={{ ...tileStyle, background: "#008272" }}
        >
          <span style={iconStyle}>📅</span>
          <div style={tileLabelStyle}>Naptár</div>
          <span style={{ fontSize: "11px", opacity: 0.7 }}>Munkaterv</span>
        </div>

        {/* RAKTÁR CSEMPE */}
        <div 
          onClick={() => router.push("/admin/items")}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          style={{ ...tileStyle, background: "#0078d7" }}
        >
          <span style={iconStyle}>📦</span>
          <div style={tileLabelStyle}>Raktár</div>
        </div>

        {/* ÜTEMTERV CSEMPE */}
        <div 
          onClick={() => router.push("/maintenance")}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          style={{ ...tileStyle, background: "#a4379f" }}
        >
          <span style={iconStyle}>🗓️</span>
          <div style={tileLabelStyle}>Ütemterv</div>
        </div>

        {/* ÜGYFELEK CSEMPE */}
        <div 
          onClick={() => router.push("/clients")}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          style={{ ...tileStyle, background: "#d83b01" }}
        >
          <span style={iconStyle}>👥</span>
          <div style={tileLabelStyle}>Ügyfelek</div>
        </div>

      </div>

      <footer style={footerStyle}>
        NS-Air Klíma Rendszer v2.0 | 2026
      </footer>
    </div>
  );
}

// --- STÍLUSOK (FIXÁLVA) ---

const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#000",
  color: "#fff",
  fontFamily: "'Segoe UI', sans-serif",
  padding: "40px 20px",
};

const headerStyle: React.CSSProperties = {
  maxWidth: "800px",
  margin: "0 auto 40px auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const titleStyle: React.CSSProperties = {
  fontSize: "32px",
  fontWeight: "lighter",
  margin: 0,
};

const homeButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #fff",
  color: "#fff",
  padding: "5px 15px",
  cursor: "pointer",
};

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

const iconStyle: React.CSSProperties = {
  fontSize: "28px",
};

const tileLabelStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: "600",
};

const footerStyle: React.CSSProperties = {
  textAlign: "center",
  marginTop: "50px",
  fontSize: "11px",
  color: "#444",
};
