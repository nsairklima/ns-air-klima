"use client";

import { useEffect, useRef, useState } from "react";
import TasksMap from "../components/TasksMap";

type MachineDetail = {
  maintenanceType:
    | "mosas"
    | "fertotlenites"
    | "";
  warranty: boolean | null;
  invoiced: boolean;
};

type Task = {
  id: number;
  type: string;
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  note?: string;
  machines?: string[];
  machineDetails?: MachineDetail[];
  paymentMethod?:
    | "keszpenz"
    | "atutalas"
    | null;
  scheduled_at?: string;
  completed_at?: string;
  images?: string[];
  created_at: string;
  recipient_emails?: string;
  latitude?: number | null;
  longitude?: number | null;
};

type FormCoordinates = {
  lat: number;
  lng: number;
};

// Segédfüggvény a nap nevével történő formázáshoz
const formatDateWithDay = (dateString?: string) => {
  if (!dateString) return "Nincs megadva";

  try {
    const [datePart, timePart] = dateString
      .replace("T", " ")
      .split(" ");

    if (!datePart) return dateString;

    const [year, month, day] = datePart
      .split("-")
      .map(Number);

    const [hour, minute] = (timePart || "00:00")
      .split(":")
      .map(Number);

    const dateObj = new Date(
      year,
      month - 1,
      day,
      hour,
      minute
    );

    return new Intl.DateTimeFormat("hu-HU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);
  } catch {
    return dateString;
  }
};

const formatDateSimple = (
  dateString?: string
) => {
  if (!dateString) return "-";

  try {
    const [datePart, timePart] = dateString
      .replace("T", " ")
      .split(" ");

    if (!datePart) return dateString;

    const [year, month, day] = datePart
      .split("-")
      .map(Number);

    const [hour, minute] = (timePart || "00:00")
      .split(":")
      .map(Number);

    const dateObj = new Date(
      year,
      month - 1,
      day,
      hour,
      minute
    );

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

function normalizeAddressForCache(
  addressValue: string
) {
  return addressValue
    .trim()
    .toLocaleLowerCase("hu-HU")
    .replace(/\s+/g, " ");
}

async function findCoordinatesForTask(
  addressValue: string
): Promise<FormCoordinates | null> {
  const cleanAddress =
    normalizeAddressForCache(addressValue);

  if (!cleanAddress) {
    return null;
  }

  const cacheKey =
    "tasks-map-coordinate-" + cleanAddress;

  if (typeof window !== "undefined") {
    try {
      const cachedValue =
        window.localStorage.getItem(cacheKey);

      if (cachedValue) {
        const cachedCoordinates =
          JSON.parse(
            cachedValue
          ) as FormCoordinates;

        if (
          Number.isFinite(
            cachedCoordinates.lat
          ) &&
          Number.isFinite(
            cachedCoordinates.lng
          )
        ) {
          return cachedCoordinates;
        }
      }
    } catch {
      window.localStorage.removeItem(
        cacheKey
      );
    }
  }

  const searchUrl =
    "https:" +
    "//nominatim.openstreetmap.org/search" +
    "?format=jsonv2" +
    "&limit=1" +
    "&countrycodes=hu" +
    "&addressdetails=1" +
    "&q=" +
    encodeURIComponent(addressValue.trim());

  try {
    const response = await fetch(
      searchUrl,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(
        "Geokódolási HTTP hiba:",
        response.status
      );

      return null;
    }

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    if (
      !contentType.includes(
        "application/json"
      )
    ) {
      const responseText =
        await response.text();

      console.error(
        "A geokódoló nem JSON választ adott:",
        responseText.slice(0, 200)
      );

      return null;
    }

    const data = await response.json();

    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {
      return null;
    }

    const lat = Number(data[0].lat);
    const lng = Number(data[0].lon);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return null;
    }

    const coordinates: FormCoordinates = {
      lat,
      lng,
    };

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        cacheKey,
        JSON.stringify(coordinates)
      );
    }

    return coordinates;
  } catch (error) {
    console.error(
      "Koordináta-lekérési hiba:",
      error
    );

    return null;
  }
}

// Egyedi Magyar Naptár & Időválasztó Komponens
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
        hour: h || "12",
        minute: min || "00"
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
    
    const dateStr = `${year}-${formattedMonth}-${formattedDay}T${safeHour}:${safeMinute}:00`;
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: "bold", fontSize: "16px" }}>{currentYear}. {monthsList[currentMonth]}</span>
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
              <span style={{ fontSize: "13px", fontWeight: "bold" }}>Idő:</span>
              <select value={selectedHour} onChange={(e) => setSelectedHour(e.target.value)} style={{ padding: "6px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px" }}>
                {Array.from({ length: 24 }).map((_, h) => {
                  const hs = h.toString().padStart(2, "0");
                  return <option key={hs} value={hs}>{hs}</option>;
                })}
              </select>
              <span>:</span>
              <select value={selectedMinute} onChange={(e) => setSelectedMinute(e.target.value)} style={{ padding: "6px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px" }}>
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

type ImageEditorProps = {
  file: File;
  onSave: (editedFile: File) => void;
  onCancel: () => void;
};

