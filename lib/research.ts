import type { Source } from "./types";

export function reportFilename(topic: string) {
  const slug = topic
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);

  return `${slug || "research-digest"}.md`;
}

export function finalizeReport(report: string, sources: Source[]) {
  const withoutSources = report.replace(/\n## Sources[\s\S]*$/i, "").trim();
  const maxCitation = sources.length;
  const safeBody = withoutSources.replace(/\[(\d+)\]/g, (match, id: string) => {
    const number = Number(id);
    return number >= 1 && number <= maxCitation ? match : "";
  });
  const sourceList = sources
    .map((source) => `[${source.id}] [${source.title}](${source.url})`)
    .join("\n\n");

  return `${safeBody}\n\n## Sources\n\n${sourceList}\n`;
}
