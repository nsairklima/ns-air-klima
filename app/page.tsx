"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PasswordGuard from "@/components/PasswordGuard";
import EmailSettingsModal from "@/app/components/EmailSettingsModal";

type DashboardStats = {
  totalClients?: number;
  totalUnits?: number;
  urgentCount?: number;
  monthly?: {
    gross?: number;
    profit?: number;
    margin?: number;
    count?: number;
  };
  yearly?: {
    gross?: number;
    profit?: number;
    margin?: number;
    count?: number;
  };
  inventory?: {
    totalValue?: number;
    totalItemsCount?: number;
    totalStockCount?: number;
  };
};

type ModuleItem = {
  title: string;
  description: string;
  icon: string;
  path?: string;
  accent: string;
  onClick?: () => void;
};

export default function MainDashboard() {
  const router = useRouter();

  const [isMobile, setIsMobile] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkSize();

    window.addEventListener("resize", checkSize);

    return () => {
      window.removeEventListener("resize", checkSize);
    };
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true);

        const response = await fetch("/api/stats", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Nem sikerült betölteni a statisztikát.");
        }

        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Főoldali statisztika betöltési hiba:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, []);

  const handleBackup = async () => {
    if (backingUp) return;

    const confirmed = confirm(
      "Biztonsági mentés indítása? A mentési fájlt emailben fogod megkapni."
    );

    if (!confirmed) return;

    setBackingUp(true);

    try {
      const response = await fetch(
        `/api/admin/backup?t=${Date.now()}`,
        {
          method: "POST",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Hiba történt a mentés során."
        );
      }

      alert(
        "✅ A biztonsági mentés sikeresen elkészült. Nézd meg az emailed."
      );
    } catch (error: any) {
      console.error("Biztonsági mentési hiba:", error);

      alert(
        "❌ Hiba történt a mentés során: " +
          (error?.message || "Ismeretlen hiba")
      );
    } finally {
      setBackingUp(false);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const confirmed = confirm(
      "⚠️ FIGYELEM!\n\n" +
        "Ez a művelet felülírhatja a jelenlegi adatbázist a fájlban lévő adatokkal.\n\n" +
        "Biztosan folytatod?"
    );

    if (!confirmed) {
      event.target.value = "";
      return;
    }

    setRestoring(true);

    const reader = new FileReader();

    reader.onload = async (readerEvent) => {
      try {
        const content = readerEvent.target?.result;

        if (typeof content !== "string") {
          throw new Error("A fájl tartalma nem olvasható.");
        }

        const json = JSON.parse(content);

        const response = await fetch("/api/admin/restore", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(json),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.error ||
              data?.message ||
              "Nem sikerült visszaállítani az adatbázist."
          );
        }

        alert(
          "✅ Az adatbázis visszaállítása sikeresen befejeződött."
        );

        window.location.reload();
      } catch (error: any) {
        console.error("Visszaállítási hiba:", error);

        alert(
          "❌ Sikertelen visszaállítás: " +
            (error?.message ||
              "A mentési fájl hibás vagy sérült.")
        );
      } finally {
        setRestoring(false);
        event.target.value = "";
      }
    };

    reader.onerror = () => {
      setRestoring(false);
      event.target.value = "";

      alert("❌ Nem sikerült beolvasni a fájlt.");
    };

    reader.readAsText(file);
  };

  const navigate = (path: string) => {
    router.push(path);
  };

  const quickActions = [
    {
      title: "Új munka",
      description: "Telepítés vagy karbantartás",
      icon: "🛠️",
      color: "#f59e0b",
      onClick: () => navigate("/tasks"),
    },
    {
      title: "Új ajánlat",
      description: "Árajánlat készítése",
      icon: "📄",
      color: "#38bdf8",
      onClick: () => navigate("/quotes/new"),
    },
    {
      title: "Új ügyfél",
      description: "Ügyféltörzs megnyitása",
      icon: "👤",
      color: "#34d399",
      onClick: () => navigate("/clients"),
    },
    {
      title: "Raktár",
      description: "Készlet és anyagok",
      icon: "📦",
      color: "#818cf8",
      onClick: () => navigate("/admin/items"),
    },
  ];

  const modules: ModuleItem[] = [
    {
      title: "Munkák",
      description: "Telepítések, mosások és feladatok",
      icon: "🛠️",
      path: "/tasks",
      accent: "#f59e0b",
    },
    {
      title: "Ügyfelek",
      description: "Ügyféladatok, gépek és naplók",
      icon: "👥",
      path: "/clients",
      accent: "#f97316",
    },
    {
      title: "Ajánlatok",
      description: "Ajánlatok, tételek és profit",
      icon: "📄",
      path: "/quotes",
      accent: "#38bdf8",
    },
    {
      title: "Naptár",
      description: "Időpontok és tervezett munkák",
      icon: "📅",
      path: "/admin/calendar",
      accent: "#14b8a6",
    },
    {
      title: "Raktár",
      description: "Készlet, anyagok és cikkszámok",
      icon: "📦",
      path: "/admin/items",
      accent: "#3b82f6",
    },
    {
      title: "Ütemterv",
      description: "Karbantartások és esedékességek",
      icon: "🗓️",
      path: "/maintenance",
      accent: "#a855f7",
    },
    {
      title: "Statisztika",
      description: "Forgalom, profit és jelentések",
      icon: "📊",
      path: "/stats",
      accent: "#eab308",
    },
    {
      title: "Email beállítások",
      description: "Értesítési címek kezelése",
      icon: "✉️",
      accent: "#8b5cf6",
      onClick: () => setIsEmailModalOpen(true),
    },
  ];

  const formatMoney = (value?: number) => {
    return `${Number(value || 0).toLocaleString("hu-HU")} Ft`;
  };

  const kpis = [
    {
      label: "Ügyfelek",
      value: statsLoading
        ? "..."
        : Number(stats?.totalClients || 0).toLocaleString("hu-HU"),
      icon: "👥",
      color: "#38bdf8",
      destination: "/clients",
    },
    {
      label: "Regisztrált gépek",
      value: statsLoading
        ? "..."
        : Number(stats?.totalUnits || 0).toLocaleString("hu-HU"),
      icon: "❄️",
      color: "#818cf8",
      destination: "/clients",
    },
    {
      label: "Elfogadott ajánlatok",
      value: statsLoading
        ? "..."
        : Number(stats?.yearly?.count || 0).toLocaleString("hu-HU"),
      icon: "📄",
      color: "#34d399",
      destination: "/quotes",
    },
    {
      label: "Sürgős karbantartás",
      value: statsLoading
        ? "..."
        : Number(stats?.urgentCount || 0).toLocaleString("hu-HU"),
      icon: "⚠️",
      color: "#fb7185",
      destination: "/maintenance",
    },
  ];

  const greeting =
    new Date().getHours() < 12
      ? "Jó reggelt"
      : new Date().getHours() < 18
        ? "Jó napot"
        : "Jó estét";

  return (
    <PasswordGuard moduleKey="MASTER">
      <div style={pageStyle}>
        <div style={backgroundGlowOne} />
        <div style={backgroundGlowTwo} />

        <main style={dashboardContainer}>
         <header
  style={{
    ...headerStyle,

    background: "#111827",

    border: "1px solid #334155",

    borderRadius: "24px",

    padding: "24px",

    boxShadow:
      "0 10px 30px rgba(0,0,0,.35)",

    flexDirection: isMobile ? "column" : "row",

    alignItems: isMobile ? "flex-start" : "center",

    gap: isMobile ? 16 : 20,
  }}
>
            <div>
              <div style={brandRow}>
                <div style={brandIcon}>N</div>

                <div>
                  <div style={brandTitle}>NS-AIR</div>
                  <div style={brandSubtitle}>Üzleti központ</div>
                </div>
              </div>

              <h1
                style={{
                  ...welcomeTitle,
                  fontSize: isMobile ? 27 : 36,
                }}
              >
                {greeting}, Csaba
              </h1>

              <p style={welcomeText}>
                Itt találod a rendszer legfontosabb adatait és
                műveleteit.
              </p>
            </div>

            <div style={headerStatusArea}>
              <div style={onlineStatus}>
                <span style={onlineDot} />
                Rendszer online
              </div>

              <div style={dateText}>
                {new Date().toLocaleDateString("hu-HU", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}
              </div>
            </div>
          </header>

          {/* KPI ÖSSZEFOGLALÓ */}
          <section
            style={{
              ...kpiGrid,
              gridTemplateColumns: isMobile
                ? "repeat(2, minmax(0, 1fr))"
                : "repeat(4, minmax(0, 1fr))",
            }}
          >
            {kpis.map((kpi) => (
             <button
  key={kpi.label}
  type="button"

  onMouseEnter={(e) => {
    e.currentTarget.style.transform =
      "translateY(-3px)";

    e.currentTarget.style.borderColor =
      "#3b82f6";

    e.currentTarget.style.boxShadow =
      "0 20px 40px rgba(59,130,246,.20)";
  }}

  onMouseLeave={(e) => {
    e.currentTarget.style.transform =
      "translateY(0px)";

    e.currentTarget.style.borderColor =
      "#334155";

    e.currentTarget.style.boxShadow =
      "0 10px 25px rgba(0,0,0,.35)";
  }}

  onClick={() => navigate(kpi.destination)}

  style={kpiCard}
>
                <div
                  style={{
                    ...kpiIcon,
                    background: `${kpi.color}18`,
                    borderColor: `${kpi.color}45`,
                  }}
                >
                  {kpi.icon}
                </div>

                <div style={kpiContent}>
                  <div style={kpiLabel}>{kpi.label}</div>
                  <div style={kpiValue}>{kpi.value}</div>
                </div>
              </button>
            ))}
          </section>

          {/* GYORS MŰVELETEK */}
          <section style={sectionStyle}>
            <div style={sectionTitleRow}>
              <div>
                <h2 style={sectionTitle}>Gyors műveletek</h2>
                <p style={sectionSubtitle}>
                  A leggyakrabban használt funkciók
                </p>
              </div>
            </div>

            <div
              style={{
                ...quickActionsGrid,
                gridTemplateColumns: isMobile
                  ? "repeat(2, minmax(0, 1fr))"
                  : "repeat(4, minmax(0, 1fr))",
              }}
            >
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  type="button"
                  onClick={action.onClick}
                  style={quickActionButton}
                >
                  <span
                    style={{
                      ...quickActionIcon,
                      background: `${action.color}18`,
                      borderColor: `${action.color}40`,
                    }}
                  >
                    {action.icon}
                  </span>

                  <span style={quickActionText}>
                    <strong style={quickActionTitle}>
                      {action.title}
                    </strong>

                    <span style={quickActionDescription}>
                      {action.description}
                    </span>
                  </span>

                  <span style={actionArrow}>→</span>
                </button>
              ))}
            </div>
          </section>

          {/* PÉNZÜGYI ÉS OPERATÍV ÖSSZEFOGLALÓ */}
          <section
            style={{
              ...overviewGrid,
              gridTemplateColumns: isMobile
                ? "1fr"
                : "minmax(0, 1.45fr) minmax(280px, 0.75fr)",
            }}
          >
            <div style={panelStyle}>
              <div style={panelHeader}>
                <div>
                  <h2 style={panelTitle}>Havi teljesítmény</h2>
                  <p style={panelSubtitle}>
                    Aktuális havi pénzügyi összesítő
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/stats")}
                  style={textLinkButton}
                >
                  Részletek →
                </button>
              </div>

              <div
                style={{
                  ...financialGrid,
                  gridTemplateColumns: isMobile
                    ? "1fr"
                    : "repeat(3, minmax(0, 1fr))",
                }}
              >
                <div style={financialItem}>
                  <span style={financialLabel}>
                    Bruttó forgalom
                  </span>

                  <strong style={financialValue}>
                    {statsLoading
                      ? "Betöltés..."
                      : formatMoney(stats?.monthly?.gross)}
                  </strong>
                </div>

                <div style={financialItem}>
                  <span style={financialLabel}>Tiszta haszon</span>

                  <strong
                    style={{
                      ...financialValue,
                      color: "#34d399",
                    }}
                  >
                    {statsLoading
                      ? "Betöltés..."
                      : formatMoney(stats?.monthly?.profit)}
                  </strong>
                </div>

                <div style={financialItem}>
                  <span style={financialLabel}>Átlagos árrés</span>

                  <strong
                    style={{
                      ...financialValue,
                      color: "#38bdf8",
                    }}
                  >
                    {statsLoading
                      ? "..."
                      : `${Number(stats?.monthly?.margin || 0)}%`}
                  </strong>
                </div>
              </div>

              <div style={progressArea}>
                <div style={progressHeader}>
                  <span>Havi ajánlatok</span>

                  <strong>
                    {Number(stats?.monthly?.count || 0).toLocaleString(
                      "hu-HU"
                    )}{" "}
                    db
                  </strong>
                </div>

                <div style={progressTrack}>
                  <div
                    style={{
                      ...progressValue,
                      width: `${Math.min(
                        100,
                        Number(stats?.monthly?.count || 0) * 5
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={urgentPanel}>
              <div style={urgentIcon}>⚠️</div>

              <div>
                <div style={urgentLabel}>Sürgős karbantartások</div>

                <div style={urgentValue}>
                  {statsLoading
                    ? "..."
                    : Number(stats?.urgentCount || 0).toLocaleString(
                        "hu-HU"
                      )}
                </div>

                <p style={urgentDescription}>
                  Ennyi gépnél szükséges karbantartási ellenőrzés.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/maintenance")}
                style={urgentButton}
              >
                Ütemterv megnyitása
              </button>
            </div>
          </section>

          {/* MODULOK */}
          <section style={sectionStyle}>
            <div style={sectionTitleRow}>
              <div>
                <h2 style={sectionTitle}>Modulok</h2>
                <p style={sectionSubtitle}>
                  A rendszer összes funkciója egy helyen
                </p>
              </div>
            </div>

            <div
              style={{
                ...moduleGrid,
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "repeat(2, minmax(0, 1fr))",
              }}
            >
              {modules.map((module) => (
  <button
    key={module.title}
    type="button"
    onMouseEnter={(e) => {
      e.currentTarget.style.transform =
        "translateY(-3px)";

      e.currentTarget.style.borderColor =
        "#3b82f6";

      e.currentTarget.style.boxShadow =
        "0 20px 40px rgba(59,130,246,.20)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform =
        "translateY(0px)";

      e.currentTarget.style.borderColor =
        "#334155";

      e.currentTarget.style.boxShadow =
        "0 10px 25px rgba(0,0,0,.35)";
    }}
    onClick={() => {
      if (module.onClick) {
        module.onClick();
        return;
      }

      if (module.path) {
        navigate(module.path);
      }
    }}
    style={moduleCard}
  >
    <span
      style={{
        ...moduleIcon,
        background: `${module.accent}18`,
        borderColor: `${module.accent}45`,
      }}
    >
      {module.icon}
    </span>

    <span style={moduleContent}>
      <strong style={moduleTitle}>
        {module.title}
      </strong>

      <span style={moduleDescription}>
        {module.description}
      </span>
    </span>

    <span style={moduleArrow}>→</span>
  </button>
))}
              ))}
            </div>
          </section>

          {/* RENDSZERKEZELÉS */}
          <section style={sectionStyle}>
            <div style={sectionTitleRow}>
              <div>
                <h2 style={sectionTitle}>Rendszerkezelés</h2>
                <p style={sectionSubtitle}>
                  Biztonsági mentés és adatbázis-visszaállítás
                </p>
              </div>
            </div>

            <div
              style={{
                ...systemGrid,
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "repeat(2, minmax(0, 1fr))",
              }}
            >
              <button
                type="button"
                onClick={handleBackup}
                disabled={backingUp}
                style={{
                  ...systemCard,
                  opacity: backingUp ? 0.65 : 1,
                  cursor: backingUp ? "not-allowed" : "pointer",
                }}
              >
                <span style={backupIcon}>🛡️</span>

                <span style={moduleContent}>
                  <strong style={moduleTitle}>
                    {backingUp
                      ? "Mentés folyamatban..."
                      : "Biztonsági mentés"}
                  </strong>

                  <span style={moduleDescription}>
                    Teljes adatbázis-mentés küldése emailben
                  </span>
                </span>

                <span style={moduleArrow}>→</span>
              </button>

              <label
                style={{
                  ...systemCard,
                  borderColor: "#7f1d1d",
                  background:
                    "linear-gradient(135deg, rgba(127,29,29,0.18), rgba(15,23,42,0.86))",
                  opacity: restoring ? 0.65 : 1,
                  cursor: restoring ? "not-allowed" : "pointer",
                }}
              >
                <span style={restoreIcon}>⚠️</span>

                <span style={moduleContent}>
                  <strong style={moduleTitle}>
                    {restoring
                      ? "Visszaállítás folyamatban..."
                      : "Adatbázis visszaállítása"}
                  </strong>

                  <span style={moduleDescription}>
                    Korábbi JSON biztonsági mentés betöltése
                  </span>
                </span>

                <span style={moduleArrow}>→</span>

                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  disabled={restoring}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          </section>

          <footer style={footerContainer}>
            <div style={footerLine} />

            <div style={footerContent}>
              <span>NS-Air Klíma Rendszer</span>
              <span>v2.0</span>
              <span>2026</span>
            </div>
          </footer>
        </main>

        <EmailSettingsModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
        />
      </div>
    </PasswordGuard>
  );
}

const pageStyle: React.CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  overflow: "hidden",

 background:
  "linear-gradient(180deg, #020617 0%, #070f1e 100%)",

  color: "#f8fafc",

  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};


const backgroundGlowOne: React.CSSProperties = {
  position: "fixed",
  top: "-220px",
  left: "-180px",
  width: "520px",
  height: "520px",
  borderRadius: "50%",
  background: "rgba(37, 99, 235, 0.11)",
  filter: "blur(100px)",
  pointerEvents: "none",
};

const backgroundGlowTwo: React.CSSProperties = {
  position: "fixed",
  right: "-180px",
  bottom: "-220px",
  width: "520px",
  height: "520px",
  borderRadius: "50%",
  background: "rgba(16, 185, 129, 0.08)",
  filter: "blur(110px)",
  pointerEvents: "none",
};

const dashboardContainer: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "100%",
  maxWidth: "1180px",
  margin: "0 auto",
  padding: "26px 16px 40px",
  boxSizing: "border-box",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "28px",
};

const brandRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "11px",
  marginBottom: "24px",
};

const brandIcon: React.CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "13px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)",
  boxShadow: "0 10px 30px rgba(37,99,235,0.28)",
  color: "#fff",
  fontWeight: "900",
  fontSize: "20px",
};

const brandTitle: React.CSSProperties = {
  color: "#f8fafc",
  fontWeight: "800",
  fontSize: "16px",
  letterSpacing: "0.08em",
};

const brandSubtitle: React.CSSProperties = {
  color: "#64748b",
  fontSize: "12px",
  marginTop: "2px",
};

const welcomeTitle: React.CSSProperties = {
  margin: 0,
  color: "#f8fafc",
  fontWeight: "760",
  letterSpacing: "-0.04em",
};

const welcomeText: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "14px",
  lineHeight: 1.6,
  margin: "8px 0 0",
};

const headerStatusArea: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: "10px",
};

const onlineStatus: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  color: "#a7f3d0",
  background: "rgba(16,185,129,0.1)",
  border: "1px solid rgba(52,211,153,0.2)",
  padding: "8px 12px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "700",
};

const onlineDot: React.CSSProperties = {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  background: "#34d399",
  boxShadow: "0 0 12px rgba(52,211,153,0.9)",
};

const dateText: React.CSSProperties = {
  color: "#64748b",
  fontSize: "12px",
  textAlign: "right",
};

const kpiGrid: React.CSSProperties = {
  display: "grid",
  gap: "12px",
  marginBottom: "30px",
};

const kpiCard: React.CSSProperties = {
  appearance: "none",

  background: "#111827",

  border: "1px solid #334155",

  borderRadius: "20px",

  padding: "18px",

  display: "flex",
  alignItems: "center",
  gap: "13px",

  cursor: "pointer",

  color: "#fff",

  transition: "all .2s ease",

  boxShadow:
    "0 10px 25px rgba(0,0,0,.35)",
};

const kpiIcon: React.CSSProperties = {
  width: "44px",
  height: "44px",
  flexShrink: 0,
  borderRadius: "13px",
  border: "1px solid",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
};

const kpiContent: React.CSSProperties = {
  minWidth: 0,
};

const kpiLabel: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "11px",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const kpiValue: React.CSSProperties = {
  color: "#f8fafc",
  fontSize: "24px",
  lineHeight: 1.1,
  fontWeight: "800",
  marginTop: "5px",
};

const sectionStyle: React.CSSProperties = {
  marginBottom: "30px",
};

const sectionTitleRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  marginBottom: "14px",
};

const sectionTitle: React.CSSProperties = {
  color: "#f8fafc",
  fontSize: "18px",
  fontWeight: "750",
  margin: 0,
};

const sectionSubtitle: React.CSSProperties = {
  color: "#64748b",
  fontSize: "12px",
  margin: "5px 0 0",
};

const quickActionsGrid: React.CSSProperties = {
  display: "grid",
  gap: "10px",
};

const quickActionButton: React.CSSProperties = {
  appearance: "none",
  border: "1px solid rgba(148,163,184,0.14)",
  borderRadius: "15px",
  background: "rgba(15,23,42,0.7)",
  padding: "14px",
  display: "flex",
  alignItems: "center",
  gap: "11px",
  color: "#fff",
  cursor: "pointer",
  textAlign: "left",
};

const quickActionIcon: React.CSSProperties = {
  width: "39px",
  height: "39px",
  flexShrink: 0,
  borderRadius: "11px",
  border: "1px solid",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
};

const quickActionText: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "3px",
  minWidth: 0,
  flex: 1,
};

const quickActionTitle: React.CSSProperties = {
  color: "#f8fafc",
  fontSize: "13px",
};

const quickActionDescription: React.CSSProperties = {
  color: "#64748b",
  fontSize: "10px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const actionArrow: React.CSSProperties = {
  color: "#475569",
  fontSize: "16px",
};

const overviewGrid: React.CSSProperties = {
  display: "grid",
  gap: "14px",
  marginBottom: "30px",
};

const panelStyle: React.CSSProperties = {
  
 background: "#111827",
border: "1px solid #334155",
borderRadius: "18px",

boxShadow:
  "0 10px 30px rgba(0,0,0,.35)",
};

const panelHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "20px",
};

const panelTitle: React.CSSProperties = {
  color: "#f8fafc",
  fontSize: "17px",
  fontWeight: "750",
  margin: 0,
};

const panelSubtitle: React.CSSProperties = {
  color: "#64748b",
  fontSize: "11px",
  margin: "5px 0 0",
};

const textLinkButton: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#38bdf8",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "700",
};

const financialGrid: React.CSSProperties = {
  display: "grid",
  gap: "10px",
};

const financialItem: React.CSSProperties = {
  background: "rgba(2,6,23,0.44)",
  border: "1px solid rgba(148,163,184,0.09)",
  borderRadius: "13px",
  padding: "14px",
  display: "flex",
  flexDirection: "column",
  gap: "7px",
};

const financialLabel: React.CSSProperties = {
  color: "#64748b",
  fontSize: "11px",
};

const financialValue: React.CSSProperties = {
  color: "#f8fafc",
  fontSize: "17px",
  fontWeight: "800",
};

const progressArea: React.CSSProperties = {
  marginTop: "18px",
};

const progressHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  color: "#94a3b8",
  fontSize: "11px",
  marginBottom: "8px",
};

const progressTrack: React.CSSProperties = {
  height: "7px",
  borderRadius: "999px",
  background: "#1e293b",
  overflow: "hidden",
};

const progressValue: React.CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background:
    "linear-gradient(90deg, #2563eb 0%, #38bdf8 100%)",
};

const urgentPanel: React.CSSProperties = {
  border: "1px solid rgba(251,113,133,0.22)",
  borderRadius: "18px",
  background:
    "linear-gradient(145deg, rgba(127,29,29,0.18), rgba(15,23,42,0.76))",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  boxShadow: "0 14px 36px rgba(0,0,0,0.17)",
};

const urgentIcon: React.CSSProperties = {
  width: "44px",
  height: "44px",
  borderRadius: "13px",
  background: "rgba(251,113,133,0.13)",
  border: "1px solid rgba(251,113,133,0.24)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
  marginBottom: "18px",
};

const urgentLabel: React.CSSProperties = {
  color: "#fda4af",
  fontSize: "12px",
  fontWeight: "750",
};

const urgentValue: React.CSSProperties = {
  color: "#fff",
  fontSize: "38px",
  lineHeight: 1,
  fontWeight: "850",
  marginTop: "8px",
};

const urgentDescription: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "11px",
  lineHeight: 1.5,
  margin: "10px 0 18px",
};

const urgentButton: React.CSSProperties = {
  width: "100%",
  border: "1px solid rgba(251,113,133,0.28)",
  borderRadius: "10px",
  background: "rgba(251,113,133,0.12)",
  color: "#fecdd3",
  padding: "11px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "12px",
};

const moduleGrid: React.CSSProperties = {
  display: "grid",
  gap: "10px",
};

const moduleCard: React.CSSProperties = {
  appearance: "none",

  background: "#111827",

  border: "1px solid #334155",

  borderRadius: "15px",

  padding: "15px",

  display: "flex",
  alignItems: "center",
  gap: "13px",

  color: "#fff",

  cursor: "pointer",

  textAlign: "left",

  transition: "all .2s ease",

  boxShadow:
    "0 10px 25px rgba(0,0,0,.35)",
};

const moduleIcon: React.CSSProperties = {
  width: "43px",
  height: "43px",
  flexShrink: 0,
  borderRadius: "12px",
  border: "1px solid",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "19px",
};

const moduleContent: React.CSSProperties = {
  minWidth: 0,
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const moduleTitle: React.CSSProperties = {
  color: "#f8fafc",
  fontSize: "13px",
  fontWeight: "750",
};

const moduleDescription: React.CSSProperties = {
  color: "#64748b",
  fontSize: "10px",
  lineHeight: 1.4,
};

const moduleArrow: React.CSSProperties = {
  color: "#475569",
  fontSize: "17px",
};

const systemGrid: React.CSSProperties = {
  display: "grid",
  gap: "10px",
};

const systemCard: React.CSSProperties = {
  boxSizing: "border-box",
  border: "1px solid rgba(52,211,153,0.18)",
  borderRadius: "15px",
  background:
    "linear-gradient(135deg, rgba(6,78,59,0.16), rgba(15,23,42,0.82))",
  padding: "16px",
  display: "flex",
  alignItems: "center",
  gap: "13px",
  color: "#fff",
  textAlign: "left",
};

const backupIcon: React.CSSProperties = {
  width: "43px",
  height: "43px",
  flexShrink: 0,
  borderRadius: "12px",
  background: "rgba(52,211,153,0.12)",
  border: "1px solid rgba(52,211,153,0.22)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "19px",
};

const restoreIcon: React.CSSProperties = {
  width: "43px",
  height: "43px",
  flexShrink: 0,
  borderRadius: "12px",
  background: "rgba(251,113,133,0.12)",
  border: "1px solid rgba(251,113,133,0.22)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "19px",
};

const footerContainer: React.CSSProperties = {
  marginTop: "46px",
};

const footerLine: React.CSSProperties = {
  height: "1px",
  background:
    "linear-gradient(90deg, transparent, rgba(148,163,184,0.18), transparent)",
};

const footerContent: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "9px",
  paddingTop: "16px",
  color: "#475569",
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};
