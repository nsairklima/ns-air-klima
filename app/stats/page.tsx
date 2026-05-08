"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Hiba a statisztikák lekérésekor:", err));
  }, []);

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#000",
    color: "#fff",
    padding: "40px 20px",
    fontFamily: "'Segoe UI', sans-serif"
  };

  const mainWrapper = {
    maxWidth: "800px",
    margin: "0 auto"
  };

  const cardStyle = {
    background: "#111",
    padding: "25px",
    borderRadius: "8px",
    border: "1px solid #333",
    marginBottom: "20px"
  };

  const rowStyle = {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #222"
  };

  const sectionHeader = (color: string) => ({
    color: color,
    marginTop: 0,
    fontSize: "1.2rem",
    borderBottom: `2px solid ${color}`,
    paddingBottom: "8px",
    marginBottom: "15px",
    textTransform: "uppercase" as const,
    letterSpacing: "1px"
  });

  return (
    <div style={containerStyle}>
      <div style={mainWrapper}>
        <button 
          onClick={() => router.push("/")} 
          style={{ 
            background: "#333", 
            color: "#fff", 
            border: "none", 
            padding: "10px 20px", 
            cursor: "pointer", 
            marginBottom: "20px",
            borderRadius: "4px"
          }}
        >
          ⬅ Vissza a főoldalra
        </button>

        <h1 style={{ marginBottom: "30px", fontWeight: "lighter" }}>
          Üzleti Jelentés - {new Date().getFullYear()}
        </h1>
        
        {stats ? (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
              
              {/* HAVI KIMUTATÁS */}
              <div style={cardStyle}>
                <h2 style={sectionHeader("#f39c12")}>📅 Aktuális Hónap</h2>
                <div style={rowStyle}><span>Bruttó forgalom:</span><strong>{stats.monthly?.gross.toLocaleString()} Ft</strong></div>
                <div style={rowStyle}><span>Tiszta haszon:</span><strong style={{ color: "#2ecc71" }}>{stats.monthly?.profit.toLocaleString()} Ft</strong></div>
                <div style={rowStyle}><span>Átlagos árrés:</span><strong>{stats.monthly?.margin}%</strong></div>
                <div style={rowStyle}><span>Kiadott ajánlatok:</span><strong>{stats.monthly?.count} db</strong></div>
              </div>

              {/* ÉVES KIMUTATÁS */}
              <div style={cardStyle}>
                <h2 style={sectionHeader("#00bcf2")}>📈 Éves Összesítő</h2>
                <div style={rowStyle}><span>Bruttó forgalom:</span><strong>{stats.yearly?.gross.toLocaleString()} Ft</strong></div>
                <div style={rowStyle}><span>Tiszta haszon:</span><strong style={{ color: "#2ecc71" }}>{stats.yearly?.profit.toLocaleString()} Ft</strong></div>
                <div style={rowStyle}><span>Átlagos árrés:</span><strong>{stats.yearly?.margin}%</strong></div>
                <div style={rowStyle}><span>Összes ajánlat:</span><strong>{stats.yearly?.count} db</strong></div>
              </div>

            </div>

            {/* ÜGYFÉL ÉS SZERVIZ INFÓK */}
            <div style={{ ...cardStyle, borderLeft: "4px solid #d83b01" }}>
              <h2 style={sectionHeader("#d83b01")}>👥 Operatív Adatok</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", textAlign: "center", paddingTop: "10px" }}>
                <div>
                  <div style={{ fontSize: "12px", opacity: 0.6 }}>ÜGYFELEK</div>
                  <div style={{ fontSize: "20px", fontWeight: "bold" }}>{stats.totalClients}</div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", opacity: 0.6 }}>GÉPEK</div>
                  <div style={{ fontSize: "20px", fontWeight: "bold" }}>{stats.totalUnits}</div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#e74c3c", fontWeight: "bold" }}>SÜRGŐS</div>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#e74c3c" }}>{stats.urgentCount}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <p style={{ opacity: 0.5 }}>Adatok betöltése és elemzése...</p>
          </div>
        )}
      </div>
    </div>
  );
}
