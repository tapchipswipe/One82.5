## 2026-06-27 - Secure Randomness for Session Tokens
**Vulnerability:** The backend session tokens and IDs were generated using Math.random(), which is predictable and insecure for security tokens.
**Learning:** Math.random() lacks sufficient entropy and can lead to session hijacking. Fallbacks for environments lacking crypto.randomUUID should rely on crypto.getRandomValues.
**Prevention:** Always use cryptographically secure APIs (crypto.getRandomValues or crypto.randomUUID) for generating auth tokens or session IDs, preserving typeof checks to prevent ReferenceErrors.
