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
  const [selectedClientId, setSelectedClientId] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  // Ügyfelek betöltése a listához
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
    if (!selectedClientId) {
      alert("Kérlek, válassz egy ügyfelet!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: Number(selectedClientId),
          title: title || "Új ajánlat",
        }),
      });

      if (res.ok) {
        const newQuote = await res.json();
        // Ha sikerült, megyünk a tételek szerkesztéséhez
        router.push(`/quotes/${newQuote.id}`);
      } else {
        alert("Hiba történt a mentés során.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={wrap}>
      <a href="/quotes" style={{ color: "#666", textDecoration: "none" }}>← Mégse</a>
      <h1 style={{ marginTop: 12 }}>Új ajánlat indítása</h1>

      <form onSubmit={handleSubmit} style={formCard}>
        <div style={formGroup}>
          <label style={label}>Ügyfél kiválasztása *</label>
          <select
            style={input}
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            required
          >
            <option value="">-- Válassz ügyfelet --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div style={formGroup}>
          <label style={label}>Ajánlat megnevezése (opcionális)</label>
          <input
            style={input}
            placeholder="pl. Kovácsék - Gree Amber"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading} style={btnPrimary}>
          {loading ? "Létrehozás..." : "Ajánlat létrehozása és szerkesztése"}
        </button>
      </form>
    </div>
  );
}

/* ---- Stílusok ---- */
const wrap: React.CSSProperties = { padding: 24, maxWidth: 600, margin: "0 auto", fontFamily: "Arial" };
const formCard: React.CSSProperties = { 
  background: "#f9f9f9", 
  padding: 24, 
  borderRadius: 12, 
  border: "1px solid #ddd",
  marginTop: 20 
};
const formGroup: React.CSSProperties = { marginBottom: 16 };
const label: React.CSSProperties = { display: "block", marginBottom: 6, fontWeight: "bold", fontSize: 14 };
const input: React.CSSProperties = { 
  width: "100%", 
  padding: "10px", 
  borderRadius: 6, 
  border: "1px solid #ccc",
  fontSize: 16 
};
const btnPrimary: React.CSSProperties = { 
  width: "100%", 
  background: "#0070f3", 
  color: "#fff", 
  border: "none", 
  padding: "12px", 
  borderRadius: 6, 
  fontWeight: "bold", 
  cursor: "pointer",
  fontSize: 16
};
