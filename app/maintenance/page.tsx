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
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      
      {/* --- ÚJ VISSZA GOMB --- */}
      <div style={{ marginBottom: "20px" }}>
        <button 
          onClick={() => router.push("/")} 
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            border: "1px solid #ddd",
            background: "#fff",
            cursor: "pointer",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
          }}
        >
          🏠 Főoldal
        </button>
      </div>

      <h1 style={{ marginBottom: "10px" }}>🗓️ Karbantartási Ütemterv</h1>
      <p style={{color: "#666", marginBottom: "30px"}}>A rendszer 12 havonta javasolja a tisztítást.</p>

      <div style={{ display: "grid", gap: 15 }}>
        {units.length === 0 && <p>Nincs rögzített gép a rendszerben.</p>}
        {units.map((unit: any) => {
          const lastDate = unit.maintenance?.[0]?.performedDate;
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
              boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
            }}>
              <div>
                <span style={{ 
                  fontSize: 10, 
                  fontWeight: "bold", 
                  background: status.color, 
                  color: "#fff", 
                  padding: "3px 8px", 
                  borderRadius: 4,
                  verticalAlign: "middle",
                  textTransform: "uppercase"
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
                    fontWeight: "bold",
                    transition: "opacity 0.2s"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = "0.8"}
                  onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
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
