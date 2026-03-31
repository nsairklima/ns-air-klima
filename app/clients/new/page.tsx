"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewClientPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const newClient = await res.json();
        // A mentés után átirányítjuk az ügyfél adatlapjára
        // Itt tudja majd felvenni a gép(ek)et a "Gép hozzáadása" gombbal
        router.push(`/clients/${newClient.id}`);
        router.refresh();
      } else {
        alert("Hiba történt az ügyfél mentésekor.");
      }
    } catch (err) {
      console.error(err);
      alert("Hálózati hiba történt.");
    }
  };

  return (
    <div style={{ padding: "40px 20px", maxWidth: "600px", margin: "0 auto", fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif" }}>
      <div style={{ background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
        <h1 style={{ fontSize: "24px", color: "#2c3e50", marginBottom: "25px", borderBottom: "2px solid #3498db", paddingBottom: "10px" }}>
          👤 Új ügyfél regisztrálása
        </h1>
        
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px" }}>
          <div>
            <label style={labelStyle}>Ügyfél neve / Cégnév *</label>
            <input 
              style={inputStyle} 
              required 
              placeholder="pl. Nagy Antal"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label style={labelStyle}>Telepítési cím</label>
            <input 
              style={inputStyle} 
              placeholder="Város, utca, házszám"
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <div>
              <label style={labelStyle}>Telefonszám</label>
              <input 
                style={inputStyle} 
                placeholder="+36 30 123 4567"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div>
              <label style={labelStyle}>Email cím</label>
              <input 
                type="email"
                style={inputStyle} 
                placeholder="pelda@gmail.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Egyéb megjegyzés</label>
            <textarea 
              style={{ ...inputStyle, height: "100px", resize: "vertical" }} 
              placeholder="pl. Kapucsengő 12, vagy speciális igények..."
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button type="submit" style={saveButtonStyle}>ÜGYFÉL MENTÉSE</button>
            <button type="button" onClick={() => router.back()} style={cancelButtonStyle}>Mégse</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Stílusok
const labelStyle = { display: "block", fontSize: "14px", fontWeight: "600" as const, color: "#34495e", marginBottom: "6px" };
const inputStyle = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #dcdde1", fontSize: "16px", boxSizing: "border-box" as const };
const saveButtonStyle = { flex: 2, padding: "14px", background: "#3498db", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold" as const, cursor: "pointer", fontSize: "16px" };
const cancelButtonStyle = { flex: 1, padding: "14px", background: "#f5f6fa", color: "#7f8c8d", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px" };
