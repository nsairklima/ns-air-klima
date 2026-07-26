"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AdminItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);

  // Keresőmező a fő raktárlistához
  const [searchTerm, setSearchTerm] = useState("");

  // Keresőmező a Panel 1 (Készlet módosítása) lenyíló menüjéhez
  const [dropdownSearchTerm, setDropdownSearchTerm] = useState("");

  // Lenyíló menü állapota
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

  // Beviteli mezők
  const [newSerial, setNewSerial] = useState("");
  const [newSupplier, setNewSupplier] = useState("");
  const [serialToDelete, setSerialToDelete] = useState("");
  const [simpleStockToAdd, setSimpleStockToAdd] = useState("0");

  // Új termék
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

  const currentSerials = selectedItem?.serialNumber
    ? selectedItem.serialNumber.split(", ").filter(Boolean).map((s: string) => {
        const [sn, src] = s.split("@");
        return { sn: sn?.trim(), src: src?.trim() || "Nincs" };
      })
    : [];

  // Szűrt lista a Panel 1 lenyíló menüjéhez
  const dropdownFilteredItems = items.filter((item) => {
    const term = dropdownSearchTerm.toLowerCase();
    const brandMatch = (item.brand || "").toLowerCase().includes(term);
    const nameMatch = (item.name || "").toLowerCase().includes(term);
    const skuMatch = (item.sku || "").toLowerCase().includes(term);
    const supplierMatch = (item.supplier || "").toLowerCase().includes(term);
    return brandMatch || nameMatch || skuMatch || supplierMatch;
  });

  // Szűrt lista a fő raktárlistához
  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    const brandMatch = (item.brand || "").toLowerCase().includes(term);
    const nameMatch = (item.name || "").toLowerCase().includes(term);
    const skuMatch = (item.sku || "").toLowerCase().includes(term);
    const supplierMatch = (item.supplier || "").toLowerCase().includes(term);
    const serialMatch = (item.serialNumber || "").toLowerCase().includes(term);
    return brandMatch || nameMatch || skuMatch || supplierMatch || serialMatch;
  });

  // ÚJ GYÁRI SZÁM HOZZÁADÁSA
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

  // EGYEDI GYÁRI SZÁM TÖRLÉSE
  const executeDeleteSerial = async (itemId: number, snToDelete: string) => {
    if (!confirm(`Biztosan törlöd a(z) "${snToDelete}" gyári számot a raktárból?`)) return;

    setLoading(true);
    try {
      const res = await fetch("/api/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_serial",
          id: itemId,
          deleteSerial: snToDelete,
        }),
      });

      if (res.ok) {
        setSerialToDelete("");
        await loadItems();
      } else {
        alert("Hiba történt a gyári szám törlése során!");
      }
    } catch (err) {
      console.error("Gyári szám törlési hiba:", err);
      alert("Szerver hiba történt!");
    }
    setLoading(false);
  };

  // ÚJ TERMÉK REGISZTRÁLÁSA
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

  // MENTÉS
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

  // TELJES TERMÉK TÖRLÉSE
  const handleDeleteItem = async (item: any) => {
    const confirmName = item.brand ? `${item.brand} ${item.name}` : item.name || "Névtelen termék";
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

  return (
    <div style={{ padding: "20px 12px", maxWidth: 1200, margin: "0 auto", fontFamily: "sans-serif", backgroundColor: "#000", minHeight: "100vh", color: "#fff" }}>
      <button onClick={() => router.push("/")} style={{ padding: "10px 20px", background: "#333", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", marginBottom: "20px" }}>
        🏠 Főmenü
      </button>

      <h1 style={{ color: "#2ecc71" }}>📦 Raktárkezelő Központ</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "30px" }}>
        
        {/* PANEL 1: KÉSZLET MÓDOSÍTÁSA KERESŐVEL ÉS NAGYKER KIJELZÉSSEL */}
        <div style={panelCard}>
          <h3 style={{ margin: "0 0 15px 0", color: "#4DA3FF" }}>📥 Készlet módosítása (Kiválasztással)</h3>

          <label style={labelS}>Válaszd ki az anyagot/gépet:</label>
          
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => {
                setIsItemDropdownOpen(!isItemDropdownOpen);
                setDropdownSearchTerm(""); // Megnyitáskor töröljük a szűrőt
              }}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "8px",
                border: "1px solid #333",
                background: "#222",
                color: "#ffffff",
                fontSize: "15px",
                textAlign: "left",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                {selectedItem ? (
                  <>
                    {selectedItem.brand && <span style={{ color: "#2ecc71", fontWeight: "bold" }}>[{selectedItem.brand}]</span>}
                    <span>{selectedItem.name || "Névtelen termék"}</span>
                    {selectedItem.supplier && (
                      <span style={{ color: "#f39c12", fontSize: "12px" }}>(Nagyker: {selectedItem.supplier})</span>
                    )}
                    {selectedItem.sku && (
                      <span style={{ background: "#0f2b48", color: "#64b5f6", border: "1px solid #1e88e5", padding: "1px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" }}>
                        {selectedItem.sku}
                      </span>
                    )}
                  </>
                ) : (
                  <span style={{ color: "#aaa" }}>-- Válassz a raktárból --</span>
                )}
              </div>
              <span style={{ marginLeft: "10px", fontSize: "12px", color: "#aaa" }}>{isItemDropdownOpen ? "▲" : "▼"}</span>
            </button>

            {isItemDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 999,
                  marginTop: "6px",
                  maxHeight: "360px",
                  overflowY: "auto",
                  backgroundColor: "#1c1c1c",
                  borderRadius: "8px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.8)",
                  border: "1px solid #444",
                }}
              >
                {/* KERESŐMEZŐ A LENYÍLÓ BAN */}
                <div style={{ padding: "8px", position: "sticky", top: 0, backgroundColor: "#1c1c1c", borderBottom: "1px solid #333", zIndex: 10 }}>
                  <input
                    type="text"
                    placeholder="🔍 Keresés név, nagyker, SKU alapján..."
                    value={dropdownSearchTerm}
                    onChange={(e) => setDropdownSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      ...inputS,
                      padding: "8px 10px",
                      fontSize: "13px",
                      borderColor: "#4DA3FF",
                    }}
                    autoFocus
                  />
                </div>

                <div
                  onClick={() => {
                    setSelectedItemId("");
                    setSerialToDelete("");
                    setIsItemDropdownOpen(false);
                  }}
                  style={{
                    padding: "10px 14px",
                    color: "#888888",
                    fontWeight: "bold",
                    borderBottom: "1px solid #2a2a2a",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  -- Válassz a raktárból --
                </div>

                {dropdownFilteredItems.length === 0 ? (
                  <div style={{ padding: "12px", color: "#888", textAlign: "center", fontSize: "13px" }}>
                    Nincs találat.
                  </div>
                ) : (
                  dropdownFilteredItems.map((i) => {
                    const displayBrand = i.brand || "";
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
                          padding: "10px 14px",
                          backgroundColor: isSelected ? "#2a364f" : "#1c1c1c",
                          borderBottom: "1px solid #2a2a2a",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            {displayBrand && (
                              <span style={{ color: "#2ecc71", fontWeight: "bold", fontSize: "13px" }}>
                                [{displayBrand}]
                              </span>
                            )}
                            <span style={{ color: "#fff", fontSize: "14px", fontWeight: isSelected ? "bold" : "normal" }}>
                              {i.name || "Névtelen termék"}
                            </span>

                            {i.sku && (
                              <span style={{ background: "#0f2b48", color: "#64b5f6", border: "1px solid #1e88e5", padding: "1px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold" }}>
                                {i.sku}
                              </span>
                            )}
                          </div>

                          {/* NAGYKER KIJELZÉSE A LENYÍLÓ ELEMEINÉL */}
                          <div style={{ fontSize: "11px", color: "#f39c12" }}>
                            🏢 Nagyker: {i.supplier || "Nincs megadva"}
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: "12px",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            backgroundColor: (i.stock ?? 0) > 0 ? "#0a2912" : "#2a0a0a",
                            color: (i.stock ?? 0) > 0 ? "#2ecc71" : "#e74c3c",
                            border: `1px solid ${(i.stock ?? 0) > 0 ? "#145223" : "#521414"}`,
                            fontWeight: "bold",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {i.stock ?? 0} db
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {selectedItemId && (
            <>
              <hr style={{ border: "0", borderTop: "1px solid #333", margin: "15px 0" }} />

              <form onSubmit={handleAddSerial} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <span style={{ fontSize: "12px", fontWeight: "bold", color: "#2ecc71" }}>➕ ÚJ DARAB BEVÉTELEZÉSE:</span>
                <input style={inputS} placeholder="Gyári szám" value={newSerial} onChange={(e) => setNewSerial(e.target.value)} />
                <input style={inputS} placeholder={`Beszerzési forrás"})`} value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)} />
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
                  <select style={inputS} value={serialToDelete} onChange={(e) => setSerialToDelete(e.target.value)}>
                    <option value="" style={{ color: "#000" }}>-- Válaszd ki a törlendőt --</option>
                    {currentSerials.map((s, idx) => (
                      <option key={idx} value={s.sn} style={{ color: "#000" }}>
                        {s.sn} (Forrás/Nagyker: {s.src})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => executeDeleteSerial(Number(selectedItemId), serialToDelete)}
                    disabled={!serialToDelete || loading}
                    style={{ ...btnS, background: "#e74c3c" }}
                  >
                    Kiválasztott szám végleges törlése
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* PANEL 2: ÚJ TERMÉK */}
        <div style={panelCard}>
          <h3 style={{ margin: "0 0 15px 0", color: "#2ecc71" }}>✨ Teljesen új anyagtípus regisztrálása</h3>
          <form onSubmit={handleCreateNewItem} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
              <input
                style={inputS}
                placeholder="Gyártó (pl. Fisher, Gree)"
                value={newItemData.brand}
                onChange={(e) => setNewItemData({ ...newItemData, brand: e.target.value })}
              />
              <input
                style={inputS}
                placeholder="Típus / Megnevezés (pl. Comfort Plus 2,7)"
                value={newItemData.name}
                onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })}
              />
            </div>

            <input
              style={inputS}
              type="number"
              placeholder="Nettó eladási ár (Ft)"
              value={newItemData.price}
              onChange={(e) => setNewItemData({ ...newItemData, price: e.target.value })}
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

      {/* RAKTÁR LISTA ÉS KERESŐ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "15px" }}>
        <h2 style={{ color: "#fff", fontSize: "1.3rem", margin: 0 }}>
          Aktuális Raktárkészlet listája ({filteredItems.length} tétel):
        </h2>

        <div style={{ position: "relative", minWidth: "260px", flex: "1 1 260px", maxWidth: "400px" }}>
          <input
            type="text"
            placeholder="🔍 Keresés név, gyártó, gyári szám, SKU, nagyker..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              ...inputS,
              paddingRight: searchTerm ? "35px" : "10px",
              borderColor: "#4DA3FF",
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "#aaa",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              ✖
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filteredItems.length === 0 ? (
          <div style={{ background: "#1a1a1a", padding: "20px", textAlign: "center", color: "#888", borderRadius: "8px", border: "1px solid #333" }}>
            A keresési feltételeknek megfelelő termék nem található.
          </div>
        ) : (
          filteredItems.map((item) => {
            const serials = item.serialNumber ? item.serialNumber.split(", ").filter(Boolean) : [];
            const isExpanded = expandedItemId === item.id;
            const isEditing = editingItemId === item.id;

            const itemBrand = item.brand || "";

            return (
              <div key={item.id} style={{ background: "#1a1a1a", padding: "16px", borderRadius: "10px", border: isEditing ? "1px solid #f39c12" : "1px solid #333" }}>
                
                {!isEditing ? (
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
                        
                        <strong style={{ fontSize: "16px" }}>{item.name || "Névtelen termék"}</strong>

                        {item.sku && (
                          <span style={{ background: "#0f2b48", color: "#64b5f6", border: "1px solid #1e88e5", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>
                            SKU: {item.sku}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: "12px", color: "#aaa", marginTop: "8px" }}>
                        <span style={{ color: "#f39c12", fontWeight: "bold" }}>Nagyker: {item.supplier || "Nincs"}</span>
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
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ color: "#f39c12", fontWeight: "bold", fontSize: "14px" }}>✏️ Termék adatainak módosítása:</div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
                      <div>
                        <label style={labelS}>Gyártó / Márka:</label>
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
                      const cleanSn = sn?.trim();
                      return (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", padding: "6px 0", borderBottom: idx !== serials.length - 1 ? "1px solid #222" : "none" }}>
                          <div>
                            <span>• <code style={{ color: "#2ecc71" }}>{cleanSn}</code></span>
                            <span style={{ color: "#aaa", fontSize: "11px", marginLeft: "10px" }}>🏢 {src || "Ismeretlen"}</span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => executeDeleteSerial(item.id, cleanSn)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#e74c3c",
                              cursor: "pointer",
                              fontSize: "14px",
                              padding: "2px 6px",
                            }}
                            title="Gyári szám törlése"
                          >
                            ❌
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const panelCard = { background: "#141414", padding: "20px", borderRadius: "12px", border: "1px solid #222" };
const labelS = { fontSize: "12px", color: "#aaa", display: "block", marginBottom: "6px" };
const inputS = { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #333", background: "#222", color: "#fff", boxSizing: "border-box" as const };
const btnS = { padding: "12px", border: "none", borderRadius: "6px", color: "#000", fontWeight: "bold" as const, cursor: "pointer", marginTop: "5px" };
