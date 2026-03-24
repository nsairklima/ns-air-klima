"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function QuotePrintPage() {
  const params = useParams();
  const quoteId = params?.quoteId;
  const [q, setQ] = useState<any>(null);

  // Weblap színei: Kék (#3498db) és Sötétkék (#2c3e50)
  const brandBlue = "#3498db"; 
  const brandDark = "#2c3e50";

  useEffect(() => {
    if (quoteId) {
      fetch(`/api/quotes/${quoteId}`)
        .then(res => res.json())
        .then(data => setQ(data));
    }
  }, [quoteId]);

  if (!q) return <div style={{padding: 20, fontFamily: "sans-serif"}}>Ajánlat betöltése...</div>;

  return (
    <div className="print-wrapper">
      {/* 1. FEJLÉC */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15, alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, color: brandDark, fontSize: 32, fontWeight: "800" }}>ÁRAJÁNLAT</h1>
          <p style={{ color: brandBlue, margin: "3px 0", fontSize: 14, fontWeight: "600" }}>Azonosító: #{q.id}/2026</p>
          <p style={{ margin: 0, fontSize: 14 }}>Kelt: {new Date().toLocaleDateString('hu-HU')}</p>
        </div>
        <div>
          <img src="/ns-logo.png" alt="NS-AIR KLÍMA" style={{ height: 85 }} />
        </div>
      </div>

      {/* 2. MÁRKASZÍNŰ DÍSZÍTŐ SÁV (Nyomtatóbarát, vékonyabb) */}
      <div style={{ display: "flex", marginBottom: 25 }}>
        <div style={{ flex: 3, height: "6px", background: brandBlue, borderRadius: "3px 0 0 3px" }}></div>
        <div style={{ flex: 7, height: "6px", background: brandDark, borderRadius: "0 3px 3px 0", opacity: 0.1 }}></div>
      </div>

      {/* 3. ADATOK ELRENDEZÉSE */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, marginBottom: 50 }}>
        {/* BAL OLDAL: Kiállító */}
        <div>
          <small style={labelStyle}>Kiállító</small>
          <div style={{ fontSize: 13, lineHeight: "1.6", color: brandDark }}>
            <strong style={{ fontSize: 16, color: brandBlue }}>NS-AIR KLÍMA</strong><br />
            9143 Enese, Külsőréti dűlő 12.<br />
            Adószám: 66362740-1-28<br />
            Web: <strong>www.nsairklima.hu</strong><br />
            Email: <strong>info@nsairklima.hu</strong><br />
            Tel: <strong>+36 70 312 1825</strong>
          </div>
        </div>

        {/* JOBB OLDAL: Megrendelő */}
        <div style={{ textAlign: "right" }}>
          <small style={labelStyle}>Megrendelő</small>
          <div style={{ fontSize: 13, lineHeight: "1.6", color: brandDark }}>
            <strong style={{ fontSize: 16 }}>{q.client?.name}</strong><br />
            {q.client?.address || "Cím nincs megadva"}<br />
            {q.client?.phone || ""}<br />
            {q.client?.email || ""}
          </div>
        </div>
      </div>

      {/* 4. TÉTELEK TÁBLÁZAT - Világosított fejléccel a takarékosság jegyében */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 30, fontSize: "14px" }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${brandBlue}`, textAlign: "left" }}>
            <th style={{ ...cellS, color: brandDark }}>Megnevezés</th>
            <th style={{ ...cellS, width: "100px", textAlign: "center", color: brandDark }}>Menny.</th>
            <th style={{ ...cellS, textAlign: "right", width: "150px", color: brandDark }}>Bruttó egységár</th>
            <th style={{ ...cellS, textAlign: "right", width: "150px", color: brandBlue }}>Összesen</th>
          </tr>
        </thead>
        <tbody>
          {q.items?.map((it: any) => (
            <tr key={it.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={cellS}>
                <div style={{ fontWeight: "600", color: brandDark }}>{it.description}</div>
              </td>
              <td style={{ ...cellS, textAlign: "center" }}>{it.quantity} {it.unit}</td>
              <td style={{ ...cellS, textAlign: "right" }}>
                {Math.round(it.unitPriceNet * 1.27).toLocaleString()} Ft
              </td>
              <td style={{ ...cellS, textAlign: "right", fontWeight: "bold", color: brandDark }}>
                {Math.round(it.unitPriceNet * 1.27 * it.quantity).toLocaleString()} Ft
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 5. ÖSSZESÍTÉS - Kiemelt kék kerettel */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 40 }}>
        <div style={{ width: "350px", padding: "15px", border: `2px solid ${brandBlue}`, borderRadius: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 16, fontWeight: "600", color: brandDark }}>Fizetendő bruttó:</span>
            <span style={{ fontSize: 22, fontWeight: "800", color: brandBlue }}>{Number(q.grossTotal).toLocaleString()} Ft</span>
          </div>
        </div>
      </div>

      {/* 6. ZÁRÓ SZÖVEG */}
      <div style={{ marginTop: "auto", borderTop: "1px solid #eee", paddingTop: 30, fontSize: "14px" }}>
        <p style={{ fontWeight: "bold", color: brandBlue, marginBottom: 10 }}>
          Köszönjük, hogy minket választott!
        </p>
        <p style={{ lineHeight: "1.6", color: brandDark, marginBottom: 20 }}>
          Árajánlatunkat az Ön igényeinek megfelelően állítottuk össze. Bízunk benne, hogy egyedi árajánlatunk segíteni fogja Önt, hogy a megrendeléshez szükséges döntést meghozza.
        </p>
        
        <div style={{ padding: "12px", borderLeft: `4px solid ${brandBlue}`, background: "#f8fbff", fontSize: 13, color: "#444" }}>
          <strong>Érvényesség:</strong> Ez az árajánlat a kiállítástól számított <strong>7 napig</strong> érvényes.
          <br />Az árak a 27% ÁFA-t tartalmazzák.
        </div>
      </div>

      {/* 7. NYOMTATÁS GOMB */}
      <button onClick={() => window.print()} className="no-print" style={printBtnS(brandBlue)}>
        📥 AJÁNLAT MENTÉSE (PDF)
      </button>

      <style jsx global>{`
        @media screen {
          body { background: #f0f2f5; padding: 40px 0; }
          .print-wrapper { 
            background: white; 
            padding: 60px; 
            max-width: 850px; 
            margin: 0 auto; 
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            min-height: 297mm;
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
        * { font-family: 'Segoe UI', Arial, sans-serif; box-sizing: border-box; }
      `}</style>
    </div>
  );
}

const cellS = { padding: "15px 10px" };
const labelStyle = { 
  display: "block", 
  color: "#95a5a6", 
  fontWeight: "bold" as const, 
  textTransform: "uppercase" as const, 
  fontSize: "10px", 
  letterSpacing: "1px", 
  marginBottom: "5px" 
};
const printBtnS = (color: string) => ({ 
  position: "fixed" as const, 
  bottom: "30px", 
  right: "30px", 
  background: color, 
  color: "#fff", 
  border: "none", 
  padding: "16px 32px", 
  borderRadius: "50px", 
  fontWeight: "bold" as const, 
  cursor: "pointer", 
  boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
  zIndex: 1000
});
