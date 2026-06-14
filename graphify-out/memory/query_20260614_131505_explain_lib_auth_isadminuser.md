---
type: "explain"
date: "2026-06-14T13:15:05.234725+00:00"
question: "Explain lib_auth_isadminuser"
contributor: "graphify"
source_nodes: ["lib_auth_isadminuser"]
---

# Q: Explain lib_auth_isadminuser

## Answer

isAdminUser() (defined in lib/auth.ts:L103) is the central helper to authorize admin privileges. It checks if the current user profile has an ADMIN role, and is called directly or via requireAdminUser() to safeguard admin API routes (GET, POST, PATCH, DELETE in /api/admin) and allow admin access overrides in client-side components like ItineraryDetailPage and AdminPage.

## Source Nodes

- lib_auth_isadminuser