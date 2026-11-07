import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Pencil, Save, Star, Trash2, X } from "lucide-react";
import { auth, cafesApi, reviewsApi, adminApi, onAuthChange, type AdminUser, type ApiCafe, type ApiUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/utils";

const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const Dashboard = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [user, setUser] = useState<ApiUser | null | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showLegacyEditForm] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", address: "", phone: "", lat: "", lng: "" });
  const [cafeSearch, setCafeSearch] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [userForm, setUserForm] = useState({ name: "", email: "", role: "user" as "user" | "admin", password: "" });

  useEffect(() => {
    setUser(auth.currentUser());
    return onAuthChange(setUser);
  }, []);

  const isAdmin = user?.role === "admin";

  const { data } = useQuery({
    queryKey: ["dashboard"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const [cafes, reviews, users] = await Promise.all([
        cafesApi.listAll(),
        adminApi.allReviews(),
        adminApi.allUsers(),
      ]);
      return { cafes, reviews, users };
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

  const startEditing = (cafe: ApiCafe) => {
    setEditingId(cafe._id);
    setEditForm({
      name: cafe.name,
      address: cafe.address,
      phone: cafe.phone ?? "",
      lat: String(cafe.location.coordinates[1]),
      lng: String(cafe.location.coordinates[0]),
    });
    window.setTimeout(() => {
      document.getElementById("cafe-edit-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  };

  const saveEditing = async () => {
    if (!editingId) return;
    try {
      await adminApi.updateCafe(editingId, {
        name: editForm.name,
        address: editForm.address,
        phone: editForm.phone || undefined,
        lat: Number(editForm.lat),
        lng: Number(editForm.lng),
      });
      toast({ title: "Café updated" });
      setEditingId(null);
      refresh();
    } catch (err) {
      toast({ title: "Couldn't update café", description: getErrorMessage(err), variant: "destructive" });
    }
  };

  const startUserEditing = (managedUser: AdminUser) => {
    setEditingUserId(managedUser.id);
    setUserFormOpen(true);
    setUserForm({ name: managedUser.name, email: managedUser.email, role: managedUser.role, password: "" });
  };

  const saveUser = async () => {
    try {
      if (editingUserId) {
        await adminApi.updateUser(editingUserId, userForm);
        toast({ title: "User updated" });
      } else {
        if (!userForm.password) {
          toast({ title: "Password required", description: "Enter a password for the new user", variant: "destructive" });
          return;
        }
        await adminApi.createUser(userForm);
        toast({ title: "User created" });
      }
      setEditingUserId(null);
      setUserFormOpen(false);
      setUserForm({ name: "", email: "", role: "user", password: "" });
      refresh();
    } catch (err) {
      toast({ title: "Couldn't save user", description: getErrorMessage(err), variant: "destructive" });
    }
  };

  const shell = (body: React.ReactNode) => (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <Button asChild variant="ghost" size="sm"><Link to="/manage"><ArrowLeft className="mr-1 h-4 w-4" />Manage my cafés</Link></Button>
        <h1 className="text-3xl font-bold text-foreground">Admin space</h1>
        {body}
      </div>
    </div>
  );

  if (user === undefined) return shell(<p className="text-muted-foreground">Loading…</p>);
  if (!user || !isAdmin) return shell(<p className="text-muted-foreground">Only the app owner can view this page. <Link to="/manage" className="text-primary underline">Sign in</Link></p>);

  const cafes = data?.cafes ?? [];
  const reviews = data?.reviews ?? [];
  const users = data?.users ?? [];
  const names = Object.fromEntries(cafes.map((c) => [c._id, c.name]));
  const pending = cafes.filter((c) => c.status === "pending");
  const visibleCafes = [...pending, ...cafes.filter((c) => c.status !== "pending")].filter((c) =>
    `${c.name} ${c.address}`.toLowerCase().includes(cafeSearch.toLowerCase().trim())
  );
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
    ["Users", users.length],
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
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {stats.map(([label, v]) => (
          <Card key={label} className="p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold">{v}</p></Card>
        ))}
      </div>
      <Tabs defaultValue="listings">
        <TabsList>
          <TabsTrigger value="listings">Listings {pending.length > 0 && `(${pending.length} pending)`}</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="listings" className="space-y-2">
          <Input value={cafeSearch} onChange={(e) => setCafeSearch(e.target.value)} placeholder="Search cafés by name or address..." />
          {cafes.length === 0 && <p className="text-muted-foreground">No cafés yet.</p>}
          {visibleCafes.map((c) => (
            <>
            <Card key={c._id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <Link to={`/cafe/${c._id}`} className="font-medium hover:underline">{c.name}</Link>
                <p className="text-sm text-muted-foreground">{c.address} · added {fmt(c.createdAt)}</p>
              </div>
              {statusBadge(c.status)}
              <Button type="button" size="sm" variant="outline" onClick={() => startEditing(c)}><Pencil className="mr-1 h-4 w-4" />Edit</Button>
              {c.status !== "approved" && <Button size="sm" onClick={() => setStatus(c._id, "approved")}><Check className="mr-1 h-4 w-4" />Approve</Button>}
              {c.status !== "rejected" && <Button size="sm" variant="outline" onClick={() => setStatus(c._id, "rejected")}><X className="mr-1 h-4 w-4" />{c.status === "approved" ? "Hide" : "Reject"}</Button>}
              <Button size="icon" variant="ghost" aria-label={`Remove ${c.name}`} onClick={() => removeCafe(c._id)}><Trash2 className="h-4 w-4" /></Button>
            </Card>
            {editingId === c._id && (
              <Card className="space-y-3 border-primary p-4">
                <h3 className="font-semibold">Edit {c.name}</h3>
                <div className="grid gap-2 md:grid-cols-2">
                  <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Café name" />
                  <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Phone" />
                </div>
                <Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} placeholder="Address" />
                <div className="grid gap-2 md:grid-cols-2">
                  <Input value={editForm.lat} onChange={(e) => setEditForm({ ...editForm, lat: e.target.value })} placeholder="Latitude" />
                  <Input value={editForm.lng} onChange={(e) => setEditForm({ ...editForm, lng: e.target.value })} placeholder="Longitude" />
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={saveEditing}><Save className="mr-1 h-4 w-4" />Save changes</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </Card>
            )}
            </>
          ))}
          {showLegacyEditForm && editingId && (
            <Card id="cafe-edit-form" className="space-y-3 border-primary p-4">
              <h3 className="font-semibold">Edit café</h3>
              <div className="grid gap-2 md:grid-cols-2">
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Café name" />
                <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Phone" />
              </div>
              <Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} placeholder="Address" />
              <div className="grid gap-2 md:grid-cols-2">
                <Input value={editForm.lat} onChange={(e) => setEditForm({ ...editForm, lat: e.target.value })} placeholder="Latitude" />
                <Input value={editForm.lng} onChange={(e) => setEditForm({ ...editForm, lng: e.target.value })} placeholder="Longitude" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEditing}><Save className="mr-1 h-4 w-4" />Save changes</Button>
                <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
              </div>
            </Card>
          )}
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
        <TabsContent value="users" className="space-y-2">
          <Button size="sm" onClick={() => { setEditingUserId(null); setUserFormOpen(true); setUserForm({ name: "", email: "", role: "user", password: "" }); }}>
            Add user
          </Button>
          {userFormOpen && (
            <Card className="space-y-3 border-primary p-4">
              <h3 className="font-semibold">{editingUserId ? "Edit user" : "Add user"}</h3>
              <div className="grid gap-2 md:grid-cols-2">
                <Input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} placeholder="Full name" />
                <Input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} placeholder="Email" />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value as "user" | "admin" })}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <Input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} placeholder={editingUserId ? "New password (optional)" : "Password"} minLength={6} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveUser}><Save className="mr-1 h-4 w-4" />Save user</Button>
                <Button size="sm" variant="outline" onClick={() => { setEditingUserId(null); setUserFormOpen(false); setUserForm({ name: "", email: "", role: "user", password: "" }); }}>Cancel</Button>
              </div>
            </Card>
          )}
          {users.length === 0 && <p className="text-muted-foreground">No users yet.</p>}
          {users.map((managedUser) => (
            <Card key={managedUser.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{managedUser.name}</p>
                <p className="text-sm text-muted-foreground">{managedUser.email}</p>
              </div>
              <Badge variant={managedUser.role === "admin" ? "default" : "secondary"}>
                {managedUser.role}
              </Badge>
              <Button size="icon" variant="ghost" aria-label={`Edit ${managedUser.name}`} onClick={() => startUserEditing(managedUser)}><Pencil className="h-4 w-4" /></Button>
              <span className="text-sm text-muted-foreground">Joined {fmt(managedUser.createdAt)}</span>
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
