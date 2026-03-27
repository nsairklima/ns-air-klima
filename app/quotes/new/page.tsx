"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Client = { id: number; name: string; };
type DBItem = { id: number; name: string; price: number; unit: string; };

export default function NewQuotePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [dbItems, setDbItems] = useState<DBItem[]>([]); // ÚJ: Mentett tételek
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
    // ÚJ: Mentett termékek betöltése az adatbázisból
    fetch("/api/items").then(res => res.ok && res.json().then(setDbItems));
  }, []);

  // ÚJ: Automatikus kitöltés funkció
  const handleSelectDBItem = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = dbItems.find(i => i.id === Number(e.target.value));
    if (selected) {
      // Szétszedjük a nevet, ha pl. "Gree Amber (3.5kW)" formátumban van
      // Ha sima név, akkor a Modell mezőbe kerül
      setUnit({
        ...unit,
        model: selected.name,
        brand: "", // Ezt manuálisan is finomíthatod
        power: ""
      });
      // Az ajánlat címét is frissítjük, hogy látszódjon az ár vagy a név
      if (!quoteTitle) setQuoteTitle(`${mode === 'new' ? newClient.name : clients.find(c => c.id === Number(selectedClientId))?.name || "Ügyfél"} - ${selected.name}`);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      let clientId: number;
      let clientName = "";

      if (mode === 'new') {
        const cRes = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newClient),
        });
        if (!cRes.ok) throw new Error("Ügyfél hiba");
        const createdClient = await cRes.json();
        clientId = createdClient.id;
        clientName = newClient.name;
      } else {
        if (!selectedClientId) return alert("Válassz ügyfelet!");
        clientId = Number(selectedClientId);
        clientName = clients.find(c => c.id === clientId)?.name || "";
      }

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

      const generatedTitle = quoteTitle || 
        `${clientName} - ${unit.brand} ${unit.model} ${unit.power ? `(${unit.power})` : ""}`.trim();

      const qRes = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          title: generatedTitle,
        }),
      });

      if (qRes.ok) {
        const qData = await qRes.json();
        router.push(`/quotes/${qData.id}`);
      }
    } catch (err) {
      alert("Hiba történt a mentés során.");
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

      <h1 style={{ color: "#2c3e50", marginBottom: 10 }}>Új ajánlat indítása</h1>

      <div style={tabContainer}>
        <button onClick={() => setMode('existing')} style={{ ...tabBtn, borderBottom: mode === 'existing' ? "3px solid #3498db" : "none" }}>Meglévő ügyfél</button>
        <button onClick={() => setMode('new')} style={{ ...tabBtn, borderBottom: mode === 'new' ? "3px solid #3498db" : "none" }}>+ Új ügyfél</button>
      </div>

      <form onSubmit={handleSubmit} style={formCard}>
        <h3 style={sectionTitle}>👤 Ügyfél adatai</h3>
        {mode === 'existing' ? (
          <select style={input} value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} required>
            <option value="">-- Válassz ügyfelet --</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        ) : (
          <div style={grid}>
            <input style={input} placeholder="Név *" required value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} />
            <input style={input} placeholder="E-mail" type="email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
            <input style={input} placeholder="Telefon" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} />
            <input style={input} placeholder="Cím" value={newClient.address} onChange={e => setNewClient({...newClient, address: e.target.value})} />
          </div>
        )}

        <h3 style={{ ...sectionTitle, marginTop: 30 }}>❄️ Gép adatai</h3>
        
        {/* ÚJ: Választás az adatbázisból */}
        <div style={{marginBottom: 15}}>
            <label style={{fontSize: 12, color: "#3498db", fontWeight: "bold"}}>Betöltés az adatbázisból:</label>
            <select style={{...input, borderColor: "#3498db"}} onChange={handleSelectDBItem}>
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

        <h3 style={{ ...sectionTitle, marginTop: 30 }}>📝 Ajánlat címe</h3>
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

// Stílusok (maradtak az eredetiek)
const wrap: React.CSSProperties = { padding: 24, maxWidth: 700, margin: "0 auto", fontFamily: "Arial" };
const tabContainer = { display: "flex", gap: 20, marginBottom: 20 };
const tabBtn = { background: "none", border: "none", padding: "10px", cursor: "pointer", fontWeight: "bold" as const };
const formCard = { background: "#fff", padding: 25, borderRadius: 15, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" };
const sectionTitle = { fontSize: 16, color: "#7f8c8d", marginBottom: 15, borderBottom: "1px solid #eee", paddingBottom: 5 };
const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 };
const input = { width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #ddd", marginBottom: 10, boxSizing: "border-box" as "border-box" };
const btnPrimary = { width: "100%", background: "#2c3e50", color: "#fff", border: "none", padding: "15px", borderRadius: 10, fontWeight: "bold", cursor: "pointer", marginTop: 20 };
const navBtn = { padding: "8px 15px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer" };
