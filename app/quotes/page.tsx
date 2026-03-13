"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Quote = {
  id: number;
  quoteNo: string;
  status: "draft" | "sent" | "accepted" | "rejected";
  netTotal?: number | null;
  vatAmount?: number | null;
  grossTotal?: number | null;
  clientId: number;
};

export default function QuotesPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const clientId = sp.get("clientId");

  const [list, setList] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "status">("date");

  useEffect(() => {
    async function load() {
      const url = clientId ? `/api/quotes?clientId=${clientId}` : "/api/quotes";
      const res = await fetch(url);
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
      setLoading(false);
    }
    load();
  }, [clientId]);

  const sorted = useMemo(() => {
    const copy = [...list];
    if (sortBy === "status") {
      const order = { draft: 0, sent: 1, accepted: 2, rejected: 3 } as const;
      copy.sort((a, b) => order[a.status] - order[b.status]);
    } else {
      // date: feltételezzük, hogy az ID növekvő = régebbi → újabb
      copy.sort((a, b) => b.id - a.id);
    }
    return copy;
  }, [list, sortBy]);

  async function createQuote() {
    if (!clientId) return alert("Hiányzik a clientId a felső URL-ből.");
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: Number(clientId) }),
    });
    if (res.ok) {
      const q = await res.json();
      router.push(`/quotes/${q.id}`);
    } else {
      alert("Hiba az ajánlat létrehozásakor.");
    }
  }

  return (
    <div style={wrap}>
      <h1>Ajánlatok</h1>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        {clientId && (
          <button onClick={createQuote} style={btnPrimary}>
            Új ajánlat (ügyfél #{clientId})
          </button>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <label>Rendezés:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
          >
            <option value="date">Dátum (újabb elöl)</option>
            <option value="status">Státusz</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p>Betöltés…</p>
      ) : sorted.length === 0 ? (
        <p>Nincs ajánlat.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.map((q) => (
            <div key={q.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <strong>{q.quoteNo}</strong>
                    <StatusBadge status={q.status} />
                  </div>
                  <div style={{ opacity: 0.8, marginTop: 6 }}>
                    Nettó: {q.netTotal ?? 0} Ft · ÁFA: {q.vatAmount ?? 0} Ft · Bruttó: {q.grossTotal ?? 0} Ft
                  </div>
                </div>
                <div>
                  <a href={`/quotes/${q.id}`} style={btn}>Megnyitás</a>
                  <a href={`/api/quotes/${q.id}/pdf`} target="_blank" style={{ ...btn, marginLeft: 8 }}>
                    PDF
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Quote["status"] }) {
  const map: Record<Quote["status"], { bg: string; color: string; label: string }> = {
    draft: { bg: "#e9ecef", color: "#333", label: "Piszkozat" },
    sent: { bg: "#fff3cd", color: "#7a5a00", label: "Kiküldve" },
    accepted: { bg: "#d1e7dd", color: "#0f5132", label: "Elfogadva" },
    rejected: { bg: "#f8d7da", color: "#842029", label: "Elutasítva" },
  };
  const s = map[status];
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      padding: "4px 8px",
      borderRadius: 999,
      fontSize: 12,
      border: "1px solid rgba(0,0,0,0.08)"
    }}>
      {s.label}
    </span>
  );
}

const wrap: React.CSSProperties = { padding: 40, maxWidth: 900, margin: "0 auto", fontFamily: "Arial, sans-serif" };
const card: React.CSSProperties = { background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: 16 };
const btn: React.CSSProperties = { padding: "8px 12px", background: "#eee", borderRadius: 8, textDecoration: "none", color: "#333" };
const btnPrimary: React.CSSProperties = { ...btn, background: "#0d6efd", color: "#fff" };
