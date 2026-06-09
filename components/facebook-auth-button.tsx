"use client";

import { useState, type ReactNode } from "react";
import { Facebook, Loader2 } from "lucide-react";
import { useSignIn } from "@clerk/nextjs";

type FacebookAuthButtonProps = {
  children?: ReactNode;
  className?: string;
  redirectUrlComplete?: string;
  variant?: "header" | "panel";
};

const variantClasses = {
  header:
    "h-10 rounded-lg border border-[#1877f2]/22 bg-[#1877f2] px-3 text-sm font-black text-white shadow-sm transition hover:bg-[#145dbf]",
  panel:
    "h-11 rounded-lg bg-[#1877f2] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#145dbf]"
};

export function FacebookAuthButton({
  children = "Nastavi s Facebookom",
  className = "",
  redirectUrlComplete = "/",
  variant = "panel"
}: FacebookAuthButtonProps) {
  const { fetchStatus, signIn } = useSignIn();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const isBusy = fetchStatus === "fetching" || isRedirecting;

  async function handleFacebookLogin() {
    if (isBusy) {
      return;
    }

    setHasError(false);
    setIsRedirecting(true);

    try {
      const result = await signIn.sso({
        strategy: "oauth_facebook",
        redirectCallbackUrl: "/sso-callback",
        redirectUrl: redirectUrlComplete
      });

      if (result.error) {
        throw result.error;
      }
    } catch (error) {
      console.error("Facebook login failed", error);
      setHasError(true);
      setIsRedirecting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleFacebookLogin}
      disabled={isBusy}
      aria-label="Prijava preko Facebooka"
      className={`focus-ring inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
    >
      {isBusy ? (
        <Loader2 aria-hidden="true" className="animate-spin" size={16} />
      ) : (
        <Facebook aria-hidden="true" size={16} />
      )}
      <span>{hasError ? "Pokušaj ponovno" : children}</span>
    </button>
  );
}
