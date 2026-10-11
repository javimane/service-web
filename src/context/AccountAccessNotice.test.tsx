import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AccountAccessNotice } from './AccountAccessNotice';

describe('Account access notice', () => {
  it('explains pausing and refreshes without offering self activation', async () => {
    const refresh = vi.fn().mockResolvedValue(null);
    render(<AccountAccessNotice blocked={false} reason="Factura pendiente" refresh={refresh} logout={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Cuenta en pausa');
    expect(screen.getByText('Factura pendiente')).toBeInTheDocument();
    expect(screen.queryByText('Cerrar sesión')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar estado' }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
  });
  it('shows the stronger blocking state and provides logout', () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    render(<AccountAccessNotice blocked refresh={vi.fn()} logout={logout} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Cuenta bloqueada');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(logout).toHaveBeenCalledOnce();
  });
});
