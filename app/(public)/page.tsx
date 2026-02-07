import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();
  if (userId) return redirect("/org");

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Slate</h1>
      <p>You are signed out.</p>
      <SignInButton />
      <p>env: {process.env.NEXT_PUBLIC_APP_ENV ?? "unknown"}</p>
    </main>
  );
}
