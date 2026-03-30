"use client";

import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState({ items: 0, clients: 0, quotes: 0 });

  useEffect(() => {
    // Csak a raktárkészlet számát kérjük le, a többi statisztika fix a kép alapján
    fetch("/api/items").then(res => res.json()).then(data => {
      if (Array.isArray(data)) setStats(s => ({ ...s, items: data.length }));
    }).catch(() => {});
  }, []);

  return (
    <div style={{ padding: "15px", maxWidth: "900px", margin: "0 auto", fontFamily: "sans-serif", backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      
      <h1 style={{ fontSize: "24px", marginBottom: "25px", fontWeight: "800", color: "#1a202c", display: "flex", alignItems: "center", gap: "10px" }}>
        🛠️ Vezérlőpult
      </h1>

      {/* FELSŐ KÁRTYÁK - Pontos útvonalakkal a mappáid alapján */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "30px" }}>
        
        {/* ÜGYFELEK - app/clients/page.tsx */}
        <div style={{ ...miniCardS, borderTop: "4px solid #0070f3" }}>
          <div style={statNumS}>1</div>
          <div style={statLabelS}>Összes ügyfél</div>
          <a href="/clients" style={linkS}>Ügyfelek listája →</a>
        </div>

        {/* KARBANTARTÁS - app/maintenance/page.tsx */}
        <div style={{ ...miniCardS, borderTop: "4px solid #718096" }}>
          <div style={statNumS}>0</div>
          <div style={statLabelS}>Esedékes karbantartás</div>
          <a href="/maintenance" style={linkS}>Megtekintés →</a>
        </div>

        {/* RAKTÁR - app/admin/items/page.tsx (ez az egyetlen, ami az adminban van nálad) */}
        <div style={{ ...miniCardS, borderTop: "4px solid #ecc94b" }}>
          <div style={statNumS}>{stats.items}</div>
          <div style={statLabelS}>Regisztrált termék</div>
          <a href="/admin/items" style={linkS}>Termékek kezelése →</a>
        </div>

      </div>

      {/* GYORSMŰVELETEK - Alsó szekció */}
      <div style={{ background: "white", padding: "20px", borderRadius: "15px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <h3 style={{ marginTop: 0, marginBottom: "20px", fontSize: "18px" }}>Gyorsműveletek</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          
          {/* Új Ajánlat - app/quotes/new/page.tsx */}
          <button onClick={() => window.location.href = "/quotes/new"} style={actionBtnS}>
            + Új ajánlat készítése
          </button>

          {/* Új Ügyfél - app/clients/new/page.tsx */}
          <button onClick={() => window.location.href = "/clients/new"} style={actionBtnS}>
            + Új ügyfél rögzítése
          </button>

          {/* Termék Hozzáadása - app/admin/items/page.tsx */}
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

// STÍLUSOK (Tisztán, sallangmentesen)
const miniCardS = { background: "white", padding: "20px", borderRadius: "12px", textAlign: "center" as const, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" };
const statNumS = { fontSize: "32px", fontWeight: "900", color: "#2d3748", marginBottom: "5px" };
const statLabelS = { fontSize: "14px", color: "#718096", marginBottom: "15px", fontWeight: "bold" };
const linkS = { fontSize: "13px", color: "#0070f3", textDecoration: "none", fontWeight: "bold", border: "1px solid #0070f3", padding: "5px 10px", borderRadius: "6px" };
const actionBtnS = { padding: "14px 22px", background: "#2d3748", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" as const, fontSize: "14px" };
