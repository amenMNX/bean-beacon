import { useState } from "react";
import { MapPin, Navigation, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface LocationState {
  status: 'idle' | 'requesting' | 'success' | 'error';
  coordinates?: { lat: number; lng: number };
  address?: string;
  error?: string;
}

interface LocationRequestProps {
  onLocationReceived: (location: { lat: number; lng: number; address?: string }) => void;
  currentLocation?: { lat: number; lng: number; address?: string };
}

export const LocationRequest = ({ onLocationReceived, currentLocation }: LocationRequestProps) => {
  const [locationState, setLocationState] = useState<LocationState>({ status: 'idle' });
  const { toast } = useToast();

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setLocationState({
        status: 'error',
        error: 'Geolocation is not supported by your browser'
      });
      return;
    }

    setLocationState({ status: 'requesting' });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Try to get address from coordinates using reverse geocoding
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          let address = "Current Location";
          if (response.ok) {
            const data = await response.json();
            address = `${data.city || data.locality || ''}, ${data.principalSubdivision || ''} ${data.postcode || ''}`.trim();
          }

          const location = { lat: latitude, lng: longitude, address };
          setLocationState({
            status: 'success',
            coordinates: { lat: latitude, lng: longitude },
            address
          });
          
          onLocationReceived(location);
          
          toast({
            title: "Location Found!",
            description: `We'll find coffee shops near ${address}`,
          });
        } catch (error) {
          const location = { lat: latitude, lng: longitude, address: "Current Location" };
          setLocationState({
            status: 'success',
            coordinates: { lat: latitude, lng: longitude },
            address: "Current Location"
          });
          onLocationReceived(location);
        }
      },
      (error) => {
        let errorMessage = "Unable to get your location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }

        setLocationState({
          status: 'error',
          error: errorMessage
        });

        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  if (currentLocation) {
    return (
      <Card className="bg-coffee-cream border-coffee-brown/20">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-coffee-brown rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Using your location</p>
              <p className="text-sm text-muted-foreground">{currentLocation.address}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={requestLocation}
            className="border-coffee-brown text-coffee-brown hover:bg-coffee-brown hover:text-primary-foreground"
          >
            Update
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card">
      <CardContent className="p-6 space-y-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-coffee-gold rounded-full flex items-center justify-center mx-auto mb-4">
            <Navigation className="w-8 h-8 text-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Find Coffee Shops Near You
          </h2>
          <p className="text-muted-foreground mb-4">
            We need your location to show you the best coffee shops nearby with real ratings and prices from Google.
          </p>
        </div>

        {locationState.status === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{locationState.error}</AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={requestLocation}
          disabled={locationState.status === 'requesting'}
          className="w-full bg-coffee-brown hover:bg-coffee-brown/90 text-primary-foreground shadow-coffee"
          size="lg"
        >
          {locationState.status === 'requesting' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
              Getting Your Location...
            </>
          ) : (
            <>
              <MapPin className="w-5 h-5 mr-2" />
              Share My Location
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Your location is only used to find nearby coffee shops and is not stored.
        </p>
      </CardContent>
    </Card>
  );
};