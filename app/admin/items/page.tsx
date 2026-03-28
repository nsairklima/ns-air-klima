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
    } else {
      const errData = await res.json();
      alert("Hiba: " + (errData.details || "Sikertelen mentés"));
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
    if (!confirm("Biztosan törlöd ezt a tételt?")) return;
    const res = await fetch(`/api/items?id=${id}`, { method: "DELETE" });
    if (res.ok) loadItems();
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1100px", margin: "0 auto", fontFamily: "'Inter', sans-serif", color: "#333" }}>
      
      {/* VISSZALÉPÉS ÉS NAVIGÁCIÓ */}
      <div style={{ marginBottom: "30px", display: "flex", alignItems: "center", gap: "15px" }}>
        <button 
          onClick={() => window.location.href = "/"} 
          style={{
            background: "#fff",
            border: "1px solid #ddd",
            padding: "8px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: "600",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.background = "#f9f9f9"}
          onMouseOut={(e) => e.currentTarget.style.background = "#fff"}
        >
          ← Főoldal
        </button>
        <div style={{ height: "20px", width: "1px", background: "#ddd" }}></div>
        <span style={{ color: "#888", fontSize: "14px" }}>Adminisztráció / Raktárkészlet</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", margin: 0, color: "#1a1a1a" }}>📦 Raktárkészlet Kezelő</h1>
        <span style={{ background: "#e8f0fe", color: "#1967d2", padding: "6px 12px", borderRadius: "20px", fontSize: "14px", fontWeight: "600" }}>
          {items.length} tétel összesen
        </span>
      </div>

      {/* FORM KÁRTYA */}
      <div style={{ 
        background: editingId ? "#fffaf0" : "#ffffff", 
        padding: "30px", 
        borderRadius: "16px", 
        boxShadow: "0 10px 25px rgba(0,0,0,0.05)", 
        border: editingId ? "2px solid #f39c12" : "1px solid #e1e1e1",
        marginBottom: "40px",
        transition: "all 0.3s ease"
      }}>
        <h3 style={{ marginTop: 0, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          {editingId ? "✏️ Tétel módosítása" : "➕ Új termék hozzáadása"}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelS}>Termék megnevezése *</label>
              <input style={inputS} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="pl. Sinclair Vision 3.5kW" />
            </div>
            <div>
              <label style={labelS}>Nettó eladási ár (Ft) *</label>
              <input style={inputS} type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
            </div>
            <div>
              <label style={labelS}>Cikkszám (SKU)</label>
              <input style={inputS} value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="V35-ABC" />
            </div>
            <div>
              <label style={labelS}>Készlet (db)</label>
              <input style={inputS} type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelS}>Beszerzési forrás / Nagyker</label>
              <input style={inputS} value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} placeholder="pl. Sinclair Hungary Kft." />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>
              <button type="submit" disabled={loading} style={{ 
                ...btnS, 
                background: editingId ? "#f39c12" : "#0070f3", 
                flex: 2 
              }}>
                {loading ? "Mentés..." : (editingId ? "Módosítás mentése" : "Tétel rögzítése")}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setFormData({name:"", price:"", sku:"", serialNumber:"", stock:"0", supplier:""})}} style={{ ...btnS, background: "#666", flex: 1 }}>
                  Mégse
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* TÁBLÁZAT */}
      <div style={{ background: "#fff", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", overflow: "hidden", border: "1px solid #eee" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #eee" }}>
              <th style={thS}>TERMÉK ÉS CIKKSZÁM</th>
              <th style={thS}>KÉSZLET</th>
              <th style={thS}>NAGYKER</th>
              <th style={thS}>NETTÓ ÁR</th>
              <th style={{ ...thS, textAlign: "right" }}>MŰVELETEK</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? items.map((item) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={tdS}>
                  <div style={{ fontWeight: "600", fontSize: "15px" }}>{item.name}</div>
                  <div style={{ fontSize: "12px", color: "#888" }}>{item.sku || "Nincs SKU"}</div>
                </td>
                <td style={tdS}>
                  <span style={{ 
                    padding: "4px 10px", 
                    borderRadius: "6px", 
                    fontSize: "13px", 
                    fontWeight: "bold",
                    background: (item.stock || 0) > 0 ? "#e6fffa" : "#fff5f5",
                    color: (item.stock || 0) > 0 ? "#2c7a7b" : "#c53030"
                  }}>
                    {item.stock || 0} db
                  </span>
                </td>
                <td style={tdS}><span style={{ color: "#666" }}>{item.supplier || "-"}</span></td>
                <td style={tdS}><span style={{ fontWeight: "700" }}>{(item.price || 0).toLocaleString()} Ft</span></td>
                <td style={{ ...tdS, textAlign: "right" }}>
                  <button onClick={() => startEdit(item)} style={iconBtnS}>✏️</button>
                  <button onClick={() => deleteItem(item.id)} style={{ ...iconBtnS, color: "#e53e3e" }}>🗑️</button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#999" }}>Még nincs rögzített termék.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// STÍLUSOK
const inputS = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", outline: "none", boxSizing: "border-box" as const };
const labelS = { display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: "700", color: "#666", textTransform: "uppercase" as const, letterSpacing: "0.5px" };
const btnS = { padding: "12px", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" as const, fontSize: "14px", transition: "opacity 0.2s" };
const thS = { padding: "16px", textAlign: "left" as const, fontSize: "12px", fontWeight: "700", color: "#888", letterSpacing: "1px" };
const tdS = { padding: "16px", verticalAlign: "middle" };
const iconBtnS = { background: "none", border: "none", cursor: "pointer", fontSize: "18px", padding: "5px", marginLeft: "5px" };
