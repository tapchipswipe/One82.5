# Release Trust Checklist

Date:
Release/Deployment:
Owner:

## Required before release

- [ ] Tenant isolation checklist executed and recorded.
- [ ] API-layer RBAC verification completed (role-by-role endpoint checks).
- [ ] Logout/session revocation verification completed.
- [ ] Trust/auth changes include Trust Change Notes.
- [ ] Reviewer signoff present for trust-boundary changes.
- [ ] `npm run check` passes.
- [ ] `npm run ops:health` passes on target deployment.

## Evidence links

- Checklist run log:
- RBAC verification notes:
- Logout revocation test notes:
- CI run URL:
- Deployment URL:
