"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PasswordGuard from "@/components/PasswordGuard"; // Importáltuk a védelmet

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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeType, setActiveType] = useState("MAINTENANCE");
  
  const [newEntry, setNewEntry] = useState({ 
    unitId: "", 
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
    if (!newEntry.unitId && !editingId) return alert("Válassz ügyfelet!");
    
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
      setNewEntry({ unitId: "", date: "", desc: "" });
      fetchEvents();
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm("Biztosan törölni szeretnéd ezt a bejegyzést?")) return;

    const res = await fetch(`/api/calendar?id=${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      fetchEvents();
    } else {
      alert("Hiba történt a törlés során.");
    }
  };

  const openEdit = (e: React.MouseEvent, eventData: any) => {
    e.stopPropagation();
    setEditingId(eventData.id);
    setActiveType(eventData.type || "MAINTENANCE");
    setNewEntry({
      unitId: eventData.unitId?.toString() || "",
      date: eventData.date?.includes('T') ? eventData.date.substring(0, 16) : `${eventData.date}T08:00`,
      desc: eventData.description || ""
    });
    setShowModal(true);
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const monthNames = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];
  const dailyEvents = events.filter(e => e.date && e.date.startsWith(selectedDate || "---"));

  return (
    <PasswordGuard moduleKey="CALENDAR">
      <div style={pageStyle}>
        <style>{`
          .type-btn { flex: 1; border: 2px solid transparent; color: #fff; padding: 10px; borderRadius: 8px; cursor: pointer; font-size: 11px; opacity: 0.5; transition: 0.2s; }
          .type-btn.active { opacity: 1; border-color: white; transform: scale(1.05); }
          .day-cell:hover { background: #334155 !important; }
        `}</style>

        <header style={{ marginBottom: '25px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => selectedDate ? setSelectedDate(null) : router.push("/")} style={backBtn}>
              {selectedDate ? "← Vissza" : "⬅ Főmenü"}
            </button>
            
            <div style={{ display: 'flex', gap: '10px' }}>
                {!selectedDate && (
                  <>
                    <button onClick={() => router.push("/clients/new")} style={{...backBtn, background: '#0078d7', borderColor: '#0078d7'}}>+ ÚJ ÜGYFÉL</button>
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} style={navBtn}>‹</button>
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} style={navBtn}>›</button>
                  </>
                )}
            </div>
          </div>
          
          <h1 style={{ fontSize: '28px', marginTop: '20px', marginBottom: 0, fontWeight: '800', letterSpacing: '-0.5px' }}>
            {selectedDate ? `📅 ${selectedDate}` : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
          </h1>
        </header>

        <main style={{ flex: 1 }}>
          {selectedDate ? (
            <div style={dailyContainer}>
              <button onClick={() => {
                setNewEntry({unitId: "", desc: "", date: `${selectedDate}T08:00`});
                setEditingId(null);
                setShowModal(true);
              }} style={addFullBtn}>+ ÚJ FELADAT ERRE A NAPRA</button>
              
              {dailyEvents.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px' }}>Nincs erre a napra rögzített feladat.</p>
              ) : (
                dailyEvents.map(ev => (
                  <div key={ev.id} onClick={(e) => openEdit(e, ev)} style={{...dailyCard, borderLeft: `6px solid ${TYPE_COLORS[ev.type]}`, position: 'relative'}}>
                    <button onClick={(e) => handleDelete(e, ev.id)} style={deleteBtnStyle}>TÖRLÉS</button>
                    <div style={{ fontWeight: 'bold', fontSize: '17px', paddingRight: '60px' }}>
                      {ev.unit?.client?.name ? `${ev.unit.client.name} - ${ev.unit.brand} ${ev.unit.model}` : ev.title}
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: '14px', marginTop: '5px' }}>{ev.description}</div>
                    <div style={{ marginTop: '12px', fontSize: '12px', color: TYPE_COLORS[ev.type], fontWeight: 'bold' }}>
                      {TYPE_LABELS[ev.type]} • {ev.date?.split('T')[1]?.substring(0, 5) || "Egész nap"}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div style={calendarGrid}>
              {["H", "K", "Sze", "Cs", "P", "Szo", "V"].map(d => <div key={d} style={dayHeader}>{d}</div>)}
              {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} style={emptyCell} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                const today = new Date();
                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                const isToday = dateStr === todayStr;

                const dayEvents = events.filter(e => e.date && e.date.startsWith(dateStr));
                
                return (
                  <div 
                      key={day} 
                      onClick={() => setSelectedDate(dateStr)} 
                      className="day-cell" 
                      style={{
                          ...cellStyle,
                          border: isToday ? '2px solid #f59e0b' : '1px solid transparent',
                          backgroundColor: isToday ? '#1e293b' : '#1e293b'
                      }}
                  >
                    <span style={{ 
                        fontSize: '13px', 
                        color: isToday ? '#f59e0b' : '#94a3b8', 
                        fontWeight: 'bold' 
                    }}>
                      {day} {isToday && <span style={{fontSize: '10px', marginLeft: '2px'}}>(Ma)</span>}
                    </span>
                    <div style={eventStack}>
                      {dayEvents.slice(0, 3).map(ev => (
                        <div key={ev.id} style={{ ...miniBar, backgroundColor: TYPE_COLORS[ev.type] }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {showModal && (
          <div style={modalOverlay}>
            <div style={modalContent}>
              <h3 style={{marginTop: 0, fontSize: '20px', marginBottom: '20px'}}>{editingId ? "Módosítás" : "Új bejegyzés"}</h3>
              
              <div style={{display: 'flex', gap: '8px', marginBottom: '20px'}}>
                {Object.keys(TYPE_COLORS).map(t => (
                  <button key={t} className={`type-btn ${activeType === t ? 'active' : ''}`}
                    onClick={() => setActiveType(t)} style={{ backgroundColor: TYPE_COLORS[t] }}>
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>

              <label style={labelStyle}>ÜGYFÉL KIVÁLASZTÁSA</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <select 
                  style={{ ...inputStyle, marginBottom: 0 }} 
                  value={newEntry.unitId} 
                  onChange={e => setNewEntry({...newEntry, unitId: e.target.value})}
                  disabled={!!editingId}
                  >
                  <option value="">-- Válassz ügyfelet --</option>
                  {units.map((u: any) => (
                      <option key={u.id} value={u.id.toString()}>
                      {u.displayName}
                      </option>
                  ))}
                  </select>
                  {!editingId && (
                      <button 
                          type="button" 
                          onClick={() => router.push("/clients/new")} 
                          style={miniAddBtn}
                          title="Új ügyfél felvétele"
                      >
                          +
                      </button>
                  )}
              </div>
              
              <label style={labelStyle}>IDŐPONT</label>
              <input type="datetime-local" style={inputStyle} value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} />
              
              <label style={labelStyle}>MEGJEGYZÉS</label>
              <textarea placeholder="Hiba leírása, elvégzendő munka..." style={{...inputStyle, minHeight: '80px'}} value={newEntry.desc} onChange={e => setNewEntry({...newEntry, desc: e.target.value})} />
              
              <button onClick={handleSave} style={saveBtn}>MENTÉS</button>
              <button onClick={() => setShowModal(false)} style={cancelBtn}>MÉGSE</button>
            </div>
          </div>
        )}
      </div>
    </PasswordGuard>
  );
}

// Stílusok maradnak...
const miniAddBtn: React.CSSProperties = { background: '#0078d7', color: '#fff', border: 'none', padding: '0 15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '20px' };
const deleteBtnStyle: React.CSSProperties = { position: 'absolute', top: '18px', right: '18px', background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' };
const labelStyle: React.CSSProperties = { fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '5px', display: 'block' };
const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', minHeight: "100vh", backgroundColor: "#121826", color: "#f8fafc", padding: "15px", fontFamily: "sans-serif" };
const backBtn: React.CSSProperties = { background: "#1e293b", border: "1px solid #334155", color: "#fff", padding: "10px 18px", borderRadius: "10px", cursor: "pointer", fontWeight: "600" };
const navBtn: React.CSSProperties = { background: "#334155", border: "none", color: "#fff", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontSize: "18px" };
const calendarGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", background: "#334155", padding: "4px", borderRadius: "12px" };
const dayHeader: React.CSSProperties = { padding: "12px", textAlign: "center", fontSize: "13px", fontWeight: "bold", color: "#94a3b8" };
const cellStyle: React.CSSProperties = { minHeight: "95px", padding: "12px", background: "#1e293b", cursor: "pointer", border: '1px solid transparent' };
const emptyCell: React.CSSProperties = { background: "#0f172a" };
const eventStack: React.CSSProperties = { display: "flex", gap: "3px", marginTop: "8px", flexWrap: 'wrap' };
const miniBar: React.CSSProperties = { width: "100%", height: "5px", borderRadius: "3px" };
const dailyContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '15px' };
const dailyCard: React.CSSProperties = { background: '#1e293b', padding: '18px', borderRadius: '14px', border: '1px solid #334155' };
const addFullBtn: React.CSSProperties = { background: '#2ecc71', color: '#fff', border: 'none', padding: '16px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer' };
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent: React.CSSProperties = { background: '#1e293b', padding: '25px', borderRadius: '20px', width: '90%', maxWidth: '420px', border: '1px solid #334155' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '14px', marginBottom: '12px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '10px', boxSizing: 'border-box' };
const saveBtn: React.CSSProperties = { width: '100%', padding: '14px', background: '#2ecc71', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: 'bold', marginBottom: '10px', cursor: 'pointer' };
const cancelBtn: React.CSSProperties = { width: '100%', padding: '14px', background: '#334155', border: 'none', color: '#fff', borderRadius: '10px', cursor: 'pointer' };
