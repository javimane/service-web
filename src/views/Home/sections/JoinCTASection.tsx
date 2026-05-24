import { useAuthModal } from "../../../context/AuthModalContext";
import "./JoinCTASection.css";

const BENEFITS = [
  { icon: "✓", label: "Perfil verificado" },
  { icon: "◈", label: "Catálogo digital" },
  { icon: "◎", label: "Clientes directos" },
  { icon: "◇", label: "Sin comisiones" },
];

export default function JoinCTASection() {
  const { openAuth } = useAuthModal();

  return (
    <section className="join-cta">
      <div className="home-section-container">
        <div className="join-cta__card">
          <div className="join-cta__glow" aria-hidden="true" />

          <div className="join-cta__content">
            <h2 className="join-cta__title">
              Únete al{" "}
              <span className="join-cta__title-accent">Sistema</span>
            </h2>

            <p className="join-cta__subtitle">
              Crea tu identidad digital, conecta con clientes reales
              y hace crecer tu negocio desde un solo lugar.
            </p>

            <ul className="join-cta__benefits" role="list">
              {BENEFITS.map(({ icon, label }) => (
                <li key={label} className="join-cta__benefit">
                  <span className="join-cta__benefit-icon" aria-hidden="true">{icon}</span>
                  {label}
                </li>
              ))}
            </ul>

            <div className="join-cta__actions">
              <button
                className="join-cta__btn-primary"
                onClick={() => openAuth("register")}
              >
                Crear cuenta gratis
              </button>
              <button
                className="join-cta__btn-secondary"
                onClick={() => openAuth("login")}
              >
                Ya tengo cuenta
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
