## 2026-06-04 - [Insecure Randomness for Session IDs]
**Vulnerability:** Weak deterministic randomness (`Math.random()`) was used as a fallback to generate session IDs and session tokens in `api/_lib/backend.ts`. This could allow session prediction and hijacking.
**Learning:** Security-critical functions like session token generation must fail securely rather than attempting to provide an insecure fallback if strong randomness isn't available.
**Prevention:** Always use secure randomness APIs like `crypto.getRandomValues()` or `crypto.randomUUID()` for generating session tokens or security-sensitive identifiers, and explicitly throw errors if those APIs are unavailable.
