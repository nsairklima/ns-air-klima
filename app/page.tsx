"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function Dashboard() {
  const [stats, setStats] = useState({ totalClients: 0, totalUnits: 0, urgentCount: 0 });

  useEffect(() => {
    fetch("/api/stats").then(res => res.json()).then(data => setStats(data));
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "Arial" }}>
      <h1>🛠️ Vezérlőpult</h1>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20, marginTop: 20 }}>
        
        {/* Összes ügyfél */}
        <div style={cardS("#3498db")}>
          <span style={{fontSize: 40}}>👥</span>
          <h3>{stats.totalClients}</h3>
          <p>Összes ügyfél</p>
          <Link href="/clients" style={linkS}>Ügyfelek listája →</Link>
        </div>

        {/* Összes gép */}
        <div style={cardS("#2ecc71")}>
          <span style={{fontSize: 40}}>❄️</span>
          <h3>{stats.totalUnits}</h3>
          <p>Kezelt klímák</p>
        </div>

        {/* Sürgős karbantartás */}
        <div style={cardS(stats.urgentCount > 0 ? "#e74c3c" : "#95a5a6")}>
          <span style={{fontSize: 40}}>⚠️</span>
          <h3>{stats.urgentCount}</h3>
          <p>Esedékes karbantartás</p>
          <Link href="/maintenance" style={linkS}>Megtekintés →</Link>
        </div>

      </div>

      <div style={{ marginTop: 40, padding: 20, background: "#f9f9f9", borderRadius: 12, border: "1px solid #eee" }}>
        <h2>Gyorsműveletek</h2>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <Link href="/quotes/new" style={btnS}>+ Új ajánlat készítése</Link>
          <Link href="/clients" style={btnS}>+ Új ügyfél rögzítése</Link>
        </div>
      </div>
    </div>
  );
}

// Stílusok
const cardS = (color: string) => ({
  background: "#fff",
  padding: "20px",
  borderRadius: "15px",
  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  borderTop: `6px solid ${color}`,
  textAlign: "center" as const
});

const linkS = { color: "#3498db", textDecoration: "none", fontSize: "14px", fontWeight: "bold" };
const btnS = { background: "#2c3e50", color: "#fff", padding: "12px 20px", borderRadius: "8px", textDecoration: "none" };
