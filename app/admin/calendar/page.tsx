const handleDelete = async (e: React.MouseEvent, id: any) => {
    e.stopPropagation();
    if (!confirm("Biztosan törölni szeretnéd ezt a bejegyzést?")) return;

    // JAVÍTVA: Az 'install-' kezdetű ID-k is automatikusak
    if (typeof id === 'string' && (id.startsWith('planned') || id.startsWith('overdue') || id.startsWith('install'))) {
      alert("Az automatikus időpontok (telepítés/tervezett) közvetlenül a gép adatlapján módosíthatók.");
      return;
    }

    const res = await fetch(`/api/calendar?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchEvents();
  };

  const openEdit = (e: React.MouseEvent, eventData: any) => {
    e.stopPropagation();
    
    // JAVÍTVA: Az automatikus elemekre kattintva az Ügyfél / Gép adatlapjára visz
    if (typeof eventData.id === 'string' && !eventData.id.startsWith('log-')) {
      if (confirm(`Ez egy automatikusan generált időpont (${TYPE_LABELS[eventData.type]}).\nSzeretnél elnavigálni a gép adatlapjára?`)) {
        router.push(`/clients/${eventData.unitId || eventData.unit?.id}`);
      }
      return;
    }

    const cleanId = typeof eventData.id === 'string' ? parseInt(eventData.id.replace('log-', '')) : eventData.id;
    setEditingId(cleanId);
    setActiveType(eventData.type || "MAINTENANCE");
    setNewEntry({
      unitId: eventData.unitId?.toString() || "",
      date: eventData.date?.includes('T') ? eventData.date.substring(0, 16) : `${eventData.date}T08:00`,
      desc: eventData.description || ""
    });
    setShowModal(true);
  };
