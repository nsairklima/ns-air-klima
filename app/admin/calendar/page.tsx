"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Színkód térkép
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
  // Új mező: type
  const [newEntry, setNewEntry] = useState({ unitId: "", date: "", desc: "", type: "MAINTENANCE" });

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
    if (!newEntry.unitId || !newEntry.date) return alert("Adatok megadása kötelező!");
    
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
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setNewEntry({ unitId: "", date: "", desc: "", type: "MAINTENANCE" });
  };

  // ... (naptár logika: changeMonth, daysInMonth, offset ugyanaz marad)

  return (
    <div style={pageStyle}>
      {/* ... header ugyanaz ... */}

      {showModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2 style={{marginTop: 0, fontSize: '20px'}}>Munka részletei</h2>
            
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
                  <option value="">-- Válassz --</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.displayName}</option>
                  ))}
                </select>
              </>
            )}
            
            <label style={labelStyle}>Dátum:</label>
            <input type="date" style={inputStyle} value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} />
            
            <label style={labelStyle}>Megjegyzés:</label>
            <textarea style={inputStyle} value={newEntry.desc} onChange={e => setNewEntry({...newEntry, desc: e.target.value})} />
            
            <button onClick={handleSave} style={{...navBtn, background: '#2ecc71', padding: '12px'}}>Mentés</button>
            <button onClick={closeModal} style={{...navBtn, background: '#444', marginTop: '10px'}}>Mégse</button>
          </div>
        </div>
      )}

      {/* NAPTÁR RÁCS */}
      <div style={calendarGrid}>
          {/* ... nap fejlécek ... */}
          {/* ... offset cellák ... */}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr);

            return (
              <div key={day} style={cellStyle}>
                <span style={dayNum}>{day}</span>
                <div style={eventContainer}>
                  {dayEvents.map((ev) => (
                    <div 
                      key={ev.id} 
                      style={{
                        ...eventBadge, 
                        // Itt dől el a szín a típus alapján!
                        backgroundColor: TYPE_COLORS[ev.type] || TYPE_COLORS.MAINTENANCE 
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(ev.id);
                        setNewEntry({ unitId: ev.unitId.toString(), date: ev.date, desc: ev.description, type: ev.type });
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
    </div>
  );
}

const typeBtn: React.CSSProperties = {
  flex: 1,
  border: 'none',
  color: '#fff',
  padding: '8px 5px',
  fontSize: '11px',
  cursor: 'pointer',
  borderRadius: '4px',
  transition: '0.2s'
};

// ... a többi stílus marad a régi
