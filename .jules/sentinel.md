## 2026-06-01 - Insecure Randomness in Session Tokens
**Vulnerability:** Weak, predictable random number generation `Math.random()` used for generating sensitive session IDs and session tokens in backend authentication logic.
**Learning:** Security-critical tokens require cryptographically secure pseudo-random number generators (CSPRNG). Time-based and predictable mathematical sequences open systems up to token-prediction and session-hijacking attacks.
**Prevention:** Strictly enforce the use of the Web Crypto API `(crypto as any).randomUUID()` or `crypto.getRandomValues()` for session tokens, and fail closed (throw an error) if the secure context is unavailable to prevent insecure fallbacks.
