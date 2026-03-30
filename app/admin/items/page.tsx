"use client";

import React, { useEffect, useState } from "react";

export default function AdminItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "", price: "", sku: "", stock: "0", supplier: ""
  });

  const loadItems = async () => {
    try {
      const res = await fetch("/api/items");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Hiba:", err);
    }
  };

  useEffect(() => { loadItems(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/items", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        ...formData, 
        id: editingId, 
        price: parseFloat(formData.price) || 0, 
        stock: parseInt(formData.stock) || 0 
      }),
    });

    if (res.ok) {
      setFormData({ name: "", price: "", sku: "", stock: "0", supplier: "" });
      setEditingId(null);
      loadItems();
    }
    setLoading(false);
  };

  const deleteItem = async (id: number) => {
    if (!confirm("Biztosan törlöd?")) return;
    await fetch(`/api/items?id=${id}`, { method: "DELETE" });
    loadItems();
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif", backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      
      {/* FEJLÉC ÉS NAVIGÁCIÓ */}
      <div style={{ marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => window.location.href = "/"} style={backBtnS}>← Főoldal</button>
        <h1 style={{ margin: 0, fontSize: "22px" }}>📦 Raktárkészlet Kezelő</h1>
      </div>

      {/* RÖGZÍTŐ KÁRTYA */}
      <div style={formCardS}>
        <h3 style={{ marginTop: 0 }}>{editingId ? "✏️ Szerkesztés" : "➕ Új tétel"}</h3>
        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
          <input style={inputS} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Termék neve" required />
          <input style={inputS} type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="Nettó ár (Ft)" required />
          <input style={inputS} value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="Cikkszám" />
          <input style={inputS} type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} placeholder="Készlet" />
          <button type="submit" disabled={loading} style={saveBtnS}>
            {loading ? "..." : (editingId ? "Mentés" : "Hozzáadás")}
          </button>
          {editingId && <button type="button" onClick={() => {setEditingId(null); setFormData({name:"", price:"", sku:"", stock:"0", supplier:""})}} style={cancelBtnS}>Mégse</button>}
        </form>
      </div>

      {/* CSEMPE LISTA (Mindenhol ez látszik) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
        {items.map(item => (
          <div key={item.id} style={tileS}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "12px", color: "#888", fontWeight: "bold" }}>{item.sku || "NINCS SKU"}</span>
              <span style={{ 
                background: item.stock > 0 ? "#e6fffa" : "#fff5f5", 
                color: item.stock > 0 ? "#2c7a7b" : "#c53030",
                padding: "2px 8px", borderRadius: "10px", fontSize: "12px", fontWeight: "bold"
              }}>
                {item.stock} db készleten
              </span>
            </div>
            <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px", minHeight: "44px" }}>{item.name}</div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#0070f3", marginBottom: "15px" }}>
              {item.price?.toLocaleString()} Ft
            </div>
            <div style={{ display: "flex", gap: "10px", borderTop: "1px solid #eee", paddingTop: "15px" }}>
              <button onClick={() => {
                setEditingId(item.id);
                setFormData({name: item.name, price: item.price.toString(), sku: item.sku || "", stock: item.stock.toString(), supplier: item.supplier || ""});
                window.scrollTo({top: 0, behavior: "smooth"});
              }} style={editBtnS}>Szerkesztés ✏️</button>
              <button onClick={() => deleteItem(item.id)} style={delBtnS}>Törlés 🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// STÍLUSOK
const inputS = { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px" };
const formCardS = { background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", marginBottom: "30px" };
const tileS = { background: "#fff", padding: "20px", borderRadius: "15px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #efefef", display: "flex", flexDirection: "column" as const };
const backBtnS = { padding: "8px 16px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontWeight: "600" as const };
const saveBtnS = { background: "#0070f3", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" as const };
const cancelBtnS = { background: "#666", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" };
const editBtnS = { flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ddd", background: "#f9f9f9", cursor: "pointer", fontWeight: "bold" as const };
const delBtnS = { padding: "10px", borderRadius: "8px", border: "1px solid #feb2b2", background: "#fff5f5", color: "#c53030", cursor: "pointer" };
