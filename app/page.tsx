"use client";

import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState({ items: 0, clients: 0, maintenanceCount: 0 });

  useEffect(() => {
    // Raktárkészlet lekérése
    fetch("/api/items")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setStats(s => ({ ...s, items: data.length }));
      }).catch(() => {});

    // Ügyfelek lekérése (statisztikához)
    fetch("/api/clients")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setStats(s => ({ ...s, clients: data.length }));
      }).catch(() => {});

    // Karbantartások lekérése
    fetch("/api/maintenance")
      .then(res => res.json())
      .then(data => {
        // Itt feltételezzük, hogy az API visszaadja a karbantartásokat. 
        // Ha van szűrés az esedékesekre, azt az API végzi, vagy itt szűrjük:
        if (Array.isArray(data)) {
          setStats(s => ({ ...s, maintenanceCount: data.length }));
        }
      }).catch(() => {});
  }, []);

  return (
    <div style={{ padding: "15px", maxWidth: "900px", margin: "0 auto", fontFamily: "sans-serif", backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      
      <h1 style={{ fontSize: "24px", marginBottom: "25px", fontWeight: "800", color: "#1a202c", display: "flex", alignItems: "center", gap: "10px" }}>
        🛠️ Vezérlőpult
      </h1>

      {/* FELSŐ KÁRTYÁK */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "30px" }}>
        
        <div style={{ ...miniCardS, borderTop: "4px solid #0070f3" }}>
          <div style={statNumS}>{stats.clients}</div>
          <div style={statLabelS}>Összes ügyfél</div>
          <a href="/clients" style={linkS}>Ügyfelek listája →</a>
        </div>

        <div style={{ ...miniCardS, borderTop: "4px solid #e53e3e" }}>
          <div style={statNumS}>{stats.maintenanceCount}</div>
          <div style={statLabelS}>Esedékes karbantartás</div>
          <a href="/maintenance" style={linkS}>Megtekintés →</a>
        </div>

        <div style={{ ...miniCardS, borderTop: "4px solid #ecc94b" }}>
          <div style={statNumS}>{stats.items}</div>
          <div style={statLabelS}>Regisztrált termék</div>
          <a href="/admin/items" style={linkS}>Termékek kezelése →</a>
        </div>

      </div>

      {/* GYORSMŰVELETEK */}
      <div style={{ background: "white", padding: "20px", borderRadius: "15px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <h3 style={{ marginTop: 0, marginBottom: "20px", fontSize: "18px" }}>Gyorsműveletek</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <button onClick={() => window.location.href = "/quotes/new"} style={actionBtnS}>
            + Új ajánlat készítése
          </button>
          <button onClick={() => window.location.href = "/clients/new"} style={actionBtnS}>
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

const miniCardS = { background: "white", padding: "20px", borderRadius: "12px", textAlign: "center" as const, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" };
const statNumS = { fontSize: "32px", fontWeight: "900", color: "#2d3748", marginBottom: "5px" };
const statLabelS = { fontSize: "14px", color: "#718096", marginBottom: "15px", fontWeight: "bold" };
const linkS = { fontSize: "13px", color: "#0070f3", textDecoration: "none", fontWeight: "bold", border: "1px solid #0070f3", padding: "5px 10px", borderRadius: "6px" };
const actionBtnS = { padding: "14px 22px", background: "#2d3748", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" as const, fontSize: "14px" };
