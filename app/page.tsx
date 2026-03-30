"use client";

import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState({ items: 0, customers: 0, tasks: 0 });

  useEffect(() => {
    // Statisztikák betöltése (ha vannak API-k, ha nincsenek, marad a 0)
    fetch("/api/items").then(res => res.json()).then(data => {
      if (Array.isArray(data)) setStats(s => ({ ...s, items: data.length }));
    }).catch(() => {});
  }, []);

  return (
    <div style={{ padding: "15px", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif", backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "25px" }}>
        <span style={{ fontSize: "28px" }}>🛠️</span>
        <h1 style={{ fontSize: "22px", margin: 0, fontWeight: "800", color: "#1a202c" }}>Vezérlőpult</h1>
      </div>

      {/* GYORS ÖSSZESÍTŐ - Hogy lásd a raktár állapotát */}
      <div style={{ background: "white", padding: "15px", borderRadius: "12px", marginBottom: "25px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)", border: "1px solid #eee" }}>
        <div style={{ fontSize: "12px", color: "#666", fontWeight: "bold", textTransform: "uppercase", marginBottom: "5px" }}>Aktuális készlet</div>
        <div style={{ fontSize: "24px", fontWeight: "800", color: "#0070f3" }}>{stats.items} regisztrált termék</div>
      </div>

      {/* GOMBOK - Visszaállítva az eredeti útvonalakra */}
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        
        {/* RAKTÁR - Ahol a csempés lista van */}
        <button onClick={() => window.location.href = "/admin/items"} style={btnS}>
          <div style={iconS}>📦</div>
          <div style={{ textAlign: "left" }}>
            <div style={titleS}>Termékek Kezelése</div>
            <div style={descS}>Raktárkészlet, árak, SKU, nagyker</div>
          </div>
        </button>

        {/* ÜGYFELEK - Visszaállítva az ügyfél listára */}
        <button onClick={() => window.location.href = "/admin/customers"} style={{ ...btnS, background: "#2d3748" }}>
          <div style={iconS}>👥</div>
          <div style={{ textAlign: "left" }}>
            <div style={titleS}>Ügyféladatbázis</div>
            <div style={descS}>Regisztrált partnerek és elérhetőségek</div>
          </div>
        </button>

        {/* AJÁNLATOK / MUNKALAPOK */}
        <button onClick={() => window.location.href = "/admin/quotes"} style={{ ...btnS, background: "#38a169" }}>
          <div style={iconS}>📋</div>
          <div style={{ textAlign: "left" }}>
            <div style={titleS}>Ajánlatok / Munkalapok</div>
            <div style={descS}>Készítés és korábbi dokumentumok</div>
          </div>
        </button>

        {/* BEÁLLÍTÁSOK VAGY EGYÉB */}
        <button onClick={() => window.location.href = "/admin/settings"} style={{ ...btnS, background: "#718096" }}>
          <div style={iconS}>⚙️</div>
          <div style={{ textAlign: "left" }}>
            <div style={titleS}>Beállítások</div>
            <div style={descS}>Rendszer és profil beállítások</div>
          </div>
        </button>

      </div>

      <div style={{ marginTop: "30px", textAlign: "center", color: "#a0aec0", fontSize: "12px" }}>
        NS-AIR KLÍMA • Belső adminisztrációs felület
      </div>
    </div>
  );
}

// FIX STÍLUSOK (Sallangmentes, tiszta)
const btnS = { 
  display: "flex", 
  alignItems: "center", 
  gap: "15px", 
  padding: "18px", 
  background: "#0070f3", 
  color: "white", 
  border: "none", 
  borderRadius: "15px", 
  cursor: "pointer",
  width: "100%",
  boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
};
const iconS = { fontSize: "24px", background: "rgba(255,255,255,0.2)", padding: "10px", borderRadius: "10px" };
const titleS = { fontWeight: "bold", fontSize: "18px" };
const descS = { fontSize: "12px", opacity: 0.9 };
