"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function QuotePrintPage() {
  const params = useParams();
  const quoteId = params?.quoteId;
  const [q, setQ] = useState<any>(null);

  const brandBlue = "#3498db"; 
  const brandDark = "#2c3e50";

  useEffect(() => {
    if (quoteId) {
      fetch(`/api/quotes/${quoteId}`).then(res => res.json()).then(data => setQ(data));
    }
  }, [quoteId]);

  if (!q) return <div style={{padding: 20, fontFamily: "sans-serif"}}>Betöltés...</div>;

  return (
    <div className="print-wrapper">
      {/* 1. KOMPAKT FEJLÉC */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, color: brandDark, fontSize: 28, fontWeight: "800" }}>ÁRAJÁNLAT</h1>
          <div style={{ display: "flex", gap: "15px", fontSize: 12, color: "#7f8c8d", marginTop: 2 }}>
            <span>Azonosító: <strong>#{q.id}/2026</strong></span>
            <span>Kelt: {new Date().toLocaleDateString('hu-HU')}</span>
          </div>
        </div>
        <img src="/ns-logo.png" alt="NS-AIR KLÍMA" style={{ height: 60 }} />
      </div>

      {/* 2. VÉKONY DÍSZÍTŐ SÁV */}
      <div style={{ display: "flex", marginBottom: 15 }}>
        <div style={{ flex: 3, height: "4px", background: brandBlue, borderRadius: "2px 0 0 2px" }}></div>
        <div style={{ flex: 7, height: "4px", background: "#eee", borderRadius: "0 2px 2px 0" }}></div>
      </div>

      {/* 3. KOMPAKT ADATOK (Kétoszlopos, szűkített helyen) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 25, borderBottom: "1px solid #f0f0f0", paddingBottom: 15 }}>
        {/* BAL OLDAL: Kiállító */}
        <div>
          <small style={labelStyle}>Kiállító</small>
          <div style={{ fontSize: 12, lineHeight: "1.4", color: brandDark }}>
            <strong style={{ fontSize: 14, color: brandBlue }}>NS-AIR KLÍMA</strong><br />
            9143 Enese, Külsőréti dűlő 12. | Adószám: 66362740-1-28<br />
            <strong>www.nsairklima.hu</strong> | info@nsairklima.hu<br />
            Tel: <strong>+36 70 312 1825</strong>
          </div>
        </div>

        {/* JOBB OLDAL: Megrendelő */}
        <div style={{ textAlign: "right" }}>
          <small style={labelStyle}>Megrendelő</small>
          <div style={{ fontSize: 12, lineHeight: "1.4", color: brandDark }}>
            <strong style={{ fontSize: 14 }}>{q.client?.name}</strong><br />
            {q.client?.address || "Cím nincs megadva"}<br />
            {q.client?.phone || ""}
          </div>
        </div>
      </div>

      {/* 4. TÉTELEK TÁBLÁZAT */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20, fontSize: "13px" }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${brandBlue}`, textAlign: "left" }}>
            <th style={cellS}>Megnevezés</th>
            <th style={{ ...cellS, width: "80px", textAlign: "center" }}>Menny.</th>
            <th style={{ ...cellS, textAlign: "right", width: "120px" }}>Egységár</th>
            <th style={{ ...cellS, textAlign: "right", width: "120px", color: brandBlue }}>Összesen</th>
          </tr>
        </thead>
        <tbody>
          {q.items?.map((it: any) => (
            <tr key={it.id} style={{ borderBottom: "1px solid #f9f9f9" }}>
              <td style={cellS}><div style={{ fontWeight: "600" }}>{it.description}</div></td>
              <td style={{ ...cellS, textAlign: "center" }}>{it.quantity} {it.unit}</td>
              <td style={{ ...cellS, textAlign: "right" }}>{Math.round(it.unitPriceNet * 1.27).toLocaleString()} Ft</td>
              <td style={{ ...cellS, textAlign: "right", fontWeight: "bold" }}>{Math.round(it.unitPriceNet * 1.27 * it.quantity).toLocaleString()} Ft</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 5. ÖSSZESÍTÉS */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 30 }}>
        <div style={{ width: "280px", padding: "12px", border: `1px solid ${brandBlue}`, borderRadius: "8px", background: "#fcfdff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: "600" }}>Fizetendő bruttó:</span>
            <span style={{ fontSize: 18, fontWeight: "800", color: brandBlue }}>{Number(q.grossTotal).toLocaleString()} Ft</span>
          </div>
        </div>
      </div>

      {/* 6. ZÁRÓ SZÖVEG (Kompakt) */}
      <div style={{ marginTop: "auto", fontSize: "12px", color: brandDark }}>
        <p style={{ fontWeight: "bold", color: brandBlue, marginBottom: 4, fontSize: "13px" }}>Köszönjük, hogy minket választott!</p>
        <p style={{ margin: "0 0 15px 0", lineHeight: "1.4" }}>
          Árajánlatunkat az Ön igényeinek megfelelően állítottuk össze. Bízunk benne, hogy segítségére lesz a döntésben.
        </p>
        <div style={{ padding: "10px", borderLeft: `3px solid ${brandBlue}`, background: "#f8fbff" }}>
          <strong>Érvényesség:</strong> 7 nap | Az árak a 27% ÁFA-t tartalmazzák.
        </div>
      </div>

      <button onClick={() => window.print()} className="no-print" style={printBtnS(brandBlue)}>📥 MENTÉS</button>

      <style jsx global>{`
        @media screen {
          body { background: #f0f2f5; padding: 20px 0; }
          .print-wrapper { background: white; padding: 40px 50px; max-width: 800px; margin: 0 auto; box-shadow: 0 5px 15px rgba(0,0,0,0.1); min-height: 297mm; display: flex; flex-direction: column; }
        }
        @media print {
          .no-print { display: none !important; }
          .print-wrapper { padding: 0; margin: 0; width: 100%; box-shadow: none; min-height: auto; }
          body { background: white; }
        }
        * { font-family: 'Segoe UI', Arial, sans-serif; box-sizing: border-box; }
      `}</style>
    </div>
  );
}

const cellS = { padding: "10px 8px" };
const labelStyle = { display: "block", color: "#bdc3c7", fontWeight: "bold" as const, textTransform: "uppercase" as const, fontSize: "9px", letterSpacing: "0.5px", marginBottom: "3px" };
const printBtnS = (color: string) => ({ position: "fixed" as const, bottom: "30px", right: "30px", background: color, color: "#fff", border: "none", padding: "12px 24px", borderRadius: "50px", fontWeight: "bold" as const, cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,0.2)", zIndex: 1000 });
