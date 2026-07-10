"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
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

  // Automatikusan számolja a készletet a bevitt gyári számok alapján, ha van megadva
  useEffect(() => {
    if (formData.serialNumber.trim()) {
      const count = formData.serialNumber.split(",").map(s => s.trim()).filter(s => s.length > 0).length;
      setFormData(prev => ({ ...prev, stock: count.toString() }));
    }
  }, [formData.serialNumber]);

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
    <div style={{ padding: "20px 12px", maxWidth: 1200, margin: "0 auto", fontFamily: "Arial, sans-serif", boxSizing: "border-box" }}>
      
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

      <h1 style={{ marginBottom: "25px", color: "#fff", fontSize: "1.8rem", wordBreak: "break-word" }}>📦 Raktárkészlet</h1>

      {/* FORM KÁRTYA */}
      <div style={formCard(!!editingId)}>
        <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#333" }}>
          {editingId ? "✏️ Tétel szerkesztése" : "➕ Új tétel rögzítése"}
        </h3>
        
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "15px", width: "100%" }}>
          <div style={responsiveFormGrid}>
            <div style={{ gridColumn: "span 1" }}>
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
              <label style={labelS}>Gyári számok (S/N) <span style={{color: "#3498db", textTransform: "none"}}>(Vesszővel elválasztva ha több van)</span></label>
              <input 
                style={inputS} 
                placeholder="pl. SN123, SN124, SN125" 
                value={formData.serialNumber} 
                onChange={e => setFormData({...formData, serialNumber: e.target.value})} 
              />
            </div>
            <div>
              <label style={labelS}>Készlet (db) {formData.serialNumber.trim() && <span style={{color: "#2ecc71", textTransform: "none"}}>(S/N alapján számolva)</span>}</label>
              <input 
                style={inputS} 
                type="number" 
                value={formData.stock} 
                onChange={e => setFormData({...formData, stock: e.target.value})} 
                disabled={!!formData.serialNumber.trim()}
              />
            </div>
            <div>
              <label style={labelS}>Beszerzési forrás (Nagyker)</label>
              <input style={inputS} placeholder="pl. Sinclair, Gree Hungary..." value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "5px", flexWrap: "wrap" }}>
            <button type="submit" disabled={loading} style={{ ...btnS, background: editingId ? "#e67e22" : "#2ecc71", flex: 1, minWidth: "120px" }}>
              {editingId ? "Mentés" : "Rögzítés"}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setFormData({ name: "", price: "", sku: "", serialNumber: "", stock: "0", supplier: "" }); }} style={{ ...btnS, background: "#95a5a6", flex: 1, minWidth: "120px" }}>
                Mégse
              </button>
            )}
          </div>
        </form>
      </div>

      {/* TERMÉK LISTA */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {items.map(item => {
          const serials = item.serialNumber ? item.serialNumber.split(", ").filter(Boolean) : [];
          const isExpanded = expandedItemId === item.id;

          return (
            <div 
              key={item.id} 
              style={{ 
                background: "#1a1a1a", 
                borderRadius: "12px", 
                padding: "16px", 
                border: "1px solid #333",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}
            >
              {/* Felső szekció */}
              <div>
                <div style={{ fontWeight: "bold", fontSize: "16px", color: "#fff", wordBreak: "break-word", marginBottom: "4px" }}>
                  {item.name}
                </div>
                <div style={{ fontSize: "12px", color: "#aaa" }}>
                  SKU: <span style={{ color: "#fff" }}>{item.sku || "Nincs megadva"}</span>
                  {serials.length > 0 && (
                    <span 
                      onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                      style={{ color: "#3498db", marginLeft: "8px", cursor: "pointer", textDecoration: "underline" }}
                    >
                      {isExpanded ? "🔍 Gyári számok elrejtése" : `🔍 Gyári számok kilistázása (${serials.length} db)`}
                    </span>
                  )}
                </div>
              </div>

              {/* Gyári számok al-listája (Akkor nyílik le, ha rákattintanak) */}
              {isExpanded && serials.length > 0 && (
                <div style={{ background: "#111", padding: "10px", borderRadius: "8px", border: "1px dashed #444" }}>
                  <div style={{ fontSize: "11px", color: "#888", marginBottom: "6px", fontWeight: "bold", textTransform: "uppercase" }}>Raktáron lévő egyedi darabok:</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {serials.map((sn: string, index: number) => (
                      <div key={index} style={{ fontSize: "13px", color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ color: "#2ecc71" }}>•</span> <span>{sn}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Középső adatsor */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                background: "#222", 
                padding: "10px 14px", 
                borderRadius: "8px",
                flexWrap: "wrap",
                gap: "10px"
              }}>
                <div>
                  <span style={{ fontSize: "12px", color: "#aaa", display: "block" }}>KÉSZLET</span>
                  <span style={{ color: item.stock > 0 ? "#2ecc71" : "#e74c3c", fontWeight: "bold", fontSize: "15px" }}>
                    {item.stock} db
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: "12px", color: "#aaa", display: "block" }}>FORRÁS</span>
                  <span style={{ color: "#ccc", fontWeight: "500" }}>
                    {item.supplier || "-"}
                  </span>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "12px", color: "#aaa", display: "block" }}>NETTÓ ÁR</span>
                  <span style={{ color: "#fff", fontWeight: "bold", fontSize: "15px" }}>
                    {item.price.toLocaleString()} Ft
                  </span>
                </div>
              </div>

              {/* Alsó rész: Gombok */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "15px", borderTop: "1px solid #2a2a2a", paddingTop: "10px" }}>
                <button onClick={() => startEdit(item)} style={{ ...iconBtn, margin: 0 }} title="Szerkesztés">✏️ Szerkesztés</button>
                <button 
                  onClick={async () => { if(confirm("Valóban törlöd?")) { await fetch(`/api/items?id=${item.id}`, {method: "DELETE"}); loadItems(); } }} 
                  style={{ ...iconBtn, color: "#e74c3c", margin: 0 }}
                  title="Törlés"
                >
                  🗑️ Törlés
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// STÍLUSOK
const formCard = (isEdit: boolean) => ({ 
  background: isEdit ? "#fff8f0" : "#fff", 
  padding: "20px 16px", 
  borderRadius: "12px", 
  marginBottom: "30px", 
  border: isEdit ? "2px solid #e67e22" : "1px solid #eee", 
  boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
  boxSizing: "border-box" as const,
  width: "100%"
});

const responsiveFormGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "15px",
  width: "100%"
};

const inputS = { 
  width: "100%", 
  padding: "12px", 
  borderRadius: "6px", 
  border: "1px solid #ccc", 
  boxSizing: "border-box" as const,
  color: "#333",
  background: "#fff",
  fontSize: "15px",
  outline: "none"
};

const labelS = { fontSize: "11px", fontWeight: "bold" as const, color: "#555", marginBottom: "5px", display: "block", textTransform: "uppercase" as const };
const btnS = { padding: "14px", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" as const, fontSize: "14px" };
const iconBtn = { background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: "#3498db", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" };
