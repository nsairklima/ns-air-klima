"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Client = { id: number; name: string; };

export default function NewQuotePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'existing' | 'new'>('existing');

  // Adat állapotok
  const [selectedClientId, setSelectedClientId] = useState("");
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "", address: "" });
  const [unit, setUnit] = useState({ brand: "", model: "", location: "" });
  const [quoteTitle, setQuoteTitle] = useState("");

  useEffect(() => {
    fetch("/api/clients").then(res => res.ok && res.json().then(setClients));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      let clientId: number;

      // 1. Ügyfél kezelése
      if (mode === 'new') {
        const cRes = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newClient),
        });
        if (!cRes.ok) throw new Error("Ügyfél hiba");
        const createdClient = await cRes.json();
        clientId = createdClient.id;
      } else {
        if (!selectedClientId) return alert("Válassz ügyfelet!");
        clientId = Number(selectedClientId);
      }

      // 2. Gép rögzítése (ha megadtál márkát vagy modellt)
      if (unit.brand || unit.model) {
        await fetch(`/api/clients/${clientId}/units`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(unit),
        });
      }

      // 3. Árajánlat létrehozása
      const qRes = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          title: quoteTitle || `${unit.brand} ${unit.model}`.trim() || "Új ajánlat",
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
        {/* ÜGYFÉL RÉSZ */}
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

        {/* GÉP RÉSZ */}
        <h3 style={{ ...sectionTitle, marginTop: 30 }}>❄️ Gép adatai (Ajánlat tárgya)</h3>
        <div style={grid}>
          <input style={input} placeholder="Gyártó (pl. Gree)" value={unit.brand} onChange={e => setUnit({...unit, brand: e.target.value})} />
          <input style={input} placeholder="Modell (pl. Amber 3.5kW)" value={unit.model} onChange={e => setUnit({...unit, model: e.target.value})} />
          <input style={input} placeholder="Helyszín (pl. Nappali)" value={unit.location} onChange={e => setUnit({...unit, location: e.target.value})} />
        </div>

        {/* AJÁNLAT CÍME */}
        <h3 style={{ ...sectionTitle, marginTop: 30 }}>📝 Ajánlat címe</h3>
        <input 
          style={input} 
          placeholder="Hagyd üresen, ha a gép nevét szeretnéd címnek" 
          value={quoteTitle} 
          onChange={e => setQuoteTitle(e.target.value)} 
        />

        <button type="submit" disabled={loading} style={btnPrimary}>
          {loading ? "Mentés..." : "Minden mentése és tételek hozzáadása →"}
        </button>
      </form>
    </div>
  );
}

const wrap: React.CSSProperties = { padding: 24, maxWidth: 700, margin: "0 auto", fontFamily: "Arial" };
const tabContainer = { display: "flex", gap: 20, marginBottom: 20 };
const tabBtn = { background: "none", border: "none", padding: "10px", cursor: "pointer", fontWeight: "bold" as const };
const formCard = { background: "#fff", padding: 25, borderRadius: 15, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" };
const sectionTitle = { fontSize: 16, color: "#7f8c8d", marginBottom: 15, borderBottom: "1px solid #eee", paddingBottom: 5 };
const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 };
const input = { width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #ddd", marginBottom: 10, boxSizing: "border-box" as "border-box" };
const btnPrimary = { width: "100%", background: "#2c3e50", color: "#fff", border: "none", padding: "15px", borderRadius: 10, fontWeight: "bold", cursor: "pointer", marginTop: 20 };
const navBtn = { padding: "8px 15px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer" };
