
## 2026-05-22 - Insecure Randomness in Session Tokens
**Vulnerability:** Weak deterministic `Math.random()` used for generating session IDs (`sessionId`) and session tokens (`createSessionToken`). This introduces predictability and vulnerability to session hijacking.
**Learning:** Avoid `Math.random()` for secure tokens. A security fix also revealed the need to fail securely rather than falling back to an insecure algorithm if Web Crypto API is unavailable.
**Prevention:** Always use `crypto.getRandomValues()` or `crypto.randomUUID()` for cryptographic operations. If unavailable, explicitly throw a fatal error.
