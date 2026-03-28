"use client";

import React, { useEffect, useState } from "react";

export default function AdminItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "", price: "", sku: "", serialNumber: "", stock: "0", supplier: ""
  });

  const loadItems = async () => {
    const res = await fetch("/api/items");
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
  };

  useEffect(() => { loadItems(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/items", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, id: editingId, price: parseFloat(formData.price), stock: parseInt(formData.stock) }),
    });
    if (res.ok) {
      setFormData({ name: "", price: "", sku: "", serialNumber: "", stock: "0", supplier: "" });
      setEditingId(null);
      loadItems();
    }
    setLoading(false);
  };

  return (
    <div className="admin-container" style={{ padding: "20px", maxWidth: "1100px", margin: "0 auto", fontFamily: "sans-serif" }}>
      
      {/* EZ A RÉSZ KÉNYSZERÍTI KI A MOBIL NÉZETET */}
      <style dangerouslySetInnerHTML={{ __html: `
        .mobile-only { display: none !important; }
        .desktop-only { display: table !important; width: 100%; border-collapse: collapse; }

        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: grid !important; grid-template-columns: 1fr; gap: 15px; }
          .admin-container { padding: 10px !important; }
        }
      `}} />

      <button onClick={() => window.location.href = "/"} style={{ padding: "8px 15px", marginBottom: "20px", cursor: "pointer" }}>← Főoldal</button>

      <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>📦 Raktárkészlet</h1>

      {/* Rögzítő Form - Reszponzív rácsban */}
      <div style={{ background: "#f9f9f9", padding: "20px", borderRadius: "10px", marginBottom: "30px", border: "1px solid #ddd" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input style={inputS} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Termék neve" required />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <input style={inputS} type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="Ár" />
            <input style={inputS} value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="Cikkszám" />
          </div>
          <button type="submit" style={{ padding: "12px", background: "#0070f3", color: "white", border: "none", borderRadius: "5px", fontWeight: "bold" }}>
            {editingId ? "Módosítás mentése" : "Új tétel rögzítése"}
          </button>
        </form>
      </div>

      {/* ASZTALI TÁBLÁZAT */}
      <table className="desktop-only">
        <thead>
          <tr style={{ background: "#eee", textAlign: "left" }}>
            <th style={tdS}>Név</th>
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

      {/* MOBIL CSEMPÉK */}
      <div className="mobile-only">
        {items.map(item => (
          <div key={item.id} style={{ background: "white", padding: "15px", borderRadius: "10px", border: "1px solid #ddd", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}>
            <div style={{ fontWeight: "bold", fontSize: "16px" }}>{item.name}</div>
            <div style={{ color: "#0070f3", margin: "5px 0" }}>{item.price.toLocaleString()} Ft</div>
            <div style={{ fontSize: "13px", color: "#666" }}>Készlet: {item.stock} db</div>
            <button 
              onClick={() => { setEditingId(item.id); setFormData({...item, price: item.price.toString(), stock: item.stock.toString()}); window.scrollTo(0,0); }}
              style={{ width: "100%", marginTop: "10px", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
            >
              Szerkesztés ✏️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputS = { padding: "10px", borderRadius: "5px", border: "1px solid #ccc" };
const tdS = { padding: "12px" };
