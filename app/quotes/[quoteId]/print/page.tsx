"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function QuotePrintPage() {
  const params = useParams();
  const quoteId = params?.quoteId;
  const [q, setQ] = useState<any>(null);

  useEffect(() => {"use client";

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
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 30, alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, color: "#1a252f", fontSize: 32, fontWeight: "800" }}>ÁRAJÁNLAT</h1>
          <p style={{ color: "#7f8c8d", margin: "5px 0" }}>Azonosító: #{q.id}/2026</p>
          <p style={{ margin: 0, fontSize: 14 }}>Kelt: {new Date().toLocaleDateString('hu-HU')}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <img src="/ns-logo.png" alt="NS-AIR KLÍMA" style={{ height: 80, marginBottom: 10 }} />
          <div style={{ fontSize: 14, lineHeight: "1.4" }}>
            <strong style={{ fontSize: 18 }}>NS-AIR KLÍMA</strong><br />
            Klímaszerelés és Karbantartás<br />
            Email: <strong>info@nsairklima.hu</strong>
          </div>
        </div>
      </div>

      <div style={{ height: "3px", background: "#1a252f", marginBottom: 30 }}></div>

      {/* ÜGYFÉL ADATOK */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ padding: "20px", border: "1px solid #eee", borderRadius: 10, background: "#fcfcfc", width: "fit-content", minWidth: "300px" }}>
          <small style={{ color: "#7f8c8d", fontWeight: "bold", textTransform: "uppercase", fontSize: 10, letterSpacing: "1px" }}>Ajánlatot kapja:</small>
          <div style={{ fontSize: 20, fontWeight: "bold", marginTop: 8, color: "#2c3e50" }}>{q.client?.name}</div>
          <div style={{ marginTop: 5, fontSize: 15 }}>{q.client?.address || "Cím nincs megadva"}</div>
          <div style={{ fontSize: 15 }}>{q.client?.phone}</div>
        </div>
      </div>

      {/* TÉTELEK TÁBLÁZAT */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 30 }}>
        <thead>
          <tr style={{ background: "#1a252f", color: "#fff" }}>
            <th style={{ ...cellS, textAlign: "left", borderRadius: "8px 0 0 0" }}>Megnevezés</th>
            <th style={{ ...cellS, width: "100px" }}>Menny.</th>
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

      {/* ÖSSZESÍTÉS */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 50 }}>
        <div style={{ width: "350px", padding: "20px", background: "#f8f9fa", borderRadius: "10px", border: "1px solid #eee" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 18, fontWeight: "600" }}>Fizetendő bruttó:</span>
            <span style={{ fontSize: 24, fontWeight: "800", color: "#1a252f" }}>{Number(q.grossTotal).toLocaleString()} Ft</span>
          </div>
        </div>
      </div>

      {/* ZÁRÓ SZÖVEG ÉS ÉRVÉNYESSÉG */}
      <div style={{ marginTop: "auto", borderTop: "1px solid #eee", paddingTop: 30 }}>
        <p style={{ fontSize: 15, lineHeight: "1.6", color: "#2c3e50", marginBottom: 20 }}>
          Árajánlatunkat az Ön igényeinek megfelelően állítottuk össze. Bízunk benne, hogy egyedi árajánlatunk segíteni fogja Önt, hogy a megrendeléshez szükséges döntést meghozza.
        </p>
        
        <div style={{ padding: "15px", background: "#fff9f0", borderRadius: 8, border: "1px solid #ffeeba", fontSize: 13, color: "#856404" }}>
          <strong>Érvényesség:</strong> Ez az árajánlat a kiállítástól számított <strong>7 napig</strong> érvényes.
          <br />Az árak a 27% ÁFA-t tartalmazzák.
        </div>
      </div>

      {/* NYOMTATÁS GOMB (CSAK KÉPERNYŐN) */}
      <button onClick={() => window.print()} className="no-print" style={printBtnS}>
        📥 AJÁNLAT MENTÉSE (PDF)
      </button>

      <style jsx global>{`
        @media screen {
          body { background: #444; padding: 40px 0; }
          .print-wrapper { 
            background: white; 
            padding: 80px; 
            max-width: 900px; 
            margin: 0 auto; 
            box-shadow: 0 0 40px rgba(0,0,0,0.5);
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

const cellS = { padding: "18px 12px", fontSize: "14px" };
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
  zIndex: 1000,
  transition: "transform 0.2s"
};
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
