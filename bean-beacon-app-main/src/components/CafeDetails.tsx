import { useState } from "react";
import { Star, MapPin, Globe, Phone, Heart } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Cafe {
  _id: string;
  name: string;
  address: string;
  type: string;
  userRating: number;
  reviewCount: number;
  website?: string;
  phone?: string;
  wifi: boolean;
  powerOutlets: boolean;
  quietWorkspace: boolean;
}

interface Rating {
  _id: string;
  rating: number;
  review: string;
  userId: string;
  createdAt: string;
}

interface CafeDetailsProps {
  cafe: Cafe | null;
  isOpen: boolean;
  isFavorite?: boolean;
  isLoading?: boolean;
  ratings?: Rating[];
  ratingsLoading?: boolean;
  userRating?: number;
  userReview?: string;
  isAuthenticated?: boolean;
  onClose: () => void;
  onFavoriteToggle: () => void;
  onRatingSubmit: (rating: number, review: string) => Promise<void>;
}

export const CafeDetails = ({
  cafe,
  isOpen,
  isFavorite,
  isLoading,
  ratings = [],
  ratingsLoading = false,
  userRating = 0,
  userReview = "",
  isAuthenticated = false,
  onClose,
  onFavoriteToggle,
  onRatingSubmit,
}: CafeDetailsProps) => {
  const [newRating, setNewRating] = useState(userRating);
  const [newReview, setNewReview] = useState(userReview);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitRating = async () => {
    try {
      setIsSubmitting(true);
      await onRatingSubmit(newRating, newReview);
      setNewReview("");
    } catch (error) {
      console.error("Error submitting rating:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[400px] flex flex-col">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="w-full h-20" />
            <Skeleton className="w-full h-40" />
          </div>
        ) : cafe ? (
          <>
            <SheetHeader>
              <div className="flex justify-between items-start gap-2">
                <div>
                  <SheetTitle className="text-2xl">{cafe.name}</SheetTitle>
                  <SheetDescription className="flex items-center gap-1 mt-2">
                    <MapPin className="w-4 h-4" />
                    {cafe.address}
                  </SheetDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onFavoriteToggle}
                >
                  <Heart
                    className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
                  />
                </Button>
              </div>
            </SheetHeader>

            <ScrollArea className="flex-1">
              <div className="space-y-6 pr-4">
                {/* Basic Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{cafe.userRating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">
                      ({cafe.reviewCount} reviews)
                    </span>
                  </div>

                  <Badge variant="outline">{cafe.type.replace("_", " ")}</Badge>
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Contact</h3>
                  {cafe.phone && (
                    <a
                      href={`tel:${cafe.phone}`}
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Phone className="w-4 h-4" />
                      {cafe.phone}
                    </a>
                  )}
                  {cafe.website && (
                    <a
                      href={cafe.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Globe className="w-4 h-4" />
                      Visit Website
                    </a>
                  )}
                </div>

                {/* Amenities */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Amenities</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={cafe.wifi}
                        disabled
                        className="w-4 h-4"
                      />
                      WiFi Available
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={cafe.powerOutlets}
                        disabled
                        className="w-4 h-4"
                      />
                      Power Outlets
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={cafe.quietWorkspace}
                        disabled
                        className="w-4 h-4"
                      />
                      Quiet Workspace
                    </div>
                  </div>
                </div>

                {/* Rating Section */}
                {isAuthenticated && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Leave a Rating</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Rating</label>
                        <div className="flex gap-2 mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setNewRating(star)}
                              className="text-2xl"
                            >
                              <Star
                                className={`w-6 h-6 ${
                                  star <= newRating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Review</label>
                        <Textarea
                          placeholder="Share your experience..."
                          value={newReview}
                          onChange={(e) => setNewReview(e.target.value)}
                          className="mt-2 resize-none"
                          rows={3}
                        />
                      </div>

                      <Button
                        onClick={handleSubmitRating}
                        disabled={isSubmitting}
                        className="w-full"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Rating"}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Reviews */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Reviews</h3>
                  {ratingsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="w-full h-20" />
                    ))
                  ) : ratings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No reviews yet. Be the first to review!
                    </p>
                  ) : (
                    ratings.map((rating) => (
                      <Card key={rating._id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < rating.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {rating.review && (
                            <p className="text-sm text-muted-foreground">
                              {rating.review}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(rating.createdAt).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </ScrollArea>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};
