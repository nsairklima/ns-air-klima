"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewClientPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  async function save() {
    if (!name.trim()) {
      alert("A név kötelező.");
      return;
    }
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, address }),
    });
    if (res.ok) {
      const c = await res.json();
      router.push(`/clients/${c.id}`);
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Hiba az ügyfél létrehozásakor.");
    }
  }

  return (
    <div style={wrap}>
      <h1>Új ügyfél</h1>

      <div style={{ display: "grid", gap: 10, maxWidth: 600 }}>
        <input style={input} placeholder="Név *" value={name} onChange={(e) => setName(e.target.value)} />
        <input style={input} placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input style={input} placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input style={input} placeholder="Cím" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button onClick={() => router.push("/clients")} style={btn}>
          Mégse
        </button>
        <button onClick={save} style={btnPrimary}>
          Mentés
        </button>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { padding: 40, maxWidth: 900, margin: "0 auto", fontFamily: "Arial, sans-serif" };
const input: React.CSSProperties = { padding: 10, borderRadius: 6, border: "1px solid #ccc", width: "100%" };
const btn: React.CSSProperties = { padding: "8px 14px", background: "#f1f3f5", color: "#333", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer" };
const btnPrimary: React.CSSProperties = { ...btn, background: "#0d6efd", color: "#fff", border: "none" };
