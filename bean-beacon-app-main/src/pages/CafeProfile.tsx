import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock, ExternalLink, MapPin, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useCafes } from "@/hooks/useCafes";
import { mapsLink } from "@/components/CoffeeShopCard";
import { ReviewsPanel } from "@/components/CafeReviews";

const CafeProfile = () => {
  const { id } = useParams();
  const { data, isLoading } = useCafes();
  const shop = data?.shops.find((s) => s.id === id);
  const photos = shop ? [shop.image, ...(shop.gallery ?? [])] : [];
  const [active, setActive] = useState(0);

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading café...</div>;
  if (!shop) return (
    <div className="mx-auto max-w-4xl space-y-4 p-8">
      <p className="text-muted-foreground">We couldn't find this café.</p>
      <Button asChild variant="outline"><Link to="/">Back to cafés</Link></Button>
    </div>
  );

  const tags = [...shop.coffeeTypes, ...shop.atmosphere, ...shop.amenities];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <Button asChild variant="ghost" size="sm"><Link to="/"><ArrowLeft className="mr-1 h-4 w-4" />Back to cafés</Link></Button>

        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">{shop.name}</h1>
            <Badge variant="secondary">{shop.category}</Badge>
          </div>
          <p className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4" />{shop.address}</p>
          {shop.rating !== undefined && (
            <p className="flex items-center gap-1 text-sm"><Star className="h-4 w-4 fill-accent text-accent" />
              <span className="font-medium">{shop.rating}</span><span className="text-muted-foreground">({shop.reviewCount} reviews)</span></p>
          )}
        </header>

        <section className="space-y-2">
          <img src={photos[active]} alt={shop.name} className="h-80 w-full rounded-xl object-cover" />
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {photos.map((p, i) => (
                <button key={p} onClick={() => setActive(i)} aria-label={`Photo ${i + 1}`}
                  className={`h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 ${i === active ? "border-primary" : "border-transparent"}`}>
                  <img src={p} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <Card className="space-y-2 p-5">
              <h2 className="text-xl font-semibold">Menu</h2>
              {shop.menu ? <p className="whitespace-pre-line text-sm text-muted-foreground">{shop.menu}</p>
                : <p className="text-sm text-muted-foreground">This café hasn't added a menu yet.</p>}
            </Card>
            <Card className="space-y-3 p-5">
              <h2 className="text-xl font-semibold">Reviews</h2>
              <ReviewsPanel cafeId={shop.id} />
            </Card>
          </div>

          <aside className="space-y-4">
            <Card className="space-y-3 p-5">
              <h2 className="flex items-center gap-2 font-semibold"><Clock className="h-4 w-4" />Opening hours</h2>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{shop.hours || "Hours not listed."}</p>
            </Card>
            <Card className="space-y-2 p-5">
              <Button asChild className="w-full"><a href={mapsLink(shop.name, shop.address)} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1 h-4 w-4" />Open in Google Maps</a></Button>
              {shop.phone && <Button asChild variant="outline" className="w-full"><a href={`tel:${shop.phone}`}><Phone className="mr-1 h-4 w-4" />Call {shop.phone}</a></Button>}
            </Card>
            {tags.length > 0 && (
              <Card className="flex flex-wrap gap-2 p-5">{tags.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}</Card>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CafeProfile;
