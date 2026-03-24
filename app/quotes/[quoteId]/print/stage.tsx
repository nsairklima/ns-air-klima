"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function PrintQuotePage() {
  const params = useParams();
  const quoteId = params?.quoteId; // A mappád neve alapján quoteId
  const [quote, setQuote] = useState<any>(null);

  useEffect(() => {
    if (quoteId) {
      fetch(`/api/quotes/${quoteId}`)
        .then(res => res.json())
        .then(data => setQuote(data));
    }
  }, [quoteId]);

  if (!quote) return <div style={{padding: 20}}>Ajánlat betöltése...</div>;

  return (
    <div className="print-container">
      {/* FEJLÉC ÉS LOGÓ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32, color: "#2c3e50" }}>ÁRAJÁNLAT</h1>
          <p style={{ color: "#7f8c8d" }}>Azonosító: #{quote.id}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <img src="/logo.png" alt="Logo" style={{ height: 60, marginBottom: 10 }} />
          <div style={{ fontSize: 14 }}>
            <strong>NS Air Klíma</strong><br />
            Telepítés • Karbantartás • Javítás<br />
            nsairklima.vercel.app
          </div>
        </div>
      </div>

      <hr style={{ margin: "30px 0", border: "1px solid #eee" }} />

      {/* ÜGYFÉL ADATOK */}
      <div style={{ marginBottom: 40 }}>
        <h4 style={{ color: "#7f8c8d", margin: "0 0 10px 0" }}>Vevő adatai:</h4>
        <div style={{ fontSize: 18, fontWeight: "bold" }}>{quote.client?.name}</div>
        <div>{quote.client?.address}</div>
        <div>{quote.client?.phone}</div>
      </div>

      {/* TÉTELEK */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 30 }}>
        <thead>
          <tr style={{ background: "#f8f9fa", textAlign: "left" }}>
            <th style={thS}>Leírás / Megnevezés</th>
            <th style={{ ...thS, textAlign: "center" }}>Mennyiség</th>
            <th style={{ ...thS, textAlign: "right" }}>Egységár</th>
            <th style={{ ...thS, textAlign: "right" }}>Összeg</th>
          </tr>
        </thead>
        <tbody>
          {quote.items?.map((item: any, i: number) => (
            <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
              <td style={tdS}>{item.description}</td>
              <td style={{ ...tdS, textAlign: "center" }}>{item.quantity} db</td>
              <td style={{ ...tdS, textAlign: "right" }}>{item.price?.toLocaleString()} Ft</td>
              <td style={{ ...tdS, textAlign: "right", fontWeight: "bold" }}>
                {(item.quantity * item.price)?.toLocaleString()} Ft
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ÖSSZESÍTÉS */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <div style={{ width: 250, background: "#f8f9fa", padding: 20, borderRadius: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: "bold" }}>
            <span>Összesen:</span>
            <span>{quote.totalAmount?.toLocaleString()} Ft</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 50, fontSize: 12, color: "#95a5a6", fontStyle: "italic" }}>
        Az árajánlat 30 napig érvényes. Köszönjük a megkeresést!
      </div>

      {/* NYOMTATÁS GOMB (PDF GENERÁLÁS) */}
      <button onClick={() => window.print()} className="no-print" style={printBtnS}>
        📥 Mentés PDF-ként
      </button>

      <style jsx>{`
        .print-container {
          padding: 60px;
          max-width: 900px;
          margin: 0 auto;
          background: white;
          min-height: 297mm;
          font-family: Arial, sans-serif;
        }
        @media print {
          .no-print { display: none; }
          body { padding: 0; margin: 0; }
          .print-container { padding: 40px; box-shadow: none; width: 100%; }
        }
      `}</style>
    </div>
  );
}

const thS = { padding: "12px", borderBottom: "2px solid #34495e" };
const tdS = { padding: "12px" };
const printBtnS = { position: "fixed" as const, bottom: 30, right: 30, background: "#27ae60", color: "#fff", border: "none", padding: "15px 30px", borderRadius: 50, cursor: "pointer", fontSize: 16, fontWeight: "bold", boxShadow: "0 4px 15px rgba(0,0,0,0.2)" };
