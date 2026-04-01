"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();

  const handleBackup = () => {
    // Ez a böngészőben közvetlenül meghívja a letöltő végpontot
    window.location.href = "/api/admin/backup";
  };

  return (
    <div style={{ padding: "40px 20px", maxWidth: "600px", margin: "0 auto", fontFamily: "sans-serif" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ margin: 0, fontSize: "24px", color: "#333" }}>⚙️ Adminisztráció</h1>
        <button 
          onClick={() => router.push("/")}
          style={{ padding: "8px 16px", cursor: "pointer", borderRadius: "8px", border: "1px solid #ccc", background: "#fff" }}
        >
          Főoldal
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        
        {/* --- MENTÉS SZEKCIÓ --- */}
        <div style={{ 
          padding: "20px", 
          background: "#f0fff4", 
          border: "2px solid #2ecc71", 
          borderRadius: "12px",
          textAlign: "center" 
        }}>
          <h3 style={{ marginTop: 0, color: "#27ae60" }}>🛡️ Adatbázis védelem</h3>
          <p style={{ fontSize: "14px", color: "#666" }}>Kattints a gombra a teljes mentés letöltéséhez (.json formátum)</p>
          
          <button 
            onClick={handleBackup}
            style={{
              width: "100%",
              padding: "15px",
              background: "#2ecc71",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "16px",
              marginTop: "10px"
            }}
          >
            📥 BIZTONSÁGI MENTÉS INDÍTÁSA
          </button>
        </div>

        {/* --- NAVIGÁCIÓS GOMBOK --- */}
        <button 
          onClick={() => router.push("/admin/items")}
          style={menuBtnS}
        >
          📦 Raktárkészlet kezelése
        </button>

        <button 
          onClick={() => router.push("/maintenance")}
          style={menuBtnS}
        >
          🗓️ Karbantartási ütemterv
        </button>

      </div>

      <p style={{ textAlign: "center", color: "#999", fontSize: "12px", marginTop: "40px" }}>
        NS-Air Klíma Rendszer v2.0
      </p>
    </div>
  );
}

const menuBtnS = {
  padding: "18px",
  fontSize: "16px",
  fontWeight: "bold" as const,
  cursor: "pointer",
  border: "1px solid #ddd",
  borderRadius: "10px",
  background: "#fff",
  textAlign: "left" as const,
  display: "block",
  width: "100%"
};
