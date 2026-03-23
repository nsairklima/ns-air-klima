"use client";

import React, { useEffect, useState } from "react";

type Client = { id: number; name: string };
type Quote = {
  id: number;
  clientId: number;
  client?: Client;
  title?: string | null;
  status: "draft" | "sent" | "accepted" | "rejected";
  grossTotal: number;
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [q, c] = await Promise.all([
        fetch("/api/quotes", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/clients", { cache: "no-store" }).then((r) => r.json()),
      ]);
      setQuotes(Array.isArray(q) ? q : []);
      setClients(Array.isArray(c) ? c : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createQuote(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) {
      alert("Válassz ügyfelet.");
      return;
    }
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: Number(clientId),
        title: title || null,
      }),
    });
    if (!res.ok) {
      alert("Hiba az ajánlat létrehozásakor.");
      return;
    }
    setClientId("");
    setTitle("");
    await load();
  }

  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif", maxWidth: 900, margin: "0 auto" }}>
      <a href="/admin/test-email" style={{ color: "#4DA3FF", textDecoration: "none" }}>← Vissza</a>
      <h1 style={{ marginTop: 12 }}>Ajánlatok</h1>

      {/* Új ajánlat űrlap */}
      <form onSubmit={createQuote} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 2fr auto", alignItems: "center" }}>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} style={input}>
            <option value="">– Válassz ügyfelet –</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            placeholder="Megnevezés (opcionális)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={input}
          />
          <button style={btnPrimary}>Létrehoz</button>
        </div>
      </form>

      {loading && <p>Betöltés…</p>}
      {!loading && quotes.length === 0 && <p>Még nincs ajánlat.</p>}

      <div style={{ display: "grid", gap: 10 }}>
        {quotes.map((q) => (
          <div key={q.id} style={{ border: "1px solid #e5e5e5", borderRadius: 8, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>#{q.id} — {q.title || "Megnevezés nélkül"}</strong>
              <span style={badge(q.status)}>{q.status}</span>
            </div>
            <div style={{ marginTop: 6, color: "#444", fontSize: 14 }}>
              Ügyfél: {q.client?.name || `#${q.clientId}`} • Bruttó: {Number(q.grossTotal).toLocaleString("hu-HU")} Ft
            </div>
            <div style={{ marginTop: 8 }}>
              <a href={`/quotes/${q.id}`} style={{ color: "#4DA3FF", textDecoration: "none" }}>
                Megnyitás →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const input: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
};

const btnPrimary: React.CSSProperties = {
  background: "#4DA3FF",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "10px 14px",
  cursor: "pointer",
};

function badge(status: Quote["status"]): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid #ddd",
    fontSize: 12,
    background: "#f7f7f7",
  };
  if (status === "sent") return { ...base, background: "#fff7d1" };
  if (status === "accepted") return { ...base, background: "#e9f9ee" };
  if (status === "rejected") return { ...base, background: "#ffe5e5" };
  return base; // draft
}
