import { useQuery } from "@tanstack/react-query";
import { cafesApi, resolveUploadUrl, type ApiCafe } from "@/lib/api";
import { coffeeShops, type CoffeeShop } from "@/data/shops";

const FALLBACK_PHOTO =
  "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&auto=format&fit=crop";

const distanceKm = (fromLat: number, fromLng: number, toLat: number, toLng: number) => {
  const earthRadiusKm = 6371;
  const dLat = ((toLat - fromLat) * Math.PI) / 180;
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((fromLat * Math.PI) / 180) *
      Math.cos((toLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const toShop = (c: ApiCafe, coords?: { lat: number; lng: number } | null): CoffeeShop => {
  const lat = c.location?.coordinates?.[1];
  const lng = c.location?.coordinates?.[0];
  const calculatedDistanceKm =
    coords && lat !== undefined && lng !== undefined
      ? distanceKm(coords.lat, coords.lng, lat, lng)
      : undefined;
  const exactDistanceKm =
    typeof c.distanceKm === "number" && Number.isFinite(c.distanceKm)
      ? c.distanceKm
      : calculatedDistanceKm;
  const distance =
    exactDistanceKm !== undefined
      ? `${exactDistanceKm.toFixed(1)} km`
      : undefined;

  return {
  id: c._id,
  name: c.name,
  address: c.address,
  phone: c.phone ?? undefined,
  hours: c.hoursText ?? undefined,
  menu: c.menuText ?? undefined,
  gallery: (c.galleryPaths ?? []).map((p) => resolveUploadUrl(p)!).filter(Boolean),
  image: resolveUploadUrl(c.photoPath) ?? FALLBACK_PHOTO,
  createdBy: c.createdBy ?? undefined,
  status: c.status,
  category: c.category ?? "Café",
  coffeeTypes: c.coffeeTypes ?? [],
  atmosphere: c.atmosphere ?? [],
  amenities: c.amenities ?? [],
  lat,
  lng,
  distance,
  distanceKm: exactDistanceKm,
  rating: c.userRating || undefined,
  reviewCount: c.reviewCount ?? 0,
  };
};

export const useCafes = (coords?: { lat: number; lng: number } | null) =>
  useQuery({
    queryKey: ["cafes", coords ?? null],
    queryFn: async (): Promise<{ shops: CoffeeShop[]; isSample: boolean }> => {
      const data = coords
        ? await cafesApi.nearby(coords.lat, coords.lng, 20)
        : await cafesApi.listAll();
      if (!data.length) {
        return { shops: coffeeShops.map((s) => ({ ...s, isSample: true })), isSample: true };
      }
      const shops = data.map((cafe) => toShop(cafe, coords));

      if (coords) {
        shops.sort((a, b) => {
          const distanceA = a.distanceKm ?? Number.POSITIVE_INFINITY;
          const distanceB = b.distanceKm ?? Number.POSITIVE_INFINITY;
          return distanceA - distanceB;
        });
      }

      return { shops, isSample: false };
    },
  });
