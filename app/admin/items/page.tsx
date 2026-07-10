"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "navigation";

export default function AdminItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
  
  // ÚJ: Kiválasztási üzemmód (create = teljesen új, add_stock = meglévő bővítése)
  const [formMode, setFormMode] = useState<"create" | "add_stock">("create");
  const [selectedItemId, setSelectedItemId] = useState<string>("");

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

  // Számolja a darabszámot beírás közben
  useEffect(() => {
    if (formData.serialNumber.trim()) {
      const count = formData.serialNumber.split(",").map(s => s.trim()).filter(s => s.length > 0).length;
      setFormData(prev => ({ ...prev, stock: count.toString() }));
    }
  }, [formData.serialNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let res;
    if (editingId) {
      // Sima szerkesztés mentése
      res = await fetch("/api/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, id: editingId, price: Number(formData.price), stock: Number(formData.stock) }),
      });
    } else if (formMode === "add_stock") {
      // MEGLÉVŐ HÖZ HOZZÁADÁS
      res = await fetch("/api/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_stock",
          id: Number(selectedItemId),
          serialNumber: formData.serialNumber,
          supplier: formData.supplier,
          stock: Number(formData.stock)
        }),
      });
    } else {
      // TELJESEN ÚJ LÉTREHOZÁSA
      res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, price: Number(formData.price), stock: Number(formData.stock) }),
      });
    }

    if (res && res.ok) {
      setFormData({ name: "", price: "", sku: "", serialNumber: "", stock: "0", supplier: "" });
      setEditingId(null);
      setSelectedItemId("");
      loadItems();
    }
    setLoading(false);
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setFormMode("create");
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
      
      {/* FŐOLDAL GOMB */}
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => router.push("/")} style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #444", background: "#333", color: "#fff", cursor: "pointer", fontWeight: "bold" }}>
          HN Főoldal
        </button>
      </div>

      <h1 style={{ marginBottom: "25px", color: "#fff", fontSize: "1.8rem" }}>📦 Raktárkészlet kezelése</h1>

      {/* MÓDVÁLASZTÓ FÜLEK (Csak ha nem szerkesztünk épp) */}
      {!editingId && (
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <button 
            onClick={() => { setFormMode("create"); setFormData({ name: "", price: "", sku: "", serialNumber: "", stock: "0", supplier: "" }); }}
            style={{ ...tabBtn, background: formMode === "create" ? "#2ecc71" : "#333" }}
          >
            ➕ Új anyagtípus regisztrálása
          </button>
          <button 
            onClick={() => { setFormMode("add_stock"); setFormData({ name: "Kiválasztott", price: "0", sku: "", serialNumber: "", stock: "0", supplier: "" }); }}
            style={{ ...tabBtn, background: formMode === "add_stock" ? "#3498db" : "#333" }}
          >
            📥 Meglévő tétel bővítése (Bevételezés)
          </button>
        </div>
      )}

      {/* DINAMIKUS ŰRLAP KÁRTYA */}
      <div style={formCard(!!editingId, formMode)}>
        <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#333" }}>
          {editingId ? "✏️ Tétel módosítása" : formMode === "create" ? "➕ Új tétel rögzítése" : "📥 Készlet hozzáadása meglévő anyaghoz"}
        </h3>
        
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "15px", width: "100%" }}>
          <div style={responsiveFormGrid}>
            
            {/* HA BŐVÍTÉS VAN: LENYÍLÓ LISTA JELENIK MEG */}
            {formMode === "add_stock" && !editingId ? (
              <div style={{ gridColumn: "span 1" }}>
                <label style={labelS}>Válaszd ki a raktáron lévő anyagot *</label>
                <select 
                  style={inputS} 
                  value={selectedItemId} 
                  onChange={e => setSelectedItemId(e.target.value)}
                  required
                >
                  <option value="">-- Válassz anyagot/klímát --</option>
                  {items.map(i => (
                    <option key={i.id} value={i.id}>{i.name} (Jelenleg: {i.stock} db)</option>
                  ))}
                </select>
              </div>
            ) : (
              // HA ÚJ VAN: SIMA SZÖVEGES BEVITEL
              <div>
                <label style={labelS}>Termék megnevezése *</label>
                <input style={inputS} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
            )}

            {formMode === "create" && (
              <>
                <div>
                  <label style={labelS}>Nettó eladási ár (Ft) *</label>
                  <input style={inputS} type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                </div>
                <div>
                  <label style={labelS}>Cikkszám (SKU)</label>
                  <input style={inputS} value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                </div>
              </>
            )}

            <div>
              <label style={labelS}>Gyári számok <span style={{color: "#2980b9", textTransform: "none"}}>(Formátum: SN123@Nagyker, SN124@Nagyker)</span></label>
              <input style={inputS} placeholder="pl. SN992@GreeKft, SN993@GreeKft" value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} />
            </div>

            <div>
              <label style={labelS}>Hozzáadni kívánt Mennyiség (db)</label>
              <input style={inputS} type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} disabled={!!formData.serialNumber.trim()} />
            </div>

            <div>
              <label style={labelS}>{formMode === "add_stock" ? "Beszállító ehhez a szállítmányhoz" : "Alapértelmezett Beszerzési forrás"}</label>
              <input style={inputS} placeholder="pl. Sinclair nagyker" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button type="submit" disabled={loading || (formMode === "add_stock" && !selectedItemId && !editingId)} style={{ ...btnS, background: editingId ? "#e67e22" : formMode === "add_stock" ? "#3498db" : "#2ecc71", flex: 1 }}>
              {editingId ? "Módosítás Mentése" : formMode === "add_stock" ? "Készlet bevételezése" : "Rögzítés"}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setFormData({ name: "", price: "", sku: "", serialNumber: "", stock: "0", supplier: "" }); }} style={{ ...btnS, background: "#95a5a6" }}>
                Mégse
              </button>
            )}
          </div>
        </form>
      </div>

      {/* RAKTÁR LISTA */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {items.map(item => {
          const serials = item.serialNumber ? item.serialNumber.split(", ").filter(Boolean) : [];
          const isExpanded = expandedItemId === item.id;

          return (
            <div key={item.id} style={{ background: "#1a1a1a", borderRadius: "12px", padding: "16px", border: "1px solid #333", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <div style={{ fontWeight: "bold", fontSize: "16px", color: "#fff" }}>{item.name}</div>
                <div style={{ fontSize: "12px", color: "#aaa" }}>
                  SKU: <span style={{ color: "#fff" }}>{item.sku || "Nincs"}</span>
                  {serials.length > 0 && (
                    <span onClick={() => setExpandedItemId(isExpanded ? null : item.id)} style={{ color: "#3498db", marginLeft: "8px", cursor: "pointer", textDecoration: "underline" }}>
                      {isExpanded ? "🔍 Gyári számok elrejtése" : `🔍 Gyári számok kilistázása (${serials.length} db)`}
                    </span>
                  )}
                </div>
              </div>

              {isExpanded && serials.length > 0 && (
                <div style={{ background: "#111", padding: "12px", borderRadius: "8px", border: "1px dashed #444" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {serials.map((rawSn: string, index: number) => {
                      const [sn, src] = rawSn.split("@");
                      return (
                        <div key={index} style={{ fontSize: "13px", color: "#fff", display: "flex", justifyContent: "space-between", background: "#181818", padding: "6px 10px", borderRadius: "4px" }}>
                          <span><span style={{ color: "#2ecc71" }}>•</span> <strong>{sn}</strong></span>
                          <span style={{ fontSize: "11px", background: "#2c3e50", color: "#bdc3c7", padding: "2px 6px", borderRadius: "4px" }}>🏢 {src || item.supplier || "Nincs megadva"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", background: "#222", padding: "10px 14px", borderRadius: "8px" }}>
                <div><span style={{ fontSize: "12px", color: "#aaa", display: "block" }}>KÉSZLET</span><span style={{ color: item.stock > 0 ? "#2ecc71" : "#e74c3c", fontWeight: "bold" }}>{item.stock} db</span></div>
                <div><span style={{ fontSize: "12px", color: "#aaa", display: "block" }}>FŐ FORRÁS</span><span style={{ color: "#ccc" }}>{item.supplier || "-"}</span></div>
                <div style={{ textAlign: "right" }}><span style={{ fontSize: "12px", color: "#aaa", display: "block" }}>ÁR</span><span style={{ color: "#fff", fontWeight: "bold" }}>{item.price.toLocaleString()} Ft</span></div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "15px", borderTop: "1px solid #2a2a2a", paddingTop: "10px" }}>
                <button onClick={() => startEdit(item)} style={iconBtn}>✏️ Szerkesztés</button>
                <button onClick={async () => { if(confirm("Törlöd?")) { await fetch(`/api/items?id=${item.id}`, {method: "DELETE"}); loadItems(); } }} style={{ ...iconBtn, color: "#e74c3c" }}>🗑️ Törlés</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// STÍLUSOK
const formCard = (isEdit: boolean, mode: string) => ({ 
  background: "#fff", 
  padding: "20px 16px", 
  borderRadius: "12px", 
  marginBottom: "30px", 
  border: isEdit ? "2px solid #e67e22" : mode === "add_stock" ? "2px solid #3498db" : "2px solid #2ecc71",
  boxSizing: "border-box" as const, width: "100%"
});
const tabBtn = { padding: "10px 15px", border: "none", borderRadius: "6px", color: "#fff", fontWeight: "bold" as const, cursor: "pointer", fontSize: "13px" };
const responsiveFormGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "15px", width: "100%" };
const inputS = { width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #ccc", color: "#333", background: "#fff", fontSize: "15px" };
const labelS = { fontSize: "11px", fontWeight: "bold" as const, color: "#555", marginBottom: "5px", display: "block" };
const btnS = { padding: "14px", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" as const };
const iconBtn = { background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: "#3498db", fontWeight: "bold" };
