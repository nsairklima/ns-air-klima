"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Log = {
  id: number;
  performedDate: string;
  description?: string;
  materials?: string;
  costInternal?: number;
};

export default function MaintenancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unitId = Number(searchParams.get("unitId"));

  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const [performedDate, setPerformedDate] = useState("");
  const [description, setDescription] = useState("");
  const [materials, setMaterials] = useState("");
  const [costInternal, setCostInternal] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/maintenance/${unitId}`);
      const data = await res.json();
      setLogs(data);
      setLoading(false);
    }
    if (unitId) load();
  }, [unitId]);

  async function saveLog() {
    const res = await fetch(`/api/maintenance/${unitId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        performedDate,
        description,
        materials,
        costInternal: costInternal ? Number(costInternal) : null,
      }),
    });

    if (res.ok) {
      setFormOpen(false);
      setPerformedDate("");
      setDescription("");
      setMaterials("");
      setCostInternal("");

      const refreshed = await fetch(`/api/maintenance/${unitId}`);
      setLogs(await refreshed.json());
    } else {
      alert("Hiba történt a mentéskor.");
    }
  }

  if (!unitId) {
    return (
      <div style={wrap}>
        <h2>Nincs unitId definiálva.</h2>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <button onClick={() => router.back()} style={btn}>
        ⟵ Vissza
      </button>

      <h1>Karbantartási napló</h1>

      <button onClick={() => setFormOpen(!formOpen)} style={btnPrimary}>
        {formOpen ? "Mégse" : "Új karbantartás"}
      </button>

      {formOpen && (
        <div style={card}>
          <h3>Új karbantartás</h3>

          <input
            type="date"
            style={input}
            value={performedDate}
            onChange={(e) => setPerformedDate(e.target.value)}
          />

          <textarea
            style={textarea}
            value={description}
            placeholder="Leírás"
            onChange={(e) => setDescription(e.target.value)}
          />

          <textarea
            style={textarea}
            value={materials}
            placeholder="Felhasznált anyagok"
            onChange={(e) => setMaterials(e.target.value)}
          />

          <input
            type="number"
            style={input}
            value={costInternal}
            placeholder="Belső költség (Ft)"
            onChange={(e) => setCostInternal(e.target.value)}
          />

          <button onClick={saveLog} style={btnSuccess}>
            Mentés
          </button>
        </div>
      )}

      {loading ? (
        <p>Betöltés…</p>
      ) : (
        <div style={{ marginTop: 20 }}>
          {logs.length === 0 ? (
            <p>Még nincs karbantartás felvéve ehhez a klímához.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} style={card}>
                <h3>{log.performedDate.slice(0, 10)}</h3>
                {log.description && <p>{log.description}</p>}
                {log.materials && (
                  <p>
                    <strong>Anyagok:</strong> {log.materials}
                  </p>
                )}
                {log.costInternal && (
                  <p>
                    <strong>Költség:</strong> {log.costInternal} Ft
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const wrap: React.CSSProperties = {
  padding: "40px",
  maxWidth: "900px",
  margin: "0 auto",
  fontFamily: "Arial, sans-serif",
};

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "12px",
};

const btn = {
  padding: "8px 14px",
  background: "#eee",
  borderRadius: "6px",
  cursor: "pointer",
};

const btnPrimary = {
  ...btn,
  background: "#0d6efd",
  color: "#fff",
  border: "none",
};

const btnSuccess = {
  ...btn,
  background: "#198754",
  color: "#fff",
  border: "none",
};

const input = {
  width: "100%",
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  marginBottom: "10px",
};

const textarea = {
  width: "100%",
  minHeight: "80px",
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  marginBottom: "10px",
};
    ez a jelenlegi
