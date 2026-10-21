import { createFileRoute } from "@tanstack/react-router";
import { streamAyraReply, type ChatTurn } from "@/lib/ayra.server";

export const Route = createFileRoute("/api/ayra")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let command = "";
        let history: ChatTurn[] = [];
        try {
          const body = (await request.json()) as { command?: unknown; history?: unknown };
          if (typeof body.command === "string") command = body.command.trim().slice(0, 2000);
          if (Array.isArray(body.history))
            history = body.history
              .filter(
                (t): t is ChatTurn =>
                  !!t && (t.role === "user" || t.role === "assistant") && typeof t.content === "string",
              )
              .slice(-20)
              .map((t) => ({ role: t.role, content: t.content.slice(0, 4000) }));
        } catch {
          return Response.json({ error: "Invalid request body" }, { status: 400 });
        }
        if (!command) return Response.json({ error: "Command is required" }, { status: 400 });
        try {
          const result = streamAyraReply(request, command, history);
          return result.toTextStreamResponse({
            headers: { "Cache-Control": "no-cache, no-transform" },
          });
        } catch (error) {
          console.error("AYRA command failed:", error);
          return Response.json(
            { error: "AYRA is unavailable right now. Please try again." },
            { status: 502 },
          );
        }
      },
    },
  },
});
