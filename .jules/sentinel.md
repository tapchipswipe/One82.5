## 2025-04-09 - Insecure Randomness in Authentication Tokens
**Vulnerability:** The `Math.random()` function was being used as a fallback or component to generate session IDs and session tokens in `api/_lib/backend.ts`.
**Learning:** `Math.random()` is not cryptographically secure and produces predictable values. This means session IDs and tokens could be guessed or brute-forced, leading to session hijacking or forgery.
**Prevention:** Always use cryptographically secure random number generators like `crypto.randomUUID()` or `crypto.getRandomValues()` for sensitive values, such as authentication tokens, session IDs, and cryptographic keys. Remove fallback mechanisms that rely on insecure randomness if secure randomness is not available; it's better to fail securely than use weak entropy.
