"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";


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
  const [isMobile, setIsMobile] = useState(false);

  // Mobilnézet figyelése
  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 768);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

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
      <div style={{ ...containerStyle, padding: isMobile ? "12px" : "15px" }}>
        
        {/* NAVIGÁCIÓS FEJLÉC */}
        <div style={headerStyle}>
          <h1 style={{ margin: 0, fontSize: isMobile ? "22px" : "24px" }}>Ügyfelek</h1>
          <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
            <Link href="/" style={backLinkStyle}>🏠 Főmenü</Link>
            <Link href="/admin/calendar" style={backLinkStyle}>📅 Naptár</Link>
          </div>
        </div>

        {/* ÚJ ÜGYFÉL GOMB */}
        <div style={{ marginBottom: "20px" }}>
          <button 
            onClick={() => router.push("/clients/new")} 
            style={{ ...bigAddBtnStyle, padding: isMobile ? "15px" : "18px", fontSize: isMobile ? "14px" : "16px" }}
          >
            + ÚJ ÜGYFÉL ÉS GÉP FELVÉTELE
          </button>
        </div>

        <div style={{ marginTop: "10px" }}>
          {/* KERESŐMEZŐ */}
          <input 
            type="text"
            placeholder="🔍 Keresés az ügyfelek között..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchFieldStyle}
          />

          <div style={{ display: "grid", gap: "12px", marginTop: "20px" }}>
            {loading ? (
              <p style={{ opacity: 0.5, textAlign: "center", padding: "20px" }}>Betöltés...</p>
            ) : (
              clients.map((c) => (
                <div key={c.id} style={cardStyle}>
                  <div style={{ ...cardFlex, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "flex-start" }}>
                    <div style={{ flex: 1, marginBottom: isMobile ? "12px" : "0" }}>
                      <div style={{ fontWeight: "bold", fontSize: "18px", color: "#fff" }}>{c.name}</div>
                      <div style={{ color: "#2ecc71", fontSize: "15px", margin: "4px 0" }}>{c.phone || "---"}</div>
                      <div style={{ color: "#94a3b8", fontSize: "13px" }}>{c.address || "Nincs cím"}</div>
                    </div>
                    
                    {/* Akciógombok */}
                    <div style={{ ...actionBox, flexDirection: isMobile ? "row" : "column", width: isMobile ? "100%" : "auto" }}>
                      <Link href={`/clients/${c.id}`} style={{ ...detailsBtnStyle, flex: isMobile ? 1 : "none" }}>Részletek</Link>
                      <button onClick={() => handleDelete(c.id, c.name)} style={{ ...deleteBtnStyle, flex: isMobile ? 1 : "none" }}>Törlés</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
  );
}

// --- MODERN STÍLUSOK ---

const containerStyle: React.CSSProperties = {
  backgroundColor: "#000", 
  minHeight: "100vh", 
  color: "#fff",
  fontFamily: "sans-serif", 
  maxWidth: "600px", 
  margin: "0 auto",
  width: "100%",
  boxSizing: "border-box"
};

const headerStyle: React.CSSProperties = {
  display: "flex", 
  justifyContent: "space-between", 
  alignItems: "center",
  marginBottom: "20px", 
  borderBottom: "1px solid #222", 
  paddingBottom: "10px"
};

const bigAddBtnStyle: React.CSSProperties = {
  width: "100%", 
  backgroundColor: "#2ecc71", 
  color: "#000",
  border: "none", 
  borderRadius: "12px", 
  fontWeight: "900", 
  cursor: "pointer", 
  boxShadow: "0 4px 15px rgba(46, 204, 113, 0.3)",
  boxSizing: "border-box"
};

const backLinkStyle: React.CSSProperties = { 
  color: "#2ecc71", 
  textDecoration: "none", 
  fontWeight: "bold",
  fontSize: "15px"
};

const searchFieldStyle: React.CSSProperties = {
  width: "100%", 
  padding: "14px", 
  borderRadius: "10px", 
  border: "2px solid #2ecc71",
  backgroundColor: "#111", 
  color: "#fff", 
  fontSize: "16px", 
  boxSizing: "border-box",
  display: "block"
};

const cardStyle: React.CSSProperties = {
  padding: "16px", 
  background: "#1a1a1a", 
  borderRadius: "12px", 
  border: "1px solid #333",
  boxSizing: "border-box",
  width: "100%"
};

const cardFlex: React.CSSProperties = {
  display: "flex", 
  justifyContent: "space-between", 
  gap: "10px"
};

const actionBox: React.CSSProperties = {
  display: "flex", 
  gap: "8px"
};

const detailsBtnStyle: React.CSSProperties = {
  backgroundColor: "#2ecc71", 
  color: "#000", 
  textDecoration: "none",
  fontSize: "13px", 
  fontWeight: "bold", 
  padding: "10px 12px", 
  borderRadius: "6px", 
  textAlign: "center",
  display: "inline-block",
  boxSizing: "border-box"
};

const deleteBtnStyle: React.CSSProperties = {
  background: "none", 
  border: "1px solid #e74c3c", 
  color: "#e74c3c",
  fontSize: "13px", 
  padding: "10px", 
  borderRadius: "6px", 
  cursor: "pointer",
  boxSizing: "border-box"
};
