
## 2024-05-18 - Insecure Randomness Fallbacks
**Vulnerability:** Weak randomness (Math.random()) used as a fallback for secure session IDs and session tokens in `api/_lib/backend.ts` when Web Crypto API is unavailable.
**Learning:** Even environment-agnostic backend files shouldn't fall back to `Math.random()` for critical cryptographic operations like generating tokens. It creates a false sense of security and a prediction vulnerability.
**Prevention:** If secure randomness (`crypto.randomUUID()`) is unavailable, the application should throw a fatal error securely rather than degrading to insecure entropy. Use `(crypto as any).randomUUID()` to handle TypeScript issues with global `crypto`.
