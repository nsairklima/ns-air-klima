"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function ItemsAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({ name: "", price: "" });

  const loadItems = async () => {
    try {
      const res = await fetch("/api/items");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error("Hiba:", err);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return;

    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newItem.name,
        price: Number(newItem.price)
      }),
    });

    if (res.ok) {
      setNewItem({ name: "", price: "" });
      loadItems();
    } else {
      alert("Hiba történt a mentéskor!");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Biztosan törlöd?")) return;
    await fetch(`/api/items?id=${id}`, { method: "DELETE" });
    loadItems();
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto", fontFamily: "Arial" }}>
      <Link href="/">← Vissza</Link>
      <h1 style={{ color: "#2c3e50" }}>📦 Terméktörzs kezelése</h1>

      <form onSubmit={handleSave} style={{ marginBottom: 30, display: "flex", gap: 10, background: "#f9f9f9", padding: 15, borderRadius: 8 }}>
        <input 
          placeholder="Termék neve" 
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          style={{ padding: 10, flex: 2, border: "1px solid #ddd", borderRadius: 4 }}
        />
        <input 
          type="number"
          placeholder="Ár (Ft)" 
          value={newItem.price}
          onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
          style={{ padding: 10, flex: 1, border: "1px solid #ddd", borderRadius: 4 }}
        />
        <button type="submit" style={{ padding: "10px 20px", background: "#27ae60", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Hozzáadás</button>
      </form>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #eee" }}>
            <th style={{ padding: 10 }}>Név</th>
            <th style={{ padding: 10 }}>Ár</th>
            <th style={{ padding: 10 }}>Művelet</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 10 }}>{item.name}</td>
              <td style={{ padding: 10 }}>{item.price.toLocaleString()} Ft</td>
              <td style={{ padding: 10 }}>
                <button onClick={() => handleDelete(item.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem" }}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
