"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-rotate";
import "leaflet-polylinedecorator";
import { X, ExternalLink, Navigation2, Car, Phone } from "lucide-react";
import { distanceKm } from "@/lib/geo";
import { playArrivalChime } from "@/lib/sound";
import { speak, maneuverText } from "@/lib/speech";

type Point = { lat: number; lng: number };
type RouteInstruction = { type: string; distance: number; road?: string; index: number };
type MapWithBearing = L.Map & { setBearing?: (deg: number) => void; getBearing?: () => number };

function carIconHtml(rotation: number) {
  return `<div style="width:42px;height:42px;display:flex;align-items:center;justify-content:center;transform:rotate(${rotation}deg)">
    <svg width="40" height="40" viewBox="0 0 24 24">
      <circle cx="12" cy="13" r="10" fill="#0EA5E9" opacity="0.16"/>
      <rect x="7.6" y="3.4" width="8.8" height="16.2" rx="4" fill="#0F172A" stroke="white" stroke-width="1.4"/>
      <rect x="9.2" y="6.1" width="5.6" height="3.6" rx="1.1" fill="#0EA5E9"/>
      <rect x="9.2" y="11.2" width="5.6" height="2.6" rx="0.9" fill="#64748B"/>
      <rect x="8.6" y="15.3" width="6.8" height="2.4" rx="0.8" fill="#64748B"/>
    </svg>
  </div>`;
}

function carIcon(rotation: number) {
  return L.divIcon({ className: "", html: carIconHtml(rotation), iconSize: [42, 42], iconAnchor: [21, 21] });
}

const destIcon = L.divIcon({
  className: "",
  html: `<svg width="32" height="32" viewBox="0 0 24 24" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35))">
    <path d="M12 1.5C7.31 1.5 3.5 5.31 3.5 10c0 6 7.11 12.06 7.41 12.31a1.6 1.6 0 0 0 2.18 0C13.39 22.06 20.5 16 20.5 10c0-4.69-3.81-8.5-8.5-8.5z" fill="#8B5CF6" stroke="white" stroke-width="1.5"/>
    <circle cx="12" cy="10" r="3.2" fill="white"/>
  </svg>`,
  iconSize: [32, 32],
  iconAnchor: [16, 30],
});

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpAngle(a: number, b: number, t: number) {
  const diff = ((((b - a) % 360) + 540) % 360) - 180;
  return a + diff * t;
}

function RoutingLayer({
  worker, destination, onRoute,
}: {
  worker: Point;
  destination?: Point;
  onRoute: (km: number, mins: number, instructions: RouteInstruction[], coords: L.LatLng[]) => void;
}) {
  const map = useMap();
  const controlRef = useRef<L.Routing.Control | null>(null);
  const lastRouteCalcRef = useRef<{ lat: number; lng: number; time: number } | null>(null);

  useEffect(() => {
    if (!destination) return;

    if (!controlRef.current) {
      controlRef.current = L.Routing.control({
        waypoints: [L.latLng(worker.lat, worker.lng), L.latLng(destination.lat, destination.lng)],
        router: L.Routing.osrmv1({ serviceUrl: "https://router.project-osrm.org/route/v1" }),
        lineOptions: {
          styles: [
            { color: "#ffffff", weight: 9, opacity: 0.9 },
            { color: "#0EA5E9", weight: 5, opacity: 1 },
          ],
          extendToWaypoints: true,
          missingRouteTolerance: 0,
        },
        createMarker: () => false,
        addWaypoints: false,
        fitSelectedRoutes: false,
        show: false,
      } as L.Routing.RoutingControlOptions)
        .on("routesfound", (e: { routes: { summary: { totalDistance: number; totalTime: number }; instructions: RouteInstruction[]; coordinates: L.LatLng[] }[] }) => {
          const r = e.routes[0];
          if (r) onRoute(r.summary.totalDistance / 1000, Math.round(r.summary.totalTime / 60), r.instructions ?? [], r.coordinates ?? []);
        })
        .addTo(map);
    } else {
      controlRef.current.setWaypoints([L.latLng(worker.lat, worker.lng), L.latLng(destination.lat, destination.lng)]);
    }

    return () => {
      if (controlRef.current) {
        map.removeControl(controlRef.current);
        controlRef.current = null;
      }
    };
  }, [destination?.lat, destination?.lng]);

  useEffect(() => {
    if (!controlRef.current || !destination) return;

    // Маркер двигаем мгновенно каждый GPS-тик, а пересчёт маршрута через
    // публичный OSRM делаем не чаще раза в 4 сек или при заметном смещении —
    // иначе каждое обновление GPS бьёт по серверу и карта дёргается/лагает
    const last = lastRouteCalcRef.current;
    const now = Date.now();
    const movedKm = last ? distanceKm(worker.lat, worker.lng, last.lat, last.lng) : Infinity;
    if (last && now - last.time < 4000 && movedKm < 0.02) return;

    lastRouteCalcRef.current = { lat: worker.lat, lng: worker.lng, time: now };
    controlRef.current.setWaypoints([L.latLng(worker.lat, worker.lng), L.latLng(destination.lat, destination.lng)]);
  }, [worker.lat, worker.lng]);

  return null;
}

