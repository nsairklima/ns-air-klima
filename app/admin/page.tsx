"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [restoring, setRestoring] = useState(false);
  const [showRestoreArea, setShowRestoreArea] = useState(false);

  // Biztonsági mentés kezelő (Export emailbe)
  const handleBackup = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Biztonsági mentés indítása? Ennek eredményét emailben fogod megkapni.")) return;

    try {
      const response = await fetch(`/api/admin/backup?t=${Date.now()}`, {
        method: "POST",
      });

      if (response.ok) {
        alert("A mentés sikeresen elindult, nézd meg az emailed pár perc múlva!");
        setShowRestoreArea(true); // Aktiváljuk a visszaállító zónát hátha szükség van rá
      } else {
        alert("Hiba történt a mentés során.");
      }
    } catch (error) {
      alert("Hálózati hiba történt.");
    }
  };

  // Visszaállítás kezelő (Import JSON fájlból)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("⚠️ FIGYELEM!\nEz a művelet TELJESEN FELÜLÍRJA a jelenlegi adatbázist a fájlban lévő adatokkal!\n\nBiztosan folytatod?")) {
      e.target.value = "";
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
          setShowRestoreArea(false);
        } else {
          alert(`Hiba történt: ${data.error}`);
        }
      } catch (err) {
        alert("Hibás vagy sérült mentési fájl! Csak a letöltött .json fájllal működik.");
      } finally {
        setRestoring(false);
        e.target.value = "";
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
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>NS-AIR KÖZPONT</h1>
        <div style={onlineStatusStyle}>
          <span style={dotStyle}></span> ONLINE
        </div>
      </header>

      <div style={gridStyle}>
        
        {/* STATISZTIKA CSEMPE */}
        <div 
          onClick={() => router.push("/stats")}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          style={{ ...tileStyle, background: "#f39c12" }}
        >
          <span style={iconStyle}>📊</span>
          <div style={tileLabelStyle}>Statisztika</div>
          <span style={{ fontSize: "11px", opacity: 0.7 }}>Jelentések</span>
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
        </div>

        {/* AJÁNLATOK CSEMPE */}
        <div 
          onClick={() => router.push("/quotes")}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          style={{ ...tileStyle, background: "#00b0ff" }}
        >
          <span style={iconStyle}>📄</span>
          <div style={tileLabelStyle}>Ajánlatok</div>
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

        {/* MENTÉS CSEMPE (Itt nyitja meg a visszaállító panelt is másodlagos funkcióként) */}
        <div 
          onClick={handleBackup}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          onContextMenu={(e) => {
            e.preventDefault();
            setShowRestoreArea(!showRestoreArea); // Jobb klikkre vagy hosszú nyomásra is előjön a titkos panel
          }}
          style={{ ...tileStyle, background: "#2ecc71" }}
        >
          <span style={iconStyle}>🛡️</span>
          <div style={tileLabelStyle}>Mentés</div>
          <span style={{ fontSize: "11px", opacity: 0.7 }}>Mentés indítása / Visszatöltés</span>
        </div>

      </div>

      {/* INTELLIGENS ADATBÁZIS VISSZAÁLLÍTÓ PANEL */}
      {showRestoreArea && (
        <div style={restoreSectionStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#e74c3c" }}>
              ⚠️ Rendszer Visszaállítása Fájlból
            </h3>
            <button onClick={() => setShowRestoreArea(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "16px" }}>✕</button>
          </div>
          <p style={{ margin: "0 0 15px 0", fontSize: "13px", color: "#94a3b8", lineHeight: "1.4" }}>
            Válaszd ki az emailben kapott legutóbbi <code style={{ background: "#0f172a", padding: "2px 6px", borderRadius: 4, color: "#fff" }}>.json</code> mentési fájlt. A feltöltés teljesen felülírja a jelenlegi adatbázist!
          </p>
          
          <label style={{
            ...restoreBtnStyle,
            backgroundColor: restoring ? "#475569" : "#e74c3c",
            cursor: restoring ? "not-allowed" : "pointer"
          }}>
            {restoring ? "🔄 Visszaállítás folyamatban..." : "📂 Mentési JSON fájl betöltése..."}
            <input 
              type="file" 
              accept=".json" 
              onChange={handleFileChange} 
              disabled={restoring} 
              style={{ display: "none" }} 
            />
          </label>
        </div>
      )}

      <footer style={footerStyle}>
        NS-AIR KLÍMA RENDSZER v2.0 | 2026
      </footer>
    </div>
  );
}

// --- STÍLUSOK (IGAZÍTVA A KÉPEDHEZ) ---
const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#000",
  color: "#fff",
  fontFamily: "'Segoe UI', sans-serif",
  padding: "40px 20px",
  boxSizing: "border-box"
};

const headerStyle: React.CSSProperties = {
  maxWidth: "1100px",
  margin: "0 auto 30px auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const titleStyle: React.CSSProperties = {
  fontSize: "36px",
  fontWeight: "300",
  margin: 0,
  letterSpacing: "1px"
};

const onlineStatusStyle: React.CSSProperties = {
  border: "1px solid #2ecc71",
  color: "#2ecc71",
  padding: "4px 10px",
  borderRadius: "4px",
  fontSize: "11px",
  fontWeight: "bold",
  display: "flex",
  alignItems: "center",
  gap: "6px"
};

const dotStyle: React.CSSProperties = {
  width: "6px",
  height: "6px",
  backgroundColor: "#2ecc71",
  borderRadius: "50%",
  display: "inline-block"
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gridAutoRows: "160px",
  gap: "12px",
  maxWidth: "1100px",
  margin: "0 auto",
};

const tileStyle: React.CSSProperties = {
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const iconStyle: React.CSSProperties = {
  fontSize: "24px",
};

const tileLabelStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: "600",
};

const restoreSectionStyle: React.CSSProperties = {
  maxWidth: "1100px",
  margin: "25px auto 0 auto",
  background: "#111",
  border: "1px solid #e74c3c",
  padding: "20px",
  borderRadius: "4px",
  boxSizing: "border-box"
};

const restoreBtnStyle: React.CSSProperties = {
  display: "block",
  textAlign: "center",
  padding: "14px",
  color: "#fff",
  borderRadius: "4px",
  fontWeight: "bold",
  fontSize: "14px",
  transition: "background 0.2s"
};

const footerStyle: React.CSSProperties = {
  textAlign: "center",
  marginTop: "60px",
  fontSize: "12px",
  color: "#2ecc71",
  fontWeight: "bold",
  letterSpacing: "1px"
};
