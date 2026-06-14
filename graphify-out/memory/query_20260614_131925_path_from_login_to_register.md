---
type: "path_query"
date: "2026-06-14T13:19:25.391358+00:00"
question: "Path from login to register"
contributor: "graphify"
source_nodes: ["login_page_loginpage", "register_page_registerpage"]
---

# Q: Path from login to register

## Answer

LoginPage (app/login/page.tsx) handles user logins by calling POST() at /api/auth/login. This endpoint invokes createSession() from lib/supabase-auth.ts to set up the authentication session. Registration follows a symmetric pattern where RegisterPage (app/register/page.tsx) renders RegisterFormClient, which calls POST() at /api/auth/register, which similarly calls createSession() to sign in the newly registered user automatically.

## Source Nodes

- login_page_loginpage
- register_page_registerpage