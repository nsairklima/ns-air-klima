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
  images?: string[]; // Több kép kezelése tömbként
  created_at: string;
};

export default function TasksPage() {
  const [type, setType] = useState<"telepites" | "karbantartas">("telepites");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<File[]>([]); // Több fájl állapota

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

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

  const resetForm = () => {
    setType("telepites");
    setName("");
    setAddress("");
    setPhone("");
    setEmail("");
    setNote("");
    setPhotos([]);
    setEditingTaskId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage("");

    // FormData használata mind létrehozáskor, mind szerkesztéskor a képek miatt
    const formData = new FormData();
    formData.append("type", type);
    formData.append("name", name);
    formData.append("address", address);
    formData.append("phone", phone);
    formData.append("email", email);
    formData.append("note", note);

    photos.forEach((photo) => {
      formData.append("photos", photo);
    });

    if (editingTaskId) {
      // SZERKESZTÉS (PUT)
      try {
        const res = await fetch(`/api/tasks/${editingTaskId}`, {
          method: "PUT",
          body: formData,
        });
        const data = await res.json();

        if (res.ok) {
          setStatusMessage("✅ Munka sikeresen módosítva!");
          resetForm();
          fetchTasks();
        } else {
          setStatusMessage("❌ " + (data.error || "Hiba történt a módosítás során."));
        }
      } catch {
        setStatusMessage("❌ Hálózati hiba történt.");
      } finally {
        setLoading(false);
      }
    } else {
      // ÚJ LÉTREHOZÁS (POST)
      try {
        const res = await fetch("/api/tasks", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (res.ok) {
          setStatusMessage("✅ " + data.message);
          resetForm();
          fetchTasks();
        } else {
          setStatusMessage("❌ " + (data.error || "Hiba történt."));
        }
      } catch {
        setStatusMessage("❌ Hálózati hiba történt.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Biztosan törlöd ezt a munkát?")) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (editingTaskId === id) resetForm();
        fetchTasks();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setType((task.type as "telepites" | "karbantartas") || "telepites");
    setName(task.name || "");
    setAddress(task.address || "");
    setPhone(task.phone || "");

    let taskEmail = task.email || "";
    let taskNote = task.note || "";

    if (!taskEmail && taskNote.includes("| Email:")) {
      const parts = taskNote.split("| Email:");
      taskNote = parts[0].trim();
      taskEmail = parts[1].trim();
    }

    setEmail(taskEmail);
    setNote(taskNote);
    setPhotos([]);
    setStatusMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main style={{ maxWidth: "1050px", margin: "20px auto", padding: "16px", fontFamily: "system-ui" }}>
      <style jsx>{`
        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        .cards-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-top: 16px;
        }
        @media (min-width: 600px) {
          .form-grid {
            grid-template-columns: 1fr 1fr;
          }
          .cards-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <h1>{editingTaskId ? "✏️ Munka Szerkesztése" : "Munka Kiadása"}</h1>
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
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: "16px", 
          background: editingTaskId ? "#fff3cd" : "#f9f9f9", 
          padding: "20px", 
          borderRadius: "12px", 
          border: editingTaskId ? "2px solid #ffc107" : "1px solid #ddd",
          transition: "all 0.3s ease"
        }}
      >
        {editingTaskId && (
          <div style={{ background: "#ffeeba", padding: "8px 12px", borderRadius: "6px", color: "#856404", fontSize: "14px", fontWeight: "bold" }}>
            Szerkesztési módban vagy. A módosítások mentéséhez kattints a "Módosítás Mentése" gombra, vagy kattints a "Mégse"-re.
          </div>
        )}

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
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Képek csatolása (akár több is):</label>
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            onChange={(e) => setPhotos(Array.from(e.target.files || []))} 
            style={{ width: "100%", padding: "8px", background: "white", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} 
          />
          {photos.length > 0 && <small style={{ color: "#666", display: "block", marginTop: "4px" }}>{photos.length} kép kiválasztva.</small>}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button type="submit" disabled={loading} style={{ flex: 1, background: loading ? "#ccc" : editingTaskId ? "#ffc107" : "#28a745", color: editingTaskId ? "#000" : "white", padding: "14px", fontSize: "16px", fontWeight: "bold", border: "none", borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Feldolgozás..." : editingTaskId ? "Módosítás Mentése" : "Munka Kiadása"}
          </button>
          {editingTaskId && (
            <button type="button" onClick={resetForm} style={{ background: "#6c757d", color: "white", padding: "14px 20px", fontSize: "16px", fontWeight: "bold", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              Mégse
            </button>
          )}
        </div>
      </form>

      {statusMessage && (
        <div style={{ marginTop: "20px", padding: "12px", borderRadius: "6px", background: statusMessage.startsWith("✅") ? "#d4edda" : "#f8d7da", color: statusMessage.startsWith("✅") ? "#155724" : "#721c24" }}>
          {statusMessage}
        </div>
      )}

      {/* MENTETT MUNKÁK */}
      <h2 style={{ marginTop: "40px", borderBottom: "2px solid #eee", paddingBottom: "10px" }}>Mentett munkák</h2>

      {tasks.length === 0 ? (
        <p style={{ color: "#666", marginTop: "16px" }}>Nincs mentett munka.</p>
      ) : (
        <div className="cards-grid">
          {tasks.map((task) => (
            <div
              key={task.id}
              style={{
                background: "#fff",
                border: editingTaskId === task.id ? "2px solid #ffc107" : "1px solid #e0e0e0",
                borderRadius: "10px",
                padding: "16px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f0f0", paddingBottom: "8px" }}>
                <span style={{ fontWeight: "bold", fontSize: "15px", color: "#333" }}>
                  {task.type === "telepites" ? "🛠️ Telepítés" : "🧹 Karbantartás"}
                </span>
                <span style={{ fontSize: "12px", color: "#888" }}>{task.created_at}</span>
              </div>

              <div style={{ fontSize: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div><strong>Név:</strong> {task.name || "-"}</div>
                <div><strong>Cím:</strong> {task.address || "-"}</div>
                {task.phone && <div><strong>Telefon:</strong> 📞 {task.phone}</div>}
                {task.email && <div><strong>Email:</strong> ✉️ {task.email}</div>}
                {task.note && <div><strong>Megjegyzés:</strong> {task.note}</div>}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "10px", borderTop: "1px solid #f0f0f0" }}>
                <div>
                  {task.images && task.images.length > 0 ? (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {task.images.map((imgUrl, i) => (
                        <a key={i} href={imgUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0070f3", textDecoration: "none", fontWeight: "bold", fontSize: "12px", background: "#f1f1f1", padding: "2px 6px", borderRadius: "4px" }}>
                          📷 {i + 1}. kép
                        </a>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: "#aaa", fontSize: "13px" }}>Nincs kép</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={() => startEditing(task)} style={{ background: "#ffc107", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>✏️ Szerkesztés</button>
                  <button onClick={() => handleDelete(task.id)} style={{ background: "#dc3545", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>🗑️ Törlés</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
