"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Színkód térkép a naptár eseményekhez
const TYPE_COLORS: Record<string, string> = {
  INSTALLATION: "#2ecc71", // Zöld
  MAINTENANCE: "#0078d7",  // Kék
  REPAIR: "#e74c3c"        // Piros
};

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newEntry, setNewEntry] = useState({ 
    unitId: "", 
    date: "", 
    desc: "", 
    type: "MAINTENANCE" 
  });

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
    if (!newEntry.unitId || !newEntry.date) return alert("Ki kell választani egy ügyfelet és dátumot!");
    
    const method = editingId ? 'PUT' : 'POST';
    const body = editingId 
      ? { id: editingId, description: newEntry.desc, performedDate: newEntry.date, type: newEntry.type }
      : { unitId: newEntry.unitId, performedDate: newEntry.date, description: newEntry.desc, type: newEntry.type };

    const res = await fetch('/api/calendar', {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      closeModal();
      fetchEvents();
    } else {
      alert("Hiba történt a mentés során.");
    }
  };

  const handleDelete = async () => {
    if (!editingId || !confirm("Biztosan törlöd ezt a bejegyzést?")) return;
    const res = await fetch(`/api/calendar?id=${editingId}`, { method: 'DELETE' });
    if (res.ok) {
      closeModal();
      fetchEvents();
    }
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
          {monthNames[currentDate.getMonth()]} <span style={{ opacity: 0.5 }}>{currentDate.getFullYear()}</span>
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
            <h2 style={{marginTop: 0, fontSize: '20px'}}>{editingId ? "Szerkesztés" : "Új munka rögzítése"}</h2>
            
            <label style={labelStyle}>Munka típusa:</label>
            <div style={{display: 'flex', gap: '5px', marginBottom: '15px'}}>
              <button 
                onClick={() => setNewEntry({...newEntry, type: 'MAINTENANCE'})}
                style={{...typeBtn, backgroundColor: newEntry.type === 'MAINTENANCE' ? TYPE_COLORS.MAINTENANCE : '#333'}}
              >Karbantartás</button>
              <button 
                onClick={() => setNewEntry({...newEntry, type: 'INSTALLATION'})}
                style={{...typeBtn, backgroundColor: newEntry.type === 'INSTALLATION' ? TYPE_COLORS.INSTALLATION : '#333'}}
              >Telepítés</button>
              <button 
                onClick={() => setNewEntry({...newEntry, type: 'REPAIR'})}
                style={{...typeBtn, backgroundColor: newEntry.type === 'REPAIR' ? TYPE_COLORS.REPAIR : '#333'}}
              >Javítás</button>
            </div>

            {!editingId && (
              <>
                <label style={labelStyle}>Ügyfél és Gép:</label>
                <select 
                  style={inputStyle} 
                  value={newEntry.unitId}
                  onChange={e => setNewEntry({...newEntry, unitId: e.target.value})}
                >
                  <option value="">-- Válassz ügyfelet --</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.displayName}</option>
                  ))}
                </select>
              </>
            )}
            
            <label style={labelStyle}>Dátum:</label>
            <input type="date" style={inputStyle} value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} />
            
            <label style={labelStyle}>Leírás / Megjegyzés:</label>
            <textarea style={{...inputStyle, minHeight: '60px'}} value={newEntry.desc} onChange={e => setNewEntry({...newEntry, desc: e.target.value})} />
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <button onClick={handleSave} style={{...navBtn, background: '#2ecc71', padding: '12px', borderRadius: '4px'}}>Mentés</button>
              {editingId && <button onClick={handleDelete} style={{...navBtn, background: '#e74c3c', padding: '12px', borderRadius: '4px'}}>Törlés</button>}
              <button onClick={closeModal} style={{...navBtn, background: '#444', padding: '12px', borderRadius: '4px'}}>Mégse</button>
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
          {Array.from({ length: offset }).map((_, i) => <div key={`empty-${i}`} style={emptyCell} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr);
            const isToday = dateStr === todayStr;

            return (
              <div key={day} onClick={() => { if(!showModal) { setNewEntry({...newEntry, date: dateStr}); setShowModal(true); } }}
                style={{...cellStyle, border: isToday ? "2px solid #2ecc71" : "none", backgroundColor: isToday ? "#0a2a1a" : "#111", cursor: 'pointer'}}>
                <span style={{...dayNum, color: isToday ? "#2ecc71" : "#fff", opacity: isToday ? 1 : 0.4}}>{day}</span>
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

// STÍLUSOK DEFINÍCIÓJA - EZ HIÁNYZOTT!
const pageStyle: React.CSSProperties = { minHeight: "100vh", backgroundColor: "#000", color: "#fff", padding: "20px", fontFamily: "'Segoe UI', sans-serif" };
const headerStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", maxWidth: "1200px", margin: "0 auto 30px auto" };
const titleStyle: React.CSSProperties = { fontSize: "32px", fontWeight: "lighter", margin: 0 };
const backBtn: React.CSSProperties = { background: "none", border: "1px solid #fff", color: "#fff", padding: "8px 15px", cursor: "pointer", fontSize: "16px", borderRadius: '4px' };
const navBtns: React.CSSProperties = { display: "flex", gap: "5px", alignItems: 'center' };
const navBtn: React.CSSProperties = { border: "none", color: "#fff", cursor: "pointer", transition: 'opacity 0.2s' };
const addBtn: React.CSSProperties = { background: "#2ecc71", border: "none", color: "#fff", padding: "8px 15px", cursor: "pointer", fontWeight: "bold", marginRight: "10px", fontSize: "14px", borderRadius: '4px' };
const calendarGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", backgroundColor: "#333", border: "1px solid #333", maxWidth: "1200px", margin: "0 auto" };
const dayHeader: React.CSSProperties = { backgroundColor: "#111", padding: "10px", textAlign: "center", fontSize: "12px", color: "#888", fontWeight: "bold" };
const cellStyle: React.CSSProperties = { backgroundColor: "#111", minHeight: "120px", padding: "8px", display: "flex", flexDirection: "column" };
const emptyCell: React.CSSProperties = { backgroundColor: "#050505" };
const dayNum: React.CSSProperties = { fontSize: "14px", marginBottom: "5px" };
const eventContainer: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "4px" };
const eventBadge: React.CSSProperties = { padding: "4px 8px", fontSize: "11px", borderRadius: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: 'pointer' };
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent: React.CSSProperties = { background: '#111', padding: '25px', border: '1px solid #333', width: '380px', display: 'flex', flexDirection: 'column', borderRadius: '8px' };
const inputStyle: React.CSSProperties = { background: '#222', border: '1px solid #444', color: '#fff', padding: '12px', marginBottom: '15px', outline: 'none', borderRadius: '4px' };
const labelStyle: React.CSSProperties = { fontSize: '11px', marginBottom: '6px', opacity: 0.7, textTransform: 'uppercase' };
const typeBtn: React.CSSProperties = { flex: 1, border: 'none', color: '#fff', padding: '8px 5px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px' };
