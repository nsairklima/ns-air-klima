"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type MaintenanceType = "WASH" | "DISINFECTION";
type PaymentMethod = "CASH" | "TRANSFER" | null;
type Receiver = "FIRST_PERSON" | "SECOND_PERSON" | null;
type Tab = "summary" | "prices" | "items" | "periods" | "logs";

type Price = {
  id: number;
  maintenanceType: MaintenanceType;
  totalPrice: number;
  firstPersonAmount: number;
  secondPersonAmount: number;
  validFrom: string;
  createdAt: string;
};

type SummaryBlock = {
  count: number;
  totalRevenue: number;
  firstPersonTotal: number;
  secondPersonTotal: number;
};

type SettlementItem = {
  id: number;
  taskId: number;
  machineIndex: number;
  clientName: string | null;
  machineName: string;
  maintenanceType: MaintenanceType;
  paymentMethod: PaymentMethod;
  receivedBy: Receiver;
  appliedPrice: number;
  firstPersonAmount: number;
  secondPersonAmount: number;
  completedAt: string;
  periodId: number;
  priceId: number;
  createdAt: string;
};

type PeriodSummary = {
  wash: SummaryBlock;
  disinfection: SummaryBlock;
  total: SummaryBlock;
  received?: { firstPerson: number; secondPerson: number; total: number };
  balances?: { firstPerson: number; secondPerson: number };
  settlement?: {
    direction: "FIRST_PAYS_SECOND" | "SECOND_PAYS_FIRST" | "SETTLED" | "INCOMPLETE";
    amount: number;
  };
  paymentValidation?: {
    missingPaymentMethodCount: number;
    missingPaymentMethodAmount: number;
    isComplete: boolean;
  };
};

type PreviousPeriod = {
  id: number;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  summary: PeriodSummary;
};

type AuditLog = {
  id: number;
  eventType: string;
  entityType: string;
  entityId: number | null;
  description: string | null;
  details: unknown;
  createdAt: string;
};

type SummaryResponse = {
  activePeriod: { id: number; startedAt: string; endedAt: string | null; createdAt: string };
  currentPrices: { WASH: Price | null; DISINFECTION: Price | null };
  summary: PeriodSummary & {
    validation: { distributedTotal: number; expectedTotal: number; difference: number; isValid: boolean };
  };
  items: SettlementItem[];
  previousPeriods: PreviousPeriod[];
  auditLogs: AuditLog[];
};

type PriceForm = { totalPrice: string; firstPersonAmount: string; secondPersonAmount: string };
type CorrectionForm = {
  maintenanceType: MaintenanceType;
  paymentMethod: "CASH" | "TRANSFER";
  machineName: string;
  appliedPrice: string;
  firstPersonAmount: string;
  secondPersonAmount: string;
  completedAt: string;
  reason: string;
};

