"use client";
import React, { useState } from "react";
import {
  ChevronDown,
  Package,
  Settings,
  CreditCard,
  LayoutDashboard,
  MessageSquare,
  Ticket,
  CalendarDays,
  Clapperboard,
} from "lucide-react";
import "./FAQPage.css"; // Reuse the same CSS for styling

const faqData = [
  {
    category: "Productos",
    icon: Package,
    questions: [
      {
        q: "¿Cómo agrego un nuevo producto a mi tienda?",
        a: "Para agregar un producto, dirígete al Dashboard, selecciona la sección de 'Productos' y haz clic en el botón 'Agregar Producto'. Deberás completar los datos obligatorios como el código EAN, precio, categoría y stock.",
      },
      {
        q: "¿Qué significa el código EAN / UPC?",
        a: "Es el código de barras único que identifica a tu producto a nivel mundial. Puedes escanearlo con la cámara de tu dispositivo o ingresarlo manualmente. Es obligatorio para mantener el catálogo organizado.",
      },
      {
        q: "¿Cómo aplico descuentos a mis productos?",
        a: "Puedes aplicar un descuento individual editando el producto, o usar la opción 'Aumento/Descuento Masivo' en la sección de Productos para aplicar un porcentaje a todo tu catálogo o a una categoría en particular.",
      },
      {
        q: "¿Puedo vender productos al por mayor?",
        a: "Sí, al editar o crear un producto, puedes habilitar la opción de 'Venta Mayorista', indicando el precio por unidad al por mayor y la cantidad mínima de compra requerida.",
      },
    ],
  },
  {
    category: "Suscripciones y Planes",
    icon: CreditCard,
    questions: [
      {
        q: "¿Qué planes existen?",
        a: "Ofrecemos diferentes planes (Gratuito, Estándar, Premium) adaptados a tus necesidades. Los planes de pago te permiten acceder a la creación de promociones, presupuesto, historias y otras herramientas avanzadas.",
      },
      {
        q: "¿Cómo cancelo o cambio mi plan?",
        a: "Ve a la sección 'Suscripción' en tu Dashboard. Desde allí puedes ver tu plan actual y elegir la opción de mejorar o cancelar tu plan mediante Mercado Pago.",
      },
      {
        q: "¿Cuándo se me cobra la suscripción?",
        a: "La suscripción se cobra de forma mensual a partir de la fecha en la que te suscribiste al plan.",
      },
    ],
  },
  {
    category: "Panel de Control (Dashboard)",
    icon: LayoutDashboard,
    questions: [
      {
        q: "¿Cómo configuro mi perfil profesional?",
        a: "Ve a la sección 'Perfil' en tu Dashboard. Podrás agregar tu foto de perfil, descripción, imágenes para tu portfolio, horarios de atención y configurar los links a tus videos de presentación.",
      },
      {
        q: "¿Dónde veo las solicitudes de mis clientes?",
        a: "En tu Dashboard, dirígete a la sección 'Solicitudes' para ver todas las consultas y pedidos de presupuesto que los clientes te han enviado.",
      },
    ],
  },
  {
    category: "Configuración General",
    icon: Settings,
    questions: [
      {
        q: "¿Cómo cambio mi contraseña?",
        a: "Ingresa a 'Configuración' en el menú lateral de tu Dashboard y selecciona la opción de Seguridad para cambiar tu contraseña.",
      },
      {
        q: "¿Dónde contacto al soporte técnico?",
        a: "Al final de la página (en el pie de página) o en el menú de la izquierda encontrarás el botón de 'Soporte'. Podrás contactarnos por correo o WhatsApp.",
      },
    ],
  },
  {
    category: "Promociones y Descuentos",
    icon: Ticket,
    questions: [
      {
        q: "¿Qué sucede con las promociones cuando pasa su fecha?",
        a: "Tanto las promociones regulares como las promociones bancarias se vencen y desactivan automáticamente de forma inmediata después de pasada su fecha de expiración.",
      },
    ],
  },
  {
    category: "Chat y Mensajes",
    icon: MessageSquare,
    questions: [
      {
        q: "¿Con quién puedo comunicarme a través del chat?",
        a: "El chat permite que los usuarios compradores se comuniquen con profesionales o comercios. Asimismo, los profesionales y comercios pueden interactuar entre sí. Ten en cuenta que no está permitido el chat entre usuarios compradores.",
      },
    ],
  },
  {
    category: "Calendario y Turnos",
    icon: CalendarDays,
    questions: [
      {
        q: "¿Cómo funciona el calendario?",
        a: "La sección de calendario te permite gestionar de forma visual y rápida tus horarios de atención, organizar turnos y mantener tus citas bajo control.",
      },
    ],
  },
  {
    category: "Historias, Multimedia y Trabajos",
    icon: Clapperboard,
    questions: [
      {
        q: "¿Cuánto tiempo permanecen activas las historias?",
        a: "Las historias tienen una duración de 24 horas y luego se vencen automáticamente.",
      },
      {
        q: "¿Existen límites para subir contenido?",
        a: "No. Los usuarios que cuentan con un plan Estándar o Premium no tienen límite para subir videos, historias, fotos, productos, presupuestos ni promociones.",
      },
      {
        q: "¿Quiénes pueden ver los trabajos subidos?",
        a: "Los trabajos que suben los usuarios son exclusivos para profesionales y comercios. Los usuarios gratuitos (no pagos) no tienen acceso para visualizar estos trabajos.",
      },
    ],
  },
];

