"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import PasswordGuard from "@/components/PasswordGuard";

export default function AdminDashboard() {
  const router = useRouter();
  const [restoring, setRestoring] = useState(false);

  // Biztonsági mentés kezelő (Export)
  const handleBackup = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Biztonsági mentés indítása? Ennek eredményét emailben fogod megkapni.")) return;

    try {
      const response = await fetch(`/api/admin/backup?t=${Date.now()}`, {
        method: "POST",
      });

      if (response.ok) {
        alert("A mentés sikeresen elindult, nézd meg az emailed pár perc múlva!");
      } else {
        alert("Hiba történt a mentés során.");
      }
    } catch (error) {
      alert("Hálózati hiba történt.");
    }
  };

  // Visszaállítás kezelő (Import fájlból)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("⚠️ FIGYELEM!\nEz a művelet TELJESEN FELÜLÍRJA a jelenlegi adatbázist a fájlban lévő adatokkal!\n\nBiztosan folytatod?")) {
      e.target.value = ""; // Resetelési kísérlet
      return;
    }

    setRestoring(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result as string);
        
        const res = await fetch("/api/admin/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json),
        });

        const data = await res.json();

        if (res.ok) {
          alert("🎉 SIKER!\nAz adatbázis visszaállítása tökéletesen lezajlott!");
        } else {
          alert(`Hiba történt: ${data.error}`);
        }
      } catch (err) {
        alert("Hibás vagy sérült mentési fájl! Csak a letöltött .json fájllal működik.");
      } finally {
        setRestoring(false);
        e.target.value = ""; // Mező kiürítése
      }
    };

    reader.readAsText(file);
  };

  const onEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "scale(0.97)";
    e.currentTarget.style.opacity = "0.9";
  };

  const onLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "scale(1)";
    e.currentTarget.style.opacity = "1";
  };

  return (
    <PasswordGuard moduleKey="MASTER">
      <div style={containerStyle}>
        <header style={headerStyle}>
          <h1 style={titleStyle}>NS-AIR ADMIN</h1>
          <button onClick={() => router.push("/")} style={homeButtonStyle}>
            főoldal
          </button>
        </header>

        <div style={gridStyle}>
          {/* MENTÉS CSEMPE */}
          <div 
            onClick={handleBackup}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            style={{ ...tileStyle, background: "#2ecc71", gridColumn: "span 2" }}
          >
            <span style={iconStyle}>🛡️</span>
            <div style={tileLabelStyle}>Rendszerjelentés</div>
            <span style={{ fontSize: "12px", opacity: 0.8 }}>Adatbázis mentés küldése</span>
          </div>

          {/* NAPTÁR CSEMPE */}
          <div 
            onClick={() => router.push("/admin/calendar")}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            style={{ ...tileStyle, background: "#008272" }}
          >
            <span style={iconStyle}>📅</span>
            <div style={tileLabelStyle}>Naptár</div>
            <span style={{ fontSize: "11px", opacity: 0.7 }}>Munkaterv</span>
          </div>

          {/* RAKTÁR CSEMPE */}
          <div 
            onClick={() => router.push("/admin/items")}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            style={{ ...tileStyle, background: "#0078d7" }}
          >
            <span style={iconStyle}>📦</span>
            <div style={tileLabelStyle}>Raktár</div>
          </div>

          {/* ÜTEMTERV CSEMPE */}
          <div 
            onClick={() => router.push("/maintenance")}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            style={{ ...tileStyle, background: "#a4379f" }}
          >
            <span style={iconStyle}>🗓️</span>
            <div style={tileLabelStyle}>Ütemterv</div>
          </div>

          {/* ÜGYFELEK CSEMPE */}
          <div 
            onClick={() => router.push("/clients")}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            style={{ ...tileStyle, background: "#d83b01" }}
          >
            <span style={iconStyle}>👥</span>
            <div style={tileLabelStyle}>Ügyfelek</div>
          </div>
        </div>

        {/* ÚJ: DOKUMENTUM / ADATBÁZIS VISSZAÁLLÍTÓ ZÓNA */}
        <div style={restoreSectionStyle}>
          <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "bold", color: "#e74c3c" }}>
            ⚠️ Adatbázis Visszaállítása Fájlból
          </h3>
          <p style={{ margin: "0 0 15px 0", fontSize: "13px", color: "#94a3b8", lineHeight: "1.4" }}>
            Töltsd fel az emailben kapott legutóbbi <code style={{ background: "#0f172a", padding: "2px 6px", borderRadius: 4, color: "#fff" }}>.json</code> kiterjesztésű mentési fájlt a teljes visszaállításhoz.
          </p>
          
          <label style={{
            ...restoreBtnStyle,
            backgroundColor: restoring ? "#475569" : "#e74c3c",
            cursor: restoring ? "not-allowed" : "pointer"
          }}>
            {restoring ? "🔄 Visszaállítás folyamatban..." : "📂 Mentési fájl kijelölése..."}
            <input 
              type="file" 
              accept=".json" 
              onChange={handleFileChange} 
              disabled={restoring} 
              style={{ display: "none" }} 
            />
          </label>
        </div>

        <footer style={footerStyle}>
          NS-Air Klíma Rendszer v2.0 | 2026
        </footer>
      </div>
    </PasswordGuard>
  );
}

// --- STÍLUSOK ---
const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#000",
  color: "#fff",
  fontFamily: "'Segoe UI', sans-serif",
  padding: "40px 20px",
};

const headerStyle: React.CSSProperties = {
  maxWidth: "800px",
  margin: "0 auto 40px auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const titleStyle: React.CSSProperties = {
  fontSize: "32px",
  fontWeight: "lighter",
  margin: 0,
};

const homeButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #fff",
  color: "#fff",
  padding: "5px 15px",
  cursor: "pointer",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gridAutoRows: "140px",
  gap: "10px",
  maxWidth: "800px",
  margin: "0 auto",
};

const tileStyle: React.CSSProperties = {
  padding: "15px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const iconStyle: React.CSSProperties = {
  fontSize: "28px",
};

const tileLabelStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: "600",
};

const restoreSectionStyle: React.CSSProperties = {
  maxWidth: "800px",
  margin: "30px auto 0 auto",
  background: "#1e293b",
  border: "1px solid #334155",
  padding: "20px",
  borderRadius: "12px",
  boxSizing: "border-box"
};

const restoreBtnStyle: React.CSSProperties = {
  display: "block",
  textAlign: "center",
  padding: "12px",
  color: "#fff",
  borderRadius: "8px",
  fontWeight: "bold",
  fontSize: "14px",
  transition: "background 0.2s"
};

const footerStyle: React.CSSProperties = {
  textAlign: "center",
  marginTop: "50px",
  fontSize: "11px",
  color: "#444",
};
