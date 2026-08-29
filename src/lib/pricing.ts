export const FREE_ENTRY_COUNT = 10;
export const PAID_FIVE_ENTRY_COUNT = 50;
export const PRICE_FIVE_CENTS = 500;
export const PRICE_NINE_CENTS = 900;

export function priceCentsForConfirmedCount(confirmedCount: number): number {
  if (confirmedCount < FREE_ENTRY_COUNT) return 0;
  if (confirmedCount < FREE_ENTRY_COUNT + PAID_FIVE_ENTRY_COUNT) {
    return PRICE_FIVE_CENTS;
  }
  return PRICE_NINE_CENTS;
}

export function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(0)}`;
}
