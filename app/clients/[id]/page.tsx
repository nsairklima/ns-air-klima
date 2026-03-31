"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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
  const [status, setStatus] = useState("INSTALLED"); // Alapértelmezett: Telepítendő
  const [installation, setInstallation] = useState(""); // ÚJ: Dátum állapot

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

  // --- ÜGYFÉL MŰVELETEK ---
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

  // --- GÉP MŰVELETEK ---
 const handleSubmitUnit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // A státuszt is beleírjuk a küldendő adatokba
  const payload = { 
    brand, 
    model, 
    serialNumber: serial, 
    location, 
    status, // <--- EZT ADTUK HOZZÁ
    installation: (status === "SERVICE_ONLY" && installation) ? new Date(installation).toISOString() : null 
  };
  
  // ... a fetch kód marad ugyanaz ...
};

    const url = editingUnitId ? `/api/clients/${Id}/units/${editingUnitId}` : `/api/clients/${Id}/units`;
    
    const res = await fetch(url, {
      method: editingUnitId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      resetUnitForm();
      loadClientData();
    } else {
      const errorData = await res.json();
      alert("Hiba: " + (errorData.error || "Ismeretlen hiba"));
    }
  };

  const handleSetStatus = async (unitId: number, newStatus: string) => {
    const res = await fetch(`/api/clients/${Id}/units/${unitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, installation: new Date().toISOString() }),
    });
    
    if (res.ok) {
      await loadClientData();
    } else {
      alert("Hiba történt a státusz frissítésekor.");
    }
  };

  const startEditUnit = (unit: any) => {
    setEditingUnitId(unit.id);
    setBrand(unit.brand);
    setModel(unit.model);
    setSerial(unit.serialNumber || "");
    setLocation(unit.location || "");
    // Dátum formázása az input mezőhöz (YYYY-MM-DD)
    setInstallation(unit.installation ? new Date(unit.installation).toISOString().split('T')[0] : "");
    setShowUnitForm(true);
  };

  const resetUnitForm = () => {
    setEditingUnitId(null);
    setBrand(""); setModel(""); setSerial(""); setLocation(""); setInstallation("");
    setShowUnitForm(false);
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

  if (loading) return <div style={{padding: 20}}>Betöltés...</div>;
  if (!client) return <div style={{padding: 20}}>Ügyfél nem található.</div>;

  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto", fontFamily: "Segoe UI, sans-serif" }}>
      
      <div style={{ display: "flex", gap: "10px", marginBottom: "25px" }}>
        <button onClick={() => router.push("/clients")} style={navBtn}>⬅️ Vissza</button>
        <button onClick={() => router.push("/")} style={{ ...navBtn, background: "#f8f9fa" }}>🏠 Főoldal</button>
      </div>

      <div style={headerS}>
        <div style={{ flex: 1 }}>
          {!isEditingClient ? (
            <>
              <h1 style={{ margin: "0 0 10px 0", fontSize: "32px", color: "#1a1a1a" }}>{client.name}</h1>
              <div style={{ display: "flex", gap: "20px", color: "#666" }}>
                <span>📞 {client.phone || "Nincs telefonszám"}</span>
                <span>✉️ {client.email || "Nincs email"}</span>
              </div>
              <p style={{ margin: "10px 0 0 0", color: "#888" }}>🏠 {client.address || "Nincs cím megadva"}</p>
            </>
          ) : (
            <div style={editBoxS}>
              <h3 style={{marginTop: 0}}>Ügyfél módosítása</h3>
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
              <button onClick={() => setIsEditingClient(true)} style={btnBlueHeader}>✏️ Szerkesztés</button>
              <button onClick={handleDeleteClient} style={btnDelete}>🗑️</button>
            </>
          ) : (
            <>
              <button onClick={handleUpdateClient} style={btnGreen}>✅ Mentés</button>
              <button onClick={() => setIsEditingClient(false)} style={btnCancel}>Mégse</button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>🛠️ Gépek kezelése</h2>
        <button onClick={() => { if(showUnitForm) resetUnitForm(); else setShowUnitForm(true); }} style={btnGreen}>
          {showUnitForm ? "Mégse" : "+ Új gép felvétele"}
        </button>
      </div>

      {showUnitForm && (
        <div style={formBoxS}>
          <h3 style={{ marginTop: 0 }}>{editingUnitId ? "✏️ Gép módosítása" : "➕ Új gép rögzítése"}</h3>
          <form onSubmit={handleSubmitUnit} style={{ display: "grid", gap: "10px" }}>
            <div style={{display: "flex", gap: "10px"}}>
              <input placeholder="Gyártó" value={brand} onChange={e => setBrand(e.target.value)} style={inputS} required />
              <input placeholder="Modell" value={model} onChange={e => setModel(e.target.value)} style={inputS} required />
            </div>
            <div style={{display: "flex", gap: "10px"}}>
              <input placeholder="Gyári szám" value={serial} onChange={e => setSerial(e.target.value)} style={inputS} />
              <input placeholder="Helyszín" value={location} onChange={e => setLocation(e.target.value)} style={inputS} />
            </div>
            <div>
              <label style={{fontSize: "12px", color: "#3498db", fontWeight: "bold"}}>Telepítés / Karbantartás kezdő dátuma:</label>
              <input type="date" value={installation} onChange={e => setInstallation(e.target.value)} style={inputS} />
            </div>
            <button type="submit" style={btnGreen}>{editingUnitId ? "MÓDOSÍTÁS MENTÉSE" : "GÉP HOZZÁADÁSA"}</button>
          </form>
        </div>
      )}

      <div style={{ display: "grid", gap: "12px", marginBottom: "50px" }}>
        {client.units?.length > 0 ? (
          client.units.map((unit: any) => (
            <div key={unit.id} style={unitCard}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <strong style={{ fontSize: "18px" }}>{unit.brand} {unit.model}</strong>
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
                
                {(unit.status === "SERVICE_ONLY" || unit.installation) && (
                  <button onClick={() => router.push(`/clients/${Id}/unit/${unit.id}`)} style={btnBlueSmall}>Napló →</button>
                )}

                <button onClick={() => startEditUnit(unit)} style={btnOrangeSmall}>✏️</button>
                <button onClick={() => handleDeleteUnit(unit.id)} style={btnRedSmall}>🗑️</button>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: "#999", fontStyle: "italic" }}>Nincs még gép rögzítve.</p>
        )}
      </div>

      <div>
        <h2 style={{ borderBottom: "2px solid #eee", paddingBottom: "10px", marginBottom: "20px" }}>📄 Árajánlatok</h2>
        <div style={{ display: "grid", gap: "10px" }}>
          {client.quotes?.length > 0 ? (
            client.quotes.map((quote: any) => (
              <div key={quote.id} style={quoteCard}>
                <div>
                  <strong style={{ color: "#2c3e50" }}>{quote.title || "Ajánlat"}</strong>
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>Státusz: {quote.status}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <div style={{ fontWeight: "bold", fontSize: "16px" }}>{Number(quote.grossTotal).toLocaleString()} Ft</div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => router.push(`/quotes/${quote.id}`)} style={btnOrangeSmall}>✏️</button>
                    <button onClick={() => handleDeleteQuote(quote.id)} style={btnRedSmall}>🗑️</button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: "#999", fontStyle: "italic" }}>Nincs korábbi ajánlat.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Stílusok változatlanul
const headerS = { padding: "20px 0", marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #eee" };
const editBoxS = { display: "grid", gap: "10px", maxWidth: "450px", background: "#f8f9fa", padding: "20px", borderRadius: "15px" };
const formBoxS = { background: "#f0f7ff", padding: "20px", borderRadius: "12px", marginBottom: "30px", border: "1px solid #3498db" };
const navBtn = { padding: "8px 15px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontWeight: "bold" as const };
const inputS = { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", outline: "none", boxSizing: "border-box" as const };
const btnBlueHeader = { background: "#eef6fc", color: "#3498db", border: "1px solid #3498db", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" as const };
const btnDelete = { background: "#fff1f0", color: "#e74c3c", border: "1px solid #ffa39e", padding: "10px 15px", borderRadius: "10px", cursor: "pointer" };
const btnCancel = { background: "#eee", color: "#666", border: "1px solid #ccc", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" as const };
const btnGreen = { background: "#27ae60", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" as const };
const unitCard = { padding: "16px", border: "1px solid #eee", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" };
const quoteCard = { padding: "15px", border: "1px solid #e1e8ed", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fcfdff" };
const btnBlueSmall = { background: "#3498db", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" as const };
const btnGreenSmall = { background: "#2ecc71", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" as const };
const btnOrangeSmall = { background: "#f39c12", color: "#fff", border: "none", padding: "8px 12px", borderRadius: "8px", cursor: "pointer" };
const btnRedSmall = { background: "#fdf2f2", color: "#e74c3c", border: "none", padding: "8px 12px", borderRadius: "8px", cursor: "pointer" };
