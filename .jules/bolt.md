## 2025-02-23 - Avoid redundant O(N) array traversals with consecutive .reduce() calls
**Learning:** In performance-critical data visualization components (like Profitability.tsx), using multiple consecutive `.reduce()` calls on the same array to calculate different metrics causes severe performance degradation, executing O(N * M) traversals where M is the number of metrics.
**Action:** Always replace multiple consecutive `.reduce()` or `.filter()` calls over the same dataset with a single `for` loop to accumulate all values simultaneously in a single O(N) pass.
