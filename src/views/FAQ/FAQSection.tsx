"use client";
import React, { useState } from "react";
import {
  ChevronDown,
  Store,
  Package,
  SlidersHorizontal,
  Truck,
  BadgePercent,
  Printer,
  Bike,
  Receipt,
  ShoppingBag,
  Landmark,
  CreditCard,
  Sparkles,
  LayoutDashboard,
  Settings,
  Ticket,
  MessageSquare,
  CalendarDays,
  Clapperboard,
} from "lucide-react";
import "./FAQPage.css";

const faqData = [
  {
    category: "Datos Comerciales y Verificación",
    icon: Store,
    questions: [
      {
        q: "¿Qué son los Datos Comerciales y dónde se configuran?",
        a: "Es la sección donde los profesionales y empresas configuran su identidad de negocio: nombre comercial o de fantasía, CUIT/CUIL, rubros/categorías, cobertura geográfica, ubicación del local comercial y medios de pago aceptados. Puedes acceder desde el Menú lateral en 'Datos Comerciales'.",
      },
      {
        q: "¿Cómo verifico mi cuenta con ARCA (ex AFIP)?",
        a: "En la pantalla de 'Datos Comerciales', dirígete a la sección de Verificación ARCA, ingresa tu CUIT y haz clic en 'Verificar Cuenta con ARCA'. El sistema consultará automáticamente el padrón oficial para validar la constancia de inscripción de tu actividad comercial.",
      },
      {
        q: "¿Qué beneficios obtengo al verificar mi cuenta?",
        a: "Una cuenta verificada recibe un distintivo de seguridad con borde y check verde en la foto de perfil en la pantalla principal y en los resultados de búsqueda. Esto brinda máxima confianza y credibilidad ante clientes y otros profesionales.",
      },
      {
        q: "¿Cómo configuro mi Cobertura Geográfica?",
        a: "Dentro de 'Datos Comerciales', ve al apartado 'Cobertura Geográfica'. Puedes seleccionar la provincia y marcar los departamentos o zonas donde ofreces tus servicios o envíos.",
      },
      {
        q: "¿Puedo registrar la dirección de mi local a la calle?",
        a: "Sí. Si tienes atención al público presencial, activa la opción 'Tengo Local Comercial' en 'Datos Comerciales'. Podrás ingresar tu dirección, altura, código postal y ubicar el punto exacto en el mapa interactivo para que los clientes te encuentren fácilmente.",
      },
      {
        q: "¿Cómo indico los medios de pago que acepto?",
        a: "En 'Datos Comerciales', encontrarás la sección 'Medios de Pago'. Allí podrás seleccionar todas las opciones disponibles en tu comercio (Efectivo, Tarjetas, Transferencia bancaria, Mercado Pago, etc.) para que tus clientes las conozcan antes de contratarte.",
      },
    ],
  },
  {
    category: "Productos y Catálogo",
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
    category: "Variantes de Productos",
    icon: SlidersHorizontal,
    questions: [
      {
        q: "¿Qué son las variantes de productos y para qué sirven?",
        a: "Las variantes te permiten vender un mismo artículo con diferentes opciones (como talles, colores, presentaciones, capacidad o modelos), manteniendo organizado tu catálogo y facilitando la compra.",
      },
      {
        q: "¿Cómo creo y administro las variantes de un producto?",
        a: "En tu lista de Productos dentro del Dashboard, pulsa el botón 'Variante' que figura en el producto deseado. Podrás definir los nombres de los atributos (ej. 'Color', 'Talle') y generar cada variante con su stock, precio y SKU específico.",
      },
      {
        q: "¿Cada variante puede tener su propio precio y stock?",
        a: "Sí. Cada variante cuenta con control de stock independiente y un precio opcional diferenciado del producto base, garantizando que nunca vendas unidades sin stock.",
      },
      {
        q: "¿Cómo visualiza el comprador las variantes?",
        a: "En la pantalla de detalle del producto, el cliente verá los selectores interactivos de cada variante. Al elegir una opción, el precio, las fotos y la disponibilidad se actualizan de forma inmediata.",
      },
    ],
  },
  {
    category: "Envíos Gratis y Configuración",
    icon: Truck,
    questions: [
      {
        q: "¿Dónde configuro los envíos gratis de mi comercio?",
        a: "En el Dashboard de Productos, pulsa el icono del camión en la barra superior ('Configurar envíos gratis'). Se abrirá la pantalla completa donde podrás configurar la compra mínima nacional, el delivery de cercanía y los envíos gratis individuales.",
      },
      {
        q: "¿Qué es la compra mínima nacional de la empresa?",
        a: "Es un monto en pesos (ARS) a partir del cual tu empresa ofrece envío sin cargo a los compradores. Se aplica a ventas que requieran envío fuera de la provincia o transporte de larga distancia.",
      },
      {
        q: "¿Cómo funciona el delivery gratis de cercanía?",
        a: "Activando 'Delivery gratis de la empresa' puedes especificar el radio máximo de cobertura en kilómetros (km), una compra mínima opcional y un peso máximo de paquete (kg) para despachar con tus propios repartidores.",
      },
      {
        q: "¿Cómo aplico envío gratis a productos específicos o categorías?",
        a: "En el apartado 'Envío gratis individual', puedes habilitar o quitar el envío gratis para todos tus productos, o filtrarlo por una categoría o subcategoría puntual. Estos artículos tendrán envío bonificado sin requerir compra mínima.",
      },
    ],
  },
  {
    category: "Cuotas y Financiación",
    icon: BadgePercent,
    questions: [
      {
        q: "¿Cómo habilito el pago en cuotas en mis productos o servicios?",
        a: "Al crear o editar cualquier producto o servicio en el Dashboard, activa la casilla de 'Habilitar cuotas' y selecciona la cantidad máxima de cuotas admitidas (por ejemplo 3, 6 o 12 cuotas).",
      },
      {
        q: "¿Dónde configuro promociones bancarias y cuotas sin interés?",
        a: "En tu Dashboard, ingresa a la sección 'Promociones Bancarias'. Podrás crear promociones con entidades bancarias y emisores de tarjetas de crédito, eligiendo días de vigencia, cuotas sin interés y reintegros.",
      },
      {
        q: "¿Cómo ve el comprador las cuotas disponibles?",
        a: "Tanto en el listado como en el detalle del producto o servicio se muestra una etiqueta destacada con la cantidad máxima de cuotas y el valor de cada cuota calculada automáticamente.",
      },
    ],
  },
  {
    category: "Sucursales e Impresión de Tickets",
    icon: Printer,
    questions: [
      {
        q: "¿Cómo agrego y administro las sucursales de mi comercio?",
        a: "En el Dashboard, accede a la sección 'Sucursales'. Podrás registrar múltiples locales ingresando nombre, dirección de la sucursal, teléfono, radio de entrega y horarios de apertura.",
      },
      {
        q: "¿Qué es la Sucursal Principal y los puntos de retiro?",
        a: "La Sucursal Principal es la sede cabecera de tu negocio. Además, puedes marcar cada sucursal como punto de retiro ('Pickup Point') para que los compradores puedan retirar sus compras presencialmente.",
      },
      {
        q: "¿Cómo funciona la impresión automática de tickets por Bluetooth?",
        a: "Si tu sucursal tiene activada la 'Impresión automática de tickets', es indispensable tener activado el Bluetooth en el dispositivo. La app se conectará a tu impresora térmica para emitir el ticket del pedido de manera instantánea al confirmarse una venta.",
      },
      {
        q: "¿Los clientes pueden ver mis sucursales en mi perfil?",
        a: "Sí. En tu perfil profesional o comercial, los compradores pueden pulsar el botón 'Ver sucursales' para consultar todos tus locales, teléfonos, horarios y abrir la ubicación en el mapa.",
      },
    ],
  },
  {
    category: "Logística y Repartidores (Riders)",
    icon: Bike,
    questions: [
      {
        q: "¿Cómo gestiono los repartidores (riders) de mi empresa?",
        a: "En el Dashboard, dentro de 'Logística' o 'Empleados', puedes dar de alta repartidores propios o vincular repartidores independientes para asignarles pedidos de entrega a domicilio.",
      },
      {
        q: "¿Cómo se asigna y despacha un pedido a un rider?",
        a: "Cuando un pedido se encuentra en preparación o listo, el comercio lo asigna a uno de sus riders disponibles. El repartidor recibe la notificación en su app con la dirección del comprador para iniciar el viaje.",
      },
      {
        q: "¿Cómo se valida y confirma la entrega del pedido?",
        a: "Al entregar el paquete al cliente, el comprador le proporciona un código de seguridad de 4 dígitos. El rider ingresa este código en la app para confirmar la recepción satisfactoria y completar el envío.",
      },
    ],
  },
  {
    category: "Gestión de Ventas y Pedidos",
    icon: Receipt,
    questions: [
      {
        q: "¿Dónde gestiono las ventas que ingresan a mi comercio?",
        a: "En el Dashboard, ingresa a la sección 'Ventas' o 'Pedidos'. Verás todos los pedidos organizados por estado: pendiente de pago, pagado, confirmado, en preparación, listo para retiro o entregado.",
      },
      {
        q: "¿Cómo coordino un envío por empresa de transporte o expreso?",
        a: "En el detalle de la venta con envío a domicilio, pulsa en 'Cargar transporte'. Podrás ingresar el nombre de la empresa de logística (ej. Correo Argentino, Andreani), el número de seguimiento y el enlace de tracking web.",
      },
      {
        q: "¿Cómo adjunto la factura al comprador?",
        a: "En el detalle de la venta, pulsa en 'Adjuntar factura'. Puedes subir un archivo PDF o imagen del comprobante fiscal para que el comprador lo descargue directamente desde su aplicación.",
      },
      {
        q: "¿Cómo confirmo una entrega con retiro en sucursal?",
        a: "Cuando el cliente se presente en el local para retirar, te facilitará su código alfanumérico de retiro. Ingrésalo en la venta para verificar la identidad y marcar el pedido como entregado.",
      },
    ],
  },
  {
    category: "Compras y Seguimiento de Pedidos",
    icon: ShoppingBag,
    questions: [
      {
        q: "¿Dónde veo el historial y seguimiento de mis compras?",
        a: "Desde el Menú lateral o tu Perfil, ingresa a 'Mis Compras'. Podrás consultar todos tus pedidos y seguir el estado en tiempo real (en preparación, listo para retirar o en camino).",
      },
      {
        q: "¿Cómo funciona el carrito de compras?",
        a: "El carrito agrupa productos o servicios de un mismo comercio para calcular un único costo de envío o coordinar un único retiro. Si deseas comprar a otro comercio, deberás finalizar o vaciar el pedido actual.",
      },
      {
        q: "¿Dónde encuentro mi código de retiro o código de entrega?",
        a: "Dentro de 'Mis Compras', al abrir el detalle de tu pedido activo, encontrarás en pantalla tu código de retiro (para presentar en el local) o tu código de entrega (para dárselo al rider cuando llegue a tu domicilio).",
      },
      {
        q: "¿Cuándo y cómo puedo calificar u opinar sobre un servicio?",
        a: "Para garantizar opiniones 100% auténticas, solo es posible calificar u opinar sobre un servicio una vez que lo hayas contratado y pagado, accediendo directamente desde el detalle de la compra.",
      },
    ],
  },
  {
    category: "Liquidaciones y Datos Bancarios",
    icon: Landmark,
    questions: [
      {
        q: "¿Qué son las liquidaciones y dónde las consulto?",
        a: "En tu Dashboard, la sección 'Liquidaciones' muestra el detalle de todas tus ventas cobradas a través de la plataforma, las comisiones aplicadas y los montos netos a recibir.",
      },
      {
        q: "¿Cuáles son los estados de una liquidación?",
        a: "Las liquidaciones pasan por tres etapas: 'Pendiente' (período de resguardo tras la entrega), 'Programada' (lista con fecha estipulada de acreditación) y 'Pagada' (fondos transferidos con éxito a tu cuenta).",
      },
      {
        q: "¿Dónde configuro mi CBU o cuenta bancaria para recibir los cobros?",
        a: "En el menú del Dashboard, selecciona 'Datos Bancarios'. Allí podrás ingresar y verificar tu CBU, CVU o Alias bancario y CUIT para que las liquidaciones se transfieran automáticamente.",
      },
    ],
  },
  {
    category: "Tarjetas y Métodos de Pago",
    icon: CreditCard,
    questions: [
      {
        q: "¿Dónde administro mis tarjetas guardadas?",
        a: "En el Dashboard o Menú lateral, dirígete a 'Tarjetas'. Podrás visualizar tus tarjetas de crédito y débito en un carrusel interactivo, establecer tu tarjeta predeterminada o eliminar tarjetas antiguas.",
      },
      {
        q: "¿Cómo agrego una nueva tarjeta paso a paso?",
        a: "Presiona 'Agregar nueva tarjeta' en la pantalla de Tarjetas. Un asistente interactivo te solicitará sucesivamente el número de tarjeta (con detección automática de marca y banco), nombre del titular, DNI, fecha de vencimiento y código de seguridad con animación 3D.",
      },
      {
        q: "¿Es seguro guardar tarjetas en la plataforma?",
        a: "Sí. Todos los métodos de pago se procesan bajo estrictos protocolos bancarios y estándares internacionales PCI-DSS mediante tokenización segura.",
      },
    ],
  },
  {
    category: "Suscripciones y Planes",
    icon: Sparkles,
    questions: [
      {
        q: "¿Qué planes existen?",
        a: "Ofrecemos diferentes planes (Gratuito, Estándar, Premium) adaptados a tus necesidades. Los planes de pago te permiten acceder a la creación de promociones, presupuesto, reels y otras herramientas avanzadas.",
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
      <div className="faq-header faq-header--section">
        <h1>Preguntas Frecuentes</h1>
        <p>
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
              type="button"
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

            <div className="faq-category__body">
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
                        type="button"
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
                      <div className="faq-question__answer">
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
