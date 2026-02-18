import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import "@/utils/leaflet";

interface MapProps {
  latitude: number;
  longitude: number;
  cafes: any[];
  selectedCafeId?: string;
  onMarkerClick: (cafeId: string) => void;
  isLoading?: boolean;
}

export const CafeMap = ({
  latitude,
  longitude,
  cafes,
  selectedCafeId,
  onMarkerClick,
  isLoading,
}: MapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("cafe-map").setView([latitude, longitude], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(mapRef.current);
    }

    // Update map view
    if (mapRef.current) {
      mapRef.current.setView([latitude, longitude], 13);
    }
  }, [latitude, longitude]);

  // Update markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add user location marker
    const userMarker = L.marker([latitude, longitude], {
      icon: L.icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
    }).addTo(mapRef.current);
    userMarker.bindPopup("<b>Your Location</b>");
    markersRef.current.push(userMarker);

    // Add cafe markers
    cafes.forEach((cafe) => {
      const isSelected = cafe._id === selectedCafeId;
      const marker = L.marker(
        [cafe.location.coordinates[1], cafe.location.coordinates[0]],
        {
          icon: L.icon({
            iconUrl: isSelected
              ? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png"
              : "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          }),
        }
      ).addTo(mapRef.current);

      marker.bindPopup(`<b>${cafe.name}</b><br>${cafe.address}`);
      marker.on("click", () => onMarkerClick(cafe._id));

      markersRef.current.push(marker);
    });
  }, [cafes, latitude, longitude, selectedCafeId, onMarkerClick]);

  if (isLoading) {
    return (
      <Card className="w-full h-[600px] flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </Card>
    );
  }

  return <div id="cafe-map" className="w-full h-[600px] rounded-lg z-0" />;
};
