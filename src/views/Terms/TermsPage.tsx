"use client";
import "./TermsPage.css";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

export default function TermsPage() {
  const sections = [
    {
      title: "1. Introducción y Naturaleza del Servicio",
      text: "Sercio es una plataforma digital que facilita la búsqueda y conexión entre usuarios y profesionales, comercios locales o prestadores de servicios independientes. Sercio actúa únicamente como intermediario de información.\n\nSercio opera exclusivamente como una plataforma tecnológica intermediaria cuyo propósito es conectar a usuarios (clientes) con profesionales, oficios y comercios independientes.\n\nEn cumplimiento con la legislación vigente en la República Argentina (incluyendo el Código Civil y Comercial de la Nación y la Ley N° 24.240 de Defensa del Consumidor), dejamos expresa constancia de que Sercio NO presta servicios de manera directa, ni actúa como empleador, socio o representante de los profesionales registrados.\n\nPor consiguiente, Sercio no interviene en las transacciones económicas entre las partes, no gestiona los cobros por los trabajos realizados, ni asume responsabilidad civil, penal o comercial por trabajos no terminados, mala praxis, defectos en la ejecución o eventuales estafas que pudieran surgir en la relación directa entre el usuario y el profesional. Toda contratación es bajo riesgo y acuerdo exclusivo de las partes involucradas."
    },
    {
      title: "2. Privacidad y Tratamiento de Datos Personales",
      text: "Sercio se compromete a proteger la privacidad de sus usuarios de conformidad con la Ley N° 25.326 de Protección de los Datos Personales de la República Argentina y normativas complementarias de la Dirección Nacional de Protección de Datos Personales (DNPDP).\n\n• Visibilidad de Datos: De forma pública dentro de la plataforma, únicamente se mostrarán el nombre, la dirección aproximada y la foto de perfil de los usuarios. El resto de los datos sensibles proporcionados permanecerán encriptados y protegidos.\n• Geolocalización: La aplicación obtendrá y procesará datos de ubicación en tiempo real o aproximada con el fin de mostrar sugerencias de profesionales cercanos, ofertas personalizadas y optimizar la experiencia de búsqueda. Al utilizar la aplicación, el usuario consiente expresamente este tratamiento para los fines mencionados."
    },
    {
      title: "3. Suscripciones y Pagos",
      text: "El uso avanzado de la plataforma para profesionales requiere el abono de una suscripción mensual. Las tarifas están sujetas a la estructura de costos y al contexto económico.\n\nSercio se reserva el derecho de modificar los valores de las suscripciones. Ante cualquier modificación o ajuste de precios, los usuarios serán notificados formalmente por correo electrónico con anticipación, garantizando el derecho a la información conforme al Art. 4 de la Ley 24.240, permitiendo al usuario decidir sobre la continuidad del servicio."
    },
    {
      title: "4. Programa de Referidos",
      text: "El programa de referidos de Sercio es un beneficio diseñado para expandir nuestra comunidad de profesionales. Aplican las siguientes condiciones:\n\n• El bono se abona por única vez por cada usuario referido que sea un profesional nuevo en la plataforma.\n• Es válido exclusivamente para referidos que contraten los nuevos planes \"Standard\" o \"Premium\".\n• El pago del beneficio de referido se acreditará únicamente cuando Sercio confirme y procese efectivamente el pago del primer mes de suscripción por parte del profesional referido."
    },
    {
      title: "5. Normas de Convivencia y Derecho de Admisión",
      text: "Sercio promueve un entorno de respeto mutuo, seguridad y confianza. La plataforma se reserva el derecho de admisión y permanencia.\n\nEn consecuencia, Sercio podrá suspender, dar de baja o bloquear de manera temporal o definitiva a cualquier usuario (cliente o profesional) que incurra en mal comportamiento, uso de lenguaje ofensivo, comentarios indebidos, intentos de fraude, incumplimiento sistemático de acuerdos, o cualquier conducta que vulnere las buenas costumbres o afecte negativamente la reputación y seguridad de la comunidad."
    },
    {
      title: "6. Jurisdicción y Ley Aplicable",
      text: "Los presentes Términos y Condiciones se rigen por las leyes de la República Argentina. Cualquier conflicto derivado de su interpretación o aplicación será sometido a la jurisdicción de los Tribunales Ordinarios, renunciando a cualquier otro fuero que pudiera corresponder."
    },
    {
      title: "7. Verificación de Perfiles y ARCA",
      text: "Los perfiles se verifican a través de ARCA constatando su inscripción a Ingresos Brutos, Ganancias, etc. Los usuarios que estén dados de baja no podrán ser verificados.\n\nAunque indicamos la verificación comercial de ciertas cuentas, esta se basa en la información provista por los organismos correspondientes y la proporcionada de buena fe por el comercio. Recomendamos a los usuarios realizar las validaciones necesarias antes de realizar transacciones."
    },
    {
      title: "8. Integración y Uso de Google Calendar",
      text: "La plataforma ofrece integración opcional con Google Calendar exclusivamente para facilitar la gestión de la agenda profesional del usuario. A través de este servicio, Sercio únicamente crea, consulta y gestiona los eventos relacionados con las citas agendadas dentro de la aplicación.\n\nNo accedemos, modificamos ni utilizamos la información personal de otros eventos del usuario que no estén vinculados a su actividad en Sercio. La sincronización se realiza con el único propósito de optimizar la organización del tiempo del profesional y asegurar una correcta gestión de las citas y presupuestos."
    },
    {
      title: "9. Uso de la Información y Propiedad Intelectual",
      text: "Queda prohibido el uso no autorizado de los textos, imágenes, logos y datos personales contenidos en Sercio. Todo el material cargado por los usuarios debe respetar las leyes de derechos de autor vigentes."
    }
  ];

  return (
    <>
      <Navbar />
      <main className="terms-page">
        <div className="terms-header">
          <h1 className="terms-header__title">Términos y Condiciones</h1>
          <p className="terms-header__subtitle">Políticas de Privacidad y Uso del Servicio Sercio</p>
        </div>
        
        <div className="terms-content">
          {sections.map((section, index) => (
            <div key={index} className="terms-section">
              <h2 className="terms-section__title">{section.title}</h2>
              <div className="terms-section__text">
                {section.text}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
