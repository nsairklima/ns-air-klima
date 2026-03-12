"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function QuoteDetailPage() {
  const params = useParams<{ quoteId: string }>();
  const quoteId = Number(params.quoteId);

  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [profitType, setProfitType] = useState("percent");
  const [profitValue, setProfitValue] = useState("20");
  const [qty, setQty] = useState("1");

  async function load() {
    const res = await fetch(`/api/quotes/${quoteId}`);
    const data = await res.json();
    setQuote(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addItem() {
    const res = await fetch(`/api/quotes/${quoteId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        basePriceNet: Number(basePrice),
        profitType,
        profitValue: Number(profitValue),
        qty: Number(qty),
      }),
    });

    if (res.ok) {
      await load();
      setName("");
      setBasePrice("");
      setProfitValue("20");
      setQty("1");
    } else {
      alert("Hiba történt a mentéskor!");
    }
  }

  if (loading) return <p>Betöltés...</p>;
  if (!quote) return <p>Ajánlat nem található.</p>;

  return (
    <div style={{ padding: 40, maxWidth: 900, margin: "0 auto" }}>
      <h1>{quote.quoteNo}</h1>

      <p>
        Nettó: {quote.netTotal} Ft · Bruttó: {quote.grossTotal} Ft  
        <br/>
        <a href={`/api/quotes/${quoteId}/pdf`} target="_blank">
          PDF megnyitása
        </a>
      </p>

      <h2>Új tétel</h2>
      <input placeholder="Név" value={name} onChange={e => setName(e.target.value)} />
      <input placeholder="Nettó ár" type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)} />
      <select value={profitType} onChange={e => setProfitType(e.target.value)}>
        <option value="percent">Profit %</option>
        <option value="amount">Profit Ft</option>
      </select>
      <input placeholder="Profit érték" type="number" value={profitValue} onChange={e => setProfitValue(e.target.value)} />
      <input placeholder="Mennyiség" type="number" value={qty} onChange={e => setQty(e.target.value)} />
      <button onClick={addItem}>Tétel mentése</button>

      <h2>Tételek</h2>
      {quote.items.length === 0 && <p>Nincs tétel.</p>}
      {quote.items.map((it: any) => (
        <div key={it.id} style={{ marginBottom: 10, padding: 10, border: "1px solid #ddd" }}>
          <strong>{it.name}</strong><br/>
          {it.qty} × {it.finalPriceNet} Ft = {it.qty * it.finalPriceNet} Ft
        </div>
      ))}
    </div>
  );
}
