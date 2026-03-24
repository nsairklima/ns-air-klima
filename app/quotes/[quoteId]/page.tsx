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

  // --- MATEMATIKA (ÉLŐ KALKULÁCIÓ) ---
  const basePriceGross = (Number(basePriceNet) || 0) * 1.27;
  
  // Mennyi a profit bruttóban?
  const profitGross = profitType === "percent" 
    ? basePriceGross * ((Number(profitValue) || 0) / 100)
    : (Number(profitValue) || 0);

  const sellPriceGross = basePriceGross + profitGross;
  const sellPriceNet = sellPriceGross / 1.27;
  const lineTotalGross = sellPriceGross * (Number(qty) || 0);

  // Táblázat összesítők
  const totalGross = q?.items?.reduce((sum: number, it: any) => sum + Number(it.lineGross), 0) || 0;
  const totalNet = totalGross / 1.27;
  const totalTax = totalGross - totalNet;

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
        basePrice: basePriceNet,
        unitPriceNet: Math.round(sellPriceNet),
      }),
    });
    resetForm();
    loadQuote();
  };

  const startEdit = (it: any) => {
    setEditingId(it.id);
    setDesc(it.description);
    setQty(Number(it.quantity) || 1);
    setUnit(it.unit || "db");
    const savedPrice = it.costNet ? Number(it.costNet) : Number(it.unitPriceNet);
    setBasePriceNet(savedPrice);
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
      
      <div style={{ display: "flex", gap: 10, marginBottom: 25 }}>
        <button onClick={() => router.push(`/clients/${q.clientId}`)} style={navBtn}>⬅️ Vissza az ügyfélhez</button>
        <button onClick={() => router.push("/")} style={{ ...navBtn, background: "#f8f9fa", color: "#333" }}>🏠 Főoldal</button>
      </div>

      <h1 style={{color: "#2c3e50"}}>{editingId ? "✏️ Tétel szerkesztése" : `${q.client?.name} ajánlata (#${q.id})`}</h1>

      {/* --- ÉLŐ KALKULÁTOR --- */}
      <div style={{ background: editingId ? "#fff3e0" : "#f8f9fa", padding: 25, borderRadius: 15, border: "1px solid #ddd", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 15 }}>
          <input placeholder="Megnevezés" value={desc} onChange={e => setDesc(e.target.value)} style={inputS} required />
          
          <div style={{ display: "flex", gap: 15, flexWrap: "wrap" }}>
            <div style={{flex: 1}}>
              <label style={labS}>Mennyiség</label>
              <div style={{display: "flex", gap: 5}}>
                <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} style={inputS} />
                <select value={unit} onChange={e => setUnit(e.target.value)} style={{...inputS, width: 90}}>
                  <option value="db">db</option>
                  <option value="m">m</option>
                  <option value="szett">szett</option>
                  <option value="óra">óra</option>
                </select>
              </div>
            </div>

            <div style={{flex: 2}}>
              <label style={labS}>Nettó Beszerzés (Ft)</label>
              <input type="number" value={basePriceNet} onChange={e => setBasePriceNet(Number(e.target.value))} style={inputS} />
              <div style={{fontSize: 12, color: "#27ae60", marginTop: 4, fontWeight: "bold"}}>
                Bruttó: {Math.round(basePriceGross).toLocaleString()} Ft
              </div>
            </div>

            <div style={{flex: 2}}>
              <label style={labS}>Haszon (Bruttó)</label>
              <div style={{display: "flex", gap: 5}}>
                <input type="number" value={profitValue} onChange={e => setProfitValue(Number(e.target.value))} style={inputS} />
                <select value={profitType} onChange={e => setProfitType(e.target.value as any)} style={{...inputS, width: 80}}>
                  <option value="fix">Ft</option>
                  <option value="percent">%</option>
                </select>
              </div>
              <div style={{fontSize: 12, color: "#2980b9", marginTop: 4, fontWeight: "bold"}}>
                Értéke: +{Math.round(profitGross).toLocaleString()} Ft
              </div>
            </div>
          </div>

          {/* ÉLŐ VÉGEREDMÉNY SÁV */}
          <div style={{ background: "#2c3e50", color: "#fff", padding: "15px 20px", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <div>
              <div style={{fontSize: 12, opacity: 0.8}}>Ügyfél bruttó egységár:</div>
              <strong style={{fontSize: 20}}>{Math.round(sellPriceGross).toLocaleString()} Ft</strong>
            </div>
            <div style={{textAlign: "right", borderLeft: "1px solid rgba(255,255,255,0.2)", paddingLeft: 20}}>
              <div style={{fontSize: 12, opacity: 0.8}}>Tétel bruttó összesen:</div>
              <strong style={{fontSize: 24, color: "#2ecc71"}}>{Math.round(lineTotalGross).toLocaleString()} Ft</strong>
            </div>
          </div>

          <div style={{display: "flex", gap: 10}}>
            <button type="submit" style={{ flex: 2, background: editingId ? "#e67e22" : "#27ae60", color: "#fff", padding: "15px", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 16 }}>
              {editingId ? "MÓDOSÍTÁS MENTÉSE" : "TÉTEL HOZZÁADÁSA"}
            </button>
            {editingId && <button onClick={resetForm} type="button" style={{flex: 1, borderRadius: 10, border: "1px solid #ccc", cursor: "pointer", background: "#fff"}}>Mégse</button>}
          </div>
        </form>
      </div>

      {/* TÉTEL LISTA TÁBLÁZAT */}
      <table style={{ width: "100%", marginTop: 30, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #333", textAlign: "left", background: "#eee" }}>
            <th style={{ padding: 12 }}>Megnevezés</th>
            <th>Menny.</th>
            <th>Bruttó egység</th>
            <th style={{ textAlign: "right" }}>Összesen (Bruttó)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {q.items.map((it: any) => (
            <tr key={it.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 12 }}><strong>{it.description}</strong></td>
              <td>{it.quantity} {it.unit}</td>
              <td>{Math.round(it.unitPriceNet * 1.27).toLocaleString()} Ft</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>{Number(it.lineGross).toLocaleString()} Ft</td>
              <td style={{ textAlign: "right", paddingRight: 12 }}>
                <button onClick={() => startEdit(it)} style={{background: "none", border: "none", cursor: "pointer", fontSize: 18}}>✏️</button>
                <button onClick={() => { if(confirm("Törlöd?")) fetch(`/api/quotes/${quoteId}/items?id=${it.id}`, {method: "DELETE"}).then(loadQuote) }} style={{background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "red", marginLeft: 10}}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* VÉGSŐ ÖSSZESÍTŐ */}
      <div style={{ marginTop: 30, display: "flex", justifyContent: "flex-end" }}>
        <div style={{ background: "#fcfcfc", border: "1px solid #eee", padding: 20, borderRadius: 12, minWidth: 320 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "#666" }}>
            <span>Összesen Nettó:</span>
            <span>{Math.round(totalNet).toLocaleString()} Ft</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, color: "#e74c3c", fontSize: 14 }}>
            <span>ÁFA (27%):</span>
            <span>{Math.round(totalTax).toLocaleString()} Ft</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #2c3e50", paddingTop: 12 }}>
            <span style={{ fontWeight: "bold", fontSize: 18 }}>Fizetendő Bruttó:</span>
            <strong style={{ fontSize: 26, color: "#2c3e50" }}>{totalGross.toLocaleString()} Ft</strong>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 40, display: "flex", justifyContent: "flex-end" }}>
        <button 
          onClick={() => window.open(`/quotes/${quoteId}/print`, '_blank')}
          style={{ background: "#34495e", color: "#fff", padding: "15px 30px", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: "16px" }}
        >
          📄 HIVATALOS AJÁNLAT GENERÁLÁSA (PDF)
        </button>
      </div>
    </div>
  );
}

const navBtn: React.CSSProperties = { padding: "8px 16px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontWeight: "bold" };
const inputS = { width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" as const, fontSize: "16px" };
const labS = { fontSize: "12px", fontWeight: "bold", marginBottom: 5, display: "block", color: "#666" };
