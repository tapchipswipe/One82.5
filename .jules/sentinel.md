## 2024-05-24 - Fix Insecure Session Token Generation
**Vulnerability:** Weak randomness (Math.random) used for generating authentication session IDs and tokens in api/_lib/backend.ts, allowing session prediction/hijacking.
**Learning:** Cryptographically secure PRNG (crypto.randomUUID) must be used for all security-critical identifiers. If secure randomness is not available in the environment, the application must fail securely rather than falling back to an insecure method.
**Prevention:** Never use Math.random() or Date.now() for security-sensitive tokens. Always verify the environment supports secure randomness before generating tokens.
