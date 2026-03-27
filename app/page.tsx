"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function Dashboard() {
  const [stats, setStats] = useState({ totalClients: 0, totalUnits: 0, urgentCount: 0 });
  const [items, setItems] = useState<any[]>([]); // Termékek állapota

  useEffect(() => {
    // Statisztikák lekérése
    fetch("/api/stats")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Stats hiba:", err));

    // Termékek lekérése az adatbázisból
    fetch("/api/items")
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.error("Items hiba:", err));
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "Arial" }}>
      <h1>🛠️ Vezérlőpult</h1>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20, marginTop: 20 }}>
        
        <div style={cardS("#3498db")}>
          <span style={{fontSize: 40}}>👥</span>
          <h3>{stats.totalClients}</h3>
          <p>Összes ügyfél</p>
          <Link href="/clients" style={linkS}>Ügyfelek listája →</Link>
        </div>

        <div style={cardS("#2ecc71")}>
          <span style={{fontSize: 40}}>❄️</span>
          <h3>{stats.totalUnits}</h3>
          <p>Kezelt klímák</p>
        </div>

        {/* ÚJ KÁRTYA: Termékek száma az adatbázisból */}
        <div style={cardS("#f39c12")}>
          <span style={{fontSize: 40}}>📦</span>
          <h3>{items.length}</h3>
          <p>Regisztrált termék</p>
          <Link href="/admin/items" style={linkS}>Termékek kezelése →</Link>
        </div>

        <div style={cardS(stats.urgentCount > 0 ? "#e74c3c" : "#95a5a6")}>
          <span style={{fontSize: 40}}>⚠️</span>
          <h3>{stats.urgentCount}</h3>
          <p>Esedékes karbantartás</p>
          <Link href="/maintenance" style={linkS}>Megtekintés →</Link>
        </div>

      </div>

      {/* ÚJ SZEKCIÓ: Terméklista az adatbázisból */}
      <div style={{ marginTop: 40, padding: 20, background: "#fff", borderRadius: 12, border: "1px solid #eee", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
          <h2>📦 Aktuális termékkínálat</h2>
          <Link href="/admin/items" style={{ ...linkS, background: "#eee", padding: "5px 10px", borderRadius: "5px" }}>Szerkesztés</Link>
        </div>
        
        {items.length === 0 ? (
          <p style={{ color: "#7f8c8d" }}>Nincsenek termékek az adatbázisban.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 15 }}>
            {items.map((item) => (
              <div key={item.id} style={{ padding: 15, border: "1px solid #f0f0f0", borderRadius: 8, background: "#fafafa" }}>
                <div style={{ fontWeight: "bold", marginBottom: 5 }}>{item.name}</div>
                <div style={{ color: "#27ae60", fontWeight: "bold" }}>{item.price.toLocaleString()} Ft</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 40, padding: 20, background: "#f9f9f9", borderRadius: 12, border: "1px solid #eee" }}>
        <h2>Gyorsműveletek</h2>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <Link href="/quotes/new" style={btnS}>+ Új ajánlat készítése</Link>
          <Link href="/clients" style={btnS}>+ Új ügyfél rögzítése</Link>
          <Link href="/admin/items" style={{ ...btnS, background: "#f39c12" }}>+ Termék hozzáadása</Link>
        </div>
      </div>
    </div>
  );
}

// Stílusok maradnak változatlanok
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
