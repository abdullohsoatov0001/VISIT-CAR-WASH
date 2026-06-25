// Дефолтные реквизиты компании — используются, пока админ не задал свои
// в /admin/settings (хранятся в app_settings.payment_*_number).
export const DEFAULT_PAYMENT_DETAILS: Record<string, { label: string; value: string }> = {
  card:  { label: "Карта Humo/Uzcard", value: "0000 0000 0000 0000" },
  click: { label: "Click номер",       value: "+998 90 000 00 00" },
  payme: { label: "Payme номер",       value: "+998 90 000 00 00" },
};

export const MANUAL_PAYMENT_METHODS = ["card", "click", "payme"];

export type AppPaymentSettings = {
  payment_card_number: string | null;
  payment_click_number: string | null;
  payment_payme_number: string | null;
};

export function buildPaymentDetails(settings: AppPaymentSettings | null): Record<string, { label: string; value: string }> {
  return {
    card:  { label: DEFAULT_PAYMENT_DETAILS.card.label,  value: settings?.payment_card_number  || DEFAULT_PAYMENT_DETAILS.card.value },
    click: { label: DEFAULT_PAYMENT_DETAILS.click.label, value: settings?.payment_click_number || DEFAULT_PAYMENT_DETAILS.click.value },
    payme: { label: DEFAULT_PAYMENT_DETAILS.payme.label, value: settings?.payment_payme_number || DEFAULT_PAYMENT_DETAILS.payme.value },
  };
}
