## 2024-05-24 - [Fix insecure session token generation]
**Vulnerability:** Use of predictable `Math.random()` for generating authentication session tokens.
**Learning:** Fallbacks to insecure randomness for critical security tokens like sessions defeat the purpose of secure RNG. It is better to fail securely if a CSPRNG is not available rather than silently degrading to `Math.random()`.
**Prevention:** Never use `Math.random()` for security-critical contexts. If `crypto` is unavailable, explicitly throw an error rather than using a weak fallback.
