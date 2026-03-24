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

  if (!q) return <div style={{padding: 20}}>Ajánlat betöltése...</div>;

  return (
    <div className="print-wrapper">
      {/* FEJLÉC */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 40, alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: 0, color: "#1a252f", fontSize: 32, letterSpacing: "-1px" }}>ÁRAJÁNLAT</h1>
          <p style={{ color: "#7f8c8d", margin: "5px 0" }}>Azonosító: #{q.id}/2026</p>
          <p style={{ margin: 0 }}>Kelt: {new Date().toLocaleDateString('hu-HU')}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          {/* A logó elérhetősége a public mappában: /ns-logo.png */}
          <img src="/ns-logo.png" alt="NS Air Klíma" style={{ height: 70, marginBottom: 10 }} />
          <div style={{ fontSize: 14, lineHeight: "1.4" }}>
            <strong>NS Air Klíma</strong><br />
            Klímaszerelés és Karbantartás<br />
            Email: <strong>info@nsairklima.hu</strong>
          </div>
        </div>
      </div>

      <div style={{ height: "2px", background: "#1a252f", marginBottom: 30 }}></div>

      {/* ÜGYFÉL ADATOK */}
      <div style={{ marginBottom: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ padding: "15px", border: "1px solid #eee", borderRadius: 8 }}>
          <small style={{ color: "#7f8c8d", fontWeight: "bold", textTransform: "uppercase", fontSize: 10 }}>Ajánlatot kapja:</small>
          <div style={{ fontSize: 18, fontWeight: "bold", marginTop: 5 }}>{q.client?.name}</div>
          <div style={{ marginTop: 5 }}>{q.client?.address || "Cím nincs megadva"}</div>
          <div>{q.client?.phone}</div>
        </div>
      </div>

      {/* TÉTELEK TÁBLÁZAT */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 30 }}>
        <thead>
          <tr style={{ background: "#f8f9fa", textAlign: "left" }}>
            <th style={cellS}>Megnevezés</th>
            <th style={{ ...cellS, width: "100px" }}>Menny.</th>
            <th style={{ ...cellS, textAlign: "right", width: "140px" }}>Bruttó egységár</th>
            <th style={{ ...cellS, textAlign: "right", width: "140px" }}>Összesen</th>
          </tr>
        </thead>
        <tbody>
          {q.items?.map((it: any) => (
            <tr key={it.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={cellS}>
                <div style={{ fontWeight: "bold" }}>{it.description}</div>
              </td>
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

      {/* ÖSSZESÍTÉS */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ width: "300px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "2px solid #1a252f" }}>
            <span style={{ fontSize: 18 }}>Fizetendő bruttó:</span>
            <span style={{ fontSize: 22, fontWeight: "bold" }}>{Number(q.grossTotal).toLocaleString()} Ft</span>
          </div>
        </div>
      </div>

      {/* JOGI ÉS EGYÉB INFÓ */}
      <div style={{ marginTop: 60, padding: "20px", background: "#fcfcfc", borderRadius: 8, fontSize: 12, color: "#666", border: "1px solid #f0f0f0" }}>
        <p style={{ margin: "0 0 5px 0" }}>• Az árak tartalmazzák a 27% ÁFA-t.</p>
        <p style={{ margin: "0 0 5px 0" }}>• Az ajánlat érvényessége: 30 nap.</p>
        <p style={{ margin: "0" }}>• Köszönjük, hogy minket választott!</p>
      </div>

      {/* NYOMTATÁS GOMB (CSAK KÉPERNYŐN) */}
      <button onClick={() => window.print()} className="no-print" style={printBtnS}>
        📥 AJÁNLAT MENTÉSE (PDF)
      </button>

      <style jsx global>{`
        @media screen {
          body { background: #525659; padding: 40px 0; }
          .print-wrapper { 
            background: white; 
            padding: 70px; 
            max-width: 850px; 
            margin: 0 auto; 
            box-shadow: 0 0 30px rgba(0,0,0,0.3);
            min-height: 297mm;
          }
        }
        @media print {
          .no-print { display: none !important; }
          .print-wrapper { padding: 0; margin: 0; width: 100%; box-shadow: none; }
          body { background: white; }
        }
        * { font-family: 'Segoe UI', Arial, sans-serif; box-sizing: border-box; }
      `}</style>
    </div>
  );
}

const cellS = { padding: "15px 10px", fontSize: "14px" };
const printBtnS = { 
  position: "fixed" as const, 
  bottom: "30px", 
  right: "30px", 
  background: "#27ae60", 
  color: "#fff", 
  border: "none", 
  padding: "16px 32px", 
  borderRadius: "50px", 
  fontWeight: "bold" as const, 
  cursor: "pointer", 
  boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
  fontSize: "16px",
  zIndex: 1000
};
