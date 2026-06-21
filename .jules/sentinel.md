## 2026-06-21 - Secure Session Token Generation
**Vulnerability:** `Math.random()` was used to generate session IDs (`sessionId`) and session tokens, creating a risk of session token prediction/hijacking due to weak, non-cryptographic randomness.
**Learning:** In isomorphic or environment-agnostic code, `crypto` might not always be available directly, leading developers to fallback to `Math.random()`. However, for authentication tokens, this fallback exposes critical vulnerabilities.
**Prevention:** Always use the Web Crypto API (`crypto.randomUUID()` or `crypto.getRandomValues()`) for generating security-sensitive tokens, keys, and session identifiers. Ensure proper safety checks (`typeof crypto !== 'undefined'`) are in place without sacrificing cryptographic strength.
