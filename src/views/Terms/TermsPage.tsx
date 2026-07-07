"use client";
import "./TermsPage.css";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

export default function TermsPage() {
  const sections = [
    {
      title: "1. Introducción y Naturaleza del Servicio",
      content: (
        <>
          <p>
            Sercio es una plataforma digital que facilita la búsqueda y conexión
            entre usuarios y profesionales, comercios locales o prestadores de
            servicios independientes. Sercio actúa únicamente como intermediario
            de información.
          </p>
          <p>
            Sercio opera exclusivamente como una plataforma tecnológica
            intermediaria cuyo propósito es conectar a usuarios (clientes) con
            profesionales, oficios y comercios independientes.
          </p>
          <p>
            En cumplimiento con la legislación vigente en la República Argentina
            (incluyendo el Código Civil y Comercial de la Nación y la Ley N°
            24.240 de Defensa del Consumidor), dejamos expresa constancia de que
            Sercio NO presta servicios de manera directa, ni actúa como
            empleador, socio o representante de los profesionales registrados.
          </p>
          <p>
            Por consiguiente, Sercio no interviene en las transacciones
            económicas entre las partes, no gestiona los cobros por los trabajos
            realizados, ni asume responsabilidad civil, penal o comercial por
            trabajos no terminados, mala praxis, defectos en la ejecución o
            eventuales estafas que pudieran surgir en la relación directa entre
            el usuario y el profesional. Toda contratación es bajo riesgo y
            acuerdo exclusivo de las partes involucradas.
          </p>
        </>
      ),
    },
    {
      title: "2. Privacidad y Tratamiento de Datos Personales",
      content: (
        <>
          <p>
            Sercio se compromete a proteger la privacidad de sus usuarios de
            conformidad con la Ley N° 25.326 de Protección de los Datos
            Personales de la República Argentina y normativas complementarias de
            la Dirección Nacional de Protección de Datos Personales (DNPDP).
          </p>
          <ul>
            <li>
              <strong>Uso y Confidencialidad de los Datos:</strong> No
              compartimos, vendemos ni alquilamos tus datos personales a
              terceros para fines comerciales o publicitarios. Los datos
              recopilados se utilizan exclusivamente para el funcionamiento
              interno de la plataforma, la prestación del servicio y la mejora
              de la experiencia del usuario.
            </li>
            <li>
              <strong>Publicidad de Terceros:</strong> Sercio no muestra
              publicidad de terceros en ninguna parte de la plataforma. La
              navegación y uso de la aplicación están libres de anuncios de
              redes publicitarias externas, garantizando una experiencia limpia
              y resguardando tus datos de rastreadores publicitarios.
            </li>
            <li>
              <strong>Visibilidad de Datos:</strong> De forma pública dentro de
              la plataforma, únicamente se mostrarán el nombre, la dirección
              aproximada y la foto de perfil de los usuarios. El resto de los
              datos sensibles proporcionados permanecerán encriptados y
              protegidos.
            </li>
            <li>
              <strong>Geolocalización:</strong> La aplicación obtendrá y
              procesará datos de ubicación en tiempo real o aproximada con el
              fin de mostrar sugerencias de profesionales cercanos, ofertas
              personalizadas y optimizar la experiencia de búsqueda. Al utilizar
              la aplicación, el usuario consiente expresamente este tratamiento
              para los fines mencionados.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "3. Suscripciones y Pagos",
      content: (
        <>
          <p>
            El uso avanzado de la plataforma para profesionales requiere el
            abono de una suscripción mensual. Las tarifas están sujetas a la
            estructura de costos y al contexto económico.
          </p>
          <ul>
            <li>
              <strong>Plan Gratuito:</strong> El plan gratuito tiene una duración
              máxima de 4 (cuatro) meses desde su activación. Transcurrido este 
              período, la cuenta será cancelada a menos que el usuario opte por 
              pasar a un plan de pago (Básico o Premium).
            </li>
          </ul>
          <p>
            Sercio se reserva el derecho de modificar los valores de las
            suscripciones. Ante cualquier modificación o ajuste de precios, los
            usuarios serán notificados formalmente por correo electrónico con
            anticipación, garantizando el derecho a la información conforme al
            Art. 4 de la Ley 24.240, permitiendo al usuario decidir sobre la
            continuidad del servicio.
          </p>
        </>
      ),
    },
    {
      title: "4. Programa de Referidos",
      content: (
        <>
          <p>
            El programa de referidos de Sercio es un beneficio diseñado para
            expandir nuestra comunidad de profesionales. Aplican las siguientes
            condiciones:
          </p>
          <ul>
            <li>
              El bono se abona por única vez por cada usuario referido que sea
              un profesional nuevo en la plataforma.
            </li>
            <li>
              Es válido exclusivamente para referidos que contraten los nuevos
              planes "Standard" o "Premium".
            </li>
            <li>
              El pago del beneficio de referido se acreditará únicamente cuando
              Sercio confirme y procese efectivamente el pago del primer mes de
              suscripción por parte del profesional referido.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "5. Normas de Convivencia y Derecho de Admisión",
      content: (
        <>
          <p>
            Sercio promueve un entorno de respeto mutuo, seguridad y confianza.
            La plataforma se reserva el derecho de admisión y permanencia.
          </p>
          <p>
            En consecuencia, Sercio podrá suspender, dar de baja o bloquear de
            manera temporal o definitiva a cualquier usuario (cliente o
            profesional) que incurra en mal comportamiento, uso de lenguaje
            ofensivo, comentarios indebidos, intentos de fraude, incumplimiento
            sistemático de acuerdos, o cualquier conducta que vulnere las buenas
            costumbres o afecte negativamente la reputación y seguridad de la
            comunidad.
          </p>
        </>
      ),
    },
    {
      title: "6. Jurisdicción y Ley Aplicable",
      content: (
        <p>
          Los presentes Términos y Condiciones se rigen por las leyes de la
          República Argentina. Cualquier conflicto derivado de su interpretación
          o aplicación será sometido a la jurisdicción de los Tribunales
          Ordinarios, renunciando a cualquier otro fuero que pudiera
          corresponder.
        </p>
      ),
    },
    {
      title: "7. Verificación de Perfiles y ARCA",
      content: (
        <>
          <p>
            Los perfiles se verifican a través de ARCA constatando su
            inscripción a Ingresos Brutos, Ganancias, etc. Los usuarios que
            estén dados de baja no podrán ser verificados.
          </p>
          <p>
            Los datos obtenidos y guardados a partir de ARCA (como condición
            frente al IVA o CUIT) son para uso exclusivo de facturación a
            nuestros clientes, validación de identidad comercial y mantenimiento
            de la transparencia dentro de la plataforma. Esta información fiscal
            no es compartida con terceros ajenos al servicio ni utilizada para
            otros fines comerciales externos.
          </p>
          <p>
            Aunque indicamos la verificación comercial de ciertas cuentas, esta
            se basa en la información provista por los organismos
            correspondientes y la proporcionada de buena fe por el comercio.
            Recomendamos a los usuarios realizar las validaciones necesarias
            antes de realizar transacciones.
          </p>
        </>
      ),
    },
    {
      title: "8. Integración y Uso de Google Calendar",
      content: (
        <>
          <p>
            La plataforma ofrece integración opcional con Google Calendar
            exclusivamente para facilitar la gestión de la agenda profesional
            del usuario. A través de este servicio, Sercio únicamente crea,
            consulta y gestiona los eventos relacionados con las citas agendadas
            dentro de la aplicación.
          </p>
          <p>
            No accedemos, modificamos ni utilizamos la información personal de
            otros eventos del usuario que no estén vinculados a su actividad en
            Sercio. La sincronización se realiza con el único propósito de
            optimizar la organización del tiempo del profesional y asegurar una
            correcta gestión de las citas y presupuestos.
          </p>
          
          <h4 style={{ marginTop: "var(--space-4)", marginBottom: "var(--space-2)", fontWeight: "var(--weight-bold)" }}>
            8.1 Uso de Datos de las APIs de Google (Google API Disclosure)
          </h4>
          <p>
            Nuestra aplicación accede a servicios de Google utilizando el protocolo OAuth 2.0. A continuación, detallamos el propósito de cada permiso solicitado y nuestras políticas de seguridad:
          </p>
          <ul style={{ paddingLeft: "var(--space-4)", listStyleType: "disc", margin: "var(--space-2) 0" }}>
            <li style={{ marginBottom: "var(--space-2)" }}>
              <strong>1. Permisos Solicitados (Scopes):</strong>
              <ul style={{ paddingLeft: "var(--space-4)", listStyleType: "circle", marginTop: "var(--space-1)" }}>
                <li><code>openid</code>: Utilizado para autenticar tu identidad mediante el estándar OpenID Connect.</li>
                <li><code>auth/userinfo.email</code>: Accede a tu dirección de correo electrónico principal con fines de inicio de sesión y comunicación de la cuenta.</li>
                <li><code>auth/userinfo.profile</code>: Accede a la información básica de tu perfil público (nombre, foto de perfil) para personalizar tu interfaz de usuario.</li>
                <li><code>auth/calendar.readonly</code>: Permite leer los eventos de tu Google Calendar en tiempo real para visualizarlos dentro de nuestra plataforma.</li>
                <li><code>auth/calendar.events</code>: Permite crear, editar o eliminar eventos específicos en tus calendarios según las acciones que ejecutes en nuestra aplicación.</li>
              </ul>
            </li>
            <li style={{ marginBottom: "var(--space-2)" }}>
              <strong>2. Mecanismos de Protección y Seguridad de Datos:</strong><br />
              Implementamos estrictos controles de seguridad para proteger los datos obtenidos de los usuarios de Google. Toda la información en tránsito está cifrada de extremo a extremo utilizando protocolos seguros SSL/TLS (HTTPS). Los tokens de acceso de OAuth otorgados por el usuario se gestionan en entornos de memoria segura y no son accesibles por personal no autorizado ni por terceros.
            </li>
            <li style={{ marginBottom: "var(--space-2)" }}>
              <strong>3. Retención y Eliminación de Datos de Google:</strong><br />
              No almacenamos, guardamos ni persistimos de forma permanente ninguna información extraída de tu Google Calendar, correos o perfiles en nuestras bases de datos. Los datos se procesan estrictamente "en memoria" (in-memory processing) para cumplir con las funciones solicitadas en tiempo real. Los tokens de acceso y actualización (refresh tokens) se eliminan de forma inmediata y definitiva de nuestros sistemas en los siguientes casos:
              <ul style={{ paddingLeft: "var(--space-4)", listStyleType: "circle", marginTop: "var(--space-1)" }}>
                <li>Cuando el usuario decide revocar manualmente el acceso o desconectar su cuenta de Google desde el panel de configuración de nuestra web.</li>
                <li>Cuando el usuario solicita la eliminación completa de su cuenta en nuestra plataforma.</li>
              </ul>
            </li>
          </ul>
          <p>
            Nuestra plataforma cumple estrictamente con la Política de datos del usuario de los servicios de API de Google (Google API Services User Data Policy), incluidos los requisitos de Uso Limitado (Limited Use).
          </p>
        </>
      ),
    },
    {
      title: "9. Uso de la Información y Propiedad Intelectual",
      content: (
        <p>
          Queda prohibido el uso no autorizado de los textos, imágenes, logos y
          datos personales contenidos en Sercio. Todo el material cargado por
          los usuarios debe respetar las leyes de derechos de autor vigentes.
        </p>
      ),
    },
  ];

  return (
    <>
      <Navbar />
      <main className="terms-page">
        <div className="terms-header">
          <h1 className="terms-header__title">Términos y Condiciones</h1>
          <p className="terms-header__subtitle">
            Políticas de Privacidad y Uso del Servicio Sercio
          </p>
        </div>

        <div className="terms-content">
          {sections.map((section, index) => (
            <div key={index} className="terms-section">
              <h2 className="terms-section__title">{section.title}</h2>
              <div className="terms-section__text">{section.content}</div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
