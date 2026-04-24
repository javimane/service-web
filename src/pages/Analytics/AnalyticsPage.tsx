import {
  Activity,
  BarChart3,
  Eye,
  MousePointerClick,
  TrendingUp,
  Users,
} from "lucide-react";
import Footer from "../../components/Footer/Footer";
import DashboardSidebar from "../../components/DashboardSidebar/DashboardSidebar";
import { useAuth } from "../../context/AuthContext";
import { useDashboardSidebar } from "../../hooks/useDashboardSidebar";
import "../Dashboard/DashboardPage.css";
import "./AnalyticsPage.css";

const funnelData = [
  { label: "Profile Visits", value: "18.4K", progress: 92 },
  { label: "Qualified Leads", value: "4.9K", progress: 68 },
  { label: "Meetings Booked", value: "1.8K", progress: 47 },
  { label: "Closed Proposals", value: "426", progress: 34 },
];

const topChannels = [
  { channel: "Instagram Reels", traffic: "41%", trend: "+8.2%" },
  { channel: "Google Maps", traffic: "26%", trend: "+3.5%" },
  { channel: "Referrals", traffic: "18%", trend: "+5.9%" },
  { channel: "Website", traffic: "15%", trend: "+1.7%" },
];

export default function AnalyticsPage() {
  const { hasProfessionalSubscription } = useAuth();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useDashboardSidebar();

  return (
    <div className="dashboard-page-wrapper">
      <div className="dashboard-page analytics-page-layout">
        <DashboardSidebar
          activeItem="analytics"
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed((current) => !current)}
        />

        <main className="dashboard-main">
          <div
            className={`dashboard-main-panel ${!hasProfessionalSubscription ? "dashboard-main-panel--locked" : ""}`}
          >
            <div className="dashboard-content analytics-content">
              <section className="welcome-section">
                <div className="welcome-copy">
                  <h1>Panel de analíticos</h1>
                  <p>
                    Visualizá tu rendimiento comercial, el alcance de tus
                    campañas y la evolución de conversión en tiempo real.
                  </p>
                </div>
              </section>

              <section className="stats-grid analytics-stats-grid">
                <article className="stat-card analytics-kpi">
                  <div className="analytics-kpi__icon">
                    <Eye size={18} />
                  </div>
                  <span className="card-label">TOTAL VIEWS</span>
                  <h2 className="mid-value">24.8K</h2>
                  <p>Alcance orgánico acumulado en los últimos 30 días.</p>
                </article>

                <article className="stat-card analytics-kpi">
                  <div className="analytics-kpi__icon">
                    <Users size={18} />
                  </div>
                  <span className="card-label">NEW LEADS</span>
                  <h2 className="mid-value">1.240</h2>
                  <p>
                    Consultas nuevas provenientes de campañas y recomendaciones.
                  </p>
                </article>

                <article className="stat-card analytics-kpi">
                  <div className="analytics-kpi__icon">
                    <MousePointerClick size={18} />
                  </div>
                  <span className="card-label">CTR</span>
                  <h2 className="mid-value">6.8%</h2>
                  <p>Porcentaje de interacción sobre el contenido destacado.</p>
                </article>

                <article className="stat-card analytics-kpi">
                  <div className="analytics-kpi__icon">
                    <TrendingUp size={18} />
                  </div>
                  <span className="card-label">GROWTH</span>
                  <h2 className="mid-value">+14.2%</h2>
                  <p>Crecimiento sostenido contra el período anterior.</p>
                </article>
              </section>

              <section className="lower-grid analytics-lower-grid">
                <div className="section-container">
                  <div className="section-header">
                    <h2>Embudo de conversión</h2>
                    <BarChart3 size={18} />
                  </div>

                  <div className="performance-list">
                    {funnelData.map((item) => (
                      <div key={item.label} className="performance-item">
                        <span>{item.label}</span>
                        <div className="performance-bar">
                          <div
                            className="performance-bar__fill"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="side-column">
                  <div className="quick-actions analytics-panel-card">
                    <h3>Canales principales</h3>
                    <div className="channel-list">
                      {topChannels.map((item) => (
                        <div key={item.channel} className="channel-item">
                          <div>
                            <strong>{item.channel}</strong>
                            <p>{item.traffic} del tráfico</p>
                          </div>
                          <span className="channel-trend">{item.trend}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="latest-activity analytics-panel-card">
                    <h3>Resumen ejecutivo</h3>
                    <ul className="analytics-summary-list">
                      <li>
                        El mejor contenido de la semana fue video corto de obra
                        terminada.
                      </li>
                      <li>
                        Los contactos desde mapa siguen convirtiendo mejor que
                        redes.
                      </li>
                      <li>
                        La tasa de aceptación mantiene una tendencia positiva.
                      </li>
                    </ul>
                  </div>
                </div>
              </section>
            </div>

            {!hasProfessionalSubscription && (
              <div className="subscription-lock-overlay" role="alert">
                <div className="subscription-lock-card">
                  <h3>Suscripción profesional requerida</h3>
                  <p>
                    Para acceder a esta sección necesitás una suscripción
                    profesional activa.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
