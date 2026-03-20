"use client";

import React, { useEffect, useState } from "react";

type Client = { id: number; name: string };
type Quote = {
  id: number;
  clientId: number;
  client?: Client;
  title?: string | null;
  status: "draft" | "sent" | "accepted" | "rejected";
  grossTotal: number;
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [clientId, setClientId] = useState<string>("");
  const [title, setTitle] = useState("");

  async function load() {
    setLoading(true);
    const [q, c] = await Promise.all([
      fetch("/api/quotes", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/clients", { cache: "no-store" }).then((r) => r.json()),
    ]);
    setQuotes(Array.isArray(q) ? q : []);
    setClients(Array.isArray(c) ? c : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createQuote(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) { alert("Válassz ügyfelet."); return; }
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: Number(clientId), title: title || null }),
    });
    if (!res.ok) { alert("Hiba az ajánlat létrehozásakor."); return; }
