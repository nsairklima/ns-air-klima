"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/calendar')
      .then(res => res.json())
      .then(data => {
        setEvents(data);
        setLoading(false);
      });
  }, []);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  const monthNames = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <button onClick={() => router.push("/")} style={backBtn}>←</button>
        <h1 style={titleStyle}>{monthNames[currentDate.getMonth()]} <span>{currentDate.getFullYear()}</span></h1>
        <div style={navBtns}>
          <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} style={navBtn}>‹</button>
          <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} style={navBtn}>›</button>
        </div>
      </header>

      {loading ? <p style={{textAlign: 'center'}}>Betöltés...</p> : (
        <div style={calendarGrid}>
          {["Hé", "Ke", "Sze", "Csü", "Pé", "Szo", "Va"].map(d => (
            <div key={d} style={dayHeader}>{d}</div>
          ))}
          
          {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} style={emptyCell} />)}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr);

            return (
              <div key={day} style={cellStyle}>
                <span style={dayNum}>{day}</span>
                {dayEvents.map(ev => (
                  <div key={ev.id} style={eventBadge}>
                    {ev.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// STÍLUSOK
const pageStyle: React.CSSProperties = { minHeight: "100vh", backgroundColor: "#000", color: "#fff", padding: "20px", fontFamily: "Segoe UI" };
const headerStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" };
const titleStyle: React.CSSProperties = { fontSize: "32px", fontWeight: "lighter", margin: 0 };
const backBtn: React.CSSProperties = { background: "none", border: "1px solid #fff", color: "#fff", padding: "10px 15px", cursor: "pointer" };
const navBtns: React.CSSProperties = { display: "flex", gap: "10px" };
const navBtn: React.CSSProperties = { background: "#333", border: "none", color: "#fff", padding: "10px 20px", cursor: "pointer", fontSize: "20px" };
const calendarGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", backgroundColor: "#333", border: "1px solid #333" };
const dayHeader: React.CSSProperties = { backgroundColor: "#111", padding: "10px", textAlign: "center", fontSize: "12px", color: "#888" };
const cellStyle: React.CSSProperties = { backgroundColor: "#111", minHeight: "120px", padding: "10px", display: "flex", flexDirection: "column", gap: "5px" };
const emptyCell: React.CSSProperties = { backgroundColor: "#000" };
const dayNum: React.CSSProperties = { fontSize: "14px", marginBottom: "5px", opacity: 0.5 };
const eventBadge: React.CSSProperties = { backgroundColor: "#0078d7", padding: "3px 6px", fontSize: "10px", borderRadius: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
