"use client";

import { useEffect, useRef, useState } from "react";

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
  created_at?: string;
  latitude?: number | null;
  longitude?: number | null;
};

type Coordinates = { lat: number; lng: number };
type MissingTask = { id: number; name?: string; address?: string };

declare global {
  interface Window {
    google: any;
  }
}

function escapeHtml(value?: string) {
  if (!value) return "-";
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value?: string) {
  if (!value) return "-";
  try {
    const normalized = value.replace("T", " ").slice(0, 19);
    const [datePart, timePart = "00:00"] = normalized.split(" ");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute] = timePart.split(":").map(Number);
    const date = new Date(year, month - 1, day, hour || 0, minute || 0);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("hu-HU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return value;
  }
}

function getCoordinates(task: Task): Coordinates | null {
  const lat = Number(task.latitude);
  const lng = Number(task.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) {
    return null;
  }
  return { lat, lng };
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (window.google?.maps) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.getElementById("google-maps-script") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Maps betöltési hiba")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps betöltési hiba"));
    document.head.appendChild(script);
  });
}

export default function TasksMap({
  tasks,
  onTaskSelect,
}: {
  tasks: Task[];
  onTaskSelect: (taskId: number) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const onTaskSelectRef = useRef(onTaskSelect);
  const [loadingText, setLoadingText] = useState("");
  const [markerCount, setMarkerCount] = useState(0);
  const [missingTasks, setMissingTasks] = useState<MissingTask[]>([]);
  const [showMissing, setShowMissing] = useState(false);

  useEffect(() => {
    onTaskSelectRef.current = onTaskSelect;
  }, [onTaskSelect]);

  useEffect(() => {
    let cancelled = false;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setLoadingText("Hiányzik a Google Maps API-kulcs.");
      return;
    }

    setLoadingText("Térkép betöltése...");

    void loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !mapRef.current || !window.google?.maps) return;

        const valid = tasks
          .map((task) => ({ task, coordinates: getCoordinates(task) }))
          .filter(
            (item): item is { task: Task; coordinates: Coordinates } =>
              item.coordinates !== null
          );

        const missing = tasks
          .filter((task) => getCoordinates(task) === null)
          .map((task) => ({ id: task.id, name: task.name, address: task.address }));

        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 47.6875, lng: 17.6504 },
          zoom: 8,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
        });

        const bounds = new window.google.maps.LatLngBounds();
        let openedInfoWindow: any = null;

        valid.forEach(({ task, coordinates }) => {
          const marker = new window.google.maps.Marker({
            map,
            position: coordinates,
            title: task.name || task.address || "Feladat",
          });

          bounds.extend(coordinates);

          const typeLabel =
            task.type === "telepites" ? "🛠️ Telepítés" : "🧹 Karbantartás";
          const statusLabel = task.completed_at ? "✅ Kész" : "⏳ Folyamatban";
          const mapsQuery = task.address?.trim() || `${coordinates.lat},${coordinates.lng}`;
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;
          const imageLinks = task.images?.length
            ? task.images
                .map(
                  (url, index) =>
                    `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">🖼️ ${index + 1}. kép</a>`
                )
                .join(" ")
            : "Nincs csatolt kép";

          const content = `
            <div style="width:280px;max-width:calc(100vw - 90px);font-family:Arial,sans-serif;font-size:13px;line-height:1.45;color:#222">
              <div style="font-size:16px;font-weight:bold;border-bottom:1px solid #ddd;padding-bottom:7px;margin-bottom:8px">${typeLabel}</div>
              <p><strong>Azonosító:</strong> #${task.id}</p>
              <p><strong>Státusz:</strong> ${statusLabel}</p>
              <p><strong>Név:</strong> ${escapeHtml(task.name)}</p>
              <p><strong>Cím:</strong><br>${escapeHtml(task.address)}</p>
              <p><strong>Telefon:</strong><br>${escapeHtml(task.phone)}</p>
              <p><strong>Email:</strong><br>${escapeHtml(task.email)}</p>
              <p><strong>Tervezett időpont:</strong><br>${escapeHtml(formatDate(task.scheduled_at))}</p>
              <p><strong>Megvalósult időpont:</strong><br>${escapeHtml(formatDate(task.completed_at))}</p>
              <p><strong>Megjegyzés:</strong><br>${escapeHtml(task.note)}</p>
              <p><strong>Képek:</strong><br>${imageLinks}</p>
              <a href="${escapeHtml(mapsUrl)}" target="_blank" rel="noopener noreferrer">📍 Megnyitás Google Mapsben</a>
              <br><br>
              <button type="button" data-task-id="${task.id}" style="width:100%;padding:8px;background:#2980b9;color:white;border:0;border-radius:6px;cursor:pointer;font-weight:bold">📋 Ugrás a feladathoz</button>
            </div>`;

          const infoWindow = new window.google.maps.InfoWindow({ content });

          marker.addListener("click", () => {
            openedInfoWindow?.close();
            infoWindow.open({ anchor: marker, map });
            openedInfoWindow = infoWindow;

            window.setTimeout(() => {
              const button = document.querySelector(`[data-task-id="${task.id}"]`);
              button?.addEventListener(
                "click",
                () => onTaskSelectRef.current(task.id),
                { once: true }
              );
            }, 0);
          });
        });

        if (valid.length === 1) {
          map.setCenter(bounds.getCenter());
          map.setZoom(16);
        } else if (valid.length > 1) {
          map.fitBounds(bounds, 60);
        }

        setMarkerCount(valid.length);
        setMissingTasks(missing);
        setLoadingText(valid.length ? "" : "Nincs eltárolt koordinátával rendelkező feladat.");
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setLoadingText("A Google Maps nem tölthető be.");
      });

    return () => {
      cancelled = true;
    };
  }, [tasks]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "10px",
          fontSize: "13px",
          fontWeight: "bold",
        }}
      >
        <span style={{ background: "#eaf2f8", padding: "7px 10px", borderRadius: "7px" }}>
          Szűrt feladatok: {tasks.length}
        </span>
        <span
          style={{
            background: "#eafaf1",
            color: "#1e8449",
            padding: "7px 10px",
            borderRadius: "7px",
          }}
        >
          Jelölők: {markerCount}
        </span>
        {missingTasks.length > 0 && (
          <button
            type="button"
            onClick={() => setShowMissing((value) => !value)}
            style={{
              background: "#fef5e7",
              color: "#9c640c",
              padding: "7px 10px",
              borderRadius: "7px",
              border: "1px solid #f0b56b",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            ⚠️ Nincs koordináta: {missingTasks.length} {showMissing ? "▲" : "▼"}
          </button>
        )}
      </div>

      {showMissing && missingTasks.length > 0 && (
        <div
          style={{
            marginBottom: "12px",
            padding: "12px",
            background: "#fff3f3",
            border: "1px solid #f5b7b1",
            borderRadius: "8px",
            fontSize: "13px",
          }}
        >
          <strong>Koordináta nélküli feladatok:</strong>
          {missingTasks.map((item) => (
            <div key={item.id} style={{ marginTop: "7px" }}>
              #{item.id} | {item.name || "Név nélkül"} | {item.address || "Nincs cím"}
            </div>
          ))}
        </div>
      )}

      {loadingText && (
        <div
          style={{
            marginBottom: "10px",
            padding: "10px",
            borderRadius: "8px",
            background: "#fff8e1",
            color: "#7d6608",
            fontWeight: "bold",
          }}
        >
          📍 {loadingText}
        </div>
      )}

      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "600px",
          borderRadius: "10px",
          border: "1px solid #ddd",
          overflow: "hidden",
        }}
      />
    </div>
  );
}
