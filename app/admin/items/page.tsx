"use client";

import React, { useEffect, useState } from "react";

export default function AdminItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [formData, setFormData] = useState({ name: "", price: "", sku: "", stock: "0" });
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadItems = async () => {
    const res = await fetch("/api/items");
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
  };

  useEffect(() => { loadItems(); }, []);

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
      loadItems();
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1100px", margin: "0 auto", fontFamily: "sans-serif" }}>
      
      {/* CSS, AMI KÉNYSZERÍTI A NÉZETVÁLTÁST */}
      <style dangerouslySetInnerHTML={{ __html: `
        .desktop-view { display: table !important; width: 100%; border-collapse: collapse; margin-top: 20px; }
        .mobile-view { display: none !important; }

        @media (max-width: 768px) {
          .desktop-view { display: none !important; }
          .mobile-view { display: block !important; margin-top: 20px; }
        }
      `}} />

      <button onClick={() => window.location.href = "/"} style={{ padding: "10px", marginBottom: "20px", cursor: "pointer" }}>← Főoldal</button>
      
      <h1 style={{ fontSize: "24px" }}>📦 Raktárkészlet Kezelő</h1>

      {/* FORM - Mindenhol ugyanaz */}
      <div style={{ background: "#f4f4f4", padding: "20px", borderRadius: "10px", marginBottom: "20px" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input style={inputS} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Termék neve" required />
          <div style={{ display: "flex", gap: "10px" }}>
            <input style={inputS} type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="Ár" />
            <input style={inputS} value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="SKU" />
          </div>
          <button type="submit" style={{ padding: "12px", background: "#0070f3", color: "white", border: "none", borderRadius: "5px", fontWeight: "bold" }}>
            {editingId ? "Mentés" : "Hozzáadás"}
          </button>
        </form>
      </div>

      {/* ASZTALI TÁBLÁZAT - Mobilon eltűnik */}
      <table className="desktop-view">
        <thead>
          <tr style={{ background: "#eee", textAlign: "left" }}>
            <th style={tdS}>Termék</th>
            <th style={tdS}>Készlet</th>
            <th style={tdS}>Ár</th>
            <th style={tdS}>Művelet</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={tdS}><b>{item.name}</b></td>
              <td style={tdS}>{item.stock} db</td>
              <td style={tdS}>{item.price.toLocaleString()} Ft</td>
              <td style={tdS}><button onClick={() => { setEditingId(item.id); setFormData({...item, price: item.price.toString(), stock: item.stock.toString()}); }}>✏️</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MOBIL CSEMPÉK - Csak mobilon jelenik meg */}
      <div className="mobile-view">
        {items.map(item => (
          <div key={item.id} style={{ background: "white", padding: "15px", borderRadius: "12px", border: "1px solid #ddd", marginBottom: "15px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}>
            <div style={{ fontWeight: "bold", fontSize: "18px", marginBottom: "5px" }}>{item.name}</div>
            <div style={{ color: "#666", fontSize: "14px" }}>Cikkszám: {item.sku || "-"}</div>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#0070f3", margin: "10px 0" }}>{item.price.toLocaleString()} Ft</div>
            <div style={{ fontWeight: "bold", color: item.stock > 0 ? "green" : "red" }}>Készlet: {item.stock} db</div>
            <button 
              onClick={() => { setEditingId(item.id); setFormData({...item, price: item.price.toString(), stock: item.stock.toString()}); window.scrollTo(0,0); }}
              style={{ width: "100%", marginTop: "10px", padding: "10px", background: "#f0f0f0", border: "1px solid #ccc", borderRadius: "5px" }}
            >
              Szerkesztés ✏️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputS = { padding: "12px", borderRadius: "5px", border: "1px solid #ccc", width: "100%" };
const tdS = { padding: "12px" };
