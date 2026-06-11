## 2026-06-11 - Fix Insecure Randomness in Session Generation
**Vulnerability:** The application was using the non-cryptographically secure `Math.random()` to generate session IDs and tokens in `api/_lib/backend.ts`.
**Learning:** Using `Math.random()` for security-critical functions like token generation can lead to predictable identifiers and potential session hijacking. Web Crypto API methods like `crypto.getRandomValues` or `crypto.randomUUID` should be used instead.
**Prevention:** Always use cryptographically secure random number generators (CSPRNG) for session tokens, passwords, and other security-sensitive tokens.
