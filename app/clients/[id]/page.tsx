{showUnitForm && (
  <div style={formBoxS}>
    <h3 style={{ marginTop: 0, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
      {editingUnitId ? "✏️ Gép módosítása" : "➕ Új gép rögzítése"}
    </h3>

    <form onSubmit={handleSubmitUnit} style={{ display: "grid", gap: "16px" }}>
      
      {/* GÉP TÍPUSA SELECTOR */}
      <div>
        <label style={labS}>Gép típusa / Eredete</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputS}>
          <option value="INSTALLED">🆕 Telepítendő (Saját eladás / Raktárból)</option>
          <option value="SERVICE_ONLY">🔵 Hozott gép (Csak szerviz / Napló)</option>
        </select>
      </div>

      {/* RAKTÁR KIVÁLASZTÓ BLOKK (Csak új gép és Saját eladás esetén) */}
      {!editingUnitId && status === "INSTALLED" && (
        <div style={inventoryCardS}>
          <div style={{ fontWeight: "bold", color: "#2ecc71", marginBottom: "8px", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
            📦 Választás raktárkészletből
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            {/* 1. KÉSZLETEN LÉVŐ CIKK KIVÁLASZTÁSA */}
            <div>
              <label style={labSubS}>Raktári cikk / Anyag</label>
              <select 
                value={selectedItemId} 
                onChange={(e) => handleInventorySelect(e.target.value)} 
                style={{ ...inputS, borderColor: selectedItemId ? "#2ecc71" : "#444" }}
              >
                <option value="">-- Válassz a raktárból (opcionális) --</option>
                {inventoryItems
                  .filter((item) => (item.stock || 0) > 0)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} {item.sku ? `[${item.sku}]` : ""} — Készlet: {item.stock} db
                    </option>
                  ))}
              </select>
            </div>

            {/* 2. SPECIFIKUS CIKKSZÁM / GYÁRI SZÁM KIVÁLASZTÁSA (Ha van a termékhez) */}
            {selectedItemId && (
              <div style={serialSelectionBoxS}>
                <label style={{ ...labSubS, color: "#3498db" }}>
                  🔢 Választható specifikus cikkszámok / Gyári számok:
                </label>
                {availableSerials.length > 0 ? (
                  <select 
                    value={serial} 
                    onChange={(e) => setSerial(e.target.value)} 
                    style={{ ...inputS, borderColor: "#3498db", backgroundColor: "#121a24" }}
                    required
                  >
                    <option value="">-- Melyik cikkszámú darabot építed be? --</option>
                    {availableSerials.map((s, idx) => (
                      <option key={idx} value={s.sn}>
                        S/N: {s.sn} {s.src ? `(Forrás: ${s.src})` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ fontSize: "13px", color: "#aaa", fontStyle: "italic", padding: "6px 0" }}>
                    ℹ️ Ehhez az anyaghoz nincs külön egyedi cikkszám rögzítve a raktárban. A mentéskor 1 db automatikusan levonódik a készletből.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GYÁRTÓ ÉS MODELL (Automatikusa kitöltődik, ha raktárból választottál) */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "10px" }}>
        <div style={{ flex: 1 }}>
          <label style={labS}>Gyártó / Marka</label>
          <input 
            placeholder="pl. Daikin" 
            value={brand} 
            onChange={e => setBrand(e.target.value)} 
            style={inputS} 
            required 
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labS}>Modell / Típus</label>
          <input 
            placeholder="pl. Sensira 3.5kW" 
            value={model} 
            onChange={e => setModel(e.target.value)} 
            style={inputS} 
            required 
          />
        </div>
      </div>

      {/* GYÁRI SZÁM ÉS HELYSZÍN */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "10px" }}>
        <div style={{ flex: 1 }}>
          <label style={labS}>Gyári szám / Cikkszám</label>
          <input 
            placeholder="S/N kód" 
            value={serial} 
            onChange={e => setSerial(e.target.value)} 
            style={inputS} 
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labS}>Telepítés Helyszíne</label>
          <input 
            placeholder="pl. Nappali / Hálószoba" 
            value={location} 
            onChange={e => setLocation(e.target.value)} 
            style={inputS} 
          />
        </div>
      </div>

      {/* TELEPÍTÉS DÁTUMA */}
      <div>
        <label style={labS}>Telepítés / Beépítés dátuma:</label>
        <input 
          type="date" 
          value={installation} 
          onChange={e => setInstallation(e.target.value)} 
          style={inputS} 
        />
      </div>

      <button type="submit" style={{ ...btnGreen, width: "100%", padding: "14px", marginTop: "10px" }}>
        💾 GÉP MENTÉSE ÉS RAKTÁR FRISSÍTÉSE
      </button>
    </form>
  </div>
)}
