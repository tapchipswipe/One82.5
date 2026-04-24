## 2025-02-21 - [Secure Randomness for Session Tokens]
**Vulnerability:** Predictable session identifiers via \`Math.random()\` and \`Date.now()\`.
**Learning:** Security-critical contexts like session generation relied on insecure, time-based values and pseudo-random \`Math.random()\`. Also, weak cryptographic fallbacks were masking availability issues in environments without \`crypto\`.
**Prevention:** Always use \`crypto.randomUUID()\` or \`crypto.getRandomValues()\` for session tokens or sensitive randomness. Remove insecure fallback paths entirely and explicitly throw errors to enforce a fail-secure model.
