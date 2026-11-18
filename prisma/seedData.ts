import type { ActivityCategory, TimeSlot } from '@prisma/client';

export const DEMO_TRIP_ID = '00000000-0000-4000-8000-000000000001';
export const DEMO_PASSWORD = 'RoamigoDemo2026!';

export interface DemoDaySeed {
  dayNumber: number;
  date: string;
  theme: string;
  activities: {
    stableKey: string;
    sortOrder: number;
    title: string;
    description: string;
    category: ActivityCategory;
    timeSlot: TimeSlot;
    startTime: string;
    endTime: string;
    estimatedCostMinor: number;
    locationName: string;
    lat: number;
    lng: number;
    compromiseExplanation: string;
    matchedTravellers: string[];
  }[];
}

export const DEMO_BARCELONA_DAYS: DemoDaySeed[] = [
  {
    dayNumber: 1,
    date: '2026-12-04',
    theme: 'Gothic Quarter Architecture & El Born Tapas',
    activities: [
      {
        stableKey: 'bcn-d1-picasso',
        sortOrder: 0,
        title: 'Picasso Museum & El Born Medieval Lanes',
        description:
          'Morning entry to the Palau Aguilar courtyards followed by an espresso walk through El Born.',
        category: 'CULTURE',
        timeSlot: 'MORNING',
        startTime: '10:00',
        endTime: '12:30',
        estimatedCostMinor: 1400,
        locationName: 'Museu Picasso, Carrer de Montcada',
        lat: 41.3852,
        lng: 2.1809,
        compromiseExplanation:
          'Delivers Alice’s modern-art priority while keeping morning admission under £15.',
        matchedTravellers: ['Alice Chen', 'Sophie Laurent'],
      },
      {
        stableKey: 'bcn-d1-tapas',
        sortOrder: 1,
        title: 'El Born Shared Tapas & Pintxos Evening',
        description:
          'Three casual neighbourhood tapas stops with vegetarian and seafood plates.',
        category: 'FOOD',
        timeSlot: 'EVENING',
        startTime: '19:30',
        endTime: '22:00',
        estimatedCostMinor: 3200,
        locationName: 'Passeig del Born, Barcelona',
        lat: 41.3843,
        lng: 2.1825,
        compromiseExplanation:
          'Hits James’s food-and-social evening goal with shared plates everyone splits.',
        matchedTravellers: ['Alice Chen', 'James Okafor', 'Sophie Laurent'],
      },
    ],
  },
  {
    dayNumber: 2,
    date: '2026-12-05',
    theme: 'Mediterranean Coastline & Montjuïc Sunset',
    activities: [
      {
        stableKey: 'bcn-d2-kayak',
        sortOrder: 0,
        title: 'Barceloneta Sunrise Sea Kayaking',
        description:
          'Guided coastal paddle along Port Olímpic with wetsuit rental included.',
        category: 'OUTDOORS',
        timeSlot: 'MORNING',
        startTime: '09:30',
        endTime: '12:00',
        estimatedCostMinor: 3800,
        locationName: 'Platja de la Barceloneta',
        lat: 41.3784,
        lng: 2.1925,
        compromiseExplanation:
          'Satisfies Sophie’s active outdoor request while leaving the afternoon relaxed.',
        matchedTravellers: ['Sophie Laurent', 'James Okafor'],
      },
      {
        stableKey: 'bcn-d2-montjuic',
        sortOrder: 1,
        title: 'Montjuïc Gardens & Mirador Panorama Walk',
        description:
          'Scenic hillside walk overlooking the harbour and city skyline at golden hour.',
        category: 'OUTDOORS',
        timeSlot: 'AFTERNOON',
        startTime: '16:00',
        endTime: '18:30',
        estimatedCostMinor: 900,
        locationName: 'Castell de Montjuïc',
        lat: 41.3633,
        lng: 2.1659,
        compromiseExplanation:
          'Low-cost scenic highlight balancing Alice’s £240 target with photography views.',
        matchedTravellers: ['Alice Chen', 'Sophie Laurent'],
      },
    ],
  },
  {
    dayNumber: 3,
    date: '2026-12-06',
    theme: 'Gaudí Mosaic Terrace & Farewell Market Lunch',
    activities: [
      {
        stableKey: 'bcn-d3-guell',
        sortOrder: 0,
        title: 'Park Güell Monumental Terrace',
        description:
          'Timed morning entry to Gaudí’s mosaic dragon stairway and viaduct paths.',
        category: 'CULTURE',
        timeSlot: 'MORNING',
        startTime: '09:30',
        endTime: '11:30',
        estimatedCostMinor: 1000,
        locationName: 'Park Güell, Gràcia',
        lat: 41.4145,
        lng: 2.1527,
        compromiseExplanation:
          'Unanimous architecture and outdoor crossover at an accessible £10 ticket.',
        matchedTravellers: ['Alice Chen', 'James Okafor', 'Sophie Laurent'],
      },
      {
        stableKey: 'bcn-d3-boqueria',
        sortOrder: 1,
        title: 'Mercat de la Boqueria Grazing Lunch',
        description:
          'Fresh fruit juices, artisan cheeses, and grilled seafood stalls before departure.',
        category: 'FOOD',
        timeSlot: 'AFTERNOON',
        startTime: '13:00',
        endTime: '14:30',
        estimatedCostMinor: 1800,
        locationName: 'Mercat de la Boqueria, La Rambla',
        lat: 41.3817,
        lng: 2.1716,
        compromiseExplanation:
          'Flexible pay-what-you-pick market lunch before airport transit.',
        matchedTravellers: ['Alice Chen', 'James Okafor', 'Sophie Laurent'],
      },
    ],
  },
];
