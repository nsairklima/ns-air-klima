"use client";

import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState({ items: 0, clients: 0, maintenanceCount: 0 });
  const [upcoming, setUpcoming] = useState<any[]>([]);

  useEffect(() => {
    // 1. Termékek száma
    fetch("/api/items").then(res => res.json()).then(data => {
      if (Array.isArray(data)) setStats(s => ({ ...s, items: data.length }));
    });

    // 2. Ügyfelek száma
    fetch("/api/clients").then(res => res.json()).then(data => {
      if (Array.isArray(data)) setStats(s => ({ ...s, clients: data.length }));
    });

    // 3. Karbantartások szűrése
    fetch("/api/maintenance").then(res => res.json()).then(data => {
      if (Array.isArray(data)) {
        const today = new Date();
        // Olyan gépek, ahol a legutóbbi karbantartás nextDue dátuma már elmúlt vagy 30 napon belül van
        const dueSoon = data.filter(unit => {
          const lastMaint = unit.maintenance[0];
          if (!lastMaint?.nextDue) return false;
          const dueDate = new Date(lastMaint.nextDue);
          const diffDays = (dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
          return diffDays <= 30; // 30 napon belüli vagy már lejárt
        });

        setStats(s => ({ ...s, maintenanceCount: dueSoon.length }));
        setUpcoming(dueSoon.slice(0, 3)); // Csak az első 3-at tároljuk el a kijelzéshez
      }
    });
  }, []);

  return (
    <div style={{ padding: "15px", maxWidth: "900px", margin: "0 auto", fontFamily: "sans-serif", backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      
      <h1 style={{ fontSize: "24px", marginBottom: "25px", fontWeight: "800", color: "#1a202c" }}>🛠️ NS-AIR Vezérlő</h1>

      {/* STATISZTIKA */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "30px" }}>
        <div style={cardS}>
          <div style={numS}>{stats.clients}</div>
          <div style={labelS}>Ügyfél</div>
          <a href="/clients" style={linkS}>Lista →</a>
        </div>

        {/* Ez a kártya piros lesz, ha van lejárt tétel */}
        <div style={{ ...cardS, borderTop: stats.maintenanceCount > 0 ? "4px solid #e53e3e" : "4px solid #718096" }}>
          <div style={{ ...numS, color: stats.maintenanceCount > 0 ? "#e53e3e" : "#2d3748" }}>{stats.maintenanceCount}</div>
          <div style={labelS}>Lejáró karbantartás</div>
          <a href="/maintenance" style={linkS}>Megtekintés →</a>
        </div>

        <div style={{ ...cardS, borderTop: "4px solid #ecc94b" }}>
          <div style={numS}>{stats.items}</div>
          <div style={labelS}>Raktári termék</div>
          <a href="/admin/items" style={linkS}>Raktár →</a>
        </div>
      </div>

      {/* RÖVID LISTA A LEJÁRÓKRÓL */}
      {upcoming.length > 0 && (
        <div style={{ background: "#fff5f5", padding: "15px", borderRadius: "12px", marginBottom: "25px", border: "1px solid #feb2b2" }}>
          <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#c53030" }}>⚠️ Legközelebbi határidők:</h3>
          {upcoming.map((u, i) => (
            <div key={i} style={{ fontSize: "14px", marginBottom: "5px", borderBottom: "1px solid #fed7d7", paddingBottom: "5px" }}>
              <strong>{new Date(u.maintenance[0].nextDue).toLocaleDateString('hu-HU')}</strong> - {u.client?.name} ({u.brand} {u.model})
            </div>
          ))}
        </div>
      )}

      {/* GYORSMŰVELETEK */}
      <div style={{ background: "white", padding: "20px", borderRadius: "15px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <button onClick={() => window.location.href = "/quotes/new"} style={btnS}>+ Új ajánlat</button>
          <button onClick={() => window.location.href = "/clients/new"} style={btnS}>+ Új ügyfél</button>
          <button onClick={() => window.location.href = "/admin/items"} style={{ ...btnS, background: "#ecc94b", color: "#000" }}>+ Termék</button>
        </div>
      </div>
    </div>
  );
}

const cardS = { background: "white", padding: "20px", borderRadius: "12px", textAlign: "center" as const, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderTop: "4px solid #0070f3" };
const numS = { fontSize: "32px", fontWeight: "900", color: "#2d3748", marginBottom: "5px" };
const labelS = { fontSize: "13px", color: "#718096", marginBottom: "15px", fontWeight: "bold" };
const linkS = { fontSize: "12px", color: "#0070f3", textDecoration: "none", fontWeight: "bold" };
const btnS = { padding: "12px 20px", background: "#2d3748", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" as const, fontSize: "14px" };
