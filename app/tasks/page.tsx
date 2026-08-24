"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type TaskType = "installation" | "maintenance";
export type TaskStatus = "pending" | "in_progress" | "completed";

export type Task = {
  id: string;
  type: TaskType;
  title: string;
  clientName: string;
  phone: string;
  address: string;
  assignedTo: string;
  date: string;
  description: string;
  status: TaskStatus;
  images: string[];
};

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | TaskType>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | TaskStatus>("all");

  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<Omit<Task, "id" | "status" | "images">>({
    type: "installation",
    title: "",
    clientName: "",
    phone: "",
    address: "",
    assignedTo: "",
    date: new Date().toISOString().split("T")[0],
    description: ""
  });

  const [activeImage, setActiveImage] = useState<string | null>(null);

  // Munkák betöltése az adatbázisból indításkor
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Hiba a munkák betöltésekor:", err);
    } finally {
      setLoading(false);
    }
  };

  const openGoogleMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, "_blank");
  };

  const handleImageUpload = (taskId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, images: [...t.images, base64String] } : t
          )
        );
      };
      reader.readAsDataURL(file);
    });
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    // Adatbázis frissítése
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  };

  // ÚJ MUNKA MENTÉSE AZ ADATBÁZISBA
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTask,
          status: "pending",
          images: []
        }),
      });

      if (res.ok) {
        const createdTask = await res.json();
        setTasks([createdTask, ...tasks]);
        setIsNewTaskModalOpen(false);
        setNewTask({
          type: "installation",
          title: "",
          clientName: "",
          phone: "",
          address: "",
          assignedTo: "",
          date: new Date().toISOString().split("T")[0],
          description: ""
        });
      } else {
        alert("Hiba történt a mentés során.");
      }
    } catch (err) {
      alert("Hálózati hiba a mentéskor.");
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const typeMatch = filterType === "all" || t.type === filterType;
    const statusMatch = filterStatus === "all" || t.status === filterStatus;
    return typeMatch && statusMatch;
  });

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button onClick={() => router.back()} style={secondaryBtn}>⬅️ Vissza</button>
        <button onClick={() => setIsNewTaskModalOpen(true)} style={primaryBtn}>
          ➕ Új munka kiadása
        </button>
      </div>

      <h1 style={{ color: "#fff", fontSize: "1.8rem", fontWeight: 800, marginBottom: 6 }}>
        🛠️ Munka Vezérlő & Karbantartás
      </h1>
      <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: 20 }}>
        Telepítések és karbantartások kiadása a kollégáknak, cím navigációval és fotó csatolással.
      </p>

      {/* SZŰRŐK */}
      <div style={filterBar}>
        <div style={filterGroup}>
          <label style={labelStyle}>Típus:</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} style={selectStyle}>
            <option value="all">Minden típus</option>
            <option value="installation">🔧 Telepítés</option>
            <option value="maintenance">🧹 Karbantartás</option>
          </select>
        </div>
        <div style={filterGroup}>
          <label style={labelStyle}>Státusz:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} style={selectStyle}>
            <option value="all">Minden státusz</option>
            <option value="pending">⏳ Új / Kiadott</option>
            <option value="in_progress">⚡ Folyamatban</option>
            <option value="completed">✅ Elvégezve</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Betöltés...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filteredTasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
              Nincs megjeleníthető munka.
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task.id} style={taskCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <span style={taskTypeBadge(task.type)}>
                      {task.type === "installation" ? "🔧 TELEPÍTÉS" : "🧹 KARBANTARTÁS"}
                    </span>
                    <h2 style={{ fontSize: 18, color: "#fff", margin: "8px 0 4px 0", fontWeight: 700 }}>
                      {task.title}
                    </h2>
                    <div style={{ fontSize: 13, color: "#38bdf8", fontWeight: 600 }}>
                      👤 Kolléga: {task.assignedTo || "Nincs megadva"} | 📅 Dátum: {task.date}
                    </div>
                  </div>

                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                    style={statusSelectStyle(task.status)}
                  >
                    <option value="pending">⏳ Kiadva</option>
                    <option value="in_progress">⚡ Folyamatban</option>
                    <option value="completed">✅ Elvégezve</option>
                  </select>
                </div>

                <hr style={{ border: "none", borderTop: "1px solid #334155", margin: "14px 0" }} />

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12, marginBottom: 12 }}>
                  <div style={infoBox}>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>Megrendelő:</div>
                    <div style={{ fontWeight: "bold", color: "#f8fafc" }}>{task.clientName} ({task.phone})</div>
                  </div>

                  <div style={{ ...infoBox, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>Cím:</div>
                      <div style={{ fontWeight: "bold", color: "#f8fafc", fontSize: 13 }}>{task.address}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openGoogleMaps(task.address)}
                      style={mapsBtnStyle}
                    >
                      🗺️ Navigáció
                    </button>
                  </div>
                </div>

                {task.description && (
                  <div style={{ fontSize: 14, color: "#cbd5e1", background: "#0f172a", padding: 10, borderRadius: 8, marginBottom: 14 }}>
                    <strong>Megjegyzés:</strong> {task.description}
                  </div>
                )}

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: "bold", color: "#94a3b8" }}>
                      📷 Csatolt képek ({task.images ? task.images.length : 0})
                    </span>
                    <label style={uploadBtnStyle}>
                      📸 Fotó hozzáadása
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: "none" }}
                        onChange={(e) => handleImageUpload(task.id, e)}
                      />
                    </label>
                  </div>

                  {task.images && task.images.length > 0 && (
                    <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }}>
                      {task.images.map((imgSrc, idx) => (
                        <img
                          key={idx}
                          src={imgSrc}
                          alt={`Kép ${idx + 1}`}
                          onClick={() => setActiveImage(imgSrc)}
                          style={{
                            width: 70,
                            height: 70,
                            objectFit: "cover",
                            borderRadius: 8,
                            border: "2px solid #3b82f6",
                            cursor: "pointer",
                            flexShrink: 0
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL */}
      {isNewTaskModalOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: "#fff", fontSize: 18 }}>Új munka kiadása</h3>
              <button onClick={() => setIsNewTaskModalOpen(false)} style={closeBtn}>✖</button>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={labelStyle}>Munka típusa</label>
                <select
                  value={newTask.type}
                  onChange={(e) => setNewTask({ ...newTask, type: e.target.value as TaskType })}
                  style={inputStyle}
                >
                  <option value="installation">🔧 Telepítés</option>
                  <option value="maintenance">🧹 Karbantartás</option>
                </select>
              </div>

              <input
                style={inputStyle}
                placeholder="Munka megnevezése (pl. Gree Klíma Telepítés)"
                required
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input
                  style={inputStyle}
                  placeholder="Ügyfél neve *"
                  required
                  value={newTask.clientName}
                  onChange={(e) => setNewTask({ ...newTask, clientName: e.target.value })}
                />
                <input
                  style={inputStyle}
                  placeholder="Telefonszám *"
                  required
                  value={newTask.phone}
                  onChange={(e) => setNewTask({ ...newTask, phone: e.target.value })}
                />
              </div>

              <input
                style={inputStyle}
                placeholder="Pontos Cím (Utca, Házszám, Város) *"
                required
                value={newTask.address}
                onChange={(e) => setNewTask({ ...newTask, address: e.target.value })}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input
                  style={inputStyle}
                  placeholder="Felelős Kolléga"
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                />
                <input
                  type="date"
                  style={inputStyle}
                  value={newTask.date}
                  onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                />
              </div>

              <textarea
                style={{ ...inputStyle, height: 70, resize: "none" }}
                placeholder="Részletek, feladatok, speciális kérések..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />

              <button type="submit" style={{ ...primaryBtn, width: "100%", marginTop: 10, padding: 14 }}>
                Munka Mentése és Kiadása →
              </button>
            </form>
          </div>
        </div>
      )}

      {activeImage && (
        <div style={modalOverlay} onClick={() => setActiveImage(null)}>
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <img src={activeImage} alt="Nagyított kép" style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: 12 }} />
            <button style={{ position: "absolute", top: -15, right: -15, ...closeBtn, background: "#ef4444" }}>✖</button>
          </div>
        </div>
      )}
    </div>
  );
}

