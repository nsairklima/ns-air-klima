
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Quote = {
  id: number;
  title?: string | null;
  status: "draft" | "sent" | "accepted" | "rejected";
  terms?: string | null;
  netTotal: number;
  vatAmount: number;
  grossTotal: number;
  client: { id: number; name: string };
  items: QuoteItem[];
};
type QuoteItem = {
  id: number;
  description: string;
  quantity: number;
  unit?: string | null;
  unitPriceNet: number;
  vatRate: number;
  lineNet: number;
  lineVat: number;
  lineGross: number;
};

export default function QuoteDetailPage() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const id = Number(quoteId);

  const [q, setQ] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  // új tétel űrlap
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [unitPriceNet, setUnitPriceNet] = useState("");
  const [vatRate, setVatRate] = useState("27");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/quotes/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Lekérési hiba");
      const data: Quote = await res.json();
      setQ(data);
    } catch {
      setQ(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (Number.isFinite(id)) load();
  }, [id]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      alert("Leírás kötelező.");
      return;
    }
    if (!unitPriceNet) {
      alert("Nettó egységár kötelező.");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/quotes/${id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: description.trim(),
        quantity: quantity ? Number(quantity) : 1,
        unit: unit || null,
        unitPriceNet: Number(unitPriceNet),
        vatRate: vatRate ? Number(vatRate) : 27,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      alert("Tétel mentése sikertelen.");
      return;
    }
    setDescription("");
    setQuantity("1");
    setUnit("");
    setUnitPriceNet("");
    setVatRate("27");
    await load();
  }

  async function setStatus(status: Quote["status"]) {
    await fetch(`/api/quotes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  if (loading) return <div style={wrap}><p>Betöltés…</p></div>;
  if (!q) return <div style={wrap}><p>Ajánlat nem található.</p></div>;

 
return (
  <div>
   
/quotes← Vissza az ajánlatokhoz</a>

      <h1 style={{ marginTop: 12 }}>Ajánlatok</h1>

  </div>
);




      <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setStatus("draft")} style={statusBtn("draft", q.status)}>Piszkozat</button>
        <button onClick={() => setStatus("sent")} style={statusBtn("sent", q.status)}>Elküldve</button>
        <button onClick={() => setStatus("accepted")} style={statusBtn("accepted", q.status)}>Elfogadva</button>
        <button onClick={() => setStatus("rejected")} style={statusBtn("rejected", q.status)}>Elutasítva</button>
        <a href={`/api/quotes/${q.id}/pdf`} target="_blank" style={{ marginLeft: "auto", color: "#4DA3FF", textDecoration: "none" }}>PDF megnyitása →</a>
      </div>

      <h2 style={{ marginTop: 24 }}>Tételek</h2>
      {q.items.length === 0 && <p>Még nincs tétel.</p>}
      <div style={{ display: "grid", gap: 8 }}>
        {q.items.map(it => (
          <div key={it.id} style={card}>
            <div><strong>{it.description}</strong> {it.unit ? `(${it.unit})` : ""}</div>
            <div style={{ color: "#444", fontSize: 14 }}>
              {it.quantity} × {it.unitPriceNet.toLocaleString("hu-HU")} Ft (ÁFA {it.vatRate}%)
            </div>
            <div style={{ marginTop: 6 }}>
              Nettó: {it.lineNet.toLocaleString("hu-HU")} Ft • ÁFA: {it.lineVat.toLocaleString("hu-HU")} Ft • Bruttó: {it.lineGross.toLocaleString("hu-HU")} Ft
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 16 }}>Új tétel</h3>
      <form onSubmit={addItem} style={form}>
        <input placeholder="Leírás*" value={description} onChange={(e)=>setDescription(e.target.value)} style={input} />
        <input placeholder="Mennyiség" type="number" step="0.001" value={quantity} onChange={(e)=>setQuantity(e.target.value)} style={input} />
        <input placeholder="Egység (pl. db)" value={unit} onChange={(e)=>setUnit(e.target.value)} style={input} />
        <input placeholder="Nettó egységár*" type="number" step="0.01" value={unitPriceNet} onChange={(e)=>setUnitPriceNet(e.target.value)} style={input} />
        <input placeholder="ÁFA %" type="number" step="0.1" value={vatRate} onChange={(e)=>setVatRate(e.target.value)} style={input} />
        <button disabled={saving} style={btnPrimary}>{saving ? "Mentés…" : "Tétel hozzáadása"}</button>
      </form>

      <h2>Összesítés</h2>
      <div style={card}>
        Nettó: <strong>{q.netTotal.toLocaleString("hu-HU")} Ft</strong> &nbsp;•&nbsp;
        ÁFA: <strong>{q.vatAmount.toLocaleString("hu-HU")} Ft</strong> &nbsp;•&nbsp;
        Bruttó: <strong>{q.grossTotal.toLocaleString("hu-HU")} Ft</strong>
      </div>
    </div>
  );
}

/* ---- stílusok ---- */
const wrap: React.CSSProperties = { padding: 24, fontFamily: "Arial, sans-serif", maxWidth: 1000, margin: "0 auto" };
const card: React.CSSProperties = { border: "1px solid #e5e5e5", borderRadius: 8, padding: 12, background: "#fafafa" };
const form: React.CSSProperties = { display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto", gap: 8, alignItems: "center", ...card };
const input: React.CSSProperties = { padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6 };
const btnPrimary: React.CSSProperties = { background: "#4DA3FF", color: "#fff", border: "none", borderRadius: 6, padding: "10px 14px", cursor: "pointer" };

function statusBtn(target: Quote["status"], current: Quote["status"]): React.CSSProperties {
  const is = target === current;
  const base: React.CSSProperties = { padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd", cursor: "pointer", background: "#fff" };
  if (!is) return base;
  if (current === "draft")    return { ...base, background: "#f2f2f2" };
  if (current === "sent")     return { ...base, background: "#fff7d1" };
  if (current === "accepted") return { ...base, background: "#e9f9ee" };
  return { ...base, background: "#ffe5e5" };
}
``
