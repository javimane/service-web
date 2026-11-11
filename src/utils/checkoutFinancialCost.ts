/** Annualizes the actual purchase cash flows using equal monthly payments (30/360). */
export function calculateCheckoutCftea(
  cashAmount: number,
  totalAmount: number,
  installments: number,
): number | null {
  if (!Number.isFinite(cashAmount) || !Number.isFinite(totalAmount) ||
    cashAmount <= 0 || totalAmount < cashAmount ||
    !Number.isInteger(installments) || installments < 1 || installments > 120) return null;
  if (totalAmount === cashAmount) return 0;

  const payment = totalAmount / installments;
  const presentValue = (rate: number) => {
    let value = 0;
    for (let month = 1; month <= installments; month++) {
      value += payment / Math.pow(1 + rate, month);
    }
    return value;
  };
  let low = 0;
  let high = 1;
  while (presentValue(high) > cashAmount && high < 1024) high *= 2;
  if (presentValue(high) > cashAmount) return null;
  for (let iteration = 0; iteration < 80; iteration++) {
    const middle = (low + high) / 2;
    if (presentValue(middle) > cashAmount) low = middle;
    else high = middle;
  }
  const annualRate = Math.expm1(12 * Math.log1p((low + high) / 2)) * 100;
  return Number.isFinite(annualRate) ? annualRate : null;
}
