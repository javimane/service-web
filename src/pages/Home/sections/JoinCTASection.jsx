import { Link } from 'react-router-dom';
import { ROUTES } from '../../../routes/paths';
import './JoinCTASection.css';

export default function JoinCTASection() {
  return (
    <section className="join-cta">
      <div className="join-cta__inner">
        <div className="join-cta__left">
          <p className="join-cta__eyebrow">Únete al</p>
          <h2 className="join-cta__title">SISTEMA</h2>
          <p className="join-cta__subtitle">Crea tu identidad digital premium</p>
          <Link to={ROUTES.register} className="join-cta__btn">
            Crear Cuenta
          </Link>
        </div>

        <div className="join-cta__right">
          <div className="join-cta__mesh" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
