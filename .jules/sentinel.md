## 2026-06-09 - Insecure Randomness in Cryptographic Tokens

**Vulnerability:** Weak deterministic randomness (`Math.random()`) used for generating `sessionId` and fallback `sessionToken` in `api/_lib/backend.ts`.
**Learning:** Never use `Math.random()` or `Date.now()` for security-critical identifiers. It exposes tokens to prediction vulnerabilities, especially when seeded by observable time sources. While the fallback for session token uses `crypto.randomUUID()` when available, the `sessionId` strictly uses `Math.random()`, and the fallback token generator itself has an insecure secondary path.
**Prevention:** Consistently use the Web Crypto API (`crypto.getRandomValues` or `crypto.randomUUID()`) for generating any form of secure session or authentication token. If not available, throw a secure error rather than silently degrading to `Math.random()`.