function RouteArrows({ coords }: { coords: L.LatLng[] }) {
  const map = useMap();
  const decoratorRef = useRef<L.PolylineDecorator | null>(null);

  useEffect(() => {
    if (decoratorRef.current) {
      map.removeLayer(decoratorRef.current);
      decoratorRef.current = null;
    }
    if (coords.length < 2) return;

    decoratorRef.current = L.polylineDecorator(L.polyline(coords), {
      patterns: [{
        offset: 15,
        repeat: 60,
        symbol: L.Symbol.arrowHead({
          pixelSize: 9,
          polygon: true,
          pathOptions: { color: "#ffffff", fillOpacity: 1, weight: 0 },
        }),
      }],
    }).addTo(map);

    return () => {
      if (decoratorRef.current) {
        map.removeLayer(decoratorRef.current);
        decoratorRef.current = null;
      }
    };
  }, [coords]);

  return null;
}

/**
 * Ведёт машинку и камеру через requestAnimationFrame-цикл со сглаживанием (lerp),
 * полностью развязывая частоту GPS-тиков (1 раз/сек у реального чипа) от частоты
 * перерисовки (60 кадров/сек) — отсюда плавность без рывков и "замыканий".
 * В режиме headingUp карта вращается по курсу и камера смещена вперёд (3-е лицо, не с неба).
 */
function SmoothDriver({
  point, heading, speed, headingUp, zoom,
}: {
  point: Point;
  heading: number | null;
  speed: number | null;
  headingUp: boolean;
  zoom: number;
}) {
  const map = useMap() as MapWithBearing;
  const markerRef = useRef<L.Marker | null>(null);
  const stateRef = useRef({ lat: point.lat, lng: point.lng, bearing: 0 });
  const targetRef = useRef({ lat: point.lat, lng: point.lng, heading, speed });
  const initRef = useRef(false);

  useEffect(() => {
    targetRef.current = { lat: point.lat, lng: point.lng, heading, speed };
  }, [point.lat, point.lng, heading, speed]);

  useEffect(() => {
    if (!initRef.current) {
      stateRef.current = { lat: point.lat, lng: point.lng, bearing: headingUp ? heading ?? 0 : 0 };
      map.setView([point.lat, point.lng], zoom, { animate: false });
      initRef.current = true;
    }

    markerRef.current = L.marker([stateRef.current.lat, stateRef.current.lng], {
      icon: carIcon(headingUp ? 0 : heading ?? 0),
    }).addTo(map);

    let rafId: number;

    function tick() {
      const s = stateRef.current;
      const t = targetRef.current;

      s.lat = lerp(s.lat, t.lat, 0.18);
      s.lng = lerp(s.lng, t.lng, 0.18);

      // Вращаем карту по курсу только когда реально едем — на месте GPS heading "дёргается"
      const movingFast = (t.speed ?? 0) > 1.5;
      if (headingUp) {
        const targetBearing = movingFast && t.heading != null ? t.heading : s.bearing;
        s.bearing = lerpAngle(s.bearing, targetBearing, 0.12);
        if (typeof map.setBearing === "function") map.setBearing(s.bearing);
      }

      if (markerRef.current) {
        markerRef.current.setLatLng([s.lat, s.lng]);
        if (!headingUp) {
          markerRef.current.setIcon(carIcon(t.heading ?? 0));
        }
      }

      // Камера "позади" машины — сдвигаем центр вперёд по курсу
      const containerPoint = map.latLngToContainerPoint([s.lat, s.lng]);
      const offsetY = headingUp ? -map.getSize().y * 0.25 : 0;
      const center = map.containerPointToLatLng(containerPoint.add(L.point(0, offsetY)));
      map.setView(center, map.getZoom(), { animate: false });

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      if (markerRef.current) map.removeLayer(markerRef.current);
    };
  }, [headingUp]);

  return null;
}

const STALE_AFTER_SEC = 90;

