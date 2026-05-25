import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

type CompareRequest = {
  code: string;
  language: string;
};

type ReviewResult = {
  promptVersion: string;
  score: number;
  issueCount: number;
  latencyMs: number;
  totalTokens: number;
  summary: string;
};

const promptVersions = [
  "production-frontend-v1",
  "security-focused-v1",
  "performance-focused-v1",
];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CompareRequest;
    const { code, language } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY in .env.local." },
        { status: 500 }
      );
    }

    if (!code || code.trim().length < 20) {
      return NextResponse.json(
        { error: "Please provide a longer code snippet for comparison." },
        { status: 400 }
      );
    }

    const results: ReviewResult[] = [];

    for (const promptVersion of promptVersions) {
      const startTime = Date.now();
      const systemPrompt = getSystemPrompt(promptVersion);

      const prompt = `${systemPrompt}

Review the following ${language} code for production readiness:

${code}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      });

      const latencyMs = Date.now() - startTime;
      const content = response.text;

      if (!content) {
        throw new Error(`Gemini returned no content for ${promptVersion}`);
      }

      const parsedReview = parseGeminiJson(content);
            const issueCount =
        parsedReview.bugs.length +
        parsedReview.securityRisks.length +
        parsedReview.performanceIssues.length +
        parsedReview.productionReadiness.length;

      const promptTokens = Math.round(prompt.length / 4);
      const completionTokens = Math.round(content.length / 4);
      const totalTokens = promptTokens + completionTokens;

      await logComparisonToRespan({
        prompt,
        output: parsedReview,
        code,
        language,
        promptVersion,
        latencyMs,
        score: parsedReview.score,
        issueCount,
        promptTokens,
        completionTokens,
        totalTokens,
      });

      results.push({
        promptVersion,
        score: parsedReview.score,
        issueCount,
        latencyMs,
        totalTokens,
        summary: parsedReview.summary,
      });
    }

    const bestResult = results.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    return NextResponse.json({
      results,
      bestPromptVersion: bestResult.promptVersion,
    });
  } catch (error) {
    console.error("Compare API error:", error);

    return NextResponse.json(
      { error: "Failed to compare prompt versions." },
      { status: 500 }
    );
  }
}

function getSystemPrompt(promptVersion: string) {
  const baseInstructions = `
You are a senior software engineer reviewing code for a production application.

Return ONLY valid JSON with this exact structure:
{
  "score": number,
  "summary": string,
  "bugs": string[],
  "securityRisks": string[],
  "performanceIssues": string[],
  "productionReadiness": string[],
  "suggestedFixes": string[]
}

Rules:
- score must be from 0 to 100.
- Each array must contain 2 to 5 specific, useful items.
- Be direct and technical.
- Focus on realistic production engineering concerns.
- Do not include markdown.
- Do not wrap the JSON in code fences.
`;

  if (promptVersion === "security-focused-v1") {
    return `${baseInstructions}
Prioritize security risks, unsafe data handling, injection risks, authentication issues, authorization gaps, secrets exposure, and unsafe browser behavior.`;
  }

  if (promptVersion === "performance-focused-v1") {
    return `${baseInstructions}
Prioritize rendering performance, unnecessary recomputation, slow API calls, caching, bundle size, database/API efficiency, and scalability.`;
  }

  return `${baseInstructions}
Prioritize frontend correctness, React/Next.js best practices, TypeScript safety, accessibility, maintainability, and production readiness.`;
}
async function logComparisonToRespan({
  prompt,
  output,
  code,
  language,
  promptVersion,
  latencyMs,
  score,
  issueCount,
  promptTokens,
  completionTokens,
  totalTokens,
}: {
  prompt: string;
  output: unknown;
  code: string;
  language: string;
  promptVersion: string;
  latencyMs: number;
  score: number;
  issueCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}) {
  if (!process.env.RESPAN_API_KEY) {
    console.warn("Skipping Respan comparison logging because RESPAN_API_KEY is missing.");
    return null;
  }

  const traceId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `tracepilot-compare-${Date.now()}`;

  const inputMessages = [
    {
      role: "system",
      content: "You are comparing prompt versions for an AI code review workflow.",
    },
    {
      role: "user",
      content: prompt,
    },
  ];

  const outputMessage = {
    role: "assistant",
    content: JSON.stringify(output),
  };

  const response = await fetch("https://api.respan.ai/api/request-logs/create/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESPAN_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gemini-2.5-flash",
      log_type: "chat",
      request_id: traceId,
      trace_unique_id: `tracepilot-prompt-comparison-${Date.now()}`,
      input: JSON.stringify(inputMessages),
      output: JSON.stringify(outputMessage),
      customer_identifier: "tracepilot_local_user",
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      latency: latencyMs / 1000,
      cost: 0,
      status_code: 200,
      metadata: {
        app_name: "TracePilot",
        workflow: "prompt_comparison",
        provider: "google_gemini",
        language,
        prompt_version: promptVersion,
        latency_ms: latencyMs,
        review_score: score,
        issue_count: issueCount,
        code_length: code.length,
        environment: "local_dev",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Respan comparison logging failed:", errorText);
    return null;
  }

  return response.json();
}
function parseGeminiJson(content: string) {
  const cleaned = content
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const repaired = cleaned.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
    return JSON.parse(repaired);
  }
}