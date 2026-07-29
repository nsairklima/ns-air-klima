"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";

interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  serials?: string[];
}

interface Unit {
  id: number;
  brand: string;
  model: string;
  serialNumber?: string;
  location?: string;
  status: string;
  installation?: string;
}

interface Quote {
  id: number;
  quoteNumber: string;
  total: number;
  status: string;
  createdAt: string;
}

interface Client {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  units: Unit[];
  quotes: Quote[];
}

// Custom Select Komponens
function CustomSelect({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: { label: string; value: string | number }[];
  value: string | number;
  onChange: (val: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((o) => String(o.value) === String(value));

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          ...inputS,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          background: "#18181b",
        }}
      >
        <span style={{ color: selectedOption ? "#fff" : "#71717a" }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span style={{ fontSize: "10px", color: "#a1a1aa" }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 999,
            backgroundColor: "#18181b",
            border: "1px solid #333",
            borderRadius: "10px",
            marginTop: "4px",
            maxHeight: "200px",
            overflowY: "auto",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(String(opt.value));
                setOpen(false);
              }}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                borderBottom: "1px solid #27272a",
                fontSize: "14px",
                color: String(opt.value) === String(value) ? "#2ecc71" : "#fff",
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const Id = resolvedParams.id;
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // Fejléc szerkesztési állapot
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cAddress, setCAddress] = useState("");

  // Gép form állapotok
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string>("");

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("INSTALLED");
  const [installation, setInstallation] = useState("");

  const loadClientData = useCallback(async () => {
    try {
      const res = await fetch(`/api/clients/${Id}`);
      if (!res.ok) throw new Error("Ügyfél nem található");
      const data: Client = await res.json();
      setClient(data);
      setCName(data.name || "");
      setCPhone(data.phone || "");
      setCAddress(data.address || "");
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [Id]);

  const loadInventory = useCallback(async () => {
    try {
      const res = await fetch("/api/items");
      if (res.ok) {
        const data = await res.json();
        setInventory(data);
      }
    } catch (err: unknown) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadClientData();
    loadInventory();
  }, [loadClientData, loadInventory]);

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/clients/${Id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cName, phone: cPhone, address: cAddress }),
      });
      if (!res.ok) throw new Error("Frissítés sikertelen");
      setIsEditingClient(false);
      await loadClientData();
      router.refresh();
    } catch (err: unknown) {
      alert("Hiba történt az ügyfél adatainak frissítésekor.");
      console.error(err);
    }
  };

  const handleDeleteClient = async () => {
    if (!confirm("Biztosan törölni szeretnéd ezt az ügyfelet a berendezéseivel együtt?")) return;
    try {
      const res = await fetch(`/api/clients/${Id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Törlés sikertelen");
      router.push("/clients");
      router.refresh();
    } catch (err: unknown) {
      alert("Hiba a törlés során.");
      console.error(err);
    }
  };

  const resetUnitForm = () => {
    setEditingUnitId(null);
    setSelectedItemId("");
    setBrand("");
    setModel("");
    setSerial("");
    setLocation("");
    setStatus("INSTALLED");
    setInstallation("");
    setShowUnitForm(false);
  };

  const handleEditUnitClick = (u: Unit) => {
    setEditingUnitId(u.id);
    setBrand(u.brand || "");
    setModel(u.model || "");
    setSerial(u.serialNumber || "");
    setLocation(u.location || "");
    setStatus(u.status || "INSTALLED");
    setInstallation(u.installation ? u.installation.substring(0, 10) : "");
    setShowUnitForm(true);
  };

  const handleSubmitUnit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      brand,
      model,
      serialNumber: serial,
      location,
      status,
      installation: installation ? new Date(installation).toISOString() : null,
      inventoryItemId: selectedItemId ? Number(selectedItemId) : null,
    };

    try {
      const url = editingUnitId
        ? `/api/clients/${Id}/units/${editingUnitId}`
        : `/api/clients/${Id}/units`;
      const res = await fetch(url, {
        method: editingUnitId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gép mentése sikertelen");

      // Megjegyzés: Ha a backend kezeli a raktárlevonást, ez a blokk elhagyható.
      if (!editingUnitId && selectedItemId && status === "INSTALLED") {
        await fetch("/api/items", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "deduct",
            id: Number(selectedItemId),
            deleteSerial: serial || null,
            qtyToDeduct: 1,
          }),
        });
        await loadInventory();
      }

      resetUnitForm();
      await loadClientData();
      router.refresh();
    } catch (err: unknown) {
      alert("Hiba történt a gép mentése során!");
      console.error(err);
    }
  };

  const handleDeleteUnit = async (unitId: number) => {
    if (!confirm("Biztosan törölni szeretnéd ezt a gépet?")) return;
    try {
      const res = await fetch(`/api/clients/${Id}/units/${unitId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Törlés sikertelen");
      await loadClientData();
      router.refresh();
    } catch (err: unknown) {
      alert("Hiba a gép törlésekor.");
      console.error(err);
    }
  };

  if (loading) return <div style={containerStyle}><p>Betöltés...</p></div>;
  if (!client) return <div style={containerStyle}><p>Ügyfél nem található.</p></div>;

  const selectedItemObj = inventory.find((i) => String(i.id) === selectedItemId);

  return (
    <div style={containerStyle}>
      {/* FEJLÉC ÉS ÜGYFÉL ADATOK */}
      <div style={headerS}>
        <div style={{ flex: 1 }}>
          <button style={{ ...navBtn, marginBottom: "15px" }} onClick={() => router.push("/clients")}>
            ← Vissza az ügyfelekhez
          </button>

          {!isEditingClient ? (
            <div>
              <h1 style={clientNameStyle}>{client.name}</h1>
              <div style={contactRow}>
                {client.phone && <span style={{ marginRight: "20px" }}>📞 {client.phone}</span>}
                {client.address && <span>📍 {client.address}</span>}
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateClient} style={editBoxS}>
              <label style={labS}>Név</label>
              <input
                style={inputS}
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                required
              />
              <label style={labS}>Telefonszám</label>
              <input
                style={inputS}
                value={cPhone}
                onChange={(e) => setCPhone(e.target.value)}
              />
              <label style={labS}>Cím</label>
              <input
                style={inputS}
                value={cAddress}
                onChange={(e) => setCAddress(e.target.value)}
              />
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="submit" style={btnGreen}>Mentés</button>
                <button type="button" style={btnCancel} onClick={() => setIsEditingClient(false)}>Mégse</button>
              </div>
            </form>
          )}
        </div>

        {!isEditingClient && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button style={btnEditHeader} onClick={() => setIsEditingClient(true)}>Szerkesztés</button>
            <button style={btnDeleteHeader} onClick={handleDeleteClient}>🗑️ Törlés</button>
          </div>
        )}
      </div>

      {/* BERENDEZÉSEK SZEKCIÓ */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h2>Telepített Berendezések ({client.units?.length || 0})</h2>
          <button
            style={showUnitForm ? btnCancel : btnGreen}
            onClick={() => {
              if (showUnitForm) resetUnitForm();
              else setShowUnitForm(true);
            }}
          >
            {showUnitForm ? "Mégse" : "+ Gép Hozzáadása"}
          </button>
        </div>

        {/* ÚJ/MÓDOSÍTÓ GÉP FORM */}
        {showUnitForm && (
          <form onSubmit={handleSubmitUnit} style={formBoxS}>
            <h3>{editingUnitId ? "Gép Szerkesztése" : "Új Gép Regisztrálása"}</h3>

            {!editingUnitId && (
              <div style={{ marginBottom: "20px" }}>
                <label style={labS}>Kiválasztás Raktárból (Választható)</label>
                <CustomSelect
                  placeholder="-- Válassz a raktárkészletből --"
                  options={inventory
                    .filter((i) => i.quantity > 0)
                    .map((i) => ({ label: `${i.name} (Raktáron: ${i.quantity} db)`, value: i.id }))}
                  value={selectedItemId}
                  onChange={(val) => {
                    setSelectedItemId(val);
                    const item = inventory.find((i) => String(i.id) === val);
                    if (item) {
                      setModel(item.name);
                    }
                  }}
                />
              </div>
            )}

            {selectedItemObj && (
              <div style={{ ...inventoryCardS, marginBottom: "20px" }}>
                <div style={inventoryHeaderS}>
                  <span>📦 Raktári téritem kiválasztva: {selectedItemObj.name}</span>
                </div>
                {selectedItemObj.serials && selectedItemObj.serials.length > 0 && (
                  <div style={serialSelectionBoxS}>
                    <label style={labS}>Válassz gyári számot a raktárból:</label>
                    <CustomSelect
                      placeholder="-- Szériaszám választása --"
                      options={selectedItemObj.serials.map((s) => ({ label: s, value: s }))}
                      value={serial}
                      onChange={(val) => setSerial(val)}
                    />
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "15px" }}>
              <div>
                <label style={labS}>Márka</label>
                <input style={inputS} placeholder="Pl. Daikin" value={brand} onChange={(e) => setBrand(e.target.value)} required />
              </div>
              <div>
                <label style={labS}>Modell / Típus</label>
                <input style={inputS} placeholder="Pl. Sensira 3.5kW" value={model} onChange={(e) => setModel(e.target.value)} required />
              </div>
              <div>
                <label style={labS}>Gyári Szám (S/N)</label>
                <input style={inputS} placeholder="Gyári szám" value={serial} onChange={(e) => setSerial(e.target.value)} />
              </div>
              <div>
                <label style={labS}>Telepítés Helye (Pl. Nappali)</label>
                <input style={inputS} placeholder="Helyszín" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <div>
                <label style={labS}>Státusz</label>
                <CustomSelect
                  placeholder="Státusz"
                  options={[
                    { label: "Telepítve (INSTALLED)", value: "INSTALLED" },
                    { label: "Szerviz alatt (IN_SERVICE)", value: "IN_SERVICE" },
                    { label: "Leszerelve (REMOVED)", value: "REMOVED" },
                  ]}
                  value={status}
                  onChange={(val) => setStatus(val)}
                />
              </div>
              <div>
                <label style={labS}>Telepítés Dátuma</label>
                <input style={inputS} type="date" value={installation} onChange={(e) => setInstallation(e.target.value)} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" style={btnGreen}>Mentés</button>
              <button type="button" style={btnCancel} onClick={resetUnitForm}>Mégse</button>
            </div>
          </form>
        )}

        {/* GÉPEK LISTÁJA */}
        {client.units?.length === 0 ? (
          <p style={{ color: "#888" }}>Nincs regisztrált berendezés.</p>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {client.units?.map((u) => (
              <div key={u.id} style={unitCard}>
                <div>
                  <h3 style={{ margin: "0 0 5px 0", color: "#111" }}>{u.brand} - {u.model}</h3>
                  <div style={{ fontSize: "13px", color: "#555" }}>
                    {u.serialNumber && <span style={{ marginRight: "15px" }}>S/N: <strong>{u.serialNumber}</strong></span>}
                    {u.location && <span>📍 {u.location}</span>}
                  </div>
                  {u.installation && (
                    <div style={{ fontSize: "12px", color: "#777", marginTop: "4px" }}>
                      Telepítve: {new Date(u.installation).toLocaleDateString("hu-HU")}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button style={btnOrangeSmall} onClick={() => handleEditUnitClick(u)}>Szerkesztés</button>
                  <button style={btnRedSmall} onClick={() => handleDeleteUnit(u.id)}>Törlés</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ÁRAJÁNLATOK SZEKCIÓ */}
      <div>
        <h2>Kapcsolódó Árajánlatok ({client.quotes?.length || 0})</h2>
        {client.quotes?.length === 0 ? (
          <p style={{ color: "#888" }}>Nincs kapcsolódó árajánlat.</p>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {client.quotes?.map((q) => (
              <div key={q.id} style={quoteCard}>
                <div>
                  <strong style={{ color: "#111" }}>#{q.quoteNumber}</strong>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {new Date(q.createdAt).toLocaleDateString("hu-HU")}
                  </div>
                </div>
                <div>
                  <span style={{ fontWeight: "bold", color: "#2ecc71", marginRight: "15px" }}>
                    {q.total?.toLocaleString()} Ft
                  </span>
                  <span style={{ fontSize: "12px", padding: "4px 8px", background: "#eee", borderRadius: "4px", color: "#333" }}>
                    {q.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- STÍLUSOK ---
const containerStyle: React.CSSProperties = {
  backgroundColor: "#000",
  minHeight: "100vh",
  maxWidth: "1000px",
  margin: "0 auto",
  padding: "20px",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  color: "#fff",
  width: "100%",
  boxSizing: "border-box",
};

const clientNameStyle: React.CSSProperties = {
  margin: "0 0 10px 0",
  color: "#ffffff",
  fontWeight: "bold",
};

const contactRow: React.CSSProperties = {
  display: "flex",
  fontSize: "15px",
  fontWeight: "500",
  color: "#aaa",
};

const headerS: React.CSSProperties = {
  padding: "20px 0",
  marginBottom: "30px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  borderBottom: "1px solid #333",
  width: "100%",
  boxSizing: "border-box",
};

const navBtn: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: "8px",
  border: "none",
  background: "#1e293b",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "14px",
};

const inputS: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "10px",
  border: "1px solid #333",
  backgroundColor: "#18181b",
  color: "#fff",
  outline: "none",
  fontSize: "15px",
  boxSizing: "border-box",
  display: "block",
};

const editBoxS: React.CSSProperties = {
  display: "grid",
  gap: "12px",
  width: "100%",
  background: "#111",
  padding: "15px",
  borderRadius: "15px",
  border: "1px solid #333",
  boxSizing: "border-box",
};

const formBoxS: React.CSSProperties = {
  background: "#121214",
  padding: "24px",
  borderRadius: "16px",
  marginBottom: "30px",
  border: "1px solid #27272a",
  boxSizing: "border-box",
};

const inventoryCardS: React.CSSProperties = {
  background: "#081a0e",
  border: "1px solid #144222",
  borderRadius: "12px",
  padding: "16px",
  boxSizing: "border-box",
};

const inventoryHeaderS: React.CSSProperties = {
  fontWeight: "600",
  color: "#4ade80",
  marginBottom: "12px",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const serialSelectionBoxS: React.CSSProperties = {
  background: "#0b1329",
  border: "1px solid #1e3a8a",
  borderRadius: "12px",
  padding: "14px",
};

const btnEditHeader: React.CSSProperties = {
  background: "#1e293b",
  color: "#38bdf8",
  border: "1px solid #0369a1",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "14px",
};

const btnDeleteHeader: React.CSSProperties = {
  background: "#3a1515",
  color: "#ff6b6b",
  border: "none",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "14px",
};

const btnGreen: React.CSSProperties = {
  background: "#2ecc71",
  color: "#000",
  border: "none",
  padding: "10px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "14px",
};

const btnCancel: React.CSSProperties = {
  background: "#444",
  color: "#fff",
  border: "none",
  padding: "10px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "14px",
};

const unitCard: React.CSSProperties = {
  padding: "16px",
  borderRadius: "12px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "#fff",
  boxSizing: "border-box",
};

const quoteCard: React.CSSProperties = {
  padding: "16px",
  borderRadius: "12px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "#fff",
  boxSizing: "border-box",
};

const labS: React.CSSProperties = {
  fontSize: "12px",
  color: "#a1a1aa",
  marginBottom: "6px",
  display: "block",
};

const btnOrangeSmall: React.CSSProperties = {
  background: "#f39c12",
  color: "#fff",
  border: "none",
  padding: "6px 12px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "bold",
};

const btnRedSmall: React.CSSProperties = {
  background: "#e74c3c",
  color: "#fff",
  border: "none",
  padding: "6px 12px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "bold",
};
