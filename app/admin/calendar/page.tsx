"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ... (TYPE_COLORS változatlan)
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
    fetch('/api/calendar').then(res => res.json()).then(data => {
      setEvents(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  };

  const fetchUnits = () => {
    fetch('/api/calendar/units').then(res => res.json()).then(data => setUnits(Array.isArray(data) ? data : []));
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
      <header style={headerContainer}>
        {/* FELSŐ SOR: GOMBOK */}
        <div style={topActionRow}>
          <button onClick={() => router.push("/")} style={backBtn}>
            <span>⬅</span> <span className="hide-on-mobile">VISSZA</span>
          </button>

          <div style={rightControls}>
            <button onClick={() => setShowModal(true)} style={addBtn}>
              <span>+</span><span className="hide-on-mobile"> ÚJ</span>
            </button>
            <div style={navGroup}>
              <button onClick={() => changeMonth(-1)} style={navBtn}>‹</button>
              <button onClick={() => changeMonth(1)} style={navBtn}>›</button>
            </div>
          </div>
        </div>

        {/* ALSÓ SOR: HÓNAP CÍME */}
        <h1 style={titleStyle}>
          {monthNames[currentDate.getMonth()]} <span style={{ opacity: 0.5 }}>{currentDate.getFullYear()}</span>
        </h1>
      </header>

      <style jsx>{`
        @media (max-width: 600px) {
          .hide-on-mobile { display: none; }
        }
      `}</style>

      {/* ... (Modal és Naptár rács változatlan) */}
      {showModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2 style={{marginTop: 0, fontSize: '20px', color: '#fff'}}>{editingId ? "Szerkesztés" : "Új munka"}</h2>
            <label style={labelStyle}>Típus:</label>
            <div style={{display: 'flex', gap: '5px', marginBottom: '15px'}}>
              <button onClick={() => setNewEntry({...newEntry, type: 'MAINTENANCE'})} style={{...typeBtn, backgroundColor: newEntry.type === 'MAINTENANCE' ? TYPE_COLORS.MAINTENANCE : '#333'}}>Karbantartás</button>
              <button onClick={() => setNewEntry({...newEntry, type: 'INSTALLATION'})} style={{...typeBtn, backgroundColor: newEntry.type === 'INSTALLATION' ? TYPE_COLORS.INSTALLATION : '#333'}}>Telepítés</button>
              <button onClick={() => setNewEntry({...newEntry, type: 'REPAIR'})} style={{...typeBtn, backgroundColor: newEntry.type === 'REPAIR' ? TYPE_COLORS.REPAIR : '#333'}}>Javítás</button>
            </div>
            {!editingId && (
              <>
                <label style={labelStyle}>Ügyfél:</label>
                <select style={inputStyle} value={newEntry.unitId} onChange={e => setNewEntry({...newEntry, unitId: e.target.value})}>
                  <option value="">-- Válassz --</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.displayName}</option>)}
                </select>
              </>
            )}
            <label style={labelStyle}>Dátum:</label>
            <input type="date" style={inputStyle} value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} />
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px'}}>
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
          {["H", "K", "Sze", "Cs", "P", "Szo", "V"].map(d => <div key={d} style={dayHeader}>{d}</div>)}
          {Array.from({ length: offset }).map((_, i) => <div key={`empty-${i}`} style={emptyCell} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr);
            const isToday = dateStr === todayStr;
            return (
              <div key={day} onClick={() => { if(!showModal) { setNewEntry({...newEntry, date: dateStr}); setShowModal(true); } }}
                style={{...cellStyle, border: isToday ? "1px solid #2ecc71" : "1px solid #333", backgroundColor: isToday ? "#0a2a1a" : "#111"}}>
                <span style={{...dayNum, color: isToday ? "#2ecc71" : "#888"}}>{day}</span>
                <div style={eventContainer}>
                  {dayEvents.map((ev) => (
                    <div key={ev.id} style={{...eventBadge, backgroundColor: TYPE_COLORS[ev.type] || TYPE_COLORS.MAINTENANCE}} />
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

// --- STÍLUSOK ---
const pageStyle: React.CSSProperties = { minHeight: "100vh", backgroundColor: "#000", color: "#fff", padding: "10px", fontFamily: "sans-serif" };

const headerContainer: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "15px",
  marginBottom: "20px",
  maxWidth: "1200px",
  margin: "0 auto 20px auto"
};

const topActionRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%"
};

const rightControls: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  alignItems: "center"
};

const navGroup: React.CSSProperties = {
  display: "flex",
  gap: "2px",
  background: "#222",
  borderRadius: "6px",
  padding: "2px"
};

const titleStyle: React.CSSProperties = { 
  fontSize: "26px", 
  fontWeight: "bold", 
  margin: 0, 
  textAlign: "left",
  paddingLeft: "5px"
};

const backBtn: React.CSSProperties = { 
  background: "transparent", 
  border: "1px solid #2ecc71", 
  color: "#2ecc71", 
  padding: "8px 12px", 
  cursor: "pointer", 
  borderRadius: '8px',
  fontWeight: "bold",
  fontSize: "13px",
  display: "flex",
  alignItems: "center",
  gap: "6px"
};

const navBtn: React.CSSProperties = { border: "none", color: "#fff", cursor: "pointer", background: "transparent", padding: "6px 15px", fontSize: "18px" };
const addBtn: React.CSSProperties = { background: "#2ecc71", border: "none", color: "#fff", padding: "8px 14px", cursor: "pointer", fontWeight: "bold", fontSize: "14px", borderRadius: '8px' };

const calendarGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", backgroundColor: "#333", border: "1px solid #333" };
const dayHeader: React.CSSProperties = { backgroundColor: "#000", padding: "10px 0", textAlign: "center", fontSize: "11px", color: "#555" };
const cellStyle: React.CSSProperties = { minHeight: "70px", padding: "4px", position: 'relative', cursor: "pointer" };
const emptyCell: React.CSSProperties = { backgroundColor: "#000" };
const dayNum: React.CSSProperties = { fontSize: "13px", fontWeight: "bold" };
const eventContainer: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: "2px", marginTop: "4px" };
const eventBadge: React.CSSProperties = { width: "6px", height: "6px", borderRadius: "50%" };

const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent: React.CSSProperties = { background: '#111', padding: '20px', border: '1px solid #333', width: '90%', maxWidth: '400px', borderRadius: '15px' };
const inputStyle: React.CSSProperties = { background: '#222', border: '1px solid #444', color: '#fff', padding: '12px', marginBottom: '10px', borderRadius: '8px', width: '100%' };
const labelStyle: React.CSSProperties = { fontSize: '10px', color: '#888', marginBottom: '4px', display: 'block' };
const typeBtn: React.CSSProperties = { flex: 1, border: 'none', color: '#fff', padding: '8px 2px', fontSize: '10px', borderRadius: '5px' };
const saveBtnStyle: React.CSSProperties = { border: "none", color: "#fff", padding: "12px", borderRadius: "8px", fontWeight: "bold" };
