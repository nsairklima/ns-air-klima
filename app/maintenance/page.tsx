"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Log = {
  id: number;
  clientUnitId: number;
  performedAt: string; // ISO
  nextDue?: string | null;
  notes?: string | null;
};

export default function MaintenancePage() {
  const sp = useSearchParams();
  const unitIdParam = sp.get("unitId");
  const unitId = unitIdParam ? Number(unitIdParam) : NaN;

  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Új bejegyzés űrlap
  const [performedAt, setPerformedAt] = useState<string>(() => todayYYYYMMDD());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const today = useMemo(() => new Date(), []);

  async function load() {
    if (!Number.isFinite(unitId)) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/maintenance?unitId=${unitId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Lekérési hiba");
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Váratlan válasz");
      setLogs(data);
    } catch (e: any) {
      setErr(e?.message || "Ismeretlen hiba");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitIdParam]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!Number.isFinite(unitId)) {
      alert("Hiányzik a unitId paraméter.");
      return;
    }
    if (!performedAt) {
      alert("A dátum kötelező.");
      return;
    }
    setSaving(true);
    try {
    
const res = await fetch("/api/maintenance", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    unitId,
    performedAt,          // a mi eddigi mezőnevünk
    performedDate: performedAt, // a backend által várt név is kap értéket
    notes: notes || null,
  }),

      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error("Mentési hiba: " + t);
      }
      // reset + frissítés
      setPerformedAt(todayYYYYMMDD());
      setNotes("");
      await load();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      alert(e?.message || "Ismeretlen hiba mentés közben.");
    }
    setSaving(false);
  }

  function statusBadge(nextDue?: string | null) {
    if (!nextDue) return <span style={badgeGray}>nincs esedékesség</span>;
    const nd = new Date(nextDue);
    const diff = daysBetween(today, nd);
    if (diff < 0) return <span style={badgeRed}>LEJÁRT</span>;
    if (diff <= 14) return <span style={badgeOrange}>HAMAROSAN</span>;
    return <span style={badgeGreen}>REND BEN</span>;
  }

  if (!unitIdParam) {
    return (
      <div style={wrap}>
        <h1>Karbantartások</h1>
        <p style={{ color: "#555" }}>
          Add meg az URL-ben a <code>?unitId=</code> paramétert, vagy gyere a
          <strong> /clients/[id]</strong> oldalról a „Karbantartások →” linkkel.
        </p>
        <p>Példa: <code>/maintenance?unitId=12</code></p>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <a href="javascript:history.back()" style={{ color: "#4DA3FF", textDecoration: "none" }}>
        ← Vissza
      </a>
      <h1 style={{ marginTop: 12 }}>Karbantartások – unit #{unitId}</h1>

      {loading && <p>Betöltés…</p>}
      {err && <p style={{ color: "crimson" }}>Hiba: {err}</p>}

      {/* Lista */}
      {!loading && logs.length === 0 && (
        <p>Még nincs rögzített karbantartás ehhez a klímához.</p>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {logs.map((l) => (
          <div key={l.id} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>#{l.id}</strong>
              {statusBadge(l.nextDue)}
            </div>
            <div style={{ fontSize: 14, color: "#444", marginTop: 6 }}>
              <div>Elvégezve: {dateISOToYMD(l.performedAt)}</div>
              <div>Következő esedékesség: {l.nextDue ? dateISOToYMD(l.nextDue) : "—"}</div>
              {l.notes && <div>Megjegyzés: {l.notes}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Új bejegyzés űrlap */}
      <h2 style={{ marginTop: 24 }}>Új karbantartás rögzítése</h2>
      <form onSubmit={save} style={form}>
        <label>
          Dátum*<br />
          <input type="date" value={performedAt} onChange={(e) => setPerformedAt(e.target.value)} style={input} />
        </label>
        <label style={{ gridColumn: "1 / span 2" }}>
          Megjegyzés<br />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={textarea} placeholder="opcionális" />
        </label>

        <button disabled={saving} style={btnPrimary}>
          {saving ? "Mentés…" : "Bejegyzés mentése"}
        </button>
      </form>
    </div>
  );
}

/* --- segédfüggvények & stílusok --- */
function todayYYYYMMDD() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
function dateISOToYMD(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "n.a." : d.toISOString().slice(0, 10);
}
function daysBetween(a: Date, b: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((b0 - a0) / msPerDay);
}

/* stílus */
const wrap: React.CSSProperties = { padding: 24, fontFamily: "Arial, sans-serif", maxWidth: 900, margin: "0 auto" };
const card: React.CSSProperties = { border: "1px solid #e5e5e5", borderRadius: 8, padding: 12, background: "#fafafa" };
const form: React.CSSProperties = {
  display: "grid",
  gap: 10,
  gridTemplateColumns: "1fr 1fr",
  maxWidth: 700,
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: 16,
  background: "#fff",
};
const input: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6, boxSizing: "border-box" };
const textarea: React.CSSProperties = { width: "100%", minHeight: 80, padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6, boxSizing: "border-box" };
const btnPrimary: React.CSSProperties = { background: "#4DA3FF", color: "#fff", border: "none", borderRadius: 6, padding: "10px 14px", cursor: "pointer", width: 200 };
const badgeBase: React.CSSProperties = { padding: "2px 8px", borderRadius: 999, fontSize: 12, border: "1px solid transparent" };
const badgeRed: React.CSSProperties = { ...badgeBase, background: "#ffe5e5", color: "#a30000", borderColor: "#f4b3b3" };
const badgeOrange: React.CSSProperties = { ...badgeBase, background: "#fff0e0", color: "#8a3c00", borderColor: "#f7c79e" };
const badgeGreen: React.CSSProperties = { ...badgeBase, background: "#e9f9ee", color: "#0a5c2e", borderColor: "#b8e7c8" };
const badgeGray: React.CSSProperties = { ...badgeBase, background: "#f2f2f2", color: "#555", borderColor: "#ddd" };
``
