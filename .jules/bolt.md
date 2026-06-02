
## 2025-03-08 - Consolidation of chained reduces in React Hooks
**Learning:** Multiple consecutive `.reduce()` calls over the same array within `useMemo` hooks significantly impacts rendering performance when the dataset (`filteredRows`) scales. Chained array methods over O(N) multiply the baseline iteration cost unnecessarily. React component memoization can hide this issue but cannot fundamentally fix the processing cost itself.
**Action:** When calculating derived state metrics like aggregations or totals over arrays, use a single `for` loop to accumulate all required totals simultaneously instead of chaining multiple higher order functions.
