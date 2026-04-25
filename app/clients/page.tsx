"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordGuard from "@/components/PasswordGuard";

type Client = {
  id: number;
  name: string;
  phone?: string;
  address?: string;
};

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadClients(query: string = "") {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients?search=${encodeURIComponent(query)}`, { cache: "no-store" });
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("Hiba a betöltéskor.");
    }
    setLoading(false);
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => loadClients(searchTerm), 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  async function handleDelete(id: number, clientName: string) {
    if (!confirm(`⚠️ Törölni akarod: ${clientName}?`)) return;
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (res.ok) loadClients(searchTerm);
  }

  return (
    <PasswordGuard moduleKey="CLIENTS">
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h1 style={{ margin: 0, fontSize: "24px" }}>Ügyfelek</h1>
          <Link href="/admin/calendar" style={backLinkStyle}>← Naptár</Link>
        </div>

        {/* ÚJ ÜGYFÉL GOMB - Ez most már ugyanoda visz, mint a naptárból a + gomb */}
        <div style={{ marginBottom: "25px" }}>
          <button 
            onClick={() => router.push("/clients/new")} 
            style={bigAddBtnStyle}
          >
            + ÚJ ÜGYFÉL ÉS GÉP FELVÉTELE
          </button>
        </div>

        <div style={{ marginTop: "10px" }}>
          <input 
            type="text"
            placeholder="🔍 Keresés az ügyfelek között..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchFieldStyle}
          />

          <div style={{ display: "grid", gap: "12px", marginTop: "20px" }}>
            {loading ? <p>Betöltés...</p> : clients.map((c) => (
              <div key={c.id} style={cardStyle}>
                <div style={cardFlex}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", fontSize: "18px", color: "#fff" }}>{c.name}</div>
                    <div style={{ color: "#2ecc71", fontSize: "15px", margin: "4px 0" }}>{c.phone || "---"}</div>
                    <div style={{ color: "#94a3b8", fontSize: "13px" }}>{c.address || "Nincs cím"}</div>
                  </div>
                  <div style={actionBox}>
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

// --- STÍLUSOK ---

const containerStyle: React.CSSProperties = {
  padding: "15px", backgroundColor: "#000", minHeight: "100vh", color: "#fff",
  fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto"
};

const headerStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  marginBottom: "20px", borderBottom: "1px solid #222", paddingBottom: "10px"
};

const bigAddBtnStyle: React.CSSProperties = {
  width: "100%", padding: "18px", backgroundColor: "#2ecc71", color: "#000",
  border: "none", borderRadius: "12px", fontWeight: "900", fontSize: "16px",
  cursor: "pointer", boxShadow: "0 4px 15px rgba(46, 204, 113, 0.3)"
};

const backLinkStyle: React.CSSProperties = { color: "#2ecc71", textDecoration: "none", fontWeight: "bold" };

const searchFieldStyle: React.CSSProperties = {
  width: "100%", padding: "14px", borderRadius: "10px", border: "2px solid #2ecc71",
  backgroundColor: "#111", color: "#fff", fontSize: "16px", boxSizing: "border-box"
};

const cardStyle: React.CSSProperties = {
  padding: "16px", background: "#1a1a1a", borderRadius: "12px", border: "1px solid #333"
};

const cardFlex: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px"
};

const actionBox: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: "8px"
};

const detailsBtnStyle: React.CSSProperties = {
  backgroundColor: "#2ecc71", color: "#000", textDecoration: "none",
  fontSize: "13px", fontWeight: "bold", padding: "8px 12px", borderRadius: "6px", textAlign: "center"
};

const deleteBtnStyle: React.CSSProperties = {
  background: "none", border: "1px solid #e74c3c", color: "#e74c3c",
  fontSize: "11px", padding: "6px", borderRadius: "6px", cursor: "pointer"
};
