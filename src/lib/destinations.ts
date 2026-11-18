export interface CuratedDestination {
  slug: string;
  city: string;
  country: string;
  tagline: string;
  estBudgetGbp: number;
  recommendedDays: number;
  lat: number;
  lng: number;
  imageUrl: string;
  photographer: string;
  highlights: string[];
}

export const CURATED_DESTINATIONS: CuratedDestination[] = [
  {
    slug: 'barcelona',
    city: 'Barcelona',
    country: 'Spain',
    tagline: 'Modernist architecture, Gothic alleys & shared tapas nights.',
    estBudgetGbp: 265,
    recommendedDays: 4,
    lat: 41.3874,
    lng: 2.1686,
    imageUrl:
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=900&q=80',
    photographer: 'Enes (Unsplash License)',
    highlights: ['El Born & Picasso Museum', 'Montjuïc Coast', 'Pintxos Crawl'],
  },
  {
    slug: 'lisbon',
    city: 'Lisbon',
    country: 'Portugal',
    tagline: 'Sunlit viewpoints, historic trams & affordable Atlantic seafood.',
    estBudgetGbp: 230,
    recommendedDays: 4,
    lat: 38.7223,
    lng: -9.1393,
    imageUrl:
      'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=80',
    photographer: 'Liam McKay (Unsplash License)',
    highlights: ['Alfama Miradouros', 'Belém Pastéis', 'Sintra Day Rail'],
  },
  {
    slug: 'kyoto',
    city: 'Kyoto',
    country: 'Japan',
    tagline: 'Bamboo groves, lantern-lit alleys & calm temple gardens.',
    estBudgetGbp: 490,
    recommendedDays: 6,
    lat: 35.0116,
    lng: 135.7681,
    imageUrl:
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=80',
    photographer: 'Su San Lee (Unsplash License)',
    highlights: ['Fushimi Inari Dawn Walk', 'Nishiki Market', 'Arashiyama'],
  },
  {
    slug: 'edinburgh',
    city: 'Edinburgh',
    country: 'United Kingdom',
    tagline: 'Volcanic viewpoints, cosy pubs & student-friendly culture.',
    estBudgetGbp: 210,
    recommendedDays: 3,
    lat: 55.9533,
    lng: -3.1883,
    imageUrl:
      'https://images.unsplash.com/photo-1506377585622-bedcbb027afc?auto=format&fit=crop&w=900&q=80',
    photographer: 'Connor Mollison (Unsplash License)',
    highlights: ['Arthur’s Seat Hike', 'Old Town Closes', 'National Museum'],
  },
];
