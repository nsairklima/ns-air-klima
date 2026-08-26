"use client";

import { useEffect, useState } from "react";

type Task = {
  id: number;
  type: string;
  address: string;
  drive_link?: string;
  created_at: string;
};

export default function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetch("/api/tasks/list")
      .then((res) => res.json())
      .then((data) => setTasks(data.tasks || []));
  }, []);

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
        }}
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>Típus</th>
            <th>Cím</th>
            <th>Kép</th>
            <th>Dátum</th>
          </tr>
        </thead>

        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>{task.id}</td>

              <td>
                {task.type === "telepites"
                  ? "🛠️ Telepítés"
                  : "🧹 Karbantartás"}
              </td>

              <td>{task.address}</td>

              <td>
                {task.drive_link ? (
                  <a
                    href={task.drive_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📷 Megnyitás
                  </a>
                ) : (
                  "-"
                )}
              </td>

              <td>
                {new Date(task.created_at).toLocaleString("hu-HU")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
