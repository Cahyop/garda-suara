# Relawan Campaign Platform

## Product scope
Build the first working version of a reusable campaign-operations platform, using Sidoarjo 2026 as the sample event from the brief. Center the experience on a desktop war-room dashboard with a fast, mobile-friendly field workflow.

## Build sequence
1. Replace the starter screen with a polished command center showing vote target vs. real count, DPT/TPS coverage, volunteer and supporter totals, gender breakdown, and location-level progress.
2. Add working navigation and views for campaign setup, volunteer hierarchy/access, supporter intake, DPT imports and match flags, TPS targets/live count, and reports/audit history.
3. Connect Lovable Cloud for accounts and persistent campaign data. Enforce campaign isolation and hierarchy permissions server-side; keep NIK, KTP images, contact details, and duplicate-attempt logs private. Add the appropriate user-profile shape after the user's answer.
4. Validate the key dashboard and field-entry journeys, responsive layouts, route metadata, and project checks.

## Technical approach
Use the existing TanStack Start and Tailwind design system. Keep data access behind authenticated server functions and narrowly scoped access controls. Treat OCR and Excel import as explicit workflows with validation and review states; never expose identity data in public routes or logs.

## Assumptions
The sample event is “Pilkada Sidoarjo 2026”; campaign figures and names shown before data is supplied are clearly marked as sample data. Any external OCR integration remains unconfigured unless a supported credential/provider is available.
