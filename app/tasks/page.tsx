// Biztonságos letöltés
const fetchTasks = async () => {
  try {
    setLoading(true);
    const res = await fetch("/api/tasks");
    
    if (!res.ok) {
      console.error("Szerver hiba:", res.statusText);
      return;
    }

    const data = await res.json();

    // Ha nem tömb érkezik, megelőzzük az összeomlást
    if (!Array.isArray(data)) {
      console.error("Az API nem tömböt adott vissza:", data);
      setTasks([]);
      return;
    }

    // Biztonságos parsing
    const formattedData = data.map((task: any) => {
      let parsedImages = [];
      try {
        if (typeof task.images === "string") {
          parsedImages = JSON.parse(task.images || "[]");
        } else if (Array.isArray(task.images)) {
          parsedImages = task.images;
        }
      } catch (e) {
        parsedImages = [];
      }

      return {
        ...task,
        images: parsedImages
      };
    });

    setTasks(formattedData);
  } catch (err) {
    console.error("Hálózati hiba a betöltéskor:", err);
  } finally {
    setLoading(false);
  }
};
