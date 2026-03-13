"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

type Client = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
};

type Unit = {
  id: number;
  brand: string;
  model: string;
  powerKw?: number;
  serialNumber?: string;
  installation?: string; // ISO dátum (YYYY-MM-DD)
  periodMonths?: number;
  location?: string;
  notes?: string;
};

export default function ClientDetailPage() {
  const params = useParams<{ clientId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const clientId = Number(params.clientId);
  const editParam = searchParams.get("edit"); // "1" vagy null

  // Alap state-ek
  const [client, setClient] = useState<Client | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  // Új klíma form
  const [formOpen, setFormOpen] = useState(false);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [powerKw, setPowerKw] = useState<string>("");
  const [serialNumber, setSerialNumber] = useState("");
  const [installation, setInstallation] = useState("");
  const [periodMonths, setPeriodMonths] = useState<string>("12");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  // Ügyfél szerkesztő form
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");

  /** ===== Segéd: távolítsuk el az ?edit=1 paramot a címből, hogy frissítésnél ne nyíljon újra ===== */
  function removeEditParam() {
    const url = new URL(window.location.href);
    url.searchParams.delete("edit");
    router.replace(url.pathname + (url.search ? url.search : ""), { scroll: false });
  }

  /** ===== Betöltés: ügyfél + klímák ===== */
  useEffect(() => {
    async function load() {
      try {
        const [clientRes, unitsRes] = await Promise.all([
          fetch(`/api/clients/${clientId}`),
          fetch(`/api/client-units?clientId=${clientId}`),
        ]);
        const clientData = await clientRes.json();
        const unitsData = await unitsRes.json();
        setClient(clientData ?? null);
        setUnits(Array.isArray(unitsData) ? unitsData : []);
      } finally {
        setLoading(false);
      }
    }
    if (clientId) load();
  }, [clientId]);

  /** ===== Ügyféladatok előtöltése a szerkesztő formba ===== */
  useEffect(() => {
    if (client) {
      setEditName(client.name ?? "");
      setEditEmail(client.email ?? "");
      setEditPhone(client.phone ?? "");
      setEditAddress(client.address ?? "");
    }
  }, [client]);

  /** ===== Automatikus form-nyitás ?edit=1 esetén ===== */
  useEffect(() => {
    if (editParam === "1") {
      setEditOpen(true);
    }
  }, [editParam]);

  /** ===== Új klíma mentése ===== */
  async function createUnit() {
    const body = {
      clientId,
      brand,
      model,
      powerKw: powerKw ? Number(powerKw) : undefined,
      serialNumber,
      installation: installation || undefined, // 'YYYY-MM-DD'
      periodMonths: periodMonths ? Number(periodMonths) : 12,
      location,
      notes,
    };

    const res = await fetch("/api/client-units", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      // ürítjük a formot és frissítjük a listát
      setBrand("");
      setModel("");
      setPowerKw("");
      setSerialNumber("");
      setInstallation("");
      setPeriodMonths("12");
      setLocation("");
      setNotes("");
      setFormOpen(false);

      const unitsRes = await fetch(`/api/client-units?clientId=${clientId}`);
      setUnits(await unitsRes.json());
    } else {
      alert("Hiba történt a klíma mentésekor.");
    }
  }

  /** ===== Ügyfél módosítása ===== */
  async function saveClient() {
    const res = await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        email: editEmail,
        phone: editPhone,
        address: editAddress,
      }),
    });

    if (res.ok) {
      const refreshed = await fetch(`/api/clients/${clientId}`);
      setClient(await refreshed.json());
      setEditOpen(false);
      removeEditParam();
    } else {
      alert("Hiba az ügyfél mentésekor.");
    }
  }

  if (loading) {
    return (
      <div style={wrap}>
        <p>Betöltés...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div style={wrap}>
        <p>Nincs ilyen ügyfél.</p>
        <button onClick={() => router.push("/clients")} style={btn}>
          Vissza az ügyfelekhez
        </button>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <button onClick={() => router.push("/clients")} style={{ ...btn, marginBottom: 20 }}>
        ⟵ Vissza az ügyfelekhez
      </button>

      <h1 style={{ marginBottom: 8 }}>{client.name}</h1>
      <div style={{ marginBottom: 20, color: "#555" }}>
        {client.phone && <div>📞 {client.phone}</div>}
        {client.email && <div>✉️ {client.email}</div>}
        {client.address && <div>📍 {client.address}</div>}
      </div>

      {/* ÜGYFÉL ADATOK SZERKESZTÉSE */}
      <button
        onClick={() => {
          if (editOpen) {
            setEditOpen(false);
            removeEditParam();
          } else {
            setEditOpen(true);
          }
        }}
        style={{ ...btnPrimary, marginBottom: 20 }}
      >
        {editOpen ? "Mégse" : "Ügyfél adatok szerkesztése"}
      </button>

      {editOpen && (
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Ügyfél adatainak módosítása</h3>

          <input
            style={input}
            placeholder="Név"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <input
            style={input}
            placeholder="E-mail"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
          />
          <input
            style={input}
            placeholder="Telefon"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
          />
          <input
            style={input}
            placeholder="Cím"
            value={editAddress}
            onChange={(e) => setEditAddress(e.target.value)}
          />

          <button onClick={saveClient} style={{ ...btnSuccess, marginTop: 10 }}>
            Mentés
          </button>
        </div>
      )}

      {/* KLÍMÁK */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16, marginTop: 24 }}>
        <h2 style={{ margin: 0 }}>Klímák</h2>
        <button onClick={() => setFormOpen(!formOpen)} style={btnPrimary}>
          {formOpen ? "Mégse" : "Új klíma"}
        </button>
      </div>

      {formOpen && (
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Új klíma felvétele</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input style={input} placeholder="Márka *" value={brand} onChange={(e) => setBrand(e.target.value)} />
            <input style={input} placeholder="Modell *" value={model} onChange={(e) => setModel(e.target.value)} />
            <input
              style={input}
              placeholder="Teljesítmény (kW)"
              value={powerKw}
              onChange={(e) => setPowerKw(e.target.value)}
              type="number"
              step="0.1"
              min="0"
            />
            <input style={input} placeholder="Gyári szám" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
            <div style={{ display: "flex", gap: 8 }}>
              <label style={{ alignSelf: "center", width: 120 }}>Telepítés:</label>
              <input
                style={{ ...input, width: "100%" }}
                type="date"
                value={installation}
                onChange={(e) => setInstallation(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <label style={{ alignSelf: "center", width: 120 }}>Periódus (hó):</label>
              <input
                style={{ ...input, width: "100%" }}
                type="number"
                min="1"
                value={periodMonths}
                onChange={(e) => setPeriodMonths(e.target.value)}
              />
            </div>
            <input style={input} placeholder="Helyiség / helyszín" value={location} onChange={(e) => setLocation(e.target.value)} />
            <input style={input} placeholder="Megjegyzés" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <button onClick={createUnit} style={{ ...btnSuccess, marginTop: 12 }}>
            Mentés
          </button>
        </div>
      )}

      {units.length === 0 ? (
        <p>Még nincs felvett klíma ennél az ügyfélnél.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {units.map((u) => (
            <div key={u.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {u.brand} {u.model}
                  </div>
                  <div style={{ color: "#555", marginTop: 4 }}>
                    {u.powerKw ? `Teljesítmény: ${u.powerKw} kW` : "Teljesítmény: -"}
                    {u.serialNumber ? ` · Gyári szám: ${u.serialNumber}` : ""}
                    {u.location ? ` · Hely: ${u.location}` : ""}
                  </div>
                  {u.installation && (
                    <div style={{ color: "#777", marginTop: 4 }}>
                      Telepítés: {new Date(u.installation).toISOString().slice(0, 10)}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <a
                    href={`/maintenance?unitId=${u.id}`}
                    style={btn}
                    title="Karbantartás napló"
                  >
                    Karbantartás
                  </a>
                  <a
                    href={`/quotes?clientId=${clientId}`}
                    style={btn}
                    title="Ajánlat indítása"
                  >
                    Ajánlat
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- Stílusok ---- */

const wrap: React.CSSProperties = {
  padding: "40px",
  maxWidth: "900px",
  margin: "0 auto",
  fontFamily: "Arial, sans-serif",
};

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid "#ddd",
  borderRadius: "10px",
  padding: "16px",
};

const input: React.CSSProperties = {
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  width: "100%",
  marginBottom: 8,
};

const btn: React.CSSProperties = {
  padding: "8px 14px",
  background: "#f1f3f5",
  color: "#333",
  border: "1px solid #ddd",
  borderRadius: "8px",
  cursor: "pointer",
  textDecoration: "none",
};

const btnPrimary: React.CSSProperties = {
  ...btn,
  background: "#0d6efd",
  color: "#fff",
  border: "none",
};

const btnSuccess: React.CSSProperties = {
  ...btn,
  background: "#198754",
  color: "#fff",
  border: "none",
};
