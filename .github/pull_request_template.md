## Summary
- What changed?
- Why now?
- Any user-facing behavior changes?

## Validation
- [ ] `npm run check` passes locally
- [ ] Demo mode still works end-to-end without required external services
- [ ] Relevant flows were manually verified

## Vision Lock Gate (Required)
- [ ] Change preserves ISO-first product assumptions and avoids merchant-direct production self-serve
- [ ] Pilot focus remains 1-3 design-partner ISOs and Stripe-first production integration path
- [ ] Backend/auth-mode behavior does not treat browser cache as source of truth
- [ ] Tenant isolation and API-layer RBAC assumptions are preserved (not UI-only guards)
- [ ] Logout/session flows preserve full session revocation behavior
- [ ] AI features are provenance-gated where required and avoid fabricated outputs on missing inputs
- [ ] Auth-mode AI flows hard-block (with clear next actions) when required provenance/data is missing
- [ ] Auth-mode AI does not fall back to simulated AI output
- [ ] Integration-driven views surface sync failures and freshness signals where relevant
- [ ] Change does not prioritize net-new AI surface over integration reliability or statement-reader accuracy
- [ ] AI customization changes (if any) stay in Settings-based patterns
- [ ] Any AI Report output is trusted-data-only and includes source/timestamp context
- [ ] Onboarding remains sales-led with ISO import + auto-invite primary, invite-link fallback
- [ ] Role changes are reflected in [HIERARCHY_STRUCTURE.md](HIERARCHY_STRUCTURE.md) in the same PR

## Notes for Reviewers
- Mention migrations, env changes, rollout risks, or follow-ups here.
