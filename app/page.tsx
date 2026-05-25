"use client";

import { useState } from "react";

const sampleCode = `export function UserCard({ user }) {
  const fullName = user.firstName + " " + user.lastName;

  return (
    <div onClick={() => window.location.href = "/users/" + user.id}>
      <img src={user.avatar} />
      <h2>{fullName}</h2>
      <p>{user.email}</p>
    </div>
  );
}`;

type Review = {
  score: number;
  summary: string;
  bugs: string[];
  securityRisks: string[];
  performanceIssues: string[];
  productionReadiness: string[];
  suggestedFixes: string[];
};

type ReviewMetadata = {
  model: string;
  latencyMs: number;
  promptVersion: string;
  language: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  respanLogged?: boolean;
};

type CompareResult = {
  promptVersion: string;
  score: number;
  issueCount: number;
  latencyMs: number;
  totalTokens: number;
  summary: string;
};

type CompareResponse = {
  results: CompareResult[];
  bestPromptVersion: string;
};

export default function Home() {
  const [code, setCode] = useState(sampleCode);
  const [language, setLanguage] = useState("TypeScript");
  const [promptVersion, setPromptVersion] = useState("production-frontend-v1");
  const [review, setReview] = useState<Review | null>(null);
  const [metadata, setMetadata] = useState<ReviewMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [comparison, setComparison] = useState<CompareResponse | null>(null);
const [isComparing, setIsComparing] = useState(false);
const [compareError, setCompareError] = useState("");

  async function runReview() {
    setIsLoading(true);
    setErrorMessage("");
    setReview(null);
    setMetadata(null);

    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language,
          promptVersion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate review.");
      }

      setReview(data.review);
      setMetadata(data.metadata);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while generating the review."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function comparePromptVersions() {
  setIsComparing(true);
  setCompareError("");
  setComparison(null);

  try {
    const response = await fetch("/api/compare", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        language,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to compare prompt versions.");
    }

    setComparison(data);
  } catch (error) {
    setCompareError(
      error instanceof Error
        ? error.message
        : "Something went wrong while comparing prompt versions."
    );
  } finally {
    setIsComparing(false);
  }
}

  const issueCount =
    review
      ? review.bugs.length +
        review.securityRisks.length +
        review.performanceIssues.length +
        review.productionReadiness.length
      : 0;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-4 border-b border-slate-800 pb-8">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-400">
            TracePilot
          </p>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
                AI code review with Respan observability.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                Paste frontend or full-stack code, run an LLM-powered production
                review, and track prompt version, latency, token usage, and
                quality signals for every review.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <p className="text-sm text-slate-400">Built for</p>
              <p className="mt-2 text-lg font-semibold text-white">
                React, Next.js, TypeScript, Python, and AI-assisted engineering
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Code input
                </h2>
                <p className="text-sm text-slate-400">
                  Paste code or a PR diff to review.
                </p>
              </div>

              <div className="flex gap-2">
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                >
                  <option>TypeScript</option>
                  <option>React</option>
                  <option>Next.js</option>
                  <option>Python</option>
                  <option>API Route</option>
                </select>

                <select
                  value={promptVersion}
                  onChange={(event) => setPromptVersion(event.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                >
                  <option>production-frontend-v1</option>
                  <option>security-focused-v1</option>
                  <option>performance-focused-v1</option>
                </select>
              </div>
            </div>

            <textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="min-h-[440px] w-full resize-none rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none ring-cyan-500/30 focus:ring-4"
              spellCheck={false}
            />

            <div className="mt-4 grid gap-3 md:grid-cols-2">
  <button
    onClick={runReview}
    disabled={isLoading || isComparing}
    className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {isLoading ? "Running AI review..." : "Run AI code review"}
  </button>

  <button
    onClick={comparePromptVersions}
    disabled={isLoading || isComparing}
    className="rounded-2xl border border-cyan-400 px-5 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {isComparing ? "Comparing prompts..." : "Compare prompt versions"}
  </button>
</div>

            {errorMessage && (
              <p className="mt-3 rounded-xl border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </p>
            )}
            {compareError && (
  <p className="mt-3 rounded-xl border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-200">
    {compareError}
  </p>
)}
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
              <h2 className="text-xl font-semibold text-white">
                Review output
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                AI-generated production review for the submitted code.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Metric
                  label="Score"
                  value={review ? `${review.score}/100` : "Pending"}
                />
                <Metric
                  label="Issues"
                  value={review ? String(issueCount) : "Pending"}
                />
                <Metric
                  label="Latency"
                  value={metadata ? `${metadata.latencyMs}ms` : "Pending"}
                />
                <Metric
                  label="Tokens"
                  value={metadata ? String(metadata.totalTokens) : "Pending"}
                />
              </div>

              {review ? (
                <div className="mt-6 space-y-4">
                  <ReviewSection title="Summary" items={[review.summary]} />
                  <ReviewSection title="Bugs" items={review.bugs} />
                  <ReviewSection
                    title="Security risks"
                    items={review.securityRisks}
                  />
                  <ReviewSection
                    title="Performance issues"
                    items={review.performanceIssues}
                  />
                  <ReviewSection
                    title="Production readiness"
                    items={review.productionReadiness}
                  />
                  <ReviewSection
                    title="Suggested fixes"
                    items={review.suggestedFixes}
                  />
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-700 p-5 text-sm leading-6 text-slate-400">
                  Waiting for review. This panel will show bugs, security risks,
                  performance issues, and suggested fixes.
                </div>
              )}
            </div>

            {comparison && (
  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
      <div>
        <h2 className="text-xl font-semibold text-white">
          Prompt comparison
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Compared 3 prompt versions with Gemini and logged each run to Respan.
        </p>
      </div>

      <div className="rounded-xl border border-cyan-400 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300">
        Best: {comparison.bestPromptVersion}
      </div>
    </div>

    <div className="mt-5 space-y-3">
      {comparison.results.map((result) => (
        <div
          key={result.promptVersion}
          className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="font-semibold text-white">
                {result.promptVersion}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                {result.summary}
              </p>
            </div>

<div className="grid min-w-[260px] grid-cols-3 gap-2 text-center text-xs">
  <div className="rounded-xl bg-slate-900 px-3 py-2">
    <p className="text-slate-500">Score</p>
    <p className="mt-1 font-semibold text-white">
      {result.score}
    </p>
  </div>
  <div className="rounded-xl bg-slate-900 px-3 py-2">
    <p className="text-slate-500">Issues</p>
    <p className="mt-1 font-semibold text-white">
      {result.issueCount}
    </p>
  </div>
  <div className="rounded-xl bg-slate-900 px-3 py-2">
    <p className="text-slate-500">Tokens</p>
    <p className="mt-1 font-semibold text-white">
      {result.totalTokens}
    </p>
  </div>
</div>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Latency: {result.latencyMs}ms
          </p>
        </div>
      ))}
    </div>
  </div>
)}

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
              <h2 className="text-xl font-semibold text-white">
                Respan trace metadata
              </h2>

              <div className="mt-4 space-y-3 text-sm">
                <MetadataRow label="Language" value={language} />
                <MetadataRow label="Prompt version" value={promptVersion} />
                <MetadataRow
                  label="Model"
                  value={metadata?.model || "Not logged yet"}
                />
                <MetadataRow
                  label="Prompt tokens"
                  value={metadata ? String(metadata.promptTokens) : "Pending"}
                />
                <MetadataRow
                  label="Completion tokens"
                  value={
                    metadata ? String(metadata.completionTokens) : "Pending"
                  }
                />
                <MetadataRow
  label="Respan logged"
  value={metadata?.respanLogged ? "Yes" : "Pending"}
/>
<MetadataRow label="Trace type" value="code_review" />
<MetadataRow label="Environment" value="local_dev" />
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-950 px-4 py-3">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-100">{value}</span>
    </div>
  );
}

function ReviewSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
        {title}
      </h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}