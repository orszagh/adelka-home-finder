const priceFormat = new Intl.NumberFormat("sk-SK", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const dateFormat = new Intl.DateTimeFormat("sk-SK", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
});

export function formatPrice(price: number | null): string {
  return price === null ? "Cena na vyžiadanie" : priceFormat.format(price);
}

/** Compact label for map markers, e.g. "245k €". */
export function formatPriceShort(price: number | null): string {
  if (price === null) return "?";
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1).replace(".", ",")} mil. €`;
  return `${Math.round(price / 1000)}k €`;
}

export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

export function roomsLabel(rooms: number): string {
  if (rooms === 1) return "1 izba";
  if (rooms >= 2 && rooms <= 4) return `${rooms} izby`;
  return `${rooms} izieb`;
}
