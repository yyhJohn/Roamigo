import { z } from 'zod';
import { CurrencySchema } from '../schemas.js';

export const PreferredLanguageSchema = z.enum(['en', 'es', 'fr', 'de', 'zh']);
export const ThemePreferenceSchema = z.enum(['light', 'dark', 'system']);

export const UpdateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters.')
    .max(60, 'Display name must be 60 characters or fewer.'),
  avatarColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Select a valid hex colour.'),
  preferredCurrency: CurrencySchema,
  preferredLanguage: PreferredLanguageSchema,
  themePreference: ThemePreferenceSchema,
  privacyShareEmail: z.boolean(),
});

export const DeleteAccountSchema = z.object({
  confirmPhrase: z.literal('DELETE MY ACCOUNT', {
    errorMap: () => ({
      message: 'Type DELETE MY ACCOUNT in uppercase to confirm.',
    }),
  }),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type DeleteAccountInput = z.infer<typeof DeleteAccountSchema>;
