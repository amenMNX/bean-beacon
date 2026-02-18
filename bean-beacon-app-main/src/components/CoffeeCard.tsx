import { Star, MapPin, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CoffeeShop {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  location: string;
  distance: string;
  priceRange: string;
  specialty: string;
  image: string;
  isOpen: boolean;
  espressoPrice?: string;
  waterPrice?: string;
  googlePlaceId?: string;
  vicinity?: string;
}

interface CoffeeCardProps {
  shop: CoffeeShop;
}

export const CoffeeCard = ({ shop }: CoffeeCardProps) => {
  return (
    <Card className="group overflow-hidden bg-gradient-card border-0 shadow-card hover:shadow-hover transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative">
        <img 
          src={shop.image} 
          alt={shop.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3">
          <Badge 
            variant={shop.isOpen ? "default" : "secondary"}
            className={shop.isOpen ? "bg-coffee-gold text-foreground" : ""}
          >
            {shop.isOpen ? "Open" : "Closed"}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-lg text-foreground group-hover:text-coffee-brown transition-colors">
            {shop.name}
          </h3>
          <p className="text-sm text-coffee-light">{shop.specialty}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-coffee-gold text-coffee-gold" />
            <span className="font-semibold text-foreground">{shop.rating}</span>
            <span className="text-sm text-muted-foreground">({shop.reviews})</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 text-coffee-light" />
          <span>{shop.location}</span>
          <span>•</span>
          <span>{shop.distance}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-coffee-gold" />
            <span className="text-sm font-medium text-foreground">{shop.priceRange}</span>
          </div>
          
          {(shop.espressoPrice || shop.waterPrice) && (
            <div className="text-xs text-muted-foreground space-y-1">
              {shop.espressoPrice && (
                <div>Espresso: {shop.espressoPrice}</div>
              )}
              {shop.waterPrice && (
                <div>Water: {shop.waterPrice}</div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};