import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  Box,
  CircleCheck,
  Navigation,
  Power,
  Receipt,
  RotateCcw,
  Store,
} from "lucide-react";
import "./RiderManualPage.css";

const steps = [
  {
    number: "01",
    id: "disponibilidad",
    title: "Disponibilidad y Conexión",
    subtitle: "Estar listo para recibir viajes",
    Icon: Power,
    points: [
      "Asegurate de tener activado el GPS del teléfono con permisos en segundo plano.",
      'En la pantalla de inicio, verificá que tu estado esté en "Disponible".',
      "Cuando haya comercios enviando pedidos en tu zona, la app te alertará con sonido y vibración.",
    ],
  },
  {
    number: "02",
    id: "oferta",
    title: "Aceptación de la Oferta",
    subtitle: "Revisión rápida de datos y flete",
    Icon: Bell,
    points: [
      "Cada oferta muestra: origen (local comercial), destino (domicilio del cliente), distancia estimada y flete base.",
      "Verificá el peso del envío (ej: si vas en moto, el límite estándar es de 30 kg).",
      "Tenés 30 segundos para aceptar la orden antes de que se ofrezca a otro repartidor.",
    ],
  },
  {
    number: "03",
    id: "retiro",
    title: "Retiro en el Local Comercial",
    subtitle: "Verificación y escaneo de retiro",
    Icon: Store,
    points: [
      "Usá el GPS de la app para dirigirte a la sucursal de retiro. En la pantalla también podés consultar la dirección de entrega.",
      "Presentate amablemente con el número de pedido `#ID` que figura en tu app.",
      'Solicitá al encargado del local el código QR de retiro y escanealo con el botón central "Escanear" para confirmar que el paquete está en tu poder.',
    ],
  },
  {
    number: "04",
    id: "en-ruta",
    title: "En Ruta hacia el Destino",
    subtitle: "Conducción segura y comunicación",
    Icon: Navigation,
    points: [
      "Transportá la mercadería en tu mochila térmica o baúl de forma estable.",
      "Si hay demoras imprevistas por tráfico o lluvia, podés avisar desde el chat de soporte o llamar al cliente con el botón telefónico de la pantalla de ruta.",
      "Respetá siempre las normas viales y usá casco.",
    ],
  },
  {
    number: "05",
    id: "entrega",
    title: "Entrega Exitosa al Destinatario",
    subtitle: "Finalización de la orden",
    Icon: CircleCheck,
    points: [
      "Tocá el timbre en el domicilio indicado y confirmá el nombre del cliente.",
      "Solicitá al cliente el código QR de entrega y validalo en la app al entregarle el paquete.",
      "La entrega confirmada quedará registrada en tu resumen de viajes.",
    ],
  },
  {
    number: "06",
    id: "devolucion",
    title: "Cliente ausente: devolución al comercio",
    subtitle: "Qué hacer si nadie recibe el pedido",
    Icon: RotateCcw,
    points: [
      "Esperá al menos 10 minutos en el domicilio e intentá contactar al comprador por llamada o mensaje desde la app.",
      'Si nadie recibe el pedido, tocá "Cliente ausente · solicitar devolución". Indicá cómo intentaste contactarlo y confirmá la espera de 10 minutos; podés agregar un detalle si hace falta.',
      "Cuando la app confirme la solicitud, seguí el GPS hasta la sucursal de retiro con el paquete. La app te mostrará el código y el QR de devolución.",
      "Entregá el paquete en la sucursal y mostrale el QR o el código al comercio para que registre la recepción. La devolución termina cuando el comercio la confirma.",
    ],
  },
  {
    number: "07",
    id: "cobro",
    title: "Facturación y Cobro Semanal",
    subtitle: "Riders independientes y Gestorando",
    Icon: Receipt,
    points: [
      "Los días viernes de cada semana se emite la factura electrónica por el total de fletes base en la app de Gestorando.",
      'Presentá tu comprobante desde el menú en "Facturas a Sercio" para programar la acreditación en tu cuenta bancaria.',
    ],
  },
] as const;

const capacities = [
  {
    vehicle: "Bicicleta",
    weight: "Hasta 15 kg",
    description: "Mochila térmica",
  },
  {
    vehicle: "Moto",
    weight: "Hasta 30 kg",
    description: "Baúl o mochila técnica",
  },
  { vehicle: "Auto", weight: "Hasta 200 kg", description: "Baúl completo" },
  {
    vehicle: "Camioneta / Utilitario",
    weight: "Hasta 800 kg",
    description: "Caja de carga",
  },
  {
    vehicle: "Camión de Logística",
    weight: "Hasta 15.000 kg",
    description: "Flete pesado",
  },
] as const;

export default function RiderManualPage() {
  return (
    <div className="rider-manual">
      <header className="rider-manual__topbar">
        <Link
          href="/"
          className="rider-manual__brand"
          aria-label="Ir al inicio de Sercio"
        >
          <span className="rider-manual__brand-mark">S</span>
          <span>Sercio</span>
        </Link>
        <span className="rider-manual__topbar-label">
          Guía para repartidores
        </span>
      </header>

      <main className="rider-manual__main">
        <section
          className="rider-manual__hero"
          aria-labelledby="rider-manual-title"
        >
          <span className="rider-manual__eyebrow">
            <BookOpen aria-hidden="true" /> Manual de operaciones
          </span>
          <h1 id="rider-manual-title">Manual del Rider</h1>
          <h2>Guía de Operaciones Sercio</h2>
          <p>
            Todo lo que necesitás saber para repartir con éxito, cuidar tu
            reputación y maximizar tus ingresos.
          </p>
          <a href="#disponibilidad" className="rider-manual__start-link">
            Empezar la guía <ArrowUpRight aria-hidden="true" />
          </a>
        </section>

        <div className="rider-manual__layout">
          <nav className="rider-manual__toc" aria-label="Secciones del manual">
            <span className="rider-manual__toc-label">EN ESTA GUÍA</span>
            {steps.map((step) => (
              <a key={step.id} href={`#${step.id}`}>
                <span>{step.number}</span>
                {step.title}
              </a>
            ))}
            <a href="#capacidades">
              <span>↳</span>Límites de carga
            </a>
          </nav>

          <div className="rider-manual__content">
            <div className="rider-manual__section-heading">
              <span>PASO A PASO</span>
              <h2>De la conexión a la entrega</h2>
            </div>
            {steps.map(({ number, id, title, subtitle, Icon, points }) => (
              <section
                className="rider-manual__step"
                id={id}
                key={id}
                aria-labelledby={`${id}-title`}
              >
                <div className="rider-manual__step-number">{number}</div>
                <div className="rider-manual__step-body">
                  <div className="rider-manual__step-heading">
                    <div>
                      <span className="rider-manual__step-subtitle">
                        {subtitle}
                      </span>
                      <h3 id={`${id}-title`}>{title}</h3>
                    </div>
                    <Icon aria-hidden="true" />
                  </div>
                  <ul>
                    {points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              </section>
            ))}

            <section
              id="capacidades"
              className="rider-manual__capacities"
              aria-labelledby="capacidades-title"
            >
              <div className="rider-manual__capacities-heading">
                <Box aria-hidden="true" />
                <div>
                  <span>REFERENCIA RÁPIDA</span>
                  <h2 id="capacidades-title">Límites de Carga por Vehículo</h2>
                </div>
              </div>
              <div className="rider-manual__capacity-list">
                {capacities.map(({ vehicle, weight, description }) => (
                  <div className="rider-manual__capacity-row" key={vehicle}>
                    <strong>{vehicle}</strong>
                    <span>{weight}</span>
                    <small>{description}</small>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
