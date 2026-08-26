"use client";

import { useEffect, useState } from "react";

type Task = {
  id: number;
  type: string;
  address: string;
  drive_link?: string;
  created_at: string;
};

export default function TasksPage() {
  const [type, setType] = useState<"telepites" | "karbantartas">("telepites");
  const [address, setAddress] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [driveUrl, setDriveUrl] = useState<string | null>(null);
  
  const [tasks, setTasks] = useState<Task[]>([]);

  // Szerkesztési állapotok
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editType, setEditType] = useState<string>("telepites");
  const [editAddress, setEditAddress] = useState<string>("");

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks/list", {
        cache: "no-store",
      });
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error("Hiba a munkák betöltésekor:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const mapsUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : "https://maps.google.com";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage("");
    setDriveUrl(null);

    const formData = new FormData();
    formData.append("type", type);
    formData.append("address", address);
    if (photo) {
      formData.append("photo", photo);
    }

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setStatusMessage("✅ " + data.message);
        if (data.driveLink) {
          setDriveUrl(data.driveLink);
        }
        setAddress("");
        setPhoto(null);
        fetchTasks();
      } else {
        setStatusMessage("❌ " + (data.error || "Hiba történt."));
      }
    } catch {
      setStatusMessage("❌ Hálózati hiba történt.");
    } finally {
      setLoading(false);
    }
  };

  // Törlés funkció
  const handleDelete = async (id: number) => {
    if (!confirm("Biztosan törölni szeretnéd ezt a munkát?")) return;

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchTasks();
      } else {
        alert("Nem sikerült a törlés.");
      }
    } catch (error) {
      console.error(error);
      alert("Hálózati hiba történt a törlés során.");
    }
  };

  // Szerkesztés megkezdése
  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditType(task.type);
    setEditAddress(task.address);
  };

  // Szerkesztés mentése
  const handleSaveEdit = async (id: number) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: editType,
          address: editAddress,
        }),
      });

      if (res.ok) {
        setEditingTaskId(null);
        fetchTasks();
      } else {
        alert("Nem sikerült a mentés.");
      }
    } catch (error) {
      console.error(error);
      alert("Hálózati hiba mentés közben.");
    }
  };

  return (
    <main
      style={{
        maxWidth: "950px",
        margin: "40px auto",
        padding: "24px",
        fontFamily: "system-ui",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h1>Munka Kiadása</h1>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: "#4285F4",
            color: "white",
            padding: "10px 16px",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          📍 Google Maps
        </a>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          background: "#f9f9f9",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #ddd",
        }}
      >
        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>
            Munkatípus választása:
          </label>
          <div style={{ display: "flex", gap: "20px" }}>
            <label style={{ cursor: "pointer" }}>
              <input
                type="radio"
                name="type"
                value="telepites"
                checked={type === "telepites"}
                onChange={() => setType("telepites")}
              />{" "}
              🛠️ Telepítés
            </label>
            <label style={{ cursor: "pointer" }}>
              <input
                type="radio"
                name="type"
                value="karbantartas"
                checked={type === "karbantartas"}
                onChange={() => setType("karbantartas")}
              />{" "}
              🧹 Karbantartás
            </label>
          </div>
        </div>

        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>
            Cím / Helyszín:
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Pl. 1051 Budapest, Kossuth Lajos tér 1."
            required
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>
            Kép csatolása (Google Drive feltöltés):
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            style={{
              width: "100%",
              padding: "8px",
              background: "white",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? "#ccc" : "#28a745",
            color: "white",
            padding: "12px",
            fontSize: "16px",
            fontWeight: "bold",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: "10px",
          }}
        >
          {loading ? "Feldolgozás..." : "Munka Kiadása"}
        </button>
      </form>

      {statusMessage && (
        <div
          style={{
            marginTop: "20px",
            padding: "14px",
            borderRadius: "6px",
            background: statusMessage.startsWith("✅") ? "#d4edda" : "#f8d7da",
            color: statusMessage.startsWith("✅") ? "#155724" : "#721c24",
            border: `1px solid ${
              statusMessage.startsWith("✅") ? "#c3e6cb" : "#f5c6cb"
            }`,
          }}
        >
          {statusMessage}
        </div>
      )}

      {/* --- MENTETT MUNKÁK LISTÁJA SZERKESZTÉSSEL ÉS TÖRLÉSSEL --- */}
      <h2 style={{ marginTop: "40px", borderBottom: "2px solid #eee", paddingBottom: "10px" }}>
        Mentett munkák listája
      </h2>

      {tasks.length === 0 ? (
        <p style={{ color: "#666" }}>Jelenleg nincs mentett munka az adatbázisban.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "16px",
              background: "#fff",
            }}
          >
            <thead>
              <tr style={{ background: "#f1f1f1", textAlign: "left" }}>
                <th style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>ID</th>
                <th style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>Típus</th>
                <th style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>Cím</th>
                <th style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>Kép</th>
                <th style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "12px" }}>{task.id}</td>

                  {/* Típus oszlop */}
                  <td style={{ padding: "12px" }}>
                    {editingTaskId === task.id ? (
                      <select
                        value={editType}
                        onChange={(e) => setEditType(e.target.value)}
                        style={{ padding: "6px", borderRadius: "4px" }}
                      >
                        <option value="telepites">🛠️ Telepítés</option>
                        <option value="karbantartas">🧹 Karbantartás</option>
                      </select>
                    ) : task.type === "telepites" ? (
                      "🛠️ Telepítés"
                    ) : (
                      "🧹 Karbantartás"
                    )}
                  </td>

                  {/* Cím oszlop */}
                  <td style={{ padding: "12px" }}>
                    {editingTaskId === task.id ? (
                      <input
                        type="text"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        style={{ padding: "6px", width: "90%", borderRadius: "4px", border: "1px solid #ccc" }}
                      />
                    ) : (
                      task.address
                    )}
                  </td>

                  {/* Kép oszlop */}
                  <td style={{ padding: "12px" }}>
                    {task.drive_link ? (
                      <a
                        href={task.drive_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#4285F4", textDecoration: "none" }}
                      >
                        📷 Kép
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>

                  {/* Műveletek oszlop */}
                  <td style={{ padding: "12px" }}>
                    {editingTaskId === task.id ? (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleSaveEdit(task.id)}
                          style={{
                            background: "#28a745",
                            color: "white",
                            border: "none",
                            padding: "6px 10px",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Mentés
                        </button>
                        <button
                          onClick={() => setEditingTaskId(null)}
                          style={{
                            background: "#6c757d",
                            color: "white",
                            border: "none",
                            padding: "6px 10px",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Mégse
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => startEditing(task)}
                          style={{
                            background: "#ffc107",
                            color: "#333",
                            border: "none",
                            padding: "6px 10px",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          ✏️ Szerkesztés
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          style={{
                            background: "#dc3545",
                            color: "white",
                            border: "none",
                            padding: "6px 10px",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          🗑️ Törlés
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
