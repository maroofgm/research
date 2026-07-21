import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { ResearchPlan, Source } from "./types";

const PlanSchema = z.object({
  queries: z
    .array(z.string().min(8).max(160))
    .min(3)
    .max(5),
});

const RefinedReportSchema = z.object({
  critique: z.array(z.string().min(8).max(220)).min(2).max(4),
  confidence: z.number().int().min(0).max(100),
  report: z.string().min(500),
});

let client: OpenAI | undefined;

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export function getModel() {
  return process.env.OPENAI_MODEL || "gpt-5.6-terra";
}

export async function generatePlan(topic: string): Promise<ResearchPlan> {
  const response = await getClient().responses.parse({
    model: getModel(),
    reasoning: { effort: "low" },
    input: [
      {
        role: "developer",
        content:
          "You plan concise web research. Return 3 to 5 specific, non-overlapping search queries that jointly cover definitions, evidence, competing views, limitations, and current developments when relevant. Each query must work as a standalone web search. Do not answer the topic.",
      },
      {
        role: "user",
        content: `Create a research plan for this topic: ${topic}`,
      },
    ],
    text: {
      format: zodTextFormat(PlanSchema, "research_plan"),
      verbosity: "low",
    },
  });

  if (!response.output_parsed) {
    throw new Error("The model did not return a research plan.");
  }

  return response.output_parsed;
}

function sourceContext(sources: Source[]) {
  return sources
    .map(
      (source) =>
        `[${source.id}] ${source.title}\nURL: ${source.url}\nSearch context: ${source.snippet}`,
    )
    .join("\n\n");
}

export async function synthesizeReport(topic: string, sources: Source[]): Promise<string> {
  const response = await getClient().responses.create({
    model: getModel(),
    reasoning: { effort: "low" },
    input: [
      {
        role: "developer",
        content:
          "Write an evidence-led research digest in Markdown. Use only the provided source context for factual claims. Cite factual claims inline with the exact numbered form [1], [2], or [1][3]. Distinguish strong evidence from inference, note disagreement and missing evidence, and never invent a citation. Write a specific title, a short executive summary, 3–5 informative sections, and a concise conclusion. Do not add a Sources section; the application appends the canonical list.",
      },
      {
        role: "user",
        content: `Topic: ${topic}\n\nSource context:\n${sourceContext(sources)}`,
      },
    ],
    text: { verbosity: "medium" },
  });

  const report = response.output_text.trim();
  if (report.length < 500) throw new Error("The draft report was incomplete.");
  return report;
}

export async function refineReport(topic: string, draft: string, sources: Source[]) {
  const response = await getClient().responses.parse({
    model: getModel(),
    reasoning: { effort: "medium" },
    input: [
      {
        role: "developer",
        content:
          "Act as a rigorous research editor. Identify the draft's most material weaknesses, then return a stronger final Markdown report. Every critique array item must be one concise, complete sentence. Preserve only claims supported by the supplied source context and use exact numbered inline citations such as [2] or [2][5]. Improve coverage, qualification, organization, and clarity. Do not invent facts or URLs. Do not add a Sources section; the application appends it. Confidence is 0–100 and should reflect source quality, coverage, agreement, and recency—not writing quality.",
      },
      {
        role: "user",
        content: `Topic: ${topic}\n\nDraft to critique:\n${draft}\n\nSource context:\n${sourceContext(sources)}`,
      },
    ],
    text: {
      format: zodTextFormat(RefinedReportSchema, "refined_research_report"),
      verbosity: "medium",
    },
  });

  if (!response.output_parsed) {
    throw new Error("The model did not return a refined report.");
  }

  return response.output_parsed;
}
