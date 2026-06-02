## 2026-06-02 - Prevent Predictable Session Tokens

**Vulnerability:** The application used insecure `Math.random()` and `Date.now()` within `api/_lib/backend.ts` to generate critical backend session tokens (`createCookieSession`, `createSessionToken`). These functions were responsible for user authentication tokens. `Math.random()` is not a cryptographically secure pseudo-random number generator (CSPRNG) and its seed state can be guessed, making it possible to predict session tokens and impersonate users.

**Learning:** It's essential to differentiate between security-critical randomness (like authentication tokens or CSRF keys) and trivial randomness (like UI components). The use of `Math.random()` for critical context was insecure. Also learned to use `(crypto as any).randomUUID()` when `crypto.randomUUID()` is called globally in TypeScript for a runtime-agnostic file to avoid TS2339 when it is indeed defined, preventing build failures or unused expect-errors.

**Prevention:** Always enforce the use of `crypto.getRandomValues()` or `crypto.randomUUID()` for security-critical contexts. If secure randomness is unavailable in the environment, it is better to throw an error and fail securely than fall back to insecure methods like `Math.random()`.
