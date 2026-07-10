"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewClientAndUnitPage() {
  const router = useRouter();

  // Raktárkészlet állapotai
  const [warehouseItems, setWarehouseItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [availableSerials, setAvailableSerials] = useState<{sn: string, src: string}[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    brand: "",
    model: "",
    location: "",
    serialNumber: "",
    installation: "",
    periodMonths: 12,
    status: "INSTALLED",
    notes: ""
  });

  // 1. Raktárkészlet betöltése indításkor
  useEffect(() => {
    fetch("/api/items")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setWarehouseItems(data);
      })
      .catch(err => console.error("Raktár betöltési hiba:", err));
  }, []);

  // 2. Ha kiválaszt egy anyagot/gépet a raktárból
  useEffect(() => {
    if (!selectedItemId) {
      setAvailableSerials([]);
      return;
    }

    const item = warehouseItems.find(i => i.id === Number(selectedItemId));
    if (item) {
      // Automatikusan szétbontjuk a Márka / Modell párost a megnevezésből (pl. "Gree Comfort X" -> brand: "Gree", model: "Comfort X")
      const nameParts = item.name.split(" ");
      const autoBrand = nameParts[0] || "";
      const autoModel = nameParts.slice(1).join(" ") || "";

      setFormData(prev => ({
        ...prev,
        brand: autoBrand,
        model: autoModel
      }));

      // Gyári számok kinyerése és strukturálása
      if (item.serialNumber) {
        const serials = item.serialNumber.split(", ").map((s: string) => {
          const [sn, src] = s.split("@");
          return { sn: sn?.trim(), src: src?.trim() || "Ismeretlen" };
        }).filter((s: any) => s.sn);
        setAvailableSerials(serials);
      } else {
        setAvailableSerials([]);
      }
    }
  }, [selectedItemId, warehouseItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Megkeressük, hogy a kiválasztott gyári számnak mi a forrása
      const activeSerialObj = availableSerials.find(s => s.sn === formData.serialNumber);
      const computedSource = activeSerialObj ? activeSerialObj.src : "Nincs megadva";

      // 1. Lépés: Ügyfél mentése
      const clientRes = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          notes: formData.notes
        }),
      });

      if (!clientRes.ok) throw new Error("Ügyfél mentése sikertelen");
      const newClient = await clientRes.json();

      // 2. Lépés: Gép mentése az adatbázisba (átadjuk a kiválasztott forrást is!)
      const unitRes = await fetch(`/api/clients/${newClient.id}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: formData.brand,
          model: formData.model,
          location: formData.location,
          serialNumber: formData.serialNumber,
          installation: formData.installation ? new Date(formData.installation) : null,
          periodMonths: Number(formData.periodMonths),
          status: formData.status,
          notes: formData.notes ? `${formData.notes} | Forrás: ${computedSource}` : `Beszerzési forrás: ${computedSource}`
        }),
      });

      if (!unitRes.ok) throw new Error("Gép mentése sikertelen");

      // 3. Lépés: AUTOMATIKUS LEVONÁS ÉS TÖRLÉS A RAKTÁRBÓL
      if (selectedItemId) {
        await fetch("/api/items", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "deduct",
            id: Number(selectedItemId),
            deleteSerial: formData.serialNumber || null, // Ha van gyári szám azt törli, ha nincs, simán eggyel csökkenti a darabszámot
            qtyToDeduct: 1
          })
        });
      }

      router.push(`/clients/${newClient.id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Hiba történt a mentési vagy raktár-levonási folyamat során.");
    }
  };

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <button onClick={() => router.back()} style={backBtn}>← Vissza</button>
        <h1 style={{ fontSize: "1.6rem", margin: '15px 0 0 0', fontWeight: '800' }}>Új ügyfél és gép rögzítése</h1>
      </header>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px", marginTop: "10px" }}>
        
        {/* ÜGYFÉL ADATOK CARD */}
        <div style={cardStyle}>
          <h2 style={titleStyle}>👤 Ügyfél adatai</h2>
          <div style={responsiveGrid}>
            <input style={inputStyle} required placeholder="Név *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <input style={inputStyle} placeholder="Cím" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            <input style={inputStyle} type="tel" placeholder="Telefon" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <input style={inputStyle} type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
        </div>

        {/* RAKTÁR KIVÁLASZTÁS CARD */}
        <div style={{ ...cardStyle, borderLeft: "6px solid #4DA3FF" }}>
          <h2 style={titleStyle}>📦 Telepítendő anyag / gép kiválasztása raktárból</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={labelStyle}>Válassz a bent lévő raktárkészletből (Opcionális)</label>
              <select style={inputStyle} value={selectedItemId} onChange={e => { setSelectedItemId(e.target.value); setFormData(prev => ({ ...prev, serialNumber: "" })); }}>
                <option value="">-- Nem raktári / Külső beszerzésű gép --</option>
                {warehouseItems.map(i => (
                  <option key={i.id} value={i.id}>{i.name} (Raktáron: {i.stock} db)</option>
                ))}
              </select>
            </div>

            {/* Ha a választott terméknek VANNAK gyári számai, lenyílót mutatunk helyette! */}
            {selectedItemId && availableSerials.length > 0 ? (
              <div>
                <label style={labelStyle}>Válassz a raktáron lévő Gyári számok közül *</label>
                <select 
                  style={{ ...inputStyle, border: "1px solid #2ecc71" }} 
                  required 
                  value={formData.serialNumber} 
                  onChange={e => setFormData({...formData, serialNumber: e.target.value})}
                >
                  <option value="">-- VÁLASSZ GYÁRI SZÁMOT --</option>
                  {availableSerials.map((s, idx) => (
                    <option key={idx} value={s.sn}>{s.sn} (Forrás: {s.src})</option>
                  ))}
                </select>
              </div>
            ) : selectedItemId ? (
              <p style={{ fontSize: "13px", color: "#e67e22", margin: 0 }}>⚠️ Ennek a terméknek nincsenek rögzített egyedi gyári számai. Mentéskor simán 1 db-bal csökken a készlet.</p>
            ) : null}
          </div>
        </div>

        {/* GÉP ADATOK CARD */}
        <div style={{ ...cardStyle, borderLeft: "6px solid #2ecc71" }}>
          <h2 style={titleStyle}>❄️ Első gép adatai</h2>
          
          <div style={statusBoxStyle}>
            <label style={labelStyle}>GÉP TÍPUSA</label>
            <div style={radioContainer}>
              <label style={radioLabel}>
                <input type="radio" name="status" value="INSTALLED" checked={formData.status === "INSTALLED"} onChange={e => setFormData({...formData, status: e.target.value})} style={radioInput} />
                Saját telepítés
              </label>
              <label style={radioLabel}>
                <input type="radio" name="status" value="SERVICE_ONLY" checked={formData.status === "SERVICE_ONLY"} onChange={e => setFormData({...formData, status: e.target.value})} style={radioInput} />
                Csak szerviz
              </label>
            </div>
          </div>

          <div style={responsiveGrid}>
            <input style={inputStyle} placeholder="Márka" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
            <input style={inputStyle} placeholder="Modell" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
            <input style={inputStyle} placeholder="Helyszín (pl. Nappali)" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            
            {/* Ha nincs raktári tétel kiválasztva, engedjük a manuális gyári szám beírást */}
            {!selectedItemId && (
              <input style={inputStyle} placeholder="Gyári szám (manuális)" value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} />
            )}

            <div style={{ width: "100%" }}>
              <label style={labelStyle}>TELEPÍTÉS DÁTUMA</label>
              <input type="date" style={inputStyle} value={formData.installation} onChange={e => setFormData({...formData, installation: e.target.value})} />
            </div>

            <div style={{ width: "100%" }}>
              <label style={labelStyle}>KARBANTARTÁSI CIKLUS (HÓNAP)</label>
              <select style={inputStyle} value={formData.periodMonths} onChange={e => setFormData({...formData, periodMonths: Number(e.target.value)})}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>{month} hónap</option>
                ))}
                <option value={24}>24 hónap</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: "15px" }}>
            <label style={labelStyle}>Megjegyzések / Szerelési napló</label>
            <textarea style={{ ...inputStyle, height: "80px", resize: "none" }} placeholder="Egyéb fontos infók a géphez..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>
        </div>

        {/* AKCIÓ GOMBOK */}
        <div style={buttonGroupStyle}>
          <button type="submit" style={saveBtnStyle}>Minden mentése és készlet levonása</button>
          <button type="button" onClick={() => router.back()} style={cancelBtnStyle}>Mégse</button>
        </div>
      </form>
    </div>
  );
}

