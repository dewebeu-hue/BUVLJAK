# Facebook login setup

Buvljak uses Clerk for authentication. The custom Facebook button starts Clerk's OAuth flow with:

- callback route: `/sso-callback`
- complete redirect: the current app origin plus the target path
- provider strategy: `oauth_facebook`

## Required app env vars

Set these in local `.env.local` and in Vercel Project Settings > Environment Variables:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_APP_URL=https://buvljak.hr
```

Optional for preview deployments if you choose to expose it to the client:

```env
NEXT_PUBLIC_VERCEL_URL=
```

Do not commit Facebook App Secret or Clerk secret values.

## Clerk configuration

In Clerk Dashboard:

1. Open the Buvljak Clerk application.
2. Enable Facebook as a social connection.
3. Add the Facebook App ID and Facebook App Secret in Clerk.
4. Use the production Clerk keys on Vercel production and development keys locally.

## Facebook Developer Console redirects

In Facebook Developer Console > Facebook Login > Settings > Valid OAuth Redirect URIs, add the Clerk OAuth callback URI.

For the current Clerk development instance:

```text
https://witty-turkey-56.clerk.accounts.dev/v1/oauth_callback
```

For production, use the exact production Frontend API domain shown in Clerk for the production application, for example:

```text
https://<production-clerk-frontend-api-domain>/v1/oauth_callback
```

If Clerk is configured with a custom Frontend API domain, use that exact domain:

```text
https://clerk.buvljak.hr/v1/oauth_callback
```

If Clerk Dashboard shows an auto-proxy callback for the app domain, use the exact value Clerk shows, for example:

```text
https://buvljak.hr/__clerk/v1/oauth_callback
```

The app-level routes used after Clerk redirects back are:

```text
http://localhost:3000/sso-callback
https://buvljak.hr/sso-callback
https://<vercel-preview-or-production-domain>/sso-callback
```

## Vercel

In Vercel:

1. Open Project Settings > Environment Variables.
2. Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and `NEXT_PUBLIC_APP_URL`.
3. Set `NEXT_PUBLIC_APP_URL` to `https://buvljak.hr` for production.
4. Redeploy after changing auth environment variables.

## Troubleshooting

- If Facebook says "Aplikacija nije aktivna", switch the Facebook app to Live mode or add the tester as a Facebook app role while it is in development mode.
- Confirm Facebook Login is added as a product in Facebook Developer Console.
- Confirm the Facebook App Domains include `buvljak.hr`.
- Confirm the Valid OAuth Redirect URI exactly matches the Clerk URI, including protocol and path.
- Confirm Clerk's Facebook social connection is enabled and uses the same Facebook App ID/Secret.
- Confirm local development runs on `http://localhost:3000` or update `NEXT_PUBLIC_APP_URL`/the local callback examples accordingly.
- Check browser console logs prefixed with `[Buvljak auth]`; they include origins and paths only, never secrets.
