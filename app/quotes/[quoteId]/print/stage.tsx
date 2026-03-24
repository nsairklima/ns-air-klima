"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function QuotePrintPage() {
  const params = useParams();
  const quoteId = params?.quoteId;
  const [q, setQ] = useState<any>(null);

  useEffect(() => {
    if (quoteId) {
      fetch(`/api/quotes/${quoteId}`)
        .then(res => res.json())
        .then(data => setQ(data));
    }
  }, [quoteId]);

  if (!q) return <div style={{padding: 20}}>Betöltés...</div>;

  return (
    <div className="print-wrapper">
      {/* FEJLÉC */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 40 }}>
        <div>
          <h1 style={{ margin: 0, color: "#2c3e50", fontSize: 32 }}>ÁRAJÁNLAT</h1>
          <p style={{ color: "#7f8c8d" }}>Azonosító: #{q.id}/2026</p>
          <p>Kelt: {new Date().toLocaleDateString('hu-HU')}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <img src="/ns-logo.png" alt="Logo" style={{ height: 60, marginBottom: 10 }} />
          <div style={{ fontSize: 14 }}>
            <strong>NS Air Klíma</strong><br />
            nsairklima.vercel.app<br />
            Email: info@nsair.hu
          </div>
        </div>
      </div>

      {/* ÜGYFÉL */}
      <div style={{ marginBottom: 40, padding: 20, background: "#f8f9fa", borderRadius: 10 }}>
        <small style={{ color: "#7f8c8d", textTransform: "uppercase" }}>Ügyfél adatai:</small>
        <div style={{ fontSize: 18, fontWeight: "bold", marginTop: 5 }}>{q.client?.name}</div>
        <div>{q.client?.address || "Nincs megadott cím"}</div>
        <div>{q.client?.phone || ""}</div>
      </div>

      {/* TÁBLÁZAT */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #2c3e50", textAlign: "left" }}>
            <th style={cellS}>Megnevezés</th>
            <th style={cellS}>Mennyiség</th>
            <th style={{ ...cellS, textAlign: "right" }}>Bruttó egységár</th>
            <th style={{ ...cellS, textAlign: "right" }}>Összesen</th>
          </tr>
        </thead>
        <tbody>
          {q.items.map((it: any) => (
            <tr key={it.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={cellS}><strong>{it.description}</strong></td>
              <td style={cellS}>{it.quantity} {it.unit}</td>
              <td style={{ ...cellS, textAlign: "right" }}>
                {Math.round(it.unitPriceNet * 1.27).toLocaleString()} Ft
              </td>
              <td style={{ ...cellS, textAlign: "right", fontWeight: "bold" }}>
                {Math.round(it.unitPriceNet * 1.27 * it.quantity).toLocaleString()} Ft
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* VÉGÖSSZEG */}
      <div style={{ marginTop: 30, textAlign: "right" }}>
        <div style={{ display: "inline-block", borderTop: "3px solid #2c3e50", paddingTop: 10 }}>
          <span style={{ fontSize: 18 }}>Fizetendő bruttó végösszeg:</span><br />
          <strong style={{ fontSize: 28 }}>{Number(q.grossTotal).toLocaleString()} Ft</strong>
        </div>
      </div>

      {/* LÁBLÉC */}
      <div style={{ marginTop: 80, fontSize: 12, color: "#7f8c8d", borderTop: "1px solid #eee", paddingTop: 20 }}>
        <p>Az ajánlat 30 napig érvényes. A feltüntetett árak a 27%-os ÁFA-t tartalmazzák.</p>
      </div>

      {/* FIX GOMB (CSAK KÉPERNYŐN) */}
      <button onClick={() => window.print()} className="no-print" style={printBtnS}>
        📥 NYOMTATÁS / MENTÉS PDF-KÉNT
      </button>

      <style jsx global>{`
        @media screen {
          body { background: #e0e0e0; padding: 40px 0; }
          .print-wrapper { 
            background: white; 
            padding: 60px; 
            max-width: 800px; 
            margin: 0 auto; 
            box-shadow: 0 0 20px rgba(0,0,0,0.2);
            min-height: 297mm;
          }
        }
        @media print {
          .no-print { display: none !important; }
          .print-wrapper { padding: 0; margin: 0; width: 100%; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}

const cellS = { padding: "15px 10px" };
const printBtnS = { position: "fixed" as const, bottom: 30, right: 30, background: "#27ae60", color: "#fff", border: "none", padding: "15px 30px", borderRadius: 50, fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 15px rgba(0,0,0,0.3)" };