// --- STÍLUSOK (Változatlanul hagyva a dizájnt) ---
const pageStyle: React.CSSProperties = { minHeight: "100vh", backgroundColor: "#121826", color: "#f8fafc", fontFamily: "sans-serif", maxWidth: "1000px", width: "100%", margin: "0 auto", padding: "16px 12px", boxSizing: "border-box" };
const headerStyle: React.CSSProperties = { marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '15px' };
const backBtn: React.CSSProperties = { background: "#1e293b", border: "1px solid #334155", color: "#fff", padding: "10px 18px", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "14px" };
const cardStyle: React.CSSProperties = { background: "#1e293b", borderRadius: "16px", border: "1px solid #334155", boxShadow: "0 4px 15px rgba(0,0,0,0.3)", padding: "20px 16px", boxSizing: "border-box", width: "100%" };
const titleStyle: React.CSSProperties = { fontSize: "18px", marginTop: 0, marginBottom: "18px", color: "#fff", fontWeight: "bold" };
const responsiveGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", width: "100%" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "14px", borderRadius: "10px", border: "1px solid #334155", fontSize: "16px", backgroundColor: "#0f172a", color: "#fff", boxSizing: "border-box", display: "block", outline: "none" };
const labelStyle: React.CSSProperties = { fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: "0.5px" };
const statusBoxStyle: React.CSSProperties = { background: "#161e2d", padding: "16px", borderRadius: "10px", marginBottom: "18px", border: "1px solid #2d3748", boxSizing: "border-box" };
const radioContainer: React.CSSProperties = { display: "flex", gap: "16px", marginTop: "8px", flexWrap: "wrap" };
const radioLabel: React.CSSProperties = { display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "15px", userSelect: "none", background: "#1e293b", padding: "10px 14px", borderRadius: "8px", border: "1px solid #334155", flex: 1, minWidth: "140px" };
const radioInput: React.CSSProperties = { width: "18px", height: "18px", cursor: "pointer" };
const buttonGroupStyle: React.CSSProperties = { display: "flex", flexDirection: "row", gap: "12px", marginBottom: "40px", flexWrap: "wrap-reverse" };
const saveBtnStyle: React.CSSProperties = { flex: 2, minWidth: "200px", padding: "16px", background: "#2ecc71", color: "white", border: "none", borderRadius: "12px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" };
const cancelBtnStyle: React.CSSProperties = { flex: 1, minWidth: "100px", padding: "16px", background: "#334155", color: "#fff", border: "none", borderRadius: "12px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" };
