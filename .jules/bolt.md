## 2026-06-13 - Consolidated array loops and removed Math.max spread
**Learning:** Found multiple consecutive `.filter()`, `.reduce()`, and `.map()` calls across the same array in dashboard components. Using `Math.max(...array)` with the spread operator can throw RangeError on large sets. Also, finding an extremum using `.sort()[0]` is O(N log N) when O(N) is sufficient.
**Action:** Consolidate multiple chained array methods into a single `for` loop and track min/max iteratively to avoid redundant passes and stack overflows.
