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
      setLoading(false); // JAVÍTVA: loading(false) helyett setLoading(false)
    }
  };

  const loadDbItems = async () => {
    try {
      const res = await fetch("/api/items");
      if (res.ok) {
        const data = await res.json();
        setDbItems(data);
      }
    } catch (err) {
      console.error("Adatbázis tételek betöltési hiba", err);
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
      await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: tempTitle }),
      });
      setQ({ ...q, title: tempTitle });
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
        body: JSON.stringify({ 
          items: itemsWithNewOrder.map(i => ({ id: i.id, sortOrder: i.sortOrder })) 
        }),
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

  const n_beszerzes = Number(basePriceNet) || 0;
  const n_profit = Number(profitValue) || 0;
  const n_mennyiseg = Number(qty) || 0;

  const brutto_beszerzes = n_beszerzes * 1.27;
  const brutto_haszon = profitType === "percent" 
    ? brutto_beszerzes * (n_profit / 100)
    : n_profit;

  const sellPriceGross = brutto_beszerzes + brutto_haszon;
  const sellPriceNet = sellPriceGross / 1.27;
  const lineTotalGross = sellPriceGross * n_mennyiseg;

  const totalGross = q?.items?.reduce((sum: number, it: any) => sum + Number(it.lineGross), 0) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? "PATCH" : "POST";
    
    await fetch(`/api/quotes/${quoteId}/items`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        description: desc,
        quantity: n_mennyiseg,
        unit,
        basePrice: n_beszerzes, 
        unitPriceNet: sellPriceNet,
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
    const m = Number(it.quantity) || 1;
    setQty(m);
    setUnit(it.unit || "db");
    
    const mentettNettoAlap = Number(it.costNet) || 0;
    setBasePriceNet(mentettNettoAlap);

    const mentettTeljesBrutto = Number(it.lineGross) || 0;
    const bruttoEladasiEgysegar = mentettTeljesBrutto / m;
    const bruttoBeszerzesiEgysegar = mentettNettoAlap * 1.27;
    
    const diff = bruttoEladasiEgysegar - bruttoBeszerzesiEgysegar;

    setProfitType("fix");
    setProfitValue(Math.round(diff));

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null); setDesc(""); setQty(1); setUnit("db"); setBasePriceNet(0); setProfitValue(0);
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#fff" }}>Betöltés...</div>;
  if (!q) return <div style={{ padding: 40, textAlign: "center", color: "#fff" }}>Az ajánlat nem található.</div>;

  /* ---- Reszponzív stílusok ---- */
  const navBtn = { padding: "10px 15px", borderRadius: "8px", border: "1px solid #444", background: "#333", color: "#fff", cursor: "pointer", fontWeight: "bold" as const };
  const inputS = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" as const, color: "#333", fontSize: "15px" };
  const labS = { fontSize: "11px", fontWeight: "bold", color: "#7f8c8d", textTransform: "uppercase" as const, marginBottom: "5px", display: "block" };
  
  const resultBar = { 
    background: "#2c3e50", 
    color: "#fff", 
    padding: "15px", 
    borderRadius: "10px", 
    display: "flex", 
    flexWrap: "wrap" as const, 
    gap: "10px", 
    justifyContent: "space-between", 
    marginTop: 10 
  };
  
  const btnBase = { color: "#fff", padding: "15px", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" as const, width: "100%" };

  const responsiveGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "15px",
    width: "100%"
  };

  return (
    <div style={{ padding: "20px 12px", maxWidth: 1000, margin: "0 auto", color: "#fff", boxSizing: "border-box" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => router.push(`/quotes`)} style={navBtn}>⬅️ Lista</button>
        <button onClick={() => router.push("/")} style={navBtn}>🏠 Főoldal</button>
      </div>

      <div style={{ marginBottom: 30 }}>
        <h1 onClick={() => setIsEditingTitle(true)} style={{ cursor: "pointer", fontSize: "1.8rem", wordBreak: "break-word" }}>
          {isEditingTitle ? (
            <input value={tempTitle} onChange={e => setTempTitle(e.target.value)} onBlur={saveTitle} autoFocus style={inputS} />
          ) : (
            <>{q.title} ✏️</>
          )}
        </h1>
      </div>

      <div style={{ background: "#fff", padding: "20px 16px", borderRadius: 15, marginBottom: 40, color: "#333", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 15 }}>
          <div style={{ background: "#f0f7ff", padding: 12, borderRadius: 10 }}>
            <label style={labS}>Gyors betöltés adatbázisból</label>
            <select onChange={handleSelectFromDB} style={inputS}>
              <option value="">-- Válassz --</option>
              {dbItems.map(item => (
                <option key={item.id} value={item.id}>{item.name} ({item.price} Ft)</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labS}>Megnevezés</label>
            <input placeholder="Megnevezés" value={desc} onChange={e => setDesc(e.target.value)} style={inputS} required />
          </div>
          
          <div style={responsiveGrid}>
            <div>
              <label style={labS}>Mennyiség</label>
              <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} style={inputS} />
            </div>
            <div>
              <label style={labS}>Nettó Beszerzés</label>
              <input type="number" value={basePriceNet} onChange={e => setBasePriceNet(Number(e.target.value))} style={inputS} />
            </div>
            <div>
              <label style={labS}>Haszon ({profitType === 'percent' ? '%' : 'Ft'})</label>
              <div style={{ display: "flex", gap: 5 }}>
                <input type="number" value={profitValue} onChange={e => setProfitValue(Number(e.target.value))} style={inputS} />
                <select value={profitType} onChange={e => setProfitType(e.target.value as any)} style={{ ...inputS, width: 75, padding: "12px 6px" }}>
                  <option value="fix">Ft</option>
                  <option value="percent">%</option>
                </select>
              </div>
            </div>
          </div>

          <div style={resultBar}>
            <div>Bruttó egységár: <strong>{Math.round(sellPriceGross).toLocaleString()} Ft</strong></div>
            <div>Összesen: <strong>{Math.round(lineTotalGross).toLocaleString()} Ft</strong></div>
          </div>

          <button type="submit" style={{ ...btnBase, background: editingId ? "#e67e22" : "#27ae60", marginTop: 10 }}>
            {editingId ? "MENTÉS" : "TÉTEL HOZZÁADÁSA"}
          </button>
          {editingId && <button type="button" onClick={resetForm} style={{ ...btnBase, background: "#7f8c8d", marginTop: -5 }}>MÉGSEM</button>}
        </form>
      </div>

      <div style={{ background: "#1a1a1a", borderRadius: 10, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
          <thead>
            <tr style={{ background: "#333", textAlign: "left" }}>
              <th style={{ padding: 12, width: 50 }}></th>
              <th style={{ padding: 12 }}>Megnevezés</th>
              <th style={{ padding: 12 }}>Menny.</th>
              <th style={{ padding: 12, textAlign: "right" }}>Bruttó</th>
              <th style={{ padding: 12, textAlign: "right" }}>Művelet</th>
            </tr>
          </thead>
          <tbody>
            {q.items.map((it: any, index: number) => (
              <tr key={it.id} style={{ borderBottom: "1px solid #333" }}>
                <td style={{ padding: "8px 12px", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <button onClick={() => moveItem(index, 'up')} disabled={index === 0} style={{ background: index === 0 ? "#222" : "#444", border: "none", color: "#fff", cursor: "pointer", borderRadius: 4, padding: "4px 6px", fontSize: 10 }}>▲</button>
                    <button onClick={() => moveItem(index, 'down')} disabled={index === q.items.length - 1} style={{ background: index === q.items.length - 1 ? "#222" : "#444", border: "none", color: "#fff", cursor: "pointer", borderRadius: 4, padding: "4px 6px", fontSize: 10 }}>▼</button>
                  </div>
                </td>
                <td style={{ padding: 12, wordBreak: "break-word" }}>{it.description}</td>
                <td style={{ padding: 12, whiteSpace: "nowrap" }}>{it.quantity} {it.unit}</td>
                <td style={{ padding: 12, textAlign: "right", whiteSpace: "nowrap" }}>{Number(it.lineGross).toLocaleString()} Ft</td>
                <td style={{ padding: 12, textAlign: "right", whiteSpace: "nowrap" }}>
                  <button onClick={() => startEdit(it)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, marginRight: 8 }}>✏️</button>
                  <button onClick={() => { if(confirm("Törlöd?")) fetch(`/api/quotes/${quoteId}/items?id=${it.id}`, {method: "DELETE"}).then(loadQuote) }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18 }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 40, textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <div style={{ fontSize: "1.4rem", fontWeight: "bold" }}>Bruttó összesen: {totalGross.toLocaleString()} Ft</div>
        <button 
          onClick={() => window.open(`/quotes/${quoteId}/print`, '_blank')} 
          style={{ marginTop: 20, padding: "15px 30px", borderRadius: 10, cursor: "pointer", background: "#e5e5ea", color: "#000", border: "none", fontWeight: "bold", width: "100%", maxWidth: "300px" }}
        >
          📄 PDF GENERÁLÁSA
        </button>
      </div>
    </div>
  );
}
