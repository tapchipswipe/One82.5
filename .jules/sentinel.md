## 2025-02-27 - Insecure Session Token Generation
**Vulnerability:** Predictable, time-based values (`Date.now()` and `Math.random()`) were being used to generate sensitive session tokens (`sessionId`, `sessionToken`) in `api/_lib/backend.ts`.
**Learning:** `Math.random()` and `Date.now()` are deterministic and predictable. If used for session identifiers, a malicious actor can predict session tokens and hijack user sessions.
**Prevention:** Always use cryptographically secure random number generators like `crypto.randomUUID()` or `crypto.getRandomValues()` for sensitive identifiers. If secure randomness is unavailable, fail securely rather than falling back to an insecure method.
