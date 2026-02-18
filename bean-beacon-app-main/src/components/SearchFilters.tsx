import { useState } from "react";
import { Search, Sliders } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface SearchFiltersProps {
  onSearch: (query: string) => void;
  onRadiusChange: (radius: number) => void;
  onMinRatingChange: (rating: number) => void;
  radius: number;
  minRating: number;
}

export const SearchFilters = ({
  onSearch,
  onRadiusChange,
  onMinRatingChange,
  radius,
  minRating,
}: SearchFiltersProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  return (
    <div className="flex gap-2 w-full">
      <div className="flex-1 flex gap-2">
        <Input
          placeholder="Search cafes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          className="w-full"
        />
        <Button onClick={handleSearch} size="icon">
          <Search className="w-4 h-4" />
        </Button>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon">
            <Sliders className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Radius (km)</Label>
              <Slider
                value={[radius]}
                onValueChange={(value) => onRadiusChange(value[0])}
                min={1}
                max={20}
                step={1}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">{radius} km</p>
            </div>

            <div>
              <Label className="text-base font-semibold">Minimum Rating</Label>
              <Slider
                value={[minRating]}
                onValueChange={(value) => onMinRatingChange(value[0])}
                min={0}
                max={5}
                step={0.5}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                ⭐ {minRating.toFixed(1)}+
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
