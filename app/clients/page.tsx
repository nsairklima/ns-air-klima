"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Unit {
  id: number;
  brand: string;
  model: string;
  serialNumber?: string;
}

interface Client {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  units?: Unit[];
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Új ügyfél form állapotok
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const router = useRouter();

  const loadClients = useCallback(async (search: string = "") => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/clients?search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error("Hiba az ügyfelek betöltése során.");
      const data = await res.json();
      setClients(data);
    } catch (err: unknown) {
      console.error(err);
      setError("Hiba a betöltéskor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadClients(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, loadClients]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("A név megadása kötelező!");

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, address }),
      });

      if (!res.ok) throw new Error("A mentés nem sikerült.");

      const newClient = await res.json();
      setName("");
      setPhone("");
      setAddress("");
      setIsCreating(false);
      loadClients(searchTerm);
      router.push(`/clients/${newClient.id}`);
    } catch (err: unknown) {
      alert("Hiba történt az ügyfél létrehozásakor.");
      console.error(err);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Biztosan törölni szeretnéd ezt az ügyfelet?")) return;

    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("A törlés nem sikerült.");

      loadClients(searchTerm);
      router.refresh();
    } catch (err: unknown) {
      alert("Hiba a törlés során.");
      console.error(err);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={headerS}>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={navBtn} onClick={() => router.push("/")}>
            ← Főoldal
          </button>
          <button style={navBtn} onClick={() => router.push("/inventory")}>
            Raktár
          </button>
        </div>
        <button
          style={isCreating ? btnCancel : btnGreen}
          onClick={() => setIsCreating(!isCreating)}
        >
          {isCreating ? "Mégse" : "+ Új Ügyfél"}
        </button>
      </div>

      <h1 style={{ marginBottom: "20px" }}>Ügyfelek Adatbázisa</h1>

      {/* LÉTREHOZÁS FORM */}
      {isCreating && (
        <form onSubmit={handleCreate} style={formBoxS}>
          <h3 style={{ marginTop: 0, marginBottom: "15px" }}>Új ügyfél hozzáadása</h3>
          <div style={{ display: "grid", gap: "10px", marginBottom: "15px" }}>
            <input
              style={inputS}
              placeholder="Ügyfél neve (kötelező)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              style={inputS}
              placeholder="Telefonszám"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <input
              style={inputS}
              placeholder="Cím"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <button type="submit" style={btnGreen}>
            Mentés
          </button>
        </form>
      )}

      {/* KERESŐSÁV */}
      <input
        style={{ ...inputS, marginBottom: "20px" }}
        placeholder="Keresés név, telefon vagy cím alapján..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* HIBAÜZENET */}
      {error && <div style={{ color: "#e74c3c", marginBottom: "15px" }}>{error}</div>}

      {/* LISTA */}
      {loading ? (
        <p style={{ color: "#888" }}>Betöltés...</p>
      ) : clients.length === 0 ? (
        <p style={{ color: "#888" }}>Nincs találat.</p>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div style={cardS}>
                <div>
                  <h3 style={{ margin: "0 0 5px 0", color: "#fff" }}>{client.name}</h3>
                  <div style={{ fontSize: "14px", color: "#aaa" }}>
                    {client.phone && <span>📞 {client.phone} </span>}
                    {client.address && <span>📍 {client.address}</span>}
                  </div>
                  {client.units && client.units.length > 0 && (
                    <div style={{ marginTop: "8px", fontSize: "12px", color: "#2ecc71" }}>
                      💻 {client.units.length} db berendezés regisztrálva
                    </div>
                  )}
                </div>
                <button
                  style={btnDeleteHeader}
                  onClick={(e) => handleDelete(client.id, e)}
                  title="Ügyfél törlése"
                >
                  🗑️
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// STÍLUSOK
const containerStyle: React.CSSProperties = {
  backgroundColor: "#000",
  minHeight: "100vh",
  maxWidth: "1000px",
  margin: "0 auto",
  padding: "20px",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  color: "#fff",
  boxSizing: "border-box",
};

const headerS: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  borderBottom: "1px solid #333",
  paddingBottom: "15px",
};

const navBtn: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: "8px",
  border: "none",
  background: "#1e293b",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "14px",
};

const inputS: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "10px",
  border: "1px solid #333",
  backgroundColor: "#18181b",
  color: "#fff",
  outline: "none",
  fontSize: "15px",
  boxSizing: "border-box",
};

const formBoxS: React.CSSProperties = {
  background: "#121214",
  padding: "20px",
  borderRadius: "16px",
  marginBottom: "20px",
  border: "1px solid #27272a",
};

const cardS: React.CSSProperties = {
  background: "#18181b",
  padding: "16px 20px",
  borderRadius: "12px",
  border: "1px solid #27272a",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  transition: "border-color 0.2s",
};

const btnGreen: React.CSSProperties = {
  background: "#2ecc71",
  color: "#000",
  border: "none",
  padding: "10px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "14px",
};

const btnCancel: React.CSSProperties = {
  background: "#444",
  color: "#fff",
  border: "none",
  padding: "10px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "14px",
};

const btnDeleteHeader: React.CSSProperties = {
  background: "#3a1515",
  color: "#ff6b6b",
  border: "none",
  padding: "8px 12px",
  borderRadius: "8px",
  cursor: "pointer",
};
