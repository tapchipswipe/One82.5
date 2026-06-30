## 2026-06-30 - Secure Randomness for Session IDs
**Vulnerability:** The `Math.random()` function was used to generate session IDs in `api/_lib/backend.ts`.
**Learning:** `Math.random()` is not cryptographically secure and can be predictable, potentially allowing session hijacking if an attacker guesses the random values used for session IDs.
**Prevention:** Always use cryptographically secure pseudo-random number generators (CSPRNGs) like `crypto.randomUUID()` or `crypto.getRandomValues()` for security-sensitive operations such as generating tokens, passwords, or session IDs. Fallback mechanisms should maintain target length and entropy as much as possible if CSPRNG is entirely unavailable (e.g., in some serverless edges without Web Crypto API, though mostly supported now).
