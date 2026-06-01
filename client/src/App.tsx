import { ClerkProvider, SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { convex } from "./lib/convex.ts";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { SignUpPage } from "./pages/SignUpPage";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim();

function AppRoutes() {
  const hash = window.location.hash;

  if (hash.startsWith("#/sign-up")) {
    return (
      <>
        <SignedOut>
          <SignUpPage />
        </SignedOut>
        <SignedIn>
          <Authenticated>
            <HomePage />
          </Authenticated>
        </SignedIn>
      </>
    );
  }

  return (
    <>
      <SignedOut>
        <LoginPage />
      </SignedOut>
      <SignedIn>
        <AuthLoading>
          <div className="flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-slate-50 px-4 text-slate-600">
            Loading your account…
          </div>
        </AuthLoading>
        <Authenticated>
          <HomePage />
        </Authenticated>
        <Unauthenticated>
          <div className="flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-slate-50 px-4 text-slate-600">
            Connecting to Convex…
          </div>
        </Unauthenticated>
      </SignedIn>
    </>
  );
}

function MissingClerkKey() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-slate-50 p-4 text-center sm:p-6">
      <p className="max-w-md text-sm text-red-600">
        Missing <code>VITE_CLERK_PUBLISHABLE_KEY</code> in{" "}
        <code>client/.env</code>. Create a Clerk app at clerk.com and add the
        publishable key.
      </p>
    </div>
  );
}

export default function App() {
  if (!clerkPubKey) {
    return <MissingClerkKey />;
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <AppRoutes />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
