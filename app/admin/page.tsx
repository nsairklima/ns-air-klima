"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();

  const handleBackup = () => {
    // Ez megnyitja az API végpontot, ami elindítja a letöltést
    window.location.href = "/api/admin/backup";
  };

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      
      {/* Vissza gomb a főoldalra */}
      <button 
        onClick={() => router.push("/")}
        style={{ marginBottom: "20px", padding: "8px 15px", cursor: "pointer", borderRadius: "8px", border: "1px solid #ddd" }}
      >
        🏠 Főoldal
      </button>

      <h1 style={{ color: "#2c3e50" }}>🛠️ Adminisztrációs Felület</h1>
      
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr 1fr", 
        gap: "15px", 
        marginTop: "30px",
        padding: "20px",
        background: "#f8f9fa",
        borderRadius: "12px"
      }}>
        
        {/* --- MENTÉS GOMB --- */}
        <div style={{ gridColumn: "span 2", padding: "15px", background: "#e8f5e9", borderRadius: "10px", border: "1px solid #c8e6c9", marginBottom: "10px" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#2e7d32" }}>🛡️ Adatbiztonság</h3>
          <p style={{ fontSize: "13px", color: "#666", marginBottom: "15px" }}>
            Töltsd le az összes ügyfél, gép és karbantartási napló adatait egyetlen fájlban.
          </p>
          <button 
            onClick={handleBackup}
            style={{
              width: "100%",
              padding: "12px",
              background: "#2ecc71",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
          >
            📥 Teljes adatbázis mentése (.json)
          </button>
        </div>

        {/* Itt vannak a korábbi gombjaid (Raktár, Ütemterv, stb.) */}
        <button onClick={() => router.push("/admin/items")} style={menuBtnS}>📦 Raktár kezelése</button>
        <button onClick={() => router.push("/maintenance")} style={menuBtnS}>🗓️ Ütemterv megnyitása</button>
      </div>
    </div>
  );
}

const menuBtnS = {
  padding: "20px",
  fontSize: "16px",
  fontWeight: "bold" as const,
  cursor: "pointer",
  border: "1px solid #ddd",
  borderRadius: "10px",
  background: "#fff",
  transition: "all 0.2s"
};