// STÍLUSOK
const containerStyle: React.CSSProperties = { minHeight: "100vh", backgroundColor: "#121826", color: "#f8fafc", padding: "20px 14px", maxWidth: 800, margin: "0 auto", fontFamily: "sans-serif" };
const filterBar: React.CSSProperties = { display: "flex", gap: 12, marginBottom: 20, background: "#1e293b", padding: 12, borderRadius: 12, border: "1px solid #334155" };
const filterGroup: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4, flex: 1 };
const labelStyle: React.CSSProperties = { fontSize: 12, color: "#94a3b8", fontWeight: "bold" };
const selectStyle: React.CSSProperties = { background: "#0f172a", color: "#fff", border: "1px solid #334155", padding: "8px 10px", borderRadius: 8, outline: "none" };
const taskCardStyle: React.CSSProperties = { background: "#1e293b", borderRadius: 16, padding: 18, border: "1px solid #334155", boxShadow: "0 4px 12px rgba(0,0,0,0.25)" };
const infoBox: React.CSSProperties = { background: "#0f172a", padding: 10, borderRadius: 8, border: "1px solid #1e293b" };
const mapsBtnStyle: React.CSSProperties = { background: "#0284c7", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 12 };
const uploadBtnStyle: React.CSSProperties = { background: "#334155", color: "#38bdf8", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: "bold", cursor: "pointer" };
const primaryBtn: React.CSSProperties = { background: "#2ecc71", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 10, fontWeight: "bold", cursor: "pointer", fontSize: 14 };
const secondaryBtn: React.CSSProperties = { background: "#1e293b", border: "1px solid #334155", color: "#fff", padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontSize: 14 };
const inputStyle: React.CSSProperties = { width: "100%", padding: 12, borderRadius: 8, border: "1px solid #334155", backgroundColor: "#0f172a", color: "#fff", boxSizing: "border-box", outline: "none" };
const modalOverlay: React.CSSProperties = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: 16 };
const modalContent: React.CSSProperties = { background: "#1e293b", borderRadius: 16, padding: 20, width: "100%", maxWidth: 550, border: "1px solid #334155" };
const closeBtn: React.CSSProperties = { background: "none", border: "none", color: "#94a3b8", fontSize: 18, cursor: "pointer" };

const taskTypeBadge = (type: TaskType): React.CSSProperties => ({
  fontSize: 11,
  fontWeight: "bold",
  padding: "3px 8px",
  borderRadius: 6,
  background: type === "installation" ? "rgba(59, 130, 246, 0.2)" : "rgba(234, 179, 8, 0.2)",
  color: type === "installation" ? "#60a5fa" : "#facc15",
  border: `1px solid ${type === "installation" ? "#3b82f6" : "#eab308"}`
});

const statusSelectStyle = (status: TaskStatus): React.CSSProperties => {
  let bg = "#0f172a";
  let color = "#fff";
  if (status === "pending") { bg = "#451a03"; color = "#f97316"; }
  else if (status === "in_progress") { bg = "#1e3a8a"; color = "#60a5fa"; }
  else if (status === "completed") { bg = "#064e3b"; color = "#34d399"; }
  return { background: bg, color, border: "1px solid #334155", padding: "6px 10px", borderRadius: 8, fontWeight: "bold", cursor: "pointer" };
};
