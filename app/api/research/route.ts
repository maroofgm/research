import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePlan, refineReport, synthesizeReport } from "@/lib/openai";
import { finalizeReport, reportFilename } from "@/lib/research";
import { searchQueries } from "@/lib/search";
import type { ResearchResult, ResearchStep, StreamEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RequestSchema = z.object({
  topic: z.string().trim().min(3).max(300),
});

export async function POST(request: Request) {
  let topic: string;

  try {
    topic = RequestSchema.parse(await request.json()).topic;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Enter a valid research topic.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      let activeStep: ResearchStep = "plan";

      try {
        emit({ step: "plan", status: "active", message: "Mapping the question into focused lines of inquiry…" });
        const plan = await generatePlan(topic);
        emit({ step: "plan", status: "done", message: `${plan.queries.length} research questions planned`, data: plan.queries });

        activeStep = "research";
        emit({ step: "research", status: "active", message: "Searching the live web across every question…" });
        const sources = await searchQueries(plan.queries);
        emit({ step: "research", status: "done", message: `${sources.length} distinct sources gathered`, data: sources });

        activeStep = "synthesize";
        emit({ step: "synthesize", status: "active", message: "Comparing evidence and drafting the cited report…" });
        const draft = await synthesizeReport(topic, sources);
        emit({ step: "synthesize", status: "done", message: "First evidence-led draft completed" });

        activeStep = "refine";
        emit({ step: "refine", status: "active", message: "Critiquing coverage, claims, and source quality…" });
        const refined = await refineReport(topic, draft, sources);
        const result: ResearchResult = {
          topic,
          queries: plan.queries,
          sources,
          report: finalizeReport(refined.report, sources),
          critique: refined.critique,
          confidence: refined.confidence,
          filename: reportFilename(topic),
        };
        emit({ step: "refine", status: "done", message: "Final report strengthened and ready", data: result });
      } catch (error) {
        console.error("Research pipeline failed", error);
        emit({
          step: activeStep,
          status: "error",
          message: error instanceof Error ? error.message : "Research failed. Please try again.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
