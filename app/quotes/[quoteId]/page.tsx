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

  // Új tétel mezői a kalkulátorhoz
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState(1);
  const [basePrice, setBasePrice] = useState<number>(0); 
  const [profitType, setProfitType] = useState<"percent" | "fix">("percent");
  const [profitValue, setProfitValue] = useState<number>(20); 
  const [vat, setVat] = useState(27);

  const loadQuote = async () => {
    const res = await fetch(`/api/quotes/${quoteId}`);
    if (res.ok) setQ(await res.json());
    setLoading(false);
  };

  useEffect(() => { if (quoteId) loadQuote(); }, [quoteId]);

  // AUTOMATIKUS SZÁMÍTÁSOK
  const calculatedUnitPriceNet = profitType === "percent" 
    ? basePrice * (1 + profitValue / 100) 
    : basePrice + profitValue;
  
  const lineProfit = (calculatedUnitPriceNet - basePrice) * qty;

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/quotes/${quoteId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: desc,
        quantity: qty,
        unitPriceNet: Math.round(calculatedUnitPriceNet),
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
    if (!confirm("Biztosan elküldöd az ajánlatot az ügyfélnek?")) return;
    const res = await fetch(`/api/quotes/${quoteId}/send`, { method: "POST" });
    if (res.ok) alert("E-mail sikeresen elküldve!");
    else alert("Hiba történt a küldéskor.");
  };

  if (loading) return <div style={{ padding: 20 }}>Betöltés...</div>;
  if (!q) return <div style={{ padding: 20 }}>Ajánlat nem található.</div>;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "Arial" }}>
      <a href="/quotes" style={{ color: "#666", textDecoration: "none" }}>← Vissza az összes ajánlathoz</a>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
        <h1>Ajánlat: {q.client?.name}</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <a href={`/api/quotes/${quoteId}/pdf`} target="_blank" style={btnStyle}>PDF megtekintése</a>
          <button onClick={sendEmail} style={btnPrimary}>E-mail küldése</button>
        </div>
      </div>

      {/* KALKULÁTOR KÁRTYA */}
      <div style={{ background: "#f8f9fa", border: "1px solid #ddd", padding: 20, borderRadius: 12, marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}>+ Új tétel kalkulátor</h3>
        <form onSubmit={addItem} style={{ display: "grid", gap: 12 }}>
          <input placeholder="Tétel leírása (pl. Gree Pulse 3.5kW)" value={desc} onChange={e => setDesc(e.target.value)} style={inputStyle} required />
          
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 150px" }}>
              <label style={labelStyle}>Beszerzési ár (Nettó Ft)</label>
              <input type="number" value={basePrice} onChange={e => setBasePrice(Number(e.target.value))} style={inputStyle} />
            </div>
            <div style={{ flex: "1 1 150px" }}>
              <label style={labelStyle}>Haszon típusa</label>
              <select value={profitType} onChange={e => setProfitType(e.target.value as any)} style={inputStyle}>
                <option value="percent">Százalék (%)</option>
                <option value="fix">Fix összeg (Ft)</option>
              </select>
            </div>
            <div style={{ flex: "1 1 150px" }}>
              <label style={labelStyle}>Haszon mértéke</label>
              <input type="number" value={profitValue} onChange={e => setProfitValue(Number(e.target.value))} style={inputStyle} />
            </div>
          </div>

          <div style={{ background: "#e1f5fe", padding: 12, borderRadius: 8, border: "1px solid #b3e5fc" }}>
            <span style={{ fontSize: "14px", color: "#0277bd" }}>
              <strong>Admin infó:</strong> Eladási nettó: <strong>{Math.round(calculatedUnitPriceNet).toLocaleString()} Ft</strong> | 
              Várható profit: <strong style={{ color: "#2e7d32" }}>{Math.round(lineProfit).toLocaleString()} Ft</strong>
            </span>
          </div>

          <button type="submit" style={btnSuccess}>Tétel hozzáadása</button>
        </form>
      </div>

      {/* TÁBLÁZAT */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 30 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #333", textAlign: "left" }}>
            <th style={{ padding: 10 }}>Megnevezés</th>
            <th>Menny.</th>
            <th>Nettó egységár</th>
            <th style={{ textAlign: "right" }}>Bruttó</th>
          </tr>
        </thead>
        <tbody>
          {q.items.map(it => (
            <tr key={it.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 10 }}>{it.description}</td>
              <td>{it.quantity} db</td>
              <td>{it.unitPriceNet.toLocaleString()} Ft</td>
              <td style={{ textAlign: "right" }}>{it.lineGross.toLocaleString()} Ft</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 30, textAlign: "right" }}>
        <p style={{ fontSize: "18px", fontWeight: "bold" }}>Fizetendő bruttó: {q.grossTotal.toLocaleString()} Ft</p>
      </div>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" as const };
const labelStyle = { fontSize: "12px", color: "#666", display: "block", marginBottom: 4 };
const btnStyle = { padding: "10px 16px", borderRadius: 8, border: "1px solid #ccc", background: "#fff", cursor: "pointer", textDecoration: "none", color: "#000", fontSize: "14px" };
const btnPrimary = { ...btnStyle, background: "#0070f3", color: "#fff", border: "none" };
const btnSuccess = { ...btnStyle, background: "#28a745", color: "#fff", border: "none", fontWeight: "bold" };
