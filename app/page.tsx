import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  OrganizationSwitcher,
} from "@clerk/nextjs";
import Link from "next/link";



export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Slate</h1>

      <SignedOut>
        <p>You are signed out.</p>
        <SignInButton />
      </SignedOut>

      <SignedIn>
        <OrganizationSwitcher />
        <p>You are signed in.</p>
        <p>
          <Link href="/organization-profile">Organization settings</Link>
        </p>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>

      <p>env: {process.env.NEXT_PUBLIC_APP_ENV ?? "unknown"}</p>
    </main>
  );
}
