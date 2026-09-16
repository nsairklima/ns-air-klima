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

    const initMap = () => {
      if (!window.google || !mapRef.current) {
        return;
      }

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

    console.log(tasks[0]);

if (tasks.length > 0 && tasks[0].address) {
  fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      tasks[0].address + ", Hungary"
    )}`
  )
    .then((res) => res.json())
    .then((data) => {
      if (!data.length) return;

      const lat = Number(data[0].lat);
      const lng = Number(data[0].lon);

      new window.google.maps.Marker({
        map,
        position: {
          lat,
          lng,
        },
        title: tasks[0].name || "Feladat",
      });

      map.setCenter({
        lat,
        lng,
      });

      map.setZoom(14);
    });
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

    document.body.appendChild(script);
  }, []);

  return (
    <div>
      <div
        style={{
          marginBottom: "10px",
          fontWeight: "bold",
        }}
      >
        Feladatok száma: {tasks.length}
      </div>

      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "600px",
          borderRadius: "10px",
          border: "1px solid #ddd",
        }}
      />
    </div>
  );
}

