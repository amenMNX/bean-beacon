import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, LogOut, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CafeList } from "@/components/CafeList";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { favoritesAPI } from "@/services/api";

export const FavoritesPage = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const { data: favoriteCafes = [], isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => favoritesAPI.getFavorites().then((res) => res.data.data),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (favoriteCafes) {
      setFavorites(new Set(favoriteCafes.map((cafe: any) => cafe._id)));
    }
  }, [favoriteCafes]);

  const handleRemoveFavorite = async (cafeId: string) => {
    try {
      await favoritesAPI.removeFavorite(cafeId);
      setFavorites((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cafeId);
        return newSet;
      });
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Top Navigation */}
      <nav className="border-b bg-white dark:bg-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Favorites</h1>
          <div className="flex items-center gap-4">
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
            <div className="flex flex-col items-end">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
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
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stats */}
          <Card className="p-6 col-span-1">
            <div className="flex items-center gap-4">
              <Heart className="w-8 h-8 text-red-500 fill-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Favorites</p>
                <p className="text-3xl font-bold">{favorites.size}</p>
              </div>
            </div>
          </Card>

          {/* Favorites List */}
          <div className="md:col-span-2">
            <CafeList
              cafes={favoriteCafes}
              favorites={favorites}
              isLoading={isLoading}
              onSelectCafe={() => {}}
              onToggleFavorite={handleRemoveFavorite}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
