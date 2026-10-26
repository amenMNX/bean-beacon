import { useEffect, useMemo, useRef, useState } from "react";
import type { CoffeeShop } from "@/data/shops";
import { mapsLink } from "@/components/CoffeeShopCard";

declare global {
  interface Window {
    google?: typeof google;
    __initCafeMap?: () => void;
  }
}

let loader: Promise<void> | null = null;
const loadMaps = () => {
  if (window.google?.maps) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise((resolve) => {
    window.__initCafeMap = () => resolve();
    const env = import.meta.env as Record<string, string>;
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"]}&loading=async&callback=__initCafeMap&channel=${env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"]}`;
    s.async = true;
    document.head.appendChild(s);
  });
  return loader;
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const CafeMap = ({ shops }: { shops: CoffeeShop[] }) => {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const markers = useRef<google.maps.Marker[]>([]);
  const [ready, setReady] = useState(false);
  const pinned = useMemo(() => shops.filter((s) => s.lat != null && s.lng != null), [shops]);

  useEffect(() => {
    loadMaps().then(() => {
      if (!el.current || map.current) return;
      map.current = new window.google.maps.Map(el.current, {
        center: { lat: 0, lng: 0 }, zoom: 2, clickableIcons: false,
        styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
      });
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    const g = window.google.maps;
    markers.current.forEach((m) => m.setMap(null));
    const info = new g.InfoWindow();
    const bounds = new g.LatLngBounds();
    markers.current = pinned.map((s) => {
      const m = new g.Marker({ position: { lat: s.lat, lng: s.lng }, map: map.current, title: s.name });
      bounds.extend(m.getPosition());
      m.addListener("click", () => {
        info.setContent(`<div style="max-width:220px"><strong>${esc(s.name)}</strong><p>${esc(s.address)}</p>${s.hours ? `<p style="white-space:pre-line">${esc(s.hours)}</p>` : ""}<a href="${mapsLink(s.name, s.address)}" target="_blank" rel="noopener noreferrer">Open in Google Maps</a>${s.isSample ? "" : ` · <a href="/cafe/${encodeURIComponent(s.id)}">View profile</a>`}</div>`);
        info.open({ map: map.current, anchor: m });
      });
      return m;
    });
    if (pinned.length === 1) { map.current.setCenter(bounds.getCenter()); map.current.setZoom(15); }
    else if (pinned.length > 1) map.current.fitBounds(bounds);
  }, [ready, pinned]);

  return (
    <div className="space-y-2">
      <div ref={el} className="h-[480px] w-full rounded-xl border border-border bg-muted" />
      {pinned.length === 0 && <p className="text-sm text-muted-foreground">No cafés match on the map yet. Cafés added on the Manage page get a pin from their address or coordinates.</p>}
    </div>
  );
};
