"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function QuoteEditPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params?.quoteId;

  const [q, setQ] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ... (a korábbi állapotok: desc, qty, unit, basePriceNet, profitValue, profitType maradnak)
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
  const profitGross = profitType === "percent" 
    ? basePriceGross * ((Number(profitValue) || 0) / 100)
    : (Number(profitValue) || 0);
  const sellPriceGross = basePriceGross + profitGross;
  const sellPriceNet = sellPriceGross / 1.27;
  const lineTotalGross = sellPriceGross * (Number(qty) || 0);

  const totalGross = q?.items?.reduce((sum: number, it: any) => sum + Number(it.lineGross), 0) || 0;
  const totalNet = totalGross / 1.27;
  const totalTax = totalGross - totalNet;

  // ... (handleSubmit, startEdit, resetForm függvények változatlanok)
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
      
      {/* NAVIGÁCIÓ */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => router.push(`/clients/${q.clientId}`)} style={navBtn}>⬅️ Ügyfél adatlap</button>
        <button onClick={() => router.push("/")} style={{ ...navBtn, background: "#f8f9fa" }}>🏠 Főoldal</button>
      </div>

      {/* FEJLÉC ÉS GÉP ADATOK */}
      <div style={{ marginBottom: 25, borderBottom: "2px solid #eee", paddingBottom: 15 }}>
        <h1 style={{ margin: 0, color: "#2c3e50", fontSize: 24 }}>{q.title}</h1>
        <div style={{ display: "flex", gap: 15, marginTop: 10, alignItems: "center" }}>
          <span style={{ background: "#e1f5fe", color: "#0288d1", padding: "4px 12px", borderRadius: 15, fontSize: 13, fontWeight: "bold" }}>
            👤 {q.client?.name}
          </span>
          {/* Itt jelenítjük meg a gép adatait, ha léteznek */}
          {q.client?.units && q.client.units.length > 0 && (
            <span style={{ background: "#f1f8e9", color: "#388e3c", padding: "4px 12px", borderRadius: 15, fontSize: 13, fontWeight: "bold" }}>
              ❄️ {q.client.units[q.client.units.length - 1].brand} {q.client.units[q.client.units.length - 1].model}
            </span>
          )}
        </div>
      </div>

      {/* KALKULÁTOR FORM (Ugyanaz mint az előbb) */}
      <div style={{ background: editingId ? "#fff3e0" : "#f8f9fa", padding: 25, borderRadius: 15, border: "1px solid #ddd", marginBottom: 30 }}>
        <h3 style={{marginTop: 0, fontSize: 16, color: "#666"}}>{editingId ? "✏️ Tétel szerkesztése" : "➕ Új tétel hozzáadása"}</h3>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 15 }}>
          <input placeholder="Megnevezés" value={desc} onChange={e => setDesc(e.target.value)} style={inputS} required />
          
          <div style={{ display: "flex", gap: 15, flexWrap: "wrap" }}>
            <div style={{flex: 1}}>
              <label style={labS}>Mennyiség</label>
              <div style={{display: "flex", gap: 5}}>
                <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} style={inputS} />
                <select value={unit} onChange={e => setUnit(e.target.value)} style={{...inputS, width: 85}}>
                  <option value="db">db</option>
                  <option value="m">m</option>
                  <option value="szett">szett</option>
                </select>
              </div>
            </div>
            <div style={{flex: 2}}>
              <label style={labS}>Nettó Beszerzés (Ft)</label>
              <input type="number" value={basePriceNet} onChange={e => setBasePriceNet(Number(e.target.value))} style={inputS} />
              <div style={{fontSize: 11, color: "#27ae60", marginTop: 4}}>Bruttó: {Math.round(basePriceGross).toLocaleString()} Ft</div>
            </div>
            <div style={{flex: 2}}>
              <label style={labS}>Haszon (Bruttó)</label>
              <div style={{display: "flex", gap: 5}}>
                <input type="number" value={profitValue} onChange={e => setProfitValue(Number(e.target.value))} style={inputS} />
                <select value={profitType} onChange={e => setProfitType(e.target.value as any)} style={{...inputS, width: 70}}>
                  <option value="fix">Ft</option>
                  <option value="percent">%</option>
                </select>
              </div>
              <div style={{fontSize: 11, color: "#2980b9", marginTop: 4}}>Érték: +{Math.round(profitGross).toLocaleString()} Ft</div>
            </div>
          </div>

          <div style={{ background: "#2c3e50", color: "#fff", padding: "12px 20px", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{fontSize: 14}}>Ügyfél bruttó egységár: <strong>{Math.round(sellPriceGross).toLocaleString()} Ft</strong></span>
            <span style={{fontSize: 14}}>Tétel bruttó összesen: <strong style={{color: "#2ecc71", fontSize: 18}}>{Math.round(lineTotalGross).toLocaleString()} Ft</strong></span>
          </div>

          <button type="submit" style={{ background: editingId ? "#e67e22" : "#27ae60", color: "#fff", padding: "12px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>
             {editingId ? "MÓDOSÍTÁS MENTÉSE" : "TÉTEL HOZZÁADÁSA"}
          </button>
        </form>
      </div>

      {/* TÁBLÁZAT */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #333", textAlign: "left", fontSize: 14 }}>
            <th style={{ padding: 10 }}>Megnevezés</th>
            <th>Menny.</th>
            <th>Bruttó egység</th>
            <th style={{ textAlign: "right" }}>Összesen</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {q.items.map((it: any) => (
            <tr key={it.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 10 }}>{it.description}</td>
              <td>{it.quantity} {it.unit}</td>
              <td>{Math.round(it.unitPriceNet * 1.27).toLocaleString()} Ft</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>{Number(it.lineGross).toLocaleString()} Ft</td>
              <td style={{ textAlign: "right" }}>
                <button onClick={() => startEdit(it)} style={{background: "none", border: "none", cursor: "pointer"}}>✏️</button>
                <button onClick={() => { if(confirm("Törlöd?")) fetch(`/api/quotes/${quoteId}/items?id=${it.id}`, {method: "DELETE"}).then(loadQuote) }} style={{background: "none", border: "none", cursor: "pointer", color: "red", marginLeft: 8}}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ÖSSZESÍTŐ */}
      <div style={{ marginTop: 25, display: "flex", justifyContent: "flex-end" }}>
        <div style={{ background: "#f8f9fa", padding: 15, borderRadius: 10, border: "1px solid #ddd", minWidth: 250 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#666" }}><span>Nettó:</span><span>{Math.round(totalNet).toLocaleString()} Ft</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#e74c3c", margin: "4px 0" }}><span>ÁFA (27%):</span><span>{Math.round(totalTax).toLocaleString()} Ft</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: 18, borderTop: "1px solid #ccc", paddingTop: 8, marginTop: 5 }}>
            <span>Bruttó:</span><span>{totalGross.toLocaleString()} Ft</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 30, textAlign: "right" }}>
        <button onClick={() => window.open(`/quotes/${quoteId}/print`, '_blank')} style={{ background: "#34495e", color: "#fff", padding: "12px 25px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>
          📄 PDF GENERÁLÁSA
        </button>
      </div>
    </div>
  );
}

const navBtn: React.CSSProperties = { padding: "8px 14px", borderRadius: "6px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: "bold" };
const inputS = { width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #ccc", boxSizing: "border-box" as const };
const labS = { fontSize: "11px", fontWeight: "bold", marginBottom: 3, display: "block", color: "#888" };
