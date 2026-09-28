"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  clientName: string;
  clientPhone?: string;
  location?: string;
  type: "INSTALLATION" | "MAINTENANCE";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  plannedDate?: string | null;
  description?: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Szűrők állapota
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [showOnlyWithoutDate, setShowOnlyWithoutDate] = useState(false);

  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        const res = await fetch("/api/tasks");
        if (!res.ok) {
          throw new Error("Nem sikerült betölteni a feladatokat");
        }
        const data = await res.json();
        setTasks(data);
      } catch (err: any) {
        setError(err.message || "Hiba történt");
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, []);

  // Időpont nélküli feladatok száma
  const countWithoutDate = useMemo(() => {
    return tasks.filter((t) => !t.plannedDate).length;
  }, [tasks]);

  // Szűrt feladatok előállítása
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Szűrés időpont hiányára
      if (showOnlyWithoutDate && task.plannedDate) {
        return false;
      }

      // Keresőmező szűrés
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.location &&
          task.location.toLowerCase().includes(searchQuery.toLowerCase()));

      // Státusz szűrés
      const matchesStatus =
        statusFilter === "ALL" || task.status === statusFilter;

      // Típus szűrés
      const matchesType = typeFilter === "ALL" || task.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [tasks, searchQuery, statusFilter, typeFilter, showOnlyWithoutDate]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Fejléc */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              📋 Munkák / Feladatok
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Összesen: {tasks.length} feladat | Szűrt: {filteredTasks.length}
            </p>
          </div>
          <Link
            href="/tasks/new"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors text-sm"
          >
            ➕ Új feladat hozzáadása
          </Link>
        </div>

        {/* Szűrő Eszköztár */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Keresőmező */}
            <input
              type="text"
              placeholder="🔍 Keresés (név, cím, megnevezés)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Státusz szűrő */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Összes státusz</option>
              <option value="PENDING">Függőben</option>
              <option value="IN_PROGRESS">Folyamatban</option>
              <option value="COMPLETED">Befejezve</option>
              <option value="CANCELLED">Törölve</option>
            </select>

            {/* Típus szűrő */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Összes típus</option>
              <option value="INSTALLATION">Telepítés</option>
              <option value="MAINTENANCE">Karbantartás</option>
            </select>
          </div>

          {/* Másodlagos szűrősor: Időpont nélküliek gomb */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-800">
            <button
              type="button"
              onClick={() => setShowOnlyWithoutDate((prev) => !prev)}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border ${
                showOnlyWithoutDate
                  ? "bg-red-600/20 border-red-500 text-red-200"
                  : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <span>
                📅 {showOnlyWithoutDate ? "Minden tétel mutatása" : "Csak időpont nélküliek"}
              </span>
              <span
                className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                  showOnlyWithoutDate
                    ? "bg-red-600 text-white"
                    : "bg-gray-700 text-gray-200"
                }`}
              >
                {countWithoutDate}
              </span>
            </button>
          </div>
        </div>

        {/* Állapotjelzők */}
        {loading && (
          <div className="text-center py-12 text-gray-400">
            Feladatok betöltése...
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Feladatok Lista */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500 bg-gray-900/50 rounded-xl border border-gray-800">
                Nincs a szűrésnek megfelelő feladat.
              </div>
            ) : (
              filteredTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="block bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition-all hover:shadow-lg group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-md font-semibold ${
                        task.type === "INSTALLATION"
                          ? "bg-blue-900/50 text-blue-300 border border-blue-800"
                          : "bg-amber-900/50 text-amber-300 border border-amber-800"
                      }`}
                    >
                      {task.type === "INSTALLATION"
                        ? "Telepítés"
                        : "Karbantartás"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {task.status === "PENDING" && "⏳ Függőben"}
                      {task.status === "IN_PROGRESS" && "🔄 Folyamatban"}
                      {task.status === "COMPLETED" && "✅ Befejezve"}
                      {task.status === "CANCELLED" && "❌ Törölve"}
                    </span>
                  </div>

                  <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors mb-1">
                    {task.title}
                  </h3>

                  <p className="text-sm text-gray-300 mb-2">
                    👤 {task.clientName}
                  </p>

                  {task.location && (
                    <p className="text-xs text-gray-400 mb-3 truncate">
                      📍 {task.location}
                    </p>
                  )}

                  <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-xs">
                    <span
                      className={
                        task.plannedDate
                          ? "text-emerald-400 font-medium"
                          : "text-amber-500 font-medium"
                      }
                    >
                      {task.plannedDate
                        ? `📅 ${task.plannedDate}`
                        : "⚠️ Nincs tervezett időpont"}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
