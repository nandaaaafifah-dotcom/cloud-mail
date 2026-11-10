import { describe, expect, it } from 'vitest';
import { validateSendRequest } from '../src/api/external-api';

describe('validateSendRequest', () => {
    it('normalizes the recipient and accepts either body format', () => {
        expect(validateSendRequest({ to: ' User@example.com ', subject: ' Hello ', text: 'Body' })).toEqual({
            to: 'user@example.com', subject: 'Hello', text: 'Body', html: ''
        });
        expect(validateSendRequest({ to: 'user@example.com', subject: 'Hello', html: '<p>Body</p>' }).html).toBe('<p>Body</p>');
    });

    it.each([
        null,
        [],
        { to: 'invalid', subject: 'Hello', text: 'Body' },
        { to: 'user@example.com', subject: '', text: 'Body' },
        { to: 'user@example.com', subject: 'line\nbreak', text: 'Body' },
        { to: 'user@example.com', subject: 'Hello', text: ' ', html: ' ' },
        { to: 'user@example.com', subject: 'Hello', text: 'Body', from: 'attacker@example.com' },
        { to: 'user@example.com', subject: 'Hello', text: 123 },
        { to: 'user@example.com', subject: 'Hello', text: 'x'.repeat(100_001) }
    ])('rejects invalid request %#', (params) => {
        expect(() => validateSendRequest(params)).toThrow();
    });
});
