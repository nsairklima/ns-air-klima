"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const Id = params?.id;

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // --- ÜGYFÉL SZERKESZTÉS ÁLLAPOT ---
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editClientData, setEditClientData] = useState({ name: "", email: "", phone: "", address: "" });

  // --- GÉP (UNIT) FORM ÁLLAPOTOK ---
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("INSTALLED");
  const [installation, setInstallation] = useState("");

  const loadClientData = async () => {
    try {
      const res = await fetch(`/api/clients/${Id}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setClient(data);
        setEditClientData({
          name: data.name,
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || ""
        });
      }
    } catch (err) {
      console.error("Hiba az adatok betöltésekor:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (Id) loadClientData(); }, [Id]);

  const handleUpdateClient = async () => {
    const res = await fetch(`/api/clients/${Id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editClientData),
    });
    if (res.ok) { setIsEditingClient(false); loadClientData(); }
  };

  const handleDeleteClient = async () => {
    if (!confirm("⚠️ Biztosan törlöd az ügyfelet?")) return;
    const res = await fetch(`/api/clients/${Id}`, { method: "DELETE" });
    if (res.ok) router.push("/clients");
  };

  const handleSubmitUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { 
      brand, model, serialNumber: serial, location, status,
      installation: installation ? new Date(installation).toISOString() : null 
    };
    const url = editingUnitId ? `/api/clients/${Id}/units/${editingUnitId}` : `/api/clients/${Id}/units`;
    const res = await fetch(url, {
      method: editingUnitId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) { resetUnitForm(); loadClientData(); }
  };

  const handleSetStatus = async (unitId: number, newStatus: string) => {
    const res = await fetch(`/api/clients/${Id}/units/${unitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, installation: new Date().toISOString() }),
    });
    if (res.ok) await loadClientData();
  };

  const startEditUnit = (unit: any) => {
    setEditingUnitId(unit.id);
    setBrand(unit.brand); setModel(unit.model); setSerial(unit.serialNumber || "");
    setLocation(unit.location || ""); setStatus(unit.status || "INSTALLED");
    setInstallation(unit.installation ? new Date(unit.installation).toISOString().split('T')[0] : "");
    setShowUnitForm(true);
  };

  const resetUnitForm = () => {
    setEditingUnitId(null);
    setBrand(""); setModel(""); setSerial(""); setLocation(""); setInstallation("");
    setStatus("INSTALLED"); setShowUnitForm(false);
  };

  const handleDeleteUnit = async (unitId: number) => {
    if (!confirm("Törlöd ezt a gépet?")) return;
    const res = await fetch(`/api/clients/${Id}/units/${unitId}`, { method: "DELETE" });
    if (res.ok) loadClientData();
  };

  const handleDeleteQuote = async (quoteId: number) => {
    if (!confirm("Biztosan törlöd ezt az árajánlatot?")) return;
    const res = await fetch(`/api/quotes/${quoteId}`, { method: "DELETE" });
    if (res.ok) loadClientData();
  };

  if (loading) return <div style={containerStyle}>Betöltés...</div>;
  if (!client) return <div style={containerStyle}>Ügyfél nem található.</div>;

  return (
    <div style={containerStyle}>
      {/* NAVIGÁCIÓ */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "25px" }}>
        <button onClick={() => router.push("/clients")} style={navBtn}>⬅️ Vissza</button>
        <button onClick={() => router.push("/")} style={navBtn}>🏠 Főoldal</button>
      </div>

      {/* ÜGYFÉL ADATOK - JAVÍTOTT OLVASHATÓSÁG */}
      <div style={headerS}>
        <div style={{ flex: 1 }}>
          {!isEditingClient ? (
            <>
              <h1 style={clientNameStyle}>{client.name}</h1>
              <div style={contactRow}>
                <span style={{ color: "#2ecc71", marginRight: "20px" }}>📞 {client.phone || "Nincs telefonszám"}</span>
                <span style={{ color: "#bbb" }}>✉️ {client.email || "Nincs email"}</span>
              </div>
              <div style={{ ...contactRow, marginTop: "8px", color: "#fff", fontSize: "16px" }}>
                🏠 {client.address || "Nincs cím megadva"}
              </div>
            </>
          ) : (
            <div style={editBoxS}>
              <h3 style={{marginTop: 0, color: "#fff"}}>Ügyfél módosítása</h3>
              <input style={inputS} value={editClientData.name} onChange={e => setEditClientData({...editClientData, name: e.target.value})} placeholder="Név" />
              <input style={inputS} value={editClientData.phone} onChange={e => setEditClientData({...editClientData, phone: e.target.value})} placeholder="Telefon" />
              <input style={inputS} value={editClientData.email} onChange={e => setEditClientData({...editClientData, email: e.target.value})} placeholder="Email" />
              <input style={inputS} value={editClientData.address} onChange={e => setEditClientData({...editClientData, address: e.target.value})} placeholder="Cím" />
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          {!isEditingClient ? (
            <>
              <button onClick={() => setIsEditingClient(true)} style={btnEditHeader}>✏️ Szerkesztés</button>
              <button onClick={handleDeleteClient} style={btnDeleteHeader}>🗑️</button>
            </>
          ) : (
            <>
              <button onClick={handleUpdateClient} style={btnGreen}>✅ Mentés</button>
              <button onClick={() => setIsEditingClient(false)} style={btnCancel}>Mégse</button>
            </>
          )}
        </div>
      </div>

      {/* GÉPEK SZEKCIÓ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, color: "#fff" }}>🛠️ Gépek kezelése</h2>
        <button onClick={() => { if(showUnitForm) resetUnitForm(); else setShowUnitForm(true); }} style={btnGreen}>
          {showUnitForm ? "Mégse" : "+ Új gép felvétele"}
        </button>
      </div>

      {showUnitForm && (
        <div style={formBoxS}>
          <h3 style={{ marginTop: 0, color: "#fff" }}>{editingUnitId ? "✏️ Gép módosítása" : "➕ Új gép rögzítése"}</h3>
          <form onSubmit={handleSubmitUnit} style={{ display: "grid", gap: "12px" }}>
            <div>
              <label style={labS}>Gép típusa:</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputS}>
                <option value="INSTALLED">🆕 Telepítendő (Saját eladás)</option>
                <option value="SERVICE_ONLY">🔵 Hozott gép (Csak javítás/napló)</option>
              </select>
            </div>
            <div style={{display: "flex", gap: "10px"}}>
              <div style={{flex: 1}}>
                <label style={labS}>Gyártó</label>
                <input placeholder="pl. Daikin" value={brand} onChange={e => setBrand(e.target.value)} style={inputS} required />
              </div>
              <div style={{flex: 1}}>
                <label style={labS}>Modell</label>
                <input placeholder="pl. Sensira" value={model} onChange={e => setModel(e.target.value)} style={inputS} required />
              </div>
            </div>
            <div style={{display: "flex", gap: "10px"}}>
              <div style={{flex: 1}}>
                <label style={labS}>Gyári szám</label>
                <input placeholder="S/N kód" value={serial} onChange={e => setSerial(e.target.value)} style={inputS} />
              </div>
              <div style={{flex: 1}}>
                <label style={labS}>Helyszín</label>
                <input placeholder="pl. Nappali" value={location} onChange={e => setLocation(e.target.value)} style={inputS} />
              </div>
            </div>
            <div>
              <label style={labS}>Dátum:</label>
              <input type="date" value={installation} onChange={e => setInstallation(e.target.value)} style={inputS} />
            </div>
            <button type="submit" style={btnGreen}>MENTÉS</button>
          </form>
        </div>
      )}

      {/* GÉPEK LISTÁJA */}
      <div style={{ display: "grid", gap: "12px", marginBottom: "50px" }}>
        {client.units?.length > 0 ? (
          client.units.map((unit: any) => (
            <div key={unit.id} style={unitCard}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <strong style={{ fontSize: "18px", color: "#000" }}>{unit.brand} {unit.model}</strong>
                  <span style={{
                    fontSize: "12px", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold",
                    background: unit.status === "SERVICE_ONLY" ? "#e3f2fd" : (unit.installation ? "#e8f5e9" : "#fff3e0"),
                    color: unit.status === "SERVICE_ONLY" ? "#1976d2" : (unit.installation ? "#2e7d32" : "#ef6c00"),
                  }}>
                    {unit.status === "SERVICE_ONLY" ? "🔵 Hozott gép" : (unit.installation ? "✅ Telepítve" : "⏳ Telepítésre vár")}
                  </span>
                </div>
                <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
                  SN: {unit.serialNumber || "---"} | Hely: {unit.location || "Nincs megadva"}
                  {unit.installation && <span> | 📅 {new Date(unit.installation).toLocaleDateString('hu-HU')}</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {unit.status === "INSTALLED" && !unit.installation && (
                  <button onClick={() => handleSetStatus(unit.id, "INSTALLED")} style={btnGreenSmall}>✅ Telepítés kész</button>
                )}
                <button onClick={() => router.push(`/clients/${Id}/unit/${unit.id}`)} style={btnBlueSmall}>Napló →</button>
                <button onClick={() => startEditUnit(unit)} style={btnOrangeSmall}>✏️</button>
                <button onClick={() => handleDeleteUnit(unit.id)} style={btnRedSmall}>🗑️</button>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: "#666", fontStyle: "italic" }}>Nincs még gép rögzítve.</p>
        )}
      </div>

      {/* ÁRAJÁNLATOK */}
      <div>
        <h2 style={{ borderBottom: "1px solid #333", paddingBottom: "10px", marginBottom: "20px", color: "#fff" }}>📄 Árajánlatok</h2>
        <div style={{ display: "grid", gap: "10px" }}>
          {client.quotes?.length > 0 ? (
            client.quotes.map((quote: any) => (
              <div key={quote.id} style={quoteCard}>
                <div>
                  <strong style={{ color: "#000" }}>{quote.title || "Ajánlat"}</strong>
                  <div style={{ fontSize: "12px", color: "#666" }}>Státusz: {quote.status}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <div style={{ fontWeight: "bold", fontSize: "16px", color: "#000" }}>{Number(quote.grossTotal).toLocaleString()} Ft</div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => router.push(`/quotes/${quote.id}`)} style={btnOrangeSmall}>✏️</button>
                    <button onClick={() => handleDeleteQuote(quote.id)} style={btnRedSmall}>🗑️</button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: "#666", fontStyle: "italic" }}>Nincs korábbi ajánlat.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// --- JAVÍTOTT STÍLUSOK SÖTÉT MÓDHOZ ---

const containerStyle: React.CSSProperties = {
  backgroundColor: "#000",
  minHeight: "100vh",
  padding: "24px",
  maxWidth: "1000px",
  margin: "0 auto",
  fontFamily: "sans-serif",
  color: "#fff"
};

const clientNameStyle: React.CSSProperties = {
  fontSize: "32px",
  margin: "0 0 10px 0",
  color: "#ffffff",
  fontWeight: "bold"
};

const contactRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  fontSize: "15px",
  fontWeight: "500"
};

const headerS: React.CSSProperties = {
  padding: "20px 0",
  marginBottom: "30px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  borderBottom: "1px solid #333"
};

const navBtn = {
  padding: "8px 15px",
  borderRadius: "8px",
  border: "none",
  background: "#fff",
  color: "#000",
  cursor: "pointer",
  fontWeight: "bold" as const,
  fontSize: "14px"
};

const inputS = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #444",
  backgroundColor: "#222",
  color: "#fff",
  outline: "none",
  boxSizing: "border-box" as const
};

const editBoxS = { display: "grid", gap: "10px", width: "100%", background: "#111", padding: "20px", borderRadius: "15px", border: "1px solid #333" };
const formBoxS = { background: "#111", padding: "20px", borderRadius: "12px", marginBottom: "30px", border: "1px solid #2ecc71" };

const btnEditHeader = { background: "#e3f2fd", color: "#1976d2", border: "none", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" as const };
const btnDeleteHeader = { background: "#ffebee", color: "#c62828", border: "none", padding: "10px 15px", borderRadius: "10px", cursor: "pointer" };

const btnGreen = { background: "#2ecc71", color: "#fff", border: "none", padding: "12px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" as const };
const btnCancel = { background: "#444", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px", cursor: "pointer" };

const unitCard = { padding: "16px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", marginBottom: "10px" };
const quoteCard = { padding: "15px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff" };

const labS = { fontSize: "12px", color: "#aaa", fontWeight: "bold" as const, marginBottom: "4px", display: "block" };
const btnBlueSmall = { background: "#3498db", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" as const };
const btnGreenSmall = { background: "#2ecc71", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" as const };
const btnOrangeSmall = { background: "#f39c12", color: "#fff", border: "none", padding: "8px 12px", borderRadius: "8px", cursor: "pointer" };
const btnRedSmall = { background: "#ffebee", color: "#e74c3c", border: "none", padding: "8px 12px", borderRadius: "8px", cursor: "pointer" };
