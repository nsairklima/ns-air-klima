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
        <h1 style={{ fontSize: "1.6rem", margin: '15px 0 0 0', fontWeight: '800' }}>Új ügyfél és gép</h1>
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
            {/* JAVÍTVA: Nem kötelező mezők */}
            <input style={inputStyle} placeholder="Márka (opcionális)" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
            <input style={inputStyle} placeholder="Modell (opcionális)" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
            
            <div style={{ width: "100%" }}>
              <label style={labelStyle}>TELEPÍTÉS DÁTUMA</label>
              <input type="date" style={inputStyle} value={formData.installation} onChange={e => setFormData({...formData, installation: e.target.value})} />
            </div>

            <div style={{ width: "100%" }}>
              <label style={labelStyle}>KARBANTARTÁSI CIKLUS (HÓNAP)</label>
              <select 
                style={inputStyle} 
                value={formData.periodMonths} 
                onChange={e => setFormData({...formData, periodMonths: Number(e.target.value)})}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>{month} hónap</option>
                ))}
                <option value={24}>24 hónap</option>
              </select>
            </div>
          </div>
        </div>

        {/* AKCIÓ GOMBOK */}
        <div style={buttonGroupStyle}>
          <button type="submit" style={saveBtnStyle}>Minden mentése</button>
          <button type="button" onClick={() => router.back()} style={cancelBtnStyle}>Mégse</button>
        </div>
      </form>
    </div>
  );
}

// --- TISZTA, BIZTONSÁGOS ÉS RESZPONZÍV STÍLUSOK ---

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#121826",
  color: "#f8fafc",
  fontFamily: "sans-serif",
  maxWidth: "1000px",
  width: "100%",
  margin: "0 auto",
  padding: "16px 12px",
  boxSizing: "border-box"
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
  padding: "10px 18px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px"
};

const cardStyle: React.CSSProperties = {
  background: "#1e293b",
  borderRadius: "16px",
  border: "1px solid #334155",
  boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
  padding: "20px 16px",
  boxSizing: "border-box",
  width: "100%"
};

const titleStyle: React.CSSProperties = {
  fontSize: "18px",
  marginTop: 0,
  marginBottom: "18px",
  color: "#fff",
  fontWeight: "bold"
};

const responsiveGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "16px",
  width: "100%"
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid #334155",
  fontSize: "16px",
  backgroundColor: "#0f172a",
  color: "#fff",
  boxSizing: "border-box",
  display: "block",
  outline: "none"
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#94a3b8',
  fontWeight: 'bold',
  marginBottom: '6px',
  display: 'block',
  textTransform: 'uppercase',
  letterSpacing: "0.5px"
};

const statusBoxStyle: React.CSSProperties = {
  background: "#161e2d",
  padding: "16px",
  borderRadius: "10px",
  marginBottom: "18px",
  border: "1px solid #2d3748",
  boxSizing: "border-box"
};

const radioContainer: React.CSSProperties = {
  display: "flex", 
  gap: "16px", 
  marginTop: "8px",
  flexWrap: "wrap"
};

const radioLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  cursor: "pointer",
  fontSize: "15px",
  userSelect: "none",
  background: "#1e293b",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #334155",
  flex: 1,
  minWidth: "140px"
};

const radioInput: React.CSSProperties = {
  width: "18px",
  height: "18px",
  cursor: "pointer"
};

const buttonGroupStyle: React.CSSProperties = {
  display: "flex", 
  flexDirection: "row", 
  gap: "12px", 
  marginBottom: "40px",
  flexWrap: "wrap-reverse"
};

const saveBtnStyle: React.CSSProperties = {
  flex: 2,
  minWidth: "200px",
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
  minWidth: "100px",
  padding: "16px",
  background: "#334155",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  fontWeight: "bold",
  fontSize: "16px",
  cursor: "pointer"
};
