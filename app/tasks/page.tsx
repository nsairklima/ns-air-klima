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
       
