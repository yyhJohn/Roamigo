import { useCallback, useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface PinnedStop {
  id: string;
  orderLabel: string;
  dayNumber: number;
  title: string;
  locationName: string | null;
  lat: number;
  lng: number;
  coordSource: string;
}

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export function useMapLibreRoute(
  pins: PinnedStop[],
  selectedActivityId: string | null,
  onSelectActivity: (activityId: string) => void,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [webglReady, setWebglReady] = useState(true);

  const fitAllPins = useCallback(() => {
    const map = mapRef.current;
    if (!map || pins.length === 0) return;
    if (pins.length === 1) {
      map.flyTo({ center: [pins[0].lng, pins[0].lat], zoom: 14, duration: 400 });
      return;
    }
    const bounds = new maplibregl.LngLatBounds();
    for (const p of pins) bounds.extend([p.lng, p.lat]);
    map.fitBounds(bounds, { padding: 44, maxZoom: 15, duration: 400 });
  }, [pins]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    try {
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: STYLE_URL,
        center: pins[0] ? [pins[0].lng, pins[0].lat] : [2.1734, 41.3851],
        zoom: 12.5,
      });
      map.addControl(new maplibregl.NavigationControl(), 'top-right');
      mapRef.current = map;
    } catch {
      setWebglReady(false);
    }
    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    for (const pin of pins) {
      const el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('data-testid', `map-marker-${pin.id}`);
      el.setAttribute('aria-label', `Map pin ${pin.orderLabel}: ${pin.title}`);
      const active = pin.id === selectedActivityId;
      el.className = `flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow transition ${
        active
          ? 'scale-110 bg-[#A7F3CF] text-[#103D3B] ring-2 ring-[#103D3B]'
          : 'bg-[#103D3B] text-white'
      }`;
      el.textContent = pin.orderLabel;
      el.addEventListener('click', () => {
        onSelectActivity(pin.id);
        document
          .getElementById(`workspace-activity-${pin.id}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });

      const popup = new maplibregl.Popup({ offset: 18 }).setText(
        `Day ${pin.dayNumber}: ${pin.title}`,
      );
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([pin.lng, pin.lat])
        .setPopup(popup)
        .addTo(map);
      markersRef.current.push(marker);
    }
    fitAllPins();
  }, [pins, selectedActivityId, onSelectActivity, fitAllPins]);

  useEffect(() => {
    if (!selectedActivityId || !mapRef.current) return;
    const match = pins.find((p) => p.id === selectedActivityId);
    if (match) {
      mapRef.current.flyTo({
        center: [match.lng, match.lat],
        zoom: Math.max(mapRef.current.getZoom(), 14),
        duration: 400,
      });
    }
  }, [selectedActivityId, pins]);

  return { containerRef, webglReady, fitAllPins };
}
