"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

type MaintenanceType =
  | "WASH"
  | "DISINFECTION";

type Price = {
  id: number;
  maintenanceType:
    MaintenanceType;
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
  maintenanceType:
    MaintenanceType;
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
  activePeriod: {
    id: number;
    startedAt: string;
    endedAt: string | null;
    createdAt: string;
  };

  currentPrices: {
    WASH: Price | null;
    DISINFECTION:
      Price | null;
  };

  summary: PeriodSummary & {
    validation: {
      distributedTotal: number;
      expectedTotal: number;
      difference: number;
      isValid: boolean;
    };
  };

  items: SettlementItem[];

  previousPeriods:
    PreviousPeriod[];

  auditLogs: AuditLog[];
};

type PriceFormState = {
  totalPrice: string;
  firstPersonAmount: string;
  secondPersonAmount: string;
};

type CorrectionState = {
  maintenanceType:
    MaintenanceType;
  machineName: string;
  appliedPrice: string;
  firstPersonAmount: string;
  secondPersonAmount: string;
  completedAt: string;
  reason: string;
};

const emptyPriceForm:
  PriceFormState = {
    totalPrice: "",
    firstPersonAmount: "",
    secondPersonAmount: "",
  };

function formatCurrency(
  value: number
): string {
  return (
    value.toLocaleString(
      "hu-HU"
    ) + " Ft"
  );
}

function formatDate(
  value:
    | string
    | null
    | undefined
): string {
  if (!value) {
    return "-";
  }

  const parsedDate =
    new Date(value);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return value;
  }

  return parsedDate.toLocaleString(
    "hu-HU"
  );
}

function toDateTimeLocal(
  value: string
): string {
  const parsedDate =
    new Date(value);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "";
  }

  const offset =
    parsedDate.getTimezoneOffset();

  const localDate =
    new Date(
      parsedDate.getTime() -
        offset * 60 * 1000
    );

  return localDate
    .toISOString()
    .slice(0, 16);
}

function parseAmount(
  value: string
): number {
  const normalizedValue =
    value.replace(
      /[^0-9-]/g,
      ""
    );

  if (!normalizedValue) {
    return 0;
  }

  const parsedValue =
    Number(normalizedValue);

  return Number.isFinite(
    parsedValue
  )
    ? parsedValue
    : 0;
}

function getTypeLabel(
  maintenanceType:
    MaintenanceType
): string {
  return maintenanceType ===
    "WASH"
    ? "Mosás"
    : "Fertőtlenítés";
}

function getEventLabel(
  eventType: string
): string {
  switch (eventType) {
    case "PRICE_CREATED":
      return "Új ár";

    case "SETTLEMENT_ITEM_CREATED":
      return "Elszámolási tétel";

    case "PERIOD_RESET":
      return "Időszak lezárása";

    case "SETTLEMENT_ITEM_ADJUSTED":
      return "Kézi korrekció";

    case "SETTLEMENT_ITEM_VOIDED":
      return "Érvénytelenítés";

    default:
      return eventType;
  }
}

