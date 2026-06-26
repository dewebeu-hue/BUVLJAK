# Convex backend

This folder contains the Buvljak MVP schema, queries, mutations, and demo seed.

Useful commands:

```bash
npm run convex:dev
npm run convex:seed
```

The feed can read from Convex when `NEXT_PUBLIC_CONVEX_URL` is configured. Without it, the UI shows a safe unavailable/empty beta state instead of listing cards.
