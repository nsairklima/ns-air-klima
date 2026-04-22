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

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [translateX, setTranslateX] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [newEntry, setNewEntry] = useState({ 
    unitId: "", 
    date: new Date().toISOString().substring(0, 16), 
    desc: "" 
  });

  // JAVÍTVA: A kép alapján az API útvonalak pontosítása
  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/calendar'); // Ellenőrizd: app/api/calendar/route.ts létezik?
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) { console.error("Fetch hiba", e); }
  };

  const fetchUnits = async () => {
    try {
      // JAVÍTVA: A kép alapján az ügyfelek listája valószínűleg itt van
      const res = await fetch('/api/calendar/units'); 
      const data = await res.json();
      setUnits(Array.isArray(data) ? data : []);
    } catch (e) { console.error("Units hiba", e); }
  };

  useEffect(() => {
    fetchEvents();
    fetchUnits();
  }, []);

  const handleSave = async () => {
    if (!newEntry.unitId) return alert("Válassz ügyfelet!");
    
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

  const prevMonth = () => { if (isTransitioning) return; setIsTransitioning(true); setTranslateX(100); setTimeout(() => { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)); setTranslateX(-100); setTimeout(() => { setTranslateX(0); setIsTransitioning(false); }, 50); }, 150); };
  const nextMonth = () => { if (isTransitioning) return; setIsTransitioning(true); setTranslateX(-100); setTimeout(() => { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)); setTranslateX(100); setTimeout(() => { setTranslateX(0); setIsTransitioning(false); }, 50); }, 150); };
  const handleTouchStart = (e: React.TouchEvent) => { if (selectedDate) return; setTouchStart(e.targetTouches[0].clientX); };
  const handleTouchMove = (e: React.TouchEvent) => { if (touchStart === null || selectedDate) return; setTranslateX((e.targetTouches[0].clientX - touchStart) * 0.6); };
  const handleTouchEnd = () => { if (touchStart === null || selectedDate) return; if (translateX > 80) prevMonth(); else if (translateX < -80) nextMonth(); else setTranslateX(0); setTouchStart(null); };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const monthNames = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];

  return (
    <div style={pageStyle}>
      <style>{`
        .calendar-content { transition: ${isTransitioning ? 'transform 0.15s ease-out, opacity 0.15s' : 'none'}; opacity: ${isTransitioning ? 0.3 : 1}; }
        .type-btn { flex: 1; border: 2px solid transparent; color: #fff; padding: 10px; borderRadius: 8px; cursor: pointer; font-size: 11px; opacity: 0.5; transition: 0.2s; }
        .type-btn.active { opacity: 1; border-color: white; transform: scale(1.05); }
      `}</style>

      <header style={headerContainer}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => selectedDate ? setSelectedDate(null) : router.push("/")} style={backBtn}>
            {selectedDate ? "← Vissza" : "⬅ Főmenü"}
          </button>
          {!selectedDate && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setEditingId(null); setShowModal(true); }} style={quickAddBtn}>+ ÚJ</button>
              <button onClick={prevMonth} style={navBtn}>‹</button>
              <button onClick={nextMonth} style={navBtn}>›</button>
            </div>
          )}
        </div>
        <h1 style={monthTitle}>{selectedDate ? `📅 ${selectedDate}` : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}</h1>
      </header>

      <main style={{ flex: 1, overflow: 'hidden', touchAction: 'pan-y' }} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <div className="calendar-content" style={{ transform: `translateX(${translateX}px)`, height: '100%' }}>
          {selectedDate ? (
            <div style={dailyContainer}>
              <button onClick={() => { setNewEntry({...newEntry, date: `${selectedDate}T08:00`}); setEditingId(null); setShowModal(true); }} style={addFullBtn}>+ ÚJ FELADAT ERRE A NAPRA</button>
              {events.filter(e => e.date.startsWith(selectedDate)).map(ev => (
                <div key={ev.id} onClick={() => { setEditingId(ev.id); setActiveType(ev.type); setNewEntry({ unitId: ev.unitId.toString(), date: ev.date.substring(0,16), desc: ev.description }); setShowModal(true); }} style={{...dailyCard, borderLeft: `6px solid ${TYPE_COLORS[ev.type]}`}}>
                  <div style={{ fontWeight: 'bold' }}>{ev.title}</div>
                  <div style={{ color: '#cbd5e1', fontSize: '14px' }}>{ev.description}</div>
                </div>
              ))}
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
                  <div key={day} onClick={() => setSelectedDate(dateStr)} style={cellStyle}>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{day}</span>
                    <div style={eventStack}>{dayEvents.slice(0, 3).map(ev => <div key={ev.id} style={{ ...miniBar, backgroundColor: TYPE_COLORS[ev.type] }} />)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{marginTop: 0}}>Munka rögzítése</h3>
            <div style={{display: 'flex', gap: '8px', marginBottom: '15px'}}>
              {Object.keys(TYPE_COLORS).map(t => (
                <button key={t} className={`type-btn ${activeType === t ? 'active' : ''}`} onClick={() => setActiveType(t)} style={{ backgroundColor: TYPE_COLORS[t] }}>{TYPE_LABELS[t]}</button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <select style={{ ...inputStyle, marginBottom: 0, flex: 1 }} value={newEntry.unitId} onChange={e => setNewEntry({...newEntry, unitId: e.target.value})}>
                <option value="">-- Ügyfél választása --</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.displayName || u.model}</option>)}
              </select>
              <button 
                title="Új ügyfél létrehozása"
                // JAVÍTVA: A kép alapján az ügyfélkezelő oldalad valószínűleg itt van
                onClick={() => router.push("/admin/clients")} 
                style={{ ...navBtn, fontSize: '18px', padding: '0 15px', background: '#3b82f6' }}
              >
                +
              </button>
            </div>

            <input type="datetime-local" style={inputStyle} value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} />
            <textarea placeholder="Munka leírása..." style={{...inputStyle, minHeight: '80px'}} value={newEntry.desc} onChange={e => setNewEntry({...newEntry, desc: e.target.value})} />
            
            <button onClick={handleSave} style={saveBtn}>MENTÉS</button>
            <button onClick={() => setShowModal(false)} style={cancelBtn}>MÉGSE</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ... stílusok változatlanok ...
const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', height: "100vh", backgroundColor: "#121826", color: "#f8fafc", padding: "10px", fontFamily: "sans-serif", overflow: "hidden" };
const headerContainer: React.CSSProperties = { marginBottom: '10px', borderBottom: '1px solid #334155', paddingBottom: '10px' };
const monthTitle: React.CSSProperties = { fontSize: '20px', marginTop: '10px', fontWeight: '800' };
const backBtn: React.CSSProperties = { background: "#1e293b", border: "1px solid #334155", color: "#fff", padding: "8px 12px", borderRadius: "10px", fontSize: "13px" };
const navBtn: React.CSSProperties = { background: "#334155", border: "none", color: "#fff", padding: "8px 14px", borderRadius: "10px" };
const quickAddBtn: React.CSSProperties = { background: "#2ecc71", border: "none", color: "#fff", padding: "8px 16px", borderRadius: "10px", fontWeight: "bold" };
const calendarGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", background: "#334155", padding: "2px", borderRadius: "8px" };
const dayHeader: React.CSSProperties = { padding: "6px 0", textAlign: "center", fontSize: "11px", color: "#94a3b8" };
const cellStyle: React.CSSProperties = { minHeight: "75px", padding: "4px", background: "#1e293b", display: "flex", flexDirection: "column", justifyContent: "space-between" };
const emptyCell: React.CSSProperties = { background: "#0f172a" };
const eventStack: React.CSSProperties = { display: "flex", gap: "2px", flexWrap: 'wrap' };
const miniBar: React.CSSProperties = { width: "100%", height: "4px", borderRadius: "2px" };
const dailyContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' };
const dailyCard: React.CSSProperties = { background: '#1e293b', padding: '15px', borderRadius: '12px' };
const addFullBtn: React.CSSProperties = { background: '#2ecc71', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold' };
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent: React.CSSProperties = { background: '#1e293b', padding: '20px', borderRadius: '16px', width: '95%', maxWidth: '400px' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px', marginBottom: '12px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '8px', fontSize: '14px' };
const saveBtn: React.CSSProperties = { width: '100%', padding: '14px', background: '#2ecc71', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: 'bold', marginBottom: '8px' };
const cancelBtn: React.CSSProperties = { width: '100%', padding: '14px', background: '#334155', border: 'none', color: '#fff', borderRadius: '10px' };
