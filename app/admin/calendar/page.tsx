"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mai nap meghatározása (formátum: YYYY-MM-DD)
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    fetch('/api/calendar')
      .then(res => res.json())
      .then(data => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(newDate);
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
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
          
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`empty-${i}`} style={emptyCell} />
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr);
            
            // Itt dől el, hogy ez a mai nap-e
            const isToday = dateStr === todayStr;

            return (
              <div key={day} style={{
                ...cellStyle,
                // Kiemelés, ha ma van
                border: isToday ? "2px solid #2ecc71" : "none",
                backgroundColor: isToday ? "#0a2a1a" : "#111",
                zIndex: isToday ? 1 : 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    ...dayNum, 
                    opacity: isToday ? 1 : 0.4, 
                    color: isToday ? "#2ecc71" : "#fff",
                    fontWeight: isToday ? "bold" : "normal"
                  }}>
                    {day}
                  </span>
                  {isToday && <span style={todayLabel}>MA</span>}
                </div>
                
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

// STÍLUSOK
const pageStyle: React.CSSProperties = { minHeight: "100vh", backgroundColor: "#000", color: "#fff", padding: "20px", fontFamily: "'Segoe UI', sans-serif" };
const headerStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", maxWidth: "1200px", margin: "0 auto 30px auto" };
const titleStyle: React.CSSProperties = { fontSize: "32px", fontWeight: "lighter", margin: 0 };
const backBtn: React.CSSProperties = { background: "none", border: "1px solid #fff", color: "#fff", padding: "8px 15px", cursor: "pointer", fontSize: "16px" };
const navBtns: React.CSSProperties = { display: "flex", gap: "5px" };
const navBtn: React.CSSProperties = { background: "#222", border: "none", color: "#fff", padding: "5px 15px", cursor: "pointer", fontSize: "24px", lineHeight: "1" };
const calendarGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", backgroundColor: "#333", border: "1px solid #333", maxWidth: "1200px", margin: "0 auto" };
const dayHeader: React.CSSProperties = { backgroundColor: "#111", padding: "10px", textAlign: "center", fontSize: "12px", color: "#888", fontWeight: "bold" };
const cellStyle: React.CSSProperties = { backgroundColor: "#111", minHeight: "100px", padding: "8px", display: "flex", flexDirection: "column", boxSizing: "border-box" };
const emptyCell: React.CSSProperties = { backgroundColor: "#050505" };
const dayNum: React.CSSProperties = { fontSize: "14px", marginBottom: "5px" };
const eventContainer: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "3px" };
const todayLabel: React.CSSProperties = { fontSize: "9px", color: "#2ecc71", fontWeight: "bold", border: "1px solid #2ecc71", padding: "1px 3px", borderRadius: "2px" };
const eventBadge: React.CSSProperties = { 
  backgroundColor: "#0078d7", 
  padding: "2px 5px", 
  fontSize: "11px", 
  overflow: "hidden", 
  textOverflow: "ellipsis", 
  whiteSpace: "nowrap",
  borderLeft: "3px solid #2ecc71" 
};
