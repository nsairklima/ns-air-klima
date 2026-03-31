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
        installation: formData.installation ? new Date(formData.installation) : null,
        periodMonths: Number(formData.periodMonths)
      }),
    });

    if (res.ok) {
      router.push(`/clients/${clientId}`);
      router.refresh();
    } else {
      alert("Hiba történt a gép mentésekor.");
    }
  };

  return (
    <div style={{ padding: "40px 20px", maxWidth: "600px", margin: "0 auto", fontFamily: "Segoe UI, sans-serif" }}>
      <div style={{ background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
        <h1 style={{ fontSize: "24px", color: "#2c3e50", marginBottom: "25px", borderBottom: "2px solid #2ecc71", paddingBottom: "10px" }}>
          🆕 Új gép hozzáadása
        </h1>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px" }}>
          
          {/* STÁTUSZ VÁLASZTÓ - EZ AZ ÚJ RÉSZ */}
          <div style={{ padding: "15px", background: "#f8f9fa", borderRadius: "8px", border: "1px solid #e9ecef" }}>
            <label style={{ ...labelStyle, marginBottom: "10px" }}>Gép státusza</label>
            <div style={{ display: "flex", gap: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input 
                  type="radio" 
                  name="status" 
                  value="INSTALLED" 
                  checked={formData.status === "INSTALLED"} 
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                /> 🟢 Saját telepítés
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input 
                  type="radio" 
                  name="status" 
                  value="SERVICE_ONLY" 
                  checked={formData.status === "SERVICE_ONLY"} 
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                /> 🔵 Csak karbantartás (hozott)
              </label>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <div>
              <label style={labelStyle}>Márka *</label>
              <input style={inputStyle} required value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Modell *</label>
              <input style={inputStyle} required value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Telepítés dátuma {formData.status === "INSTALLED" && "*"}</label>
            <input 
              type="date" 
              style={inputStyle} 
              required={formData.status === "INSTALLED"} 
              value={formData.installation} 
              onChange={e => setFormData({...formData, installation: e.target.value})} 
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <div>
              <label style={labelStyle}>Helyszín</label>
              <input style={inputStyle} value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Gyári szám (S/N)</label>
              <input style={inputStyle} value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Karbantartási ciklus (hónap)</label>
            <select style={inputStyle} value={formData.periodMonths} onChange={e => setFormData({...formData, periodMonths: Number(e.target.value)})}>
              <option value={6}>6 hónap</option>
              <option value={12}>12 hónap</option>
              <option value={24}>24 hónap</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button type="submit" style={saveButtonStyle}>GÉP MENTÉSE</button>
            <button type="button" onClick={() => router.back()} style={cancelButtonStyle}>Mégse</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: "14px", fontWeight: "600" as const, color: "#34495e", marginBottom: "6px" };
const inputStyle = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #dcdde1", fontSize: "16px", boxSizing: "border-box" as const };
const saveButtonStyle = { flex: 2, padding: "14px", background: "#2ecc71", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold" as const, cursor: "pointer", fontSize: "16px" };
const cancelButtonStyle = { flex: 1, padding: "14px", background: "#f5f6fa", color: "#7f8c8d", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px" };
