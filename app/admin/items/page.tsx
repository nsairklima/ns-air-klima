"use client";

import React, { useEffect, useState } from "react";

export default function AdminItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [formData, setFormData] = useState({ name: "", price: "", sku: "", stock: "0" });
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Ez fogja eldönteni, hogy mobil-e a nézet
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Csak az ügyféloldalon (böngészőben) fut le
    const checkSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkSize();
    window.addEventListener("resize", checkSize);
    
    const loadItems = async () => {
      const res = await fetch("/api/items");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    };
    loadItems();

    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/items", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, id: editingId, price: parseFloat(formData.price), stock: parseInt(formData.stock) }),
    });
    if (res.ok) {
      setFormData({ name: "", price: "", sku: "", stock: "0" });
      setEditingId(null);
      // Újratöltés
      const r = await fetch("/api/items");
      const d = await r.json();
      setItems(d);
    }
  };

  return (
    <div style={{ padding: isMobile ? "10px" : "40px", maxWidth: "1100px", margin: "0 auto", fontFamily: "sans-serif" }}>
      
      <button onClick={() => window.location.href = "/"} style={{ padding: "10px", marginBottom: "20px" }}>← Főoldal</button>
      
      <h1 style={{ fontSize: isMobile ? "20px" : "28px" }}>📦 Raktárkezelő (JS Mód)</h1>

      {/* FORM */}
      <div style={{ background: "#f4f4f4", padding: "20px", borderRadius: "10px", marginBottom: "20px" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input style={inputS} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Termék neve" required />
          <input style={inputS} type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="Ár" />
          <button type="submit" style={{ padding: "12px", background: "#0070f3", color: "white", border: "none", borderRadius: "5px" }}>Mentés</button>
        </form>
      </div>

      {/* DÖNTÉS: Vagy táblázat, vagy csempék */}
      {isMobile ? (
        // --- MOBIL CSEMPÉK ---
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {items.map(item => (
            <div key={item.id} style={{ background: "white", padding: "20px", borderRadius: "15px", border: "2px solid #0070f3", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
              <div style={{ fontWeight: "bold", fontSize: "18px" }}>{item.name}</div>
              <div style={{ fontSize: "22px", color: "#0070f3", margin: "10px 0" }}>{item.price?.toLocaleString()} Ft</div>
              <div style={{ fontWeight: "bold" }}>Készlet: {item.stock} db</div>
              <button onClick={() => { setEditingId(item.id); setFormData({...item, price: item.price.toString(), stock: item.stock.toString()}); window.scrollTo(0,0); }} style={{ width: "100%", marginTop: "10px", padding: "10px" }}>Szerkesztés</button>
            </div>
          ))}
        </div>
      ) : (
        // --- ASZTALI TÁBLÁZAT ---
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#eee" }}>
              <th style={tdS}>Név</th>
              <th style={tdS}>Ár</th>
              <th style={tdS}>Művelet</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={tdS}>{item.name}</td>
                <td style={tdS}>{item.price} Ft</td>
                <td style={tdS}><button onClick={() => { setEditingId(item.id); setFormData({...item, price: item.price.toString(), stock: item.stock.toString()}); }}>✏️</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const inputS = { padding: "12px", borderRadius: "5px", border: "1px solid #ccc" };
const tdS = { padding: "12px", textAlign: "left" as const };
