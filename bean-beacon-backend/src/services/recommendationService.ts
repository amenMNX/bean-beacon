export interface RecommendableCafe {
  id: string;
  name: string;
  address?: string;
  category?: string;
  coffeeTypes?: string[];
  atmosphere?: string[];
  amenities?: string[];
  menu?: string;
  rating?: number;
}

export interface CafeRecommendation {
  id: string;
  reason: string;
}

interface Preferences {
  drink: string;
  atmosphere: string;
  location: string;
}

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const tokens = (value: string) =>
  normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1);

const formatPreferenceLabels = (labels: string[]) => {
  if (labels.length < 2) {
    return labels[0] ?? "";
  }
  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
};

const matchRatio = (preference: string, fields: string[]) => {
  const preferenceTokens = [...new Set(tokens(preference))];
  if (preferenceTokens.length === 0) {
    return 0;
  }

  const searchableTokens = new Set(fields.flatMap(tokens));
  const matchedTokens = preferenceTokens.filter((token) => searchableTokens.has(token));
  return matchedTokens.length / preferenceTokens.length;
};

export const recommendCafes = (
  cafes: RecommendableCafe[],
  preferences: Preferences
): CafeRecommendation[] => {
  const ranked = cafes
    .map((cafe) => {
      const matches = [
        {
          label: "drink",
          preference: preferences.drink,
          fields: [cafe.name, cafe.category ?? "", cafe.menu ?? "", ...(cafe.coffeeTypes ?? [])],
          weight: 3,
        },
        {
          label: "atmosphere",
          preference: preferences.atmosphere,
          fields: [cafe.name, cafe.category ?? "", ...(cafe.atmosphere ?? []), ...(cafe.amenities ?? [])],
          weight: 3,
        },
        {
          label: "location",
          preference: preferences.location,
          fields: [cafe.name, cafe.address ?? ""],
          weight: 2,
        },
      ].filter((match) => match.preference.trim());

      const scoredMatches = matches.map((match) => ({
        label: match.label,
        score: matchRatio(match.preference, match.fields),
        weight: match.weight,
      }));
      const score = scoredMatches.reduce(
        (total, match) => total + match.score * match.weight,
        0
      );

      return {
        cafe,
        score,
        reasonLabels: scoredMatches
          .filter((match) => match.score > 0)
          .map((match) => match.label),
      };
    })
    .filter((match) => match.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.cafe.rating ?? 0) - (a.cafe.rating ?? 0) ||
        a.cafe.name.localeCompare(b.cafe.name)
    )
    .slice(0, 3);

  return ranked.map(({ cafe, reasonLabels }) => ({
    id: cafe.id,
    reason: `Matches your ${formatPreferenceLabels(reasonLabels)} preferences.`,
  }));
};
