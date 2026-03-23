return (
    <div style={wrap}>
      <a href="/quotes" style={{ color: "#666", textDecoration: "none" }}>← Vissza az ajánlatokhoz</a>
      
      <h1 style={{ marginTop: 12 }}>Ajánlat #{q.id}</h1>
      
      <div style={{ color: "#444" }}>
        Ügyfél: <strong>{q.client?.name || `Ügyfél #${q.client?.id}`}</strong>
      </div>

      <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setStatus("draft")} style={statusBtn("draft", q.status)}>Piszkozat</button>
        <button onClick={() => setStatus("sent")} style={statusBtn("sent", q.status)}>Elküldve</button>
        <button onClick={() => setStatus("accepted")} style={statusBtn("accepted", q.status)}>Elfogadva</button>
        <button onClick={() => setStatus("rejected")} style={statusBtn("rejected", q.status)}>Elutasítva</button>
        <a href={`/api/quotes/${q.id}/pdf`} target="_blank" style={{ marginLeft: "auto", color: "#4DA3FF", textDecoration: "none" }}>PDF megnyitása →</a>
      </div>

      <h2 style={{ marginTop: 24 }}>Tételek</h2>
      {q.items.length === 0 && <p>Még nincs tétel.</p>}
      <div style={{ display: "grid", gap: 8 }}>
        {q.items.map(it => (
          <div key={it.id} style={card}>
            <div><strong>{it.description}</strong> {it.unit ? `(${it.unit})` : ""}</div>
            <div style={{ color: "#444", fontSize: 14 }}>
              {it.quantity} × {it.unitPriceNet.toLocaleString("hu-HU")} Ft (ÁFA {it.vatRate}%)
            </div>
            <div style={{ marginTop: 6 }}>
              Nettó: {it.lineNet.toLocaleString("hu-HU")} Ft • ÁFA: {it.lineVat.toLocaleString("hu-HU")} Ft • Bruttó: {it.lineGross.toLocaleString("hu-HU")} Ft
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 16 }}>Új tétel</h3>
      <form onSubmit={addItem} style={form}>
        <input placeholder="Leírás*" value={description} onChange={(e)=>setDescription(e.target.value)} style={input} />
        <input placeholder="Mennyiség" type="number" step="0.001" value={quantity} onChange={(e)=>setQuantity(e.target.value)} style={input} />
        <input placeholder="Egység" value={unit} onChange={(e)=>setUnit(e.target.value)} style={input} />
        <input placeholder="Nettó egységár*" type="number" step="0.01" value={unitPriceNet} onChange={(e)=>setUnitPriceNet(e.target.value)} style={input} />
        <input placeholder="ÁFA %" type="number" step="0.1" value={vatRate} onChange={(e)=>setVatRate(e.target.value)} style={input} />
        <button disabled={saving} style={btnPrimary}>{saving ? "Mentés…" : "Tétel hozzáadása"}</button>
      </form>

      <h2 style={{ marginTop: 24 }}>Összesítés</h2>
      <div style={card}>
        Nettó: <strong>{q.netTotal.toLocaleString("hu-HU")} Ft</strong> &nbsp;•&nbsp;
        ÁFA: <strong>{q.vatAmount.toLocaleString("hu-HU")} Ft</strong> &nbsp;•&nbsp;
        Bruttó: <strong>{q.grossTotal.toLocaleString("hu-HU")} Ft</strong>
      </div>
    </div>
  );
