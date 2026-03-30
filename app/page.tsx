"use client";

import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState({ items: 0 });

  useEffect(() => {
    fetch("/api/items").then(res => res.json()).then(data => {
      if (Array.isArray(data)) setStats({ items: data.length });
    }).catch(() => {});
  }, []);

  return (
    <div style={{ padding: "15px", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif", backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "25px", paddingTop: "10px" }}>
        <span style={{ fontSize: "28px" }}>🛠️</span>
        <h1 style={{ fontSize: "22px", margin: 0, fontWeight: "800", color: "#1a202c" }}>Vezérlőpult</h1>
      </div>

      {/* STATISZTIKA KÁRTYA */}
      <div style={{ background: "white", padding: "20px", borderRadius: "15px", marginBottom: "25px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "1px solid #eee" }}>
        <div style={{ fontSize: "12px", color: "#666", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>Raktár állapota</div>
        <div style={{ fontSize: "26px", fontWeight: "900", color: "#0070f3", marginTop: "5px" }}>{stats.items} termék</div>
      </div>

      {/* GOMBOK - EREDETI ÚTVONALAKKAL */}
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        
        {/* RAKTÁR - A képed alapján ez az admin/items */}
        <button onClick={() => window.location.href = "/admin/items"} style={btnS}>
          <div style={iconS}>📦</div>
          <div style={{ textAlign: "left" }}>
            <div style={titleS}>Termékek Kezelése</div>
            <div style={descS}>Készlet, árak és rögzítés</div>
          </div>
        </button>

        {/* ÜGYFELEK - Ha ez nem admin/customers, akkor próbáld meg simán /customers-el */}
        <button onClick={() => window.location.href = "/admin/customers"} style={{ ...btnS, background: "#2d3748" }}>
          <div style={iconS}>👥</div>
          <div style={{ textAlign: "left" }}>
            <div style={titleS}>Ügyfelek</div>
            <div style={descS}>Ügyféladatbázis megnyitása</div>
          </div>
        </button>

        {/* AJÁNLATOK */}
        <button onClick={() => window.location.href = "/admin/quotes"} style={{ ...btnS, background: "#38a169" }}>
          <div style={iconS}>📋</div>
          <div style={{ textAlign: "left" }}>
            <div style={titleS}>Új Ajánlat / Munkalap</div>
            <div style={descS}>Dokumentumok generálása</div>
          </div>
        </button>

      </div>

      <div style={{ marginTop: "40px", textAlign: "center", color: "#cbd5e0", fontSize: "11px", fontWeight: "bold" }}>
        NS-AIR KLÍMA RENDSZER
      </div>
    </div>
  );
}

// STÍLUSOK - Maradnak a stabil, mobilbarát verziók
const btnS = { 
  display: "flex", 
  alignItems: "center", 
  gap: "15px", 
  padding: "20px", 
  background: "#0070f3", 
  color: "white", 
  border: "none", 
  borderRadius: "16px", 
  cursor: "pointer",
  width: "100%",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  transition: "transform 0.2s"
};
const iconS = { fontSize: "24px", background: "rgba(255,255,255,0.15)", padding: "12px", borderRadius: "12px" };
const titleS = { fontWeight: "bold", fontSize: "18px" };
const descS = { fontSize: "12px", opacity: 0.85, marginTop: "2px" };űűűűűűű
