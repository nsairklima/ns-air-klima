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
      if (!unitId) {
        return;
      }

      const res = await fetch(`/api/maintenance/${unitId}`);
      const data = await res.json();

      setLogs(data);
      setLoading(false);
    }

    load();
  }, [unitId]);

  async function saveLog() {
    const body = {
      performedDate,
      description,
      materials,
      costInternal: costInternal ? Number(costInternal) : undefined
    };

    const res = await fetch(`/api/maintenance/${unitId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
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
      alert("Hiba történt a karbantartás mentésekor.");
    }
  }

  if (!unitId) {
    return (
      <div style={wrap}>
        <h2>Nincs unitId megadva.</h2>
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
          <h3>Új karbantartás felvétele</h3>

          <input
            style={input}
            type="date"
            value={performedDate}
            onChange={e => setPerformedDate(e.target.value)}
          />

          <textarea
            style={textarea}
            placeholder="Leírás"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          <textarea
            style={textarea}
            placeholder="Felhasznált anyagok"
            value={materials}
            onChange={e => setMaterials(e.target.value)}
          />

          <input
            style={input}
            type="number"
            placeholder="Belső költség (Ft)"
            value={costInternal}
            onChange={e => setCostInternal(e.target.value)}
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
            logs.map(log => (
              <div key={log.id} style={card}>
                <h3>{log.performedDate.slice(0, 10)}</h3>
                {log.description && <p>{log.description}</p>}
                {log.materials && <p><strong>Anyagok:</strong> {log.materials}</p>}
                {log.costInternal && <p><strong>Költség:</strong> {log.costInternal} Ft</p>}
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
  fontFamily: "Arial, sans-serif"
};

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "12px"
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  margin: "5px 0"
};

const textarea: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  margin: "5px 0",
  minHeight: "80px"
};

const btn: React.CSSProperties = {
  padding: "8px 14px",
  background: "#eee",
  borderRadius: "8px",
  cursor: "pointer",
  textDecoration: "none",
  color: "#333",
  border: "1px solid #ccc"
};

const btnPrimary: React.CSSProperties = {
  ...btn,
  background: "#0d6efd",
  color: "#fff",
  border: "none"
};

const btnSuccess: React.CSSProperties = {
  ...btn,
  background: "#198754",
  color: "#fff",
  border: "none"
};
