## 2026-06-10 - Array Spread Operator Max/Min Vulnerability & Inefficient Array Max

**Learning:** Using the spread operator with `Math.max(...array)` or `Math.min(...array)` on large datasets risks throwing a `RangeError: Maximum call stack size exceeded`. Additionally, using `.sort((a, b) => b - a)[0]` just to find a maximum value introduces an unnecessary O(N log N) operation where an O(N) pass would suffice.
**Action:** Replace multiple chained array operations (filter, map, reduce, sort) and `Math.max(...map())` over the same dataset with a single `for` loop to accumulate all values simultaneously. This prevents call stack limits and improves performance by reducing redundant iterations.
