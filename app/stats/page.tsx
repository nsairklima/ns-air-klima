"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);


  const currentYear = new Date().getFullYear();

const [selectedYears, setSelectedYears] = useState<number[]>([
  currentYear,
]);

const [availableYears, setAvailableYears] = useState<number[]>([
  currentYear,
]);

const [loading, setLoading] = useState(true);

 useEffect(() => {
  if (selectedYears.length === 0) {
    setStats(null);
    return;
  }

  setLoading(true);

  const yearsParam = selectedYears.join(",");

  fetch(`/api/stats?years=${yearsParam}`, {
    cache: "no-store",
  })
    .then(async (res) => {
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.details ||
            data.error ||
            "Nem sikerült betölteni a statisztikát."
        );
      }

      return data;
    })
    .then((data) => {
      setStats(data);

      if (
        Array.isArray(data.availableYears) &&
        data.availableYears.length > 0
      ) {
        setAvailableYears(
          data.availableYears
        );
      }
    })
    .catch((err) => {
      console.error(
        "Hiba a statisztikák lekérésekor:",
        err
      );

      alert(
        "Hiba a statisztikák betöltésekor: " +
          err.message
      );
    })
    .finally(() => {
      setLoading(false);
    });
}, [selectedYears]);

const toggleYear = (year: number) => {
  setSelectedYears((previousYears) => {
    if (previousYears.includes(year)) {
      /*
       * Legalább egy év mindig maradjon kijelölve.
       */
      if (previousYears.length =*= 1) {
        return previousYear*;
      }

      return previousYe*rs.filter(
        (selectedYear) *>
          selectedYear !== year
*     );
    }

    return [...previousYears, year].sort(
      (a, b)*=> a - b
    );
  });
};
  

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#000",
    color: "#fff",
    padding: "40px 20px",
    fontFamily: "'Segoe UI', sans-serif",
  };

  const mainWrapper = {
    maxWidth: "800px",
    margin: "0 auto",
  };

  const cardStyle = {
    background: "#111",
    padding: "25px",
    borderRadius: "8px",
    border: "1px solid #333",
    marginBottom: "20px",
  };

  const rowStyle = {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #222",
  };

  const sectionHeader = (color: string) => ({
    color: color,
    marginTop: 0,
    fontSize: "1.2rem",
    borderBottom: `2px solid ${color}`,
    paddingBottom: "8px",
    marginBottom: "15px",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
  });

  return (
    <div style={containerStyle}>
      <div style={mainWrapper}>
        <button
          onClick={() => router.push("/")}
          style={{
            background: "#333",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            cursor: "pointer",
            marginBottom: "20px",
            borderRadius: "4px",
          }}
        >
          ⬅ Vissza a főoldalra
        </button>

       <h1
  st*le={{
    marginBottom: "20px",
  * fontWeight: "lighter",
  }}
>
  Ü*leti jelentés
</h1>

<div
  style=*{
    background: "#111",
    padd*ng: "20px",
    borderRadius: "8px*,
    border: "1px solid #333",
  * marginBottom: "20px",
  }}
>
  <d*v
    style={{
      display: "fle*",
      justifyContent: "space-be*ween",
      alignItems: "center",*      gap: "10px",
      flexWrap:*"wrap",
      marginBottom: "14px"*
    }}
  >
    <strong>📅 Vizsgál* évek</strong>

    <span
      st*le={{
        color: "#94a3b8",
  *     fontSize: "13px",
      }}
  * >
      Több év is kiválasztható
