import { z } from 'zod';
import { CurrencySchema } from '../schemas.js';

export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password must be 128 characters or fewer.')
  .regex(/[A-Za-z]/, 'Password must include at least one letter.')
  .regex(/[0-9]/, 'Password must include at least one number.');

export const RegisterInputSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.').max(160),
  password: PasswordSchema,
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters.')
    .max(60, 'Display name must be 60 characters or fewer.'),
  preferredCurrency: CurrencySchema.default('GBP'),
});

export const LoginInputSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.').max(160),
  password: z.string().min(1, 'Enter your password.').max(128),
});

export const ForgotPasswordInputSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.').max(160),
});

export const ResetPasswordInputSchema = z.object({
  token: z.string().trim().min(16, 'Invalid reset token.').max(256),
  newPassword: PasswordSchema,
});

export const VerifyEmailInputSchema = z.object({
  token: z.string().trim().min(16, 'Invalid verification token.').max(256),
});

export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;

export interface AuthUserDto {
  id: string;
  email: string;
  displayName: string;
  avatarColor: string;
  preferredCurrency: 'GBP' | 'USD' | 'EUR';
  preferredLanguage: string;
  themePreference: string;
  privacyShareEmail: boolean;
  emailVerified: boolean;
  isDemo: boolean;
}

export interface AuthSessionDto {
  authenticated: boolean;
  user: AuthUserDto | null;
  csrfToken: string | null;
  oauthGoogleEnabled: boolean;
  smtpEnabled: boolean;
}
