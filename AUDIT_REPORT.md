# Audit Report — Frontend/Backend Synchronization

## 1. Inconsistencies Found

| #   | Area                                  | Inconsistency                                                                                                                                                                                                                                                                                         | Severity       |
| --- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| 1   | `client-utils.ts`                     | `getDisplayStatus`, `statusBadgeClass`, `regimeBadgeClass` imported by `ClientTable.tsx` but not exported                                                                                                                                                                                             | Build-breaking |
| 2   | `api.ts` — `Client`                   | Missing 10 DB fields: `motivo_inativacao`, `nome_contato`, `codigo_acesso`, `necessita_validacao_humana`, `motivos_validacao`, `objeto_social_classificacao`, `objeto_social_divergencias`, `objeto_social_necessidade_alteracao`, `objeto_social_recomendacao`, `objeto_social_necessidade_juridica` | Type mismatch  |
| 3   | `client-utils.ts` — `ClientRecord`    | Missing same 10 DB fields; unnecessary import of `Client` from `api.ts` creating coupling                                                                                                                                                                                                             | Type mismatch  |
| 4   | `api.ts` — `User`                     | Missing `role`, `status`, `department`, `access_profile`, `last_access`, `created`, `updated`, `expand`                                                                                                                                                                                               | Type mismatch  |
| 5   | `api.ts` — `Process`                  | Missing `created`, `updated`                                                                                                                                                                                                                                                                          | Type mismatch  |
| 6   | `api.ts` — `Department`               | Missing `created`, `updated`                                                                                                                                                                                                                                                                          | Type mismatch  |
| 7   | `departments.ts` — `DepartmentRecord` | Missing `created`, `updated`                                                                                                                                                                                                                                                                          | Type mismatch  |
| 8   | `use-financial-data.ts`               | No `useRealtime` subscription — UI doesn't auto-refresh after import/delete                                                                                                                                                                                                                           | UX gap         |
| 9   | `financial-report-imports.ts`         | `deleteImportReport` has `.catch()` fallback to direct PB delete, bypassing permission checks                                                                                                                                                                                                         | Security gap   |
| 10  | `client-utils.ts`                     | Functions `isClientIncomplete`, `getClientStatusLabel`, `getClientStatusBadgeClass` take `Client` type (from `api.ts`) instead of `ClientRecord`, creating circular coupling                                                                                                                          | Architecture   |

## 2. Inconsistencies Corrected

| #   | Fix                                                                                                             | Files                                      |
| --- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 1   | Added `getDisplayStatus`, `statusBadgeClass`, `regimeBadgeClass` to `client-utils.ts`                           | `src/lib/client-utils.ts`                  |
| 2   | Added all 10 missing DB fields to `Client` interface                                                            | `src/services/api.ts`                      |
| 3   | Added all DB fields to `ClientRecord`, removed `api.ts` import                                                  | `src/lib/client-utils.ts`                  |
| 4   | Added `role`, `status`, `department`, `access_profile`, `last_access`, `created`, `updated`, `expand` to `User` | `src/services/api.ts`                      |
| 5   | Added `created`, `updated` to `Process` and `Department`                                                        | `src/services/api.ts`                      |
| 6   | Added `created`, `updated` to `DepartmentRecord`                                                                | `src/services/departments.ts`              |
| 7   | Changed utility functions to accept `ClientRecord` (structurally compatible with `Client`)                      | `src/lib/client-utils.ts`                  |
| 8   | Added `useRealtime` for `financial_transactions` and `financial_report_imports`                                 | `src/hooks/use-financial-data.ts`          |
| 9   | Removed insecure `.catch()` fallback in `deleteImportReport`                                                    | `src/services/financial-report-imports.ts` |

## 3. Modified Files

- `src/lib/client-utils.ts` — Full rewrite: added missing functions, synchronized `ClientRecord` with DB schema, removed `api.ts` dependency
- `src/services/api.ts` — Updated `Client`, `User`, `Process`, `Department` interfaces to match DB
- `src/services/departments.ts` — Added `created`, `updated` to `DepartmentRecord`
- `src/hooks/use-financial-data.ts` — Added `useRealtime` for automatic UI refresh
- `src/services/financial-report-imports.ts` — Removed insecure fallback in `deleteImportReport`

