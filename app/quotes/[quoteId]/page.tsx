"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function QuoteEditPage() {
  const params = useParams();
  const quoteId = params?.quoteId;
  const [q, setQ] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState("db");
  const [basePriceNet, setBasePriceNet] = useState(0); // Nettó beszerzés
  const [profitValue, setProfitValue] = useState(50000); // Haszon (Bruttóban)
  const [profitType, setProfitType] = useState<"percent" | "fix">("fix");

  const loadQuote = async () => {
    const res = await fetch(`/api/quotes/${quoteId}`);
    if (res.ok) setQ(await res.json());
    setLoading(false);
  };

  useEffect(() => { if (quoteId) loadQuote(); }, [quoteId]);

  // --- MATEK RÉSZ ---
  const basePriceGross = basePriceNet * 1.27; // Beszerzési bruttó
  
  // Eladási bruttó kiszámítása a haszon alapján
  const sellPriceGross = profitType === "percent"
    ? basePriceGross * (1 + profitValue / 100)
    : basePriceGross + profitValue;

  const sellPriceNet = sellPriceGross / 1.27; // Eladási nettó
  const totalLineGross = sellPriceGross * qty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? "PATCH" : "POST";
    await fetch(`/api/quotes/${quoteId}/items`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        description: desc,
        quantity: qty,
        unit,
        unitPriceNet: Math.round(sellPriceNet),
      }),
    });
    setEditingId(null); setDesc(""); setBasePriceNet(0); loadQuote();
  };

  const startEdit = (it: any) => {
    setEditingId(it.id);
    setDesc(it.description);
    setQty(it.quantity);
    setUnit(it.unit);
    setBasePriceNet(Math.round(Number(it.unitPriceNet) / 1.2)); // Visszaszámolt alap
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div style={{padding:20}}>Betöltés...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto", fontFamily: "Arial" }}>
      <h1 style={{color: editingId ? "#f39c12" : "#333"}}>
        {editingId ? "Tétel módosítása" : `Ajánlat: ${q?.client?.name}`}
      </h1>

      <div style={{ background: editingId ? "#fff9f0" : "#f8f9fa", padding: 25, borderRadius: 15, border: "1px solid #ddd" }}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 15 }}>
          <input placeholder="Tétel leírása..." value={desc} onChange={e => setDesc(e.target.value)} style={inputS} required />
          
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{flex: 1}}>
              <label style={labS}>Menny.</label>
              <div style={{display: "flex", gap: 5}}>
                <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} style={inputS} />
                <select value={unit} onChange={e => setUnit(e.target.value)} style={inputS}>
                  <option value="db">db</option>
                  <option value="m">m</option>
                  <option value="szett">szett</option>
                </select>
              </div>
            </div>

            <div style={{flex: 1.5}}>
              <label style={labS}>Beszerzési Ár (Nettó Ft)</label>
              <input type="number" value={basePriceNet} onChange={e => setBasePriceNet(Number(e.target.value))} style={inputS} />
            </div>

            <div style={{flex: 1.5}}>
              <label style={labS}>Haszon (Bruttóban értendő)</label>
              <div style={{display: "flex", gap: 5}}>
                <input type="number" value={profitValue} onChange={e => setProfitValue(Number(e.target.value))} style={inputS} />
                <select value={profitType} onChange={e => setProfitType(e.target.value as any)} style={inputS}>
                  <option value="fix">Ft</option>
                  <option value="percent">%</option>
                </select>
              </div>
            </div>
          </div>

          {/* ÖSSZEGZŐ PANEL NEKED */}
          <div style={{ background: "#e3f2fd", padding: 15, borderRadius: 10, display: "flex", justifyContent: "space-between", fontSize: "14px", border: "1px solid #bbdefb" }}>
            <div>
              <span style={{color: "#555"}}>Ügyfél árai:</span><br/>
              Nettó: <strong>{Math.round(sellPriceNet).toLocaleString()} Ft</strong><br/>
              Bruttó: <strong>{Math.round(sellPriceGross).toLocaleString()} Ft</strong>
            </div>
            <div style={{textAlign: "right"}}>
              <span style={{color: "#555"}}>Összesített bruttó:</span><br/>
              <strong style={{fontSize: "18px", color: "#1565c0"}}>{Math.round(totalLineGross).toLocaleString()} Ft</strong>
            </div>
          </div>

          <button type="submit" style={{ background: editingId ? "#f39c12" : "#2ecc71", color: "#fff", padding: 15, border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: "16px" }}>
            {editingId ? "MÓDOSÍTÁS MENTÉSE" : "HOZZÁADÁS AZ AJÁNLATHOZ"}
          </button>
        </form>
      </div>

      {/* TÁBLÁZAT */}
      <table style={{ width: "100%", marginTop: 30, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #333", textAlign: "left" }}>
            <th style={{ padding: 10 }}>Megnevezés</th>
            <th>Menny.</th>
            <th>Nettó egység</th>
            <th>Bruttó egység</th>
            <th style={{ textAlign: "right" }}>Bruttó összesen</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {q?.items.map((it: any) => (
            <tr key={it.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 10 }}>{it.description}</td>
              <td>{it.quantity} {it.unit}</td>
              <td>{it.unitPriceNet.toLocaleString()} Ft</td>
              <td>{Math.round(it.unitPriceNet * 1.27).toLocaleString()} Ft</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>{it.lineGross.toLocaleString()} Ft</td>
              <td style={{ textAlign: "right" }}>
                <button onClick={() => startEdit(it)} style={actB}>✏️</button>
                <button onClick={() => { if(confirm("Törlöd?")) fetch(`/api/quotes/${quoteId}/items?id=${it.id}`, {method: "DELETE"}).then(loadQuote) }} style={actB}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{textAlign: "right", marginTop: 20, fontSize: "22px", fontWeight: "bold"}}>
        Végösszeg: {q?.grossTotal.toLocaleString()} Ft
      </div>
    </div>
  );
}

const inputS = { width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" as const };
const labS = { fontSize: "12px", fontWeight: "bold", marginBottom: 5, display: "block", color: "#666" };
const actB = { background: "none", border: "none", cursor: "pointer", fontSize: "18px", marginLeft: 10 };
