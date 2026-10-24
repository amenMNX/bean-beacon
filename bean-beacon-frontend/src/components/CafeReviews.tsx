import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import { auth, reviewsApi, onAuthChange, type ApiUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/utils";

const Stars = ({ value, onPick }: { value: number; onPick?: (n: number) => void }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} aria-label={`${n} stars`} onClick={() => onPick?.(n)}
        className={`h-5 w-5 ${onPick ? "cursor-pointer" : ""} ${n <= value ? "fill-accent text-accent" : "text-muted-foreground"}`} />
    ))}
  </div>
);

export const ReviewsPanel = ({ cafeId }: { cafeId: string }) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [rating, setRating] = useState(0);
  const [author, setAuthor] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setUser(auth.currentUser());
    return onAuthChange(setUser);
  }, []);

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", cafeId],
    queryFn: () => reviewsApi.list(cafeId),
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !rating) return;
    setBusy(true);
    try {
      await reviewsApi.upsert(cafeId, {
        rating,
        review: comment.trim() || undefined,
        authorName: author.trim(),
      });
      toast({ title: "Thanks for your review!" });
      setComment("");
      setRating(0);
      qc.invalidateQueries({ queryKey: ["reviews", cafeId] });
      qc.invalidateQueries({ queryKey: ["cafes"] });
    } catch (err) {
      toast({ title: "Couldn't save review", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
    {user ? (
      <form onSubmit={submit} className="space-y-3 rounded-lg border border-border p-3">
        <Stars value={rating} onPick={setRating} />
        <Input placeholder="Your name" value={author} onChange={(e) => setAuthor(e.target.value)} required maxLength={60} />
        <Textarea placeholder="What did you think?" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} />
        <Button disabled={busy || !rating}>{busy ? "Saving..." : "Post review"}</Button>
      </form>
    ) : (
      <p className="text-sm text-muted-foreground"><Link to="/manage" className="text-primary underline">Sign in</Link> to leave a review.</p>
    )}
    <div className="space-y-3">
      {reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet — be the first.</p>}
      {reviews.map((r) => (
        <div key={r._id} className="space-y-1 border-b border-border pb-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">{r.authorName || "Anonymous"}</span>
            <Stars value={r.rating} />
          </div>
          {r.review && <p className="text-sm text-muted-foreground">{r.review}</p>}
        </div>
      ))}
    </div>
    </div>
  );
};

export const CafeReviews = ({ cafeId, name }: { cafeId: string; name: string }) => {
  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", cafeId],
    queryFn: () => reviewsApi.list(cafeId),
  });
  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="outline" size="sm">Reviews ({reviews.length})</Button></DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Reviews for {name}</DialogTitle></DialogHeader>
        <ReviewsPanel cafeId={cafeId} />
      </DialogContent>
    </Dialog>
  );
};
