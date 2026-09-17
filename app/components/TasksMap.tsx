"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

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

type NotFoundTask = {
  id: number;
  name?: string;
  address?: string;
};

type Coordinates = {
  lat: number;
  lng: number;
};

declare global {
  interface Window {
    google: any;
  }
}

function escapeHtml(value?: string) {
  if (!value) {
    return "-";
  }

  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(
      resolve,
      milliseconds
    );
  });
}

function formatDate(dateString?: string) {
  if (!dateString) {
    return "-";
  }

  try {
    const normalizedValue = dateString
      .replace("T", " ")
      .slice(0, 19);

    const [datePart, timePart] =
      normalizedValue.split(" ");

    if (!datePart) {
      return dateString;
    }

    const [year, month, day] =
      datePart
        .split("-")
        .map(Number);

    const [hour, minute] =
      (timePart || "00:00")
        .split(":")
        .map(Number);

    const date = new Date(
      year,
      month - 1,
      day,
      hour || 0,
      minute || 0
    );

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return new Intl.DateTimeFormat(
      "hu-HU",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(date);
  } catch {
    return dateString;
  }
}

function normalizeAddress(address: string) {
  return address
    .trim()
    .toLocaleLowerCase("hu-HU")
    .replace(/\s+/g, " ");
}

function createSearchVariants(
  address: string
) {
  const cleanAddress = address
    .trim()
    .replace(/\s+/g, " ");

  if (!cleanAddress) {
    return [];
  }

  const firstSpaceIndex =
    cleanAddress.indexOf(" ");

  if (firstSpaceIndex === -1) {
    return [
      cleanAddress,
      cleanAddress + ", Magyarország",
    ];
  }

  const city = cleanAddress.slice(
    0,
    firstSpaceIndex
  );

  const street = cleanAddress.slice(
    firstSpaceIndex + 1
  );

  return Array.from(
    new Set([
      cleanAddress,
      cleanAddress + ", Magyarország",
      street + ", " + city,
      street +
        ", " +
        city +
        ", Magyarország",
      city + ", Magyarország",
    ])
  );
}

function getSavedCoordinates(
  task: Task
): Coordinates | null {
  const latitude =
    task.latitude === null ||
    task.latitude === undefined ||
    task.latitude === ""
      ? Number.NaN
      : Number(task.latitude);

  const longitude =
    task.longitude === null ||
    task.longitude === undefined ||
    task.longitude === ""
      ? Number.NaN
      : Number(task.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude === 0 ||
    longitude === 0
  ) {
    return null;
  }

  return {
    lat: latitude,
    lng: longitude,
  };
}

async function findCoordinates(
  address: string
): Promise<Coordinates | null> {
  const normalizedAddress =
    normalizeAddress(address);

  if (!normalizedAddress) {
    return null;
  }

  const cacheKey =
    "tasks-map-coordinate-" +
    normalizedAddress;

  const cachedValue =
    window.localStorage.getItem(
      cacheKey
    );

  if (cachedValue) {
    try {
      const cachedCoordinates =
        JSON.parse(
          cachedValue
        ) as Coordinates;

      if (
        Number.isFinite(
          cachedCoordinates.lat
        ) &&
        Number.isFinite(
          cachedCoordinates.lng
        ) &&
        cachedCoordinates.lat !== 0 &&
        cachedCoordinates.lng !== 0
      ) {
        return cachedCoordinates;
      }
    } catch {
      window.localStorage.removeItem(
        cacheKey
      );
    }
  }

  const searchVariants =
    createSearchVariants(address);

  for (
    let index = 0;
    index < searchVariants.length;
    index += 1
  ) {
    const searchAddress =
      searchVariants[index];

    const baseUrl =
      "https:" +
      "//nominatim.openstreetmap.org/search";

    const searchUrl =
      baseUrl +
      "?format=jsonv2" +
      "&limit=1" +
      "&countrycodes=hu" +
      "&addressdetails=1" +
      "&q=" +
      encodeURIComponent(searchAddress);

    try {
      const response = await fetch(
        searchUrl,
        {
          method: "GET",
          headers: {
            Accept:
              "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(
          "Nominatim HTTP hiba:",
          response.status,
          searchAddress
        );

        if (
          response.status === 403 ||
          response.status === 429
        ) {
          return null;
        }

        continue;
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
        console.error(
          "A címkereső nem JSON választ adott:",
          searchAddress
        );

        return null;
      }

      const data =
        await response.json();

      if (
        !Array.isArray(data) ||
        data.length === 0
      ) {
        continue;
      }

      const lat =
        Number(data[0].lat);

      const lng =
        Number(data[0].lon);

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
      ) {
        continue;
      }

      const coordinates: Coordinates = {
        lat,
        lng,
      };

      window.localStorage.setItem(
        cacheKey,
        JSON.stringify(coordinates)
      );

      return coordinates;
    } catch (error) {
      console.error(
        "Címkeresési hiba:",
        searchAddress,
        error
      );
    }

    if (
      index <
      searchVariants.length - 1
    ) {
      await wait(1100);
    }
  }

  return null;
}

export default function TasksMap({
  tasks,
  onTaskSelect,
}: {
  tasks: Task[];
  onTaskSelect: (
    taskId: number
  ) => void;
}) {
  const mapRef =
    useRef<HTMLDivElement>(null);

  const onTaskSelectRef =
    useRef(onTaskSelect);

  const [loadingText, setLoadingText] =
    useState("");

  const [markerCount, setMarkerCount] =
    useState(0);

  const [
    notFoundAddresses,
    setNotFoundAddresses,
  ] = useState<NotFoundTask[]>([]);

  const [
    showNotFoundAddresses,
    setShowNotFoundAddresses,
  ] = useState(false);

  useEffect(() => {
    onTaskSelectRef.current =
      onTaskSelect;
  }, [onTaskSelect]);

  useEffect(() => {
    let cancelled = false;

    const apiKey =
      process.env
        .NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setLoadingText(
        "Hiányzik a Google Maps API-kulcs."
      );

      return;
    }

    const initializeMap = async () => {
      if (
        cancelled ||
        !window.google?.maps ||
        !mapRef.current
      ) {
        return;
      }

      setMarkerCount(0);
      setNotFoundAddresses([]);
      setShowNotFoundAddresses(false);

      const map =
        new window.google.maps.Map(
          mapRef.current,
          {
            center: {
              lat: 47.6875,
              lng: 17.6504,
            },
            zoom: 8,
            streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: true,
          }
        );

      const bounds =
        new window.google.maps
          .LatLngBounds();

      const tasksWithLocation =
        tasks.filter((task) => {
          return Boolean(
            getSavedCoordinates(task) ||
              task.address?.trim()
          );
        });

      if (
        tasksWithLocation.length === 0
      ) {
        setLoadingText(
          "A jelenlegi szűrésben nincs megadott cím vagy koordináta."
        );

        return;
      }

      let successfulMarkers = 0;

      let failedTasks:
        NotFoundTask[] = [];

      let openedInfoWindow:
        any = null;

      let fallbackSearches = 0;

      for (
        let index = 0;
        index <
        tasksWithLocation.length;
        index += 1
      ) {
        if (cancelled) {
          return;
        }

        const task =
          tasksWithLocation[index];

        setLoadingText(
          "Térkép feldolgozása: " +
            (index + 1) +
            " / " +
            tasksWithLocation.length
        );

        /*
         * Elsőként az adatbázisban mentett
         * koordinátát használjuk.
         */
        let coordinates =
          getSavedCoordinates(task);

        /*
         * Csak a régi, koordináta nélküli
         * feladatokat keressük meg cím alapján.
         */
        if (
          !coordinates &&
          task.address?.trim()
        ) {
          if (fallbackSearches > 0) {
            await wait(1100);
          }

          if (cancelled) {
            return;
          }

          coordinates =
            await findCoordinates(
              task.address
            );

          fallbackSearches += 1;
        }

        if (cancelled) {
          return;
        }

        if (!coordinates) {
          const failedTask:
            NotFoundTask = {
              id: task.id,
              name: task.name,
              address: task.address,
            };

          failedTasks = [
            ...failedTasks,
            failedTask,
          ];

          setNotFoundAddresses(
            failedTasks
          );

          console.warn(
            "A címhez nem található koordináta:",
            task.address
          );

          continue;
        }

        const marker =
          new window.google.maps.Marker(
            {
              map,
              position: coordinates,
              title:
                task.name ||
                task.address ||
                "Feladat",
            }
          );

        bounds.extend(coordinates);

        successfulMarkers += 1;

        setMarkerCount(
          successfulMarkers
        );

        const taskType =
          task.type === "telepites"
            ? "🛠️ Telepítés"
            : "🧹 Karbantartás";

        const taskStatus =
          task.completed_at
            ? "✅ Kész"
            : "⏳ Folyamatban";

        const imageLinks =
          task.images &&
          task.images.length > 0
            ? task.images
                .map(
                  (
                    imageUrl,
                    imageIndex
                  ) => {
                    const safeImageUrl =
                      escapeHtml(
                        imageUrl
                      );

                    return (
                      '' +
                      safeImageUrl +
                      '' +
                      "🖼️ " +
                      (imageIndex + 1) +
                      ". kép" +
                      "</a>"
                    );
                  }
                )
                .join(" ")
            : "Nincs csatolt kép";

        const mapsQuery =
          task.address?.trim()
            ? task.address
            : coordinates.lat +
              "," +
              coordinates.lng;

        const googleMapsSearchUrl =
          "https:" +
          "//www.google.com/maps/search/" +
          "?api=1&query=" +
          encodeURIComponent(
            mapsQuery
          );

        const infoContent =
          '<div style="' +
          "width:280px;" +
          "max-width:calc(100vw - 90px);" +
          "font-family:Arial,sans-serif;" +
          "font-size:13px;" +
          "line-height:1.45;" +
          'color:#222;">' +

          '<div style="' +
          "font-size:16px;" +
          "font-weight:bold;" +
          "border-bottom:1px solid #ddd;" +
          "padding-bottom:7px;" +
          'margin-bottom:8px;">' +
          taskType +
          "</div>" +

          "<p><strong>Azonosító:</strong> #" +
          task.id +
          "</p>" +

          "<p><strong>Státusz:</strong> " +
          taskStatus +
          "</p>" +

          "<p><strong>Név:</strong> " +
          escapeHtml(task.name) +
          "</p>" +

          "<p><strong>Cím:</strong><br>" +
          escapeHtml(task.address) +
          "</p>" +

          "<p><strong>Telefon:</strong><br>" +
          escapeHtml(task.phone) +
          "</p>" +

          "<p><strong>Email:</strong><br>" +
          escapeHtml(task.email) +
          "</p>" +

          "<p><strong>Tervezett időpont:</strong><br>" +
          escapeHtml(
            formatDate(
              task.scheduled_at
            )
          ) +
          "</p>" +

          "<p><strong>Megvalósult időpont:</strong><br>" +
          escapeHtml(
            formatDate(
              task.completed_at
            )
          ) +
          "</p>" +

          "<p><strong>Megjegyzés:</strong><br>" +
          escapeHtml(task.note) +
          "</p>" +

          "<p><strong>Képek:</strong><br>" +
          imageLinks +
          "</p>" +

          ' +
          '" target="_blank" ' +
          'rel="noopener noreferrer">' +
          "📍 Megnyitás Google Mapsben" +
          "</a>" +

          "<br><br>" +

          '<button type="button" ' +
          'data-task-id="' +
          task.id +
          '" style="' +
          "width:100%;" +
          "padding:8px;" +
          "background:#2980b9;" +
          "color:white;" +
          "border:none;" +
          "border-radius:6px;" +
          "cursor:pointer;" +
          "font-weight:bold;" +
          '">' +
          "📋 Ugrás a feladathoz" +
          "</button>" +

          "</div>";

        const infoWindow =
          new window.google.maps
            .InfoWindow({
              content: infoContent,
            });

        marker.addListener(
          "click",
          () => {
            if (openedInfoWindow) {
              openedInfoWindow.close();
            }

            infoWindow.open({
              anchor: marker,
              map,
            });

            openedInfoWindow =
              infoWindow;

            window.setTimeout(
              () => {
                const button =
                  document.querySelector(
                    `[data-task-id="${task.id}"]`
                  );

                if (!button) {
                  return;
                }

                button.addEventListener(
                  "click",
                  () => {
                    onTaskSelectRef
                      .current(
                        task.id
                      );
                  },
                  {
                    once: true,
                  }
                );
              },
              100
            );
          }
        );
      }

      if (cancelled) {
        return;
      }

      if (
        successfulMarkers === 0
      ) {
        setLoadingText(
          "Egyik címhez sem található koordináta."
        );

        if (failedTasks.length > 0) {
          setShowNotFoundAddresses(
            true
          );
        }

        return;
      }

      if (
        successfulMarkers === 1
      ) {
        map.setCenter(
          bounds.getCenter()
        );

        map.setZoom(16);
      } else {
        map.fitBounds(
          bounds,
          60
        );
      }

      setLoadingText("");
    };

    const loadGoogleMaps = () => {
      const existingScript =
        document.getElementById(
          "google-maps-script"
        ) as HTMLScriptElement | null;

      if (window.google?.maps) {
        void initializeMap();
        return;
      }

      if (existingScript) {
        existingScript.addEventListener(
          "load",
          () => {
            void initializeMap();
          },
          {
            once: true,
          }
        );

        return;
      }

      const script =
        document.createElement(
          "script"
        );

      script.id =
        "google-maps-script";

      script.src =
        "https:" +
        "//maps.googleapis.com/maps/api/js" +
        "?key=" +
        encodeURIComponent(apiKey);

      script.async = true;
      script.defer = true;

      script.onload = () => {
        void initializeMap();
      };

      script.onerror = () => {
        setLoadingText(
          "A Google Maps nem tölthető be."
        );
      };

      document.head.appendChild(
        script
      );
    };

    loadGoogleMaps();

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
        <span
          style={{
            background: "#eaf2f8",
            padding: "7px 10px",
            borderRadius: "7px",
          }}
        >
          Szűrt feladatok:{" "}
          {tasks.length}
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

        {notFoundAddresses.length >
          0 && (
          <button
            type="button"
            onClick={() =>
              setShowNotFoundAddresses(
                (currentValue) =>
                  !currentValue
              )
            }
            style={{
              background: "#fef5e7",
              color: "#9c640c",
              padding: "7px 10px",
              borderRadius: "7px",
              border:
                "1px solid #f0b56b",
              fontSize: "13px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            ❌ Nem található:{" "}
            {
              notFoundAddresses.length
            }{" "}
            {showNotFoundAddresses
              ? "▲"
              : "▼"}
          </button>
        )}
      </div>

      {notFoundAddresses.length > 0 &&
        showNotFoundAddresses && (
          <div
            style={{
              width: "100%",
              boxSizing: "border-box",
              marginBottom: "12px",
              padding: "12px",
              background: "#fff3f3",
              border:
                "1px solid #f5b7b1",
              borderRadius: "8px",
              fontSize: "13px",
            }}
          >
            <div
              style={{
                marginBottom: "10px",
                fontWeight: "bold",
                color: "#922b21",
              }}
            >
              Az alábbi címeket nem
              sikerült megtalálni:
            </div>

            <div
              style={{
                display: "flex",
                flexDirection:
                  "column",
                gap: "7px",
              }}
            >
              {notFoundAddresses.map(
                (item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: "10px",
                      background:
                        "white",
                      borderRadius:
                        "7px",
                      border:
                        "1px solid #eee",
                    }}
                  >
                    <div
                      style={{
                        fontWeight:
                          "bold",
                        marginBottom:
                          "4px",
                      }}
                    >
                      ❌{" "}
                      {item.name ||
                        "Név nélkül"}
                    </div>

                    <div
                      style={{
                        marginBottom:
                          "3px",
                        color: "#666",
                      }}
                    >
                      Feladat azonosító:
                      #{item.id}
                    </div>

                    <div>
                      📍{" "}
                      {item.address ||
                        "Nincs megadott cím"}
                    </div>
                  </div>
                )
              )}
            </div>
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
            fontSize: "13px",
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
