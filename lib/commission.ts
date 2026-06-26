// Доля мойщика от суммы заказа — фиксируется на заказе в момент создания
// (см. orders.worker_earning), а не пересчитывается из service_type задним
// числом: service_type — локализованный текст и меняется вместе с языком,
// а цены тарифов могут меняться в будущем без пересчёта старых заказов.
export const WORKER_SHARE: Record<string, number> = {
  express: 0.5,   // Standard
  premium: 0.45,  // Premium
  elite: 0.45,    // VIP (app/booking/page.tsx)
  detail: 0.45,   // VIP (Telegram — тот же тариф, другой id)
};

export function workerSharePercent(serviceId: string): number {
  return (WORKER_SHARE[serviceId] ?? 0.5) * 100;
}

export function workerEarning(serviceId: string, totalPrice: number): number {
  const share = WORKER_SHARE[serviceId] ?? 0.5;
  return Math.round(totalPrice * share);
}
