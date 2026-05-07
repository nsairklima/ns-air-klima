"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const router = useRouter();

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
    setItems(data);
  };

  useEffect(() => { loadItems(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const method = editingId ? "PATCH" : "POST";
    const body = { 
        ...formData, 
        id: editingId, 
        price: Number(formData.price), 
        stock: Number(formData.stock) 
    };

    const res = await fetch("/api/items", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setFormData({ name: "", price: "", sku: "", serialNumber: "", stock: "0", supplier: "" });
      setEditingId(null);
      loadItems();
    }
    setLoading(false);
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      sku: item.sku || "",
      serialNumber: item.serialNumber || "",
      stock: item.stock?.toString() || "0",
      supplier: item.supplier || ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      
      {/* VISSZA GOMB */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <button 
          onClick={() => router.push("/")} 
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "1px solid #444",
            background: "#333",
            color: "#fff",
            cursor: "pointer",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          🏠 Főoldal
        </button>
      </div>

      <h1 style={{ marginBottom: "25px", color: "#fff" }}>📦 Raktárkészlet és Nyilvántartás</h1>

      {/* FORM KÁRTYA */}
      <form onSubmit={handleSubmit} style={formCard(!!editingId)}>
        <h3 style={{marginTop: 0, color: editingId ? "#333" : "#333"}}>{editingId ? "✏️ Tétel szerkesztése" : "➕ Új tétel rögzítése"}</h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
          <div style={{ gridColumn: "span 2" }}>
            <label style={labelS}>Termék megnevezése *</label>
            <input style={inputS} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div>
            <label style={labelS}>Nettó eladási ár (Ft) *</label>
            <input style={inputS} type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
          </div>
          <div>
            <label style={labelS}>Cikkszám (SKU)</label>
            <input style={inputS} value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
          </div>
          <div>
            <label style={labelS}>Gyári szám (S/N)</label>
            <input style={inputS} value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} />
          </div>
          <div>
            <label style={labelS}>Készlet (db)</label>
            <input style={inputS} type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label style={labelS}>Beszerzési forrás (Nagyker)</label>
            <input style={inputS} placeholder="pl. Sinclair, Gree Hungary..." value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>
            <button type="submit" disabled={loading} style={{ ...btnS, background: editingId ? "#e67e22" : "#2ecc71", flex: 1 }}>
              {editingId ? "Mentés" : "Rögzítés"}
            </button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({ name: "", price: "", sku: "", serialNumber: "", stock: "0", supplier: "" }); }} style={{...btnS, background: "#95a5a6"}}>Mégse</button>}
          </div>
        </div>
      </form>

      {/* TÁBLÁZAT */}
      <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #444", background: "#1a1a1a" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ textAlign: "left", background: "#333", borderBottom: "2px solid #444" }}>
              <th style={thS}>Megnevezés / Cikkszám</th>
              <th style={thS}>Készlet</th>
              <th style={thS}>Nagyker</th>
              <th style={thS}>Nettó ár</th>
              <th style={{ ...thS, textAlign: "right", paddingRight: "20px" }}>Műveletek</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: "1px solid #333" }}>
                <td style={tdS}>
                  <strong style={{ color: "#fff" }}>{item.name}</strong><br/>
                  <span style={{fontSize: "11px", color: "#aaa"}}>{item.sku || "Nincs cikkszám"}</span>
                </td>
                <td style={tdS}>
                  <span style={{ color: item.stock > 0 ? "#2ecc71" : "#e74c3c", fontWeight: "bold" }}>
                      {item.stock} db
                  </span>
                </td>
                <td style={{ ...tdS, color: "#ccc" }}>{item.supplier || "-"}</td>
                <td style={{ ...tdS, color: "#fff", fontWeight: "bold" }}>{item.price.toLocaleString()} Ft</td>
                <td style={{ ...tdS, textAlign: "right", whiteSpace: "nowrap", paddingRight: "20px" }}>
                  <button onClick={() => startEdit(item)} style={iconBtn}>✏️</button>
                  <button onClick={async () => { if(confirm("Valóban törlöd?")) { await fetch(`/api/items?id=${item.id}`, {method: "DELETE"}); loadItems(); } }} style={{ ...iconBtn, color: "#e74c3c" }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// STÍLUSOK
const formCard = (isEdit: boolean) => ({ 
  background: isEdit ? "#fff8f0" : "#fff", 
  padding: "25px", 
  borderRadius: "12px", 
  marginBottom: "30px", 
  border: isEdit ? "2px solid #e67e22" : "1px solid #eee", 
  boxShadow: "0 4px 6px rgba(0,0,0,0.2)" 
});

const inputS = { 
  width: "100%", 
  padding: "10px", 
  borderRadius: "6px", 
  border: "1px solid #ccc", 
  boxSizing: "border-box" as const,
  color: "#333", // Beviteli mezőben maradjon sötét a betű
  background: "#fff" 
};

const labelS = { fontSize: "12px", fontWeight: "bold" as const, color: "#555", marginBottom: "5px", display: "block" };
const btnS = { padding: "12px", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" as const };
const thS = { padding: "15px", color: "#fff", fontWeight: "bold" as const };
const tdS = { padding: "15px", color: "#eee" };
const iconBtn = { background: "none", border: "none", cursor: "pointer", fontSize: "18px", marginLeft: "10px", filter: "brightness(1.5)" };
