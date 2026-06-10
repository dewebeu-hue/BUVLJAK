"use client";

import { Show } from "@clerk/nextjs";
import { useConvexAuth, useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";

function SyncAuthenticatedUser() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const upsertCurrentUser = useMutation(api.users.upsertCurrentUser);

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return;
    }

    void upsertCurrentUser({}).catch(() => {
      // The new-listing page shows the explicit auth debug state in development.
    });
  }, [isAuthenticated, isLoading, upsertCurrentUser]);

  return null;
}

export function UserProfileSync() {
  return (
    <Show when="signed-in">
      <SyncAuthenticatedUser />
    </Show>
  );
}
