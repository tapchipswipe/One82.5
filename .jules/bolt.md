## 2026-05-26 - [Consolidate Array Iterations and Avoid Call Stack Limits]
**Learning:** Chained array methods (`.map()`, `.filter()`, `.reduce()`, `.sort()`) in React renders cause redundant O(N) passes and degrade performance. Furthermore, using the spread operator with `Math.max(...array)` on large dataset arrays risks throwing a `RangeError: Maximum call stack size exceeded`.
**Action:** Consolidate data transformation into single `for` loops to accumulate values simultaneously, avoiding redundant passes and preventing maximum call stack issues.
