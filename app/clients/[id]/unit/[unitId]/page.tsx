"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function UnitMaintenancePage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params?.id;
  const unitId = params?.unitId;

  const [unit, setUnit] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Új bejegyzés állapotai
  const [desc, setDesc] = useState("Általános tisztítás, fertőtlenítés");
  const [performedDate, setPerformedDate] = useState(new Date().toISOString().split('T')[0]);

  // SZERKESZTÉS állapotai
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editDate, setEditDate] = useState("");

  const loadData = async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}/units/${unitId}`);
      if (res.ok) {
        const data = await res.json();
        setUnit(data);
        setLogs(data.maintenance || []);
      }
    } catch (err) {
      console.error("Hiba:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (unitId) loadData(); }, [unitId]);

  // ÚJ MENTÉSE
  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/clients/${clientId}/units/${unitId}/maintenance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: desc, performedDate }),
    });

    if (res.ok) {
      setDesc("Általános tisztítás, fertőtlenítés");
      loadData();
    }
  };

  // SZERKESZTÉS INDÍTÁSA
  const startEdit = (log: any) => {
    setEditingLogId(log.id);
    setEditDesc(log.description);
    setEditDate(new Date(log.performedDate).toISOString().split('T')[0]);
  };

  // MÓDOSÍTÁS MENTÉSE
  const handleUpdateLog = async (logId: number) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/units/${unitId}/maintenance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: logId, description: editDesc, performedDate: editDate }),
      });

      if (res.ok) {
        setEditingLogId(null);
        loadData();
      } else {
        alert("Hiba a mentéskor.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // TÖRLÉS
  const handleDeleteLog = async (logId: number) => {
    if (!confirm("Biztosan törlöd ezt a bejegyzést?")) return;
    const res = await fetch(`/api/clients/${clientId}/units/${unitId}/maintenance?id=${logId}`, { method: "DELETE" });
    if (res.ok) loadData();
  };

  if (loading) return <div style={{ padding: 20 }}>Betöltés...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto", fontFamily: "Arial" }}>
      
      {/* --- EGYSÉGES NAVIGÁCIÓ --- */}
      <div style={{ display: "flex", gap: 10, marginBottom: 25 }}>
        <button onClick={() => router.push(`/clients/${clientId}`)} style={navBtn}>
          ⬅️ Vissza az ügyfélhez
        </button>
        <button onClick={() => router.push("/")} style={{ ...navBtn, background: "#f8f9fa", color: "#333" }}>
          🏠 Főoldal
        </button>
      </div>

      <div style={{ background: "#2c3e50", color: "#fff", padding: 20, borderRadius: 12, marginBottom: 30 }}>
        <h1 style={{ margin: 0 }}>{unit?.brand} {unit?.model}</h1>
        <p style={{ opacity: 0.8, margin: "10px 0 0 0" }}>Helyszín: {unit?.location} | S/N: {unit?.serialNumber}</p>
      </div>

      <section style={{ marginBottom: 40, background: "#f9f9f9", padding: 20, borderRadius: 12, border: "1px solid #eee" }}>
        <h3 style={{ marginTop: 0 }}>🛠️ Új karbantartás rögzítése</h3>
        <form onSubmit={handleAddLog} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input type="date" value={performedDate} onChange={e => setPerformedDate(e.target.value)} style={inputS} />
          <input placeholder="Leírás..." value={desc} onChange={e => setDesc(e.target.value)} style={{ ...inputS, flex: 2 }} />
          <button type="submit" style={{ background: "#27ae60", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>Mentés</button>
        </form>
      </section>

      <h3>📜 Karbantartási előzmények</h3>
      <div style={{ display: "grid", gap: 12 }}>
        {logs.length === 0 && <p style={{ color: "#888", fontStyle: "italic" }}>Még nem volt karbantartás rögzítve.</p>}
        {logs.map((log: any) => (
          <div key={log.id} style={{ 
            borderLeft: "5px solid #3498db", 
            padding: "15px 20px", 
            background: editingLogId === log.id ? "#fffef0" : "#fff", 
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
            borderRadius: "0 8px 8px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            {editingLogId === log.id ? (
              /* --- SZERKESZTÉS MÓD --- */
              <div style={{ display: "flex", gap: 10, width: "100%" }}>
                <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} style={inputS} />
                <input value={editDesc} onChange={e => setEditDesc(e.target.value)} style={{ ...inputS, flex: 1 }} />
                <button onClick={() => handleUpdateLog(log.id)} style={{ background: "#2ecc71", color: "#fff", border: "none", padding: "5px 10px", borderRadius: 6, cursor: "pointer" }}>OK</button>
                <button onClick={() => setEditingLogId(null)} style={{ background: "#95a5a6", color: "#fff", border: "none", padding: "5px 10px", borderRadius: 6, cursor: "pointer" }}>Mégse</button>
              </div>
            ) : (
              /* --- NORMÁL MÓD --- */
              <>
                <div>
                  <div style={{ fontWeight: "bold", color: "#34495e" }}>{new Date(log.performedDate).toLocaleDateString('hu-HU')}</div>
                  <div style={{ marginTop: 4 }}>{log.description}</div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => startEdit(log)} style={iconBtn} title="Szerkesztés">✏️</button>
                  <button onClick={() => handleDeleteLog(log.id)} style={iconBtn} title="Törlés">🗑️</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- STÍLUSOK --- */
const navBtn: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  background: "#fff",
  color: "#555",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "bold",
  display: "flex",
  alignItems: "center",
  gap: "5px"
};

const inputS = { padding: "10px", borderRadius: 6, border: "1px solid #ccc", fontSize: "14px" };
const iconBtn = { background: "none", border: "none", cursor: "pointer", fontSize: "16px", padding: "5px" };
