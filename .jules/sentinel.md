## 2026-06-25 - Secure Randomness for Session Tokens
**Vulnerability:** The `Math.random()` function was used to generate session IDs and fallback session tokens. `Math.random()` is not cryptographically secure and can be predicted, leading to session hijacking risks.
**Learning:** In backend environments where `crypto.randomUUID()` might not be available or needs a fallback, using `Math.random()` exposes the application to security risks. Secure random generation must use `crypto.getRandomValues()` with a sufficiently sized byte array mapped to a string.
**Prevention:** Always use `crypto.getRandomValues()` or `crypto.randomUUID()` for generating sensitive tokens, session IDs, or any security-related random strings. Never use `Math.random()` for security contexts.
