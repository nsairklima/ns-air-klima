"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Új bejegyzés állapota
  const [showModal, setShowModal] = useState(false);
  const [newEntry, setNewEntry] = useState({ unitId: "", date: "", desc: "" });

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const fetchEvents = () => {
    fetch('/api/calendar')
      .then(res => res.json())
      .then(data => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSave = async () => {
    if (!newEntry.unitId || !newEntry.date) return alert("Ki kell választani egy egységet és dátumot!");
    
    const res = await fetch('/api/calendar', {
      method: 'POST',
      body: JSON.stringify({
        unitId: newEntry.unitId,
        performedDate: newEntry.date,
        description: newEntry.desc
      }),
    });

    if (res.ok) {
      setShowModal(false);
      fetchEvents(); // Lista frissítése
    } else {
      alert("Hiba történt a mentéskor.");
    }
  };

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
          <button onClick={() => setShowModal(true)} style={addBtn}>+ Új bejegyzés</button>
          <button onClick={() => changeMonth(-1)} style={navBtn}>‹</button>
          <button onClick={() => changeMonth(1)} style={navBtn}>›</button>
        </div>
      </header>

      {/* MODAL / ŰRLAP */}
      {showModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2 style={{marginTop: 0}}>Új naptárbejegyzés</h2>
            <label style={labelStyle}>Egység ID (Unit ID):</label>
            <input type="number" style={inputStyle} onChange={e => setNewEntry({...newEntry, unitId: e.target.value})} />
            
            <label style={labelStyle}>Dátum:</label>
            <input type="date" style={inputStyle} onChange={e => setNewEntry({...newEntry, date: e.target.value})} />
            
            <label style={labelStyle}>Leírás:</label>
            <textarea style={inputStyle} onChange={e => setNewEntry({...newEntry, desc: e.target.value})} />
            
            <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
              <button onClick={handleSave} style={{...navBtn, background: '#2ecc71', flex: 1}}>Mentés</button>
              <button onClick={() => setShowModal(false)} style={{...navBtn, background: '#e74c3c', flex: 1}}>Mégse</button>
            </div>
          </div>
        </div>
      )}

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
            const isToday = dateStr === todayStr;

            return (
              <div key={day} 
                onClick={() => { setNewEntry({...newEntry, date: dateStr}); setShowModal(true); }}
                style={{
                  ...cellStyle,
                  border: isToday ? "2px solid #2ecc71" : "none",
                  backgroundColor: isToday ? "#0a2a1a" : "#111",
                  cursor: 'pointer'
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{...dayNum, color: isToday ? "#2ecc71" : "#fff", fontWeight: isToday ? "bold" : "normal"}}>
                    {day}
                  </span>
                </div>
                <div style={eventContainer}>
                  {dayEvents.map((ev, idx) => (
                    <div key={ev.id || idx} style={eventBadge}>{ev.title}</div>
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

// ÚJ STÍLUSOK A MODALHOZ
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 };
const modalContent: React.CSSProperties = { background: '#111', padding: '20px', border: '1px solid #333', width: '300px', display: 'flex', flexDirection: 'column' };
const inputStyle: React.CSSProperties = { background: '#222', border: '1px solid #444', color: '#fff', padding: '8px', marginBottom: '10px' };
const labelStyle: React.CSSProperties = { fontSize: '12px', marginBottom: '4px', opacity: 0.7 };
const addBtn: React.CSSProperties = { background: '#2ecc71', border: 'none', color: '#fff', padding: '5px 15px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px' };

// (A többi stílusod változatlan...)
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
const eventBadge: React.CSSProperties = { backgroundColor: "#0078d7", padding: "2px 5px", fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderLeft: "3px solid #2ecc71" };
