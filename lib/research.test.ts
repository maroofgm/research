import { describe, expect, it } from "vitest";
import { finalizeReport, reportFilename } from "./research";
import type { Source } from "./types";

const sources: Source[] = [
  { id: 1, title: "Primary evidence", url: "https://example.com/evidence", snippet: "Evidence", query: "q" },
  { id: 2, title: "Independent review", url: "https://example.org/review", snippet: "Review", query: "q" },
];

describe("reportFilename", () => {
  it("creates a safe markdown filename", () => {
    expect(reportFilename("AI & Climate: 2026 / Outlook")).toBe("ai-climate-2026-outlook.md");
  });
});

describe("finalizeReport", () => {
  it("replaces model sources with the canonical list and removes invalid citations", () => {
    const report = finalizeReport("# Report\n\nSupported [1], invalid [9].\n\n## Sources\nFake", sources);
    expect(report).toContain("Supported [1], invalid .");
    expect(report).toContain("[2] [Independent review](https://example.org/review)");
    expect(report).not.toContain("Fake");
  });
});
