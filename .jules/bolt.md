## 2024-03-24 - [Replace .slice().reduce() with single-pass loops]
**Learning:** Found multiple instances where `.slice().reduce()` chains were used to sum array segments, leading to unnecessary array allocations and potential O(N) memory overhead in performance-sensitive contexts.
**Action:** Replaced `.slice().reduce()` logic with explicit `for` loops in components such as `Profitability.tsx` and `ISODashboard.tsx`, utilizing boundary checks to prevent intermediate allocations and improve execution efficiency.
