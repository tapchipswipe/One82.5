# Hierarchy Structure

## Source of Truth

This document is the authoritative reference for role hierarchy and role values in One82.

Any future feature, route, permission check, or data-access rule involving roles must follow this file.

If a new role or permission is introduced, update this document first (or in the same change) before implementation is considered complete.

## Levels

1. **Overseer (Owner/Founder)**
2. **ISO (Owner)**
3. **ISO Reps**
4. **Merchant**

---

## Organizational Tree

- **Overseer (Owner/Founder)**
  - Global oversight across all ISO organizations, reps, and merchants
  - Can monitor platform-wide health, risk, and profitability
  - Manages top-level governance and platform direction

  - **ISO (Owner)**
    - Owns and manages one ISO organization
    - Oversees ISO reps and merchant portfolio performance
    - Assigns reps to merchants and manages ISO operations

    - **ISO Reps**
      - Manage assigned merchants under their ISO
      - Focus on retention, growth opportunities, and account follow-through
      - Use statement analysis and transaction insights for account actions

      - **Merchant**
        - Operates a single business account
        - Uses transaction intelligence, forecasting, and operational insights

---

## RBAC (Role-Based Access Control)

### 1) Overseer (Owner/Founder)
- **Scope:** Cross-tenant (all ISO orgs)
- **Can View:** All ISOs, all reps, all merchants, global alerts/KPIs/profitability
- **Can Manage:** Platform-level settings and governance
- **Cannot:** Be restricted by ISO-level tenant boundaries

### 2) ISO (Owner)
- **Scope:** Single ISO tenant
- **Can View:** Own reps, own merchants, ISO-level analytics and alerts
- **Can Manage:** Rep roster, rep-to-merchant assignments, ISO settings
- **Cannot:** Access other ISO tenants

### 3) ISO Reps
- **Scope:** Assigned merchants within one ISO tenant
- **Can View:** Assigned merchant data, own performance metrics, assigned alerts/tasks
- **Can Manage:** Actions/notes/workflows for assigned merchants
- **Cannot:** Manage tenant settings, see unassigned merchants, manage other reps

### 4) Merchant
- **Scope:** Single merchant account
- **Can View:** Own transactions, own business metrics, own insights
- **Can Manage:** Own business settings and merchant tools
- **Cannot:** Access ISO internal controls, rep structures, or other merchants

---

## Access Guardrails

- Access checks should always enforce:
  1. **Role boundary**
  2. **Tenant boundary** (`tenantId`)
  3. **Assignment boundary** (`repId`/merchant assignment mapping)

- Default deny rule:
  - If role + tenant + assignment checks do not explicitly allow access, access is denied.

---

## Development Rule (Future Work)

- Role values and role behavior must stay aligned with this hierarchy.
- Pull requests that change role logic should include an explicit check against this document.
