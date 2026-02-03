export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Slate</h1>
      <p>Hello world ✅</p>
      <p>env: {process.env.NEXT_PUBLIC_APP_ENV ?? "unknown"}</p>
    </main>
  );
}
