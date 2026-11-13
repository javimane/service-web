type TrainingScreenshot = {
  file: string;
  width: number;
  height: number;
  caption: string;
};

export const trainingScreenshots: Partial<Record<string, TrainingScreenshot[]>> = {
  "panel": [
    { file: "Panel.png", width: 1669, height: 1013, caption: "Vista general del panel" },
  ],
  "ventas": [
    { file: "Ventas.png", width: 2207, height: 776, caption: "Listado de ventas" },
  ],
  "liquidaciones": [
    { file: "Liquidaciones.png", width: 2212, height: 954, caption: "Listado de liquidaciones" },
  ],
  "datos-comerciales": [
    { file: "Datos comerciales con verificacion.png", width: 1017, height: 406, caption: "Datos comerciales y estado de verificación" },
  ],
  "sucursales": [
    { file: "Sucursales abiertas.png", width: 925, height: 476, caption: "Sucursales abiertas" },
    { file: "Sucursales Cerradas.png", width: 912, height: 659, caption: "Sucursales cerradas" },
    { file: "Editar sucursal.png", width: 1006, height: 1093, caption: "Formulario para editar una sucursal" },
  ],
  "reputacion": [
    { file: "Scoring.png", width: 2214, height: 765, caption: "Reputación y Score" },
  ],
  "denuncias": [
    { file: "Denuncias.png", width: 2203, height: 680, caption: "Listado de denuncias" },
  ],
  "riders": [
    { file: "Riders y Fleteros.png", width: 2170, height: 533, caption: "Gestión de riders y fleteros" },
  ],
  "mapa-envios": [
    { file: "Mapa de envios.png", width: 2218, height: 900, caption: "Mapa de envíos de la flota" },
  ],
  "productos": [
    { file: "Modificar precios productos.png", width: 508, height: 845, caption: "Modificar precios de productos" },
    { file: "Configuracion envios gratis productos.png", width: 610, height: 491, caption: "Opciones de envío gratis para productos" },
    { file: "Configuracion envios gratis general.png", width: 1004, height: 470, caption: "Configuración general de envíos gratis" },
    { file: "envios gratis compra minima.png", width: 605, height: 474, caption: "Envío gratis a partir de un mínimo de compra" },
    { file: "configuracion envios gratis individual productos.png", width: 609, height: 635, caption: "Envío gratis individual por producto" },
  ],
  "servicios": [
    { file: "Servicios (2).png", width: 1491, height: 561, caption: "Gestión de servicios" },
  ],
  "compras": [
    { file: "Compras.png", width: 990, height: 666, caption: "Historial de compras" },
  ],
  "perfil": [
    { file: "Perfil (2).png", width: 1093, height: 707, caption: "Edición del perfil profesional" },
  ],
  "presupuestos": [
    { file: "Creacion de Presupuesto.png", width: 2107, height: 1108, caption: "Formulario para crear un presupuesto" },
    { file: "Presupuestos.png", width: 854, height: 719, caption: "Listado de presupuestos" },
  ],
  "promociones": [
    { file: "crear nueva promocion.png", width: 689, height: 1710, caption: "Formulario para crear una promoción" },
  ],
  "promociones-bancarias": [
    { file: "promociones bancarias.png", width: 742, height: 815, caption: "Configuración de promociones bancarias" },
  ],
  "historias": [
    { file: "reels.png", width: 2231, height: 1200, caption: "Gestión de historias" },
  ],
  "suscripcion": [
    { file: "mi subscripción.png", width: 2219, height: 834, caption: "Vista de Mi suscripción" },
    { file: "subscripcion cuando no esta activa.png", width: 1069, height: 932, caption: "Opciones cuando la suscripción está inactiva" },
  ],
};
