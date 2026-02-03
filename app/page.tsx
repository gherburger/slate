import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Slate</h1>

      <SignedOut>
        <p>You are signed out.</p>
        <SignInButton />
      </SignedOut>

      <SignedIn>
        <p>You are signed in.</p>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>

      <p>env: {process.env.NEXT_PUBLIC_APP_ENV ?? "unknown"}</p>
    </main>
  );
}
