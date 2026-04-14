## 2025-02-17 - Weak Randomness in Session Identifier Generation
**Vulnerability:** Weak, predictable random values (`Math.random()`) were used as fallbacks for generating critical security tokens (session IDs and session tokens) in `api/_lib/backend.ts`.
**Learning:** Even if a secure method (`crypto.randomUUID()`) is intended, providing an insecure fallback (`Math.random()`) completely undermines the security if the environment lacks the secure method. Predictable session tokens can lead to session hijacking.
**Prevention:** Never use deterministic, time-based values or `Math.random()` for cryptographic randomness. If secure randomness is unavailable in the environment, the application must throw an error and fail securely rather than silently falling back to an insecure implementation.
