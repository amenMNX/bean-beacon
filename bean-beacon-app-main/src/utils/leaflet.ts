import L from "leaflet";
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerIconShadowPng from "leaflet/dist/images/marker-shadow.png";

// Fix default marker icon issue in Leaflet
const defaultIcon = L.icon({
  iconUrl: markerIconPng,
  shadowUrl: markerIconShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.setIcon(defaultIcon);

export { defaultIcon };
