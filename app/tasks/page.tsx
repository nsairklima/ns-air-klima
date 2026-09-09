"use client";

import { useState, useEffect } from "react";

// 1. Típusdefiníció a feladatokhoz
interface Task {
  id: string | number;
  type: "telepites" | "karbantartas";
  name: string;
  address: string;
  phone: string;
  email: string;
  scheduled_at: string;
  completed_at: string | null;
  created_at: string;
  note: string;
  images: string[];
}

// 2. Egyedi Dátum és Idő Választó Komponens
function CustomDateTimePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={{ fontWeight: "bold" }}>{label}</label>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

// 3. Dátumformázó segédfüggvények
function formatDateSimple(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDateWithDay(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const days = ["Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat"];
  const dayName = days[d.getDay()];
  const formattedDate = d.toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const formattedTime = d.toLocaleTimeString("hu-HU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${formattedDate} (${dayName}) ${formattedTime}`;
}

export default function TasksPage() {
  // --- ÁLLAPOTOK (STATES) DECLARÁCIÓJA ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Űrlap állapotai
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingTaskId, setEditingTaskId] = useState<string | number | null>(null);
  const [type, setType] = useState<"telepites" | "karbantartas">("telepites");
  const [name, setName] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [completedAt, setCompletedAt] = useState<string>("");
  const [note, setNote] = useState<string>("");

  // Email értesítő állapotok
  const [envEmails, setEnvEmails] = useState<string[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [customEmailInput, setCustomEmailInput] = useState<string>("");

  // Képkezelő állapotok
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);

  // Keresés és szűrés állapotai
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Modális ablak állapota
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  // --- ADATBETÖLTÉS (EFFECTS) ---
  useEffect(() => {
    fetchTasks();
    fetchEmailOptions();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks/list");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Hiba a feladatok betöltésekor:", err);
    }
  };

  const fetchEmailOptions = async () => {
    try {
      const res = await fetch("/api/settings/emails");
      if (res.ok) {
        const data = await res.json();
        setEnvEmails(data.emails || []);
      }
    } catch (err) {
      console.error("Hiba az email címek betöltésekor:", err);
    }
  };

  // --- MŰVELETEK ÉS ESEMÉNYKEZELŐK ---
  const resetForm = () => {
    setEditingTaskId(null);
    setType("telepites");
    setName("");
    setAddress("");
    setPhone("");
    setEmail("");
    setScheduledAt("");
    setCompletedAt("");
    setNote("");
    setSelectedRecipients([]);
    setExistingImages([]);
    setPhotos([]);
    setIsFormOpen(false);
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setType(task.type);
    setName(task.name || "");
    setAddress(task.address || "");
    setPhone(task.phone || "");
    setEmail(task.email || "");
    setScheduledAt(task.scheduled_at || "");
    setCompletedAt(task.completed_at || "");
    setNote(task.note || "");
    setExistingImages(task.images || []);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage("");

    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("name", name);
      formData.append("address", address);
      formData.append("phone", phone);
      formData.append("email", email);
      formData.append("scheduled_at", scheduledAt);
      formData.append("completed_at", completedAt);
      formData.append("note", note);
      formData.append("recipients", JSON.stringify(selectedRecipients));
      formData.append("existingImages", JSON.stringify(existingImages));

      photos.forEach((photo) => {
        formData.append("photos", photo);
      });

      const url = editingTaskId ? `/api/tasks/${editingTaskId}` : "/api/tasks";
      const method = editingTaskId ? "PUT" : "POST";

      const res = await fetch(url, { method, body: formData });

      if (res.ok) {
        setStatusMessage(
          editingTaskId ? "✅ Feladat sikeresen módosítva!" : "✅ Új munka sikeresen rögzítve!"
        );
        resetForm();
        fetchTasks();
      } else {
        setStatusMessage("❌ Hiba történt a mentés során.");
      }
    } catch (err) {
      console.error("Mentési hiba:", err);
      setStatusMessage("❌ Hálózati hiba történt.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm("Biztosan törölni szeretnéd ezt a munkát?")) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) {
        setStatusMessage("✅ Munkadarab sikeresen törölve!");
        fetchTasks();
      }
    } catch (err) {
      console.error("Törlési hiba:", err);
    }
  };

  const handleRecipientToggle = (emailAddr: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(emailAddr) ? prev.filter((e) => e !== emailAddr) : [...prev, emailAddr]
    );
  };

  const handleAddCustomEmail = () => {
    if (customEmailInput && !envEmails.includes(customEmailInput)) {
      setEnvEmails((prev) => [...prev, customEmailInput]);
      setSelectedRecipients((prev) => [...prev, customEmailInput]);
      setCustomEmailInput("");
    }
  };

  const handleRemoveEmailOption = (emailAddr: string) => {
    setEnvEmails((prev) => prev.filter((e) => e !== emailAddr));
    setSelectedRecipients((prev) => prev.filter((e) => e !== emailAddr));
  };

  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotos((prev) => [...prev, e.target.files![0]]);
    }
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewPhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Keresés és szűrés logikája
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      (task.name && task.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.address && task.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.phone && task.phone.includes(searchQuery)) ||
      (task.note && task.note.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === "all" || task.type === filterType;

    const isDone = !!task.completed_at;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "kesz" && isDone) ||
      (filterStatus === "folyamatban" && !isDone);

    return matchesSearch && matchesType && matchesStatus;
  };

  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
      {/* RÉSZLETEK MODÁLIS ABLAK */}
      {viewingTask && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ background: "white", padding: "20px", borderRadius: "12px", maxWidth: "500px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
            <h3 style={{ marginTop: 0, marginBottom: "16px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
              📋 Munkalap Részletei (#{viewingTask.id})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
              <div><strong>Státusz:</strong> {viewingTask.completed_at ? "✅ Kész" : "⏳ Folyamatban"}</div>
              <div><strong>Név:</strong> {viewingTask.name || "-"}</div>
              <div>
                <strong>Cím:</strong>{" "}
                {viewingTask.address ? (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(viewingTask.address)}`} target="_blank" rel="noopener noreferrer" style={{ color: "#1a0dab", textDecoration: "underline", fontWeight: "bold" }}>
                    📍 {viewingTask.address}
                  </a>
                ) : "-"}
              </div>
              <div>
                <strong>Telefon:</strong>{" "}
                {viewingTask.phone ? (
                  <a href={`tel:${viewingTask.phone}`} style={{ color: "#27ae60", textDecoration: "underline", fontWeight: "bold" }}>
                    📞 {viewingTask.phone}
                  </a>
                ) : "-"}
              </div>
              {viewingTask.email && <div><strong>Email:</strong> ✉️ {viewingTask.email}</div>}
              {viewingTask.scheduled_at && <div><strong>Tervezett időpont:</strong> 📅 {formatDateWithDay(viewingTask.scheduled_at)}</div>}
              {viewingTask.completed_at && <div><strong>Megvalósult időpont:</strong> ✅ {formatDateWithDay(viewingTask.completed_at)}</div>}
              <div><strong>Létrehozva:</strong> {formatDateSimple(viewingTask.created_at)}</div>
              {viewingTask.note && <div><strong>Megjegyzés:</strong> {viewingTask.note}</div>}

              <div>
                <strong>Képek:</strong>
                {viewingTask.images && viewingTask.images.length > 0 ? (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                    {viewingTask.images.map((imgUrl, i) => (
                      <a key={i} href={imgUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0070f3", textDecoration: "none", fontWeight: "bold", fontSize: "12px", background: "#f1f1f1", padding: "4px 8px", borderRadius: "4px" }}>
                        🖼️ {i + 1}. kép megtekintése
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

      {statusMessage && (
        <div style={{ marginBottom: "16px", padding: "12px", background: "#f0fff4", color: "#27ae60", border: "1px solid #27ae60", borderRadius: "8px", fontWeight: "bold" }}>
          {statusMessage}
        </div>
      )}

      {/* ÚJ MUNKA GOMB / FORM */}
      <div style={{ marginBottom: "20px" }}>
        {!isFormOpen && !editingTaskId ? (
          <button
            onClick={() => setIsFormOpen(true)}
            style={{
              width: "100%",
              padding: "14px",
              background: "#27ae60",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <span>➕ Új munka rögzítése</span>
          </button>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: "16px", 
              background: editingTaskId ? "#fff5e6" : "#fdfdfd", 
              padding: "20px", 
              borderRadius: "12px", 
              border: editingTaskId ? "2px solid #d35400" : "1px solid #ddd", 
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: editingTaskId ? "#d35400" : "#333" }}>
                {editingTaskId ? "✏️ Munka szerkesztése" : "🛠️ Új munka rögzítése"}
              </h3>
              <button type="button" onClick={resetForm} style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", fontWeight: "bold", color: "#666" }}>
                ✕ Bezárás
              </button>
            </div>

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
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Név:</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ügyfél neve" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Cím / Helyszín:</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Pl. Budapest, Fő u. 1." style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Telefonszám:</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+36 30 123 4567" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Email cím:</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ugyfel@email.com" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} />
              </div>
              
              {/* Tervezett időpont - Egyedi naptár */}
              <CustomDateTimePicker
                label="Tervezett időpont:"
                value={scheduledAt}
                onChange={setScheduledAt}
              />

              {/* Megvalósult időpont - Egyedi naptár */}
              <CustomDateTimePicker
                label="Megvalósult időpont:"
                value={completedAt}
                onChange={setCompletedAt}
              />
            </div>

            <div>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Megjegyzés:</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Egyéb részletek..." rows={3} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} />
            </div>

            {/* Email értesítők */}
            <div style={{ background: "white", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>Értesítés küldése ezekre a címekre:</label>
              {envEmails.map((emailAddr, index) => (
                <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f9f9f9", padding: "6px 10px", borderRadius: "6px", marginBottom: "6px", border: "1px solid #eee" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", flex: 1 }}>
                    <input type="checkbox" checked={selectedRecipients.includes(emailAddr)} onChange={() => handleRecipientToggle(emailAddr)} />
                    <span>{emailAddr}</span>
                  </label>
                  <button type="button" onClick={() => handleRemoveEmailOption(emailAddr)} style={{ background: "#e74c3c", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>Törlés</button>
                </div>
              ))}
              <div className="email-input-row" style={{ marginTop: "8px" }}>
                <input type="email" value={customEmailInput} onChange={(e) => setCustomEmailInput(e.target.value)} placeholder="Új email cím..." style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }} />
                <button type="button" onClick={handleAddCustomEmail} style={{ background: "#34495e", color: "white", border: "none", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Hozzáadás</button>
              </div>
            </div>

            {/* Képek kezelése */}
            <div>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "6px" }}>Képek:</label>
              {existingImages.map((imgUrl, index) => (
                <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "6px", borderRadius: "6px", marginBottom: "4px", border: "1px solid #ccc" }}>
                  <span style={{ fontSize: "13px" }}>📷 Mentett kép #{index + 1}</span>
                  <button type="button" onClick={() => handleRemoveExistingImage(index)} style={{ background: "#e74c3c", color: "white", border: "none", padding: "2px 6px", borderRadius: "4px", fontSize: "11px" }}>Törlés</button>
                </div>
              ))}
              {photos.map((photo, index) => (
                <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "6px", borderRadius: "6px", marginBottom: "4px", border: "1px solid #ccc" }}>
                  <span style={{ fontSize: "13px" }}>📷 {photo.name}</span>
                  <button type="button" onClick={() => handleRemoveNewPhoto(index)} style={{ background: "#e74c3c", color: "white", border: "none", padding: "2px 6px", borderRadius: "4px", fontSize: "11px" }}>Törlés</button>
                </div>
              ))}
              <label style={{ display: "inline-block", background: "#34495e", color: "white", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px", marginTop: "4px" }}>
                ➕ Kép hozzáadása
                <input type="file" accept="image/*" onChange={handleAddPhoto} style={{ display: "none" }} />
              </label>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" disabled={loading} style={{ flex: 1, background: loading ? "#ccc" : "#27ae60", color: "white", padding: "12px", fontSize: "15px", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer" }}>
                {loading ? "Mentés..." : editingTaskId ? "Módosítás Mentése" : "Munka Kiadása"}
              </button>
              <button type="button" onClick={resetForm} style={{ background: "#95a5a6", color: "white", padding: "12px 16px", fontSize: "15px", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer" }}>
                Mégsem
              </button>
            </div>
          </form>
        )}
      </div>

      {/* SZŰRŐ ÉS KERESŐ */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="🔍 Keresés név, cím, telefon vagy megjegyzés alapján..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ccc", boxSizing: "border-box", fontSize: "14px" }}
        />

        <div className="filter-buttons">
          <button onClick={() => setFilterType("all")} style={{ flex: 1, padding: "10px", background: filterType === "all" ? "#34495e" : "#f1f1f1", color: filterType === "all" ? "white" : "#333", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Összes ({tasks.length})</button>
          <button onClick={() => setFilterType("telepites")} style={{ flex: 1, padding: "10px", background: filterType === "telepites" ? "#34495e" : "#f1f1f1", color: filterType === "telepites" ? "white" : "#333", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Telepítés</button>
          <button onClick={() => setFilterType("karbantartas")} style={{ flex: 1, padding: "10px", background: filterType === "karbantartas" ? "#34495e" : "#f1f1f1", color: filterType === "karbantartas" ? "white" : "#333", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Karbantartás</button>
        </div>

        <div className="filter-buttons">
          <button onClick={() => setFilterStatus("all")} style={{ flex: 1, padding: "10px", background: filterStatus === "all" ? "#7f8c8d" : "#ecf0f1", color: filterStatus === "all" ? "white" : "#333", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Minden státusz</button>
          <button onClick={() => setFilterStatus("folyamatban")} style={{ flex: 1, padding: "10px", background: filterStatus === "folyamatban" ? "#e67e22" : "#ecf0f1", color: filterStatus === "folyamatban" ? "white" : "#333", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>⏳ Folyamatban</button>
          <button onClick={() => setFilterStatus("kesz")} style={{ flex: 1, padding: "10px", background: filterStatus === "kesz" ? "#27ae60" : "#ecf0f1", color: filterStatus === "kesz" ? "white" : "#333", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>✅ Kész</button>
        </div>
      </div>

      {/* LISTA KÁRTYÁK */}
      <div className="cards-grid">
        {filteredTasks.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#666", background: "#f9f9f9", borderRadius: "10px" }}>
            Nincs találat a megadott feltételek alapján.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isTelepites = task.type === "telepites";
            const borderColor = isTelepites ? "#34495e" : "#d35400";

            return (
              <div
                key={task.id}
                style={{
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderLeft: `6px solid ${borderColor}`,
                  borderRadius: "10px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "bold", fontSize: "15px" }}>
                    {isTelepites ? "🛠️ Telepítés" : "🧹 Karbantartás"}
                  </span>
                  <span style={{ fontSize: "12px", color: task.completed_at ? "#27ae60" : "#e67e22", fontWeight: "bold" }}>
                    {task.completed_at ? "✅ Kész" : "⏳ Folyamatban"}
                  </span>
                </div>

                <div><strong>Név:</strong> {task.name || "-"}</div>
                <div><strong>Cím:</strong> {task.address || "-"}</div>
                <div style={{ textTransform: "capitalize" }}>
                  <strong>Tervezett időpont:</strong> {formatDateWithDay(task.scheduled_at)}</div>

                <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                  <button onClick={() => setViewingTask(task)} style={{ padding: "6px 12px", background: "#2980b9", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>🔍 Részletek</button>
                  <button onClick={() => startEditing(task)} style={{ padding: "6px 12px", background: "#f39c12", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>✏️ Szerkesztés</button>
                  <button onClick={() => handleDelete(task.id)} style={{ padding: "6px 12px", background: "#e74c3c", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>🗑️ Törlés</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
