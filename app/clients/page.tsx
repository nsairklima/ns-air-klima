"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type Client = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  units?: any[];
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadClients(query: string = "") {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients?search=${encodeURIComponent(query)}`, { cache: "no-store" });
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Váratlan válasz.");
      setClients(data);
    } catch (e: any) {
      setError(e?.message || "Hiba történt a lekéréskor.");
    }
    setLoading(false);
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadClients(searchTerm);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  async function handleDelete(id: number, clientName: string) {
    if (!confirm(`⚠️ BIZTOSAN TÖRÖLNI AKAROD: ${clientName}?\nMinden hozzá tartozó gép és ajánlat is törlődni fog!`)) return;
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadClients(searchTerm);
      } else {
        alert("Hiba történt a törlés során.");
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function addClient(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return alert("A név kötelező.");
    setSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, address }),
      });
      if (!res.ok) throw new Error("Mentési hiba.");
      setName(""); setEmail(""); setPhone(""); setAddress("");
      setSearchTerm("");
      await loadClients("");
    } catch (e: any) {
      setError(e?.message || "Hiba mentéskor.");
    }
    setSaving(false);
  }

  return (
    <div style={containerStyle}>
      {/* FEJLÉC */}
      <div style={headerStyle}>
        <h1 style={{ margin: 0, fontSize: "24px" }}>Ügyfelek</h1>
        <Link href="/admin/calendar" style={backLinkStyle}>← Naptár</Link>
      </div>

      {/* ŰRLAP SZEKCIÓ */}
      <div style={sectionStyle}>
        <form onSubmit={addClient} style={formStyle}>
          <h3 style={{ margin: "0 0 15px 0", color: "#fff" }}>Új ügyfél felvétele</h3>
          <input placeholder="Ügyfél neve *" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          <input placeholder="Telefonszám" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
          <input placeholder="E-mail cím" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          <textarea placeholder="Telepítési cím" value={address} onChange={(e) => setAddress(e.target.value)} style={{...inputStyle, minHeight: "80px", resize: "none"}} />
          
          <button disabled={saving} style={{...btnPrimary, backgroundColor: saving ? "#444" : "#2ecc71"}}>
            {saving ? "Mentés..." : "Ügyfél mentése"}
          </button>
        </form>
        {error && <p style={{ color: "#ff4d4d", marginTop: 10, fontSize: "14px" }}>{error}</p>}
      </div>

      {/* KERESŐ ÉS LISTA SZEKCIÓ */}
      <div style={{ marginTop: "30px" }}>
        <div style={{ position: "sticky", top: "10px", zIndex: 5, backgroundColor: "#000", paddingBottom: "10px" }}>
          <input 
            type="text"
            placeholder="🔍 Keresés név vagy cím alapján..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchFieldStyle}
          />
        </div>

        {loading && <p style={{ textAlign: "center", opacity: 0.6 }}>Betöltés...</p>}
        
        <div style={{ display: "grid", gap: "15px", marginTop: "10px" }}>
          {clients.map((c: any) => {
            const hasUrgent = c.units?.some((u: any) => {
              if (!u.maintenance || u.maintenance.length === 0) return true;
              const last = new Date(u.maintenance[0].performedDate);
              return (Math.ceil(Math.abs(new Date().getTime() - last.getTime()) / (1000*60*60*24))) >= 330;
            });

            return (
              <div key={c.id} style={{ 
                ...cardStyle, 
                borderLeft: hasUrgent ? "6px solid #e74c3c" : "1px solid #333" 
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", fontSize: "18px", marginBottom: "4px" }}>
                      {c.name} {hasUrgent && "⚠️"}
                    </div>
                    <div style={{ fontSize: "14px", color: "#bbb", marginBottom: "4px" }}>{c.phone || "Nincs tel."}</div>
                    <div style={{ fontSize: "13px", color: "#888" }}>{c.address || "Nincs cím megadva"}</div>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}>
                    <Link href={`/clients/${c.id}`} style={detailsBtnStyle}>Részletek</Link>
                    <button 
                      onClick={() => handleDelete(c.id, c.name)}
                      style={deleteBtnStyle}
                    >
                      Törlés 🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {!loading && clients.length === 0 && (
            <p style={{ textAlign: "center", color: "#666", marginTop: "20px" }}>Nincs ilyen nevű ügyfél.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// --- STÍLUSOK ---

const containerStyle: React.CSSProperties = {
  padding: "15px",
  backgroundColor: "#000",
  minHeight: "100vh",
  color: "#fff",
  fontFamily: "sans-serif",
  maxWidth: "600px",
  margin: "0 auto"
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  paddingBottom: "10px",
  borderBottom: "1px solid #222"
};

const backLinkStyle: React.CSSProperties = {
  color: "#2ecc71",
  textDecoration: "none",
  fontWeight: "bold",
  fontSize: "14px"
};

const sectionStyle: React.CSSProperties = {
  marginBottom: "20px"
};

const formStyle: React.CSSProperties = {
  padding: "20px",
  borderRadius: "12px",
  background: "#111",
  border: "1px solid #333"
};

const inputStyle: React.CSSProperties = {
  padding: "14px",
  borderRadius: "8px",
  border: "1px solid #444",
  marginBottom: "12px",
  display: "block",
  width: "100%",
  fontSize: "16px",
  backgroundColor: "#222",
  color: "#ffffff", // Tiszta fehér szöveg
  boxSizing: "border-box"
};

const searchFieldStyle: React.CSSProperties = {
  ...inputStyle,
  border: "2px solid #2ecc71",
  backgroundColor: "#111", // Kicsit sötétebb, hogy elváljon
  marginBottom: "0"
};

const btnPrimary: React.CSSProperties = {
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  padding: "16px",
  cursor: "pointer",
  width: "100%",
  fontWeight: "bold",
  fontSize: "16px",
  marginTop: "10px"
};

const cardStyle: React.CSSProperties = {
  padding: "15px",
  background: "#111",
  borderRadius: "10px",
  boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
  border: "1px solid #222"
};

const detailsBtnStyle: React.CSSProperties = {
  backgroundColor: "#222",
  color: "#2ecc71",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: "bold",
  padding: "8px 12px",
  borderRadius: "6px",
  border: "1px solid #2ecc71"
};

const deleteBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#e74c3c",
  fontSize: "12px",
  opacity: 0.8
};
