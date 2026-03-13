"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

type Client = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
};

export default function ClientsPage() {
  const router = useRouter();

  const [list, setList] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/clients");
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let arr = [...list];

    // Keresés
    const q = search.toLowerCase();
    if (q.trim() !== "") {
      arr = arr.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.email?.toLowerCase().includes(q) ?? false) ||
          (c.phone?.toLowerCase().includes(q) ?? false)
      );
    }

    // Rendezés név szerint
    arr.sort((a, b) =>
      sortBy === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );

    return arr;
  }, [list, search, sortBy]);

  function openClient(id: number) {
    router.push(`/clients/${id}`);
  }

  return (
    <div style={wrap}>
      <h1>Ügyfelek</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input
          style={input}
          placeholder="Keresés (név, email, telefon)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          style={input}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
        >
          <option value="asc">Név A → Z</option>
          <option value="desc">Név Z → A</option>
        </select>

        <button
          style={btnPrimary}
          onClick={() => router.push("/clients/new")}
        >
          Új ügyfél
        </button>
      </div>

      {loading ? (
        <p>Betöltés…</p>
      ) : filtered.length === 0 ? (
        <p>Nincs találat.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((c) => (
            <div key={c.id} style={card}>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                {c.name}
              </div>

              <div style={{ opacity: 0.7, marginTop: 4 }}>
                {c.phone && <div>📞 {c.phone}</div>}
                {c.email && <div>✉️ {c.email}</div>}
                {c.address && <div>📍 {c.address}</div>}
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                <button style={btn} onClick={() => openClient(c.id)}>
                  Részletek
                </button>

                <button
                  style={btnSuccess}
                  onClick={() => router.push(`/clients/${c.id}?edit=1`)}
                >
                  Szerkesztés
                </button>

                <button
                  style={btn}
                  onClick={() => router.push(`/quotes?clientId=${c.id}`)}
                >
                  Ajánlatok
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const wrap: React.CSSProperties = {
  padding: "40px",
  maxWidth: "900px",
  margin: "0 auto",
  fontFamily: "Arial, sans-serif",
};

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: "10px",
  padding: "16px",
};

const input: React.CSSProperties = {
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  width: "100%",
};

const btn: React.CSSProperties = {
  padding: "8px 14px",
  background: "#f1f3f5",
  color: "#333",
  border: "1px solid #ddd",
  borderRadius: "8px",
  cursor: "pointer",
};

const btnPrimary: React.CSSProperties = {
  ...btn,
  background: "#0d6efd",
  color: "#fff",
  border: "none",
};

const btnSuccess: React.CSSProperties = {
  ...btn,
  background: "#198754",
  color: "#fff",
  border: "none",
};
