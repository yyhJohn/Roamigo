import { describe, expect, it } from 'vitest';
import { sanitizeInternalRedirect } from '../../src/pages/AuthPage';

describe('Milestone 10 Security: Open-redirect sanitization', () => {
  it('permits internal relative paths and blocks protocol/backslash open redirects', () => {
    expect(sanitizeInternalRedirect('/trips')).toBe('/trips');
    expect(sanitizeInternalRedirect('/invites/abc-123')).toBe('/invites/abc-123');
    expect(sanitizeInternalRedirect(null)).toBe('/trips');
    expect(sanitizeInternalRedirect('https://evil.invalid')).toBe('/trips');
    expect(sanitizeInternalRedirect('//evil.invalid')).toBe('/trips');
    expect(sanitizeInternalRedirect('/\\evil.invalid')).toBe('/trips');
    expect(sanitizeInternalRedirect('javascript:alert(1)')).toBe('/trips');
  });
});
