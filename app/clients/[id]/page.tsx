
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ClientDetailsPage() {
  const params = useParams();
  const clientId = params?.id;

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Új gép felvétele állapotok
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [location, setLocation] = useState(""); // pl. Nappali, Hálószoba

  const loadClientData = async () => {
    const res = await fetch(`/api/clients/${clientId}`);
    if (res.ok) setClient(await res.json());
    setLoading(false);
  };

  useEffect(() => { if (clientId) loadClientData(); }, [clientId]);

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/clients/${clientId}/units`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand, model, serialNumber: serial, location }),
    });

    if (res.ok) {
      setBrand(""); setModel(""); setSerial(""); setLocation("");
      setShowUnitForm(false);
      loadClientData();
    }
  };

  if (loading) return <div style={{padding: 20}}>Betöltés...</div>;
  if (!client) return <div style={{padding: 20}}>Ügyfél nem található.</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto", fontFamily: "Arial" }}>
      <div style={{ borderBottom: "2px solid #eee", paddingBottom: 20, marginBottom: 30 }}>
        <h1>{client.name}</h1>
        <p>📞 {client.phone || "Nincs telefonszám"} | ✉️ {client.email || "Nincs email"}</p>
        <p>🏠 {client.address || "Nincs cím"}</p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Telepített egységek (klímák)</h2>
        <button 
          onClick={() => setShowUnitForm(!showUnitForm)}
          style={{ background: "#27ae60", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer" }}
        >
          {showUnitForm ? "Mégse" : "+ Új gép hozzáadása"}
        </button>
      </div>

      {showUnitForm && (
        <div style={{ background: "#f9f9f9", padding: 20, borderRadius: 12, marginTop: 20, border: "1px solid #ddd" }}>
          <form onSubmit={handleAddUnit} style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <input placeholder="Gyártó (pl. Gree)" value={brand} onChange={e => setBrand(e.target.value)} style={inputS} required />
              <input placeholder="Modell (pl. Pulse)" value={model} onChange={e => setModel(e.target.value)} style={inputS} required />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <input placeholder="Gyári szám" value={serial} onChange={e => setSerial(e.target.value)} style={inputS} />
              <input placeholder="Helyszín (pl. Nappali)" value={location} onChange={e => setLocation(e.target.value)} style={inputS} />
            </div>
            <button type="submit" style={{ background: "#2c3e50", color: "#fff", padding: 12, border: "none", borderRadius: 8, cursor: "pointer" }}>Gép mentése</button>
          </form>
        </div>
      )}

      <div style={{ marginTop: 20, display: "grid", gap: 15 }}>
        {client.units?.length === 0 && <p style={{color: "#888"}}>Még nincs rögzített gép ennél az ügyfélnél.</p>}
        {client.units?.map((unit: any) => (
          <div key={unit.id} style={{ padding: 15, border: "1px solid #eee", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <div>
              <strong style={{ fontSize: 18 }}>{unit.brand} {unit.model}</strong>
              <div style={{ color: "#666", fontSize: 14 }}>Helyszín: {unit.location || "Nincs megadva"}</div>
              <div style={{ color: "#888", fontSize: 12 }}>S/N: {unit.serialNumber || "-"}</div>
            </div>
            <button 
              onClick={() => window.location.href = `/clients/${clientId}/unit/${unit.id}`}
              style={{ background: "#3498db", color: "#fff", border: "none", padding: "8px 15px", borderRadius: 6, cursor: "pointer" }}
            >
              Karbantartás Napló →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputS = { width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #ccc" };
