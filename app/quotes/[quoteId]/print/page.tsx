"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function QuotePrintPage() {
  const params = useParams();
  const quoteId = params?.quoteId;
  const [q, setQ] = useState<any>(null);

  // NS-AIR KLÍMA arculati színek
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
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15, alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, color: brandDark, fontSize: 30, fontWeight: "800", letterSpacing: "-1px" }}>ÁRAJÁNLAT</h1>
          <div style={{ fontSize: 13, color: "#7f8c8d", marginTop: 2 }}>
            <span>Azonosító: <strong>#{q.id}/2026</strong></span>
            <span style={{ marginLeft: 20 }}>Kelt: {new Date().toLocaleDateString('hu-HU')}</span>
          </div>
        </div>
        <img src="/ns-logo.png" alt="NS-AIR KLÍMA" style={{ height: 75 }} />
      </div>

      {/* 2. DÍSZÍTŐ SÁV */}
      <div style={{ display: "flex", marginBottom: 25 }}>
        <div style={{ flex: 3, height: "6px", background: brandBlue, borderRadius: "3px 0 0 3px" }}></div>
        <div style={{ flex: 7, height: "6px", background: "#eee", borderRadius: "0 3px 3px 0" }}></div>
      </div>

      {/* 3. ADATOK ELRENDEZÉSE */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, marginBottom: 40, borderBottom: "1px solid #f2f2f2", paddingBottom: 20 }}>
        <div>
          <small style={labelStyle}>Kiállító</small>
          <div style={{ fontSize: 13, lineHeight: "1.6", color: brandDark }}>
            <strong style={{ fontSize: 17, display: "block", marginBottom: 4 }}>
              <span style={{ color: brandBlue }}>NS-AIR</span>
              <span style={{ color: brandRed, marginLeft: 6 }}>KLÍMA</span>
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
          <div style={{ fontSize: 13, lineHeight: "1.6", color: brandDark }}>
            <strong style={{ fontSize: 17, display: "block", marginBottom: 4 }}>{q.client?.name}</strong>
            {q.client?.address || "Cím nincs megadva"}<br />
            Tel: {q.client?.phone || "-"}<br />
            Email: {q.client?.email || ""}
          </div>
        </div>
      </div>

      {/* 4. TÉTELEK TÁBLÁZAT */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 30, fontSize: "14px" }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${brandBlue}`, textAlign: "left" }}>
            <th style={{ ...cellS, color: brandDark }}>Megnevezés</th>
            <th style={{ ...cellS, width: "80px", textAlign: "center", color: brandDark }}>Menny.</th>
            <th style={{ ...cellS, textAlign: "right", width: "140px", color: brandDark }}>Bruttó egységár</th>
            <th style={{ ...cellS, textAlign: "right", width: "140px", color: brandBlue }}>Bruttó összesen</th>
          </tr>
        </thead>
        <tbody>
          {q.items?.map((it: any) => (
            <tr key={it.id} style={{ borderBottom: "1px solid #f9f9f9" }}>
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
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 50 }}>
        <div style={{ width: "340px", padding: "15px", border: `2px solid ${brandBlue}`, borderRadius: "10px", background: "#fcfdff" }}>
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
          <p style={{ margin: "0 0 5px 0" }}><strong>Érvényesség:</strong> Ez az árajánlat a kiállítástól számított <strong>7 napig</strong> érvényes.</p>
          <p style={{ margin: 0 }}><strong>Megjegyzés:</strong> Az ajánlat készítője alanyi adómentes, ezért a végösszeget az Áfa mértéke nem befolyásolja.</p>
        </div>
      </div>

      {/* 7. NYOMTATÁS GOMB */}
      <button onClick={() => window.print()} className="no-print" style={printBtnS(brandBlue)}>
        📥 AJÁNLAT MENTÉSE (PDF)
      </button>

      <style jsx global>{`
        @media screen {
          body { background: #525659; padding: 40px 0; }
          .print-wrapper { 
            background: white; 
            padding: 60px 70px; 
            max-width: 900px; 
            margin: 0 auto; 
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
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
        * { font-family: 'Segoe UI', system-ui, sans-serif; box-sizing: border-box; }
      `}</style>
    </div>
  );
}

const cellS = { padding: "18px 10px" };
const labelStyle = { display: "block", color: "#95a5a6", fontWeight: "bold" as const, textTransform: "uppercase" as const, fontSize: "10px", letterSpacing: "1px", marginBottom: "8px" };
const printBtnS = (color: string) => ({ position: "fixed" as const, bottom: "30px", right: "30px", background: color, color: "#fff", border: "none", padding: "18px 36px", borderRadius: "50px", fontWeight: "bold" as const, cursor: "pointer", boxShadow: "0 10px 25px rgba(0,0,0,0.3)", fontSize: "16px", zIndex: 1000 });
