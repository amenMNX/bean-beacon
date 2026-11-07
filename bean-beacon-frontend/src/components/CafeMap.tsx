import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { divIcon, type LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

import type { CoffeeShop } from "@/data/shops";
import { mapsLink } from "@/components/CoffeeShopCard";

type LocatedShop = CoffeeShop & {
  lat: number;
  lng: number;
};

type Position = [number, number];

const coffeeCupIcon = divIcon({
  className: "bean-beacon-coffee-marker",
  html: '<span aria-hidden="true">☕</span>',
  iconSize: [36, 36],
  iconAnchor: [18, 34],
  popupAnchor: [0, -34],
});

const userLocationIcon = divIcon({
  className: "bean-beacon-user-marker",
  html: '<span aria-hidden="true">●</span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -11],
});

const TUNISIA_BOUNDS: [[number, number], [number, number]] = [
  [30.0, 7.0],
  [37.6, 12.0],
];

const TUNISIA_CENTER: LatLngExpression = [34.0, 9.0];

const MapController = ({
  shops,
  userPosition,
}: {
  shops: LocatedShop[];
  userPosition: Position | null;
}) => {
  const map = useMap();

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    resizeObserver.observe(map.getContainer());

    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      resizeObserver.disconnect();
      window.clearTimeout(timer);
    };
  }, [map]);

  useEffect(() => {
    map.invalidateSize();

    if (userPosition) {
      map.setView(userPosition, 15);
      return;
    }

    if (shops.length === 0) {
      map.setView(TUNISIA_CENTER, 6);
      return;
    }

    if (shops.length === 1) {
      map.setView([shops[0].lat, shops[0].lng], 15);
      return;
    }

    map.fitBounds(
      shops.map((shop) => [shop.lat, shop.lng] as [number, number]),
      { padding: [40, 40] }
    );
  }, [map, shops, userPosition]);

  return null;
};

export const CafeMap = ({ shops }: { shops: CoffeeShop[] }) => {
  const [userPosition, setUserPosition] = useState<Position | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  const locatedShops = useMemo(
    () =>
      shops.filter(
        (shop): shop is LocatedShop =>
          typeof shop.lat === "number" &&
          typeof shop.lng === "number" &&
          shop.lat >= 30.0 &&
          shop.lat <= 37.6 &&
          shop.lng >= 7.0 &&
          shop.lng <= 12.0
      ),
    [shops]
  );

  const locateUser = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    setLocating(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition([
          position.coords.latitude,
          position.coords.longitude,
        ]);
        setLocating(false);
      },
      () => {
        setLocationError(
          "Location access failed. Please allow location permission."
        );
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={locateUser}
        disabled={locating}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
      >
        {locating ? "Finding your location..." : "Use my location"}
      </button>

      {locationError && (
        <p className="text-sm text-destructive">{locationError}</p>
      )}

      <MapContainer
        center={TUNISIA_CENTER}
        zoom={6}
        minZoom={6}
        maxZoom={18}
        maxBounds={TUNISIA_BOUNDS}
        maxBoundsViscosity={1}
        scrollWheelZoom
        className="h-[480px] w-full rounded-xl border border-border"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          shops={locatedShops}
          userPosition={userPosition}
        />

        {userPosition && (
          <Marker
            position={userPosition}
            icon={userLocationIcon}
          >
            <Popup>You are here</Popup>
          </Marker>
        )}

        {locatedShops.map((shop) => (
          <Marker
            key={shop.id}
            position={[shop.lat, shop.lng]}
            icon={coffeeCupIcon}
          >
            <Popup>
              <strong>{shop.name}</strong>
              <p>{shop.address}</p>

              {shop.distance && <p>{shop.distance} away</p>}

              <a
                href={mapsLink(shop.name, shop.address, shop.lat, shop.lng)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open directions
              </a>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
