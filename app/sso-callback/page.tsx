import Link from "next/link";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

type SearchParams = Record<string, string | string[] | undefined>;

type SsoCallbackPageProps = {
  searchParams?: Promise<SearchParams> | SearchParams;
};

const FACEBOOK_LOGIN_ERROR_MESSAGE =
  "Prijava putem Facebooka trenutno nije uspjela. Pokušajte ponovno ili koristite drugi način prijave.";

function getParamValue(params: SearchParams | undefined, key: string) {
  const value = params?.[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function SsoCallbackPage({ searchParams }: SsoCallbackPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const errorCode = getParamValue(params, "error");
  const hasOAuthError = Boolean(errorCode || getParamValue(params, "error_description"));

  if (hasOAuthError) {
    console.warn("[Buvljak auth] OAuth callback returned an error.", {
      provider: "facebook",
      errorCode: errorCode ?? "unknown",
      hasErrorDescription: Boolean(getParamValue(params, "error_description"))
    });

    return (
      <main className="grid min-h-[60vh] place-items-center px-4">
        <div className="max-w-md rounded-lg border border-clay/20 bg-white p-5 text-center shadow-sm">
          <h1 className="text-xl font-black text-ink">Prijava nije uspjela</h1>
          <p className="mt-3 text-sm font-bold leading-relaxed text-ink/68">
            {FACEBOOK_LOGIN_ERROR_MESSAGE}
          </p>
          <Link
            href="/sign-in"
            className="focus-ring mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
          >
            Drugi način prijave
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-[60vh] place-items-center px-4">
      <div className="rounded-lg border border-ink/10 bg-white p-5 text-center shadow-sm">
        <p className="text-sm font-black text-ink/64">Dovršavanje prijave...</p>
        <AuthenticateWithRedirectCallback />
      </div>
    </main>
  );
}
