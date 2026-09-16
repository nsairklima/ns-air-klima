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
  
const fullAddress = tasks[0].address.trim();

const firstSpaceIndex = fullAddress.indexOf(" ");

const city =
  firstSpaceIndex > 0
    ? fullAddress.slice(0, firstSpaceIndex)
    : fullAddress;

const street =
  firstSpaceIndex > 0
    ? fullAddress.slice(firstSpaceIndex + 1)
    : "";

const searchAddress = street
  ? `${street}, ${city}`
  : city;

console.log("EREDETI CÍM:", fullAddress);
console.log("KERESÉSI CÍM:", searchAddress);

const searchUrl =
  "https://nominatim.openstreetmap.org/search" +
  "?format=jsonv2" +
  "&limit=1" +
  "&countrycodes=hu" +
  "&q=" +
  encodeURIComponent(searchAddress);

fetch(searchUrl, {
  headers: {
    Accept: "application/json",
  },
})
  .then((response) => {
    if (!response.ok) {
      throw new Error(
        `Nominatim HTTP hiba: ${response.status}`
      );
    }

    return response.json();
  })
  .then((data) => {
    console.log("NOMINATIM TALÁLAT:", data);

    if (!Array.isArray(data) || data.length === 0) {
      console.error(
        "A cím nem található:",
        searchAddress
      );
      return;
    }

    const lat = Number(data[0].lat);
    const lng = Number(data[0].lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      console.error(
        "Hibás koordináták:",
        data[0]
      );
      return;
    }

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

    map.setZoom(16);
  })
  .catch((error) => {
    console.error(
      "Címkeresési hiba:",
      error
    );
  });


