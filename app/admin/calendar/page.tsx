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
  
  const [newEntry, setNewEntry] = useState({ 
    unitId: "", 
    date: "", 
    desc: "", 
    type: "MAINTENANCE" 
  });

  const fetchData = async () => {
    try {
      const [evRes, unitRes] = await Promise.all([
        fetch('/api/calendar'),
        fetch('/api/calendar/units')
      ]);
      const evData = await evRes.json();
      const unitData = await unitRes.json();
      setEvents(Array.isArray(evData) ? evData : []);
      setUnits(Array.isArray(unitData) ? unitData : []);
    } catch (err) { console.error("Hiba:", err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!newEntry.unitId || !newEntry.date) return alert("Válassz ügyfelet és dátumot!");

    const payload = {
      ...(editingId ? { id: editingId } : { unitId: parseInt(newEntry.unitId) }),
      performedDate: newEntry.date,
      description: newEntry.desc,
      type: newEntry.type
    };

    const res = await fetch('/api/calendar', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowModal(false);
      setEditingId(null);
      setNewEntry({ unitId: "", date: "", desc: "", type: "MAINTENANCE" });
      fetchData();
    }
  };

  const openEdit = (ev: any) => {
    setEditingId(ev.id);
    setNewEntry({
      unitId: ev.unitId.toString(),
      date: ev.date ? ev.date.substring(0, 16) : "",
      desc: ev.description || "",
      type: ev.type || "MAINTENANCE"
    });
    setShowModal(true);
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const monthNames = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];

  return (
    <div style={pageStyle}>
      <header style={headerRow}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={() => selectedDate ? setSelectedDate(null) : router.push("/")} style={backBtn}>
            {selectedDate ? "← Vissza" : "⬅ Főmenü"}
          </button>
        </div>
        <h2 style={monthTitle}>{selectedDate ? `📅 ${selectedDate}` : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}</h2>
        {!selectedDate && <button onClick={() => { setEditingId(null); setShowModal(true); }} style={addBtn}>+ ÚJ</button>}
      </header>

      <main style={{ flex: 1, overflowY: 'auto' }}>
        {selectedDate ? (
          <div style={dailyContainer}>
            <button onClick={() => { setNewEntry({...newEntry, date: `${selectedDate}T08:00`}); setEditingId(null); setShowModal(true); }} style={bigAddBtn}>+ ÚJ FELADAT ERRE A NAPRA</button>
            {events.filter(e => e.date?.startsWith(selectedDate)).map(ev => (
              <div key={ev.id} onClick={() => openEdit(ev)} style={{...dailyCard, borderLeft: `6px solid ${TYPE_COLORS[ev.type]}`}}>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{ev.title}</div>
                <div style={{ color: '#cbd5e1', fontSize: '14px', marginTop: '4px' }}>{ev.description}</div>
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
              const dayEvents = events.filter(e => e.date?.startsWith(dateStr));
              return (
                <div key={day} onClick={() => setSelectedDate(dateStr)} style={cellStyle}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{day}</span>
                  <div style={eventStack}>
                    {dayEvents.map(ev => <div key={ev.id} style={{ ...miniBar, backgroundColor: TYPE_COLORS[ev.type] }} />)}
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
            <h3 style={{marginTop: 0, marginBottom: '20px'}}>{editingId ? "Szerkesztés" : "Új rögzítése"}</h3>
            
            <div style={{display: 'flex', gap: '5px', marginBottom: '20px'}}>
              {Object.keys(TYPE_COLORS).map(t => (
                <button key={t} onClick={() => setNewEntry({...newEntry, type: t})}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: TYPE_COLORS[t], color: 'white', fontWeight: 'bold', opacity: newEntry.type === t ? 1 : 0.3, cursor: 'pointer', fontSize: '11px' }}>
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            <label style={labelStyle}>ÜGYFÉL / GÉP</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
              <select style={{ ...inputStyle, flex: 1, marginBottom: 0 }} value={newEntry.unitId} onChange={e => setNewEntry({...newEntry, unitId: e.target.value})}>
                <option value="">-- Válassz --</option>
                {units.map((u: any) => (
                  <option key={u.id} value={u.id.toString()}>
                    {u.client?.name} - {u.brand} {u.model}
                  </option>
                ))}
              </select>
              <button onClick={() => router.push("/admin/units")} style={innerAddBtn}>+ ÜGYFÉL</button>
            </div>

            <label style={labelStyle}>IDŐPONT</label>
            <input type="datetime-local" style={inputStyle} value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} />

            <label style={labelStyle}>MEGJEGYZÉS</label>
            <textarea style={{...inputStyle, minHeight: '80px'}} value={newEntry.desc} onChange={e => setNewEntry({...newEntry, desc: e.target.value})} />
            
            <button onClick={handleSave} style={saveBtn}>MENTÉS</button>
            <button onClick={() => setShowModal(false)} style={cancelBtn}>MÉGSE</button>
          </div>
        </div>
      )}
    </div>
  );
}

// STÍLUSOK - Visszaállítva a szép kinézet
const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', height: "100vh", backgroundColor: "#121826", color: "#f8fafc", padding: "15px", fontFamily: "sans-serif" };
const headerRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const monthTitle: React.CSSProperties = { fontSize: '18px', fontWeight: 'bold', margin: 0 };
const backBtn: React.CSSProperties = { background: "#1e293b", border: "1px solid #334155", color: "#fff", padding: "8px 12px", borderRadius: "10px", cursor: 'pointer' };
const addBtn: React.CSSProperties = { background: "#2ecc71", border: "none", color: "#fff", padding: "8px 16px", borderRadius: "10px", fontWeight: "bold", cursor: 'pointer' };
const calendarGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", background: "#334155", padding: "2px", borderRadius: "12px", overflow: 'hidden' };
const dayHeader: React.CSSProperties = { padding: "10px 0", textAlign: "center", fontSize: "12px", color: "#94a3b8", background: "#121826" };
const cellStyle: React.CSSProperties = { minHeight: "90px", padding: "8px", background: "#1e293b", display: "flex", flexDirection: "column", cursor: 'pointer' };
const emptyCell: React.CSSProperties = { background: "#0f172a" };
const eventStack: React.CSSProperties = { display: "flex", flexDirection: 'column', gap: "3px", marginTop: '5px' };
const miniBar: React.CSSProperties = { width: "100%", height: "4px", borderRadius: "2px" };
const dailyContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '10px' };
const dailyCard: React.CSSProperties = { background: '#1e293b', padding: '15px', borderRadius: '12px', cursor: 'pointer' };
const bigAddBtn: React.CSSProperties = { background: '#2ecc71', color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', marginBottom: '10px', cursor: 'pointer' };
const modalOverlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent: React.CSSProperties = { background: '#1e293b', padding: '25px', borderRadius: '20px', width: '95%', maxWidth: '420px' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px', marginBottom: '15px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '10px', fontSize: '15px' };
const labelStyle: React.CSSProperties = { fontSize: '11px', color: '#94a3b8', marginBottom: '5px', display: 'block', fontWeight: 'bold', textTransform: 'uppercase' };
const innerAddBtn: React.CSSProperties = { background: '#334155', border: 'none', color: '#fff', borderRadius: '10px', padding: '0 15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' };
const saveBtn: React.CSSProperties = { width: '100%', padding: '15px', background: '#2ecc71', border: 'none', color: '#fff', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' };
const cancelBtn: React.CSSProperties = { width: '100%', padding: '12px', background: 'transparent', border: 'none', color: '#94a3b8', borderRadius: '12px', cursor: 'pointer', marginTop: '5px' };