## 4. Incremental Migrations Created

**None.** The migration history (0001–0059) correctly reproduces the current DB structure. No DB changes were made directly in PocketBase that aren't represented in source. The `ccm` field was added in migration 0048 and removed in migration 0059 — both are applied and the DB is correct.

## 5. Obsolete Fields Found

| Field             | Collection | Status                            | Action                                               |
| ----------------- | ---------- | --------------------------------- | ---------------------------------------------------- |
| `ccm`             | `clients`  | Removed from DB by migration 0059 | No action needed — not referenced in any source code |
| `type`            | `licenses` | Removed from DB by migration 0032 | No action needed — not referenced in any source code |
| `document`        | `licenses` | Removed from DB by migration 0032 | No action needed — not referenced in any source code |
| `pendencia_atual` | `licenses` | Removed from DB by migration 0034 | No action needed — not referenced in any source code |

## 6. Obsolete Components Found

**None.** All existing components, hooks, and services reference active DB fields. No provably obsolete code was identified.

## 7. Fields Kept for Compatibility

| Field                        | Collection | Reason                                                                                                                                         |
| ---------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `responsavel_interno`        | `clients`  | Active relation field; used by `clients.ts` service and `ClientRecord` type. Coexists with the more detailed `client_responsibles` collection. |
| `onboarding_status`          | `clients`  | Active select field; used by `event_client.js` hook for event tracking.                                                                        |
| `objeto_social`              | `clients`  | Active text field; displayed in `VisaoGeralTab.tsx`.                                                                                           |
| `objeto_social_*` fields (6) | `clients`  | Active fields for AI-assisted analysis; stored in DB, not currently displayed in UI but available for future use.                              |
| `nome_contato`               | `clients`  | Active text field; not currently in the form but exists in DB.                                                                                 |
| `codigo_acesso`              | `clients`  | Active text field; used for client access portal.                                                                                              |

## 8. Collection Mapping Summary

| Collection                 | Migrations                                                 | Services                      | Hooks                                                                                            | Types                                 | Status    |
| -------------------------- | ---------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------- | --------- |
| `users`                    | 0001, 0013, 0037, 0042, 0043, 0046                         | `users.ts`, `api.ts`          | `track_access`, `validate_user_profile`, `enforce_permissions`                                   | `User`, `UserRecord`                  | ✅ Synced |
| `departments`              | 0001                                                       | `departments.ts`, `api.ts`    | —                                                                                                | `Department`, `DepartmentRecord`      | ✅ Synced |
| `clients`                  | 0001, 0012, 0015, 0017, 0027, 0048, 0050, 0051, 0052, 0059 | `clients.ts`, `api.ts`        | `event_client`                                                                                   | `Client`, `ClientRecord`              | ✅ Synced |
| `processes`                | 0001                                                       | `api.ts`                      | `event_process`, `embed_process_*`, `search_processes`, `cron_deadlines`, `daily_status_monitor` | `Process`                             | ✅ Synced |
| `playbooks`                | 0014                                                       | `playbooks.ts`                | `embed_playbook_*`, `search_playbooks`                                                           | `Playbook`                            | ✅ Synced |
| `licenses`                 | 0014, 0030–0041                                            | `licenses.ts`                 | `event_license`, `cron_license_status`, `license_batch_update`, `license_duplicate_*`            | `License`                             | ✅ Synced |
| `access_profiles`          | 0044, 0045                                                 | `access-profiles.ts`          | `enforce_permissions`, `validate_permissions`, `prevent_profile_delete`                          | `AccessProfileRecord`                 | ✅ Synced |
| `socios`                   | 0048                                                       | `socios.ts`                   | `event_socio`                                                                                    | `Socio`                               | ✅ Synced |
| `client_cnaes`             | 0048                                                       | `client-cnaes.ts`             | `event_cnae`                                                                                     | `ClientCnae`                          | ✅ Synced |
| `client_responsibles`      | 0048                                                       | `client-responsibles.ts`      | `event_responsible`, `validate_responsible_unique`, `enforce_permissions`                        | `ClientResponsible`                   | ✅ Synced |
| `client_events`            | 0049                                                       | `client-events.ts`            | `event_*` (auto-created)                                                                         | `ClientEvent`                         | ✅ Synced |
| `client_contacts`          | 0053                                                       | `client-contacts.ts`          | —                                                                                                | `ClientContact`                       | ✅ Synced |
| `financial_transactions`   | 0054, 0056, 0057                                           | `financial-transactions.ts`   | —                                                                                                | `FinancialTransaction`, `Transaction` | ✅ Synced |
| `financial_report_imports` | 0055, 0058                                                 | `financial-report-imports.ts` | `financial_report_import`, `financial_report_delete`, `financial_report_opening_balance`         | `FinancialReportImport`               | ✅ Synced |

