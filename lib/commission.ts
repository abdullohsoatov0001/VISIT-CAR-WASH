// Доля мойщика от суммы заказа — фиксируется на заказе в момент создания
// (см. orders.worker_earning), а не пересчитывается из service_type задним
// числом: service_type — локализованный текст и меняется вместе с языком,
// а цены тарифов могут меняться в будущем без пересчёта старых заказов.
// Цена теперь зависит от типа авто (Седан / Кроссовер / Минивэн), а не от
// тарифа мойки. Доля мойщика — фиксированные 50% для всех типов.
export const WORKER_SHARE: Record<string, number> = {
  express: 0.5,   // Седан
  premium: 0.5,   // Кроссовер
  detail: 0.5,    // Минивэн
};

export function workerSharePercent(serviceId: string): number {
  return (WORKER_SHARE[serviceId] ?? 0.5) * 100;
}

export function workerEarning(serviceId: string, totalPrice: number): number {
  const share = WORKER_SHARE[serviceId] ?? 0.5;
  return Math.round(totalPrice * share);
}
