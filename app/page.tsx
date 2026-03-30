"use client";

import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState({ totalItems: 0, lowStock: 0, value: 0 });

  useEffect(() => {
    // Itt hívjuk be az adatokat az összesítéshez
    fetch("/api/items")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const low = data.filter(i => i.stock < 3).length;
          const totalValue = data.reduce((acc, curr) => acc + (curr.price * curr.stock), 0);
          setStats({ totalItems: data.length, lowStock: low, value: totalValue });
        }
      });
  }, []);

  return (
    <div style={{ padding: "15px", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif", backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
      
      <h1 style={{ fontSize: "22px", marginBottom: "20px", fontWeight: "800", color: "#1a202c" }}>🛠️ NS-AIR CONTROL</h1>

      {/* GYORS STATISZTIKA - Hogy lásd mi van */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
        <div style={statCardS}>
          <span style={statLabelS}>Összes tétel</span>
          <span style={statValueS}>{stats.totalItems}</span>
        </div>
        <div style={{ ...statCardS, borderLeft: "4px solid #e53e3e" }}>
          <span style={statLabelS}>Kevés készlet</span>
          <span style={{ ...statValueS, color: "#e53e3e" }}>{stats.lowStock}</span>
        </div>
      </div>

      {/* FŐ MŰVELETEK - A gombok, amik kellenek */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        
        <button onClick={() => window.location.href = "/admin/items"} style={bigBtnS}>
          <span style={{ fontSize: "24px" }}>📦</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: "bold", fontSize: "18px" }}>Raktár Kezelése</div>
            <div style={{ fontSize: "12px", opacity: 0.8 }}>Hozzáadás, szerkesztés, készlet infó</div>
          </div>
        </button>

        <button onClick={() => alert("Fejlesztés alatt...")} style={{ ...bigBtnS, background: "#2d3748" }}>
          <span style={{ fontSize: "24px" }}>📋</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: "bold", fontSize: "18px" }}>Munkalapok / Ajánlatok</div>
            <div style={{ fontSize: "12px", opacity: 0.8 }}>Gyors dokumentum generálás</div>
          </div>
        </button>

        <button onClick={() => alert("Fejlesztés alatt...")} style={{ ...bigBtnS, background: "#38a169" }}>
          <span style={{ fontSize: "24px" }}>👥</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: "bold", fontSize: "18px" }}>Ügyféladatbázis</div>
            <div style={{ fontSize: "12px", opacity: 0.8 }}>Címek, telefonszámok, gépek</div>
          </div>
        </button>

      </div>

      {/* GYORSKERESŐ VAGY UTOLSÓ MOZGÁSOK HELYE */}
      <div style={{ marginTop: "30px", padding: "15px", background: "white", borderRadius: "12px", fontSize: "14px", color: "#718096", textAlign: "center", border: "1px dashed #cbd5e0" }}>
        A rendszer használatra kész. Válaszd ki a kívánt műveletet!
      </div>
    </div>
  );
}

// STÍLUSOK (Tisztán, sallangmentesen)
const statCardS = { background: "white", padding: "15px", borderRadius: "12px", display: "flex", flexDirection: "column" as const, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" };
const statLabelS = { fontSize: "12px", color: "#718096", fontWeight: "bold", textTransform: "uppercase" as const };
const statValueS = { fontSize: "24px", fontWeight: "800", color: "#2d3748" };
const bigBtnS = { 
  display: "flex", 
  alignItems: "center", 
  gap: "15px", 
  padding: "20px", 
  background: "#0070f3", 
  color: "white", 
  border: "none", 
  borderRadius: "15px", 
  cursor: "pointer", 
  transition: "transform 0.1s" 
};
