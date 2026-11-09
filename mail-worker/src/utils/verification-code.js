const codePatterns = [
    /(?:验证码|verification\s*code|security\s*code|one[-\s]?time\s*password|otp|passcode|code)\D{0,20}([A-Z0-9]{4,8})/i,
    /\b(\d{4,8})\b/
];

export function extractVerificationCode(value) {
    const text = String(value || '').replace(/\s+/g, ' ');

    for (const pattern of codePatterns) {
        const match = text.match(pattern);
        if (match) return match[1];
    }

    return null;
}
