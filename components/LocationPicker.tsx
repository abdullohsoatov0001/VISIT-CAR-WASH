"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, Navigation, Loader2 } from "lucide-react";
import { getClientCoords } from "@/lib/geo";

export type PickedLocation = { lat: number; lng: number; address: string };

const TASHKENT_CENTER: [number, number] = [41.2995, 69.2401];

const pinIcon = L.divIcon({
  className: "",
  html: `<svg width="32" height="32" viewBox="0 0 24 24" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35))">
    <path d="M12 1.5C7.31 1.5 3.5 5.31 3.5 10c0 6 7.11 12.06 7.41 12.31a1.6 1.6 0 0 0 2.18 0C13.39 22.06 20.5 16 20.5 10c0-4.69-3.81-8.5-8.5-8.5z" fill="#0EA5E9" stroke="white" stroke-width="1.5"/>
    <circle cx="12" cy="10" r="3.2" fill="white"/>
  </svg>`,
  iconSize: [32, 32],
  iconAnchor: [16, 30],
});

// Бесплатный геокодинг через публичный Nominatim (OpenStreetMap) — без API-ключа,
// как и OSRM для маршрутов в навигации. Подходит для MVP/низкой нагрузки.
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
    const data = await res.json();
    return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

async function searchAddress(query: string): Promise<PickedLocation[]> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=5&countrycodes=uz`);
    const data = await res.json();
    return (data as { lat: string; lon: string; display_name: string }[]).map((d) => ({
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
      address: d.display_name,
    }));
  } catch {
    return [];
  }
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [lat, lng]);
  return null;
}

export default function LocationPicker({
  value,
  onChange,
}: {
  value: PickedLocation | null;
  onChange: (loc: PickedLocation) => void;
}) {
  const [query, setQuery] = useState(value?.address ?? "");
  const [suggestions, setSuggestions] = useState<PickedLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setQuery(value?.address ?? "");
  }, [value?.address]);

  const handleQueryChange = (v: string) => {
    setQuery(v);
    clearTimeout(debounceRef.current);
    if (v.trim().length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchAddress(v);
      setSuggestions(results);
      setShowSuggestions(true);
      setSearching(false);
    }, 400);
  };

  const pick = async (lat: number, lng: number, knownAddress?: string) => {
    setShowSuggestions(false);
    const address = knownAddress ?? await reverseGeocode(lat, lng);
    onChange({ lat, lng, address });
  };

  const useMyLocation = async () => {
    setLocating(true);
    const coords = await getClientCoords();
    setLocating(false);
    if (!coords) { alert("Не удалось определить ваше местоположение. Разрешите доступ к геолокации."); return; }
    pick(coords.lat, coords.lng);
  };

  const center = value ? [value.lat, value.lng] as [number, number] : TASHKENT_CENTER;

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-[400]" />
        <input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Введите адрес..."
          className="w-full h-12 pl-10 pr-10 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 transition-all shadow-sm"
        />
        {searching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 animate-spin" />}

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-[500] top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => pick(s.lat, s.lng, s.address)} type="button"
                className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                {s.address}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-48 rounded-2xl border border-slate-200 overflow-hidden relative">
        <MapContainer center={center} zoom={value ? 15 : 12} style={{ height: "100%", width: "100%" }} zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains={["a", "b", "c", "d"]}
          />
          <ClickHandler onPick={(lat, lng) => pick(lat, lng)} />
          {value && <FlyTo lat={value.lat} lng={value.lng} />}
          {value && <Marker position={[value.lat, value.lng]} icon={pinIcon} />}
        </MapContainer>

        <button onClick={useMyLocation} disabled={locating} type="button"
          className="absolute bottom-3 right-3 z-[500] w-10 h-10 rounded-xl bg-white shadow-lg border border-slate-200 flex items-center justify-center text-brand-blue hover:bg-slate-50 transition-all disabled:opacity-60">
          {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
        </button>

        {!value && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 pointer-events-none z-[400]">
            <div className="text-xs text-slate-500 font-semibold bg-white/95 px-3 py-1.5 rounded-lg shadow-sm">
              Нажмите на карту, чтобы выбрать место
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
