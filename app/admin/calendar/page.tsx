"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<any[]>([]);

  // Itt töltenénk be az adatokat az API-ból
  useEffect(() => {
    // Példa adat, amíg nincs kész az API hívás
    setTasks([
      { date: "2026-04-22", title: "Kovácsék - Klíma tisztítás", color: "#0078d7" },
      { date: "2026-04-25", title: "NS-Air Iroda telepítés", color: "#d83b01" },
    ]);
  }, []);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  // Magyar napnevek (Hétfővel kezdve, korrigálva a JS vasárnapi kezdését)
  const days = ["Hé", "Ke", "Sze", "Csü", "Pé", "Szo", "Va"];
  const monthNames = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];

  const renderCells = () => {
    const cells = [];
    const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Hétfőre igazítás

    for (let i = 0; i < offset; i++) {
      cells.push(<div key={`empty-${i}`} style={emptyCellStyle}></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTasks = tasks.filter(t => t.date === dateStr);

      cells.push(
        <div key={d} style={dayTasks.length > 0 ? { ...cellStyle, borderLeft: "4px solid #2ecc71" } : cellStyle}>
          <span style={dayNumberStyle}>{d}</span>
          {dayTasks.map((t, idx) => (
            <div key={idx} style={{ ...taskBadgeStyle, backgroundColor: t.color }}>{t.title}</div>
          ))}
        </div>
      );
    }
    return cells;
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>{monthNames[currentDate.getMonth()]}</h1>
          <p style={{ opacity: 0.6 }}>{currentDate.getFullYear()}</p>
        </div>
        <button onClick={() => router.push("/admin")} style={backButtonStyle}>Vissza</button>
      </header>

      <div style={calendarGrid}>
        {days.map(d => <div key={d} style={dayHeaderStyle}>{d}</div>)}
        {renderCells()}
      </div>
    </div>
  );
}

// --- STÍLUSOK ---
const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#000",
  color: "#fff",
  padding: "40px 20px",
  fontFamily: "Segoe UI, sans-serif"
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  maxWidth: "1000px",
  margin: "0 auto 30px auto"
};

const titleStyle: React.CSSProperties = { fontSize: "48px", fontWeight: "lighter", margin: 0 };

const backButtonStyle: React.CSSProperties = {
  background: "transparent", border: "2px solid #fff", color: "#fff", padding: "8px 20px", cursor: "pointer"
};

const calendarGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: "2px",
  backgroundColor: "#333",
  maxWidth: "1000px",
  margin: "0 auto",
  border: "2px solid #333"
};

const dayHeaderStyle: React.CSSProperties = {
  padding: "10px", textAlign: "center", fontWeight: "bold", backgroundColor: "#111", fontSize: "14px"
};

const cellStyle: React.CSSProperties = {
  minHeight: "100px", backgroundColor: "#1a1a1a", padding: "8px", position: "relative"
};

const emptyCellStyle: React.CSSProperties = { backgroundColor: "#000" };

const dayNumberStyle: React.CSSProperties = { fontSize: "18px", opacity: 0.5 };

const taskBadgeStyle: React.CSSProperties = {
  fontSize: "10px", padding: "2px 5px", marginTop: "5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
};
