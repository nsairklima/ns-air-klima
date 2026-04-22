"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const TYPE_COLORS: Record<string, string> = {
  INSTALLATION: "#2ecc71",
  MAINTENANCE: "#0078d7",
  REPAIR: "#e74c3c"
};

const TYPE_LABELS: Record<string, string> = {
  INSTALLATION: "Telepítés",
  MAINTENANCE: "Karbantartás",
  REPAIR: "Javítás"
};

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  
  // ÚJ: Kijelölt nap a napi nézethez
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeType, setActiveType] = useState("MAINTENANCE");
  
  const [newEntry, setNewEntry] = useState({ 
    unitId: "", 
    title: "", 
    date: "", 
    desc: ""
  });

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/calendar');
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) { console.error("Fetch hiba", e); }
  };

  const fetchUnits = () => {
    fetch('/api/calendar/units')
      .then(res => res.json())
      .then(data => setUnits(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    fetchEvents();
    fetchUnits();
  }, []);

  const handleSave = async () => {
    const payload = {
      ...(editingId ? { id: editingId } : { unitId: parseInt(newEntry.unitId) }),
      performedDate: newEntry.date,
      description: newEntry.desc,
      type: activeType
    };

    const res = await fetch('/api/calendar', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowModal(false);
      setEditingId(null);
      fetchEvents();
    }
  };

  const openEdit = (e: React.MouseEvent, eventData: any) => {
    e.stopPropagation();
    setEditingId(eventData.id);
    setActiveType(eventData.type || "MAINTENANCE");
    setNewEntry({
      unitId: eventData.unitId?.toString() || "",
      title: eventData.title || "",
      date: eventData.date.includes('T') ? eventData.date.substring(0, 16) : `${eventData.date}T08:00`,
      desc: eventData.description || ""
    });
    setShowModal(true);
  };

  // Naptár generálás
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const monthNames = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];

  // Napi nézet szűrése
  const dailyEvents = events.filter(e => e.date.startsWith(selectedDate || "---"));

  return (
    <div style={pageStyle}>
      <style>{`
        .type-btn { flex: 1; border: 2px solid transparent; color: #fff; padding: 10px; borderRadius: 8px; cursor: pointer; font-size: 11px; opacity: 0.5; }
        .type-btn.active { opacity: 1; border-color: white; transform: scale(1.05); }
        .day-cell:hover { background: #222 !important; }
      `}</style>

      <header style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => selectedDate ? setSelectedDate(null) : router.push("/")} style={backBtn}>
            {selectedDate ? "← Vissza a naptárhoz" : "⬅ Főmenü"}
          </button>
          {!selectedDate && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} style={navBtn}>‹</button>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} style={navBtn}>›</button>
            </div>
          )}
        </div>
        <h1 style={{ fontSize: '24px', margin: '15px 0' }}>
          {selectedDate ? `Napi bontás: ${selectedDate}` : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
        </h1>
      </header>

      {/* NAPI NÉZET PANEL */}
      {selectedDate ? (
        <div style={dailyContainer}>
          <button onClick={() => {
            setNewEntry({...newEntry, date: `${selectedDate}T08:00`});
            setEditingId(null);
            setShowModal(true);
          }} style={addFullBtn}>+ ÚJ FELADAT ERRE A NAPRA</button>
          
          {dailyEvents.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>Nincs erre a napra rögzített feladat.</p>
          ) : (
            dailyEvents.map(ev => (
              <div key={ev.id} onClick={(e) => openEdit(e, ev)} style={{...dailyCard, borderLeft: `6px solid ${TYPE_COLORS[ev.type]}`}}>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{ev.title}</div>
                <div style={{ color: '#aaa', fontSize: '13px', marginTop: '5px' }}>{ev.description}</div>
                <div style={{ marginTop: '10px', fontSize: '12px', color: TYPE_COLORS[ev.type] }}>
                  {TYPE_LABELS[ev.type]} • {ev.date.split('T')[1]?.substring(0, 5) || "Egész nap"}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* HAVI NAPTÁR RÁCS */
        <div style={calendarGrid}>
          {["H", "K", "Sze", "Cs", "P", "Szo", "V"].map(d => <div key={d} style={dayHeader}>{d}</div>)}
          {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} style={emptyCell} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date.startsWith(dateStr));
            
            return (
              <div key={day} onClick={() => setSelectedDate(dateStr)} className="day-cell" style={cellStyle}>
                <span style={{ fontSize: '12px', color: '#666' }}>{day}</span>
                <div style={eventStack}>
                  {dayEvents.slice(0, 3).map(ev => (
                    <div key={ev.id} style={{ ...miniBar, backgroundColor: TYPE_COLORS[ev.type] }} />
                  ))}
                  {dayEvents.length > 3 && <div style={{fontSize: '9px', color: '#888'}}>+{dayEvents.length - 3}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SZERKESZTŐ MODAL (Marad a régi) */}
      {showModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{marginTop: 0}}>{editingId ? "Módosítás" : "Új bejegyzés"}</h3>
            <div style={{display: 'flex', gap: '5px', marginBottom: '15px'}}>
              {Object.keys(TYPE_COLORS).map(t => (
                <button key={t} className={`type-btn ${activeType === t ? 'active' : ''}`}
                  onClick={() => setActiveType(t)} style={{ backgroundColor: TYPE_COLORS[t] }}>
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
            {/* ... input mezők ... */}
            <input type="datetime-local" style={inputStyle} value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} />
            <textarea placeholder="Megjegyzés" style={inputStyle} value={newEntry.desc} onChange={e => setNewEntry({...newEntry, desc: e.target.value})} />
            <button onClick={handleSave} style={saveBtn}>MENTÉS</button>
            <button onClick={() => setShowModal(false)} style={cancelBtn}>MÉGSE</button>
          </div>
        </div>
      )}
    </div>
  );
}

// STÍLUSOK
const pageStyle: React.CSSProperties = { minHeight: "100vh", backgroundColor: "#000", color: "#fff", padding: "15px", fontFamily: "sans-serif" };
const backBtn: React.CSSProperties = { background: "#222", border: "none", color: "#fff", padding: "10px 15px", borderRadius: "8px", cursor: "pointer" };
const navBtn: React.CSSProperties = { background: "#222", border: "none", color: "#fff", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" };
const calendarGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", background: "#333", border: "1px solid #333" };
const dayHeader: React.CSSProperties = { background: "#000", padding: "10px", textAlign: "center", fontSize: "12px", color: "#888" };
const cellStyle: React.CSSProperties = { minHeight: "80px", padding: "8px", background: "#111", cursor: "pointer", position: 'relative' };
const emptyCell: React.CSSProperties = { background: "#000" };
const eventStack: React.CSSProperties = { display: "flex", gap: "2px", marginTop: "5px", flexWrap: 'wrap' };
const miniBar: React.CSSProperties = { width: "100%", height: "4px", borderRadius: "2px" };

const dailyContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '15px' };
const dailyCard: React.CSSProperties = { background: '#111', padding: '15px', borderRadius: '12px', cursor: 'pointer' };
const addFullBtn: React.CSSProperties = { background: '#2ecc71', color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };

const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent: React.CSSProperties = { background: '#111', padding: '20px', borderRadius: '15px', width: '90%', maxWidth: '400px' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px', marginBottom: '10px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '8px', boxSizing: 'border-box' };
const saveBtn: React.CSSProperties = { width: '100%', padding: '12px', background: '#2ecc71', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 'bold', marginBottom: '10px' };
const cancelBtn: React.CSSProperties = { width: '100%', padding: '12px', background: '#444', border: 'none', color: '#fff', borderRadius: '8px' };
