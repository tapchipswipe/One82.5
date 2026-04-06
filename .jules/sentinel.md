## 2024-04-06 - Insecure Session Token Generation
**Vulnerability:** The application was using `Math.random()` and `Date.now()` to generate session IDs and session tokens in the backend authentication module. This resulted in predictable session identifiers.
**Learning:** `Math.random()` is not cryptographically secure and can be predicted, especially when seeded or combined with deterministic values like `Date.now()`. This exposes the application to session hijacking attacks.
**Prevention:** Always use cryptographically secure random number generators (CSPRNG) such as `crypto.randomUUID()` or `crypto.getRandomValues()` for security-sensitive identifiers, tokens, and session IDs.
