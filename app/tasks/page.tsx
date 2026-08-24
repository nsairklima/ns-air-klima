"use client";

import { useState, useEffect } from "react";

interface Task {
  id?: number;
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

  // Állapotok a modálokhoz
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Új feladat alapértelmezett adatai
  const emptyTask: Task = {
    title: "",
    clientName: "",
    phone: "",
    address: "",
    date: new Date().toISOString().split("T")[0],
    status: "pending",
    description: "",
    images: [],
  };

  const [newTask, setNewTask] = useState<Task>(emptyTask);

  // Adatok betöltése
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

  // ÚJ feladat mentése (POST kérés)
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });

      if (!res.ok) {
        throw new Error(`Nem sikerült a létrehozás! Kód: ${res.status}`);
      }

      setIsCreating(false);
      setNewTask(emptyTask);
      await fetchTasks();
    } catch (err: any) {
      alert("Hiba a létrehozás során: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // SZERKESZTETT feladat elmentése (POST/PUT kérés)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      setIsSaving(true);
      const res = await fetch("/api/tasks", {
        method: "POST", // POST-ot használunk, hogy elkerüljük a 405-ös tiltást
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTask),
      });

      if (!res.ok) {
        throw new Error(`Nem sikerült a mentés! Kód: ${res.status}`);
      }

      setEditingTask(null);
      await fetchTasks();
    } catch (err: any) {
      alert("Hiba a mentés során: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto", color: "#ffffff" }}>
      {/* Fejléc és gombok */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #334155", paddingBottom: "12px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: 0, color: "#ffffff" }}>Munkák / Feladatok</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => { setNewTask(emptyTask); setIsCreating(true); }}
            style={{ padding: "8px 16px", backgroundColor: "#16a34a", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
          >
            ➕ Új feladat
          </button>
          <button
            onClick={fetchTasks}
            style={{ padding: "8px 16px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 500 }}
          >
            Frissítés
          </button>
        </div>
      </div>

      {loading && <p style={{ color: "#94a3b8" }}>Adatok betöltése folyamatban...</p>}

      {errorMsg && (
        <div style={{ padding: "12px", backgroundColor: "#7f1d1d", color: "#fca5a5", borderRadius: "6px", marginBottom: "16px" }}>
          <strong>Hiba történt:</strong> {errorMsg}
        </div>
      )}

      {!loading && !errorMsg && tasks.length === 0 && (
        <p style={{ color: "#94a3b8" }}>Még nincs egyetlen feladat sem rögzítve az adatbázisban.</p>
      )}

      {/* Feladat kártyák listája */}
      {!loading && tasks.length > 0 && (
        <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {tasks.map((task, index) => (
            <div key={task.id || index} style={{ border: "1px solid #334155", padding: "16px", borderRadius: "8px", backgroundColor: "#1e293b", color: "#ffffff", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <h2 style={{ fontSize: "18px", margin: 0, color: "#ffffff", fontWeight: "bold" }}>{task.title || "Névtelen feladat"}</h2>
                  <span style={{ fontSize: "11px", padding: "2px 8px", backgroundColor: "#334155", borderRadius: "12px", color: "#cbd5e1", textTransform: "uppercase" }}>
                    {task.status || "pending"}
                  </span>
                </div>
                <p style={{ margin: "4px 0", color: "#cbd5e1", fontSize: "14px" }}>👤 Ügyfél: {task.clientName || "-"}</p>
                <p style={{ margin: "4px 0", color: "#cbd5e1", fontSize: "14px" }}>📞 Telefon: {task.phone || "-"}</p>
                <p style={{ margin: "4px 0", color: "#cbd5e1", fontSize: "14px" }}>📍 Cím: {task.address || "-"}</p>
                <p style={{ margin: "4px 0", color: "#94a3b8", fontSize: "14px" }}>📅 Dátum: {task.date || "-"}</p>
                {task.description && (
                  <p style={{ marginTop: "10px", padding: "8px", backgroundColor: "#0f172a", borderRadius: "4px", color: "#e2e8f0", fontSize: "13px" }}>
                    {task.description}
                  </p>
                )}
              </div>

              {/* Szerkesztés gomb */}
              <button
                onClick={() => setEditingTask({ ...task })}
                style={{ marginTop: "16px", width: "100%", padding: "8px", backgroundColor: "#3b82f6", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 500 }}
              >
                ✏️ Szerkesztés
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 1. ÚJ FELADAT MODÁL */}
      {isCreating && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#1e293b", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "500px", border: "1px solid #475569" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px", color: "#ffffff" }}>Új feladat hozzáadása</h2>

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Megnevezés / Cím</label>
                <input
                  type="text"
                  value={newTask.title || ""}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  style={{ width: "100%", padding: "8px", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#ffffff" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Ügyfél neve</label>
                  <input
                    type="text"
                    value={newTask.clientName || ""}
                    onChange={(e) => setNewTask({ ...newTask, clientName: e.target.value })}
                    style={{ width: "100%", padding: "8px", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#ffffff" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Telefonszám</label>
                  <input
                    type="text"
                    value={newTask.phone || ""}
                    onChange={(e) => setNewTask({ ...newTask, phone: e.target.value })}
                    style={{ width: "100%", padding: "8px", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#ffffff" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Cím</label>
                <input
                  type="text"
                  value={newTask.address || ""}
                  onChange={(e) => setNewTask({ ...newTask, address: e.target.value })}
                  style={{ width: "100%", padding: "8px", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#ffffff" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Dátum</label>
                  <input
                    type="date"
                    value={newTask.date || ""}
                    onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                    style={{ width: "100%", padding: "8px", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#ffffff" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Státusz</label>
                  <select
                    value={newTask.status || "pending"}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                    style={{ width: "100%", padding: "8px", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#ffffff" }}
                  >
                    <option value="pending">Függőben (Pending)</option>
                    <option value="in-progress">Folyamatban</option>
                    <option value="completed">Kész / Befejezett</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Megjegyzés / Leírás</label>
                <textarea
                  rows={3}
                  value={newTask.description || ""}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  style={{ width: "100%", padding: "8px", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#ffffff" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  style={{ padding: "8px 16px", backgroundColor: "#475569", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer" }}
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{ padding: "8px 16px", backgroundColor: "#16a34a", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                >
                  {isSaving ? "Létrehozás..." : "Létrehozás"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. SZERKESZTŐ MODÁL */}
      {editingTask && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#1e293b", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "500px", border: "1px solid #475569" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px", color: "#ffffff" }}>Feladat szerkesztése</h2>

            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Megnevezés / Cím</label>
                <input
                  type="text"
                  value={editingTask.title || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  style={{ width: "100%", padding: "8px", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#ffffff" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Ügyfél neve</label>
                  <input
                    type="text"
                    value={editingTask.clientName || ""}
                    onChange={(e) => setEditingTask({ ...editingTask, clientName: e.target.value })}
                    style={{ width: "100%", padding: "8px", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#ffffff" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Telefonszám</label>
                  <input
                    type="text"
                    value={editingTask.phone || ""}
                    onChange={(e) => setEditingTask({ ...editingTask, phone: e.target.value })}
                    style={{ width: "100%", padding: "8px", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#ffffff" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Cím</label>
                <input
                  type="text"
                  value={editingTask.address || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, address: e.target.value })}
                  style={{ width: "100%", padding: "8px", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#ffffff" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Dátum</label>
                  <input
                    type="date"
                    value={editingTask.date || ""}
                    onChange={(e) => setEditingTask({ ...editingTask, date: e.target.value })}
                    style={{ width: "100%", padding: "8px", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#ffffff" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Státusz</label>
                  <select
                    value={editingTask.status || "pending"}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                    style={{ width: "100%", padding: "8px", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#ffffff" }}
                  >
                    <option value="pending">Függőben (Pending)</option>
                    <option value="in-progress">Folyamatban</option>
                    <option value="completed">Kész / Befejezett</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Megjegyzés / Leírás</label>
                <textarea
                  rows={3}
                  value={editingTask.description || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  style={{ width: "100%", padding: "8px", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#ffffff" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  style={{ padding: "8px 16px", backgroundColor: "#475569", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer" }}
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{ padding: "8px 16px", backgroundColor: "#16a34a", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                >
                  {isSaving ? "Mentés..." : "Mentés"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
