
## 2026-06-23 - Chained Array Methods Anti-Pattern
**Learning:** Found a widespread anti-pattern where components use chained `.map().filter().sort()[0]` to find extremum values (like latest dates), which introduces unnecessary O(N log N) complexity and multiple array allocations.
**Action:** Replaced the chained array methods with a single O(N) for-loop tracking the extremum value, explicitly typing the tracker (e.g., \`let latest: number | null = -Infinity;\`) and safely handling the fallback to \`null\` if the initial value (-Infinity) was unchanged.
