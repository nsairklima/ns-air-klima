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

  // Segédfüggvény a státusz meghatározásához
  const getStatus = (lastDateStr: string) => {
    if (!lastDateStr) return { label: "SOHA NEM VOLT", color: "#e74c3c", bg: "#fdf2f2" };
    
    const lastDate = new Date(lastDateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 365) return { label: "SÜRGŐS (LEJÁRT)", color: "#c0392b", bg: "#fceae8" };
    if (diffDays >= 330) return { label: "ESEDÉKES", color: "#d35400", bg: "#fff5e6" };
    return { label: "RENDBEN", color: "#27ae60", bg: "#f0fff4" };
  };

  if (loading) return <div style={{padding: 20}}>Betöltés...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto", fontFamily: "Arial" }}>
      <h1>🗓️ Karbantartási Ütemterv</h1>
      <p style={{color: "#666"}}>A rendszer 12 havonta javasolja a tisztítást.</p>

      <div style={{ marginTop: 20, display: "grid", gap: 15 }}>
        {units.length === 0 && <p>Nincs rögzített gép a rendszerben.</p>}
        {units.map((unit: any) => {
          const lastDate = unit.maintenance[0]?.performedDate;
          const status = getStatus(lastDate);

          return (
            <div key={unit.id} style={{ 
              padding: 20, 
              border: `1px solid ${status.color}`, 
              borderRadius: 12, 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              background: status.bg,
              transition: "transform 0.2s"
            }}>
              <div>
                <span style={{ 
                  fontSize: 10, 
                  fontWeight: "bold", 
                  background: status.color, 
                  color: "#fff", 
                  padding: "3px 8px", 
                  borderRadius: 4,
                  verticalAlign: "middle"
                }}>
                  {status.label}
                </span>
                <div style={{marginTop: 8}}>
                  <strong style={{fontSize: 20}}>{unit.client?.name}</strong>
                </div>
                <div style={{color: "#34495e", fontWeight: "bold", marginTop: 4}}>
                  {unit.brand} {unit.model} — {unit.location}
                </div>
                <div style={{fontSize: 13, color: "#7f8c8d", marginTop: 4}}>
                  Utolsó alkalom: {lastDate ? new Date(lastDate).toLocaleDateString('hu-HU') : "Nincs adat"}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <button 
                  onClick={() => router.push(`/clients/${unit.clientId}/unit/${unit.id}`)}
                  style={{ 
                    background: status.color, 
                    color: "#fff", 
                    border: "none", 
                    padding: "12px 20px", 
                    borderRadius: 8, 
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  Napló / Mentés →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
