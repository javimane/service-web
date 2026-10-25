import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import "./ReturnsPolicyPage.css";

const categoryConditions = [
  [
    "Alimentos y Bebidas",
    "Alimentos preparados/listos, alimentos perecederos frescos y bebidas alcohólicas.",
    "Solo por falla: Deben haber llegado con un problema (vencidos, mal estado o pedido incorrecto).",
  ],
  [
    "Alimentos y Bebidas",
    "Alimentos NO perecederos (secos/enlatados) y bebidas sin alcohol.",
    "Sin abrir: Deben conservar el sello original de fábrica intacto.",
  ],
  [
    "Gastronomía (Restaurantes)",
    "Platos elaborados, minutas, delivery de comida rápida.",
    "Solo por falla: Denuncia inmediata dentro de las primeras 2 horas de recibido. No se permite cancelación si el pedido ya está en preparación.",
  ],
  [
    "Bebés y Maternidad",
    "Pañales, chupetes, tetinas, mordillos e insumos de higiene/alimentación.",
    "Sin abrir: El empaque exterior debe estar sellado por higiene del menor.",
  ],
  [
    "Belleza y Cuidado Personal",
    "Farmacia de venta libre.",
    "Solo por falla: Debe reportarse un problema de fábrica al recibirlo.",
  ],
  [
    "Belleza y Cuidado Personal",
    "Cosméticos, maquillaje, perfumes, insumos de peluquería, barbería y protectores solares.",
    "Sin abrir: No deben haber sido probados ni tener los sellos rotos.",
  ],
  [
    "Indumentaria y Moda",
    "Ropa interior, lencería, trajes de baño y calcetines.",
    "Solo por falla: No se admite cambio ni devolución por talle o gusto por razones de higiene.",
  ],
  [
    "Tecnología Premium",
    "Productos electrónicos y accesorios de la marca Apple.",
    "Sin abrir: La caja debe mantener el plástico o sello térmico de fábrica sin alteraciones.",
  ],
  [
    "Salud y Equipamiento",
    "Suplementos dietarios e insumos de laboratorio.",
    "Solo por falla: Deben presentar un defecto comprobable de origen o vencimiento.",
  ],
  [
    "Salud y Equipamiento",
    "Artículos de farmacia general, salud dental, cuidado de la salud y oxigenoterapia.",
    "Sin abrir: Deben conservar el empaquetado hermético original.",
  ],
  [
    "Hogar y Muebles",
    "Colchones en caja (comprimidos al vacío).",
    "Sin abrir: Una vez expandidos, pierden las dimensiones de transporte y no pueden devolverse.",
  ],
  [
    "Hogar y Muebles",
    "Insumos de limpieza, lavandería y desinfección del hogar.",
    "Sin abrir: Envases sellados para evitar derrames o adulteración de químicos.",
  ],
  [
    "Autopartes",
    "Repuestos de autos, motos o camiones.",
    "Sin usar ni instalar: No deben presentar marcas de herramientas, grasa o colocación previa.",
  ],
  [
    "Coleccionables y Entretenimiento",
    "Figuritas, álbumes, cromos, cartas coleccionables y videojuegos físicos.",
    "Sin abrir / Solo por falla: Para evitar copias, fraudes o retiro de piezas de valor.",
  ],
  [
    "Productos Estacionales",
    "Artículos de Navidad (Árboles, adornos, luces, muñecos).",
    "Solo por falla: Deben haber llegado dañados. No se aceptan devoluciones por arrepentimiento post-fiestas.",
  ],
] as const;

