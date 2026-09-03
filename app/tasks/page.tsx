
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

const formatDateWithDay = (dateString?: string) => {
  if (!dateString) return "Nincs megadva";
  try {
    const cleanStr = dateString.replace("T", " ").replace("Z", "");
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
    const cleanStr = dateString.replace("T", " ").replace("Z", "");
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

function CustomDateTimePicker({ value, onChange, label }: { value: string; onChange: (val: string) => void; label: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const parseInitialValue = (val: string) => {
    const now = new Date();
    if (!val) {
      return {
        year: now.getFullYear(),
        month: now.getMonth(),
        day: now.getDate(),
        hour: now.getHours().toString().padStart(2, "0"),
        minute: "00"
      };
    }
    try {
      const [datePart, timePart] = val.split("T");
      const [y, m, d] = datePart.split("-").map(Number);
      const [h, min] = timePart ? timePart.split(":") : ["12", "00"];
      return {
        year: y || now.getFullYear(),
        month: m ? m - 1 : now.getMonth(),
        day: d || now.getDate(),
        hour: h ? h.padStart(2, "0") : "12",
        minute: min ? min.padStart(2, "0") : "00"
      };
    } catch {
      return {
        year: now.getFullYear(),
        month: now.getMonth(),
        day: now.getDate(),
        hour: "12",
        minute: "00"
      };
    }
  };

  const initial = parseInitialValue(value);

  const [currentMonth, setCurrentMonth] = useState(initial.month);
  const [currentYear, setCurrentYear] = useState(initial.year);
  const [selectedDay, setSelectedDay] = useState(initial.day);
  const [selectedHour, setSelectedHour] = useState(initial.hour);
  const [selectedMinute, setSelectedMinute] = useState(initial.minute);

  const monthsList = [
    "január", "február", "március", "április", "május", "június",
    "július", "augusztus", "szeptember", "október", "november", "december"
  ];

  const daysOfWeek = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];
  const validMinutes = ["00", "15", "30", "45"];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const handleApply = (day: number, hour: string, minute: string, month: number, year: number) => {
    const formattedMonth = (month + 1).toString().padStart(2, "0");
    const formattedDay = day.toString().padStart(2, "0");
    const safeHour = hour ? hour.padStart(2, "0") : "00";
    const safeMinute = minute ? minute.padStart(2, "0") : "00";
    
    const localDateObj = new Date(year, month, day, Number(safeHour), Number(safeMinute), 0);
    const timezoneOffsetMinutes = -localDateObj.getTimezoneOffset();
    const sign = timezoneOffsetMinutes >= 0 ? "+" : "-";
    const absOffsetMinutes = Math.abs(timezoneOffsetMinutes);
    const offsetHours = Math.floor(absOffsetMinutes / 60).toString().padStart(2, "0");
    const offsetMins = (absOffsetMinutes % 60).toString().padStart(2, "0");
    
    const dateStr = `${year}-${formattedMonth}-${formattedDay}T${safeHour}:${safeMinute}:00${sign}${offsetHours}:${offsetMins}`;
    
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  const handleToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    const h = now.getHours().toString().padStart(2, "0");
    const min = "00";

    setCurrentMonth(m);
    setCurrentYear(y);
    setSelectedDay(d);
    setSelectedHour(h);
    setSelectedMinute(min);
    handleApply(d, h, min, m, y);
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
  const prevMonthDays = getDaysInMonth(currentYear, currentMonth === 0 ? 11 : currentMonth - 1);

  return (
    <div>
      <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px", color: "#333" }}>{label}</label>
      <div 
        onClick={() => setIsOpen(true)}
        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", background: "white", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", boxSizing: "border-box", color: "#333" }}
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: "bold", fontSize: "16px", color: "#333" }}>{currentYear}. {monthsList[currentMonth]}</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" onClick={prevMonth} style={{ background: "#f1f1f1", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>←</button>
                <button type="button" onClick={nextMonth} style={{ background: "#f1f1f1", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>→</button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center" }}>
              {daysOfWeek.map((d, i) => (
                <div key={i} style={{ fontSize: "12px", fontWeight: "bold", color: "#666", paddingBottom: "4px" }}>{d}</div>
              ))}

              {Array.from({ length: firstDayIndex }).map((_, i) => {
                const dayNum = prevMonthDays - firstDayIndex + i + 1;
                return <div key={`prev-${i}`} style={{ padding: "8px", color: "#ccc", fontSize: "13px" }}>{dayNum}</div>;
              })}

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

            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", borderTop: "1px solid #eee", paddingTop: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: "bold", color: "#333" }}>Idő:</span>
              <select value={selectedHour} onChange={(e) => setSelectedHour(e.target.value)} style={{ padding: "6px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px", color: "#333" }}>
                {Array.from({ length: 24 }).map((_, h) => {
                  const hs = h.toString().padStart(2, "0");
                  return <option key={hs} value={hs}>{hs}</option>;
                })}
              </select>
              <span style={{ color: "#333" }}>:</span>
              <select value={selectedMinute} onChange={(e) => setSelectedMinute(e.target.value)} style={{ padding: "6px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px", color: "#333" }}>
                {validMinutes.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

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

    // Számlálók kiszámítása a szűrt listából (vagy a teljes listából, ha úgy preferálod)
  const countAllType = tasks.length;
  const countTelepites = tasks.filter(t => t.type === "telepites").length;
  const countKarbantartas = tasks.filter(t => t.type === "karbantartas").length;

  const countAllStatus = tasks.length;
  const countFolyamatban = tasks.filter(t => !t.completed_at).length;
  const countKesz = tasks.filter(t => Boolean(t.completed_at)).length;

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
    setScheduledAt(task.scheduled_at ? task.scheduled_at.replace(" ", "T").slice(0, 19) : "");
    setCompletedAt(task.completed_at ? task.completed_at.replace(" ", "T").slice(0, 19) : "");
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
    return (
    <main style={{ maxWidth: "1050px", margin: "20px auto", padding: "16px", fontFamily: "Arial, sans-serif", boxSizing: "border-box" }}>
      <style dangerouslySetInnerHTML={{ __html: `
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
      `}} />

      {viewingTask && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "16px"
        }}>
          <div style={{
            background: "white", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "500px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", gap: "12px", maxHeight: "90vh", overflowY: "auto", color: "#333"
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
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              color: "#333"
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
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ügyfél neve" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box", color: "#333" }} />
              </div>
              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Cím / Helyszín:</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Pl. Budapest, Fő u. 1." style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box", color: "#333" }} />
              </div>
              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Telefonszám:</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+36 30 123 4567" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box", color: "#333" }} />
              </div>
              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Email cím:</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ugyfel@email.com" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box", color: "#333" }} />
              </div>
              
              <CustomDateTimePicker
                label="Tervezett időpont:"
                value={scheduledAt}
                onChange={setScheduledAt}
              />

              <CustomDateTimePicker
                label="Megvalósult időpont:"
                value={completedAt}
                onChange={setCompletedAt}
              />
            </div>

            <div>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Megjegyzés:</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Egyéb részletek..." rows={3} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box", color: "#333" }} />
            </div>

            <div style={{ background: "white", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px", color: "#333" }}>Értesítés küldése ezekre a címekre:</label>
              {envEmails.map((emailAddr, index) => (
                <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f9f9f9", padding: "6px 10px", borderRadius: "6px", marginBottom: "6px", border: "1px solid #eee" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", flex: 1, color: "#333" }}>
                    <input type="checkbox" checked={selectedRecipients.includes(emailAddr)} onChange={() => handleRecipientToggle(emailAddr)} />
                    <span>{emailAddr}</span>
                  </label>
                  <button type="button" onClick={() => handleRemoveEmailOption(emailAddr)} style={{ background: "#e74c3c", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>Törlés</button>
                </div>
              ))}
              <div className="email-input-row" style={{ marginTop: "8px" }}>
                <input type="email" value={customEmailInput} onChange={(e) => setCustomEmailInput(e.target.value)} placeholder="Új email cím..." style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #ccc", color: "#333" }} />
                <button type="button" onClick={handleAddCustomEmail} style={{ background: "#34495e", color: "white", border: "none", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Hozzáadás</button>
              </div>
            </div>

            <div>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "6px" }}>Képek:</label>
              {existingImages.map((imgUrl, index) => (
                <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "6px", borderRadius: "6px", marginBottom: "4px", border: "1px solid #ccc", color: "#333" }}>
                  <span style={{ fontSize: "13px" }}>📷 Mentett kép #{index + 1}</span>
                  <button type="button" onClick={() => handleRemoveExistingImage(index)} style={{ background: "#e74c3c", color: "white", border: "none", padding: "2px 6px", borderRadius: "4px", fontSize: "11px" }}>Törlés</button>
                </div>
              ))}
              {photos.map((photo, index) => (
                <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "6px", borderRadius: "6px", marginBottom: "4px", border: "1px solid #ccc", color: "#333" }}>
                  <span style={{ fontSize: "13px" }}>📷 {photo.name}</span>
                  <button type="button" onClick={() => handleRemoveNewPhoto(index)} style={{ background: "#e74c3c", color: "white", border: "none", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}>Törlés</button>
                </div>
              ))}
              <input type="file" accept="image/*" onChange={handleAddPhoto} style={{ marginTop: "6px" }} />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{ flex: 1, background: "#27ae60", color: "white", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
              >
                {loading ? "Mentés..." : editingTaskId ? "Módosítás mentése" : "Létrehozás"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={{ background: "#95a5a6", color: "white", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
              >
                Mégse
              </button>
            </div>
          </form>
        )}
      </div>

    <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#1a202c", padding: "16px", borderRadius: "12px", border: "1px solid #4a5568" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="filter-buttons" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
            <button onClick={() => setFilterType("all")} style={{ padding: "8px 4px", borderRadius: "6px", border: "1px solid #4a5568", background: filterType === "all" ? "#4a5568" : "#2d3748", color: "white", cursor: "pointer", fontWeight: "bold", fontSize: "12px", textAlign: "center" }}>
              Összes ({countAll})
            </button>
            <button onClick={() => setFilterType("telepites")} style={{ padding: "8px 4px", borderRadius: "6px", border: "1px solid #4a5568", background: filterType === "telepites" ? "#4a5568" : "#2d3748", color: "white", cursor: "pointer", fontWeight: "bold", fontSize: "12px", textAlign: "center" }}>
              Telepítés ({countTelepites})
            </button>
            <button onClick={() => setFilterType("karbantartas")} style={{ padding: "8px 4px", borderRadius: "6px", border: "1px solid #4a5568", background: filterType === "karbantartas" ? "#4a5568" : "#2d3748", color: "white", cursor: "pointer", fontWeight: "bold", fontSize: "12px", textAlign: "center" }}>
              Karbant. ({countKarbantartas})
            </button>
          </div>
          <div className="filter-buttons" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
            <button onClick={() => setFilterStatus("all")} style={{ padding: "8px 4px", borderRadius: "6px", border: "1px solid #4a5568", background: filterStatus === "all" ? "#3182ce" : "#2d3748", color: "white", cursor: "pointer", fontWeight: "bold", fontSize: "12px", textAlign: "center" }}>
              Mind ({countStatusAll})
            </button>
            <button onClick={() => setFilterStatus("folyamatban")} style={{ padding: "8px 4px", borderRadius: "6px", border: "1px solid #4a5568", background: filterStatus === "folyamatban" ? "#3182ce" : "#2d3748", color: "white", cursor: "pointer", fontWeight: "bold", fontSize: "12px", textAlign: "center" }}>
              Folyamatban ({countFolyamatban})
            </button>
            <button onClick={() => setFilterStatus("kesz")} style={{ padding: "8px 4px", borderRadius: "6px", border: "1px solid #4a5568", background: filterStatus === "kesz" ? "#3182ce" : "#2d3748", color: "white", cursor: "pointer", fontWeight: "bold", fontSize: "12px", textAlign: "center" }}>
              Kész ({countKesz})
            </button>
          </div>
        </div>

        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Keresés név, cím, telefon vagy megjegyzés alapján..."
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #4a5568", background: "#ffffff", color: "#333", boxSizing: "border-box" }}
          />
        </div>

        {filteredTasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px", color: "#a0aec0" }}>Nincs találat a megadott feltételekkel.</div>
        ) : (
          <div className="cards-grid">
            {filteredTasks.map((task) => {
              const isTelepites = task.type === "telepites";
              const isKesz = Boolean(task.completed_at);

              // Bal oldali sáv színe típus alapján: Telepítés = Kék (3182ce), Karbantartás = Zöld (38a169)
              const typeColor = isTelepites ? "#3182ce" : "#38a169";
              // Státusz keret: Kész = Vaskosabb zöld keret, Folyamatban = Narancs/sárga keret
              const statusBorderColor = isKesz ? "#48bb78" : "#ed8936";

            // Számlálók kiszámítása
  const countAll = tasks.length;
  const countTelepites = tasks.filter(t => t.type === "telepites").length;
  const countKarbantartas = tasks.filter(t => t.type === "karbantartas").length;
  
  const countStatusAll = tasks.length;
  const countFolyamatban = tasks.filter(t => !t.completed_at).length;
  const countKesz = tasks.filter(t => Boolean(t.completed_at)).length;

  return (
    <main style={{ maxWidth: "1050px", margin: "20px auto", padding: "16px", fontFamily: "Arial, sans-serif", boxSizing: "border-box" }}>
      {/* ... a többi kód ... */}

              return (
                <div 
                  key={task.id} 
                  style={{ 
                    border: "1px solid #cbd5e0", 
                    borderLeft: `6px solid ${typeColor}`, 
                    borderTop: `4px solid ${statusBorderColor}`,
                    borderRadius: "10px", 
                    padding: "16px", 
                    background: "#ffffff", 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: "8px", 
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)" 
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold", fontSize: "13px", background: isTelepites ? "#ebf8ff" : "#f0fff4", color: isTelepites ? "#2b6cb0" : "#2f855a", padding: "4px 8px", borderRadius: "4px" }}>
                      {isTelepites ? "🛠️ Telepítés" : "🧹 Karbantartás"}
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: "bold", color: isKesz ? "#2f855a" : "#c05621", background: isKesz ? "#f0fff4" : "#fffaf0", padding: "2px 6px", borderRadius: "4px" }}>
                      {isKesz ? "✅ Kész" : "⏳ Folyamatban"}
                    </span>
                  </div>

                  <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1a202c" }}>{task.name || "Névtelen ügyfél"}</div>
                  {task.address && <div style={{ fontSize: "14px", color: "#4a5568" }}>📍 {task.address}</div>}
                  {task.phone && <div style={{ fontSize: "14px", color: "#4a5568" }}>📞 {task.phone}</div>}
                  {task.email && <div style={{ fontSize: "14px", color: "#4a5568" }}>✉️ {task.email}</div>}
                  {task.scheduled_at && <div style={{ fontSize: "13px", color: "#718096" }}>📅 Tervezett: {formatDateWithDay(task.scheduled_at)}</div>}
                  {task.completed_at && <div style={{ fontSize: "13px", color: "#2f855a" }}>✅ Készülve: {formatDateWithDay(task.completed_at)}</div>}
                  {task.note && <div style={{ fontSize: "13px", color: "#4a5568", fontStyle: "italic", background: "#f7fafc", padding: "6px", borderRadius: "4px", borderLeft: "3px solid #cbd5e0" }}>💬 {task.note}</div>}

                  <div style={{ display: "flex", gap: "8px", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #edf2f7" }}>
                    <button onClick={() => setViewingTask(task)} style={{ flex: 1, background: "#4a5568", color: "white", border: "none", padding: "6px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>Részletek</button>
                    <button onClick={() => startEditing(task)} style={{ background: "#dd6b20", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>Szerkesztés</button>
                    <button onClick={() => handleDelete(task.id)} style={{ background: "#e53e3e", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>Törlés</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
