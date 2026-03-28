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

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <button onClick={() => window.location.href = "/"} style={{marginBottom: "20px"}}>← Főoldal</button>
      <h1>📦 Raktárkészlet</h1>

      {/* MOBILBARÁT LISTA - Ez mindenképpen kártyás lesz */}
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {items.map(item => (
          <div key={item.id} style={{ 
            background: "white", 
            padding: "20px", 
            borderRadius: "15px", 
            border: "2px solid #eee",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)" 
          }}>
            <div style={{ fontWeight: "bold", fontSize: "18px" }}>{item.name}</div>
            <div style={{ color: "#0070f3", fontSize: "20px", margin: "10px 0", fontWeight: "bold" }}>
              {item.price?.toLocaleString()} Ft
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#666" }}>
              <span>SKU: {item.sku || "-"}</span>
              <span style={{ fontWeight: "bold" }}>Készlet: {item.stock} db</span>
            </div>
            <button 
              onClick={() => { /* szerkesztés logikája */ }}
              style={{ width: "100%", marginTop: "15px", padding: "10px", borderRadius: "8px", background: "#f0f0f0", border: "1px solid #ccc" }}
            >
              Szerkesztés ✏️
            </button>
          </div>
        ))}
      </div>

      {/* Ha asztali gépen vagy, ez is kártyás marad ebben a kódban a teszt kedvéért */}
    </div>
  );
}
