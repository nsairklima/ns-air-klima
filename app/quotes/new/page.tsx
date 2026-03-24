"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Client = {
  id: number;
  name: string;
};

export default function NewQuotePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  // Mód választó: 'existing' (meglévő) vagy 'new' (új)
  const [mode, setMode] = useState<'existing' | 'new'>('existing');

  // Meglévő ügyfél állapota
  const [selectedClientId, setSelectedClientId] = useState("");

  // Új ügyfél állapotai
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");

  // Ajánlat címe
  const [title, setTitle] = useState("");

  useEffect(() => {
    async function fetchClients() {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    }
    fetchClients();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      let clientId: number;

      if (mode === 'new') {
        // 1. Új ügyfél létrehozása
        const clientRes = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newClientName,
            phone: newClientPhone,
            address: newClientAddress,
          }),
        });

        if (!clientRes.ok) throw new Error("Hiba az ügyfél létrehozásakor");
        const createdClient = await clientRes.json();
        clientId = createdClient.id;
      } else {
        // Meglévő ügyfél használata
        if (!selectedClientId) {
          alert("Kérlek válassz egy ügyfelet!");
          setLoading(false);
          return;
        }
        clientId = Number(selectedClientId);
      }

      // 2. Az árajánlat létrehozása a (régi vagy új) clientId-vel
      const quoteRes = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          title: title || "Új ajánlat",
        }),
      });

      if (quoteRes.ok) {
        const newQuote = await quoteRes.json();
        router.push(`/quotes/${newQuote.id}`);
      } else {
        alert("Hiba történt az ajánlat mentése során.");
      }
    } catch (error) {
      console.error(error);
      alert("Hiba történt a folyamat során.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={wrap}>
      <div style={{ display: "flex", gap: 10, marginBottom: 25 }}>
        <button onClick={() => router.back()} style={navBtn}>⬅️ Mégse</button>
        <button onClick={() => router.push("/")} style={{ ...navBtn, background: "#f8f9fa" }}>🏠 Főoldal</button>
      </div>

      <h1 style={{ color: "#2c3e50" }}>Új ajánlat indítása</h1>

      {/* MÓD VÁLASZTÓ KAPCSOLÓ */}
      <div style={tabContainer}>
        <button 
          onClick={() => setMode('existing')} 
          style={{ ...tabBtn, borderBottom: mode === 'existing' ? "3px solid #0070f3" : "none", color: mode === 'existing' ? "#0070f3" : "#666" }}
        >
          Meglévő ügyfél
        </button>
        <button 
          onClick={() => setMode('new')} 
          style={{ ...tabBtn, borderBottom: mode === 'new' ? "3px solid #0070f3" : "none", color: mode === 'new' ? "#0070f3" : "#666" }}
        >
          + Új ügyfél rögzítése
        </button>
      </div>

      <form onSubmit={handleSubmit} style={formCard}>
        {mode === 'existing' ? (
          <div style={formGroup}>
            <label style={label}>Ügyfél kiválasztása *</label>
            <select
              style={input}
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              required={mode === 'existing'}
            >
              <option value="">-- Válassz a listából --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{ animation: "fadeIn 0.3s" }}>
            <div style={formGroup}>
              <label style={label}>Ügyfél neve *</label>
              <input 
                style={input} 
                placeholder="Pl. Nagy Ervin" 
                value={newClientName} 
                onChange={e => setNewClientName(e.target.value)} 
                required={mode === 'new'}
              />
            </div>
            <div style={formGroup}>
              <label style={label}>Telefonszám</label>
              <input 
                style={input} 
                placeholder="06 30 ..." 
                value={newClientPhone} 
                onChange={e => setNewClientPhone(e.target.value)} 
              />
            </div>
            <div style={formGroup}>
              <label style={label}>Cím (Telepítés helye)</label>
              <input 
                style={input} 
                placeholder="Város, utca, házszám" 
                value={newClientAddress} 
                onChange={e => setNewClientAddress(e.target.value)} 
              />
            </div>
          </div>
        )}

        <hr style={{ margin: "20px 0", border: "0", borderTop: "1px solid #eee" }} />

        <div style={formGroup}>
          <label style={label}>Ajánlat megnevezése (opcionális)</label>
          <input
            style={input}
            placeholder="pl. Klíma telepítés - Nappali"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading} style={btnPrimary}>
          {loading ? "Folyamatban..." : "Ügyfél mentése és ajánlat szerkesztése →"}
        </button>
      </form>
    </div>
  );
}

/* ---- STÍLUSOK ---- */
const wrap: React.CSSProperties = { padding: 24, maxWidth: 600, margin: "0 auto", fontFamily: "Arial" };
const tabContainer: React.CSSProperties = { display: "flex", gap: 20, marginBottom: 20, borderBottom: "1px solid #ddd" };
const tabBtn: React.CSSProperties = { background: "none", border: "none", padding: "10px 5px", cursor: "pointer", fontWeight: "bold", fontSize: 15 };
const navBtn: React.CSSProperties = { padding: "8px 16px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontWeight: "bold" };
const formCard: React.CSSProperties = { background: "#fff", padding: 24, borderRadius: 12, border: "1px solid #eee", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" };
const formGroup: React.CSSProperties = { marginBottom: 16 };
const label: React.CSSProperties = { display: "block", marginBottom: 6, fontWeight: "bold", fontSize: 14, color: "#555" };
const input: React.CSSProperties = { width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 16, boxSizing: "border-box" };
const btnPrimary: React.CSSProperties = { width: "100%", background: "#2c3e50", color: "#fff", border: "none", padding: "15px", borderRadius: 10, fontWeight: "bold", cursor: "pointer", fontSize: 16 };
