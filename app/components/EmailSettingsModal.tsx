"use client";

import { useState, useEffect } from "react";

export default function EmailSettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchEmails = async () => {
    try {
      const res = await fetch("/api/settings/emails");
      const data = await res.json();
      if (data.emails) {
        setEmails(data.emails);
      }
    } catch (err) {
      console.error("Hiba az emailek betöltésekor:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmails();
      setMessage("");
    }
  }, [isOpen]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/settings/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim(), action: "add" }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmails(data.emails);
        setNewEmail("");
        setMessage("✅ Sikeresen hozzáadva!");
      } else {
        setMessage("❌ " + (data.error || "Hiba történt."));
      }
    } catch {
      setMessage("❌ Hálózati hiba.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (emailToDelete: string) => {
    if (!confirm(`Biztosan törlöd a következőt: ${emailToDelete}?`)) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/settings/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToDelete, action: "delete" }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmails(data.emails);
        setMessage("🗑️ Sikeresen törölve!");
      } else {
        setMessage("❌ " + (data.error || "Hiba történt."));
      }
    } catch {
      setMessage("❌ Hálózati hiba.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100, padding: "16px"
    }}>
      <div style={{
        background: "white", color: "#000", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "450px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", gap: "16px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "8px" }}>
          <h3 style={{ margin: 0, fontSize: "18px", color: "#000" }}>⚙️ Értesítési emailek kezelése</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", fontWeight: "bold", color: "#000" }}>✕</button>
        </div>

        {message && (
          <div style={{ padding: "8px 12px", background: message.includes("✅") || message.includes("🗑️") ? "#e2f0d9" : "#f8d7da", color: message.includes("✅") || message.includes("🗑️") ? "#385723" : "#721c24", borderRadius: "6px", fontSize: "13px", fontWeight: "bold" }}>
            {message}
          </div>
        )}

        {/* Új email hozzáadása űrlap */}
        <form onSubmit={handleAdd} style={{ display: "flex", gap: "8px" }}>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="uj.cim@email.com"
            style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px", color: "#000", background: "#fff", boxSizing: "border-box" }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ background: "#28a745", color: "white", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}
          >
            Hozzáadás
          </button>
        </form>

        {/* Meglévő emailek listája */}
        <div>
          <label style={{ fontWeight: "bold", fontSize: "13px", display: "block", marginBottom: "6px", color: "#444" }}>
            Jelenleg beállított címek ({emails.length}):
          </label>
          <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px", border: "1px solid #eee", padding: "8px", borderRadius: "6px", background: "#f9f9f9" }}>
            {emails.length === 0 ? (
              <div style={{ fontSize: "13px", color: "#666", textAlign: "center", padding: "10px" }}>Nincsenek mentett emailek.</div>
            ) : (
              emails.map((item, index) => (
                <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ddd" }}>
                  <span style={{ fontSize: "14px", color: "#000" }}>{item}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    disabled={loading}
                    style={{ background: "#dc3545", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}
                  >
                    Törlés
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          style={{ background: "#6c757d", color: "white", border: "none", padding: "10px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", marginTop: "4px" }}
        >
          Bezárás
        </button>
      </div>
    </div>
  );
}
