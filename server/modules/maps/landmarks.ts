import type { PlaceCandidateDto } from '../../../src/lib/contracts/activity.schemas.js';
import { CURATED_LANDMARKS } from './landmarks.data.js';

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function matchCuratedLandmark(
  rawLocation: string | null | undefined,
  destinations?: string[],
): PlaceCandidateDto | null {
  if (!rawLocation) return null;
  const q = normalize(rawLocation);
  if (q.length < 3) return null;

  const destNorms = (destinations ?? []).map(normalize);
  for (const place of CURATED_LANDMARKS) {
    const cityNorm = normalize(place.city);
    if (
      destNorms.length > 0 &&
      !destNorms.some((d) => d.includes(cityNorm) || cityNorm.includes(d))
    ) {
      continue;
    }
    const nameNorm = normalize(place.name);
    if (
      nameNorm.includes(q) ||
      q.includes(nameNorm) ||
      place.aliases.some((alias) => q.includes(normalize(alias)))
    ) {
      return {
        name: place.name,
        city: place.city,
        lat: place.lat,
        lng: place.lng,
        coordSource: 'curated',
      };
    }
  }
  return null;
}

export function searchCuratedLandmarks(
  query: string,
  destinations?: string[],
): PlaceCandidateDto[] {
  const q = normalize(query);
  const destNorms = (destinations ?? []).map(normalize);

  return CURATED_LANDMARKS.filter((place) => {
    const cityNorm = normalize(place.city);
    const cityMatch =
      destNorms.length === 0 ||
      destNorms.some((d) => d.includes(cityNorm) || cityNorm.includes(d));
    if (!q) return cityMatch;
    const hay = `${normalize(place.name)} ${cityNorm} ${place.aliases
      .map(normalize)
      .join(' ')}`;
    return hay.includes(q);
  })
    .slice(0, 8)
    .map((p) => ({
      name: p.name,
      city: p.city,
      lat: p.lat,
      lng: p.lng,
      coordSource: 'curated' as const,
    }));
}
