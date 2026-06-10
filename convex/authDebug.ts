import { query } from "./_generated/server";

export const getCurrentIdentity = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    return {
      isAuthenticated: Boolean(identity),
      subject: identity?.subject ?? null,
      issuer: identity?.issuer ?? null,
      tokenIdentifier: identity?.tokenIdentifier ?? null,
      email: identity?.email ?? null,
      name: identity?.name ?? null
    };
  }
});