export default function NavigationView({
  worker,
  destination,
  title,
  subtitle,
  speed,
  heading,
  updatedAt,
  phone,
  trackSelf = false,
  onClose,
  onArrive,
}: {
  worker: Point;
  destination?: Point;
  title: string;
  subtitle?: string;
  speed?: number | null;
  heading?: number | null;
  updatedAt?: string | null;
  phone?: string | null;
  trackSelf?: boolean;
  onClose: () => void;
  onArrive?: () => void;
}) {
  const [route, setRoute] = useState<{ km: number; mins: number } | null>(null);
  const [instructions, setInstructions] = useState<RouteInstruction[]>([]);
  const [routeCoords, setRouteCoords] = useState<L.LatLng[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [livePos, setLivePos] = useState<Point>(worker);
  const [liveSpeed, setLiveSpeed] = useState<number | null>(null);
  const [liveHeading, setLiveHeading] = useState<number | null>(null);
  const arrivedRef = useRef(false);
  const spokenStepRef = useRef(-1);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (trackSelf || !updatedAt) return;
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, [trackSelf, updatedAt]);

  // На странице мойщика — собственный живой GPS без задержки на БД/Realtime
  useEffect(() => {
    if (!trackSelf || !("geolocation" in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLivePos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLiveSpeed(pos.coords.speed != null ? pos.coords.speed * 3.6 : null);
        setLiveHeading(pos.coords.heading);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 500, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [trackSelf]);

  const currentPos = trackSelf ? livePos : worker;
  const currentSpeed = trackSelf ? liveSpeed : speed ?? null;
  const currentHeading = trackSelf ? liveHeading : heading ?? null;

  const ageSec = !trackSelf && updatedAt ? Math.max(0, Math.round((now - new Date(updatedAt).getTime()) / 1000)) : null;
  const isStale = ageSec != null && ageSec > STALE_AFTER_SEC;
  const ageLabel = ageSec == null ? null
    : ageSec < 60 ? `${ageSec} сек назад`
    : ageSec < 3600 ? `${Math.round(ageSec / 60)} мин назад`
    : `${Math.round(ageSec / 3600)} ч назад`;

  // Звук + голос прибытия
  useEffect(() => {
    if (!destination || arrivedRef.current) return;
    const km = distanceKm(currentPos.lat, currentPos.lng, destination.lat, destination.lng);
    if (km < 0.05) {
      arrivedRef.current = true;
      playArrivalChime();
      if (trackSelf) speak("Вы прибыли к месту назначения");
      if (onArrive) setTimeout(onArrive, 1800);
    }
  }, [currentPos.lat, currentPos.lng, destination?.lat, destination?.lng, trackSelf, onArrive]);

  // Текущий шаг маршрута (поворот направо/налево/и т.д.)
  useEffect(() => {
    if (instructions.length === 0 || routeCoords.length === 0) return;
    let idx = stepIndex;
    while (idx < instructions.length - 1) {
      const pt = routeCoords[instructions[idx].index];
      if (!pt) break;
      const d = distanceKm(currentPos.lat, currentPos.lng, pt.lat, pt.lng);
      if (d < 0.03) idx++;
      else break;
    }
    if (idx !== stepIndex) setStepIndex(idx);
  }, [currentPos.lat, currentPos.lng, instructions, routeCoords, stepIndex]);

  const activeInstruction = instructions[stepIndex];
  const activeInstructionPoint = activeInstruction ? routeCoords[activeInstruction.index] : undefined;
  const distanceToStep = activeInstructionPoint
    ? distanceKm(currentPos.lat, currentPos.lng, activeInstructionPoint.lat, activeInstructionPoint.lng)
    : null;

  useEffect(() => {
    if (!trackSelf || !activeInstruction) return;
    if (spokenStepRef.current === stepIndex) return;
    spokenStepRef.current = stepIndex;
    speak(maneuverText(activeInstruction.type, activeInstruction.road));
  }, [stepIndex, trackSelf, activeInstruction]);

  const externalMapsUrl = destination
    ? `https://www.google.com/maps/dir/?api=1&origin=${currentPos.lat},${currentPos.lng}&destination=${destination.lat},${destination.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${currentPos.lat},${currentPos.lng}`;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-200 shadow-sm flex-shrink-0 z-[600] relative">
        <div className="min-w-0">
          <div className="font-bold text-slate-900 text-sm truncate">{title}</div>
          {subtitle && <div className="text-xs text-slate-400 truncate">{subtitle}</div>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {phone && (
            <a href={`tel:${phone}`}
              className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-all">
              <Phone className="w-4 h-4" />
            </a>
          )}
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        {/* Баннер маневра — только для самого водителя (мойщика), клиенту повороты не нужны */}
        <AnimatePresence>
          {trackSelf && activeInstruction && (
            <motion.div key={stepIndex} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute top-3 left-3 right-3 z-[1000] bg-slate-900 text-white rounded-2xl px-4 py-3.5 shadow-2xl flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-brand-blue flex items-center justify-center flex-shrink-0 shadow-lg">
                <Navigation2 className="w-6 h-6 text-white"
                  style={{ transform: `rotate(${
                    activeInstruction.type === "Left" || activeInstruction.type === "SharpLeft" || activeInstruction.type === "SlightLeft" ? -45 :
                    activeInstruction.type === "Right" || activeInstruction.type === "SharpRight" || activeInstruction.type === "SlightRight" ? 45 : 0
                  }deg)` }} />
              </div>
              <div className="min-w-0">
                <div className="text-base font-bold truncate">{maneuverText(activeInstruction.type, activeInstruction.road)}</div>
                {distanceToStep != null && (
                  <div className="text-xs text-white/60 mt-0.5">
                    {distanceToStep < 1 ? `через ${Math.round(distanceToStep * 1000)} м` : `через ${distanceToStep.toFixed(1)} км`}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Для клиента — простой статус "мойщик в пути" с ETA, без терминов навигации */}
        <AnimatePresence>
          {!trackSelf && route && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className={`absolute top-3 left-3 right-3 z-[1000] text-white rounded-2xl px-4 py-3.5 shadow-2xl flex items-center gap-3.5 ${isStale ? "bg-amber-600" : "bg-slate-900"}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${isStale ? "bg-amber-400" : "bg-emerald-500"}`}>
                <Car className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-base font-bold truncate">{isStale ? "Связь с мойщиком прервалась" : title}</div>
                <div className="text-xs text-white/70 mt-0.5">
                  {isStale
                    ? `Последние данные — ${ageLabel}. Точка на карте может быть неактуальна.`
                    : `Будет у вас через ~${route.mins} мин · ${route.km < 1 ? `${Math.round(route.km * 1000)} м` : `${route.km.toFixed(1)} км`}`}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <MapContainer
          center={[currentPos.lat, currentPos.lng]}
          zoom={trackSelf ? 18 : 16}
          style={{ height: "100%", width: "100%" }}
          zoomControl={!trackSelf}
          {...({ rotate: trackSelf, rotateControl: false, bearing: 0 } as Record<string, unknown>)}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains={["a", "b", "c", "d"]}
          />
          {destination && <Marker position={[destination.lat, destination.lng]} icon={destIcon} />}
          <RoutingLayer worker={currentPos} destination={destination} onRoute={(km, mins, instr, coords) => {
            setRoute({ km, mins });
            setInstructions(instr);
            setRouteCoords(coords);
          }} />
          {routeCoords.length > 1 && <RouteArrows coords={routeCoords} />}
          <SmoothDriver point={currentPos} heading={currentHeading} speed={currentSpeed} headingUp={trackSelf} zoom={trackSelf ? 18 : 16} />
        </MapContainer>

        {/* Спидометр-циферблат */}
        <div className="absolute bottom-3 left-3 z-[1000] w-[72px] h-[72px] rounded-full bg-white shadow-xl border-[3px] border-slate-900 flex flex-col items-center justify-center">
          <div className="text-2xl font-black text-slate-900 leading-none">{currentSpeed != null ? Math.round(currentSpeed) : "—"}</div>
          <div className="text-[8px] text-slate-400 uppercase tracking-wider leading-none mt-0.5">km/h</div>
        </div>

        {/* Индикатор севера (в режиме "по курсу" карта вращается, поэтому показываем где сейчас север) */}
        {trackSelf && (
          <div className="absolute top-3 right-3 z-[1000] w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border border-slate-200">
            <div className="text-[10px] font-black text-red-500" style={{ transform: `rotate(${-(currentHeading ?? 0)}deg)` }}>N</div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between gap-4 flex-shrink-0">
        {route ? (
          <div className="flex items-center gap-4">
            <div>
              <div className="text-lg font-black text-brand-blue leading-none">
                {(() => {
                  const eta = new Date(Date.now() + route.mins * 60000);
                  return eta.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
                })()}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">прибытие</div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <div className="text-sm font-bold text-slate-900 leading-none">~{route.mins} мин</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{route.km < 1 ? `${Math.round(route.km * 1000)} м` : `${route.km.toFixed(1)} км`}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-400">Строим маршрут…</div>
        )}
        <a href={externalMapsUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-brand-blue bg-brand-blue/10 border border-brand-blue/20 px-3 py-2 rounded-xl hover:bg-brand-blue/15 transition-all flex-shrink-0">
          <ExternalLink className="w-3.5 h-3.5" /> Google Maps
        </a>
      </div>
    </div>
  );
}
