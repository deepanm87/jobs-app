import { AuthConfig } from "convex/server";

export default {
  providers: [
   {
    // Convex Clerk JWT verification uses the JWT issuer domain.
    // Prefer CLERK_JWT_ISSUER_DOMAIN (per Convex docs), but fall back to the frontend URL.
    domain: process.env.CLERK_JWT_ISSUER_DOMAIN ?? process.env.CLERK_FRONTEND_API_URL ?? '',
    applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
