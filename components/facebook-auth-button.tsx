"use client";

import { useId, useState, type ReactNode } from "react";
import { useSignIn } from "@clerk/nextjs";
import { Facebook, Loader2 } from "lucide-react";

type FacebookAuthButtonProps = {
  children?: ReactNode;
  className?: string;
  redirectUrlComplete?: string;
  variant?: "header" | "panel";
};

const FACEBOOK_LOGIN_ERROR_MESSAGE =
  "Prijava putem Facebooka trenutno nije uspjela. Pokušajte ponovno ili koristite drugi način prijave.";
const LOCAL_APP_URL = "http://localhost:3000";

const variantClasses = {
  header:
    "h-10 rounded-lg border border-[#1877f2]/22 bg-[#1877f2] px-3 text-sm font-black text-white shadow-sm transition hover:bg-[#145dbf]",
  panel:
    "h-11 rounded-lg bg-[#1877f2] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#145dbf]"
};

function cleanBaseUrl(value?: string) {
  const cleaned = value?.trim().replace(/\/+$/, "");
  return cleaned || undefined;
}

function getClientBaseUrl() {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  const appUrl = cleanBaseUrl(process.env.NEXT_PUBLIC_APP_URL);

  if (appUrl) {
    return appUrl;
  }

  const vercelUrl = cleanBaseUrl(process.env.NEXT_PUBLIC_VERCEL_URL);

  if (vercelUrl) {
    return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
  }

  return LOCAL_APP_URL;
}

function getSameOriginUrl(pathOrUrl: string, baseUrl: string) {
  const base = new URL(baseUrl);
  const url = new URL(pathOrUrl || "/", base);

  if (url.origin !== base.origin) {
    return base.href;
  }

  return url.href;
}

function getErrorCode(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return "unknown";
  }

  if ("code" in error && typeof error.code === "string") {
    return error.code;
  }

  if ("errors" in error && Array.isArray(error.errors)) {
    const firstError = error.errors[0];

    if (typeof firstError === "object" && firstError !== null && "code" in firstError) {
      return String(firstError.code);
    }
  }

  return error instanceof Error ? error.name : "unknown";
}

export function FacebookAuthButton({
  children = "Nastavi s Facebookom",
  className = "",
  redirectUrlComplete = "/",
  variant = "panel"
}: FacebookAuthButtonProps) {
  const { fetchStatus, signIn } = useSignIn();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const errorId = useId();
  const isBusy = fetchStatus === "fetching" || isRedirecting;

  async function handleFacebookLogin() {
    if (isBusy) {
      return;
    }

    setHasError(false);
    setIsRedirecting(true);

    try {
      const baseUrl = getClientBaseUrl();
      const redirectUrl = getSameOriginUrl("/sso-callback", baseUrl);
      const safeRedirectUrlComplete = getSameOriginUrl(redirectUrlComplete, baseUrl);

      if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
        console.warn("[Buvljak auth] Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY for Facebook login.");
        throw new Error("missing_clerk_publishable_key");
      }

      console.info("[Buvljak auth] Starting Facebook OAuth redirect.", {
        appOrigin: new URL(baseUrl).origin,
        redirectPath: new URL(redirectUrl).pathname,
        redirectCompletePath: new URL(safeRedirectUrlComplete).pathname
      });

      const result = await signIn.sso({
        strategy: "oauth_facebook",
        redirectCallbackUrl: redirectUrl,
        redirectUrl: safeRedirectUrlComplete
      });

      if (result.error) {
        throw result.error;
      }
    } catch (error) {
      console.warn("[Buvljak auth] Facebook login failed before provider redirect.", {
        code: getErrorCode(error)
      });
      setHasError(true);
      setIsRedirecting(false);
    }
  }

  return (
    <span className={`relative inline-flex flex-col items-start gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleFacebookLogin}
        disabled={isBusy}
        aria-describedby={hasError ? errorId : undefined}
        aria-label="Prijava preko Facebooka"
        className={`focus-ring inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]}`}
      >
        {isBusy ? (
          <Loader2 aria-hidden="true" className="animate-spin" size={16} />
        ) : (
          <Facebook aria-hidden="true" size={16} />
        )}
        <span>{children}</span>
      </button>
      {hasError ? (
        <span
          id={errorId}
          role="alert"
          className={
            variant === "header"
              ? "absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-clay/20 bg-white p-3 text-xs font-bold leading-relaxed text-clay shadow-soft"
              : "max-w-sm text-sm font-bold leading-relaxed text-clay"
          }
        >
          {FACEBOOK_LOGIN_ERROR_MESSAGE}
        </span>
      ) : null}
    </span>
  );
}
