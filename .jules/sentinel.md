## 2024-05-24 - Insecure Randomness in Session Management
**Vulnerability:** `api/_lib/backend.ts` used `Math.random()` and `Date.now()` as fallbacks to generate session tokens and session IDs. This introduces a critical predictability vulnerability for session hijacking if `crypto` is ever unavailable.
**Learning:** Fallbacks to insecure randomness (like `Math.random()`) for security-critical functions (like generating session identifiers) should never exist. It is safer to break the application and throw an error to fail securely than to issue easily predictable session identifiers.
**Prevention:** Always use `crypto.randomUUID()` or `crypto.getRandomValues()` for sensitive identifiers. If unavailable, explicitly throw an error rather than gracefully degrading to a weak, time-based RNG.