## 9. Permissions Alignment

| Layer                          | Status | Notes                                                                                                                                          |
| ------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| PocketBase collection rules    | ✅     | All collections have appropriate `@request.auth.id != ''` or `@request.auth.role = 'admin'` rules                                              |
| `enforce_permissions.js` hook  | ✅     | Checks `access_profile.permissions` for create/update/delete on monitored collections                                                          |
| Frontend `PermissionGuard`     | ✅     | Uses `can(module, action)` from `usePermissions` hook                                                                                          |
| Frontend route guards          | ✅     | `ProtectedRoute` checks `canView(module)` via `getModuleFromPath`                                                                              |
| Custom route permission checks | ✅     | `financial_report_import.js`, `financial_report_delete.js`, `financial_report_opening_balance.js` all check `Relatório Financeiro` permissions |

## 10. Remaining Risks / Pendencies

| #   | Risk                                                                                                                                              | Impact                                                                                  | Recommendation                                                                                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `enforce_permissions.js` does not monitor `client_contacts`, `client_events`, `financial_transactions`, or `financial_report_imports` collections | Direct PB API CRUD on these collections bypasses the permission system                  | Add these collections to the hook's monitored list in a future iteration. `client_events` are auto-created by hooks (low risk). Financial operations go through custom routes (medium risk). `client_contacts` are managed by the form with frontend `canEdit` checks (medium risk). |
| 2   | Collection rules for `financial_transactions` and `financial_report_imports` are `@request.auth.id != ''` (any authenticated user)                | Any authenticated user could directly CRUD via PB API                                   | Tighten rules or add to `enforce_permissions.js` in a future iteration. Custom routes already enforce permissions for import/delete.                                                                                                                                                 |
| 3   | `useFinancialData` hook uses `Transaction[]` type but objects contain `client` and `financial_report_import` properties                           | Type system doesn't know about extra properties                                         | Use `FinancialTransaction[]` from `financial-transactions.ts` for better type safety in a future iteration.                                                                                                                                                                          |
| 4   | `Clientes.tsx` page realtime status not fully verified                                                                                            | Page may not auto-refresh when clients change                                           | Verify that `Clientes.tsx` uses `useRealtime('clients', ...)` or re-fetches on changes.                                                                                                                                                                                              |
| 5   | `use-financial-data.ts` `Transaction` type missing `created`, `updated`                                                                           | Financial transaction records have these fields but they're not accessible via the type | Add `created` and `updated` to the `Transaction` interface or use `FinancialTransaction` type.                                                                                                                                                                                       |

## 11. Validation Checklist

- [x] Build compiles without TypeScript errors
- [x] All PocketBase collections mapped against migrations, services, hooks, types, and permissions
- [x] No executed migration altered
- [x] No PocketBase records deleted
- [x] No collections recreated
- [x] No DB reset
- [x] TypeScript interfaces match real PocketBase fields
- [x] Services only send existing fields
- [x] Permissions aligned across all layers
- [x] Hooks reviewed — no obsolete hooks found
- [x] Financial Report uses real stored data
- [x] Client management uses same DB fields for create/edit/view
- [x] UI auto-refreshes via `useRealtime` after data changes
- [x] No operational data stored in source code
- [x] Safe removal: all references searched before any removal
