"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Client = { id: number; name: string; };
type DBItem = { id: number; name: string; price: number; unit: string; };

export default function NewQuotePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [dbItems, setDbItems] = useState<DBItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'existing' | 'new'>('existing');

  // Adat állapotok
  const [selectedClientId, setSelectedClientId] = useState("");
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "", address: "" });
  const [unit, setUnit] = useState({ brand: "", model: "", power: "", location: "" });
  const [quoteTitle, setQuoteTitle] = useState("");

  useEffect(() => {
    // Ügyfelek betöltése
    fetch("/api/clients").then(res => res.ok && res.json().then(setClients));
    // Mentett termékek betöltése
    fetch("/api/items").then(res => res.ok && res.json().then(setDbItems));
  }, []);

  const handleSelectDBItem = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = dbItems.find(i => i.id === Number(e.target.value));
    if (selected) {
      setUnit({
        ...unit,
        model: selected.name,
        brand: "", 
        power: ""
      });
      
      if (!quoteTitle) {
        const cName = mode === 'new' ? newClient.name : clients.find(c => c.id === Number(selectedClientId))?.name || "Ügyfél";
        setQuoteTitle(`${cName} - ${selected.name}`);
      }
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      let clientId: number;
      let clientName = "";

      // 1. Ügyfél kezelése
      if (mode === 'new') {
        const cRes = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newClient),
        });
        if (!cRes.ok) throw new Error("Ügyfél mentési hiba");
        const createdClient = await cRes.json();
        clientId = createdClient.id;
        clientName = newClient.name;
      } else {
        if (!selectedClientId) {
          alert("Válassz ügyfelet!");
          setLoading(false);
          return;
        }
        clientId = Number(selectedClientId);
        clientName = clients.find(c => c.id === clientId)?.name || "";
      }

      // 2. Gép mentése az ügyfélhez (ha van megadva gép)
      if (unit.brand || unit.model) {
        const fullModel = unit.power ? `${unit.model} (${unit.power})` : unit.model;
        await fetch(`/api/clients/${clientId}/units`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brand: unit.brand,
            model: fullModel,
            location: unit.location
          }),
        });
      }

      // 3. Ajánlat létrehozása
      const generatedTitle = quoteTitle || 
        `${clientName} - ${unit.brand} ${unit.model} ${unit.power ? `(${unit.power})` : ""}`.trim();

      const qRes = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          title: generatedTitle,
          status: "draft",
          items: []
        }),
      });

      if (qRes.ok) {
        const qData = await qRes.json();
        router.push(`/quotes/${qData.id}`);
      } else {
        const errorData = await qRes.json();
        throw new Error(errorData.details || "Hiba az ajánlat létrehozásakor");
      }
    } catch (err: any) {
      console.error(err);
      alert("Hiba: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={wrap}>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => router.back()} style={navBtn}>⬅️ Vissza</button>
        <button onClick={() => router.push("/")} style={navBtn}>🏠 Főoldal</button>
      </div>

      <h1 style={{ color: "#2c3e50", marginBottom: 15, fontSize: "1.8rem" }}>Új ajánlat indítása</h1>

      {/* FÜLEK / TABS */}
      <div style={tabContainer}>
        <button 
          type="button"
          onClick={() => setMode('existing')} 
          style={{ ...tabBtn, borderBottom: mode === 'existing' ? "3px solid #3498db" : "3px solid transparent", color: mode === 'existing' ? "#3498db" : "#7f8c8d" }}
        >
          Meglévő ügyfél
        </button>
        <button 
          type="button"
          onClick={() => setMode('new')} 
          style={{ ...tabBtn, borderBottom: mode === 'new' ? "3px solid #3498db" : "3px solid transparent", color: mode === 'new' ? "#3498db" : "#7f8c8d" }}
        >
          + Új ügyfél
        </button>
      </div>

      {/* FORM MASZK */}
      <form onSubmit={handleSubmit} style={formCard}>
        <h3 style={sectionTitle}>👤 Ügyfél adatai</h3>
        {mode === 'existing' ? (
          <select style={input} value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} required={mode === 'existing'}>
            <option value="">-- Válassz ügyfelet --</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        ) : (
          <div style={grid}>
            <input style={input} placeholder="Név *" required={mode === 'new'} value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} />
            <input style={input} placeholder="E-mail" type="email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
            <input style={input} placeholder="Telefon" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} />
            <input style={input} placeholder="Cím" value={newClient.address} onChange={e => setNewClient({...newClient, address: e.target.value})} />
          </div>
        )}

        <h3 style={{ ...sectionTitle, marginTop: 25 }}>❄️ Gép adatai</h3>
        
        <div style={{ marginBottom: 15 }}>
            <label style={{ fontSize: 11, color: "#3498db", fontWeight: "bold", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Betöltés az adatbázisból:</label>
            <select style={{ ...input, borderColor: "#3498db" }} onChange={handleSelectDBItem}>
                <option value="">-- Válassz elmentett típust (opcionális) --</option>
                {dbItems.map(item => (
                    <option key={item.id} value={item.id}>{item.name} ({item.price.toLocaleString()} Ft)</option>
                ))}
            </select>
        </div>

        <div style={grid}>
          <input style={input} placeholder="Gyártó (pl. Gree)" value={unit.brand} onChange={e => setUnit({...unit, brand: e.target.value})} />
          <input style={input} placeholder="Modell (pl. Amber)" value={unit.model} onChange={e => setUnit({...unit, model: e.target.value})} />
          <input style={input} placeholder="Teljesítmény (pl. 3.5kW)" value={unit.power} onChange={e => setUnit({...unit, power: e.target.value})} />
          <input style={input} placeholder="Helyszín (pl. Nappali)" value={unit.location} onChange={e => setUnit({...unit, location: e.target.value})} />
        </div>

        <h3 style={{ ...sectionTitle, marginTop: 25 }}>📝 Ajánlat címe</h3>
        <input 
          style={input} 
          placeholder="Hagyja üresen az automatikus névhez" 
          value={quoteTitle} 
          onChange={e => setQuoteTitle(e.target.value)} 
        />
        
        <button type="submit" disabled={loading} style={btnPrimary}>
          {loading ? "Mentés..." : "Ajánlat létrehozása →"}
        </button>
      </form>
    </div>
  );
}

