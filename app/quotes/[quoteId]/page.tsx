"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function QuoteEditPage() {
  const params = useParams();
  const quoteId = params?.quoteId;

  const [q, setQ] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Kalkulátor állapotok
  const [editingId, setEditingId] = useState<number | null>(null);
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState("db");
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

  // Mentés (vagy Új, vagy Frissítés)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = `/api/quotes/${quoteId}/items`;
    const method = editingId ? "PATCH" : "POST";
    
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        description: desc,
        quantity: qty,
        unit: unit,
        unitPriceNet: Math.round(calculatedUnitPriceNet),
        vatRate: 27,
      }),
    });

    // Reset
    setEditingId(null);
    setDesc("");
    setBasePrice(0);
    loadQuote();
  };

  // Szerkesztés betöltése a formba
  const startEdit = (it: any) => {
    setEditingId(it.id);
    setDesc(it.description);
    setQty(it.quantity);
    setUnit(it.unit);
    setBasePrice(it.unitPriceNet / 1.2); // Ez egy becslés, ha nincs tárolva a beszerzési ár
    setProfitValue(20);
    setProfitType("percent");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteItem = async (id: number) => {
    if (confirm("Törlöd?")) {
      await fetch(`/api/quotes/${quoteId}/items?id=${id}`, { method: "DELETE" });
      loadQuote();
    }
  };

  if (loading) return <div>Betöltés...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "Arial" }}>
      <h1>{editingId ? "Tétel szerkesztése" : "Új tétel hozzáadása"}</h1>
      
      <div style={{ background: editingId ? "#fff3e0" : "#f4f4f4", padding: 20, borderRadius: 12 }}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
          <input placeholder="Leírás" value={desc} onChange={e => setDesc(e.target.value)} style={inputS} required />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} style={{...inputS, width: 70}} />
            <select value={unit} onChange={e => setUnit(e.target.value)} style={{...inputS, width: 80}}>
              <option value="db">db</option>
              <option value="m">m</option>
              <option value="szett">szett</option>
            </select>
            <input type="number" placeholder="Beszerzési ár" value={basePrice} onChange={e => setBasePrice(Number(e.target.value))} style={inputS} />
            <input type="number" value={profitValue} onChange={e => setProfitValue(Number(e.target.value))} style={{...inputS, width: 70}} />
            <select value={profitType} onChange={e => setProfitType(e.target.value as any)} style={{...inputS, width: 70}}>
              <option value="percent">%</option>
              <option value="fix">Ft</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" style={{ flex: 1, background: editingId ? "#fb8c00" : "#28a745", color: "#fff", padding: 12, border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>
              {editingId ? "MÓDOSÍTÁSOK MENTÉSE" : "HOZZÁADÁS AZ AJÁNLATHOZ"}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setDesc(""); setBasePrice(0); }} style={{ background: "#ccc", border: "none", padding: 12, borderRadius: 8, cursor: "pointer" }}>Mégse</button>
            )}
          </div>
        </form>
      </div>

      <table style={{ width: "100%", marginTop: 30, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
            <th style={{ padding: 10 }}>Tétel</th>
            <th>Menny.</th>
            <th>Nettó egységár</th>
            <th style={{ textAlign: "right" }}>Művelet</th>
          </tr>
        </thead>
        <tbody>
          {q.items.map((it: any) => (
            <tr key={it.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 10 }}>{it.description}</td>
              <td>{it.quantity} {it.unit}</td>
              <td>{it.unitPriceNet.toLocaleString()} Ft</td>
              <td style={{ textAlign: "right" }}>
                <button onClick={() => startEdit(it)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, marginRight: 10 }}>✏️</button>
                <button onClick={() => deleteItem(it.id)} style={{ background: "none", border: "none", color: "red", cursor: "pointer", fontSize: 18 }}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 style={{ textAlign: "right" }}>Bruttó: {q.grossTotal.toLocaleString()} Ft</h2>
    </div>
  );
}

const inputS = { padding: "10px", borderRadius: 8, border: "1px solid #ccc" };
