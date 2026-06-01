import { SignUp } from "@clerk/clerk-react";

export function SignUpPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden bg-slate-50 px-3 py-8 sm:px-4 sm:py-12">
      <div className="mb-6 w-full max-w-md text-center sm:mb-8">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Create an account
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Continue with Google to save and manage your invoices securely.
        </p>
      </div>

      <SignUp
        routing="hash"
        signInUrl="#/sign-in"
        appearance={{
          elements: {
            rootBox: "mx-auto w-full max-w-[min(100%,24rem)]",
            card: "shadow-lg border border-slate-200 rounded-xl w-full",
          },
        }}
      />
    </div>
  );
}
