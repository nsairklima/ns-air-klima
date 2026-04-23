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
    } catch (err) {
      console.error("Adatlekérési hiba:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!newEntry.unitId || !newEntry.date) return alert("Válassz ügyfelet és dátumot!");

    // FONTOS: Az API-d parseInt(unitId)-t vár a POST-nál!
    const payload = editingId 
      ? { id: editingId, description: newEntry.desc, performedDate: newEntry.date, type: newEntry.type }
      : { unitId: parseInt(newEntry.unitId), performedDate: newEntry.date, description: newEntry.desc, type: newEntry.type };

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

  // Amikor rákattintasz egy létező eseményre szerkesztéshez:
  const openEdit = (ev: any) => {
    setEditingId(ev.id);
    setNewEntry({
      unitId: ev.unitId.toString(), // A select-nek string kell az egyezéshez!
      date: ev.date ? ev.date.substring(0, 16) : "",
      desc: ev.description || "",
      type: ev.type || "MAINTENANCE"
    });
    setShowModal(true);
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  return (
    <div style={{ background: "#0f172a", color: "white", minHeight: "100vh", padding: "10px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
        <button onClick={() => selectedDate ? setSelectedDate(null) : router.push("/")} style={btnStyle}>
          {selectedDate ? "← Vissza" : "⬅ Menü"}
        </button>
        <button onClick={() => { setEditingId(null); setShowModal(true); }} style={{ ...btnStyle, background: "#2ecc71" }}>+ ÚJ</button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
        {selectedDate ? (
          <div style={{ gridColumn: "1 / -1" }}>
            {events.filter(e => e.date?.startsWith(selectedDate)).map(ev => (
              <div key={ev.id} onClick={() => openEdit(ev)} style={{ background: "#1e293b", padding: "15px", marginBottom: "10px", borderRadius: "10px", borderLeft: `5px solid ${TYPE_COLORS[ev.type]}` }}>
                <strong>{ev.title}</strong>
                <p style={{ fontSize: "13px", color: "#94a3b8" }}>{ev.description}</p>
              </div>
            ))}
          </div>
        ) : (
          Array.from({ length: daysInMonth + offset }).map((_, i) => {
            const day = i - offset + 1;
            if (day <= 0) return <div key={i} />;
            const dStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvs = events.filter(e => e.date?.startsWith(dStr));
            return (
              <div key={i} onClick={() => setSelectedDate(dStr)} style={{ background: "#1e293b", minHeight: "60px", padding: "5px" }}>
                <div style={{ fontSize: "10px" }}>{day}</div>
                {dayEvs.map(e => <div key={e.id} style={{ height: "4px", background: TYPE_COLORS[e.type], marginBottom: "2px" }} />)}
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#1e293b", padding: "20px", borderRadius: "15px", width: "90%", maxWidth: "400px" }}>
            <h3>{editingId ? "Módosítás" : "Új bejegyzés"}</h3>
            
            <label style={labelStyle}>ÜGYFÉL / GÉP</label>
            <div style={{ display: "flex", gap: "5px", marginBottom: "15px" }}>
              <select 
                style={inputStyle} 
                value={newEntry.unitId} 
                onChange={e => setNewEntry({ ...newEntry, unitId: e.target.value })}
              >
                <option value="">-- Válassz --</option>
                {units.map((u: any) => (
                  <option key={u.id} value={u.id.toString()}>
                    {/* Itt fűzzük össze a nevet, hogy felismerhető legyen */}
                    {u.client?.name} | {u.brand} - {u.model}
                  </option>
                ))}
              </select>
              <button onClick={() => router.push("/admin/units")} style={{ background: "#334155", border: "none", color: "white", padding: "0 10px", borderRadius: "8px" }}>+ ÜGYFÉL</button>
            </div>

            <label style={labelStyle}>DÁTUM</label>
            <input type="datetime-local" style={inputStyle} value={newEntry.date} onChange={e => setNewEntry({ ...newEntry, date: e.target.value })} />

            <label style={labelStyle}>MEGJEGYZÉS</label>
            <textarea style={{ ...inputStyle, minHeight: "80px" }} value={newEntry.desc} onChange={e => setNewEntry({ ...newEntry, desc: e.target.value })} />

            <button onClick={handleSave} style={{ ...btnStyle, width: "100%", background: "#2ecc71", marginBottom: "10px" }}>MENTÉS</button>
            <button onClick={() => setShowModal(false)} style={{ ...btnStyle, width: "100%", background: "#475569" }}>MÉGSE</button>
          </div>
        </div>
      )}
    </div>
  );
}

const btnStyle = { border: "none", padding: "10px 15px", borderRadius: "8px", color: "white", fontWeight: "bold", cursor: "pointer" };
const inputStyle = { width: "100%", padding: "12px", background: "#0f172a", border: "1px solid #334155", color: "white", borderRadius: "8px", marginBottom: "10px" };
const labelStyle = { fontSize: "12px", color: "#64748b", display: "block", marginBottom: "5px" };
