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

  useEffect(() => {
    if (quoteId) loadQuote();
  }, [quoteId]);

  // --- ÉLŐ MATEMATIKA (A beírás pillanatában számol) ---
  const basePriceGross = (Number(basePriceNet) || 0) * 1.27;
  
  const profitGross = profitType === "percent" 
    ? basePriceGross * ((Number(profitValue) || 0) / 100)
    : (Number(profitValue) || 0);

  const sellPriceGross = basePriceGross + profitGross;
  const sellPriceNet = sellPriceGross / 1.27;
  const lineTotalGross = sellPriceGross * (Number(qty) || 0);

  // Táblázat összesítők a már elmentett tételekből
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

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Adatok betöltése...</div>;
  if (!q) return <div style={{ padding: 40, textAlign: "center" }}>Hiba: Az ajánlat nem található.</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto", fontFamily: "Arial, sans-serif", color: "#333" }}>
      
      {/* NAVIGÁCIÓ */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => router.push(`/clients/${q.clientId}`)} style={navBtn}>⬅️ Ügyfél adatlap</button>
        <button onClick={() => router.push("/")} style={{ ...navBtn, background: "#f8f9fa" }}>🏠 Főoldal</button>
      </div>

      {/* FEJLÉC: Ajánlat címe + Gép adatai */}
      <div style={{ marginBottom: 30, borderBottom: "2px solid #eee", paddingBottom: 20 }}>
        <h1 style={{ margin: 0, color: "#2c3e50", fontSize: 28 }}>{q.title}</h1>
        <div style={{ display: "flex", gap: 12, marginTop: 15, flexWrap: "wrap" }}>
          <span style={badgeBlue}>👤 {q.client?.name}</span>
          {q.client?.units && q.client.units.length > 0 && (
            <span style={badgeGreen}>
              ❄️ {q.client.units[q.client.units.length - 1].brand} {q.client.units[q.client.units.length - 1].model} 
              {q.client.units[q.client.units.length - 1].power ? ` (${q.client.units[q.client.units.length - 1].power})` : ""}
            </span>
          )}
        </div>
      </div>

      {/* ÉLŐ KALKULÁTOR SZKCIÓ */}
      <div style={{ background: editingId ? "#fff3e0" : "#ffffff", padding: 25, borderRadius: 15, border: editingId ? "2px solid #e67e22" : "1px solid #ddd", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", marginBottom: 40 }}>
        <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, color: "#555" }}>
          {editingId ? "✏️ Tétel módosítása" : "➕ Új tétel hozzáadása"}
        </h3>
        
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
          <div style={{ width: "100%" }}>
            <label style={labS}>Megnevezés</label>
            <input placeholder="pl. Gree Pulse 3.5kW telepítéssel" value={desc} onChange={e => setDesc(e.target.value)} style={inputS} required />
          </div>
          
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 150px" }}>
              <label style={labS}>Mennyiség</label>
              <div style={{ display: "flex", gap: 5 }}>
                <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} style={inputS} />
                <select value={unit} onChange={e => setUnit(e.target.value)} style={{ ...inputS, width: 90 }}>
                  <option value="db">db</option>
                  <option value="m">m</option>
                  <option value="szett">szett</option>
                  <option value="óra">óra</option>
                </select>
              </div>
            </div>

            <div style={{ flex: "2 1 200px" }}>
              <label style={labS}>Nettó Beszerzés (Ft)</label>
              <input type="number" value={basePriceNet} onChange={e => setBasePriceNet(Number(e.target.value))} style={inputS} />
              <div style={{ fontSize: 12, color: "#27ae60", marginTop: 6, fontWeight: "bold" }}>
                Bruttó: {Math.round(basePriceGross).toLocaleString()} Ft
              </div>
            </div>

            <div style={{ flex: "2 1 200px" }}>
              <label style={labS}>Haszonkulcs (Bruttó)</label>
              <div style={{ display: "flex", gap: 5 }}>
                <input type="number" value={profitValue} onChange={e => setProfitValue(Number(e.target.value))} style={inputS} />
                <select value={profitType} onChange={e => setProfitType(e.target.value as any)} style={{ ...inputS, width: 80 }}>
                  <option value="fix">Ft</option>
                  <option value="percent">%</option>
                </select>
              </div>
              <div style={{ fontSize: 12, color: "#2980b9", marginTop: 6, fontWeight: "bold" }}>
                Haszon értéke: +{Math.round(profitGross).toLocaleString()} Ft
              </div>
            </div>
          </div>

          {/* SÖTÉT KIEMELT SÁV AZ ÉLŐ EREDMÉNNYEL */}
          <div style={resultBar}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Ügyfél bruttó egységár:</div>
              <strong style={{ fontSize: 22 }}>{Math.round(sellPriceGross).toLocaleString()} Ft</strong>
            </div>
            <div style={{ textAlign: "right", borderLeft: "1px solid rgba(255,255,255,0.2)", paddingLeft: 25 }}>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Tétel bruttó összesen:</div>
              <strong style={{ fontSize: 26, color: "#2ecc71" }}>{Math.round(lineTotalGross).toLocaleString()} Ft</strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" style={{ ...btnBase, flex: 2, background: editingId ? "#e67e22" : "#27ae60" }}>
              {editingId ? "VÁLTOZTATÁSOK MENTÉSE" : "TÉTEL HOZZÁADÁSA AZ AJÁNLATHOZ"}
            </button>
            {editingId && (
              <button onClick={resetForm} type="button" style={{ ...btnBase, flex: 1, background: "#95a5a6" }}>Mégse</button>
            )}
          </div>
        </form>
      </div>

      {/* TÁBLÁZAT A TÉTELEKKEL */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #2c3e50", textAlign: "left", background: "#f8f9fa" }}>
              <th style={{ padding: "15px 12px" }}>Megnevezés</th>
              <th>Menny.</th>
              <th>Bruttó egység</th>
              <th style={{ textAlign: "right" }}>Összesen (Bruttó)</th>
              <th style={{ textAlign: "right", paddingRight: 15 }}>Művelet</th>
            </tr>
          </thead>
          <tbody>
            {q.items.map((it: any) => (
              <tr key={it.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "15px 12px" }}>
                  <div style={{ fontWeight: "bold" }}>{it.description}</div>
                  <div style={{ fontSize: 11, color: "#999" }}>Nettó: {Math.round(it.unitPriceNet).toLocaleString()} Ft</div>
                </td>
                <td>{it.quantity} {it.unit}</td>
                <td>{Math.round(it.unitPriceNet * 1.27).toLocaleString()} Ft</td>
                <td style={{ textAlign: "right", fontWeight: "bold", color: "#2c3e50" }}>{Number(it.lineGross).toLocaleString()} Ft</td>
                <td style={{ textAlign: "right", paddingRight: 15 }}>
                  <button onClick={() => startEdit(it)} style={iconBtn}>✏️</button>
                  <button onClick={() => { if(confirm("Biztosan törlöd?")) fetch(`/api/quotes/${quoteId}/items?id=${it.id}`, {method: "DELETE"}).then(loadQuote) }} style={{ ...iconBtn, color: "#e74c3c" }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VÉGSŐ ÖSSZESÍTŐ KÁRTYA */}
      <div style={{ marginTop: 40, display: "flex", justifyContent: "flex-end" }}>
        <div style={{ background: "#fdfdfd", border: "1px solid #ddd", padding: 25, borderRadius: 15, minWidth: 350, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={summaryRow}>
            <span style={{ color: "#666" }}>Összesen Nettó:</span>
            <span>{Math.round(totalNet).toLocaleString()} Ft</span>
          </div>
          <div style={{ ...summaryRow, color: "#e74c3c", fontSize: 15, margin: "10px 0" }}>
            <span>ÁFA (27%):</span>
            <span>{Math.round(totalTax).toLocaleString()} Ft</span>
          </div>
          <div style={{ ...summaryRow, borderTop: "2px solid #2c3e50", paddingTop: 15, marginTop: 5 }}>
            <span style={{ fontWeight: "bold", fontSize: 18 }}>Fizetendő Bruttó:</span>
            <strong style={{ fontSize: 28, color: "#2c3e50" }}>{totalGross.toLocaleString()} Ft</strong>
          </div>
        </div>
      </div>

      {/* PDF GOMB */}
      <div style={{ marginTop: 50, textAlign: "right" }}>
        <button 
          onClick={() => window.open(`/quotes/${quoteId}/print`, '_blank')}
          style={{ background: "#34495e", color: "#fff", padding: "18px 40px", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: "bold", fontSize: 17, boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}
        >
          📄 HIVATALOS AJÁNLAT GENERÁLÁSA (PDF)
        </button>
      </div>
    </div>
  );
}

/* --- STÍLUSOK (Inline) --- */
const navBtn: React.CSSProperties = { padding: "10px 18px", borderRadius: "10px", border: "1px solid #ddd", background: "#fff", color: "#555", cursor: "pointer", fontSize: "14px", fontWeight: "bold" };
const inputS = { width: "100%", padding: "14px", borderRadius: 10, border: "1px solid #ccc", boxSizing: "border-box" as const, fontSize: "16px", outline: "none" };
const labS = { fontSize: "12px", fontWeight: "bold", marginBottom: 6, display: "block", color: "#7f8c8d", textTransform: "uppercase" as const };
const badgeBlue = { background: "#e1f5fe", color: "#0288d1", padding: "6px 14px", borderRadius: "20px", fontSize: "14px", fontWeight: "bold" as const };
const badgeGreen = { background: "#f1f8e9", color: "#388e3c", padding: "6px 14px", borderRadius: "20px", fontSize: "14px", fontWeight: "bold" as const };
const resultBar = { background: "#2c3e50", color: "#fff", padding: "20px 25px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 };
const btnBase = { color: "#fff", padding: "16px", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" as const, fontSize: "15px", transition: "all 0.2s" };
const iconBtn = { background: "none", border: "none", cursor: "pointer", fontSize: "20px", marginLeft: "12px" };
const summaryRow = { display: "flex", justifyContent: "space-between", alignItems: "center" };
