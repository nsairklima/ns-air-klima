"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function QuotePrintPage() {
  const params = useParams();
  const quoteId = params?.quoteId;
  const [q, setQ] = useState<any>(null);

  const brandBlue = "#3498db"; 
  const brandDark = "#2c3e50";
  const brandRed = "#e74c3c";

  useEffect(() => {
    if (quoteId) {
      fetch(`/api/quotes/${quoteId}`)
        .then(res => res.json())
        .then(data => setQ(data));
    }
  }, [quoteId]);

  if (!q) return <div style={{padding: 20, fontFamily: "Segoe UI, sans-serif"}}>Ajánlat betöltése...</div>;

  return (
    <div className="print-wrapper">
      {/* 1. FEJLÉC */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, color: brandDark, fontSize: 26, fontWeight: "800", letterSpacing: "-1px" }}>ÁRAJÁNLAT</h1>
          <div style={{ fontSize: 12, color: "#7f8c8d", marginTop: 2 }}>
            <span>Azonosító: <strong>#{q.id}/2026</strong></span>
            <span style={{ marginLeft: 20 }}>Kelt: {new Date().toLocaleDateString('hu-HU')}</span>
          </div>
        </div>
        <img src="/ns-logo.png" alt="NS-AIR KLÍMA" style={{ height: 60 }} />
      </div>

      {/* 2. DÍSZÍTŐ SÁV */}
      <div style={{ display: "flex", marginBottom: 15 }}>
        <div style={{ flex: 3, height: "4px", background: brandBlue, borderRadius: "2px 0 0 2px" }}></div>
        <div style={{ flex: 7, height: "4px", background: "#eee", borderRadius: "0 2px 2px 0" }}></div>
      </div>

      {/* 3. ADATOK ELRENDEZÉSE */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, marginBottom: 20, borderBottom: "1px solid #f2f2f2", paddingBottom: 15 }}>
        <div>
          <small style={labelStyle}>Kiállító</small>
          <div style={{ fontSize: 11.5, lineHeight: "1.4", color: brandDark }}>
            <strong style={{ fontSize: 14, display: "block", marginBottom: 2 }}>
              <span style={{ color: brandBlue }}>NS-AIR</span>
              <span style={{ color: brandRed, marginLeft: 4 }}>KLÍMA</span>
            </strong>
            9143 Enese, Külsőréti dűlő 12.<br />
            Adószám: 66362740-1-28<br />
            Web: <strong>www.nsairklima.hu</strong><br />
            Email: <strong style={{ fontWeight: "700" }}>info@nsairklima.hu</strong><br />
            Tel: <strong>+36 70 312 1825</strong>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <small style={labelStyle}>Megrendelő</small>
          <div style={{ fontSize: 11.5, lineHeight: "1.4", color: brandDark }}>
            <strong style={{ fontSize: 14, display: "block", marginBottom: 2 }}>{q.client?.name}</strong>
            {q.client?.address || "Cím nincs megadva"}<br />
            Tel: {q.client?.phone || "-"}<br />
            Email: {q.client?.email || ""}
          </div>
        </div>
      </div>

      {/* 4. TÉTELEK TÁBLÁZAT - Sűrített sorokkal */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20, fontSize: "12.5px" }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${brandBlue}`, textAlign: "left" }}>
            <th style={{ ...cellS, color: brandDark }}>Megnevezés</th>
            <th style={{ ...cellS, width: "70px", textAlign: "center", color: brandDark }}>Menny.</th>
            <th style={{ ...cellS, textAlign: "right", width: "120px", color: brandDark }}>Bruttó egységár</th>
            <th style={{ ...cellS, textAlign: "right", width: "120px", color: brandBlue }}>Bruttó összesen</th>
          </tr>
        </thead>
        <tbody>
          {q.items?.map((it: any) => (
            <tr key={it.id} style={{ borderBottom: "1px solid #f2f2f2" }}>
              <td style={cellS}>
                <div style={{ fontWeight: "600", color: brandDark }}>{it.description}</div>
              </td>
              <td style={{ ...cellS, textAlign: "center" }}>{it.quantity} {it.unit}</td>
              <td style={{ ...cellS, textAlign: "right" }}>
                {Math.round(it.unitPriceNet).toLocaleString()} Ft
              </td>
              <td style={{ ...cellS, textAlign: "right", fontWeight: "bold", color: brandDark }}>
                {Math.round(it.unitPriceNet * it.quantity).toLocaleString()} Ft
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 5. ÖSSZESÍTÉS */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 30 }}>
        <div style={{ width: "280px", padding: "10px", border: `1.5px solid ${brandBlue}`, borderRadius: "8px", background: "#fcfdff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: "600", color: brandDark }}>Fizetendő bruttó:</span>
            <span style={{ fontSize: 16, fontWeight: "800", color: brandBlue }}>{Number(q.grossTotal).toLocaleString()} Ft</span>
          </div>
        </div>
      </div>

      {/* 6. ZÁRÓ SZÖVEG */}
      <div style={{ marginTop: "auto", borderTop: "1px solid #eee", paddingTop: 15, fontSize: "11.5px" }}>
        <p style={{ fontWeight: "bold", color: brandBlue, marginBottom: 5, fontSize: "12px" }}>
          Köszönjük, hogy minket választott!
        </p>
        <p style={{ lineHeight: "1.4", color: brandDark, marginBottom: 15 }}>
          Árajánlatunkat az Ön igényeinek megfelelően állítottuk össze. Bízunk benne, hogy segítségére lesz a döntéshozatalban.
        </p>
        
        <div style={{ padding: "8px", borderLeft: `3px solid ${brandBlue}`, background: "#f8fbff", fontSize: 11, color: "#444" }}>
          <p style={{ margin: "0 0 3px 0" }}><strong>Érvényesség:</strong> 7 nap</p>
          <p style={{ margin: 0 }}><strong>Megjegyzés:</strong> Az ajánlat készítője alanyi adómentes, ezért a végösszeget az Áfa mértéke nem befolyásolja.</p>
        </div>
      </div>

      <button onClick={() => window.print()} className="no-print" style={printBtnS(brandBlue)}>
        📥 MENTÉS
      </button>

      <style jsx global>{`
        @media screen {
          body { background: #f4f6f8; padding: 20px 0; }
          .print-wrapper { 
            background: white; 
            padding: 40px 50px; 
            max-width: 800px; 
            margin: 0 auto; 
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            min-height: 290mm;
            display: flex;
            flex-direction: column;
          }
        }
        @media print {
          .no-print { display: none !important; }
          .print-wrapper { padding: 0; margin: 0; width: 100%; box-shadow: none; min-height: auto; }
          body { background: white; }
          * { -webkit-print-color-adjust: exact; }
        }
        * { font-family: 'Segoe UI', system-ui, sans-serif; box-sizing: border-box; }
      `}</style>
    </div>
  );
}

const cellS = { padding: "8px 6px" }; // Jelentősen csökkentett belső margó
const labelStyle = { display: "block", color: "#bdc3c7", fontWeight: "bold" as const, textTransform: "uppercase" as const, fontSize: "9px", letterSpacing: "0.5px", marginBottom: "4px" };
const printBtnS = (color: string) => ({ position: "fixed" as const, bottom: "30px", right: "30px", background: color, color: "#fff", border: "none", padding: "12px 24px", borderRadius: "50px", fontWeight: "bold" as const, cursor: "pointer", boxShadow: "0 5px 15px rgba(0,0,0,0.2)", fontSize: "14px", zIndex: 1000 });