function ImageEditor({
  file,
  onSave,
  onCancel,
}: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const [brushColor, setBrushColor] = useState("#ff0000");
  const [brushSize, setBrushSize] = useState(8);
  const [imageLoaded, setImageLoaded] = useState(false);

  const drawOriginalImage = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;

    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      image,
      0,
      0,
      canvas.width,
      canvas.height
    );
  };

  useEffect(() => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const canvas = canvasRef.current;

      if (!canvas) {
        URL.revokeObjectURL(objectUrl);
        return;
      }

      const maxCanvasSize = 1600;

      let width = image.naturalWidth;
      let height = image.naturalHeight;

      if (width > height && width > maxCanvasSize) {
        height = Math.round(
          (height * maxCanvasSize) / width
        );
        width = maxCanvasSize;
      } else if (
        height >= width &&
        height > maxCanvasSize
      ) {
        width = Math.round(
          (width * maxCanvasSize) / height
        );
        height = maxCanvasSize;
      }

      canvas.width = width;
      canvas.height = height;

      imageRef.current = image;
      drawOriginalImage();
      setImageLoaded(true);

      URL.revokeObjectURL(objectUrl);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
    };

    image.src = objectUrl;

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const getCanvasPoint = (
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();

    return {
      x:
        (event.clientX - rect.left) *
        (canvas.width / rect.width),
      y:
        (event.clientY - rect.top) *
        (canvas.height / rect.height),
    };
  };

  const startDrawing = (
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;

    if (!canvas || !imageLoaded) return;

    event.preventDefault();

    canvas.setPointerCapture(event.pointerId);

    drawingRef.current = true;
    lastPointRef.current = getCanvasPoint(event);
  };

  const draw = (
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (!drawingRef.current) return;

    event.preventDefault();

    const canvas = canvasRef.current;
    const previousPoint = lastPointRef.current;

    if (!canvas || !previousPoint) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const currentPoint = getCanvasPoint(event);

    ctx.beginPath();
    ctx.moveTo(previousPoint.x, previousPoint.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    lastPointRef.current = currentPoint;
  };

  const stopDrawing = (
    event?: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (
      event &&
      canvasRef.current?.hasPointerCapture(
        event.pointerId
      )
    ) {
      canvasRef.current.releasePointerCapture(
        event.pointerId
      );
    }

    drawingRef.current = false;
    lastPointRef.current = null;
  };

  const handleSave = () => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          alert(
            "A szerkesztett képet nem sikerült elkészíteni."
          );
          return;
        }

        const originalName =
          file.name.replace(/\.[^/.]+$/, "") ||
          "szerkesztett-kep";

        const editedFile = new File(
          [blob],
          `${originalName}-jelolt.jpg`,
          {
            type: "image/jpeg",
            lastModified: Date.now(),
          }
        );

        onSave(editedFile);
      },
      "image/jpeg",
      0.85
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        background: "rgba(0, 0, 0, 0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          maxHeight: "96vh",
          overflowY: "auto",
          background: "#111827",
          borderRadius: "14px",
          padding: "12px",
          boxSizing: "border-box",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
            marginBottom: "12px",
          }}
        >
          <strong>✏️ Rajzolás a képre</strong>

          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "7px",
              padding: "8px 12px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ✕ Bezárás
          </button>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "10px",
            marginBottom: "12px",
            padding: "10px",
            background: "#1f2937",
            borderRadius: "10px",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: "bold",
            }}
          >
            Szín:
            <input
              type="color"
              value={brushColor}
              onChange={(event) =>
                setBrushColor(event.target.value)
              }
              style={{
                width: "42px",
                height: "34px",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            />
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: "bold",
            }}
          >
            Vastagság:
            <input
              type="range"
              min="2"
              max="40"
              value={brushSize}
              onChange={(event) =>
                setBrushSize(
                  Number(event.target.value)
                )
              }
            />
            <span>{brushSize}px</span>
          </label>

          <button
            type="button"
            onClick={drawOriginalImage}
            disabled={!imageLoaded}
            style={{
              background: "#f59e0b",
              color: "white",
              border: "none",
              borderRadius: "7px",
              padding: "8px 12px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ↩ Rajz törlése
          </button>
        </div>

        <div
          style={{
            width: "100%",
            overflow: "auto",
            background: "#000",
            borderRadius: "10px",
            textAlign: "center",
            touchAction: "none",
          }}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            onPointerLeave={(event) => {
              if (
                event.pointerType === "mouse"
              ) {
                stopDrawing(event);
              }
            }}
            style={{
              display: "block",
              width: "100%",
              height: "auto",
              maxHeight: "70vh",
              objectFit: "contain",
              cursor: "crosshair",
              touchAction: "none",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "12px",
          }}
        >
          <button
            type="button"
            onClick={handleSave}
            disabled={!imageLoaded}
            style={{
              flex: 1,
              background: imageLoaded
                ? "#22c55e"
                : "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "12px",
              cursor: imageLoaded
                ? "pointer"
                : "not-allowed",
              fontWeight: "bold",
            }}
          >
            ✅ Rajz mentése
          </button>

          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "12px 16px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Mégse
          </button>
        </div>
      </div>
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

  const [machines, setMachines] = useState<string[]>([""]);

  const [
    machineDetails,
    setMachineDetails,
  ] = useState<MachineDetail[]>([
    {
      maintenanceType: "",
      warranty: null,
      invoiced: false,
    },
  ]);

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState<
    "keszpenz" | "atutalas" | null
  >(null);
  
  const [photos, setPhotos] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "warning">("success");
  const [tasks, setTasks] = useState<Task[]>([]);

const [filterType, setFilterType] = useState<
  "all" | "telepites" | "karbantartas"
>("all");

const [filterStatus, setFilterStatus] = useState<
  "all" | "folyamatban" | "kesz" | "nincsIdopont"
>("all");

const [filterInvoice, setFilterInvoice] = useState<
  "all" | "igen" | "kiszamlazva" | "nem"
>("all");

const [searchQuery, setSearchQuery] = useState("");
const [scheduledDateFilter, setScheduledDateFilter] = useState("");
const [sortOrder, setSortOrder] = useState<
  | "default"
  | "scheduledAsc"
  | "scheduledDesc"
  | "completedAsc"
  | "completedDesc"
>("default");
  const [showMap, setShowMap] = useState(false);

  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [galleryImageIndex, setGalleryImageIndex] = useState<number | null>(null);
 const galleryTouchStartX =
  useRef<number | null>(null);

const galleryTouchStartY =
  useRef<number | null>(null);

const galleryTouchEndX =
  useRef<number | null>(null);

const galleryTouchEndY =
  useRef<number | null>(null);

const galleryHadMultipleTouches =
  useRef(false);

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
    setMachines([""]);

setMachineDetails([
  {
    maintenanceType: "",
    warranty: null,
    invoiced: false,
  },
]);

    setPaymentMethod(null);
    setPhotos([]);
    setExistingImages([]);
    setEditingPhotoIndex(null);
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

  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        let width = img.width;
        let height = img.height;

        const MAX_SIZE = 1600;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = (height * MAX_SIZE) / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = (width * MAX_SIZE) / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
            });

            resolve(compressedFile);
          },
          "image/jpeg",
          0.75
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const files = Array.from(e.target.files);
    const compressedFiles = await Promise.all(
      files.map((file) => resizeImage(file))
    );

    setPhotos((prev) => [...prev, ...compressedFiles]);
    e.target.value = "";
  };

  const handleRemoveNewPhoto = (indexToRemove: number) => {
    setPhotos((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSaveEditedPhoto = (editedFile: File) => {
    if (editingPhotoIndex === null) return;

    setPhotos((previousPhotos) =>
      previousPhotos.map((photo, index) =>
        index === editingPhotoIndex ? editedFile : photo
      )
    );

    setEditingPhotoIndex(null);
  };

  const handleRemoveExistingImage = (indexToRemove: number) => {
    setExistingImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

 const closeImageGallery = () => {
  setGalleryImageIndex(null);

  galleryTouchStartX.current = null;
  galleryTouchStartY.current = null;
  galleryTouchEndX.current = null;
  galleryTouchEndY.current = null;

  galleryHadMultipleTouches.current =
    false;
};

  const showPreviousGalleryImage = () => {
    if (
      galleryImageIndex === null ||
      !viewingTask?.images ||
      viewingTask.images.length === 0
    ) {
      return;
    }

    setGalleryImageIndex((currentIndex) => {
      if (currentIndex === null) return null;

      return currentIndex === 0
        ? viewingTask.images!.length - 1
        : currentIndex - 1;
    });
  };

  const showNextGalleryImage = () => {
    if (
      galleryImageIndex === null ||
      !viewingTask?.images ||
      viewingTask.images.length === 0
    ) {
      return;
    }

    setGalleryImageIndex((currentIndex) => {
      if (currentIndex === null) return null;

      return currentIndex === viewingTask.images!.length - 1
        ? 0
        : currentIndex + 1;
    });
  };

const resetGalleryTouchState = () => {
  galleryTouchStartX.current = null;
  galleryTouchStartY.current = null;
  galleryTouchEndX.current = null;
  galleryTouchEndY.current = null;
  galleryHadMultipleTouches.current = false;
};

const handleGalleryTouchStart = (
  event: React.TouchEvent<HTMLDivElement>
) => {
  if (event.touches.length !== 1) {
    galleryHadMultipleTouches.current = true;
    galleryTouchStartX.current = null;
    galleryTouchStartY.current = null;
    galleryTouchEndX.current = null;
    galleryTouchEndY.current = null;
    return;
  }

  galleryHadMultipleTouches.current = false;

  const touch = event.touches[0];

  galleryTouchStartX.current = touch.clientX;
  galleryTouchStartY.current = touch.clientY;
  galleryTouchEndX.current = touch.clientX;
  galleryTouchEndY.current = touch.clientY;
};

const handleGalleryTouchMove = (
  event: React.TouchEvent<HTMLDivElement>
) => {
  if (event.touches.length !== 1) {
    galleryHadMultipleTouches.current = true;
    return;
  }

  if (galleryHadMultipleTouches.current) {
    return;
  }

  const touch = event.touches[0];

  galleryTouchEndX.current = touch.clientX;
  galleryTouchEndY.current = touch.clientY;
};

const handleGalleryTouchEnd = () => {
  const startX = galleryTouchStartX.current;
  const startY = galleryTouchStartY.current;
  const endX = galleryTouchEndX.current;
  const endY = galleryTouchEndY.current;

  if (galleryHadMultipleTouches.current) {
    resetGalleryTouchState();
    return;
  }

  if (
    startX === null ||
    startY === null ||
    endX === null ||
    endY === null
  ) {
    resetGalleryTouchState();
    return;
  }

  const horizontalDistance = startX - endX;
  const verticalDistance = startY - endY;

  const absoluteHorizontalDistance =
    Math.abs(horizontalDistance);

  const absoluteVerticalDistance =
    Math.abs(verticalDistance);

  const minimumSwipeDistance = 100;

  const isHorizontalSwipe =
    absoluteHorizontalDistance >=
      minimumSwipeDistance &&
    absoluteHorizontalDistance >
      absoluteVerticalDistance * 1.5;

  if (isHorizontalSwipe) {
    if (horizontalDistance > 0) {
      showNextGalleryImage();
    } else {
      showPreviousGalleryImage();
    }
  }

  resetGalleryTouchState();
};

  useEffect(() => {
    if (galleryImageIndex === null) {
      return;
    }

    const handleGalleryKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPreviousGalleryImage();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNextGalleryImage();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeImageGallery();
      }
    };

    window.addEventListener("keydown", handleGalleryKeyDown);

    return () => {
      window.removeEventListener("keydown", handleGalleryKeyDown);
    };
  }, [galleryImageIndex, viewingTask]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setStatusMessage("");
    setStatusType("success");

    try {
      let latitude = "";
      let longitude = "";

      if (address.trim()) {
        const coordinates = await findCoordinatesForTask(address);

        if (coordinates) {
          latitude = coordinates.lat.toString();
          longitude = coordinates.lng.toString();
        }
      }

      const formData = new FormData();
      formData.append("type", type);
      formData.append("name", name);
      formData.append("address", address);
      formData.append("phone", phone);
      formData.append("email", email);
      formData.append("note", note);

      const cleanedMachineRows =
        machines
          .map((machine, index) => {
            const cleanMachine =
              machine.trim();

            const detail =
              machineDetails[index] || {
                maintenanceType: "",
                warranty: null,
                invoiced: false,
              };

            return {
              machine: cleanMachine,
              detail: {
                maintenanceType:
                  type === "karbantartas" && completedAt
                    ? detail.maintenanceType
                    : "",
                warranty:
                  detail.warranty,
                invoiced: detail.invoiced === true,
              } as MachineDetail,
            };
          })
          .filter(
            (row) =>
              row.machine !== ""
          );

      const cleanedMachines =
        cleanedMachineRows.map(
          (row) => row.machine
        );

      const cleanedMachineDetails =
        cleanedMachineRows.map(
          (row) => row.detail
        );

      formData.append(
        "machines",
        JSON.stringify(cleanedMachines)
      );

      formData.append(
        "machineDetails",
        JSON.stringify(
          cleanedMachineDetails
        )
      );

      formData.append(
        "paymentMethod",
        paymentMethod || ""
      );

      formData.append(
        "scheduledAt",
        scheduledAt
      );
      formData.append("completedAt", completedAt);
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);
      formData.append("recipients", JSON.stringify(selectedRecipients));
      formData.append("existingImages", JSON.stringify(existingImages));

      photos.forEach((photo) => {
        formData.append("photos", photo);
      });

      const isEditing = editingTaskId !== null;
      const requestUrl = isEditing ? `/api/tasks/${editingTaskId}` : "/api/tasks";
      const requestMethod = isEditing ? "PUT" : "POST";

      const res = await fetch(requestUrl, {
        method: requestMethod,
        body: formData,
      });

      let data: any = {};

      try {
        data = await res.json();
      } catch {
        throw new Error("A szerver nem értelmezhető választ adott.");
      }

      if (!res.ok) {
        throw new Error(data.error || "Hiba történt a mentés során.");
      }

      let message = isEditing
        ? "✅ Munka sikeresen módosítva!"
        : "✅ Munka sikeresen létrehozva!";

      if (data.clientCreated) {
        setStatusType("success");
        message += " 👤 Új ügyfél automatikusan létrehozva.";
      } else if (data.clientMatchReason === "missing-name") {
        setStatusType("warning");
        message += " ⚠️ Ügyfél nem készült, mert nincs megadva név.";
      } else {
        setStatusType("warning");
        message += " ⚠️ Az ügyfél már létezett.";
      }

      if (!latitude || !longitude) {
        setStatusType("warning");
        message += " 📍 A cím koordinátája nem volt megtalálható.";
      }

      setStatusMessage(message);
      resetForm();
      await fetchTasks();
    } catch (error) {
      console.error("Munka mentési hiba:", error);
      setStatusType("warning");
      setStatusMessage(
        "❌ " +
          (error instanceof Error
            ? error.message
            : "Hálózati hiba történt.")
      );
    } finally {
      setLoading(false);
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

    const taskType:
      | "telepites"
      | "karbantartas" =
      task.type === "karbantartas"
        ? "karbantartas"
        : "telepites";

    setType(taskType);
    setName(task.name || "");
    setAddress(task.address || "");
    setPhone(task.phone || "");

    let taskEmail =
      task.email || "";

    let taskNote =
      task.note || "";

    if (
      !taskEmail &&
      taskNote.includes("| Email:")
    ) {
      const parts =
        taskNote.split("| Email:");

      taskNote =
        parts[0]?.trim() || "";

      taskEmail =
        parts
          .slice(1)
          .join("| Email:")
          .trim();
    }

    setEmail(taskEmail);
    setNote(taskNote);

    const taskMachines =
      Array.isArray(task.machines) &&
      task.machines.length > 0
        ? task.machines
        : [""];

    setMachines(taskMachines);

    const loadedMachineDetails:
      MachineDetail[] =
        taskMachines.map(
          (_, index) => {
            const savedDetail =
              Array.isArray(
                task.machineDetails
              )
                ? task.machineDetails[
                    index
                  ]
                : undefined;

            let maintenanceType:
              MachineDetail["maintenanceType"] =
                "";

            if (
              taskType ===
                "karbantartas" &&
              (
                savedDetail
                  ?.maintenanceType ===
                  "mosas" ||
                savedDetail
                  ?.maintenanceType ===
                  "fertotlenites"
              )
            ) {
              maintenanceType =
                savedDetail.maintenanceType;
            }

            let warranty:
              boolean | null = null;

            if (
              savedDetail?.warranty ===
              true
            ) {
              warranty = true;
            } else if (
              savedDetail?.warranty ===
              false
            ) {
              warranty = false;
            }

            const invoiced = savedDetail?.invoiced === true;

            return {
              maintenanceType,
              warranty,
              invoiced,
            };
          }
        );

    setMachineDetails(
      loadedMachineDetails
    );

    if (
      task.paymentMethod ===
        "keszpenz" ||
      task.paymentMethod ===
        "atutalas"
    ) {
      setPaymentMethod(
        task.paymentMethod
      );
    } else {
      setPaymentMethod(null);
    }

    setScheduledAt(
      task.scheduled_at
        ? task.scheduled_at
            .replace(" ", "T")
            .slice(0, 16)
        : ""
    );

    setCompletedAt(
      task.completed_at
        ? task.completed_at
            .replace(" ", "T")
            .slice(0, 16)
        : ""
    );

    setPhotos([]);

    setExistingImages(
      Array.isArray(task.images)
        ? task.images
        : []
    );

    if (task.recipient_emails) {
      const savedRecipients =
        task.recipient_emails
          .split(",")
          .map((savedEmail) =>
            savedEmail.trim()
          )
          .filter(Boolean);

      setSelectedRecipients(
        savedRecipients
      );

      setEnvEmails(
        (previousEmails) => {
          const mergedEmails = [
            ...previousEmails,
          ];

          savedRecipients.forEach(
            (savedEmail) => {
              if (
                !mergedEmails.includes(
                  savedEmail
                )
              ) {
                mergedEmails.push(
                  savedEmail
                );
              }
            }
          );

          return mergedEmails;
        }
      );
    } else if (
      envEmails.length > 0
    ) {
      setSelectedRecipients([
        envEmails[0],
      ]);
    } else {
      setSelectedRecipients([]);
    }

    setStatusMessage("");
    setIsFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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
    if (
      filterStatus === "nincsIdopont" &&
      task.scheduled_at
    ) {
      return false;
    }
    if (filterInvoice !== "all") {
  const machineDetails = Array.isArray(task.machineDetails)
    ? task.machineDetails
    : [];

  const hasInvoiceRequired = machineDetails.some(
    (detail) => detail?.warranty === true
  );

  const hasInvoicedMachine = machineDetails.some(
    (detail) => detail?.invoiced === true
  );

  if (filterInvoice === "igen" && !hasInvoiceRequired) {
    return false;
  }

  if (filterInvoice === "kiszamlazva" && !hasInvoicedMachine) {
    return false;
  }

  if (filterInvoice === "nem" && hasInvoiceRequired) {
    return false;
  }
}

    if (scheduledDateFilter) {
      const taskScheduledDate = task.scheduled_at
        ? task.scheduled_at.replace(" ", "T").slice(0, 10)
        : "";

      if (taskScheduledDate !== scheduledDateFilter) {
        return false;
      }
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.trim().toLocaleLowerCase("hu-HU");

      const searchableText = [
        task.id,
        task.type,
        task.name,
        task.address,
        task.phone,
        task.email,
        task.note,
        ...(task.machines || []),
        task.scheduled_at,
        task.completed_at,
        task.created_at,
        task.completed_at ? "kész" : "folyamatban",
        task.type === "telepites" ? "telepítés" : "karbantartás",
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("hu-HU");

      if (!searchableText.includes(q)) {
        return false;
      }
    }

    return true;
  });

  const sortedTasks = [...filteredTasks].sort((firstTask, secondTask) => {
    if (sortOrder === "default") return 0;

    const useScheduledDate =
      sortOrder === "scheduledAsc" || sortOrder === "scheduledDesc";
    const firstDate = useScheduledDate
      ? firstTask.scheduled_at
      : firstTask.completed_at;
    const secondDate = useScheduledDate
      ? secondTask.scheduled_at
      : secondTask.completed_at;

    if (!firstDate && !secondDate) return 0;
    if (!firstDate) return 1;
    if (!secondDate) return -1;

    const firstTime = new Date(firstDate.replace(" ", "T")).getTime();
    const secondTime = new Date(secondDate.replace(" ", "T")).getTime();
    const ascending =
      sortOrder === "scheduledAsc" || sortOrder === "completedAsc";

    return ascending ? firstTime - secondTime : secondTime - firstTime;
  });

  return (
    <div style={{ display: "contents" }}>
      {editingPhotoIndex !== null && photos[editingPhotoIndex] ? (
        <ImageEditor
          file={photos[editingPhotoIndex]}
          onSave={handleSaveEditedPhoto}
          onCancel={() => {
            setEditingPhotoIndex(null);
          }}
        />
      ) : null}

      {/* TELJES KÉPERNYŐS KÉP GALÉRIA MODÁL */}
      {galleryImageIndex !== null && viewingTask?.images && viewingTask.images[galleryImageIndex] && (
        <div
          onClick={closeImageGallery}
          onTouchStart={handleGalleryTouchStart}
          onTouchMove={handleGalleryTouchMove}
          onTouchEnd={handleGalleryTouchEnd}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 4000,
            background: "rgba(0, 0, 0, 0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            boxSizing: "border-box",
            userSelect: "none",
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              closeImageGallery();
            }}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "44px",
              height: "44px",
              fontSize: "20px",
              fontWeight: "bold",
              cursor: "pointer",
              zIndex: 4010,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>

          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              color: "white",
              fontSize: "15px",
              fontWeight: "bold",
              background: "rgba(0,0,0,0.5)",
              padding: "6px 12px",
              borderRadius: "8px",
            }}
          >
            {galleryImageIndex + 1} / {viewingTask.images.length}
          </div>

          {viewingTask.images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                showPreviousGalleryImage();
              }}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.2)",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "48px",
                height: "48px",
                fontSize: "22px",
                fontWeight: "bold",
                cursor: "pointer",
                zIndex: 4010,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ❮
            </button>
          )}

          <img
            src={viewingTask.images[galleryImageIndex]}
            alt={`Galéria kép ${galleryImageIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "100%",
              maxHeight: "85vh",
              objectFit: "contain",
              borderRadius: "8px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
          />

          {viewingTask.images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                showNextGalleryImage();
              }}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.2)",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "48px",
                height: "48px",
                fontSize: "22px",
                fontWeight: "bold",
                cursor: "pointer",
                zIndex: 4010,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ❯
            </button>
          )}
        </div>
      )}

      <main
        style={{
          maxWidth: "1050px",
          margin: "20px auto",
          padding: "16px",
          fontFamily: "Arial, sans-serif",
          boxSizing: "border-box",
        }}
      >
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
         
          .search-calendar-row {
            grid-template-columns: minmax(0, 1fr) minmax(210px, 260px);
          }
          .task-filter-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }

          @media (max-width: 699px) {
            .search-calendar-row {
              grid-template-columns: 1fr !important;
            }
            .task-filter-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
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

        {/* MUNKA RÉSZLETEI MODÁLIS */}
        {viewingTask && (
          <div
            onClick={() => {
              closeImageGallery();
              setViewingTask(null);
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 2000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
              boxSizing: "border-box",
              background: "rgba(0, 0, 0, 0.55)",
            }}
          >
            <div
              onClick={(event) => event.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "560px",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: "20px",
                boxSizing: "border-box",
                borderRadius: "12px",
                background: "white",
                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.25)",
              }}
            >
              {/* FEJLÉC */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  paddingBottom: "10px",
                  marginBottom: "14px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "18px",
                  }}
                >
                  {viewingTask.type === "telepites"
                    ? "🛠️ Telepítés részletei"
                    : "🧹 Karbantartás részletei"}
                </h2>

                <button
                  type="button"
                  onClick={() => {
                    closeImageGallery();
                    setViewingTask(null);
                  }}
                  aria-label="Részletek bezárása"
                  style={{
                    flexShrink: 0,
                    width: "38px",
                    height: "38px",
                    border: "none",
                    borderRadius: "50%",
                    background: "#dc2626",
                    color: "white",
                    fontSize: "18px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>

              {/* MUNKA ADATAI */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  fontSize: "14px",
                  lineHeight: 1.45,
                }}
              >
                <div>
                  <strong>Státusz:</strong>{" "}
                  {viewingTask.completed_at ? "✅ Kész" : "⏳ Folyamatban"}
                </div>

                <div>
                  <strong>Név:</strong> {viewingTask.name || "-"}
                </div>

                <div>
                  <strong>Cím:</strong>{" "}
                  {viewingTask.address ? (
                    <a
                      href={
                        "https://www.google.com/maps/search/?api=1&query=" +
                        encodeURIComponent(viewingTask.address)
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#1d4ed8",
                        textDecoration: "underline",
                        fontWeight: "bold",
                      }}
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
                      style={{
                        color: "#16a34a",
                        textDecoration: "underline",
                        fontWeight: "bold",
                      }}
                    >
                      📞 {viewingTask.phone}
                    </a>
                  ) : (
                    "-"
                  )}
                </div>

                {viewingTask.email && (
                  <div>
                    <strong>Email:</strong>{" "}
                    <a
                      href={`mailto:${viewingTask.email}`}
                      style={{
                        color: "#2563eb",
                        textDecoration: "underline",
                      }}
                    >
                      ✉️ {viewingTask.email}
                    </a>
                  </div>
                )}

                <div style={{ textTransform: "capitalize" }}>
                  <strong>Tervezett időpont:</strong>{" "}
                  📅 {formatDateWithDay(viewingTask.scheduled_at)}
                </div>

                {viewingTask.completed_at && (
                  <div style={{ textTransform: "capitalize" }}>
                    <strong>Megvalósult időpont:</strong>{" "}
                    <span
                      style={{
                        color: "#16a34a",
                        fontWeight: "bold",
                      }}
                    >
                      ✅ {formatDateWithDay(viewingTask.completed_at)}
                    </span>
                  </div>
                )}

                <div>
                  <strong>Létrehozva:</strong>{" "}
                  {formatDateSimple(viewingTask.created_at)}
                </div>

                {Array.isArray(viewingTask.machines) &&
                  viewingTask.machines.filter(
                    (machine) =>
                      typeof machine === "string" &&
                      machine.trim() !== ""
                  ).length > 0 && (
                    <div>
                      <strong>❄️ Klíma típusok:</strong>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "4px",
                          marginTop: "4px",
                        }}
                      >
                        {viewingTask.machines
                          .filter(
                            (machine) =>
                              typeof machine === "string" &&
                              machine.trim() !== ""
                          )
                          .map((machine, index) => (
                            <span
                              key={`view-machine-${index}`}
                              style={{
                                display: "inline-block",
                                background: "#e0f2fe",
                                color: "#0369a1",
                                border: "1px solid #7dd3fc",
                                borderRadius: "6px",
                                padding: "2px 6px",
                                fontSize: "11px",
                                fontWeight: "bold",
                              }}
                            >
                              {machine}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                {Array.isArray(viewingTask.machineDetails) &&
                  viewingTask.machineDetails.some(
                    (detail) => detail?.warranty === true
                  ) && (
                    <div>
                      <strong>📋 Számla:</strong>{" "}
                      {viewingTask.machineDetails.some(
                        (detail) => detail?.invoiced === true
                      )
                        ? "✅ Ki van számlázva"
                        : "⏳ Számlázás szükséges"}
                    </div>
                  )}

                {/* KÉPEK MEGJELENÍTÉSE RÉSZLETEKBEN */}
                {Array.isArray(viewingTask.images) && viewingTask.images.length > 0 && (
                  <div style={{ marginTop: "8px" }}>
                    <strong>📷 Csatolt képek ({viewingTask.images.length}):</strong>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
                        gap: "8px",
                        marginTop: "8px",
                      }}
                    >
                      {viewingTask.images.map((imgUrl, imgIndex) => (
                        <div
                          key={`task-img-${imgIndex}`}
                          onClick={() => setGalleryImageIndex(imgIndex)}
                          style={{
                            aspectRatio: "1 / 1",
                            borderRadius: "8px",
                            overflow: "hidden",
                            border: "1px solid #d1d5db",
                            cursor: "pointer",
                            background: "#f3f4f6",
                          }}
                        >
                          <img
                            src={imgUrl}
                            alt={`Munkakép ${imgIndex + 1}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {viewingTask.note && (
                  <div>
                    <strong>Megjegyzés:</strong>
                    <div
                      style={{
                        marginTop: "4px",
                        color: "#333",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {viewingTask.note}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

{/* KARBANTARTÁSI ELSZÁMOLÁS MODUL */}
<div
  style={{
    marginBottom: "12px",
  }}
>
  <a
    href="/maintenance-summary"
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      padding: "10px 12px",
      boxSizing: "border-box",
      border: "1px solid #15803d",
      borderRadius: "9px",
      background:
        "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
      color: "white",
      textDecoration: "none",
      fontSize: "14px",
      fontWeight: "bold",
      boxShadow:
        "0 3px 8px rgba(21, 128, 61, 0.22)",
    }}
  >
    💰 Karbantartási elszámolás
  </a>
</div>
        
        {/* ÚJ MUNKA / SZERKESZTÉS ŰRLAP */}
        <div
          style={{
            background: "#f8fafc",
           padding: "8px 10px",
            borderRadius: "12px",
            border: "1px solid #cbd5e1",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "6px",
            }}
          >
           <h2
  style={{
    margin: 0,
    fontSize: "15px",
    lineHeight: 1.2,
  }}
>

              {editingTaskId ? "✏️ Munka Szerkesztése" : "➕ Új Munka rögzítése"}
            </h2>

            {isFormOpen && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  background: "#64748b",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "13px",
                }}
              >
                Űrlap Bezárása
              </button>
            )}
          </div>

          {!isFormOpen ? (
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              style={{
                width: "100%",
                padding: "12px",
                background: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              ➕ Új Munka Létrehozása Űrlap Megnyitása
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="form-grid">
              {statusMessage && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    background:
                      statusType === "success" ? "#dcfce7" : "#fef9c3",
                    color:
                      statusType === "success" ? "#166534" : "#854d0e",
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  {statusMessage}
                </div>
              )}

              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Munka típusa:</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "telepites" | "karbantartas")}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                >
                  <option value="telepites">🛠️ Telepítés</option>
                  <option value="karbantartas">🧹 Karbantartás</option>
                </select>
              </div>

              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Név:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ügyfél neve..."
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Cím:</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Irányítószám, város, utca, házszám..."
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Telefon:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+36..."
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ugyfel@email.com..."
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <CustomDateTimePicker
                  label="Tervezett időpont:"
                  value={scheduledAt}
                  onChange={setScheduledAt}
                />
              </div>

              <div>
                <CustomDateTimePicker
                  label="Megvalósult időpont (ha kész):"
                  value={completedAt}
                  onChange={setCompletedAt}
                />
              </div>

              {/* KLÍMAGÉPEK ÉS RÉSZLETEIK */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>Klíma gépek adatai:</label>
                {machines.map((machine, index) => {
                  const detail = machineDetails[index] || {
                    maintenanceType: "",
                    warranty: null,
                    invoiced: false,
                  };

                  return (
                    <div
                      key={`form-machine-${index}`}
                      style={{
                        marginBottom: "12px",
                        padding: "12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "10px",
                        background: "white",
                      }}
                    >
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="text"
                          value={machine}
                          placeholder={`Klíma típusa #${index + 1}`}
                          onChange={(event) => {
                            const updatedMachines = [...machines];
                            updatedMachines[index] = event.target.value;
                            setMachines(updatedMachines);
                          }}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            padding: "10px",
                            border: "1px solid #ccc",
                            borderRadius: "8px",
                            boxSizing: "border-box",
                          }}
                        />

                        {machines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setMachines(machines.filter((_, i) => i !== index));
                              setMachineDetails(machineDetails.filter((_, i) => i !== index));
                            }}
                            style={{
                              flexShrink: 0,
                              padding: "0 12px",
                              border: "none",
                              borderRadius: "8px",
                              background: "#e74c3c",
                              color: "white",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {type === "karbantartas" && completedAt && (
                        <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #e5e7eb" }}>
                          <div style={{ marginBottom: "7px", fontSize: "13px", fontWeight: "bold" }}>🧼 Karbantartás típusa:</div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 10px", border: detail.maintenanceType === "mosas" ? "2px solid #2563eb" : "1px solid #d1d5db", borderRadius: "8px", background: detail.maintenanceType === "mosas" ? "#eff6ff" : "white", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>
                              <input
                                type="radio"
                                name={`form-maintenance-${index}`}
                                checked={detail.maintenanceType === "mosas"}
                                onChange={() => {
                                  const updated = [...machineDetails];
                                  updated[index] = { ...detail, maintenanceType: "mosas" };
                                  setMachineDetails(updated);
                                }}
                              />
                              Mosás
                            </label>

                            <label style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 10px", border: detail.maintenanceType === "fertotlenites" ? "2px solid #7c3aed" : "1px solid #d1d5db", borderRadius: "8px", background: detail.maintenanceType === "fertotlenites" ? "#f5f3ff" : "white", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>
                              <input
                                type="radio"
                                name={`form-maintenance-${index}`}
                                checked={detail.maintenanceType === "fertotlenites"}
                                onChange={() => {
                                  const updated = [...machineDetails];
                                  updated[index] = { ...detail, maintenanceType: "fertotlenites" };
                                  setMachineDetails(updated);
                                }}
                              />
                              Fertőtlenítés
                            </label>
                          </div>
                        </div>
                      )}

                     <div
  style={{
    marginTop: "12px",
    paddingTop: "10px",
    borderTop: "1px solid #e5e7eb",
  }}
>
                        <div style={{ marginBottom: "7px", fontSize: "13px", fontWeight: "bold" }}>📋 Számla szükséges?</div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 10px", border: detail.warranty === true ? "2px solid #16a34a" : "1px solid #d1d5db", borderRadius: "8px", background: detail.warranty === true ? "#f0fdf4" : "white", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>
                            <input
                              type="radio"
                              name={`form-warranty-${index}`}
                              checked={detail.warranty === true}
                              onChange={() => {
                                const updated = [...machineDetails];
                                updated[index] = { ...detail, warranty: true };
                                setMachineDetails(updated);
                              }}
                            />
                            Igen
                          </label>

                          <label style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 10px", border: detail.warranty === false ? "2px solid #dc2626" : "1px solid #d1d5db", borderRadius: "8px", background: detail.warranty === false ? "#fef2f2" : "white", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>
                            <input
                              type="radio"
                              name={`form-warranty-${index}`}
                              checked={detail.warranty === false}
                              onChange={() => {
                                const updated = [...machineDetails];
                                updated[index] = { ...detail, warranty: false };
                                setMachineDetails(updated);
                              }}
                            />
                            Nem
                          </label>
                        </div>

                        {detail.warranty === true && (
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginTop: "10px",
                              padding: "9px 10px",
                              border: detail.invoiced
                                ? "2px solid #2563eb"
                                : "1px solid #d1d5db",
                              borderRadius: "8px",
                              background: detail.invoiced
                                ? "#eff6ff"
                                : "white",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontWeight: "bold",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={detail.invoiced === true}
                              onChange={(event) => {
                                const updated = [...machineDetails];
                                updated[index] = {
                                  ...detail,
                                  invoiced: event.target.checked,
                                };
                                setMachineDetails(updated);
                              }}
                            />
                            ✅ Ki van számlázva
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    setMachines([...machines, ""]);
                    setMachineDetails([...machineDetails, { maintenanceType: "", warranty: null, invoiced: false }]);
                  }}
                  style={{
                    padding: "10px 14px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#2563eb",
                    color: "white",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  ➕ Új gép hozzáadása
                </button>
              </div>

              {/* FIZETÉSI MÓD */}
              <div style={{ gridColumn: "1 / -1", padding: "12px", border: "1px solid #d1d5db", borderRadius: "10px", background: "white" }}>
                <div style={{ marginBottom: "8px", fontWeight: "bold" }}>💳 Fizetési mód:</div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 11px", border: paymentMethod === "keszpenz" ? "2px solid #16a34a" : "1px solid #d1d5db", borderRadius: "8px", background: paymentMethod === "keszpenz" ? "#f0fdf4" : "white", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "keszpenz"}
                      onChange={() => setPaymentMethod("keszpenz")}
                    />
                    Készpénz
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 11px", border: paymentMethod === "atutalas" ? "2px solid #2563eb" : "1px solid #d1d5db", borderRadius: "8px", background: paymentMethod === "atutalas" ? "#eff6ff" : "white", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "atutalas"}
                      onChange={() => setPaymentMethod("atutalas")}
                    />
                    Átutalás
                  </label>
                </div>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Megjegyzés:</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Egyéb részletek..."
                  rows={3}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                />
              </div>

              {/* KÉPEK SZERKESZTÉSE / HOZZÁADÁSA ŰRLAPBAN */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>Képek kezelése:</label>

                {existingImages.map((imgUrl, index) => (
                  <div
                    key={`existing-${index}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "8px",
                      background: "white",
                      padding: "8px",
                      borderRadius: "6px",
                      marginBottom: "6px",
                      border: "1px solid #ccc",
                    }}
                  >
                    <a
                      href={imgUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#2563eb",
                        textDecoration: "underline",
                        fontSize: "13px",
                      }}
                    >
                      📷 Mentett kép #{index + 1}
                    </a>

                    <button
                      type="button"
                      onClick={() => handleRemoveExistingImage(index)}
                      style={{
                        background: "#e74c3c",
                        color: "white",
                        border: "none",
                        padding: "5px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        cursor: "pointer",
                      }}
                    >
                      Törlés
                    </button>
                  </div>
                ))}

                {photos.map((photo, index) => {
                  const previewUrl = URL.createObjectURL(photo);

                  return (
                    <div
                      key={`${photo.name}-${photo.lastModified}-${index}`}
                      style={{
                        background: "white",
                        padding: "8px",
                        borderRadius: "8px",
                        marginBottom: "8px",
                        border: "1px solid #ccc",
                      }}
                    >
                      <img
                        src={previewUrl}
                        alt={`Feltöltött kép ${index + 1}`}
                        style={{
                          display: "block",
                          width: "100%",
                          maxHeight: "220px",
                          objectFit: "contain",
                          borderRadius: "6px",
                          background: "#f3f4f6",
                          marginBottom: "8px",
                        }}
                      />

                      <div style={{ fontSize: "12px", marginBottom: "8px", wordBreak: "break-all" }}>
                        📷 {photo.name}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => setEditingPhotoIndex(index)}
                          style={{
                            background: "#2563eb",
                            color: "white",
                            border: "none",
                            padding: "8px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "12px",
                          }}
                        >
                          ✏️ Rajzolás
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveNewPhoto(index)}
                          style={{
                            background: "#e74c3c",
                            color: "white",
                            border: "none",
                            padding: "8px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "12px",
                          }}
                        >
                          🗑️ Törlés
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "10px" }}>
                  <label
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      background: "#16a34a",
                      color: "white",
                      padding: "11px 8px",
                      borderRadius: "7px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "13px",
                      textAlign: "center",
                    }}
                  >
                    📷 Fényképezés
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleAddPhoto}
                      style={{ display: "none" }}
                    />
                  </label>

                  <label
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      background: "#34495e",
                      color: "white",
                      padding: "11px 8px",
                      borderRadius: "7px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "13px",
                      textAlign: "center",
                    }}
                  >
                    🖼️ Galéria
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAddPhoto}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              </div>

              {/* Email értesítők */}
              <div style={{ gridColumn: "1 / -1", background: "white", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}>
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

              <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ flex: 1, background: loading ? "#ccc" : "#27ae60", color: "white", padding: "12px", fontSize: "15px", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer" }}
                >
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
        <div style={{ marginBottom: "20px" }}>
          <div
            className="search-calendar-row"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(210px, 260px)",
              gap: "10px",
              marginBottom: "12px",
              alignItems: "stretch",
            }}
          >
           <div
  style={{
    position: "relative",
    width: "100%",
    marginBottom: "12px",
  }}
>
  <input
    type="text"
    placeholder="🔍 Keresés név, cím, telefon, email, megjegyzés, státusz vagy azonosító alapján..."
    value={searchQuery}
    onChange={(event) =>
      setSearchQuery(
        event.target.value
      )
    }
    style={{
      width: "100%",
      padding: searchQuery
        ? "10px 42px 10px 12px"
        : "10px 12px",
      borderRadius: "10px",
      border:
        "1px solid #4b5563",
      boxSizing: "border-box",
      fontSize: "14px",
      background: "#1f2937",
      color: "white",
      outline: "none",
    }}
  />

  {searchQuery && (
    <button
      type="button"
      onClick={() =>
        setSearchQuery("")
      }
      aria-label="Keresés törlése"
      title="Keresés törlése"
      style={{
        position: "absolute",
        top: "50%",
        right: "8px",
        transform:
          "translateY(-50%)",
        width: "28px",
        height: "28px",
        display: "flex",
        alignItems: "center",
        justifyContent:
          "center",
        padding: 0,
        border:
          "1px solid #64748b",
        borderRadius: "50%",
        background: "#374151",
        color: "#f8fafc",
        fontSize: "17px",
        fontWeight: "bold",
        lineHeight: 1,
        cursor: "pointer",
      }}
    >
      ×
    </button>
  )}
</div>

            <div
              style={{
                display: "flex",
                gap: "6px",
                padding: "5px",
                borderRadius: "10px",
                border: "1px solid #4b5563",
                background: "#1f2937",
                boxSizing: "border-box",
              }}
            >
              <div style={{ position: "relative", flex: "1" }}>
                <input
                  type={scheduledDateFilter ? "date" : "text"}
                  value={scheduledDateFilter}
                  placeholder="📅 Dátum választása"
                  onFocus={(e) => {
                    e.target.type = "date";
                  }}
                  onBlur={(e) => {
                    if (!e.target.value) {
                      e.target.type = "text";
                    }
                  }}
                  onChange={(event) =>
                    setScheduledDateFilter(event.target.value)
                  }
                  title="Keresés a tervezett időpontok között"
                  aria-label="Tervezett időpont szűrése"
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    borderRadius: "7px",
                    border: "1px solid #64748b",
                    background: "white",
                    color: "#111827",
                    fontSize: "13px",
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const year = today.getFullYear();
                  const month = String(today.getMonth() + 1).padStart(2, "0");
                  const day = String(today.getDate()).padStart(2, "0");
                  setScheduledDateFilter(`${year}-${month}-${day}`);
                }}
                title="Mai tervezett feladatok"
                style={{
                  border: "none",
                  borderRadius: "7px",
                  padding: "6px 9px",
                  background: "#2563eb",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "12px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Ma
              </button>

              {scheduledDateFilter && (
                <button
                  type="button"
                  onClick={() => setScheduledDateFilter("")}
                  title="Dátumszűrés törlése"
                  style={{
                    border: "none",
                    borderRadius: "7px",
                    padding: "6px 9px",
                    background: "#dc2626",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div
            style={{
              background: "#111827",
              color: "white",
              borderRadius: "10px",
              padding: "10px 14px",
              marginBottom: "12px",
              border: "1px solid #374151",
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            📊 Találatok száma: {sortedTasks.length}
            {scheduledDateFilter && (
              <span style={{ marginLeft: "8px", color: "#93c5fd", fontSize: "13px" }}>
                📅 {scheduledDateFilter}
              </span>
            )}
          </div>

          <div
            className="task-filter-grid"
            style={{
              background: "#1f2937",
              borderRadius: "10px",
              padding: "8px",
              border: "1px solid #374151",
              boxShadow: "0 1px 4px rgba(0,0,0,0.20)",
              display: "grid",
              gap: "8px",
            }}
          >
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                minWidth: 0,
              }}
            >
              <span style={{ fontSize: "10px", fontWeight: "bold", color: "#d1d5db" }}>
                Munka típusa
              </span>
              <select
                value={filterType}
                onChange={(event) =>
                  setFilterType(
                    event.target.value as "all" | "telepites" | "karbantartas"
                  )
                }
                style={{
                  width: "100%",
                  minWidth: 0,
                  padding: "7px 5px",
                  borderRadius: "7px",
                  border: "1px solid #4b5563",
                  background: "#34495e",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "bold",
                  boxSizing: "border-box",
                }}
              >
                <option value="all">Összes ({tasks.length})</option>
                <option value="telepites">
                  Telepítés ({tasks.filter((task) => task.type === "telepites").length})
                </option>
                <option value="karbantartas">
                  Karbantartás ({tasks.filter((task) => task.type === "karbantartas").length})
                </option>
              </select>
            </label>

            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                minWidth: 0,
              }}
            >
              <span style={{ fontSize: "10px", fontWeight: "bold", color: "#d1d5db" }}>
                Státusz
              </span>
              <select
                value={filterStatus}
                onChange={(event) =>
                  setFilterStatus(
                    event.target.value as
                      | "all"
                      | "folyamatban"
                      | "kesz"
                      | "nincsIdopont"
                  )
                }
                style={{
                  width: "100%",
                  minWidth: 0,
                  padding: "7px 5px",
                  borderRadius: "7px",
                  border: "1px solid #4b5563",
                  background: "#34495e",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "bold",
                  boxSizing: "border-box",
                }}
              >
                <option value="all">Minden</option>
                <option value="folyamatban">
                  Folyamatban ({tasks.filter((task) => !task.completed_at).length})
                </option>
                <option value="kesz">
                  Kész ({tasks.filter((task) => task.completed_at).length})
                </option>
                <option value="nincsIdopont">
                  Nincs időpont ({tasks.filter((task) => !task.scheduled_at).length})
                </option>
              </select>
            </label>

            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                minWidth: 0,
              }}
            >
              <span style={{ fontSize: "10px", fontWeight: "bold", color: "#d1d5db" }}>
                Számla
              </span>
              <select
                value={filterInvoice}
                onChange={(event) =>
                  setFilterInvoice(
                    event.target.value as
                      | "all"
                      | "igen"
                      | "kiszamlazva"
                      | "nem"
                  )
                }
                style={{
                  width: "100%",
                  minWidth: 0,
                  padding: "7px 5px",
                  borderRadius: "7px",
                  border: "1px solid #4b5563",
                  background: "#34495e",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "bold",
                  boxSizing: "border-box",
                }}
              >
                <option value="all">Mind</option>
                <option value="igen">Szükséges</option>
                <option value="kiszamlazva">Kiszámlázva</option>
                <option value="nem">Nem kell</option>
              </select>
            </label>

            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                minWidth: 0,
              }}
            >
              <span style={{ fontSize: "10px", fontWeight: "bold", color: "#d1d5db" }}>
                Sorrend
              </span>
              <select
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(
                    event.target.value as
                      | "default"
                      | "scheduledAsc"
                      | "scheduledDesc"
                      | "completedAsc"
                      | "completedDesc"
                  )
                }
                style={{
                  width: "100%",
                  minWidth: 0,
                  padding: "7px 5px",
                  borderRadius: "7px",
                  border: "1px solid #4b5563",
                  background: "#34495e",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "bold",
                  boxSizing: "border-box",
                }}
              >
                <option value="default">Alapértelmezett</option>
                <option value="scheduledAsc">Tervezett: legrégebbi elöl</option>
                <option value="scheduledDesc">Tervezett: legújabb elöl</option>
                <option value="completedAsc">Megvalósult: legrégebbi elöl</option>
                <option value="completedDesc">Megvalósult: legújabb elöl</option>
              </select>
            </label>
          </div>
        </div>

        {/* TÉRKÉP NÉZET VÁLTÓ */}
        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={() => setShowMap(!showMap)}
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "10px",
              background: "#4285f4",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            {showMap ? "📋 Lista nézet" : "🗺️ Térkép nézet"}
          </button>
        </div>

        {showMap && (
          <TasksMap
            tasks={sortedTasks}
            onTaskSelect={(taskId) => {
              setShowMap(false);
              setSelectedTaskId(taskId);

              setTimeout(() => {
                const card = document.getElementById(`task-card-${taskId}`);

                if (card) {
                  card.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }
              }, 300);
            }}
          />
        )}

        {/* LISTA KÁRTYÁK */}
        <div className="cards-grid">
          {sortedTasks.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#666", background: "#f9f9f9", borderRadius: "10px" }}>
              Nincs találat a megadott feltételek alapján.
            </div>
          ) : (
            sortedTasks.map((task) => {
              const isTelepites = task.type === "telepites";
              const borderColor = isTelepites ? "#34495e" : "#d35400";

              return (
                <div
                  id={"task-card-" + task.id}
                  key={task.id}
                  style={{
                    background: selectedTaskId === task.id ? "#fff8d6" : "#fff",
                    border: selectedTaskId === task.id ? "2px solid #f39c12" : "1px solid #ddd",
                    borderLeft: `6px solid ${borderColor}`,
                    borderRadius: "10px",
                    padding: "10px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    boxShadow: selectedTaskId === task.id ? "0 0 15px rgba(243,156,18,0.65)" : "0 2px 5px rgba(0,0,0,0.05)",
                    transition: "all 0.3s ease",
                    scrollMarginTop: "30px",
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

                  {Array.isArray(task.machines) &&
                    task.machines.filter(
                      (machine) =>
                        typeof machine === "string" &&
                        machine.trim() !== ""
                    ).length > 0 && (
                      <div>
                        <strong>❄️ Klíma típusok:</strong>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "4px",
                            marginTop: "2px",
                          }}
                        >
                          {task.machines
                            .filter(
                              (machine) =>
                                typeof machine === "string" &&
                                machine.trim() !== ""
                            )
                            .map((machine, index) => (
                              <span
                                key={`${task.id}-machine-${index}`}
                                style={{
                                  display: "inline-block",
                                  background: "#e0f2fe",
                                  color: "#0369a1",
                                  border: "1px solid #7dd3fc",
                                  borderRadius: "6px",
                                  padding: "2px 6px",
                                  fontSize: "11px",
                                  fontWeight: "bold",
                                }}
                              >
                                {machine}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                  {task.note && (
                    <div>
                      <strong>Megjegyzés:</strong>
                      <div
                        style={{
                          marginTop: "4px",
                          color: "#555",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {task.note}
                      </div>
                    </div>
                  )}

                  <div style={{ textTransform: "capitalize" }}>
                    <strong>Tervezett időpont:</strong>{" "}
                    {formatDateWithDay(task.scheduled_at)}
                  </div>

                  {task.completed_at && (
                    <div style={{ textTransform: "capitalize" }}>
                      <strong>Megvalósult időpont:</strong>{" "}
                      <span
                        style={{
                          color: "#16a34a",
                          fontWeight: "bold",
                        }}
                      >
                        ✅ {formatDateWithDay(task.completed_at)}
                      </span>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: "5px",
                      marginTop: "4px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        closeImageGallery();
                        setViewingTask(task);
                      }}
                      style={{
                        padding: "5px 9px",
                        background: "#2980b9",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      🔍 Részletek
                    </button>
                    <button onClick={() => startEditing(task)} style={{ padding: "5px 9px", background: "#f39c12", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>✏️ Szerkesztés</button>
                    <button onClick={() => handleDelete(task.id)} style={{ padding: "5px 9px", background: "#e74c3c", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>🗑️ Törlés</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
