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
  const [isMobile, setIsMobile] = useState(false);

  // Mobilnézet figyelése
  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 768);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

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
    <div style={{ ...containerStyle, padding: isMobile ? "12px" : "24px" }}>
      {/* NAVIGÁCIÓ */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "25px" }}>
        <button onClick={() => router.push("/clients")} style={navBtn}>⬅️ Vissza</button>
        <button onClick={() => router.push("/")} style={navBtn}>🏠 Főoldal</button>
      </div>

      {/* ÜGYFÉL ADATOK */}
      <div style={{ ...headerS, flexDirection: isMobile ? "column" : "row", gap: "15px" }}>
        <div style={{ width: "100%", flex: 1 }}>
          {!isEditingClient ? (
            <>
              <h1 style={{ ...clientNameStyle, fontSize: isMobile ? "26px" : "32px" }}>{client.name}</h1>
              <div style={{ ...contactRow, flexDirection: isMobile ? "column" : "row", alignItems: "flex-start", gap: isMobile ? "6px" : "0" }}>
                <span style={{ color: "#2ecc71", marginRight: "20px" }}>📞 {client.phone || "Nincs telefonszám"}</span>
                <span style={{ color: "#bbb" }}>✉️ {client.email || "Nincs email"}</span>
              </div>
              <div style={{ ...contactRow, marginTop: "8px", color: "#fff", fontSize: "15px" }}>
                🏠 {client.address || "Nincs cím megadva"}
              </div>
            </>
          ) : (
            <div style={editBoxS}>
              <h3 style={{ marginTop: 0, color: "#fff" }}>Ügyfél módosítása</h3>
              <input style={inputS} value={editClientData.name} onChange={e => setEditClientData({...editClientData, name: e.target.value})} placeholder="Név" />
              <input style={inputS} value={editClientData.phone} onChange={e => setEditClientData({...editClientData, phone: e.target.value})} placeholder="Telefon" />
              <input style={inputS} value={editClientData.email} onChange={e => setEditClientData({...editClientData, email: e.target.value})} placeholder="Email" />
              <input style={inputS} value={editClientData.address} onChange={e => setEditClientData({...editClientData, address: e.target.value})} placeholder="Cím" />
            </div>
          )}
        </div>

        {/* Szerkesztő gombok a fejlécben */}
        <div style={{ display: "flex", gap: "10px", width: isMobile ? "100%" : "auto", justifyContent: "flex-end" }}>
          {!isEditingClient ? (
            <>
              <button onClick={() => setIsEditingClient(true)} style={{ ...btnEditHeader, flex: isMobile ? 1 : "none" }}>✏️ Szerkesztés</button>
              <button onClick={handleDeleteClient} style={btnDeleteHeader}>🗑️</button>
            </>
          ) : (
            <>
              <button onClick={handleUpdateClient} style={{ ...btnGreen, flex: isMobile ? 1 : "none" }}>✅ Mentés</button>
              <button onClick={() => setIsEditingClient(false)} style={{ ...btnCancel, flex: isMobile ? 1 : "none" }}>Mégse</button>
            </>
          )}
        </div>
      </div>

      {/* GÉPEK SZEKCIÓ CÍM */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "12px", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, color: "#fff", fontSize: isMobile ? "20px" : "24px" }}>🛠️ Gépek kezelése</h2>
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
            
            {/* Gyártó és Modell sor - mobilon egymás alá esnek */}
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <label style={labS}>Gyártó</label>
                <input placeholder="pl. Daikin" value={brand} onChange={e => setBrand(e.target.value)} style={inputS} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labS}>Modell</label>
                <input placeholder="pl. Sensira" value={model} onChange={e => setModel(e.target.value)} style={inputS} required />
              </div>
            </div>

            {/* Gyári szám és Helyszín sor - mobilon szintén egymás alá esnek */}
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <label style={labS}>Gyári szám</label>
                <input placeholder="S/N kód" value={serial} onChange={e => setSerial(e.target.value)} style={inputS} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labS}>Helyszín</label>
                <input placeholder="pl. Nappali" value={location} onChange={e => setLocation(e.target.value)} style={inputS} />
              </div>
            </div>

            <div>
              <label style={labS}>Dátum:</label>
              <input type="date" value={installation} onChange={e => setInstallation(e.target.value)} style={inputS} />
            </div>
            <button type="submit" style={{ ...btnGreen, width: "100%", padding: "14px" }}>GÉP MENTÉSE</button>
          </form>
        </div>
      )}

      {/* GÉPEK LISTÁJA */}
      <div style={{ display: "grid", gap: "12px", marginBottom: "50px" }}>
        {client.units?.length > 0 ? (
          client.units.map((unit: any) => (
            <div key={unit.id} style={{ ...unitCard, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <strong style={{ fontSize: "18px", color: "#000" }}>{unit.brand} {unit.model}</strong>
                  <span style={{
                    fontSize: "12px", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold",
                    background: unit.status === "SERVICE_ONLY" ? "#e3f2fd" : (unit.installation ? "#e8f5e9" : "#fff3e0"),
                    color: unit.status === "SERVICE_ONLY" ? "#1976d2" : (unit.installation ? "#2e7d32" : "#ef6c00"),
                  }}>
                    {unit.status === "SERVICE_ONLY" ? "🔵 Hozott gép" : (unit.installation ? "✅ Telepítve" : "⏳ Várakozik")}
                  </span>
                </div>
                <div style={{ fontSize: "13px", color: "#555", marginTop: "6px", lineHeight: "1.4" }}>
                  SN: {unit.serialNumber || "---"} | Hely: {unit.location || "Nincs megadva"}
                 {unit.installation && <span> {isMobile && <br />}📅 {new Date(unit.installation).toLocaleDateString('hu-HU')}</span>}
                </div>
              </div>

              {/* Gép akciógombok sora */}
              <div style={{ display: "flex", gap: "6px", width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "stretch" : "flex-end" }}>
                {unit.status === "INSTALLED" && !unit.installation && (
                  <button onClick={() => handleSetStatus(unit.id, "INSTALLED")} style={{ ...btnGreenSmall, flex: isMobile ? 1 : "none" }}>✅ Kész</button>
                )}
                <button onClick={() => router.push(`/clients/${Id}/unit/${unit.id}`)} style={{ ...btnBlueSmall, flex: isMobile ? 1 : "none", textAlign: "center" }}>Napló</button>
                <button onClick={() => startEditUnit(unit)} style={btnOrangeSmall}>✏️</button>
                <button onClick={() => handleDeleteUnit(unit.id)} style={btnRedSmall}>🗑️</button>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: "#666", fontStyle: "italic" }}>Nincs még gép rögzítve.</p>
        )}
      </div>

      {/* ÁRAJÁNLATOK SZEKCIÓ */}
      <div>
        <h2 style={{ borderBottom: "1px solid #333", paddingBottom: "10px", marginBottom: "20px", color: "#fff", fontSize: isMobile ? "20px" : "24px" }}>📄 Árajánlatok</h2>
        <div style={{ display: "grid", gap: "10px" }}>
          {client.quotes?.length > 0 ? (
            client.quotes.map((quote: any) => (
              <div key={quote.id} style={{ ...quoteCard, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ color: "#000", fontSize: "16px" }}>{quote.title || "Ajánlat"}</strong>
                  <div style={{ fontSize: "13px", color: "#666", marginTop: "2px" }}>Státusz: {quote.status}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "15px", width: isMobile ? "100%" : "auto", borderTop: isMobile ? "1px solid #eee" : "none", paddingTop: isMobile ? "10px" : "0" }}>
                  <div style={{ fontWeight: "bold", fontSize: "16px", color: "#2e7d32" }}>{Number(quote.grossTotal).toLocaleString()} Ft</div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => router.push(`/quotes/${quote.id}`)} style={btnOrangeSmall}>✏️ Módosítás</button>
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

// --- RESPONSIVE-ALAPÚ STÍLUSOK SÖTÉT MÓDHOZ ---

const containerStyle: React.CSSProperties = {
  backgroundColor: "#000",
  minHeight: "100vh",
  maxWidth: "1000px",
  margin: "0 auto",
  fontFamily: "sans-serif",
  color: "#fff",
  width: "100%",
  boxSizing: "border-box"
};

const clientNameStyle: React.CSSProperties = {
  margin: "0 0 10px 0",
  color: "#ffffff",
  fontWeight: "bold"
};

const contactRow: React.CSSProperties = {
  display: "flex",
  fontSize: "15px",
  fontWeight: "500"
};

const headerS: React.CSSProperties = {
  padding: "20px 0",
  marginBottom: "30px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  borderBottom: "1px solid #333",
  width: "100%",
  boxSizing: "border-box"
};

const navBtn = {
  padding: "10px 16px",
  borderRadius: "8px",
  border: "none",
  background: "#1e293b",
  borderBackground: "1px solid #334155",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold" as const,
  fontSize: "14px"
};

const inputS = {
  width: "100%",
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid #444",
  backgroundColor: "#111",
  color: "#fff",
  outline: "none",
  fontSize: "16px", // Fix iOS zoom ellen!
  boxSizing: "border-box" as const,
  display: "block"
};

const editBoxS = { 
  display: "grid", 
  gap: "12px", 
  width: "100%", 
  background: "#111", 
  padding: "15px", 
  borderRadius: "15px", 
  border: "1px solid #333",
  boxSizing: "border-box" as const 
};

const formBoxS = { 
  background: "#111", 
  padding: "20px", 
  borderRadius: "12px", 
  marginBottom: "30px", 
  border: "1px solid #2ecc71",
  boxSizing: "border-box" as const 
};

const btnEditHeader = { background: "#e3f2fd", color: "#1976d2", border: "none", padding: "12px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" as const, fontSize: "14px" };
const btnDeleteHeader = { background: "#ffebee", color: "#c62828", border: "none", padding: "12px 16px", borderRadius: "10px", cursor: "pointer" };

const btnGreen = { background: "#2ecc71", color: "#000", border: "none", padding: "12px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" as const, fontSize: "14px" };
const btnCancel = { background: "#444", color: "#fff", border: "none", padding: "12px 20px", borderRadius: "10px", cursor: "pointer" };

const unitCard = { padding: "16px", borderRadius: "12px", display: "flex", justifyContent: "space-between", background: "#fff", marginBottom: "10px", boxSizing: "border-box" as const };
const quoteCard = { padding: "16px", borderRadius: "12px", display: "flex", justifyContent: "space-between", background: "#fff", boxSizing: "border-box" as const };

const labS = { fontSize: "11px", color: "#aaa", fontWeight: "bold" as const, marginBottom: "5px", display: "block", textTransform: "uppercase" as const };
const btnBlueSmall = { background: "#3498db", color: "#fff", border: "none", padding: "10px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "bold" as const };
const btnGreenSmall = { background: "#2ecc71", color: "#000", border: "none", padding: "10px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "bold" as const };
const btnOrangeSmall = { background: "#f39c12", color: "#fff", border: "none", padding: "10px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "bold" as const, display: "inline-flex", alignItems: "center", gap: "4px" };
const btnRedSmall = { background: "#ffebee", color: "#e74c3c", border: "1px solid #e74c3c", padding: "10px 14px", borderRadius: "8px", cursor: "pointer" };
