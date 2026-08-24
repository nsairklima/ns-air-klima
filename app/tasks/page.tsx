"use client";

import { useState } from "react";

export default function TasksPage() {
  const [type, setType] = useState<"telepites" | "karbantartas">("telepites");
  const [address, setAddress] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [driveUrl, setDriveUrl] = useState<string | null>(null);

  const mapsUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
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
      } else {
        setStatusMessage("❌ " + (data.error || "Hiba történt."));
      }
    } catch {
      setStatusMessage("❌ Hálózati hiba történt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: "600px", margin: "40px auto", padding: "24px", fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#ffffff", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
      {/* Fejléc + Dynamic Google Maps Gomb */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid #eee" }}>
        <h1 style={{ margin: 0, fontSize: "24px", color: "#1a1a1a" }}>Munka Kiadása</h1>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            backgroundColor: "#4285F4",
            color: "white",
            padding: "10px 16px",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "600",
            fontSize: "14px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 2px 4px rgba(66,133,244,0.3)"
          }}
        >
          📍 Google Maps
        </a>
      </div>

      {/* Űrlap */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Munkatípus Választó */}
        <div style={{ backgroundColor: "#f8f9fa", padding: "16px", borderRadius: "8px", border: "1px solid #e9ecef" }}>
          <label style={{ fontWeight: "600", display: "block", marginBottom: "10px", color: "#495057" }}>
            Munkatípus választása:
          </label>
          <div style={{ display: "flex", gap: "24px" }}>
            <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", fontWeight: "500" }}>
              <input
                type="radio"
                name="type"
                value="telepites"
                checked={type === "telepites"}
                onChange={() => setType("telepites")}
                style={{ width: "18px", height: "18px", accentColor: "#28a745" }}
              />
              🛠️ Telepítés
            </label>
            <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", fontWeight: "500" }}>
              <input
                type="radio"
                name="type"
                value="karbantartas"
                checked={type === "karbantartas"}
                onChange={() => setType("karbantartas")}
                style={{ width: "18px", height: "18px", accentColor: "#28a745" }}
              />
              🧹 Karbantartás
            </label>
          </div>
        </div>

        {/* Helyszín / Cím */}
        <div>
          <label style={{ fontWeight: "600", display: "block", marginBottom: "8px", color: "#495057" }}>
            Cím / Helyszín:
          </label>
          <input
            type="text"
            required
            placeholder="Pl. 1051 Budapest, Fő tér 1."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ced4da",
              fontSize: "15px",
              boxSizing: "border-box"
            }}
          />
        </div>

        {/* Kép Csatolása */}
        <div>
          <label style={{ fontWeight: "600", display: "block", marginBottom: "8px", color: "#495057" }}>
            Kép csatolása (Google Drive feltöltés):
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ced4da",
              backgroundColor: "#fff"
            }}
          />
        </div>

        {/* Beküldés Gomb */}
        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: loading ? "#6c757d" : "#28a745",
            color: "white",
            padding: "14px",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: "8px",
            boxShadow: "0 4px 6px rgba(40,167,69,0.2)"
          }}
        >
          {loading ? "Feltöltés és küldés..." : "Munka Kiadása"}
        </button>
      </form>

      {/* Visszajelzés */}
      {statusMessage && (
        <div style={{ marginTop: "24px", padding: "14px", borderRadius: "8px", backgroundColor: statusMessage.startsWith("✅") ? "#d4edda" : "#f8d7da", border: `1px solid ${statusMessage.startsWith("✅") ? "#c3e6cb" : "#f5c6cb"}` }}>
          <p style={{ margin: 0, fontWeight: "600", color: statusMessage.startsWith("✅") ? "#155724" : "#721c24" }}>
            {statusMessage}
          </p>
          {driveUrl && (
            <p style={{ marginTop: "8px", marginBottom: 0, fontSize: "14px" }}>
              📁 <a href={driveUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0056b3", textDecoration: "underline" }}>Kép megtekintése a Google Drive-on</a>
            </p>
          )}
        </div>
      )}
    </main>
  );
}
