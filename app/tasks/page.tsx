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
  recipient_emails?: string;
};

// Segédfüggvény a nap nevével történő formázáshoz (pl.: 2026. 06. 12., csütörtök 14:30)
const formatDateWithDay = (dateString?: string) => {
  if (!dateString) return "Nincs megadva";
  try {
    const cleanStr = dateString.replace("T", " ");
    const dateObj = new Date(cleanStr);
    if (isNaN(dateObj.getTime())) return dateString;

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
    };

    return new Intl.DateTimeFormat("hu-HU", options).format(dateObj);
  } catch {
    return dateString;
  }
};

const formatDateSimple = (dateString?: string) => {
  if (!dateString) return "-";
  try {
    const cleanStr = dateString.replace("T", " ");
    const dateObj = new Date(cleanStr);
    if (isNaN(dateObj.getTime())) return dateString;
    return new Intl.DateTimeFormat("hu-HU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);
  } catch {
    return dateString;
  }
};

// Egyedi Magyar Naptár & Időválasztó Komponens
function CustomDateTimePicker({ value, onChange, label }: { value: string; onChange: (val: string) => void; label: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Kezdő dátum beállítása a meglévő érték alapján vagy a mai napra
  // Kezdő dátum beállítása
  const initialDate = value ? new Date(value.replace("T", " ").replace("Z", "")) : new Date();
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  
  const [selectedDay, setSelectedDay] = useState(initialDate.getDate());
  const [selectedHour, setSelectedHour] = useState(initialDate.getHours().toString().padStart(2, "0"));
  const [selectedMinute, setSelectedMinute] = useState(initialDate.getMinutes().toString().padStart(2, "0"));

  const monthsList = [
    "január", "február", "március", "április", "május", "június",
    "július", "augusztus", "szeptember", "október", "november", "december"
  ];

  const daysOfWeek = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];

  // Hónap napjainak kiszámítása
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Hétfő legyen az első nap (0)
  };

  const handleApply = (day: number, hour: string, minute: string, month: number, year: number) => {
    const formattedMonth = (month + 1).toString().padStart(2, "0");
    const formattedDay = day.toString().padStart(2, "0");
    // Hozzáadjuk a helyi időzónát jelölő Z-t vagy pontosan stringként mentjük el konverzió nélkül,
    // hogy a böngésző/szerver ne tolja el az időzónák miatt.
    const dateStr = `${year}-${formattedMonth}-${formattedDay}T${hour}:${minute}:00`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
    setSelectedDay(now.getDate());
    setSelectedHour(now.getHours().toString().padStart(2, "0"));
    setSelectedMinute(now.getMinutes().toString().padStart(2, "0"));
    handleApply(now.getDate(), now.getHours().toString().padStart(2, "0"), now.getMinutes().toString().padStart(2, "0"), now.getMonth(), now.getFullYear());
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  // Előző hónap utolsó napjai a kitöltéshez
  const prevMonthDays = getDaysInMonth(currentYear, currentMonth === 0 ? 11 : currentMonth - 1);

  return (
    <div>
      <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>{label}</label>
      <div 
        onClick={() => setIsOpen(true)}
        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", background: "white", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", boxSizing: "border-box" }}
      >
        <span>{value ? formatDateWithDay(value) : "Válassz időpontot..."}</span>
        <span>📅</span>
      </div>

      {isOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100, padding: "10px"
        }}>
          <div style={{
            background: "white", padding: "16px", borderRadius: "12px", width: "100%", maxWidth: "380px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", gap: "12px", boxSizing: "border-box"
          }}>
            {/* Fejléc: Év Hónap + Nyilak */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: "bold", fontSize: "16px" }}>{currentYear}. {monthsList[currentMonth]}</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" onClick={prevMonth} style={{ background: "#f1f1f1", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>←</button>
                <button type="button" onClick={nextMonth} style={{ background: "#f1f1f1", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>→</button>
              </div>
            </div>

            {/* Naptár Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center" }}>
              {daysOfWeek.map((d, i) => (
                <div key={i} style={{ fontSize: "12px", fontWeight: "bold", color: "#666", paddingBottom: "4px" }}>{d}</div>
              ))}

              {/* Előző hónap lógó napjai */}
              {Array.from({ length: firstDayIndex }).map((_, i) => {
                const dayNum = prevMonthDays - firstDayIndex + i + 1;
                return <div key={`prev-${i}`} style={{ padding: "8px", color: "#ccc", fontSize: "13px" }}>{dayNum}</div>;
              })}

              {/* Aktuális hónap napjai */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected = dayNum === selectedDay;
                return (
                  <div
                    key={`day-${dayNum}`}
                    onClick={() => setSelectedDay(dayNum)}
                    style={{
                      padding: "8px 0",
                      borderRadius: "6px",
                      cursor: "pointer",
                      background: isSelected ? "#34495e" : "transparent",
                      color: isSelected ? "white" : "#333",
                      fontWeight: isSelected ? "bold" : "normal",
                      fontSize: "14px"
                    }}
                  >
                    {dayNum}
                  </div>
                );
              })}
            </div>

            {/* Óra / Perc választó */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", borderTop: "1px solid #eee", paddingTop: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: "bold" }}>Idő:</span>
              <select value={selectedHour} onChange={(e) => setSelectedHour(e.target.value)} style={{ padding: "6px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px" }}>
                {Array.from({ length: 24 }).map((_, h) => {
                  const hs = h.toString().padStart(2, "0");
                  return <option key={hs} value={hs}>{hs}</option>;
                })}
              </select>
              <span>:</span>
              <select value={selectedMinute} onChange={(e) => setSelectedMinute(e.target.value)} style={{ padding: "6px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px" }}>
                {["00", "15", "30", "45"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Alsó gombok */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #eee", paddingTop: "10px" }}>
              <button type="button" onClick={handleClear} style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>Törlés</button>
              <button type="button" onClick={handleToday} style={{ background: "none", border: "none", color: "#2980b9", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>Ma</button>
              <button 
                type="button" 
                onClick={() => handleApply(selectedDay, selectedHour, selectedMinute, currentMonth, currentYear)}
                style={{ background: "#27ae60", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}
              >
                Kiválaszt
              </button>
            </div>

            <button type="button" onClick={() => setIsOpen(false)} style={{ background: "#95a5a6", color: "white", border: "none", padding: "8px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", marginTop: "4px" }}>
              Mégse
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [filterStatus, setFilterStatus] = useState<"all" | "folyamatban" | "kesz">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

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

    fetch("/api/settings/emails")
      .then((res) => res.json())
      .then((data) => {
        if (data.emails && data.emails.length > 0) {
          setEnvEmails(data.emails);
          setSelectedRecipients([data.emails[0]]);
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

  const handleRecipientToggle = (emailAddr: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(emailAddr)
        ? prev.filter((e) => e !== emailAddr)
        : [...prev, emailAddr]
    );
  };

  const handleAddCustomEmail = () => {
    const trimmed = customEmailInput.trim();
    if (trimmed && !envEmails.includes(trimmed)) {
      setEnvEmails((prev) => [...prev, trimmed]);
      setSelectedRecipients((prev) => [...prev, trimmed]);
      setCustomEmailInput("");
    } else if (trimmed && envEmails.includes(trimmed)) {
      if (!selectedRecipients.includes(trimmed)) {
        setSelectedRecipients((prev) => [...prev, trimmed]);
      }
      setCustomEmailInput("");
    }
  };

  const handleRemoveEmailOption = (emailToRemove: string) => {
    setEnvEmails((prev) => prev.filter((e) => e !== emailToRemove));
    setSelectedRecipients((prev) => prev.filter((e) => e !== emailToRemove));
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
    
    formData.append("recipients", JSON.stringify(selectedRecipients));
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

    if (task.recipient_emails) {
      const savedRecipients = task.recipient_emails.split(",").map(e => e.trim()).filter(Boolean);
      setSelectedRecipients(savedRecipients);
      
      savedRecipients.forEach(savedEmail => {
        if (!envEmails.includes(savedEmail)) {
          setEnvEmails(prev => [...prev, savedEmail]);
        }
      });
    } else {
      if (envEmails.length > 0) {
        setSelectedRecipients([envEmails[0]]);
      } else {
        setSelectedRecipients([]);
      }
    }

    setStatusMessage("");
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredTasks = tasks.filter((task) => {
    if (filterType !== "all" && task.type !== filterType) {
      return false;
    }
    if (filterStatus === "folyamatban" && task.completed_at) {
      return false;
    }
    if (filterStatus === "kesz" && !task.completed_at) {
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
    <main style={{ maxWidth: "1050px", margin: "20px auto", padding: "16px", fontFamily: "Arial, sans-serif", boxSizing: "border-box" }}>
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
          flex-wrap: wrap;
        }
        .email-input-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        @media (min-width: 600px) {
          .form-grid {
            grid-template-columns: 1fr 1fr;
          }
          .cards-grid {
            grid-template-columns: 1fr 1fr;
          }
          .email-input-row {
            flex-direction: row;
          }
        }
      `}</style>

      {/* RÉSZLETEK MODÁLIS */}
      {viewingTask && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "16px"
        }}>
          <div style={{
            background: "white", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "500px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", gap: "12px", maxHeight: "90vh", overflowY: "auto"
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
