## 2026-07-06 - Found Array.sort() usage to find extrema
**Learning:** Found multiple usages of `.map().filter().sort()[0] || null` just to find the maximum or minimum value in an array. This has O(N log N) time complexity instead of O(N) by just doing a simple iteration to keep track of the maximum value.
**Action:** Replace these operations with simple `for` loops or `reduce` calls to find the max/min in a single pass O(N), which is much faster.
