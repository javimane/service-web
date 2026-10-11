import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CheckoutItemDetails, { checkoutProductCharacteristics } from './CheckoutItemDetails';

describe('Checkout item characteristics', () => {
  it('shows the chosen product attributes together with brand and legacy fields', () => {
    render(<CheckoutItemDetails product={{ brand: 'Sercio', color: 'Rojo', size_letter: 'M',
      attributes: [{ name: 'Material', value: 'Algodón' }, { name: 'color', value: 'Rojo' }] }} />);
    expect(screen.getByLabelText('Características del producto')).toHaveTextContent('MaterialAlgodón');
    expect(screen.getByText('Sercio')).toBeInTheDocument();
    expect(screen.getAllByText('Rojo')).toHaveLength(1);
    expect(screen.getByText('M')).toBeInTheDocument();
  });
  it('supports object attributes, numeric sizes and ignores malformed values', () => {
    expect(checkoutProductCharacteristics({ size_number: 0,
      attributes: { Capacidad: '128 GB', Vacío: '', Inválido: { nested: true } } }))
      .toEqual([{ name: 'Capacidad', value: '128 GB' }, { name: 'Talle', value: '0' }]);
  });
  it('shows service description and does not invent characteristics', () => {
    const { container } = render(<CheckoutItemDetails description="Incluye instalación" />);
    expect(screen.getByText('Incluye instalación')).toBeInTheDocument();
    expect(container.querySelector('dl')).toBeNull();
  });
});
