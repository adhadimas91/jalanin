---
type: "query"
date: "2026-06-14T13:14:43.829429+00:00"
question: "Why does getCurrentUser() connect API Routes & User Sessions to Interactive UI Components, Admin Panel & Console Operations, Itinerary Creation & Forms, Budget Fields?"
contributor: "graphify"
source_nodes: ["getCurrentUser()"]
---

# Q: Why does getCurrentUser() connect API Routes & User Sessions to Interactive UI Components, Admin Panel & Console Operations, Itinerary Creation & Forms, Budget Fields?

## Answer

getCurrentUser() (defined in lib/auth.ts) is the primary gateway for user authentication in the codebase. It resolves session cookies into user objects, which is then imported and called across API routes, admin functions, itinerary managers, and UI state context managers to check permissions and customize layouts based on user roles and subscription tiers.

## Source Nodes

- getCurrentUser()