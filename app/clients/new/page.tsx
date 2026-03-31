"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewClientAndUnitPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    // Ügyfél adatok
    name: "",
    address: "",
    phone: "",
    email: "",
    // Gép adatok
    brand: "",
    model: "",
    location: "",
    serialNumber: "",
    installation: "",
    periodMonths: 12,
    status: "INSTALLED", // Itt a választó alapértéke
    notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 1. Ügyfél létrehozása
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

      // 2. Gép létrehozása az új ügyfélhez
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
          status: formData.status
        }),
      });

      if (unitRes.ok) {
        router.push(`/clients/${newClient.id}`);
        router.refresh();
      } else {
        alert("Ügyfél kész, de a gép mentése hibás volt.");
      }
    } catch (err) {
      console.error(err);
      alert("Hiba történt a mentés során.");
    }
  };

  return (
    <div style={{ padding: "40px 20px", maxWidth: "700px", margin: "0 auto", fontFamily: "Segoe UI, sans-serif" }}>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "25px" }}>
        
        {/* ÜGYFÉL ADATOK SZEKCIÓ */}
        <div style={cardS}>
          <h2 style={titleS}>👤 Ügyfél adatai</h2>
          <div style={grid2S}>
            <input style={inputS} required placeholder="Név *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <input style={inputS} placeholder="Cím" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            <input style={inputS} placeholder="Telefon" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <input style={inputS} type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
        </div>

        {/* GÉP ADATOK SZEKCIÓ */}
        <div style={{...cardS, borderLeft: "5px solid #2ecc71"}}>
          <h2 style={titleS}>❄️ Első gép adatai</h2>
          
          {/* STÁTUSZ VÁLASZTÓ */}
          <div style={statusBoxS}>
            <label style={{fontWeight: "bold", display: "block", marginBottom: "10px"}}>Gép típusa:</label>
            <div style={{display: "flex", gap: "20px"}}>
              <label style={radioS}>
                <input type="radio" name="status" value="INSTALLED" checked={formData.status === "INSTALLED"} onChange={e => setFormData({...formData, status: e.target.value})} />
                🟢 Saját telepítés
              </label>
              <label style={radioS}>
                <input type="radio" name="status" value="SERVICE_ONLY" checked={formData.status === "SERVICE_ONLY"} onChange={e => setFormData({...formData, status: e.target.value})} />
                🔵 Csak karbantartás
              </label>
            </div>
          </div>

          <div style={grid2S}>
            <input style={inputS} required placeholder="Márka *" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
            <input style={inputS} required placeholder="Modell *" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
            <div>
              <label style={smallLabelS}>Telepítés dátuma {formData.status === "INSTALLED" && "*"}</label>
              <input type="date" style={inputS} required={formData.status === "INSTALLED"} value={formData.installation} onChange={e => setFormData({...formData, installation: e.target.value})} />
            </div>
            <div>
              <label style={smallLabelS}>Karbantartási ciklus</label>
              <select style={inputS} value={formData.periodMonths} onChange={e => setFormData({...formData, periodMonths: Number(e.target.value)})}>
                <option value={6}>6 hónap</option>
                <option value={12}>12 hónap</option>
                <option value={24}>24 hónap</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button type="submit" style={saveBtnS}>MINDEN MENTÉSE</button>
          <button type="button" onClick={() => router.back()} style={cancelBtnS}>Mégse</button>
        </div>
      </form>
    </div>
  );
}

// Stílusok (inline)
const cardS = { background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" };
const titleS = { fontSize: "18px", marginTop: 0, marginBottom: "15px", color: "#2c3e50" };
const grid2S = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" };
const inputS = { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box" as const };
const statusBoxS = { background: "#f8f9fa", padding: "15px", borderRadius: "8px", marginBottom: "15px", border: "1px solid #eee" };
const radioS = { display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" };
const saveBtnS = { flex: 2, padding: "15px", background: "#3498db", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" };
const cancelBtnS = { flex: 1, padding: "15px", background: "#eee", border: "none", borderRadius: "8px", cursor: "pointer" };
const smallLabelS = { fontSize: "12px", color: "#666", marginBottom: "3px", display: "block" };
