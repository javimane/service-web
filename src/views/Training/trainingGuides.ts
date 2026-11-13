type Guide = {
  id: string;
  title: string;
  purpose: string;
  steps: string[];
  required?: string;
  cases?: string;
  resource?: { href: string; label: string };
  screenshot?: string;
};

export const trainingGroups: { title: string; guides: Guide[] }[] = [
  {
    title: "Primeros pasos",
    guides: [
      {
        id: "crear-cuenta",
        title: "Cómo crear una cuenta para comercios y profesionales",
        purpose:
          "Configurá tu cuenta, prepará tu perfil público y dejá listos los datos para cobrar.",
        steps: [
          "Entrá en Crear cuenta y seleccioná Soy Profesional/Comercio. Completá el registro y aceptá los términos y la política de privacidad.",
          "Abrí el correo de verificación. Si no lo encontrás, revisá la carpeta de correo no deseado. Después de verificar tu correo, iniciá sesión.",
          "Seleccioná un plan de suscripción para tu cuenta de comercio o profesional. Revisá qué incluye cada plan y confirmá tu elección para continuar con la configuración de tu cuenta.",
          "En Tus datos, revisá tu nombre y apellido. Agregá tu DNI y teléfono. En Dirección, guardá una dirección de entrega para continuar.",
          "En Datos comerciales, guardá el nombre del negocio, el CUIT/CUIL y la categoría de servicio. Completá la verificación fiscal en ARCA y la del CBU de cobro.",
          "En Perfil público, escribí y guardá una descripción que explique qué ofrecés y dónde atendés.",
          "En Identidad, podés ir al panel. Para comprar con esa cuenta, abrí la app de Sercio y entrá en Menú → Configuración → Verificación de Identidad y Edad. Cargá tu DNI y una foto de tu rostro.",
        ],
        required:
          "En el registro se pide nombre, apellido, correo, contraseña y su confirmación. Usá al menos 9 caracteres, una mayúscula, un número y un carácter especial, sin espacios. En el asistente, el DNI debe tener 7 u 8 dígitos y el teléfono al menos 8. El CUIT/CUIL tiene 11 dígitos y el CBU/CVU, 22.",
        cases:
          "Si ya tenés una cuenta como comprador, entrá en Suscripción para consultar los planes profesionales. Si vas a vender productos, configurá una sucursal antes de empezar a vender.",
        screenshot: "Registro y pasos para completar el perfil",
      },
      {
        id: "panel",
        title: "Panel",
        purpose: "Es el punto de entrada a las herramientas de tu cuenta.",
        steps: [
          "Revisá si hay verificaciones pendientes.",
          "Abrí la sección que necesitás desde el menú lateral.",
        ],
        cases:
          "Las opciones disponibles dependen del tipo de cuenta y, en algunos casos, del plan o de si administrás una flota.",
      },
    ],
  },
  {
    title: "Comercio y logística",
    guides: [
      {
        id: "ventas",
        title: "Ventas",
        purpose:
          "Gestioná pedidos de productos y servicios desde que se acredita el pago.",
        steps: [
          "Usá los filtros de fecha y sucursal para buscar una venta.",
          "Confirmá el pedido pagado. Para productos, marcá la preparación y luego que está listo para retirar según la modalidad de entrega.",
          "Para servicios, asigná el turno y registrá la realización con el código de entrega cuando corresponda.",
        ],
        cases:
          "Si hay un reclamo, abrí el detalle para consultar el estado y las acciones disponibles. Si la venta sigue pendiente de pago, esperá la acreditación antes de prepararla.",
      },
      {
        id: "liquidaciones",
        title: "Liquidaciones",
        purpose:
          "Consultá cuánto vas a cobrar, cuándo está prevista la acreditación y qué descuentos se aplicaron.",
        steps: [
          "Filtrá por fecha y sucursal.",
          "Abrí una liquidación para ver el monto neto, el detalle de los descuentos y su estado.",
          "Usá la opción de reporte para solicitar el informe con los filtros que necesitás.",
        ],
        cases:
          "Una liquidación cancelada no tiene fecha de acreditación. Si hay una devolución, revisá el detalle y los ajustes correspondientes.",
      },
      {
        id: "datos-comerciales",
        title: "Datos Comerciales",
        purpose:
          "Identificá al negocio, configurá su operación y registrá la cuenta donde vas a cobrar.",
        steps: [
          "Completá el nombre comercial, CUIT/CUIL y al menos una categoría de servicio. Guardá y verificá los datos fiscales en ARCA.",
          "En Datos de Cobro, ingresá y verificá el CBU/CVU de una cuenta cuya titularidad coincida con el CUIT verificado.",
          "En Operaciones, indicá si tenés local al público. Si corresponde, ubicá el local en el mapa y guardá sus datos.",
        ],
        required:
          "Nombre comercial, CUIT/CUIL de 11 dígitos, categoría y verificaciones fiscal y de cobro para completar el alta. Al declarar un local al público, guardá su dirección y ubicación.",
      },
      {
        id: "sucursales",
        title: "Sucursales",
        purpose:
          "Administrá los puntos de retiro y los lugares desde donde preparás y enviás pedidos.",
        steps: [
          "Sucursal principal. En Datos Comerciales → Operaciones, indicá que tenés local al público. Buscá la dirección en el mapa, verificá el pin y guardá. La dirección del comercio aparece en Sucursales como Sucursal Principal.",
          "Sucursales adicionales. En Sucursales, agregá un local. Completá el nombre y elegí el punto en el mapa para guardar sus coordenadas. Revisá calle, número, código postal, provincia y departamento.",
          "Para cada local, revisá el estado abierto o cerrado, la opción de retiro, el radio de entrega y la demora estimada en minutos. Activá Envíos propios si ese local usa personal de la empresa.",
          "Si usás impresión automática, activala en la sucursal correspondiente. Se aplica a los tickets de pedidos con pago realizado.",
        ],
        required:
          "Para una sucursal adicional, completá nombre, calle, número, código postal, ubicación válida, radio de entrega y demora estimada de al menos un minuto. Si elegís provincia, seleccioná su departamento o partido. Piso, departamento y teléfono de contacto son opcionales.",
        cases:
          "Si una sucursal cerrada ofrece delivery con riders propios y el checkout habilita esa modalidad, el envío queda programado para el día siguiente. El retiro en tienda sigue su propia coordinación. Fuera del radio, el comprador puede elegir retiro o acordar la entrega cuando esas opciones estén disponibles. Un radio de 0 desactiva los envíos desde el local.",
        screenshot:
          "Sucursal principal, formulario de sucursal y ubicación en el mapa",
      },
      {
        id: "reputacion",
        title: "Reputación y Score",
        purpose: "Consultá tu nivel, puntaje y progreso comercial.",
        steps: [
          "Revisá el nivel actual y cuánto falta para el siguiente.",
          "Consultá los indicadores del panel para identificar qué aspectos de la atención podés mejorar.",
        ],
      },
      {
        id: "denuncias",
        title: "Denuncias",
        purpose:
          "Consultá las denuncias vinculadas a tu actividad en la plataforma.",
        steps: [
          "Abrí la denuncia para leer el motivo y su estado.",
          "Seguí las indicaciones del detalle si hace falta aportar información o corregir una publicación.",
        ],
        cases:
          "Para un reclamo sobre una compra concreta, usá el detalle de la venta o de la compra.",
      },
      {
        id: "riders",
        title: "Riders y Fleteros",
        purpose:
          "Administrá repartidores, vehículos y documentación de tu flota.",
        steps: [
          "Registrá al rider y elegí si usa un vehículo propio o uno de la empresa.",
          "Si usa un vehículo de la empresa, asignale uno del listado. Si usa el suyo, cargá sus datos y los documentos que solicite el formulario.",
          "Consultá el estado de verificación antes de asignarle entregas.",
        ],
        cases:
          "El rider debe descargar Sercio Envíos. Con la documentación completa, la revisión puede demorar entre 24 y 48 horas.",
        resource: {
          href: "https://play.google.com/store/apps/details?id=app.sercio.shipments.sercio_app_shipments&hl=es_AR",
          label: "Descargar Sercio Envíos en Google Play",
        },
      },
      {
        id: "mapa-envios",
        title: "Mapa de Envíos",
        purpose:
          "Seguí las entregas activas y la ubicación que informa tu flota.",
        steps: [
          "Seleccioná un rider o envío activo.",
          "Consultá el estado, el trayecto y la llegada estimada cuando haya datos disponibles.",
        ],
        cases:
          "Si no aparece la posición, revisá que el rider esté conectado y que Sercio Envíos tenga permiso de ubicación.",
      },
      {
        id: "productos",
        title: "Productos",
        purpose:
          "Publicá tu catálogo y gestioná precios, stock, variantes y envíos.",
        steps: [
          "Buscá por EAN para reutilizar una ficha existente o creá una nueva.",
          "Completá los datos del producto, cargá sus imágenes y guardá el precio y stock.",
          "Si tiene talles, colores u otras características distintas, creá variantes. Revisá su precio, stock y EAN por separado.",
          "Revisá el stock por sucursal y configurá descuentos, cuotas o envío gratis según corresponda.",
        ],
        required:
          "Al crear un producto, completá nombre, categoría, condición, precio, stock, peso y dimensiones. Ingresá el EAN o marcá que no tiene código de barras. Revisá los campos obligatorios que se muestran para tu categoría.",
        cases:
          "El precio de oferta se puede combinar con una promoción 2x1 o 3x2. Las unidades que se cobran se calculan al precio de oferta. Si la compra alcanza el mínimo para aplicar el precio mayorista, se aplica solo ese precio. El mínimo de compra para envío gratis es una política del comercio. El envío gratis individual se configura sobre los productos que elijas.",
      },
      {
        id: "servicios",
        title: "Servicios",
        purpose:
          "Publicá lo que ofrecés y configurá dónde se presta cada servicio.",
        steps: [
          "Creá el servicio con nombre, categoría y precio. Describí qué incluye.",
          "Revisá las ubicaciones donde lo ofrecés. Si habilitás cuotas sin interés, elegí el máximo de cuotas.",
          "Después de una venta, consultá el pedido en Ventas para coordinar o asignar el turno.",
        ],
        required: "Nombre, categoría y precio.",
      },
    ],
  },
  {
    title: "Compras",
    guides: [
      {
        id: "compras",
        title: "Compras",
        purpose: "Revisá el historial de pedidos, turnos y entregas.",
        steps: [
          "Abrí Ver detalle y seguimiento.",
          "Consultá el estado del pedido, el pago y la modalidad de entrega. Usá las acciones de devolución, reclamo o calificación cuando estén habilitadas.",
        ],
        cases:
          "Para un retiro en tienda, revisá el aviso de que el pedido está listo. El plazo de retiro es de 30 días desde ese aviso.",
      },
      {
        id: "favoritos",
        title: "Favoritos",
        purpose: "Encontrá los productos, servicios y perfiles que guardaste.",
        steps: [
          "Tocá el corazón en la ficha que te interesa.",
          "Entrá en Favoritos para volver a verla o quitarla del listado.",
        ],
      },
      {
        id: "tarjetas",
        title: "Tarjetas",
        purpose: "Administrá las tarjetas guardadas en tu cuenta.",
        steps: [
          "En una compra con tarjeta compatible, elegí guardarla si la opción está disponible.",
          "Abrí Tarjetas para revisar o quitar los medios guardados.",
        ],
        cases:
          "Si todavía no tenés una tarjeta guardada, podés guardarla al hacer una compra compatible.",
      },
      {
        id: "carrito",
        title: "Carrito",
        purpose: "Revisá los artículos antes de pagar.",
        steps: [
          "Ajustá las cantidades disponibles o quitá artículos.",
          "Elegí las opciones de entrega y pago que se muestran para cada comercio.",
          "Revisá los datos de facturación, los costos y el total antes de confirmar.",
        ],
        cases:
          "Si un producto se queda sin stock o cambia su precio, revisá el carrito antes de intentar el pago.",
      },
    ],
  },
  {
    title: "Perfil, actividad y comunicación",
    guides: [
      {
        id: "perfil",
        title: "Perfil",
        purpose:
          "Mostrá a los clientes quién sos y cómo trabajás. Podés agregar fotos de tus trabajos, videos de presentación y los horarios en los que atendés.",
        steps: [
          "En Datos principales, cargá tu foto de perfil y una imagen de portada. Contá qué hacés, indicá tu especialidad y años de experiencia, y completá si tenés matrícula o atendés urgencias. Elegí Guardar cambios.",
          "En Horarios de atención, agregá los días y las franjas horarias en las que atendés. Elegí Guardar horarios.",
          "En Imágenes de presentación, elegí Agregar imagen. Podés seleccionar varias fotos a la vez para mostrar trabajos terminados o ejemplos de lo que ofrecés. Revisá la selección antes de subirla.",
          "En Videos de presentación, elegí Agregar video, seleccioná el archivo y escribí un título. Si querés, agregá una descripción. Revisá la vista previa y elegí Subir video.",
          "Usá Compartir Perfil para enviar el enlace a tus clientes o Generar Tarjeta QR para descargar una imagen con el código de tu perfil.",
        ],
        required:
          "Guardá una descripción para completar el alta profesional. Si subís un video, el archivo y el título son obligatorios. La descripción del video es opcional.",
        cases:
          "La carga de videos de presentación está disponible en los planes Básico y Premium. También podés editar el título y la descripción de un video publicado o eliminarlo.",
        screenshot:
          "Datos principales, horarios e imágenes y videos de presentación",
      },
      {
        id: "presupuestos",
        title: "Presupuestos",
        purpose: "Prepará cotizaciones y seguí su estado.",
        steps: [
          "En Crear Presupuesto, elegí el destinatario y detallá los conceptos y precios.",
          "En Ver Presupuestos, abrí el presupuesto para consultar su estado y las acciones disponibles.",
        ],
        cases:
          "Una cuenta compradora puede consultar presupuestos recibidos. La creación está disponible para profesionales.",
      },
      {
        id: "solicitudes",
        title: "Solicitudes",
        purpose:
          "Consultá las solicitudes de trabajo disponibles para tu cuenta.",
        steps: [
          "Abrí una solicitud para leer qué necesita el cliente y dónde.",
          "Si podés realizar el trabajo, respondé con los detalles que solicite el formulario.",
        ],
      },
      {
        id: "promociones",
        title: "Promociones",
        purpose:
          "Difundí beneficios de tu comercio y gestioná lo que ya publicaste.",
        steps: [
          "En Crear Promoción, describí el beneficio, su vigencia y las condiciones de uso.",
          "En Ver Todas, revisá las promociones publicadas y sus acciones disponibles.",
        ],
        cases:
          "Aclarale al cliente si el beneficio se aplica en el local físico u otro canal. Para cambiar el precio de compra en Sercio, configurá la oferta en Productos.",
      },
      {
        id: "promociones-bancarias",
        title: "Prom. Bancarias",
        purpose:
          "Consultá y gestioná los beneficios bancarios disponibles en tu sección.",
        steps: [
          "Revisá la entidad, el medio de pago y la vigencia.",
          "Antes de publicar o usar un beneficio, verificá el tope, los comercios alcanzados y sus condiciones.",
        ],
        cases:
          "Un beneficio bancario aplica en los canales y medios de pago indicados en sus condiciones.",
      },
      {
        id: "empleos",
        title: "Empleos",
        purpose: "Gestioná avisos laborales desde tu cuenta profesional.",
        steps: [
          "Creá el aviso con el puesto, la ubicación y los requisitos.",
          "Revisá los avisos publicados y la información que ven los postulantes.",
        ],
      },
      {
        id: "publicaciones",
        title: "Publicaciones",
        purpose:
          "Compartí novedades del comercio o de tu actividad profesional.",
        steps: [
          "Prepará el texto y agregá material visual cuando corresponda.",
          "Publicá y revisá cómo se muestra desde tu perfil.",
        ],
      },
      {
        id: "calendario",
        title: "Calendario",
        purpose: "Organizá tu agenda desde el panel.",
        steps: [
          "Consultá tus eventos en el calendario.",
          "Si querés usar Google Calendar y la integración está disponible, conectá tu cuenta y autorizá los permisos que se indiquen.",
        ],
      },
      {
        id: "historias",
        title: "Historias",
        purpose: "Mostrá tus trabajos, productos o novedades en video.",
        steps: [
          "Elegí el video y completá los datos que pida el formulario.",
          "Esperá a que termine la carga y revisá cómo se muestra.",
        ],
      },
      {
        id: "referidos",
        title: "Referidos",
        purpose:
          "Compartí tu enlace de invitación y seguí el estado de tus referidos.",
        steps: [
          "Copiá tu enlace personal desde el panel.",
          "Revisá las condiciones y consultá el estado de las invitaciones.",
        ],
        cases:
          "Los beneficios se acreditan cuando se cumplen las condiciones del programa.",
      },
      {
        id: "mensajes",
        title: "Mensajes",
        purpose:
          "Respondé consultas y retomá conversaciones con clientes o comercios.",
        steps: [
          "Elegí una conversación en la bandeja y respondé.",
          "Para hablar sobre un pedido, abrí el chat desde el detalle de la venta o compra correspondiente.",
        ],
      },
      {
        id: "notificaciones",
        title: "Notificaciones",
        purpose:
          "Revisá avisos sobre pedidos, mensajes y actividad de tu cuenta.",
        steps: [
          "Abrí la notificación para consultar el detalle o ir a la sección relacionada.",
          "Marcá como leídos los avisos que ya revisaste.",
        ],
      },
    ],
  },
  {
    title: "Cuenta y soporte",
    guides: [
      {
        id: "suscripcion",
        title: "Suscripción",
        purpose: "Consultá o gestioná tu plan profesional.",
        steps: [
          "Revisá el plan actual y las opciones disponibles.",
          "Antes de confirmar un cambio o cancelación, revisá las condiciones y la vigencia que se muestran.",
        ],
      },
      {
        id: "configuracion",
        title: "Configuración",
        purpose:
          "Actualizá los datos de tu cuenta, las direcciones y la información de facturación.",
        steps: [
          "Datos de facturación. Agregá los datos que querés que figuren en el comprobante de tu compra. Ingresá el nombre y apellido del titular y su CUIT o CUIL de 11 dígitos, sin guiones ni espacios.",
          "Elegí la condición frente al IVA. Si seleccionás Consumidor Final, completá los datos del titular. Si seleccionás Responsable Inscripto, agregá también el nombre de la empresa o su razón social. Podés marcar Usar como datos predeterminados en mis compras antes de elegir Guardar Datos.",
          "Dirección de entrega. Agregá la calle y el número, seleccioná la provincia y la localidad o departamento, y escribí el código postal. Si vivís en un edificio o complejo, podés agregar piso, departamento, manzana y entrecalles.",
          "Elegí Abrir Google Maps, buscá la dirección y ubicá el pin en el acceso correcto. Revisá los datos del formulario y agregá indicaciones si ayudan al repartidor, por ejemplo, qué timbre tocar o por qué entrada llegar.",
          "Guardá la dirección. Si es la que usás habitualmente, marcala como predeterminada. Si ya tenés varias direcciones o datos de facturación guardados, revisá cuáles seleccionaste antes de pagar.",
        ],
        required:
          "Facturación: nombre y apellido, CUIT/CUIL y condición frente al IVA. La razón social también es obligatoria para Responsable Inscripto. Dirección de entrega: calle y número. Cuando el formulario se abre para completar una dirección exigida por el pago, también pide provincia, localidad y código postal.",
        cases:
          "La dirección de entrega indica dónde querés recibir el pedido. Los datos de facturación identifican a quién se emite el comprobante. Si comprás para una empresa y recibís el pedido en otro lugar, podés seleccionar los datos fiscales de la empresa y la dirección de entrega que corresponda. La verificación de identidad y edad se completa desde la app de Sercio.",
        screenshot: "Formularios de facturación y dirección de entrega con ubicación en el mapa",
      },
      {
        id: "ayuda",
        title: "Ayuda",
        purpose:
          "Contactá a soporte si necesitás asistencia con tu cuenta o con el uso de Sercio.",
        steps: [
          "Abrí Ayuda desde el panel.",
          "Explicá qué intentabas hacer y, si corresponde, incluí el número de pedido.",
        ],
      },
      {
        id: "preguntas-frecuentes",
        title: "Preguntas Frecuentes",
        purpose: "Encontrá respuestas sobre el funcionamiento de Sercio.",
        steps: [
          "Buscá el tema que necesitás y abrí la pregunta.",
          "Si tu caso sigue sin resolverse, entrá en Ayuda para consultarlo.",
        ],
      },
      {
        id: "reportar-problema",
        title: "Reportar Problema",
        purpose: "Informá un error de la plataforma.",
        steps: [
          "Indicá en qué pantalla ocurrió y qué pasos lo provocaron.",
          "Incluí el mensaje de error y, si el formulario permite adjuntos, una captura que ayude a entenderlo.",
        ],
        cases:
          "Para una devolución o un reclamo de un pedido, usá la acción correspondiente en Compras o Ventas.",
      },
    ],
  },
];
