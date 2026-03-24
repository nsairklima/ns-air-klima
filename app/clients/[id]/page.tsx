"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const Id = params?.id;

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadClientData = async () => {
    const res = await fetch(`/api/clients/${Id}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setClient(data);
    }
    setLoading(false);
  };

  useEffect(() => { if (Id) loadClientData(); }, [Id]);

  if (loading) return <div style={{padding: 20}}>Betöltés...</div>;
  if (!client) return <div style={{padding: 20}}>Ügyfél nem található.</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto", fontFamily: "Arial" }}>
      
      {/* 1. SZEKCIÓ: ÜGYFÉL ADATLAP FEJLÉC */}
      <div style={headerCard}>
        <h1>{client.name}</h1>
        <p>📞 {client.phone} | ✉️ {client.email}</p>
      </div>

      {/* 2. SZEKCIÓ: TELEPÍTETT GÉPEK (UNITS) */}
      <div style={{ marginTop: 40 }}>
        <h2 style={{ borderBottom: "2px solid #27ae60", paddingBottom: 10 }}>🛠️ Telepített gépek</h2>
        <div style={{ display: "grid", gap: 15, marginTop: 15 }}>
          {client.units?.length > 0 ? (
            client.units.map((unit: any) => (
              <div key={unit.id} style={unitCard}>
                <div>
                  <strong>{unit.brand} {unit.model}</strong>
                  <div style={{ fontSize: "14px", color: "#666" }}>📍 {unit.location} | SN: {unit.serialNumber}</div>
                </div>
                <button onClick={() => router.push(`/clients/${Id}/unit/${unit.id}`)} style={btnBlue}>
                  Karbantartás →
                </button>
              </div>
            ))
          ) : (
            <p style={emptyText}>Nincs rögzített gép.</p>
          )}
        </div>
      </div>

      {/* 3. SZEKCIÓ: ÁRAJÁNLATOK (QUOTES) - EZ VOLT ELCSÚSZTVA */}
      <div style={{ marginTop: 50 }}>
        <h2 style={{ borderBottom: "2px solid #3498db", paddingBottom: 10 }}>📄 Korábbi árajánlatok</h2>
        <div style={{ display: "grid", gap: 15, marginTop: 15 }}>
          {client.quotes?.length > 0 ? (
            client.quotes.map((quote: any) => (
              <div key={quote.id} style={quoteCard}>
                <div>
                  <div style={{ fontWeight: "bold" }}>#{quote.id} - {quote.title || "Névtelen ajánlat"}</div>
                  <div style={{ fontSize: "12px", color: "#888" }}>
                    Kelt: {new Date(quote.createdAt).toLocaleDateString('hu-HU')} | Állapot: {quote.status}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
                  <div style={{ fontWeight: "bold", color: "#2c3e50" }}>
                    {Number(quote.grossTotal).toLocaleString()} Ft
                  </div>
                  <button onClick={() => router.push(`/quotes/${quote.id}`)} style={btnOrange}>✏️</button>
                </div>
              </div>
            ))
          ) : (
            <p style={emptyText}>Még nem készült árajánlat.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* STÍLUSOK */
const headerCard = { padding: 20, borderBottom: "3px solid #eee", marginBottom: 20 };
const unitCard = { padding: 15, border: "1px solid #e0e0e0", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f9f9f9" };
const quoteCard = { padding: 15, border: "1px solid #d0e1f9", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff" };
const emptyText = { color: "#999", fontStyle: "italic", padding: 10 };
const btnBlue = { background: "#3498db", color: "#fff", border: "none", padding: "8px 15px", borderRadius: 6, cursor: "pointer" };
const btnOrange = { background: "#f39c12", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 6, cursor: "pointer" };
