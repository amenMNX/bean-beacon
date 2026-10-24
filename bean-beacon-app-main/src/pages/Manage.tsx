import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import { auth, cafesApi, onAuthChange, type ApiUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { filterGroups, type FilterGroup } from "@/data/shops";
import { useCafes } from "@/hooks/useCafes";

const categories = ["Café", "Specialty", "Roastery", "Chain"];
const groupLabels: Record<FilterGroup, string> = { coffeeTypes: "Coffee types", atmosphere: "Atmosphere", amenities: "Amenities" };

const AuthForm = () => {
  const { toast } = useToast();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") await auth.signIn(email, password);
      else await auth.signUp(email, password, name);
    } catch (err: any) {
      toast({ title: "Couldn't continue", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="mx-auto max-w-sm space-y-4 p-6">
      <h2 className="text-xl font-semibold">{mode === "in" ? "Sign in to manage cafés" : "Create your owner account"}</h2>
      <form onSubmit={submit} className="space-y-3">
        {mode === "up" && (
          <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
        )}
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button className="w-full" disabled={busy}>{mode === "in" ? "Sign in" : "Sign up"}</Button>
      </form>
      <button className="text-sm text-primary underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "No account yet? Sign up" : "Already have an account? Sign in"}
      </button>
    </Card>
  );
};

const empty = { name: "", address: "", phone: "", hours: "", menu: "", category: "Café" };
const emptyTags: Record<FilterGroup, string[]> = { coffeeTypes: [], atmosphere: [], amenities: [] };

const CafeForm = ({ onSaved }: { onSaved: () => void }) => {
  const { toast } = useToast();
  const [form, setForm] = useState(empty);
  const [tags, setTags] = useState(emptyTags);
  const [busy, setBusy] = useState(false);

  const toggle = (g: FilterGroup, v: string) =>
    setTags((t) => ({ ...t, [g]: t[g].includes(v) ? t[g].filter((x) => x !== v) : [...t[g], v] }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    setBusy(true);
    try {
      await cafesApi.create({
        name: form.name.trim(),
        address: form.address.trim(),
        phone: form.phone.trim() || undefined,
        hoursText: form.hours.trim() || undefined,
        menuText: form.menu.trim() || undefined,
        category: form.category,
        coffeeTypes: tags.coffeeTypes,
        atmosphere: tags.atmosphere,
        amenities: tags.amenities,
      });
      toast({ title: "Café added", description: `${form.name} — pending approval before it shows to visitors.` });
      setForm(empty);
      setTags(emptyTags);
      (e.target as HTMLFormElement).reset();
      onSaved();
    } catch (err: any) {
      toast({ title: "Couldn't save café", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-4 p-6">
      <h2 className="text-xl font-semibold">Add a café</h2>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={120} />
          <Input placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={40} />
        </div>
        <Input placeholder="Full address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required maxLength={300} />
        <p className="text-xs text-muted-foreground">
          The café location will be found automatically from its address.
        </p>
        <Textarea placeholder={"Opening hours, e.g.\nMon–Fri 7:00–18:00\nSat–Sun 8:00–16:00"} value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} maxLength={500} />
        <Textarea placeholder={"Menu, e.g.\nEspresso — 2.50\nFlat white — 3.80\nCroissant — 2.20"} value={form.menu} onChange={(e) => setForm({ ...form, menu: e.target.value })} maxLength={3000} />
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-28 text-sm font-medium text-muted-foreground">Type</span>
          {categories.map((c) => (
            <Badge key={c} variant={form.category === c ? "default" : "outline"} className="cursor-pointer" onClick={() => setForm({ ...form, category: c })}>{c}</Badge>
          ))}
        </div>
        {(Object.keys(filterGroups) as FilterGroup[]).map((g) => (
          <div key={g} className="flex flex-wrap items-center gap-2">
            <span className="w-28 text-sm font-medium text-muted-foreground">{groupLabels[g]}</span>
            {filterGroups[g].map((v) => (
              <Badge key={v} variant={tags[g].includes(v) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggle(g, v)}>{v}</Badge>
            ))}
          </div>
        ))}
        <Button disabled={busy}>{busy ? "Saving..." : "Save café"}</Button>
      </form>
    </Card>
  );
};

const Manage = () => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const qc = useQueryClient();
  const { data } = useCafes();
  const { toast } = useToast();

  useEffect(() => {
    setUser(auth.currentUser());
    return onAuthChange(setUser);
  }, []);

  const isAdmin = user?.role === "admin";
  const refresh = () => qc.invalidateQueries({ queryKey: ["cafes"] });

  const remove = async (id: string) => {
    if (!confirm("Delete this café?")) return;
    try {
      await cafesApi.remove(id);
      refresh();
    } catch (err: any) {
      toast({ title: "Couldn't delete", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm"><Link to="/"><ArrowLeft className="mr-1 h-4 w-4" />Back to cafés</Link></Button>
          <div className="flex gap-2">
            {isAdmin && <Button asChild size="sm"><Link to="/dashboard">Owner dashboard</Link></Button>}
            {user && <Button variant="outline" size="sm" onClick={() => auth.signOut()}>Sign out</Button>}
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground">Manage my cafés</h1>
        {user && (() => {
          const pending = (data?.shops ?? []).filter((s) => s.status === "pending" && (isAdmin || s.createdBy === user.id));
          return pending.length > 0 && (
            <Card className="space-y-2 border-accent p-4">
              <h2 className="font-semibold">Pending listings ({pending.length})</h2>
              <p className="text-sm text-muted-foreground">
                {isAdmin ? "These cafés are waiting for your approval in the owner dashboard." : "These cafés will show to visitors once the owner approves them."}
              </p>
              <ul className="list-disc pl-5 text-sm">{pending.map((s) => <li key={s.id}>{s.name}</li>)}</ul>
            </Card>
          );
        })()}
        {!user && <AuthForm />}
        {user && (
          <>
            <CafeForm onSaved={refresh} />
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Your cafés</h2>
              {(() => {
                const mine = (data?.shops ?? []).filter((s) => isAdmin || s.createdBy === user.id);
                return data?.isSample || !mine.length ? (
                  <p className="text-muted-foreground">No cafés yet — add your first one above and it will appear in the finder.</p>
                ) : (
                  mine.map((s) => (
                    <Card key={s.id} className="flex items-center gap-4 p-3">
                      <img src={s.image} alt={s.name} className="h-16 w-16 rounded-md object-cover" />
                      <div className="flex-1">
                        <p className="font-medium">{s.name}</p>
                        <p className="text-sm text-muted-foreground">{s.address}</p>
                      </div>
                      <Badge variant={s.status === "approved" ? "default" : s.status === "rejected" ? "destructive" : "secondary"}>
                        {s.status === "approved" ? "Live" : s.status === "rejected" ? "Rejected" : "Pending approval"}
                      </Badge>
                      <Button variant="ghost" size="icon" aria-label={`Delete ${s.name}`} onClick={() => remove(s.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Card>
                  ))
                );
              })()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Manage;
