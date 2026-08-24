"use client";

import { useState, useEffect } from "react";

interface Task {
  id: number;
  type?: string;
  title?: string;
  clientName?: string;
  phone?: string;
  address?: string;
  assignedTo?: string;
  date?: string;
  description?: string;
  status?: string;
  images?: string[];
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await fetch("/api/tasks");
      if (!res.ok) {
        throw new Error(`Szerver hiba: ${res.status}`);
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error("Az API nem tömböt adott vissza!");
      }

      const formattedData = data.map((task: any) => {
        let parsedImages: string[] = [];
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
    } catch (err: any) {
      console.error("Hiba a betöltéskor:", err);
      setErrorMsg(err.message || "Hiba történt az adatok betöltése közben.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Munkák / Feladatok</h1>
        <button
          onClick={fetchTasks}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Frissítés
        </button>
      </div>

      {loading && <p className="text-gray-500">Betöltés folyamatban...</p>}

      {errorMsg && (
        <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Hiba:</strong> {errorMsg}
        </div>
      )}

      {!loading && !errorMsg && tasks.length === 0 && (
        <div className="p-8 text-center bg-gray-50 rounded border text-gray-500">
          Még nincs egyetlen elmentett munka sem az adatbázisban.
        </div>
      )}

      {!loading && tasks.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="border p-4 rounded-lg shadow-sm bg-white border-gray-200"
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="font-bold text-lg text-gray-800">
                  {task.title || "Névtelen feladat"}
                </h2>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600 uppercase">
                  {task.status || "pending"}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-1">
                👤 <strong>Ügyfél:</strong> {task.clientName || "-"} ({task.phone || "-"})
              </p>
              <p className="text-sm text-gray-600 mb-1">
                📍 <strong>Cím:</strong> {task.address || "-"}
              </p>
              <p className="text-sm text-gray-500 mb-3">
                📅 <strong>Dátum:</strong> {task.date || "-"}
              </p>

              {task.description && (
                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded mb-3">
                  {task.description}
                </p>
              )}

              {/* Képek megjelenítése ha vannak */}
              {task.images && task.images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pt-2 border-t">
                  {task.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt="Csatolt kép"
                      className="w-16 h-16 object-cover rounded border"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
