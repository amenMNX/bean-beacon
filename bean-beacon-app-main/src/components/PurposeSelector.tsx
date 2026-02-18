import { Coffee, MapPin, Briefcase, Heart, Zap, Users, BookOpen, Wifi } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface CoffeePurpose {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  preferences: {
    atmosphere: string[];
    priceRange: string[];
    features: string[];
  };
}

export const coffeePurposes: CoffeePurpose[] = [
  {
    id: "work",
    title: "Work & Study",
    description: "Quiet spots with WiFi for productivity",
    icon: <Briefcase className="w-6 h-6" />,
    preferences: {
      atmosphere: ["quiet", "professional", "spacious"],
      priceRange: ["$", "$$"],
      features: ["wifi", "outlets", "long-stay-friendly"]
    }
  },
  {
    id: "date",
    title: "Date & Romance",
    description: "Cozy atmosphere for intimate conversations",
    icon: <Heart className="w-6 h-6" />,
    preferences: {
      atmosphere: ["cozy", "intimate", "romantic"],
      priceRange: ["$$", "$$$"],
      features: ["ambient-lighting", "comfortable-seating"]
    }
  },
  {
    id: "quick",
    title: "Quick Caffeine Fix",
    description: "Fast service for busy schedules",
    icon: <Zap className="w-6 h-6" />,
    preferences: {
      atmosphere: ["fast-service", "convenient"],
      priceRange: ["$", "$$"],
      features: ["mobile-order", "drive-through", "grab-and-go"]
    }
  },
  {
    id: "social",
    title: "Meet Friends",
    description: "Social spaces for group conversations",
    icon: <Users className="w-6 h-6" />,
    preferences: {
      atmosphere: ["social", "lively", "spacious"],
      priceRange: ["$", "$$", "$$$"],
      features: ["group-seating", "loud-friendly"]
    }
  },
  {
    id: "relax",
    title: "Relax & Read",
    description: "Peaceful environment to unwind",
    icon: <BookOpen className="w-6 h-6" />,
    preferences: {
      atmosphere: ["peaceful", "comfortable", "quiet"],
      priceRange: ["$", "$$"],
      features: ["comfortable-chairs", "natural-light", "book-friendly"]
    }
  },
  {
    id: "remote",
    title: "Remote Work",
    description: "Professional space for virtual meetings",
    icon: <Wifi className="w-6 h-6" />,
    preferences: {
      atmosphere: ["professional", "quiet", "reliable"],
      priceRange: ["$$", "$$$"],
      features: ["strong-wifi", "private-booths", "meeting-rooms"]
    }
  }
];

interface PurposeSelectorProps {
  onSelectPurpose: (purpose: CoffeePurpose) => void;
  selectedPurpose?: CoffeePurpose;
}

export const PurposeSelector = ({ onSelectPurpose, selectedPurpose }: PurposeSelectorProps) => {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          What's your coffee purpose today?
        </h2>
        <p className="text-muted-foreground">
          Tell us why you're looking for coffee and we'll find the perfect match
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coffeePurposes.map((purpose) => (
          <Card 
            key={purpose.id}
            className={`cursor-pointer transition-all duration-300 hover:shadow-hover hover:-translate-y-1 ${
              selectedPurpose?.id === purpose.id 
                ? 'ring-2 ring-coffee-brown bg-coffee-cream' 
                : 'bg-gradient-card hover:bg-coffee-cream/50'
            }`}
            onClick={() => onSelectPurpose(purpose)}
          >
            <CardContent className="p-6 text-center space-y-3">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                selectedPurpose?.id === purpose.id 
                  ? 'bg-coffee-brown text-primary-foreground' 
                  : 'bg-coffee-gold text-foreground'
              }`}>
                {purpose.icon}
              </div>
              <h3 className="font-semibold text-lg text-foreground">
                {purpose.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {purpose.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};