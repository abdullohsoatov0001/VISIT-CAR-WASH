"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { X, ExternalLink } from "lucide-react";

type Point = { lat: number; lng: number };

const workerIcon = L.divIcon({
  className: "",
  html: `<div style="width:38px;height:38px;border-radius:50%;background:#0EA5E9;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:19px">🚗</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

const destIcon = L.divIcon({
  className: "",
  html: `<div style="width:34px;height:34px;border-radius:50%;background:#8B5CF6;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:17px">📍</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

function RoutingLayer({ worker, destination, onRoute }: { worker: Point; destination?: Point; onRoute: (km: number, mins: number) => void }) {
  const map = useMap();
  const controlRef = useRef<L.Routing.Control | null>(null);

  useEffect(() => {
    if (!destination) {
      map.setView([worker.lat, worker.lng], 15);
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
        .on("routesfound", (e: { routes: { summary: { totalDistance: number; totalTime: number } }[] }) => {
          const r = e.routes[0];
          if (r) onRoute(r.summary.totalDistance / 1000, Math.round(r.summary.totalTime / 60));
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

  // Двигаем точку мойщика без пересчёта всего маршрута на каждый чих GPS
  useEffect(() => {
    if (controlRef.current && destination) {
      controlRef.current.setWaypoints([L.latLng(worker.lat, worker.lng), L.latLng(destination.lat, destination.lng)]);
    }
  }, [worker.lat, worker.lng]);

  return null;
}

export default function NavigationView({
  worker,
  destination,
  title,
  subtitle,
  onClose,
}: {
  worker: Point;
  destination?: Point;
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  const [route, setRoute] = useState<{ km: number; mins: number } | null>(null);

  const externalMapsUrl = destination
    ? `https://www.google.com/maps/dir/?api=1&origin=${worker.lat},${worker.lng}&destination=${destination.lat},${destination.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${worker.lat},${worker.lng}`;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shadow-sm flex-shrink-0">
        <div>
          <div className="font-bold text-slate-900 text-sm">{title}</div>
          {subtitle && <div className="text-xs text-slate-400">{subtitle}</div>}
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 relative">
        <MapContainer center={[worker.lat, worker.lng]} zoom={15} style={{ height: "100%", width: "100%" }} zoomControl={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[worker.lat, worker.lng]} icon={workerIcon} />
          {destination && <Marker position={[destination.lat, destination.lng]} icon={destIcon} />}
          <RoutingLayer worker={worker} destination={destination} onRoute={(km, mins) => setRoute({ km, mins })} />
        </MapContainer>
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
