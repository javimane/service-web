type FingerprintConfig = { organization_id: string; merchant_id: string };

// The session sent to Payway must be the one used by the real browser collector.
// Never manufacture a device ID without loading the collector for that session.
export async function collectPaywayDeviceFingerprint(config?: FingerprintConfig): Promise<string> {
  if (!config || !/^[A-Za-z0-9_-]{1,50}$/.test(config.organization_id) ||
      !/^[A-Za-z0-9_-]{1,50}$/.test(config.merchant_id)) {
    throw new Error('El sistema de validación del pago no está configurado. Contactá a soporte.');
  }
  const sessionId = crypto.randomUUID().replaceAll('-', '');
  const params = new URLSearchParams({ org_id: config.organization_id, session_id: config.merchant_id + sessionId });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://h.online-metrix.net/fp/tags.js?${params}`;
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('No se pudo validar el dispositivo. Revisá la conexión e intentá nuevamente.')), 15000);
      script.onload = () => { clearTimeout(timer); resolve(); };
      script.onerror = () => { clearTimeout(timer); reject(new Error('No se pudo validar el dispositivo. Revisá la conexión e intentá nuevamente.')); };
      document.head.appendChild(script);
    });
    // Loading tags.js starts profiling; leave time for its asynchronous collection.
    // Payway/Cybersource remains responsible for confirming reception and evaluating it.
    await new Promise(resolve => setTimeout(resolve, 5000));
    return sessionId;
  } finally {
    script.onload = null;
    script.onerror = null;
    script.remove();
  }
}