export default function ReturnsPolicyPage() {
  return (
    <div className="returns-policy">
      <Navbar />
      <main className="returns-policy__main">
        <header className="returns-policy__intro">
          <span className="returns-policy__eyebrow">
            Términos de Protección y Garantía
          </span>
          <h1>
            Política de Devoluciones, Arrepentimiento y Cancelación - Sercio
          </h1>
          <p>
            En Sercio, tu tranquilidad es lo más importante. Podés devolver y
            cancelar tus productos sin costo según las pautas de esta política.
          </p>

          <div className="returns-policy__limit-notice" role="note">
            <strong>Límite preventivo de seguridad:</strong> Para resguardar el
            ecosistema de la plataforma, evitar abusos en el uso de los
            beneficios de devolución y prevenir perjuicios económicos o gastos
            logísticos y operativos innecesarios a los comercios y profesionales
            independientes adheridos, Sercio establece un límite preventivo de{" "}
            <strong>
              hasta 2 (dos) cancelaciones o devoluciones por mes calendario por
              usuario
            </strong>
            . Superado dicho umbral mensual, la plataforma se reserva el derecho
            de someter futuras solicitudes a revisión manual, restringir
            beneficios de envíos bonificados o suspender temporalmente la
            facultad de compra del usuario ante indicios de uso abusivo o mala
            fe.
          </div>

          <p className="returns-policy__intro-subnote">
            Asimismo, existen productos que por su naturaleza quedan excluidos
            de nuestro programa de protección, servicios que no admiten
            arrepentimiento una vez ejecutados, y otros artículos que solo se
            pueden devolver si cumplen con condiciones específicas según su
            categoría.
          </p>
        </header>

        <nav
          className="returns-policy__nav"
          aria-label="Índice de secciones de la política"
        >
          <a href="#plazo-servicios">1. Plazos y Servicios</a>
          <a href="#condiciones-producto">2. Condiciones del Producto</a>
          <a href="#logistica-devolucion">3. Logística de Devolución</a>
          <a href="#garantia-reembolso">4. Garantía y Reembolso</a>
          <a href="#anexo-gastronomia">Anexo Gastronomía</a>
          <a href="#anexo-exclusiones">Anexo Exclusiones</a>
        </nav>

        <div className="returns-policy__content">
          {/* SECCIÓN 1: Plazo de Devolución y Régimen de Servicios */}
          <section id="plazo-servicios" className="returns-policy__section">
            <span className="returns-policy__section-number">
              01 / Plazos y Régimen Legal
            </span>
            <h2>1. Plazo de Devolución y Régimen de Servicios</h2>

            <div className="returns-policy__item-card">
              <h3>Productos Físicos</h3>
              <p>
                Disponés de <strong>10 días corridos</strong> desde el momento
                en que recibís o retirás tu producto para solicitar la
                devolución y el reembolso total de tu dinero, sin necesidad de
                explicar el motivo (conforme al Art. 34 de la Ley de Defensa del
                Consumidor N° 24.240 y concordantes del Código Civil y Comercial
                de la Nación).
              </p>
            </div>

            <div className="returns-policy__item-card">
              <h3>Servicios Contratados y Prestados</h3>
              <p>
                Conforme al marco legal vigente, el botón y derecho de
                arrepentimiento{" "}
                <strong>
                  no aplica a servicios que ya hayan sido efectivamente
                  prestados, ejecutados o consumidos
                </strong>
                , ni a aquellos cuya ejecución haya comenzado con el
                consentimiento expreso del usuario antes de vencer el plazo
                legal.
              </p>
              <p>
                Una vez finalizada la labor técnica, profesional o comercial
                pactada, no procede la cancelación ni la devolución de fondos
                por mero cambio de opinión. Para servicios programados o turnos
                aún no iniciados, la cancelación estará sujeta a los tiempos de
                preaviso propios de cada categoría o profesional para no
                ocasionar el lucro cesante del prestador.
              </p>
            </div>
          </section>

          {/* SECCIÓN 2: Condiciones del Producto */}
          <section
            id="condiciones-producto"
            className="returns-policy__section"
          >
            <span className="returns-policy__section-number">
              02 / Condiciones del Artículo
            </span>
            <h2>2. Condiciones del Producto</h2>
            <p>
              Motivo de devolución y condiciones que debe cumplir el producto:
            </p>

            <ul>
              <li>
                <strong>
                  Te arrepentiste de comprar el producto o es diferente de lo
                  que pediste:
                </strong>
                <ul>
                  <li>Estar en perfecto estado y no tener marcas de uso.</li>
                  <li>
                    Tener todos sus accesorios, manuales y etiquetas originales.
                  </li>
                  <li>
                    Estar dentro del envoltorio o caja original de la marca.
                  </li>
                  <li>
                    <strong>Tecnología:</strong> Si es un celular, notebook,
                    tablet o smartwatch, no debe tener claves, contraseñas ni
                    contener datos o fotos personales.
                  </li>
                  <li>
                    <strong>Productos Apple:</strong> La caja original de la
                    marca debe estar estrictamente sellada y en perfecto estado.
                  </li>
                </ul>
              </li>
              <li>
                <strong>
                  El producto tiene un problema, falla o está incompleto:
                </strong>
                <ul>
                  <li>
                    Al momento de la revisión, debe estar en las mismas
                    condiciones que describiste al iniciar el reclamo.
                  </li>
                  <li>
                    Debe incluir todos los accesorios y componentes tal cual te
                    llegaron.
                  </li>
                </ul>
              </li>
            </ul>

            <div className="returns-policy__highlight-box">
              <h3>¿Qué pasa si no cumplo con estas condiciones?</h3>
              <p>
                Una vez que el comercio o nuestro equipo revise el producto
                devuelto, según el estado del mismo, Sercio podría tomar las
                siguientes medidas:
              </p>
              <ol>
                <li>
                  <strong>Rechazar la devolución</strong> y enviar el producto
                  de vuelta a tu domicilio.
                </li>
                <li>
                  <strong>Descontar una parte del reembolso</strong> (reembolso
                  parcial) debido al daño o faltantes.
                </li>
                <li>
                  <strong>Hacer un cargo por el valor de la compra</strong> en
                  tu tarjeta de crédito/débito, en caso de que hayas recibido un
                  reembolso inmediato antes de la revisión física del artículo.
                </li>
              </ol>
            </div>
          </section>

          {/* SECCIÓN 3: Logística de Devolución según el Tipo de Envío */}
          <section
            id="logistica-devolucion"
            className="returns-policy__section"
          >
            <span className="returns-policy__section-number">
              03 / Logística y Transporte
            </span>
            <h2>3. Logística de Devolución según el Tipo de Envío</h2>

            <div className="returns-policy__logistics-block">
              <h3>🏪 Retiro en Tienda</h3>
              <p>
                El comprador debe acercarse directamente a la sucursal física
                del comercio para entregar el producto y validar su estado.
              </p>
            </div>

            <div className="returns-policy__logistics-block">
              <h3>
                🛵 Envíos de Corta Distancia (Delivery Calculado por la
                Plataforma)
              </h3>
              <p>
                Para los envíos locales automáticos (donde Sercio ya calculó el
                costo según peso, dimensiones y cantidad), el comprador tiene
                dos opciones para el arrepentimiento:
              </p>
              <ol>
                <li>
                  <strong>
                    Llevarlo directamente al local físico del comercio:
                  </strong>{" "}
                  opción recomendada para acelerar el reembolso.
                </li>
                <li>
                  <strong>Solicitar el retiro a domicilio:</strong> La logística
                  de retiro será coordinada de común acuerdo entre el comprador
                  y el vendedor, sujeta a que el comercio cuente con flota,
                  riders o servicio de flete propio habilitado, sin costo para
                  el comprador.
                </li>
              </ol>
            </div>

            <div className="returns-policy__logistics-block">
              <h3>📦 Envíos de Larga Distancia (Coordinación Directa)</h3>
              <p>
                Para compras fuera del radio local que requirieron una logística
                acordada previamente con la tienda (incluyendo cargas pesadas,
                de gran volumen o que requirieron fletes/camiones completos), la
                devolución también deberá coordinarse directamente entre el
                comprador y el comercio:
              </p>
              <ul>
                <li>
                  El costo de este envío de retorno corre por cuenta del
                  comercio vendedor.
                </li>
                <li>
                  El comprador deberá contactar a la tienda a través de la
                  plataforma para acordar el transporte, la fecha de retiro o el
                  método de despacho de la mercadería.
                </li>
              </ul>
            </div>
          </section>

          {/* SECCIÓN 4: Garantía Sercio: Retención de Fondos y Reembolso */}
          <section id="garantia-reembolso" className="returns-policy__section">
            <span className="returns-policy__section-number">
              04 / Garantía de Pago
            </span>
            <h2>4. Garantía Sercio: Retención de Fondos y Reembolso</h2>

            <div className="returns-policy__guarantee-grid">
              <div className="returns-policy__guarantee-card">
                <h3>Protección del Dinero</h3>
                <p>
                  Para tu tranquilidad, Sercio mantiene los fondos de la compra
                  retenidos de forma segura y no se los libera al comercio hasta
                  que este confirme que recibió el producto devuelto en
                  condiciones óptimas.
                </p>
              </div>

              <div className="returns-policy__guarantee-card">
                <h3>Acreditación Inmediata</h3>
                <p>
                  Una vez aprobada la recepción por parte de la tienda, Sercio
                  procesará el reembolso inmediato al mismo medio de pago
                  utilizado en la compra.
                </p>
              </div>
            </div>
          </section>

          {/* ANEXO 1: Comercios Gastronómicos y Alimentos */}
          <section id="anexo-gastronomia" className="returns-policy__section">
            <span className="returns-policy__section-number">
              Anexo A / Sector Gastronómico
            </span>
            <h2>
              Anexo de Términos y Condiciones para Comercios Gastronómicos y de
              Alimentos – Sercio
            </h2>
            <p>
              El presente documento regula las condiciones de operación,
              reclamos y devoluciones para todos los comercios adheridos a
              Sercio que comercialicen comida preparada, alimentos perecederos o
              productos gastronómicos frescos.
            </p>

            <h3>1. Inexistencia del Derecho de Arrepentimiento Comercial</h3>
            <p>
              En cumplimiento con la normativa vigente de salud pública e
              higiene, los compradores{" "}
              <strong>
                no poseen derecho de arrepentimiento de 10 días sobre alimentos
                preparados, productos frescos o aquellos que requieran cadena de
                frío
              </strong>
              . Una vez entregado el pedido de forma correcta en tiempo y forma,
              la venta se considera final y no admite devoluciones por
              insatisfacción subjetiva o cambio de opinión.
            </p>

            <h3>2. Causales Válidas para Reclamos de Clientes</h3>
            <p>
              Sercio solo procesará reclamos económicos sobre productos
              alimenticios bajo las siguientes tres situaciones estrictas:
            </p>
            <ol>
              <li>
                <strong>Pedido Incorrecto o Incompleto:</strong> Falta de
                productos o entrega de artículos distintos a los comprados.
              </li>
              <li>
                <strong>Mal Estado Evidente:</strong> Alimentos descompuestos,
                vencidos, con cuerpos extraños o que hayan perdido la cadena de
                frío de forma demostrable durante el traslado.
              </li>
              <li>
                <strong>Demora Crítica en la Entrega:</strong> Pedidos que
                lleguen fuera del rango de tiempo máximo estipulado por el
                comercio, afectando la temperatura o calidad del alimento.
              </li>
            </ol>

            <h3>
              3. Procedimiento de Resolución de Conflictos y Retención de Fondos
            </h3>
            <p>
              Dado que Sercio opera con retención preventiva de fondos, el flujo
              ante un reclamo gastronómico será el siguiente:
            </p>
            <ul>
              <li>
                <strong>Plazo de Reporte del Cliente:</strong> El comprador
                tiene un plazo máximo e improrrogable de{" "}
                <strong>dos (2) horas</strong> desde la recepción del pedido
                para iniciar un reclamo en la plataforma.
              </li>
              <li>
                <strong>Obligación de Evidencia:</strong> El cliente debe
                adjuntar obligatoriamente fotografías legibles o videos que
                demuestren la falla (ej. foto del plato erróneo, del ticket o
                del producto afectado).
              </li>
              <li>
                <strong>Plazo de Respuesta del Comercio:</strong> Una vez
                notificado el reclamo, el comercio dispondrá de{" "}
                <strong>veinticuatro (24) horas corridas</strong> para presentar
                su descargo, aceptar el error o rechazar la queja a través del
                panel de Sercio.
              </li>
              <li>
                <strong>Liberación o Reembolso:</strong> Si el comercio acepta
                el reclamo o no responde dentro de las 24 horas, Sercio
                devolverá el dinero al comprador de forma automática. Si el
                comercio rechaza el reclamo con pruebas válidas, Sercio
                arbitrará el caso y liberará los fondos retenidos al comercio si
                corresponde.
              </li>
            </ul>

            <h3>4. Guía de Defensa para el Comercio ante Falsos Reclamos</h3>
            <p>
              Para evitar fraudes o abusos por parte de los usuarios, Sercio
              protegerá al comercio y desestimará el reclamo del comprador si se
              demuestra que:
            </p>
            <ul>
              <li>
                <strong>Consumo Parcial o Total:</strong> El cliente consumió
                más de un 15% del plato o producto y aun así pretende la
                devolución total del dinero.
              </li>
              <li>
                <strong>Manipulación Posterior:</strong> El desperfecto en el
                alimento ocurrió por un almacenamiento inadecuado por parte del
                cliente posterior a la entrega.
              </li>
              <li>
                <strong>Falta de Pruebas:</strong> El usuario no aporta
                evidencia fotográfica clara dentro del plazo de 2 horas.
              </li>
            </ul>
            <p>
              El comercio se compromete a despachar los alimentos en empaques
              cerrados o con sellos de seguridad térmicos/adhesivos para
              certificar que el producto no fue adulterado tras salir del
              establecimiento.
            </p>

            <h3>
              5. Política de Reembolsos por Faltantes, Vencimientos o Mal Estado
            </h3>
            <ul>
              <li>
                <strong>
                  Devolución por Alimentos Vencidos o en Mal Estado:
                </strong>{" "}
                Si un producto perecedero o plato preparado llega vencido,
                descompuesto o en condiciones no aptas para el consumo, el
                comprador recibirá el reembolso del 100% del valor de dicho
                artículo de forma inmediata, descontándose del pago retenido al
                comercio. En caso de que el mal estado afecte a la totalidad de
                la orden, se reintegrará el 100% del monto total de la compra al
                cliente.
              </li>
              <li>
                <strong>Reembolsos Parciales por Faltantes:</strong> Si el
                pedido llega incompleto o con faltantes, Sercio calculará y
                devolverá al comprador el monto exacto correspondiente al
                producto que no fue entregado. El resto de los fondos de los
                productos que sí llegaron en perfecto estado se liberarán al
                comercio de forma definitiva.
              </li>
              <li>
                <strong>Prohibición de Cancelación por Arrepentimiento:</strong>{" "}
                El comprador no podrá cancelar el envío por mero cambio de
                opinión una vez que el comercio haya aceptado la orden y
                cambiado el estado a &quot;En Preparación&quot; o
                &quot;Despachado&quot;. La única causa válida para cancelar o
                exigir la devolución una vez enviado es que la comida llegue en
                mal estado, vencida o sea incorrecta.
              </li>
            </ul>
          </section>

          {/* ANEXO 2: Exclusiones y Condiciones Especiales */}
          <section id="anexo-exclusiones" className="returns-policy__section">
            <span className="returns-policy__section-number">
              Anexo B / Exclusiones Específicas
            </span>
            <h2>
              Anexo de Exclusiones y Condiciones Especiales de Devolución -
              Sercio
            </h2>
            <p>
              Para garantizar la seguridad, la higiene y el comercio justo
              dentro de nuestra plataforma, no todos los productos admiten
              devoluciones por el mero cambio de opinión (arrepentimiento). A
              continuación, se detallan los productos que quedan excluidos del
              beneficio tras su recepción y las condiciones estrictas que deben
              cumplir el resto de las categorías para que Sercio apruebe el
              reembolso del dinero.
            </p>

            <h3>
              1. Productos Excluidos Totalmente (Sin devolución post-entrega)
            </h3>
            <p>
              Los siguientes artículos cuentan con la garantía de Sercio
              únicamente hasta el momento de su entrega (en caso de pérdida o
              daño en el traslado). Una vez recibidos por el comprador, quedan
              fuera de la cobertura y{" "}
              <strong>no pueden ser devueltos ni reembolsados</strong>:
            </p>
            <ul>
              <li>
                <strong>Animales y mascotas:</strong> Seres vivos de cualquier
                tipo.
              </li>
              <li>
                <strong>Plantas naturales:</strong> Por cuestiones de
                supervivencia y cuidado biológico.
              </li>
              <li>
                <strong>Productos para adultos:</strong> Juguetes sexuales y
                lencería erótica (por estrictas razones de higiene y salud
                pública).
              </li>
              <li>
                <strong>Salud y medicamentos bajo receta:</strong> Acupuntura y
                fármacos que pierdan trazabilidad médica.
              </li>
              <li>
                <strong>Vehículos motorizados (Motocicletas/Autos):</strong>{" "}
                Debido a los trámites legales obligatorios de patentamiento y
                transferencia.
              </li>
              <li>
                <strong>Regalos y obsequios:</strong> Cualquier artículo sin
                cargo asociado a una promoción comercial no tiene valor de
                reembolso.
              </li>
            </ul>

            <h3>2. Tabla de Condiciones Estrictas por Categoría</h3>
            <p>
              Si un comprador desea arrepentirse de la compra de los siguientes
              productos, la plataforma Sercio retendrá los fondos y solo
              aprobará la devolución si el artículo cumple con la condición
              específica de su categoría:
            </p>

            <div className="returns-policy__table-wrap">
              <table>
                <caption>
                  Condiciones estrictas de devolución y arrepentimiento por
                  categoría de producto
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Categoría General</th>
                    <th scope="col">Productos Específicos</th>
                    <th scope="col">Condición Obligatoria para Devolución</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryConditions.map(([category, products, condition]) => (
                    <tr key={`${category}-${products}`}>
                      <th scope="row">{category}</th>
                      <td>{products}</td>
                      <td>{condition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3>
              3. Mecanismo de Reembolso Ante Incidencias (Faltantes o Mal
              Estado)
            </h3>
            <ul>
              <li>
                <strong>Reembolso del 100% por Mal Estado:</strong> Si el
                producto (sea comida o de cualquier otra categoría) llega
                vencido, roto o es inutilizable, se le devolverá la totalidad
                del dinero al comprador, impactando negativamente en la cuenta
                del comercio.
              </li>
              <li>
                <strong>Reembolsos Parciales:</strong> Si la orden incluía
                varios productos y solo uno presenta problemas o faltó en el
                paquete, Sercio calculará y reintegrará al comprador el
                porcentaje exacto correspondiente a ese artículo. Los fondos de
                las piezas entregadas correctamente se liberarán de forma
                definitiva al vendedor.
              </li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