export default function MaintenanceSummaryPage() {
  const [
    data,
    setData,
  ] =
    useState<SummaryResponse | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    statusMessage,
    setStatusMessage,
  ] = useState("");

  const [
    statusType,
    setStatusType,
  ] = useState<
    "success" | "error"
  >("success");

  const [
    activeTab,
    setActiveTab,
  ] = useState<
    | "summary"
    | "prices"
    | "items"
    | "periods"
    | "logs"
  >("summary");

  const [
    washForm,
    setWashForm,
  ] =
    useState<PriceFormState>({
      ...emptyPriceForm,
    });

  const [
    disinfectionForm,
    setDisinfectionForm,
  ] =
    useState<PriceFormState>({
      ...emptyPriceForm,
    });

  const [
    resetReason,
    setResetReason,
  ] = useState("");

  const [
    correctionItem,
    setCorrectionItem,
  ] =
    useState<SettlementItem | null>(
      null
    );

  const [
    correctionForm,
    setCorrectionForm,
  ] =
    useState<CorrectionState | null>(
      null
    );

  const loadSummary =
    useCallback(async () => {
      setLoading(true);

      try {
        const response =
          await fetch(
            "/api/maintenance-summary",
            {
              cache: "no-store",
            }
          );

        const responseData =
          await response.json();

        if (!response.ok) {
          throw new Error(
            responseData.error ||
              responseData.details ||
              "Az összesítő betöltése nem sikerült."
          );
        }

        setData(responseData);

        const washPrice =
          responseData
            .currentPrices
            ?.WASH;

        const disinfectionPrice =
          responseData
            .currentPrices
            ?.DISINFECTION;

        if (washPrice) {
          setWashForm({
            totalPrice: String(
              washPrice.totalPrice
            ),

            firstPersonAmount:
              String(
                washPrice
                  .firstPersonAmount
              ),

            secondPersonAmount:
              String(
                washPrice
                  .secondPersonAmount
              ),
          });
        }

        if (
          disinfectionPrice
        ) {
          setDisinfectionForm({
            totalPrice: String(
              disinfectionPrice
                .totalPrice
            ),

            firstPersonAmount:
              String(
                disinfectionPrice
                  .firstPersonAmount
              ),

            secondPersonAmount:
              String(
                disinfectionPrice
                  .secondPersonAmount
              ),
          });
        }
      } catch (error) {
        setStatusType("error");

        setStatusMessage(
          error instanceof Error
            ? error.message
            : "Az összesítő betöltése nem sikerült."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const savePrice = async (
    maintenanceType:
      MaintenanceType,
    form:
      PriceFormState
  ) => {
    const totalPrice =
      parseAmount(
        form.totalPrice
      );

    const firstPersonAmount =
      parseAmount(
        form.firstPersonAmount
      );

    const secondPersonAmount =
      parseAmount(
        form.secondPersonAmount
      );

    if (
      firstPersonAmount +
        secondPersonAmount !==
      totalPrice
    ) {
      const difference =
        firstPersonAmount +
        secondPersonAmount -
        totalPrice;

      setStatusType("error");

      setStatusMessage(
        difference > 0
          ? `Az elosztás ${formatCurrency(
              difference
            )} összeggel meghaladja a teljes árat.`
          : `Az elosztás ${formatCurrency(
              Math.abs(difference)
            )} összeggel kevesebb a teljes árnál.`
      );

      return;
    }

    setSaving(true);
    setStatusMessage("");

    try {
      const response =
        await fetch(
          "/api/maintenance-summary/prices",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              maintenanceType,
              totalPrice,
              firstPersonAmount,
              secondPersonAmount,
            }),
          }
        );

      const responseData =
        await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.details ||
            responseData.error ||
            "Az ár mentése nem sikerült."
        );
      }

      setStatusType("success");

      setStatusMessage(
        responseData.message ||
          "Az új ár sikeresen elmentve."
      );

      await loadSummary();
    } catch (error) {
      setStatusType("error");

      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Az ár mentése nem sikerült."
      );
    } finally {
      setSaving(false);
    }
  };

  const resetPeriod =
    async () => {
      if (
        resetReason.trim()
          .length < 5
      ) {
        setStatusType("error");

        setStatusMessage(
          "Add meg a reset indokát legalább 5 karakterben."
        );

        return;
      }

      if (
        !window.confirm(
          "Biztosan lezárod az aktuális elszámolási időszakot? A régi adatok megmaradnak, az új számláló nulláról indul."
        )
      ) {
        return;
      }

      setSaving(true);
      setStatusMessage("");

      try {
        const response =
          await fetch(
            "/api/maintenance-summary/reset",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                reason:
                  resetReason.trim(),
              }),
            }
          );

        const responseData =
          await response.json();

        if (!response.ok) {
          throw new Error(
            responseData.details ||
              responseData.error ||
              "Az időszak lezárása nem sikerült."
          );
        }

        setResetReason("");

        setStatusType("success");

        setStatusMessage(
          responseData.message ||
            "Az új elszámolási időszak elindult."
        );

        await loadSummary();
      } catch (error) {
        setStatusType("error");

        setStatusMessage(
          error instanceof Error
            ? error.message
            : "Az időszak lezárása nem sikerült."
        );
      } finally {
        setSaving(false);
      }
    };

  const openCorrection = (
    item: SettlementItem
  ) => {
    setCorrectionItem(item);

    setCorrectionForm({
      maintenanceType:
        item.maintenanceType,

      machineName:
        item.machineName,

      appliedPrice:
        String(
          item.appliedPrice
        ),

      firstPersonAmount:
        String(
          item.firstPersonAmount
        ),

      secondPersonAmount:
        String(
          item.secondPersonAmount
        ),

      completedAt:
        toDateTimeLocal(
          item.completedAt
        ),

      reason: "",
    });
  };

  const saveCorrection =
    async () => {
      if (
        !correctionItem ||
        !correctionForm
      ) {
        return;
      }

      const appliedPrice =
        parseAmount(
          correctionForm
            .appliedPrice
        );

      const firstPersonAmount =
        parseAmount(
          correctionForm
            .firstPersonAmount
        );

      const secondPersonAmount =
        parseAmount(
          correctionForm
            .secondPersonAmount
        );

      if (
        firstPersonAmount +
          secondPersonAmount !==
        appliedPrice
      ) {
        setStatusType("error");

        setStatusMessage(
          "A két személy része nem egyezik meg a teljes árral."
        );

        return;
      }

      if (
        correctionForm.reason
          .trim().length < 5
      ) {
        setStatusType("error");

        setStatusMessage(
          "A korrekció indoklása legalább 5 karakter legyen."
        );

        return;
      }

      setSaving(true);

      try {
        const response =
          await fetch(
            `/api/maintenance-summary/items/${correctionItem.id}`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                maintenanceType:
                  correctionForm
                    .maintenanceType,

                machineName:
                  correctionForm
                    .machineName,

                appliedPrice,

                firstPersonAmount,

                secondPersonAmount,

                completedAt:
                  correctionForm
                    .completedAt,

                reason:
                  correctionForm
                    .reason.trim(),
              }),
            }
          );

        const responseData =
          await response.json();

        if (!response.ok) {
          throw new Error(
            responseData.details ||
              responseData.error ||
              "A korrekció mentése nem sikerült."
          );
        }

        setCorrectionItem(null);
        setCorrectionForm(null);

        setStatusType("success");

        setStatusMessage(
          responseData.message ||
            "A korrekció sikeresen elmentve."
        );

        await loadSummary();
      } catch (error) {
        setStatusType("error");

        setStatusMessage(
          error instanceof Error
            ? error.message
            : "A korrekció mentése nem sikerült."
        );
      } finally {
        setSaving(false);
      }
    };

  if (loading && !data) {
    return (
      <main
        style={{
          maxWidth: "1200px",
          margin: "30px auto",
          padding: "20px",
          fontFamily:
            "Arial, sans-serif",
        }}
      >
        Elszámolás betöltése...
      </main>
    );
  }

  if (!data) {
    return (
      <main
        style={{
          maxWidth: "1200px",
          margin: "30px auto",
          padding: "20px",
          fontFamily:
            "Arial, sans-serif",
        }}
      >
        <h1>
          Karbantartási
          elszámolás
        </h1>

        <div
          style={{
            padding: "14px",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "10px",
          }}
        >
          {statusMessage ||
            "Az adatok nem tölthetők be."}
        </div>
      </main>
    );
  }

  const summary =
    data.summary;

  const renderSummaryCard = (
    title: string,
    block: SummaryBlock,
    color: string
  ) => (
    <div
      style={{
        padding: "16px",
        borderRadius: "12px",
        background: "white",
        border: `2px solid ${color}`,
        boxShadow:
          "0 2px 8px rgba(0,0,0,0.07)",
      }}
    >
      <div
        style={{
          marginBottom: "12px",
          color,
          fontWeight: "bold",
          fontSize: "17px",
        }}
      >
        {title}
      </div>

      <div>
        Darabszám:{" "}
        <strong>
          {block.count} db
        </strong>
      </div>

      <div>
        Teljes bevétel:{" "}
        <strong>
          {formatCurrency(
            block.totalRevenue
          )}
        </strong>
      </div>

      <div>
        1. fő része:{" "}
        <strong>
          {formatCurrency(
            block.firstPersonTotal
          )}
        </strong>
      </div>

      <div>
        2. fő része:{" "}
        <strong>
          {formatCurrency(
            block.secondPersonTotal
          )}
        </strong>
      </div>
    </div>
  );

  const renderPriceForm = (
    maintenanceType:
      MaintenanceType,
    title: string,
    form: PriceFormState,
    setForm: (
      value: PriceFormState
    ) => void,
    currentPrice:
      Price | null,
    color: string
  ) => {
    const totalPrice =
      parseAmount(
        form.totalPrice
      );

    const firstPersonAmount =
      parseAmount(
        form.firstPersonAmount
      );

    const secondPersonAmount =
      parseAmount(
        form.secondPersonAmount
      );

    const distributedTotal =
      firstPersonAmount +
      secondPersonAmount;

    const difference =
      distributedTotal -
      totalPrice;

    const isValid =
      totalPrice >= 0 &&
      firstPersonAmount >= 0 &&
      secondPersonAmount >= 0 &&
      distributedTotal ===
        totalPrice;

    return (
      <div
        style={{
          background: "white",
          padding: "16px",
          borderRadius: "12px",
          border: `2px solid ${color}`,
        }}
      >
        <h3
          style={{
            marginTop: 0,
            color,
          }}
        >
          {title}
        </h3>

        {currentPrice && (
          <div
            style={{
              marginBottom: "12px",
              padding: "10px",
              background: "#f8fafc",
              borderRadius: "8px",
              fontSize: "13px",
            }}
          >
            Jelenlegi ár:{" "}
            <strong>
              {formatCurrency(
                currentPrice
                  .totalPrice
              )}
            </strong>
            <br />
            Érvényes ettől:{" "}
            {formatDate(
              currentPrice.validFrom
            )}
          </div>
        )}

        <label
          style={{
            display: "block",
            marginBottom: "10px",
          }}
        >
          <strong>
            Teljes ár:
          </strong>

          <input
            type="number"
            min="0"
            value={
              form.totalPrice
            }
            onChange={(event) =>
              setForm({
                ...form,
                totalPrice:
                  event.target.value,
              })
            }
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "4px",
              boxSizing:
                "border-box",
              borderRadius: "8px",
              border:
                "1px solid #cbd5e1",
            }}
          />
        </label>

        <label
          style={{
            display: "block",
            marginBottom: "10px",
          }}
        >
          <strong>
            1. fő része:
          </strong>

          <input
            type="number"
            min="0"
            value={
              form.firstPersonAmount
            }
            onChange={(event) =>
              setForm({
                ...form,
                firstPersonAmount:
                  event.target.value,
              })
            }
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "4px",
              boxSizing:
                "border-box",
              borderRadius: "8px",
              border:
                "1px solid #cbd5e1",
            }}
          />
        </label>

        <label
          style={{
            display: "block",
            marginBottom: "10px",
          }}
        >
          <strong>
            2. fő része:
          </strong>

          <input
            type="number"
            min="0"
            value={
              form.secondPersonAmount
            }
            onChange={(event) =>
              setForm({
                ...form,
                secondPersonAmount:
                  event.target.value,
              })
            }
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "4px",
              boxSizing:
                "border-box",
              borderRadius: "8px",
              border:
                "1px solid #cbd5e1",
            }}
          />
        </label>

        <div
          style={{
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "8px",
            background: isValid
              ? "#dcfce7"
              : "#fee2e2",
            color: isValid
              ? "#166534"
              : "#991b1b",
            fontWeight: "bold",
            fontSize: "13px",
          }}
        >
          {isValid
            ? "✅ A két rész pontosan megegyezik a teljes árral."
            : difference > 0
              ? `⚠️ Az elosztás ${formatCurrency(
                  difference
                )} összeggel több.`
              : `⚠️ Az elosztás ${formatCurrency(
                  Math.abs(
                    difference
                  )
                )} összeggel kevesebb.`}
        </div>

        <button
          type="button"
          disabled={
            saving ||
            !isValid
          }
          onClick={() =>
            savePrice(
              maintenanceType,
              form
            )
          }
          style={{
            width: "100%",
            padding: "11px",
            border: "none",
            borderRadius: "8px",
            background:
              saving ||
              !isValid
                ? "#94a3b8"
                : color,
            color: "white",
            fontWeight: "bold",
            cursor:
              saving ||
              !isValid
                ? "not-allowed"
                : "pointer",
          }}
        >
          Új árverzió mentése
        </button>
      </div>
    );
  };

  return (
    <main
      style={{
        maxWidth: "1200px",
        margin: "20px auto",
        padding: "16px",
        fontFamily:
          "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "10px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin:
                "0 0 5px",
              fontSize: "25px",
            }}
          >
            💰 Karbantartási
            elszámolás
          </h1>

          <div
            style={{
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            Aktuális időszak
            kezdete:{" "}
            {formatDate(
              data.activePeriod
                .startedAt
            )}
          </div>
        </div>

        <a
          href="/tasks"
          style={{
            padding: "9px 14px",
            background: "#334155",
            color: "white",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          ← Vissza a munkákhoz
        </a>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: "12px",
            marginBottom: "14px",
            borderRadius: "8px",
            background:
              statusType ===
              "success"
                ? "#dcfce7"
                : "#fee2e2",
            color:
              statusType ===
              "success"
                ? "#166534"
                : "#991b1b",
            fontWeight: "bold",
          }}
        >
          {statusMessage}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "6px",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}
      >
        {[
          [
            "summary",
            "📊 Összesítő",
          ],
          [
            "prices",
            "💵 Árak",
          ],
          [
            "items",
            "🧾 Tételek",
          ],
          [
            "periods",
            "📁 Korábbi időszakok",
          ],
          [
            "logs",
            "📋 Napló",
          ],
        ].map(
          ([tabKey, label]) => (
            <button
              key={tabKey}
              type="button"
              onClick={() =>
                setActiveTab(
                  tabKey as typeof activeTab
                )
              }
              style={{
                padding:
                  "9px 12px",
                border: "none",
                borderRadius:
                  "8px",
                background:
                  activeTab ===
                  tabKey
                    ? "#2563eb"
                    : "#e2e8f0",
                color:
                  activeTab ===
                  tabKey
                    ? "white"
                    : "#0f172a",
                fontWeight:
                  "bold",
                cursor:
                  "pointer",
              }}
            >
              {label}
            </button>
          )
        )}
      </div>

      {activeTab ===
        "summary" && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "12px",
              marginBottom: "18px",
            }}
          >
            {renderSummaryCard(
              "🧼 Mosás",
              summary.wash,
              "#2563eb"
            )}

            {renderSummaryCard(
              "🧴 Fertőtlenítés",
              summary.disinfection,
              "#7c3aed"
            )}

            {renderSummaryCard(
              "💰 Összesen",
              summary.total,
              "#16a34a"
            )}
          </div>

          <div
            style={{
              padding: "14px",
              background:
                summary.validation
                  .isValid
                  ? "#dcfce7"
                  : "#fee2e2",
              color:
                summary.validation
                  .isValid
                  ? "#166534"
                  : "#991b1b",
              borderRadius: "10px",
              fontWeight: "bold",
              marginBottom: "18px",
            }}
          >
            {summary.validation
              .isValid
              ? "✅ A személyenkénti bevételek összege megegyezik a teljes bevétellel."
              : `⚠️ Eltérés: ${formatCurrency(
                  Math.abs(
                    summary
                      .validation
                      .difference
                  )
                )}`}
          </div>

          <div
            style={{
              padding: "16px",
              background: "#fff7ed",
              border:
                "1px solid #fdba74",
              borderRadius: "12px",
            }}
          >
            <h3
              style={{
                marginTop: 0,
              }}
            >
              🔄 Új elszámolási
              időszak
            </h3>

            <p
              style={{
                fontSize: "13px",
              }}
            >
              A korábbi tételek és
              bevételek megmaradnak.
              Csak az aktuális
              számláló indul újra
              nulláról.
            </p>

            <input
              type="text"
              value={resetReason}
              onChange={(event) =>
                setResetReason(
                  event.target.value
                )
              }
              placeholder="A reset indoka..."
              style={{
                width: "100%",
                padding: "10px",
                boxSizing:
                  "border-box",
                border:
                  "1px solid #fdba74",
                borderRadius: "8px",
                marginBottom: "10px",
              }}
            />

            <button
              type="button"
              disabled={saving}
              onClick={
                resetPeriod
              }
              style={{
                padding:
                  "10px 14px",
                border: "none",
                borderRadius:
                  "8px",
                background:
                  "#ea580c",
                color: "white",
                fontWeight:
                  "bold",
                cursor:
                  "pointer",
              }}
            >
              Aktuális időszak
              lezárása
            </button>
          </div>
        </>
      )}

      {activeTab ===
        "prices" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "14px",
          }}
        >
          {renderPriceForm(
            "WASH",
            "🧼 Mosás ára",
            washForm,
            setWashForm,
            data.currentPrices
              .WASH,
            "#2563eb"
          )}

          {renderPriceForm(
            "DISINFECTION",
            "🧴 Fertőtlenítés ára",
            disinfectionForm,
            setDisinfectionForm,
            data.currentPrices
              .DISINFECTION,
            "#7c3aed"
          )}
        </div>
      )}

      {activeTab ===
        "items" && (
        <div>
          {data.items.length ===
          0 ? (
            <div
              style={{
                padding: "20px",
                background: "#f1f5f9",
                borderRadius:
                  "10px",
                textAlign:
                  "center",
              }}
            >
              Az aktuális
              időszakban még nincs
              elszámolási tétel.
            </div>
          ) : (
            data.items.map(
              (item) => (
                <div
                  key={item.id}
                  style={{
                    background:
                      "white",
                    border:
                      "1px solid #cbd5e1",
                    borderLeft:
                      item.maintenanceType ===
                      "WASH"
                        ? "5px solid #2563eb"
                        : "5px solid #7c3aed",
                    borderRadius:
                      "10px",
                    padding:
                      "12px",
                    marginBottom:
                      "9px",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      gap: "10px",
                      flexWrap:
                        "wrap",
                    }}
                  >
                    <strong>
                      {getTypeLabel(
                        item.maintenanceType
                      )}
                    </strong>

                    <span>
                      {formatCurrency(
                        item.appliedPrice
                      )}
                    </span>
                  </div>

                  <div>
                    Munka: #
                    {item.taskId}
                  </div>

                  <div>
                    Ügyfél:{" "}
                    {item.clientName ||
                      "-"}
                  </div>

                  <div>
                    Gép:{" "}
                    {item.machineName}
                  </div>

                  <div>
                    1. fő:{" "}
                    {formatCurrency(
                      item.firstPersonAmount
                    )}
                  </div>

                  <div>
                    2. fő:{" "}
                    {formatCurrency(
                      item.secondPersonAmount
                    )}
                  </div>

                  <div>
                    Teljesítve:{" "}
                    {formatDate(
                      item.completedAt
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openCorrection(
                        item
                      )
                    }
                    style={{
                      marginTop:
                        "8px",
                      padding:
                        "7px 10px",
                      border:
                        "none",
                      borderRadius:
                        "7px",
                      background:
                        "#f59e0b",
                      color:
                        "white",
                      fontWeight:
                        "bold",
                      cursor:
                        "pointer",
                    }}
                  >
                    ✏️ Kézi
                    korrekció
                  </button>
                </div>
              )
            )
          )}
        </div>
      )}

      {activeTab ===
        "periods" && (
        <div>
          {data.previousPeriods
            .length === 0 ? (
            <div
              style={{
                padding: "20px",
                background: "#f1f5f9",
                borderRadius:
                  "10px",
              }}
            >
              Még nincs lezárt
              elszámolási időszak.
            </div>
          ) : (
            data.previousPeriods.map(
              (period) => (
                <div
                  key={period.id}
                  style={{
                    padding:
                      "14px",
                    background:
                      "white",
                    border:
                      "1px solid #cbd5e1",
                    borderRadius:
                      "10px",
                    marginBottom:
                      "10px",
                  }}
                >
                  <strong>
                    Időszak #
                    {period.id}
                  </strong>

                  <div>
                    {formatDate(
                      period.startedAt
                    )}{" "}
                    –{" "}
                    {formatDate(
                      period.endedAt
                    )}
                  </div>

                  <div>
                    Mosás:{" "}
                    {
                      period.summary
                        .wash.count
                    }{" "}
                    db
                  </div>

                  <div>
                    Fertőtlenítés:{" "}
                    {
                      period.summary
                        .disinfection
                        .count
                    }{" "}
                    db
                  </div>

                  <div>
                    Teljes bevétel:{" "}
                    <strong>
                      {formatCurrency(
                        period.summary
                          .total
                          .totalRevenue
                      )}
                    </strong>
                  </div>

                  <div>
                    1. fő:{" "}
                    {formatCurrency(
                      period.summary
                        .total
                        .firstPersonTotal
                    )}
                  </div>

                  <div>
                    2. fő:{" "}
                    {formatCurrency(
                      period.summary
                        .total
                        .secondPersonTotal
                    )}
                  </div>
                </div>
              )
            )
          )}
        </div>
      )}

      {activeTab ===
        "logs" && (
        <div>
          {data.auditLogs.length ===
          0 ? (
            <div
              style={{
                padding: "20px",
                background: "#f1f5f9",
                borderRadius:
                  "10px",
              }}
            >
              Még nincs naplózott
              esemény.
            </div>
          ) : (
            data.auditLogs.map(
              (log) => (
                <details
                  key={log.id}
                  style={{
                    padding:
                      "12px",
                    background:
                      "white",
                    border:
                      "1px solid #cbd5e1",
                    borderRadius:
                      "9px",
                    marginBottom:
                      "8px",
                  }}
                >
                  <summary
                    style={{
                      cursor:
                        "pointer",
                      fontWeight:
                        "bold",
                    }}
                  >
                    {getEventLabel(
                      log.eventType
                    )}{" "}
                    ·{" "}
                    {formatDate(
                      log.createdAt
                    )}
                  </summary>

                  <div
                    style={{
                      marginTop:
                        "10px",
                    }}
                  >
                    {log.description ||
                      "-"}

                    <pre
                      style={{
                        marginTop:
                          "10px",
                        padding:
                          "10px",
                        borderRadius:
                          "8px",
                        background:
                          "#f8fafc",
                        whiteSpace:
                          "pre-wrap",
                        wordBreak:
                          "break-word",
                        fontSize:
                          "11px",
                        overflowX:
                          "auto",
                      }}
                    >
                      {JSON.stringify(
                        log.details,
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </details>
              )
            )
          )}
        </div>
      )}

      {correctionItem &&
        correctionForm && (
        <div
          onClick={() => {
            setCorrectionItem(
              null
            );

            setCorrectionForm(
              null
            );
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 5000,
            display: "flex",
            alignItems: "center",
            justifyContent:
              "center",
            padding: "15px",
            background:
              "rgba(0,0,0,0.65)",
          }}
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              width: "100%",
              maxWidth: "520px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "18px",
              boxSizing:
                "border-box",
              borderRadius:
                "12px",
              background: "white",
            }}
          >
            <h2
              style={{
                marginTop: 0,
              }}
            >
              Kézi korrekció
            </h2>

            <label
              style={{
                display: "block",
                marginBottom:
                  "10px",
              }}
            >
              Típus:

              <select
                value={
                  correctionForm
                    .maintenanceType
                }
                onChange={(
                  event
                ) =>
                  setCorrectionForm({
                    ...correctionForm,
                    maintenanceType:
                      event.target
                        .value as MaintenanceType,
                  })
                }
                style={{
                  width:
                    "100%",
                  padding:
                    "10px",
                  marginTop:
                    "4px",
                }}
              >
                <option value="WASH">
                  Mosás
                </option>

                <option value="DISINFECTION">
                  Fertőtlenítés
                </option>
              </select>
            </label>

            {[
              [
                "machineName",
                "Gép neve",
              ],
              [
                "appliedPrice",
                "Teljes ár",
              ],
              [
                "firstPersonAmount",
                "1. fő része",
              ],
              [
                "secondPersonAmount",
                "2. fő része",
              ],
            ].map(
              ([field, label]) => (
                <label
                  key={field}
                  style={{
                    display:
                      "block",
                    marginBottom:
                      "10px",
                  }}
                >
                  {label}:

                  <input
                    type={
                      field ===
                      "machineName"
                        ? "text"
                        : "number"
                    }
                    value={
                      correctionForm[
                        field as keyof CorrectionState
                      ]
                    }
                    onChange={(
                      event
                    ) =>
                      setCorrectionForm({
                        ...correctionForm,
                        [field]:
                          event
                            .target
                            .value,
                      })
                    }
                    style={{
                      width:
                        "100%",
                      padding:
                        "10px",
                      marginTop:
                        "4px",
                      boxSizing:
                        "border-box",
                    }}
                  />
                </label>
              )
            )}

            <label
              style={{
                display: "block",
                marginBottom:
                  "10px",
              }}
            >
              Megvalósult
              időpont:

              <input
                type="datetime-local"
                value={
                  correctionForm
                    .completedAt
                }
                onChange={(
                  event
                ) =>
                  setCorrectionForm({
                    ...correctionForm,
                    completedAt:
                      event.target
                        .value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "4px",
                  boxSizing:
                    "border-box",
                }}
              />
            </label>

            <label
              style={{
                display: "block",
                marginBottom:
                  "12px",
              }}
            >
              Korrekció indoka:

              <textarea
                value={
                  correctionForm
                    .reason
                }
                onChange={(
                  event
                ) =>
                  setCorrectionForm({
                    ...correctionForm,
                    reason:
                      event.target
                        .value,
                  })
                }
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "4px",
                  boxSizing:
                    "border-box",
                }}
              />
            </label>

            <div
              style={{
                display: "flex",
                gap: "8px",
              }}
            >
              <button
                type="button"
                disabled={saving}
                onClick={
                  saveCorrection
                }
                style={{
                  flex: 1,
                  padding:
                    "11px",
                  border: "none",
                  borderRadius:
                    "8px",
                  background:
                    "#16a34a",
                  color:
                    "white",
                  fontWeight:
                    "bold",
                  cursor:
                    "pointer",
                }}
              >
                Korrekció mentése
              </button>

              <button
                type="button"
                onClick={() => {
                  setCorrectionItem(
                    null
                  );

                  setCorrectionForm(
                    null
                  );
                }}
                style={{
                  padding:
                    "11px",
                  border: "none",
                  borderRadius:
                    "8px",
                  background:
                    "#64748b",
                  color:
                    "white",
                  fontWeight:
                    "bold",
                  cursor:
                    "pointer",
                }}
              >
                Mégsem
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
