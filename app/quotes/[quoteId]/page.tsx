"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type QuoteItem = {
  id: number;
  description: string;
  quantity: number;
  unit: string;
  unitPriceNet: number;
  lineGross: number;
};

type Quote = {
  id: number;
  client: { name: string };
  items: QuoteItem[];
  grossTotal: number;
};

export default function QuoteEditPage() {
  const params = useParams();
  const quoteId = params?.quoteId;

  const [q, setQ] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  // Új tétel mezők
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState("db"); // ÚJ: egység (db, m, szett)
  const [basePrice, setBasePrice] = useState(0);
  const [profitType, setProfitType] = useState<"percent" | "fix">("percent");
  const [profitValue, setProfitValue] = useState(20);

  const loadQuote = async () => {
    const res = await fetch(`/api/quotes/${quoteId}`);
    if (res.ok) setQ(await res.json());
    setLoading(false);
  };

  useEffect(() => { if (quoteId) loadQuote(); }, [quoteId]);

  const calculatedUnitPriceNet = profitType === "percent" 
    ? basePrice * (1 + profitValue / 100) 
    : basePrice + profitValue;

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/quotes/${quoteId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: desc,
        quantity: qty,
        unit: unit,
        unitPriceNet: Math.round(calculatedUnitPriceNet),
        vatRate: 27,
      }),
    });
    setDesc(""); setBasePrice(0); loadQuote();
  };

  const deleteItem = async (itemId: number) => {
    if (!confirm("Biztosan törlöd ezt a tételt?")) return;
    const res = await fetch(`/api/quotes/${quoteId}/items?id=${itemId}`, { method: "DELETE" });
    if (res.ok) loadQuote();
  };

  if (loading) return <div style={{padding:20}}>Betöltés...</div>;
  if (!q) return <div style={{padding:20}}>Nincs meg az ajánlat.</div>;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "Arial" }}>
      <h1>{q.client?.name} ajánlata</h1>

      <div style={{ background: "#f4f4f4", padding: 20, borderRadius: 12 }}>
        <h3>+ Új tétel</h3>
        <form onSubmit={addItem} style={{ display: "grid", gap: 10 }}>
          <input placeholder="Leírás" value={desc} onChange={e => setDesc(e.target.value)} style={inputS} required />
          
          <div style={{ display: "flex", gap: 10 }}>
            <input type="number" placeholder="Menny." value={qty} onChange={e => setQty(Number(e.target.value))} style={{...inputS, width: 80}} />
            <select value={unit} onChange={e => setUnit(e.target.value)} style={{...inputS, width: 100}}>
              <option value="db">db</option>
              <option value="m">m</option>
              <option value="szett">szett</option>
              <option value="pár">pár</option>
              <option value="óra">óra</option>
            </select>
            <input type="number" placeholder="Beszerzési ár" value={basePrice} onChange={e => setBasePrice(Number(e.target.value))} style={inputS} />
            <input type="number" placeholder="Haszon" value={profitValue} onChange={e => setProfitValue(Number(e.target.value))} style={{...inputS, width: 100}} />
            <select value={profitType} onChange={e => setProfitType(e.target.value as any)} style={{...inputS, width: 80}}>
              <option value="percent">%</option>
              <option value="fix">Ft</option>
            </select>
          </div>
          <button type="submit" style={{ background: "#28a745", color: "#fff", padding: 10, border: "none", borderRadius: 8, cursor: "pointer" }}>
            Hozzáadás
          </button>
        </form>
      </div>

      <table style={{ width: "100%", marginTop: 20, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
            <th style={{ padding: 10 }}>Tétel</th>
            <th>Menny.</th>
            <th>Nettó egységár</th>
            <th>Bruttó összesen</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {q.items.map(it => (
            <tr key={it.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 10 }}>{it.description}</td>
              <td>{it.quantity} {it.unit}</td>
              <td>{it.unitPriceNet.toLocaleString()} Ft</td>
              <td>{it.lineGross.toLocaleString()} Ft</td>
              <td>
                <button onClick={() => deleteItem(it.id)} style={{ background: "none", border: "none", color: "red", cursor: "pointer", fontSize: 18 }}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <h2 style={{ textAlign: "right", marginTop: 20 }}>Összesen: {q.grossTotal.toLocaleString()} Ft</h2>
    </div>
  );
}

const inputS = { padding: "10px", borderRadius: 8, border: "1px solid #ccc" };
