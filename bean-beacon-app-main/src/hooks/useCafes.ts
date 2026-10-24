import { useQuery } from "@tanstack/react-query";
import { cafesApi, type ApiCafe } from "@/lib/api";
import { coffeeShops, type CoffeeShop } from "@/data/shops";

const FALLBACK_PHOTO =
  "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&auto=format&fit=crop";

const toShop = (c: ApiCafe): CoffeeShop => ({
  id: c._id,
  name: c.name,
  address: c.address,
  phone: c.phone ?? undefined,
  hours: c.hoursText ?? undefined,
  menu: c.menuText ?? undefined,
  gallery: [], // no photo storage in this deployment (MVP cut)
  image: FALLBACK_PHOTO,
  createdBy: c.createdBy ?? undefined,
  status: c.status,
  category: c.category ?? "Café",
  coffeeTypes: c.coffeeTypes ?? [],
  atmosphere: c.atmosphere ?? [],
  amenities: c.amenities ?? [],
  lat: c.location?.coordinates?.[1],
  lng: c.location?.coordinates?.[0],
  rating: c.userRating || undefined,
  reviewCount: c.reviewCount ?? 0,
});

export const useCafes = () =>
  useQuery({
    queryKey: ["cafes"],
    queryFn: async (): Promise<{ shops: CoffeeShop[]; isSample: boolean }> => {
      const data = await cafesApi.listAll();
      if (!data.length) {
        return { shops: coffeeShops.map((s) => ({ ...s, isSample: true })), isSample: true };
      }
      return { shops: data.map(toShop), isSample: false };
    },
  });
