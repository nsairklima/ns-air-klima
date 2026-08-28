//app/tasks/page.tsx


"use client"; // A komponens kliens oldalon fut (Next.js klienskomponens direktíva, amely engedélyezi az interaktivitást és a hookok használatát)

import { useEffect, useState } from "react"; // A React könyvtárból az useEffect (mellékhatások kezelésére) és a useState (állapotkezelésre) hookok importálása

type Task = { // Egy egyedi TypeScript típusdefiníció (Task) létrehozása a feladatok/munkák adatstruktúrájának leírására
  id: number; // A feladat egyedi azonosítója (szám)
  type: string; // A feladat típusa (szöveg, pl. telepítés vagy karbantartás)
  name?: string; // Az ügyfél neve (opcionális szöveg)
  address?: string; // A munkavégzés címe (opcionális szöveg)
  phone?: string; // Telefonszám (opcionális szöveg)
  email?: string; // Email cím (opcionális szöveg)
  note?: string; // Megjegyzés a munkához (opcionális szöveg)
  scheduled_at?: string; // Tervezett időpont (opcionális szöveg)
  completed_at?: string; // Megvalósult időpont (opcionális szöveg)
  images?: string[]; // Képek URL címeinek tömbje (opcionális)
  created_at: string; // A Létrehozás dátuma (kötelező szöveg)
};

// Segédfüggvény a dátumok szép formázásához
const formatDate = (dateString?: string) => { // Segédfüggvény definiálása, amely átalakítja a nyers dátum/idő stringet olvashatóbb formátumra
  if (!dateString) return "-"; // Ha nincs megadva dátum, visszatér egy kötőjellel
  try { // Hiba kezelésére szolgáló blokk kezdete
    const cleaned = dateString.replace("T", " ").replace("Z", ""); // A dátumban lévő "T" és "Z" karakterek eltávolítása/cseréje a jobb olvashatóságért
    const [datePart, timePart] = cleaned.split(" "); // A string szétbontása dátum és idő részre a szóköz mentén
    if (!datePart) return dateString; // Ha nincs dátum rész, visszatér az eredeti stringgel
    
    const formattedDate = datePart.replace(/-/g, ". "); // A kötőjelek cseréje pontokra a dátumban (pl. ÉÉÉÉ. HH. NN.)
    const formattedTime = timePart ? timePart.slice(0, 5) : ""; // Az időpont lerövidítése az óra és perc részre (első 5 karakter), ha létezik idő
    
    return `${formattedDate}. ${formattedTime}`.trim(); // A formázott dátum és idő összefűzése, majd a felesleges szóközök levágása
  } catch { // Hibakezelési ág, ha bármilyen hiba történne a formázás közben
    return dateString; // Hiba esetén az eredeti stringet adja vissza
  }
};

