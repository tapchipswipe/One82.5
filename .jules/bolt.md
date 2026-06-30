## 2026-06-30 - Avoid chained array operations for finding extremums
**Learning:** Using `.map().filter().sort()[0] || null` to find a maximum or minimum value in an array is a performance anti-pattern. It introduces unnecessary O(N log N) overhead from sorting and allocates multiple intermediate arrays.
**Action:** Replace extremum finding via sorting with a single O(N) iteration tracking the maximum/minimum value. Explicitly type the fallback variable and handle the `null` assignment properly.
