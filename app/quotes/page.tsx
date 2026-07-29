"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type QuoteItem = {
  id: number;
  name?: string;
  sku?: string;
  code?: string;
  articleNumber?: string;
};

type Quote = {
  id: number;
  title?: string;
  status: string;
  netTotal: number;
  grossTotal: number;
  createdAt: string;
  client: { name: string; address?: string };
  items?: QuoteItem[];
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

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

  // STÁTUSZ FRISSÍTŐ FÜGGVÉNY
  const handleStatusChange = async (e: React.MouseEvent, id: number, newStatus: string) => {
    e.preventDefault();
    e.stopPropagation();

    setUpdatingId(id);
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Frissítjük a helyi állapotot azonnal
        setQuotes((prev) =>
          prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
        );
      } else {
        alert("Nem sikerült a státusz frissítése.");
      }
    } catch (err) {
      console.error("Státusz frissítési hiba:", err);
      alert("Hálózati hiba történt.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Biztosan törölni szeretnéd ezt az ajánlatot? Ez a művelet végleges!")) {
      return;
    }

    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setQuotes((prev) => prev.filter((q) => q.id !== id));
      } else {
        const errData = await res.json();
        alert("Hiba: " + (errData.error || "Nem sikerült a törlés"));
      }
    } catch (err) {
      console.error("Törlési hiba:", err);
      alert("Hálózati hiba történt a törléskor.");
    }
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  const filteredQuotes = quotes.filter((q) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const clientName = q.client?.name?.toLowerCase() || "";
    const clientAddress = q.client?.address?.toLowerCase() || "";
    const title = q.title?.toLowerCase() || "";
    const quoteId = String(q.id);

    const hasMatchingSku = q.items?.some((item) => {
      const sku = (item.sku || item.code || item.articleNumber || "").toLowerCase();
      return sku.includes(query);
    });

    return (
      clientName.includes(query) ||
      clientAddress.includes(query) ||
      title.includes(query) ||
      quoteId.includes(query) ||
      hasMatchingSku
    );
  });

  if (loading) return <div style={wrap}><p style={{color: "#fff"}}>Betöltés...</p></div>;
  
  if (error) return (
    <div style={wrap}>
      <h1 style={{ color: "#c92a2a" }}>Hiba történt</h1>
      <p style={{color: "#fff"}}>{error}</p>
      <button onClick={() => window.location.reload()} style={btnPrimary}>Újratöltés</button>
    </div>
  );

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
           <Link href="/" style={navBtn}>🏠</Link>
           <h1 style={{ margin: 0, color: "#fff" }}>Ajánlatok ({filteredQuotes.length})</h1>
        </div>
        <Link href="/quotes/new" style={btnPrimary}>+ Új ajánlat</Link>
      </div>

      <div style={{ marginBottom: 20, position: "relative" }}>
        <input
          type="text"
          placeholder="🔍 Keresés ügyfélnév, cím, azonosító (#), megnevezés vagy cikkszám alapján..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 40px 12px 14px",
            borderRadius: "10px",
            border: "1px solid #444",
            backgroundColor: "#222",
            color: "#fff",
            fontSize: "14px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "#aaa",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            ✖
          </button>
        )}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {filteredQuotes.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, border: "2px dashed #444", borderRadius: 12 }}>
            <p style={{ color: "#aaa" }}>
              {searchQuery ? "Nincs a keresésnek megfelelő ajánlat." : "Még nincsenek ajánlatok a rendszerben."}
            </p>
          </div>
        )}
        
        {filteredQuotes.map((q) => {
          const displayTitle = q.title && q.title.trim() !== "" ? q.title : q.client?.name;
          const hasCustomTitle = q.title && q.title.trim() !== "" && q.title !== q.client?.name;

          const skus = q.items
            ?.map((item) => item.sku || item.code || item.articleNumber)
            .filter(Boolean) as string[];
          const uniqueSkus = Array.from(new Set(skus));

          const currentStatus = q.status.toLowerCase();
          const isAccepted = currentStatus === "accepted" || currentStatus === "elfogadva";
          const isRejected = currentStatus === "rejected" || currentStatus === "elutasítva";

          return (
            <div key={q.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <strong style={{ fontSize: 20, color: "#2c3e50", display: "block" }}>
                    {displayTitle || "Névtelen ajánlat"}
                  </strong>
                  
                  <div style={{ fontSize: 13, color: "#7f8c8d", marginTop: 4 }}>
                    #{q.id} • {new Date(q.createdAt).toLocaleDateString("hu-HU")}
                    {hasCustomTitle && ` • 👤 ${q.client?.name}`}
                  </div>

                  {uniqueSkus.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {uniqueSkus.map((sku, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: 11,
                            background: "#e0f2fe",
                            color: "#0369a1",
                            border: "1px solid #7dd3fc",
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontWeight: "600",
                          }}
                        >
                          CS: {sku}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* STÁTUSZ JELVÉNY ÉS AKCIÓGOMBOK */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={statusBadge(q.status)}>{q.status}</span>

                  {/* ELFOGADÁS GOMB (HA MÉG NEM ELFOGADOTT) */}
                  {!isAccepted && (
                    <button
                      onClick={(e) => handleStatusChange(e, q.id, "accepted")}
                      disabled={updatingId === q.id}
                      style={acceptBtnStyle}
                      title="Elfogadás"
                    >
                      {updatingId === q.id ? "..." : "Elfogadás ✅"}
                    </button>
                  )}

                  {/* ELUTASÍTÁS GOMB (HA MÉG NEM ELUTASÍTOTT) */}
                  {!isRejected && (
                    <button
                      onClick={(e) => handleStatusChange(e, q.id, "rejected")}
                      disabled={updatingId === q.id}
                      style={rejectBtnStyle}
                      title="Elutasítás"
                    >
                      {updatingId === q.id ? "..." : "Elutasítás ❌"}
                    </button>
                  )}

                  {/* VISSZAVONÁS / VISSZAÁLLÍTÁS GOMB (HA ELFOGADOTT VAGY ELUTASÍTOTT) */}
                  {(isAccepted || isRejected) && (
                    <button
                      onClick={(e) => handleStatusChange(e, q.id, "sent")}
                      disabled={updatingId === q.id}
                      style={resetBtnStyle}
                      title="Státusz visszaállítása Elküldöttre"
                    >
                      {updatingId === q.id ? "..." : "Visszavonás ↩️"}
                    </button>
                  )}

                  {/* TÖRLESE GOMB */}
                  <button 
                    onClick={(e) => handleDelete(e, q.id)}
                    style={deleteBtn}
                    title="Törlés"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div style={{ 
                marginTop: 15, 
                paddingTop: 15, 
                borderTop: "1px solid #f0f0f0", 
                display: "flex", 
                justifyContent: "space-between",
                alignItems: "center" 
              }}>
                <div style={{ fontWeight: "bold", fontSize: 17, color: "#333" }}>
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
const card: React.CSSProperties = { border: "1px solid #eee", padding: 20, borderRadius: 12, background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", position: "relative" };
const btnPrimary: React.CSSProperties = { background: "#4DA3FF", color: "#fff", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontWeight: "bold", fontSize: 14 };
const navBtn: React.CSSProperties = { padding: "8px 12px", borderRadius: 8, border: "1px solid #444", background: "#333", color: "#fff", textDecoration: "none" };
const detailsLink: React.CSSProperties = { color: "#4DA3FF", textDecoration: "none", fontSize: 14, fontWeight: "bold" };

const acceptBtnStyle: React.CSSProperties = {
  background: "#2b8a3e",
  color: "#fff",
  border: "none",
  padding: "5px 10px",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: "bold",
  cursor: "pointer",
};

const rejectBtnStyle: React.CSSProperties = {
  background: "#c92a2a",
  color: "#fff",
  border: "none",
  padding: "5px 10px",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: "bold",
  cursor: "pointer",
};

const resetBtnStyle: React.CSSProperties = {
  background: "#f1f3f5",
  color: "#495057",
  border: "1px solid #ced4da",
  padding: "5px 10px",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: "bold",
  cursor: "pointer",
};

const deleteBtn: React.CSSProperties = {
    background: "none",
    border: "none",
    color: "#e74c3c",
    cursor: "pointer",
    fontSize: "1.2rem",
    padding: "5px",
    borderRadius: "5px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
};

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
