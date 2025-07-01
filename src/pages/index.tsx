import Link from "next/link";

export default function Home() {
  return (
    <div style={{ maxWidth: 700, margin: "2rem auto" }}>
      <h1>Velkommen til Helper</h1>
      <ul>
        <li>
          <Link href="/CaseworkerHelper">Caseworker Helper</Link>
        </li>
      </ul>
    </div>
  );
}
