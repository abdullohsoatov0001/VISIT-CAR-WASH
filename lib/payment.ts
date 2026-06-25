// Реквизиты компании для ручного перевода (Click/Payme/карта).
// ⚠️ ЗАМЕНИТЕ на реальные данные перед запуском в продакшн.
export const COMPANY_PAYMENT_DETAILS: Record<string, { label: string; value: string }> = {
  card:  { label: "Карта Humo/Uzcard", value: "0000 0000 0000 0000" },
  click: { label: "Click номер",       value: "+998 90 000 00 00" },
  payme: { label: "Payme номер",       value: "+998 90 000 00 00" },
};

export const MANUAL_PAYMENT_METHODS = ["card", "click", "payme"];
