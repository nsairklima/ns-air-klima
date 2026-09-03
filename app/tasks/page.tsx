const filteredTasks = tasks.filter((task) => {
    if (filterType !== "all" && task.type !== filterType) {
      return false;
    }
    if (filterStatus === "folyamatban" && task.completed_at) {
      return false;
    }
    if (filterStatus === "kesz" && !task.completed_at) {
      return false;
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchName = task.name?.toLowerCase().includes(q) || false;
      const matchAddress = task.address?.toLowerCase().includes(q) || false;
      const matchPhone = task.phone?.toLowerCase().includes(q) || false;
      const matchEmail = task.email?.toLowerCase().includes(q) || false;
      const matchNote = task.note?.toLowerCase().includes(q) || false;
      const matchType = task.type.toLowerCase().includes(q) || false;
      
      if (!matchName && !matchAddress && !matchPhone && !matchEmail && !matchNote && !matchType) {
        return false;
      }
    }
    return true;
  });

  // Számlálók kiszámítása a teljes tasks listából (vagy a keresési szűrés figyelembevételével)
  const countAll = tasks.length;
  const countTelepites = tasks.filter(t => t.type === "telepites").length;
  const countKarbantartas = tasks.filter(t => t.type === "karbantartas").length;
  
  const countStatusAll = tasks.length;
  const countFolyamatban = tasks.filter(t => !t.completed_at).length;
  const countKesz = tasks.filter(t => Boolean(t.completed_at)).length;

  return (
    <main style={{ maxWidth: "1050px", margin: "20px auto", padding: "16px", fontFamily: "Arial, sans-serif", boxSizing: "border-box" }}>
      <style jsx>{`
        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        .cards-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-top: 16px;
        }
        .filter-buttons {
          display: flex;
          flex-direction: row;
          gap: 6px;
          flex-wrap: wrap;
        }
        .email-input-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        @media (min-width: 600px) {
          .form-grid {
            grid-template-columns: 1fr 1fr;
          }
          .cards-grid {
            grid-template-columns: 1fr 1fr;
          }
          .email-input-row {
            flex-direction: row;
          }
        }
      `}</style>

      {viewingTask && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "16px"
        }}>
          <div style={{
            background: "white", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "500px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", gap: "12px", maxHeight: "90vh", overflowY: "auto", color: "#333"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "8px" }}>
              <h2 style={{ margin: 0, fontSize: "18px" }}>
                {viewingTask.type === "telepites" ? "🛠️ Telepítés Részletei" : "🧹 Karbantartás Részletei"}
              </h2>
              <button onClick={() => setViewingTask(null)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", fontWeight: "bold" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
              <div><strong>Státusz:</strong> {viewingTask.completed_at ? "✅ Kész" : "⏳ Folyamatban"}</div>
              <div><strong>Név:</strong> {viewingTask.name || "-"}</div>
              <div>
                <strong>Cím:</strong>{" "}
                {viewingTask.address ? (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(viewingTask.address)}`} target="_blank" rel="noopener noreferrer" style={{ color: "#1a0dab", textDecoration: "underline", fontWeight: "bold" }}>
                    📍 {viewingTask.address}
                  </a>
                ) : "-"}
              </div>
              <div>
                <strong>Telefon:</strong>{" "}
                {viewingTask.phone ? (
                  <a href={`tel:${viewingTask.phone}`} style={{ color: "#27ae60", textDecoration: "underline", fontWeight: "bold" }}>
                    📞 {viewingTask.phone}
                  </a>
                ) : "-"}
              </div>
              {viewingTask.email && <div><strong>Email:</strong> ✉️ {viewingTask.email}</div>}
              {viewingTask.scheduled_at && <div><strong>Tervezett időpont:</strong> 📅 {formatDateWithDay(viewingTask.scheduled_at)}</div>}
              {viewingTask.completed_at && <div><strong>Megvalósult időpont:</strong> ✅ {formatDateWithDay(viewingTask.completed_at)}</div>}
              <div><strong>Létrehozva:</strong> {formatDateSimple(viewingTask.created_at)}</div>
              {viewingTask.note && <div><strong>Megjegyzés:</strong> {viewingTask.note}</div>}

              <div>
                <strong>Képek:</strong>
                {viewingTask.images && viewingTask.images.length > 0 ? (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                    {viewingTask.images.map((imgUrl, i) => (
                      <a key={i} href={imgUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0070f3", textDecoration: "none", fontWeight: "bold", fontSize: "12px", background: "#f1f1f1", padding: "4px 8px", borderRadius: "4px" }}>
                        🖼️ {i + 1}. kép megtekintése
                      </a>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: "#aaa", fontSize: "13px", display: "block" }}>Nincs csatolt kép</span>
                )}
              </div>
            </div>

            <button onClick={() => setViewingTask(null)} style={{ marginTop: "12px", background: "#6c757d", color: "white", border: "none", padding: "10px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
              Bezárás
            </button>
          </div>
        </div>
      )}

      {statusMessage && (
        <div style={{ marginBottom: "16px", padding: "12px", background: "#f0fff4", color: "#27ae60", border: "1px solid #27ae60", borderRadius: "8px", fontWeight: "bold" }}>
          {statusMessage}
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        {!isFormOpen && !editingTaskId ? (
          <button
            onClick={() => setIsFormOpen(true)}
            style={{
              width: "100%",
              padding: "14px",
              background: "#27ae60",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <span>➕ Új munka rögzítése</span>
          </button>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: "16px", 
              background: editingTaskId ? "#fff5e6" : "#fdfdfd", 
              padding: "20px", 
              borderRadius: "12px", 
              border: editingTaskId ? "2px solid #d35400" : "1px solid #ddd", 
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              color: "#333"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: editingTaskId ? "#d35400" : "#333" }}>
                {editingTaskId ? "✏️ Munka szerkesztése" : "🛠️ Új munka rögzítése"}
              </h3>
              <button type="button" onClick={resetForm} style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", fontWeight: "bold", color: "#666" }}>
                ✕ Bezárás
              </button>
            </div>

            <div>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>Munkatípus:</label>
              <div style={{ display: "flex", gap: "20px" }}>
                <label style={{ cursor: "pointer" }}>
                  <input type="radio" name="type" value="telepites" checked={type === "telepites"} onChange={() => setType("telepites")} /> 🛠️ Telepítés
                </label>
                <label style={{ cursor: "pointer" }}>
                  <input type="radio" name="type" value="karbantartas" checked={type === "karbantartas"} onChange={() => setType("karbantartas")} /> 🧹 Karbantartás
                </label>
              </div>
            </div>

            <div className="form-grid">
              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Név:</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ügyfél neve" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box", color: "#333" }} />
              </div>
              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Cím / Helyszín:</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Pl. Budapest, Fő u. 1." style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box", color: "#333" }} />
              </div>
              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Telefonszám:</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+36 30 123 4567" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box", color: "#333" }} />
              </div>
              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Email cím:</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ugyfel@email.com" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box", color: "#333" }} />
              </div>
              
              <CustomDateTimePicker
                label="Tervezett időpont:"
                value={scheduledAt}
                onChange={setScheduledAt}
              />

              <CustomDateTimePicker
                label="Megvalósult időpont:"
                value={completedAt}
                onChange={setCompletedAt}
              />
            </div>

            <div>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Megjegyzés:</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Egyéb részletek..." rows={3} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box", color: "#333" }} />
            </div>

            <div style={{ background: "white", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px", color: "#333" }}>Értesítés küldése ezekre a címekre:</label>
              {envEmails.map((emailAddr, index) => (
                <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f9f9f9", padding: "6px 10px", borderRadius: "6px", marginBottom: "6px", border: "1px solid #eee" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", flex: 1, color: "#333" }}>
                    <input type="checkbox" checked={selectedRecipients.includes(emailAddr)} onChange={() => handleRecipientToggle(emailAddr)} />
                    <span>{emailAddr}</span>
                  </label>
                  <button type="button" onClick={() => handleRemoveEmailOption(emailAddr)} style={{ background: "#e74c3c", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>Törlés</button>
                </div>
              ))}
              <div className="email-input-row" style={{ marginTop: "8px" }}>
                <input type="email" value={customEmailInput} onChange={(e) => setCustomEmailInput(e.target.value)} placeholder="Új email cím..." style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #ccc", color: "#333" }} />
                <button type="button" onClick={handleAddCustomEmail} style={{ background: "#34495e", color: "white", border: "none", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Hozzáadás</button>
              </div>
            </div>

            <div>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "6px" }}>Képek:</label>
              {existingImages.map((imgUrl, index) => (
                <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "6px", borderRadius: "6px", marginBottom: "4px", border: "1px solid #ccc", color: "#333" }}>
                  <span style={{ fontSize: "13px" }}>📷 Mentett kép #{index + 1}</span>
                  <button type="button" onClick={() => handleRemoveExistingImage(index)} style={{ background: "#e74c3c", color: "white", border: "none", padding: "2px 6px", borderRadius: "4px", fontSize: "11px" }}>Törlés</button>
                </div>
              ))}
              {photos.map((photo, index) => (
                <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "6px", borderRadius: "6px", marginBottom: "4px", border: "1px solid #ccc", color: "#333" }}>
                  <span style={{ fontSize: "13px" }}>📷 {photo.name}</span>
                  <button type="button" onClick={() => handleRemoveNewPhoto(index)} style={{ background: "#e74c3c", color: "white", border: "none", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}>Törlés</button>
                </div>
              ))}
              <input type="file" accept="image/*" onChange={handleAddPhoto} style={{ marginTop: "6px" }} />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{ flex: 1, background: "#27ae60", color: "white", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
              >
                {loading ? "Mentés..." : editingTaskId ? "Módosítás mentése" : "Létrehozás"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={{ background: "#95a5a6", color: "white", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
              >
                Mégse
              </button>
            </div>
          </form>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#1a202c", padding: "16px", borderRadius: "12px", border: "1px solid #4a5568" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div className="filter-buttons">
            <button onClick={() => setFilterType("all")} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #4a5568", background: filterType === "all" ? "#4a5568" : "#2d3748", color: "white", cursor: "pointer", fontWeight: "bold" }}>
              Összes típus ({countAll})
            </button>
            <button onClick={() => setFilterType("telepites")} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #4a5568", background: filterType === "telepites" ? "#4a5568" : "#2d3748", color: "white", cursor: "pointer", fontWeight: "bold" }}>
              Telepítés ({countTelepites})
            </button>
            <button onClick={() => setFilterType("karbantartas")} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #4a5568", background: filterType === "karbantartas" ? "#4a5568" : "#2d3748", color: "white", cursor: "pointer", fontWeight: "bold" }}>
              Karbantartás ({countKarbantartas})
            </button>
          </div>
          <div className="filter-buttons">
            <button onClick={() => setFilterStatus("all")} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #4a5568", background: filterStatus === "all" ? "#3182ce" : "#2d3748", color: "white", cursor: "pointer", fontWeight: "bold" }}>
              Mind státusz ({countStatusAll})
            </button>
            <button onClick={() => setFilterStatus("folyamatban")} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #4a5568", background: filterStatus === "folyamatban" ? "#3182ce" : "#2d3748", color: "white", cursor: "pointer", fontWeight: "bold" }}>
              Folyamatban ({countFolyamatban})
            </button>
            <button onClick={() => setFilterStatus("kesz")} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #4a5568", background: filterStatus === "kesz" ? "#3182ce" : "#2d3748", color: "white", cursor: "pointer", fontWeight: "bold" }}>
              Kész ({countKesz})
            </button>
          </div>
        </div>

        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Keresés név, cím, telefon vagy megjegyzés alapján..."
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #4a5568", background: "#ffffff", color: "#333", boxSizing: "border-box" }}
          />
        </div>

        {filteredTasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px", color: "#a0aec0" }}>Nincs találat a megadott feltételekkel.</div>
        ) : (
          <div className="cards-grid">
            {filteredTasks.map((task) => {
              const isTelepites = task.type === "telepites";
              const isKesz = Boolean(task.completed_at);

              const typeColor = isTelepites ? "#3182ce" : "#38a169";
              const statusBorderColor = isKesz ? "#48bb78" : "#ed8936";

              return (
                <div 
                  key={task.id} 
                  style={{ 
                    border: "1px solid #cbd5e0", 
                    borderLeft: `6px solid ${typeColor}`, 
                    borderTop: `4px solid ${statusBorderColor}`,
                    borderRadius: "10px", 
                    padding: "16px", 
                    background: "#ffffff", 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: "8px", 
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)" 
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold", fontSize: "13px", background: isTelepites ? "#ebf8ff" : "#f0fff4", color: isTelepites ? "#2b6cb0" : "#2f855a", padding: "4px 8px", borderRadius: "4px" }}>
                      {isTelepites ? "🛠️ Telepítés" : "🧹 Karbantartás"}
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: "bold", color: isKesz ? "#2f855a" : "#c05621", background: isKesz ? "#f0fff4" : "#fffaf0", padding: "2px 6px", borderRadius: "4px" }}>
                      {isKesz ? "✅ Kész" : "⏳ Folyamatban"}
                    </span>
                  </div>

                  <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1a202c" }}>{task.name || "Névtelen ügyfél"}</div>
                  {task.address && <div style={{ fontSize: "14px", color: "#4a5568" }}>📍 {task.address}</div>}
                  {task.phone && <div style={{ fontSize: "14px", color: "#4a5568" }}>📞 {task.phone}</div>}
                  {task.email && <div style={{ fontSize: "14px", color: "#4a5568" }}>✉️ {task.email}</div>}
                  {task.scheduled_at && <div style={{ fontSize: "13px", color: "#718096" }}>📅 Tervezett: {formatDateWithDay(task.scheduled_at)}</div>}
                  {task.completed_at && <div style={{ fontSize: "13px", color: "#2f855a" }}>✅ Készülve: {formatDateWithDay(task.completed_at)}</div>}
                  {task.note && <div style={{ fontSize: "13px", color: "#4a5568", fontStyle: "italic", background: "#f7fafc", padding: "6px", borderRadius: "4px", borderLeft: "3px solid #cbd5e0" }}>💬 {task.note}</div>}

                  <div style={{ display: "flex", gap: "8px", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #edf2f7" }}>
                    <button onClick={() => setViewingTask(task)} style={{ flex: 1, background: "#4a5568", color: "white", border: "none", padding: "6px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>Részletek</button>
                    <button onClick={() => startEditing(task)} style={{ background: "#dd6b20", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>Szerkesztés</button>
                    <button onClick={() => handleDelete(task.id)} style={{ background: "#e53e3e", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>Törlés</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
