## 2026-05-16 - Refactoring multiple reduce passes
**Learning:** Replacing multiple `.reduce()` operations over the same dataset with a single `for` loop avoids redundant O(N) passes and significantly improves frontend component rendering performance by accumulating all values simultaneously in a single iteration.
**Action:** Always check for repeated `.reduce()`, `.map()`, or `.filter()` calls on the same array in `useMemo` hooks and combine them into a single loop to reduce CPU overhead.
