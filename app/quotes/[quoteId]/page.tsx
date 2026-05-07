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

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");

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
          data.items.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
        }
        setQ(data);
        setTempTitle(data.title || "");
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

  const saveTitle = async () => {
    if (tempTitle === q.title) {
      setIsEditingTitle(false);
      return;
    }
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: tempTitle }),
      });
      if (res.ok) {
        setQ({ ...q, title: tempTitle });
      }
    } catch (err) {
      console.error("Cím mentési hiba", err);
    }
    setIsEditingTitle(false);
  };

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
  const currentBasePriceNet = Number(basePriceNet) || 0;
  const currentQty = Number(qty) || 0;
  const basePriceGross = currentBasePriceNet * 1.27;
  const profitGross = profitType === "percent" 
    ? basePriceGross * ((Number(profitValue) || 0) / 100)
    : (Number(profitValue) || 0);

  const sellPriceGross = basePriceGross + profitGross;
  const sellPriceNet = sellPriceGross / 1.27;
  const lineTotalGross = sellPriceGross * currentQty;

  const totalGross = q?.items?.reduce((sum: number, it: any) => sum + Number(it.lineGross), 0) || 0;
  const totalNet = totalGross / 1.27;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? "PATCH" : "POST";
    
    await fetch(`/api/quotes/${quoteId}/items`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        description: desc,
        quantity: currentQty,
        unit,
        basePrice: currentBasePriceNet, 
        unitPriceNet: Math.round(sellPriceNet),
        lineGross: Math.round(lineTotalGross),
        sortOrder: editingId ? q.items.find((i: any) => i.id === editingId)?.sortOrder : q.items.length
      }),
    });
    resetForm();
    loadQuote();
  };

  const startEdit = (it: any) => {
    setEditingId(it.id);
    setDesc(it.description);
    const itemQty = Number(it.quantity) || 1;
    setQty(itemQty);
    setUnit(it.unit || "db");
    
    // Alapár visszatöltése
    const savedBaseNet = Number(it.basePrice) || 0;
    setBasePriceNet(savedBaseNet);

    // Haszon visszakalkulálása bruttóban
    const savedTotalGross = Number(it.lineGross) || 0;
    const sellPriceGrossPerUnit = savedTotalGross / itemQty;
    const basePriceGrossPerUnit = savedBaseNet * 1.27;
    const diffGross = sellPriceGrossPerUnit - basePriceGrossPerUnit;

    setProfitType("fix");
    setProfitValue(Math.round(diffGross));

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null); setDesc(""); setQty(1); setUnit("db"); setBasePriceNet(0); setProfitValue(0);
  };

  const sendEmail = async () => {
    if(!confirm("Biztosan elküldöd az ajánlatot az ügyfélnek?")) return;
    alert("Funkció fejlesztés alatt...");
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#fff" }}>Betöltés...</div>;
  if (!q) return <div style={{ padding: 40, textAlign: "center", color: "#fff" }}>Az ajánlat nem található.</div>;

  // Stílusok objektumként definiálva a fájlon belül
  const navBtn = { padding: "10px 15px", borderRadius: "8px", border: "1px solid #444", background: "#333", color: "#fff", cursor: "pointer", fontWeight: "bold" as const };
  const inputS = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" as const, color: "#333" };
  const labS = { fontSize: "11px", fontWeight: "bold", color: "#7f8c8d", textTransform: "uppercase" as const, marginBottom: "5px", display: "block" };
  const badgeBlue = { background: "#0288d1", color: "#fff", padding: "5px 12px", borderRadius: "15px", fontSize: "13px", fontWeight: "bold" as const };
  const badgeGreen = { background: "#388e3c", color: "#fff", padding: "5px 12px", borderRadius: "15px", fontSize: "13px", fontWeight: "bold" as const };
  const resultBar = { background: "#2c3e50", color: "#fff", padding: "15px", borderRadius: "10px", display: "flex", justifyContent: "space-between", marginTop: 10 };
  const btnBase = { color: "#fff", padding: "15px", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" as const, width: "100%" };
  const arrowBtn = { background: "#444", border: "1px solid #555", color: "#fff", cursor: "pointer", fontSize: "10px", padding: "2px", borderRadius: "3px" };
  const iconBtn = { background: "none", border: "none", cursor: "pointer", fontSize: "18px", marginLeft: "10px", filter: "brightness(2)" };
  const summaryBox = { background: "#222", padding: 20, borderRadius: 12, border: "1px solid #444", minWidth: 320, marginBottom: 20 };
  const summaryRow = { display: "flex", justifyContent: "space-between", marginBottom: 5 };
  const pdfBtn = { background: "#34495e", color: "#fff", padding: "18px 40px", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold" as const, fontSize: "17px", boxShadow: "0 4px 10px rgba(0,0,0,0.3)" };

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => router.push(`/quotes`)} style={navBtn}>⬅️ Lista</button>
          <button onClick={() => router.push("/")} style={navBtn}>🏠 Főoldal</button>
        </div>
        <button onClick={sendEmail} style={{ ...navBtn, background: "#f39c12", color: "#fff", border: "none" }}>✉️ Ajánlat küldése</button>
      </div>

      <div style={{ marginBottom: 30, borderBottom: "2px solid #333", paddingBottom: 20 }}>
        {isEditingTitle ? (
          <input 
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === "Enter" && saveTitle()}
            autoFocus
            style={{ ...inputS, fontSize: "2rem", fontWeight: "bold", background: "#333", color: "#fff", border: "1px solid #27ae60" }}
          />
        ) : (
          <h1 onClick={() => setIsEditingTitle(true)} style={{ margin: 0, color: "#fff", cursor: "pointer" }}>{q.title} ✏️</h1>
        )}
      </div>

      <div style={{ background: editingId ? "#fff3e0" : "#ffffff", padding: 25, borderRadius: 15, marginBottom: 40, border: "1px solid #ddd" }}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
          <input placeholder="Megnevezés" value={desc} onChange={e => setDesc(e.target.value)} style={inputS} required />
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ flex: 1 }}>
              <label style={labS}>Mennyiség</label>
              <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} style={inputS} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labS}>Nettó Beszerzés</label>
              <input type="number" value={basePriceNet} onChange={e => setBasePriceNet(Number(e.target.value))} style={inputS} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labS}>Haszon (Ft)</label>
              <input type="number" value={profitValue} onChange={e => setProfitValue(Number(e.target.value))} style={inputS} />
            </div>
          </div>
          <div style={resultBar}>
            <strong>Bruttó egységár: {Math.round(sellPriceGross).toLocaleString()} Ft</strong>
            <strong>Összesen: {Math.round(lineTotalGross).toLocaleString()} Ft</strong>
          </div>
          <button type="submit" style={{ ...btnBase, background: editingId ? "#e67e22" : "#27ae60" }}>
            {editingId ? "MENTÉS" : "HOZZÁADÁS"}
          </button>
          {editingId && <button type="button" onClick={resetForm} style={{ ...btnBase, background: "#7f8c8d" }}>MÉGSEM</button>}
        </form>
      </div>

      <div style={{ background: "#1a1a1a", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#fff" }}>
          <thead>
            <tr style={{ background: "#333", textAlign: "left" }}>
              <th style={{ padding: 12 }}></th>
              <th style={{ padding: 12 }}>Megnevezés</th>
              <th style={{ padding: 12 }}>Menny.</th>
              <th style={{ padding: 12, textAlign: "right" }}>Bruttó</th>
              <th style={{ padding: 12, textAlign: "right" }}>Művelet</th>
            </tr>
          </thead>
          <tbody>
            {q.items.map((it: any, index: number) => (
              <tr key={it.id} style={{ borderBottom: "1px solid #333" }}>
                <td style={{ padding: 8 }}>
                  <button onClick={() => moveItem(index, 'up')} disabled={index === 0} style={arrowBtn}>▲</button>
                  <button onClick={() => moveItem(index, 'down')} disabled={index === q.items.length - 1} style={arrowBtn}>▼</button>
                </td>
                <td style={{ padding: 12 }}>{it.description}</td>
                <td style={{ padding: 12 }}>{it.quantity} {it.unit}</td>
                <td style={{ padding: 12, textAlign: "right" }}>{Number(it.lineGross).toLocaleString()} Ft</td>
                <td style={{ padding: 12, textAlign: "right" }}>
                  <button onClick={() => startEdit(it)} style={iconBtn}>✏️</button>
                  <button onClick={() => { if(confirm("Törlöd?")) fetch(`/api/quotes/${quoteId}/items?id=${it.id}`, {method: "DELETE"}).then(loadQuote) }} style={iconBtn}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <div style={summaryBox}>
          <div style={summaryRow}><span>Nettó:</span> <span>{Math.round(totalNet).toLocaleString()} Ft</span></div>
          <div style={{ ...summaryRow, fontSize: 24, fontWeight: "bold", borderTop: "1px solid #444", paddingTop: 10, marginTop: 10 }}>
            <span>Bruttó:</span> <span>{totalGross.toLocaleString()} Ft</span>
          </div>
        </div>
        <button onClick={() => window.open(`/quotes/${quoteId}/print`, '_blank')} style={pdfBtn}>📄 PDF GENERÁLÁSA</button>
      </div>
    </div>
  );
}
