## 2024-05-13 - Array Iteration and Spread Operator Optimization in ISODashboard
**Learning:** Chaining multiple array operations (`filter`, `reduce`, `map`) and passing mapped arrays to `Math.max(...array)` on large datasets causes significant performance degradation and stack overflows due to redundant O(N) passes and memory overhead.
**Action:** Consolidate sequential dataset aggregations into a single O(N) `for` loop and calculate `min`/`max` limits iteratively.
