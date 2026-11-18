"use client";
import { ConvexReactClient } from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { authClient } from "~/lib/auth-client";
import { AccountDeletionProvider } from "./account-deletion-provider";
import { DiscoveryProvider } from "./discovery-provider";
import type { ReactNode } from "react";

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
const client = url ? new ConvexReactClient(url) : null;
export function AuthProvider({ children }: { children: ReactNode }) {
  return client ? (
    <ConvexBetterAuthProvider client={client} authClient={authClient}>
      <AccountDeletionProvider>
        <DiscoveryProvider>{children}</DiscoveryProvider>
      </AccountDeletionProvider>
    </ConvexBetterAuthProvider>
  ) : (
    children
  );
}
