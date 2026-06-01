import { query } from "./_generated/server";

/** Public health check — no auth required */
export const health = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return {
      status: "ok",
      authenticated: identity !== null,
      userId: identity?.subject ?? null,
      timestamp: Date.now(),
    };
  },
});
