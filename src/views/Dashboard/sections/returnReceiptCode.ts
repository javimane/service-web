const RETURN_CODE_PATTERN = /^(?:[0-9A-F]{10}|[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12})$/;

export function normalizeReturnReceiptCode(rawCode: string): string | null {
  const normalized = rawCode.trim().toUpperCase();
  return RETURN_CODE_PATTERN.test(normalized) ? normalized : null;
}
