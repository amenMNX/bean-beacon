import { Star, MapPin, Heart, Wifi, Zap } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

interface CafeCardProps {
  cafe: Cafe;
  isSelected?: boolean;
  isFavorite?: boolean;
  onSelect: () => void;
  onFavoriteToggle: () => void;
}

export const CafeCardComponent = ({
  cafe,
  isSelected,
  isFavorite,
  onSelect,
  onFavoriteToggle,
}: CafeCardProps) => {
  return (
    <Card
      className={`cursor-pointer transition-all ${isSelected ? "ring-2 ring-primary" : ""}`}
      onClick={onSelect}
    >
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <div>
            <CardTitle className="text-lg">{cafe.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-2">
              <MapPin className="w-4 h-4" />
              {cafe.address}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle();
            }}
          >
            <Heart
              className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {cafe.distance && (
            <div className="text-sm text-muted-foreground">
              Distance: {cafe.distance.toFixed(2)} km
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{cafe.userRating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">
                ({cafe.reviewCount} reviews)
              </span>
            </div>
          </div>

          <Badge variant="outline">{cafe.type.replace("_", " ")}</Badge>

          <div className="flex gap-2 flex-wrap">
            {cafe.wifi && (
              <div className="flex items-center gap-1 text-xs">
                <Wifi className="w-4 h-4" />
                <span>WiFi</span>
              </div>
            )}
            {cafe.powerOutlets && (
              <div className="flex items-center gap-1 text-xs">
                <Zap className="w-4 h-4" />
                <span>Power</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
