"use client";

import React, { useEffect, useState } from "react";

export default function AdminItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Képernyőszélesség figyelése
  const [isMobile, setIsMobile] = useState(false);

  const [formData, setFormData] = useState({
    name: "", price: "", sku: "", serialNumber: "", stock: "0", supplier: ""
  });

  useEffect(() => {
    // Figyeljük a kijelzőt
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); // Alapértelmezett beállítás
    window.addEventListener("resize", handleResize);
    loadItems();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadItems = async () => {
    const res = await fetch("/api/items");
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      id: editingId,
      name: formData.name,
      price: parseFloat(formData.price) || 0,
      sku: formData.sku || null,
      stock: parseInt(formData.stock) || 0,
      supplier: formData.supplier || null,
    };

    const res = await fetch("/api/items", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setFormData({ name: "", price: "", sku: "", serialNumber: "", stock: "0", supplier: "" });
      setEditingId(null);
      loadItems();
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: isMobile ? "15px" : "40px", maxWidth: "1100px", margin: "0 auto", fontFamily: "sans-serif" }}>
      
      {/* Vissza gomb */}
      <button onClick={() => window.location.href = "/"} style={backBtnS}>← Főoldal</button>

      <h1 style={{ fontSize: isMobile ? "20px" : "28px", margin: "20px 0" }}>📦 Raktárkészlet</h1>

      {/* Rögzítő Form */}
      <div style={formCardS}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr", gap: "10px" }}>
            <input style={inputS} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Termék neve" required />
            <input style={inputS} type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="Ár" required />
            <input style={inputS} value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="Cikkszám" />
            <input style={inputS} type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} placeholder="Készlet" />
            <button type="submit" style={btnS}>{editingId ? "Mentés" : "Hozzáadás"}</button>
          </div>
        </form>
      </div>

      {/* LISTA NÉZETEK */}
      {!isMobile ? (
        /* ASZTALI TÁBLÁZAT */
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f4f4f4", textAlign: "left" }}>
              <th style={thS}>Termék</th>
              <th style={thS}>Készlet</th>
              <th style={thS}>Ár</th>
              <th style={thS}>Művelet</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={tdS}><strong>{item.name}</strong><br/><small>{item.sku}</small></td>
                <td style={tdS}>{item.stock} db</td>
                <td style={tdS}>{item.price.toLocaleString()} Ft</td>
                <td style={tdS}>
                  <button onClick={() => { setEditingId(item.id); setFormData({...item, price: item.price.toString(), stock: item.stock.toString()}) }}>✏️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        /* MOBIL CSEMPÉK */
        <div style={{ display: "grid", gap: "15px" }}>
          {items.map(item => (
            <div key={item.id} style={cardS}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <small style={{color: "#888"}}>{item.sku || "Nincs SKU"}</small>
                <b style={{color: item.stock > 0 ? "green" : "red"}}>{item.stock} db</b>
              </div>
              <div style={{ fontSize: "16px", fontWeight: "bold", margin: "10px 0" }}>{item.name}</div>
              <div style={{ fontSize: "18px", color: "#0070f3", fontWeight: "800" }}>{item.price.toLocaleString()} Ft</div>
              <button 
                onClick={() => { setEditingId(item.id); setFormData({...item, price: item.price.toString(), stock: item.stock.toString()}); window.scrollTo(0,0); }}
                style={mobileEditBtn}
              >
                Szerkesztés ✏️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// STÍLUSOK
const backBtnS = { padding: "8px 15px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer" };
const formCardS = { background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #eee", marginBottom: "30px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" };
const inputS = { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px" };
const btnS = { padding: "12px", background: "#0070f3", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold" as const, cursor: "pointer" };
const cardS = { background: "white", padding: "15px", borderRadius: "15px", border: "1px solid #eee", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" };
const mobileEditBtn = { width: "100%", marginTop: "10px", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", background: "#f9f9f9", fontWeight: "bold" as const };
const thS = { padding: "12px" };
const tdS = { padding: "12px" };
