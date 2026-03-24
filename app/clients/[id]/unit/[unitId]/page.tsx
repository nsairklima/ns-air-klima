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

  // Állapotok
  const [desc, setDesc] = useState("Általános tisztítás, fertőtlenítés");
  const [performedDate, setPerformedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editDate, setEditDate] = useState("");

  const loadData = async () => {
    try {
      // cache: "no-store" kényszeríti a friss adatokat
      const res = await fetch(`/api/clients/${clientId}/units/${unitId}`, { cache: "no-store" });
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

  // --- TÖRLÉS JAVÍTVA ---
const handleDeleteLog = async (logId: number) => {
  if (!confirm("Biztosan törlöd ezt a karbantartást?")) return;

  try {
    // Az új, direkt útvonalat hívjuk: /api/maintenance/123
    const res = await fetch(`/api/maintenance/${logId}`, { 
      method: "DELETE" 
    });

    if (res.ok) {
      // Sikerült! Frissítjük a listát.
      await loadData(); 
    } else {
      const errorData = await res.json();
      alert("Hiba: " + (errorData.error || "Ismeretlen hiba történt"));
    }
  } catch (err) {
    console.error("Hálózati hiba:", err);
    alert("Hálózati hiba történt a törlés során.");
  }
};

  // --- MÓDOSÍTÁS MENTÉSE ---
  const handleUpdateLog = async (logId: number) => {
    const res = await fetch(`/api/clients/${clientId}/units/${unitId}/maintenance`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: logId, description: editDesc, performedDate: editDate }),
    });

    if (res.ok) {
      setEditingLogId(null);
      await loadData();
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/clients/${clientId}/units/${unitId}/maintenance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: desc, performedDate }),
    });
    if (res.ok) {
      setDesc("Általános tisztítás, fertőtlenítés");
      await loadData();
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Betöltés...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto", fontFamily: "Arial" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 25 }}>
        <button onClick={() => router.push(`/clients/${clientId}`)} style={navBtn}>⬅️ Vissza</button>
        <button onClick={() => router.push("/")} style={{ ...navBtn, background: "#f8f9fa", color: "#333" }}>🏠 Főoldal</button>
      </div>

      <div style={{ background: "#2c3e50", color: "#fff", padding: 20, borderRadius: 12, marginBottom: 30 }}>
        <h1>{unit?.brand} {unit?.model}</h1>
        <p>Helyszín: {unit?.location} | S/N: {unit?.serialNumber}</p>
      </div>

      <section style={{ marginBottom: 40, background: "#f9f9f9", padding: 20, borderRadius: 12, border: "1px solid #eee" }}>
        <h3>🛠️ Új karbantartás</h3>
        <form onSubmit={handleAddLog} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input type="date" value={performedDate} onChange={e => setPerformedDate(e.target.value)} style={inputS} />
          <input placeholder="Leírás..." value={desc} onChange={e => setDesc(e.target.value)} style={{ ...inputS, flex: 2 }} />
          <button type="submit" style={{ background: "#27ae60", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer" }}>Mentés</button>
        </form>
      </section>

      <h3>📜 Napló</h3>
      <div style={{ display: "grid", gap: 12 }}>
        {logs.map((log: any) => (
          <div key={log.id} style={cardStyle}>
            {editingLogId === log.id ? (
              <div style={{ display: "flex", gap: 10, width: "100%" }}>
                <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} style={inputS} />
                <input value={editDesc} onChange={e => setEditDesc(e.target.value)} style={{ ...inputS, flex: 1 }} />
                <button onClick={() => handleUpdateLog(log.id)} style={okBtn}>OK</button>
                <button onClick={() => setEditingLogId(null)} style={cancelBtn}>X</button>
              </div>
            ) : (
              <>
                <div>
                  <div style={{ fontWeight: "bold" }}>{new Date(log.performedDate).toLocaleDateString('hu-HU')}</div>
                  <div>{log.description}</div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => { setEditingLogId(log.id); setEditDesc(log.description); setEditDate(new Date(log.performedDate).toISOString().split('T')[0]); }} style={iconBtn}>✏️</button>
                  <button onClick={() => handleDeleteLog(log.id)} style={{...iconBtn, color: 'red'}}>🗑️</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const navBtn = { padding: "8px 16px", borderRadius: "8px", border: "1px solid #ddd", cursor: "pointer", fontWeight: "bold" as const };
const inputS = { padding: "10px", borderRadius: 6, border: "1px solid #ccc" };
const cardStyle = { borderLeft: "5px solid #3498db", padding: "15px", background: "#fff", boxShadow: "0 2px 5px rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" };
const iconBtn = { background: "none", border: "none", cursor: "pointer", fontSize: "16px" };
const okBtn = { background: "#2ecc71", color: "#fff", border: "none", padding: "5px 10px", borderRadius: 6, cursor: "pointer" };
const cancelBtn = { background: "#95a5a6", color: "#fff", border: "none", padding: "5px 10px", borderRadius: 6, cursor: "pointer" };