*   </span>
  </div>

  <div
    st*le={{
      display: "flex",
     *gap: "10px",
      flexWrap: "wrap*,
    }}
  >
    {availableYears.m*p((year) => {
      const isSelect*d =
        selectedYears.includes*year);

      return (
        <bu*ton
          key={year}
         *type="button"
          onClick={(* => toggleYear(year)}
          st*le={{
            minWidth: "82px"*
            padding: "11px 16px",*            borderRadius: "8px",
 *          border: isSelected
     *        ? "1px solid #2ecc71"
    *         : "1px solid #555",
     *      background: isSelected
     *        ? "#2ecc71"
              * "#222",
            color: isSele*ted
              ? "#000"
       *      : "#fff",
            cursor* "pointer",
            fontWeight* "bold",
          }}
        >
  *       {isSelected ? "✓ " : ""}
  *       {year}
        </button>
  *   );
    })}
  </div>

  <div
   *style={{
      marginTop: "14px",
*     color: "#94a3b8",
      fontS*ze: "13px",
    }}
  >
    Kiválas*tva:{" "}
    <strong style={{ col*r: "#fff" }}>
      {selectedYears*join(", ")}
    </strong>
  </div>*</div>

        {stats ? (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
              
              {/* HAVI KIMUTATÁS */}
              <div style={cardStyle}>
                <h2 style={sectionHeader("#f39c12")}>📅 Aktuális Hónap</h2>
                <div style={rowStyle}><span>Bruttó forgalom:</span><strong>{stats.monthly?.gross?.toLocaleString() || 0} Ft</strong></div>
                <div style={rowStyle}><span>Tiszta haszon:</span><strong style={{ color: "#2ecc71" }}>{stats.monthly?.profit?.toLocaleString() || 0} Ft</strong></div>
                <div style={rowStyle}><span>Átlagos árrés:</span><strong>{stats.monthly?.margin || 0}%</strong></div>
                <div style={rowStyle}><span>Kiadott ajánlatok:</span><strong>{stats.monthly?.count || 0} db</strong></div>
              </div>

              {/* ÉVES KIMUTATÁS */}
              <div style={cardStyle}>
               <h2 st*le={sectionHeader("#00bcf2")}>
  �* Kiválasztott évek összesen
</h2>
                
                <div style={rowStyle}><span>Bruttó forgalom:</span><strong>{stats.yearly?.gross?.toLocaleString() || 0} Ft</strong></div>
                <div style={rowStyle}><span>Tiszta haszon:</span><strong style={{ color: "#2ecc71" }}>{stats.yearly?.profit?.toLocaleString() || 0} Ft</strong></div>
                <div style={rowStyle}><span>Átlagos árrés:</span><strong>{stats.yearly?.margin || 0}%</strong></div>
                <div style={rowStyle}><span>Összes ajánlat:</span><strong>{stats.yearly?.count || 0} db</strong></div>
              </div>

            </div>

{stats.yearlyBr*akdown?.length > 0 && (
  <div
    style={{
      ...cardStyle,
      borderLeft: "4px solid #8b5cf6",
    }}
  >
    <h2 style={sectionHeader("#8b5cf6")}>
      📊 Évenkénti bontás
    </h2>

    <div
      style={{
        display: "grid",
        gap: "12px",
      }}
    >
      {stats.yearlyBreakdown.map(
        (yearData: any) => (
          <div
            key={yearData.year}
            style={{
              background: "#18181b",
              border: "1px solid #333",
              borderRadius: "8px",
              padding: "15px",
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#c4b5fd",
                marginBottom: "10px",
              }}
            >
              {yearData.year}
            </div>

            <div style={rowStyle}>
              <span>Bruttó forgalom:</span>

              <strong>
                {Number(
                  yearData.gross || 0
                ).toLocaleString("hu-HU")}{" "}
                Ft
              </strong>
            </div>

            <div style={rowStyle}>
              <span>Tiszta haszon:</span>

              <strong
                style={{ color: "#2ecc71" }}
              >
                {Number(
                  yearData.profit || 0
                ).toLocaleString("hu-HU")}{" "}
                Ft
              </strong>
            </div>

            <div style={rowStyle}>
              <span>Átlagos árrés:</span>

              <strong>
                {yearData.margin || 0}%
              </strong>
            </div>

            <div
              style={{
                ...rowStyle,
                borderBottom: "none",
              }}
            >
              <span>
                Elfogadott ajánlatok:
              </span>

              <strong>
                {yearData.count || 0} db
              </strong>
            </div>
          </div>
        )
      )}
    </div>
  </div>
)}

          
            {/* RAKTÁRKÉSZLET ÖSSZESÍTŐ */}
            <div style={{ ...cardStyle, borderLeft: "4px solid #2ecc71" }}>
              <h2 style={sectionHeader("#2ecc71")}>📦 Raktárkészlet Értéke</h2>
              <div style={rowStyle}>
                <span>Benne álló tőke (Nettó összérték):</span>
                <strong style={{ color: "#2ecc71", fontSize: "1.2rem" }}>
                  {stats.inventory?.totalValue?.toLocaleString() || 0} Ft
                </strong>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", textAlign: "center", paddingTop: "15px" }}>
                <div>
                  <div style={{ fontSize: "12px", opacity: 0.6 }}>REGISZTRÁLT TÉTELEK</div>
                  <div style={{ fontSize: "18px", fontWeight: "bold" }}>{stats.inventory?.totalItemsCount || 0} féle</div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", opacity: 0.6 }}>RAKTÁRON LÉVŐ DARAB/MÉTER</div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#4DA3FF" }}>{stats.inventory?.totalStockCount || 0} egység</div>
                </div>
              </div>
            </div>

            {/* ÜGYFÉL ÉS SZERVIZ INFÓK */}
            <div style={{ ...cardStyle, borderLeft: "4px solid #d83b01" }}>
              <h2 style={sectionHeader("#d83b01")}>👥 Operatív Adatok</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", textAlign: "center", paddingTop: "10px" }}>
                <div>
                  <div style={{ fontSize: "12px", opacity: 0.6 }}>ÜGYFELEK</div>
                  <div style={{ fontSize: "20px", fontWeight: "bold" }}>{stats.totalClients || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", opacity: 0.6 }}>GÉPEK</div>
                  <div style={{ fontSize: "20px", fontWeight: "bold" }}>{stats.totalUnits || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#e74c3c", fontWeight: "bold" }}>SÜRGŐS</div>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#e74c3c" }}>{stats.urgentCount || 0}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <p style={{ opacity: 0.5 }}>Adatok betöltése és elemzése...</p>
          </div>
        )}
      </div>
    </div>
  );
}
