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
  const totalTax = totalGross - totalNet;

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

  // E-mail funkció
  const sendEmail = async () => {
    if(!confirm("Biztosan elküldöd az ajánlatot az ügyfélnek?")) return;
    alert("E-mail küldése folyamatban...");
    // Ide jöhet az API hívás az e-mailhez
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Betöltés...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      
      {/* NAVIGÁCIÓ */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => router.push(`/quotes`)} style={navBtn}>⬅️ Lista</button>
          <button onClick={() => router.push("/")} style={navBtn}>🏠 Főoldal</button>
        </div>
        <button onClick={sendEmail} style={{ ...navBtn, background: "#f39c12", color: "#fff", border: "none" }}>✉️ Ajánlat küldése e-mailben</button>
      </div>

      <h1 style={{ color: "#2c3e50" }}>{q.title}</h1>

      {/* KALKULÁTOR FORM (Ugyanaz mint előbb) */}
      <div style={formCard}>
         {/* ... (itt a kalkulátor kódod van) ... */}
         <form onSubmit={handleSubmit} style={{ display: "grid", gap: 15 }}>
            <input placeholder="Megnevezés" value={desc} onChange={e => setDesc(e.target.value)} style={inputS} required />
            <div style={{ display: "flex", gap: 10 }}>
               <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} style={{...inputS, width: 80}} />
               <input type="number" placeholder="Nettó beszerzés" value={basePriceNet} onChange={e => setBasePriceNet(Number(e.target.value))} style={inputS} />
               <input type="number" placeholder="Haszon" value={profitValue} onChange={e => setProfitValue(Number(e.target.value))} style={inputS} />
            </div>
            <button type="submit" style={{ ...btnBase, background: editingId ? "#e67e22" : "#27ae60" }}>
               {editingId ? "Tétel mentése" : "Tétel hozzáadása"}
            </button>
         </form>
      </div>

      {/* TÁBLÁZAT A NYILAKKAL */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 30 }}>
        <thead>
          <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #ddd" }}>
            <th style={{ padding: 10, width: 50 }}></th>
            <th style={{ textAlign: "left", padding: 10 }}>Tétel</th>
            <th>Menny.</th>
            <th style={{ textAlign: "right" }}>Bruttó össz.</th>
            <th style={{ textAlign: "right", paddingRight: 10 }}>Művelet</th>
          </tr>
        </thead>
        <tbody>
          {q.items.map((it: any, index: number) => (
            <tr key={it.id} style={{ borderBottom: "1px solid #eee" }}>
              <td>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <button onClick={() => moveItem(index, 'up')} disabled={index === 0} style={arrowBtn}>▲</button>
                  <button onClick={() => moveItem(index, 'down')} disabled={index === q.items.length - 1} style={arrowBtn}>▼</button>
                </div>
              </td>
              <td style={{ padding: 10 }}>
                <strong>{it.description}</strong>
              </td>
              <td style={{ textAlign: "center" }}>{it.quantity} {it.unit}</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>{Number(it.lineGross).toLocaleString()} Ft</td>
              <td style={{ textAlign: "right" }}>
                <button onClick={() => startEdit(it)} style={iconBtn}>✏️</button>
                <button onClick={() => { if(confirm("Törlöd?")) fetch(`/api/quotes/${quoteId}/items?id=${it.id}`, {method: "DELETE"}).then(loadQuote) }} style={iconBtn}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ÖSSZESÍTŐ ÉS PDF GOMB */}
      <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 20 }}>
        <div style={summaryBox}>
          <div style={summaryRow}><span>Nettó:</span> <span>{Math.round(totalNet).toLocaleString()} Ft</span></div>
          <div style={{ ...summaryRow, fontWeight: "bold", fontSize: 22, marginTop: 10, borderTop: "1px solid #ccc", paddingTop: 10 }}>
            <span>Bruttó:</span> <span>{totalGross.toLocaleString()} Ft</span>
          </div>
        </div>

        <button 
          onClick={() => window.open(`/quotes/${quoteId}/print`, '_blank')}
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
const arrowBtn = { background: "#eee", border: "1px solid #ccc", cursor: "pointer", fontSize: "10px", padding: "2px" };
const formCard = { background: "#fff", padding: 20, borderRadius: 12, border: "1px solid #ddd", marginBottom: 20 };
const inputS = { padding: "10px", borderRadius: "6px", border: "1px solid #ccc" };
const btnBase = { color: "#fff", padding: "12px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" as const };
const iconBtn = { background: "none", border: "none", cursor: "pointer", fontSize: "18px", marginLeft: "10px" };
const summaryBox = { background: "#f9f9f9", padding: 20, borderRadius: 12, border: "1px solid #ddd", minWidth: 300 };
const summaryRow = { display: "flex", justifyContent: "space-between" };
const pdfBtn = { background: "#2c3e50", color: "#fff", padding: "18px 40px", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold" as const, fontSize: "16px" };
