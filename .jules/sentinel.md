## 2026-05-17 - [Insecure Randomness for Session Tokens]
**Vulnerability:** Weak deterministic randomness (`Math.random()`) was used for generating session IDs and session tokens in `api/_lib/backend.ts` as a fallback mechanism.
**Learning:** Using `Math.random()` or `Date.now()` for cryptographic randomness like session tokens introduces severe prediction vulnerabilities. Insecure fallbacks should not be used for security-critical contexts; they should fail securely instead.
**Prevention:** Use `crypto.getRandomValues()` or `crypto.randomUUID()` for generating session tokens and IDs. If secure randomness is not available, throw an error to fail securely rather than silently using a weak fallback.
