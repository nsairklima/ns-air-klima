"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]); // Ügyfelek/Egységek listája
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
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

  const fetchUnits = () => {
    // Feltételezzük, hogy létrehoztad az elöző válaszban javasolt /api/calendar/units végpontot
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
      ? { id: editingId, description: newEntry.desc, performedDate: newEntry.date }
      : { unitId: newEntry.unitId, performedDate: newEntry.date, description: newEntry.desc };

    const res = await fetch('/api/calendar', {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      closeModal();
      fetchEvents();
    } else {
      alert("Hiba történt a művelet során.");
    }
  };

  const handleDelete = async () => {
    if (!editingId || !confirm("Biztosan törlöd ezt a bejegyzést?")) return;

    const res = await fetch(`/api/calendar?id=${editingId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      closeModal();
      fetchEvents();
    } else {
      alert("Hiba történt a törléskor.");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setNewEntry({ unitId: "", date: "", desc: "" });
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
            <h2 style={{marginTop: 0, fontSize: '20px'}}>{editingId ? "Szerkesztés" : "Új karbantartás"}</h2>
            
            {!editingId && (
              <>
                <label style={labelStyle}>Ügyfél és Gép:</label>
                <select 
                  style={{...inputStyle, cursor: 'pointer'}} 
                  value={newEntry.unitId}
                  onChange={e => setNewEntry({...newEntry, unitId: e.target.value})}
                >
                  <option value="">-- Válassz ügyfelet --</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.displayName}</option>
                  ))}
                </select>
                <button 
                  onClick={() => router.push("/clients")} 
                  style={{background: 'none', border: 'none', color: '#2ecc71', fontSize: '11px', textAlign: 'left', marginBottom: '15px', cursor: 'pointer', padding: 0}}
                >
                  + Nincs a listában? Új ügyfél rögzítése
                </button>
              </>
            )}
            
            <label style={labelStyle}>Dátum:</label>
            <input 
              type="date" 
              style={inputStyle} 
              value={newEntry.date}
              onChange={e => setNewEntry({...newEntry, date: e.target.value})} 
            />
            
            <label style={labelStyle}>Leírás (opcionális):</label>
            <textarea 
              style={{...inputStyle, minHeight: '60px'}} 
              placeholder="Pl. Szűrőcsere, gáztöltés..."
              value={newEntry.desc}
              onChange={e => setNewEntry({...newEntry, desc: e.target.value})} 
            />
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px'}}>
              <button onClick={handleSave} style={{...navBtn, background: '#2ecc71', fontSize: '16px', padding: '12px', borderRadius: '4px'}}>
                {editingId ? "Módosítások mentése" : "Rögzítés a naptárba"}
              </button>
              
              {editingId && (
                <button onClick={handleDelete} style={{...navBtn, background: '#e74c3c', fontSize: '16px', padding: '12px', borderRadius: '4px'}}>
                  Bejegyzés törlése
                </button>
              )}
              
              <button onClick={closeModal} style={{...navBtn, background: '#444', fontSize: '16px', padding: '12px', borderRadius: '4px'}}>
                Mégse
              </button>
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
                onClick={() => { if(!showModal) { setNewEntry({...newEntry, date: dateStr}); setShowModal(true); } }}
                style={{
                  ...cellStyle,
                  border: isToday ? "2px solid #2ecc71" : "none",
                  backgroundColor: isToday ? "#0a2a1a" : "#111",
                  cursor: 'pointer'
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{...dayNum, color: isToday ? "#2ecc71" : "#fff", fontWeight: isToday ? "bold" : "normal", opacity: isToday ? 1 : 0.4}}>
                    {day}
                  </span>
                </div>
                <div style={eventContainer}>
                  {dayEvents.map((ev, idx) => (
                    <div 
                      key={ev.id || idx} 
                      style={eventBadge}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(ev.id);
                        setNewEntry({ unitId: ev.unitId.toString(), date: ev.date, desc: ev.description });
                        setShowModal(true);
                      }}
                    >
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

// STÍLUSOK (ugyanazok, amiket használtál, apró finomításokkal)
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent: React.CSSProperties = { background: '#111', padding: '25px', border: '1px solid #333', width: '380px', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', borderRadius: '8px' };
const inputStyle: React.CSSProperties = { background: '#222', border: '1px solid #444', color: '#fff', padding: '12px', marginBottom: '15px', outline: 'none', fontFamily: 'inherit', borderRadius: '4px' };
const labelStyle: React.CSSProperties = { fontSize: '11px', marginBottom: '6px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' };
const addBtn: React.CSSProperties = { background: '#2ecc71', border: 'none', color: '#fff', padding: '8px 15px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px', fontSize: '14px', borderRadius: '4px' };
const pageStyle: React.CSSProperties = { minHeight: "100vh", backgroundColor: "#000", color: "#fff", padding: "20px", fontFamily: "'Segoe UI', sans-serif" };
const headerStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", maxWidth: "1200px", margin: "0 auto 30px auto" };
const titleStyle: React.CSSProperties = { fontSize: "32px", fontWeight: "lighter", margin: 0 };
const backBtn: React.CSSProperties = { background: "none", border: "1px solid #fff", color: "#fff", padding: "8px 15px", cursor: "pointer", fontSize: "16px", borderRadius: '4px' };
const navBtns: React.CSSProperties = { display: "flex", gap: "5px", alignItems: 'center' };
const navBtn: React.CSSProperties = { border: "none", color: "#fff", cursor: "pointer", transition: 'opacity 0.2s' };
const calendarGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", backgroundColor: "#333", border: "1px solid #333", maxWidth: "1200px", margin: "0 auto" };
const dayHeader: React.CSSProperties = { backgroundColor: "#111", padding: "10px", textAlign: "center", fontSize: "12px", color: "#888", fontWeight: "bold" };
const cellStyle: React.CSSProperties = { backgroundColor: "#111", minHeight: "120px", padding: "8px", display: "flex", flexDirection: "column", transition: 'background 0.2s' };
const emptyCell: React.CSSProperties = { backgroundColor: "#050505" };
const dayNum: React.CSSProperties = { fontSize: "14px", marginBottom: "5px" };
const eventContainer: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "4px", marginTop: '5px' };
const eventBadge: React.CSSProperties = { backgroundColor: "#0078d7", padding: "4px 8px", fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderLeft: "3px solid #2ecc71", cursor: 'pointer' };
