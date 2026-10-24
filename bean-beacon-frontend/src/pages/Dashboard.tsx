import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Star, Trash2, X } from "lucide-react";
import { auth, cafesApi, reviewsApi, adminApi, onAuthChange, type ApiUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/utils";

const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const Dashboard = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [user, setUser] = useState<ApiUser | null | undefined>(undefined);

  useEffect(() => {
    setUser(auth.currentUser());
    return onAuthChange(setUser);
  }, []);

  const isAdmin = user?.role === "admin";

  const { data } = useQuery({
    queryKey: ["dashboard"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const [cafes, reviews] = await Promise.all([cafesApi.listAll(), adminApi.allReviews()]);
      return { cafes, reviews };
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["cafes"] });
  };

  const setStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      await cafesApi.setStatus(id, status);
      toast({ title: status === "approved" ? "Café approved" : "Café rejected" });
    } catch (err) {
      toast({ title: "Couldn't update", description: getErrorMessage(err), variant: "destructive" });
    }
    refresh();
  };
  const removeCafe = async (id: string) => {
    if (!confirm("Remove this café permanently?")) return;
    try {
      await cafesApi.remove(id);
      toast({ title: "Café removed" });
    } catch (err) {
      toast({ title: "Couldn't remove", description: getErrorMessage(err), variant: "destructive" });
    }
    refresh();
  };
  const removeReview = async (cafeId: string, id: string) => {
    if (!confirm("Remove this review?")) return;
    try {
      await reviewsApi.remove(cafeId, id);
      toast({ title: "Review removed" });
    } catch (err) {
      toast({ title: "Couldn't remove", description: getErrorMessage(err), variant: "destructive" });
    }
    refresh();
  };

  const shell = (body: React.ReactNode) => (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <Button asChild variant="ghost" size="sm"><Link to="/manage"><ArrowLeft className="mr-1 h-4 w-4" />Manage my cafés</Link></Button>
        <h1 className="text-3xl font-bold text-foreground">Owner dashboard</h1>
        {body}
      </div>
    </div>
  );

  if (user === undefined) return shell(<p className="text-muted-foreground">Loading…</p>);
  if (!user || !isAdmin) return shell(<p className="text-muted-foreground">Only the app owner can view this page. <Link to="/manage" className="text-primary underline">Sign in</Link></p>);

  const cafes = data?.cafes ?? [];
  const reviews = data?.reviews ?? [];
  const names = Object.fromEntries(cafes.map((c) => [c._id, c.name]));
  const pending = cafes.filter((c) => c.status === "pending");
  const weekAgo = Date.now() - 7 * 864e5;
  const avg = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : "–";
  const activity = [
    ...cafes.map((c) => ({ at: c.createdAt, text: `Café added: ${c.name}` })),
    ...reviews.map((r) => ({ at: r.createdAt, text: `${r.authorName || "Someone"} rated ${names[r.cafeId] ?? "a café"} ${r.rating}★` })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 20);

  const stats = [
    ["Live cafés", cafes.filter((c) => c.status === "approved").length],
    ["Pending", pending.length],
    ["Reviews", reviews.length],
    ["Average rating", avg],
    ["New this week", cafes.filter((c) => +new Date(c.createdAt) > weekAgo).length + reviews.filter((r) => +new Date(r.createdAt) > weekAgo).length],
  ] as const;

  const statusBadge = (s: string) => (
    <Badge variant={s === "approved" ? "default" : s === "rejected" ? "destructive" : "secondary"}>
      {s === "approved" ? "Live" : s === "rejected" ? "Rejected" : "Pending"}
    </Badge>
  );

  return shell(
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map(([label, v]) => (
          <Card key={label} className="p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold">{v}</p></Card>
        ))}
      </div>
      <Tabs defaultValue="listings">
        <TabsList>
          <TabsTrigger value="listings">Listings {pending.length > 0 && `(${pending.length} pending)`}</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="listings" className="space-y-2">
          {cafes.length === 0 && <p className="text-muted-foreground">No cafés yet.</p>}
          {[...pending, ...cafes.filter((c) => c.status !== "pending")].map((c) => (
            <Card key={c._id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <Link to={`/cafe/${c._id}`} className="font-medium hover:underline">{c.name}</Link>
                <p className="text-sm text-muted-foreground">{c.address} · added {fmt(c.createdAt)}</p>
              </div>
              {statusBadge(c.status)}
              {c.status !== "approved" && <Button size="sm" onClick={() => setStatus(c._id, "approved")}><Check className="mr-1 h-4 w-4" />Approve</Button>}
              {c.status !== "rejected" && <Button size="sm" variant="outline" onClick={() => setStatus(c._id, "rejected")}><X className="mr-1 h-4 w-4" />{c.status === "approved" ? "Hide" : "Reject"}</Button>}
              <Button size="icon" variant="ghost" aria-label={`Remove ${c.name}`} onClick={() => removeCafe(c._id)}><Trash2 className="h-4 w-4" /></Button>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="reviews" className="space-y-2">
          {reviews.length === 0 && <p className="text-muted-foreground">No reviews yet.</p>}
          {reviews.map((r) => (
            <Card key={r._id} className="flex items-start gap-3 p-3">
              <div className="flex-1 space-y-1">
                <p className="text-sm"><span className="font-medium">{r.authorName || "Anonymous"}</span> on <Link to={`/cafe/${r.cafeId}`} className="text-primary hover:underline">{names[r.cafeId] ?? "a café"}</Link> · {fmt(r.createdAt)}</p>
                <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />)}</div>
                {r.review && <p className="text-sm text-muted-foreground">{r.review}</p>}
              </div>
              <Button size="icon" variant="ghost" aria-label="Remove review" onClick={() => removeReview(r.cafeId, r._id)}><Trash2 className="h-4 w-4" /></Button>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="activity">
          <Card className="divide-y divide-border">
            {activity.length === 0 && <p className="p-3 text-muted-foreground">Nothing yet.</p>}
            {activity.map((a, i) => (
              <div key={i} className="flex justify-between gap-3 p-3 text-sm"><span>{a.text}</span><span className="text-muted-foreground">{fmt(a.at)}</span></div>
            ))}
          </Card>
        </TabsContent>
      </Tabs>
    </>,
  );
};

export default Dashboard;
