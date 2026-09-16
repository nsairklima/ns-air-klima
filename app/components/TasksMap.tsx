"use client";

import { useEffect, useRef } from "react";

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
};

declare global {
  interface Window {
    google: any;
    initTasksMap: () => void;
  }
}

export default function TasksMap({
  tasks,
}: {
  tasks: Task[];
}) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apiKey =
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error("Google Maps API kulcs hiányzik");
      return;
    }

    const existingScript = document.getElementById(
      "google-maps-script"
    );

    const buildMap = async () => {
      if (!window.google || !mapRef.current) return;

      const map = new window.google.maps.Map(
        mapRef.current,
        {
          center: {
            lat: 47.4979,
            lng: 19.0402,
          },
          zoom: 7,
        }
      );

      const bounds =
        new window.google.maps.LatLngBounds();

      const geocoder =
        new window.google.maps.Geocoder();

      for (const task of tasks) {
        if (!task.address) continue;

        geocoder.geocode(
          {
            address: task.address,
          },
          (results: any, status: string) => {
            if (
              status !== "OK" ||
              !results ||
              !results[0]
            )
              return;

            const location =
              results[0].geometry.location;

            bounds.extend(location);

            const marker =
              new window.google.maps.Marker({
                map,
                position: location,
                title: task.name || "Feladat",
              });

            const infoWindow =
              new window.google.maps.InfoWindow({
                content: `
<div style="min-width:250px;">
<h3>${task.name || "-"}</h3>

<p><strong>Típus:</strong>
${
  task.type === "telepites"
    ? "Telepítés"
    : "Karbantartás"
}
</p>

<p><strong>Cím:</strong><br>
${task.address || "-"}
</p>

<p><strong>Telefon:</strong><br>
${task.phone || "-"}
</p>

<p><strong>Email:</strong><br>
${task.email || "-"}
</p>

<p><strong>Megjegyzés:</strong><br>
${task.note || "-"}
</p>

<p>
<strong>Státusz:</strong>
${
  task.completed_at
    ? "✅ Kész"
    : "⏳ Folyamatban"
}
</p>
</div>
`,
              });

            marker.addListener(
              "click",
              () => {
                infoWindow.open({
                  anchor: marker,
                  map,
                })
