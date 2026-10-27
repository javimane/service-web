"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { commerceService, Branch } from "@/services/commerceService";
import "./ProductBranchStock.css";

export default function ProductBranchStock({ listingId, onSaved }: { listingId: string; onSaved?: () => void }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Array<Branch & { stock: number; assigned: boolean }>>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    let active = true;
    setBusy(true); setError(""); setRows([]);
    commerceService.productStockLocations(listingId).then(data => { if (active) setRows(data); })
      .catch(() => { if (active) setError("No se pudo cargar el stock. Cerrá y volvé a intentar."); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [open, listingId]);
  const save = async () => {
    const selected = rows.filter(row => row.assigned);
    if (!selected.length || selected.some(row => !Number.isSafeInteger(row.stock) || row.stock < 0)) {
      setError("Asigná al menos una sucursal e ingresá cantidades enteras no negativas."); return;
    }
    setBusy(true); setError("");
    try {
      await commerceService.saveProductBranchStock(listingId, selected.map(row => ({
        ...(row.is_main ? { origin_address_id: row.address_id! } : { branch_id: row.id }), stock: row.stock,
      })));
      setOpen(false); onSaved?.();
    } catch (err: any) { setError(err?.message || "No se pudo guardar el stock."); }
    finally { setBusy(false); }
  };
  return <>
    <button type="button" className="product-branch-stock__button" onClick={() => setOpen(true)}>Stock por sucursal</button>
    {open && createPortal(<div className="product-branch-stock__overlay"><section role="dialog" aria-modal="true" aria-label="Stock por sucursal" className="product-branch-stock__dialog">
      <h2>Stock por sucursal</h2>
      <p>Asigná las tiendas donde está disponible este producto o variante. El stock total es la suma de sus sucursales.</p>
      {rows.map((row, index) => <div className="product-branch-stock__row" key={row.id}>
        <label><input type="checkbox" checked={row.assigned} disabled={busy} onChange={event => setRows(rows.map((item, i) => i === index ? { ...item, assigned: event.target.checked } : item))} />{row.name}<small>{row.street_name} {row.street_number}</small></label>
        <input type="number" aria-label={`Stock en ${row.name}`} min="0" step="1" disabled={busy || !row.assigned} value={Number.isNaN(row.stock) ? "" : row.stock} onChange={event => setRows(rows.map((item, i) => i === index ? { ...item, stock: event.target.value === "" ? NaN : Number(event.target.value) } : item))} />
      </div>)}
      {busy && <p>Cargando…</p>}{error && <p role="alert">{error}</p>}
      <div className="product-branch-stock__actions"><button type="button" disabled={busy} onClick={() => setOpen(false)}>Cerrar</button><button type="button" disabled={busy || !rows.length} onClick={save}>Guardar stock</button></div>
    </section></div>, document.body)}
  </>;
}
