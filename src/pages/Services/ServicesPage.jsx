import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { showcasedSpecialist } from "../../data/specialists";
import { ROUTES } from "../../routes/paths";
import "./ServicesPage.css";

export default function ServicesPage() {
  return (
    <div className="services-page">
      <Navbar />

      <main className="services-page__content">
        <div className="services-page__hero">
          <div>
            <p className="services-page__pretitle">Servicios profesionales</p>
            <h1>Servicios de {showcasedSpecialist.name}</h1>
            <p className="services-page__subtitle">
              Encuentra el servicio que necesitas para tu proyecto con precios
              claros y atención personalizada.
            </p>
          </div>
          <Link to={ROUTES.profile} className="services-page__back-link">
            <ArrowLeft size={16} /> Volver al perfil
          </Link>
        </div>

        <section className="services-page__grid">
          {showcasedSpecialist.services.map((service) => (
            <article key={service.title} className="services-page__card">
              <div>
                <h2>{service.title}</h2>
                <p>{service.description}</p>
              </div>
              <span className="services-page__price">{service.price}</span>
            </article>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}
