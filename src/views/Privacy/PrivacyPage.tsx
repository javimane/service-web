"use client";
import React from "react";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import "./PrivacyPage.css";

export interface PrivacySectionItem {
  title: string;
  content: React.ReactNode;
}

export const PRIVACY_SECTIONS: PrivacySectionItem[] = [
  {
    title: "1. Compromiso con la Privacidad y Marco Normativo",
    content: (
      <>
        <p>
          En Sercio (accesible a través de{" "}
          <a
            href="https://sercio.com.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="privacy-link"
          >
            https://sercio.com.ar
          </a>{" "}
          y sus aplicaciones móviles oficiales), la protección de los datos
          personales, la seguridad transaccional y la confidencialidad de la
          información comercial de nuestros usuarios son pilares fundamentales.
        </p>
        <p>
          El tratamiento de los datos recolectados se rige bajo los principios de
          licitud, consentimiento, finalidad, lealtad, proporcionalidad y
          seguridad establecidos por la{" "}
          <strong>Ley N° 25.326 de Protección de los Datos Personales</strong> de
          la República Argentina, su Decreto Reglamentario N° 1558/2001 y las
          directrices emitidas por la{" "}
          <strong>Agencia de Acceso a la Información Pública (AAIP)</strong>,
          órgano de control de dicha ley.
        </p>
        <p>
          Al registrarse, navegar o utilizar los servicios de Sercio, el usuario
          presta su consentimiento previo, expreso, informado e irrevocable para
          el tratamiento de su información conforme a los términos aquí
          estipulados.
        </p>
      </>
    ),
  },
  {
    title: "2. Información Recopilada y Finalidades del Tratamiento",
    content: (
      <>
        <p>
          Sercio recopila información de los usuarios únicamente en la medida
          necesaria para prestar, gestionar y optimizar sus servicios de comercio
          electrónico, logística y contratación:
        </p>
        <ul>
          <li>
            <strong>Datos de cuenta e identificación personal:</strong> Nombre y
            apellido, correo electrónico, número de teléfono, fotografía de
            perfil (opcional), Documento Nacional de Identidad (DNI), CUIL/CUIT,
            domicilio (particular o de entrega) y número de teléfono. Estos datos
            se almacenan bajo estrictos estándares de seguridad técnica y
            organizativa con el fin exclusivo de constatar la identidad de las
            partes, garantizar la seguridad en las operaciones y prevenir
            fraudes, usurpación de identidad o maniobras ilícitas.
          </li>
          <li>
            <strong>Datos fiscales y de verificación comercial:</strong> Para
            comercios y profesionales: CUIT, constancia de inscripción ante la
            Agencia de Recaudación y Control Aduanero (ARCA), condición frente al
            IVA y régimen de Ingresos Brutos.
          </li>
          <li>
            <strong>Documentación vehicular y de conductores:</strong> En el caso
            de comercios, empresas o prestadores que cuenten con flota de reparto
            o transporte propio, se recopila y almacena documentación relativa a
            los vehículos (cédulas de identificación vehicular, títulos, pólizas
            de seguro) y a los conductores designados (licencias de conducir,
            DNI). La finalidad exclusiva de este registro es constatar la
            titularidad y estado regular de los vehículos, así como la debida
            habilitación e identidad de los conductores para garantizar la
            trazabilidad y seguridad en las entregas.
          </li>
          <li>
            <strong>Datos de geolocalización:</strong> Ubicación geográfica
            aproximada o precisa del dispositivo móvil (previa autorización
            expresa del usuario en primer o segundo plano) para conectar
            usuarios con comercios/profesionales cercanos y estimar costos y
            tiempos de entrega.
          </li>
          <li>
            <strong>Contenido generado por el usuario:</strong> Imágenes, videos
            breves (reels), descripciones de catálogos y publicaciones realizadas
            en la plataforma.
          </li>
          <li>
            <strong>Información técnica y de navegación:</strong> Dirección IP,
            tipo de dispositivo, sistema operativo, identificadores técnicos
            únicos y registros de fallos para garantizar la estabilidad y
            diagnóstico del servicio.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "3. Validación de Identidad (RENAPER) y Prevención de Fraudes",
    content: (
      <>
        <p>
          Para velar por la seguridad de la comunidad, mitigar estafas virtuales
          y prevenir transacciones no autorizadas:
        </p>
        <ol>
          <li>
            <strong>Cotejo con RENAPER:</strong> Sercio podrá solicitar el DNI,
            sexo/género registral y número de trámite, o requerir pruebas
            biométricas faciales temporales para validar la identidad fehaciente
            ante el Registro Nacional de las Personas (RENAPER).
          </li>
          <li>
            <strong>Finalidad exclusiva:</strong> Garantizar que el operador de
            la cuenta sea el titular legítimo del medio de pago utilizado,
            validar la mayoría de edad (18 años) y capacidad de contratación, y
            velar por la entrega segura de los pedidos.
          </li>
          <li>
            <strong>Minimización de datos biométricos:</strong> Sercio no
            almacena de forma definitiva datos biométricos ni números de trámite
            en bases de datos abiertas; el procesamiento se realiza mediante
            canales cifrados seguros (TLS/HTTPS) en memoria volátil para obtener
            únicamente el resultado de validación (aprobado/rechazado).
          </li>
        </ol>
      </>
    ),
  },
  {
    title: "4. Pagos, Datos de Tarjetas y Seguridad Financiera (Tokenización)",
    content: (
      <>
        <ul>
          <li>
            <strong>No almacenamiento de datos sensibles:</strong> Sercio no
            almacena ni tiene acceso directo a números completos de tarjetas de
            crédito o débito, códigos de seguridad (CVV/CVC) ni fechas de
            vencimiento.
          </li>
          <li>
            <strong>Procesamiento delegado y tokenización:</strong> Todos los
            pagos se canalizan mediante procesadores y pasarelas de pago
            autorizadas y certificadas bajo estándares internacionales PCI-DSS
            (como Mercado Pago u otros proveedores homologados). Dichas entidades
            procesan la información de manera tokenizada, garantizando que los
            datos sensibles permanezcan aislados de la infraestructura de
            Sercio.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "5. Tratamiento, Cifrado y Auditoría de Mensajes Internos (Chat)",
    content: (
      <>
        <ul>
          <li>
            <strong>Almacenamiento y cifrado del chat:</strong> Los mensajes
            transmitidos a través del sistema de mensajería interna entre
            usuarios, comercios y prestadores se almacenan en los servidores de la
            plataforma protegidos mediante cifrado en tránsito (TLS/HTTPS) y
            cifrado en reposo (Encryption at rest mediante estándar robusto
            AES-256 a nivel de base de datos e infraestructura).
          </li>
          <li>
            <strong>Acceso y auditoría administrativa restringida:</strong>{" "}
            Dichas comunicaciones son legibles de manera directa y exclusiva para
            el usuario administrador autorizado de Sercio.
          </li>
          <li>
            <strong>Finalidad exclusiva de control:</strong> El acceso a los
            registros de chat procederá únicamente bajo causas justificadas:
            resolución de disputas de compra y venta, investigación de
            operaciones sospechosas, detección y prevención de fraudes o ante
            requerimientos formales de autoridades administrativas o judiciales
            competentes.
          </li>
        </ul>
      </>
    ),
  },
  {
    title:
      "6. Confidencialidad Absoluta de Métricas Comerciales, Ventas y Liquidaciones",
    content: (
      <>
        <p>
          Sercio mantiene el más riguroso secreto comercial y reserva sobre la
          actividad económica de sus comercios y profesionales:
        </p>
        <ul>
          <li>
            <strong>Reserva de liquidaciones:</strong> Facturación, montos
            brutos/netos, liquidaciones de saldos, cuentas bancarias asociadas
            (CBU/CVU), márgenes comerciales e historiales de cobro son
            estrictamente confidenciales.
          </li>
          <li>
            <strong>Aislamiento de métricas:</strong> Ningún otro usuario,
            comercio o tercero ajeno a la operación tiene acceso bajo ninguna
            circunstancia a las estadísticas, balances o liquidaciones de un
            negocio.
          </li>
          <li>
            <strong>Uso interno exclusivo:</strong> La información financiera se
            emplea únicamente para la acreditación de fondos, conciliación
            contable, emisión de comprobantes o ante requerimientos fundados de
            autoridades judiciales competentes.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "7. Datos Visibles Públicamente en la Plataforma",
    content: (
      <>
        <p>
          Con el objetivo de resguardar la privacidad de los usuarios, dentro de
          la plataforma únicamente serán visibles de forma pública:
        </p>
        <ul>
          <li>
            Nombre de pila o nombre de fantasía comercial y foto de perfil /
            logotipo.
          </li>
          <li>Zona geográfica o dirección comercial aproximada.</li>
          <li>Insignia de verificación fiscal/comercial (si corresponde).</li>
          <li>
            Catálogo de productos, servicios, publicaciones y valoraciones de la
            comunidad.
          </li>
        </ul>
        <div className="privacy-callout">
          <strong>Aviso de privacidad transaccional:</strong> El DNI, el
          domicilio particular exacto del comprador, sus datos de contacto
          privados y los datos bancarios no son públicos; únicamente se comparten
          con la contraparte involucrada al concretar un pedido y en la medida
          estrictamente indispensable para coordinar la entrega o facturación.
        </div>
      </>
    ),
  },
  {
    title: "8. Integración con Servicios de Terceros y Permisos del Dispositivo",
    content: (
      <>
        <ul>
          <li>
            <strong>Google Calendar (OAuth 2.0):</strong> Cuando el usuario
            decida sincronizar su agenda, Sercio solicitará permisos
            exclusivamente para gestionar reservas y turnos vinculados al
            servicio (
            <code className="privacy-code">auth/calendar.events</code> y{" "}
            <code className="privacy-code">auth/calendar.readonly</code>). No se
            leen eventos personales ni se comparten datos con terceros para
            publicidad, en estricto cumplimiento con la Google API Services User
            Data Policy y sus directrices de Limited Use.
          </li>
          <li>
            <strong>Verificación ARCA:</strong> La consulta ante la Agencia de
            Recaudación y Control Aduanero se circunscribe a constatar la
            regularidad impositiva y emitir comprobantes fiscales válidos.
          </li>
          <li>
            <strong>Proveedores de Infraestructura:</strong> La plataforma utiliza
            servidores y servicios de infraestructura tecnológica en la nube
            (como AWS y Firebase) que operan con altos estándares de cifrado y
            confidencialidad.
          </li>
          <li>
            <strong>Permisos del Dispositivo:</strong> La aplicación solicita
            acceso a Ubicación (para mostrar comercios y entregas cercanas),
            Cámara/Galería (para fotos de perfil, catálogos, comprobantes y
            videos) y Notificaciones (para alertas transaccionales y de
            mensajería).
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "9. Publicidad y Cesión de Información",
    content: (
      <p>
        Sercio no comercializa, no vende, no cede ni alquila bases de datos
        personales a agencias de marketing ni a redes publicitarias
        programáticas. La aplicación y el sitio web se encuentran libres de
        anuncios intrusivos y rastreadores de publicidad de terceros.
      </p>
    ),
  },
  {
    title: "10. Conservación, Derechos ARCO y Eliminación de Cuentas",
    content: (
      <>
        <p>
          De conformidad con los Artículos 14, 15 y 16 de la Ley N° 25.326, los
          titulares de datos personales pueden ejercer en cualquier momento sus
          derechos de Acceso, Rectificación, Actualización y Supresión:
        </p>

        <h3 className="privacy-subtitle">
          Usuarios Compradores (Clientes)
        </h3>
        <p>
          Pueden solicitar en cualquier momento la eliminación definitiva de su
          cuenta y el borrado de sus datos personales directamente desde la
          sección de configuración de la plataforma o mediante solicitud por
          correo electrónico. Al procesarse la baja, su perfil, credenciales y
          datos asociados se destruyen de forma irrevocable.
        </p>

        <h3 className="privacy-subtitle">
          Profesionales y Comercios
        </h3>
        <p>
          Ante la solicitud de cese del servicio, opera la desactivación de la
          cuenta. En este supuesto:
        </p>
        <ul>
          <li>
            <strong>Datos preservados:</strong> Se conservan los datos
            identificatorios principales, registros de actividad y métricas
            históricas indispensables para salvaguardar y preservar la
            reputación, trayectoria, valoraciones y calificaciones otorgadas por
            la comunidad, así como para prevenir fraudes o reaperturas bajo
            identidades falseadas.
          </li>
          <li>
            <strong>Datos eliminados:</strong> Se suprimen de forma definitiva
            del catálogo público todos sus productos, servicios listados,
            publicaciones, videos breves (“reels”) y demás contenido accesorio o
            no indispensable.
          </li>
        </ul>

        <h3 className="privacy-subtitle">
          Usuarios Repartidores / Conductores (Riders)
        </h3>
        <p>
          Ante la solicitud de baja, la cuenta pasa al estado de “desactivación”.
          Sus datos registrales, habilitaciones y antecedentes operativos se
          conservan debidamente resguardados para fines de trazabilidad,
          seguridad en entregas anteriores, prevención de fraudes y cumplimiento
          de auditorías operativas.
        </p>

        <div className="privacy-callout">
          <strong>Plazos legales de guarda general:</strong> En todos los casos
          (eliminación o desactivación), Sercio conservará archivados y
          bloqueados aquellos comprobantes de pago, facturación electrónica y
          registros transaccionales que resulten legalmente exigibles durante los
          plazos de prescripción tributaria, comercial y civil previstos por la
          legislación vigente de la República Argentina.
        </div>
      </>
    ),
  },
  {
    title: "11. Canales de Contacto y Autoridad de Control",
    content: (
      <>
        <p>
          Para ejercer sus derechos ARCO, realizar consultas o presentar
          reclamos sobre el tratamiento de datos, los usuarios pueden
          comunicarse mediante los siguientes canales:
        </p>
        <ul>
          <li>
            <strong>Sitio Web:</strong>{" "}
            <a
              href="https://sercio.com.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="privacy-link"
            >
              https://sercio.com.ar
            </a>
          </li>
          <li>
            <strong>Correo Electrónico de Soporte y Privacidad:</strong>{" "}
            <a href="mailto:soporte@sercio.com.ar" className="privacy-link">
              soporte@sercio.com.ar
            </a>{" "}
            /{" "}
            <a href="mailto:contacto@sercio.com.ar" className="privacy-link">
              contacto@sercio.com.ar
            </a>
          </li>
        </ul>

        <div className="privacy-legal-notice" role="note">
          <h4 className="privacy-legal-notice__title">
            INFORMACIÓN LEGAL OBLIGATORIA (AAIP)
          </h4>
          <p className="privacy-legal-notice__text">
            Se hace saber que la{" "}
            <strong>
              AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA (AAIP)
            </strong>
            , en su carácter de Órgano de Control de la Ley N° 25.326, tiene la
            atribución de atender las denuncias y reclamos que interpongan quienes
            resulten afectados en sus derechos por incumplimiento de las normas
            vigentes en materia de protección de datos personales.
          </p>
        </div>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="privacy-page">
        <header className="privacy-header">
          <span className="privacy-header__badge">
            Marco Normativo Ley N° 25.326
          </span>
          <h1 className="privacy-header__title">
            Política de Privacidad y Tratamiento de Datos Personales
          </h1>
          <p className="privacy-header__subtitle">
            Sercio · Última actualización: Octubre de 2026
          </p>
        </header>

        <div className="privacy-content">
          {PRIVACY_SECTIONS.map((section, index) => (
            <section key={index} className="privacy-section">
              <h2 className="privacy-section__title">{section.title}</h2>
              <div className="privacy-section__text">{section.content}</div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
