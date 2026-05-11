## 2024-05-11 - Optimize Consecutive Array Operations
**Learning:** Found an anti-pattern where multiple `reduce()` and `slice()` operations were being called consecutively on the same array to calculate halves of the array sum, leading to O(N) redundant passes and unnecessary memory allocation.
**Action:** Replace consecutive array operations like `.reduce()` over the same dataset with a single `for` loop to accumulate values simultaneously, reducing passes and overhead.
