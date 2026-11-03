import type { BranchRiderCoverage as Coverage } from "@/services/commerceService";
import "./BranchRiderCoverage.css";
const names: Record<string,string> = { bicycle: "Bicicleta", motorcycle: "Moto", car: "Auto", pickup: "Camioneta", van: "Utilitario", truck: "Camión" };
export function BranchRiderCoverage({ coverage, loading, error }: { coverage?: Coverage; loading: boolean; error: boolean }) {
  return <section className="branch-rider-coverage" aria-label="Riders de Sercio en la zona">
    <h4>Riders de Sercio en la zona</h4>
    {loading ? <p role="status">Consultando cobertura…</p> : error || !coverage ? <p role="alert">No se pudo consultar la cobertura. Actualizá para reintentar.</p> : !coverage.configured ? <p>Completá la provincia y el departamento de la sucursal para consultar su cobertura.</p> : <>
      <p><strong>{coverage.total_riders} habilitados · {coverage.online_riders} conectados</strong></p>
      <ul>{coverage.by_vehicle.map(vehicle => <li key={vehicle.vehicle_type}><span>{names[vehicle.vehicle_type] ?? vehicle.vehicle_type}</span><span>{vehicle.total} · {vehicle.online} conectados</span></li>)}</ul>
      {coverage.total_riders === 0 ? <p role="status">No hay riders de Sercio habilitados para esta zona. Usá empleados propios; el comprador también puede retirar o acordar la entrega.</p> : coverage.online_riders === 0 ? <p role="status">Ahora no hay riders conectados en esta zona.</p> : null}
      <p className="branch-rider-coverage__note">La búsqueda se hace al confirmar el pedido y depende de la cercanía, la capacidad y la aceptación del rider. Un rider puede tener más de un tipo de vehículo.</p>
    </>}
  </section>;
}
