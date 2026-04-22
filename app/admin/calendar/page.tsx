"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const TYPE_COLORS: Record<string, string> = {
  INSTALLATION: "#2ecc71", 
  MAINTENANCE: "#0078d7",  
  REPAIR: "#e74c3c"        
};

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newEntry, setNewEntry] = useState({ unitId: "", date: "", desc: "", type: "MAINTENANCE" });

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
    if (!newEntry.unitId || !newEntry.date) return alert("Válassz ügyfelet és dátumot!");
    const method = editingId ? 'PUT' : 'POST';
    const body = editingId 
      ? { id: editingId, description: newEntry.desc, performedDate: newEntry.date, type: newEntry.type }
      : { unitId: newEntry.unitId, performedDate: newEntry.date, description: newEntry.desc, type: newEntry.type };
    const res = await fetch('/api/calendar', {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) { closeModal(); fetchEvents(); }
  };

  const handleDelete = async () => {
    if (!editingId || !confirm("Biztosan törlöd?")) return;
    const res = await fetch(`/api/calendar?id=${editingId}`, { method: 'DELETE' });
    if (res.ok) { closeModal(); fetchEvents(); }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setNewEntry({ unitId: "", date: "", desc: "", type: "MAINTENANCE" });
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
          {monthNames[currentDate.getMonth()]} <span style={{ opacity: 0.6 }}>{currentDate.getFullYear()}</span>
        </h1>
        <div style={navBtns}>
          <button onClick={() => setShowModal(true)} style={addBtn}>+ Új bejegyzés</button>
          <button onClick={() => changeMonth(-1)} style={navBtn}>‹</button>
          <button onClick={() => changeMonth(1)} style={navBtn}>›</button>
        </div>
      </header>

      {showModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2 style={{marginTop: 0, fontSize: '20px', color: '#fff'}}>{editingId ? "Szerkesztés" : "Új munka rögzítése"}</h2>
            
            <label style={labelStyle}>Típus:</label>
            <div style={{display: 'flex', gap: '5px', marginBottom: '15px'}}>
              <button onClick={() => setNewEntry({...newEntry, type: 'MAINTENANCE'})} style={{...typeBtn, backgroundColor: newEntry.type === 'MAINTENANCE' ? TYPE_COLORS.MAINTENANCE : '#333'}}>Karbantartás</button>
              <button onClick={() => setNewEntry({...newEntry, type: 'INSTALLATION'})} style={{...typeBtn, backgroundColor: newEntry.type === 'INSTALLATION' ? TYPE_COLORS.INSTALLATION : '#333'}}>Telepítés</button>
              <button onClick={() => setNewEntry({...newEntry, type: 'REPAIR'})} style={{...typeBtn, backgroundColor: newEntry.type === 'REPAIR' ? TYPE_COLORS.REPAIR : '#333'}}>Javítás</button>
            </div>

            {!editingId && (
              <>
                <label style={labelStyle}>Ügyfél és Gép kiválasztása:</label>
                <select 
                  style={{...inputStyle, cursor: 'pointer', border: '1px solid #2ecc71'}} 
                  value={newEntry.unitId} 
                  onChange={e => setNewEntry({...newEntry, unitId: e.target.value})}
                >
                  <option value="">-- Válassz a meglévők közül --</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.displayName}</option>
                  ))}
                </select>
                <button 
                  onClick={() => router.push("/clients")}
                  style={{ background: 'none', border: 'none', color: '#2ecc71', fontSize: '13px', textAlign: 'left', marginBottom: '15px', cursor: 'pointer', padding: '0 5px', textDecoration: 'underline' }}
                >
                  + Nincs a listában? Új ügyfél hozzáadása
                </button>
              </>
            )}

            <label style={labelStyle}>Dátum:</label>
            <input type="date" style={inputStyle} value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} />
            
            <label style={labelStyle}>Megjegyzés:</label>
            <textarea style={{...inputStyle, minHeight: '80px'}} value={newEntry.desc} onChange={e => setNewEntry({...newEntry, desc: e.target.value})} />
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <button onClick={handleSave} style={{...saveBtnStyle, background: '#2ecc71'}}>Mentés</button>
              {editingId && <button onClick={handleDelete} style={{...saveBtnStyle, background: '#e74c3c'}}>Törlés</button>}
              <button onClick={closeModal} style={{...saveBtnStyle, background: '#444'}}>Mégse</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', marginTop: '50px', opacity: 0.5 }}>Betöltés...</p>
      ) : (
        <div style={calendarGrid}>
          {["Hé", "Ke", "Sze", "Csü", "Pé", "Szo", "Va"].map(d => <div key={d} style={dayHeader}>{d}</div>)}
          {Array.from({ length: offset }).map((_, i) => <div key={`empty-${i}`} style={emptyCell} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr);
            const isToday = dateStr === todayStr;

            return (
              <div key={day} onClick={() => { if(!showModal) { setNewEntry({...newEntry, date: dateStr}); setShowModal(true); } }}
                style={{...cellStyle, border: isToday ? "2px solid #2ecc71" : "1px solid #444", backgroundColor: isToday ? "#0a2a1a" : "#1a1a1a"}}>
                <span style={{...dayNum, color: isToday ? "#2ecc71" : "#eee"}}>{day}</span>
                <div style={eventContainer}>
                  {dayEvents.map((ev) => (
                    <div key={ev.id} style={{...eventBadge, backgroundColor: TYPE_COLORS[ev.type] || TYPE_COLORS.MAINTENANCE}}
                      onClick={(e) => { e.stopPropagation(); setEditingId(ev.id); setNewEntry({ unitId: ev.unitId.toString(), date: ev.date, desc: ev.description, type: ev.type || "MAINTENANCE" }); setShowModal(true); }}>
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

// --- STÍLUSOK (Olvashatóság javítva: tiszta fehér betűk az inputokban) ---
const pageStyle: React.CSSProperties = { minHeight: "100vh", backgroundColor: "#000", color: "#fff", padding: "20px", fontFamily: "sans-serif" };
const headerStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", maxWidth: "1200px", margin: "0 auto 30px auto" };
const titleStyle: React.CSSProperties = { fontSize: "28px", fontWeight: "normal", margin: 0 };
const backBtn: React.CSSProperties = { background: "#222", border: "1px solid #444", color: "#fff", padding: "8px 15px", cursor: "pointer", borderRadius: '4px' };
const navBtns: React.CSSProperties = { display: "flex", gap: "8px", alignItems: 'center' };
const navBtn: React.CSSProperties = { border: "1px solid #444", color: "#fff", cursor: "pointer", background: "#222", padding: "5px 15px", fontSize: "20px", borderRadius: "4px" };
const addBtn: React.CSSProperties = { background: "#2ecc71", border: "none", color: "#fff", padding: "8px 15px", cursor: "pointer", fontWeight: "bold", fontSize: "14px", borderRadius: '4px' };
const calendarGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", backgroundColor: "#555", border: "1px solid #555", maxWidth: "1200px", margin: "0 auto" };
const dayHeader: React.CSSProperties = { backgroundColor: "#111", padding: "10px", textAlign: "center", fontSize: "12px", color: "#bbb" };
const cellStyle: React.CSSProperties = { minHeight: "120px", padding: "8px", display: "flex", flexDirection: "column" };
const emptyCell: React.CSSProperties = { backgroundColor: "#000" };
const dayNum: React.CSSProperties = { fontSize: "16px", marginBottom: "5px", fontWeight: "500" };
const eventContainer: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "4px" };
const eventBadge: React.CSSProperties = { padding: "4px 8px", fontSize: "11px", borderRadius: "3px", color: "#fff", fontWeight: "bold", cursor: 'pointer' };
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent: React.CSSProperties = { background: '#1a1a1a', padding: '25px', border: '1px solid #444', width: '90%', maxWidth: '400px', borderRadius: '12px' };

// FEHÉR BETŰSZÍN ÉS JOBB OLVASHATÓSÁG AZ INPUTOKBAN
const inputStyle: React.CSSProperties = { 
  background: '#2a2a2a', 
  border: '1px solid #444', 
  color: '#ffffff', // Tiszta fehér betűszín
  padding: '14px', 
  marginBottom: '10px', 
  borderRadius: '8px', 
  width: '100%', 
  fontSize: '16px', 
  boxSizing: 'border-box' 
};

const labelStyle: React.CSSProperties = { fontSize: '11px', marginBottom: '6px', color: '#aaa', textTransform: 'uppercase', display: 'block' };
const typeBtn: React.CSSProperties = { flex: 1, border: 'none', color: '#fff', padding: '10px 5px', fontSize: '11px', cursor: 'pointer', borderRadius: '6px' };
const saveBtnStyle: React.CSSProperties = { border: "none", color: "#fff", cursor: "pointer", padding: "14px", borderRadius: "8px", fontSize: "16px", fontWeight: "bold" };
