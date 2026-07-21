export type ResearchStep = "plan" | "research" | "synthesize" | "refine";
export type StepStatus = "pending" | "active" | "done" | "error";

export interface ResearchPlan {
  queries: string[];
}

export interface Source {
  id: number;
  title: string;
  url: string;
  snippet: string;
  query: string;
}

export interface ResearchResult {
  topic: string;
  queries: string[];
  sources: Source[];
  report: string;
  critique: string[];
  confidence: number;
  filename: string;
}

export interface StreamEvent {
  step: ResearchStep;
  status: StepStatus;
  message: string;
  data?: unknown;
}
