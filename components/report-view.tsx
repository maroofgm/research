import ReactMarkdown from "react-markdown";
import type { ResearchResult } from "@/lib/types";

interface ReportViewProps {
  result: ResearchResult;
  onReset: () => void;
}

export function ReportView({ result, onReset }: ReportViewProps) {
  return (
    <section className="reportSection" aria-labelledby="report-heading">
      <div className="reportToolbar">
        <div>
          <p className="sectionLabel">Final digest</p>
          <h2 id="report-heading">Research, resolved.</h2>
        </div>
        <div className="reportActions">
          <button className="buttonSecondary" type="button" onClick={onReset}>New topic</button>
          <a
            className="buttonPrimary buttonSmall"
            href={`data:text/markdown;charset=utf-8,${encodeURIComponent(result.report)}`}
            download={result.filename}
          >
            Download .md <span>↓</span>
          </a>
        </div>
      </div>

      <div className="qualityGrid">
        <article className="confidenceCard">
          <div className="scoreRing" style={{ "--score": `${result.confidence * 3.6}deg` } as React.CSSProperties}>
            <strong>{result.confidence}</strong><small>/100</small>
          </div>
          <div><span>Evidence confidence</span><p>Based on coverage, agreement, source quality, and recency.</p></div>
        </article>
        <article className="critiqueCard">
          <span>Editor’s refinement</span>
          <ul>{result.critique.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
      </div>

      <article className="reportCard">
        <ReactMarkdown
          components={{
            a: ({ children, ...props }) => <a {...props} target="_blank" rel="noreferrer">{children}</a>,
          }}
        >
          {result.report}
        </ReactMarkdown>
      </article>
    </section>
  );
}
