"use client";

import { Show } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";

function SyncAuthenticatedUser() {
  const upsertCurrentUser = useMutation(api.users.upsertCurrentUser);

  useEffect(() => {
    void upsertCurrentUser({});
  }, [upsertCurrentUser]);

  return null;
}

export function UserProfileSync() {
  return (
    <Show when="signed-in">
      <SyncAuthenticatedUser />
    </Show>
  );
}
