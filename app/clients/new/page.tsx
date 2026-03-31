"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function NewUnitPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id;

  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    location: "",
    serialNumber: "",
    installation: "",
    periodMonths: 12,
    status: "INSTALLED", // Alapértelmezett: Saját telepítés
    notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const res = await fetch(`/api/clients/${clientId}/units`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        // Ha nincs megadva dátum, null-t küldünk
        installation: formData.installation ? new Date(formData.installation) : null,
        periodMonths: Number(formData.periodMonths)
      }),
    });

    if (res.ok) {
      router.push(`/clients/${clientId}`);
      router.refresh();
    } else {
      alert("Hiba történt a mentés során.");
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: "0 auto", fontFamily: "Arial" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>🆕 Új gép felvétele</h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "15px" }}>
        
        {/* STÁTUSZ VÁLASZTÓ */}
        <div style={sectionS}>
          <label style={labelS}>Gép típusa / Státusz</label>
          <div style={{ display: "flex", gap: "15px", marginTop: "5px" }}>
            <label style={radioLabelS}>
              <input 
                type="radio" 
                name="status" 
                value="INSTALLED" 
                checked={formData.status === "INSTALLED"} 
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              /> 🟢 Saját telepítés
            </label>
            <label style={radioLabelS}>
              <input 
                type="radio" 
                name="status" 
                value="SERVICE_ONLY" 
                checked={formData.status === "SERVICE_ONLY"} 
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              /> 🔵 Csak karbantartás
            </label>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div>
            <label style={labelS}>Márka</label>
            <input 
              style={inputS} 
              placeholder="pl. Midea" 
              required 
              value={formData.brand}
              onChange={e => setFormData({...formData, brand: e.target.value})}
            />
          </div>
          <div>
            <label style={labelS}>Modell</label>
            <input 
              style={inputS} 
              placeholder="pl. Xtreme Save" 
              required 
              value={formData.model}
              onChange={e => setFormData({...formData, model: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label style={labelS}>Telepítés dátuma {formData.status === "INSTALLED" && "*"}</label>
          <input 
            type="date" 
            style={inputS} 
            required={formData.status === "INSTALLED"}
            value={formData.installation}
            onChange={e => setFormData({...formData, installation: e.target.value})}
          />
          {formData.status === "SERVICE_ONLY" && (
            <small style={{color: "#666", display: "block", marginTop: "4px"}}>
              Hozott gépnél nem kötelező, az első szerviznaplóból fog számolni a rendszer.
            </small>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div>
            <label style={labelS}>Helyszín (helyiség)</label>
            <input 
              style={inputS} 
              placeholder="pl. Nappali" 
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
            />
          </div>
          <div>
            <label style={labelS}>Gyári szám (S/N)</label>
            <input 
              style={inputS} 
              value={formData.serialNumber}
              onChange={e => setFormData({...formData, serialNumber: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label style={labelS}>Karbantartási periódus (hónap)</label>
          <select 
            style={inputS} 
            value={formData.periodMonths}
            onChange={e => setFormData({...formData, periodMonths: Number(e.target.value)})}
          >
            <option value={6}>6 hónap</option>
            <option value={12}>12 hónap</option>
            <option value={24}>24 hónap</option>
          </select>
        </div>

        <button type="submit" style={submitBtnS}>MENTÉS</button>
        <button type="button" onClick={() => router.back()} style={cancelBtnS}>Mégse</button>
      </form>
    </div>
  );
}

const sectionS = { padding: "10px", background: "#f0f4f8", borderRadius: "8px", border: "1px solid #d1d9e0" };
const labelS = { display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "5px", color: "#444" };
const inputS = { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" as const };
const radioLabelS = { fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" };
const submitBtnS = { padding: "12px", background: "#2ecc71", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "16px" };
const cancelBtnS = { padding: "10px", background: "transparent", color: "#666", border: "none", cursor: "pointer" };
