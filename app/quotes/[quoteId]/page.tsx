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
  const [basePriceNet, setBasePriceNet] = useState(0); 
  const [profitValue, setProfitValue] = useState(0); 
  const [profitType, setProfitType] = useState<"percent" | "fix">("fix");

  const loadQuote = async () => {
    const res = await fetch(`/api/quotes/${quoteId}`);
    if (res.ok) setQ(await res.json());
    setLoading(false);
  };

  useEffect(() => { if (quoteId) loadQuote(); }, [quoteId]);

  // --- PRECIZ MATEK ---
  const basePriceGross = basePriceNet * 1.27;
  
  let sellPriceGross = 0;
  if (profitType === "percent") {
    sellPriceGross = basePriceGross * (1 + (profitValue / 100));
  } else {
    sellPriceGross = basePriceGross + profitValue;
  }

  const sellPriceNet = sellPriceGross / 1.27;
  const totalLineGross = sellPriceGross * qty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/quotes/${quoteId}/items`, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        description: desc,
        quantity: qty,
        unit,
        unitPriceNet: Math.round(sellPriceNet),
      }),
    });
    resetForm();
    loadQuote();
  };

  const resetForm = () => {
    setEditingId(null);
    setDesc("");
    setQty(1);
    setBasePriceNet(0);
    setProfitValue(0);
    setProfitType("fix");
  };

const startEdit = (it: any) => {
    setEditingId(it.id);
    setDesc(it.description);
    setQty(Number(it.quantity));
    setUnit(it.unit || "db");
    
    // Itt a lényeg: A costNet-et használjuk, ami az adatbázisban van!
    // Ha az valamiért üres, akkor használjuk a nettó egységárat.
    const savedBasePrice = it.costNet ? Number(it.costNet) : Number(it.unitPriceNet);
    setBasePriceNet(savedBasePrice);
    
    // Haszon beállítása:
    // Szerkesztéskor fix 0 Ft hasznot állítunk be alapból, 
    // így a Bázis ár + 0 haszon = pontosan az elmentett ár lesz.
    setProfitValue(0); 
    setProfitType("fix");
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div style={{padding:20}}>Betöltés...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto", fontFamily: "Arial" }}>
      <div style={{display: "flex", justifyContent: "space-between", marginBottom: 20}}>
         <a href="/quotes" style={{color: "#666", textDecoration: "none"}}>← Vissza</a>
         <h2 style={{margin: 0}}>{q?.client?.name} ajánlata</h2>
      </div>

      {/* OKOS KALKULÁTOR PANEL */}
      <div style={{ background: editingId ? "#fff9f0" : "#f8f9fa", padding: 25, borderRadius: 15, border: "1px solid #ddd", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
        <h3 style={{marginTop: 0, color: editingId ? "#e67e22" : "#333"}}>
            {editingId ? "Tétel szerkesztése" : "Új tétel hozzáadása"}
        </h3>
        
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 15 }}>
          <input placeholder="Megnevezés (pl. Gree Pulse 3.5kW)" value={desc} onChange={e => setDesc(e.target.value)} style={inputS} required />
          
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{flex: 1, minWidth: "120px"}}>
              <label style={labS}>Mennyiség</label>
              <div style={{display: "flex", gap: 5}}>
                <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} style={inputS} />
                <select value={unit} onChange={e => setUnit(e.target.value)} style={inputS}>
                  <option value="db">db</option>
                  <option value="m">m</option>
                  <option value="szett">szett</option>
                  <option value="óra">óra</option>
                </select>
              </div>
            </div>

            <div style={{flex: 1.5, minWidth: "180px"}}>
              <label style={labS}>Nettó Beszerzési Ár (Ft)</label>
              <input type="number" value={basePriceNet} onChange={e => setBasePriceNet(Number(e.target.value))} style={inputS} />
            </div>

            <div style={{flex: 1.5, minWidth: "180px"}}>
              <label style={labS}>Haszon (Bruttóban)</label>
              <div style={{display: "flex", gap: 5}}>
                <input type="number" value={profitValue} onChange={e => setProfitValue(Number(e.target.value))} style={inputS} />
                <select value={profitType} onChange={e => setProfitType(e.target.value as any)} style={{...inputS, width: "80px"}}>
                  <option value="fix">Ft</option>
                  <option value="percent">%</option>
                </select>
              </div>
            </div>
          </div>

          {/* EREDMÉNY KIJELZŐ */}
          <div style={{ background: "#e1f5fe", padding: 15, borderRadius: 10, border: "1px solid #b3e5fc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{fontSize: "12px", color: "#0277bd", fontWeight: "bold", textTransform: "uppercase"}}>Ügyfél ára (Bruttó):</span><br/>
              <strong style={{fontSize: "24px", color: "#01579b"}}>{Math.round(sellPriceGross).toLocaleString()} Ft / {unit}</strong>
            </div>
            <div style={{textAlign: "right"}}>
               <span style={{fontSize: "12px", color: "#0277bd"}}>Sor összesen (Bruttó):</span><br/>
               <strong style={{fontSize: "20px"}}>{Math.round(totalLineGross).toLocaleString()} Ft</strong>
            </div>
          </div>

          <div style={{display: "flex", gap: 10}}>
            <button type="submit" style={{ flex: 2, background: editingId ? "#e67e22" : "#27ae60", color: "#fff", padding: "15px", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: "16px" }}>
              {editingId ? "MÓDOSÍTÁS MENTÉSE" : "TÉTEL HOZZÁADÁSA"}
            </button>
            {editingId && <button onClick={resetForm} type="button" style={{flex: 1, borderRadius: 10, border: "1px solid #ccc", background: "#fff"}}>Mégse</button>}
          </div>
        </form>
      </div>

      {/* TÁBLÁZAT */}
      <table style={{ width: "100%", marginTop: 40, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #333", textAlign: "left" }}>
            <th style={{ padding: "12px 10px" }}>Tétel leírása</th>
            <th>Menny.</th>
            <th>Bruttó egységár</th>
            <th style={{ textAlign: "right" }}>Bruttó összesen</th>
            <th style={{ textAlign: "right" }}>Műveletek</th>
          </tr>
        </thead>
        <tbody>
          {q?.items.map((it: any) => (
            <tr key={it.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "15px 10px" }}>
                <div style={{fontWeight: "bold"}}>{it.description}</div>
                <small style={{color: "#888"}}>{Math.round(it.unitPriceNet).toLocaleString()} Ft nettó / {it.unit}</small>
              </td>
              <td>{it.quantity} {it.unit}</td>
              <td>{Math.round(it.unitPriceNet * 1.27).toLocaleString()} Ft</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>{it.lineGross.toLocaleString()} Ft</td>
              <td style={{ textAlign: "right" }}>
                <button onClick={() => startEdit(it)} style={{background: "#f39c12", color: "white", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer", marginRight: 5}}>✏️</button>
                <button onClick={() => { if(confirm("Törlöd?")) fetch(`/api/quotes/${quoteId}/items?id=${it.id}`, {method: "DELETE"}).then(loadQuote) }} style={{background: "#e74c3c", color: "white", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer"}}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{marginTop: 30, borderTop: "3px solid #333", paddingTop: 20, textAlign: "right"}}>
        <span style={{fontSize: "18px"}}>Végösszeg:</span><br/>
        <strong style={{fontSize: "32px"}}>{q?.grossTotal.toLocaleString()} Ft</strong>
      </div>
    </div>
  );
}

const inputS = { width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" as const, fontSize: "16px" };
const labS = { fontSize: "12px", fontWeight: "bold", marginBottom: 5, display: "block", color: "#555" };
