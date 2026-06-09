import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SsoCallbackPage() {
  return (
    <main className="grid min-h-[60vh] place-items-center px-4">
      <div className="rounded-lg border border-ink/10 bg-white p-5 text-center shadow-sm">
        <p className="text-sm font-black text-ink/64">Dovršavanje prijave...</p>
        <AuthenticateWithRedirectCallback />
      </div>
    </main>
  );
}
