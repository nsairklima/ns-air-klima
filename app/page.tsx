"use client";

import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState({ items: 0, customers: 1, tasks: 0 });

  useEffect(() => {
    // Csak a termékszámot frissítjük az API-ból, a többi marad a kép szerinti alapérték
    fetch("/api/items").then(res => res.json()).then(data => {
      if (Array.isArray(data)) setStats(s => ({ ...s, items: data.length }));
    }).catch(() => {});
  }, []);

  return (
    <div style={{ padding: "15px", maxWidth: "900px", margin: "0 auto", fontFamily: "sans-serif", backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      
      <h1 style={{ fontSize: "24px", marginBottom: "25px", fontWeight: "800", color: "#1a202c", display: "flex", alignItems: "center", gap: "10px" }}>
        🛠️ Vezérlőpult
      </h1>

      {/* FELSŐ STATISZTIKAI KÁRTYÁK - Pontosan a képed szerint */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "15px", marginBottom: "30px" }}>
        <div style={{ ...miniCardS, borderTop: "4px solid #0070f3" }}>
          <div style={statNumS}>{stats.customers}</div>
          <div style={statLabelS}>Összes ügyfél</div>
          <a href="/admin/customers" style={linkS}>Ügyfelek listája →</a>
        </div>
        <div style={{ ...miniCardS, borderTop: "4px solid #38a169" }}>
          <div style={statNumS}>0</div>
          <div style={statLabelS}>Kezelt klímák</div>
        </div>
        <div style={{ ...miniCardS, borderTop: "4px solid #ecc94b" }}>
          <div style={statNumS}>{stats.items}</div>
          <div style={statLabelS}>Regisztrált termék</div>
          <a href="/admin/items" style={linkS}>Termékek kezelése →</a>
        </div>
        <div style={{ ...miniCardS, borderTop: "4px solid #718096" }}>
          <div style={statNumS}>0</div>
          <div style={statLabelS}>Esedékes karbantartás</div>
          <a href="/admin/tasks" style={linkS}>Megtekintés →</a>
        </div>
      </div>

      {/* GYORSMŰVELETEK - Az alsó gombok modernizálva */}
      <div style={{ background: "white", padding: "20px", borderRadius: "15px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <h3 style={{ marginTop: 0, marginBottom: "20px", fontSize: "18px" }}>Gyorsműveletek</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          <button onClick={() => window.location.href = "/admin/quotes/new"} style={actionBtnS}>
            + Új ajánlat készítése
          </button>
          <button onClick={() => window.location.href = "/admin/customers/new"} style={actionBtnS}>
            + Új ügyfél rögzítése
          </button>
          <button onClick={() => window.location.href = "/admin/items"} style={{ ...actionBtnS, background: "#ecc94b", color: "#000" }}>
            + Termék hozzáadása
          </button>
        </div>
      </div>

      <div style={{ marginTop: "40px", textAlign: "center", color: "#cbd5e0", fontSize: "12px" }}>
        NS-AIR KLÍMA RENDSZER
      </div>
    </div>
  );
}

// STÍLUSOK
const miniCardS = { background: "white", padding: "20px", borderRadius: "12px", textAlign: "center" as const, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" };
const statNumS = { fontSize: "28px", fontWeight: "900", color: "#2d3748", marginBottom: "5px" };
const statLabelS = { fontSize: "13px", color: "#718096", marginBottom: "10px", fontWeight: "bold" };
const linkS = { fontSize: "12px", color: "#0070f3", textDecoration: "none", fontWeight: "bold" };
const actionBtnS = { padding: "12px 20px", background: "#2d3748", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" as const, fontSize: "14px" };
