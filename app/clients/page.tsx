"use client";

import { useEffect, useState } from "react";

interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // BETÖLTÉS
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/clients");
        const data = await res.json();
        setClients(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ÚJ ÜGYFÉL FELVÉTELE
  async function createClient() {
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        email,
        address,
      }),
    });

    if (res.ok) {
      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setFormOpen(false);
      const updated = await fetch("/api/clients");
      setClients(await updated.json());
    } else {
      alert("Hiba az ügyfél mentésekor.");
    }
  }

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "900px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ marginBottom: "20px" }}>Ügyfelek</h1>

      <button
        onClick={() => setFormOpen(!formOpen)}
        style={{
          padding: "10px 20px",
          background: "#0d6efd",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        {formOpen ? "Mégse" : "Új ügyfél"}
      </button>

      {/* Új ügyfél űrlap */}
      {formOpen && (
        <div
          style={{
            background: "#f8f9fa",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "30px",
            border: "1px solid #ddd",
          }}
        >
          <h3>Új ügyfél felvétele</h3>

          <div style={{ marginTop: "10px" }}>
            <input
              placeholder="Név *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Telefon"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Cím"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={inputStyle}
            />

            <button onClick={createClient} style={saveBtn}>
              Mentés
            </button>
          </div>
        </div>
      )}

      {/* ÜGYFELEK LISTA */}
      {loading ? (
        <p>Betöltés...</p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}
        >
          {clients.map((client) => (
            <div
              key={client.id}
              style={{
                padding: "15px",
                background: "white",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            >
              <a
                href={`/clients/${client.id}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                <h3 style={{ margin: "0 0 5px 0" }}>{client.name}</h3>
              </a>

              {client.phone && <p style={{ margin: 0 }}>📞 {client.phone}</p>}
              {client.email && <p style={{ margin: 0 }}>✉️ {client.email}</p>}
              {client.address && <p style={{ margin: 0 }}>📍 {client.address}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginBottom: "10px",
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
};

const saveBtn: React.CSSProperties = {
  padding: "10px 20px",
  background: "#198754",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  marginTop: "10px",
};
