"use client";

import React, { useEffect, useState } from "react";

export default function AdminItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    sku: "",
    serialNumber: "",
    stock: "0",
    supplier: ""
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

    const method = editingId ? "PATCH" : "POST";
    
    // PONTOS ADATFORMÁZÁS A PRISMA SZÁMÁRA
    const payload = {
      id: editingId,
      name: formData.name,
      price: parseFloat(formData.price) || 0,
      sku: formData.sku || null,
      serialNumber: formData.serialNumber || null,
      stock: parseInt(formData.stock) || 0,
      supplier: formData.supplier || null,
    };

    try {
      const res = await fetch("/api/items", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok) {
        alert("Sikeres mentés!");
        setFormData({ name: "", price: "", sku: "", serialNumber: "", stock: "0", supplier: "" });
        setEditingId(null);
        loadItems();
      } else {
        // KIÍRJUK A PONTOS HIBÁT, AMIT A SZERVER KÜLD
        alert("Hiba: " + (result.details || result.error || "Ismeretlen hiba"));
      }
    } catch (err) {
      alert("Hálózati hiba történt!");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      name: item.name || "",
      price: item.price?.toString() || "0",
      sku: item.sku || "",
      serialNumber: item.serialNumber || "",
      stock: item.stock?.toString() || "0",
      supplier: item.supplier || ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2>📦 Raktárkészlet Szerkesztő</h2>
      
      <form onSubmit={handleSubmit} style={{ background: "#f4f4f4", padding: 20, borderRadius: 8, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input placeholder="Név" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={inputS} />
          <input placeholder="Ár" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required style={inputS} />
          <input placeholder="Cikkszám (SKU)" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} style={inputS} />
          <input placeholder="Készlet" type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} style={inputS} />
          <input placeholder="Nagyker" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} style={{...inputS, gridColumn: "span 2"}} />
        </div>
        <button type="submit" disabled={loading} style={{ marginTop: 10, padding: 10, width: "100%", cursor: "pointer", background: editingId ? "orange" : "green", color: "white", border: "none" }}>
          {loading ? "Folyamatban..." : (editingId ? "Módosítás Mentése" : "Új Tétel Hozzáadása")}
        </button>
      </form>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ccc" }}>
            <th style={tdS}>Név</th>
            <th style={tdS}>Ár</th>
            <th style={tdS}>Készlet</th>
            <th style={tdS}>Művelet</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={tdS}>{item.name}</td>
              <td style={tdS}>{item.price} Ft</td>
              <td style={tdS}>{item.stock} db</td>
              <td style={tdS}>
                <button onClick={() => startEdit(item)}>✏️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const inputS = { padding: 8, borderRadius: 4, border: "1px solid #ccc" };
const tdS = { padding: 10, textAlign: "left" as const };
