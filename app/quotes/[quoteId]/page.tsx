"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function QuoteEditPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params?.quoteId;

  const [q, setQ] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dbItems, setDbItems] = useState<any[]>([]);

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
      // Fontos: a tételeket sorrend szerint rendezve tároljuk el
      if (data.items) {
        data.items.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
      }
      setQ(data);
    }
    setLoading(false);
  };

  const loadDbItems = async () => {
    const res = await fetch("/api/items");
    if (res.ok) {
      const data = await res.json();
      setDbItems(data);
    }
  };

  useEffect(() => {
    if (quoteId) {
      loadQuote();
      loadDbItems();
    }
  }, [quoteId]);

  // --- MOZGATÁSI LOGIKA ---
  const moveItem = async (index: number, direction: 'up' | 'down') => {
    if (!q || !q.items) return;
    
    const newItems = [...q.items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    // Csere a helyi állapotban
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];

    // Új sortOrder értékek kiosztása
    const itemsWithNewOrder = newItems.map((item, idx) => ({
      ...item,
      sortOrder: idx
    }));

    // Optimista frissítés (azonnal látsszon a változás)
    setQ({ ...q, items: itemsWithNewOrder });

    // Mentés az adatbázisba
    try {
      await fetch(`/api/quotes/${quoteId}/items/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsWithNewOrder.map(i => ({ id: i.id, sortOrder: i.sortOrder })) }),
      });
    } catch (err) {
      console.error("Hiba a sorrend mentésekor", err);
      loadQuote(); // Hiba esetén visszatöltjük az eredetit
    }
  };

  const handleSelectFromDB = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = dbItems.find(i => i.id === Number(e.target.value));
    if (selected) {
      setDesc(selected.name);
      setBasePriceNet(selected.price);
      setProfitValue(0);
    }
  };

  // --- ÉLŐ MATEMATIKA ---
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? "PATCH" : "POST";
    
    // Új tétel esetén a lista végére tesszük
    const sortOrder = editingId 
      ? q.items.find((i: any) => i.id === editingId)?.sortOrder 
      : q.items.length;

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
        sortOrder
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
    setBasePriceNet(it.costNet || it.unitPriceNet);
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
        <button onClick={() => router.push(`/quotes`)} style={navBtn}>⬅️ Összes ajánlat</button>
        <button onClick={() => router.push("/")} style={{ ...navBtn, background: "#f8f9fa" }}>🏠 Főoldal</button>
      </div>

      {/* FEJLÉC */}
      <div style={{ marginBottom: 30, borderBottom: "2px solid #eee", paddingBottom: 20 }}>
        <h1 style={{ margin: 0, color: "#2c3e50", fontSize: 28 }}>{q.title}</h1>
        <div style={{ display: "flex", gap: 12, marginTop: 15, flexWrap: "wrap" }}>
          <span style={badgeBlue}>👤 {q.client?.name}</span>
          {q.client?.units?.length > 0 && (
            <span style={badgeGreen}>
              ❄️ {q.client.units[0].brand} {q.client.units[0].model}
            </span>
          )}
        </div>
      </div>

      {/* KALKULÁTOR */}
      <div style={{ background: editingId ? "#fff3e0" : "#ffffff", padding: 25, borderRadius: 15, border: editingId ? "2px solid #e67e22" : "1px solid #ddd", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", marginBottom: 40 }}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
          {/* Adatbázis választó */}
          {!editingId && (
            <div style={{ padding: "10px", background: "#f0f7ff", borderRadius: "10px" }}>
              <label style={labS}>Gyors betöltés</label>
              <select onChange={handleSelectFromDB} style={inputS}>
                <option value="">-- Válassz az adatbázisból --</option>
                {dbItems.map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({item.price} Ft)</option>
                ))}
              </select>
            </div>
          )}

          <input placeholder="Megnevezés" value={desc} onChange={e => setDesc(e.target.value)} style={inputS} required />
          
          <div style={{ display: "flex", gap: 20 }}>
            <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} style={{...inputS, width: '100px'}} />
            <input type="number" placeholder="Nettó beszerzés" value={basePriceNet} onChange={e => setBasePriceNet(Number(e.target.value))} style={inputS} />
            <div style={{flex: 1}}>
              <label style={labS}>Haszon (Bruttó)</label>
              <div style={{display: 'flex', gap: 5}}>
                <input type="number" value={profitValue} onChange={e => setProfitValue(Number(e.target.value))} style={inputS} />
                <select value={profitType} onChange={e => setProfitType(e.target.value as any)} style={{...inputS, width: 80}}>
                  <option value="fix">Ft</option>
                  <option value="percent">%</option>
                </select>
              </div>
            </div>
          </div>

          <div style={resultBar}>
            <strong>Bruttó egységár: {Math.round(sellPriceGross).toLocaleString()} Ft</strong>
            <strong>Összesen: {Math.round(lineTotalGross).toLocaleString()} Ft</strong>
          </div>

          <button type="submit" style={{ ...btnBase, background: editingId ? "#e67e22" : "#27ae60" }}>
            {editingId ? "MENTÉS" : "HOZZÁADÁS"}
          </button>
        </form>
      </div>

      {/* TÁBLÁZAT */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8f9fa", textAlign: "left" }}>
              <th style={{ padding: 12, width: "60px" }}></th> {/* Nyilak helye */}
              <th style={{ padding: 12 }}>Megnevezés</th>
              <th>Menny.</th>
              <th style={{ textAlign: "right" }}>Bruttó össz.</th>
              <th style={{ textAlign: "right", paddingRight: 15 }}>Műveletek</th>
            </tr>
          </thead>
          <tbody>
            {q.items.map((it: any, index: number) => (
              <tr key={it.id} style={{ borderBottom: "1px solid #eee" }}>
                {/* NYILAK */}
                <td style={{ padding: "10px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <button 
                      onClick={() => moveItem(index, 'up')} 
                      disabled={index === 0}
                      style={{ ...arrowBtn, opacity: index === 0 ? 0.2 : 1 }}
                    >▲</button>
                    <button 
                      onClick={() => moveItem(index, 'down')} 
                      disabled={index === q.items.length - 1}
                      style={{ ...arrowBtn, opacity: index === q.items.length - 1 ? 0.2 : 1 }}
                    >▼</button>
                  </div>
                </td>
                <td style={{ padding: 12 }}>
                  <div style={{ fontWeight: "bold" }}>{it.description}</div>
                  <div style={{ fontSize: 11, color: "#999" }}>Nettó egység: {Math.round(it.unitPriceNet).toLocaleString()} Ft</div>
                </td>
                <td>{it.quantity} {it.unit}</td>
                <td style={{ textAlign: "right", fontWeight: "bold" }}>{Number(it.lineGross).toLocaleString()} Ft</td>
                <td style={{ textAlign: "right", paddingRight: 15 }}>
                  <button onClick={() => startEdit(it)} style={iconBtn}>✏️</button>
                  <button onClick={() => { if(confirm("Törlöd?")) fetch(`/api/quotes/${quoteId}/items?id=${it.id}`, {method: "DELETE"}).then(loadQuote) }} style={{ ...iconBtn, color: "#e74c3c" }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ÖSSZESÍTŐ */}
      <div style={{ marginTop: 30, display: "flex", justifyContent: "flex-end" }}>
        <div style={{ background: "#fdfdfd", border: "1px solid #ddd", padding: 20, borderRadius: 12, minWidth: 300 }}>
          <div style={summaryRow}><span>Nettó:</span> <span>{Math.round(totalNet).toLocaleString()} Ft</span></div>
          <div style={summaryRow}><span>ÁFA:</span> <span>{Math.round(totalTax).toLocaleString()} Ft</span></div>
          <div style={{ ...summaryRow, borderTop: "2px solid #333", marginTop: 10, paddingTop: 10, fontWeight: "bold", fontSize: 20 }}>
            <span>Bruttó:</span> <span>{totalGross.toLocaleString()} Ft</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ÚJ STÍLUSOK
const arrowBtn: React.CSSProperties = { 
  background: "#f0f0f0", border: "1px solid #ccc", borderRadius: "4px", 
  cursor: "pointer", fontSize: "10px", padding: "2px 5px", color: "#666" 
};

// RÉGI STÍLUSOK (megtartva)
const navBtn: React.CSSProperties = { padding: "10px 18px", borderRadius: "10px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontWeight: "bold" };
const inputS = { width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" as const };
const labS = { fontSize: "11px", fontWeight: "bold", color: "#7f8c8d", textTransform: "uppercase" as const };
const badgeBlue = { background: "#e1f5fe", color: "#0288d1", padding: "5px 12px", borderRadius: "15px", fontSize: "13px", fontWeight: "bold" as const };
const badgeGreen = { background: "#f1f8e9", color: "#388e3c", padding: "5px 12px", borderRadius: "15px", fontSize: "13px", fontWeight: "bold" as const };
const resultBar = { background: "#2c3e50", color: "#fff", padding: "15px", borderRadius: "10px", display: "flex", justifyContent: "space-between", marginTop: 10 };
const btnBase = { color: "#fff", padding: "15px", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" as const };
const iconBtn = { background: "none", border: "none", cursor: "pointer", fontSize: "18px", marginLeft: "10px" };
const summaryRow = { display: "flex", justifyContent: "space-between", marginBottom: 5 };
