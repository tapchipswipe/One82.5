## 2024-05-18 - Replacing multiple `.reduce()` calls with a single `for...of` loop
**Learning:** I noticed several consecutive `.reduce()` calls iterating over the same dataset in `components/Profitability.tsx` to calculate totals. This causes multiple O(N) passes.
**Action:** Replace multiple consecutive `.reduce()` calls with a single `for...of` loop or a single `reduce` to improve performance, especially on large datasets.
