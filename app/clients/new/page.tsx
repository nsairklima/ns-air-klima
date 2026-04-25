"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewClientAndUnitPage() {
  const router = useRouter();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
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
    <div style={pageStyle}>
      <header style={headerStyle}>
        <button onClick={() => router.back()} style={backBtn}>← Vissza</button>
        <h1 style={{ fontSize: '24px', margin: '15px 0 0 0', fontWeight: '800' }}>Új ügyfél és gép</h1>
      </header>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px", marginTop: "10px" }}>
        
        {/* ÜGYFÉL ADATOK */}
        <div style={cardStyle}>
          <h2 style={titleStyle}>👤 Ügyfél adatai</h2>
          <div style={formGrid}>
            <input style={inputStyle} required placeholder="Név *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <input style={inputStyle} placeholder="Cím" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            <input style={inputStyle} type="tel" placeholder="Telefon" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <input style={inputStyle} type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
        </div>

        {/* GÉP ADATOK */}
        <div style={{...cardStyle, borderLeft: "6px solid #2ecc71"}}>
          <h2 style={titleStyle}>❄️ Első gép adatai</h2>
          
          <div style={statusBoxStyle}>
            <label style={labelStyle}>GÉP TÍPUSA</label>
            <div style={{display: "flex", gap: "15px", marginTop: "8px"}}>
              <label style={radioLabel}>
                <input type="radio" name="status" value="INSTALLED" checked={formData.status === "INSTALLED"} onChange={e => setFormData({...formData, status: e.target.value})} />
                Saját telepítés
              </label>
              <label style={radioLabel}>
                <input type="radio" name="status" value="SERVICE_ONLY" checked={formData.status === "SERVICE_ONLY"} onChange={e => setFormData({...formData, status: e.target.value})} />
                Csak szerviz
              </label>
            </div>
          </div>

          <div style={formGrid}>
            <input style={inputStyle} required placeholder="Márka *" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
            <input style={inputStyle} required placeholder="Modell *" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
            
            <div style={{width: "100%"}}>
              <label style={labelStyle}>TELEPÍTÉS DÁTUMA</label>
              <input type="date" style={inputStyle} required={formData.status === "INSTALLED"} value={formData.installation} onChange={e => setFormData({...formData, installation: e.target.value})} />
            </div>

            <div style={{width: "100%"}}>
              <label style={labelStyle}>KARBANTARTÁSI CIKLUS</label>
              <select style={inputStyle} value={formData.periodMonths} onChange={e => setFormData({...formData, periodMonths: Number(e.target.value)})}>
                <option value={6}>6 hónap</option>
                <option value={12}>12 hónap</option>
                <option value={24}>24 hónap</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", marginBottom: "40px" }}>
          <button type="submit" style={saveBtnStyle}>Minden mentése</button>
          <button type="button" onClick={() => router.back()} style={cancelBtnStyle}>Mégse</button>
        </div>
      </form>
    </div>
  );
}

// --- MODERN SÖTÉT STÍLUSOK (A naptárhoz igazítva) ---

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#121826",
  color: "#f8fafc",
  padding: "15px",
  fontFamily: "sans-serif",
  maxWidth: "600px",
  margin: "0 auto"
};

const headerStyle: React.CSSProperties = {
  marginBottom: '20px',
  borderBottom: '1px solid #334155',
  paddingBottom: '15px'
};

const backBtn: React.CSSProperties = {
  background: "#1e293b",
  border: "1px solid #334155",
  color: "#fff",
  padding: "8px 16px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px"
};

const cardStyle: React.CSSProperties = {
  background: "#1e293b",
  padding: "20px",
  borderRadius: "16px",
  border: "1px solid #334155",
  boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
};

const titleStyle: React.CSSProperties = {
  fontSize: "18px",
  marginTop: 0,
  marginBottom: "15px",
  color: "#fff",
  fontWeight: "bold"
};

const formGrid: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px"
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid #334155",
  fontSize: "16px",
  backgroundColor: "#0f172a",
  color: "#fff",
  boxSizing: "border-box"
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#94a3b8',
  fontWeight: 'bold',
  marginBottom: '5px',
  display: 'block',
  textTransform: 'uppercase'
};

const statusBoxStyle: React.CSSProperties = {
  background: "#161e2d",
  padding: "15px",
  borderRadius: "10px",
  marginBottom: "15px",
  border: "1px solid #2d3748"
};

const radioLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  cursor: "pointer",
  fontSize: "14px"
};

const saveBtnStyle: React.CSSProperties = {
  flex: 2,
  padding: "16px",
  background: "#2ecc71",
  color: "white",
  border: "none",
  borderRadius: "12px",
  fontWeight: "bold",
  fontSize: "16px",
  cursor: "pointer"
};

const cancelBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: "16px",
  background: "#334155",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  cursor: "pointer"
};
