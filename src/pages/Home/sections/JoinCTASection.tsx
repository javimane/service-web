import { useAuthModal } from "../../../context/AuthModalContext";
import "./JoinCTASection.css";

export default function JoinCTASection() {
  const { openAuth } = useAuthModal();

  return (
    <section className="join-cta">
      <div className="join-cta__inner">
        <div className="join-cta__left">
          <p className="join-cta__eyebrow">Únete al</p>
          <h2 className="join-cta__title">SISTEMA</h2>
          <p className="join-cta__subtitle">
            Crea tu identidad digital premium
          </p>
          <button
            className="join-cta__btn"
            onClick={() => openAuth("register")}
          >
            Crear Cuenta
          </button>
        </div>

        <div className="join-cta__right">
          <div className="join-cta__mesh" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
