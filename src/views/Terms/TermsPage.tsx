"use client";
import React from "react";
import "./TermsPage.css";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

export interface TermSectionItem {
  title: string;
  content: React.ReactNode;
}

export const TERMS_SECTIONS: TermSectionItem[] = [
  {
    title: "1. Introducción y Naturaleza del Servicio",
    content: (
      <>
        <p>
          Sercio es una plataforma tecnológica digital que facilita la
          intermediación, búsqueda, publicación y contacto entre usuarios
          finales (en adelante, «Compradores» o «Clientes») y profesionales
          independientes, prestadores de oficios y comercios locales (en
          adelante, «Vendedores» o «Comercios»).
        </p>
        <p>
          En cumplimiento con la legislación de la República Argentina (Código
          Civil y Comercial de la Nación, Ley N° 24.240 de Defensa del Consumidor
          y normativas complementarias), dejamos expresa constancia de que
          Sercio opera exclusivamente como un canal tecnológico de
          intermediación y puesta en contacto. Salvo indicación expresa en
          contrario:
        </p>
        <ul>
          <li>
            <strong>Sercio no es propietaria ni posee la custodia material</strong>{" "}
            de los bienes o productos ofrecidos en venta a través de la
            plataforma.
          </li>
          <li>
            <strong>Sercio no presta directamente los servicios ofrecidos</strong>{" "}
            ni actúa como empleador, mandatario, socio o representante legal
            directo de los comercios, profesionales ni fleteros registrados.
          </li>
          <li>
            <strong>Los contratos de compraventa de cosas muebles, transporte o locación de servicios</strong>{" "}
            se perfeccionan entre las partes intervinientes, actuando Sercio como
            facilitador tecnológico y custodio de la experiencia transaccional.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "2. Términos y Condiciones Específicos del E-commerce y Marketplace",
    content: (
      <>
        <h3 className="terms-section__subtitle">
          2.1. Tipificación Obligatoria de Productos (Original, Genérico o Copia)
        </h3>
        <p>
          Toda publicación de productos dentro de Sercio debe clasificar y
          detallar de forma obligatoria e inexcusable la condición del artículo:
        </p>
        <ol>
          <li>
            <strong>Original:</strong> Producto auténtico fabricado por o bajo
            licencia de la marca titular.
          </li>
          <li>
            <strong>Genérico:</strong> Producto compatible o de marca blanca,
            sin logos ni imitación fraudulenta de signos protegidos.
          </li>
          <li>
            <strong>Copia / Réplica:</strong> Reproducción del producto,
            debiendo aclararse expresamente al usuario para no inducir a
            confusión o error.
          </li>
        </ol>

        <h3 className="terms-section__subtitle">
          2.2. Prohibición de Falsificaciones, Adulteraciones y Régimen de Denuncias
        </h3>
        <ul>
          <li>
            Queda terminantemente prohibido publicar o vender como «Original»
            cualquier artículo falso, réplica o adulterado.
          </li>
          <li>
            <strong>Denuncias:</strong> Los usuarios y titulares marcarios
            podrán denunciar cualquier publicación sospechosa o engañosa.
          </li>
          <li>
            <strong>Sanciones aplicables:</strong> Ante denuncias fundadas o
            irregularidades comprobadas, Sercio aplicará:
            <ol>
              <li>Baja inmediata de la publicación observada.</li>
              <li>Pausa o suspensión preventiva de la cuenta comercial.</li>
              <li>
                Bloqueo y expulsión definitiva del comercio, con retención de
                saldos preventivos ante reclamos pendientes, sin perjuicio de
                las denuncias legales correspondientes.
              </li>
            </ol>
          </li>
        </ul>
        <div className="terms-section__callout">
          <strong>Aviso de exención:</strong> Sercio no es responsable por la
          incorrecta clasificación o descripción del producto o sus
          características o especificaciones, siendo este responsabilidad
          absoluta de quien efectúa la publicación.
        </div>

        <h3 className="terms-section__subtitle">
          2.3. Política de Productos Prohibidos
        </h3>
        <p>
          Queda estrictamente prohibida la publicación, promoción, ofrecimiento
          o comercialización a través de Sercio de los siguientes bienes y
          contenidos:
        </p>
        <ol>
          <li>
            <strong>Armas, municiones y explosivos:</strong> Armas de fuego de
            cualquier calibre, municiones, pólvora, réplicas no autorizadas,
            armas de aire comprimido/CO2 no reguladas, ballestas, dagas,
            silenciadores, elementos pirotécnicos o material explosivo e
            inflamable no autorizado.
          </li>
          <li>
            <strong>Contenido sexual y para adultos:</strong> Material
            pornográfico, contenido sexual explícito, servicios sexuales o de
            acompañamiento, lencería usada, y cualquier producto o soporte
            audiovisual que vulnere la intimidad o contravenga las leyes de
            protección integral de las infancias y la adolescencia.
          </li>
          <li>
            <strong>Sustancias estupefacientes y medicamentos:</strong> Drogas
            ilegales, precursores químicos, medicamentos bajo receta médica o de
            venta libre que no cuenten con las licencias correspondientes del
            organismo regulador (ANMAT), instrumental para consumo de sustancias
            ilícitas o productos que prometan curas médicas no homologadas.
          </li>
          <li>
            <strong>Bienes ilícitos o de dudosa procedencia:</strong> Bienes
            robados, hurtados, adulterados o embargados; divisas falsificadas;
            réplicas, falsificaciones o productos que infrinjan derechos de
            propiedad intelectual, patentes, marcas registradas o derechos de
            autor.
          </li>
          <li>
            <strong>Flora y fauna silvestre:</strong> Animales vivos protegidos
            o no autorizados para su comercialización, restos de animales,
            pieles de especies protegidas, plantas exóticas invasoras o en
            peligro de extinción.
          </li>
          <li>
            <strong>Bases de datos y credenciales:</strong> Cuentas de servicios
            digitales, contraseñas, documentos de identidad, software de
            espionaje o hacking, y bases de datos personales.
          </li>
        </ol>
        <p>
          La infracción a estas prohibiciones dará lugar a la remoción inmediata
          de la publicación y a la aplicación de las sanciones de suspensión o
          baja definitiva estipuladas en estos Términos, retención de fondos,
          sin derecho a indemnización alguna y sin perjuicio de las denuncias
          penales o civiles que pudieran corresponder.
        </p>
      </>
    ),
  },
  {
    title: "3. Sistema de Reputación, Calidad y Puntuación Comercial",
    content: (
      <>
        <p>
          Para premiar el buen servicio y desalentar malas prácticas comerciales:
        </p>
        <ul>
          <li>
            <strong>Puntaje por Venta Correcta:</strong> Las órdenes entregadas
            en tiempo y forma sin quejas incrementan la reputación del comercio
            y mejoran su posición en las búsquedas.
          </li>
          <li>
            <strong>Penalizaciones:</strong> Reducirán severamente el puntaje
            comercial:
            <ul>
              <li>
                <strong>Productos no enviados:</strong> Órdenes pagadas y no
                despachadas.
              </li>
              <li>
                <strong>Cancelaciones imputables:</strong> Cancelaciones por
                falta de stock o desatención del comercio.
              </li>
              <li>
                <strong>Reclamos no resueltos:</strong> Disputas por productos
                fallados, faltantes o erróneos no subsanadas en tiempo por el
                vendedor.
              </li>
            </ul>
          </li>
          <li>
            Comercios con reputación crítica o reiteración de faltas podrán ser
            pausados, degradados o dados de baja de forma definitiva, con
            retención de fondos en concepto de indemnización a la plataforma.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "4. Privacidad y Tratamiento de Datos Personales",
    content: (
      <>
        <p>
          Sercio se compromete a proteger la privacidad de sus usuarios de
          conformidad con la Ley N° 25.326 de Protección de los Datos Personales
          de la República Argentina y normativas complementarias de la
          Dirección Nacional de Protección de Datos Personales (DNPDP).
        </p>
        <ul>
          <li>
            <strong>Uso y Confidencialidad de los Datos:</strong> No
            compartimos, vendemos ni alquilamos tus datos personales a terceros
            para fines comerciales o publicitarios. Los datos recopilados se
            utilizan exclusivamente para el funcionamiento interno de la
            plataforma, la prestación del servicio y la mejora de la
            experiencia del usuario.
          </li>
          <li>
            <strong>Publicidad de Terceros:</strong> Sercio no muestra
            publicidad de terceros en ninguna parte de la plataforma. La
            navegación y uso de la aplicación están libres de anuncios de redes
            publicitarias externas, garantizando una experiencia limpia y
            resguardando tus datos de rastreadores publicitarios.
          </li>
          <li>
            <strong>Visibilidad de Datos:</strong> De forma pública dentro de la
            plataforma, únicamente se mostrarán el nombre, la dirección
            aproximada y la foto de perfil de los usuarios. El resto de los
            datos sensibles proporcionados permanecerán encriptados y
            protegidos.
          </li>
          <li>
            <strong>Geolocalización:</strong> La aplicación obtendrá y procesará
            datos de ubicación en tiempo real o aproximada con el fin de mostrar
            sugerencias de profesionales cercanos, ofertas personalizadas y
            optimizar la experiencia de búsqueda. Al utilizar la aplicación, el
            usuario consiente expresamente este tratamiento para los fines
            mencionados.
          </li>
          <li>
            <strong>Eliminación de Cuenta y Datos:</strong> Todo usuario tiene a
            su disposición la opción de borrar su cuenta de forma definitiva
            desde la configuración de la aplicación. Esta acción eliminará
            permanentemente todos sus datos personales e historial de nuestros
            sistemas. Cabe destacar que, si el usuario posee una suscripción
            activa, deberá cancelarla previamente antes de proceder con la
            eliminación de la cuenta.
          </li>
        </ul>
        <p>
          Para conocer el detalle completo sobre tratamiento de datos,
          validación de identidad ante RENAPER, tokenización bancaria, cifrado
          AES-256 de chats y ejercicio de derechos ARCO, consultá nuestra{" "}
          <a href="/privacidad" className="terms-link">
            Política de Privacidad y Tratamiento de Datos Personales
          </a>
          .
        </p>
      </>
    ),
  },
  {
    title: "5. Responsabilidad de Envíos y Logística a Cargo del Comercio",
    content: (
      <>
        <p>
          Cuando el servicio de logística y despacho sea acordado, coordinado o
          realizado directamente por el Comercio vendedor (a través de flota
          propia, cadetería o empresas de encomiendas contratadas por este):
        </p>
        <ul>
          <li>
            El Comercio o profesional asume la responsabilidad exclusiva e
            integral sobre el estado, embalaje, preservación, seguridad,
            integridad física y puntualidad de la entrega del producto o
            prestación del servicio desde su despacho hasta la recepción
            efectiva por parte del Comprador.
          </li>
          <li>
            Sercio es ajena a la cadena de transporte contratada de forma
            directa por el vendedor y no asume responsabilidad civil ni
            económica por extravíos, roturas, hurtos, demoras o pérdidas
            atribuibles a los repartidores, fleteros o correos privados
            designados por el Comercio.
          </li>
          <li>
            El Comercio está obligado a aportar información fidedigna de
            seguimiento, plazos estimados de entrega y comprobante de recepción
            firmado o validado digitalmente por el receptor.
          </li>
        </ul>
        <p>
          Cuando el envío lo realice el vendedor con medios propios integrados
          en Sercio, el primero asume la responsabilidad exclusiva e integral
          por el estado y entrega puntual del paquete.
        </p>

        <h3 className="terms-section__subtitle">
          5.2. Responsabilidad de Riders y Fleteros (Custodia y Cancelaciones)
        </h3>
        <ul>
          <li>
            <strong>Obligación de restitución de mercadería cancelada:</strong>{" "}
            Si una compra es cancelada con el pedido ya en poder del repartidor
            o fletero (sea por cancelación del comprador, rechazo o
            imposibilidad de entrega), el Rider tiene la obligación imperativa
            de restituir y devolver la totalidad de los productos en perfecto
            estado al Comercio de origen o al punto fijado por Sercio. Los
            costos de la devolución son a cargo del comercio.
          </li>
          <li>
            <strong>Débito y descuento por no devolución:</strong> En caso de
            que el Rider o Fletero no devuelva los productos cancelados, retenga
            la mercadería o se produzca un faltante injustificado, se le
            descontará automáticamente de sus saldos disponibles o futuras
            liquidaciones el 100% del valor total de la compra. Sercio y el
            comercio afectado podrán accionar penalmente por retención indebida
            e inhabilitar al conductor de por vida.
          </li>
          <li>
            <strong>Legajo vehicular y habilitación:</strong> Los conductores y
            fleteros deben cargar y mantener vigentes sus licencias y seguros
            vehiculares en la plataforma.
          </li>
        </ul>
      </>
    ),
  },
  {
    title:
      "6. Modelo Transaccional, Comisiones, Custodia del Dinero y Liquidaciones a Comercios",
    content: (
      <>
        <ul>
          <li>
            <strong>Comisión por Venta del Servicio:</strong> Sercio percibe un
            porcentaje o comisión sobre el valor de cada transacción completada
            a través del Marketplace. El cuadro de tasas y comisiones aplicables
            a cada categoría se encuentra publicado de forma visible y
            actualizada en la página de información de ventas de Sercio. La
            comisión vigente al momento de concretarse la venta será la
            deducible de la operación.
          </li>
          <li>
            <strong>Guarda y Custodia Transitoria del Dinero:</strong> Al
            abonar el Comprador a través de las pasarelas de pago de la
            plataforma, Sercio actúa como custodio transitorio de los fondos para
            garantizar la seguridad de la operación. El dinero de la venta
            permanece en resguardo hasta que la orden sea completada o
            transcurran los plazos razonables de confirmación y reclamo.
          </li>
          <li>
            <strong>Liquidación a los Comercios:</strong> Los importes netos de
            las ventas (monto total cobrado menos la comisión de Sercio y
            eventuales retenciones o costos financieros) se liquidarán y
            transferirán al comercio en los plazos en días previamente acordados
            y publicados por la plataforma en el panel del vendedor.
          </li>
          <li>
            <strong>Retención Preventiva:</strong> En caso de reclamos abiertos,
            contracargos bancarios o indicios fundados de fraude, Sercio se
            reserva el derecho de pausar la liberación de los fondos
            involucrados hasta tanto se dilucide la disputa comercial.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "7. Facturación y Cumplimiento Tributario",
    content: (
      <p>
        El Comercio vendedor está obligado a cumplir estrictamente con las
        normativas fiscales dictadas por ARCA (ex AFIP) y los organismos
        provinciales pertinentes. El vendedor deberá emitir el comprobante
        fiscal correspondiente (Factura A, B, C o ticket fiscal homologado) por
        cada venta concretada dentro de la plataforma y ponerla a disposición
        del Comprador.
      </p>
    ),
  },
  {
    title: "8. Derecho de Revocación («Botón de Arrepentimiento») y Garantías",
    content: (
      <>
        <p>
          Conforme al Artículo 34 de la Ley N° 24.240 y concordantes del Código
          Civil y Comercial de la Nación, los Compradores gozan del derecho de
          revocar la aceptación de compras a distancia dentro del plazo de diez
          (10) días corridos contados a partir de la entrega del producto o de
          la celebración del contrato (lo último que ocurra). Asimismo, rigen los
          plazos legales mínimos de garantía legal (seis meses para cosas muebles
          no consumibles nuevas y tres meses para usadas) a cargo exclusivo del
          vendedor o fabricante.
        </p>
        <p>
          Más información en anexo de{" "}
          <a href="/devoluciones" className="terms-link">
            Políticas de Devolución, Arrepentimiento y Cancelación
          </a>
          .
        </p>
      </>
    ),
  },
  {
    title: "9. Métricas de Calidad, Cancelaciones y Régimen de Sanciones y Bajas",
    content: (
      <>
        <p>
          Para preservar la seguridad, reputación y experiencia de los usuarios
          en la plataforma, Sercio implementa un régimen estricto de control de
          calidad:
        </p>

        <h3 className="terms-section__subtitle">
          9.1. Suspensión y Baja por Contenido Inapropiado
        </h3>
        <p>
          Sercio se reserva la facultad de dar de baja publicaciones, suspender
          temporalmente o inhabilitar de manera permanente y sin previo aviso la
          cuenta de cualquier usuario (Comprador o Vendedor) que publique
          contenido ilícito, obsceno, discriminatorio, difamatorio, fraudulento,
          engañoso o que atente contra las políticas de productos prohibidos y
          de la empresa.
        </p>

        <h3 className="terms-section__subtitle">
          9.2. Umbrales de Rechazo de Pedidos, Cancelaciones y Reclamos
        </h3>
        <p>
          La permanencia de los Comercios en la plataforma está sujeta a
          estándares operativos mínimos. Sercio audita periódicamente el
          desempeño de cada comercio. La plataforma podrá suspender o dar de
          baja definitivamente a aquellos comercios que incurran en:
        </p>
        <ul>
          <li>
            <strong>Tasa excesiva de cancelación o rechazo de pedidos:</strong>{" "}
            Cuando el comercio rechace o cancele pedidos confirmados de forma
            reiterada o justifique cancelaciones por falta de stock no
            actualizado.
          </li>
          <li>
            <strong>Incumplimiento sistemático de plazos de entrega:</strong>{" "}
            Demoras injustificadas en la preparación o entrega de los pedidos.
          </li>
          <li>
            <strong>Tasa crítica de reclamos o disputas abiertas:</strong>{" "}
            Cuando el porcentaje de quejas fundadas por productos defectuosos,
            faltantes, envíos erróneos o deficiente atención postventa supere
            los parámetros razonables de calidad fijados por la plataforma.
          </li>
        </ul>
        <p>
          Las cuentas dadas de baja por incumplimiento de métricas o fraude
          perderán el acceso a la plataforma de forma irrevocable.
        </p>
      </>
    ),
  },
  {
    title: "10. Suscripciones y Pagos de Servicios Profesionales",
    content: (
      <>
        <p>
          El acceso a funcionalidades avanzadas para profesionales y comercios
          requiere la suscripción a planes mensuales. Las tarifas están sujetas a
          la estructura de costos y al contexto socioeconómico.
        </p>
        <ul>
          <li>
            <strong>Plan Gratuito:</strong> El plan de prueba o gratuito tiene
            una vigencia máxima de cuatro (4) meses desde su habilitación.
            Cumplido este plazo, la cuenta profesional requerirá la contratación
            de un plan arancelado (Básico, Standard o Premium) para mantener sus
            beneficios.
          </li>
          <li>
            <strong>Cobro recurrente vía pasarelas autorizadas (Mercado Pago):</strong>{" "}
            El importe del abono se debitará automáticamente mediante el método
            de pago vinculado al confirmar la suscripción.
            <ul>
              <li>
                La suscripción se renueva de forma automática cada mes
                calendario, a menos que sea cancelada con anterioridad a la fecha
                de corte.
              </li>
              <li>
                El cobro de renovación se procesa dentro de las 24 horas previas
                al inicio del período subsiguiente.
              </li>
              <li>
                El usuario puede dar de baja la suscripción en cualquier momento
                desde el panel interno de Sercio o desde su cuenta de Mercado
                Pago.
              </li>
            </ul>
          </li>
          <li>
            <strong>Actualización de precios:</strong> Sercio notificará por
            correo electrónico y de manera fehaciente cualquier modificación en
            los planes con antelación suficiente, garantizando el derecho a la
            información conforme al Art. 4 de la Ley N° 24.240.
          </li>
        </ul>

        <h3 className="terms-section__subtitle">
          10.1. Suscripciones a través de Apple App Store (iOS)
        </h3>
        <p>Para compras de planes realizadas en dispositivos iOS:</p>
        <ul>
          <li>
            El pago se cargará a la cuenta de Apple ID al confirmar la
            transacción.
          </li>
          <li>
            La suscripción se renueva automáticamente a menos que la renovación
            automática se desactive al menos 24 horas antes del vencimiento del
            ciclo en curso.
          </li>
          <li>
            Los cobros se realizarán dentro de las 24 horas previas a la
            finalización del período activo.
          </li>
          <li>
            Las suscripciones pueden ser administradas o canceladas por el
            usuario desde la configuración de su cuenta de Apple ID. La
            cancelación no genera reembolsos proporcionales de períodos ya
            devengados, manteniéndose los beneficios hasta el fin del ciclo
            contratado.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "11. Programa de Referidos",
    content: (
      <>
        <p>
          El programa de incentivos por referidos de Sercio se rige por las
          siguientes condiciones operativas:
        </p>
        <ul>
          <li>
            El beneficio se abona por única vez por cada nuevo profesional o
            comercio referido que se incorpore a la plataforma.
          </li>
          <li>
            La validez del referido se determinará por la unicidad de su correo
            electrónico de registro. Ante duplicidad de registros, el beneficio
            se atribuirá a quien haya cargado la recomendación en primer lugar
            cronológico.
          </li>
          <li>
            Aplica exclusivamente para referidos que contraten e ingresen a
            planes arancelados («Standard» o «Premium»).
          </li>
          <li>
            La liquidación del bono se hará efectiva únicamente tras la
            confirmación, procesamiento y acreditación del pago del primer mes
            de suscripción arancelada del usuario referido.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "12. Normas de Convivencia y Derecho de Admisión",
    content: (
      <>
        <p>
          Sercio promueve un ecosistema de respeto mutuo, honestidad y
          seguridad transaccional. La plataforma se reserva el derecho formal de
          admisión, permanencia y exclusión de usuarios. Sercio podrá suspender,
          limitar, bloquear o expulsar a todo usuario que:
        </p>
        <ul>
          <li>
            Emplee lenguaje soez, violento, discriminatorio o amenazante en
            reseñas, descripciones o chats internos.
          </li>
          <li>
            Intente burlar mecanismos de pago o coordinar maniobras desleales
            orientadas al fraude económico.
          </li>
          <li>
            Genere disputas infundadas o afecte intencionalmente la reputación
            de otros miembros o de la plataforma.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "13. Verificación de Perfiles y ARCA",
    content: (
      <>
        <ul>
          <li>
            La validación comercial de perfiles se lleva a cabo mediante el
            cruce de datos fiscales ante la Agencia de Recaudación y Control
            Aduanero (ARCA), verificando estado de CUIT, inscripción en Impuesto
            a las Ganancias, IVA, Monotributo y/o regímenes provinciales de
            Ingresos Brutos.
          </li>
          <li>
            Cuentas que figuren dadas de baja de oficio, en estado de inactividad
            fiscal o con irregularidades ante los entes recaudadores no
            calificarán para la insignia de perfil verificado.
          </li>
          <li>
            La información obtenida de ARCA se conserva exclusivamente con fines
            de facturación, validación de la veracidad comercial y auditoría
            interna de seguridad. No se cede a terceros.
          </li>
          <li>
            La insignia de «Verificado» refleja que la razón social o titularidad
            fiscal coincide con los registros públicos oficiales a la fecha de
            consulta, pero no exime a los compradores de efectuar las
            diligencias comerciales habituales antes de perfeccionar una compra.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "14. Integración y Uso de Google Calendar y APIs de Terceros",
    content: (
      <>
        <p>
          La plataforma ofrece una integración opcional con Google Calendar para
          asistir a profesionales y comercios en la coordinación de sus turnos y
          agendas:
        </p>
        <ul>
          <li>
            Sercio consulta, añade y actualiza exclusivamente los eventos
            directamente vinculados a reservas, presupuestos o servicios
            agendados desde la aplicación. No se leen, modifican ni recopilan
            eventos privados ajenos al servicio.
          </li>
        </ul>

        <h3 className="terms-section__subtitle">
          14.1. Declaración de Cumplimiento de Datos de Usuario de Google (Google API Disclosure)
        </h3>
        <p>
          Nuestra aplicación accede a los servicios de Google mediante el
          estándar OAuth 2.0 y se rige por la Política de Datos de Usuario de los
          Servicios de API de Google (Google API Services User Data Policy),
          incluidos los requisitos de Uso Limitado:
        </p>
        <ul>
          <li>
            <strong>Alcances solicitados (Scopes):</strong>
            <ul>
              <li>
                <code className="terms-section__code">openid</code>:
                Autenticación federada segura mediante OpenID Connect.
              </li>
              <li>
                <code className="terms-section__code">auth/userinfo.email</code>:
                Obtención del correo electrónico principal para inicio de sesión
                y soporte.
              </li>
              <li>
                <code className="terms-section__code">auth/userinfo.profile</code>:
                Acceso al nombre e imagen de perfil para personalización de
                interfaz.
              </li>
              <li>
                <code className="terms-section__code">auth/calendar.readonly</code>:
                Lectura en tiempo real de disponibilidad horaria para evitar
                solapamiento de turnos.
              </li>
              <li>
                <code className="terms-section__code">auth/calendar.events</code>:
                Alta, modificación o baja de citas agendadas a través de Sercio.
              </li>
            </ul>
          </li>
          <li>
            <strong>Mecanismos de Protección:</strong> El tráfico se transmite
            cifrado bajo protocolos seguros SSL/TLS (HTTPS). Los tokens de sesión
            se resguardan en entornos de memoria controlada y servidores
            seguros.
          </li>
          <li>
            <strong>Retención y Eliminación:</strong> No persistimos de forma
            innecesaria información privada del calendario en bases de datos
            externas; el procesamiento es estrictamente en memoria
            (in-memory). La desconexión voluntaria desde la cuenta del usuario o
            la eliminación de la cuenta en Sercio revoca y destruye
            inmediatamente los refresh tokens asociados.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "15. Propiedad Intelectual y Derechos Reservados",
    content: (
      <p>
        El software, diseño de interfaces, marcas, logotipos, textos y
        desarrollos informáticos de Sercio están protegidos por la Ley N° 11.723
        de Propiedad Intelectual y la Ley N° 22.362 de Marcas y Designaciones.
        Queda expresamente prohibido copiar, reproducir, realizar ingeniería
        inversa, distribuir o utilizar indebidamente el material propio de la
        plataforma. A su vez, los usuarios garantizan ser titulares o poseer las
        licencias correspondientes sobre las fotografías, descripciones y
        logotipos que carguen en sus publicaciones de productos o perfiles
        profesionales.
      </p>
    ),
  },
  {
    title: "16. Modificaciones a los Términos y Condiciones",
    content: (
      <p>
        Sercio podrá actualizar y modificar estos Términos y Condiciones en
        cualquier momento para adecuarlos a novedades regulatorias, técnicas o
        comerciales. Las modificaciones entrarán en vigencia a partir de su
        publicación en el sitio web y/o aplicación. El uso continuado de la
        plataforma tras dichas publicaciones implicará la aceptación plena de
        los términos actualizados.
      </p>
    ),
  },
  {
    title: "17. Jurisdicción y Ley Aplicable",
    content: (
      <>
        <p>
          Los presentes Términos y Condiciones se rigen de manera exclusiva por
          las leyes de la República Argentina. Ante cualquier controversia,
          litigio o reclamo derivado de la interpretación, validez o ejecución
          del presente acuerdo, las partes se someten a la competencia de los
          Tribunales Ordinarios en lo Comercial de la primera circunscripción
          judicial de la provincia de Mendoza, con renuncia a cualquier otro
          fuero o jurisdicción que pudiera corresponderles, en especial el
          Federal.
        </p>
        <p>
          <strong>Domicilio especial:</strong> Tanto los comerciantes,
          profesionales, clientes o compradores fijan domicilio especial en la
          casilla de correo electrónico denunciada al registrarse, donde se
          tendrán por plenamente válidas y eficaces todas las notificaciones que
          se cursen.
        </p>
        <p>
          Para consultas, soporte o denuncias sobre publicaciones o comercios,
          los usuarios pueden comunicarse a través de los canales de atención y
          mesa de ayuda oficiales dentro de la plataforma.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="terms-page">
        <header className="terms-header">
          <span className="terms-header__badge">Documento Legal y Operativo</span>
          <h1 className="terms-header__title">Términos y Condiciones</h1>
          <p className="terms-header__subtitle">
            Políticas de Privacidad y Uso del Servicio Sercio
          </p>
        </header>

        <div className="terms-content">
          {TERMS_SECTIONS.map((section, index) => (
            <section key={index} className="terms-section">
              <h2 className="terms-section__title">{section.title}</h2>
              <div className="terms-section__text">{section.content}</div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
