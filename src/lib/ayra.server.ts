import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";

const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

/** Request-local fetch wrapper that reuses the gateway-issued run ID. */
export function createLovableAiGatewayRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  return {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER))
        headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      const response = await fetch(input, { ...init, headers });
      runId ??= response.headers.get(LOVABLE_AIG_RUN_ID_HEADER)?.trim() || undefined;
      return response;
    },
    getRunId: () => runId,
  };
}

const AYRA_SYSTEM = `You are AYRA, the female AI command-center assistant of Software Vala, a global software company.
The dashboard shows: 6,248 software products, 12,486 customers, $4,850 sales today, 132 active projects, 48 AI tasks, system health 100%.
Brands: Marketplace, ERPvala, Saasvala, BetaWhatsap, Rating Guard, SchoolSolution, POSvala, Custom Build.
Live agents: Hermes (marketplace trends), Code (building modules), SEO, Data, Content, Support.
Interpret the user's natural-language command and reply in character: concise (2-4 sentences), confident, warm, task-specific.
If the command asks to open a module (Projects, Software, Marketplace, Sales, Customers, Agents, Development, Servers, APIs, Analytics, Finance, Team, Settings), confirm you are opening it and add one useful observation about it.
Never invent precise new figures beyond those above; speak like a helpful command-center AI.`;

/** Stream AYRA's reply for a user command. Consumed by the /api/ayra route. */
export function streamAyraReply(request: Request, command: string) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
  const runIdFetch = createLovableAiGatewayRunIdFetch(
    request.headers.get(LOVABLE_AIG_RUN_ID_HEADER)?.trim() || undefined,
  );
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const messages: ModelMessage[] = [{ role: "user", content: command }];
  return streamText({
    model: provider.responses("openai/gpt-6-astra"),
    system: AYRA_SYSTEM,
    messages,
    abortSignal: request.signal,
    maxRetries: 0,
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });
}
