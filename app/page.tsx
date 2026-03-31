"use client";

import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState({ items: 0, clients: 0, maintenanceCount: 0 });
  const [upcoming, setUpcoming] = useState<any[]>([]);

  useEffect(() => {
    // 1. Raktárkészlet lekérése
    fetch("/api/items").then(res => res.json()).then(data => {
      if (Array.isArray(data)) setStats(s => ({ ...s, items: data.length }));
    });

    // 2. Ügyfelek lekérése
    fetch("/api/clients").then(res => res.json()).then(data => {
      if (Array.isArray(data)) setStats(s => ({ ...s, clients: data.length }));
    });

    // 3. Karbantartások lekérése és okos szűrése
    fetch("/api/maintenance").then(res => res.json()).then(data => {
      if (Array.isArray(data)) {
        const today = new Date();
        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(today.getDate() + 60);

        const dueSoon = data.map(unit => {
          const lastLog = unit.maintenance && unit.maintenance[0];
          let calculatedDueDate: Date | null = null;

          // Dátum meghatározása prioritás szerint:
          if (lastLog?.nextDue) {
            // 1. Kézzel megadott következő időpont
            calculatedDueDate = new Date(lastLog.nextDue);
          } else if (lastLog?.performedDate) {
            // 2. Utolsó karbantartás + periódus hónapok
            calculatedDueDate = new Date(lastLog.performedDate);
            calculatedDueDate.setMonth(calculatedDueDate.getMonth() + (unit.periodMonths || 12));
          } else if (unit.installation) {
            // 3. Telepítés dátuma + periódus hónapok
            calculatedDueDate = new Date(unit.installation);
            calculatedDueDate.setMonth(calculatedDueDate.getMonth() + (unit.periodMonths || 12));
          }

          return { ...unit, calculatedDueDate };
        }).filter(unit => {
          // Csak azokat hagyjuk meg, amik 60 napon belül esedékesek vagy már lejártak
          return unit.calculatedDueDate && unit.calculatedDueDate <= sixtyDaysFromNow;
        });

        // Rendezés: a legrégebbi (legsürgősebb) legyen elöl
        dueSoon.sort((a, b) => a.calculatedDueDate!.getTime() - b.calculatedDueDate!.getTime());

        setStats(s => ({ ...s, maintenanceCount: dueSoon.length }));
        setUpcoming(dueSoon);
      }
    }).catch(err => console.error("API Hiba:", err));
  }, []);

  return (
    <div style={{ padding: "15px", maxWidth: "900px", margin: "0 auto", fontFamily: "sans-serif", backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      
      <h1 style={{ fontSize: "22px", marginBottom: "20px", fontWeight: "800", color: "#1a202c" }}>📊 NS-AIR Vezérlő</h1>

      {/* STATISZTIKA */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
        <div style={{ ...cardS, borderLeft: "5px solid #0070f3" }}>
          <div style={labelS}>Ügyfelek</div>
          <div style={numS}>{stats.clients}</div>
          <a href="/clients" style={linkS}>Megnyitás →</a>
        </div>
        <div style={{ ...cardS, borderLeft: stats.maintenanceCount > 0 ? "5px solid #e53e3e" : "5px solid #718096" }}>
          <div style={labelS}>Esedékes karbantartás</div>
          <div style={{ ...numS, color: stats.maintenanceCount > 0 ? "#e53e3e" : "#2d3748" }}>{stats.maintenanceCount}</div>
          <a href="/maintenance" style={linkS}>Lista →</a>
        </div>
      </div>

      {/* RAKTÁR KÁRTYA */}
      <div style={{ ...cardS, marginBottom: "20px", borderLeft: "5px solid #ecc94b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
           <div style={labelS}>Raktárkészlet</div>
           <div style={numS}>{stats.items} tétel</div>
        </div>
        <a href="/admin/items" style={{ ...linkS, padding: "10px 20px", background: "#ecc94b", color: "#000", borderRadius: "8px" }}>Kezelés</a>
      </div>

      {/* FIGYELMEZTETŐ LISTA */}
      {upcoming.length > 0 && (
        <div style={{ background: "white", padding: "15px", borderRadius: "12px", marginBottom: "20px", border: "1px solid #e53e3e", boxShadow: "0 4px 6px rgba(229, 62, 62, 0.1)" }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "#e53e3e", fontWeight: "bold" }}>⚠️ SÜRGŐS / ESEDÉKES:</h3>
          {upcoming.map((u, i) => {
            const date = u.calculatedDueDate;
            const isOverdue = date < new Date();
            return (
              <div key={i} style={{ padding: "10px 0", borderBottom: i === upcoming.length - 1 ? "none" : "1px solid #edf2f7", display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>{u.client?.name || "Ismeretlen"}</div>
                  <div style={{ fontSize: "12px", color: "#718096" }}>{u.brand} {u.model}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: "bold", color: isOverdue ? "#e53e3e" : "#2d3748", fontSize: "13px" }}>
                    {date.toLocaleDateString('hu-HU')}
                  </div>
                  <div style={{ fontSize: "10px", color: isOverdue ? "#e53e3e" : "#38a169" }}>
                    {isOverdue ? "LEJÁRT!" : "Hamarosan"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* GYORS GOMBOK ALUL */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <button onClick={() => window.location.href = "/quotes/new"} style={actionBtnS}>+ Új ajánlat</button>
        <button onClick={() => window.location.href = "/clients/new"} style={actionBtnS}>+ Új ügyfél</button>
      </div>
    </div>
  );
}

const cardS = { background: "white", padding: "15px", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" };
const numS = { fontSize: "24px", fontWeight: "900", color: "#2d3748" };
const labelS = { fontSize: "12px", color: "#718096", fontWeight: "bold", textTransform: "uppercase" as const, marginBottom: "5px" };
const linkS = { fontSize: "13px", color: "#0070f3", textDecoration: "none", fontWeight: "bold", marginTop: "10px", display: "inline-block" };
const actionBtnS = { padding: "15px", background: "#2d3748", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" as const, fontSize: "14px" };
