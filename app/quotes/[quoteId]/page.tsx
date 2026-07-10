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
  const [unit, setUnit] = useState("db"); // Ez kezeli a db / m állapotot
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
      // Ha az adatbázisban el van mentve egység (pl. m), töltse be, amúgy legyen db
      setUnit(selected.unit || "db"); 
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
        unit, // Ez küldi be a 'db' vagy 'm' értéket az API-nak
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
    setUnit(it.unit || "db"); // Szerkesztésnél beolvassa a mentett egységet
    
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

  /* ---- Javított Sötét Reszponzív Stílusok ---- */
  const navBtn = { padding: "10px 15px", borderRadius: "8px", border: "1px solid #334155", background: "#1e293b", color: "#fff", cursor: "pointer", fontWeight: "bold" as const };
  const inputS = { width: "100%", padding: "13px", borderRadius: "10px", border: "1px solid #334155", boxSizing: "border-box" as const, color: "#fff", backgroundColor: "#0f172a", fontSize: "16px", outline: "none" };
  const labS = { fontSize: "11px", fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase" as const, marginBottom: "6px", display: "block", letterSpacing: "0.5px" };
  
  const resultBar = { 
    background: "#0f172a", 
    color: "#fff", 
    padding: "16px", 
    borderRadius: "10px", 
    display: "flex", 
    flexWrap: "wrap" as const, 
    gap: "10px", 
    justifyContent: "space-between", 
    marginTop: 5,
    border: "1px solid #334155"
  };
  
  const btnBase = { color: "#fff", padding: "15px", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold" as const, width: "100%", fontSize: "16px" };

  const responsiveGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "14px",
    width: "100%"
  };

  const arrowBtn = (disabled: boolean) => ({
    background: disabled ? "#1e293b" : "#334155", 
    border: "1px solid #475569", 
    color: disabled ? "#475569" : "#fff", 
    cursor: disabled ? "default" : "pointer", 
    borderRadius: 6, 
    padding: "8px 12px", 
    fontSize: 13,
    fontWeight: "bold"
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#121826", padding: "20px 12px", maxWidth: 1000, margin: "0 auto", color: "#fff", boxSizing: "border-box", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => router.push(`/quotes`)} style={navBtn}>⬅️ Lista</button>
        <button onClick={() => router.push("/")} style={navBtn}>🏠 Főoldal</button>
      </div>

      <div style={{ marginBottom: 25, borderBottom: "1px solid #334155", paddingBottom: "15px" }}>
        <h1 onClick={() => setIsEditingTitle(true)} style={{ cursor: "pointer", fontSize: "1.6rem", fontWeight: "800", wordBreak: "break-word", margin: 0 }}>
          {isEditingTitle ? (
            <input value={tempTitle} onChange={e => setTempTitle(e.target.value)} onBlur={saveTitle} autoFocus style={inputS} />
          ) : (
            <>{q.title} ✏️</>
          )}
        </h1>
      </div>

      {/* Modernizált Sötét Űrlap Maszk */}
      <div style={{ background: "#1e293b", padding: "20px 16px", borderRadius: 16, marginBottom: 30, border: "1px solid #334155", boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 15 }}>
          <div style={{ background: "#141b2b", padding: 14, borderRadius: 10, border: "1px solid #2d3748" }}>
            <label style={{ ...labS, color: "#2ecc71" }}>Gyors betöltés adatbázisból</label>
            <select onChange={handleSelectFromDB} style={{ ...inputS, borderColor: "#2ecc71" }}>
              <option value="">-- Válassz --</option>
              {dbItems.map(item => (
                <option key={item.id} value={item.id}>{item.name} ({item.price} Ft)</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labS}>Megnevezés</label>
            <input placeholder="Tétel megnevezése" value={desc} onChange={e => setDesc(e.target.value)} style={inputS} required />
          </div>
          
          <div style={responsiveGrid}>
            {/* Mennyiség és Egység egy mezőcsoportban a szebb elrendezésért */}
            <div>
              <label style={labS}>Mennyiség és Egység</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} style={inputS} />
                {/* ÚJ: Mértékegység választó */}
                <select value={unit} onChange={e => setUnit(e.target.value)} style={{ ...inputS, width: 90, padding: "13px 8px" }}>
                  <option value="db">db</option>
                  <option value="m">méter (m)</option>
                </select>
              </div>
            </div>
            <div>
              <label style={labS}>Nettó Beszerzés (Ft)</label>
              <input type="number" value={basePriceNet} onChange={e => setBasePriceNet(Number(e.target.value))} style={inputS} />
            </div>
            <div>
              <label style={labS}>Haszon ({profitType === 'percent' ? '%' : 'Ft'})</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="number" value={profitValue} onChange={e => setProfitValue(Number(e.target.value))} style={inputS} />
                <select value={profitType} onChange={e => setProfitType(e.target.value as any)} style={{ ...inputS, width: 80, padding: "13px 6px" }}>
                  <option value="fix">Ft</option>
                  <option value="percent">%</option>
                </select>
              </div>
            </div>
          </div>

          <div style={resultBar}>
            <div>Bruttó egységár: <strong style={{ color: "#2ecc71" }}>{Math.round(sellPriceGross).toLocaleString()} Ft</strong></div>
            <div>Összesen: <strong style={{ color: "#2ecc71" }}>{Math.round(lineTotalGross).toLocaleString()} Ft</strong></div>
          </div>

          <button type="submit" style={{ ...btnBase, background: editingId ? "#e67e22" : "#2ecc71", marginTop: 10 }}>
            {editingId ? "MENTÉS" : "TÉTEL HOZZÁADÁSA"}
          </button>
          {editingId && <button type="button" onClick={resetForm} style={{ ...btnBase, background: "#475569", marginTop: -5 }}>MÉGSEM</button>}
        </form>
      </div>

      {/* TÉTEL LISTÁZÁS */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {q.items.map((it: any, index: number) => (
          <div 
            key={it.id} 
            style={{ 
              background: "#1e293b", 
              borderRadius: 14, 
              padding: 16, 
              border: "1px solid #334155",
              display: "flex",
              flexDirection: "column",
              gap: 12
            }}
          >
            {/* Felső sor: Sorrend nyilak és Megnevezés */}
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "row", gap: 6 }}>
                <button onClick={() => moveItem(index, 'up')} disabled={index === 0} style={arrowBtn(index === 0)}>▲</button>
                <button onClick={() => moveItem(index, 'down')} disabled={index === q.items.length - 1} style={arrowBtn(index === q.items.length - 1)}>▼</button>
              </div>
              <div style={{ fontWeight: "bold", fontSize: 15, flex: 1, wordBreak: "break-word" }}>
                {it.description}
              </div>
            </div>

            {/* Alsó sor: Adatok és Műveleti gombok */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              borderTop: "1px solid #334155", 
              paddingTop: 12,
              flexWrap: "wrap",
              gap: 10
            }}>
              <div style={{ display: "flex", gap: 20, fontSize: 14, color: "#94a3b8" }}>
                {/* Itt írja ki dinamikusan a darabot vagy a métert */}
                <div>Mennyiség: <span style={{ color: "#fff", fontWeight: "bold" }}>{it.quantity} {it.unit || "db"}</span></div>
                <div>Bruttó ár: <span style={{ color: "#2ecc71", fontWeight: "bold" }}>{Number(it.lineGross).toLocaleString()} Ft</span></div>
              </div>
              
              <div style={{ display: "flex", gap: 18 }}>
                <button onClick={() => startEdit(it)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }} title="Szerkesztés">✏️</button>
                <button onClick={() => { if(confirm("Biztosan törlöd ezt a tételt?")) fetch(`/api/quotes/${quoteId}/items?id=${it.id}`, {method: "DELETE"}).then(loadQuote) }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }} title="Törlés">🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alsó összesítő rész */}
      <div style={{ marginTop: 35, textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", borderTop: "1px solid #334155", paddingTop: "20px" }}>
        <div style={{ fontSize: "1.4rem", fontWeight: "900" }}>Bruttó összesen: <span style={{ color: "#2ecc71" }}>{totalGross.toLocaleString()} Ft</span></div>
        <button 
          onClick={() => window.open(`/quotes/${quoteId}/print`, '_blank')} 
          style={{ marginTop: 20, padding: "16px 30px", borderRadius: 12, cursor: "pointer", background: "#f1f5f9", color: "#0f172a", border: "none", fontWeight: "bold", width: "100%", maxWidth: "300px", fontSize: "15px" }}
        >
          📄 PDF GENERÁLÁSA
        </button>
      </div>
    </div>
  );
}
