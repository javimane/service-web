import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';
import { commerceService, CheckoutDto } from './commerceService';

vi.mock('./apiClient', () => ({ apiClient: vi.fn() }));

describe('checkout payment retries', () => {
  beforeEach(() => { vi.clearAllMocks(); window.sessionStorage.clear(); });
  const purchase: CheckoutDto = { service_id: 'service', delivery_type: 'pickup', payment_method: 'payway_card', card_token: 'token-one' };
  const staleFailure = { statusCode: 409, data: { error_code: 'CHECKOUT_FAILED', retryable: true, requires_new_attempt: true } };
  it('automatically recovers a previously failed attempt with a fresh token and key', async () => {
    vi.mocked(apiClient).mockRejectedValueOnce(staleFailure)
      .mockResolvedValueOnce({ order_id: 'new-order', payment_method: 'payway_card', total_amount: 100, status: 'paid' });
    const refreshPayment = vi.fn().mockResolvedValue({ card_token: 'token-two' });
    await expect(commerceService.checkout(purchase, { refreshPayment })).resolves.toMatchObject({ order: { id: 'new-order' } });
    expect(refreshPayment).toHaveBeenCalledTimes(1);
    const calls = vi.mocked(apiClient).mock.calls;
    expect(calls[1][1].body.card_token).toBe('token-two');
    expect(calls[1][1].body.idempotency_key).not.toBe(calls[0][1].body.idempotency_key);
  });
  it('does not loop if recovery also fails', async () => {
    vi.mocked(apiClient).mockRejectedValue(staleFailure);
    const refreshPayment = vi.fn().mockResolvedValue({ card_token: 'token-two' });
    await expect(commerceService.checkout(purchase, { refreshPayment })).rejects.toBe(staleFailure);
    expect(apiClient).toHaveBeenCalledTimes(2);
    expect(refreshPayment).toHaveBeenCalledTimes(1);
  });
  it('does not automatically recharge after a fresh provider rejection', async () => {
    const decline = { statusCode: 400, data: { error_code: 'CHECKOUT_FAILED', retryable: true, requires_new_attempt: true } };
    vi.mocked(apiClient).mockRejectedValue(decline);
    const refreshPayment = vi.fn();
    await expect(commerceService.checkout(purchase, { refreshPayment })).rejects.toBe(decline);
    expect(apiClient).toHaveBeenCalledTimes(1);
    expect(refreshPayment).not.toHaveBeenCalled();
  });
  it('starts a new attempt after a confirmed failure', async () => {
    vi.mocked(apiClient).mockRejectedValueOnce({ data: { error_code: 'CHECKOUT_FAILED', retryable: true } })
      .mockResolvedValueOnce({ order_id: 'new-order', payment_method: 'payway_card', total_amount: 100, status: 'paid' });
    await expect(commerceService.checkout(purchase)).rejects.toMatchObject({ data: { error_code: 'CHECKOUT_FAILED' } });
    await commerceService.checkout({ ...purchase, card_token: 'token-two' });
    const first = vi.mocked(apiClient).mock.calls[0][1].body;
    const second = vi.mocked(apiClient).mock.calls[1][1].body;
    expect(second.idempotency_key).not.toEqual(first.idempotency_key);
    expect(second.card_token).toEqual('token-two');
  });
  it('releases the key after local validation prevented submission to the provider', async () => {
    vi.mocked(apiClient).mockRejectedValueOnce({ data: { error_code: 'CHECKOUT_NOT_SUBMITTED', payment_submitted: false } })
      .mockResolvedValueOnce({ order_id: 'new-order', payment_method: 'payway_card', total_amount: 100, status: 'paid' });
    await expect(commerceService.checkout(purchase)).rejects.toBeDefined();
    await commerceService.checkout({ ...purchase, card_token: 'token-two' });
    expect(vi.mocked(apiClient).mock.calls[1][1].body.idempotency_key)
      .not.toBe(vi.mocked(apiClient).mock.calls[0][1].body.idempotency_key);
  });
  it('keeps the same attempt after an uncertain response to prevent duplicate charges', async () => {
    vi.mocked(apiClient).mockRejectedValue({ data: { error_code: 'CHECKOUT_REQUIRES_VERIFICATION', retryable: false } });
    await expect(commerceService.checkout(purchase)).rejects.toBeDefined();
    await expect(commerceService.checkout(purchase)).rejects.toBeDefined();
    expect(vi.mocked(apiClient).mock.calls[1][1].body.idempotency_key)
      .toEqual(vi.mocked(apiClient).mock.calls[0][1].body.idempotency_key);
  });
  it('preserves the payment intent when the checkout returns a pending verification instead of an error', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({ order_id: 'order', payment_method: 'payway_card', total_amount: 100,
      status: 'pending_payment', verification_pending: true })
      .mockResolvedValueOnce({ order_id: 'order', payment_method: 'payway_card', total_amount: 100, status: 'paid' });
    await expect(commerceService.checkout(purchase)).resolves.toMatchObject({ verification_pending: true, payment_status: 'pending' });
    await expect(commerceService.checkout(purchase)).resolves.toMatchObject({ payment_status: 'approved' });
    expect(vi.mocked(apiClient).mock.calls[1][1].body.idempotency_key)
      .toBe(vi.mocked(apiClient).mock.calls[0][1].body.idempotency_key);
  });
});
