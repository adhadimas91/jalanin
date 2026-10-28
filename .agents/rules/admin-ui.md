---
trigger: always_on
description: Always use next-shadcn/ as the canonical UI kit and design reference for Admin UI components, layouts, tables, forms, and patterns.
---

## Admin UI Kit Reference (`next-shadcn/`)

The `next-shadcn/` directory at the root of the repository is the **canonical UI kit and reference template** for all Admin UI work in Jalanin (`/admin`, `components/admin-*`, and related backoffice interfaces).

### Mandatory Rules for Agents
1. **Consult `next-shadcn/` First**: Before creating, refactoring, or styling any Admin UI page, layout, table, form, modal, chart, or navigation element, inspect the corresponding implementation in `next-shadcn/src/` first.
2. **Reuse & Adapt Components**:
   - **UI Primitives**: Follow the shadcn/ui (New York style) + Radix UI primitives in `next-shadcn/src/components/ui/` (including `table/data-table*`, `sidebar`, `card`, `sheet`, `dialog`, `tabs`, `badge`, `tanstack-form`, etc.).
   - **Layouts & Navigation**: Reference `next-shadcn/src/components/layout/` (`PageContainer`, `AppSidebar`, `Header`, `UserNav`, `InfoSidebar`) and `next-shadcn/src/components/breadcrumbs.tsx`.
   - **Feature Patterns**: Reference `next-shadcn/src/features/` (e.g., `overview`, `products`, `users`, `kanban`, `profile`) for dashboard cards, data tables, filtering, pagination, and form layouts.
   - **Styling & Theming**: Match the visual tokens, spacing, typography, and OKLCH theme conventions in `next-shadcn/src/styles/`.
   - **Icons**: Follow the centralized icon registry pattern in `next-shadcn/src/components/icons.tsx` (`@tabler/icons-react` / Lucide conventions).
3. **Do Not Invent Custom Admin Styles**: Avoid ad-hoc or inconsistent Tailwind styling for Admin UI when a matching component, layout pattern, or variant already exists in `next-shadcn/`. Copy or port needed UI primitives from `next-shadcn/src/components/` into Jalanin's `components/` (adapting imports and Jalanin's auth/Prisma data layer as needed).
4. **Reference Docs inside `next-shadcn/`**:
   - `next-shadcn/CLAUDE.md` & `next-shadcn/AGENTS.md` — full overview of component conventions and patterns
   - `next-shadcn/docs/forms.md` — form patterns and validation
   - `next-shadcn/docs/themes.md` — theme tokens and color system

