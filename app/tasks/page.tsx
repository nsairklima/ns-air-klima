"use client";

import { useEffect, useState } from "react";

type Task = {
  id: number;
  type: string;
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  note?: string;
  drive_link?: string;
  created_at: string;
};

export default function TasksPage() {
  const [type, setType] = useState<"telepites" | "karbantartas">("telepites");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [driveUrl, setDriveUrl] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Szerkesztési állapotok
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Task>>({});

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks/list", { cache: "no-store" });
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error("Hiba a betöltéskor:", error);
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
    formData.append("name", name);
    formData.append("address", address);
    formData.append("phone", phone);
    formData.append("email", email);
    formData.append("note", note);
    if (photo) formData.append("photo", photo);

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
        setName("");
        setAddress("");
        setPhone("");
        setEmail("");
        setNote("");
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

  const handleDelete = async (id: number) => {
    if (!confirm("Biztosan törlöd ezt a munkát?")) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) fetchTasks();
    } catch (error) {
      console.error(error);
    }
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditData(task);
  };

  const handleSaveEdit = async (id: number) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      if (res.ok) {
        setEditingTaskId(null);
        fetchTasks();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <main style={{ maxWidth: "1050px", margin: "20px auto", padding: "16px", fontFamily: "system-ui" }}>
      <style jsx>{`
        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 600px) {
          .form-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <h1>Munka Kiadása</h1>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ background: "#4285F4", color: "white", padding: "10px 16px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}
        >
          📍 Google Maps
        </a>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "16px", background: "#f9f9f9", padding: "20px", borderRadius: "12px", border: "1px solid #ddd" }}
      >
        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>Munkatípus:</label>
          <div style={{ display: "flex", gap: "20px" }}>
            <label style={{ cursor: "pointer" }}>
              <input type="radio" name="type" value="telepites" checked={type === "telepites"} onChange={() => setType("telepites")} /> 🛠️ Telepítés
            </label>
            <label style={{ cursor: "pointer" }}>
              <input type="radio" name="type" value="karbantartas" checked={type === "karbantartas"} onChange={() => setType("karbantartas")} /> 🧹 Karbantartás
            </label>
          </div>
        </div>

        <div className="form-grid">
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Név (Opcionális):</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ügyfél neve" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Cím / Helyszín (Opcionális):</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Pl. 1051 Budapest, Kossuth L. tér 1." style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Telefonszám (Opcionális):</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+36 30 123 4567" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Email cím (Opcionális):</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ugyfel@email.com" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
          </div>
        </div>

        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Megjegyzés (Opcionális):</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Egyéb részletek a munkáról..." rows={3} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
        </div>

        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Kép csatolása:</label>
          <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} style={{ width: "100%", padding: "8px", background: "white", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
        </div>

        <button type="submit" disabled={loading} style={{ background: loading ? "#ccc" : "#28a745", color: "white", padding: "14px", fontSize: "16px", fontWeight: "bold", border: "none", borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Feldolgozás..." : "Munka Kiadása"}
        </button>
      </form>

      {statusMessage && (
        <div style={{ marginTop: "20px", padding: "12px", borderRadius: "6px", background: statusMessage.startsWith("✅") ? "#d4edda" : "#f8d7da", color: statusMessage.startsWith("✅") ? "#155724" : "#721c24" }}>
          {statusMessage}
        </div>
      )}

      {driveUrl && (
        <p style={{ marginTop: "12px" }}>
          <strong>Feltöltött kép:</strong>{" "}
          <a href={driveUrl} target="_blank" rel="noopener noreferrer">
            Megtekintés Google Drive-on
          </a>
        </p>
      )}

      {/* MENTETT MUNKÁK */}
      <h2 style={{ marginTop: "40px", borderBottom: "2px solid #eee", paddingBottom: "10px" }}>Mentett munkák</h2>

      {tasks.length === 0 ? (
        <p style={{ color: "#666" }}>Nincs mentett munka.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "16px", background: "#fff", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#f1f1f1", textAlign: "left" }}>
                <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Típus</th>
                <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Név</th>
                <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Cím</th>
                <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Elérhetőség</th>
                <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Megjegyzés</th>
                <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Kép</th>
                <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} style={{ borderBottom: "1px solid #eee" }}>
                  {editingTaskId === task.id ? (
                    <>
                      <td style={{ padding: "8px" }}>
                        <select value={editData.type} onChange={(e) => setEditData({ ...editData, type: e.target.value })}>
                          <option value="telepites">🛠️ Telepítés</option>
                          <option value="karbantartas">🧹 Karbantartás</option>
                        </select>
                      </td>
                      <td style={{ padding: "8px" }}><input type="text" value={editData.name || ""} onChange={(e) => setEditData({ ...editData, name: e.target.value })} style={{ width: "100%" }} /></td>
                      <td style={{ padding: "8px" }}><input type="text" value={editData.address || ""} onChange={(e) => setEditData({ ...editData, address: e.target.value })} style={{ width: "100%" }} /></td>
                      <td style={{ padding: "8px" }}>
                        <input type="text" placeholder="Tel" value={editData.phone || ""} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} style={{ width: "100%", marginBottom: "4px" }} />
                        <input type="text" placeholder="Email" value={editData.email || ""} onChange={(e) => setEditData({ ...editData, email: e.target.value })} style={{ width: "100%" }} />
                      </td>
                      <td style={{ padding: "8px" }}><input type="text" value={editData.note || ""} onChange={(e) => setEditData({ ...editData, note: e.target.value })} style={{ width: "100%" }} /></td>
                      <td style={{ padding: "8px" }}>-</td>
                      <td style={{ padding: "8px" }}>
                        <button onClick={() => handleSaveEdit(task.id)} style={{ background: "#28a745", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", marginRight: "4px" }}>Mentés</button>
                        <button onClick={() => setEditingTaskId(null)} style={{ background: "#6c757d", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px" }}>Mégse</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: "10px" }}>{task.type === "telepites" ? "🛠️ Telepítés" : "🧹 Karbantartás"}</td>
                      <td style={{ padding: "10px" }}>{task.name || "-"}</td>
                      <td style={{ padding: "10px" }}>{task.address || "-"}</td>
                      <td style={{ padding: "10px" }}>
                        {task.phone && <div>📞 {task.phone}</div>}
                        {task.email && <div>✉️ {task.email}</div>}
                        {!task.phone && !task.email && "-"}
                      </td>
                      <td style={{ padding: "10px" }}>{task.note || "-"}</td>
                      <td style={{ padding: "10px" }}>
                        {task.drive_link ? (
                          <a href={task.drive_link} target="_blank" rel="noopener noreferrer">📷 Kép</a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td style={{ padding: "10px" }}>
                        <button onClick={() => startEditing(task)} style={{ background: "#ffc107", border: "none", padding: "4px 8px", borderRadius: "4px", marginRight: "4px", cursor: "pointer" }}>✏️</button>
                        <button onClick={() => handleDelete(task.id)} style={{ background: "#dc3545", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}>🗑️</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
