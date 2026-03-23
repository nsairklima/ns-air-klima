"use client";

import React, { useEffect, useState } from "react";

type Quote = {
  id: number;
  status: string;
  netTotal: number;
  grossTotal: number;
  createdAt: string;
  client: { name: string };
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadQuotes() {
    try {
      const res = await fetch("/api/quotes", { cache: "no-store" });
      const data = await res.json();
      setQuotes(data);
    } catch (err) {
      console.error("Hiba az ajánlatok betöltésekor", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuotes();
  }, []);

  if (loading) return <div style={wrap}><p>Betöltés...</p></div>;

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Ajánlatok</h1>
        <a href="/quotes/new" style={btnPrimary}>+ Új ajánlat</a>
      </div>

      <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
        {quotes.length === 0 && <p>Még nincsenek ajánlatok.</p>}
        {quotes.map((q) => (
          <div key={q.id} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{q.client?.name || "Névtelen ügyfél"}</strong>
              <span style={statusBadge(q.status)}>{q.status}</span>
            </div>
            <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
              #{q.id} • {new Date(q.createdAt).toLocaleDateString("hu-HU")}
            </div>
            <div style={{ marginTop: 8, fontWeight: "bold" }}>
              Bruttó: {q.grossTotal?.toLocaleString("hu-HU")} Ft
            </div>
            <div style={{ marginTop: 10 }}>
              <a href={`/quotes/${q.id}`} style={{ color: "#4DA3FF", textDecoration: "none", fontSize: 14 }}>
                Részletek és szerkesztés →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- Stílusok ---- */
const wrap: React.CSSProperties = { padding: 24, maxWidth: 800, margin: "0 auto", fontFamily: "Arial, sans-serif" };
const card: React.CSSProperties = { border: "1px solid #eee", padding: 16, borderRadius: 8, background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" };
const btnPrimary: React.CSSProperties = { background: "#4DA3FF", color: "#fff", padding: "10px 16px", borderRadius: 6, textDecoration: "none", fontWeight: "bold" };

function statusBadge(status: string): React.CSSProperties {
  const base: React.CSSProperties = { padding: "4px 8px", borderRadius: 4, fontSize: 12, textTransform: "uppercase" };
  if (status === "accepted") return { ...base, background: "#e9f9ee", color: "#2b8a3e" };
  if (status === "sent") return { ...base, background: "#fff7d1", color: "#856404" };
  if (status === "rejected") return { ...base, background: "#ffe5e5", color: "#c92a2a" };
  return { ...base, background: "#f1f3f5", color: "#495057" };
}
