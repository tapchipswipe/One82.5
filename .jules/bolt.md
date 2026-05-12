
## 2024-05-18 - [Preventing Call Stack Exceeded with Math.max]
**Learning:** Using `Math.max(...array)` on large arrays inside `useMemo` can throw a `RangeError: Maximum call stack size exceeded` because the spread operator places all array elements onto the function call stack.
**Action:** Calculate min/max values iteratively within a standard loop instead for better performance and safety.
