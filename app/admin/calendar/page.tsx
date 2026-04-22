"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ... (TYPE_COLORS és TYPE_LABELS változatlan)

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Effektushoz szükséges állapotok
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [translateX, setTranslateX] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [newEntry, setNewEntry] = useState({ unitId: "", title: "", date: "", desc: "" });

  const prevMonth = () => {
    setIsTransitioning(true);
    setTranslateX(100); // Jobbra kiütjük
    setTimeout(() => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
      setTranslateX(-100); // Balról bejön
      setTimeout(() => {
        setTranslateX(0);
        setIsTransitioning(false);
      }, 50);
    }, 200);
  };

  const nextMonth = () => {
    setIsTransitioning(true);
    setTranslateX(-100); // Balra kiütjük
    setTimeout(() => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
      setTranslateX(100); // Jobbról bejön
      setTimeout(() => {
        setTranslateX(0);
        setIsTransitioning(false);
      }, 50);
    }, 200);
  };

  // Swipe és Mozgatás logika
  const handleTouchStart = (e: React.TouchEvent) => {
    if (selectedDate) return;
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || selectedDate) return;
    const currentX = e.targetTouches[0].clientX;
    const diff = currentX - touchStart;
    
    // Követi az ujjat (max 50px-ig engedjük elmozdulni húzás közben)
    setTranslateX(diff * 0.5); 
  };

  const handleTouchEnd = () => {
    if (!touchStart || selectedDate) return;
    
    if (translateX > 80) prevMonth();
    else if (translateX < -80) nextMonth();
    else setTranslateX(0); // Ha nem volt elég nagy a húzás, visszaugrik

    setTouchStart(null);
  };

  // ... (fetchEvents, fetchUnits, handleSave, openEdit marad)

  return (
    <div style={pageStyle}>
      <style>{`
        .calendar-content {
          transition: ${isTransitioning ? 'transform 0.2s ease-out, opacity 0.2s' : 'none'};
          opacity: ${isTransitioning ? 0 : 1};
        }
        .type-btn { flex: 1; border: 2px solid transparent; color: #fff; padding: 10px; borderRadius: 8px; cursor: pointer; font-size: 11px; opacity: 0.5; transition: 0.2s; }
        .type-btn.active { opacity: 1; border-color: white; transform: scale(1.05); }
        .day-cell:hover { background: #334155 !important; }
      `}</style>

      {/* Header rész marad ugyanaz */}
      <header style={{ marginBottom: '25px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => selectedDate ? setSelectedDate(null) : router.push("/")} style={backBtn}>
            {selectedDate ? "← Vissza" : "⬅ Főmenü"}
          </button>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
             {!selectedDate && (
               <>
                 <button onClick={() => { setEditingId(null); setShowModal(true); }} style={quickAddBtn}>+ ÚJ</button>
                 <button onClick={prevMonth} style={navBtn}>‹</button>
                 <button onClick={nextMonth} style={navBtn}>›</button>
               </>
             )}
          </div>
        </div>
        <h1 style={{ fontSize: '28px', marginTop: '20px', fontWeight: '800' }}>
          {selectedDate ? `📅 ${selectedDate}` : `${currentDate.getFullYear()}. ${currentDate.getMonth() + 1}.`}
        </h1>
      </header>

      <main 
        style={{ 
            flex: 1, 
            overflow: 'hidden', // Fontos az elmozdulás miatt
            touchAction: 'pan-y' // Csak a függőleges görgetést hagyjuk meg a böngészőnek
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="calendar-content"
          style={{ 
            transform: `translateX(${translateX}px)`,
            height: '100%'
          }}
        >
          {selectedDate ? (
            <div style={dailyContainer}>
                {/* Napi lista marad ugyanaz */}
            </div>
          ) : (
            <div style={calendarGrid}>
              {["H", "K", "Sze", "Cs", "P", "Szo", "V"].map(d => <div key={d} style={dayHeader}>{d}</div>)}
              {/* Naptár generálás marad ugyanaz */}
            </div>
          )}
        </div>
      </main>

      {/* Footer és Modal marad ugyanaz */}
    </div>
  );
}

// STÍLUSOK (Változatlanul)
