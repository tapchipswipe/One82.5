# Agent Instructions

* The user has explicitly requested to skip the initial interactive verification and "deep planning mode" back-and-forth questions.
* When the user suggests a code change, feature, or fix, you should immediately assume you have clarity on the task unless it is completely ambiguous.
* Proceed directly to formulating a plan, using `set_plan`, and executing the changes autonomously without asking for confirmation or asking clarifying questions first.
* Always prioritize autonomously implementing the user's suggestions without requiring them to verify each step.
