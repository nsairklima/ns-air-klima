"use client";

export default function ClientsPage() {
  return (
    <div style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>Ügyfelek</h1>
      <p>Smoke test – ha ezt látod, a build zöld.</p>
      <a href="/api/clients" style={{ textDecoration: "underline" }}>
        /api/clients megnyitása
      </a>
    </div>
  );
}
