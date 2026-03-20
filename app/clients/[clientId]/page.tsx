"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Client = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
};

type Unit = {
  id: number;
  clientId: number;
  brand: string;
  model: string;
  powerKw?: number | null;
  serialNumber?: string | null;
  installation?: string | null; // ISO dátum string
  periodMonths: number;
  location?: string | null;
  notes?: string | null;
};

export default function ClientDetailPage() {
  const params = useParams<{ clientId: string }>();
  const clientId = Number(params.clientId);

  const [client, setClient] = useState<Client | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Ügyfél szerkesztő állapotok
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [savingClient, setSavingClient] = useState(false);

  // Új klíma űrlap mezők
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [powerKw, setPowerKw] = useState<string>("");
  const [serialNumber, setSerialNumber] = useState("");
  const [installation, setInstallation] = useState("");
  const [periodMonths, setPeriodMonths] = useState<string>("12");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [savingUnit, setSavingUnit] = useState(false);

  async function load() {
    if (!Number.isFinite(clientId)) return;
    setLoading(true);
    setErr(null);
    try {
      // Ügyfél adatok
      const resClient = await fetch(`/api/clients/${clientId}`, { cache: "no-store" });
      if (!resClient.ok) throw new Error("Ügyfél lekérési hiba.");
      const clientData: Client = await resClient.json();

      // Klímák listája ennél az ügyfélnél
      const resUnits = await fetch(`/api/client-units?clientId=${clientId}`, { cache: "no-store" });
      if (!resUnits.ok) throw new Error("Klíma lista lekérési hiba.");
      const unitsData: Unit[] = await resUnits.json();

      setClient(clientData);
      setUnits(Array.isArray(unitsData) ? unitsData : []);

      // Szerkesztő mezők előtöltése
      setEditName(clientData.name || "");
      setEditEmail(clientData.email || "");
      setEditPhone(clientData.phone || "");
      setEditAddress(clientData.address || "");
    } catch (e: any) {
      setErr(e?.message || "Ismeretlen hiba történt.");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function saveClient(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim()) {
      alert("A név kötelező.");
      return;
    }
    setSavingClient(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim(),
          address: editAddress.trim(),
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error("Mentés sikertelen: " + t);
      }
      const updated: Client = await res.json();
      setClient(updated);
      setEditOpen(false);
    } catch (e: any) {
      alert(e?.message || "Ismeretlen hiba a mentés során.");
    }
    setSavingClient(false);
  }

  async function addUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!brand.trim() || !model.trim()) {
      alert("A gyártó és a modell megadása kötelező.");
      return;
    }
    setSavingUnit(true);
    try {
      const res = await fetch("/api/client-units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          brand,
          model,
          powerKw: powerKw ? Number(powerKw) : null,
          serialNumber: serialNumber || null,
          installation: installation || null,
          periodMonths: periodMonths ? Number(periodMonths) : 12,
          location: location || null,
          notes: notes || null,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error("Klíma mentés sikertelen: " + t);
      }
      // Mezők reset + lista frissítés
      setBrand(""); setModel(""); setPowerKw(""); setSerialNumber("");
      setInstallation(""); setPeriodMonths("12"); setLocation(""); setNotes("");
      await load();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      alert(e?.message || "Ismeretlen hiba az új klíma mentése közben.");
    }
    setSavingUnit(false);
  }

  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif", maxWidth: 960, margin: "0 auto" }}>
      <a href="/clients" style={{ color: "#4DA3FF", textDecoration: "none" }}>← Vissza az ügyfelekhez</a>
      <h1 style={{ marginTop: 12 }}>Ügyfél részletei</h1>

      {loading && <p>Betöltés...</p>}
      {err && <p style={{ color: "crimson" }}>Hiba: {err}</p>}
      {!loading && !client && <p>Ügyfél nem található.</p>}

      {client && (
        <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
          <div><strong>#{client.id}</strong></div>
          <div><strong>Név:</strong> {client.name}</div>
          {client.email && <div><strong>E‑mail:</strong> {client.email}</div>}
          {client.phone && <div><strong>Telefon:</strong> {client.phone}</div>}
          {client.address && <div><strong>Cím:</strong> {client.address}</div>}

          <div style={{ marginTop: 8 }}>
            <button onClick={() => setEditOpen((v) => !v)} style={btnSecondary}>
              {editOpen ? "Mégse" : "Szerkesztés"}
            </button>
          </div>

          {editOpen && (
            <form
              onSubmit={saveClient}
              style={{
                display: "grid",
                gap: 10,
                maxWidth: 700,
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 16,
                background: "#fff",
              }}
            >
              <h3 style={{ margin: 0 }}>Ügyfél szerkesztése</h3>
              <label>Név*<br />
                <input value={editName} onChange={(e) => setEditName(e.target.value)} style={inputStyle} />
              </label>
              <label>E‑mail<br />
                <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={inputStyle} />
              </label>
              <label>Telefon<br />
                <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} style={inputStyle} />
              </label>
              <label>Cím<br />
                <input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} style={inputStyle} />
              </label>

              <div style={{ display: "flex", gap: 8 }}>
                <button disabled={savingClient} style={btnPrimary}>
                  {savingClient ? "Mentés..." : "Mentés"}
                </button>
                <button type="button" onClick={() => setEditOpen(false)} style={btnSecondary}>
                  Mégse
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* KLÍMÁK LISTÁJA */}
      <h2>Klímák</h2>
      {!loading && units.length === 0 && <p>Még nincs rögzített klíma ennél az ügyfélnél.</p>}
      <div style={{ display: "grid", gap: 10 }}>
        {units.map((u) => (
          <div
            key={u.id}
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: 12,
              display: "grid",
              gap: 6,
              background: "#fafafa",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <strong>#{u.id} — {u.brand} {u.model}</strong>
              <div style={{ display: "flex", gap: 8 }}>
                <a
                  href={`/maintenance?unitId=${u.id}`}
                  style={{ color: "#4DA3FF", textDecoration: "none" }}
                  title="Karbantartások megnyitása"
                >
                  Karbantartások →
                </a>
              </div>
            </div>
            <div style={{ fontSize: 14, color: "#444" }}>
              {typeof u.powerKw === "number" && <div>Teljesítmény: {u.powerKw} kW</div>}
              {u.serialNumber && <div>Gyári szám: {u.serialNumber}</div>}
              {u.installation && <div>Telepítés: {new Date(u.installation).toISOString().slice(0,10)}</div>}
              <div>Periódus: {u.periodMonths} hónap</div>
              {u.location && <div>Helyiség: {u.location}</div>}
              {u.notes && <div>Megjegyzés: {u.notes}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* ÚJ KLÍMA ŰRLAP */}
      <h2 style={{ marginTop: 28 }}>Új klíma felvétele</h2>
      <form
        onSubmit={addUnit}
        style={{
          display: "grid",
          gap: 10,
          maxWidth: 700,
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 16,
          background: "#fff",
        }}
      >
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr", alignItems: "center" }}>
          <label>Gyártó*<br/>
            <input value={brand} onChange={(e) => setBrand(e.target.value)} style={inputStyle} placeholder="pl. Gree" />
          </label>
          <label>Modell*<br/>
            <input value={model} onChange={(e) => setModel(e.target.value)} style={inputStyle} placeholder="pl. Comfort X" />
          </label>
          <label>Teljesítmény (kW)<br/>
            <input type="number" step="0.1" value={powerKw} onChange={(e) => setPowerKw(e.target.value)} style={inputStyle} placeholder="pl. 3.5" />
          </label>
          <label>Gyári szám<br/>
            <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} style={inputStyle} placeholder="opcionális" />
          </label>
          <label>Telepítés dátuma<br/>
            <input type="date" value={installation} onChange={(e) => setInstallation(e.target.value)} style={inputStyle} />
          </label>
          <label>Periódus (hó)<br/>
            <input type="number" min={1} value={periodMonths} onChange={(e) => setPeriodMonths(e.target.value)} style={inputStyle} />
          </label>
          <label>Helyiség<br/>
            <input value={location} onChange={(e) => setLocation(e.target.value)} style={inputStyle} placeholder="pl. nappali" />
          </label>
          <label style={{ gridColumn: "1 / span 2" }}>Megjegyzés<br/>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={textareaStyle} placeholder="opcionális" />
          </label>
        </div>

        <button disabled={savingUnit} style={btnPrimary}>
          {savingUnit ? "Mentés..." : "Klíma mentése"}
        </button>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
  boxSizing: "border-box",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 80,
  padding: "10px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
  boxSizing: "border-box",
};

const btnPrimary: React.CSSProperties = {
  background: "#4DA3FF",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "10px 14px",
  cursor: "pointer",
  width: 180,
};

const btnSecondary: React.CSSProperties = {
  background: "#EEE",
  color: "#333",
  border: "1px solid #DDD",
  borderRadius: 6,
  padding: "10px 14px",
  cursor: "pointer",
};
``
