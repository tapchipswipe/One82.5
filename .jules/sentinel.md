## 2026-06-08 - [Secure Session ID Generation]
**Vulnerability:** Weak pseudo-random number generator (Math.random()) used for session ID creation in api/_lib/backend.ts, which can be predictable.
**Learning:** Even internal backend session identifiers need strong cryptographic randomness to prevent session hijacking or token prediction vulnerabilities.
**Prevention:** Always use the Web Crypto API (crypto.getRandomValues or crypto.randomUUID) for generating any security-sensitive identifiers or session tokens, even outside of strictly authentication contexts.
