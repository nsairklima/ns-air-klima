"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#000",
    color: "#fff",
    padding: "40px 20px",
    fontFamily: "'Segoe UI', sans-serif"
  };

  const cardStyle = {
    background: "#111",
    padding: "25px",
    borderRadius: "8px",
    border: "1px solid #333",
    maxWidth: "600px",
    margin: "0 auto"
  };

  const rowStyle = {
    display: "flex",
    justifyContent: "space-between",
    padding: "15px 0",
    borderBottom: "1px solid #222"
  };

  return (
    <div style={containerStyle}>
      <button onClick={() => router.push("/")} style={{ background: "#333", color: "#fff", border: "none", padding: "10px 20px", cursor: "pointer", marginBottom: "20px" }}>⬅ Vissza</button>
      
      <div style={cardStyle}>
        <h1 style={{ color: "#f39c12", marginTop: 0 }}>📊 Részletes Statisztika</h1>
        
        {stats ? (
          <div>
            <div style={rowStyle}><span>Havi bruttó forgalom:</span><strong>{stats.monthlyGross?.toLocaleString()} Ft</strong></div>
            <div style={rowStyle}><span>Havi tiszta haszon:</span><strong style={{ color: "#2ecc71" }}>{stats.monthlyProfit?.toLocaleString()} Ft</strong></div>
            <div style={rowStyle}><span>Átlagos árrés:</span><strong>{stats.avgMargin}%</strong></div>
            <div style={rowStyle}><span>Kiadott ajánlatok (hó):</span><strong>{stats.monthlyQuoteCount} db</strong></div>
            <div style={rowStyle}><span>Összes ügyfél:</span><strong>{stats.totalClients} fő</strong></div>
            <div style={rowStyle}><span>Összes gép:</span><strong>{stats.totalUnits} db</strong></div>
            <div style={rowStyle}><span>Sürgős karbantartás:</span><strong style={{ color: "#e74c3c" }}>{stats.urgentCount} gép</strong></div>
          </div>
        ) : <p>Betöltés...</p>}
      </div>
    </div>
  );
}
