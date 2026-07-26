"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AdminItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);

  // Saját lenyíló menü állapota
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Szerkesztés állapota
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editItemData, setEditItemData] = useState({
    brand: "",
    name: "",
    price: "",
    sku: "",
    supplier: "",
    stock: 0,
  });

  // Beviteli mezők állapota (bevételezés)
  const [newSerial, setNewSerial] = useState("");
  const [newSupplier, setNewSupplier] = useState("");
  const [serialToDelete, setSerialToDelete] = useState("");
  const [simpleStockToAdd, setSimpleStockToAdd] = useState("0");

  // Új termék állapota
  const [newItemData, setNewItemData] = useState({
    brand: "",
    name: "",
    price: "",
    sku: "",
    supplier: "",
  });

  const router = useRouter();

  const loadItems = async () => {
    try {
      const res = await fetch("/api/items");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error("Hiba a raktár betöltésekor:", err);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Kattintás figyelése a lenyíló menün kívül (bezáráshoz)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsItemDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedItem = items.find((i) => i.id === Number(selectedItemId));

  // Gyári számok listája a kiválasztott tételhez
  const currentSerials = selectedItem?.serialNumber
    ? selectedItem.serialNumber.split(", ").map((s: string) => {
        const [sn, src] = s.split("@");
        return { sn, src: src || "Nincs" };
      })
    : [];

  // ÚJ GYÁRI SZÁM HOZZÁADÁSA MEGLÉVŐHÖZ
  const handleAddSerial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) return;
    setLoading(true);

    const res = await fetch("/api/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_serial",
        id: Number(selectedItemId),
        newSerial: newSerial,
        newSupplier: newSupplier,
        stock: Number(simpleStockToAdd),
      }),
    });

    if (res.ok) {
      setNewSerial("");
      setNewSupplier("");
      setSimpleStockToAdd("0");
      loadItems();
    }
    setLoading(false);
  };

  // GYÁRI SZÁM TÖRLÉSE LENYÍLÓBÓL
  const handleDeleteSerial = async () => {
    if (!selectedItemId || !serialToDelete) return;
    if (!confirm(`Biztosan törlöd a(z) ${serialToDelete} gyári számot a raktárból?`)) return;

    setLoading(true);
    const res = await fetch("/api/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete_serial",
        id: Number(selectedItemId),
        deleteSerial: serialToDelete,
      }),
    });

    if (res.ok) {
      setSerialToDelete("");
      loadItems();
    }
    setLoading(false);
  };

  // TELJESEN ÚJ TERMÉK REGISZTRÁCIÓJA
  const handleCreateNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItemData),
    });

    if (res.ok) {
      setNewItemData({ brand: "", name: "", price: "", sku: "", supplier: "" });
      loadItems();
    } else {
      alert("Hiba történt a mentés során!");
    }
    setLoading(false);
  };

  // SZERKESZTÉS INDÍTÁSA
  const startEditItem = (item: any) => {
    setEditingItemId(item.id);
    setEditItemData({
      brand: item.brand || "",
      name: item.name || "",
      price: String(item.price || ""),
      sku: item.sku || "",
      supplier: item.supplier || "",
      stock: item.stock ?? 0,
    });
  };

  // SZERKESZTETT MENTÉSE
  const handleUpdateItem = async (itemId: number) => {
    setLoading(true);
    const res = await fetch("/api/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_details",
        id: itemId,
        brand: editItemData.brand,
        name: editItemData.name,
        price: Number(editItemData.price),
        sku: editItemData.sku,
        supplier: editItemData.supplier,
        stock: Number(editItemData.stock),
      }),
    });

    if (res.ok) {
      setEditingItemId(null);
      loadItems();
    } else {
      alert("Hiba történt a mentés során!");
    }
    setLoading(false);
  };

  // TERMÉK VÉGLEGES TÖRLÉSE A RAKTÁRBÓL
  const handleDeleteItem = async (item: any) => {
    const confirmName = item.brand ? `${item.brand} ${item.name}` : item.name;
    if (!confirm(`Biztosan törölni szeretnéd a(z) "${confirmName}" terméket a raktárból? Ez a művelet nem visszavonható!`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });

      if (res.ok) {
        if (selectedItemId === String(item.id)) {
          setSelectedItemId("");
        }
        loadItems();
      } else {
        alert("Hiba történt a termék törlése során!");
      }
    } catch (err) {
      console.error("Törlési hiba:", err);
      alert("Hiba történt a törlés során!");
    }
    setLoading(false);
  };

  const getSelectedItemLabel = () => {
    if (!selectedItem) return "-- Válassz a raktárból --";
    const brand = selectedItem.brand || (selectedItem.supplier ? selectedItem.supplier : "");
    return `${brand ? `[${brand}] ` : ""}${selectedItem.name} (${selectedItem.stock ?? 0} db raktáron)`;
  };

  return (
    <div style={{ padding: "20px 12px", maxWidth: 1200, margin: "0 auto", fontFamily: "sans-serif", backgroundColor: "#000", minHeight: "100vh", color: "#fff" }}>
      <button onClick={() => router.push("/")} style={{ padding: "10px 20px", background: "#333", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", marginBottom: "20px" }}>
        🏠 Főmenü
      </button>

      <h1 style={{ color: "#2ecc71" }}>📦 Raktárkezelő Központ</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "30px" }}>
        
        {/* PANEL 1: MEGLÉVŐ ANYAG KEZELÉSE */}
        <div style={panelCard}>
          <h3 style={{ margin: "0 0 15px 0", color: "#4DA3FF" }}>📥 Készlet módosítása (Kiválasztással)</h3>

          <label style={labelS}>Válaszd ki az anyagot/gépet:</label>
          
          {/* SAJÁT EGYEDI KONTRASTOS MOBILBARÁT VÁLASZTÓ DROPDOWN */}
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setIsItemDropdownOpen(!isItemDropdownOpen)}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "8px",
                border: "2px solid #3b82f6",
                background: "#1e293b",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: "bold",
                textAlign: "left",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {getSelectedItemLabel()}
              </span>
              <span style={{ marginLeft: "10px", fontSize: "12px" }}>{isItemDropdownOpen ? "▲" : "▼"}</span>
            </button>

            {/* LENYÍLÓ OPTION LISTA (GARANTÁLTAN SÖTÉT KONTRASTOS FELÜLET) */}
            {isItemDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 999,
                  marginTop: "6px",
                  maxHeight: "280px",
                  overflowY: "auto",
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                  border: "2px solid #3b82f6",
                }}
              >
                <div
                  onClick={() => {
                    setSelectedItemId("");
                    setSerialToDelete("");
                    setIsItemDropdownOpen(false);
                  }}
                  style={{
                    padding: "12px 14px",
                    color: "#666666",
                    fontWeight: "bold",
                    borderBottom: "1px solid #eeeeee",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  -- Válassz a raktárból --
                </div>

                {items.map((i) => {
                  const displayBrand = i.brand || (i.supplier ? i.supplier : "");
                  const isSelected = String(i.id) === selectedItemId;

                  return (
                    <div
                      key={i.id}
                      onClick={() => {
                        setSelectedItemId(String(i.id));
                        setSerialToDelete("");
                        setIsItemDropdownOpen(false);
                      }}
                      style={{
                        padding: "12px 14px",
                        color: isSelected ? "#1e88e5" : "#111111",
                        backgroundColor: isSelected ? "#e3f2fd" : "#ffffff",
                        fontWeight: isSelected ? "bold" : "500",
                        borderBottom: "1px solid #f0f0f0",
                        cursor: "pointer",
                        fontSize: "15px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>
                        {displayBrand ? <strong>[{displayBrand}] </strong> : ""}
                        {i.name}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          backgroundColor: (i.stock ?? 0) > 0 ? "#e8f5e9" : "#ffebee",
                          color: (i.stock ?? 0) > 0 ? "#2e7d32" : "#c62828",
                          fontWeight: "bold",
                        }}
                      >
                        {i.stock ?? 0} db
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedItemId && (
            <>
              <hr style={{ border: "0", borderTop: "1px solid #333", margin: "15px 0" }} />

              <form onSubmit={handleAddSerial} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <span style={{ fontSize: "12px", fontWeight: "bold", color: "#2ecc71" }}>➕ ÚJ DARAB BEVÉTELEZÉSE:</span>
                <input style={inputS} placeholder="Gyári szám (elhagyható ha sima anyag)" value={newSerial} onChange={(e) => setNewSerial(e.target.value)} />
                <input style={inputS} placeholder="Beszerzési forrás (pl. Gree Hungary)" value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)} />
                {!newSerial && (
                  <input style={inputS} type="number" placeholder="Mennyiség hozzáadása (db)" value={simpleStockToAdd} onChange={(e) => setSimpleStockToAdd(e.target.value)} />
                )}
                <button type="submit" disabled={loading} style={{ ...btnS, background: "#2ecc71" }}>
                  Hozzáadás a készlethez
                </button>
              </form>

              {currentSerials.length > 0 && (
                <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px", padding: "12px", background: "#111", borderRadius: "8px", border: "1px dashed #e74c3c" }}>
                  <span style={{ fontSize: "12px", fontWeight: "bold", color: "#e74c3c" }}>🗑️ RAKTÁRON LÉVŐ GYÁRI SZÁM TÖRLÉSE:</span>
                  <select style={selectS} value={serialToDelete} onChange={(e) => setSerialToDelete(e.target.value)}>
                    <option value="" style={{ color: "#000" }}>-- Válaszd ki a törlendőt --</option>
                    {currentSerials.map((s, idx) => (
                      <option key={idx} value={s.sn} style={{ color: "#000" }}>
                        {s.sn} (Forrás: {s.src})
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={handleDeleteSerial} disabled={!serialToDelete || loading} style={{ ...btnS, background: "#e74c3c" }}>
                    Kiválasztott szám végleges törlése
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* PANEL 2: TELJESEN ÚJ TERMÉKFAJTA LÉTREHOZÁSA */}
        <div style={panelCard}>
          <h3 style={{ margin: "0 0 15px 0", color: "#2ecc71" }}>✨ Teljesen új anyagtípus regisztrálása</h3>
          <form onSubmit={handleCreateNewItem} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <input
                style={inputS}
                placeholder="Gyártó (pl. Fisher, Gree) *"
                value={newItemData.brand}
                onChange={(e) => setNewItemData({ ...newItemData, brand: e.target.value })}
                required
              />
              <input
                style={inputS}
                placeholder="Típus / Megnevezés (pl. Comfort Plus 2,7) *"
                value={newItemData.name}
                onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })}
                required
              />
            </div>

            <input
              style={inputS}
              type="number"
              placeholder="Nettó eladási ár (Ft) *"
              value={newItemData.price}
              onChange={(e) => setNewItemData({ ...newItemData, price: e.target.value })}
              required
            />
            <input
              style={inputS}
              placeholder="Cikkszám (SKU)"
              value={newItemData.sku}
              onChange={(e) => setNewItemData({ ...newItemData, sku: e.target.value })}
            />
            <input
              style={inputS}
              placeholder="Alapértelmezett nagyker"
              value={newItemData.supplier}
              onChange={(e) => setNewItemData({ ...newItemData, supplier: e.target.value })}
            />
            <button type="submit" disabled={loading} style={{ ...btnS, background: "#4DA3FF" }}>
              Alaptípus létrehozása
            </button>
          </form>
        </div>
      </div>

      {/* RAKTÁR LISTA ÉS SZERKESZTÉS/TÖRLÉS */}
      <h2 style={{ color: "#fff", fontSize: "1.3rem", marginBottom: "15px" }}>Aktuális Raktárkészlet listája:</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {items.map((item) => {
          const serials = item.serialNumber ? item.serialNumber.split(", ").filter(Boolean) : [];
          const isExpanded = expandedItemId === item.id;
          const isEditing = editingItemId === item.id;

          const itemBrand = item.brand || "";

          return (
            <div key={item.id} style={{ background: "#1a1a1a", padding: "16px", borderRadius: "10px", border: isEditing ? "1px solid #f39c12" : "1px solid #333" }}>
              
              {!isEditing ? (
                // NORMÁL NÉZET
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      {itemBrand ? (
                        <span style={{ color: "#2ecc71", background: "#0a2912", padding: "2px 8px", borderRadius: "4px", border: "1px solid #145223", fontWeight: "bold" }}>
                          {itemBrand}
                        </span>
                      ) : (
                        <span style={{ color: "#777", fontSize: "13px", fontStyle: "italic" }}>
                          [Nincs gyártó]
                        </span>
                      )}
                      
                      <strong style={{ fontSize: "16px" }}>{item.name}</strong>

                      {/* KÉK CIKKSZÁM (SKU) JELVÉNY */}
                      {item.sku && (
                        <span style={{ background: "#0f2b48", color: "#64b5f6", border: "1px solid #1e88e5", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>
                          SKU: {item.sku}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: "12px", color: "#aaa", marginTop: "8px" }}>
                      Nagyker: {item.supplier || "Nincs"}
                      {serials.length > 0 && (
                        <span onClick={() => setExpandedItemId(isExpanded ? null : item.id)} style={{ color: "#4DA3FF", marginLeft: "10px", cursor: "pointer", textDecoration: "underline" }}>
                          {isExpanded ? "Bezár" : `Gyári számok mutatása (${serials.length} db)`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ textAlign: "right", marginRight: "8px" }}>
                      <span style={{ color: (item.stock ?? 0) > 0 ? "#2ecc71" : "#e74c3c", fontWeight: "bold" }}>
                        {item.stock ?? 0} db
                      </span>
                      <div style={{ fontSize: "13px", color: "#ccc", marginTop: "4px" }}>
                        {Number(item.price || 0).toLocaleString()} Ft
                      </div>
                    </div>
                    
                    {/* IKONGOMBOK */}
                    <button
                      onClick={() => startEditItem(item)}
                      style={{ background: "#f39c12", color: "#000", border: "none", width: "36px", height: "36px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}
                      title="Szerkesztés"
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item)}
                      disabled={loading}
                      style={{ background: "#c0392b", color: "#fff", border: "none", width: "36px", height: "36px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}
                      title="Termék törlése"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ) : (
                // SZERKESZTŐ NÉZET
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ color: "#f39c12", fontWeight: "bold", fontSize: "14px" }}>✏️ Termék adatainak módosítása:</div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
                    <div>
                      <label style={labelS}>Gyártó / Márka (pl. Fisher):</label>
                      <input style={inputS} value={editItemData.brand} onChange={(e) => setEditItemData({ ...editItemData, brand: e.target.value })} placeholder="Gyártó" />
                    </div>
                    <div>
                      <label style={labelS}>Típus / Megnevezés:</label>
                      <input style={inputS} value={editItemData.name} onChange={(e) => setEditItemData({ ...editItemData, name: e.target.value })} placeholder="Megnevezés" />
                    </div>
                    <div>
                      <label style={labelS}>Nettó Ár (Ft):</label>
                      <input style={inputS} type="number" value={editItemData.price} onChange={(e) => setEditItemData({ ...editItemData, price: e.target.value })} placeholder="Ár" />
                    </div>
                    <div>
                      <label style={labelS}>Raktárkészlet (db):</label>
                      <input style={inputS} type="number" value={editItemData.stock} onChange={(e) => setEditItemData({ ...editItemData, stock: Number(e.target.value) })} placeholder="Készlet" />
                    </div>
                    <div>
                      <label style={labelS}>Cikkszám (SKU):</label>
                      <input style={inputS} value={editItemData.sku} onChange={(e) => setEditItemData({ ...editItemData, sku: e.target.value })} placeholder="SKU" />
                    </div>
                    <div>
                      <label style={labelS}>Beszerzés / Nagyker:</label>
                      <input style={inputS} value={editItemData.supplier} onChange={(e) => setEditItemData({ ...editItemData, supplier: e.target.value })} placeholder="Nagyker" />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                    <button onClick={() => handleUpdateItem(item.id)} disabled={loading} style={{ ...btnS, background: "#2ecc71", flex: 1 }}>
                      ✅ Mentés
                    </button>
                    <button onClick={() => setEditingItemId(null)} style={{ ...btnS, background: "#555", color: "#fff", flex: 1 }}>
                      Mégse
                    </button>
                  </div>
                </div>
              )}

              {/* GYÁRI SZÁMOK LISTÁJA */}
              {!isEditing && isExpanded && serials.length > 0 && (
                <div style={{ background: "#050505", padding: "10px", borderRadius: "6px", marginTop: "10px", border: "1px dashed #444" }}>
                  {serials.map((s: string, idx: number) => {
                    const [sn, src] = s.split("@");
                    return (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "4px 0", borderBottom: idx !== serials.length - 1 ? "1px solid #222" : "none" }}>
                        <span>• <code style={{ color: "#2ecc71" }}>{sn}</code></span>
                        <span style={{ color: "#aaa", fontSize: "11px" }}>🏢 {src || "Ismeretlen"}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const panelCard = { background: "#141414", padding: "20px", borderRadius: "12px", border: "1px solid #222" };
const labelS = { fontSize: "12px", color: "#aaa", display: "block", marginBottom: "6px" };
const inputS = { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #333", background: "#222", color: "#fff", boxSizing: "border-box" as const };

const selectS = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "2px solid #3b82f6",
  background: "#1e293b",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "bold" as const,
  boxSizing: "border-box" as const,
};

const btnS = { padding: "12px", border: "none", borderRadius: "6px", color: "#000", fontWeight: "bold" as const, cursor: "pointer", marginTop: "5px" };
