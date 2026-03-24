"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const Id = params?.id;

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Ügyfél szerkesztés
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editClientData, setEditClientData] = useState({ name: "", email: "", phone: "", address: "" });

  // Gép (Unit) állapotok
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [location, setLocation] = useState("");

  const loadClientData = async () => {
    const res = await fetch(`/api/clients/${Id}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setClient(data);
      setEditClientData({ name: data.name, email: data.email || "", phone: data.phone || "", address: data.address || "" });
    }
    setLoading(false);
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

  // --- GÉP MŰVELETEK ---
  const handleSubmitUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { brand, model, serialNumber: serial, location };
    
    const url = editingUnitId 
      ? `/api/clients/${Id}/units/${editingUnitId}` 
      : `/api/clients/${Id}/units`;
    
    const res = await fetch(url, {
      method: editingUnitId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      resetUnitForm();
      loadClientData();
    }
  };

  const startEditUnit = (unit: any) => {
    setEditingUnitId(unit.id);
    setBrand(unit.brand);
    setModel(unit.model);
    setSerial(unit.serialNumber || "");
    setLocation(unit.location || "");
    setShowUnitForm(true);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const resetUnitForm = () => {
    setEditingUnitId(null);
    setBrand(""); setModel(""); setSerial(""); setLocation("");
    setShowUnitForm(false);
  };

  const handleDeleteUnit = async (unitId: number) => {
    if (!confirm("Biztosan törlöd ezt a gépet?")) return;
    const res = await fetch(`/api/clients/${Id}/units/${unitId}`, { method: "DELETE" });
    if (res.ok) loadClientData();
  };

  if (loading) return <div style={{padding: 20}}>Betöltés...</div>;
  if (!client) return <div style={{padding: 20}}>Ügyfél nem található.</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto", fontFamily: "Arial" }}>
      
      {/* NAVIGÁCIÓ */}
      <div style={{ display: "flex", gap: 10, marginBottom: 25 }}>
        <button onClick={() => router.push("/clients")} style={navBtn}>⬅️ Vissza</button>
        <button onClick={() => router.push("/")} style={{ ...navBtn, background: "#f8f9fa" }}>🏠 Főoldal</button>
      </div>

      {/* ÜGYFÉL ADATOK */}
      <div style={{ background: isEditingClient ? "#fff9f0" : "#fff", padding: 20, borderRadius: 15, border: "1px solid #eee", marginBottom: 30, display: "flex", justifyContent: "space-between" }}>
        <div style={{ flex: 1 }}>
          {!isEditingClient ? (
            <>
              <h1 style={{ margin: 0 }}>{client.name}</h1>
              <p>📞 {client.phone} | ✉️ {client.email}</p>
              <p style={{ color: "#666" }}>🏠 {client.address}</p>
            </>
          ) : (
            <div style={{ display: "grid", gap: 10, maxWidth: 400 }}>
              <input style={inputS} value={editClientData.name} onChange={e => setEditClientData({...editClientData, name: e.target.value})} />
              <input style={inputS} value={editClientData.phone} onChange={e => setEditClientData({...editClientData, phone: e.target.value})} />
              <input style={inputS} value={editClientData.email} onChange={e => setEditClientData({...editClientData, email: e.target.value})} />
              <input style={inputS} value={editClientData.address} onChange={e => setEditClientData({...editClientData, address: e.target.value})} />
            </div>
          )}
        </div>
        <div>
          {!isEditingClient 
            ? <button onClick={() => setIsEditingClient(true)} style={editBtn}>✏️ Ügyfél szerkesztése</button>
            : <button onClick={handleUpdateClient} style={saveBtn}>✅ Mentés</button>
          }
        </div>
      </div>

      {/* GÉPEK LISTÁJA ÉS SZERKESZTÉSE */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Telepített egységek</h2>
        <button onClick={() => { if(showUnitForm) resetUnitForm(); else setShowUnitForm(true); }} style={addBtn}>
          {showUnitForm ? "Mégse" : "+ Új gép"}
        </button>
      </div>

      {showUnitForm && (
        <div style={{ background: "#f0f7ff", padding: 20, borderRadius: 12, marginBottom: 20, border: "1px solid #3498db" }}>
          <h3>{editingUnitId ? "✏️ Gép adatainak módosítása" : "➕ Új gép hozzáadása"}</h3>
          <form onSubmit={handleSubmitUnit} style={{ display: "grid", gap: 10 }}>
            <div style={{display: "flex", gap: 10}}>
              <input placeholder="Gyártó" value={brand} onChange={e => setBrand(e.target.value)} style={inputS} required />
              <input placeholder="Modell" value={model} onChange={e => setModel(e.target.value)} style={inputS} required />
            </div>
            <div style={{display: "flex", gap: 10}}>
              <input placeholder="Gyári szám" value={serial} onChange={e => setSerial(e.target.value)} style={inputS} />
              <input placeholder="Helyszín" value={location} onChange={e => setLocation(e.target.value)} style={inputS} />
            </div>
            <button type="submit" style={saveBtn}>{editingUnitId ? "MÓDOSÍTÁSOK MENTÉSE" : "GÉP RÖGZÍTÉSE"}</button>
          </form>
        </div>
      )}

      <div style={{ display: "grid", gap: 15 }}>
        {client.units?.map((unit: any) => (
          <div key={unit.id} style={unitCard}>
            <div>
              <strong style={{ fontSize: 18 }}>{unit.brand} {unit.model}</strong>
              <div style={{ color: "#666" }}>📍 {unit.location || "Nincs megadva"} | 🔢 {unit.serialNumber || "Nincs gyári szám"}</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => router.push(`/clients/${Id}/unit/${unit.id}`)} style={navBtn}>Karbantartás →</button>
              <button onClick={() => startEditUnit(unit)} style={editBtnSmall}>✏️</button>
              <button onClick={() => handleDeleteUnit(unit.id)} style={delBtnSmall}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- STÍLUSOK --- */
const navBtn = { padding: "8px 15px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontWeight: "bold" as const };
const inputS = { width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #ccc" };
const editBtn = { background: "#3498db", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: "bold" as const };
const saveBtn = { background: "#27ae60", color: "#fff", border: "none", padding: "12px", borderRadius: 8, cursor: "pointer", fontWeight: "bold" as const };
const addBtn = { background: "#2ecc71", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: "bold" as const };
const unitCard = { padding: 15, border: "1px solid #eee", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" };
const editBtnSmall = { background: "#f39c12", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 6, cursor: "pointer" };
const delBtnSmall = { background: "#fdf2f2", color: "#e74c3c", border: "none", padding: "8px 12px", borderRadius: 6, cursor: "pointer" };
