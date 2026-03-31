"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function UnitDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { id: clientId, unitId } = params;

  const [unit, setUnit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Karbantartás form állapotok
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [desc, setDesc] = useState("");
  const [nextDate, setNextDate] = useState(""); // Ez lesz a nextDue

  const loadData = async () => {
    const res = await fetch(`/api/clients/${clientId}/units/${unitId}`);
    if (res.ok) setUnit(await res.json());
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [unitId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const method = editingLogId ? "PATCH" : "POST";
    const url = editingLogId 
      ? `/api/maintenance/${editingLogId}` 
      : `/api/clients/${clientId}/units/${unitId}/maintenance`;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        performedDate: date,
        description: desc,
        // JAVÍTÁS: nextServiceDate helyett nextDue-t kell küldeni!
        nextDue: nextDate || null, 
      }),
    });

    if (res.ok) {
      resetForm();
      loadData();
    }
  };

  const startEdit = (log: any) => {
    setEditingLogId(log.id);
    setDate(new Date(log.performedDate).toISOString().split("T")[0]);
    setDesc(log.description);
    // JAVÍTÁS: Itt is nextDue-t olvasunk ki
    setNextDate(log.nextDue ? new Date(log.nextDue).toISOString().split("T")[0] : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingLogId(null);
    setDesc("");
    setNextDate("");
    setDate(new Date().toISOString().split("T")[0]);
  };

  const handleDelete = async (logId: number) => {
    if (!confirm("Biztosan törlöd ezt a bejegyzést?")) return;
    const res = await fetch(`/api/maintenance/${logId}`, { method: "DELETE" });
    if (res.ok) loadData();
  };

  if (loading) return <div style={{ padding: 20 }}>Betöltés...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto", fontFamily: "Arial" }}>
      <button onClick={() => router.push(`/clients/${clientId}`)} style={navBtn}>⬅️ Vissza a gép listához</button>

      <h1 style={{ color: "#2c3e50", marginTop: 20 }}>❄️ {unit.brand} {unit.model}</h1>
      <p style={{ color: "#666" }}>Helyszín: {unit.location} | S/N: {unit.serialNumber}</p>

      {/* KARBANTARTÁS FORM */}
      <div style={{ background: editingLogId ? "#fff3e0" : "#f8f9fa", padding: 20, borderRadius: 12, border: "1px solid #ddd", marginBottom: 30 }}>
        <h3 style={{ marginTop: 0 }}>{editingLogId ? "✏️ Bejegyzés szerkesztése" : "➕ Új karbantartás rögzítése"}</h3>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 15 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={labS}>Dátum</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputS} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labS}>Következő esedékesség (Manuális)</label>
              <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} style={inputS} />
            </div>
          </div>
          <div>
            <label style={labS}>Elvégzett munka leírása</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} style={{ ...inputS, height: 80 }} required />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" style={saveBtn}>{editingLogId ? "MÓDOSÍTÁS MENTÉSE" : "RÖGZÍTÉS"}</button>
            {editingLogId && <button type="button" onClick={resetForm} style={cancelBtn}>Mégse</button>}
          </div>
        </form>
      </div>

      {/* NAPLÓ LISTA */}
      <h3>Karbantartási napló</h3>
      <div style={{ display: "grid", gap: 15 }}>
        {unit.maintenance?.map((log: any) => (
          <div key={log.id} style={logCard}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "bold", fontSize: 16 }}>{new Date(log.performedDate).toLocaleDateString("hu-HU")}</div>
              <div style={{ margin: "5px 0", color: "#444" }}>{log.description}</div>
              {/* JAVÍTÁS: Itt is nextDue-t jelenítünk meg */}
              {log.nextDue && (
                <div style={{ fontSize: 13, color: "#e67e22", fontWeight: "bold" }}>
                  📅 Következő: {new Date(log.nextDue).toLocaleDateString("hu-HU")}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => startEdit(log)} style={iconBtn}>✏️</button>
              <button onClick={() => handleDelete(log.id)} style={{ ...iconBtn, color: "#e74c3c" }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const navBtn = { padding: "8px 15px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer" };
const inputS = { width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #ccc", fontFamily: "inherit" };
const labS = { fontSize: 12, fontWeight: "bold", color: "#666", marginBottom: 5, display: "block" };
const saveBtn = { background: "#2ecc71", color: "#fff", border: "none", padding: "12px 25px", borderRadius: 8, cursor: "pointer", fontWeight: "bold", flex: 1 };
const cancelBtn = { background: "#bdc3c7", color: "#fff", border: "none", padding: "12px 25px", borderRadius: 8, cursor: "pointer" };
const logCard = { padding: 15, border: "1px solid #eee", borderRadius: 10, background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "flex-start", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" };
const iconBtn = { background: "#f8f9fa", border: "1px solid #ddd", borderRadius: 6, padding: "5px 10px", cursor: "pointer" };
