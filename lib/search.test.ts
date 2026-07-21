import { describe, expect, it } from "vitest";
import { parseDuckDuckGoHtml, resolveResultUrl } from "./search";

describe("resolveResultUrl", () => {
  it("extracts DuckDuckGo redirect targets", () => {
    expect(
      resolveResultUrl("//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fresearch%3Fa%3D1"),
    ).toBe("https://example.com/research?a=1");
  });

  it("rejects internal and unsafe URLs", () => {
    expect(resolveResultUrl("javascript:alert(1)")).toBeNull();
    expect(resolveResultUrl("https://duckduckgo.com/about")).toBeNull();
  });
});

describe("parseDuckDuckGoHtml", () => {
  it("extracts clean, bounded search results", () => {
    const html = `
      <div class="result">
        <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fpaper">  Example paper  </a>
        <div class="result__snippet">A useful   research summary.</div>
      </div>
      <div class="result">
        <a class="result__a" href="https://second.example/report">Second report</a>
        <div class="result__snippet">Independent evidence.</div>
      </div>`;

    expect(parseDuckDuckGoHtml(html, "test query", 1)).toEqual([
      {
        title: "Example paper",
        url: "https://example.com/paper",
        snippet: "A useful research summary.",
        query: "test query",
      },
    ]);
  });
});
