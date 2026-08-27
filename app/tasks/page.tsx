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
  scheduled_at?: string;
  completed_at?: string;
  images?: string[];
  created_at: string;
};

// Segédfüggvény a dátumok szép formázásához
const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  try {
    const cleaned = dateString.replace("T", " ").replace("Z", "");
    const [datePart, timePart] = cleaned.split(" ");
    if (!datePart) return dateString;
    
    const formattedDate = datePart.replace(/-/g, ". ");
    const formattedTime = timePart ? timePart.slice(0, 5) : "";
    
    return `${formattedDate}. ${formattedTime}`.trim();
  } catch {
    return dateString;
  }
};

export default function TasksPage() {
  const [type, setType] = useState<"telepites" | "karbantartas">("telepites");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [scheduledAt, setScheduledAt] = useState(""); 
  const [completedAt, setCompletedAt] = useState(""); 
  
  const [photos, setPhotos] = useState<File[]>([]); 
  const [existingImages, setExistingImages] = useState<string[]>([]); 

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);

  // Új állapotok a szűréshez és kereséshez
  const [filterType, setFilterType] = useState<"all" | "telepites" | "karbantartas">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

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
    setScheduledAt("");
    setCompletedAt("");
    setPhotos([]);
    setExistingImages([]);
    setEditingTaskId(null);
  };

  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFile = e.target.files[0];
      setPhotos((prev) => [...prev, newFile]);
      e.target.value = "";
    }
  };

  const handleRemoveNewPhoto = (indexToRemove: number) => {
    setPhotos((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleRemoveExistingImage = (indexToRemove: number) => {
    setExistingImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage("");

    const formData = new FormData();
    formData.append("type", type);
    formData.append("name", name);
    formData.append("address", address);
    formData.append("phone", phone);
    formData.append("email", email);
    formData.append("note", note);
    formData.append("scheduledAt", scheduledAt);
    formData.append("completedAt", completedAt);

    formData.append("existingImages", JSON.stringify(existingImages));

    photos.forEach((photo) => {
      formData.append("photos", photo);
    });

    if (editingTaskId) {
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
    setScheduledAt(task.scheduled_at ? task.scheduled_at.replace(" ", "T").slice(0, 16) : "");
    setCompletedAt(task.completed_at ? task.completed_at.replace(" ", "T").slice(0, 16) : "");
    setPhotos([]);
    setExistingImages(task.images || []);
    setStatusMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Számolások a gombokhoz
  const totalCount = tasks.length;
  const telepitesCount = tasks.filter((t) => t.type === "telepites").length;
  const karbantartasCount = tasks.filter((t) => t.type === "karbantartas").length;

  // Szűrés és keresés logika
  const filteredTasks = tasks.filter((task) => {
    // Típus szerinti szűrés
    if (filterType !== "all" && task.type !== filterType) {
      return false;
    }
    // Keresés minden adatban
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchName = task.name?.toLowerCase().includes(q) || false;
      const matchAddress = task.address?.toLowerCase().includes(q) || false;
      const matchPhone = task.phone?.toLowerCase().includes(q) || false;
      const matchEmail = task.email?.toLowerCase().includes(q) || false;
      const matchNote = task.note?.toLowerCase().includes(q) || false;
      const matchType = task.type.toLowerCase().includes(q) || false;
      
      if (!matchName && !matchAddress && !matchPhone && !matchEmail && !matchNote && !matchType) {
        return false;
      }
    }
    return true;
  });

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

      {/* MEGTEKINTÉSI MODÁLIS ABLAK */}
      {viewingTask && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "16px"
        }}>
          <div style={{
            background: "white", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "500px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", gap: "12px", position: "relative", maxHeight: "90vh", overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "8px" }}>
              <h2 style={{ margin: 0, fontSize: "18px" }}>
                {viewingTask.type === "telepites" ? "🛠️ Telepítés Részletei" : "🧹 Karbantartás Részletei"}
              </h2>
              <button onClick={() => setViewingTask(null)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", fontWeight: "bold" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
              <div><strong>Státusz:</strong> {viewingTask.completed_at ? "✅ Kész" : "⏳ Folyamatban"}</div>
              <div><strong>Név:</strong> {viewingTask.name || "-"}</div>
              
              <div>
                <strong>Cím:</strong>{" "}
                {viewingTask.address ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(viewingTask.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#4285F4", textDecoration: "underline", fontWeight: "bold" }}
                  >
                    📍 {viewingTask.address}
                  </a>
                ) : (
                  "-"
                )}
              </div>

              <div>
                <strong>Telefon:</strong>{" "}
                {viewingTask.phone ? (
                  <a
                    href={`tel:${viewingTask.phone}`}
                    style={{ color: "#28a745", textDecoration: "underline", fontWeight: "bold" }}
                  >
                    📞 {viewingTask.phone}
                  </a>
                ) : (
                  "-"
                )}
              </div>

              {viewingTask.email && <div><strong>Email:</strong> ✉️ {viewingTask.email}</div>}
              {viewingTask.scheduled_at && <div><strong>Tervezett időpont:</strong> 📅 {formatDate(viewingTask.scheduled_at)}</div>}
              {viewingTask.completed_at && <div><strong>Megvalósult időpont:</strong> ✅ {formatDate(viewingTask.completed_at)}</div>}
              <div><strong>Létrehozva:</strong> {formatDate(viewingTask.created_at)}</div>
              {viewingTask.note && <div><strong>Megjegyzés:</strong> {viewingTask.note}</div>}

              <div>
                <strong>Képek:</strong>
                {viewingTask.images && viewingTask.images.length > 0 ? (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                    {viewingTask.images.map((imgUrl, i) => (
                      <a key={i} href={imgUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0070f3", textDecoration: "none", fontWeight: "bold", fontSize: "12px", background: "#f1f1f1", padding: "4px 8px", borderRadius: "4px" }}>
                        📷 {i + 1}. kép megtekintése
                      </a>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: "#aaa", fontSize: "13px", display: "block" }}>Nincs csatolt kép</span>
                )}
              </div>
            </div>

            <button onClick={() => setViewingTask(null)} style={{ marginTop: "12px", background: "#6c757d", color: "white", border: "none", padding: "10px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
              Bezárás
            </button>
          </div>
        </div>
      )}

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
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Tervezett időpont (Opcionális):</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box", background: "white" }} />
          </div>
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Megvalósult időpont (Opcionális):</label>
            <input type="datetime-local" value={completedAt} onChange={(e) => setCompletedAt(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box", background: "white" }} />
          </div>
        </div>

        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Megjegyzés (Opcionális):</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Egyéb részletek a munkáról..." rows={3} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
        </div>

        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "6px" }}>Képek:</label>

          {editingTaskId && existingImages.length > 0 && (
            <div style={{ marginBottom: "10px" }}>
              <small style={{ color: "#666", display: "block", marginBottom: "4px", fontWeight: "bold" }}>Már mentett képek:</small>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {existingImages.map((imgUrl, index) => (
                  <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", padding: "6px 10px", borderRadius: "6px", border: "1px solid #ccc" }}>
                    <a href={imgUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#0070f3", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "250px" }}>
                      📷 {index + 1}. meglévő kép megtekintése
                    </a>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveExistingImage(index)}
                      style={{ background: "#dc3545", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}
                    >
                      Törlés
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {photos.length > 0 && (
            <div style={{ marginBottom: "10px" }}>
              <small style={{ color: "#666", display: "block", marginBottom: "4px", fontWeight: "bold" }}>Újonnan csatolt képek:</small>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {photos.map((photo, index) => (
                  <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", padding: "6px 10px", borderRadius: "6px", border: "1px solid #ccc" }}>
                    <span style={{ fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "250px" }}>
                      📷 {photo.name}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveNewPhoto(index)}
                      style={{ background: "#dc3545", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}
                    >
                      Törlés
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <label style={{ display: "inline-block", background: "#0070f3", color: "white", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>
            ➕ Kép hozzáadása
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleAddPhoto} 
              style={{ display: "none" }} 
            />
          </label>
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

      <h2 style={{ marginTop: "40px", borderBottom: "2px solid #eee", paddingBottom: "10px" }}>Mentett munkák</h2>

      {/* VEZÉRLŐSÁV: SZŰRŐ GOMBOK ÉS KERESŐ */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
        {/* Szűrő gombok a darabszámokkal */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => setFilterType("all")}
            style={{
              padding: "8px 14px",
              borderRadius: "20px",
              border: "none",
              background: filterType === "all" ? "#0070f3" : "#e2e8f0",
              color: filterType === "all" ? "white" : "#333",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "13px"
            }}
          >
            Összes ({totalCount})
          </button>
          <button
            onClick={() => setFilterType("telepites")}
            style={{
              padding: "8px 14px",
              borderRadius: "20px",
              border: "none",
              background: filterType === "telepites" ? "#3b82f6" : "#e2e8f0",
              color: filterType === "telepites" ? "white" : "#333",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "13px"
            }}
          >
            🛠️ Telepítések ({telepitesCount})
          </button>
          <button
            onClick={() => setFilterType("karbantartas")}
            style={{
              padding: "8px 14px",
              borderRadius: "20px",
              border: "none",
              background: filterType === "karbantartas" ? "#a855f7" : "#e2e8f0",
              color: filterType === "karbantartas" ? "white" : "#333",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "13px"
            }}
          >
            🧹 Karbantartások ({karbantartasCount})
          </button>
        </div>

        {/* Keresőmező */}
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Keresés név, cím, telefon, email vagy megjegyzés alapján..."
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
              fontSize: "14px"
            }}
          />
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <p style={{ color: "#666", marginTop: "16px" }}>Nincs a keresési feltételeknek megfelelő munka.</p>
      ) : (
        <div className="cards-grid">
          {filteredTasks.map((task) => {
            const isCompleted = Boolean(task.completed_at);
            const isTelepites = task.type === "telepites";

            let cardBackground = "#fff";
            let borderColor = "#e0e0e0";
            let statusBadgeBg = "#e2e8f0";
            let statusBadgeColor = "#475569";

            if (isCompleted) {
              cardBackground = "#f0fdf4";
              borderColor = "#bbf7d0";
              statusBadgeBg = "#dcfce7";
              statusBadgeColor = "#166534";
            } else {
              if (isTelepites) {
                cardBackground = "#f8fafc";
                borderColor = "#cbd5e1";
              } else {
                cardBackground = "#fdf4ff";
                borderColor = "#f5d0fe";
              }
            }

            return (
              <div
                key={task.id}
                style={{
                  background: cardBackground,
                  border: editingTaskId === task.id ? "2px solid #ffc107" : `1px solid ${borderColor}`,
                  borderLeft: `6px solid ${isCompleted ? "#22c55e" : isTelepites ? "#3b82f6" : "#a855f7"}`,
                  borderRadius: "10px",
                  padding: "16px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: "8px" }}>
                  <span style={{ fontWeight: "bold", fontSize: "15px", color: "#333" }}>
                    {isTelepites ? "🛠️ Telepítés" : "🧹 Karbantartás"}
                  </span>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", background: statusBadgeBg, color: statusBadgeColor, fontWeight: "bold" }}>
                      {isCompleted ? "✅ Kész" : "⏳ Folyamatban"}
                    </span>
                    <span style={{ fontSize: "11px", color: "#888" }}>{formatDate(task.created_at)}</span>
                  </div>
                </div>

                <div style={{ fontSize: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div><strong>Név:</strong> {task.name || "-"}</div>
                  <div><strong>Cím:</strong> {task.address || "-"}</div>
                  {task.phone && <div><strong>Telefon:</strong> 📞 {task.phone}</div>}
                  {task.email && <div><strong>Email:</strong> ✉️ {task.email}</div>}
                  {task.scheduled_at && <div><strong>Tervezett:</strong> 📅 {formatDate(task.scheduled_at)}</div>}
                  {task.completed_at && <div><strong>Megvalósult:</strong> ✅ {formatDate(task.completed_at)}</div>}
                  {task.note && <div><strong>Megjegyzés:</strong> {task.note}</div>}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "10px", borderTop: "1px solid rgba(0,0,0,0.06)", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    {task.images && task.images.length > 0 ? (
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {task.images.map((imgUrl, i) => (
                          <a key={i} href={imgUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0070f3", textDecoration: "none", fontWeight: "bold", fontSize: "11px", background: "rgba(0,0,0,0.05)", padding: "2px 6px", borderRadius: "4px" }}>
                            📷 {i + 1}. kép
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "#aaa", fontSize: "12px" }}>Nincs kép</span>
                    )}
                  </div>
                  {/* Reszponzív gombok mobilon is kiférjenek */}
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    <button onClick={() => setViewingTask(task)} style={{ background: "#17a2b8", color: "white", border: "none", padding: "5px 8px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}>👁️ Megnyitás</button>
                    <button onClick={() => startEditing(task)} style={{ background: "#ffc107", border: "none", padding: "5px 8px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}>✏️ Szerkesztés</button>
                    <button onClick={() => handleDelete(task.id)} style={{ background: "#dc3545", color: "white", border: "none", padding: "5px 8px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}>🗑️ Törlés</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