const emptyPrice: PriceForm = { totalPrice: "", firstPersonAmount: "", secondPersonAmount: "" };
const card = { background: "#fff", borderRadius: 12, padding: 12, color: "#0f172a" } as const;
const inputStyle = { width: "100%", boxSizing: "border-box" as const, padding: "9px 10px", marginTop: 4, border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", color: "#0f172a" };

function money(value: number | undefined | null) {
  return `${Number(value || 0).toLocaleString("hu-HU")} Ft`;
}
function date(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString("hu-HU");
}
function localDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function amount(value: string) {
  const cleaned = value.replace(/[^0-9-]/g, "");
  return cleaned ? Number(cleaned) || 0 : 0;
}
function typeLabel(value: MaintenanceType) {
  return value === "WASH" ? "Mosás" : "Fertőtlenítés";
}
function eventLabel(value: string) {
  return ({ PRICE_CREATED: "Új ár", SETTLEMENT_ITEM_CREATED: "Elszámolási tétel", PERIOD_RESET: "Időszak lezárása", SETTLEMENT_ITEM_ADJUSTED: "Kézi korrekció", SETTLEMENT_ITEM_VOIDED: "Érvénytelenítés" } as Record<string, string>)[value] || value;
}

export default function MaintenanceSummaryPage() {
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [tab, setTab] = useState<Tab>("summary");
  const [washForm, setWashForm] = useState<PriceForm>({ ...emptyPrice });
  const [disinfectionForm, setDisinfectionForm] = useState<PriceForm>({ ...emptyPrice });
  const [resetReason, setResetReason] = useState("");
  const [correctionItem, setCorrectionItem] = useState<SettlementItem | null>(null);
  const [correction, setCorrection] = useState<CorrectionForm | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/maintenance-summary", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.details || body.error || "Az összesítő betöltése nem sikerült.");
      setData(body);
      if (body.currentPrices?.WASH) setWashForm({ totalPrice: String(body.currentPrices.WASH.totalPrice), firstPersonAmount: String(body.currentPrices.WASH.firstPersonAmount), secondPersonAmount: String(body.currentPrices.WASH.secondPersonAmount) });
      if (body.currentPrices?.DISINFECTION) setDisinfectionForm({ totalPrice: String(body.currentPrices.DISINFECTION.totalPrice), firstPersonAmount: String(body.currentPrices.DISINFECTION.firstPersonAmount), secondPersonAmount: String(body.currentPrices.DISINFECTION.secondPersonAmount) });
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Betöltési hiba." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const summary = useMemo(() => {
    if (!data) return null;
    return {
      ...data.summary,
      received: data.summary.received ?? { firstPerson: 0, secondPerson: 0, total: 0 },
      balances: data.summary.balances ?? { firstPerson: 0, secondPerson: 0 },
      settlement: data.summary.settlement ?? { direction: "INCOMPLETE" as const, amount: 0 },
      paymentValidation: data.summary.paymentValidation ?? { missingPaymentMethodCount: 0, missingPaymentMethodAmount: 0, isComplete: false },
    };
  }, [data]);

  async function savePrice(maintenanceType: MaintenanceType, form: PriceForm) {
    const totalPrice = amount(form.totalPrice);
    const firstPersonAmount = amount(form.firstPersonAmount);
    const secondPersonAmount = amount(form.secondPersonAmount);
    if (firstPersonAmount + secondPersonAmount !== totalPrice) {
      setStatus({ type: "error", text: "A két személy része nem egyezik meg a teljes árral." });
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/maintenance-summary/prices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ maintenanceType, totalPrice, firstPersonAmount, secondPersonAmount }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.details || body.error || "Az ár mentése nem sikerült.");
      setStatus({ type: "success", text: body.message || "Az új ár elmentve." });
      await load();
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Mentési hiba." });
    } finally { setSaving(false); }
  }

  async function resetPeriod() {
    if (resetReason.trim().length < 5) {
      setStatus({ type: "error", text: "A reset indoka legalább 5 karakter legyen." });
      return;
    }
    if (!window.confirm("Biztosan lezárod az aktuális időszakot? A korábbi adatok megmaradnak.")) return;
    setSaving(true);
    try {
      const response = await fetch("/api/maintenance-summary/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: resetReason.trim() }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.details || body.error || "A lezárás nem sikerült.");
      setResetReason("");
      setStatus({ type: "success", text: body.message || "Új időszak indult." });
      await load();
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Reset hiba." });
    } finally { setSaving(false); }
  }

  async function backfillExistingTasks() {
    if (!window.confirm("Biztosan feldolgozod a meglévő teljesített karbantartásokat?")) return;
    setSaving(true);
    try {
      const response = await fetch("/api/maintenance-summary/backfill", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.details || body.error || "A visszatöltés nem sikerült.");
      const result = body.result || {};
      setStatus({ type: "success", text: `Visszatöltés kész. Új tételek: ${result.createdItemCount || 0} db. Kiegészített tételek: ${result.completedExistingItemCount || 0} db. Hibák: ${result.errorCount || 0} db.` });
      await load();
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Visszatöltési hiba." });
    } finally { setSaving(false); }
  }

  function openCorrection(item: SettlementItem) {
    setCorrectionItem(item);
    setCorrection({
      maintenanceType: item.maintenanceType,
      paymentMethod: item.paymentMethod === "TRANSFER" ? "TRANSFER" : "CASH",
      machineName: item.machineName,
      appliedPrice: String(item.appliedPrice),
      firstPersonAmount: String(item.firstPersonAmount),
      secondPersonAmount: String(item.secondPersonAmount),
      completedAt: localDate(item.completedAt),
      reason: "",
    });
  }

  async function saveCorrection() {
    if (!correctionItem || !correction) return;
    const appliedPrice = amount(correction.appliedPrice);
    const firstPersonAmount = amount(correction.firstPersonAmount);
    const secondPersonAmount = amount(correction.secondPersonAmount);
    if (firstPersonAmount + secondPersonAmount !== appliedPrice) {
      setStatus({ type: "error", text: "A két személy része nem egyezik meg a teljes árral." });
      return;
    }
    if (correction.reason.trim().length < 5) {
      setStatus({ type: "error", text: "A korrekció indoka legalább 5 karakter legyen." });
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/maintenance-summary/items/${correctionItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...correction, appliedPrice, firstPersonAmount, secondPersonAmount, reason: correction.reason.trim() }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.details || body.error || "A korrekció nem sikerült.");
      setCorrectionItem(null);
      setCorrection(null);
      setStatus({ type: "success", text: body.message || "A korrekció elmentve." });
      await load();
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Korrekciós hiba." });
    } finally { setSaving(false); }
  }

  if (loading && !data) return <main style={{ padding: 20, color: "#fff" }}>Elszámolás betöltése...</main>;
  if (!data || !summary) return <main style={{ padding: 20, color: "#fff" }}>{status?.text || "Az adatok nem tölthetők be."}</main>;

  function SummaryCard({ title, value, color }: { title: string; value: SummaryBlock; color: string }) {
    return <div style={{ ...card, border: `2px solid ${color}`, fontSize: 13, lineHeight: 1.5 }}>
      <strong style={{ color, fontSize: 14 }}>{title}</strong>
      <div>Darabszám: <b>{value.count} db</b></div>
      <div>Teljes bevétel: <b>{money(value.totalRevenue)}</b></div>
      <div>1. fő része: <b>{money(value.firstPersonTotal)}</b></div>
      <div>2. fő része: <b>{money(value.secondPersonTotal)}</b></div>
    </div>;
  }

  function PriceCard({ type, title, form, setForm, current, color }: { type: MaintenanceType; title: string; form: PriceForm; setForm: (form: PriceForm) => void; current: Price | null; color: string }) {
    const valid = amount(form.firstPersonAmount) + amount(form.secondPersonAmount) === amount(form.totalPrice);
    return <div style={{ ...card, border: `2px solid ${color}` }}>
      <h3 style={{ margin: "0 0 8px", color }}>{title}</h3>
      {current && <div style={{ marginBottom: 8, fontSize: 12 }}>Jelenlegi ár: <b>{money(current.totalPrice)}</b><br />Érvényes: {date(current.validFrom)}</div>}
      {(["totalPrice", "firstPersonAmount", "secondPersonAmount"] as const).map((field) => <label key={field} style={{ display: "block", marginBottom: 8 }}>
        <b>{field === "totalPrice" ? "Teljes ár" : field === "firstPersonAmount" ? "1. fő része" : "2. fő része"}:</b>
        <input type="number" min="0" value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} style={inputStyle} />
      </label>)}
      <div style={{ padding: 8, marginBottom: 8, borderRadius: 8, background: valid ? "#dcfce7" : "#fee2e2", color: valid ? "#166534" : "#991b1b", fontSize: 12, fontWeight: 700 }}>{valid ? "✅ Az elosztás pontos." : "⚠️ A két rész nem egyezik a teljes árral."}</div>
      <button type="button" disabled={saving || !valid} onClick={() => savePrice(type, form)} style={{ width: "100%", padding: 9, border: 0, borderRadius: 8, background: saving || !valid ? "#94a3b8" : color, color: "#fff", fontWeight: 700 }}>Új árverzió mentése</button>
    </div>;
  }

  return <main style={{ maxWidth: 1200, margin: "8px auto", padding: 10, fontFamily: "Arial, sans-serif", boxSizing: "border-box" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
      <div><h1 style={{ margin: "0 0 4px", fontSize: 20, color: "#fff" }}>💰 Karbantartási elszámolás</h1><div style={{ color: "#cbd5e1", fontSize: 12 }}>Aktuális időszak: {date(data.activePeriod.startedAt)}</div></div>
      <a href="/tasks" style={{ padding: "8px 12px", background: "#334155", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 700 }}>← Vissza</a>
    </div>

    {status && <div style={{ padding: 10, marginBottom: 10, borderRadius: 8, background: status.type === "success" ? "#dcfce7" : "#fee2e2", color: status.type === "success" ? "#166534" : "#991b1b", fontWeight: 700 }}>{status.text}</div>}

    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
      {([ ["summary", "📊 Összesítő"], ["prices", "💵 Árak"], ["items", "🧾 Tételek"], ["periods", "📁 Időszakok"], ["logs", "📋 Napló"] ] as [Tab, string][]).map(([key, label]) => <button key={key} type="button" onClick={() => setTab(key)} style={{ padding: "7px 10px", border: 0, borderRadius: 7, background: tab === key ? "#2563eb" : "#e2e8f0", color: tab === key ? "#fff" : "#0f172a", fontWeight: 700, fontSize: 12 }}>{label}</button>)}
    </div>

    {tab === "summary" && <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 8, marginBottom: 10 }}>
        <SummaryCard title="🧼 Mosás" value={summary.wash} color="#2563eb" />
        <SummaryCard title="🧴 Fertőtlenítés" value={summary.disinfection} color="#7c3aed" />
        <SummaryCard title="💰 Összesen" value={summary.total} color="#16a34a" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 8, marginBottom: 10 }}>
        <div style={{ ...card, border: "2px solid #16a34a" }}><b>💵 1. főhöz készpénz</b><div style={{ fontSize: 18, fontWeight: 800 }}>{money(summary.received.firstPerson)}</div></div>
        <div style={{ ...card, border: "2px solid #2563eb" }}><b>🏦 2. főhöz átutalás</b><div style={{ fontSize: 18, fontWeight: 800 }}>{money(summary.received.secondPerson)}</div></div>
        <div style={{ ...card, border: "2px solid #64748b" }}><b>💰 Beérkezett összesen</b><div style={{ fontSize: 18, fontWeight: 800 }}>{money(summary.received.total)}</div></div>
      </div>

      <div style={{ ...card, marginBottom: 10, border: `2px solid ${summary.settlement.direction === "INCOMPLETE" ? "#f59e0b" : summary.settlement.direction === "SETTLED" ? "#16a34a" : "#2563eb"}` }}>
        <h3 style={{ margin: "0 0 6px", fontSize: 15 }}>🤝 Egymás közötti elszámolás</h3>
        <div>1. főnek jár: <b>{money(summary.total.firstPersonTotal)}</b>, beérkezett: <b>{money(summary.received.firstPerson)}</b></div>
        <div>2. főnek jár: <b>{money(summary.total.secondPersonTotal)}</b>, beérkezett: <b>{money(summary.received.secondPerson)}</b></div>
        <div style={{ marginTop: 8, fontWeight: 800 }}>
          {summary.settlement.direction === "FIRST_PAYS_SECOND" && `Az 1. fő fizet a 2. főnek: ${money(summary.settlement.amount)}`}
          {summary.settlement.direction === "SECOND_PAYS_FIRST" && `A 2. fő fizet az 1. főnek: ${money(summary.settlement.amount)}`}
          {summary.settlement.direction === "SETTLED" && "✅ Nincs rendezendő összeg."}
          {summary.settlement.direction === "INCOMPLETE" && `⚠️ Hiányos: ${summary.paymentValidation.missingPaymentMethodCount} tételnél nincs fizetési mód (${money(summary.paymentValidation.missingPaymentMethodAmount)}).`}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 8, alignItems: "stretch" }}>
        <div style={{ ...card, background: "#fff7ed", border: "1px solid #fdba74", boxShadow: "0 3px 10px rgba(15,23,42,.1)" }}>
          <h3 style={{ margin: "0 0 7px", color: "#9a3412", fontSize: 15 }}>🔄 Új elszámolási időszak</h3>
          <p style={{ margin: "0 0 10px", color: "#7c2d12", fontSize: 12 }}>A korábbi adatok megmaradnak, az új számláló nulláról indul.</p>
          <input value={resetReason} onChange={(e) => setResetReason(e.target.value)} placeholder="A reset indoka..." style={{ ...inputStyle, marginBottom: 8 }} />
          <button type="button" disabled={saving} onClick={resetPeriod} style={{ width: "100%", padding: 9, border: 0, borderRadius: 8, background: saving ? "#94a3b8" : "#ea580c", color: "#fff", fontWeight: 700 }}>{saving ? "Művelet folyamatban..." : "Aktuális időszak lezárása"}</button>
        </div>

        <div style={{ ...card, background: "#eff6ff", border: "1px solid #60a5fa", boxShadow: "0 3px 10px rgba(15,23,42,.1)" }}>
          <h3 style={{ margin: "0 0 7px", color: "#1e3a8a", fontSize: 15 }}>🔄 Meglévő munkák visszatöltése</h3>
          <p style={{ margin: "0 0 10px", color: "#334155", fontSize: 12 }}>A hiányzó tételeket létrehozza, a fizetési mód nélküli tételeket naplózva kiegészíti.</p>
          <button type="button" disabled={saving} onClick={backfillExistingTasks} style={{ width: "100%", padding: 9, border: 0, borderRadius: 8, background: saving ? "#94a3b8" : "#2563eb", color: "#fff", fontWeight: 700 }}>{saving ? "Feldolgozás..." : "Meglévő karbantartások feldolgozása"}</button>
        </div>
      </div>
    </>}

    {tab === "prices" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12 }}>
      <PriceCard type="WASH" title="🧼 Mosás ára" form={washForm} setForm={setWashForm} current={data.currentPrices.WASH} color="#2563eb" />
      <PriceCard type="DISINFECTION" title="🧴 Fertőtlenítés ára" form={disinfectionForm} setForm={setDisinfectionForm} current={data.currentPrices.DISINFECTION} color="#7c3aed" />
    </div>}

    {tab === "items" && <div>{data.items.length === 0 ? <div style={card}>Nincs elszámolási tétel.</div> : data.items.map((item) => <div key={item.id} style={{ ...card, marginBottom: 8, borderLeft: `5px solid ${item.maintenanceType === "WASH" ? "#2563eb" : "#7c3aed"}` }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}><b>{typeLabel(item.maintenanceType)}</b><b>{money(item.appliedPrice)}</b></div>
      <div>Munka: #{item.taskId} · Ügyfél: {item.clientName || "-"}</div>
      <div>Gép: {item.machineName}</div>
      <div>Fizetés: {item.paymentMethod === "CASH" ? "Készpénz → 1. fő" : item.paymentMethod === "TRANSFER" ? "Átutalás → 2. fő" : "Nincs megadva"}</div>
      <div>1. fő: {money(item.firstPersonAmount)} · 2. fő: {money(item.secondPersonAmount)}</div>
      <div>Teljesítve: {date(item.completedAt)}</div>
      <button type="button" onClick={() => openCorrection(item)} style={{ marginTop: 8, padding: "7px 10px", border: 0, borderRadius: 7, background: "#f59e0b", color: "#fff", fontWeight: 700 }}>✏️ Kézi korrekció</button>
    </div>)}</div>}

    {tab === "periods" && <div>{data.previousPeriods.length === 0 ? <div style={card}>Még nincs lezárt időszak.</div> : data.previousPeriods.map((period) => <div key={period.id} style={{ ...card, marginBottom: 8 }}><b>Időszak #{period.id}</b><div>{date(period.startedAt)} – {date(period.endedAt)}</div><div>Mosás: {period.summary.wash.count} db · Fertőtlenítés: {period.summary.disinfection.count} db</div><div>Teljes bevétel: <b>{money(period.summary.total.totalRevenue)}</b></div></div>)}</div>}

    {tab === "logs" && <div>{data.auditLogs.length === 0 ? <div style={card}>Még nincs naplózott esemény.</div> : data.auditLogs.map((log) => <details key={log.id} style={{ ...card, marginBottom: 8 }}><summary style={{ cursor: "pointer", fontWeight: 700 }}>{eventLabel(log.eventType)} · {date(log.createdAt)}</summary><div style={{ marginTop: 8 }}>{log.description || "-"}<pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#f8fafc", padding: 8, borderRadius: 8, fontSize: 11 }}>{JSON.stringify(log.details, null, 2)}</pre></div></details>)}</div>}

    {correctionItem && correction && <div onClick={() => { setCorrectionItem(null); setCorrection(null); }} style={{ position: "fixed", inset: 0, zIndex: 5000, display: "flex", alignItems: "center", justifyContent: "center", padding: 15, background: "rgba(0,0,0,.65)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...card, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
        <h2 style={{ marginTop: 0 }}>Kézi korrekció</h2>
        <label style={{ display: "block", marginBottom: 8 }}>Típus:<select value={correction.maintenanceType} onChange={(e) => setCorrection({ ...correction, maintenanceType: e.target.value as MaintenanceType })} style={inputStyle}><option value="WASH">Mosás</option><option value="DISINFECTION">Fertőtlenítés</option></select></label>
        <label style={{ display: "block", marginBottom: 8 }}>Fizetési mód:<select value={correction.paymentMethod} onChange={(e) => setCorrection({ ...correction, paymentMethod: e.target.value as "CASH" | "TRANSFER" })} style={inputStyle}><option value="CASH">Készpénz → 1. fő</option><option value="TRANSFER">Átutalás → 2. fő</option></select></label>
        {([ ["machineName", "Gép neve"], ["appliedPrice", "Teljes ár"], ["firstPersonAmount", "1. fő része"], ["secondPersonAmount", "2. fő része"] ] as [keyof CorrectionForm, string][]).map(([field, label]) => <label key={field} style={{ display: "block", marginBottom: 8 }}>{label}:<input type={field === "machineName" ? "text" : "number"} value={correction[field]} onChange={(e) => setCorrection({ ...correction, [field]: e.target.value })} style={inputStyle} /></label>)}
        <label style={{ display: "block", marginBottom: 8 }}>Megvalósult időpont:<input type="datetime-local" value={correction.completedAt} onChange={(e) => setCorrection({ ...correction, completedAt: e.target.value })} style={inputStyle} /></label>
        <label style={{ display: "block", marginBottom: 10 }}>Korrekció indoka:<textarea rows={3} value={correction.reason} onChange={(e) => setCorrection({ ...correction, reason: e.target.value })} style={inputStyle} /></label>
        <div style={{ display: "flex", gap: 8 }}><button type="button" disabled={saving} onClick={saveCorrection} style={{ flex: 1, padding: 10, border: 0, borderRadius: 8, background: "#16a34a", color: "#fff", fontWeight: 700 }}>Mentés</button><button type="button" onClick={() => { setCorrectionItem(null); setCorrection(null); }} style={{ padding: 10, border: 0, borderRadius: 8, background: "#64748b", color: "#fff", fontWeight: 700 }}>Mégsem</button></div>
      </div>
    </div>}
  </main>;
}
