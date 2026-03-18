"use client";

import React, { useState } from "react";

export default function TestEmailPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function sendTest() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: "Hiba történt a kérés közben." });
    }

    setLoading(false);
  }

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Teszt e-mail értesítés</h1>

      <p>
        Ez a gomb <strong>MOST azonnal</strong> elküldi az értesítő e-maileket
        azoknak az ügyfeleknek, akiknél esedékes a karbantartás.
      </p>

      <button
        onClick={sendTest}
        disabled={loading}
        style={{
          background: "#4DA3FF",
          color: "white",
          padding: "12px 22px",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        {loading ? "Küldés folyamatban..." : "Teszt e-mail küldése"}
      </button>

      {result && (
        <pre
          style={{
            marginTop: "20px",
            padding: "20px",
            background: "#eee",
            borderRadius: "8px",
            whiteSpace: "pre-wrap",
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
``
