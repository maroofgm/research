import { ResearchWorkspace } from "@/components/research-workspace";

export default function Home() {
  return (
    <main className="shell">
      <header className="masthead">
        <a className="brand" href="#top" aria-label="Fieldnote home">
          <span className="brandMark">F</span>
          <span>Fieldnote</span>
        </a>
        <span className="statusPill"><i /> Research agent</span>
      </header>

      <ResearchWorkspace />

      <footer className="footer">
        <span>Fieldnote</span>
        <p>Live web research · GPT‑5.6 · Sources stay visible</p>
      </footer>
    </main>
  );
}
