"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Quote = {
  id: number;
  status: "draft" | "sent" | "accepted" | "rejected";
  netTotal: number;
  vatAmount: number;
  grossTotal: number;
  client: { id: number; name: string };
  items: QuoteItem[];
};

type QuoteItem = {
  id: number;
  description: string;
  quantity: number;
  unit?: string | null;
  unitPriceNet: number;
  vatRate: number;
  lineNet: number;
  lineVat: number;
  lineGross: number;
};

export default function QuoteDetailPage() {
  const params = useParams();
  const quoteId = params?.quoteId;
  const id = Number(quoteId);

  const [q, setQ] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  // Új tétel űrlap állapotai
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [unitPriceNet, setUnitPriceNet] = useState("");
  const [vatRate, setVatRate] = useState("27");
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/quotes/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Hiba");
      const data = await res.json();
      setQ(data);
    } catch (err) {
      console.error(err);
      setQ(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || !unitPriceNet) return;
    setSaving(true);
    await fetch(`/api/quotes/${id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        quantity: Number(quantity),
        unit,
        unitPriceNet: Number(unitPriceNet),
        vatRate: Number(vatRate),
      }),
    });
    setSaving(false);
    setDescription("");
    setUnitPriceNet("");
    load();
  }

  async function setStatus(status: Quote["status"]) {
    await fetch(`/api/quotes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  if (loading) return <div style={wrap}>Betöltés...</div>;
  if (!q) return <div style={wrap}>Ajánlat nem található.</div>;

  return (
    <div style={wrap}>
      <a href="/quotes" style={{ color: "#666", textDecoration: "none" }}>← Vissza az ajánlatokhoz</a>
      <h1 style={{ marginTop: 12 }}>Ajánlat #{q.id}</h1>
      <div style={{ color: "#444" }}>
        Ügyfél: <strong>{q.client?.name || "Ismeretlen"}</strong>
      </div>

      <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setStatus("draft")} style={statusBtn("draft", q.status)}>Piszkozat</button>
        <button onClick={() => setStatus("sent")} style={statusBtn("sent", q.status)}>Elküldve</button>
        <button onClick={() => setStatus("accepted")} style={statusBtn("accepted", q.status)}>Elfogadva</button>
        <button onClick={() => setStatus("rejected")} style={statusBtn("rejected", q.status)}>Elutasítva</button>
        <a href={`/api/quotes/${q.id}/pdf`} target="_blank" style={{ marginLeft: "auto", color: "#4DA3FF" }}>PDF megnyitása →</a>
      </div>

      <h2 style={{ marginTop: 24 }}>Tételek</h2>
      <div style={{ display: "grid", gap: 8 }}>
        {q.items.map(it => (
          <div key={it.id} style={card}>
            <strong>{it.description}</strong> - {it.lineGross.toLocaleString()} Ft
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 16 }}>Új tétel</h3>
      <form onSubmit={addItem} style={form}>
        <input placeholder="Leírás" value={description} onChange={e => setDescription(e.target.value)} style={input} />
        <input placeholder="Ár" type="number" value={unitPriceNet} onChange={e => setUnitPriceNet(e.target.value)} style={input} />
        <button disabled={saving} style={btnPrimary}>Hozzáadás</button>
      </form>

      <h2 style={{ marginTop: 24 }}>Összesítés</h2>
      <div style={card}>
        <strong>Bruttó összesen: {q.grossTotal.toLocaleString()} Ft</strong>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { padding: 24, maxWidth: 800, margin: "0 auto", fontFamily: "Arial" };
const card: React.CSSProperties = { border: "1px solid #ddd", padding: 12, borderRadius: 8, background: "#fafafa" };
const form: React.CSSProperties = { display: "flex", gap: 8, marginTop: 8 };
const input: React.CSSProperties = { padding: 8, border: "1px solid #ccc", borderRadius: 4 };
const btnPrimary: React.CSSProperties = { background: "#4DA3FF", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 4, cursor: "pointer" };

function statusBtn(target: string, current: string): React.CSSProperties {
  return {
    padding: "6px 12px",
    borderRadius: 4,
    border: "1px solid #ccc",
    background: target === current ? "#eee" : "#fff",
    cursor: "pointer",
    fontWeight: target === current ? "bold" : "normal"
  };
}
