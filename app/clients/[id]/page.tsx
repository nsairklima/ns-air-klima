"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ClientDetailsPage() {
  const params = useParams();
  const Id = params?.id;

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [location, setLocation] = useState("");

  const loadClientData = async () => {
    const res = await fetch(`/api/clients/${Id}`);
    if (res.ok) setClient(await res.json());
    setLoading(false);
  };

  useEffect(() => { if (Id) loadClientData(); }, [Id]);

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { brand, model, serialNumber: serial, location };
    const res = await fetch(`/api/clients/${Id}/units`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setBrand(""); setModel(""); setSerial(""); setLocation("");
      setShowUnitForm(false);
      loadClientData();
    }
  };

  // --- TÖRLÉS FÜGGVÉNY ---
  const handleDeleteUnit = async (unitId: number) => {
    if (!confirm("Biztosan törlöd ezt a gépet?")) return;
    const res = await fetch(`/api/clients/${Id}/units/${unitId}`, { method: "DELETE" });
    if (res.ok) loadClientData();
  };

  if (loading) return <div style={{padding: 20}}>Betöltés...</div>;
  if (!client) return <div style={{padding: 20}}>Ügyfél nem található.</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto", fontFamily: "Arial" }}>
      <div style={{ borderBottom: "2px solid #eee", paddingBottom: 20, marginBottom: 30 }}>
        <h1>{client.name}</h1>
        <p>📞 {client.phone} | ✉️ {client.email}</p>
        <p>🏠 {client.address}</p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Telepített egységek</h2>
        <button onClick={() => setShowUnitForm(!showUnitForm)} style={{ background: "#27ae60", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer" }}>
          {showUnitForm ? "Mégse" : "+ Új gép"}
        </button>
      </div>

      {showUnitForm && (
        <div style={{ background: "#f9f9f9", padding: 20, borderRadius: 12, marginTop: 20, border: "1px solid #ddd" }}>
          <form onSubmit={handleAddUnit} style={{ display: "grid", gap: 10 }}>
            <input placeholder="Gyártó" value={brand} onChange={e => setBrand(e.target.value)} style={inputS} required />
            <input placeholder="Modell" value={model} onChange={e => setModel(e.target.value)} style={inputS} required />
            <input placeholder="Gyári szám" value={serial} onChange={e => setSerial(e.target.value)} style={inputS} />
            <input placeholder="Helyszín" value={location} onChange={e => setLocation(e.target.value)} style={inputS} />
            <button type="submit" style={{ background: "#2c3e50", color: "#fff", padding: 12, border: "none", borderRadius: 8 }}>Mentés</button>
          </form>
        </div>
      )}

      <div style={{ marginTop: 20, display: "grid", gap: 15 }}>
        {client.units?.map((unit: any) => (
          <div key={unit.id} style={{ padding: 15, border: "1px solid #eee", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff" }}>
            <div>
              <strong style={{ fontSize: 18 }}>{unit.brand} {unit.model}</strong>
              <div style={{ color: "#666" }}>{unit.location}</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button 
                onClick={() => window.location.href = `/clients/${Id}/unit/${unit.id}`}
                style={{ background: "#3498db", color: "#fff", border: "none", padding: "8px 15px", borderRadius: 6, cursor: "pointer" }}
              >
                Karbantartás →
              </button>
              
              {/* ITT VAN A TÖRLÉS GOMB, A MAP-EN BELÜL */}
              <button 
                onClick={() => handleDeleteUnit(unit.id)}
                style={{ background: "#e74c3c", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 6, cursor: "pointer" }}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputS = { width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #ccc" };
