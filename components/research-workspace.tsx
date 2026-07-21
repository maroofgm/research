"use client";

import { FormEvent, useState } from "react";
import type { ResearchResult, Source, StreamEvent } from "@/lib/types";
import { ReportView } from "./report-view";
import { StepTracker, type StepState } from "./step-tracker";

const initialSteps: StepState[] = [
  { id: "plan", label: "Planning sub-questions", detail: "Break the topic into focused, non-overlapping lines of inquiry.", status: "pending" },
  { id: "research", label: "Searching the web", detail: "Find current evidence and distinct sources for every question.", status: "pending" },
  { id: "synthesize", label: "Writing the report", detail: "Compare the evidence and assemble a cited first draft.", status: "pending" },
  { id: "refine", label: "Refining the draft", detail: "Critique weak claims, improve balance, and score confidence.", status: "pending" },
];

const exampleTopics = [
  "How are small language models changing on-device AI?",
  "What does the evidence say about four-day workweeks?",
  "Can heat pumps meaningfully cut household emissions?",
];

export function ResearchWorkspace() {
  const [topic, setTopic] = useState("");
  const [steps, setSteps] = useState<StepState[]>(initialSteps);
  const [queries, setQueries] = useState<string[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  function handleEvent(event: StreamEvent) {
    setSteps((current) => current.map((step) => (
      step.id === event.step
        ? { ...step, status: event.status, detail: event.message }
        : step
    )));

    if (event.step === "plan" && event.status === "done") {
      setQueries(event.data as string[]);
    }
    if (event.step === "research" && event.status === "done") {
      setSources(event.data as Source[]);
    }
    if (event.step === "refine" && event.status === "done") {
      setResult(event.data as ResearchResult);
    }
    if (event.status === "error") {
      setError(event.message || "Research failed. Please try again.");
    }
  }

  async function runResearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTopic = topic.trim();
    if (cleanTopic.length < 3) {
      setError("Enter a research topic with at least 3 characters.");
      return;
    }

    setError("");
    setResult(null);
    setQueries([]);
    setSources([]);
    setSteps(initialSteps);
    setIsLoading(true);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: cleanTopic }),
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error || "Research could not start. Try again.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) handleEvent(JSON.parse(line) as StreamEvent);
        }

        if (done) break;
      }

      if (buffer.trim()) handleEvent(JSON.parse(buffer) as StreamEvent);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Research failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function reset() {
    setTopic("");
    setResult(null);
    setQueries([]);
    setSources([]);
    setSteps(initialSteps);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const hasRun = isLoading || steps.some((step) => step.status !== "pending");

  return (
    <>
      <section className={`hero ${hasRun ? "hero--compact" : ""}`} id="top">
        <div className="heroCopy">
          <p className="eyebrow">Independent research, on demand</p>
          <h1>From open question<br />to <em>clear perspective.</em></h1>
          <p className="lede">Fieldnote plans the inquiry, searches the live web, and refines a cited report while you watch.</p>
        </div>

        <form className="researchForm" onSubmit={runResearch}>
          <label htmlFor="topic">What would you like to understand?</label>
          <div className="inputRow">
            <input
              id="topic"
              name="topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="e.g. The evidence for a four-day workweek"
              maxLength={300}
              disabled={isLoading}
              autoComplete="off"
            />
            <button className="buttonPrimary" type="submit" disabled={isLoading || topic.trim().length < 3}>
              {isLoading ? <><i className="spinner" /> Researching</> : <>Begin research <span>↗</span></>}
            </button>
          </div>
          {error && <p className="formError" role="alert"><b>!</b> {error}</p>}
          {!hasRun && (
            <div className="examples">
              <span>Try a question</span>
              {exampleTopics.map((example) => (
                <button type="button" key={example} onClick={() => setTopic(example)}>{example}</button>
              ))}
            </div>
          )}
        </form>
      </section>

      {!hasRun && (
        <section className="processPreview" aria-label="Research process">
          {initialSteps.map((step, index) => (
            <article key={step.id}>
              <span>0{index + 1}</span><h2>{step.label.split(" ")[0]}</h2><p>{step.detail}</p>
            </article>
          ))}
        </section>
      )}

      {hasRun && <StepTracker steps={steps} queries={queries} sources={sources} />}
      {result && <ReportView result={result} onReset={reset} />}
    </>
  );
}
