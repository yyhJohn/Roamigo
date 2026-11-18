export const OPENAPI_DOCUMENT = {
  openapi: '3.1.0',
  info: {
    title: 'Roamigo Collaborative Travel API',
    version: '1.0.0',
    description:
      'Production REST API for Roamigo: collaborative group trips, multi-provider AI itineraries, voting, integer minor-unit budgets, expense splits, settlements, and exports.',
  },
  components: {
    securitySchemes: {
      sessionCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'roamigo_session',
      },
      csrfHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'X-CSRF-Token',
      },
    },
    schemas: {
      ErrorEnvelope: {
        type: 'object',
        required: ['ok', 'error'],
        properties: {
          ok: { type: 'boolean', const: false },
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              fieldErrors: {
                type: 'object',
                additionalProperties: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        summary: 'Liveness & AI configuration summary',
        responses: { '200': { description: 'Service healthy' } },
      },
    },
    '/api/health/ready': {
      get: {
        summary: 'PostgreSQL & upstream readiness check',
        responses: {
          '200': { description: 'Database connected' },
          '503': { description: 'Database unavailable' },
        },
      },
    },
    '/api/auth/register': {
      post: {
        summary: 'Register a new user account and issue HttpOnly session cookie',
        responses: { '201': { description: 'Registered' }, '409': { description: 'Email exists' } },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Authenticate user and issue HttpOnly session + CSRF token',
        responses: { '200': { description: 'Authenticated' }, '401': { description: 'Invalid credentials' } },
      },
    },
    '/api/auth/me': {
      get: {
        summary: 'Fetch current authenticated session user and CSRF token',
        responses: { '200': { description: 'Session status' } },
      },
    },
    '/api/trips': {
      get: {
        summary: 'List authenticated user trips with filters, search, and demo trip',
        security: [{ sessionCookie: [] }],
        responses: { '200': { description: 'Paginated trip list' } },
      },
      post: {
        summary: 'Create a new collaborative trip or wizard draft',
        security: [{ sessionCookie: [], csrfHeader: [] }],
        responses: { '201': { description: 'Trip created' } },
      },
    },
    '/api/trips/import-local': {
      post: {
        summary: 'Import legacy roamigo:v1:trip localStorage state into PostgreSQL',
        security: [{ sessionCookie: [], csrfHeader: [] }],
        responses: { '201': { description: 'Imported trip' } },
      },
    },
    '/api/trips/{tripId}': {
      get: {
        summary: 'Fetch full trip workspace state for an authorised member',
        security: [{ sessionCookie: [] }],
        responses: { '200': { description: 'Trip workspace detail' }, '403': { description: 'Forbidden' } },
      },
    },
    '/api/trips/{tripId}/itinerary/generate': {
      post: {
        summary: 'Generate a new AI itinerary version from member preferences',
        security: [{ sessionCookie: [], csrfHeader: [] }],
        responses: { '200': { description: 'Generated itinerary version' } },
      },
    },
    '/api/trips/{tripId}/ai/propose': {
      post: {
        summary: 'Propose staged Before/After itinerary diff with deterministic budget impact',
        security: [{ sessionCookie: [], csrfHeader: [] }],
        responses: { '200': { description: 'Staged diff proposal' } },
      },
    },
    '/api/trips/{tripId}/expenses': {
      post: {
        summary: 'Record an expense in integer minor units with EQUAL, CUSTOM, or PERCENTAGE splits',
        security: [{ sessionCookie: [], csrfHeader: [] }],
        responses: { '201': { description: 'Expense recorded & settlements recalculated' } },
      },
    },
  },
} as const;
