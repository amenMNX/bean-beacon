import { Search, Filter, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedRating: string;
  onRatingChange: (rating: string) => void;
  selectedPrice: string;
  onPriceChange: (price: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export const SearchAndFilters = ({
  searchQuery,
  onSearchChange,
  selectedRating,
  onRatingChange,
  selectedPrice,
  onPriceChange,
  showFilters,
  onToggleFilters,
}: SearchAndFiltersProps) => {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-coffee-light w-4 h-4" />
          <Input
            placeholder="Search coffee shops..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-card border-coffee-cream focus:ring-coffee-brown"
          />
        </div>
        <Button
          variant="outline"
          onClick={onToggleFilters}
          className="border-coffee-cream hover:bg-coffee-cream"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {showFilters && (
        <div className="flex gap-4 p-4 bg-coffee-cream rounded-lg">
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Minimum Rating
            </label>
            <Select value={selectedRating} onValueChange={onRatingChange}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Any rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any rating</SelectItem>
                <SelectItem value="4.5">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-coffee-gold text-coffee-gold" />
                    4.5+
                  </div>
                </SelectItem>
                <SelectItem value="4.0">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-coffee-gold text-coffee-gold" />
                    4.0+
                  </div>
                </SelectItem>
                <SelectItem value="3.5">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-coffee-gold text-coffee-gold" />
                    3.5+
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Price Range
            </label>
            <Select value={selectedPrice} onValueChange={onPriceChange}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Any price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any price</SelectItem>
                <SelectItem value="$">$ - Budget</SelectItem>
                <SelectItem value="$$">$$ - Moderate</SelectItem>
                <SelectItem value="$$$">$$$ - Expensive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};