import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import "./ReturnsPolicyPage.css";

const categoryConditions = [
  ["Alimentos y bebidas", "Alimentos preparados, perecederos frescos y bebidas alcohólicas", "Solo por falla: vencimiento, mal estado o pedido incorrecto."],
  ["Alimentos y bebidas", "Alimentos no perecederos y bebidas sin alcohol", "Sin abrir, con el sello original de fábrica intacto."],
  ["Gastronomía", "Platos elaborados y comida rápida", "Solo por falla; el reclamo debe iniciarse dentro de las 2 horas de recibido. No se cancela un pedido que ya está en preparación."],
  ["Bebés y maternidad", "Pañales, chupetes, tetinas, mordillos e insumos de higiene o alimentación", "Sin abrir, con el empaque exterior sellado."],
  ["Belleza y cuidado personal", "Farmacia de venta libre", "Solo por falla de fábrica reportada al recibir el producto."],
  ["Belleza y cuidado personal", "Cosméticos, maquillaje, perfumes, insumos de peluquería y protectores solares", "Sin abrir, sin uso y con los sellos intactos."],
  ["Indumentaria y moda", "Ropa interior, lencería, trajes de baño y calcetines", "Solo por falla; no se admiten cambios por talle o gusto."],
  ["Tecnología premium", "Productos y accesorios Apple", "Sin abrir, con el plástico o sello térmico original intacto."],
  ["Salud y equipamiento", "Suplementos dietarios e insumos de laboratorio", "Solo por defecto de origen comprobable o vencimiento."],
  ["Salud y equipamiento", "Farmacia general, salud dental, cuidado de la salud y oxigenoterapia", "Sin abrir, con el empaque hermético original."],
  ["Hogar y muebles", "Colchones comprimidos al vacío", "Sin abrir y sin expandir."],
  ["Hogar y muebles", "Productos de limpieza, lavandería y desinfección", "Sin abrir, con los envases sellados."],
  ["Autopartes", "Repuestos de autos, motos y camiones", "Sin usar ni instalar, sin marcas de herramientas o grasa."],
  ["Coleccionables y entretenimiento", "Figuritas, álbumes, cartas y videojuegos físicos", "Sin abrir; solo por falla cuando corresponda."],
  ["Productos estacionales", "Artículos de Navidad", "Solo por falla o daño al recibirlos; no por arrepentimiento después de las fiestas."],
] as const;

