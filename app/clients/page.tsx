"use client";

import React, { useEffect, useState } from "react";

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadClients() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/clients", { cache: "no-store" });
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Váratlan válasz.");
      setClients(data);
    } catch (e: any) {
      setError(e?.message || "Hiba történt a lekéréskor.");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadClients();
  }, []);

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
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      await loadClients();
    } catch (e: any) {
      setError(e?.message || "Hiba történt mentés közben.");
    }
    setSaving(false);
  }

  return (
    <div style={{ padding: 32, fontFamily: "Arial, sans-serif" }}>
      <h1>Ügyfelek</h1>

      {/* Új ügyfél űrlap */}
      <form
        onSubmit={addClient}
        style={{
          display: "grid",
          gap: 8,
          maxWidth: 520,
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
          marginBottom: 24,
          background: "#fafafa",
        }}
      >
        <h3 style={{ margin: 0 }}>Új ügyfél felvétele</h3>
        <input
          placeholder="Név (kötelező)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="E-mail (opcionális)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Telefon (opcionális)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Cím (opcionális)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={inputStyle}
        />
        <button disabled={saving} style={btnPrimary}>
          {saving ? "Mentés..." : "Ügyfél mentése"}
        </button>
      </form>

      {/* Lista / hiba / üres állapot */}
      {loading && <p>Betöltés...</p>}
      {error && (
        <p style={{ color: "crimson" }}>
          Hiba: {error} — frissítsd az oldalt.
        </p>
      )}
      {!loading && !error && clients.length === 0 && <p>Még nincs ügyfél.</p>}

      {/* Ügyfélkártyák */}
      <div style={{ display: "grid", gap: 12 }}>
        {clients.map((c) => (
          <div
            key={c.id}
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: 12,
              display: "grid",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>#{c.id} — {c.name}</strong>
              <a
                href={`/clients/${c.id}`}
                style={{ color: "#4DA3FF", textDecoration: "none" }}
                title="Részletek"
              >
                Részletek →
              </a>
            </div>
            <div style={{ fontSize: 14, color: "#444" }}>
              {c.email && <div>E-mail: {c.email}</div>}
              {c.phone && <div>Telefon: {c.phone}</div>}
              {c.address && <div>Cím: {c.address}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
};

const btnPrimary: React.CSSProperties = {
  background: "#4DA3FF",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "10px 14px",
  cursor: "pointer",
  width: 180,
};
``
