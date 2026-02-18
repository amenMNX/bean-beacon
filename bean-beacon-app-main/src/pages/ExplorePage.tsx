import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { LogOut, Moon, Sun, Heart, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CafeMap } from "@/components/CafeMap";
import { CafeList } from "@/components/CafeList";
import { CafeDetails } from "@/components/CafeDetails";
import { SearchFilters } from "@/components/SearchFilters";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { cafeAPI, favoritesAPI, ratingsAPI } from "@/services/api";
import { useNavigate } from "react-router-dom";

interface Cafe {
  _id: string;
  name: string;
  address: string;
  type: string;
  userRating: number;
  reviewCount: number;
  wifi: boolean;
  powerOutlets: boolean;
  quietWorkspace: boolean;
  location: {
    coordinates: [number, number];
  };
  distance?: number;
}

interface Rating {
  _id: string;
  rating: number;
  review: string;
  userId: string;
  createdAt: string;
}

export const ExplorePage = () => {
  const navigate = useNavigate();
  const { location, error: locationError, isLoading: locationLoading } = useGeolocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [selectedCafeId, setSelectedCafeId] = useState<string | undefined>();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [radius, setRadius] = useState(5);
  const [minRating, setMinRating] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch cafes
  const { data: cafes = [], isLoading: cafesLoading } = useQuery({
    queryKey: ["cafes", location, radius, minRating, searchQuery],
    queryFn: async () => {
      if (!location) return [];

      try {
        let response;
        if (searchQuery) {
          response = await cafeAPI.searchCafes(
            searchQuery,
            location.latitude,
            location.longitude
          );
        } else {
          response = await cafeAPI.getCafesByLocation(
            location.latitude,
            location.longitude,
            radius
          );
        }

        let filteredCafes = response.data.data || [];

        // Calculate distance for each cafe
        filteredCafes = filteredCafes.map((cafe: Cafe) => {
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            cafe.location.coordinates[1],
            cafe.location.coordinates[0]
          );
          return { ...cafe, distance };
        });

        // Filter by rating
        filteredCafes = filteredCafes.filter(
          (cafe: Cafe) => cafe.userRating >= minRating
        );

        // Sort by distance
        filteredCafes.sort((a: Cafe, b: Cafe) => (a.distance || 0) - (b.distance || 0));

        return filteredCafes;
      } catch (error) {
        console.error("Error fetching cafes:", error);
        return [];
      }
    },
    enabled: !!location,
  });

  // Fetch favorites
  const { data: favoriteCafes = [] } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => favoritesAPI.getFavorites().then((res) => res.data.data),
    enabled: isAuthenticated,
  });

  // Fetch selected cafe ratings
  const { data: ratings = [], isLoading: ratingsLoading } = useQuery({
    queryKey: ["ratings", selectedCafeId],
    queryFn: () => {
      if (!selectedCafeId) return [];
      return ratingsAPI.getCafeRatings(selectedCafeId).then((res) => res.data.data);
    },
    enabled: !!selectedCafeId,
  });

  useEffect(() => {
    if (favoriteCafes) {
      setFavorites(new Set(favoriteCafes.map((cafe: Cafe) => cafe._id)));
    }
  }, [favoriteCafes]);

  const selectedCafe = cafes.find((cafe: Cafe) => cafe._id === selectedCafeId);

  const handleFavoriteToggle = async (cafeId: string) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      if (favorites.has(cafeId)) {
        await favoritesAPI.removeFavorite(cafeId);
        setFavorites((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cafeId);
          return newSet;
        });
      } else {
        await favoritesAPI.addFavorite(cafeId);
        setFavorites((prev) => new Set(prev).add(cafeId));
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleRatingSubmit = async (rating: number, review: string) => {
    if (!selectedCafeId) return;

    try {
      await ratingsAPI.addRating(selectedCafeId, rating, review);
      // Refresh ratings
      setSelectedCafeId(selectedCafeId);
    } catch (error) {
      console.error("Error submitting rating:", error);
    }
  };

  if (locationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-lg font-semibold mb-2">Getting your location...</p>
          <p className="text-muted-foreground">Please enable location access</p>
        </Card>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <p className="text-lg font-semibold text-red-600 mb-2">Location Error</p>
          <p className="text-muted-foreground mb-4">{locationError}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Top Navigation */}
      <nav className="border-b bg-white dark:bg-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="w-6 h-6" />
            Bean Beacon
          </h1>
          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/favorites")}
                className="gap-2"
              >
                <Heart className="w-4 h-4" />
                Favorites
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
            {isAuthenticated ? (
              <>
                <div className="flex flex-col items-end text-sm">
                  <p className="font-medium">{user?.name}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
                  Login
                </Button>
                <Button size="sm" onClick={() => navigate("/register")}>
                  Register
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Search and Filters */}
      <div className="border-b bg-white dark:bg-slate-800 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <SearchFilters
            onSearch={setSearchQuery}
            onRadiusChange={setRadius}
            onMinRatingChange={setMinRating}
            radius={radius}
            minRating={minRating}
          />
        </div>
      </div>

      {/* Main Content */}
      {location && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <CafeMap
                latitude={location.latitude}
                longitude={location.longitude}
                cafes={cafes}
                selectedCafeId={selectedCafeId}
                onMarkerClick={setSelectedCafeId}
                isLoading={cafesLoading}
              />
            </div>

            {/* List */}
            <div>
              <CafeList
                cafes={cafes}
                selectedCafeId={selectedCafeId}
                favorites={favorites}
                isLoading={cafesLoading}
                onSelectCafe={(id) => {
                  setSelectedCafeId(id);
                  setDetailsOpen(true);
                }}
                onToggleFavorite={handleFavoriteToggle}
              />
            </div>
          </div>
        </div>
      )}

      {/* Details Sheet */}
      {selectedCafe && (
        <CafeDetails
          cafe={selectedCafe}
          isOpen={detailsOpen}
          isFavorite={favorites.has(selectedCafe._id)}
          ratings={ratings}
          ratingsLoading={ratingsLoading}
          isAuthenticated={isAuthenticated}
          onClose={() => setDetailsOpen(false)}
          onFavoriteToggle={() => handleFavoriteToggle(selectedCafe._id)}
          onRatingSubmit={handleRatingSubmit}
        />
      )}
    </div>
  );
};

// Utility function to calculate distance
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
