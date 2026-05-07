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

  // --- MATEMATIKA (A SZÁMÍTÁSI LOGIKA) ---
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
    const sortOrder = editingId 
      ? q.items.find((i: any) => i.id === editingId)?.sortOrder 
      : q.items.length;

    await fetch(`/api/quotes/${quoteId}/items`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        description: desc,
        quantity: currentQty,
        unit,
        basePrice: currentBasePriceNet, // Nettó beszerzés mentése
        unitPriceNet: Math.round(sellPriceNet), // Nettó eladási mentése
        lineGross: Math.round(lineTotalGross), // Teljes bruttó mentése
        sortOrder
      }),
    });
    resetForm();
    loadQuote();
  };

  // --- VÉGLEGESEN JAVÍTOTT SZERKESZTÉS INDÍTÁSA ---
  const startEdit = (it: any) => {
    setEditingId(it.id);
    setDesc(it.description);
    const itemQty = Number(it.quantity) || 1;
    setQty(itemQty);
    setUnit(it.unit || "db");
    
    // 1. Nettó beszerzés betöltése az elmentett értékből
    const savedBasePriceNet = Number(it.basePrice) || 0;
    setBasePriceNet(savedBasePriceNet);

    // 2. Kiszámoljuk az elmentett egységnyi bruttó árat
    const savedLineGross = Number(it.lineGross) || 0;
    const savedSellPriceGrossPerUnit = savedLineGross / itemQty;

    // 3. Kiszámoljuk a bruttó beszerzést
    const currentBasePriceGross = savedBasePriceNet * 1.27;

    // 4. A HASZON kiszámítása (Bruttó eladási - Bruttó alapár)
    const calculatedProfit = savedSellPriceGrossPerUnit - currentBasePriceGross;

    // Beállítjuk az értéket (kerekítve, hogy ne legyen 0.000001 típusú hiba)
    setProfitType("fix");
    setProfitValue(Math.round(calculatedProfit));

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
          <h1 
            onClick={() => setIsEditingTitle(true)}
            style={{ margin: 0, color: "#fff", cursor: "pointer", borderBottom: "1px dashed #555" }}
            title="Kattints a módosításhoz"
          >
            {q.title} ✏️
          </h1>
        )}
        
        <div style={{ display: "flex", gap: 12, marginTop: 15 }}>
          <span style={badgeBlue}>👤 {q.client?.name}</span>
          {q.client?.units?.length > 0 && (
            <span style={badgeGreen}>❄️ {q.client.units[0].brand} {q.client.units[0].model}</span>
          )}
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
            <strong>Bruttó egységár: {Math.round(sellPriceGross).toLocaleString()} Ft</strong>
            <strong>Tétel összesen: {Math.round(lineTotalGross).toLocaleString()} Ft</strong>
          </div>

          <button type="submit" style={{ ...btnBase, background: editingId ? "#e67e22" : "#27ae60" }}>
            {editingId ? "VÁLTOZTATÁSOK MENTÉSE" : "TÉTEL HOZZÁADÁSA"}
          </button>
          {editingId && <button type="button" onClick={resetForm} style={{background: "#95a5a6", ...btnBase}}>MÉGSEM</button>}
        </form>
      </div>

      {/* TÁBLÁZAT */}
      <div style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid #444" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#1a1a1a" }}>
          <thead>
            <tr style={{ background: "#333", textAlign: "left", borderBottom: "2px solid #444" }}>
              <th style={{ padding: 12, width: 40 }}></th>
              <th style={{ padding: 12, color: "#fff" }}>Megnevezés</th>
              <th style={{ padding: 12, color: "#fff" }}>Menny.</th>
              <th style={{ padding: 12, color: "#fff", textAlign: "right" }}>Bruttó</th>
              <th style={{ padding: 12, color: "#fff", textAlign: "right", paddingRight: 20 }}>Művelet</th>
            </tr>
          </thead>
          <tbody>
            {q.items.map((it: any, index: number) => (
              <tr key={it.id} style={{ borderBottom: "1px solid #333" }}>
                <td style={{ padding: 8 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <button onClick={() => moveItem(index, 'up')} disabled={index === 0} style={arrowBtn}>▲</button>
                    <button onClick={() => moveItem(index, 'down')} disabled={index === q.items.length - 1} style={arrowBtn}>▼</button>
                  </div>
                </td>
                <td style={{ padding: 12, color: "#eee" }}><strong>{it.description}</strong></td>
                <td style={{ padding: 12, color: "#ccc" }}>{it.quantity} {it.unit}</td>
                <td style={{ padding: 12, textAlign: "right", fontWeight: "bold", color: "#fff" }}>{Number(it.lineGross).toLocaleString()} Ft</td>
                <td style={{ padding: 12, textAlign: "right", paddingRight: 20 }}>
                  <button onClick={() => startEdit(it)} style={iconBtn}>✏️</button>
                  <button onClick={() => { if(confirm("Törlöd?")) fetch(`/api/quotes/${quoteId}/items?id=${it.id}`, {method: "DELETE"}).then(loadQuote) }} style={iconBtn}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ÖSSZESÍTŐ */}
      <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <div style={summaryBox}>
          <div style={{ ...summaryRow, color: "#ccc" }}><span>Összesen Nettó:</span> <span>{Math.round(totalNet).toLocaleString()} Ft</span></div>
          <div style={{ ...summaryRow, fontWeight: "bold", fontSize: 24, marginTop: 10, borderTop: "2px solid #555", paddingTop: 10, color: "#fff" }}>
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
