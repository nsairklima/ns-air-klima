"use client"; // A komponens kliens oldalon fut (Next.js klienskomponens direktíva)

import { useEffect, useState } from "react"; // A React könyvtárból az useEffect és useState hookok importálása

type Task = { // Egy egyedi TypeScript típusdefiníció (Task) a feladatok adatstruktúrájához
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
  recipient_emails?: string;
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

  const [filterType, setFilterType] = useState<"all" | "telepites" | "karbantartas">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Új állapotok a többes email kiválasztáshoz és manuális megadáshoz
  const [envEmails, setEnvEmails] = useState<string[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [customEmailInput, setCustomEmailInput] = useState("");

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks/list", { cache: "no-store" });
      const data = res.ok ? await res.json() : { tasks: [] };
      setTasks(data.tasks || []);
    } catch (error) {
      console.error("Hiba a betöltéskor:", error);
    }
  };

  useEffect(() => {
    fetchTasks();

    // Emailek lekérése az API-tól az .env fájl alapján
    fetch("/api/settings/emails")
      .then((res) => res.json())
      .then((data) => {
        if (data.emails && data.emails.length > 0) {
          setEnvEmails(data.emails);
          setSelectedRecipients([data.emails[0]]); // Alapértelmezésben az elsőt bejelöljük
        }
      })
      .catch((err) => console.error("Hiba az emailek betöltésekor:", err));
  }, []);

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
    setIsFormOpen(false);
    setCustomEmailInput("");
    if (envEmails.length > 0) {
      setSelectedRecipients([envEmails[0]]);
    } else {
      setSelectedRecipients([]);
    }
  };

  // Checkbox kezelő több email kiválasztásához
  const handleRecipientToggle = (emailAddr: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(emailAddr)
        ? prev.filter((e) => e !== emailAddr)
        : [...prev, emailAddr]
    );
  };

  // Manuális email hozzáadása a listához
  const handleAddCustomEmail = () => {
    const trimmed = customEmailInput.trim();
    if (trimmed && !selectedRecipients.includes(trimmed)) {
      setSelectedRecipients((prev) => [...prev, trimmed]);
      if (!envEmails.includes(trimmed)) {
        setEnvEmails((prev) => [...prev, trimmed]); // Ha még nincs benne a listában, ide is felvesszük
      }
      setCustomEmailInput("");
    }
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
    
    // A kiválasztott emailek küldése vesszővel elválasztva
    formData.append("recipientEmail", selectedRecipients.join(", "));

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
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredTasks = tasks.filter((task) => {
    if (filterType !== "all" && task.type !== filterType) {
      return false;
    }
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
        .filter-buttons {
          display: flex;
          flex-direction: row;
          gap: 6px;
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

      {/* STÁTUSZ ÜZENET */}
      {statusMessage && (
        <div style={{ marginBottom: "16px", padding: "12px", background: "#e2f0d9", color: "#385723", borderRadius: "8px", fontWeight: "bold" }}>
          {statusMessage}
        </div>
      )}

      {/* LENYÍLÓ MUNKA KIADÁSA / SZERKESZTŐ SÁV */}
      <div style={{ marginBottom: "20px" }}>
        {!isFormOpen && !editingTaskId ? (
          <button
            onClick={() => setIsFormOpen(true)}
            style={{
              width: "100%",
              padding: "14px",
              background: "#28a745",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
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
              background: editingTaskId ? "#fff3cd" : "#f9f9f9", 
              padding: "20px", 
              borderRadius: "12px", 
              border: editingTaskId ? "2px solid #ffc107" : "1px solid #ddd", 
              transition: "all 0.3s ease"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: editingTaskId ? "#856404" : "#333" }}>
                {editingTaskId ? "✏️ Munka szerkesztése" : "🛠️ Új munka rögzítése"}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", fontWeight: "bold", color: "#666" }}
              >
                ✕ Bezárás
              </button>
            </div>

            {editingTaskId && (
              <div style={{ background: "#ffeeba", padding: "8px 12px", borderRadius: "6px", color: "#856404", fontSize: "14px", fontWeight: "bold" }}>
                Szerkesztési módban vagy. A módosítások mentéséhez kattints a "Módosítás Mentése" gombra.
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
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Név:</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ügyfél neve" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Cím / Helyszín:</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Pl. 1051 Budapest, Kossuth L. tér 1." style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Telefonszám:</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+36 30 123 4567" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Email cím:</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ugyfel@email.com" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Tervezett időpont:</label>
                <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box", background: "white" }} />
              </div>
              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Megvalósult időpont:</label>
                <input type="datetime-local" value={completedAt} onChange={(e) => setCompletedAt(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box", background: "white" }} />
              </div>
            </div>

            <div>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Megjegyzés:</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Egyéb részletek a munkáról..." rows={3} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
            </div>

            {/* Többszörös email cím kijelölése és manuális hozzáadása */}
            <div style={{ background: "white", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>
                Értesítés küldése ezekre a címekre (Több is kijelölhető):
              </label>

              {envEmails.length === 0 ? (
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>Nincsenek alapértelmezett emailek beállítva. Adj hozzá manuálisan alább!</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
                  {envEmails.map((emailAddr, index) => (
                    <label key={index} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px" }}>
                      <input
                        type="checkbox"
                        checked={selectedRecipients.includes(emailAddr)}
                        onChange={() => handleRecipientToggle(emailAddr)}
                        style={{ width: "16px", height: "16px", cursor: "pointer" }}
                      />
                      {emailAddr}
                    </label>
                  ))}
                </div>
              )}

              {/* Manuális email hozzáadása sor */}
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <input
                  type="email"
                  value={customEmailInput}
                  onChange={(e) => setCustomEmailInput(e.target.value)}
                  placeholder="Egyéb email cím manuális megadása..."
                  style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px", boxSizing: "border-box" }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomEmail}
                  style={{ background: "#0070f3", color: "white", border: "none", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}
                >
                  Hozzáadás
                </button>
              </div>

              {/* Kiválasztottak listázása visszajelzésként */}
              {selectedRecipients.length > 0 && (
                <div style={{ marginTop: "8px", fontSize: "12px", color: "#444" }}>
                  <strong>Kijelölt címzettek ({selectedRecipients.length}):</strong> {selectedRecipients.join(", ")}
                </div>
              )}
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

            {/* Gombok: Mentés / Módosítás és Mégsem */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                type="submit" 
                disabled={loading} 
                style={{ flex: 1, background: loading ? "#ccc" : editingTaskId ? "#ffc107" : "#28a745", color: editingTaskId ? "#000" : "white", padding: "14px", fontSize: "16px", fontWeight: "bold", border: "none", borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer" }}
              >
                {loading ? "Feldolgozás..." : editingTaskId ? "Módosítás Mentése" : "Munka Kiadása"}
              </button>
              
              <button 
                type="button" 
                onClick={resetForm} 
                style={{ background: "#6c757d", color: "white", padding: "14px 20px", fontSize: "16px", fontWeight: "bold", border: "none", borderRadius: "6px", cursor: "pointer" }}
              >
                Mégsem
              </button>
            </div>
          </form>
        )}
      </div>

      {/* SZŰRŐ ÉS KERESŐ SÁV */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="🔍 Keresés név, cím, telefon vagy megjegyzés alapján..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box", fontSize: "14px" }}
        />

        <div className="filter-buttons">
          <button
            onClick={() => setFilterType("all")}
            style={{ flex: 1, padding: "10px", background: filterType === "all" ? "#0070f3" : "#f1f1f1", color: filterType === "all" ? "white" : "#333", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
          >
            Összes ({tasks.length})
          </button>
          <button
            onClick={() => setFilterType("telepites")}
            style={{ flex: 1, padding: "10px", background: filterType === "telepites" ? "#0070f3" : "#f1f1f1", color: filterType === "telepites" ? "white" : "#333", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
          >
            Telepítés ({tasks.filter(t => t.type === "telepites").length})
          </button>
          <button
            onClick={() => setFilterType("karbantartas")}
            style={{ flex: 1, padding: "10px", background: filterType === "karbantartas" ? "#0070f3" : "#f1f1f1", color: filterType === "karbantartas" ? "white" : "#333", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
          >
            Karbantartás ({tasks.filter(t => t.type === "karbantartas").length})
          </button>
        </div>
      </div>

      {/* KÁRTYÁK LISTÁJA */}
      <div className="cards-grid">
        {filteredTasks.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#666", background: "#f9f9f9", borderRadius: "8px" }}>
            Nincs találat a megadott feltételek alapján.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isTelepites = task.type === "telepites";
            const cardBg = isTelepites ? "#f0f8ff" : "#fdfdfe";
            const borderColor = isTelepites ? "#0070f3" : "#ff9800";

            return (
              <div
                key={task.id}
                style={{
                  background: cardBg,
                  border: "1px solid #ddd",
                  borderLeft: `6px solid ${borderColor}`,
                  borderRadius: "8px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "bold", fontSize: "15px" }}>
                    {isTelepites ? "🛠️ Telepítés" : "🧹 Karbantartás"}
                  </span>
                  <span style={{ fontSize: "12px", color: task.completed_at ? "#28a745" : "#e65100", fontWeight: "bold" }}>
                    {task.completed_at ? "✅ Kész" : "⏳ Folyamatban"}
                  </span>
                </div>

                <div><strong>Név:</strong> {task.name || "-"}</div>
                <div><strong>Cím:</strong> {task.address || "-"}</div>
                <div><strong>Tervezett időpont:</strong> {formatDate(task.scheduled_at)}</div>

                <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                  <button onClick={() => setViewingTask(task)} style={{ padding: "6px 10px", background: "#17a2b8", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>
                    🔍 Részletek
                  </button>
                  <button onClick={() => startEditing(task)} style={{ padding: "6px 10px", background: "#ffc107", color: "black", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>
                    ✏️ Szerkesztés
                  </button>
                  <button onClick={() => handleDelete(task.id)} style={{ padding: "6px 10px", background: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>
                    🗑️ Törlés
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