export default function FAQSection() {
  const [openCategory, setOpenCategory] = useState<number | null>(0);
  const [openQuestion, setOpenQuestion] = useState<{
    catIndex: number;
    qIndex: number;
  } | null>(null);

  const toggleCategory = (index: number) => {
    setOpenCategory((prev) => (prev === index ? null : index));
  };

  const toggleQuestion = (catIndex: number, qIndex: number) => {
    setOpenQuestion((prev) =>
      prev?.catIndex === catIndex && prev?.qIndex === qIndex
        ? null
        : { catIndex, qIndex },
    );
  };

  return (
    <div className="faq-content">
      <div
        className="faq-header"
        style={{ textAlign: "left", marginBottom: "var(--space-6)" }}
      >
        <h1>Preguntas Frecuentes</h1>
        <p style={{ margin: "0", maxWidth: "100%" }}>
          Encuentra rápidamente la respuesta a tus dudas y aprende a sacarle el
          máximo provecho a la plataforma.
        </p>
      </div>

      {faqData.map((cat, catIndex) => {
        const Icon = cat.icon;
        const isCatOpen = openCategory === catIndex;

        return (
          <div
            key={cat.category}
            className={`faq-category ${isCatOpen ? "faq-category--open" : ""}`}
          >
            <button
              className="faq-category__header"
              onClick={() => toggleCategory(catIndex)}
              aria-expanded={isCatOpen}
            >
              <div className="faq-category__title">
                <Icon size={24} className="faq-category__icon" />
                <h2>{cat.category}</h2>
              </div>
              <ChevronDown
                size={20}
                className={`faq-category__chevron ${isCatOpen ? "faq-category__chevron--open" : ""}`}
              />
            </button>

            <div
              className="faq-category__body"
              style={{
                maxHeight: isCatOpen ? "2000px" : "0",
                opacity: isCatOpen ? 1 : 0,
                overflow: "hidden",
                transition: "all 0.3s ease-in-out",
              }}
            >
              <div className="faq-questions">
                {cat.questions.map((item, qIndex) => {
                  const isQOpen =
                    openQuestion?.catIndex === catIndex &&
                    openQuestion?.qIndex === qIndex;

                  return (
                    <div
                      key={qIndex}
                      className={`faq-question ${isQOpen ? "faq-question--open" : ""}`}
                    >
                      <button
                        className="faq-question__header"
                        onClick={() => toggleQuestion(catIndex, qIndex)}
                        aria-expanded={isQOpen}
                      >
                        <h3>{item.q}</h3>
                        <ChevronDown
                          size={18}
                          className={`faq-question__chevron ${isQOpen ? "faq-question__chevron--open" : ""}`}
                        />
                      </button>
                      <div
                        className="faq-question__answer"
                        style={{
                          maxHeight: isQOpen ? "500px" : "0",
                          opacity: isQOpen ? 1 : 0,
                          padding: isQOpen ? "0 16px 16px" : "0 16px",
                          overflow: "hidden",
                          transition: "all 0.3s ease-in-out",
                        }}
                      >
                        <p>{item.a}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
