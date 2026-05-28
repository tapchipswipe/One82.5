## 2026-05-28 - Optimize Multiple Reduce Calls in React
**Learning:** React component memoization with `useMemo` can mask inefficient data transformations, such as chaining multiple `.reduce()` operations over the same dataset. This results in redundant O(N) iterations.
**Action:** Consolidate multiple `.reduce()` iterations over the same list into a single `for` loop to accumulate all values simultaneously, reducing O(M*N) passes to a single O(N) pass.
