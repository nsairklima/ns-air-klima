"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function QuotesPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const clientId = sp.get("clientId");

  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const url = clientId
      ? `/api/quotes?clientId=${clientId}`
      : `/api/quotes`;

    const res = await fetch(url);
    const data = await res.json();
    setQuotes(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [clientId]);

  async function createQuote() {
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: Number(clientId) }),
    });

    if (res.ok) {
      const q = await res.json();
      router.push(`/quotes/${q.id}`);
    } else {
      alert("Hiba történt.");
    }
  }

  return (
    <div style={{ padding: 40, maxWidth: 900, margin: "0 auto" }}>
      <h1>Ajánlatok</h1>

      {clientId && (
        <button
          onClick={createQuote}
          style={{ padding: 10, background: "#0d6efd", color: "#fff", borderRadius: 6 }}
        >
          Új ajánlat
        </button>
      )}

      {loading ? (
        <p>Betöltés...</p>
      ) : quotes.length === 0 ? (
        <p>Nincs ajánlat.</p>
      ) : (
        <div style={{ marginTop: 16 }}>
          {quotes.map((q: any) => (
            <div key={q.id} style={{ padding: 16, border: "1px solid #ccc", borderRadius: 10, marginBottom: 10 }}>
              <strong>{q.quoteNo}</strong> – {q.status}
              <br />
              Nettó: {q.netTotal} Ft · Bruttó: {q.grossTotal} Ft
              <br /><br />
              <a href={`/quotes/${q.id}`} style={{ marginRight: 10 }}>Megnyitás</a>
              <a href={`/api/quotes/${q.id}/pdf`} target="_blank">PDF</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
