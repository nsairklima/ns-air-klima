"use client";

import React, { useState, useEffect } from "react";

interface PasswordGuardProps {
  children: React.ReactNode;
  moduleKey: "MASTER" | "CALENDAR" | "CLIENTS";
}

export default function PasswordGuard({ children, moduleKey }: PasswordGuardProps) {
  // --- BYPASS KAPCSOLÓ ---
  // Ha true, a jelszókérés ki van kapcsolva.
  const BYPASS = true; 

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Ellenőrizzük, hogy ebben a munkamenetben már belépett-e
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem(`auth_${moduleKey}`);
    if (sessionAuth === "true") {
      setIsAuthorized(true);
    }
  }, [moduleKey]);

  // Ha a bypass aktív, azonnal engedélyezzük a hozzáférést
  if (BYPASS) {
    return <>{children}</>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, moduleKey }),
      });

      if (res.ok) {
        setIsAuthorized(true);
        sessionStorage.setItem(`auth_${moduleKey}`, "true");
      } else {
        setError("Hibás jelszó!");
      }
    } catch (err) {
      setError("Hiba történt az ellenőrzés során.");
    } finally {
      setLoading(false);
    }
  };

  if (isAuthorized) {
    return <>{children}</>;
  }

  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Zárolt tartalom</h2>
        <p style={{ color: "#94a3b8", fontSize: "14px" }}>
          A hozzáféréshez kérjük, adja meg a jelszót.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Jelszó"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            autoFocus
          />
          {error && <p style={{ color: "#ef4444", fontSize: "12px", margin: "5px 0" }}>{error}</p>}
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? "Ellenőrzés..." : "Belépés"}
          </button>
        </form>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: "#0f172a", display: "flex", justifyContent: "center",
  alignItems: "center", zIndex: 9999, padding: "20px"
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#1e293b", padding: "30px", borderRadius: "16px",
  width: "100%", maxWidth: "350px", border: "1px solid #334155",
  textAlign: "center", color: "#fff", boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px", margin: "15px 0 10px 0",
  backgroundColor: "#0f172a", border: "1px solid #334155",
  color: "#fff", borderRadius: "8px", boxSizing: "border-box", fontSize: "16px"
};

const btnStyle: React.CSSProperties = {
  width: "100%", padding: "12px", backgroundColor: "#2ecc71",
  color: "#fff", border: "none", borderRadius: "8px",
  fontWeight: "bold", cursor: "pointer", fontSize: "16px"
};