export default function ReturnsPolicyPage() {
  return (
    <div className="returns-policy">
      <Navbar />
      <main className="returns-policy__main">
        <header className="returns-policy__intro">
          <span className="returns-policy__eyebrow">Información para compradores</span>
          <h1>Políticas de devolución y arrepentimiento</h1>
          <p>
            Conocé los plazos y las condiciones para devolver productos, reclamar por
            alimentos y solicitar el arrepentimiento de un servicio contratado a distancia.
          </p>
        </header>

        <nav className="returns-policy__nav" aria-label="Secciones de la política">
          <a href="#productos">Productos</a>
          <a href="#gastronomia">Gastronomía</a>
          <a href="#categorias">Categorías especiales</a>
          <a href="#servicios">Servicios</a>
        </nav>

        <div className="returns-policy__content">
          <section id="productos" className="returns-policy__section">
            <span className="returns-policy__section-number">01 / Productos</span>
            <h2>Devolución de productos</h2>
            <p>
              Podés devolver productos elegibles sin importar el motivo. Algunas
              categorías están excluidas o requieren condiciones especiales, que se
              detallan más abajo.
            </p>
            <h3>Plazo de arrepentimiento</h3>
            <p>
              Disponés de <strong>10 días corridos desde que recibís o retirás el
              producto</strong> para solicitar su devolución y el reembolso total, sin
              necesidad de explicar el motivo.
            </p>
            <h3>Condiciones del producto</h3>
            <p>
              Si te arrepentiste o recibiste un producto diferente del solicitado,
              debe estar en perfecto estado, sin marcas de uso, con accesorios,
              manuales y etiquetas originales, dentro del envoltorio o caja de la
              marca. Los celulares, notebooks, tablets y smartwatches no deben
              conservar claves ni datos personales. En productos Apple, la caja
              original debe estar sellada y en perfecto estado.
            </p>
            <p>
              Si el producto tiene una falla, llegó incompleto o presenta otro
              problema, debe conservar las mismas condiciones descriptas en el
              reclamo e incluir los accesorios y componentes recibidos.
            </p>
            <p>
              Tras la revisión, si el producto no cumple estas condiciones, Sercio
              podría rechazar la devolución y enviarlo de vuelta, descontar el valor
              de daños o faltantes del reembolso, o efectuar un cargo si ya se había
              otorgado un reembolso inmediato antes de la inspección.
            </p>
            <h3>Cómo entregar el producto</h3>
            <ul>
              <li><strong>Retiro en tienda:</strong> acercate a la sucursal del comercio para entregar el producto y validar su estado.</li>
              <li><strong>Delivery local calculado por la plataforma:</strong> podés llevarlo al local o solicitar un retiro a domicilio coordinado por la tienda, sin costo para vos.</li>
              <li><strong>Envío de larga distancia acordado con la tienda:</strong> coordiná con el comercio el transporte, la fecha de retiro o el despacho. El costo del retorno corresponde al vendedor.</li>
            </ul>
            <h3>Retención de fondos y reembolso</h3>
            <p>
              Sercio mantiene los fondos de la compra retenidos hasta que el
              comercio confirme la recepción del producto devuelto en
              condiciones óptimas. Aprobada la recepción, Sercio procesa el
              reembolso al mismo medio de pago de la compra.
            </p>
          </section>

          <section id="gastronomia" className="returns-policy__section">
            <span className="returns-policy__section-number">02 / Gastronomía</span>
            <h2>Comida preparada y alimentos perecederos</h2>
            <p>
              No se admiten devoluciones por cambio de opinión una vez
              entregados correctamente alimentos preparados,
              productos frescos o artículos que requieren cadena de frío.
            </p>
            <h3>Cuándo se puede reclamar</h3>
            <ul>
              <li>El pedido llegó incorrecto o incompleto.</li>
              <li>Los alimentos llegaron vencidos, descompuestos, con cuerpos extraños o con una pérdida demostrable de la cadena de frío.</li>
              <li>Hubo una demora crítica que afectó la temperatura o calidad de la comida.</li>
            </ul>
            <h3>Plazos y pruebas</h3>
            <p>
              El comprador tiene hasta <strong>2 horas desde la recepción</strong>
              para iniciar el reclamo y debe adjuntar fotos legibles o videos de
              la falla. El comercio dispone de <strong>24 horas corridas</strong>
              para responder. Si acepta el reclamo o no responde, se prevé la
              devolución del dinero; si lo rechaza con pruebas, Sercio evalúa
              el caso.
            </p>
            <p>
              El reclamo puede desestimarse si se consumió más del 15 % del
              alimento y se exige la devolución total, si el problema se produjo
              por almacenamiento posterior inadecuado o si faltan pruebas claras
              dentro del plazo. El comercio debe despachar la comida en empaques
              cerrados o con sellos de seguridad.
            </p>
            <h3>Alcance del reembolso</h3>
            <p>
              Un artículo vencido o en mal estado da lugar al reembolso de su
              valor; si afecta a toda la orden, se reintegra el total. Si hay
              faltantes, se reintegra el monto de lo no entregado. Una vez que
              el comercio aceptó la orden y la puso en preparación o la despachó,
              no se admite la cancelación por mero cambio de opinión.
            </p>
          </section>

          <section id="categorias" className="returns-policy__section">
            <span className="returns-policy__section-number">03 / Excepciones</span>
            <h2>Exclusiones y condiciones por categoría</h2>
            <p>
              Quedan excluidos de la devolución posterior a la entrega por
              cambio de opinión a animales, plantas naturales, productos para
              adultos y lencería erótica, acupuntura y medicamentos bajo receta,
              vehículos motorizados sujetos a patentamiento o transferencia, y
              regalos u obsequios sin cargo. Para esos artículos se indica
              cobertura hasta la entrega si se pierden o dañan durante el traslado.
            </p>
            <div className="returns-policy__table-wrap">
              <table>
                <caption>Condiciones especiales de devolución por categoría</caption>
                <thead>
                  <tr>
                    <th scope="col">Categoría</th>
                    <th scope="col">Productos</th>
                    <th scope="col">Condición</th>
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
            <h3>Faltantes, daños y mal estado</h3>
            <p>
              Si un producto llega vencido, roto o inutilizable, se prevé un
              reembolso del 100 % de su valor. Si solo una parte de la
              orden falta o presenta problemas, se reintegra el monto
              correspondiente a esa parte y se libera al vendedor el pago de
              los artículos entregados correctamente.
            </p>
          </section>

          <section id="servicios" className="returns-policy__section">
            <span className="returns-policy__section-number">04 / Servicios</span>
            <h2>Arrepentimiento y reclamos por servicios</h2>
            <p>
              Si contrataste un servicio a distancia, podés comunicar la
              revocación de la contratación dentro de los <strong>10 días desde
              que la celebraste</strong>. Este derecho no puede renunciarse y
              su ejercicio no debe generar gastos para vos.
            </p>
            <p>
              Cuando el servicio todavía no se prestó ni utilizó, la solicitud
              se evalúa como arrepentimiento de la contratación. Si el servicio
              ya se utilizó o consumió, la normativa contempla una excepción al
              arrepentimiento; eso no impide reclamar por falta de prestación,
              incumplimientos o problemas con el servicio recibido.
            </p>
            <p>
              Para informar una cancelación o incidencia, conservá el número de
              orden y contactá al prestador desde <a href="/panel?view=purchases">Mis Compras</a>.
              También podés escribir a <a href="mailto:soporte@sercio.com">soporte@sercio.com</a>
              para dejar constancia de la solicitud. Las condiciones particulares
              de una reserva o turno deben informarse antes del pago y no pueden
              limitar los derechos irrenunciables del consumidor.
            </p>
            <p className="returns-policy__source-note">
              Marco normativo para servicios: <a href="https://www.argentina.gob.ar/normativa/nacional/235975/texto" target="_blank" rel="noopener noreferrer">Código Civil y Comercial</a> y <a href="https://www.argentina.gob.ar/normativa/nacional/norma-417152/texto" target="_blank" rel="noopener noreferrer">Disposición 954/2025</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
