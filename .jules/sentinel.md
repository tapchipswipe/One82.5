## 2026-06-06 - Predictable Session Token Generation
**Vulnerability:** Session tokens in `api/_lib/backend.ts` were being generated using `Math.random()` and `Date.now()`.
**Learning:** `Math.random()` is not cryptographically secure and should never be used for security-critical values like session tokens. It is deterministic and its output can be predicted, allowing an attacker to guess valid session tokens and hijack user sessions.
**Prevention:** Always use `crypto.randomUUID()` or `crypto.getRandomValues()` for generating security tokens, session IDs, passwords, and other sensitive random data. Ensure to handle environments where secure crypto might be absent by failing safely rather than falling back to an insecure method.
