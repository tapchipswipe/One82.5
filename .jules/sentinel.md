## 2026-05-20 - Enforce Secure Randomness for Session Tokens
**Vulnerability:** Weak, predictable randomness `Math.random()` was used as a fallback for generating sensitive session IDs and tokens.
**Learning:** Security-critical functions (like session generation) must not silently fall back to insecure methods when a secure method is unavailable. Failing securely by throwing an error prevents predictable tokens from being issued.
**Prevention:** Strictly require the use of `crypto.randomUUID()` or `crypto.getRandomValues()` for all security-critical IDs. If secure randomness is not available in the environment, throw an error to fail securely rather than using an insecure fallback.
