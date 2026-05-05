"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type Quote = {
  id: number;
  title?: string; // Hozzáadva az egyedi névhez
  status: string;
  netTotal: number;
  grossTotal: number;
  createdAt: string;
  client: { name: string };
};


export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadQuotes() {
    try {
      setLoading(true);
      const res = await fetch("/api/quotes", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.details || data.error || "Hiba a letöltéskor");
      }

      if (Array.isArray(data)) {
        setQuotes(data);
      } else {
        setQuotes([]);
      }
    } catch (err: any) {
      console.error("Hiba az ajánlatok betöltésekor", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuotes();
  }, []);

  if (loading) return <div style={wrap}><p>Betöltés...</p></div>;
  
  if (error) return (
    <div style={wrap}>
      <h1 style={{ color: "#c92a2a" }}>Hiba történt</h1>
      <p>{error}</p>
      <button onClick={() => window.location.reload()} style={btnPrimary}>Újratöltés</button>
    </div>
  );

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
           <Link href="/" style={navBtn}>🏠</Link>
           <h1 style={{ margin: 0, color: "#fff" }}>Ajánlatok</h1>
        </div>
        <Link href="/quotes/new" style={btnPrimary}>+ Új ajánlat</Link>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {quotes.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, border: "2px dashed #444", borderRadius: 12 }}>
            <p style={{ color: "#aaa" }}>Még nincsenek ajánlatok a rendszerben.</p>
          </div>
        )}
        
        {quotes.map((q) => {
          // Megnézzük, van-e egyedi cím, ha nincs, az ügyfél neve az elsődleges
          const displayTitle = q.title && q.title.trim() !== "" ? q.title : q.client?.name;
          const hasCustomTitle = q.title && q.title.trim() !== "" && q.title !== q.client?.name;

          return (
            <div key={q.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <strong style={{ fontSize: 20, color: "#2c3e50", display: "block" }}>
                    {displayTitle || "Névtelen ajánlat"}
                  </strong>
                  
                  <div style={{ fontSize: 13, color: "#7f8c8d", marginTop: 4 }}>
                    #{q.id} • {new Date(q.createdAt).toLocaleDateString("hu-HU")}
                    {/* Ha egyedi címet írtunk ki fent, ide beszúrjuk az ügyfél nevét is */}
                    {hasCustomTitle && ` • 👤 ${q.client?.name}`}
                  </div>
                </div>
                <span style={statusBadge(q.status)}>{q.status}</span>
              </div>

              <div style={{ 
                marginTop: 15, 
                paddingTop: 15, 
                borderTop: "1px solid #f0f0f0", 
                display: "flex", 
                justifyContent: "space-between",
                alignItems: "center" 
              }}>
                <div style={{ fontWeight: "bold", fontSize: 17 }}>
                  Bruttó: <span style={{ color: "#2c3e50" }}>{q.grossTotal?.toLocaleString("hu-HU")} Ft</span>
                </div>
                <Link href={`/quotes/${q.id}`} style={detailsLink}>
                  Részletek és szerkesztés →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Stílusok ---- */
const wrap: React.CSSProperties = { padding: "24px 16px", maxWidth: 800, margin: "0 auto", fontFamily: "Arial, sans-serif" };
const card: React.CSSProperties = { border: "1px solid #eee", padding: 20, borderRadius: 12, background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" };
const btnPrimary: React.CSSProperties = { background: "#4DA3FF", color: "#fff", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontWeight: "bold", fontSize: 14 };
const navBtn: React.CSSProperties = { padding: "8px 12px", borderRadius: 8, border: "1px solid #444", background: "#333", color: "#fff", textDecoration: "none" };
const detailsLink: React.CSSProperties = { color: "#4DA3FF", textDecoration: "none", fontSize: 14, fontWeight: "bold" };

function statusBadge(status: string): React.CSSProperties {
  const base: React.CSSProperties = { padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" };
  
  switch (status.toLowerCase()) {
    case "accepted":
    case "elfogadva":
      return { ...base, background: "#e9f9ee", color: "#2b8a3e" };
    case "sent":
    case "elküldve":
      return { ...base, background: "#fff7d1", color: "#856404" };
    case "rejected":
    case "elutasítva":
      return { ...base, background: "#ffe5e5", color: "#c92a2a" };
    case "draft":
    case "vázlat":
      return { ...base, background: "#f1f3f5", color: "#495057" };
    default:
      return { ...base, background: "#f1f3f5", color: "#495057" };
  }
}
