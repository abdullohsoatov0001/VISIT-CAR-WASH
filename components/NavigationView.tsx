"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-rotate";
import { X, ExternalLink, Navigation2 } from "lucide-react";
import { distanceKm } from "@/lib/geo";
import { playArrivalChime } from "@/lib/sound";
import { speak, maneuverText } from "@/lib/speech";

type Point = { lat: number; lng: number };
type RouteInstruction = { type: string; distance: number; road?: string; index: number };

function carIcon(heading: number | null, headingUp: boolean) {
  const rotation = headingUp ? 0 : heading ?? 0;
  return L.divIcon({
    className: "",
    html: `<div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;transform:rotate(${rotation}deg);transition:transform 0.15s linear">
      <div style="width:34px;height:34px;border-radius:50%;background:#0EA5E9;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:16px">
        ${heading != null ? "⬆️" : "🚗"}
      </div>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

const destIcon = L.divIcon({
  className: "",
  html: `<div style="width:34px;height:34px;border-radius:50%;background:#8B5CF6;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:17px">📍</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

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
    if (!destination) {
      map.setView([worker.lat, worker.lng], 16);
      return;
    }

    if (!controlRef.current) {
      controlRef.current = L.Routing.control({
        waypoints: [L.latLng(worker.lat, worker.lng), L.latLng(destination.lat, destination.lng)],
        router: L.Routing.osrmv1({ serviceUrl: "https://router.project-osrm.org/route/v1" }),
        lineOptions: { styles: [{ color: "#0EA5E9", weight: 5, opacity: 0.85 }], extendToWaypoints: true, missingRouteTolerance: 0 },
        createMarker: () => false,
        addWaypoints: false,
        fitSelectedRoutes: true,
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

    // Маркер мойщика двигаем мгновенно каждый GPS-тик, а пересчёт маршрута
    // через публичный OSRM делаем не чаще раза в 4 сек или при заметном смещении —
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

type MapWithBearing = L.Map & { setBearing?: (deg: number) => void };

function ChaseCamera({ point, heading, headingUp }: { point: Point; heading: number | null; headingUp: boolean }) {
  const map = useMap() as MapWithBearing;

  useEffect(() => {
    if (headingUp && heading != null && typeof map.setBearing === "function") {
      map.setBearing(heading);
    }

    if (headingUp) {
      // Камера "позади" машины — сдвигаем центр вперёд по курсу, чтобы дороги впереди было видно больше
      const containerPoint = map.latLngToContainerPoint([point.lat, point.lng]);
      const shifted = containerPoint.add(L.point(0, -map.getSize().y * 0.22));
      const target = map.containerPointToLatLng(shifted);
      map.panTo(target, { animate: true, duration: 0.25, easeLinearity: 0.4 });
    } else {
      map.panTo([point.lat, point.lng], { animate: true, duration: 0.3, easeLinearity: 0.4 });
    }
  }, [point.lat, point.lng, heading, headingUp]);

  return null;
}

export default function NavigationView({
  worker,
  destination,
  title,
  subtitle,
  speed,
  heading,
  trackSelf = false,
  onClose,
}: {
  worker: Point;
  destination?: Point;
  title: string;
  subtitle?: string;
  speed?: number | null;
  heading?: number | null;
  trackSelf?: boolean;
  onClose: () => void;
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

  // Звук + голос прибытия
  useEffect(() => {
    if (!destination || arrivedRef.current) return;
    const km = distanceKm(currentPos.lat, currentPos.lng, destination.lat, destination.lng);
    if (km < 0.05) {
      arrivedRef.current = true;
      playArrivalChime();
      if (trackSelf) speak("Вы прибыли к месту назначения");
    }
  }, [currentPos.lat, currentPos.lng, destination?.lat, destination?.lng, trackSelf]);

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
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 relative">
        {/* Баннер маневра */}
        {activeInstruction && (
          <div className="absolute top-3 left-3 right-3 z-[1000] bg-slate-900 text-white rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-blue/20 flex items-center justify-center flex-shrink-0">
              <Navigation2 className="w-4 h-4 text-brand-blue"
                style={{ transform: `rotate(${
                  activeInstruction.type === "Left" || activeInstruction.type === "SharpLeft" || activeInstruction.type === "SlightLeft" ? -45 :
                  activeInstruction.type === "Right" || activeInstruction.type === "SharpRight" || activeInstruction.type === "SlightRight" ? 45 : 0
                }deg)` }} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{maneuverText(activeInstruction.type, activeInstruction.road)}</div>
              {distanceToStep != null && (
                <div className="text-xs text-white/60">
                  {distanceToStep < 1 ? `через ${Math.round(distanceToStep * 1000)} м` : `через ${distanceToStep.toFixed(1)} км`}
                </div>
              )}
            </div>
          </div>
        )}

        <MapContainer
          center={[currentPos.lat, currentPos.lng]}
          zoom={16}
          style={{ height: "100%", width: "100%" }}
          zoomControl={!trackSelf}
          {...({ rotate: trackSelf, rotateControl: false, bearing: 0 } as Record<string, unknown>)}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains={["a", "b", "c", "d"]}
          />
          <Marker position={[currentPos.lat, currentPos.lng]} icon={carIcon(currentHeading, trackSelf)} />
          {destination && <Marker position={[destination.lat, destination.lng]} icon={destIcon} />}
          <RoutingLayer worker={currentPos} destination={destination} onRoute={(km, mins, instr, coords) => {
            setRoute({ km, mins });
            setInstructions(instr);
            setRouteCoords(coords);
          }} />
          <ChaseCamera point={currentPos} heading={currentHeading} headingUp={trackSelf} />
        </MapContainer>

        {/* Спидометр */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 text-white rounded-2xl px-4 py-2.5 shadow-lg backdrop-blur-sm">
          <div className="text-3xl font-black leading-none">{currentSpeed != null ? Math.round(currentSpeed) : "—"}</div>
          <div className="text-[9px] text-white/60 uppercase tracking-wider leading-none mt-0.5">km/h</div>
        </div>

        {/* Индикатор севера (в режиме "по курсу" карта вращается, поэтому показываем где сейчас север) */}
        {trackSelf && (
          <div className="absolute top-3 right-3 z-[1000] w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border border-slate-200">
            <div className="text-[10px] font-black text-red-500" style={{ transform: `rotate(${-(currentHeading ?? 0)}deg)` }}>N</div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between gap-3 flex-shrink-0">
        <div>
          {route ? (
            <div className="text-sm font-bold text-slate-900">
              {route.km < 1 ? `${Math.round(route.km * 1000)} м` : `${route.km.toFixed(1)} км`}
              <span className="text-brand-blue"> · ~{route.mins} мин</span>
            </div>
          ) : (
            <div className="text-sm text-slate-400">Строим маршрут…</div>
          )}
        </div>
        <a href={externalMapsUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-brand-blue bg-brand-blue/10 border border-brand-blue/20 px-3 py-2 rounded-xl hover:bg-brand-blue/15 transition-all">
          <ExternalLink className="w-3.5 h-3.5" /> Google Maps
        </a>
      </div>
    </div>
  );
}
