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

  // --- ÜGYFÉL TÖRLÉSE A LISTÁBÓL ---
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
    <div style={{ padding: 32, fontFamily: "Arial, sans-serif", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1>Ügyfelek</h1>
        <Link href="/" style={{ color: "#3498db", textDecoration: "none", fontWeight: "bold" }}>← Dashboard</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
        {/* BAL OLDAL: Űrlap */}
        <div>
          <form onSubmit={addClient} style={formStyle}>
            <h3 style={{ margin: "0 0 15px 0" }}>Új ügyfél felvétele</h3>
            <input placeholder="Név" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
            <input placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
            <input placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
            <input placeholder="Cím" value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} />
            <button disabled={saving} style={btnPrimary}>
              {saving ? "Mentés..." : "Ügyfél mentése"}
            </button>
          </form>
          {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}
        </div>

        {/* JOBB OLDAL: Kereső és Lista */}
        <div>
          <input 
            type="text"
            placeholder="🔍 Keresés..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, width: "100%", border: "2px solid #4DA3FF", marginBottom: 15 }}
          />

          {loading && <p>Betöltés...</p>}
          
          <div style={{ display: "grid", gap: 12 }}>
            {clients.map((c: any) => {
              const hasUrgent = c.units?.some((u: any) => {
                if (u.maintenance.length === 0) return true;
                const last = new Date(u.maintenance[0].performedDate);
                return (Math.ceil(Math.abs(new Date().getTime() - last.getTime()) / (1000*60*60*24))) >= 330;
              });

              return (
                <div key={c.id} style={{ 
                  ...cardStyle, 
                  borderLeft: hasUrgent ? "6px solid #e74c3c" : "1px solid #ddd" 
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: "bold" }}>
                        {c.name} {hasUrgent && "⚠️"}
                      </div>
                      <div style={{ fontSize: 12, color: "#666" }}>{c.address || "Nincs cím"}</div>
                    </div>
                    <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
                      <Link href={`/clients/${c.id}`} style={detailsLink}>Részletek →</Link>
                      <button 
                        onClick={() => handleDelete(c.id, c.name)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#e74c3c", fontSize: 16 }}
                        title="Ügyfél törlése"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {!loading && clients.length === 0 && <p style={{ color: "#999" }}>Nincs találat.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = { padding: "10px", borderRadius: 6, border: "1px solid #ddd", marginBottom: 8, display: "block", width: "100%" as const };
const formStyle = { padding: 20, border: "1px solid #ddd", borderRadius: 12, background: "#fafafa" };
const cardStyle = { padding: 15, background: "#fff", borderRadius: 10, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" };
const btnPrimary = { background: "#4DA3FF", color: "#fff", border: "none", borderRadius: 6, padding: "12px", cursor: "pointer", width: "100%" as const, fontWeight: "bold" as const };
const detailsLink = { color: "#4DA3FF", textDecoration: "none", fontSize: 13, fontWeight: "bold" as const };
