export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ru-RU";
  utter.rate = 1;
  window.speechSynthesis.speak(utter);
}

const MANEUVER_RU: Record<string, string> = {
  Head: "Начните движение",
  Continue: "Продолжайте движение",
  DestinationReached: "Вы прибыли к месту назначения",
  WaypointReached: "Промежуточная точка",
  Straight: "Двигайтесь прямо",
  SlightRight: "Держитесь правее",
  Right: "Поверните направо",
  SharpRight: "Резко поверните направо",
  Uturn: "Развернитесь",
  SharpLeft: "Резко поверните налево",
  Left: "Поверните налево",
  SlightLeft: "Держитесь левее",
  Roundabout: "Двигайтесь по кругу",
  Merge: "Перестройтесь",
  Fork: "Держитесь нужной полосы",
  OnRamp: "Выезжайте на трассу",
  OffRamp: "Съезжайте с трассы",
  EndOfRoad: "Поверните в конце дороги",
};

export function maneuverText(type: string, road?: string): string {
  const base = MANEUVER_RU[type] ?? "Продолжайте движение";
  if (road && type !== "DestinationReached" && type !== "Head") {
    return `${base} на ${road}`;
  }
  return base;
}
