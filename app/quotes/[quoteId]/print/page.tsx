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
      {/* 1. FEJLÉC */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, color: brandDark, fontSize: 26, fontWeight: "800", letterSpacing: "-0.5px" }}>ÁRAJÁNLAT</h1>
          <div style={{ fontSize: 12, color: "#7f8c8d", marginTop: 2 }}>
            <span>Azonosító: <strong>#{q.id}/2026</strong></span>
            <span style={{ marginLeft: 15 }}>Kelt: {new Date().toLocaleDateString('hu-HU')}</span>
          </div>
        </div>
        <img src="/ns-logo.png" alt="NS-AIR KLÍMA" style={{ height: 65 }} />
      </div>

      {/* 2. DÍSZÍTŐ SÁV */}
      <div style={{ display: "flex", marginBottom: 20 }}>
        <div style={{ flex: 3, height: "5px", background: brandBlue, borderRadius: "2.5px 0 0 2.5px" }}></div>
        <div style={{ flex: 7, height: "5px", background: "#eee", borderRadius: "0 2.5px 2.5px 0" }}></div>
      </div>

      {/* 3. ADATOK ELRENDEZÉSE (Egymás alatt, kompakt módon) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginBottom: 30 }}>
        {/* BAL OLDAL: Kiállító */}
        <div>
          <small style={labelStyle}>Kiállító</small>
          <div style={{ fontSize: 12, lineHeight: "1.5", color: brandDark }}>
            <strong style={{ fontSize: 15, color: brandBlue, display: "block", marginBottom: 2 }}>NS-AIR KLÍMA</strong>
            9143 Enese, Külsőréti dűlő 12.<br />
            Adószám: 66362740-1-28<br />
            Web: <strong>www.nsairklima.hu</strong><br />
            Email: <strong style={{ fontWeight: "700" }}>info@nsairklima.hu</strong><br />
            Tel: <strong>+36 70 312 1825</strong>
          </div>
        </div>

        {/* JOBB OLDAL: Megrendelő */}
        <div style={{ textAlign: "right" }}>
          <small style={labelStyle}>Megrendelő</small>
          <div style={{ fontSize: 12, lineHeight: "1.5", color: brandDark }}>
            <strong style={{ fontSize: 15, display: "block", marginBottom: 2 }}>{q.client?.name}</strong>
            {q.client?.address || "Cím nincs megadva"}<br />
            Tel: {q.client?.phone || "-"}<br />
            {q.client?.email || ""}
          </div>
        </div>
      </div>

      {/* 4. TÉTELEK TÁBLÁZAT */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 25, fontSize: "13px" }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${brandBlue}`, textAlign: "left" }}>
            <th style={cellS}>Megnevezés</th>
            <th style={{ ...cellS, width: "70px", textAlign: "center" }}>Menny.</th>
            <th style={{ ...cellS, textAlign: "right", width: "110px" }}>Egységár</th>
            <th style={{ ...cellS, textAlign: "right", width: "110px", color: brandBlue }}>Összesen</th>
          </tr>
        </thead>
        <tbody>
          {q.items?.map((it: any) => (
            <tr key={it.id} style={{ borderBottom: "1px solid #f2f2f2" }}>
              <td style={cellS}><div style={{ fontWeight: "600", color: brandDark }}>{it.description}</div></td>
              <td style={{ ...cellS, textAlign: "center" }}>{it.quantity} {it.unit}</td>
              <td style={{ ...cellS, textAlign: "right" }}>{Math.round(it.unitPriceNet * 1.27).toLocaleString()} Ft</td>
              <td style={{ ...cellS, textAlign: "right", fontWeight: "bold", color: brandDark }}>{Math.round(it.unitPriceNet * 1.27 * it.quantity).toLocaleString()} Ft</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 5. ÖSSZESÍTÉS */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 35 }}>
        <div style={{ width: "260px", padding: "12px", border: `1.5px solid ${brandBlue}`, borderRadius: "8px", background: "#fcfdff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: "600", color: brandDark }}>Fizetendő bruttó:</span>
            <span style={{ fontSize: 18, fontWeight: "800", color: brandBlue }}>{Number(q.grossTotal).toLocaleString()} Ft</span>
          </div>
        </div>
      </div>

      {/* 6. ZÁRÓ SZÖVEG */}
      <div style={{ marginTop: "auto", borderTop: "1px solid #eee", paddingTop: 20, fontSize: "12px" }}>
        <p style={{ fontWeight: "bold", color: brandBlue, marginBottom: 5, fontSize: "13px" }}>Köszönjük, hogy minket választott!</p>
        <p style={{ margin: "0 0 15px 0", lineHeight: "1.4", color: brandDark }}>
          Árajánlatunkat az Ön igényeinek megfelelően állítottuk össze. Bízunk benne, hogy segítségére lesz a döntéshozatali folyamatban.
        </p>
        <div style={{ padding: "10px", borderLeft: `3px solid ${brandBlue}`, background: "#f8fbff", color: "#555" }}>
          <strong>Érvényesség:</strong> 7 nap | Az árak a 27% ÁFA-t tartalmazzák.
        </div>
      </div>

      <button onClick={() => window.print()} className="no-print" style={printBtnS(brandBlue)}>📥 AJÁNLAT MENTÉSE</button>

      <style jsx global>{`
        @media screen {
          body { background: #f4f6f8; padding: 30px 0; }
          .print-wrapper { background: white; padding: 50px 60px; max-width: 800px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.1); min-height: 280mm; display: flex; flex-direction: column; }
        }
        @media print {
          .no-print { display: none !important; }
          .print-wrapper { padding: 0; margin: 0; width: 100%; box-shadow: none; min-height: auto; }
          body { background: white; }
        }
        * { font-family: 'Segoe UI', system-ui, sans-serif; box-sizing: border-box; }
      `}</style>
    </div>
  );
}

const cellS = { padding: "10px 6px" };
const labelStyle = { display: "block", color: "#bdc3c7", fontWeight: "bold" as const, textTransform: "uppercase" as const, fontSize: "9px", letterSpacing: "0.8px", marginBottom: "5px" };
const printBtnS = (color: string) => ({ position: "fixed" as const, bottom: "30px", right: "30px", background: color, color: "#fff", border: "none", padding: "14px 28px", borderRadius: "50px", fontWeight: "bold" as const, cursor: "pointer", boxShadow: "0 5px 15px rgba(0,0,0,0.2)", zIndex: 1000 });
