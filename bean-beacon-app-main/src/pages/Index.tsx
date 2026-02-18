import { useState, useMemo } from "react";
import { Coffee, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoffeeCard } from "@/components/CoffeeCard";
import { SearchAndFilters } from "@/components/SearchAndFilters";
import { LocationRequest } from "@/components/LocationRequest";
import { PurposeSelector, type CoffeePurpose } from "@/components/PurposeSelector";
import { mockCoffeeShops } from "@/data/coffeeShops";
import heroImage from "@/assets/hero-coffee.jpg";

const Index = () => {
  const [currentStep, setCurrentStep] = useState<'location' | 'purpose' | 'results'>('location');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; address?: string }>();
  const [selectedPurpose, setSelectedPurpose] = useState<CoffeePurpose>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRating, setSelectedRating] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const handleLocationReceived = (location: { lat: number; lng: number; address?: string }) => {
    setUserLocation(location);
    setCurrentStep('purpose');
  };

  const handlePurposeSelected = (purpose: CoffeePurpose) => {
    setSelectedPurpose(purpose);
    setCurrentStep('results');
  };

  const filteredShops = useMemo(() => {
    let shops = mockCoffeeShops;
    
    // Filter based on purpose preferences
    if (selectedPurpose) {
      // In a real app, this would filter based on Google Places data
      // For now, we'll filter based on price range preferences
      if (selectedPurpose.preferences.priceRange.length > 0) {
        shops = shops.filter(shop => selectedPurpose.preferences.priceRange.includes(shop.priceRange));
      }
    }

    return shops.filter((shop) => {
      const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           shop.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           shop.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRating = selectedRating === "all" || shop.rating >= parseFloat(selectedRating);
      
      const matchesPrice = selectedPrice === "all" || shop.priceRange === selectedPrice;

      return matchesSearch && matchesRating && matchesPrice;
    });
  }, [searchQuery, selectedRating, selectedPrice, selectedPurpose]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-80" />
        
        <div className="relative z-10 text-center text-primary-foreground px-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Coffee className="w-12 h-12 text-coffee-gold" />
            <h1 className="text-5xl md:text-6xl font-bold">
              CoffeeSpot
            </h1>
          </div>
          <p className="text-xl md:text-2xl mb-8 text-coffee-cream">
            Get personalized coffee shop recommendations based on your location and purpose
          </p>
          
          {currentStep === 'location' && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-coffee-cream">
                <div className="w-6 h-6 bg-coffee-gold rounded-full flex items-center justify-center text-foreground text-sm font-bold">1</div>
                <span>Share Location</span>
                <ArrowRight className="w-4 h-4" />
                <div className="w-6 h-6 bg-coffee-cream/30 rounded-full flex items-center justify-center text-coffee-cream text-sm font-bold">2</div>
                <span>Choose Purpose</span>
                <ArrowRight className="w-4 h-4" />
                <div className="w-6 h-6 bg-coffee-cream/30 rounded-full flex items-center justify-center text-coffee-cream text-sm font-bold">3</div>
                <span>Find Coffee</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12">
        {currentStep === 'location' && (
          <div className="max-w-md mx-auto">
            <LocationRequest 
              onLocationReceived={handleLocationReceived}
              currentLocation={userLocation}
            />
          </div>
        )}

        {currentStep === 'purpose' && (
          <div className="max-w-4xl mx-auto">
            <PurposeSelector 
              onSelectPurpose={handlePurposeSelected}
              selectedPurpose={selectedPurpose}
            />
            
            {selectedPurpose && (
              <div className="mt-8 text-center">
                <Button 
                  onClick={() => handlePurposeSelected(selectedPurpose)}
                  className="bg-coffee-brown hover:bg-coffee-brown/90 text-primary-foreground shadow-coffee"
                  size="lg"
                >
                  Find Coffee Shops for {selectedPurpose.title}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}

        {currentStep === 'results' && (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Perfect for {selectedPurpose?.title}
                  </h2>
                  <p className="text-muted-foreground">
                    {userLocation?.address && `Near ${userLocation.address} • `}
                    {filteredShops.length} {filteredShops.length === 1 ? 'place' : 'places'} found
                  </p>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setCurrentStep('purpose')}
                  className="border-coffee-brown text-coffee-brown hover:bg-coffee-brown hover:text-primary-foreground"
                >
                  Change Purpose
                </Button>
              </div>
            </div>

            <div className="mb-8">
              <SearchAndFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedRating={selectedRating}
                onRatingChange={setSelectedRating}
                selectedPrice={selectedPrice}
                onPriceChange={setSelectedPrice}
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(!showFilters)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredShops.map((shop) => (
                <CoffeeCard key={shop.id} shop={shop} />
              ))}
            </div>

            {filteredShops.length === 0 && (
              <div className="text-center py-12">
                <Coffee className="w-16 h-16 text-coffee-light mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No coffee shops found
                </h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters to find more coffee shops.
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Index;