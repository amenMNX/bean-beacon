import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { CafeCardComponent } from "./CafeCardComponent";

interface Cafe {
  _id: string;
  name: string;
  address: string;
  type: string;
  userRating: number;
  reviewCount: number;
  wifi: boolean;
  powerOutlets: boolean;
  distance?: number;
}

interface CafeListProps {
  cafes: Cafe[];
  selectedCafeId?: string;
  favorites: Set<string>;
  isLoading?: boolean;
  onSelectCafe: (cafeId: string) => void;
  onToggleFavorite: (cafeId: string) => void;
}

export const CafeList = ({
  cafes,
  selectedCafeId,
  favorites,
  isLoading,
  onSelectCafe,
  onToggleFavorite,
}: CafeListProps) => {
  return (
    <ScrollArea className="h-[600px] w-full rounded-lg border">
      <div className="p-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-32" />
          ))
        ) : cafes.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No cafes found. Try adjusting your location or filters.</p>
          </div>
        ) : (
          cafes.map((cafe) => (
            <CafeCardComponent
              key={cafe._id}
              cafe={cafe}
              isSelected={selectedCafeId === cafe._id}
              isFavorite={favorites.has(cafe._id)}
              onSelect={() => onSelectCafe(cafe._id)}
              onFavoriteToggle={() => onToggleFavorite(cafe._id)}
            />
          ))
        )}
      </div>
    </ScrollArea>
  );
};
