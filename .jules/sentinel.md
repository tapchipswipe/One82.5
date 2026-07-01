## 2026-07-01 - Secure Random Identifier Generation
**Vulnerability:** Weak random number generation using Math.random() for session IDs and tokens.
**Learning:** Math.random() is not cryptographically secure. Using it for sensitive identifiers can lead to session hijacking. Also, when using crypto.getRandomValues, use a sufficiently sized byte array (Uint8Array) rather than a single Uint32Array integer to avoid downgrading entropy.
**Prevention:** Always use the global crypto object (randomUUID or getRandomValues with Uint8Array) when generating security-sensitive tokens or IDs, providing a fallback only when absolutely necessary in non-secure environments.
