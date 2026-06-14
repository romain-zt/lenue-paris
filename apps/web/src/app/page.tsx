// Minimal placeholder front-end. Reads published Pages from the CMS REST API.
async function getPages() {
  const cms = process.env.CMS_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${cms}/api/pages?locale=en`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { docs?: { id: string; title: string }[] };
    return data.docs ?? [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const pages = await getPages();
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Web app</h1>
      <p>Pages from the CMS:</p>
      <ul>
        {pages.map((p) => (
          <li key={p.id}>{p.title}</li>
        ))}
      </ul>
    </main>
  );
}
