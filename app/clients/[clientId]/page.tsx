"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Client = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
};

export default function ClientDetailPage() {
  const params = useParams<{ clientId: string }>();
  const clientId = Number(params.clientId);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/clients/${clientId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Lekérési hiba");
      const data = await res.json();
      setClient(data);
    } catch (e: any) {
      setErr(e?.message || "Hiba történt.");
    }
    setLoading(false);
  }

  useEffect(() => {
    if (Number.isFinite(clientId)) load();
  }, [clientId]);

  return (
    <div style={{ padding: 32, fontFamily: "Arial, sans-serif" }}>
      <a href="/clients" style={{ textDecoration: "none" }}>← Vissza az ügyfelekhez</a>
      <h1 style={{ marginTop: 12 }}>Ügyfél részletei</h1>

      {loading && <p>Betöltés...</p>}
      {err && <p style={{ color: "crimson" }}>Hiba: {err}</p>}
      {!loading && !client && <p>Ügyfél nem található.</p>}

      {client && (
        <div style={{ display: "grid", gap: 8, maxWidth: 600 }}>
          <div><strong>#{client.id}</strong></div>
          <div><strong>Név:</strong> {client.name}</div>
          {client.email && <div><strong>E-mail:</strong> {client.email}</div>}
          {client.phone && <div><strong>Telefon:</strong> {client.phone}</div>}
          {client.address && <div><strong>Cím:</strong> {client.address}</div>}

          <hr style={{ margin: "16px 0" }} />

          <div style={{ fontSize: 14, color: "#555" }}>
            Itt fognak megjelenni a felvett <strong>klímák</strong> és a
            <strong> karbantartások</strong>. A következő lépésben ezt is beépítjük.
          </div>
        </div>
      )}
    </div>
  );
}
