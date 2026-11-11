"use client";
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { commerceService, UserAddress } from '@/services/commerceService';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/Modal/Modal';
import DeliveryAddressSection from '@/views/Settings/sections/DeliveryAddressSection';
import './PaymentAddressCard.css';

export function completePaymentAddress(address?: UserAddress): boolean {
  return Boolean(address && (address.street_name || address.street)?.trim() &&
    (address.street_number || address.number)?.trim() && (address.city || address.department)?.trim() &&
    (address.province?.trim() || address.province_id) && (address.postal_code || address.zip_code)?.trim());
}

export default function PaymentAddressCard({ onChange, preferredId }: {
  onChange: (id: string, complete: boolean) => void; preferredId?: string;
}) {
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState('');
  const [editing, setEditing] = useState(false);
  const { data: addresses = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['user-addresses', user?.id], queryFn: commerceService.getUserAddresses, enabled: !!user,
  });
  useEffect(() => {
    if (!addresses.some(address => address.id === selectedId)) {
      const preferred = addresses.find(address => address.id === preferredId && completePaymentAddress(address));
      const initial = preferred || addresses.find(address => address.is_default && completePaymentAddress(address)) ||
        addresses.find(completePaymentAddress) || addresses[0];
      setSelectedId(initial?.id || '');
    }
  }, [addresses, selectedId, preferredId]);
  const selected = addresses.find(address => address.id === selectedId);
  const complete = completePaymentAddress(selected);
  useEffect(() => { onChange(selectedId, complete); }, [selectedId, complete, onChange]);
  return <section className="payment-address-card" aria-label="Dirección del comprador para el pago">
    <h4>Dirección del comprador para el pago</h4>
    <p>Elegí tu domicilio con calle, número, localidad, provincia y código postal. La dirección de entrega se selecciona por separado.</p>
    {isLoading ? <p>Cargando direcciones…</p> : <>
      {isError && <p role="alert">No se pudieron cargar las direcciones.</p>}
      {addresses.length > 0 && <label>Dirección
        <select value={selectedId} onChange={event => setSelectedId(event.target.value)}>
          {addresses.map(address => <option key={address.id} value={address.id}>
            {address.street_name || address.street} {address.street_number || address.number}
            {!completePaymentAddress(address) ? ' — incompleta' : ''}
          </option>)}
        </select>
      </label>}
      {selected && <p className="payment-address-card__detail">
        {[selected.street_name || selected.street, selected.street_number || selected.number,
          selected.city || selected.department, selected.province,
          (selected.postal_code || selected.zip_code) && `CP ${selected.postal_code || selected.zip_code}`].filter(Boolean).join(' · ')}
      </p>}
      {!complete && <p role="alert">Agregá o completá una dirección antes de pagar.</p>}
    </>}
    <div className="payment-address-card__actions">
      <button type="button" onClick={() => setEditing(true)}>Agregar o editar dirección</button>
      <button type="button" disabled={isLoading} onClick={() => void refetch()}>Actualizar</button>
    </div>
    {editing && createPortal(<div onSubmit={event => event.stopPropagation()}>
      <Modal isOpen onClose={() => { setEditing(false); void refetch(); }} title="Direcciones del comprador">
        <DeliveryAddressSection userId={user?.id} requirePaymentAddress />
      </Modal>
    </div>, document.body)}
  </section>;
}
