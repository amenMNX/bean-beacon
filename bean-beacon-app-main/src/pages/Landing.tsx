import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Coffee, MapPin, Heart, Star, Wifi } from "lucide-react";

export const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Coffee className="w-8 h-8 text-amber-700" />
            <span className="font-bold text-xl">Bean Beacon</span>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate("/login")}>
              Login
            </Button>
            <Button onClick={() => navigate("/register")}>Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold mb-6">
          Your Coffee. Your Way.
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Discover the perfect café or coffee shop near you. Browse by location,
          read reviews, find WiFi and power outlets, and build your list of
          favorite spots.
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => navigate("/explore")}
            className="text-lg"
          >
            Start Exploring
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/register")}>
            Create Account
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: MapPin,
              title: "Find Nearby Cafés",
              description: "Discover coffee shops and cafés around your location with interactive maps",
            },
            {
              icon: Heart,
              title: "Save Favorites",
              description: "Build your personal list of favorite spots and access them anytime",
            },
            {
              icon: Star,
              title: "Read & Write Reviews",
              description: "Share your experience and read ratings from the community",
            },
            {
              icon: Wifi,
              title: "Filter by Amenities",
              description: "Find places with WiFi, power outlets, and quiet work spaces",
            },
            {
              icon: Coffee,
              title: "Detailed Information",
              description: "Access opening hours, contact info, websites, and more",
            },
            {
              icon: null as any,
              title: "Dark Mode",
              description: "Comfortable viewing in any lighting condition",
            },
          ].map((feature, idx) => (
            <Card key={idx} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                {feature.icon && (
                  <feature.icon className="w-12 h-12 text-amber-700 mb-4" />
                )}
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-amber-700 dark:bg-amber-900 text-white py-20 mt-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-6">Ready to find your next favorite café?</h2>
          <Button
            size="lg"
            className="bg-white text-amber-700 hover:bg-slate-100"
            onClick={() => navigate("/explore")}
          >
            Start Exploring Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>
            Bean Beacon &copy; 2024. Built with ☕ for coffee lovers everywhere.
          </p>
        </div>
      </footer>
    </div>
  );
};