export default function TasksPage() { // A fő React komponens (TasksPage) deklarálása és alapértelmezett exportálása
  const [type, setType] = useState<"telepites" | "karbantartas">("telepites"); // Munkatípus állapota, alapértelmezetten "telepites"
  const [name, setName] = useState(""); // Név mező állapota, üres alapértelmezett értékkel
  const [address, setAddress] = useState(""); // Cím mező állapota, üres alapértelmezett értékkel
  const [phone, setPhone] = useState(""); // Telefonszám mező állapota, üres alapértelmezett értékkel
  const [email, setEmail] = useState(""); // Email mező állapota, üres alapértelmezett értékkel
  const [note, setNote] = useState(""); // Megjegyzés mező állapota, üres alapértelmezett értékkel
  const [scheduledAt, setScheduledAt] = useState(""); // Tervezett időpont mező állapota, üres alapértelmezett értékkel
  const [completedAt, setCompletedAt] = useState(""); // Megvalósult időpont mező állapota, üres alapértelmezett értékkel
  
  const [photos, setPhotos] = useState<File[]>([]); // Újonnan kiválasztott fájlok/fotók tömbjének állapota
  const [existingImages, setExistingImages] = useState<string[]>([]); // Meglévő, már mentett képek URL-jeinek tömbje

  const [loading, setLoading] = useState(false); // Betöltési/folyamatban lévő művelet jelző állapota (hamis alapértelmezéssel)
  const [statusMessage, setStatusMessage] = useState(""); // Visszajelző üzenet állapota a műveletekhez
  const [tasks, setTasks] = useState<Task[]>([]); // A lekért feladatok listájának állapota (üres tömbbel kezdve)

  const [filterType, setFilterType] = useState<"all" | "telepites" | "karbantartas">("all"); // Szűrési típus állapota, alapértelmezetten az "all" (összes)
  const [searchQuery, setSearchQuery] = useState(""); // Keresési szöveg mező állapota

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null); // A szerkesztés alatt álló feladat ID-ja (vagy null, ha nincs szerkesztés)
  const [viewingTask, setViewingTask] = useState<Task | null>(null); // Az éppen megtekintett feladat részleteinek objektuma (vagy null)

  const fetchTasks = async () => { // Aszinkron függvény a feladatok lekérésére a szerverről
    try { // Próbálkozz blokk
      const res = await fetch("/api/tasks/list", { cache: "no-store" }); // HTTP GET kérés küldése az API-nak cache-elés nélkül
      const data = res.ok ? await res.json() : { tasks: [] }; // A válasz JSON formátumra alakítása, hiba esetén üres tömb visszaadása
      setTasks(data.tasks || []); // A feladatok állapota frissítése a kapott adatokkal
    } catch (error) { // Hiba elkapása
      console.error("Hiba a betöltéskor:", error); // Hiba kiírása a konzolra
    }
  };

  useEffect(() => { // Komponens betöltődésekor futó hook (mellékhatás)
    fetchTasks(); // A feladatok lekérésének meghívása az első rendereléskor
  }, []); // Üres függőségi tömb: csak egyszer fut le a komponens mountolásakor

  const mapsUrl = address // Google Maps URL generálása a megadott cím alapján
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` // Ha van cím, kódolja és beilleszti a Google Maps keresési URL-be
    : "https://maps.google.com"; // Ha nincs cím, az alapértelmezett Google Maps főoldalt adja vissza

  const resetForm = () => { // Űrlap alaphelyzetbe állító segédfüggvény
    setType("telepites"); // Típus visszaállítása "telepites"-re
    setName(""); // Név mező törlése
    setAddress(""); // Cím mező törlése
    setPhone(""); // Telefonszám mező törlése
    setEmail(""); // Email mező törlése
    setNote(""); // Megjegyzés mező törlése
    setScheduledAt(""); // Tervezett időpont törlése
    setCompletedAt(""); // Megvalósult időpont törlése
    setPhotos([]); // Új fotók tömbjének kiürítése
    setExistingImages([]); // Meglévő képek tömbjének kiürítése
    setEditingTaskId(null); // Szerkesztési azonosító törlése (kilépés a szerkesztési módból)
  };

  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => { // Új kép hozzáadását kezelő függvény fájl kiválasztásakor
    if (e.target.files && e.target.files[0]) { // Ellenőrzi, hogy van-e kiválasztott fájl
      const newFile = e.target.files[0]; // Az első kiválasztott fájl eltárolása
      setPhotos((prev) => [...prev, newFile]); // Hozzáadja az új fájlt a meglévő fotók tömbjéhez
      e.target.value = ""; // Az input mező értékének alaphelyzetbe állítása, hogy újra lehessen ugyanazt a fájl tölteni
    }
  };

  const handleRemoveNewPhoto = (indexToRemove: number) => { // Újonnan hozzáadott kép törlése index alapján
    setPhotos((prev) => prev.filter((_, index) => index !== indexToRemove)); // Szűri a fotók tömbjét úgy, hogy a megadott indexű elemet kihagyja
  };

  const handleRemoveExistingImage = (indexToRemove: number) => { // Meglévő kép törlése index alapján
    setExistingImages((prev) => prev.filter((_, index) => index !== indexToRemove)); // Szűri a meglévő képek tömbjét, kihagyva a törlendő indexet
  };

  const handleSubmit = async (e: React.FormEvent) => { // Az űrlap elküldését (mentés vagy módosítás) kezelő aszinkron függvény
    e.preventDefault(); // Megakadályozza az oldal alapértelmezett újratöltődését űrlapküldéskor
    setLoading(true); // Beállítja a betöltési állapotot igazra (gomb letiltása, visszajelzés)
    setStatusMessage(""); // Státuszüzenet törlése az elküldés kezdetén

    const formData = new FormData(); // Új FormData objektum létrehozása a fájlok és adatok szerverre küldéséhez
    formData.append("type", type); // Típus hozzáadása a FormData-hoz
    formData.append("name", name); // Név hozzáadása a FormData-hoz
    formData.append("address", address); // Cím hozzáadása a FormData-hoz
    formData.append("phone", phone); // Telefonszám hozzáadása a FormData-hoz
    formData.append("email", email); // Email hozzáadása a FormData-hoz
    formData.append("note", note); // Megjegyzés hozzáadása a FormData-hoz
    formData.append("scheduledAt", scheduledAt); // Tervezett időpont hozzáadása a FormData-hoz
    formData.append("completedAt", completedAt); // Megvalósult időpont hozzáadása a FormData-hoz

    formData.append("existingImages", JSON.stringify(existingImages)); // Meglévő képek tömbjének JSON szöveggé alakítása és hozzáadása

    photos.forEach((photo) => { // Végigmegy az összes új feltöltött fotón
      formData.append("photos", photo); // Minden egyes fotó hozzáadása a FormData-hoz
    });

    if (editingTaskId) { // Ha van érvényes editingTaskId, akkor meglévő feladatot módosítunk (PUT kérés)
      try { // Próbálkozz blokk
        const res = await fetch(`/api/tasks/${editingTaskId}`, { // HTTP PUT kérés küldése az adott ID-jú task végpontra
          method: "PUT", // HTTP metódus beállítása PUT-ra (frissítés)
          body: formData, // A FormData küldése kérés törzsiként
        });
        const data = await res.json(); // Válasz átalakítása JSON-re

        if (res.ok) { // Ha a válasz sikeres (2xx státuszkód)
          setStatusMessage("✅ Munka sikeresen módosítva!"); // Sikeres státuszüzenet beállítása
          resetForm(); // Űrlap alaphelyzetbe állítása
          fetchTasks(); // Feladatok listájának frissítése
        } else { // Ha a válasz hibaüzenetet hozott
          setStatusMessage("❌ " + (data.error || "Hiba történt a módosítás során.")); // Hibaüzenet megjelenítése
        }
      } catch { // Hálózati vagy egyéb hiba elkapása
        setStatusMessage("❌ Hálózati hiba történt."); // Hálózati hiba üzenet kiírása
      } finally { // Mindenképp lefutó blokk
        setLoading(false); // Betöltési állapot kikapcsolása
      }
    } else { // Ha nincs editingTaskId, akkor új feladatot hozunk létre (POST kérés)
      try { // Próbálkozz blokk
        const res = await fetch("/api/tasks", { // HTTP POST kérés küldése az új feladat létrehozási végpontra
          method: "POST", // HTTP metódus beállítása POST-ra (létrehozás)
          body: formData, // A FormData küldése kérés törzsiként
        });
        const data = await res.json(); // Válasz átalakítása JSON-re

        if (res.ok) { // Ha a válasz sikeres
          setStatusMessage("✅ " + data.message); // Sikeres üzenet beállítása a szerver válasza alapján
          resetForm(); // Űrlap alaphelyzetbe állítása
          fetchTasks(); // Feladatok listájának újratöltése
        } else { // Hiba ág
          setStatusMessage("❌ " + (data.error || "Hiba történt.")); // Hibaüzenet kiírása
        }
      } catch { // Hiba elkapása
        setStatusMessage("❌ Hálózati hiba történt."); // Hálózati hiba üzenet kiírása
      } finally { // Mindenképp lefutó blokk
        setLoading(false); // Betöltési állapot kikapcsolása
      }
    }
  };

  const handleDelete = async (id: number) => { // Feladat törlését végző aszinkron függvény ID alapján
    if (!confirm("Biztosan törlöd ezt a munkát?")) return; // Megerősítő ablak megjelenítése; ha a felhasználó elutasítja, kilép
    try { // Próbálkozz blokk
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" }); // HTTP DELETE kérés küldése az adott ID-jú task törléséhez
      if (res.ok) { // Ha a törlés sikeres volt
        if (editingTaskId === id) resetForm(); // Ha éppen a törölt elemet szerkesztettük, az űrlapot alaphelyzetbe állítjuk
        fetchTasks(); // Feladatok listájának frissítése
      }
    } catch (error) { // Hiba elkapása
      console.error(error); // Hiba kiírása a konzolra
    }
  };

  const startEditing = (task: Task) => { // Szerkesztés elindítását végző függvény egy adott feladat adataival
    setEditingTaskId(task.id); // Beállítja a szerkesztett feladat ID-ját
    setType((task.type as "telepites" | "karbantartas") || "telepites"); // Beállítja a típust, vagy alapértelmezettre vált
    setName(task.name || ""); // Betölti a nevet, vagy üres stringet ad meg
    setAddress(task.address || ""); // Betölti a címet, vagy üres stringet ad meg
    setPhone(task.phone || ""); // Betölti a telefont, vagy üres stringet ad meg

    let taskEmail = task.email || ""; // Lokális változó az email címhez
    let taskNote = task.note || ""; // Lokális változó a megjegyzéshez

    if (!taskEmail && taskNote.includes("| Email:")) { // Ha nincs külön email mező, de a megjegyzés tartalmazza az "| Email:" mintát
      const parts = taskNote.split("| Email:"); // Felbontja a megjegyzést a minta mentén
      taskNote = parts[0].trim(); // A megjegyzés szövege az első rész lesz
      taskEmail = parts[1].trim(); // Az email cím a második rész lesz
    }

    setEmail(taskEmail); // Email állapot beállítása
    setNote(taskNote); // Megjegyzés állapot beállítása
    setScheduledAt(task.scheduled_at ? task.scheduled_at.replace(" ", "T").slice(0, 16) : ""); // Tervezett időpont formázása datetime-local input számára
    setCompletedAt(task.completed_at ? task.completed_at.replace(" ", "T").slice(0, 16) : ""); // Megvalósult időpont formázása datetime-local input számára
    setPhotos([]); // Új fotók tömbjének kiürítése
    setExistingImages(task.images || []); // Meglévő képek betöltése
    setStatusMessage(""); // Státuszüzenet törlése
    window.scrollTo({ top: 0, behavior: "smooth" }); // Oldal tetejére görgetés sima animációval
  };

  const totalCount = tasks.length; // Az összes feladat darabszáma
  const telepitesCount = tasks.filter((t) => t.type === "telepites").length; // A telepítés típusú feladatok darabszáma
  const karbantartasCount = tasks.filter((t) => t.type === "karbantartas").length; // A karbantartás típusú feladatok darabszáma

  const filteredTasks = tasks.filter((task) => { // A feladatok szűrése a kiválasztott típus és keresési lekérdezés alapján
    if (filterType !== "all" && task.type !== filterType) { // Ha a szűrő nem "all" és a feladat típusa nem egyezik a szűrővel
      return false; // Kihagyja a feladatot
    }
    if (searchQuery.trim() !== "") { // Ha van keresési kifejezés megadva
      const q = searchQuery.toLowerCase(); // Kisbetússé alakítja a keresést a case-insensitive találatokért
      const matchName = task.name?.toLowerCase().includes(q) || false; // Ellenőrzi, hogy a név tartalmazza-e a keresést
      const matchAddress = task.address?.toLowerCase().includes(q) || false; // Ellenőrzi, hogy a cím tartalmazza-e a keresést
      const matchPhone = task.phone?.toLowerCase().includes(q) || false; // Ellenőrzi, hogy a telefon tartalmazza-e a keresést
      const matchEmail = task.email?.toLowerCase().includes(q) || false; // Ellenőrzi, hogy az email tartalmazza-e a keresést
      const matchNote = task.note?.toLowerCase().includes(q) || false; // Ellenőrzi, hogy a megjegyzés tartalmazza-e a keresést
      const matchType = task.type.toLowerCase().includes(q) || false; // Ellenőrzi, hogy a típus tartalmazza-e a keresést
      
      if (!matchName && !matchAddress && !matchPhone && !matchEmail && !matchNote && !matchType) { // Ha egyik mező sem illeszkedik
        return false; // Kihagyja a feladatot
      }
    }
    return true; // Ha átment a szűrőkön, megtartja a feladatot
  });

  return ( // A JSX sablon kezdete, ami a felhasználói felületet rendereli
    <main style={{ maxWidth: "1050px", margin: "20px auto", padding: "16px", fontFamily: "system-ui" }}> // Fő konténer elem egyedi stílusokkal
      <style jsx>{` // Helyi CSS stílusok definíciója a Next.js jsx propjával
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
        }
        @media (min-width: 600px) {
          .form-grid {
            grid-template-columns: 1fr 1fr;
          }
          .cards-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      {/* MEGTEKINTÉSI MODÁLIS ABLAK */}
      {viewingTask && ( // Feltételes renderelés: csak akkor jelenik meg, ha a viewingTask értéke nem null
        <div style={{ // Modális háttér stílusai (teljes képernyős sötétített overlay)
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "16px"
        }}>
          <div style={{ // Modális ablak dobozának stílusai
            background: "white", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "500px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", gap: "12px", position: "relative", maxHeight: "90vh", overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "8px" }}>
              <h2 style={{ margin: 0, fontSize: "18px" }}>
                {viewingTask.type === "telepites" ? "🛠️ Telepítés Részletei" : "🧹 Karbantartás Részletei"} {/* Cím változtatása típus alapján */}
              </h2>
              <button onClick={() => setViewingTask(null)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", fontWeight: "bold" }}>✕</button> {/* Bezárás gomb (X) */}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
              <div><strong>Státusz:</strong> {viewingTask.completed_at ? "✅ Kész" : "⏳ Folyamatban"}</div> {/* Státusz kiírása */}
              <div><strong>Név:</strong> {viewingTask.name || "-"}</div> {/* Ügyfél nevének kiírása */}
              
              <div>
                <strong>Cím:</strong>{" "}
                {viewingTask.address ? ( // Ha van cím, kattintható Google Maps linkként jelenik meg
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(viewingTask.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#4285F4", textDecoration: "underline", fontWeight: "bold" }}
                  >
                    📍 {viewingTask.address}
                  </a>
                ) : (
                  "-"
                )}
              </div>

              <div>
                <strong>Telefon:</strong>{" "}
                {viewingTask.phone ? ( // Ha van telefonszám, hívható linkként (tel:) jelenik meg
                  <a
                    href={`tel:${viewingTask.phone}`}
                    style={{ color: "#28a745", textDecoration: "underline", fontWeight: "bold" }}
                  >
                    📞 {viewingTask.phone}
                  </a>
                ) : (
                  "-"
                )}
              </div>

              {viewingTask.email && <div><strong>Email:</strong> ✉️ {viewingTask.email}</div>} {/* Email feltételes kiírása */}
              {viewingTask.scheduled_at && <div><strong>Tervezett időpont:</strong> 📅 {formatDate(viewingTask.scheduled_at)}</div>} {/* Tervezett időpont feltételes kiírása */}
              {viewingTask.completed_at && <div><strong>Megvalósult időpont:</strong> ✅ {formatDate(viewingTask.completed_at)}</div>} {/* Megvalósult időpont feltételes kiírása */}
              <div><strong>Létrehozva:</strong> {formatDate(viewingTask.created_at)}</div> {/* Létrehozási dátum */}
              {viewingTask.note && <div><strong>Megjegyzés:</strong> {viewingTask.note}</div>} {/* Megjegyzés feltételes kiírása */}

              <div>
                <strong>Képek:</strong>
                {viewingTask.images && viewingTask.images.length > 0 ? ( // Ha vannak csatolt képek
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                    {viewingTask.images.map((imgUrl, i) => ( // Végigmegy a képeken és linket készít mindegyikhez
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
              Bezárás {/* Modális ablak bezáró gombja */}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <h1>{editingTaskId ? "✏️ Munka Szerkesztése" : "Munka Kiadása"}</h1> {/* Dinamikus cím: szerkesztés vagy új munka */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ background: "#4285F4", color: "white", padding: "10px 16px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}
        >
          📍 Google Maps {/* Gyorsgomb a Google Maps megnyitásához */}
        </a>
      </div>

      <form
        onSubmit={handleSubmit} // Űrlap elküldési eseménykezelő összekötése a handleSubmit függvénnyel
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: "16px", 
          background: editingTaskId ? "#fff3cd" : "#f9f9f9", // Háttérszín változik szerkesztési módban (sárgás)
          padding: "20px", 
          borderRadius: "12px", 
          border: editingTaskId ? "2px solid #ffc107" : "1px solid #ddd", // Keret szín szerkesztési módban
          transition: "all 0.3s ease"
        }}
      >
        {editingTaskId && ( // Figyelmeztető sáv szerkesztés közben
          <div style={{ background: "#ffeeba", padding: "8px 12px", borderRadius: "6px", color: "#856404", fontSize: "14px", fontWeight: "bold" }}>
            Szerkesztési módban vagy. A módosítások mentéséhez kattints a "Módosítás Mentése" gombra, vagy kattints a "Mégse"-re.
          </div>
        )}

        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>Munkatípus:</label>
          <div style={{ display: "flex", gap: "20px" }}>
            <label style={{ cursor: "pointer" }}>
              <input type="radio" name="type" value="telepites" checked={type === "telepites"} onChange={() => setType("telepites")} /> 🛠️ Telepítés {/* Rádiógomb a telepítés típushoz */}
            </label>
            <label style={{ cursor: "pointer" }}>
              <input type="radio" name="type" value="karbantartas" checked={type === "karbantartas"} onChange={() => setType("karbantartas")} /> 🧹 Karbantartás {/* Rádiógomb a karbantartás típushoz */}
            </label>
          </div>
        </div>

        <div className="form-grid">
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Név (Opcionális):</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ügyfél neve" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} /> {/* Név input mező */}
          </div>
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Cím / Helyszín (Opcionális):</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Pl. 1051 Budapest, Kossuth L. tér 1." style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} /> {/* Cím input mező */}
          </div>
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Telefonszám (Opcionális):</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+36 30 123 4567" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} /> {/* Telefon input mező */}
          </div>
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Email cím (Opcionális):</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ugyfel@email.com" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} /> {/* Email input mező */}
          </div>
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Tervezett időpont (Opcionális):</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box", background: "white" }} /> {/* Tervezett időpont input mező */}
          </div>
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Megvalósult időpont (Opcionális):</label>
            <input type="datetime-local" value={completedAt} onChange={(e) => setCompletedAt(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box", background: "white" }} /> {/* Megvalósult időpont input mező */}
          </div>
        </div>

        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>Megjegyzés (Opcionális):</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Egyéb részletek a munkáról..." rows={3} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} /> {/* Megjegyzés szövegdoboz */}
        </div>

        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "6px" }}>Képek:</label>

          {editingTaskId && existingImages.length > 0 && ( // Meglévő képek listázása szerkesztéskor
            <div style={{ marginBottom: "10px" }}>
              <small style={{ color: "#666", display: "block", marginBottom: "4px", fontWeight: "bold" }}>Már mentett képek:</small>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {existingImages.map((imgUrl, index) => (
                  <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", padding: "6px 10px", borderRadius: "6px", border: "1px solid #ccc" }}>
                    <a href={imgUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#0070f3", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "250px" }}>
                      📷 {index + 1}. meglévő kép megtekintése
                    </a>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveExistingImage(index)} // Meglévő kép törlése gomb
                      style={{ background: "#dc3545", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}
                    >
                      Törlés
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {photos.length > 0 && ( // Újonnan csatolt képek listázása
            <div style={{ marginBottom: "10px" }}>
              <small style={{ color: "#666", display: "block", marginBottom: "4px", fontWeight: "bold" }}>Újonnan csatolt képek:</small>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {photos.map((photo, index) => (
                  <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", padding: "6px 10px", borderRadius: "6px", border: "1px solid #ccc" }}>
                    <span style={{ fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "250px" }}>
                      📷 {photo.name}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveNewPhoto(index)} // Új kép törlése gomb
                      style={{ background: "#dc3545", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}
                    >
                      Törlés
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <label style={{ display: "inline-block", background: "#0070f3", color: "white", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>
            ➕ Kép hozzáadása
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleAddPhoto} // Fájlkiválasztás eseménykezelő
              style={{ display: "none" }} // Rejtett file input mező
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button type="submit" disabled={loading} style={{ flex: 1, background: loading ? "#ccc" : editingTaskId ? "#ffc107" : "#28a745", color: editingTaskId ? "#000" : "white", padding: "14px", fontSize: "16px", fontWeight: "bold", border: "none", borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Feldolgozás..." : editingTaskId ? "Módosítás Mentése" : "Munka Kiadása"} {/* Mentés/Kiadás gomb */}
          </button>
          {editingTaskId && ( // Mégse gomb csak szerkesztési módban jelenik meg
            <button type="button" onClick={resetForm} style={{ background: "#6c757d", color: "white", padding: "14px 20px", fontSize: "16px", fontWeight: "bold", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              Mégse
            </button>
          )}
        </div>
      </form>

      {statusMessage && ( // Státuszüzenet megjelenítése, ha létezik
        <div style={{ marginTop: "20px", padding: "12px", borderRadius: "6px", background: statusMessage.startsWith("✅") ? "#d4edda" : "#f8d7da", color: statusMessage.startsWith("✅") ? "#155724" : "#721c24" }}>
          {statusMessage}
        </div>
      )}

      <h2 style={{ marginTop: "40px", borderBottom: "2px solid #eee", paddingBottom: "10px" }}>Mentett munkák</h2>

      {/* VEZÉRLŐSÁV: EGY SORBAN ELHELYEZKEDŐ, IKONOS-SZÁMOS GOMBOK */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
        <div className="filter-buttons">
          <button
            onClick={() => setFilterType("all")} // Szűrő beállítása "all"-ra (összes)
            style={{
              flex: 1,
              padding: "8px 4px",
              borderRadius: "8px",
              border: "none",
              background: filterType === "all" ? "#0070f3" : "#e2e8f0",
              color: filterType === "all" ? "white" : "#333",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "12px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "2px"
            }}
          >
            <span>📋 Összes</span>
            <span>({totalCount})</span>
          </button>
          <button
            onClick={() => setFilterType("telepites")} // Szűrő beállítása "telepites"-re
            style={{
              flex: 1,
              padding: "8px 4px",
              borderRadius: "8px",
              border: "none",
              background: filterType === "telepites" ? "#3b82f6" : "#e2e8f0",
              color: filterType === "telepites" ? "white" : "#333",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "12px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "2px"
            }}
          >
            <span>🛠️ Telepítés</span>
            <span>({telepitesCount})</span>
          </button>
          <button
            onClick={() => setFilterType("karbantartas")} // Szűrő beállítása "karbantartas"-ra
            style={{
              flex: 1,
              padding: "8px 4px",
              borderRadius: "8px",
              border: "none",
              background: filterType === "karbantartas" ? "#a855f7" : "#e2e8f0",
              color: filterType === "karbantartas" ? "white" : "#333",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "12px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "2px"
            }}
          >
            <span>🧹 Karbantartás</span>
            <span>({karbantartasCount})</span>
          </button>
        </div>

        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} // Keresési mező értékének frissítése eseménykezelővel
            placeholder="🔍 Keresés név, cím, telefon, email vagy megjegyzés alapján..."
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
              fontSize: "14px"
            }}
          />
        </div>
      </div>

      {filteredTasks.length === 0 ? ( // Ha nincsenek a szűrőnek megfelelő feladatok
        <p style={{ color: "#666", marginTop: "16px" }}>Nincs a keresési feltételeknek megfelelő munka.</p>
      ) : ( // Különben megjeleníti a kártyákat
        <div className="cards-grid">
          {filteredTasks.map((task) => { // Végigmegy a szűrt feladatokon és kártyát generál mindegyikhez
            const isCompleted = Boolean(task.completed_at); // Logikai érték: kész van-e a feladat
            const isTelepites = task.type === "telepites"; // Logikai érték: telepítés-e a feladat

            let cardBackground = "#fff";
            let borderColor = "#e0e0e0";
            let statusBadgeBg = "#e2e8f0";
            let statusBadgeColor = "#475569";

            if (isCompleted) { // Ha kész van, zöldes színeket kap
              cardBackground = "#DFF0C4"; //#f0fdf4"
              borderColor = "#bbf7d0";
              statusBadgeBg = "#dcfce7";
              statusBadgeColor = "#166534";
            } else { // Ha folyamatban van
              if (isTelepites) { // Telepítés esetén kékes színek
                cardBackground = "#DAE9FC"; //#f8fafc
                borderColor = "#cbd5e1";
              } else { // Karbantartás esetén lila színek
                cardBackground = "#FAE4FF"; //#fdf4ff
                borderColor = "#f5d0fe";
              }
            }

            return (
              <div
                key={task.id} // Egyedi kulcs React elem rendereléshez
                style={{
                  background: cardBackground,
                  border: editingTaskId === task.id ? "2px solid #ffc107" : `1px solid ${borderColor}`,
                  borderLeft: `6px solid ${isCompleted ? "#22c55e" : isTelepites ? "#3b82f6" : "#a855f7"}`,
                  borderRadius: "10px",
                  padding: "16px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: "8px", gap: "8px" }}>
                  <span style={{ fontWeight: "bold", fontSize: "15px", color: "#333" }}>
                    {isTelepites ? "🛠️ Telepítés" : "🧹 Karbantartás"}
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", background: statusBadgeBg, color: statusBadgeColor, fontWeight: "bold" }}>
                      {isCompleted ? "✅ Kész" : "⏳ Folyamatban"}
                    </span>
                    <span style={{ fontSize: "11px", color: "#666", fontWeight: "500" }}>{formatDate(task.created_at)}</span>
                  </div>
                </div>

                <div style={{ fontSize: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div><strong>Név:</strong> {task.name || "-"}</div>
                  <div><strong>Cím:</strong> {task.address || "-"}</div>
                  {task.phone && <div><strong>Telefon:</strong> 📞 {task.phone}</div>}
                  {task.email && <div><strong>Email:</strong> ✉️ {task.email}</div>}
                  {task.scheduled_at && <div><strong>Tervezett időpont:</strong> 📅 {formatDate(task.scheduled_at)}</div>}
                  {task.completed_at && <div><strong>Megvalósult időpont:</strong> ✅ {formatDate(task.completed_at)}</div>}
                  {task.note && <div><strong>Megjegyzés:</strong> {task.note}</div>}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "10px", borderTop: "1px solid rgba(0,0,0,0.06)", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    {task.images && task.images.length > 0 ? (
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {task.images.map((imgUrl, i) => (
                          <a key={i} href={imgUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0070f3", textDecoration: "none", fontWeight: "bold", fontSize: "11px", background: "rgba(0,0,0,0.05)", padding: "2px 6px", borderRadius: "4px" }}>
                            📷 {i + 1}. kép
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "#aaa", fontSize: "12px" }}>Nincs kép</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    <button onClick={() => setViewingTask(task)} style={{ background: "#17a2b8", color: "white", border: "none", padding: "5px 8px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}>👁️ Megnyitás</button> {/* Megnyitás gomb */}
                    <button onClick={() => startEditing(task)} style={{ background: "#ffc107", border: "none", padding: "5px 8px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}>✏️ Szerkesztés</button> {/* Szerkesztés gomb */}
                    <button onClick={() => handleDelete(task.id)} style={{ background: "#dc3545", color: "white", border: "none", padding: "5px 8px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}>🗑️ Törlés</button> {/* Törlés gomb */}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
