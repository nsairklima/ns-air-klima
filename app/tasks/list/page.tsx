"use client";

import { useEffect, useState } from "react";

type Task = {
  id: number;
  type: string;
  address: string;
  images?: string | string[]; // Cloudinary képek kezelése
  date?: string;
  created_at?: string;
  updatedAt?: string;
};

export default function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetch("/api/tasks/list")
      .then((res) => res.json())
      .then((data) => setTasks(data.tasks || []));
  }, []);

  // Segédfüggvény a kép URL kiszedésére (akár string, akár JSON tömb)
  const getImageUrl = (images: string | string[] | undefined) => {
    if (!images) return "";
    if (Array.isArray(images)) return images[0] || "";
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    } catch (e) {
      // Ha nem JSON string, hanem sima URL szöveg
      return images;
    }
    return "";
  };

  return (
    <main
      style={{
        maxWidth: "1000px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      <h1>Kiadott munkák</h1>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "2px solid #ccc", textAlign: "left" }}>
            <th style={{ padding: "10px" }}>ID</th>
            <th style={{ padding: "10px" }}>Típus</th>
            <th style={{ padding: "10px" }}>Cím</th>
            <th style={{ padding: "10px" }}>Kép</th>
            <th style={{ padding: "10px" }}>Dátum</th>
          </tr>
        </thead>

        <tbody>
          {tasks.map((task) => {
            const imageUrl = getImageUrl(task.images);
            const taskDate = task.date || task.created_at || task.updatedAt || "";

            return (
              <tr key={task.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px" }}>{task.id}</td>

                <td style={{ padding: "10px" }}>
                  {task.type === "telepites" || task.type === "installation"
                    ? "🛠️ Telepítés"
                    : "🧹 Karbantartás"}
                </td>

                <td style={{ padding: "10px" }}>{task.address}</td>

                <td style={{ padding: "10px" }}>
                  {imageUrl ? (
                    <a
                      href={imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#0070f3", textDecoration: "underline" }}
                    >
                      📷 Megtekintés
                    </a>
                  ) : (
                    <span style={{ color: "#888" }}>-</span>
                  )}
                </td>

                <td style={{ padding: "10px" }}>
                  {taskDate ? new Date(taskDate).toLocaleDateString("hu-HU") : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
