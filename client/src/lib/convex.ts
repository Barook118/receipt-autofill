import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL?.trim();

if (!convexUrl) {
  throw new Error(
    "VITE_CONVEX_URL is missing. Add it to client/.env — e.g. https://upbeat-mammoth-440.eu-west-1.convex.cloud"
  );
}

export const convex = new ConvexReactClient(convexUrl);
