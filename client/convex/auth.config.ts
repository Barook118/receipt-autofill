import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: "https://evolved-foal-77.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
