"use client";

import React, { useState, useEffect } from "react";

interface SerialItem {
  sn: string;
  src?: string;
}

interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  brand?: string;
  model?: string;
  stock?: number;
  serialNumber?: string; // JSON tömb stringként vagy sima vesszővel elválasztott lista
}

interface Unit {
  id: string;
  brand: string;
  model: string;
  serial: string;
  location: string;
  installation: string;
  status: string;
}

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  units?: Unit[];
}

export default function ClientDetailsPage({ params }: { params: { id: string } }) {
  const [client, setClient] = useState<Client | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form állapotok (Gép hozzáadása / szerkesztése)
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);

  const [status, setStatus] = useState("INSTALLED");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [availableSerials, setAvailableSerials] = useState<SerialItem[]>([]);

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [location, setLocation] = useState("");
  const [installation, setInstallation] = useState("");

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Ügyfél adatok betöltése
      const clientRes = await fetch(`/api/clients/${params.id}`);
      if (clientRes.ok) {
        const clientData = await clientRes.json();
        setClient(clientData);
      }

      // Raktárkészlet betöltése
      const invRes = await fetch("/api/items");
      if (invRes.ok) {
        const invData = await invRes.json();
        setInventoryItems(invData);
      }
    } catch (err) {
      console.error("Hiba az adatok betöltésekor:", err);
    } finally {
      setLoading(false);
    }
  };

  // Raktári cikk kiválasztásának kezelése
  const handleInventorySelect = (itemId: string) => {
    setSelectedItemId(itemId);
    setSerial("");
    setAvailableSerials([]);

    if (!itemId) {
      setBrand("");
      setModel("");
      return;
    }

    const item = inventoryItems.find((i) => i.id === itemId);
    if (item) {
      setBrand(item.brand || item.name);
      setModel(item.model || "");

      // Gyári számok / Cikkszámok kinyerése a kiválasztott termékből
      if (item.serialNumber) {
        try {
          // Ha JSON formátumban van tárolva
          const parsed = JSON.parse(item.serialNumber);
          if (Array.isArray(parsed)) {
            const list: SerialItem[] = parsed.map((s: any) =>
              typeof s === "string" ? { sn: s } : { sn: s.sn || s.serial, src: s.src }
            );
            setAvailableSerials(list);
          }
        } catch {
          // Ha sima vesszővel/újsorral elválasztott string
          const list: SerialItem[] = item.serialNumber
            .split(/[\n,]+/)
            .map((s) => s.trim())
            .filter(Boolean)
            .map((sn) => ({ sn }));
          setAvailableSerials(list);
        }
      }
    }
  };

  const handleOpenNewUnit = () => {
    setEditingUnitId(null);
    setStatus("INSTALLED");
    setSelectedItemId("");
    setAvailableSerials([]);
    setBrand("");
    setModel("");
    setSerial("");
    setLocation("");
    setInstallation(new Date().toISOString().split("T")[0]);
    setShowUnitForm(true);
  };

  const handleSubmitUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    const payload = {
      clientId: client.id,
      brand,
      model,
      serial,
      location,
      installation,
      status,
      inventoryItemId: selectedItemId || undefined,
    };

    try {
      const url = editingUnitId ? `/api/units/${editingUnitId}` : "/api/units";
      const method = editingUnitId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowUnitForm(false);
        fetchData();
      } else {
        alert("Hiba történt a mentés során.");
      }
    } catch (err) {
      console.error(err);
      alert("Hiba a hálózati kapcsolatban.");
    }
  };

  if (loading) return <div style={{ color: "#fff", padding: "20px" }}>Betöltés...</div>;
  if (!client) return <div style={{ color: "#fff", padding: "20px" }}>Ügyfél nem található.</div>;

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto", color: "#e0e0e0" }}>
      {/* ÜGYFÉL ADATLAP KÁRTYA */}
      <div style={cardS}>
        <h2 style={{ marginTop: 0, color: "#fff" }}>👤 {client.name}</h2>
        <p><strong>Cím:</strong> {client.address || "-"}</p>
        <p><strong>Telefon:</strong> {client.phone || "-"}</p>
        <p><strong>E-mail:</strong> {client.email || "-"}</p>
      </div>

      {/* GÉPEK LISTÁJA */}
      <div style={{ marginTop: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3>❄️ Ügyfél gépei ({client.units?.length || 0} db)</h3>
          <button onClick={handleOpenNewUnit} style={btnGreen}>
            ➕ Új gép rögzítése
          </button>
        </div>

        {/* ŰRLAP RÖGZÍTÉSHEZ / MÓDOSÍTÁSHOZ */}
        {showUnitForm && (
          <div style={formBoxS}>
            <h3 style={{ marginTop: 0, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
              {editingUnitId ? "✏️ Gép módosítása" : "➕ Új gép rögzítése"}
            </h3>

            <form onSubmit={handleSubmitUnit} style={{ display: "grid", gap: "16px" }}>
              {/* GÉP TÍPUSA SELECTOR */}
              <div>
                <label style={labS}>Gép típusa / Eredete</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputS}>
                  <option value="INSTALLED">🆕 Telepítendő (Saját eladás / Raktárból)</option>
                  <option value="SERVICE_ONLY">🔵 Hozott gép (Csak szerviz / Napló)</option>
                </select>
              </div>

              {/* RAKTÁR KIVÁLASZTÓ BLOKK (Csak új gép és Saját eladás esetén) */}
              {!editingUnitId && status === "INSTALLED" && (
                <div style={inventoryCardS}>
                  <div style={{ fontWeight: "bold", color: "#2ecc71", marginBottom: "8px", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                    📦 Választás raktárkészletből
                  </div>

                  <div style={{ display: "grid", gap: "12px" }}>
                    {/* 1. KÉSZLETEN LÉVŐ CIKK KIVÁLASZTÁSA */}
                    <div>
                      <label style={labSubS}>Raktári cikk / Anyag</label>
                      <select 
                        value={selectedItemId} 
                        onChange={(e) => handleInventorySelect(e.target.value)} 
                        style={{ ...inputS, borderColor: selectedItemId ? "#2ecc71" : "#444" }}
                      >
                        <option value="">-- Válassz a raktárból (opcionális) --</option>
                        {inventoryItems
                          .filter((item) => (item.stock || 0) > 0)
                          .map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} {item.sku ? `[${item.sku}]` : ""} — Készlet: {item.stock} db
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* 2. SPECIFIKUS CIKKSZÁM / GYÁRI SZÁM KIVÁLASZTÁSA (Ha van a termékhez) */}
                    {selectedItemId && (
                      <div style={serialSelectionBoxS}>
                        <label style={{ ...labSubS, color: "#3498db" }}>
                          🔢 Választható specifikus cikkszámok / Gyári számok:
                        </label>
                        {availableSerials.length > 0 ? (
                          <select 
                            value={serial} 
                            onChange={(e) => setSerial(e.target.value)} 
                            style={{ ...inputS, borderColor: "#3498db", backgroundColor: "#121a24" }}
                            required
                          >
                            <option value="">-- Melyik cikkszámú darabot építed be? --</option>
                            {availableSerials.map((s, idx) => (
                              <option key={idx} value={s.sn}>
                                S/N: {s.sn} {s.src ? `(Forrás: ${s.src})` : ""}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div style={{ fontSize: "13px", color: "#aaa", fontStyle: "italic", padding: "6px 0" }}>
                            ℹ️ Ehhez az anyaghoz nincs külön egyedi cikkszám rögzítve a raktárban. A mentéskor 1 db automatikusan levonódik a készletből.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* GYÁRTÓ ÉS MODELL (Automatikusan kitöltődik raktárból) */}
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label style={labS}>Gyártó / Márka</label>
                  <input 
                    placeholder="pl. Daikin" 
                    value={brand} 
                    onChange={e => setBrand(e.target.value)} 
                    style={inputS} 
                    required 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labS}>Modell / Típus</label>
                  <input 
                    placeholder="pl. Sensira 3.5kW" 
                    value={model} 
                    onChange={e => setModel(e.target.value)} 
                    style={inputS} 
                    required 
                  />
                </div>
              </div>

              {/* GYÁRI SZÁM ÉS HELYSZÍN */}
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label style={labS}>Gyári szám / Cikkszám</label>
                  <input 
                    placeholder="S/N kód" 
                    value={serial} 
                    onChange={e => setSerial(e.target.value)} 
                    style={inputS} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labS}>Telepítés Helyszíne</label>
                  <input 
                    placeholder="pl. Nappali / Hálószoba" 
                    value={location} 
                    onChange={e => setLocation(e.target.value)} 
                    style={inputS} 
                  />
                </div>
              </div>

              {/* TELEPÍTÉS DÁTUMA */}
              <div>
                <label style={labS}>Telepítés / Beépítés dátuma:</label>
                <input 
                  type="date" 
                  value={installation} 
                  onChange={e => setInstallation(e.target.value)} 
                  style={inputS} 
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="submit" style={{ ...btnGreen, flex: 1, padding: "14px" }}>
                  💾 GÉP MENTÉSE ÉS RAKTÁR FRISSÍTÉSE
                </button>
                <button type="button" onClick={() => setShowUnitForm(false)} style={btnCancel}>
                  Mégse
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MEGGLÉVŐ GÉPEK KÁRTYÁI */}
        <div style={{ display: "grid", gap: "12px" }}>
          {client.units && client.units.length > 0 ? (
            client.units.map((unit) => (
              <div key={unit.id} style={unitCardS}>
                <div>
                  <h4 style={{ margin: "0 0 4px 0", color: "#3498db" }}>
                    {unit.brand} {unit.model}
                  </h4>
                  <div style={{ fontSize: "13px", color: "#aaa" }}>
                    <span>📍 {unit.location || "Nincs megadva helyszín"}</span> | 
                    <span> S/N: {unit.serial || "-"}</span>
                  </div>
                </div>
                <div style={{ fontSize: "12px", background: "#222", padding: "4px 8px", borderRadius: "4px" }}>
                  {unit.installation ? new Date(unit.installation).toLocaleDateString("hu-HU") : "-"}
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: "#777", fontStyle: "italic", padding: "10px 0" }}>
              Még nincs rögzítve gép ehhez az ügyfélhez.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* STÍLUSOK */
const cardS: React.CSSProperties = {
  background: "#1e1e1e",
  borderRadius: "12px",
  padding: "20px",
  border: "1px solid #333",
};

const formBoxS: React.CSSProperties = {
  background: "#181818",
  border: "1px solid #333",
  borderRadius: "12px",
  padding: "20px",
  marginBottom: "20px",
};

const inventoryCardS: React.CSSProperties = {
  background: "#081c10",
  border: "1px solid #1e5e34",
  borderRadius: "12px",
  padding: "16px",
  boxSizing: "border-box",
};

const serialSelectionBoxS: React.CSSProperties = {
  background: "#0d1b2a",
  border: "1px solid #1c3d5a",
  borderRadius: "10px",
  padding: "12px",
  marginTop: "4px",
};

const unitCardS: React.CSSProperties = {
  background: "#252525",
  padding: "14px",
  borderRadius: "8px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  border: "1px solid #383838",
};

const labS: React.CSSProperties = {
  fontSize: "13px",
  color: "#ccc",
  marginBottom: "4px",
  display: "block",
};

const labSubS: React.CSSProperties = {
  fontSize: "12px",
  color: "#2ecc71",
  fontWeight: "bold",
  marginBottom: "6px",
  display: "block",
};

const inputS: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #444",
  backgroundColor: "#2a2a2a",
  color: "#fff",
  boxSizing: "border-box",
};

const btnGreen: React.CSSProperties = {
  backgroundColor: "#27ae60",
  color: "#fff",
  border: "none",
  padding: "10px 16px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
};

const btnCancel: React.CSSProperties = {
  backgroundColor: "#444",
  color: "#fff",
  border: "none",
  padding: "10px 16px",
  borderRadius: "6px",
  cursor: "pointer",
};
