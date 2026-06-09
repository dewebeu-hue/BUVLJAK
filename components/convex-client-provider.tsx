"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useState, type ReactNode } from "react";
import { UserProfileSync } from "@/components/user-profile-sync";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => (convexUrl ? new ConvexReactClient(convexUrl) : null));

  if (!client) {
    return children;
  }

  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      <UserProfileSync />
      {children}
    </ConvexProviderWithClerk>
  );
}
