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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeType, setActiveType] = useState("MAINTENANCE");
  
  // Touch állapothoz
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const [newEntry, setNewEntry] = useState({ 
    unitId: "", 
    title: "", 
    date: new Date().toISOString().substring(0, 16), 
    desc: ""
  });

  // Hónap váltó funkciók
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Swipe logika
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 70;  // 70px minimum elmozdulás
    const isRightSwipe = distance < -70;

    if (isLeftSwipe && !selectedDate) nextMonth();
    if (isRightSwipe && !selectedDate) prevMonth();

    setTouchStart(null);
    setTouchEnd(null);
  };

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

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const monthNames = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];
  const dailyEvents = events.filter(e => e.date.startsWith(selectedDate || "---"));

  return (
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
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
             {!selectedDate && (
               <>
                 <button onClick={() => {
                    setEditingId(null);
                    setNewEntry({ ...newEntry, date: new Date().toISOString().substring(0, 16) });
                    setShowModal(true);
                 }} style={quickAddBtn}>+ ÚJ</button>
                 
                 <button onClick={prevMonth} style={navBtn}>‹</button>
                 <button onClick={nextMonth} style={navBtn}>›</button>
               </>
             )}
          </div>
        </div>
        
        <h1 style={{ fontSize: '28px', marginTop: '20px', marginBottom: 0, fontWeight: '800', letterSpacing: '-0.5px' }}>
          {selectedDate ? `📅 ${selectedDate}` : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
        </h1>
      </header>

      <main 
        style={{ flex: 1, touchAction: 'none' }} 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {selectedDate ? (
          <div style={dailyContainer}>
            <button onClick={() => {
              setNewEntry({...newEntry, date: `${selectedDate}T08:00`});
              setEditingId(null);
              setShowModal(true);
            }} style={addFullBtn}>+ ÚJ FELADAT ERRE A NAPRA</button>
            
            {dailyEvents.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px' }}>Nincs erre a napra rögzített feladat.</p>
            ) : (
              dailyEvents.map(ev => (
                <div key={ev.id} onClick={(e) => openEdit(e, ev)} style={{...dailyCard, borderLeft: `6px solid ${TYPE_COLORS[ev.type]}`}}>
                  <div style={{ fontWeight: 'bold', fontSize: '17px' }}>{ev.title}</div>
                  <div style={{ color: '#cbd5e1', fontSize: '14px', marginTop: '5px' }}>{ev.description}</div>
                  <div style={{ marginTop: '12px', fontSize: '12px', color: TYPE_COLORS[ev.type], fontWeight: 'bold' }}>
                    {TYPE_LABELS[ev.type]} • {ev.date.split('T')[1]?.substring(0, 5) || "Egész nap"}
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
              const dayEvents = events.filter(e => e.date.startsWith(dateStr));
              
              return (
                <div key={day} onClick={() => setSelectedDate(dateStr)} className="day-cell" style={cellStyle}>
                  <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 'bold' }}>{day}</span>
                  <div style={eventStack}>
                    {dayEvents.slice(0, 3).map(ev => (
                      <div key={ev.id} style={{ ...miniBar, backgroundColor: TYPE_COLORS[ev.type] }} />
                    ))}
                    {dayEvents.length > 3 && <div style={{fontSize: '10px', color: '#64748b', fontWeight: 'bold'}}>+{dayEvents.length - 3}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer style={footerStyle}>
        <div style={footerDivider} />
        <p style={footerText}>NS-Air Klíma Rendszer v2.0 | 2026</p>
      </footer>

      {showModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{marginTop: 0, fontSize: '20px'}}>{editingId ? "Módosítás" : "Új bejegyzés"}</h3>
            <div style={{display: 'flex', gap: '8px', marginBottom: '15px'}}>
              {Object.keys(TYPE_COLORS).map(t => (
                <button key={t} className={`type-btn ${activeType === t ? 'active' : ''}`}
                  onClick={() => setActiveType(t)} style={{ backgroundColor: TYPE_COLORS[t] }}>
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
            
            <select style={inputStyle} value={newEntry.unitId} onChange={e => setNewEntry({...newEntry, unitId: e.target.value})}>
                <option value="">-- Válassz ügyfelet --</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.displayName || u.model}</option>)}
            </select>

            <input type="datetime-local" style={inputStyle} value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} />
            <textarea placeholder="Megjegyzés" style={{...inputStyle, minHeight: '80px'}} value={newEntry.desc} onChange={e => setNewEntry({...newEntry, desc: e.target.value})} />
            
            <button onClick={handleSave} style={saveBtn}>MENTÉS</button>
            <button onClick={() => setShowModal(false)} style={cancelBtn}>MÉGSE</button>
          </div>
        </div>
      )}
    </div>
  );
}

// STÍLUSOK (Változatlanul)
const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', minHeight: "100vh", backgroundColor: "#121826", color: "#f8fafc", padding: "15px", fontFamily: "sans-serif" };
const footerStyle: React.CSSProperties = { marginTop: '40px', paddingBottom: '10px', textAlign: 'center' };
const footerDivider: React.CSSProperties = { height: '1px', background: 'linear-gradient(90deg, transparent, #334155, transparent)', marginBottom: '15px' };
const footerText: React.CSSProperties = { fontSize: '12px', color: '#64748b', fontWeight: '600', letterSpacing: '1px', margin: 0, textTransform: 'uppercase' };
const backBtn: React.CSSProperties = { background: "#1e293b", border: "1px solid #334155", color: "#fff", padding: "10px 18px", borderRadius: "10px", cursor: "pointer", fontWeight: "600" };
const navBtn: React.CSSProperties = { background: "#334155", border: "none", color: "#fff", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontSize: "18px" };
const quickAddBtn: React.CSSProperties = { background: "#2ecc71", border: "none", color: "#fff", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", marginRight: "10px" };
const calendarGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", background: "#334155", padding: "4px", borderRadius: "12px" };
const dayHeader: React.CSSProperties = { padding: "12px", textAlign: "center", fontSize: "13px", fontWeight: "bold", color: "#94a3b8" };
const cellStyle: React.CSSProperties = { minHeight: "95px", padding: "12px", background: "#1e293b", cursor: "pointer" };
const emptyCell: React.CSSProperties = { background: "#0f172a" };
const eventStack: React.CSSProperties = { display: "flex", gap: "3px", marginTop: "8px", flexWrap: 'wrap' };
const miniBar: React.CSSProperties = { width: "100%", height: "5px", borderRadius: "3px" };
const dailyContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '15px' };
const dailyCard: React.CSSProperties = { background: '#1e293b', padding: '18px', borderRadius: '14px', border: '1px solid #334155' };
const addFullBtn: React.CSSProperties = { background: '#2ecc71', color: '#fff', border: 'none', padding: '16px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer' };
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent: React.CSSProperties = { background: '#1e293b', padding: '25px', borderRadius: '20px', width: '90%', maxWidth: '420px', border: '1px solid #334155' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '14px', marginBottom: '12px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '10px', boxSizing: 'border-box' };
const saveBtn: React.CSSProperties = { width: '100%', padding: '14px', background: '#2ecc71', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: 'bold', marginBottom: '10px' };
const cancelBtn: React.CSSProperties = { width: '100%', padding: '14px', background: '#334155', border: 'none', color: '#fff', borderRadius: '10px' };
