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
  const [basePriceNet, setBasePriceNet] = useState(0); 
  const [profitValue, setProfitValue] = useState(0); 
  const [profitType, setProfitType] = useState<"percent" | "fix">("fix");

  const loadQuote = async () => {
    const res = await fetch(`/api/quotes/${quoteId}`);
    if (res.ok) setQ(await res.json());
    setLoading(false);
  };

  useEffect(() => { if (quoteId) loadQuote(); }, [quoteId]);

  // KISZÁMÍTOTT ELADÁSI ÁRAK
  const currentBaseGross = basePriceNet * 1.27;
  const currentSellGross = profitType === "percent" 
    ? currentBaseGross * (1 + profitValue / 100) 
    : currentBaseGross + profitValue;
  const currentSellNet = currentSellGross / 1.27;

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
        unitPriceNet: Math.round(currentSellNet),
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
  };

  const startEdit = (it: any) => {
    setEditingId(it.id);
    setDesc(it.description);
    setQty(it.quantity);
    setUnit(it.unit);
    // Itt a trükk: a már elmentett nettó árat rakjuk be beszerzési árnak, 
    // és a hasznot 0-ra állítjuk, így pontosan az elmentett összeg jelenik meg!
    setBasePriceNet(it.unitPriceNet); 
    setProfitValue(0); 
    setProfitType("fix");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div style={{padding:20}}>Betöltés...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto", fontFamily: "Arial" }}>
      <h1 style={{color: editingId ? "#e67e22" : "#2c3e50"}}>
        {editingId ? "Tétel pontosítása" : `Ajánlat: ${q?.client?.name}`}
      </h1>

      <div style={{ background: editingId ? "#fffdfa" : "#f8f9fa", padding: 25, borderRadius: 15, border: editingId ? "2px solid #e67e22" : "1px solid #ddd" }}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 15 }}>
          <input placeholder="Tétel leírása..." value={desc} onChange={e => setDesc(e.target.value)} style={inputS} required />
          
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{flex: 1}}>
              <label style={labS}>Menny. és egység</label>
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
              <label style={labS}>Bázis ár (Nettó Ft)</label>
              <input type="number" value={basePriceNet} onChange={e => setBasePriceNet(Number(e.target.value))} style={inputS} />
            </div>

            <div style={{flex: 1.5}}>
              <label style={labS}>Extra haszon (Bruttó Ft)</label>
              <input type="number" value={profitValue} onChange={e => setProfitValue(Number(e.target.value))} style={inputS} />
            </div>
          </div>

          <div style={{ background: "#f0f7ff", padding: 15, borderRadius: 10, border: "1px solid #cce3f5" }}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
              <span>Ügyfél által látott <strong>Bruttó egységár:</strong></span>
              <strong style={{fontSize: "20px"}}>{Math.round(currentSellGross).toLocaleString()} Ft</strong>
            </div>
          </div>

          <div style={{display: "flex", gap: 10}}>
            <button type="submit" style={{ flex: 2, background: editingId ? "#e67e22" : "#27ae60", color: "#fff", padding: 15, border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold" }}>
              {editingId ? "MÓDOSÍTÁSOK MENTÉSE" : "HOZZÁADÁS"}
            </button>
            {editingId && <button onClick={resetForm} type="button" style={{flex: 1, borderRadius: 10, border: "1px solid #ccc"}}>Mégse</button>}
          </div>
        </form>
      </div>

      <table style={{ width: "100%", marginTop: 30, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #333", textAlign: "left" }}>
            <th style={{ padding: 10 }}>Leírás</th>
            <th>Egységár (Bruttó)</th>
            <th style={{ textAlign: "right" }}>Összesen (Bruttó)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {q?.items.map((it: any) => (
            <tr key={it.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 12 }}>
                <div style={{ fontWeight: "bold" }}>{it.description}</div>
                <small style={{ color: "#888" }}>
                  {it.quantity} {it.unit} × {Math.round(it.unitPriceNet).toLocaleString()} Ft nettó
                </small>
              </td>
              <td style={{ verticalAlign: "middle" }}>
                {Math.round(it.unitPriceNet * 1.27).toLocaleString()} Ft
              </td>
              <td style={{ textAlign: "right", fontWeight: "bold", verticalAlign: "middle" }}>
                {it.lineGross.toLocaleString()} Ft
              </td>
              <td style={{ textAlign: "right", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                {/* SZERKESZTÉS GOMB */}
                <button 
                  onClick={() => startEdit(it)} 
                  style={{ background: "#f39c12", color: "white", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer", marginRight: 8 }}
                  title="Szerkesztés"
                >
                  ✏️
                </button>
                
                {/* TÖRLÉS GOMB */}
                <button 
                  onClick={() => {
                    if (confirm("Biztosan törlöd ezt a tételt?")) {
                      fetch(`/api/quotes/${quoteId}/items?id=${it.id}`, { method: "DELETE" })
                        .then(res => {
                          if (res.ok) loadQuote();
                          else alert("Hiba a törlés során");
                        });
                    }
                  }} 
                  style={{ background: "#e74c3c", color: "white", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}
                  title="Törlés"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const inputS = { width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" as const };
const labS = { fontSize: "11px", fontWeight: "bold", marginBottom: 4, display: "block", color: "#7f8c8d", textTransform: "uppercase" as const };
