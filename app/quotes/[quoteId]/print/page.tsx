"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function QuotePrintPage() {
  const params = useParams();
  const quoteId = params?.quoteId;
  const [q, setQ] = useState<any>(null);

  useEffect(() => {
    if (quoteId) {
      // Itt a valódi API hívás történik az ajánlat adataival
      fetch(`/api/quotes/${quoteId}`)
        .then(res => res.json())
        .then(data => setQ(data));
    }
  }, [quoteId]);

  if (!q) return <div style={{padding: 20, fontFamily: "Segoe UI, sans-serif"}}>Ajánlat betöltése...</div>;

  return (
    <div className="print-wrapper">
      {/* 1. FEJLÉC: Cím és Logó */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15, alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, color: "#1a252f", fontSize: 32, fontWeight: "800" }}>ÁRAJÁNLAT</h1>
          <p style={{ color: "#7f8c8d", margin: "3px 0", fontSize: 14 }}>Azonosító: #{q.id}/2026</p>
          <p style={{ margin: 0, fontSize: 14 }}>Kelt: {new Date().toLocaleDateString('hu-HU')}</p>
        </div>
        <div>
          {/* A logó elérhetősége a public mappában: /ns-logo.png */}
          <img src="/ns-logo.png" alt="NS-AIR KLÍMA" style={{ height: 85 }} />
        </div>
      </div>

      {/* 2. DÍSZÍTŐ SÁV (a minta alapján) */}
      <div style={{ display: "flex", marginBottom: 25 }}>
        <div style={{ flex: 3, height: "8px", background: "#1a252f", borderRadius: "4px 0 0 4px" }}></div>
        <div style={{ flex: 7, height: "8px", background: "#eee", borderRadius: "0 4px 4px 0" }}></div>
      </div>

      {/* 3. ADATOK ELRENDEZÉSE: Kétoszlopos nézet (mint a képen) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, marginBottom: 50 }}>
        {/* BAL OLDAL: Kiállító (NS-AIR KLÍMA) adatai */}
        <div>
          <small style={labelStyle}>Kiállító</small>
          <div style={{ fontSize: 13, lineHeight: "1.6", color: "#2c3e50" }}>
            <strong style={{ fontSize: 16 }}>NS-AIR KLÍMA</strong><br />
            9143 Enese, Külsőréti dűlő 12.<br />
            Adószám: 66362740-1-28<br />
            Web: <strong>www.nsairklima.hu</strong><br />
            Email: <strong>info@nsairklima.hu</strong><br />
            Tel: <strong>+36 70 312 1825</strong>
          </div>
        </div>

        {/* JOBB OLDAL: Megrendelő (Ügyfél) adatai */}
        <div style={{ textAlign: "right" }}>
          <small style={labelStyle}>Megrendelő</small>
          <div style={{ fontSize: 13, lineHeight: "1.6", color: "#2c3e50" }}>
            <strong style={{ fontSize: 16 }}>{q.client?.name}</strong><br />
            {q.client?.address || "Cím nincs megadva"}<br />
            {q.client?.phone || ""}<br />
            {q.client?.email || ""}
          </div>
        </div>
      </div>

      {/* 4. TÉTELEK TÁBLÁZAT */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 30, fontSize: "14px" }}>
        <thead>
          <tr style={{ background: "#1a252f", color: "#fff" }}>
            <th style={{ ...cellS, textAlign: "left", borderRadius: "8px 0 0 0" }}>Megnevezés</th>
            <th style={{ ...cellS, width: "100px", textAlign: "center" }}>Menny.</th>
            <th style={{ ...cellS, textAlign: "right", width: "150px" }}>Bruttó egységár</th>
            <th style={{ ...cellS, textAlign: "right", width: "150px", borderRadius: "0 8px 0 0" }}>Összesen</th>
          </tr>
        </thead>
        <tbody>
          {q.items?.map((it: any) => (
            <tr key={it.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={cellS}>
                <div style={{ fontWeight: "600", color: "#2c3e50" }}>{it.description}</div>
              </td>
              <td style={{ ...cellS, textAlign: "center" }}>{it.quantity} {it.unit}</td>
              <td style={{ ...cellS, textAlign: "right" }}>
                {Math.round(it.unitPriceNet * 1.27).toLocaleString()} Ft
              </td>
              <td style={{ ...cellS, textAlign: "right", fontWeight: "bold", color: "#2c3e50" }}>
                {Math.round(it.unitPriceNet * 1.27 * it.quantity).toLocaleString()} Ft
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 5. ÖSSZESÍTÉS */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 40 }}>
        <div style={{ width: "350px", padding: "20px", background: "#f8f9fa", borderRadius: "10px", border: "1px solid #eee" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 18, fontWeight: "600" }}>Fizetendő bruttó:</span>
            <span style={{ fontSize: 24, fontWeight: "800", color: "#1a252f" }}>{Number(q.grossTotal).toLocaleString()} Ft</span>
          </div>
        </div>
      </div>

      {/* 6. JOGI ÉS EGYÉB INFÓ */}
      <div style={{ marginTop: "auto", borderTop: "1px solid #eee", paddingTop: 30, fontSize: "14px" }}>
        <p style={{ fontWeight: "bold", color: "#1a252f", marginBottom: 10 }}>
          Köszönjük, hogy minket választott!
        </p>
        <p style={{ lineHeight: "1.6", color: "#2c3e50", marginBottom: 20 }}>
          Árajánlatunkat az Ön igényeinek megfelelően állítottuk össze. Bízunk benne, hogy egyedi árajánlatunk segíteni fogja Önt, hogy a megrendeléshez szükséges döntést meghozza.
        </p>
        
        <div style={{ padding: "15px", background: "#fff9f0", borderRadius: 8, border: "1px solid #ffeeba", fontSize: 13, color: "#856404" }}>
          <strong>Érvényesség:</strong> Ez az árajánlat a kiállítástól számított <strong>7 napig</strong> érvényes.
          <br />Az árak a 27% ÁFA-t tartalmazzák.
        </div>
      </div>

      {/* 7. NYOMTATÁS GOMB (CSAK KÉPERNYŐN) */}
      <button onClick={() => window.print()} className="no-print" style={printBtnS}>
        📥 AJÁNLAT MENTÉSE (PDF)
      </button>

      {/* Globális és lokális stílusok */}
      <style jsx global>{`
        @media screen {
          body { background: #525659; padding: 40px 0; }
          .print-wrapper { 
            background: white; 
            padding: 70px 60px; 
            max-width: 900px; 
            margin: 0 auto; 
            box-shadow: 0 0 30px rgba(0,0,0,0.5);
            min-height: 297mm;
            display: flex;
            flex-direction: column;
          }
        }
        @media print {
          .no-print { display: none !important; }
          .print-wrapper { padding: 0; margin: 0; width: 100%; box-shadow: none; min-height: auto; }
          body { background: white; }
        }
        * { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-sizing: border-box; }
      `}</style>
    </div>
  );
}

// Stílus konstansok
const cellS = { padding: "18px 12px" };
const labelStyle = { 
  display: "block", 
  color: "#7f8c8d", 
  fontWeight: "bold" as const, 
  textTransform: "uppercase" as const, 
  fontSize: "11px", 
  letterSpacing: "1px", 
  marginBottom: "8px" 
};
const printBtnS = { 
  position: "fixed" as const, 
  bottom: "30px", 
  right: "30px", 
  background: "#27ae60", 
  color: "#fff", 
  border: "none", 
  padding: "18px 36px", 
  borderRadius: "50px", 
  fontWeight: "bold" as const, 
  cursor: "pointer", 
  boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
  fontSize: "16px",
  zIndex: 1000
};