// --- TELJESEN RESZPONZÍV STÍLUSOK ---
const wrap: React.CSSProperties = { padding: "20px 12px", maxWidth: 700, margin: "0 auto", fontFamily: "Arial, sans-serif", boxSizing: "border-box" };
const tabContainer = { display: "flex", gap: 10, marginBottom: 20, borderBottom: "1px solid #eee" };
const tabBtn = { background: "none", border: "none", padding: "12px 16px", cursor: "pointer", fontWeight: "bold" as const, fontSize: "15px", transition: "all 0.2s" };
const formCard = { background: "#fff", padding: "20px 16px", borderRadius: 15, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", boxSizing: "border-box" as const };
const sectionTitle = { fontSize: 14, color: "#7f8c8d", marginBottom: 15, borderBottom: "1px solid #eee", paddingBottom: 6, textTransform: "uppercase" as const, fontWeight: "bold" };

// Ez a grid intézi az űrlapot: mobilon egymás alá teszi a mezőket, asztalon 2 oszlopos marad
const grid = { 
  display: "grid", 
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", 
  gap: "12px",
  marginBottom: 10
};

const input = { 
  width: "100%", 
  padding: "14px", 
  borderRadius: 8, 
  border: "1px solid #ddd", 
  boxSizing: "border-box" as const,
  fontSize: "16px", // Megakadályozza az iOS kényszerített közelítését!
  color: "#333",
  background: "#fff",
  outline: "none"
};

const btnPrimary = { width: "100%", background: "#2c3e50", color: "#fff", border: "none", padding: "16px", borderRadius: 10, fontWeight: "bold", cursor: "pointer", marginTop: 20, fontSize: "16px" };
const navBtn = { padding: "10px 18px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontWeight: "bold", fontSize: "14px" };
