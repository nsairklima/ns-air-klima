"use client";

import { useEffect, useState } from "react";

export default function TasksPage() {
  const [type, setType] = useState<"telepites" | "karbantartas">("telepites");
  const [address, setAddress] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [driveUrl, setDriveUrl] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/tasks/list")
      .then((res) => res.json())
      .then((data) => setTasks(data.tasks || []))
      .catch(console.error);
  }, []);

  const mapsUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        address
      )}`
    : "https://maps.google.com";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setStatusMessage("");
    setDriveUrl(null);

    const formData = new FormData();

    formData.append("type", type);
    formData.append("address", address);

    if (photo) {
      formData.append("photo", photo);
    }

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setStatusMessage("✅ " + data.message);

        if (data.driveLink) {
          setDriveUrl(data.driveLink);
        }

        setAddress("");
        setPhoto(null);

        const listRes = await fetch("/api/tasks/list");
        const listData = await listRes.json();

        setTasks(listData.tasks || []);
      } else {
        setStatusMessage(
          "❌ " + (data.error || "Hiba történt.")
        );
      }
    } catch {
      setStatusMessage("❌ Hálózati hiba történt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "24px",
        fontFamily: "system-ui",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h1>Munka Kiadása</h1>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: "#4285F4",
            color: "white",
            padding: "10px 16px",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          📍 Google Maps
        </a>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          background: "#f9f9f9",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #ddd",
        }}
      >
        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>
            Munkatípus választása:
          </label>
          <div style={{ display: "flex", gap: "20px" }}>
            <label style={{ cursor: "pointer" }}>
              <input
                type="radio"
                name="type"
                value="telepites"
                checked={type === "telepites"}
                onChange={() => setType("telepites")}
              />{" "}
              🛠️ Telepítés
            </label>
            <label style={{ cursor: "pointer" }}>
              <input
                type="radio"
                name="type"
                value="karbantartas"
                checked={type === "karbantartas"}
                onChange={() => setType("karbantartas")}
              />{" "}
              🧹 Karbantartás
            </label>
          </div>
        </div>

        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>
            Cím / Helyszín:
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Pl. 1051 Budapest, Kossuth Lajos tér 1."
            required
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>
            Kép csatolása (Google Drive feltöltés):
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            style={{
              width: "100%",
              padding: "8px",
              background: "white",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? "#ccc" : "#28a745",
            color: "white",
            padding: "12px",
            fontSize: "16px",
            fontWeight: "bold",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: "10px",
          }}
        >
          {loading ? "Feldolgozás..." : "Munka Kiadása"}
        </button>
      </form>

      {statusMessage && (
        <div
          style={{
            marginTop: "20px",
            padding: "14px",
            borderRadius: "6px",
            background: statusMessage.startsWith("✅") ? "#d4edda" : "#f8d7da",
            color: statusMessage.startsWith("✅") ? "#155724" : "#721c24",
            border: `1px solid ${
              statusMessage.startsWith("✅") ? "#c3e6cb" : "#f5c6cb"
            }`,
          }}
        >
          {statusMessage}
        </div>
      )}

      {driveUrl && (
        <p style={{ marginTop: "12px" }}>
          <strong>Feltöltött kép:</strong>{" "}
          <a href={driveUrl} target="_blank" rel="noopener noreferrer">
            Megtekintés Google Drive-on
          </a>
        </p>
      )}
            <hr style={{ margin: "40px 0" }} />

      <h2>Kiadott munkák</h2>

      {tasks.length === 0 ? (
        <p>Nincs még kiadott munka.</p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "20px",
          }}
        >
          {tasks.map((task) => (
            <div
              key={task.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "12px",
                background: "#fff",
              }}
            >
              <div>
                <strong>
                  {task.type === "telepites"
                    ? "🛠️ Telepítés"
                    : "🧹 Karbantartás"}
                </strong>
              </div>

              <div style={{ marginTop: "6px" }}>
                {task.address}
              </div>

              <div
                style={{
                  marginTop: "8px",
                  display: "flex",
                  gap: "12px",
                }}
              >
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
t="_blank"
                  rel="noopener noreferrer"
                >
                  📍 Térkép
                </a>

                {task.drive_link && (
                  <a
                    href={task.drive� Kép
                  </a>
                )}
              </div>

              <div
                style={{
                  marginTop: "8px",
                  color: "#666",
                  fontSize: "12px",
                }}
              >
                {new Date(task.created_at).toLocaleString(
                  "hu-HU"
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
