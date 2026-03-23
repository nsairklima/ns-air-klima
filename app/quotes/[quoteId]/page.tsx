"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type QuoteItem = {
  id: number;
  description: string;
  quantity: number;
  unitPriceNet: number;
  vatRate: number;
  lineGross: number;
};

type Quote = {
  id: number;
  status: string;
  client: { name: string; email: string };
  items: QuoteItem[];
  netTotal: number;
  grossTotal: number;
};

export default function QuoteEditPage() {
  const params = useParams();
  const quoteId = params?.quoteId;

  const [q, setQ] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  // Új tétel mezői (Okos számításhoz)
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState(1);
  const [basePrice, setBasePrice] = useState<number>(0); // Beszerzési ár
  const [profitType, setProfitType] = useState<"percent" | "fix">("percent");
  const [profitValue, setProfitValue] = useState<number>(20); // Alapból 20% haszon
  const [vat, setVat] = useState(27);

  const loadQuote = async () => {
    const res = await fetch(`/api/quotes/${quoteId}`);
    if (res.ok) setQ(await res.json());
    setLoading(false);
  };

  useEffect(() => { if (quoteId) loadQuote(); }, [quoteId]);

  // KISZÁMOLT ÉRTÉKEK (amit az ügyfél lát)
  const calculatedUnitPriceNet = profitType === "percent" 
    ? basePrice * (1 + profitValue / 100) 
    : basePrice + profitValue;
  
  const totalProfit = (calculatedUnitPriceNet - basePrice) * qty;

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/quotes/${quoteId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: desc,
        quantity: qty,
        unitPriceNet: calculatedUnitPriceNet,
        vatRate: vat,
      }),
    });
    if (res.ok) {
      setDesc("");
      setBasePrice(0);
      loadQuote();
    }
  };

  const sendEmail = async () => {
    alert("E-mail küldése folyamatban...");
    const res = await fetch(`/api/quotes/${quoteId}/send`, { method: "POST" });
    if (res.ok) alert("E-mail sikeresen elküldve!");
    else alert("Hiba történt a küldéskor.");
  };

  if (loading) return <div style={wrap}>Betöltés...</div>;
  if (!q) return <div style={wrap}>Ajánlat nem található.</div>;

  return (
    <div style={wrap}>
      <a href="/quotes" style={{ color: "#666" }}>← Vissza a listához</a>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
        <h1>Ajánlat: {q.client?.name}</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <a href={`/api/quotes/${quoteId}/pdf`} target="_blank" style={btn}>PDF megnyitása</a>
          <button onClick={sendEmail} style={btnPrimary}>Küldés e-mailben</button>
        </div>
      </div>

      {/* ÚJ TÉTEL FELVÉTELE - OKOS KALKULÁTOR */}
      <div style={card}>
        <h3>+ Új tétel hozzáadása (Kalkulátor)</h3>
        <form onSubmit={addItem} style={{ display: "grid", gap: 10 }}>
          <input placeholder="Megnevezés (pl. Gree Comfort X 3.5kW)" value={desc} onChange={e => setDesc(e.target.value)} style={input} required />
          
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={smallLabel}>Beszerzési ár (Nettó Ft)</label>
              <input type="number" value={basePrice} onChange={e => setBasePrice(Number(e.target.value))} style={input} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={smallLabel}>Haszon típusa</label>
              <select value={profitType} onChange={e => setProfitType(e.target.value as any)} style={input}>
                <option value="percent">Százalék (%)</option>
                <option value="fix">Fix összeg (Ft)</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={smallLabel}>Haszon mértéke</label>
              <input type="number" value={profitValue} onChange={e => setProfitValue(Number(e.target.value))} style={input} />
            </div>
          </div>

          <div style={{ background: "#e7f3ff", padding: "10px", borderRadius: "8px", fontSize: "14px" }}>
            <strong>Összegzés neked:</strong><br />
            Eladási ár (Nettó): {Math.round(calculatedUnitPriceNet).toLocaleString()} Ft | 
            Haszon ezen a tételen: <span style={{ color: "green", fontWeight: "bold" }}>{Math.round(totalProfit).toLocaleString()} Ft</span>
          </div>

          <button type="submit" style={btnSuccess}>Tétel hozzáadása az ajánlathoz</button>
        </form>
      </div>

      {/* TÉTELEK LISTÁJA */}
      <h3 style={{ marginTop: 30 }}>Ajánlat tételei</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #eee", textAlign: "left" }}>
            <th style={{ padding: 10 }}>Leírás</th>
            <th>Menny.</th>
            <th>Nettó egységár</th>
            <th>Bruttó érték</th>
          </tr>
        </thead>
        <tbody>
          {q.items.map(it => (
            <tr key={it.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 10 }}>{it.description}</td>
              <td>{it.quantity}</td>
              <td>{it.unitPriceNet.toLocaleString()} Ft</td>
              <td>{it.lineGross.toLocaleString()} Ft</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 20, textAlign: "right", fontSize: "18px" }}>
        <strong>Bruttó mindösszesen: {q.grossTotal.toLocaleString()} Ft</strong>
      </div>
    </div>
  );
}

/* ---- Stílusok ---- */
const wrap: React.CSSProperties = { padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "Arial" };
const card: React.CSSProperties = { background: "#fff", border: "1px solid #ddd", padding: 20, borderRadius: 12, marginTop: 20, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" };
const input: React.CSSProperties = { width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #ccc", boxSizing: "border-box" };
const smallLabel: React.CSSProperties = { fontSize: "12px", color: "#666", marginBottom: "4px", display: "block" };
const btn: React.CSSProperties = { padding: "10px 16px", borderRadius: 8, border: "1px solid #ccc", cursor: "pointer", textDecoration: "none", color: "#333", background: "#fff", display: "inline-block" };
const btnPrimary: React.CSSProperties = { ...btn, background: "#0070f3", color: "#fff", border: "none" };
const btnSuccess: React.CSSProperties = { ...btn, background: "#28a745", color: "#fff", border: "none", marginTop: 10 };
