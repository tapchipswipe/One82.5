## 2025-02-28 - Avoid Call Stack Limits with Math.max on Large Datasets
**Learning:** Using the spread operator (`...`) with `Math.max()` or `Math.min()` on potentially large arrays (e.g., `Math.max(...merchants.map(...))`) risks throwing a `RangeError: Maximum call stack size exceeded` in JavaScript.
**Action:** When finding the maximum or minimum value in lists of unknown or potentially large bounds, use a standard loop to iteratively calculate the max/min value to guarantee safety and avoid call stack crashes.
