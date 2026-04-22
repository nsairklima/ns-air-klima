"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// ... (TYPE_COLORS és TYPE_LABELS változatlan)

export default function CalendarPage() {
  const router = useRouter();
  const dateInputRef = useRef<HTMLInputElement>(null); // Ref az input eléréséhez
  // ... (többi state változatlan)

  return (
    <div style={pageStyle}>
      <style>{`
        /* Eltüntetünk minden gyári ikont és sallangot */
        .no-native-icon::-webkit-calendar-picker-indicator {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          cursor: pointer;
          opacity: 0; /* Teljesen átlátszó, de ott van és kattintható */
        }
        
        .input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .calendar-icon-overlay {
          position: absolute;
          right: 12px;
          pointer-events: none; /* Átengedjük a kattintást az alatta lévő inputnak */
          display: flex;
          align-items: center;
        }
      `}</style>

      {/* ... (Header és a többi rész változatlan) */}

      {showModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2 style={{marginTop: 0, fontSize: '18px'}}>{editingId ? "Módosítás" : "Új feladat"}</h2>
            
            {/* ... (Típus és Ügyfél választó változatlan) */}

            <label style={labelStyle}>Időpont:</label>
            <div className="input-container">
              <input 
                type="datetime-local" 
                ref={dateInputRef}
                className="no-native-icon"
                style={{ ...inputStyle, marginBottom: 0 }} 
                value={newEntry.date} 
                onChange={e => setNewEntry({...newEntry, date: e.target.value})} 
              />
              <div className="calendar-icon-overlay">
                {/* Garantáltan fehér SVG ikon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
            </div>
            
            <label style={{ ...labelStyle, marginTop: '12px' }}>Megjegyzés:</label>
            <textarea 
              style={{ ...inputStyle, minHeight: '70px', resize: 'none' }} 
              value={newEntry.desc} 
              onChange={e => setNewEntry({...newEntry, desc: e.target.value})} 
            />
            
            {/* ... (Gombok változatlanok) */}
          </div>
        </div>
      )}

      {/* ... (Naptár rács változatlan) */}
    </div>
  );
}

// Stílusok maradnak a régiek, de az inputStyle-nál figyelj rá, 
// hogy ne legyen padding-right ütközés az ikonnal
const inputStyle: React.CSSProperties = { 
  background: '#222', 
  border: '1px solid #444', 
  color: '#fff', 
  padding: '12px', 
  paddingRight: '40px', // Hely az ikonnak
  marginBottom: '12px', 
  borderRadius: '8px', 
  width: '100%', 
  fontSize: '15px',
  colorScheme: 'dark' 
};
