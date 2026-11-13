import Link from "next/link";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { ROUTES } from "@/routes/paths";
import { trainingGroups } from "./trainingGuides";
import { trainingScreenshots } from "./trainingScreenshots";
import "./TrainingPage.css";

export default function TrainingPage() {
  return (
    <>
      <Navbar />
      <main className="training-page" id="capacitaciones">
        <header className="training-page__intro">
          <h1>Capacitaciones</h1>
          <p>Creá tu cuenta profesional y aprendé a usar cada sección del panel de Sercio.</p>
          <Link href="#crear-cuenta">Empezar por la creación de cuenta</Link>
        </header>

        <div className="training-page__layout">
          <nav className="training-page__menu" aria-label="Menú de capacitaciones" id="menu-capacitaciones">
            <h2>Menú de guías</h2>
            {trainingGroups.map((group, index) => (
              <details key={group.title} open={index === 0}>
                <summary>{group.title}</summary>
                <ul>
                  {group.guides.map((guide) => (
                    <li key={guide.id}>
                      <Link href={`#${guide.id}`}>
                        {guide.id === "crear-cuenta" ? "Crear una cuenta profesional" : guide.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </nav>

          <div className="training-page__guides">
            {trainingGroups.flatMap((group) => group.guides).map((guide) => (
              <section className="training-page__guide" id={guide.id} key={guide.id} aria-labelledby={`titulo-${guide.id}`}>
                <h2 id={`titulo-${guide.id}`}>{guide.title}</h2>
                <p>{guide.purpose}</p>
                <h3>Paso a paso</h3>
                <ol>
                  {guide.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
                {guide.required && (
                  <div className="training-page__requirements">
                    <h3>Datos obligatorios</h3>
                    <p>{guide.required}</p>
                  </div>
                )}
                {guide.cases && (
                  <div>
                    <h3>Alternativas y casos frecuentes</h3>
                    <p>{guide.cases}</p>
                  </div>
                )}
                {guide.resource && (
                  <p>
                    <a href={guide.resource.href} target="_blank" rel="noopener noreferrer">
                      {guide.resource.label}
                    </a>
                  </p>
                )}
                {trainingScreenshots[guide.id]?.map((screenshot) => {
                  const src = `/Imagenes%20Capacitaciones/${encodeURIComponent(screenshot.file)}`;
                  return (
                    <figure className="training-page__capture" key={screenshot.file}>
                      <a href={src} target="_blank" rel="noopener noreferrer" aria-label={`Ver captura completa: ${screenshot.caption}`}>
                        <Image src={src} alt={screenshot.caption} width={screenshot.width} height={screenshot.height} unoptimized />
                      </a>
                      <figcaption>{screenshot.caption}</figcaption>
                    </figure>
                  );
                }) ?? (
                <figure className="training-page__screenshot">
                  <ImageIcon size={20} aria-hidden="true" />
                  <figcaption>Espacio para captura · {guide.screenshot ?? guide.title}</figcaption>
                </figure>
                )}
                <div className="training-page__guide-links">
                  {guide.id === "crear-cuenta" && <Link href={ROUTES.register}>Crear cuenta</Link>}
                  <Link href="#menu-capacitaciones">Volver al menú</Link>
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
