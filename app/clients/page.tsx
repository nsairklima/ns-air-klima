"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    brand: "",
    model: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/admin/calendar'); // Vissza a naptárhoz sikeres mentés után
      } else {
        alert("Hiba történt a mentés során.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageContainer}>
      <header style={headerStyle}>
        <button onClick={() => router.back()} style={backBtn}>←</button>
        <h1 style={{fontSize: '20px', margin: 0}}>Új ügyfél rögzítése</h1>
      </header>

      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={inputGroup}>
          <label style={labelStyle}>Ügyfél neve</label>
          <input 
            type="text"
            required
            style={mobileInput}
            placeholder="Pl. Nagy Ervin"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>

        <div style={inputGroup}>
          <label style={labelStyle}>Telefonszám</label>
          <input 
            type="tel" // Mobilon számokat hoz fel!
            style={mobileInput}
            placeholder="06 30 123 4567"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>

        <div style={inputGroup}>
          <label style={labelStyle}>Cím</label>
          <textarea 
            style={{...mobileInput, minHeight: '100px', resize: 'none'}}
            placeholder="Város, utca, házszám..."
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
          />
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
          <div style={inputGroup}>
            <label style={labelStyle}>Gép márka</label>
            <input 
              type="text"
              style={mobileInput}
              placeholder="Pl. Gree"
              value={formData.brand}
              onChange={(e) => setFormData({...formData, brand: e.target.value})}
            />
          </div>
          <div style={inputGroup}>
            <label style={labelStyle}>Modell</label>
            <input 
              type="text"
              style={mobileInput}
              placeholder="Pl. Pulse"
              value={formData.model}
              onChange={(e) => setFormData({...formData, model: e.target.value})}
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{
            ...submitBtn,
            backgroundColor: loading ? "#444" : "#2ecc71"
          }}
        >
          {loading ? "Mentés..." : "Ügyfél mentése"}
        </button>
      </form>
    </div>
  );
}

// --- STÍLUSOK ---

const pageContainer: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#000',
  color: '#fff',
  padding: '20px',
  fontFamily: 'sans-serif'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  marginBottom: '30px'
};

const backBtn: React.CSSProperties = {
  background: '#222',
  border: '1px solid #444',
  color: '#fff',
  padding: '10px 15px',
  borderRadius: '8px',
  fontSize: '18px'
};

const formStyle: React.CSSProperties = {
  maxWidth: '500px',
  margin: '0 auto'
};

const inputGroup: React.CSSProperties = {
  marginBottom: '20px'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: '#888',
  textTransform: 'uppercase',
  marginBottom: '8px',
  letterSpacing: '1px'
};

const mobileInput: React.CSSProperties = {
  width: '100%',
  padding: '16px',       // Elég hely az ujjaknak
  fontSize: '16px',      // Megakadályozza az iOS automata zoomot
  backgroundColor: '#111',
  border: '1px solid #333',
  borderRadius: '10px',
  color: '#fff',
  outline: 'none',
  boxSizing: 'border-box'
};

const submitBtn: React.CSSProperties = {
  width: '100%',
  padding: '18px',
  borderRadius: '12px',
  border: 'none',
  color: '#fff',
  fontSize: '18px',
  fontWeight: 'bold',
  cursor: 'pointer',
  marginTop: '20px',
  boxShadow: '0 4px 15px rgba(46, 204, 113, 0.2)'
};
