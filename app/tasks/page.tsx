"use client";

import { useState, useEffect } from "react";

// Típus definíció
interface Task {
  id: number;
  type: string;
  title: string;
  clientName: string;
  phone: string;
  address: string;
  assignedTo?: string;
  date: string;
  description?: string;
  status: string;
  images: string[];
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Adatok betöltése
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks");
      if (!res.ok) return;

      const data = await res.json();
      if (!Array.isArray(data)) return;

      const formattedData = data.map((task: any) => {
        let parsedImages = [];
        try {
          if (typeof task.images === "string") {
            parsedImages = JSON.parse(task.images || "[]");
          } else if (Array.isArray(task.images)) {
            parsedImages = task.images;
          }
        } catch (e) {
          parsedImages = [];
        }

        return {
          ...task,
          images: parsedImages,
        };
      });

      setTasks(formattedData);
    } catch (err) {
      console.error("Hiba a betöltéskor:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Munkák / Feladatok</h1>
      {loading ? (
        <p>Betöltés...</p>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <div key={task.id} className="border p-4 rounded shadow-sm bg-white">
              <h2 className="font-semibold text-lg">{task.title}</h2>
              <p className="text-sm text-gray-600">Ügyfél: {task.clientName} ({task.phone})</p>
              <p className="text-sm text-gray-600">Cím: {task.address}</p>
              <p className="text-sm text-gray-500 mt-2">Dátum: {task.date}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
