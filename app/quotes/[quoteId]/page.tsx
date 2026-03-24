"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function QuoteEditPage() {
  const params = useParams();
  const router = useRouter();
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
    if (res.ok) {
      const data = await res.json();
      setQ(data);
    }
    setLoading(false);
  };

  useEffect(() => { if (quoteId) loadQuote(); }, [quoteId]);

  // --- MATEMATIKA ---
  const basePriceGross = (Number(basePriceNet) || 0) * 1.27;
  const sellPriceGross = profitType === "percent" 
    ? basePriceGross * (1 + (Number(profitValue) || 0) / 100) 
    : basePriceGross + (Number(profitValue) || 0);
  const sellPriceNet = sellPriceGross / 1.27;

  // MENTÉS (ÚJ VAGY MÓDOSÍTÁS)
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
        basePrice: basePriceNet, // costNet-be megy az API-n keresztül
        unitPriceNet: Math.round(sellPriceNet),
      }),
    });
    resetForm();
    loadQuote();
  };

  // SZERKESZTÉS INDÍTÁSA - FIXÁLT VERZIÓ
  const startEdit = (it: any) => {
    setEditingId(it.id);
    setDesc(it.description);
    setQty(Number(it.quantity) || 1);
    setUnit(it.unit || "db");

    // Ha van mentett costNet (beszerzés), azt használjuk, különben az eladási nettót
    const savedPrice = it.costNet ? Number(it.costNet) : Number(it.unitPriceNet);
    setBasePriceNet(savedPrice);
    
    // Alaphelyzetbe állítjuk a hasznot szerkesztéskor, hogy ne számoljon félre
    setProfitValue(0); 
    setProfitType("fix");
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setDesc("");
    setQty(1);
    setUnit("db");
    setBasePriceNet(0);
    setProfitValue(0);
    setProfitType("fix");
  };

  if (loading) return <div style={{padding: 20}}>Betöltés...</div>;
  if (!q) return <div style={{padding: 20}}>Ajánlat nem található.</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto", fontFamily: "Arial" }}>
      <div style={{marginBottom: 20}}>
        <button onClick={() => router.push("/quotes")} style={{background: "none", border: "none", cursor: "pointer", color: "#666"}}>← Vissza a listához</button>
        <h1 style={{marginTop: 10}}>{editingId ? "✏️ Tétel szerkesztése" : `${q.client?.name} ajánlata`}</h1>
      </div>

      <div style={{ background: editingId ? "#fff3e0" : "#f8f9fa", padding: 25, borderRadius: 15, border: "1px solid #ddd" }}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 15 }}>
          <input placeholder="Megnevezés" value={desc} onChange={e => setDesc(e.target.value)} style={inputS} required />
          
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
            <div style={{flex: 2}}>
              <label style={labS}>Nettó Beszerzési Ár (Ft)</label>
              <input type="number" value={basePriceNet} onChange={e => setBasePriceNet(Number(e.target.value))} style={inputS} />
            </div>
            <div style={{flex: 2}}>
              <label style={labS}>Extra Haszon (Bruttó)</label>
              <div style={{display: "flex", gap: 5}}>
                <input type="number" value={profitValue} onChange={e => setProfitValue(Number(e.target.value))} style={inputS} />
                <select value={profitType} onChange={e => setProfitType(e.target.value as any)} style={{...inputS, width: 80}}>
                  <option value="fix">Ft</option>
                  <option value="percent">%</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ background: "#2c3e50", color: "#fff", padding: 15, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Ügyfél bruttó egységára:</span>
            <strong style={{fontSize: 22}}>{Math.round(sellPriceGross).toLocaleString()} Ft</strong>
          </div>

          <div style={{display: "flex", gap: 10}}>
            <button type="submit" style={{ flex: 2, background: editingId ? "#e67e22" : "#27ae60", color: "#fff", padding: 15, border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold" }}>
              {editingId ? "MÓDOSÍTÁS MENTÉSE" : "TÉTEL HOZZÁADÁSA"}
            </button>
            {editingId && <button onClick={resetForm} type="button" style={{flex: 1, borderRadius: 10, border: "1px solid #ccc"}}>Mégse</button>}
          </div>
        </form>
      </div>

      <table style={{ width: "100%", marginTop: 30, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #333", textAlign: "left" }}>
            <th style={{ padding: 12 }}>Megnevezés</th>
            <th>Menny.</th>
            <th>Bruttó egység</th>
            <th style={{ textAlign: "right" }}>Összesen</th>
            <th style={{ textAlign: "right" }}></th>
          </tr>
        </thead>
        <tbody>
          {q.items.map((it: any) => (
            <tr key={it.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 12 }}>
                <strong>{it.description}</strong><br/>
                <small style={{color: "#888"}}>{Math.round(it.unitPriceNet).toLocaleString()} Ft nettó</small>
              </td>
              <td>{it.quantity} {it.unit}</td>
              <td>{Math.round(it.unitPriceNet * 1.27).toLocaleString()} Ft</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>{Number(it.lineGross).toLocaleString()} Ft</td>
              <td style={{ textAlign: "right" }}>
                <button onClick={() => startEdit(it)} style={{background: "none", border: "none", cursor: "pointer", fontSize: 18}}>✏️</button>
                <button onClick={() => { if(confirm("Törlöd?")) fetch(`/api/quotes/${quoteId}/items?id=${it.id}`, {method: "DELETE"}).then(loadQuote) }} style={{background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "red", marginLeft: 10}}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div style={{textAlign: "right", marginTop: 20, fontSize: 24, fontWeight: "bold"}}>
        Végösszeg: {Number(q.grossTotal).toLocaleString()} Ft
      </div>
      {/* ÚJ: Nyomtatás gomb a végösszeg alatt */}
<div style={{ marginTop: 30, display: "flex", justifyContent: "flex-end", gap: 15 }}>
  <button 
    onClick={() => window.open(`/quotes/${quoteId}/print`, '_blank')}
    style={{ background: "#34495e", color: "#fff", padding: "12px 25px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}
  >
    📄 HIVATALOS AJÁNLAT GENERÁLÁSA (PDF)
  </button>
</div>
    </div>
  );
}

const inputS = { width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" as const, fontSize: "16px" };
const labS = { fontSize: "12px", fontWeight: "bold", marginBottom: 5, display: "block", color: "#666" };
