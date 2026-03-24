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
      {/* --- EGYSÉGES NAVIGÁCIÓ --- */}
      <div style={{ display: "flex", gap: 10, marginBottom: 25 }}>
        <button onClick={() => router.back()} style={navBtn}>
          ⬅️ Mégse / Vissza
        </button>
        <button onClick={() => router.push("/")} style={{ ...navBtn, background: "#f8f9fa", color: "#333" }}>
          🏠 Főoldal
        </button>
      </div>

      <h1 style={{ marginTop: 12, color: "#2c3e50" }}>Új ajánlat indítása</h1>

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
          {loading ? "Létrehozás..." : "Ajánlat létrehozása és szerkesztése →"}
        </button>
      </form>
    </div>
  );
}

/* ---- STÍLUSOK ---- */
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

const wrap: React.CSSProperties = { padding: 24, maxWidth: 600, margin: "0 auto", fontFamily: "Arial" };

const formCard: React.CSSProperties = { 
  background: "#fcfcfc", 
  padding: 30, 
  borderRadius: 15, 
  border: "1px solid #eee",
  boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
  marginTop: 20 
};

const formGroup: React.CSSProperties = { marginBottom: 20 };
const label: React.CSSProperties = { display: "block", marginBottom: 8, fontWeight: "bold", fontSize: 14, color: "#555" };

const input: React.CSSProperties = { 
  width: "100%", 
  padding: "12px", 
  borderRadius: 8, 
  border: "1px solid #ccc",
  fontSize: 16,
  boxSizing: "border-box"
};

const btnPrimary: React.CSSProperties = { 
  width: "100%", 
  background: "#2c3e50", 
  color: "#fff", 
  border: "none", 
  padding: "15px", 
  borderRadius: 10, 
  fontWeight: "bold", 
  cursor: "pointer",
  fontSize: 16,
  transition: "0.2s"
};
