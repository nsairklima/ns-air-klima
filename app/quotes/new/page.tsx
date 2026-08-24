"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Client = { id: number; name: string; email?: string; phone?: string; address?: string };
type DBItem = { 
  id: number; 
  name: string; 
  price: number; 
  unit: string;
  sku?: string;
  code?: string;
  articleNumber?: string;
};

export default function NewQuotePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [dbItems, setDbItems] = useState<DBItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'existing' | 'new'>('existing');

  // Adat állapotok
  const [selectedClientId, setSelectedClientId] = useState("");
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "", address: "" });
  const [unit, setUnit] = useState({ brand: "", model: "", power: "", location: "" });
  const [quoteTitle, setQuoteTitle] = useState("");

  // Modal és kereső állapotok
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  
  // Ügyfél kereső modal állapota
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");

  useEffect(() => {
    // Ügyfelek betöltése
    fetch("/api/clients").then(res => res.ok && res.json().then(setClients));
    // Mentett termékek betöltése
    fetch("/api/items").then(res => res.ok && res.json().then(setDbItems));
  }, []);

  // Kiválasztott ügyfél lekérése megjelenítéshez
  const selectedClient = clients.find(c => String(c.id) === String(selectedClientId));

  // Kiválasztás a kereshető modalból
  const handleSelectDBItemDirect = (item: DBItem) => {
    setUnit({
      ...unit,
      model: item.name,
      brand: "", 
      power: ""
    });
    
    if (!quoteTitle) {
      const cName = mode === 'new' ? newClient.name : clients.find(c => c.id === Number(selectedClientId))?.name || "Ügyfél";
      setQuoteTitle(`${cName} - ${item.name}`);
    }

    setIsModalOpen(false); // Modal bezárása
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      let clientId: number;
      let clientName = "";

      // 1. Ügyfél kezelése
      if (mode === 'new') {
        const cRes = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newClient),
        });
        if (!cRes.ok) throw new Error("Ügyfél mentési hiba");
        const createdClient = await cRes.json();
        clientId = createdClient.id;
        clientName = newClient.name;
      } else {
        if (!selectedClientId) {
          alert("Válassz ügyfelet!");
          setLoading(false);
          return;
        }
        clientId = Number(selectedClientId);
        clientName = clients.find(c => c.id === clientId)?.name || "";
      }

      // 2. Gép mentése az ügyfélhez (ha van megadva gép)
      if (unit.brand || unit.model) {
        const fullModel = unit.power ? `${unit.model} (${unit.power})` : unit.model;
        await fetch(`/api/clients/${clientId}/units`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brand: unit.brand,
            model: fullModel,
            location: unit.location
          }),
        });
      }

      // 3. Ajánlat létrehozása
      const generatedTitle = quoteTitle || 
        `${clientName} - ${unit.brand} ${unit.model} ${unit.power ? `(${unit.power})` : ""}`.trim();

      const qRes = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          title: generatedTitle,
          status: "draft",
          items: []
        }),
      });

      if (qRes.ok) {
        const qData = await qRes.json();
        router.push(`/quotes/${qData.id}`);
      } else {
        const errorData = await qRes.json();
        throw new Error(errorData.details || "Hiba az ajánlat létrehozásakor");
      }
    } catch (err: any) {
      console.error(err);
      alert("Hiba: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Szűrés név ÉS cikkszám alapján
  const filteredDbItems = dbItems.filter(item => {
    const q = itemSearchQuery.toLowerCase();
    const nameMatch = item.name?.toLowerCase().includes(q);
    const skuVal = item.sku || item.code || item.articleNumber || "";
    const skuMatch = skuVal.toLowerCase().includes(q);
    return nameMatch || skuMatch;
  });

  // Ügyfelek szűrése név, email, telefon alapján
  const filteredClients = clients.filter(c => {
    const q = clientSearchQuery.toLowerCase();
    const nameMatch = c.name?.toLowerCase().includes(q);
    const emailMatch = c.email?.toLowerCase().includes(q);
    const phoneMatch = c.phone?.toLowerCase().includes(q);
    return nameMatch || emailMatch || phoneMatch;
  });

  return (
    <div style={wrap}>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => router.back()} style={navBtn}>⬅️ Vissza</button>
        <button onClick={() => router.push("/")} style={navBtn}>🏠 Főoldal</button>
      </div>

      <h1 style={{ color: "#fff", marginBottom: 15, fontSize: "1.8rem", fontWeight: "800" }}>Új ajánlat indítása</h1>

      {/* FÜLEK / TABS */}
      <div style={tabContainer}>
        <button 
          type="button"
          onClick={() => setMode('existing')} 
          style={{ ...tabBtn, borderBottom: mode === 'existing' ? "3px solid #2ecc71" : "3px solid transparent", color: mode === 'existing' ? "#2ecc71" : "#94a3b8" }}
        >
          Meglévő ügyfél
        </button>
        <button 
          type="button"
          onClick={() => setMode('new')} 
          style={{ ...tabBtn, borderBottom: mode === 'new' ? "3px solid #2ecc71" : "3px solid transparent", color: mode === 'new' ? "#2ecc71" : "#94a3b8" }}
        >
          + Új ügyfél
        </button>
      </div>

      {/* SÖTÉT FORM MASZK */}
      <form onSubmit={handleSubmit} style={formCard}>
        <h3 style={sectionTitle}>👤 Ügyfél adatai</h3>
        {mode === 'existing' ? (
          <div>
            <button
              type="button"
              onClick={() => setIsClientModalOpen(true)}
              style={{
                ...input,
                borderColor: "#38bdf8",
                backgroundColor: "#0f172a",
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <span>{selectedClient ? `Kiválasztva: ${selectedClient.name}` : "-- Keresés és választás az ügyfelek közül --"}</span>
              <span style={{ fontSize: 12, background: "#38bdf8", color: "#0f172a", padding: "3px 8px", borderRadius: 4, fontWeight: "bold" }}>Keresés</span>
            </button>
          </div>
        ) : (
          <div style={grid}>
            <input style={input} placeholder="Név *" required={mode === 'new'} value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} />
            <input style={input} placeholder="E-mail" type="email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
            <input style={input} placeholder="Telefon" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} />
            <input style={input} placeholder="Cím" value={newClient.address} onChange={e => setNewClient({...newClient, address: e.target.value})} />
          </div>
        )}

        <h3 style={{ ...sectionTitle, marginTop: 25 }}>❄️ Gép adatai</h3>
        
        {/* KIVÁLASZTÓ GOMB */}
        <div style={{ marginBottom: 15, background: "#141b2b", padding: 12, borderRadius: 10, border: "1px solid #2d3748" }}>
            <label style={{ fontSize: 11, color: "#2ecc71", fontWeight: "bold", textTransform: "uppercase", display: "block", marginBottom: 6, letterSpacing: "0.5px" }}>Betöltés az adatbázisból:</label>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              style={{
                ...input,
                borderColor: "#2ecc71",
                backgroundColor: "#1e293b",
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <span>{unit.model ? `Kiválasztva: ${unit.model}` : "🔍 Választás elmentett típusok közül..."}</span>
              <span style={{ fontSize: 12, background: "#2ecc71", color: "#0f172a", padding: "3px 8px", borderRadius: 4, fontWeight: "bold" }}>Böngészés</span>
            </button>
        </div>

        <div style={grid}>
          <input style={input} placeholder="Gyártó (pl. Gree)" value={unit.brand} onChange={e => setUnit({...unit, brand: e.target.value})} />
          <input style={input} placeholder="Modell (pl. Amber)" value={unit.model} onChange={e => setUnit({...unit, model: e.target.value})} />
          <input style={input} placeholder="Teljesítmény (pl. 3.5kW)" value={unit.power} onChange={e => setUnit({...unit, power: e.target.value})} />
          <input style={input} placeholder="Helyszín (pl. Nappali)" value={unit.location} onChange={e => setUnit({...unit, location: e.target.value})} />
        </div>

        <h3 style={{ ...sectionTitle, marginTop: 25 }}>📝 Ajánlat címe</h3>
        <input 
          style={input} 
          placeholder="Hagyja üresen az automatikus névhez" 
          value={quoteTitle} 
          onChange={e => setQuoteTitle(e.target.value)} 
        />
        
        <button type="submit" disabled={loading} style={btnPrimary}>
          {loading ? "Mentés..." : "Ajánlat létrehozása →"}
        </button>
      </form>

      {/* KERESHETŐ ÜGYFÉLVÁLASZTÓ MODAL */}
      {isClientModalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.8)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          padding: 16
        }}>
          <div style={{
            background: "#1e293b",
            borderRadius: 16,
            width: "100%",
            maxWidth: 600,
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            border: "1px solid #334155",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            overflow: "hidden"
          }}>
            {/* Fejléc és Kereső */}
            <div style={{ padding: 20, borderBottom: "1px solid #334155" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 18, color: "#fff" }}>Válassz ügyfelet</h3>
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 20, cursor: "pointer" }}
                >
                  ✖
                </button>
              </div>
              <input
                type="text"
                placeholder="🔍 Keresés név, email vagy telefon alapján..."
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                style={input}
                autoFocus
              />
            </div>

            {/* Ügyfelek listája */}
            <div style={{ padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredClients.length === 0 ? (
                <div style={{ textAlign: "center", padding: 30, color: "#94a3b8" }}>
                  Nincs a keresésnek megfelelő ügyfél.
                </div>
              ) : (
                filteredClients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => {
                      setSelectedClientId(String(client.id));
                      setIsClientModalOpen(false);
                      setClientSearchQuery("");
                    }}
                    style={{
                      background: String(client.id) === selectedClientId ? "#1e3a8a" : "#0f172a",
                      padding: "14px 16px",
                      borderRadius: 10,
                      border: String(client.id) === selectedClientId ? "1px solid #3b82f6" : "1px solid #334155",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "background 0.15s"
                    }}
                    onMouseEnter={(e) => {
                      if (String(client.id) !== selectedClientId) e.currentTarget.style.background = "#2a374e";
                    }}
                    onMouseLeave={(e) => {
                      if (String(client.id) !== selectedClientId) e.currentTarget.style.background = "#0f172a";
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: 15, color: "#fff", marginBottom: 4 }}>
                        {client.name}
                      </div>
                      {(client.phone || client.email) && (
                        <div style={{ fontSize: 12, color: "#94a3b8", display: "flex", gap: 12 }}>
                          {client.phone && <span>📞 {client.phone}</span>}
                          {client.email && <span>✉️ {client.email}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Lábléc */}
            <div style={{ padding: 12, borderTop: "1px solid #334155", textAlign: "right" }}>
              <button
                type="button"
                onClick={() => setIsClientModalOpen(false)}
                style={{ ...navBtn, width: "100%" }}
              >
                Mégsem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SZELLŐS ÉS KERESHETŐ TÍPUSVÁLASZTÓ ABLAK (MODAL) CIKKSZÁMMAL */}
      {isModalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.8)",
          display: "flex",
          justify: "center",
          alignItems: "center",
          zIndex: 1000,
          padding: 16
        }}>
          <div style={{
            background: "#1e293b",
            borderRadius: 16,
            width: "100%",
            maxWidth: 600,
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            border: "1px solid #334155",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            overflow: "hidden"
          }}>
            {/* Fejléc és Kereső */}
            <div style={{ padding: 20, borderBottom: "1px solid #334155" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 18, color: "#fff" }}>Válassz elmentett típust</h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 20, cursor: "pointer" }}
                >
                  ✖
                </button>
              </div>
              <input
                type="text"
                placeholder="🔍 Keresés név vagy cikkszám alapján..."
                value={itemSearchQuery}
                onChange={(e) => setItemSearchQuery(e.target.value)}
                style={input}
                autoFocus
              />
            </div>

            {/* Szellős kártyás lista cikkszámmal */}
            <div style={{ padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredDbItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: 30, color: "#94a3b8" }}>
                  Nincs a keresésnek megfelelő típus.
                </div>
              ) : (
                filteredDbItems.map((item) => {
                  const itemSku = item.sku || item.code || item.articleNumber;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectDBItemDirect(item)}
                      style={{
                        background: "#0f172a",
                        padding: "14px 16px",
                        borderRadius: 10,
                        border: "1px solid #334155",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "background 0.15s"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#2a374e")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#0f172a")}
                    >
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: 15, color: "#fff", marginBottom: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span>{item.name}</span>
                          {itemSku && (
                            <span style={{ fontSize: 11, background: "#1e293b", color: "#38bdf8", border: "1px solid #0284c7", padding: "2px 6px", borderRadius: 4, fontWeight: "600" }}>
                              CS: {itemSku}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>
                          Egység: {item.unit || "db"}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "#2ecc71", fontWeight: "bold", fontSize: 15 }}>
                          {item.price ? `${item.price.toLocaleString()} Ft` : "0 Ft"}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Lábléc bezáró gomb */}
            <div style={{ padding: 12, borderTop: "1px solid #334155", textAlign: "right" }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ ...navBtn, width: "100%" }}
              >
                Mégsem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- STÍLUSOK ---
const wrap: React.CSSProperties = { 
  minHeight: "100vh",
  backgroundColor: "#121826",
  color: "#f8fafc",
  padding: "20px 12px", 
  maxWidth: 700, 
  margin: "0 auto", 
  fontFamily: "sans-serif", 
  boxSizing: "border-box" 
};

const tabContainer = { display: "flex", gap: 10, marginBottom: 20, borderBottom: "1px solid #334155" };
const tabBtn = { background: "none", border: "none", padding: "12px 16px", cursor: "pointer", fontWeight: "bold" as const, fontSize: "15px", transition: "all 0.2s" };
const formCard = { background: "#1e293b", padding: "20px 16px", borderRadius: 16, border: "1px solid #334155", boxShadow: "0 4px 15px rgba(0,0,0,0.3)", boxSizing: "border-box" as const };
const sectionTitle = { fontSize: 11, color: "#94a3b8", marginBottom: 15, borderBottom: "1px solid #334155", paddingBottom: 6, textTransform: "uppercase" as const, fontWeight: "bold", letterSpacing: "0.5px" };

const grid = { 
  display: "grid", 
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", 
  gap: "14px",
  marginBottom: 10
};

const input = { 
  width: "100%", 
  padding: "14px", 
  borderRadius: 10, 
  border: "1px solid #334155", 
  boxSizing: "border-box" as const,
  fontSize: "16px",
  backgroundColor: "#0f172a",
  color: "#fff",
  outline: "none"
};

const btnPrimary = { width: "100%", background: "#2ecc71", color: "#fff", border: "none", padding: "16px", borderRadius: 12, fontWeight: "bold", cursor: "pointer", marginTop: 25, fontSize: "16px" };

const navBtn = { 
  background: "#1e293b",
  border: "1px solid #334155",
  color: "#fff",
  padding: "10px 18px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px"
};
