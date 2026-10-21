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

const AYRA_SYSTEM = `You are AYRA, the female AI command-center assistant of Software Vala.
The dashboard has three modules: Settings, Roles & Permissions, and Security.
Reply in character: concise (2-4 sentences), confident, warm, task-specific.
If the command asks to open one of those modules, confirm you are opening it.
Never invent numbers, records, customers, sales or any other data you were not given; if asked for data you do not have, say so plainly.`;

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
