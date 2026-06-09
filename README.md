# BUVLJAK

## Convex

Run the backend locally after configuring a Convex deployment:

```bash
npm run convex:dev
npm run convex:seed
```

The listings feed uses Convex when `NEXT_PUBLIC_CONVEX_URL` is available. Otherwise it falls back to local demo listings.
