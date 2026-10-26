import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { favoritesApi, auth, onAuthChange, type ApiUser } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export const useFavorites = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [user, setUser] = useState<ApiUser | null>(() => auth.currentUser());

  useEffect(() => {
    return onAuthChange((u) => {
      setUser(u);
      if (!u) qc.setQueryData(["favorites"], []); // clear instantly on sign-out
    });
  }, [qc]);

  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites"],
    queryFn: favoritesApi.list,
    enabled: !!user,
  });

  const favoriteIds = new Set(favorites.map((c) => c._id));

  const toggleFavorite = async (cafeId: string) => {
    if (!user) {
      toast({ title: "Sign in to save favorites", description: "Use the Manage page to sign in." });
      return;
    }
    try {
      if (favoriteIds.has(cafeId)) {
        await favoritesApi.remove(cafeId);
      } else {
        await favoritesApi.add(cafeId);
      }
      qc.invalidateQueries({ queryKey: ["favorites"] });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast({ title: "Couldn't update favorites", description: message, variant: "destructive" });
    }
  };

  return { favorites, favoriteIds, toggleFavorite };
};
