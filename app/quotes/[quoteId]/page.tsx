// --- MATEMATIKA ---
  const currentBasePriceNet = Number(basePriceNet) || 0;
  const currentQty = Number(qty) || 0;
  
  // Beszerzési bruttó (Alapár * 1.27)
  const basePriceGross = currentBasePriceNet * 1.27;
  
  // Haszon számítása (ha százalék, akkor a bruttó alapárra teszi rá)
  const profitGross = profitType === "percent" 
    ? basePriceGross * ((Number(profitValue) || 0) / 100)
    : (Number(profitValue) || 0);

  // Eladási bruttó = Bruttó alapár + Bruttó haszon
  const sellPriceGross = basePriceGross + profitGross;
  // Visszaosztjuk nettóra a mentéshez
  const sellPriceNet = sellPriceGross / 1.27;
  const lineTotalGross = sellPriceGross * currentQty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? "PATCH" : "POST";
    
    await fetch(`/api/quotes/${quoteId}/items`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        description: desc,
        quantity: currentQty,
        unit,
        basePrice: currentBasePriceNet, // KRITIKUS: Elmentjük a nettó beszerzést!
        unitPriceNet: Math.round(sellPriceNet),
        lineGross: Math.round(lineTotalGross),
        sortOrder: editingId ? q.items.find((i: any) => i.id === editingId)?.sortOrder : q.items.length
      }),
    });
    resetForm();
    loadQuote();
  };

  // --- JAVÍTOTT SZERKESZTÉS INDÍTÁSA ---
  const startEdit = (it: any) => {
    setEditingId(it.id);
    setDesc(it.description);
    const itemQty = Number(it.quantity) || 1;
    setQty(itemQty);
    setUnit(it.unit || "db");
    
    // 1. Nettó beszerzés betöltése (ha nincs mentve, 0 lesz)
    const savedBaseNet = Number(it.basePrice) || 0;
    setBasePriceNet(savedBaseNet);

    // 2. Elmentett bruttó egységár (teljes bruttó / darabszám)
    const savedTotalGross = Number(it.lineGross) || 0;
    const sellPriceGrossPerUnit = savedTotalGross / itemQty;

    // 3. Bruttó beszerzési ár
    const basePriceGrossPerUnit = savedBaseNet * 1.27;

    // 4. HASZON = Mi a különbség az eladási bruttó és a beszerzési bruttó között?
    const diffGross = sellPriceGrossPerUnit - basePriceGrossPerUnit;

    setProfitType("fix");
    // Kerekítjük, hogy ne legyen tizedes hiba
    setProfitValue(Math.round(diffGross));

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
