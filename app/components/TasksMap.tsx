"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google: any;
  }
}

export default function TasksMap({
  tasks,
}: {
  tasks: any[];
}) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apiKey =
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error("Hiányzik a Google Maps API kulcs");
      return;
    }

    const initMap = async () => {
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

      console.log(tasks);

      for (const task of tasks) {
        if (!task.address) continue;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              task.address + ", Hungary"
            )}`
          );

          const data = await response.json();

          if (!data.length) continue;

          const lat = Number(data[0].lat);
          const lng = Number(data[0].lon);

          const marker =
            new window.google.maps.Marker({
              map,
              position: {
                lat,
                lng,
              },
              title: task.name || "Feladat",
            });

          const infoWindow =
            new window.google.maps.InfoWindow({
              content: `
                <div style="min-width:250px">
                  <h3>${task.name || "-"}</h3>

                  <p>
                    <b>Cím:</b><br>
                    ${task.address || "-"}
                  </p>

                  <p>
                    <b>Telefon:</b><br>
                    ${task.phone || "-"}
                  </p>

                  <p>
                    <b>Email:</b><br>
                    ${task.email || "-"}
                  </p>

                  <p>
                    <b>Státusz:</b>
                    ${
                      task.completed_at
                        ? "✅ Kész"
                        : "⏳ Folyamatban"
                    }
                  </p>
                </div>
              `,
            });

          marker.addListener("click", () => {
            infoWindow.open({
              anchor: marker,
              map,
            });
          });
        } catch (error) {
          console.error(
            "Geokódolási hiba",
            task.address,
            error
          );
        }
      }
    };

    const existingScript =
      document.getElementById(
        "google-maps-script"
      );

    if (existingScript) {
      initMap();
      return;
    }

    const script =
      document.createElement("script");

    script.id = "google-maps-script";

    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;

    script.async = true;

    script.onload = initMap;

   
