import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PaymentAddressCard from './PaymentAddressCard';
import { commerceService } from '@/services/commerceService';

vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'buyer' } }) }));
vi.mock('@/services/commerceService', () => ({ commerceService: { getUserAddresses: vi.fn() } }));
vi.mock('@/views/Settings/sections/DeliveryAddressSection', () => ({ default: () => <p>Editor de domicilios</p> }));
afterEach(cleanup);

describe('buyer payment address', () => {
  it('selects a complete address and prevents using one without a postal code', async () => {
    vi.mocked(commerceService.getUserAddresses).mockResolvedValue([
      { id: 'complete', street_name: 'San Martín', street_number: '123', city: 'Godoy Cruz', province: 'Mendoza', postal_code: '5501' },
      { id: 'incomplete', street_name: 'Belgrano', street_number: '456', city: 'Godoy Cruz', province: 'Mendoza' },
    ]);
    const onChange = vi.fn();
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <PaymentAddressCard onChange={onChange} />
    </QueryClientProvider>);
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('complete', true));
    expect(screen.getByText(/CP 5501/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'incomplete' } });
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith('incomplete', false));
    expect(screen.getByRole('alert')).toHaveTextContent('Agregá o completá');
    fireEvent.click(screen.getByRole('button', { name: 'Agregar o editar dirección' }));
    expect(screen.getByText('Editor de domicilios')).toBeInTheDocument();
  });
});
