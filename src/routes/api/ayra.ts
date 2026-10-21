import { createFileRoute } from "@tanstack/react-router";
import { streamAyraReply } from "@/lib/ayra.server";
import { MODULE_PERMS } from "@/lib/access";
import { ACCESS_HEADER, requirePerm } from "@/lib/access.server";

export const Route = createFileRoute("/api/ayra")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await requirePerm(MODULE_PERMS.chat, request.headers.get(ACCESS_HEADER));
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : "Access denied" }, { status: 403 });
        }
        let command = "";
        try {
          const body = (await request.json()) as { command?: unknown };
          if (typeof body.command === "string") command = body.command.trim().slice(0, 500);
        } catch {
          return Response.json({ error: "Invalid request body" }, { status: 400 });
        }
        if (!command) return Response.json({ error: "Command is required" }, { status: 400 });
        try {
          const result = streamAyraReply(request, command);
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
