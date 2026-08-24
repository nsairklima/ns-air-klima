"use client";

import { useState, useEffect } from "react";

interface Task {
  id: number;
  type?: string;
  title?: string;
  clientName?: string;
  phone?: string;
  address?: string;
  assignedTo?: string;
  date?: string;
  description?: string;
  status?: string;
  images?: string[];
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await fetch("/api/tasks");
      if (!res.ok) {
        throw new Error(`Szerver hiba az adatok lekérésekor: ${res.status}`);
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error("Az API válasz nem tömb formátumú.");
      }

      const formattedData = data.map((task: any) => {
        let parsedImages: string[] = [];
        try {
          if (typeof task.images === "string") {
            parsedImages = JSON.parse(task.images || "[]");
          } else if (Array.isArray(task.images)) {
            parsedImages = task.images;
          }
        } catch (e) {
          parsedImages = [];
        }

        return {
          ...task,
          images: parsedImages,
        };
      });

      setTasks(formattedData);
    } catch (err: any) {
      console.error("Hiba a betöltéskor:", err);
      setErrorMsg(err.message || "Ismeretlen hiba történt.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto", color: "#ffffff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: 0, color: "#ffffff" }}>Munkák / Feladatok</h1>
        <button
          onClick={fetchTasks}
          style={{ padding: "8px 16px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer" }}
        >
          Frissítés
        </button>
      </div>

      {loading && <p style={{ color: "#aaa" }}>Adatok betöltése folyamatban...</p>}

      {errorMsg && (
        <div style={{ padding: "12px", backgroundColor: "#7f1d1d", color: "#fca5a5", borderRadius: "6px", marginBottom: "16px" }}>
          <strong>Hiba történt:</strong> {errorMsg}
        </div>
      )}

      {!loading && !errorMsg && tasks.length === 0 && (
        <p style={{ color: "#aaa" }}>Még nincs egyetlen feladat sem rögzítve az adatbázisban.</p>
      )}

      {!loading && tasks.length > 0 && (
        <div style={{ display: "grid", gap: "16px" }}>
          {tasks.map((task) => (
            <div key={task.id} style={{ border: "1px solid #333", padding: "16px", borderRadius: "8px", backgroundColor: "#1e293b", color: "#ffffff" }}>
              <h2 style={{ fontSize: "18px", margin: "0 0 10px 0", color: "#ffffff" }}>{task.title || "Névtelen feladat"}</h2>
              <p style={{ margin: "4px 0", color: "#cbd5e1" }}>Ügyfél: {task.clientName || "-"} ({task.phone || "-"})</p>
              <p style={{ margin: "4px 0", color: "#cbd5e1" }}>Cím: {task.address || "-"}</p>
              <p style={{ margin: "4px 0", color: "#94a3b8" }}>Dátum: {task.date || "-"}</p>
              {task.description && <p style={{ marginTop: "10px", padding: "8px", backgroundColor: "#0f172a", borderRadius: "4px", color: "#e2e8f0" }}>{task.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
