import { SignIn } from "@clerk/clerk-react";

export function LoginPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden bg-slate-50 px-3 py-8 sm:px-4 sm:py-12">
      <div className="mb-6 w-full max-w-md text-center sm:mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary sm:text-sm">
          Receipt Auto-Fill
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Sign in to continue
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Your invoices are private to your account. Use Google or email — Clerk
          remembers your session so you can come back anytime.
        </p>
      </div>

      <SignIn
        routing="hash"
        signUpUrl="#/sign-up"
        appearance={{
          elements: {
            rootBox: "mx-auto w-full max-w-[min(100%,24rem)]",
            card: "shadow-lg border border-slate-200 rounded-xl w-full",
          },
        }}
      />

      <p className="mt-6 text-sm text-slate-600">
        No account?{" "}
        <a href="#/sign-up" className="font-medium text-primary hover:underline">
          Sign up with Google
        </a>
      </p>
    </div>
  );
}
