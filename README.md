# BUVLJAK

## Convex

Run the backend locally after configuring a Convex deployment:

```bash
npm run convex:dev
npm run convex:seed
```

The listings feed uses Convex when `NEXT_PUBLIC_CONVEX_URL` is available. Otherwise it falls back to local demo listings.

## Admin portal

The admin area is intentionally not linked from the public UI. Open it manually at:

```text
/admin-portal
```

Access is allowed only for the Clerk user whose email is exactly `deweb.eu@gmail.com`. The old `/admin` route should remain unavailable and must not redirect to the portal.

## Clerk auth

The app uses Clerk for sign-in, including a direct Facebook login button that starts Clerk OAuth with the `oauth_facebook` strategy and completes on `/sso-callback`.

Required local variables:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_ISSUER_DOMAIN=
NEXT_PUBLIC_CONVEX_URL=
```

Facebook login must also be enabled in Clerk Dashboard:

1. Open Clerk Dashboard.
2. Go to User & Authentication, then Social connections.
3. Enable Facebook and add the Facebook app credentials there.
4. Use the callback URL Clerk shows for the Facebook app settings.
