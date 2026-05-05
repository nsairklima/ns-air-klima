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
    try {
      const res = await fetch(`/api/quotes/${quoteId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          // Sorrend szerinti rendezés betöltéskor
          data.items.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
        }
        setQ(data);
      }
    } catch (err) {
      console.error("Hiba az ajánlat betöltésekor", err);
    } finally {
      setLoading(false);
    }
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

  // Sorrend mozgatása és mentése az új API-val
  const moveItem = async (index: number, direction: 'up' | 'down') => {
    if (!q || !q.items) return;
    const newItems = [...q.items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    const itemsWithNewOrder = newItems.map((item, idx) => ({ ...item, sortOrder: idx }));

    setQ({ ...q, items: itemsWithNewOrder });

    try {
      await fetch(`/api/quotes/${quoteId}/items/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsWithNewOrder.map(i => ({ id: i.id, sortOrder: i.sortOrder })) }),
      });
    } catch (err) {
      console.error("Sorrend mentési hiba", err);
      loadQuote();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? "PATCH" : "POST";
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
    setEditingId(null); setDesc(""); setQty(1); setUnit("db"); setBasePriceNet(0); setProfitValue(0);
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Betöltés...</div>;
  if (!q) return <div style={{ padding: 40, textAlign: "center" }}>Az ajánlat nem található.</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto", fontFamily: "Arial, sans-serif", color: "#333" }}>
      
      {/* NAVIGÁCIÓ */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => router.push(`/quotes`)} style={navBtn}>⬅️ Lista</button>
          <button onClick={() => router.push("/")} style={navBtn}>🏠 Főoldal</button>
        </div>
        <button onClick={() => alert("E-mail küldés fejlesztés alatt...")} style={{ ...navBtn, background: "#f39c12", color: "#fff", border: "none" }}>✉️ Ajánlat küldése</button>
      </div>

      <div style={{ marginBottom: 30, borderBottom: "2px solid #eee", paddingBottom: 20 }}>
        <h1 style={{ margin: 0, color: "#2c3e50" }}>{q.title}</h1>
        <div style={{ display: "flex", gap: 12, marginTop: 15 }}>
          <span style={badgeBlue}>👤 {q.client?.name}</span>
        </div>
      </div>

      {/* KALKULÁTOR */}
      <div style={{ background: editingId ? "#fff3e0" : "#ffffff", padding: 25, borderRadius: 15, border: editingId ? "2px solid #e67e22" : "1px solid #ddd", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", marginBottom: 40 }}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
          {!editingId && (
            <div style={{ padding: "10px", background: "#f0f7ff", borderRadius: "10px" }}>
              <label style={labS}>Gyors betöltés az adatbázisból</label>
              <select onChange={handleSelectFromDB} style={inputS}>
                <option value="">-- Válassz --</option>
                {dbItems.map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({item.price.toLocaleString()} Ft)</option>
                ))}
              </select>
            </div>
          )}

          <input placeholder="Megnevezés" value={desc} onChange={e => setDesc(e.target.value)} style={inputS} required />
          
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: "1" }}>
              <label style={labS}>Mennyiség</label>
              <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} style={inputS} />
            </div>
            <div style={{ flex: "1" }}>
              <label style={labS}>Nettó Beszerzés</label>
              <input type="number" value={basePriceNet} onChange={e => setBasePriceNet(Number(e.target.value))} style={inputS} />
            </div>
            <div style={{ flex: "1" }}>
              <label style={labS}>Haszon ({profitType === 'percent' ? '%' : 'Ft'})</label>
              <div style={{ display: "flex", gap: 5 }}>
                <input type="number" value={profitValue} onChange={e => setProfitValue(Number(e.target.value))} style={inputS} />
                <select value={profitType} onChange={e => setProfitType(e.target.value as any)} style={{ ...inputS, width: 70 }}>
                  <option value="fix">Ft</option>
                  <option value="percent">%</option>
                </select>
              </div>
            </div>
          </div>

          <div style={resultBar}>
            <span style={{ color: "#ffffff" }}>Bruttó egységár: <strong>{Math.round(sellPriceGross).toLocaleString()} Ft</strong></span>
            <span style={{ color: "#ffffff" }}>Tétel összesen: <strong>{Math.round(lineTotalGross).toLocaleString()} Ft</strong></span>
          </div>

          <button type="submit" style={{ ...btnBase, background: editingId ? "#e67e22" : "#27ae60" }}>
            {editingId ? "VÁLTOZTATÁSOK MENTÉSE" : "TÉTEL HOZZÁADÁSA"}
          </button>
        </form>
      </div>

      {/* TÁBLÁZAT */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f8f9fa", textAlign: "left", borderBottom: "2px solid #ddd" }}>
            <th style={{ padding: 10, width: 40 }}></th>
            <th style={{ padding: 10 }}>Megnevezés</th>
            <th>Menny.</th>
            <th style={{ textAlign: "right" }}>Bruttó</th>
            <th style={{ textAlign: "right", paddingRight: 10 }}>Művelet</th>
          </tr>
        </thead>
        <tbody>
          {q.items.map((it: any, index: number) => (
            <tr key={it.id} style={{ borderBottom: "1px solid #eee" }}>
              <td>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <button onClick={() => moveItem(index, 'up')} disabled={index === 0} style={arrowBtn}>▲</button>
                  <button onClick={() => moveItem(index, 'down')} disabled={index === q.items.length - 1} style={arrowBtn}>▼</button>
                </div>
              </td>
              <td style={{ padding: 10 }}>
                <div style={itemText}>{it.description}</div>
                <div style={subText}>Nettó egység: {Math.round(it.unitPriceNet).toLocaleString()} Ft</div>
              </td>
              <td>{it.quantity} {it.unit}</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>{Number(it.lineGross).toLocaleString()} Ft</td>
              <td style={{ textAlign: "right" }}>
                <button onClick={() => startEdit(it)} style={iconBtn}>✏️</button>
                <button onClick={() => { if(confirm("Törlöd?")) fetch(`/api/quotes/${quoteId}/items?id=${it.id}`, {method: "DELETE"}).then(loadQuote) }} style={iconBtn}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ÖSSZESÍTŐ */}
      <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <div style={summaryBox}>
          <div style={summaryRow}><span>Összesen Nettó:</span> <span>{Math.round(totalNet).toLocaleString()} Ft</span></div>
          <div style={{ ...summaryRow, fontWeight: "bold", fontSize: 24, marginTop: 10, borderTop: "2px solid #333", paddingTop: 10 }}>
            <span>Bruttó:</span> <span>{totalGross.toLocaleString()} Ft</span>
          </div>
        </div>
        <button 
          onClick={() => window.open(`/api/quotes/${quoteId}/pdf`, '_blank')}
          style={pdfBtn}
        >
          📄 HIVATALOS PDF GENERÁLÁSA
        </button>
      </div>
    </div>
  );
}

// STÍLUSOK
const navBtn = { padding: "10px 15px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontWeight: "bold" as const };
const inputS = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" as const };
const labS = { fontSize: "11px", fontWeight: "bold", color: "#7f8c8d", textTransform: "uppercase" as const, marginBottom: "5px", display: "block" };
const badgeBlue = { background: "#e1f5fe", color: "#0288d1", padding: "5px 12px", borderRadius: "15px", fontSize: "13px", fontWeight: "bold" as const };
const resultBar = { background: "#2c3e50", color: "#ffffff", padding: "15px", borderRadius: "10px", display: "flex", justifyContent: "space-between", marginTop: 10 };
const btnBase = { color: "#fff", padding: "15px", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" as const, width: "100%" };
const arrowBtn = { background: "#eee", border: "1px solid #ccc", cursor: "pointer", fontSize: "10px", padding: "2px", borderRadius: "3px" };
const iconBtn = { background: "none", border: "none", cursor: "pointer", fontSize: "18px", marginLeft: "10px" };
const itemText = { color: "#2c3e50", fontWeight: "bold", fontSize: "14px" };
const subText = { color: "#7f8c8d", fontSize: "11px" };
const summaryBox = { background: "#fdfdfd", padding: 20, borderRadius: 12, border: "1px solid #ddd", minWidth: 320, marginBottom: 20 };
const summaryRow = { display: "flex", justifyContent: "space-between", marginBottom: 5 };
const pdfBtn = { background: "#34495e", color: "#fff", padding: "18px 40px", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold" as const, fontSize: "17px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" };
