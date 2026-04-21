"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // API hívás az adatokért
    fetch('/api/calendar')
      .then(res => res.json())
      .then(data => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Hónap váltása fixálva (tiszta új dátum objektum létrehozása)
  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(newDate);
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  
  // Hétfői kezdés kiszámítása
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  const monthNames = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <button onClick={() => router.push("/")} style={backBtn}>←</button>
        <h1 style={titleStyle}>
          {monthNames[currentDate.getMonth()]} <span style={{ opacity: 0.5 }}>{currentDate.getFullYear()}</span>
        </h1>
        <div style={navBtns}>
          <button onClick={() => changeMonth(-1)} style={navBtn}>‹</button>
          <button onClick={() => changeMonth(1)} style={navBtn}>›</button>
        </div>
      </header>

      {loading ? (
        <p style={{ textAlign: 'center', marginTop: '50px', opacity: 0.5 }}>Betöltés...</p>
      ) : (
        <div style={calendarGrid}>
          {["Hé", "Ke", "Sze", "Csü", "Pé", "Szo", "Va"].map(d => (
            <div key={d} style={dayHeader}>{d}</div>
          ))}
          
          {/* Üres napok a hónap előtt */}
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`empty-${i}`} style={emptyCell} />
          ))}
          
          {/* Napok kirajzolása */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr);

            return (
              <div key={day} style={cellStyle}>
                <span style={dayNum}>{day}</span>
                <div style={eventContainer}>
                  {dayEvents.map((ev, idx) => (
                    <div key={ev.id || idx} style={eventBadge} title={ev.title}>
                      {ev.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// STÍLUSOK (Tisztított és optimalizált)
const pageStyle: React.CSSProperties = { minHeight: "100vh", backgroundColor: "#000", color: "#fff", padding: "20px", fontFamily: "'Segoe UI', sans-serif" };
const headerStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", maxWidth: "1200px", margin: "0 auto 30px auto" };
const titleStyle: React.CSSProperties = { fontSize: "32px", fontWeight: "lighter", margin: 0 };
const backBtn: React.CSSProperties = { background: "none", border: "1px solid #fff", color: "#fff", padding: "8px 15px", cursor: "pointer", fontSize: "16px" };
const navBtns: React.CSSProperties = { display: "flex", gap: "5px" };
const navBtn: React.CSSProperties = { background: "#222", border: "none", color: "#fff", padding: "5px 15px", cursor: "pointer", fontSize: "24px", lineHeight: "1" };
const calendarGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", backgroundColor: "#333", border: "1px solid #333", maxWidth: "1200px", margin: "0 auto" };
const dayHeader: React.CSSProperties = { backgroundColor: "#111", padding: "10px", textAlign: "center", fontSize: "12px", color: "#888", fontWeight: "bold" };
const cellStyle: React.CSSProperties = { backgroundColor: "#111", minHeight: "100px", padding: "8px", display: "flex", flexDirection: "column" };
const emptyCell: React.CSSProperties = { backgroundColor: "#050505" };
const dayNum: React.CSSProperties = { fontSize: "14px", marginBottom: "5px", opacity: 0.4 };
const eventContainer: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "3px" };
const eventBadge: React.CSSProperties = { 
  backgroundColor: "#0078d7", 
  padding: "2px 5px", 
  fontSize: "11px", 
  borderRadius: "0px", // Windows stílushoz jobb a szögletes
  overflow: "hidden", 
  textOverflow: "ellipsis", 
  whiteSpace: "nowrap",
  borderLeft: "3px solid #2ecc71" // Egy kis extra díszítés a munkáknak
};
