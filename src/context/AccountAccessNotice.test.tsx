import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { AccountAccessNotice } from './AccountAccessNotice';
import { SELL_VERIFICATION_NOTICE_EVENT } from './sellVerificationNotice';
import { ROUTES } from '@/routes/paths';

const navigation = vi.hoisted(() => ({ pathname: '/dashboard' }));
vi.mock('next/navigation', () => ({ usePathname: () => navigation.pathname }));

describe('Account access notice', () => {
  beforeEach(() => {
    localStorage.clear();
    navigation.pathname = '/dashboard';
  });

  it('does not interrupt account setup with the verification dialog', () => {
    navigation.pathname = ROUTES.accountSetup;
    const { rerender } = render(<AccountAccessNotice blocked={false} verificationRequired refresh={vi.fn()} logout={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    navigation.pathname = '/dashboard';
    rerender(<AccountAccessNotice blocked={false} verificationRequired refresh={vi.fn()} logout={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('waits for setup when the plan has just been activated', () => {
    localStorage.setItem('show_setup_on_login', 'true');
    render(<AccountAccessNotice blocked={false} verificationRequired refresh={vi.fn()} logout={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    act(() => window.dispatchEvent(new Event(SELL_VERIFICATION_NOTICE_EVENT)));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
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

  it('shows the selling verification notice in a dismissible dialog', () => {
    render(<AccountAccessNotice
      blocked={false}
      verificationRequired
      identityVerified={false}
      arcaVerified
      cbuVerified
      refresh={vi.fn()}
      logout={vi.fn()}
    />);

    const dialog = screen.getByRole('dialog', { name: 'Completá las verificaciones para vender' });
    expect(dialog).toHaveTextContent('DNI, rostro y mayoría de edad desde la app');
    expect(dialog).not.toHaveTextContent('datos fiscales en ARCA');
    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar' }).at(-1)!);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the notice again when entering a selling section', () => {
    render(<AccountAccessNotice
      blocked={false}
      verificationRequired
      refresh={vi.fn()}
      logout={vi.fn()}
    />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar' }).at(-1)!);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => window.dispatchEvent(new Event(SELL_VERIFICATION_NOTICE_EVENT)));
    expect(screen.getByRole('dialog', { name: 'Completá las verificaciones para vender' })).toBeInTheDocument();
  });
});
