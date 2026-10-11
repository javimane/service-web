import { afterEach, describe, expect, it, vi } from 'vitest';
import { collectPaywayDeviceFingerprint } from './paywayDeviceFingerprint';

afterEach(() => { vi.useRealTimers(); document.head.querySelectorAll('script').forEach(script => script.remove()); });
describe('Payway device profiling', () => {
  it('uses merchant + session for the real collector and sends only the matching session to Payway', async () => {
    vi.useFakeTimers();
    const pending = collectPaywayDeviceFingerprint({ organization_id: 'test-org', merchant_id: 'test-merchant' });
    const script = document.head.querySelector('script')!;
    const url = new URL(script.src);
    expect(url.origin).toBe('https://h.online-metrix.net');
    expect(url.searchParams.get('org_id')).toBe('test-org');
    script.dispatchEvent(new Event('load'));
    await vi.advanceTimersByTimeAsync(5000);
    const session = await pending;
    expect(url.searchParams.get('session_id')).toBe(`test-merchant${session}`);
    expect(document.head.contains(script)).toBe(false);
  });
  it('does not manufacture a fingerprint if collection is blocked', async () => {
    const pending = collectPaywayDeviceFingerprint({ organization_id: 'test-org', merchant_id: 'test-merchant' });
    const result = expect(pending).rejects.toThrow('No se pudo validar el dispositivo');
    document.head.querySelector('script')!.dispatchEvent(new Event('error'));
    await result;
  });
  it('requires merchant configuration before loading the collector', async () => {
    await expect(collectPaywayDeviceFingerprint()).rejects.toThrow('no está configurado');
    expect(document.head.querySelector('script')).toBeNull();
  });
});
