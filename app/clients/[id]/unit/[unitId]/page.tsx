"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function UnitMaintenancePage() {
  const params = useParams();
  const clientId = params?.id;
  const unitId = params?.unitId;

  const [unit, setUnit] = useState<any>(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Új bejegyzés állapotai
  const [desc, setDesc] = useState("Általános tisztítás, fertőtlenítés");
  const [performedDate, setPerformedDate] = useState(new Date().toISOString().split('T')[0]);

 const loadData = async () => {
  try {
    // Ellenőrizd, hogy az elérési út pontosan ez-e az API-hoz:
    const res = await fetch(`/api/clients/${clientId}/units/${unitId}`);
    if (res.ok) {
      const data = await res.json();
      setUnit(data);
      setLogs(data.maintenance || []);
    } else {
      console.error("Hiba a letöltéskor:", await res.text());
    }
  } catch (err) {
    console.error("Hálózati hiba:", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { if (unitId) loadData(); }, [unitId]);

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

  if (loading) return <div style={{padding: 20}}>Betöltés...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto", fontFamily: "Arial" }}>
      <button onClick={() => window.history.back()} style={{marginBottom: 20, cursor: "pointer", background: "none", border: "none", color: "#666"}}>← Vissza az ügyfélhez</button>
      
      <div style={{ background: "#2c3e50", color: "#fff", padding: 20, borderRadius: 12, marginBottom: 30 }}>
        <h1>{unit?.brand} {unit?.model}</h1>
        <p>Helyszín: {unit?.location} | S/N: {unit?.serialNumber}</p>
      </div>

      <section style={{ marginBottom: 40 }}>
        <h3>🛠️ Új karbantartás rögzítése</h3>
        <form onSubmit={handleAddLog} style={{ display: "flex", gap: 10, background: "#f4f4f4", padding: 15, borderRadius: 10 }}>
          <input type="date" value={performedDate} onChange={e => setPerformedDate(e.target.value)} style={inputS} />
          <input placeholder="Mit csináltál?" value={desc} onChange={e => setDesc(e.target.value)} style={{...inputS, flex: 2}} />
          <button type="submit" style={{ background: "#27ae60", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer" }}>Mentés</button>
        </form>
      </section>

      <h3>📜 Karbantartási előzmények</h3>
      <div style={{ display: "grid", gap: 10 }}>
        {logs.length === 0 && <p style={{color: "#888"}}>Még nem volt karbantartás rögzítve.</p>}
        {logs.map((log: any) => (
          <div key={log.id} style={{ borderLeft: "4px solid #3498db", padding: "10px 20px", background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ fontWeight: "bold" }}>{new Date(log.performedDate).toLocaleDateString('hu-HU')}</div>
            <div>{log.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputS = { padding: "10px", borderRadius: 6, border: "1px solid #ccc" };
