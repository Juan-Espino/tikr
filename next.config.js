/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // OAuth callback query strings contain short-lived authorization codes.
  logging: { incomingRequests: { ignore: [/\/api\/auth(?:\/|\?)/] } },
};

export default config;
