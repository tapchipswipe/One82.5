
## 2024-04-01 - Avoid `slice().reduce()` chains
**Learning:** Chaining `.slice().reduce()` in React renders or tight loops creates unnecessary intermediate arrays and multiple iteration passes, hurting performance. This is especially true for data-heavy components like `Profitability.tsx` and `ISODashboard.tsx`.
**Action:** Replace `array.slice().reduce()` operations with a single-pass `for` loop using an explicit bounds check (e.g., `i < array.length`) to compute aggregated metrics without creating throwaway array structures.
