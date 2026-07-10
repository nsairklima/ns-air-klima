"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MainDashboard() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Figyeljük a képernyőméretet a reszponzivitáshoz
  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 768);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // Biztonsági mentés kezelő (Export)
  const handleBackup = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Biztonsági mentés indítása? Ennek eredményét emailben fogod megkapni.")) return;
    try {
      const response = await fetch(`/api/admin/backup?t=${Date.now()}`, { method: "POST" });
      if (response.ok) alert("A mentés sikeresen elindult, nézd meg az emailed pár perc múlva!");
      else alert("Hiba történt a mentés során.");
    } catch (error) {
      alert("Hálózati hiba történt.");
    }
  };

  // ÚJ: Visszaállítás kezelő (Import JSON fájlból)
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

  // FIX: HTMLElement-re cserélve, így div és label felett is hiba nélkül működik
  const onEnter = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = "scale(0.97)";
    e.currentTarget.style.opacity = "0.9";
  };

  const onLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = "scale(1)";
    e.currentTarget.style.opacity = "1";
  };

  // Dinamikus Grid stílus
  const dynamicGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
    gridAutoRows: isMobile ? "120px" : "140px",
    gap: "10px",
    maxWidth: "1000px",
    margin: "0 auto",
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={{ ...titleStyle, fontSize: isMobile ? "24px" : "32px" }}>NS-AIR KÖZPONT</h1>
        <div style={statusDot}>Online</div>
      </header>

      <div style={dynamicGridStyle}>
        {/* STATISZTIKA */}
        <div onClick={() => router.push("/stats")} onMouseEnter={onEnter} onMouseLeave={onLeave} style={{ ...tileStyle, background: "#f39c12" }}>
          <span style={iconStyle}>📊</span>
          <div style={tileLabelStyle}>Statisztika</div>
          <span style={smallLabelStyle}>Jelentések</span>
        </div>

        {/* NAPTÁR */}
        <div onClick={() => router.push("/admin/calendar")} onMouseEnter={onEnter} onMouseLeave={onLeave} style={{ ...tileStyle, background: "#008272" }}>
          <span style={iconStyle}>📅</span>
          <div style={tileLabelStyle}>Naptár</div>
        </div>

        {/* ÁRAJÁNLATOK */}
        <div onClick={() => router.push("/quotes")} onMouseEnter={onEnter} onMouseLeave={onLeave} style={{ ...tileStyle, background: "#00bcf2" }}>
          <span style={iconStyle}>📄</span>
          <div style={tileLabelStyle}>Ajánlatok</div>
        </div>

        {/* RAKTÁR */}
        <div onClick={() => router.push("/admin/items")} onMouseEnter={onEnter} onMouseLeave={onLeave} style={{ ...tileStyle, background: "#0078d7" }}>
          <span style={iconStyle}>📦</span>
          <div style={tileLabelStyle}>Raktár</div>
        </div>

        {/* ÜTEMTERV */}
        <div onClick={() => router.push("/maintenance")} onMouseEnter={onEnter} onMouseLeave={onLeave} style={{ ...tileStyle, background: "#a4379f" }}>
          <span style={iconStyle}>🗓️</span>
          <div style={tileLabelStyle}>Ütemterv</div>
        </div>

        {/* ÜGYFELEK */}
        <div onClick={() => router.push("/clients")} onMouseEnter={onEnter} onMouseLeave={onLeave} style={{ ...tileStyle, background: "#d83b01" }}>
          <span style={iconStyle}>👥</span>
          <div style={tileLabelStyle}>Ügyfelek</div>
        </div>

        {/* BIZTONSÁGI MENTÉS */}
        <div onClick={handleBackup} onMouseEnter={onEnter} onMouseLeave={onLeave} style={{ ...tileStyle, background: "#2ecc71" }}>
          <span style={iconStyle}>🛡️</span>
          <div style={tileLabelStyle}>Mentés</div>
          <span style={smallLabelStyle}>Küldés emailben</span>
        </div>

        {/* ÚJ: VISSZAÁLLÍTÁS CSEMPE */}
        <label 
          onMouseEnter={onEnter} 
          onMouseLeave={onLeave} 
          style={{ 
            ...tileStyle, 
            background: restoring ? "#475569" : "#c0392b",
            cursor: restoring ? "not-allowed" : "pointer"
          }}
        >
          <span style={iconStyle}>⚠️</span>
          <div>
            <div style={tileLabelStyle}>{restoring ? "Visszaállítás..." : "Visszaállítás"}</div>
            <span style={smallLabelStyle}>JSON fájl betöltése</span>
          </div>
          <input 
            type="file" 
            accept=".json" 
            onChange={handleFileChange} 
            disabled={restoring} 
            style={{ display: "none" }} 
          />
        </label>
      </div>

      <footer style={footerContainer}>
        <div style={footerLine} />
        <p style={footerText}>NS-Air Klíma Rendszer v2.0 | 2026</p>
      </footer>
    </div>
  );
}

// ALAP STÍLUSOK
const containerStyle: React.CSSProperties = { minHeight: "100vh", backgroundColor: "#000", color: "#fff", fontFamily: "'Segoe UI', sans-serif", padding: "20px" };
const headerStyle: React.CSSProperties = { maxWidth: "1000px", margin: "0 auto 30px auto", display: "flex", justifyContent: "space-between", alignItems: "center" };
const titleStyle: React.CSSProperties = { fontWeight: "lighter", margin: 0 };
const statusDot: React.CSSProperties = { fontSize: "10px", color: "#2ecc71", textTransform: "uppercase", letterSpacing: "1px", border: "1px solid #2ecc71", padding: "2px 6px", borderRadius: "4px" };
const tileStyle: React.CSSProperties = { padding: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between", cursor: "pointer", transition: "all 0.2s ease", boxSizing: "border-box" };
const iconStyle: React.CSSProperties = { fontSize: "24px" };
const tileLabelStyle: React.CSSProperties = { fontSize: "15px", fontWeight: "600" };
const smallLabelStyle: React.CSSProperties = { fontSize: "10px", opacity: 0.7 };
const footerContainer: React.CSSProperties = { textAlign: "center", width: "100%", maxWidth: "1000px", margin: "60px auto 0 auto" };
const footerLine: React.CSSProperties = { height: "1px", background: "linear-gradient(90deg, transparent, #333, transparent)", marginBottom: "15px" };
const footerText: React.CSSProperties = { fontSize: "10px", color: "#2ecc71", fontWeight: "bold", letterSpacing: "1px", textTransform: "uppercase", margin: 0 };
