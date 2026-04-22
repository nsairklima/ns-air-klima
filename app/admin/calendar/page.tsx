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
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newEntry, setNewEntry] = useState({ unitId: "", unitName: "", date: "", desc: "", type: "MAINTENANCE" });

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const fetchEvents = () => {
    fetch('/api/calendar').then(res => res.json()).then(data => {
      setEvents(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  };

  const fetchUnits = () => {
    fetch('/api/calendar/units', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setUnits(Array.isArray(data) ? data : []))
      .catch(err => console.error("Hiba:", err));
  };

  useEffect(() => {
    fetchEvents();
    fetchUnits();
  }, []);

  const openEdit = (e: React.MouseEvent, eventData: any) => {
    e.stopPropagation();
    setEditingId(eventData.id);
    setNewEntry({
      unitId: eventData.unitId || "",
      unitName: eventData.unitName || eventData.unit?.displayName || "Névtelen ügyfél",
      date: eventData.date,
      desc: eventData.description || "",
      type: eventData.type || "MAINTENANCE"
    });
    setShowModal(true);
  };

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
    setNewEntry({ unitId: "", unitName: "", date: "", desc: "", type: "MAINTENANCE" });
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
      <header style={headerContainer}>
        <div style={topActionRow}>
          <button onClick={() => router.push("/")} style={backBtn}>⬅</button>
          <div style={rightControls}>
            <button onClick={() => { fetchUnits(); setShowModal(true); }} style={addBtn}>+ ÚJ</button>
            <div style={navGroup}>
              <button onClick={() => changeMonth(-1)} style={navBtn}>‹</button>
              <button onClick={() => changeMonth(1)} style={navBtn}>›</button>
            </div>
          </div>
        </div>
        <h1 style={titleStyle}>
          {monthNames[currentDate.getMonth()]} <span style={{ opacity: 0.4 }}>{currentDate.getFullYear()}</span>
        </h1>
      </header>

      {showModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2 style={{marginTop: 0, fontSize: '18px'}}>{editingId ? "Szerkesztés" : "Új feladat"}</h2>
            
            <label style={labelStyle}>Típus:</label>
            <div style={{display: 'flex', gap: '5px', marginBottom: '15px'}}>
              {Object.keys(TYPE_COLORS).map(t => (
                <button 
                  key={t}
                  onClick={() => setNewEntry({...newEntry, type: t})} 
                  style={{
                    ...typeBtn, 
                    backgroundColor: newEntry.type === t ? TYPE_COLORS[t] : '#333',
                    border: newEntry.type === t ? '1px solid #fff' : '1px solid transparent'
                  }}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            <label style={labelStyle}>Ügyfél / Gép:</label>
            {editingId ? (
              <div style={{...inputStyle, backgroundColor: '#1a1a1a', border: '1px dashed #444', color: '#fff'}}>
                {newEntry.unitName}
              </div>
            ) : (
              <div style={{ marginBottom: '15px' }}>
                <select style={inputStyle} value={newEntry.unitId} onChange={e => {
                  const selectedUnit = units.find(u => u.id.toString() === e.target.value);
                  setNewEntry({...newEntry, unitId: e.target.value, unitName: selectedUnit?.displayName || ""});
                }}>
                  <option value="">-- Válassz ügyfelet --</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.displayName}</option>)}
                </select>
                <button onClick={() => router.push("/clients/new")} style={textLinkBtn}>+ Új ügyfél rögzítése</button>
              </div>
            )}

            <label style={labelStyle}>Dátum:</label>
            <input type="date" style={inputStyle} value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} />
            
            <label style={labelStyle}>Megjegyzés:</label>
            <textarea 
              style={{ ...inputStyle, minHeight: '60px', resize: 'none' }} 
              value={newEntry.desc} 
              onChange={e => setNewEntry({...newEntry, desc: e.target.value})} 
            />
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px'}}>
              <button onClick={handleSave} style={{...saveBtnStyle, background: '#2ecc71'}}>Mentés</button>
              {editingId && <button onClick={handleDelete} style={{...saveBtnStyle, background: '#e74c3c'}}>Törlés</button>}
              <button onClick={closeModal} style={{...saveBtnStyle, background: '#444'}}>Mégse</button>
            </div>
          </div>
        </div>
      )}

      <div style={calendarGrid}>
        {["H", "K", "Sze", "Cs", "P", "Szo", "V"].map(d => <div key={d} style={dayHeader}>{d}</div>)}
        {Array.from({ length: offset }).map((_, i) => <div key={`empty-${i}`} style={emptyCell} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayEvents = events.filter(e => e.date === dateStr);
          const isToday = dateStr === todayStr;
          
          return (
            <div key={day} 
              onClick={() => { if(!showModal) { setNewEntry({...newEntry, date: dateStr}); setShowModal(true); } }}
              style={{...cellStyle, border: isToday ? "1px solid #2ecc71" : "1px solid #333", backgroundColor: isToday ? "#0a2a1a" : "#111"}}>
              <span style={{...dayNum, color: isToday ? "#2ecc71" : "#888"}}>{day}</span>
              <div style={eventStack}>
                {dayEvents.map((ev) => (
                  <div 
                    key={ev.id} 
                    onClick={(e) => openEdit(e, ev)}
                    style={{...eventBar, backgroundColor: TYPE_COLORS[ev.type] || TYPE_COLORS.MAINTENANCE}}
                  >
                    {ev.unitName || ev.unit?.displayName || "Névtelen"}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// STÍLUSOK FRISSÍTVE A SÁVOKHOZ
const pageStyle: React.CSSProperties = { minHeight: "100vh", backgroundColor: "#000", color: "#fff", padding: "8px", fontFamily: "sans-serif" };
const headerContainer: React.CSSProperties = { marginBottom: "15px", maxWidth: "1200px", margin: "0 auto 15px auto" };
const topActionRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" };
const rightControls: React.CSSProperties = { display: "flex", gap: "6px" };
const navGroup: React.CSSProperties = { display: "flex", gap: "2px" };
const titleStyle: React.CSSProperties = { fontSize: "22px", fontWeight: "bold", margin: 0 };
const backBtn: React.CSSProperties = { background: "#222", border: "1px solid #444", color: "#fff", padding: "8px 15px", borderRadius: '6px', cursor: "pointer" };
const navBtn: React.CSSProperties = { border: "1px solid #444", color: "#fff", background: "#222", padding: "8px 15px", borderRadius: "6px", cursor: "pointer" };
const addBtn: React.CSSProperties = { background: "#2ecc71", border: "none", color: "#fff", padding: "8px 15px", fontWeight: "bold", borderRadius: '6px', cursor: "pointer" };

const calendarGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", backgroundColor: "#333", border: "1px solid #333" };
const dayHeader: React.CSSProperties = { backgroundColor: "#000", padding: "8px 0", textAlign: "center", fontSize: "11px", color: "#666", fontWeight: "bold" };
const cellStyle: React.CSSProperties = { minHeight: "100px", padding: "4px", backgroundColor: "#111", cursor: "pointer", overflow: "hidden" };
const emptyCell: React.CSSProperties = { backgroundColor: "#000" };
const dayNum: React.CSSProperties = { fontSize: "12px", fontWeight: "bold", marginBottom: "4px", display: "block" };

// SÁVOK STÍLUSA
const eventStack: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "2px" };
const eventBar: React.CSSProperties = { 
  fontSize: "9px", 
  padding: "2px 4px", 
  borderRadius: "2px", 
  color: "#fff", 
  whiteSpace: "nowrap", 
  overflow: "hidden", 
  textOverflow: "ellipsis",
  fontWeight: "bold",
  border: "1px solid rgba(255,255,255,0.1)"
};

const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent: React.CSSProperties = { background: '#111', padding: '20px', border: '1px solid #333', width: '90%', maxWidth: '400px', borderRadius: '12px' };
const inputStyle: React.CSSProperties = { background: '#222', border: '1px solid #444', color: '#fff', padding: '12px', marginBottom: '10px', borderRadius: '8px', width: '100%', fontSize: '14px' };
const labelStyle: React.CSSProperties = { fontSize: '11px', color: '#888', marginBottom: '5px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' };
const typeBtn: React.CSSProperties = { flex: 1, border: 'none', color: '#fff', padding: '10px 2px', fontSize: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const saveBtnStyle: React.CSSProperties = { border: "none", color: "#fff", padding: "12px", borderRadius: "8px", fontWeight: "bold", cursor: 'pointer' };
const textLinkBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#2ecc71', fontSize: '12px', cursor: 'pointer', padding: '0 0 10px 0', textDecoration: 'underline' };
