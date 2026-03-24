"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
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

  const handleDeleteClient = async () => {
    if (!confirm("⚠️ FIGYELEM! Biztosan törölni akarod ezt az ügyfelet? Minden gép, karbantartás és árajánlat is törlődni fog!")) return;
    
    try {
      const res = await fetch(`/api/clients/${Id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Ügyfél sikeresen törölve.");
        router.push("/clients");
      } else {
        alert("Hiba történt a törlés során.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteQuote = async (quoteId: number) => {
    if (!confirm("Biztosan törlöd ezt az árajánlatot?")) return;
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, { method: "DELETE" });
      if (res.ok) loadClientData();
    } catch (error) {
      console.error(error);
    }
  };

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

  const handleDeleteUnit = async (unitId: number) => {
    if (!confirm("Biztosan törlöd ezt a gépet?")) return;
    const res = await fetch(`/api/clients/${Id}/units/${unitId}`, { method: "DELETE" });
    if (res.ok) loadClientData();
  };

  if (loading) return <div style={{padding: 20}}>Betöltés...</div>;
  if (!client) return <div style={{padding: 20}}>Ügyfél nem található.</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto", fontFamily: "Arial" }}>
      
      {/* --- ÚJ NAVIGÁCIÓS SÁV --- */}
      <div style={{ display: "flex", gap: 10, marginBottom: 25 }}>
        <button onClick={() => router.push("/clients")} style={navBtn}>
          ⬅️ Vissza az ügyfelekhez
        </button>
        <button onClick={() => router.push("/")} style={{ ...navBtn, background: "#f8f9fa", color: "#333" }}>
          🏠 Főoldal
        </button>
      </div>

      {/* ÜGYFÉL ADATAI + TÖRLÉS GOMB */}
      <div style={{ borderBottom: "2px solid #eee", paddingBottom: 20, marginBottom: 30, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: 0 }}>{client.name}</h1>
          <p style={{ margin: "10px 0 0 0" }}>📞 {client.phone} | ✉️ {client.email}</p>
          <p style={{ margin: "5px 0 0 0" }}>🏠 {client.address}</p>
        </div>
        <button 
          onClick={handleDeleteClient}
          style={{ background: "#fff", color: "#e74c3c", border: "1px solid #e74c3c", padding: "10px 15px", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}
        >
          🗑️ Ügyfél törlése
        </button>
      </div>

      {/* EGYSÉGEK SZAKASZ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ color: "#2c3e50" }}>Telepített egységek</h2>
        <button onClick={() => setShowUnitForm(!showUnitForm)} style={{ background: "#27ae60", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>
          {showUnitForm ? "Mégse" : "+ Új gép"}
        </button>
      </div>

      {showUnitForm && (
        <div style={{ background: "#f9f9f9", padding: 20, borderRadius: 12, marginTop: 10, border: "1px solid #ddd" }}>
          <form onSubmit={handleAddUnit} style={{ display: "grid", gap: 10 }}>
            <input placeholder="Gyártó" value={brand} onChange={e => setBrand(e.target.value)} style={inputS} required />
            <input placeholder="Modell" value={model} onChange={e => setModel(e.target.value)} style={inputS} required />
            <input placeholder="Gyári szám" value={serial} onChange={e => setSerial(e.target.value)} style={inputS} />
            <input placeholder="Helyszín" value={location} onChange={e => setLocation(e.target.value)} style={inputS} />
            <button type="submit" style={{ background: "#2c3e50", color: "#fff", padding: 12, border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>Mentés</button>
          </form>
        </div>
      )}

      <div style={{ marginTop: 20, display: "grid", gap: 15 }}>
        {client.units?.length === 0 && <p style={{color: "#999", fontStyle: "italic"}}>Nincs még regisztrált gép.</p>}
        {client.units?.map((unit: any) => (
          <div key={unit.id} style={{ padding: 15, border: "1px solid #eee", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff" }}>
            <div>
              <strong style={{ fontSize: 18 }}>{unit.brand} {unit.model}</strong>
              <div style={{ color: "#666" }}>{unit.location || "Nincs megadva helyszín"}</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button 
                onClick={() => window.location.href = `/clients/${Id}/unit/${unit.id}`}
                style={{ background: "#3498db", color: "#fff", border: "none", padding: "8px 15px", borderRadius: 6, cursor: "pointer" }}
              >
                Karbantartás →
              </button>
              <button 
                onClick={() => handleDeleteUnit(unit.id)}
                style={{ background: "#fdf2f2", color: "#e74c3c", border: "none", padding: "8px 12px", borderRadius: 6, cursor: "pointer" }}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ÁRAJÁNLATOK SZAKASZ */}
      <div style={{ marginTop: 50 }}>
        <h2 style={{ color: "#2c3e50", borderTop: "2px solid #eee", paddingTop: 30 }}>Korábbi árajánlatok</h2>
        <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
          {client.quotes?.length === 0 ? (
            <p style={{ color: "#999" }}>Ehhez az ügyfélhez még nem készült árajánlat.</p>
          ) : (
            client.quotes?.map((quote: any) => (
              <div key={quote.id} style={{ padding: "15px 20px", border: "1px solid #e1e8ed", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fcfdff" }}>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: 16 }}>#{quote.id}/2026 - {quote.title || "Árajánlat"}</div>
                  <div style={{ fontSize: 13, color: "#7f8c8d" }}>
                    Kelt: {new Date(quote.createdAt).toLocaleDateString('hu-HU')}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontWeight: "800", color: "#3498db", marginRight: 10 }}>
                    {Number(quote.grossTotal).toLocaleString()} Ft
                  </div>
                  <button 
                    onClick={() => window.location.href = `/quotes/${quote.id}/print`}
                    style={{ background: "#fff", color: "#3498db", border: "1px solid #3498db", padding: "8px 15px", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}
                  >
                    📄 Megnyitás
                  </button>
                  <button 
                    onClick={() => handleDeleteQuote(quote.id)}
                    style={{ background: "#fff", color: "#e74c3c", border: "1px solid #e74c3c", padding: "8px 12px", borderRadius: 6, cursor: "pointer" }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
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

const inputS = { width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #ccc", boxSizing: "border-box" as "border-box" };
