"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function GlobalMaintenancePage() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/maintenance")
      .then(res => res.json())
      .then(data => {
        setUnits(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{padding: 20}}>Betöltés...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto", fontFamily: "Arial" }}>
      <h1>🗓️ Esedékes Karbantartások</h1>
      <p style={{color: "#666"}}>Az alábbi gépeknél telt el (vagy telik le hamarosan) 1 év a legutóbbi tisztítás óta.</p>

      <div style={{ marginTop: 20, display: "grid", gap: 15 }}>
        {units.length === 0 && <p>Nincs esedékes karbantartás.</p>}
        {units.map((unit: any) => (
          <div key={unit.id} style={{ padding: 20, border: "1px solid #ddd", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff" }}>
            <div>
              <strong style={{fontSize: 18}}>{unit.client?.name}</strong>
              <div style={{color: "#e67e22", fontWeight: "bold"}}>
                {unit.brand} {unit.model} ({unit.location})
              </div>
              <div style={{fontSize: 14, color: "#888"}}>
                Utolsó karbantartás: {unit.maintenance[0] ? new Date(unit.maintenance[0].performedDate).toLocaleDateString('hu-HU') : "Nincs adat"}
              </div>
            </div>
            <button 
              onClick={() => router.push(`/clients/${unit.clientId}/unit/${unit.id}`)}
              style={{ background: "#3498db", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer" }}
            >
              Napló megnyitása →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
