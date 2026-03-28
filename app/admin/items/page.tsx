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
    try {
      const res = await fetch("/api/items");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Betöltési hiba:", err);
    }
  };

  useEffect(() => { loadItems(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const method = editingId ? "PATCH" : "POST";
    const payload = {
      id: editingId,
      name: formData.name,
      price: parseFloat(formData.price) || 0,
      sku: formData.sku || null,
      serialNumber: formData.serialNumber || null,
      stock: parseInt(formData.stock) || 0,
      supplier: formData.supplier || null,
    };

    const res = await fetch("/api/items", {
      method,
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

  const deleteItem = async (id: number) => {
    if (!confirm("Biztosan törlöd?")) return;
    const res = await fetch(`/api/items?id=${id}`, { method: "DELETE" });
    if (res.ok) loadItems();
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1100px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
      
      {/* CSS INJEKTÁLÁS A MOBIL NÉZETHEZ */}
      <style jsx>{`
        .desktop-table { display: table; width: 100%; border-collapse: collapse; }
        .mobile-grid { display: none; }

        @media (max-width: 768px) {
          .desktop-table { display: none; }
          .mobile-grid { 
            display: grid; 
            grid-template-columns: 1fr; 
            gap: 15px; 
          }
          .mobile-card {
            background: white;
            padding: 15px;
            border-radius: 12px;
            border: 1px solid #eee;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }
        }
      `}</style>

      {/* NAVIGÁCIÓ */}
      <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
        <button onClick={() => window.location.href = "/"} style={backBtnS}>← Főoldal</button>
      </div>

      <h1 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "20px" }}>📦 Raktárkészlet</h1>

      {/* FORM KÁRTYA */}
      <div style={{ background: "#fff", padding: "20px", borderRadius: "16px", border: "1px solid #e1e1e1", marginBottom: "30px" }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "15px" }}>
             <input style={inputS} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Termék neve" />
             <input style={inputS} type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="Nettó ár" />
             <input style={inputS} value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="Cikkszám" />
             <input style={inputS} type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} placeholder="Készlet" />
             <button type="submit" style={{ ...btnS, background: editingId ? "#f39c12" : "#0070f3" }}>
               {editingId ? "Mentés" : "Rögzítés"}
             </button>
          </div>
        </form>
      </div>

      {/* ASZTALI TÁBLÁZAT (Desktop) */}
      <div className="desktop-table-container">
        <table className="desktop-table">
          <thead>
            <tr style={{ background: "#f8f9fa", textAlign: "left" }}>
              <th style={thS}>Megnevezés</th>
              <th style={thS}>Készlet</th>
              <th style={thS}>Ár</th>
              <th style={{...thS, textAlign: "right"}}>Művelet</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={tdS}><strong>{item.name}</strong><br/><small>{item.sku}</small></td>
                <td style={tdS}>{item.stock} db</td>
                <td style={tdS}>{item.price.toLocaleString()} Ft</td>
                <td style={{...tdS, textAlign: "right"}}>
                  <button onClick={() => startEdit(item)} style={iconBtn}>✏️</button>
                  <button onClick={() => deleteItem(item.id)} style={{...iconBtn, color: "red"}}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBIL CSEMPÉS NÉZET (Mobile) */}
      <div className="mobile-grid">
        {items.map(item => (
          <div key={item.id} className="mobile-card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "12px", color: "#888" }}>{item.sku || "Nincs SKU"}</span>
              <span style={{ fontWeight: "bold", color: item.stock > 0 ? "green" : "red" }}>{item.stock} db</span>
            </div>
            <div style={{ fontWeight: "bold", fontSize: "16px", marginBottom: "5px" }}>{item.name}</div>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#0070f3", marginBottom: "15px" }}>{item.price.toLocaleString()} Ft</div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => startEdit(item)} style={{ ...btnSmall, background: "#f8f9fa", border: "1px solid #ddd" }}>Szerkesztés ✏️</button>
              <button onClick={() => deleteItem(item.id)} style={{ ...btnSmall, background: "#fff5f5", color: "#e53e3e", border: "1px solid #feb2b2" }}>Törlés 🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// STÍLUSOK
const inputS = { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", width: "100%", boxSizing: "border-box" as const };
const btnS = { padding: "12px", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" as const };
const btnSmall = { padding: "8px", flex: 1, borderRadius: "6px", cursor: "pointer", fontSize: "13px" };
const thS = { padding: "12px", color: "#888", fontSize: "12px" };
const tdS = { padding: "12px" };
const iconBtn = { background: "none", border: "none", cursor: "pointer", fontSize: "18px" };
const backBtnS = { background: "white", border: "1px solid #ddd", padding: "8px 15px", borderRadius: "8px", cursor: "pointer" };
