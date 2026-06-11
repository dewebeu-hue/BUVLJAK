import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[65vh] max-w-4xl items-center justify-center">
        <SignIn fallbackRedirectUrl="/" forceRedirectUrl="/" />
      </div>
    </main>
  );
}
