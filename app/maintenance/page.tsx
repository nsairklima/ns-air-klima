"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function GlobalMaintenancePage() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  // Mobilnézet figyelése
  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 768);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // Telepítési dátum lekérése a Prisma séma alapján (unit.installation)
  const getInstallDate = (unit: any) => {
    return unit?.installation || null;
  };

  // Mértékadó dátum (karbantartás, ennek hiányában telepítés)
  const getReferenceDate = (unit: any) => {
    const lastMaintenance = unit.maintenance?.[0]?.performedDate;
    if (lastMaintenance) return lastMaintenance;
    return getInstallDate(unit);
  };

  useEffect(() => {
    fetch("/api/maintenance")
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          setUnits([]);
          setLoading(false);
          return;
        }

        // 1. Csak az ügyfélhez rendelt gépek
        const clientUnits = data.filter((u: any) => u.clientId || u.client);

        // 2. Rendezés a mértékadó dátum szerint növekvő sorrendben
        const sortedData = [...clientUnits].sort((a: any, b: any) => {
          const refA = getReferenceDate(a);
          const refB = getReferenceDate(b);

          const timeA = refA ? new Date(refA).getTime() : 0;
          const timeB = refB ? new Date(refB).getTime() : 0;

          return timeA - timeB;
        });

        setUnits(sortedData);
        setLoading(false);
      });
  }, []);

  // Státusz kiszámítása
  const getStatus = (refDateStr: string | null) => {
    if (!refDateStr) return { label: "NINCS DÁTUM", color: "#e74c3c", bg: "#fdf2f2" };

    const refDate = new Date(refDateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - refDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 365) return { label: "SÜRGŐS (LEJÁRT)", color: "#c0392b", bg: "#fceae8" };
    if (diffDays >= 330) return { label: "ESEDÉKES", color: "#d35400", bg: "#fff5e6" };
    return { label: "RENDBEN", color: "#27ae60", bg: "#f0fff4" };
  };

  if (loading) return <div style={{ padding: 20, color: "#fff" }}>Betöltés...</div>;

  return (
    <div style={{ padding: isMobile ? "12px" : "24px", maxWidth: 1000, margin: "0 auto", fontFamily: "Arial, sans-serif", boxSizing: "border-box" }}>
      
      {/* Vissza gomb */}
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

      <h1 style={{ marginBottom: "5px", fontSize: isMobile ? "1.5rem" : "2rem" }}>🗓️ Karbantartási Ütemterv</h1>
      <p style={{ color: "#666", marginBottom: "25px", fontSize: "14px" }}>A rendszer 12 havonta javasolja a tisztítást (utolsó karbantartás vagy telepítés óta).</p>

      <div style={{ display: "grid", gap: 12 }}>
        {units.length === 0 && <p style={{ color: "#fff" }}>Nincs ügyfélhez rendelt gép a rendszerben.</p>}
        {units.map((unit: any) => {
          const lastMaintenanceDate = unit.maintenance?.[0]?.performedDate;
          const installDate = getInstallDate(unit);
          const refDate = getReferenceDate(unit);
          const status = getStatus(refDate);

          return (
            <div 
              key={unit.id} 
              style={{ 
                padding: isMobile ? "14px" : "20px", 
                border: `1px solid ${status.color}`, 
                borderRadius: 12, 
                display: "flex", 
                flexDirection: isMobile ? "column" : "row", 
                justifyContent: "space-between", 
                alignItems: isMobile ? "stretch" : "center", 
                background: status.bg,
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                gap: "14px",
                boxSizing: "border-box"
              }}
            >
              <div>
                <span style={{ 
                  fontSize: 9, 
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

                {/* ÜGYFÉL NEVE — Kattintható hivatkozásként az ügyfél adatlapjára */}
                <div style={{ marginTop: 6 }}>
                  <strong 
                    onClick={() => router.push(`/clients/${unit.clientId}`)}
                    style={{ 
                      fontSize: isMobile ? "18px" : "20px",
                      cursor: "pointer",
                      color: "#1a0dab",
                      textDecoration: "underline",
                      textUnderlineOffset: "3px"
                    }}
                    title="Ugrás az ügyfél adatlapjára"
                  >
                    {unit.client?.name || "Ismeretlen ügyfél"}
                  </strong>
                </div>

                <div style={{ color: "#34495e", fontWeight: "bold", marginTop: 4, fontSize: isMobile ? "14px" : "15px" }}>
                  {unit.brand} {unit.model} — {unit.location}
                </div>

                {/* DÁTUMOK MEGJELENÍTÉSE */}
                <div style={{ fontSize: "12px", color: "#444", marginTop: 8, display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div>
                    📦 Telepítés dátuma: <strong>{installDate ? new Date(installDate).toLocaleDateString('hu-HU') : "Nincs megadva"}</strong>
                  </div>
                  <div>
                    🔧 Utolsó karbantartás: <strong>{lastMaintenanceDate ? new Date(lastMaintenanceDate).toLocaleDateString('hu-HU') : "Még nem volt karbantartva"}</strong>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: isMobile ? "left" : "right" }}>
                <button 
                  onClick={() => router.push(`/clients/${unit.clientId}/unit/${unit.id}`)}
                  style={{ 
                    background: status.color, 
                    color: "#fff", 
                    border: "none", 
                    padding: isMobile ? "14px" : "12px 20px", 
                    borderRadius: 8, 
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "14px",
                    width: isMobile ? "100%" : "auto",
                    transition: "opacity 0.2s",
                    boxSizing: "border-box",
                    textAlign: "center"
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
