import { describe, expect, it } from 'vitest';
import { extractVerificationCode } from '../src/utils/verification-code';

describe('extractVerificationCode', () => {
    it('extracts a labelled code', () => {
        expect(extractVerificationCode('Your verification code is 839201')).toBe('839201');
    });

    it('falls back to a numeric code', () => {
        expect(extractVerificationCode('登录验证码：123456')).toBe('123456');
    });

    it('returns null when no code exists', () => {
        expect(extractVerificationCode('Welcome to Cloud Mail')).toBe(null);
    });
});
