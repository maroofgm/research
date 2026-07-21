import type { ResearchStep, Source, StepStatus } from "@/lib/types";

export interface StepState {
  id: ResearchStep;
  label: string;
  detail: string;
  status: StepStatus;
}

interface StepTrackerProps {
  steps: StepState[];
  queries: string[];
  sources: Source[];
}

const stepNumber: Record<ResearchStep, string> = {
  plan: "01",
  research: "02",
  synthesize: "03",
  refine: "04",
};

export function StepTracker({ steps, queries, sources }: StepTrackerProps) {
  return (
    <section className="traceCard" aria-label="Live research progress" aria-live="polite">
      <div className="traceHeader">
        <div>
          <p className="sectionLabel">Live research trace</p>
          <h2>The work, in the open.</h2>
        </div>
        <span className="liveBadge"><i /> Live</span>
      </div>

      <div className="steps">
        {steps.map((step) => (
          <article className={`step step--${step.status}`} key={step.id}>
            <div className="stepRail">
              <span className="stepNumber">{stepNumber[step.id]}</span>
              <i className="stepDot" />
            </div>
            <div className="stepCopy">
              <div className="stepTitleRow">
                <h3>{step.label}</h3>
                <span>{step.status === "active" ? "In progress" : step.status}</span>
              </div>
              <p>{step.detail}</p>

              {step.id === "plan" && queries.length > 0 && (
                <ol className="queryList">
                  {queries.map((query) => <li key={query}>{query}</li>)}
                </ol>
              )}

              {step.id === "research" && sources.length > 0 && (
                <div className="sourceChips">
                  {sources.slice(0, 6).map((source) => (
                    <span key={source.id}>{new URL(source.url).hostname.replace("www.", "")}</span>
                  ))}
                  {sources.length > 6 && <span>+{sources.length - 6} more</span>}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
