"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link"; // A Link gyorsabb, mint az <a> tag

type Client = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); // Új: keresési állapot
  
  // Űrlap állapotok
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kereséssel kombinált betöltés
  async function loadClients(query: string = "") {
    setLoading(true);
    setError(null);
    try {
      // Az API-nak átadjuk a keresési paramétert
      const res = await fetch(`/api/clients?search=${encodeURIComponent(query)}`, { cache: "no-store" });
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Váratlan válasz.");
      setClients(data);
    } catch (e: any) {
      setError(e?.message || "Hiba történt a lekéréskor.");
    }
    setLoading(false);
  }

  // Figyeljük a searchTerm változását (Debounce technika)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadClients(searchTerm);
    }, 400); // 0.4 másodperc várakozás gépelés után

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  async function addClient(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      alert("A név kötelező.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, address }),
      });
      if (!res.ok) throw new Error("Mentési hiba.");
      
      // Mezők ürítése
      setName(""); setEmail(""); setPhone(""); setAddress("");
      setSearchTerm(""); // Kereső ürítése, hogy lássuk az új elemet a teljes listában
      await loadClients("");
    } catch (e: any) {
      setError(e?.message || "Hiba történt mentés közben.");
    }
    setSaving(false);
  }

  return (
    <div style={{ padding: 32, fontFamily: "Arial, sans-serif", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Ügyfelek</h1>
        <Link href="/" style={{ color: "#666", textDecoration: "none" }}>← Vissza a Dashboardra</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, marginTop: 20 }}>
        
        {/* BAL OLDAL: Új ügyfél űrlap */}
        <div>
          <form onSubmit={addClient} style={formStyle}>
            <h3 style={{ margin: "0 0 10px 0" }}>Új ügyfél felvétele</h3>
            <input placeholder="Név (kötelező)" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
            <input placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
            <input placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
            <input placeholder="Cím" value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} />
            <button disabled={saving} style={btnPrimary}>
              {saving ? "Mentés..." : "Ügyfél mentése"}
            </button>
          </form>
        </div>

        {/* JOBB OLDAL: Kereső és Lista */}
        <div>
          <div style={{ marginBottom: 15 }}>
            <input 
              type="text"
              placeholder="🔍 Keresés név vagy cím alapján..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...inputStyle, width: "100%", border: "2px solid #4DA3FF" }}
            />
          </div>

          {loading && <p>Betöltés...</p>}
          {error && <p style={{ color: "crimson" }}>Hiba: {error}</p>}
          
          <div style={{ display: "grid", gap: 12 }}>
            {!loading && clients.length === 0 && <p style={{ color: "#888" }}>Nincs találat.</p>}
            {clients.map((c: any) => {
  // Megnézzük, van-e sürgős gépe
  const hasUrgentUnit = c.units?.some((unit: any) => {
    if (unit.maintenance.length === 0) return true; // Sosem volt tisztítva
    const lastDate = new Date(unit.maintenance[0].performedDate);
    const diffDays = Math.ceil(Math.abs(new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 330;
  });

  return (
    <div key={c.id} style={{ 
      ...cardStyle, 
      borderLeft: hasUrgentUnit ? "6px solid #e74c3c" : "1px solid #e5e5e5",
      background: hasUrgentUnit ? "#fffcfc" : "#fff"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <strong style={{ fontSize: 16 }}>{c.name}</strong>
            {hasUrgentUnit && (
              <span style={{ background: "#e74c3c", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: "bold" }}>
                ESEDÉKES!
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{c.address || "Nincs cím"}</div>
          <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
            {c.units?.length || 0} regisztrált gép
          </div>
        </div>
        <Link href={`/clients/${c.id}`} style={detailsLink}>
                    Részletek →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Stílusok (kicsit pofásabbá tettem)
const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
  marginBottom: 8,
  display: "block",
  width: "100%"
};

const formStyle: React.CSSProperties = {
  padding: 20,
  border: "1px solid #ddd",
  borderRadius: 12,
  background: "#fafafa",
  position: "sticky",
  top: 20
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e5e5",
  borderRadius: 10,
  padding: "15px",
  background: "#fff",
  boxShadow: "0 2px 4px rgba(0,0,0,0.03)"
};

const btnPrimary: React.CSSProperties = {
  background: "#4DA3FF",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "12px",
  cursor: "pointer",
  fontWeight: "bold",
  width: "100%",
  marginTop: 10
};

const detailsLink: React.CSSProperties = {
  color: "#4DA3FF",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: "bold",
  background: "#f0f7ff",
  padding: "5px 10px",
  borderRadius: 6
};
