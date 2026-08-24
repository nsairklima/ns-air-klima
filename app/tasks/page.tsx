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
        throw new Error(`Szerver hiba az adatok lekérésekor: ${res.status}`);
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error("Az API válasz nem lista formátumú.");
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
      setErrorMsg(err.message || "Ismeretlen hiba történt.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Fejléc */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-white">Munkák / Feladatok</h1>
          <button
            onClick={fetchTasks}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium shadow"
          >
            Frissítés
          </button>
        </div>

        {/* Töltés jelzés */}
        {loading && (
          <div className="p-4 bg-slate-800 rounded-lg text-slate-300 animate-pulse">
            Adatok betöltése folyamatban...
          </div>
        )}

        {/* Hibaüzenet */}
        {errorMsg && (
          <div className="p-4 mb-4 bg-red-900/50 border border-red-500 text-red-200 rounded-lg">
            <strong>Hiba:</strong> {errorMsg}
          </div>
        )}

        {/* Üres állapot */}
        {!loading && !errorMsg && tasks.length === 0 && (
          <div className="p-8 text-center bg-slate-800 rounded-lg border border-slate-700 text-slate-400">
            Még nincs egyetlen feladat sem rögzítve az adatbázisban.
          </div>
        )}

        {/* Feladatok listája */}
        {!loading && tasks.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="border border-slate-700 p-5 rounded-xl bg-slate-800 shadow-md text-slate-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <h2 className="font-bold text-lg text-white">
                    {task.title || "Névtelen feladat"}
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-700 text-slate-300 rounded-full uppercase">
                    {task.status || "pending"}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-slate-300 mb-4">
                  <p>👤 <strong className="text-white">Ügyfél:</strong> {task.clientName || "-"}</p>
                  <p>📞 <strong className="text-white">Telefon:</strong> {task.phone || "-"}</p>
                  <p>📍 <strong className="text-white">Cím:</strong> {task.address || "-"}</p>
                  <p>📅 <strong className="text-white">Dátum:</strong> {task.date || "-"}</p>
                </div>

                {task.description && (
                  <div className="text-sm bg-slate-900/60 p-3 rounded-lg border border-slate-700/50 text-slate-300 mb-4">
                    {task.description}
                  </div>
                )}

                {/* Képek */}
                {task.images && task.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pt-3 border-t border-slate-700">
                    {task.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="Csatolt kép"
                        className="w-16 h-16 object-cover rounded-lg border border-slate-600"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
