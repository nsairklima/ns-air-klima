"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function MainDashboard() {
  const router = useRouter();

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

// STÍLUSOK - FIXÁLT MÉRETEKKEL
const containerStyle: React.CSSProperties = {
  minHeight: "100vh", 
  backgroundColor: "#000", 
  color: "#fff",
  fontFamily: "'Segoe UI', sans-serif", 
  padding: "40px 20px",
  display: "block" // Visszaállítva flex-ről, hogy ne húzza szét a tartalmat
};

const headerStyle: React.CSSProperties = {
  maxWidth: "800px", 
  width: "100%", 
  margin: "0 auto 40px auto",
  display: "flex", 
  justifyContent: "space-between", 
  alignItems: "baseline",
};

const titleStyle: React.CSSProperties = { fontSize: "32px", fontWeight: "lighter", margin: 0 };
const statusDot: React.CSSProperties = { fontSize: "12px", color: "#2ecc71", textTransform: "uppercase", letterSpacing: "1px" };

const gridStyle: React.CSSProperties = {
  display: "grid", 
  gridTemplateColumns: "repeat(2, 1fr)",
  gridAutoRows: "140px", // Ez garantálja, hogy a csempék nem mennek össze
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
  marginTop: "80px", 
  paddingBottom: "20px",
  width: "100%",
  maxWidth: "800px",
  margin: "80px auto 0 auto"
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

// ... importok maradnak ...
import { useEffect, useState } from "react";

export default function HomePage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  // Stílus a csempéknek
  const cardStyle = {
    background: "#1e1e1e",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #333",
    marginBottom: "20px"
  };

  const statItem = {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #222"
  };

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto", color: "#fff" }}>
      <h1>Műszerfal</h1>

      {/* ÚJ STATISZTIKA CSEMPE */}
      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, color: "#27ae60", fontSize: "18px" }}>📊 Statisztika (E havi)</h2>
        {stats ? (
          <div>
            <div style={statItem}>
              <span>Havi bruttó forgalom:</span>
              <span style={{ fontWeight: "bold" }}>{stats.monthlyGross?.toLocaleString()} Ft</span>
            </div>
            <div style={statItem}>
              <span>Várható haszon (Profit):</span>
              <span style={{ fontWeight: "bold", color: "#2ecc71" }}>{stats.monthlyProfit?.toLocaleString()} Ft</span>
            </div>
            <div style={statItem}>
              <span>Átlagos árrés:</span>
              <span style={{ fontWeight: "bold" }}>{stats.avgMargin}%</span>
            </div>
            <div style={statItem}>
              <span>Kiadott ajánlatok:</span>
              <span style={{ fontWeight: "bold" }}>{stats.quoteCount} db</span>
            </div>
          </div>
        ) : (
          <p>Betöltés...</p>
        )}
      </div>

      {/* Ide jön a meglévő "Ajánlatok" listája vagy gombja */}
      <div style={{ display: "grid", gap: "10px" }}>
        <button onClick={() => window.location.href='/quotes'} style={{ padding: "15px", borderRadius: "8px", cursor: "pointer" }}>
          Ajánlatok kezelése
        </button>
      </div>
    </div>
  );
}
