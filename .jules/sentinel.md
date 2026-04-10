
## 2024-05-18 - Predictable Session ID Generation
**Vulnerability:** Core auth functions (`createCookieSession`, `createSessionToken`) used `Math.random()` to generate secure tokens, introducing predictable randomness that could lead to token prediction or session hijacking.
**Learning:** `Math.random()` lacks cryptographic properties. While an insecure fallback existed, it's safer to mandate secure generation (via `crypto.randomUUID()`) and explicitly throw an error if unavailable, preventing environments from silently falling back to a vulnerable state.
**Prevention:** Always use `crypto.randomUUID()` or `crypto.getRandomValues()` for security-sensitive identifiers. Ensure environments failing to support secure random number generation fail loudly rather than insecurely.
