"use client";

import React, { useEffect, useState } from "react";

export default function AdminItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null); // ÚJ: Szerkesztés azonosítója
  const [loading, setLoading] = useState(false);

  const loadItems = async () => {
    const res = await fetch("/api/items");
    const data = await res.json();
    setItems(data);
  };

  useEffect(() => { loadItems(); }, []);

  // SZERKESZTÉS INDÍTÁSA
  const startEdit = (item: any) => {
    setEditingId(item.id);
    setName(item.name);
    setPrice(item.price.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const method = editingId ? "PATCH" : "POST";
    const body = editingId 
      ? { id: editingId, name, price: Number(price) } 
      : { name, price: Number(price) };

    try {
      const res = await fetch("/api/items", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setName("");
        setPrice("");
        setEditingId(null);
        loadItems();
      } else {
        alert("Hiba történt a mentéskor.");
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: number) => {
    if (!confirm("Biztosan törlöd?")) return;
    await fetch(`/api/items?id=${id}`, { method: "DELETE" });
    loadItems();
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto", fontFamily: "Arial" }}>
      <h1>📦 Raktárkészlet kezelése</h1>

      <form onSubmit={handleSubmit} style={{ background: editingId ? "#fff3e0" : "#f9f9f9", padding: 20, borderRadius: 10, marginBottom: 30, border: editingId ? "1px solid #e67e22" : "1px solid #ddd" }}>
        <h3>{editingId ? "✏️ Tétel módosítása" : "➕ Új tétel hozzáadása"}</h3>
        <div style={{ display: "flex", gap: 10 }}>
          <input style={inputS} placeholder="Termék neve" value={name} onChange={e => setName(e.target.value)} required />
          <input style={inputS} type="number" placeholder="Nettó ár" value={price} onChange={e => setPrice(e.target.value)} required />
          <button type="submit" disabled={loading} style={{ ...btnS, background: editingId ? "#e67e22" : "#2ecc71" }}>
            {editingId ? "Mentés" : "Hozzáadás"}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setName(""); setPrice(""); }} style={{ ...btnS, background: "#95a5a6" }}>Mégse</button>
          )}
        </div>
      </form>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #eee" }}>
            <th style={{ padding: 10 }}>Név</th>
            <th>Nettó ár</th>
            <th style={{ textAlign: "right" }}>Műveletek</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 10 }}>{item.name}</td>
              <td>{item.price.toLocaleString()} Ft</td>
              <td style={{ textAlign: "right" }}>
                <button onClick={() => startEdit(item)} style={iconBtn}>✏️</button>
                <button onClick={() => deleteItem(item.id)} style={{ ...iconBtn, color: "red" }}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const inputS = { padding: "10px", borderRadius: "5px", border: "1px solid #ddd", flex: 1 };
const btnS = { padding: "10px 20px", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" };
const iconBtn = { background: "none", border: "none", cursor: "pointer", fontSize: "18px", marginLeft: "10px" };
