"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import PasswordGuard from "@/components/PasswordGuard"; // Védelem importálása

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
    if (!confirm(`⚠️ BIZTOSAN TÖRÖLNI AKAROD: ${clientName}?`)) return;
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (res.ok) loadClients(searchTerm);
    } catch (e) { console.error(e); }
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
      if (res.ok) {
        setName(""); setEmail(""); setPhone(""); setAddress("");
        loadClients("");
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  return (
    <PasswordGuard moduleKey="CLIENTS">
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h1 style={{ margin: 0, fontSize: "24px" }}>Ügyfelek</h1>
          <Link href="/admin/calendar" style={backLinkStyle}>← Naptár</Link>
        </div>

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
        </div>

        <div style={{ marginTop: "30px" }}>
          <input 
            type="text"
            placeholder="🔍 Keresés..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchFieldStyle}
          />

          <div style={{ display: "grid", gap: "15px", marginTop: "20px" }}>
            {clients.map((c: any) => (
              <div key={c.id} style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", fontSize: "18px", color: "#ffffff", marginBottom: "4px" }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: "15px", color: "#2ecc71", marginBottom: "4px", fontWeight: "500" }}>
                      {c.phone || "Nincs telefonszám"}
                    </div>
                    <div style={{ fontSize: "14px", color: "#dddddd", lineHeight: "1.4" }}>
                      {c.address || "Nincs cím megadva"}
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginLeft: "10px" }}>
                    <Link href={`/clients/${c.id}`} style={detailsBtnStyle}>Részletek</Link>
                    <button onClick={() => handleDelete(c.id, c.name)} style={deleteBtnStyle}>Törlés</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PasswordGuard>
  );
}

// --- STÍLUSOK (Változatlanok) ---
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
  display: "flex", justifyContent: "space-between", alignItems: "center",
  marginBottom: "20px", borderBottom: "1px solid #222", paddingBottom: "10px"
};

const backLinkStyle: React.CSSProperties = { color: "#2ecc71", textDecoration: "none", fontWeight: "bold" };
const sectionStyle: React.CSSProperties = { marginBottom: "20px" };
const formStyle: React.CSSProperties = { padding: "20px", borderRadius: "12px", background: "#111", border: "1px solid #333" };

const inputStyle: React.CSSProperties = {
  padding: "14px", borderRadius: "8px", border: "1px solid #444",
  marginBottom: "12px", display: "block", width: "100%", fontSize: "16px",
  backgroundColor: "#222", 
  color: "#ffffff",
  boxSizing: "border-box"
};

const searchFieldStyle: React.CSSProperties = {
  ...inputStyle, border: "2px solid #2ecc71", backgroundColor: "#000"
};

const btnPrimary: React.CSSProperties = {
  color: "#fff", border: "none", borderRadius: "8px", padding: "16px",
  width: "100%", fontWeight: "bold", fontSize: "16px", cursor: "pointer"
};

const cardStyle: React.CSSProperties = {
  padding: "18px",
  background: "#1a1a1a",
  borderRadius: "12px",
  border: "1px solid #333",
  boxShadow: "0 4px 10px rgba(0,0,0,0.5)"
};

const detailsBtnStyle: React.CSSProperties = {
  backgroundColor: "#2ecc71", color: "#000", textDecoration: "none",
  fontSize: "13px", fontWeight: "bold", padding: "8px 12px", borderRadius: "6px",
  textAlign: "center"
};

const deleteBtnStyle: React.CSSProperties = {
  background: "none", border: "1px solid #e74c3c", cursor: "pointer",
  color: "#e74c3c", fontSize: "12px", padding: "6px", borderRadius: "6px"
};
