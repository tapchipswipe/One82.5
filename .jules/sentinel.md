## 2025-05-16 - Prevent Insecure Session Tokens
**Vulnerability:** Session IDs (`sessionId` and `sessionToken`) in `api/_lib/backend.ts` were generated using deterministic `Date.now()` mixed with weak pseudo-randomness from `Math.random().toString(36)`.
**Learning:** This approach causes severe prediction vulnerabilities allowing session hijacking, especially when time of generation can be deduced or brute-forced.
**Prevention:** Never use time-based values or `Math.random` for security-critical contexts like session identification. Always prefer `crypto.randomUUID()` or `crypto.getRandomValues()`. Throw an error immediately if secure randomness is not available.
